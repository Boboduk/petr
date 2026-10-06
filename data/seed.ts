import type { Database, Driver, Order, OrderStatus, StatusEvent, User, WaterType } from '@/types';
import { getCity, DEFAULT_CITY_ID } from './cities';
import { seedDrivers } from './drivers';
import { seedUsers } from './users';
import { seededRandom } from '@/lib/id';
import { buildRoute, etaMinutes, geocode, offsetPoint, roadDistanceKm } from '@/lib/geo';
import { recommendedPrice, roundPrice } from '@/lib/pricing';

export const DB_VERSION = 3;
export const DEFAULT_COMMISSION = 0.1;

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function timeline(createdAt: number, final: OrderStatus, rnd: () => number): StatusEvent[] {
  const steps: OrderStatus[] = ['new', 'searching', 'offers', 'driver_selected', 'en_route', 'arrived', 'delivering', 'completed'];
  const offsets = [0, 0.1, 1.2, 3, 4, 18 + rnd() * 15, 22 + rnd() * 15, 35 + rnd() * 20];
  const events: StatusEvent[] = [];
  for (let i = 0; i < steps.length; i++) {
    if (final === 'cancelled' && i > 2) break;
    events.push({ status: steps[i], at: createdAt + offsets[i] * MIN, by: 'system' });
    if (steps[i] === final) break;
  }
  if (final === 'cancelled') events.push({ status: 'cancelled', at: createdAt + 6 * MIN, by: 'client' });
  return events;
}

/**
 * Создаёт полный набор демо-данных для города:
 * пользователи, водители, ~150 исторических заказов за неделю и несколько активных доставок.
 */
export function createSeed(cityId: string = DEFAULT_CITY_ID, now: number = Date.now()): Database {
  const city = getCity(cityId);
  const rnd = seededRandom(20261006);
  const users = seedUsers(now);
  const drivers: Driver[] = seedDrivers(now).map((d) => ({ ...d, location: offsetPoint(city.center, d.homeOffset) }));
  const botClients = users.filter((u) => u.isBot);
  const demoClient = users.find((u) => u.id === 'usr_client_demo') as User;
  const activeDrivers = drivers.filter((d) => d.verification === 'verified');

  const orders: Order[] = [];
  let seq = 1000;

  const waterTypes: WaterType[] = ['drinking', 'drinking', 'drinking', 'household', 'technical'];
  const volumes = [1, 2, 3, 3, 5, 5, 5, 8, 10];

  const addHistoric = (createdAt: number, clientId: string, input: Partial<Order> = {}, final?: OrderStatus) => {
    const { address: rawAddress, ...opts } = input;
    const waterType = opts.waterType ?? waterTypes[Math.floor(rnd() * waterTypes.length)];
    let volume = opts.volume ?? volumes[Math.floor(rnd() * volumes.length)];
    const eligible = activeDrivers.filter((d) => d.vehicle.tankVolume >= volume);
    const driver = opts.driverId ? drivers.find((d) => d.id === opts.driverId)! : eligible[Math.floor(rnd() * eligible.length)];
    volume = Math.min(volume, driver.vehicle.tankVolume);
    const street = city.streets[Math.floor(rnd() * city.streets.length)];
    const { address, location } = geocode(rawAddress ?? `${street}, ${1 + Math.floor(rnd() * 90)}`, city);
    const clientPrice = opts.clientPrice ?? recommendedPrice(volume, waterType);
    const status: OrderStatus = final ?? (rnd() < 0.13 ? 'cancelled' : 'completed');
    const finalPrice = opts.finalPrice ?? roundPrice(clientPrice * (0.95 + rnd() * 0.15));
    const tl = timeline(createdAt, status, rnd);
    const last = tl[tl.length - 1].at;
    const done = status === 'completed';
    seq += 1;
    orders.push({
      id: `ord_${seq}`,
      number: seq,
      clientId,
      cityId: city.id,
      address,
      location,
      volume,
      waterType,
      scheduleType: 'now',
      clientPrice,
      comment: '',
      status,
      createdAt,
      updatedAt: last,
      offers: done
        ? [{ id: `of_${seq}`, driverId: driver.id, price: finalPrice, etaMin: 8 + Math.floor(rnd() * 20), distanceKm: 1 + rnd() * 6, kind: finalPrice === clientPrice ? 'accept' : 'counter', createdAt: createdAt + MIN }]
        : [],
      driverId: done ? driver.id : undefined,
      finalPrice: done ? finalPrice : undefined,
      commissionRate: DEFAULT_COMMISSION,
      completedAt: done ? last : undefined,
      cancelledAt: status === 'cancelled' ? last : undefined,
      cancelReason: status === 'cancelled' ? 'Планы изменились' : undefined,
      cancelledBy: status === 'cancelled' ? 'client' : undefined,
      timeline: tl,
      messages: [],
      rating: done ? (rnd() < 0.8 ? 5 : 4) : undefined,
      ...opts,
    });
  };

  // --- История за 7 дней (для статистики и графика админки) ---
  const today = startOfDay(now);
  const perDay = [18, 22, 19, 25, 21, 24, 20];
  for (let d = 7; d >= 1; d--) {
    const dayStart = today - d * DAY;
    const count = perDay[7 - d];
    for (let i = 0; i < count; i++) {
      const at = dayStart + 7 * HOUR + rnd() * 14 * HOUR;
      addHistoric(at, botClients[Math.floor(rnd() * botClients.length)].id);
    }
  }
  // --- Сегодня: заказы с начала дня до текущего момента ---
  const sinceMidnight = now - today;
  const todayCount = Math.min(22, 4 + Math.floor(sinceMidnight / HOUR));
  for (let i = 0; i < todayCount; i++) {
    const at = today + (sinceMidnight - 20 * MIN) * ((i + rnd() * 0.5) / todayCount);
    if (at > now - 70 * MIN) continue;
    addHistoric(Math.max(today, at), botClients[Math.floor(rnd() * botClients.length)].id, {}, rnd() < 0.08 ? 'cancelled' : 'completed');
  }

  // --- История демо-клиента ---
  addHistoric(
    now - 3 * DAY - 2 * HOUR,
    demoClient.id,
    { address: 'ул. Ленина, 15', volume: 5, waterType: 'drinking', clientPrice: 2500, finalPrice: 2700, driverId: 'drv_alexey', review: 'Отличный водитель, всё быстро!' },
    'completed',
  );
  addHistoric(now - 10 * DAY, demoClient.id, { address: 'ул. Ленина, 15', volume: 3, waterType: 'drinking', clientPrice: 1900, finalPrice: 1900, driverId: 'drv_mikhail' }, 'completed');
  addHistoric(now - 17 * DAY, demoClient.id, { address: 'ул. Кирова, 28', volume: 8, waterType: 'household', clientPrice: 3000, finalPrice: 3200, driverId: 'drv_pavel' }, 'completed');
  addHistoric(now - 21 * DAY, demoClient.id, { address: 'ул. Ленина, 15', volume: 5, waterType: 'technical', clientPrice: 2000 }, 'cancelled');

  // --- Активные доставки прямо сейчас (оживают в симуляторе) ---
  const addActive = (driverId: string, clientIdx: number, status: OrderStatus, address: string, volume: number, travelSeconds: number, startedAgo: number) => {
    const driver = drivers.find((d) => d.id === driverId)!;
    const { address: full, location } = geocode(address, city);
    const price = recommendedPrice(volume, 'drinking');
    const createdAt = now - 4 * MIN - startedAgo * 1000;
    seq += 1;
    const tl = timeline(createdAt, status, rnd).map((e) => ({ ...e, at: Math.min(e.at, now - 1000) }));
    const order: Order = {
      id: `ord_${seq}`,
      number: seq,
      clientId: botClients[clientIdx].id,
      cityId: city.id,
      address: full,
      location,
      volume,
      waterType: 'drinking',
      scheduleType: 'now',
      clientPrice: price,
      comment: '',
      status,
      createdAt,
      updatedAt: now,
      offers: [{ id: `of_${seq}`, driverId, price, etaMin: etaMinutes(driver.location, location), distanceKm: roadDistanceKm(driver.location, location), kind: 'accept', createdAt: createdAt + MIN }],
      driverId,
      finalPrice: price,
      commissionRate: DEFAULT_COMMISSION,
      etaMin: etaMinutes(driver.location, location),
      route: buildRoute(driver.location, location, seq),
      enRouteAt: now - startedAgo * 1000,
      travelSeconds,
      arrivedAt: status === 'delivering' ? now - 8000 : undefined,
      deliveringAt: status === 'delivering' ? now - 4000 : undefined,
      timeline: tl,
      messages: [],
    };
    orders.push(order);
  };
  addActive('drv_pavel', 0, 'en_route', 'ул. Ойунского, 21', 10, 120, 20);
  addActive('drv_ivan', 1, 'delivering', 'ул. Петра Алексеева, 64', 8, 60, 70);

  return {
    version: DB_VERSION,
    seededAt: now,
    settings: { commissionRate: DEFAULT_COMMISSION, cityId: city.id, demoSpeed: 1, ambientActivity: true },
    users,
    drivers,
    orders: orders.sort((a, b) => b.createdAt - a.createdAt),
    plans: [
      {
        id: 'plan_demo_1',
        clientId: demoClient.id,
        address: `г. ${city.name}, ул. Ленина, 15`,
        location: geocode('ул. Ленина, 15', city).location,
        volume: 5,
        waterType: 'drinking',
        config: { frequency: 'weekly', weekday: 6, time: '10:00' },
        price: 2500,
        active: false,
        createdAt: now - 30 * DAY,
      },
    ],
    notifications: [
      {
        id: 'ntf_welcome',
        userId: demoClient.id,
        kind: 'system',
        title: 'Добро пожаловать в Водовоз',
        body: 'Укажите адрес и объём — ближайшие водовозы предложат цену за пару минут.',
        createdAt: now - 2 * HOUR,
        read: false,
      },
      {
        id: 'ntf_driver_welcome',
        userId: 'usr_driver_demo',
        kind: 'system',
        title: 'Профиль проверен',
        body: 'Документы подтверждены. Включите «Я на линии», чтобы получать заявки.',
        createdAt: now - 5 * HOUR,
        read: false,
      },
    ],
    orderSeq: seq,
    meta: { lastAmbientAt: now },
  };
}
