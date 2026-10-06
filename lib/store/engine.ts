import type { Database, Driver, Order, OrderStatus } from '@/types';
import { formatVolume, pluralize } from '@/lib/format';
import { reverseGeocode } from '@/lib/geo';
import { recommendedPrice } from '@/lib/pricing';
import { uid } from '@/lib/id';
import { OPEN_FOR_OFFERS } from '@/lib/status';
import { mutate, readDB } from './store';
import { addOfferTx, applyStatus, botPrice, createOrderTx, selectOfferTx } from './actions';
import { currentCity, deliveryMs, driverFeed, findDriver, findUser, isDriverBusy, isDriverLive, nearbyDrivers, tripProgress } from './selectors';

/* =====================================================================
 * Симулятор демо-режима.
 * Вместо реальных водителей, GPS и клиентов «оживляет» сценарий:
 *  - тестовые водители присылают предложения цены;
 *  - едут по маршруту, прибывают, сливают воду, завершают заказ;
 *  - тестовые клиенты создают фоновые заявки и выбирают водителя.
 * Заказами водителя, у которого открыта вкладка (живой «пульс»), управляет человек.
 * В продакшене этот модуль удаляется — события приходят от реальных участников.
 * ===================================================================== */

const SEC = 1000;

function statusAt(order: Order, status: OrderStatus): number {
  for (let i = order.timeline.length - 1; i >= 0; i--) if (order.timeline[i].status === status) return order.timeline[i].at;
  return order.updatedAt;
}

function botCandidates(db: Database, order: Order, now: number, excludeDemoAccounts: boolean): Driver[] {
  return nearbyDrivers(db, order.location, now, 12)
    .filter((n) => !n.busy && n.driver.vehicle.tankVolume >= order.volume && n.distanceKm <= 15)
    .filter((n) => !isDriverLive(n.driver, now) && !order.offers.some((o) => o.driverId === n.driver.id))
    .filter((n) => !(excludeDemoAccounts && n.driver.userId))
    .map((n) => n.driver);
}

/**
 * Один шаг симуляции. В режиме dry ничего не меняет и лишь сообщает,
 * есть ли работа, — чтобы не перезаписывать хранилище каждую секунду.
 */
function step(db: Database, now: number, dry: boolean): boolean {
  const speed = Math.max(0.25, db.settings.demoSpeed);
  const s = (sec: number) => (sec * SEC) / speed;
  let changed = false;
  const act = (fn: () => void) => {
    changed = true;
    if (!dry) fn();
  };

  for (const order of db.orders) {
    if (order.status === 'completed' || order.status === 'cancelled') continue;
    if (dry && changed) return true;
    const client = findUser(db, order.clientId);
    const isBotClient = !!client?.isBot;
    const driver = findDriver(db, order.driverId);
    const live = isDriverLive(driver, now);
    const age = now - order.createdAt;

    // 1. Новый → поиск
    if (order.status === 'new' && age > s(0.4)) {
      act(() => {
        applyStatus(db, order, 'searching');
        if (!isBotClient) {
          const n = nearbyDrivers(db, order.location, now, 12).filter((x) => !x.busy && x.driver.vehicle.tankVolume >= order.volume).length;
          if (n > 0) {
            db.notifications.unshift({
              id: uid('ntf'),
              userId: order.clientId,
              kind: 'search',
              title: `Найдено ${n} ${pluralize(n, ['водовоз', 'водовоза', 'водовозов'])}`,
              body: `Рядом с вами водители с цистернами от ${formatVolume(order.volume)}. Ждём предложения цены.`,
              orderId: order.id,
              createdAt: now,
              read: false,
            });
          }
        }
      });
      continue;
    }

    if (OPEN_FOR_OFFERS.includes(order.status)) {
      // убираем предложения водителей, которые стали недоступны
      const stale = order.offers.filter((o) => {
        const d = findDriver(db, o.driverId);
        return !d || d.blocked || !d.online || isDriverBusy(db, o.driverId);
      });
      if (stale.length) act(() => (order.offers = order.offers.filter((o) => !stale.includes(o))));

      // 2. Тестовые водители присылают предложения
      const botOffers = order.offers.filter((o) => !isDriverLive(findDriver(db, o.driverId), now)).length;
      const start = isBotClient ? 18 : 2.5;
      const maxBots = isBotClient ? 2 : 3;
      if (botOffers < maxBots && age > s(start + botOffers * 1.7)) {
        const cand = botCandidates(db, order, now, isBotClient)[0];
        if (cand) act(() => addOfferTx(db, order, cand, botPrice(order.clientPrice, cand.priceFactor)));
      }

      // 3. Тестовый клиент сам выбирает водителя
      if (isBotClient && order.status === 'offers') {
        const liveOffer = order.offers.find((o) => isDriverLive(findDriver(db, o.driverId), now));
        if (liveOffer && now - liveOffer.createdAt > s(4)) {
          act(() => selectOfferTx(db, order, liveOffer));
          continue;
        }
        if (!liveOffer && age > s(30) && order.offers.length) {
          const best = [...order.offers].sort((a, b) => a.price - b.price)[0];
          act(() => selectOfferTx(db, order, best));
          continue;
        }
      }
      if (isBotClient && age > s(150) && !order.offers.length) {
        act(() => {
          order.cancelReason = 'Нет свободных водовозов поблизости';
          applyStatus(db, order, 'cancelled', 'system');
        });
      }
      continue;
    }

    if (live) continue; // заказом управляет живой водитель

    // 4. Водитель выбран → выехал (для запланированных — в назначенное время)
    if (order.status === 'driver_selected') {
      const due = order.scheduleType === 'now' || !order.scheduledAt || order.scheduledAt <= now;
      if (due && now - statusAt(order, 'driver_selected') > s(2.5)) act(() => applyStatus(db, order, 'en_route'));
      continue;
    }
    // 5. Едет → прибыл
    if (order.status === 'en_route' && tripProgress(order, now, speed) >= 1) {
      act(() => applyStatus(db, order, 'arrived'));
      continue;
    }
    // 6. Прибыл → слив воды
    if (order.status === 'arrived' && now - (order.arrivedAt ?? now) > s(4)) {
      act(() => applyStatus(db, order, 'delivering'));
      continue;
    }
    // 7. Слив → завершён
    if (order.status === 'delivering' && now - (order.deliveringAt ?? now) > deliveryMs(order, speed)) {
      act(() => applyStatus(db, order, 'completed'));
    }
  }

  // 8. Фоновые заявки тестовых клиентов
  if (db.settings.ambientActivity) {
    const last = db.meta.lastAmbientAt ?? 0;
    const liveWaiting = db.drivers.find(
      (d) => d.online && !d.blocked && isDriverLive(d, now) && !isDriverBusy(db, d.id) && driverFeed(db, d).length === 0,
    );
    const openBotOrders = db.orders.filter((o) => OPEN_FOR_OFFERS.includes(o.status) && findUser(db, o.clientId)?.isBot).length;
    if (liveWaiting && now - last > 6 * SEC) {
      act(() => spawnAmbientOrder(db, now, liveWaiting));
    } else if (!liveWaiting && openBotOrders < 1 && now - last > s(45)) {
      act(() => spawnAmbientOrder(db, now));
    }
  }

  return changed;
}

function spawnAmbientOrder(db: Database, now: number, nearDriver?: Driver) {
  db.meta.lastAmbientAt = now;
  const city = currentCity(db);
  const bots = db.users.filter((u) => u.isBot && !u.blocked);
  if (!bots.length) return;
  const client = bots[Math.floor(Math.random() * bots.length)];
  const base = nearDriver?.location ?? city.center;
  const spread = nearDriver ? 0.025 : 0.05;
  const location: [number, number] = [base[0] + (Math.random() - 0.5) * spread, base[1] + (Math.random() - 0.5) * spread * 1.8];
  const volumes = nearDriver ? [3, 5, 5, 8].filter((v) => v <= nearDriver.vehicle.tankVolume) : [1, 2, 3, 3, 4];
  const volume = volumes[Math.floor(Math.random() * volumes.length)] ?? 2;
  const types = ['drinking', 'drinking', 'household', 'technical'] as const;
  const waterType = types[Math.floor(Math.random() * types.length)];
  const comments = ['', 'Позвоните за 10 минут', 'Нужен длинный шланг, подъезд к дому возможен', 'Ёмкость во дворе, ворота открыты', ''];
  createOrderTx(db, client.id, {
    address: reverseGeocode(location, city),
    location,
    volume,
    waterType,
    scheduleType: 'now',
    clientPrice: Math.round((recommendedPrice(volume, waterType) * (0.9 + Math.random() * 0.2)) / 100) * 100,
    comment: comments[Math.floor(Math.random() * comments.length)],
  });
}

/* ------------------------- Лидер вкладок -------------------------
 * Симуляцию выполняет только одна вкладка браузера, остальные лишь читают.
 */
const LEADER_KEY = 'vodovoz:engine-leader';
const TAB_ID = typeof window !== 'undefined' ? uid('tab') : 'server';

function claimLeadership(now: number): boolean {
  try {
    const raw = window.localStorage.getItem(LEADER_KEY);
    const cur = raw ? (JSON.parse(raw) as { id: string; ts: number }) : null;
    if (!cur || cur.id === TAB_ID || now - cur.ts > 3000) {
      window.localStorage.setItem(LEADER_KEY, JSON.stringify({ id: TAB_ID, ts: now }));
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export function engineTick() {
  const now = Date.now();
  if (!claimLeadership(now)) return;
  const db = readDB();
  if (!step(db, now, true)) return;
  mutate((draft) => {
    step(draft, now, false);
  });
}

export function releaseLeadership() {
  try {
    const raw = window.localStorage.getItem(LEADER_KEY);
    if (raw && (JSON.parse(raw) as { id: string }).id === TAB_ID) window.localStorage.removeItem(LEADER_KEY);
  } catch {
    /* noop */
  }
}
