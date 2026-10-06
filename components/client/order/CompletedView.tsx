'use client';

import { useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import type { Driver, Order } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { StarsInput } from '@/components/ui/Stars';
import { useAction } from '@/components/ui/Toast';
import { rateOrder } from '@/lib/store/actions';
import { formatDateTime, formatMoney, formatVolume } from '@/lib/format';
import { shortAddress } from '@/lib/geo';
import { WATER_TYPE_FULL } from '@/lib/status';

const LABELS = ['', 'Плохо', 'Так себе', 'Нормально', 'Хорошо', 'Отлично!'];
const TAGS = ['Вовремя', 'Вежливый', 'Чистая цистерна', 'Аккуратно', 'Помог со шлангом'];

/** «Заказ завершён» + оценка водителя */
export function CompletedView({ order, driver, onRepeat }: { order: Order; driver?: Driver; onRepeat: () => void }) {
  const run = useAction();
  const [stars, setStars] = useState(5);
  const [text, setText] = useState('');

  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-white p-5 text-center shadow-card">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-ok-50 text-ok-500">
          <CheckCircle2 className="size-9" />
        </div>
        <div className="mt-3 text-2xl font-extrabold tracking-[-0.03em] text-ink-900">Заказ завершён</div>
        <div className="text-sm text-ink-500">{order.completedAt && formatDateTime(order.completedAt)}</div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-left">
          {[
            ['Объём', formatVolume(order.volume)],
            ['Цена', formatMoney(order.finalPrice)],
            ['Водитель', driver?.name ?? '—'],
            ['Автомобиль', driver?.vehicle.brand ?? '—'],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-ink-50 p-3">
              <div className="text-xs text-ink-400">{k}</div>
              <div className="font-bold text-ink-900">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-2xl bg-ink-50 p-3 text-left text-sm text-ink-600">
          {WATER_TYPE_FULL[order.waterType]} · {shortAddress(order.address)}
        </div>
      </div>

      {driver && !order.rating && (
        <div className="rounded-3xl bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <Avatar name={driver.name} photo={driver.photo} color={driver.avatarColor} size={48} />
            <div>
              <div className="text-lg font-extrabold tracking-[-0.02em] text-ink-900">Оцените водителя</div>
              <div className="text-sm text-ink-500">Как прошла доставка? Водитель — {driver.name}</div>
            </div>
          </div>
          <div className="mt-5">
            <StarsInput value={stars} onChange={setStars} />
            <div className="mt-2 text-center text-sm font-semibold text-ink-600">{LABELS[stars]}</div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {TAGS.map((t) => (
              <button key={t} type="button" onClick={() => setText((v) => (v.includes(t) ? v : [v.trim(), t].filter(Boolean).join(', ')))} className="rounded-full bg-ink-50 px-3 py-1.5 text-[13px] font-semibold text-ink-600 hover:bg-brand-50 hover:text-brand-700">
                {t}
              </button>
            ))}
          </div>
          <Textarea className="mt-4" placeholder="Оставьте отзыв" value={text} onChange={(e) => setText(e.target.value)} />
          <Button size="lg" block className="mt-4" onClick={() => run(() => rateOrder(order.id, stars, text), 'Спасибо за оценку!')}>
            Оценить
          </Button>
        </div>
      )}

      {order.rating && (
        <div className="rounded-3xl bg-white p-5 text-center shadow-card">
          <div className="text-sm text-ink-500">Ваша оценка</div>
          <div className="mt-1 text-3xl tracking-widest text-warn-500">{'★'.repeat(order.rating)}<span className="text-ink-200">{'★'.repeat(5 - order.rating)}</span></div>
          {order.review && <p className="mt-2 text-sm text-ink-600">«{order.review}»</p>}
        </div>
      )}

      <Button size="lg" variant="secondary" block icon={<RotateCcw className="size-4.5" />} onClick={onRepeat}>
        Заказать снова
      </Button>
    </div>
  );
}

export function CancelledView({ order, onRepeat }: { order: Order; onRepeat: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-white p-5 text-center shadow-card">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-bad-50 text-bad-500">
          <XCircle className="size-9" />
        </div>
        <div className="mt-3 text-2xl font-extrabold tracking-[-0.03em] text-ink-900">Заказ отменён</div>
        <div className="mt-1 text-sm text-ink-500">{order.cancelReason ?? 'Без указания причины'}</div>
        <div className="mt-1 text-xs text-ink-400">{order.cancelledAt && formatDateTime(order.cancelledAt)}</div>
      </div>
      <Button size="lg" block icon={<RotateCcw className="size-4.5" />} onClick={onRepeat}>
        Оформить заново
      </Button>
    </div>
  );
}
