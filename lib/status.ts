import type { OrderStatus, ScheduleType, WaterType, RegularFrequency } from '@/types';

export const STATUS_FLOW: OrderStatus[] = [
  'new',
  'searching',
  'offers',
  'driver_selected',
  'en_route',
  'arrived',
  'delivering',
  'completed',
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Новый заказ',
  searching: 'Поиск водовоза',
  offers: 'Получение предложений',
  driver_selected: 'Водитель выбран',
  en_route: 'Водовоз едет к клиенту',
  arrived: 'Водовоз прибыл',
  delivering: 'Доставка воды',
  completed: 'Заказ завершён',
  cancelled: 'Отменён',
};

export const STATUS_SHORT: Record<OrderStatus, string> = {
  new: 'Новый',
  searching: 'Поиск',
  offers: 'Предложения',
  driver_selected: 'Водитель выбран',
  en_route: 'В пути',
  arrived: 'Прибыл',
  delivering: 'Доставка',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

export type StatusTone = 'neutral' | 'info' | 'progress' | 'success' | 'danger';

export const STATUS_TONE: Record<OrderStatus, StatusTone> = {
  new: 'neutral',
  searching: 'info',
  offers: 'info',
  driver_selected: 'progress',
  en_route: 'progress',
  arrived: 'progress',
  delivering: 'progress',
  completed: 'success',
  cancelled: 'danger',
};

export const ACTIVE_STATUSES: OrderStatus[] = ['new', 'searching', 'offers', 'driver_selected', 'en_route', 'arrived', 'delivering'];
export const OPEN_FOR_OFFERS: OrderStatus[] = ['new', 'searching', 'offers'];
export const IN_DELIVERY: OrderStatus[] = ['driver_selected', 'en_route', 'arrived', 'delivering'];

export function isActive(s: OrderStatus) {
  return ACTIVE_STATUSES.includes(s);
}

export function nextStatus(s: OrderStatus): OrderStatus | null {
  const i = STATUS_FLOW.indexOf(s);
  if (i < 0 || i >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[i + 1];
}

export const WATER_TYPE_LABEL: Record<WaterType, string> = {
  drinking: 'Питьевая',
  technical: 'Техническая',
  household: 'Для хоз. нужд',
};

export const WATER_TYPE_FULL: Record<WaterType, string> = {
  drinking: 'Питьевая вода',
  technical: 'Техническая вода',
  household: 'Вода для хозяйственных нужд',
};

export const WATER_TYPE_HINT: Record<WaterType, string> = {
  drinking: 'Для питья и приготовления пищи. Цистерна с санпаспортом',
  technical: 'Для полива, стройки, бассейна',
  household: 'Для бани, стирки и уборки',
};

export const SCHEDULE_LABEL: Record<ScheduleType, string> = {
  now: 'Как можно скорее',
  scheduled: 'По расписанию',
  regular: 'Регулярная доставка',
};

export const FREQUENCY_LABEL: Record<RegularFrequency, string> = {
  weekly: 'Каждую неделю',
  biweekly: 'Раз в две недели',
  monthly: 'Раз в месяц',
};

export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const WEEKDAYS_FULL = ['понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу', 'воскресенье'];
