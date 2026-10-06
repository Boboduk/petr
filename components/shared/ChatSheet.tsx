'use client';

import { useEffect, useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import type { Order } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { sendMessage } from '@/lib/store/actions';
import { useNow } from '@/hooks/useNow';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/cn';

const QUICK = {
  client: ['Нужен длинный шланг', 'Ворота открыты', 'Позвоните, как подъедете', 'Где вы сейчас?'],
  driver: ['Подъезжаю', 'Я на месте', 'Где удобно встать?', 'Буду через 5 минут'],
};

/** Чат внутри заказа (демо: собеседник-симулятор отвечает автоматически) */
export function ChatSheet({ open, onClose, order, me, peerName, peerColor }: { open: boolean; onClose: () => void; order: Order; me: 'client' | 'driver'; peerName: string; peerColor?: string }) {
  const [text, setText] = useState('');
  const now = useNow(500);
  const listRef = useRef<HTMLDivElement>(null);
  const visible = order.messages.filter((m) => m.createdAt <= now);
  const typing = order.messages.some((m) => m.createdAt > now);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [visible.length, typing, open]);

  const send = (t: string) => {
    if (!t.trim()) return;
    sendMessage(order.id, me, t);
    setText('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <Avatar name={peerName} color={peerColor} size={40} />
          <div>
            <div className="text-base font-bold">{peerName}</div>
            <div className="text-xs font-medium text-ok-600">{typing ? 'печатает…' : 'в сети'}</div>
          </div>
        </div>
      }
      bodyClassName="px-0! pb-0! flex flex-col"
      footer={
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <div className="no-scrollbar -mx-1 mb-3 flex gap-2 overflow-x-auto px-1">
            {QUICK[me].map((q) => (
              <button key={q} type="button" onClick={() => send(q)} className="shrink-0 rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-semibold text-brand-700 hover:bg-brand-100">
                {q}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Сообщение…"
              className="h-12 flex-1 rounded-2xl bg-ink-50 px-4 text-[15px] outline-none ring-1 ring-inset ring-ink-100 focus:bg-white focus:ring-2 focus:ring-brand-500"
            />
            <button type="submit" aria-label="Отправить" className="flex size-12 items-center justify-center rounded-2xl bg-brand-600 text-white transition hover:bg-brand-700 active:scale-95">
              <SendHorizontal className="size-5" />
            </button>
          </div>
        </form>
      }
    >
      <div ref={listRef} className="h-[46dvh] space-y-2 overflow-y-auto bg-ink-50 px-5 py-4 sm:h-[360px]">
        <div className="mx-auto mb-2 w-fit rounded-full bg-white px-3 py-1 text-xs text-ink-400 shadow-sm">Заказ №{order.number} · демо-чат</div>
        {visible.length === 0 && <div className="py-10 text-center text-sm text-ink-400">Напишите водителю — например, где удобно подъехать</div>}
        {visible.map((m) => (
          <div key={m.id} className={cn('flex', m.from === me ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug shadow-sm', m.from === me ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md bg-white text-ink-900')}>
              {m.text}
              <div className={cn('mt-0.5 text-right text-[10px]', m.from === me ? 'text-white/60' : 'text-ink-400')}>{formatTime(m.createdAt)}</div>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex">
            <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-1.5 animate-bounce rounded-full bg-ink-300" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
