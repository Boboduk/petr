/**
 * Доменные типы «Водовоза».
 * Эти же сущности описаны SQL-схемой в /supabase/schema.sql — при переходе
 * на настоящую БД типы остаются контрактом между UI и слоем данных.
 */

export type LatLng = [number, number];

export type Role = 'client' | 'driver' | 'admin';

export type WaterType = 'drinking' | 'technical' | 'household';

export type ScheduleType = 'now' | 'scheduled' | 'regular';

export type RegularFrequency = 'weekly' | 'biweekly' | 'monthly';

export type OrderStatus =
  | 'new' // 1. Новый заказ
  | 'searching' // 2. Поиск водовоза
  | 'offers' // 3. Получение предложений
  | 'driver_selected' // 4. Водитель выбран
  | 'en_route' // 5. Водовоз едет к клиенту
  | 'arrived' // 6. Водовоз прибыл
  | 'delivering' // 7. Доставка воды
  | 'completed' // 8. Заказ завершён
  | 'cancelled'; // 9. Отменён

export interface City {
  id: string;
  name: string;
  region: string;
  center: LatLng;
  zoom: number;
  /** Улицы для демо-геокодера и генерации адресов */
  streets: string[];
}

export interface User {
  id: string;
  role: Role;
  name: string;
  phone: string;
  email: string;
  /** Только для демо. В реальном сервисе пароли хранит провайдер авторизации. */
  password: string;
  createdAt: number;
  blocked?: boolean;
  /** Для роли driver — ссылка на профиль водителя */
  driverId?: string;
  /** Тестовый «бот»-клиент, заказы которого генерирует симулятор */
  isBot?: boolean;
  avatarColor?: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  createdAt: number;
  orderId?: string;
}

export interface Vehicle {
  brand: string;
  model: string;
  plate: string;
  tankVolume: number;
  year: number;
  color: string;
  /** dataURL загруженной фотографии; если нет — рисуется иллюстрация */
  photo?: string;
}

export type VerificationStatus = 'verified' | 'pending' | 'rejected';

export interface DriverDocument {
  id: string;
  title: string;
  number: string;
  status: VerificationStatus;
}

export interface Driver {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  /** dataURL фотографии; если нет — генерируемый аватар */
  photo?: string;
  avatarColor: string;
  rating: number;
  ratingCount: number;
  ordersCount: number;
  experienceYears: number;
  vehicle: Vehicle;
  /** Смещение от центра города — позволяет переносить демо-водителей в любой город */
  homeOffset: LatLng;
  location: LatLng;
  online: boolean;
  verification: VerificationStatus;
  blocked: boolean;
  /** Ценовая стратегия бота: множитель к цене клиента */
  priceFactor: number;
  documents: DriverDocument[];
  reviews: Review[];
  joinedAt: number;
  /** Пульс открытой вкладки водителя — значит, заказом управляет живой человек */
  lastSeenAt?: number;
}

export interface Offer {
  id: string;
  driverId: string;
  price: number;
  etaMin: number;
  distanceKm: number;
  /** accept — водитель принял цену клиента, counter — предложил свою */
  kind: 'accept' | 'counter';
  createdAt: number;
  comment?: string;
}

export interface ChatMessage {
  id: string;
  from: 'client' | 'driver' | 'system';
  text: string;
  createdAt: number;
}

export interface RegularConfig {
  frequency: RegularFrequency;
  weekday: number; // 1..7
  time: string; // HH:mm
}

export interface StatusEvent {
  status: OrderStatus;
  at: number;
  by?: Role | 'system';
}

export interface Order {
  id: string;
  number: number;
  clientId: string;
  cityId: string;
  address: string;
  location: LatLng;
  volume: number;
  waterType: WaterType;
  scheduleType: ScheduleType;
  scheduledAt?: number;
  regular?: RegularConfig;
  clientPrice: number;
  comment: string;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  offers: Offer[];
  driverId?: string;
  finalPrice?: number;
  /** Ставка комиссии фиксируется в момент выбора водителя */
  commissionRate: number;
  etaMin?: number;
  route?: LatLng[];
  enRouteAt?: number;
  /** Длительность поездки в демо-секундах (ускоренное время) */
  travelSeconds?: number;
  arrivedAt?: number;
  deliveringAt?: number;
  completedAt?: number;
  cancelledAt?: number;
  cancelReason?: string;
  cancelledBy?: Role | 'system';
  timeline: StatusEvent[];
  messages: ChatMessage[];
  rating?: number;
  review?: string;
  /** Для регулярных заказов — ссылка на план */
  planId?: string;
}

export interface RegularPlan {
  id: string;
  clientId: string;
  address: string;
  location: LatLng;
  volume: number;
  waterType: WaterType;
  config: RegularConfig;
  price: number;
  active: boolean;
  createdAt: number;
}

export type NotificationKind = 'search' | 'offer' | 'selected' | 'en_route' | 'arrived' | 'completed' | 'cancelled' | 'new_order' | 'message' | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  orderId?: string;
  createdAt: number;
  read: boolean;
}

export interface Settings {
  /** Комиссия сервиса, доля (0.1 = 10%) */
  commissionRate: number;
  cityId: string;
  /** Множитель скорости симуляции: 1 — обычная демо-скорость */
  demoSpeed: number;
  /** Фоновые заказы от тестовых клиентов для «живой» админки и ленты водителя */
  ambientActivity: boolean;
}

export interface Database {
  version: number;
  seededAt: number;
  settings: Settings;
  users: User[];
  drivers: Driver[];
  orders: Order[];
  plans: RegularPlan[];
  notifications: AppNotification[];
  orderSeq: number;
  /** Служебное: метки симулятора (последний фоновый заказ и т.п.) */
  meta: Record<string, number>;
}

export interface Session {
  userId: string;
  role: Role;
}
