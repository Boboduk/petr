import Link from 'next/link';
import { CalendarClock, ChevronRight, Droplets, MapPin, Repeat } from 'lucide-react';
import type { Driver, Order } from '@/types';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDateTime, formatMoney, formatVolume } from '@/lib/format';
import { WATER_TYPE_LABEL } from '@/lib/status';

/** Карточка заказа в истории */
export function OrderCard({ order, driver, href }: { order: Order; driver?: Driver; href: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Droplets className="size-5.5" />
          </span>
          <div>
            <div className="text-[17px] font-extrabold tracking-[-0.02em] text-ink-900">{formatVolume(order.volume)} воды</div>
            <div className="text-xs font-semibold text-ink-400">
              №{order.number} · {WATER_TYPE_LABEL[order.waterType]}
            </div>
          </div>
        </div>
        <div className="text-right text-[17px] font-extrabold text-ink-900 tabular">{formatMoney(order.finalPrice ?? order.clientPrice)}</div>
      </div>
      <div className="mt-3 space-y-1.5 text-sm text-ink-600">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0 text-ink-400" />
          <span className="truncate">{order.address}</span>
        </div>
        <div className="flex items-center gap-2">
          {order.scheduleType === 'regular' ? <Repeat className="size-4 shrink-0 text-ink-400" /> : <CalendarClock className="size-4 shrink-0 text-ink-400" />}
          <span>{formatDateTime(order.scheduledAt ?? order.createdAt)}</span>
          {driver && <span className="truncate text-ink-400">· {driver.name}, {driver.vehicle.brand}</span>}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-ink-400">Статус:</span>
          <StatusBadge status={order.status} />
        </div>
        <Link href={href} className="flex items-center gap-0.5 text-sm font-bold text-brand-600 hover:text-brand-700">
          Подробнее <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
