'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarClock, Info, MapPin, Minus, Plus, Repeat, Search, Zap } from 'lucide-react';
import type { LatLng, ScheduleType } from '@/types';
import { MapView, type MapMarker } from '@/components/map/MapView';
import { MapLayout } from '@/components/client/MapLayout';
import { AddressField } from '@/components/client/AddressField';
import { OrderStepper } from '@/components/client/OrderStepper';
import { VolumePicker } from '@/components/client/VolumePicker';
import { WaterTypePicker } from '@/components/client/WaterTypePicker';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Field';
import { Segmented } from '@/components/ui/Segmented';
import { useAction, useToast } from '@/components/ui/Toast';
import { useCurrentUser } from '@/hooks/useSession';
import { useNow } from '@/hooks/useNow';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { currentCity, nearbyDrivers } from '@/lib/store/selectors';
import { createOrder } from '@/lib/store/actions';
import { clearDraft, loadDraft, nextOccurrence, saveDraft, type OrderDraft } from '@/lib/draft';
import { geocode, reverseGeocode, shortAddress } from '@/lib/geo';
import { priceRange, recommendedPrice } from '@/lib/pricing';
import { FREQUENCY_LABEL, SCHEDULE_LABEL, WATER_TYPE_FULL, WEEKDAYS } from '@/lib/status';
import { formatDateTime, formatMoney, formatVolume } from '@/lib/format';
import { cn } from '@/lib/cn';

const COMMENT_TAGS = ['Нужен длинный шланг', 'Подъезд к дому возможен', 'Позвоните за 10 минут', 'Ёмкость во дворе'];

function scheduledAtOf(d: OrderDraft): number | undefined {
  if (d.scheduleType === 'scheduled') return new Date(`${d.date}T${d.time}`).getTime();
  if (d.scheduleType === 'regular') return nextOccurrence(d.regular);
  return undefined;
}

function Wizard() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const run = useAction();
  const { db, user } = useCurrentUser();
  const city = currentCity(db);
  const now = useNow(4000);
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [draft, setDraftState] = useState<OrderDraft>(() => loadDraft());
  const initialStep = Math.min(3, Math.max(0, Number(params.get('step') ?? 0)));
  const [step, setStep] = useState(draft.address ? initialStep : 0);
  const [maxReached, setMaxReached] = useState(step);

  const setDraft = (patch: Partial<OrderDraft>) =>
    setDraftState((d) => {
      const next = { ...d, ...patch };
      saveDraft(next);
      return next;
    });

  const recommended = recommendedPrice(draft.volume, draft.waterType);
  const price = draft.price ?? recommended;
  const [lo, hi] = priceRange(draft.volume, draft.waterType);
  const point: LatLng = draft.location ?? city.center;
  const nearby = useMemo(() => nearbyDrivers(db, point, now, 6), [db, point, now]);

  const markers: MapMarker[] = [
    ...nearby.map((n) => ({ id: n.driver.id, kind: 'truck' as const, position: n.position, busy: n.busy })),
    ...(draft.location ? [{ id: 'me', kind: 'client' as const, position: draft.location }] : []),
  ];

  const go = (i: number) => {
    setStep(i);
    setMaxReached((m) => Math.max(m, i));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validStep = (): string | null => {
    if (step === 0 && !draft.address.trim()) return 'Укажите адрес доставки';
    if (step === 1 && (!draft.volume || draft.volume <= 0)) return 'Укажите объём';
    if (step === 2 && draft.scheduleType === 'scheduled') {
      const at = scheduledAtOf(draft);
      if (!at || Number.isNaN(at) || at < Date.now()) return 'Выберите дату и время в будущем';
    }
    if (step === 3 && (!price || price < 300)) return 'Укажите цену от 300 ₽';
    return null;
  };

  const next = () => {
    const err = validStep();
    if (err) return toast.error(err);
    if (step === 0 && !draft.location) {
      const g = geocode(draft.address, city);
      setDraft({ address: g.address, location: g.location });
    }
    if (step < 3) return go(step + 1);
    submit();
  };

  const submit = () => {
    if (!user) return;
    const g = draft.location ? { address: draft.address, location: draft.location } : geocode(draft.address, city);
    const order = run(() =>
      createOrder(user.id, {
        address: g.address,
        location: g.location,
        volume: draft.volume,
        waterType: draft.waterType,
        scheduleType: draft.scheduleType,
        scheduledAt: scheduledAtOf(draft),
        regular: draft.scheduleType === 'regular' ? draft.regular : undefined,
        clientPrice: price,
        comment: draft.comment,
      }),
    );
    if (order) {
      clearDraft();
      saveDraft({ ...loadDraft(), address: g.address, location: g.location, volume: draft.volume });
      router.replace(`/client/order/${order.id}`);
    }
  };

  return (
    <MapLayout
      mapHeight={step === 0 ? 'h-[40dvh]' : 'h-[24dvh]'}
      map={<MapView center={point} zoom={city.zoom + 1} markers={markers} onMapClick={(p) => setDraft({ location: p, address: reverseGeocode(p, city) })} padding={desktop ? { left: 480 } : undefined} />}
    >
      <div className="flex min-h-[calc(76dvh-28px)] flex-col lg:min-h-full">
        <div className="sticky top-0 z-20 space-y-4 bg-[#f6f9fc]/95 px-4 pb-3 pt-3 backdrop-blur sm:px-5 lg:pt-5">
          <div className="flex items-center gap-3">
            <button onClick={() => (step === 0 ? router.push('/client') : go(step - 1))} aria-label="Назад" className="flex size-10 items-center justify-center rounded-2xl bg-white text-ink-700 shadow-card active:scale-95">
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <div className="text-xs font-semibold text-ink-400">Шаг {step + 1} из 5</div>
              <div className="text-lg font-extrabold tracking-[-0.02em] text-ink-900">Новый заказ воды</div>
            </div>
          </div>
          <OrderStepper current={step} onStep={go} maxReached={maxReached} />
        </div>

        <div key={step} className="flex-1 space-y-4 px-4 pb-4 pt-2 animate-fade-up sm:px-5">
          {step === 0 && (
            <>
              <h2 className="text-xl font-extrabold tracking-[-0.02em]">Куда доставить воду?</h2>
              <AddressField autoFocus={!draft.address} large city={city} value={draft.address} onChange={(address, location) => setDraft({ address, location: location ?? (address ? draft.location : undefined) })} />
              <div className="flex items-start gap-2.5 rounded-2xl bg-white p-3.5 text-sm text-ink-600 shadow-card">
                <MapPin className="mt-0.5 size-4.5 shrink-0 text-brand-600" />
                Нажмите на карту, чтобы уточнить точку подъезда — водитель увидит её в навигаторе.
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-xl font-extrabold tracking-[-0.02em]">Сколько воды нужно?</h2>
              <VolumePicker value={draft.volume} onChange={(volume) => setDraft({ volume, price: undefined })} />
              <div className="pt-2 text-[15px] font-bold text-ink-900">Тип воды</div>
              <WaterTypePicker value={draft.waterType} onChange={(waterType) => setDraft({ waterType, price: undefined })} />
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-extrabold tracking-[-0.02em]">Когда доставить?</h2>
              {(
                [
                  { v: 'now', icon: Zap, title: 'Как можно скорее', text: 'Водовоз приедет максимально быстро · обычно 15–30 мин' },
                  { v: 'scheduled', icon: CalendarClock, title: 'Запланировать', text: 'Выберите удобные дату и время' },
                  { v: 'regular', icon: Repeat, title: 'Регулярная доставка', text: 'Например, 5 м³ каждую неделю' },
                ] as Array<{ v: ScheduleType; icon: typeof Zap; title: string; text: string }>
              ).map(({ v, icon: Icon, title, text }) => {
                const active = draft.scheduleType === v;
                return (
                  <div key={v} className={cn('rounded-3xl bg-white p-1 shadow-card ring-inset transition', active ? 'ring-2 ring-brand-500' : 'ring-1 ring-transparent')}>
                    <button type="button" onClick={() => setDraft({ scheduleType: v })} className="flex w-full items-center gap-3 rounded-[20px] p-3 text-left">
                      <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-2xl', active ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600')}>
                        <Icon className="size-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-bold text-ink-900">{title}</span>
                        <span className="block text-xs text-ink-500">{text}</span>
                      </span>
                      <span className={cn('size-5 shrink-0 rounded-full border-2', active ? 'border-[6px] border-brand-600' : 'border-ink-300')} />
                    </button>
                    {active && v === 'scheduled' && (
                      <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                        <Input label="Дата" type="date" value={draft.date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDraft({ date: e.target.value })} />
                        <Input label="Время" type="time" value={draft.time} onChange={(e) => setDraft({ time: e.target.value })} />
                      </div>
                    )}
                    {active && v === 'regular' && (
                      <div className="space-y-3 px-3 pb-3">
                        <Segmented
                          size="sm"
                          value={draft.regular.frequency}
                          onChange={(frequency) => setDraft({ regular: { ...draft.regular, frequency } })}
                          options={[
                            { value: 'weekly', label: 'Каждую неделю' },
                            { value: 'biweekly', label: 'Раз в 2 нед.' },
                            { value: 'monthly', label: 'Раз в месяц' },
                          ]}
                        />
                        <div className="grid grid-cols-7 gap-1">
                          {WEEKDAYS.map((w, i) => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => setDraft({ regular: { ...draft.regular, weekday: i + 1 } })}
                              className={cn('h-10 rounded-xl text-sm font-bold transition', draft.regular.weekday === i + 1 ? 'bg-brand-600 text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100')}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                        <Input label="Время" type="time" value={draft.regular.time} onChange={(e) => setDraft({ regular: { ...draft.regular, time: e.target.value } })} />
                        <div className="rounded-2xl bg-aqua-50 p-3 text-xs text-ink-600">
                          {FREQUENCY_LABEL[draft.regular.frequency]}, {formatVolume(draft.volume)}. Первая доставка — <b>{formatDateTime(nextOccurrence(draft.regular))}</b>. Расписание можно приостановить в профиле.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-extrabold tracking-[-0.02em]">Сколько готовы заплатить?</h2>
              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <button type="button" aria-label="Уменьшить" onClick={() => setDraft({ price: Math.max(300, price - 100) })} className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-ink-50 text-ink-700 active:scale-95">
                    <Minus className="size-5" />
                  </button>
                  <label className="flex min-w-0 flex-1 items-baseline justify-center gap-1">
                    <input
                      inputMode="numeric"
                      style={{ width: `${Math.max(2, new Intl.NumberFormat('ru-RU').format(price).length) * 0.62}em` }}
                      value={new Intl.NumberFormat('ru-RU').format(price)}
                      onChange={(e) => {
                        const n = Number(e.target.value.replace(/\D/g, ''));
                        setDraft({ price: Math.min(200000, n) });
                      }}
                      className="min-w-0 max-w-full bg-transparent text-center text-[40px] font-extrabold tracking-[-0.03em] text-ink-900 outline-none tabular"
                      aria-label="Желаемая цена, ₽"
                    />
                    <span className="text-2xl font-bold text-ink-400">₽</span>
                  </label>
                  <button type="button" aria-label="Увеличить" onClick={() => setDraft({ price: price + 100 })} className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-ink-50 text-ink-700 active:scale-95">
                    <Plus className="size-5" />
                  </button>
                </div>
                <p className="mt-2 text-center text-sm text-ink-500">Водители смогут принять вашу цену или предложить свою</p>
                <div className="mt-4">
                  <div className="relative h-2 rounded-full bg-gradient-to-r from-warn-500 via-ok-500 to-brand-500">
                    <span
                      className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-ink-900 shadow"
                      style={{ left: `${Math.min(100, Math.max(0, ((price - lo * 0.8) / (hi * 1.15 - lo * 0.8)) * 100))}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] font-semibold text-ink-400">
                    <span>Дольше ждать</span>
                    <span>Оптимально</span>
                    <span>Быстрее найдём</span>
                  </div>
                </div>
                {price !== recommended && (
                  <button type="button" onClick={() => setDraft({ price: recommended })} className="mt-3 w-full rounded-xl bg-brand-50 py-2 text-sm font-semibold text-brand-700">
                    Рекомендуемая цена: {formatMoney(recommended)}
                  </button>
                )}
                {price === recommended && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-ok-600">
                    <Info className="size-3.5 shrink-0" /> Рекомендуемая цена · обычно {new Intl.NumberFormat('ru-RU').format(lo)}–{formatMoney(hi)}
                  </div>
                )}
              </Card>

              <Textarea label="Комментарий для водителя" placeholder="Например: нужен длинный шланг, подъезд к дому возможен" value={draft.comment} onChange={(e) => setDraft({ comment: e.target.value })} />
              <div className="-mt-1 flex flex-wrap gap-2">
                {COMMENT_TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDraft({ comment: draft.comment.includes(t) ? draft.comment : [draft.comment.trim(), t].filter(Boolean).join(', ') })}
                    className="rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold text-ink-600 shadow-sm ring-1 ring-ink-100 hover:ring-brand-300"
                  >
                    + {t}
                  </button>
                ))}
              </div>

              <Card className="divide-y divide-ink-100 px-4">
                {[
                  ['Адрес', shortAddress(draft.address)],
                  ['Вода', `${formatVolume(draft.volume)} · ${WATER_TYPE_FULL[draft.waterType]}`],
                  ['Когда', draft.scheduleType === 'now' ? SCHEDULE_LABEL.now : `${SCHEDULE_LABEL[draft.scheduleType]} · ${formatDateTime(scheduledAtOf(draft) ?? Date.now())}`],
                  ['Ваша цена', formatMoney(price)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-3 text-sm">
                    <span className="text-ink-500">{k}</span>
                    <span className="text-right font-semibold text-ink-900">{v}</span>
                  </div>
                ))}
              </Card>
            </>
          )}
        </div>

        <div className="sticky bottom-0 z-20 border-t border-ink-100 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-5">
          <Button size="xl" block onClick={next} icon={step === 3 ? <Search className="size-5" /> : undefined} iconRight={step < 3 ? <ArrowRight className="size-5" /> : undefined}>
            {step === 3 ? 'Найти водовоз' : 'Далее'}
          </Button>
        </div>
      </div>
    </MapLayout>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense>
      <Wizard />
    </Suspense>
  );
}
