import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type Tone = 'neutral' | 'info' | 'progress' | 'success' | 'danger' | 'warning' | 'dark' | 'aqua';

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-600',
  info: 'bg-brand-50 text-brand-700',
  progress: 'bg-brand-600 text-white',
  success: 'bg-ok-50 text-ok-600',
  danger: 'bg-bad-50 text-bad-600',
  warning: 'bg-warn-50 text-warn-600',
  dark: 'bg-ink-900 text-white',
  aqua: 'bg-aqua-100 text-aqua-600',
};

export function Badge({ tone = 'neutral', children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
