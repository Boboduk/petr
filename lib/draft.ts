import type { LatLng, RegularConfig, ScheduleType, WaterType } from '@/types';

/** Черновик заказа клиента — живёт в sessionStorage между шагами мастера */
export interface OrderDraft {
  address: string;
  location?: LatLng;
  volume: number;
  waterType: WaterType;
  scheduleType: ScheduleType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  regular: RegularConfig;
  price?: number;
  comment: string;
}

const KEY = 'vodovoz:draft';

function tomorrow(): string {
  const d = new Date(Date.now() + 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function emptyDraft(): OrderDraft {
  return {
    address: '',
    volume: 5,
    waterType: 'drinking',
    scheduleType: 'now',
    date: tomorrow(),
    time: '10:00',
    regular: { frequency: 'weekly', weekday: 6, time: '10:00' },
    comment: '',
  };
}

export function loadDraft(): OrderDraft {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) return { ...emptyDraft(), ...(JSON.parse(raw) as Partial<OrderDraft>) };
  } catch {
    /* noop */
  }
  return emptyDraft();
}

export function saveDraft(d: OrderDraft) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* noop */
  }
}

export function clearDraft() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/** Ближайшая дата для регулярной доставки */
export function nextOccurrence(cfg: RegularConfig, from = Date.now()): number {
  const [h, m] = cfg.time.split(':').map(Number);
  const d = new Date(from);
  for (let i = 0; i < 8; i++) {
    const c = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i, h, m);
    const wd = ((c.getDay() + 6) % 7) + 1;
    if (wd === cfg.weekday && c.getTime() > from) return c.getTime();
  }
  return from + 7 * 86_400_000;
}
