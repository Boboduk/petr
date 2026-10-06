import type {
  AppNotification,
  ChatMessage,
  Database,
  Driver,
  LatLng,
  NotificationKind,
  Offer,
  Order,
  OrderStatus,
  RegularConfig,
  Role,
  ScheduleType,
  Settings,
  User,
  Vehicle,
  WaterType,
} from '@/types';
import { uid } from '@/lib/id';
import { buildRoute, etaMinutes, roadDistanceKm } from '@/lib/geo';
import { formatMoney, formatVolume, pluralize } from '@/lib/format';
import { orderEconomics } from '@/lib/pricing';
import { OPEN_FOR_OFFERS, STATUS_FLOW } from '@/lib/status';
import { mutate, resetDatabase } from './store';
import { findDriver, findOrder, findUser, isDriverBusy, isDriverLive, nearbyDrivers } from './selectors';

/* =====================================================================
 * Доменные операции. Каждая — атомарная транзакция над базой (mutate).
 * Для перехода на сервер эти функции превращаются в вызовы API/RPC.
 * ===================================================================== */

export class DomainError extends Error {}

function notify(db: Database, userId: string | undefined, kind: NotificationKind, title: string, body: string, orderId?: string) {
  if (!userId) return;
  const n: AppNotification = { id: uid('ntf'), userId, kind, title, body, orderId, createdAt: Date.now(), read: false };
  db.notifications.unshift(n);
  if (db.notifications.length > 300) db.notifications.length = 300;
}

function getOrder(db: Database, id: string): Order {
  const o = findOrder(db, id);
  if (!o) throw new DomainError('Заказ не найден');
  return o;
}

/** Время поездки в демо: 12 минут реального ETA ≈ 30 секунд показа */
function demoTravelSeconds(etaMin: number) {
  return Math.round(Math.min(60, Math.max(25, etaMin * 2.5)));
}

/** Единая точка смены статуса: таймстемпы, история, уведомления и побочные эффекты */
export function applyStatus(db: Database, order: Order, status: OrderStatus, by: Role | 'system' = 'system') {
  if (order.status === status) return;
  const now = Date.now();
  order.status = status;
  order.updatedAt = now;
  order.timeline.push({ status, at: now, by });
  const driver = findDriver(db, order.driverId);
  const client = findUser(db, order.clientId);

  switch (status) {
    case 'en_route': {
      order.enRouteAt = now;
      if (driver) {
        const from = driver.location;
        order.route = buildRoute(from, order.location, order.number);
        order.etaMin = etaMinutes(from, order.location);
        order.travelSeconds = demoTravelSeconds(order.etaMin);
      }
      notify(db, order.clientId, 'en_route', 'Водовоз едет к вам', `${driver?.name ?? 'Водитель'} выехал. Прибытие ≈ через ${order.etaMin ?? 10} мин.`, order.id);
      break;
    }
    case 'arrived':
      order.arrivedAt = now;
      notify(db, order.clientId, 'arrived', 'Водовоз прибыл', `${driver?.name ?? 'Водитель'} на месте. Встречайте!`, order.id);
      break;
    case 'delivering':
      order.deliveringAt = now;
      if (!order.arrivedAt) order.arrivedAt = now;
      break;
    case 'completed': {
      order.completedAt = now;
      if (driver) {
        driver.location = order.location;
        driver.ordersCount += 1;
        const eco = orderEconomics(order.finalPrice ?? order.clientPrice, order.commissionRate);
        notify(db, driver.userId, 'completed', 'Доставка завершена', `Заказ №${order.number}: ваш доход ${formatMoney(eco.driverIncome)}`, order.id);
      }
      notify(db, order.clientId, 'completed', 'Заказ завершён', `Доставлено ${formatVolume(order.volume)}. Оцените водителя!`, order.id);
      if (client?.isBot && driver) {
        const r = Math.random() < 0.8 ? 5 : 4;
        rateInternal(db, order, r, '');
      }
      break;
    }
    case 'cancelled':
      order.cancelledAt = now;
      order.cancelledBy = by;
      if (by !== 'client') notify(db, order.clientId, 'cancelled', 'Заказ отменён', order.cancelReason ?? `Заказ №${order.number} отменён`, order.id);
      if (by !== 'driver' && driver) notify(db, driver.userId, 'cancelled', 'Заказ отменён', `Заказ №${order.number}: ${order.cancelReason ?? 'отменён'}`, order.id);
      break;
  }
}

/* ---------------------------- Клиент ---------------------------- */

export interface NewOrderInput {
  address: string;
  location: LatLng;
  volume: number;
  waterType: WaterType;
  scheduleType: ScheduleType;
  scheduledAt?: number;
  regular?: RegularConfig;
  clientPrice: number;
  comment: string;
}

export function createOrderTx(db: Database, clientId: string, input: NewOrderInput): Order {
  const now = Date.now();
  db.orderSeq += 1;
  const order: Order = {
    id: uid('ord'),
    number: db.orderSeq,
    clientId,
    cityId: db.settings.cityId,
    address: input.address,
    location: input.location,
    volume: input.volume,
    waterType: input.waterType,
    scheduleType: input.scheduleType,
    scheduledAt: input.scheduledAt,
    regular: input.regular,
    clientPrice: input.clientPrice,
    comment: input.comment.trim(),
    status: 'new',
    createdAt: now,
    updatedAt: now,
    offers: [],
    commissionRate: db.settings.commissionRate,
    timeline: [{ status: 'new', at: now, by: 'client' }],
    messages: [],
  };
  if (input.scheduleType === 'regular' && input.regular) {
    const planId = uid('plan');
    db.plans.unshift({
      id: planId,
      clientId,
      address: input.address,
      location: input.location,
      volume: input.volume,
      waterType: input.waterType,
      config: input.regular,
      price: input.clientPrice,
      active: true,
      createdAt: now,
    });
    order.planId = planId;
  }
  db.orders.unshift(order);
  // живых водителей на линии оповещаем о новой заявке
  for (const d of db.drivers) {
    if (d.userId && d.online && !d.blocked && d.vehicle.tankVolume >= order.volume && isDriverLive(d, now)) {
      notify(db, d.userId, 'new_order', 'Новая заявка рядом', `${formatVolume(order.volume)} · ${formatMoney(order.clientPrice)} · ${order.address.replace(/^г\.\s*[^,]+,\s*/, '')}`, order.id);
    }
  }
  return order;
}

export function createOrder(clientId: string, input: NewOrderInput): Order {
  return mutate((db) => {
    const client = findUser(db, clientId);
    if (client?.blocked) throw new DomainError('Аккаунт заблокирован');
    return createOrderTx(db, clientId, input);
  });
}

export function selectOffer(orderId: string, offerId: string) {
  return mutate((db) => {
    const order = getOrder(db, orderId);
    if (!OPEN_FOR_OFFERS.includes(order.status)) throw new DomainError('Водитель уже выбран');
    const offer = order.offers.find((o) => o.id === offerId);
    if (!offer) throw new DomainError('Предложение не найдено');
    if (isDriverBusy(db, offer.driverId)) throw new DomainError('Этот водовоз уже занят. Выберите другое предложение');
    selectOfferTx(db, order, offer);
  });
}

export function selectOfferTx(db: Database, order: Order, offer: Offer) {
  const driver = findDriver(db, offer.driverId);
  order.driverId = offer.driverId;
  order.finalPrice = offer.price;
  order.etaMin = offer.etaMin;
  order.commissionRate = db.settings.commissionRate;
  applyStatus(db, order, 'driver_selected', 'client');
  if (driver) {
    notify(db, driver.userId, 'selected', 'Клиент выбрал вас', `Заказ №${order.number} · ${formatVolume(order.volume)} · ${formatMoney(offer.price)}. Можно выезжать!`, order.id);
    notify(db, order.clientId, 'selected', 'Водитель назначен', `${driver.name} · ${driver.vehicle.brand} · ${formatMoney(offer.price)}`, order.id);
  }
}

export function cancelOrder(orderId: string, by: Role | 'system', reason: string) {
  mutate((db) => {
    const order = getOrder(db, orderId);
    if (order.status === 'completed' || order.status === 'cancelled') throw new DomainError('Заказ уже закрыт');
    order.cancelReason = reason;
    applyStatus(db, order, 'cancelled', by);
  });
}

function rateInternal(db: Database, order: Order, rating: number, review: string) {
  order.rating = rating;
  order.review = review.trim() || undefined;
  const driver = findDriver(db, order.driverId);
  if (!driver) return;
  driver.rating = Math.round(((driver.rating * driver.ratingCount + rating) / (driver.ratingCount + 1)) * 100) / 100;
  driver.ratingCount += 1;
  if (order.review) {
    const author = findUser(db, order.clientId)?.name ?? 'Клиент';
    driver.reviews.unshift({ id: uid('rv'), author, rating, text: order.review, createdAt: Date.now(), orderId: order.id });
  }
}

export function rateOrder(orderId: string, rating: number, review: string) {
  mutate((db) => {
    const order = getOrder(db, orderId);
    if (order.status !== 'completed') throw new DomainError('Оценить можно только завершённый заказ');
    if (order.rating) throw new DomainError('Заказ уже оценён');
    rateInternal(db, order, rating, review);
    const driver = findDriver(db, order.driverId);
    notify(db, driver?.userId, 'system', `Новая оценка: ${'★'.repeat(rating)}`, review ? `«${review}»` : `Заказ №${order.number}`, order.id);
  });
}

const DRIVER_REPLIES = ['Принял, скоро буду!', 'Хорошо, учту 👍', 'Понял. Шланг 20 м есть.', 'Буду через пару минут.'];
const CLIENT_REPLIES = ['Спасибо, жду!', 'Хорошо, ворота открыты.', 'Отлично 👍'];

export function sendMessage(orderId: string, from: 'client' | 'driver', text: string) {
  mutate((db) => {
    const order = getOrder(db, orderId);
    const now = Date.now();
    const msg: ChatMessage = { id: uid('msg'), from, text: text.trim(), createdAt: now };
    order.messages.push(msg);
    const driver = findDriver(db, order.driverId);
    const client = findUser(db, order.clientId);
    // если собеседник — симулируемый участник, он отвечает автоматически (сообщение «из будущего» показывается позже)
    if (from === 'client' && !isDriverLive(driver, now)) {
      order.messages.push({ id: uid('msg'), from: 'driver', text: DRIVER_REPLIES[order.messages.length % DRIVER_REPLIES.length], createdAt: now + 2200 });
    } else if (from === 'driver' && client?.isBot) {
      order.messages.push({ id: uid('msg'), from: 'client', text: CLIENT_REPLIES[order.messages.length % CLIENT_REPLIES.length], createdAt: now + 2200 });
    }
    if (from === 'client') notify(db, driver?.userId, 'message', `Сообщение от клиента`, msg.text, order.id);
    else notify(db, order.clientId, 'message', `Сообщение от ${driver?.name ?? 'водителя'}`, msg.text, order.id);
  });
}

export function markNotificationsRead(userId: string) {
  mutate((db) => {
    db.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
  });
}

export function togglePlan(planId: string) {
  mutate((db) => {
    const p = db.plans.find((x) => x.id === planId);
    if (p) p.active = !p.active;
  });
}

export function deletePlan(planId: string) {
  mutate((db) => {
    db.plans = db.plans.filter((p) => p.id !== planId);
  });
}

export function updateUser(userId: string, patch: Partial<Pick<User, 'name' | 'phone' | 'email' | 'blocked'>>) {
  mutate((db) => {
    const u = findUser(db, userId);
    if (!u) throw new DomainError('Пользователь не найден');
    Object.assign(u, patch);
    if (u.driverId) {
      const d = findDriver(db, u.driverId);
      if (d) {
        if (patch.name) d.name = patch.name;
        if (patch.phone) d.phone = patch.phone;
      }
    }
  });
}

/* ---------------------------- Водитель ---------------------------- */

export function setDriverOnline(driverId: string, online: boolean) {
  mutate((db) => {
    const d = findDriver(db, driverId);
    if (!d) throw new DomainError('Водитель не найден');
    if (d.blocked) throw new DomainError('Аккаунт заблокирован администратором');
    d.online = online;
    d.lastSeenAt = Date.now();
  });
}

export function driverHeartbeat(driverId: string) {
  mutate((db) => {
    const d = findDriver(db, driverId);
    if (d) d.lastSeenAt = Date.now();
  });
}

export function driverGone(driverId: string) {
  mutate((db) => {
    const d = findDriver(db, driverId);
    if (d) d.lastSeenAt = undefined;
  });
}

export function makeOffer(orderId: string, driverId: string, price: number, etaMin?: number) {
  return mutate((db) => {
    const order = getOrder(db, orderId);
    const driver = findDriver(db, driverId);
    if (!driver) throw new DomainError('Водитель не найден');
    if (driver.blocked) throw new DomainError('Аккаунт заблокирован');
    if (!driver.online) throw new DomainError('Включите «Я на линии», чтобы отправлять предложения');
    if (!OPEN_FOR_OFFERS.includes(order.status)) throw new DomainError('Заказ уже недоступен');
    if (isDriverBusy(db, driverId)) throw new DomainError('Сначала завершите текущий заказ');
    return addOfferTx(db, order, driver, price, etaMin);
  });
}

export function addOfferTx(db: Database, order: Order, driver: Driver, price: number, etaMin?: number): Offer {
  const existing = order.offers.find((o) => o.driverId === driver.id);
  const offer: Offer = {
    id: existing?.id ?? uid('of'),
    driverId: driver.id,
    price: Math.round(price),
    etaMin: Math.round(etaMin ?? etaMinutes(driver.location, order.location)),
    distanceKm: Math.round(roadDistanceKm(driver.location, order.location) * 10) / 10,
    kind: Math.round(price) === order.clientPrice ? 'accept' : 'counter',
    createdAt: Date.now(),
  };
  order.offers = order.offers.filter((o) => o.driverId !== driver.id).concat(offer);
  if (order.status !== 'offers') applyStatus(db, order, 'offers');
  notify(
    db,
    order.clientId,
    'offer',
    offer.kind === 'accept' ? `${driver.name} принял вашу цену` : `${driver.name} предложил цену ${formatMoney(offer.price)}`,
    `${driver.vehicle.brand} · ${formatVolume(driver.vehicle.tankVolume)} · ≈ ${offer.etaMin} мин`,
    order.id,
  );
  return offer;
}

export function withdrawOffer(orderId: string, driverId: string) {
  mutate((db) => {
    const order = getOrder(db, orderId);
    order.offers = order.offers.filter((o) => o.driverId !== driverId);
  });
}

/** Водитель двигает заказ по статусам: выехал → прибыл → слив воды → завершён */
export function driverAdvance(orderId: string, driverId: string) {
  mutate((db) => {
    const order = getOrder(db, orderId);
    if (order.driverId !== driverId) throw new DomainError('Это не ваш заказ');
    const flow: Partial<Record<OrderStatus, OrderStatus>> = {
      driver_selected: 'en_route',
      en_route: 'arrived',
      arrived: 'delivering',
      delivering: 'completed',
    };
    const next = flow[order.status];
    if (!next) throw new DomainError('Статус нельзя изменить');
    applyStatus(db, order, next, 'driver');
  });
}

/** Водитель отказывается от назначенного заказа — заказ возвращается в поиск */
export function driverDecline(orderId: string, driverId: string) {
  mutate((db) => {
    const order = getOrder(db, orderId);
    if (order.driverId !== driverId) throw new DomainError('Это не ваш заказ');
    if (order.status !== 'driver_selected' && order.status !== 'en_route') throw new DomainError('На этом этапе отказаться нельзя');
    const driver = findDriver(db, driverId);
    order.driverId = undefined;
    order.finalPrice = undefined;
    order.route = undefined;
    order.enRouteAt = undefined;
    order.offers = order.offers.filter((o) => o.driverId !== driverId);
    // перезапускаем окно поиска, чтобы демо-водители снова прислали предложения
    order.createdAt = Date.now();
    applyStatus(db, order, order.offers.length ? 'offers' : 'searching', 'driver');
    notify(db, order.clientId, 'cancelled', 'Водитель отказался от заказа', `${driver?.name ?? 'Водитель'} не сможет приехать. Выберите другое предложение — поиск продолжается.`, order.id);
  });
}

export interface DriverProfilePatch {
  name?: string;
  phone?: string;
  photo?: string;
  experienceYears?: number;
  vehicle?: Partial<Vehicle>;
}

export function updateDriver(driverId: string, patch: DriverProfilePatch & { blocked?: boolean; verification?: Driver['verification']; rating?: number }) {
  mutate((db) => {
    const d = findDriver(db, driverId);
    if (!d) throw new DomainError('Водитель не найден');
    const { vehicle, ...rest } = patch;
    Object.assign(d, rest);
    if (vehicle) d.vehicle = { ...d.vehicle, ...vehicle };
    if (patch.verification) d.documents = d.documents.map((doc) => ({ ...doc, status: patch.verification! }));
    if (patch.blocked) d.online = false;
    const u = findUser(db, d.userId);
    if (u) {
      if (patch.name) u.name = patch.name;
      if (patch.phone) u.phone = patch.phone;
      if (patch.blocked !== undefined) u.blocked = patch.blocked;
    }
    if (patch.verification === 'verified') notify(db, d.userId, 'system', 'Профиль проверен', 'Документы подтверждены администратором.');
    if (patch.blocked) notify(db, d.userId, 'system', 'Аккаунт заблокирован', 'Обратитесь в поддержку сервиса.');
  });
}

/* ------------------------- Администратор ------------------------- */

/** Ручная смена статуса администратором (с корректными побочными эффектами) */
export function adminSetStatus(orderId: string, status: OrderStatus) {
  mutate((db) => {
    const order = getOrder(db, orderId);
    if (status === 'cancelled') {
      order.cancelReason = 'Отменён администратором';
      applyStatus(db, order, 'cancelled', 'admin');
      return;
    }
    const needsDriver = STATUS_FLOW.indexOf(status) >= STATUS_FLOW.indexOf('driver_selected');
    if (needsDriver && !order.driverId) {
      const best = [...order.offers].sort((a, b) => a.price - b.price)[0];
      const fallback = db.drivers.find((d) => d.online && !d.blocked && d.vehicle.tankVolume >= order.volume && !isDriverBusy(db, d.id));
      const offer = best ?? (fallback ? addOfferTx(db, order, fallback, order.clientPrice) : undefined);
      if (!offer) throw new DomainError('Нет свободного водителя для назначения');
      selectOfferTx(db, order, offer);
    }
    // проходим промежуточные статусы, чтобы заполнить таймстемпы и маршрут
    const from = STATUS_FLOW.indexOf(order.status);
    const to = STATUS_FLOW.indexOf(status);
    if (from >= 0 && to > from) {
      for (let i = from + 1; i <= to; i++) applyStatus(db, order, STATUS_FLOW[i], 'admin');
    } else {
      applyStatus(db, order, status, 'admin');
    }
  });
}

export function deleteOrder(orderId: string) {
  mutate((db) => {
    db.orders = db.orders.filter((o) => o.id !== orderId);
    db.notifications = db.notifications.filter((n) => n.orderId !== orderId);
  });
}

export function updateSettings(patch: Partial<Settings>) {
  mutate((db) => {
    Object.assign(db.settings, patch);
  });
}

export function switchCity(cityId: string) {
  resetDatabase(cityId);
}

/* --------------------------- Демо-режим --------------------------- */

/** «Перемотка» сценария для презентации: мгновенно переводит заказ на следующий этап */
export function demoAdvance(orderId: string) {
  mutate((db) => {
    const order = getOrder(db, orderId);
    const now = Date.now();
    switch (order.status) {
      case 'new':
      case 'searching':
      case 'offers': {
        const candidates = nearbyDrivers(db, order.location, now, 8).filter(
          (n) => !n.busy && n.driver.vehicle.tankVolume >= order.volume && !order.offers.some((o) => o.driverId === n.driver.id) && !isDriverLive(n.driver, now),
        );
        for (const c of candidates.slice(0, Math.max(0, 3 - order.offers.length))) {
          addOfferTx(db, order, c.driver, botPrice(order.clientPrice, c.driver.priceFactor));
        }
        break;
      }
      case 'driver_selected':
        applyStatus(db, order, 'en_route', 'system');
        break;
      case 'en_route':
        applyStatus(db, order, 'arrived', 'system');
        break;
      case 'arrived':
        applyStatus(db, order, 'delivering', 'system');
        break;
      case 'delivering':
        applyStatus(db, order, 'completed', 'system');
        break;
    }
  });
}

export function botPrice(clientPrice: number, factor: number) {
  return Math.max(500, Math.round((clientPrice * factor) / 100) * 100);
}

export function offersSummary(n: number) {
  return `Получено ${n} ${pluralize(n, ['предложение', 'предложения', 'предложений'])}`;
}
