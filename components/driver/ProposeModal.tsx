'use client';

import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { Order } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EconomicsCard } from '@/components/shared/Economics';
import { formatMoney, formatVolume } from '@/lib/format';
import { cn } from '@/lib/cn';

const ETAS = [10, 15, 20, 30, 45];

/** «Предложить цену»: своя цена + через сколько минут водитель приедет */
export function ProposeModal({ order, defaultEta, commissionRate, onClose, onSubmit }: { order?: Order; defaultEta: number; commissionRate: number; onClose: () => void; onSubmit: (price: number, eta: number) => void }) {
  const [price, setPrice] = useState(0);
  const [eta, setEta] = useState(15);
  useEffect(() => {
    if (order) {
      setPrice(order.clientPrice + 200);
      setEta(ETAS.reduce((best, e) => (Math.abs(e - defaultEta) < Math.abs(best - defaultEta) ? e : best), ETAS[0]));
    }
  }, [order, defaultEta]);
  if (!order) return null;
  const diff = price - order.clientPrice;

  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title={`Заказ №${order.number}`}
      footer={
        <Button size="xl" block disabled={price < 300} onClick={() => onSubmit(price, eta)}>
          Отправить предложение
        </Button>
      }
    >
      <div className="text-sm text-ink-500">
        {formatVolume(order.volume)} · цена клиента <b className="text-ink-900">{formatMoney(order.clientPrice)}</b>
      </div>
      <div className="mt-4 text-[13px] font-semibold text-ink-700">Ваша цена</div>
      <div className="mt-1.5 flex items-center gap-3 rounded-3xl bg-ink-50 p-3">
        <button type="button" aria-label="Меньше" onClick={() => setPrice((p) => Math.max(300, p - 100))} className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm active:scale-95">
          <Minus className="size-5" />
        </button>
        <label className="flex flex-1 items-baseline justify-center gap-1">
          <input
            inputMode="numeric"
            style={{ width: `${Math.max(2, new Intl.NumberFormat('ru-RU').format(price).length) * 0.62}em` }}
            value={new Intl.NumberFormat('ru-RU').format(price)}
            onChange={(e) => setPrice(Number(e.target.value.replace(/\D/g, '')) || 0)}
            className="min-w-0 max-w-full bg-transparent text-center text-4xl font-extrabold tracking-[-0.03em] outline-none tabular"
            aria-label="Ваша цена"
          />
          <span className="text-xl font-bold text-ink-400">₽</span>
        </label>
        <button type="button" aria-label="Больше" onClick={() => setPrice((p) => p + 100)} className="flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm active:scale-95">
          <Plus className="size-5" />
        </button>
      </div>
      <div className={cn('mt-2 text-center text-sm font-semibold', diff > 0 ? 'text-warn-600' : diff < 0 ? 'text-ok-600' : 'text-ink-500')}>
        {diff === 0 ? 'Совпадает с ценой клиента' : diff > 0 ? `На ${formatMoney(diff)} выше цены клиента` : `На ${formatMoney(-diff)} ниже цены клиента`}
      </div>

      <div className="mt-5 text-[13px] font-semibold text-ink-700">Через сколько минут сможете приехать?</div>
      <div className="mt-1.5 grid grid-cols-5 gap-2">
        {ETAS.map((e) => (
          <button key={e} type="button" onClick={() => setEta(e)} className={cn('h-12 rounded-2xl text-sm font-bold transition', eta === e ? 'bg-brand-600 text-white shadow-glow' : 'bg-ink-50 text-ink-700 hover:bg-ink-100')}>
            {e} мин
          </button>
        ))}
      </div>

      <EconomicsCard className="mt-5" total={price} rate={commissionRate} />
    </Modal>
  );
}
