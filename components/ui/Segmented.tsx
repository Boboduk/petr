'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface Option<T extends string> {
  value: T;
  label: ReactNode;
  hint?: ReactNode;
}

export function Segmented<T extends string>({ value, onChange, options, className, size = 'md' }: { value: T; onChange: (v: T) => void; options: Option<T>[]; className?: string; size?: 'sm' | 'md' }) {
  return (
    <div className={cn('flex gap-1 rounded-2xl bg-ink-100 p-1', className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 whitespace-nowrap rounded-xl px-3 font-semibold transition',
            size === 'sm' ? 'h-8 text-[13px]' : 'h-10 text-sm',
            o.value === value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Крупные карточки-чипы выбора (объём, тип воды, режим доставки) */
export function ChoiceChip({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-2xl text-left font-semibold ring-1 ring-inset transition active:scale-[0.97]',
        active ? 'bg-brand-600 text-white ring-brand-600 shadow-glow' : 'bg-white text-ink-800 ring-ink-200 hover:ring-brand-300',
        className,
      )}
    >
      {children}
    </button>
  );
}
