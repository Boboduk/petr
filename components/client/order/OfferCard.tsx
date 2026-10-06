'use client';

import { Clock3, Route, Truck } from 'lucide-react';
import type { Driver, Offer } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Rating } from '@/components/ui/Stars';
import { Button } from '@/components/ui/Button';
import { TruckArt } from '@/components/brand/TruckArt';
import { formatKm, formatMoney, formatVolume, pluralize } from '@/lib/format';
import { cn } from '@/lib/cn';

export function PriceDelta({ offer, clientPrice }: { offer: Offer; clientPrice: number }) {
  const diff = offer.price - clientPrice;
  if (diff === 0) return <span className="whitespace-nowrap rounded-full bg-ok-50 px-2 py-0.5 text-[11px] font-bold text-ok-600">Принял вашу цену</span>;
  return (
    <span className={cn('whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold', diff < 0 ? 'bg-ok-50 text-ok-600' : 'bg-warn-50 text-warn-600')}>
      {diff < 0 ? `−${formatMoney(-diff)} к вашей цене` : `+${formatMoney(diff)} к вашей цене`}
    </span>
  );
}

interface Props {
  offer: Offer;
  driver: Driver;
  clientPrice: number;
  best?: 'price' | 'time' | 'rating';
  highlighted?: boolean;
  onSelect: () => void;
  onView: () => void;
  onHover?: (v: boolean) => void;
}

/** Карточка предложения водителя */
export function OfferCard({ offer, driver, clientPrice, best, highlighted, onSelect, onView, onHover }: Props) {
  return (
    <div
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className={cn('relative rounded-3xl bg-white p-4 shadow-card ring-inset transition animate-fade-up', highlighted ? 'ring-2 ring-brand-500' : 'ring-1 ring-transparent')}
    >
      {best && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-ink-900 px-2.5 py-1 text-[11px] font-bold text-white">
          {best === 'price' ? 'Лучшая цена' : best === 'time' ? 'Быстрее всех' : 'Лучший рейтинг'}
        </span>
      )}
      <div className="flex gap-3">
        <button onClick={onView} className="shrink-0" aria-label={`Профиль водителя ${driver.name}`}>
          <Avatar name={driver.name} photo={driver.photo} color={driver.avatarColor} size={56} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[17px] font-bold text-ink-900">{driver.name}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[13px] text-ink-500">
                <Rating value={driver.rating} />
                <span>·</span>
                <span className="whitespace-nowrap">
                  {driver.ordersCount} {pluralize(driver.ordersCount, ['заказ', 'заказа', 'заказов'])}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[22px] font-extrabold leading-none tracking-[-0.02em] text-ink-900 tabular">{formatMoney(offer.price)}</div>
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-medium text-ink-600">
            <span className="flex items-center gap-1">
              <Truck className="size-3.5 text-ink-400" /> {driver.vehicle.brand} — водовоз
            </span>
            <span className="font-bold text-brand-700">{formatVolume(driver.vehicle.tankVolume)}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-ink-50 p-2.5">
        <TruckArt cabColor={driver.vehicle.color} photo={driver.vehicle.photo} volume={driver.vehicle.tankVolume} className="h-12 w-20 shrink-0" />
        <div className="grid flex-1 grid-cols-2 gap-1 text-[13px]">
          <span className="flex items-center gap-1.5 font-semibold text-ink-900">
            <Clock3 className="size-3.5 text-brand-600" /> ≈ {offer.etaMin} мин
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-ink-900">
            <Route className="size-3.5 text-brand-600" /> {formatKm(offer.distanceKm)}
          </span>
          <span className="col-span-2 text-xs leading-snug text-ink-500">
            Ваша цена: <b className="text-ink-700">{formatMoney(clientPrice)}</b>
            <br />
            Предложение водителя: <b className="text-ink-900">{formatMoney(offer.price)}</b>
          </span>
          <span className="col-span-2">
            <PriceDelta offer={offer} clientPrice={clientPrice} />
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={onView}>
          Посмотреть
        </Button>
        <Button onClick={onSelect}>Выбрать</Button>
      </div>
    </div>
  );
}
