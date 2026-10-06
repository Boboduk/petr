'use client';

import { Radar, Star } from 'lucide-react';
import type { Order } from '@/types';
import type { nearbyDrivers } from '@/lib/store/selectors';
import { TruckArt } from '@/components/brand/TruckArt';
import { formatKm, formatMoney, formatVolume } from '@/lib/format';
import { offersSummary } from '@/lib/store/actions';
import { WATER_TYPE_FULL } from '@/lib/status';

type Nearby = ReturnType<typeof nearbyDrivers>;

/** Экран «Ищем водовозы поблизости» */
export function SearchingView({ order, nearby, progress }: { order: Order; nearby: Nearby; progress: number }) {
  const n = order.offers.length;
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="relative flex size-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <span className="absolute inset-0 animate-ping rounded-2xl bg-brand-500/40" />
            <Radar className="relative size-6" />
          </span>
          <div>
            <div className="text-lg font-extrabold tracking-[-0.02em] text-ink-900">Ищем водовозы поблизости</div>
            <div className="text-sm text-ink-500">{n > 0 ? offersSummary(n) : 'Отправили заявку водителям рядом'}</div>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-100">
          <div className="h-full rounded-full bg-gradient-to-r from-aqua-400 to-brand-600 transition-[width] duration-700" style={{ width: `${Math.max(8, progress * 100)}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-ink-600">
          <span className="rounded-full bg-ink-50 px-2.5 py-1">{formatVolume(order.volume)}</span>
          <span className="rounded-full bg-ink-50 px-2.5 py-1">{WATER_TYPE_FULL[order.waterType]}</span>
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-700">Ваша цена {formatMoney(order.clientPrice)}</span>
        </div>
      </div>

      <div>
        <div className="mb-2 px-1 text-sm font-bold text-ink-500">Водовозы рядом</div>
        <div className="space-y-2">
          {nearby.map(({ driver, distanceKm, etaMin, busy }, i) => {
            const fits = driver.vehicle.tankVolume >= order.volume;
            return (
              <div key={driver.id} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-card animate-fade-up" style={{ animationDelay: `${i * 90}ms` }}>
                <TruckArt cabColor={driver.vehicle.color} photo={driver.vehicle.photo} volume={driver.vehicle.tankVolume} className="h-14 w-22 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-ink-900">
                      Водовоз №{driver.vehicle.plate.replace(/\D/g, '').slice(0, 2)} · {driver.vehicle.brand}
                    </span>
                    <span className="flex items-center gap-0.5 text-xs font-bold text-ink-900">
                      <Star className="size-3 fill-warn-500 text-warn-500" />
                      {driver.rating.toFixed(1).replace('.', ',')}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs font-medium text-ink-500">
                    <span>{formatKm(distanceKm)}</span>
                    <span>≈ {etaMin} мин</span>
                    <span className="font-bold text-brand-700">{formatVolume(driver.vehicle.tankVolume)}</span>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${busy ? 'bg-ink-100 text-ink-400' : !fits ? 'bg-warn-50 text-warn-600' : order.offers.some((o) => o.driverId === driver.id) ? 'bg-ok-50 text-ok-600' : 'bg-brand-50 text-brand-700'}`}>
                  {busy ? 'занят' : !fits ? 'мал объём' : order.offers.some((o) => o.driverId === driver.id) ? 'ответил' : 'смотрит'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
