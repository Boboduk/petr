'use client';

import { useState } from 'react';
import { Check, MapPinned } from 'lucide-react';
import { CITIES } from '@/data/cities';
import { ConfirmModal } from '@/components/ui/Modal';
import { switchCity } from '@/lib/store/actions';
import { cn } from '@/lib/cn';

/** Быстрое переключение тестового города (пересоздаёт демо-данные под город) */
export function CitySwitcher({ value }: { value: string }) {
  const [pending, setPending] = useState<string | null>(null);
  const city = CITIES.find((c) => c.id === pending);
  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CITIES.map((c) => (
          <button
            key={c.id}
            onClick={() => c.id !== value && setPending(c.id)}
            className={cn('flex items-center justify-between gap-2 rounded-2xl px-3.5 py-3 text-left ring-1 ring-inset transition', c.id === value ? 'bg-brand-50 ring-2 ring-brand-500' : 'bg-white ring-ink-200 hover:ring-brand-300')}
          >
            <span>
              <span className="block text-sm font-bold text-ink-900">{c.name}</span>
              <span className="block truncate text-[11px] text-ink-400">{c.region}</span>
            </span>
            {c.id === value ? <Check className="size-4.5 shrink-0 text-brand-600" /> : <MapPinned className="size-4 shrink-0 text-ink-300" />}
          </button>
        ))}
      </div>
      <ConfirmModal
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={() => pending && switchCity(pending)}
        title={`Переключить на ${city?.name ?? ''}?`}
        text="Демо-данные (водители, заказы, статистика) будут пересозданы для выбранного города. Демо-аккаунты сохранятся."
        confirmText="Переключить"
      />
    </>
  );
}
