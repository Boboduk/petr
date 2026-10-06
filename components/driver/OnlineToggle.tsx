'use client';

import { Power } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Большой переключатель «Я на линии / Я не на линии» */
export function OnlineToggle({ online, onChange, disabled }: { online: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={online}
      disabled={disabled}
      onClick={() => onChange(!online)}
      className={cn(
        'relative flex h-[76px] w-full items-center gap-4 overflow-hidden rounded-3xl px-4 text-left transition-all duration-300 active:scale-[0.99] disabled:opacity-50',
        online ? 'bg-gradient-to-r from-brand-600 to-aqua-500 text-white shadow-glow' : 'bg-white text-ink-900 shadow-card ring-1 ring-ink-100',
      )}
    >
      <span className={cn('relative flex size-12 shrink-0 items-center justify-center rounded-2xl transition', online ? 'bg-white text-brand-600' : 'bg-ink-100 text-ink-400')}>
        {online && <span className="absolute inset-0 animate-ping rounded-2xl bg-white/50" />}
        <Power className="relative size-6" strokeWidth={2.5} />
      </span>
      <span className="flex-1">
        <span className="block text-xl font-extrabold tracking-[-0.02em]">{online ? 'Я на линии' : 'Я не на линии'}</span>
        <span className={cn('block text-sm', online ? 'text-white/80' : 'text-ink-500')}>{online ? 'Получаете заявки рядом' : 'Нажмите, чтобы начать'}</span>
      </span>
      <span className={cn('relative h-8 w-14 shrink-0 rounded-full transition', online ? 'bg-white/30' : 'bg-ink-200')}>
        <span className={cn('absolute top-1 size-6 rounded-full bg-white shadow transition-all', online ? 'left-7' : 'left-1')} />
      </span>
    </button>
  );
}
