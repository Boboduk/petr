'use client';

import { CalendarClock, MapPin, MessageCircle, Phone, X } from 'lucide-react';
import type { Driver, Order } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Rating } from '@/components/ui/Stars';
import { formatDateTime, formatMoney, formatVolume, maskPlate } from '@/lib/format';
import { shortAddress } from '@/lib/geo';
import { cn } from '@/lib/cn';

interface Props {
  order: Order;
  driver: Driver;
  eta: number;
  progress: number;
  deliveryProgress: number;
  onCall: () => void;
  onChat: () => void;
  onCancel: () => void;
  unreadMessages: number;
}

/** Экран активной доставки: водитель назначен → едет → прибыл → слив воды */
export function TrackingView({ order, driver, eta, progress, deliveryProgress, onCall, onChat, onCancel, unreadMessages }: Props) {
  const scheduledFuture = order.status === 'driver_selected' && order.scheduledAt && order.scheduledAt > Date.now();
  const header = (() => {
    switch (order.status) {
      case 'driver_selected':
        return scheduledFuture
          ? { title: 'Доставка запланирована', text: `Водитель приедет ${formatDateTime(order.scheduledAt!)}` }
          : { title: 'Водитель выбран', text: 'Водовоз готовится к выезду' };
      case 'en_route':
        return { title: 'Водовоз едет к вам', text: eta > 0 ? `Прибытие через ${eta} мин` : 'Подъезжает к адресу' };
      case 'arrived':
        return { title: 'Водовоз прибыл', text: 'Встречайте водителя у адреса доставки' };
      case 'delivering':
        return { title: 'Идёт доставка воды', text: `Залито ${(order.volume * deliveryProgress).toFixed(1).replace('.', ',')} из ${formatVolume(order.volume)}` };
      default:
        return { title: '', text: '' };
    }
  })();
  const canCancel = order.status === 'driver_selected' || order.status === 'en_route';

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl bg-ink-900 p-5 text-white shadow-float">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[22px] font-extrabold leading-tight tracking-[-0.02em]">{header.title}</div>
            <div className="mt-1 text-sm text-white/70">{header.text}</div>
          </div>
          {order.status === 'en_route' && (
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
              <div className="text-2xl font-extrabold leading-none tabular">{eta}</div>
              <div className="text-[10px] font-semibold uppercase text-white/60">мин</div>
            </div>
          )}
          {scheduledFuture && <CalendarClock className="size-8 text-aqua-400" />}
        </div>
        {(order.status === 'en_route' || order.status === 'driver_selected') && (
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-gradient-to-r from-aqua-400 to-brand-400 transition-[width] duration-1000" style={{ width: `${Math.max(4, progress * 100)}%` }} />
          </div>
        )}
        {order.status === 'delivering' && (
          <div className="relative mt-4 h-16 overflow-hidden rounded-2xl bg-white/10">
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-500 to-aqua-400 transition-[height] duration-1000" style={{ height: `${deliveryProgress * 100}%` }}>
              <svg viewBox="0 0 400 20" preserveAspectRatio="none" className="absolute -top-2.5 left-0 h-3 w-[200%] animate-wave fill-aqua-400">
                <path d="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10 V20 H0Z" />
              </svg>
            </div>
            <div className="relative flex h-full items-center justify-center text-xl font-extrabold tabular">{Math.round(deliveryProgress * 100)}%</div>
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-card">
        <div className="flex items-center gap-3">
          <Avatar name={driver.name} photo={driver.photo} color={driver.avatarColor} size={56} />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-ink-400">Водовоз</div>
            <div className="text-lg font-bold text-ink-900">{driver.name}</div>
            <div className="flex items-center gap-2 text-[13px] text-ink-500">
              <Rating value={driver.rating} /> · {driver.vehicle.brand} · {formatVolume(driver.vehicle.tankVolume)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-extrabold text-ink-900 tabular">{formatMoney(order.finalPrice)}</div>
            <div className="rounded-md bg-ink-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-ink-600">{maskPlate(driver.vehicle.plate)}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button onClick={onCall} className="flex flex-col items-center gap-1 rounded-2xl bg-brand-50 py-3 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 active:scale-95">
            <Phone className="size-5" /> Позвонить
          </button>
          <button onClick={onChat} className="relative flex flex-col items-center gap-1 rounded-2xl bg-brand-50 py-3 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 active:scale-95">
            <MessageCircle className="size-5" /> Написать
            {unreadMessages > 0 && <span className="absolute right-3 top-2 size-2.5 rounded-full bg-bad-500" />}
          </button>
          <button
            onClick={onCancel}
            disabled={!canCancel}
            className={cn('flex flex-col items-center gap-1 rounded-2xl py-3 text-xs font-semibold transition active:scale-95', canCancel ? 'bg-bad-50 text-bad-600 hover:bg-bad-500 hover:text-white' : 'bg-ink-50 text-ink-300')}
          >
            <X className="size-5" /> Отменить
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-3xl bg-white p-4 shadow-card">
        <MapPin className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <div className="text-sm">
          <div className="font-semibold text-ink-900">{shortAddress(order.address)}</div>
          <div className="text-ink-500">
            {formatVolume(order.volume)} · {order.comment || 'без комментария'}
          </div>
        </div>
      </div>
    </div>
  );
}
