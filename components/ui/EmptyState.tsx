import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function EmptyState({ icon, title, text, action, className }: { icon: ReactNode; title: string; text?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <div className="mb-4 flex size-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600">{icon}</div>
      <div className="text-base font-bold text-ink-900">{title}</div>
      {text && <p className="mt-1.5 max-w-xs text-sm text-ink-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn('inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent', className)} />;
}
