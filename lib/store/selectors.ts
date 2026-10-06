import type { Database, Driver, LatLng, Order, User } from '@/types';
import { getCity } from '@/data/cities';
import { distanceKm, etaMinutes, pointAlong, roadDistanceKm } from '@/lib/geo';
import { ACTIVE_STATUSES, IN_DELIVERY, OPEN_FOR_OFFERS } from '@/lib/status';

/**
 * Через сколько миллисекунд без «пульса» вкладка водителя считается закрытой.
 * С запасом: браузеры замедляют таймеры фоновых вкладок.
 */
export const LIVE_TIMEOUT = 70_000;
export const SEARCH_RADIUS_KM = 15;

export function currentCity(db: Database) {
  return getCity(db.settings.cityId);
}

export function findDriver(db: Database, id?: string): Driver | undefined {
  return id ? db.drivers.find((d) => d.id === id) : undefined;
}

export function findUser(db: Database, id?: string): User | undefined {
  return id ? db.users.find((u) => u.id === id) : undefined;
}

export function findOrder(db: Database, id?: string): Order | undefined {
  return id ? db.orders.find((o) => o.id === id) : undefined;
}

/** Водителем управляет живой человек в открытой вкладке */
export function isDriverLive(driver: Driver | undefined, now = Date.now()): boolean {
  return !!driver?.userId && !!driver.lastSeenAt && now - driver.lastSeenAt < LIVE_TIMEOUT;
}

export function driverActiveOrder(db: Database, driverId: string): Order | undefined {
  return db.orders.find((o) => o.driverId === driverId && IN_DELIVERY.includes(o.status));
}

export function isDriverBusy(db: Database, driverId: string): boolean {
  return !!driverActiveOrder(db, driverId);
}

export function travelMs(order: Order, speed: number): number {
  return ((order.travelSeconds ?? 40) * 1000) / Math.max(0.25, speed);
}

/** Прогресс поездки 0..1 */
export function tripProgress(order: Order, now: number, speed: number): number {
  if (order.status === 'arrived' || order.status === 'delivering' || order.status === 'completed') return 1;
  if (order.status !== 'en_route' || !order.enRouteAt) return 0;
  return Math.min(1, Math.max(0, (now - order.enRouteAt) / travelMs(order, speed)));
}

export function etaRemaining(order: Order, now: number, speed: number): number {
  const p = tripProgress(order, now, speed);
  return Math.max(0, Math.ceil((order.etaMin ?? 10) * (1 - p)));
}

/** Длительность слива воды в демо-времени */
export function deliveryMs(order: Order, speed: number): number {
  return ((6 + order.volume * 1.2) * 1000) / Math.max(0.25, speed);
}

export function deliveryProgress(order: Order, now: number, speed: number): number {
  if (order.status === 'completed') return 1;
  if (order.status !== 'delivering' || !order.deliveringAt) return 0;
  return Math.min(1, (now - order.deliveringAt) / deliveryMs(order, speed));
}

/** Текущая позиция водовоза с учётом движения по маршруту */
export function driverPosition(db: Database, driver: Driver, now: number): LatLng {
  const order = driverActiveOrder(db, driver.id);
  if (!order) return driver.location;
  if (order.status === 'en_route' && order.route) return pointAlong(order.route, tripProgress(order, now, db.settings.demoSpeed));
  if (order.status === 'arrived' || order.status === 'delivering') return order.location;
  return driver.location;
}

export function canDriverTake(driver: Driver, order: Order): boolean {
  return driver.vehicle.tankVolume >= order.volume;
}

export interface FeedItem {
  order: Order;
  distanceKm: number;
  etaMin: number;
  myOffer?: Order['offers'][number];
}

/** Лента заявок водителя: открытые заказы рядом, подходящие по объёму цистерны */
export function driverFeed(db: Database, driver: Driver): FeedItem[] {
  return db.orders
    .filter((o) => OPEN_FOR_OFFERS.includes(o.status) && o.cityId === db.settings.cityId)
    .filter((o) => canDriverTake(driver, o))
    .map((order) => ({
      order,
      distanceKm: roadDistanceKm(driver.location, order.location),
      etaMin: etaMinutes(driver.location, order.location),
      myOffer: order.offers.find((of) => of.driverId === driver.id),
    }))
    .filter((f) => f.distanceKm <= SEARCH_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Водовозы рядом с точкой — для экрана поиска */
export function nearbyDrivers(db: Database, point: LatLng, now: number, limit = 6) {
  return db.drivers
    .filter((d) => d.online && !d.blocked && d.verification === 'verified')
    .map((d) => {
      const pos = driverPosition(db, d, now);
      return { driver: d, position: pos, distanceKm: distanceKm(pos, point) * 1.3, etaMin: etaMinutes(pos, point), busy: isDriverBusy(db, d.id) };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface DashboardStats {
  ordersToday: number;
  activeOrders: number;
  driversOnline: number;
  driversTotal: number;
  revenueToday: number;
  commissionToday: number;
  revenueTotal: number;
  commissionTotal: number;
  completedTotal: number;
  avgCheck: number;
  byDay: Array<{ day: number; count: number; revenue: number }>;
}

export function dashboardStats(db: Database, now = Date.now()): DashboardStats {
  const today = startOfDay(now);
  const cityOrders = db.orders.filter((o) => o.cityId === db.settings.cityId);
  const completed = cityOrders.filter((o) => o.status === 'completed');
  const todayOrders = cityOrders.filter((o) => o.createdAt >= today);
  const todayCompleted = completed.filter((o) => (o.completedAt ?? o.createdAt) >= today);
  const sum = (list: Order[]) => list.reduce((s, o) => s + (o.finalPrice ?? 0), 0);
  const comm = (list: Order[]) => list.reduce((s, o) => s + Math.round((o.finalPrice ?? 0) * o.commissionRate), 0);
  const byDay = Array.from({ length: 7 }, (_, i) => {
    const day = today - (6 - i) * 86_400_000;
    const list = cityOrders.filter((o) => o.createdAt >= day && o.createdAt < day + 86_400_000);
    return { day, count: list.length, revenue: sum(list.filter((o) => o.status === 'completed')) };
  });
  return {
    ordersToday: todayOrders.length,
    activeOrders: cityOrders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
    driversOnline: db.drivers.filter((d) => d.online && !d.blocked).length,
    driversTotal: db.drivers.length,
    revenueToday: sum(todayCompleted),
    commissionToday: comm(todayCompleted),
    revenueTotal: sum(completed),
    commissionTotal: comm(completed),
    completedTotal: completed.length,
    avgCheck: completed.length ? Math.round(sum(completed) / completed.length) : 0,
    byDay,
  };
}

export function clientOrders(db: Database, clientId: string): Order[] {
  return db.orders.filter((o) => o.clientId === clientId).sort((a, b) => b.createdAt - a.createdAt);
}

export function unreadCount(db: Database, userId: string): number {
  return db.notifications.filter((n) => n.userId === userId && !n.read).length;
}
