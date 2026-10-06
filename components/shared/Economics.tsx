import { orderEconomics } from '@/lib/pricing';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';

/** Экономика заказа: стоимость = доход водителя + комиссия сервиса */
export function EconomicsCard({ total, rate, highlight = 'driver', className }: { total: number; rate: number; highlight?: 'driver' | 'service'; className?: string }) {
  const e = orderEconomics(total, rate);
  const driverShare = 100 - Math.round(rate * 100);
  return (
    <div className={cn('rounded-2xl bg-ink-50 p-4', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-500">Стоимость заказа</span>
        <span className="font-bold text-ink-900 tabular">{formatMoney(e.total)}</span>
      </div>
      <div className="my-3 flex h-2.5 overflow-hidden rounded-full bg-ink-200">
        <div className="bg-brand-600" style={{ width: `${driverShare}%` }} />
        <div className="bg-aqua-400" style={{ width: `${100 - driverShare}%` }} />
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-ink-600">
            <span className="size-2.5 rounded-full bg-brand-600" /> Доход водителя
          </span>
          <span className={cn('tabular', highlight === 'driver' ? 'font-bold text-ink-900' : 'font-semibold text-ink-700')}>{formatMoney(e.driverIncome)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-ink-600">
            <span className="size-2.5 rounded-full bg-aqua-400" /> Комиссия сервиса · {Math.round(rate * 100)}%
          </span>
          <span className={cn('tabular', highlight === 'service' ? 'font-bold text-ink-900' : 'font-semibold text-ink-700')}>{formatMoney(e.commission)}</span>
        </div>
      </div>
    </div>
  );
}
