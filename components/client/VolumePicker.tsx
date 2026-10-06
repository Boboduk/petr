'use client';

import { Minus, Plus } from 'lucide-react';
import { ChoiceChip } from '@/components/ui/Segmented';
import { cn } from '@/lib/cn';

export const VOLUME_PRESETS = [1, 2, 3, 5, 10];

/** Объём воды: быстрые кнопки + свой объём */
export function VolumePicker({ value, onChange, compact }: { value: number; onChange: (v: number) => void; compact?: boolean }) {
  const custom = !VOLUME_PRESETS.includes(value);
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {VOLUME_PRESETS.map((v) => (
          <ChoiceChip key={v} active={value === v} onClick={() => onChange(v)} className={cn('flex flex-col items-center justify-center', compact ? 'h-12' : 'h-16')}>
            <span className={cn('font-extrabold leading-none', compact ? 'text-base' : 'text-xl')}>{v}</span>
            <span className={cn('text-[11px] font-semibold', value === v ? 'text-white/75' : 'text-ink-400')}>м³</span>
          </ChoiceChip>
        ))}
      </div>
      {!compact && (
        <div className={cn('mt-3 flex items-center justify-between rounded-2xl px-4 py-2.5 ring-1 ring-inset', custom ? 'bg-brand-50 ring-brand-200' : 'bg-white ring-ink-200')}>
          <span className="text-sm font-semibold text-ink-700">Свой объём</span>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Меньше" onClick={() => onChange(Math.max(0.5, Math.round((value - 0.5) * 2) / 2))} className="flex size-9 items-center justify-center rounded-xl bg-white text-ink-700 shadow-sm ring-1 ring-ink-100 active:scale-95">
              <Minus className="size-4" />
            </button>
            <label className="flex items-baseline gap-1">
              <input
                type="number"
                min={0.5}
                max={30}
                step={0.5}
                value={value}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(',', '.'));
                  if (!Number.isNaN(n)) onChange(Math.min(30, Math.max(0.5, n)));
                }}
                className="w-12 bg-transparent text-center text-lg font-extrabold text-ink-900 outline-none tabular"
                aria-label="Объём, м³"
              />
              <span className="text-sm font-semibold text-ink-500">м³</span>
            </label>
            <button type="button" aria-label="Больше" onClick={() => onChange(Math.min(30, value + 0.5))} className="flex size-9 items-center justify-center rounded-xl bg-white text-ink-700 shadow-sm ring-1 ring-ink-100 active:scale-95">
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
