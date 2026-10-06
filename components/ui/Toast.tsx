'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, Bell, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/cn';

type ToastKind = 'info' | 'success' | 'error';

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
  onClick?: () => void;
}

interface ToastApi {
  show: (t: Omit<ToastItem, 'id'>) => void;
  success: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
}

const Ctx = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (t: Omit<ToastItem, 'id'>) => {
      const id = Date.now() + Math.random();
      setItems((list) => [...list.slice(-2), { ...t, id }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, body) => show({ kind: 'success', title, body }),
      error: (title, body) => show({ kind: 'error', title, body }),
    }),
    [show],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[3000] flex flex-col items-center gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-end sm:p-5">
        {items.map((t) => (
          <div
            key={t.id}
            onClick={() => {
              t.onClick?.();
              dismiss(t.id);
            }}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm cursor-pointer items-start gap-3 rounded-2xl bg-ink-900/95 p-3.5 pr-3 text-white shadow-float backdrop-blur animate-fade-up',
            )}
          >
            <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl', t.kind === 'error' ? 'bg-bad-500' : t.kind === 'success' ? 'bg-ok-500' : 'bg-brand-500')}>
              {t.kind === 'error' ? <AlertCircle className="size-4.5" /> : t.kind === 'success' ? <CheckCircle2 className="size-4.5" /> : <Bell className="size-4.5" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold leading-snug">{t.title}</div>
              {t.body && <div className="mt-0.5 text-[13px] leading-snug text-white/70">{t.body}</div>}
            </div>
            <button
              aria-label="Скрыть"
              onClick={(e) => {
                e.stopPropagation();
                dismiss(t.id);
              }}
              className="text-white/50 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast() вне ToastProvider');
  return ctx;
}

/** Выполнить действие и показать ошибку доменной логики тостом */
export function useAction() {
  const toast = useToast();
  return useCallback(
    <T,>(fn: () => T, success?: string): T | undefined => {
      try {
        const r = fn();
        if (success) toast.success(success);
        return r;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Что-то пошло не так');
        return undefined;
      }
    },
    [toast],
  );
}
