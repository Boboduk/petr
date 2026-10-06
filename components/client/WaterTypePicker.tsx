'use client';

import { Droplet, GlassWater, Wrench } from 'lucide-react';
import type { WaterType } from '@/types';
import { WATER_TYPE_FULL, WATER_TYPE_HINT } from '@/lib/status';
import { cn } from '@/lib/cn';

const ICONS: Record<WaterType, typeof Droplet> = { drinking: GlassWater, household: Droplet, technical: Wrench };
const ORDER: WaterType[] = ['drinking', 'technical', 'household'];

export function WaterTypePicker({ value, onChange }: { value: WaterType; onChange: (v: WaterType) => void }) {
  return (
    <div className="space-y-2">
      {ORDER.map((t) => {
        const Icon = ICONS[t];
        const active = value === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            aria-pressed={active}
            className={cn('flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 ring-inset transition', active ? 'bg-brand-50 ring-2 ring-brand-500' : 'bg-white ring-ink-200 hover:ring-brand-300')}
          >
            <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', active ? 'bg-brand-600 text-white' : 'bg-ink-50 text-ink-500')}>
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-ink-900">{WATER_TYPE_FULL[t]}</span>
              <span className="block text-xs text-ink-500">{WATER_TYPE_HINT[t]}</span>
            </span>
            <span className={cn('size-5 shrink-0 rounded-full border-2 transition', active ? 'border-[6px] border-brand-600' : 'border-ink-300')} />
          </button>
        );
      })}
    </div>
  );
}
