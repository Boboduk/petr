'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const REASONS = ['Планы изменились', 'Долго ждать', 'Нашёл дешевле', 'Ошибся в адресе или объёме', 'Другое'];

export function CancelModal({ open, onClose, onConfirm, warning }: { open: boolean; onClose: () => void; onConfirm: (reason: string) => void; warning?: string }) {
  const [reason, setReason] = useState(REASONS[0]);
  return (
    <Modal open={open} onClose={onClose} title="Отменить заказ?" size="sm">
      {warning && <div className="mb-3 rounded-2xl bg-warn-50 p-3 text-sm text-warn-600">{warning}</div>}
      <div className="space-y-2">
        {REASONS.map((r) => (
          <button key={r} type="button" onClick={() => setReason(r)} className={cn('flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-[15px] font-semibold ring-1 ring-inset transition', reason === r ? 'bg-brand-50 text-ink-900 ring-brand-500' : 'text-ink-700 ring-ink-100 hover:bg-ink-50')}>
            {r}
            <span className={cn('size-5 rounded-full border-2', reason === r ? 'border-[6px] border-brand-600' : 'border-ink-300')} />
          </button>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <Button variant="ghost" size="lg" className="flex-1 bg-ink-100" onClick={onClose}>
          Не отменять
        </Button>
        <Button
          variant="danger"
          size="lg"
          className="flex-1 bg-bad-500 text-white"
          onClick={() => {
            onConfirm(reason);
            onClose();
          }}
        >
          Отменить
        </Button>
      </div>
    </Modal>
  );
}
