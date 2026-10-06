import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-3xl bg-white shadow-card', className)} {...rest} />;
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <h3 className="text-[15px] font-bold tracking-[-0.01em] text-ink-900">{children}</h3>
      {action}
    </div>
  );
}

export function StepLabel({ n, children, done }: { n: number; children: ReactNode; done?: boolean }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span
        className={cn(
          'flex size-6 items-center justify-center rounded-full text-xs font-bold',
          done ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500',
        )}
      >
        {n}
      </span>
      <h3 className="text-[15px] font-bold text-ink-900">{children}</h3>
    </div>
  );
}

export function InfoRow({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 py-2 text-sm', className)}>
      <span className="text-ink-500">{label}</span>
      <span className="text-right font-semibold text-ink-900">{value}</span>
    </div>
  );
}
