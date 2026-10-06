'use client';

import { useState } from 'react';
import { formatMoney, formatShortDate } from '@/lib/format';
import { cn } from '@/lib/cn';

interface Point {
  day: number;
  count: number;
  revenue: number;
}

const WD = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

/**
 * Заказы по дням — одна серия, поэтому без легенды (название в заголовке).
 * Тонкие столбцы со скруглённым верхом, приглушённая сетка, подсказка при наведении,
 * подпись значения только у последнего (сегодняшнего) столбца.
 */
export function OrdersChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(5, ...data.map((d) => d.count));
  const top = Math.ceil(max / 10) * 10;
  const ticks = [0, top / 2, top];

  return (
    <div>
      <div className="relative h-52">
        {/* сетка */}
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 flex items-center gap-2" style={{ bottom: `${(t / top) * 100}%` }}>
            <span className="w-6 text-right text-[11px] text-ink-400 tabular">{t}</span>
            <span className="h-px flex-1 bg-ink-100" />
          </div>
        ))}
        <div className="absolute inset-y-0 left-8 right-0 flex items-end gap-[2px]">
          {data.map((d, i) => {
            const isToday = i === data.length - 1;
            const h = (d.count / top) * 100;
            return (
              <div
                key={d.day}
                className="group relative flex h-full flex-1 items-end justify-center"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${formatShortDate(d.day)}: ${d.count} заказов, выручка ${formatMoney(d.revenue)}`}
              >
                <div
                  className={cn('w-full max-w-9 rounded-t-[4px] transition-colors', hover === i ? 'bg-brand-700' : isToday ? 'bg-brand-600' : 'bg-brand-300')}
                  style={{ height: `${h}%` }}
                />
                {isToday && hover === null && <span className="absolute text-xs font-bold text-ink-900 tabular" style={{ bottom: `calc(${h}% + 4px)` }}>{d.count}</span>}
                {hover === i && (
                  <div className="pointer-events-none absolute z-10 w-max rounded-xl bg-ink-900 px-3 py-2 text-xs text-white shadow-float" style={{ bottom: `calc(${h}% + 8px)` }}>
                    <div className="font-semibold">
                      {WD[new Date(d.day).getDay()]}, {formatShortDate(d.day)}
                    </div>
                    <div className="text-white/70">
                      Заказов: <b className="text-white">{d.count}</b>
                    </div>
                    <div className="text-white/70">
                      Выручка: <b className="text-white">{formatMoney(d.revenue)}</b>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="ml-8 mt-2 flex gap-[2px]">
        {data.map((d, i) => (
          <span key={d.day} className={cn('flex-1 text-center text-[11px]', i === data.length - 1 ? 'font-bold text-ink-900' : 'text-ink-400')}>
            {i === data.length - 1 ? 'Сегодня' : WD[new Date(d.day).getDay()]}
          </span>
        ))}
      </div>
    </div>
  );
}
