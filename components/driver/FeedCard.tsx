'use client';

import { Banknote, Clock3, Droplets, GlassWater, MapPin, MessageSquareText, Ruler, Undo2 } from 'lucide-react';
import type { FeedItem } from '@/lib/store/selectors';
import { Button } from '@/components/ui/Button';
import { formatDateTime, formatKm, formatMoney, formatVolume, timeAgo } from '@/lib/format';
import { shortAddress } from '@/lib/geo';
import { SCHEDULE_LABEL, WATER_TYPE_FULL } from '@/lib/status';
import { cn } from '@/lib/cn';

interface Props {
  item: FeedItem;
  now: number;
  highlighted?: boolean;
  disabled?: boolean;
  onAccept: () => void;
  onPropose: () => void;
  onWithdraw: () => void;
  onFocus?: () => void;
}

/** Карточка заявки в ленте водителя */
export function FeedCard({ item, now, highlighted, disabled, onAccept, onPropose, onWithdraw, onFocus }: Props) {
  const { order, distanceKm, myOffer } = item;
  const rows = [
    { icon: MapPin, label: 'Адрес', value: shortAddress(order.address) },
    { icon: Droplets, label: 'Объём', value: formatVolume(order.volume) },
    { icon: GlassWater, label: 'Тип', value: WATER_TYPE_FULL[order.waterType] },
    { icon: Clock3, label: 'Время', value: order.scheduledAt ? formatDateTime(order.scheduledAt) : SCHEDULE_LABEL.now },
    { icon: Banknote, label: 'Цена клиента', value: formatMoney(order.clientPrice), strong: true },
    { icon: Ruler, label: 'Расстояние', value: formatKm(distanceKm) },
  ];
  return (
    <div onMouseEnter={onFocus} className={cn('rounded-3xl bg-white p-4 shadow-card ring-inset transition animate-fade-up', highlighted ? 'ring-2 ring-brand-500' : 'ring-1 ring-transparent', myOffer && 'bg-brand-50/40')}>
      <div className="flex items-center justify-between">
        <div className="text-[17px] font-extrabold tracking-[-0.02em] text-ink-900">Заказ №{order.number}</div>
        <span className="text-xs font-semibold text-ink-400">{timeAgo(order.createdAt, now)}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
        {rows.map(({ icon: Icon, label, value, strong }) => (
          <div key={label} className={cn('min-w-0', label === 'Адрес' && 'col-span-2')}>
            <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              <Icon className="size-3.5" /> {label}
            </dt>
            <dd className={cn('truncate text-[15px]', strong ? 'font-extrabold text-brand-700' : 'font-semibold text-ink-900')}>{value}</dd>
          </div>
        ))}
      </dl>
      {order.comment && (
        <div className="mt-3 flex gap-2 rounded-2xl bg-ink-50 p-2.5 text-sm text-ink-600">
          <MessageSquareText className="mt-0.5 size-4 shrink-0 text-ink-400" /> {order.comment}
        </div>
      )}
      {myOffer ? (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-brand-600 p-3 text-white">
          <div>
            <div className="text-xs text-white/70">Ожидает решения клиента</div>
            <div className="font-bold">
              Ваша цена {formatMoney(myOffer.price)} · ≈ {myOffer.etaMin} мин
            </div>
          </div>
          <button onClick={onWithdraw} className="flex items-center gap-1 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/25">
            <Undo2 className="size-3.5" /> Отозвать
          </button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button size="lg" onClick={onAccept} disabled={disabled} className="px-2 text-[15px]">
            Принять за {formatMoney(order.clientPrice)}
          </Button>
          <Button size="lg" variant="outline" onClick={onPropose} disabled={disabled} className="px-2 text-[15px]">
            Предложить цену
          </Button>
        </div>
      )}
    </div>
  );
}
