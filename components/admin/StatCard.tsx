import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** KPI-плитка: одно число — одна мысль */
export function StatCard({ label, value, hint, icon, accent }: { label: string; value: ReactNode; hint?: ReactNode; icon: ReactNode; accent?: boolean }) {
  return (
    <div className={cn('rounded-3xl p-5 shadow-card', accent ? 'bg-ink-900 text-white' : 'bg-white')}>
      <div className="flex items-center justify-between">
        <span className={cn('text-sm font-semibold', accent ? 'text-white/60' : 'text-ink-500')}>{label}</span>
        <span className={cn('flex size-9 items-center justify-center rounded-xl', accent ? 'bg-white/10 text-aqua-400' : 'bg-brand-50 text-brand-600')}>{icon}</span>
      </div>
      <div className={cn('mt-3 text-[30px] font-extrabold leading-none tracking-[-0.03em] tabular', accent ? 'text-white' : 'text-ink-900')}>{value}</div>
      {hint && <div className={cn('mt-2 text-xs', accent ? 'text-white/50' : 'text-ink-400')}>{hint}</div>}
    </div>
  );
}
