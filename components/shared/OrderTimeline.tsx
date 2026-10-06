import { Check, X } from 'lucide-react';
import type { Order } from '@/types';
import { STATUS_FLOW, STATUS_LABEL } from '@/lib/status';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/cn';

/** Наглядная шкала из 9 статусов заказа */
export function OrderTimeline({ order, compact }: { order: Order; compact?: boolean }) {
  const reached = new Map(order.timeline.map((e) => [e.status, e.at]));
  const cancelled = order.status === 'cancelled';
  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const steps = cancelled ? STATUS_FLOW.filter((s) => reached.has(s)) : STATUS_FLOW;

  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const at = reached.get(s);
        const done = !!at && (cancelled || STATUS_FLOW.indexOf(s) < currentIdx || order.status === 'completed');
        const current = !cancelled && s === order.status && order.status !== 'completed';
        return (
          <li key={s} className={cn('relative flex gap-3', compact ? 'pb-2.5' : 'pb-4')}>
            {i < steps.length - 1 + (cancelled ? 1 : 0) && <span className={cn('absolute left-[11px] top-6 h-[calc(100%-20px)] w-0.5', done ? 'bg-brand-500' : 'bg-ink-100')} />}
            <span
              className={cn(
                'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                done && 'bg-brand-600 text-white',
                current && 'bg-white text-brand-600 ring-2 ring-brand-500',
                !done && !current && 'bg-ink-100 text-ink-400',
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : current ? <span className="size-2 animate-pulse rounded-full bg-brand-600" /> : STATUS_FLOW.indexOf(s) + 1}
            </span>
            <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2 pt-0.5">
              <span className={cn('text-sm', done || current ? 'font-semibold text-ink-900' : 'text-ink-400')}>{STATUS_LABEL[s]}</span>
              {at && <span className="text-xs text-ink-400 tabular">{formatTime(at)}</span>}
            </div>
          </li>
        );
      })}
      {cancelled && (
        <li className="relative flex gap-3">
          <span className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-bad-500 text-white">
            <X className="size-3.5" strokeWidth={3} />
          </span>
          <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2 pt-0.5">
            <span className="text-sm font-semibold text-bad-600">Отменён{order.cancelReason ? ` · ${order.cancelReason}` : ''}</span>
            {order.cancelledAt && <span className="text-xs text-ink-400 tabular">{formatTime(order.cancelledAt)}</span>}
          </div>
        </li>
      )}
    </ol>
  );
}
