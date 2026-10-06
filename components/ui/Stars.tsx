'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Rating({ value, className, count }: { value: number; className?: string; count?: number }) {
  return (
    <span className={cn('inline-flex items-center gap-1 font-semibold text-ink-900', className)}>
      <Star className="size-[1em] fill-warn-500 text-warn-500" />
      <span className="tabular">{formatRating(value)}</span>
      {count !== undefined && <span className="font-normal text-ink-400">({count})</span>}
    </span>
  );
}

export function formatRating(value: number) {
  const v = Math.round(value * 100) / 100;
  return (v % 1 === 0 ? v.toFixed(1) : String(v)).replace('.', ',');
}

export function StarsInput({ value, onChange, size = 40 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <div className="flex items-center justify-center gap-2" role="radiogroup" aria-label="Оценка">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} из 5`}
          onClick={() => onChange(n)}
          className="transition active:scale-90"
        >
          <Star
            style={{ width: size, height: size }}
            className={cn('transition-colors', n <= value ? 'fill-warn-500 text-warn-500' : 'fill-ink-100 text-ink-200')}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
