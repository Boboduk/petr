'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Mic, PhoneOff, Volume2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { maskPhone } from '@/lib/format';

/** Имитация звонка через подменный номер (в демо соединение не устанавливается) */
export function CallModal({ open, onClose, name, phone, color, photo }: { open: boolean; onClose: () => void; name: string; phone: string; color?: string; photo?: string }) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!open) return;
    setSec(0);
    const t = window.setInterval(() => setSec((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [open]);
  if (!open || typeof document === 'undefined') return null;
  const connected = sec >= 3;
  const mm = String(Math.floor((sec - 3) / 60)).padStart(2, '0');
  const ss = String((sec - 3) % 60).padStart(2, '0');

  return createPortal(
    <div className="fixed inset-0 z-[2500] flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[32px] bg-gradient-to-b from-ink-900 via-ink-900 to-brand-900 px-6 pb-8 pt-12 text-center text-white shadow-float animate-fade-up">
        <div className="relative mx-auto w-fit">
          {!connected && <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/40" />}
          <Avatar name={name} color={color} photo={photo} size={104} className="relative" />
        </div>
        <div className="mt-5 text-2xl font-bold">{name}</div>
        <div className="mt-1 text-sm text-white/60">{maskPhone(phone)} · через защищённый номер</div>
        <div className="mt-4 text-lg font-semibold tabular text-aqua-400">{connected ? `${mm}:${ss}` : 'Вызов…'}</div>
        <div className="mx-auto mt-2 max-w-[260px] rounded-xl bg-white/10 px-3 py-2 text-xs text-white/70">Демо-режим: реальный звонок не совершается</div>
        <div className="mt-10 flex items-center justify-center gap-6">
          <button className="flex size-14 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20" aria-label="Микрофон">
            <Mic className="size-6" />
          </button>
          <button onClick={onClose} className="flex size-18 items-center justify-center rounded-full bg-bad-500 shadow-lg transition hover:bg-bad-600 active:scale-95" aria-label="Завершить звонок">
            <PhoneOff className="size-7" />
          </button>
          <button className="flex size-14 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20" aria-label="Динамик">
            <Volume2 className="size-6" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
