'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, ChevronRight, Radar, ShieldAlert, Star, Wallet } from 'lucide-react';
import type { Order } from '@/types';
import { MapView, type MapMarker } from '@/components/map/MapView';
import { MapLayout } from '@/components/client/MapLayout';
import { OnlineToggle } from '@/components/driver/OnlineToggle';
import { FeedCard } from '@/components/driver/FeedCard';
import { ProposeModal } from '@/components/driver/ProposeModal';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatRating } from '@/components/ui/Stars';
import { useAction } from '@/components/ui/Toast';
import { useCurrentUser } from '@/hooks/useSession';
import { useNow } from '@/hooks/useNow';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { driverActiveOrder, driverFeed, driverPosition, unreadCount } from '@/lib/store/selectors';
import { makeOffer, setDriverOnline, withdrawOffer } from '@/lib/store/actions';
import { orderEconomics } from '@/lib/pricing';
import { formatMoney, formatVolume } from '@/lib/format';
import { STATUS_LABEL } from '@/lib/status';

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function DriverHomePage() {
  const run = useAction();
  const { db, user, driver } = useCurrentUser();
  const now = useNow(2000);
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [proposeFor, setProposeFor] = useState<Order | undefined>();
  const [focusId, setFocusId] = useState<string | null>(null);

  if (!driver || !user) return null;

  const active = driverActiveOrder(db, driver.id);
  const feed = driver.online ? driverFeed(db, driver) : [];
  const pos = driverPosition(db, driver, now);
  const today = startOfDay();
  const doneToday = db.orders.filter((o) => o.driverId === driver.id && o.status === 'completed' && (o.completedAt ?? 0) >= today);
  const earnedToday = doneToday.reduce((s, o) => s + orderEconomics(o.finalPrice ?? 0, o.commissionRate).driverIncome, 0);
  const unread = unreadCount(db, user.id);

  const markers: MapMarker[] = [
    { id: 'me', kind: 'me', position: pos },
    ...feed.map((f) => ({ id: f.order.id, kind: 'order' as const, position: f.order.location, label: `${formatVolume(f.order.volume)} · ${formatMoney(f.order.clientPrice)}`, active: focusId === f.order.id, onClick: () => setFocusId(f.order.id) })),
  ];

  const accept = (o: Order, eta: number) => run(() => makeOffer(o.id, driver.id, o.clientPrice, eta), 'Вы приняли цену клиента — ждём подтверждения');

  return (
    <>
      <MapLayout
        map={<MapView center={pos} zoom={13} markers={markers} fitTo={feed.length ? [pos, ...feed.map((f) => f.order.location)] : undefined} fitKey={`feed-${feed.length}`} padding={desktop ? { left: 480 } : undefined} />}
        overlay={
          <div className="flex justify-end">
            <Link href="/driver/notifications" className="pointer-events-auto relative flex size-10 items-center justify-center rounded-2xl bg-white/95 text-ink-700 shadow-card backdrop-blur" aria-label="Уведомления">
              <Bell className="size-5" />
              {unread > 0 && <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-bad-500 px-1 text-[11px] font-bold text-white">{unread}</span>}
            </Link>
          </div>
        }
      >
        <div className="space-y-4 px-4 pb-8 pt-3 sm:px-5 lg:pt-5">
          <div className="flex items-center gap-3">
            <Avatar name={driver.name} photo={driver.photo} color={driver.avatarColor} size={48} />
            <div className="min-w-0 flex-1">
              <div className="text-lg font-extrabold tracking-[-0.02em] text-ink-900">{driver.name}</div>
              <div className="flex items-center gap-2 text-sm text-ink-500">
                {driver.vehicle.brand} · {formatVolume(driver.vehicle.tankVolume)}
                {driver.verification !== 'verified' && (
                  <Badge tone="warning" className="py-0.5">
                    на проверке
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {driver.blocked && (
            <div className="flex gap-3 rounded-2xl bg-bad-50 p-4 text-sm text-bad-600">
              <ShieldAlert className="size-5 shrink-0" /> Аккаунт заблокирован администратором. Выход на линию недоступен.
            </div>
          )}

          <OnlineToggle online={driver.online} disabled={driver.blocked} onChange={(v) => run(() => setDriverOnline(driver.id, v), v ? 'Вы на линии' : 'Вы ушли с линии')} />

          {active && (
            <Link href={`/driver/order/${active.id}`} className="flex items-center gap-3 rounded-3xl bg-ink-900 p-4 text-white shadow-float animate-fade-up">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-aqua-500 text-ink-900">
                <Radar className="size-5.5" />
              </span>
              <div className="flex-1">
                <div className="text-xs text-white/60">Активный заказ №{active.number}</div>
                <div className="font-bold">{active.status === 'driver_selected' ? 'Клиент выбрал вас — можно выезжать!' : STATUS_LABEL[active.status]}</div>
              </div>
              <ChevronRight className="size-5 text-white/50" />
            </Link>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white p-3 shadow-card">
              <Wallet className="size-4.5 text-brand-600" />
              <div className="mt-1.5 text-lg font-extrabold text-ink-900 tabular">{formatMoney(earnedToday)}</div>
              <div className="text-[11px] text-ink-500">доход сегодня</div>
            </div>
            <div className="rounded-2xl bg-white p-3 shadow-card">
              <Radar className="size-4.5 text-brand-600" />
              <div className="mt-1.5 text-lg font-extrabold text-ink-900">{doneToday.length}</div>
              <div className="text-[11px] text-ink-500">доставок сегодня</div>
            </div>
            <div className="rounded-2xl bg-white p-3 shadow-card">
              <Star className="size-4.5 fill-warn-500 text-warn-500" />
              <div className="mt-1.5 text-lg font-extrabold text-ink-900">{formatRating(driver.rating)}</div>
              <div className="text-[11px] text-ink-500">рейтинг</div>
            </div>
          </div>

          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[17px] font-extrabold tracking-[-0.02em] text-ink-900">Заявки рядом</h2>
              {driver.online && <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">{feed.length}</span>}
            </div>
            {!driver.online ? (
              <div className="rounded-3xl bg-white shadow-card">
                <EmptyState icon={<Radar className="size-7" />} title="Вы не на линии" text="Включите «Я на линии», чтобы видеть заявки клиентов рядом и предлагать цену" />
              </div>
            ) : feed.length === 0 ? (
              <div className="rounded-3xl bg-white p-6 text-center shadow-card">
                <div className="relative mx-auto flex size-16 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/25" />
                  <span className="relative flex size-12 items-center justify-center rounded-full bg-brand-600 text-white">
                    <Radar className="size-6" />
                  </span>
                </div>
                <div className="mt-3 font-bold text-ink-900">Ищем заявки рядом…</div>
                <div className="text-sm text-ink-500">Новая заявка появится здесь через несколько секунд</div>
              </div>
            ) : (
              <div className="space-y-3">
                {feed.map((f) => (
                  <FeedCard
                    key={f.order.id}
                    item={f}
                    now={now}
                    highlighted={focusId === f.order.id}
                    disabled={!!active}
                    onFocus={() => setFocusId(f.order.id)}
                    onAccept={() => accept(f.order, f.etaMin)}
                    onPropose={() => setProposeFor(f.order)}
                    onWithdraw={() => run(() => withdrawOffer(f.order.id, driver.id), 'Предложение отозвано')}
                  />
                ))}
                {active && <p className="text-center text-xs text-ink-400">Завершите текущий заказ, чтобы откликаться на новые</p>}
              </div>
            )}
          </div>
        </div>
      </MapLayout>

      <ProposeModal
        order={proposeFor}
        defaultEta={feed.find((f) => f.order.id === proposeFor?.id)?.etaMin ?? 15}
        commissionRate={db.settings.commissionRate}
        onClose={() => setProposeFor(undefined)}
        onSubmit={(price, eta) => {
          if (proposeFor && run(() => makeOffer(proposeFor.id, driver.id, price, eta), 'Предложение отправлено клиенту')) setProposeFor(undefined);
        }}
      />
    </>
  );
}
