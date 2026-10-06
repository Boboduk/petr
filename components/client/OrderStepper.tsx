import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export const ORDER_STEPS = ['Адрес', 'Объём', 'Время', 'Цена', 'Водитель'];

/** Прогресс оформления: 1. Адрес → 2. Объём → 3. Время → 4. Цена → 5. Водитель */
export function OrderStepper({ current, onStep, maxReached = current }: { current: number; onStep?: (i: number) => void; maxReached?: number }) {
  return (
    <ol className="flex items-center gap-1">
      {ORDER_STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = onStep && i <= maxReached && i < 4;
        return (
          <li key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStep?.(i)}
              className={cn('flex h-1.5 w-full rounded-full transition-colors', done ? 'bg-brand-600' : active ? 'bg-brand-300' : 'bg-ink-200')}
              aria-label={`${i + 1}. ${label}`}
            />
            <span className={cn('flex items-center gap-1 truncate text-[11px] font-semibold', active ? 'text-ink-900' : done ? 'text-brand-600' : 'text-ink-400')}>
              {done && <Check className="size-3" strokeWidth={3} />}
              <span className="truncate">
                {i + 1}. {label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
