import type { WaterType } from '@/types';

/** Ориентировочный тариф: подача + цена за м³ по типу воды */
const PER_M3: Record<WaterType, number> = {
  drinking: 300,
  household: 250,
  technical: 200,
};
const BASE_FEE = 1000;

export function recommendedPrice(volume: number, waterType: WaterType): number {
  const raw = BASE_FEE + PER_M3[waterType] * volume;
  return Math.round(raw / 50) * 50;
}

export function priceRange(volume: number, waterType: WaterType): [number, number] {
  const p = recommendedPrice(volume, waterType);
  return [Math.round((p * 0.85) / 50) * 50, Math.round((p * 1.2) / 50) * 50];
}

export interface Economics {
  total: number;
  commission: number;
  driverIncome: number;
  rate: number;
}

/** Экономика заказа: стоимость = доход водителя + комиссия сервиса */
export function orderEconomics(total: number, rate: number): Economics {
  const commission = Math.round(total * rate);
  return { total, commission, driverIncome: total - commission, rate };
}

export function roundPrice(n: number): number {
  return Math.max(50, Math.round(n / 50) * 50);
}
