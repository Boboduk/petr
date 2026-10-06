'use client';

import { BadgeCheck, CalendarDays, Clock3, Route, Star, Truck } from 'lucide-react';
import type { Driver, Offer } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Rating } from '@/components/ui/Stars';
import { TruckArt } from '@/components/brand/TruckArt';
import { PriceDelta } from './OfferCard';
import { formatDate, formatKm, formatMoney, formatVolume, maskPlate, pluralize } from '@/lib/format';

/** Подробная карточка водителя с отзывами */
export function DriverDetailModal({ open, onClose, driver, offer, clientPrice, onOrder }: { open: boolean; onClose: () => void; driver?: Driver; offer?: Offer; clientPrice?: number; onOrder?: () => void }) {
  if (!driver) return null;
  const facts = [
    { icon: Truck, label: 'Автомобиль', value: `${driver.vehicle.brand} ${driver.vehicle.model}` },
    { icon: BadgeCheck, label: 'Госномер', value: maskPlate(driver.vehicle.plate) },
    { icon: CalendarDays, label: 'Опыт работы', value: `${driver.experienceYears} ${pluralize(driver.experienceYears, ['год', 'года', 'лет'])}` },
    { icon: Star, label: 'Выполнено', value: `${driver.ordersCount} ${pluralize(driver.ordersCount, ['заказ', 'заказа', 'заказов'])}` },
  ];
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      bodyClassName="pt-0"
      footer={
        onOrder && offer ? (
          <Button size="xl" block onClick={onOrder}>
            Заказать этого водовоза · {formatMoney(offer.price)}
          </Button>
        ) : undefined
      }
    >
      <TruckArt cabColor={driver.vehicle.color} photo={driver.vehicle.photo} volume={driver.vehicle.tankVolume} className="h-44 w-full" label={`${driver.vehicle.brand} ${driver.vehicle.model}`} />
      <div className="-mt-10 px-3">
        <Avatar name={driver.name} photo={driver.photo} color={driver.avatarColor} size={76} ring />
      </div>
      <div className="mt-2 px-1">
        <div className="flex items-center gap-1.5 text-xl font-extrabold tracking-[-0.02em] text-ink-900">
          {driver.name}
          {driver.verification === 'verified' && <BadgeCheck className="size-5 text-brand-600" aria-label="Проверен" />}
        </div>
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <Rating value={driver.rating} count={driver.ratingCount} />
        </div>
      </div>

      {offer && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-brand-50 p-3">
            <div className="text-lg font-extrabold text-brand-700 tabular">{formatMoney(offer.price)}</div>
            <div className="text-[11px] font-semibold text-ink-500">цена</div>
          </div>
          <div className="rounded-2xl bg-ink-50 p-3">
            <div className="flex items-center justify-center gap-1 whitespace-nowrap text-lg font-extrabold text-ink-900">
              <Clock3 className="size-4 shrink-0" />
              {offer.etaMin} мин
            </div>
            <div className="text-[11px] font-semibold text-ink-500">прибытие</div>
          </div>
          <div className="rounded-2xl bg-ink-50 p-3">
            <div className="flex items-center justify-center gap-1 whitespace-nowrap text-lg font-extrabold text-ink-900">
              <Route className="size-4 shrink-0" />
              {formatKm(offer.distanceKm)}
            </div>
            <div className="text-[11px] font-semibold text-ink-500">расстояние</div>
          </div>
        </div>
      )}
      {offer && clientPrice !== undefined && (
        <div className="mt-2 flex items-center justify-between rounded-2xl bg-ink-50 px-3 py-2 text-sm">
          <span className="text-ink-500">
            Ваша цена: <b className="text-ink-800">{formatMoney(clientPrice)}</b>
          </span>
          <PriceDelta offer={offer} clientPrice={clientPrice} />
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl bg-white p-3 ring-1 ring-ink-100">
            <div className="flex items-center gap-1.5 text-xs text-ink-400">
              <Icon className="size-3.5" /> {label}
            </div>
            <div className="mt-0.5 text-sm font-bold text-ink-900">{value}</div>
          </div>
        ))}
        <div className="col-span-2 flex items-center justify-between rounded-2xl bg-white p-3 ring-1 ring-ink-100">
          <span className="text-xs text-ink-400">Объём цистерны</span>
          <span className="text-sm font-bold text-brand-700">{formatVolume(driver.vehicle.tankVolume)}</span>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-bold text-ink-900">Отзывы</span>
          <span className="text-sm text-ink-400">{driver.reviews.length} с текстом</span>
        </div>
        {driver.reviews.length === 0 && <div className="rounded-2xl bg-ink-50 p-4 text-sm text-ink-500">Пока нет отзывов</div>}
        <div className="space-y-2">
          {driver.reviews.slice(0, 4).map((r) => (
            <div key={r.id} className="rounded-2xl bg-ink-50 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink-900">{r.author}</span>
                <span className="text-xs tracking-wider text-warn-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              </div>
              <p className="mt-1 text-sm text-ink-600">{r.text}</p>
              <div className="mt-1 text-[11px] text-ink-400">{formatDate(r.createdAt)}</div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
