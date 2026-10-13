'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Droplets, MapPin, MessageCircle, MessageSquareText, Navigation, Phone, Radar, XCircle } from 'lucide-react';
import type { LatLng } from '@/types';
import { MapView, type MapMarker } from '@/components/map/MapView';
import { MapLayout } from '@/components/client/MapLayout';
import { EconomicsCard } from '@/components/shared/Economics';
import { OrderTimeline } from '@/components/shared/OrderTimeline';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ChatSheet } from '@/components/shared/ChatSheet';
import { CallModal } from '@/components/shared/CallModal';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/Modal';
import { useAction, useToast } from '@/components/ui/Toast';
import { useCurrentUser } from '@/hooks/useSession';
import { useNow } from '@/hooks/useNow';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { deliveryProgress, driverActiveOrder, driverPosition, etaRemaining, findOrder, findUser, tripProgress } from '@/lib/store/selectors';
import { driverAdvance, driverDecline } from '@/lib/store/actions';
import { orderEconomics } from '@/lib/pricing';
import { pointAlong } from '@/lib/geo';
import { formatDateTime, formatMoney, formatVolume, maskPhone } from '@/lib/format';
import { STATUS_LABEL, WATER_TYPE_FULL } from '@/lib/status';

const ACTION: Record<string, { label: string; hint: string }> = {
  driver_selected: { label: 'Начать поездку', hint: 'Клиент выбрал вас. Нажмите, когда выезжаете' },
  en_route: { label: 'Я прибыл', hint: 'Нажмите, когда будете у адреса клиента' },
  arrived: { label: 'Начать слив воды', hint: 'Подключите шланг и начните подачу воды' },
  delivering: { label: 'Завершить доставку', hint: 'Нажмите после того, как вода залита' },
};

function DriverOrderScreen() {
  const id = useSearchParams().get('id');
  const router = useRouter();
  const run = useAction();
  const toast = useToast();
  const { db, driver } = useCurrentUser();
  const now = useNow(1000);
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [chat, setChat] = useState(false);
  const [call, setCall] = useState(false);
  const [decline, setDecline] = useState(false);

  if (!driver) return null;
  const active = driverActiveOrder(db, driver.id);
  const order = id ? findOrder(db, id) : active;

  if (!order || order.driverId !== driver.id) {
    return (
      <div className="flex min-h-[80dvh] items-center justify-center">
        <EmptyState
          icon={<Radar className="size-7" />}
          title="Нет активного заказа"
          text="Примите заявку в ленте — активный заказ появится здесь"
          action={
            <Link href="/driver">
              <Button>К заявкам</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const speed = db.settings.demoSpeed;
  const client = findUser(db, order.clientId);
  const pos = driverPosition(db, driver, now);
  const progress = tripProgress(order, now, speed);
  const eco = orderEconomics(order.finalPrice ?? order.clientPrice, order.commissionRate);
  const action = ACTION[order.status];
  const finished = order.status === 'completed' || order.status === 'cancelled';

  let route: LatLng[] | undefined;
  let routePassed: LatLng[] | undefined;
  if (order.status === 'en_route' && order.route) {
    const idx = Math.max(1, Math.ceil(progress * (order.route.length - 1)));
    routePassed = [...order.route.slice(0, idx), pointAlong(order.route, progress)];
    route = [pointAlong(order.route, progress), ...order.route.slice(idx)];
  } else if (order.status === 'driver_selected') {
    route = [pos, order.location];
  }
  const markers: MapMarker[] = [
    { id: 'client', kind: 'client', position: order.location },
    ...(finished ? [] : [{ id: 'me', kind: 'me' as const, position: pos, tag: order.status === 'en_route' ? `≈ ${etaRemaining(order, now, speed)} мин` : undefined }]),
  ];

  const advance = () => {
    const wasDelivering = order.status === 'delivering';
    run(() => driverAdvance(order.id, driver.id));
    if (wasDelivering) toast.success('Доставка завершена', `Ваш доход ${formatMoney(eco.driverIncome)}`);
  };

  return (
    <>
      <MapLayout
        mapHeight="h-[46dvh]"
        map={<MapView center={order.location} zoom={14} markers={markers} route={route} routePassed={routePassed} fitTo={route ? [pos, order.location, ...(order.route ?? [])] : undefined} fitKey={order.status} padding={desktop ? { left: 480, top: 60, right: 60, bottom: 60 } : { top: 60, bottom: 50 }} />}
        overlay={
          <div className="flex justify-between lg:hidden">
            <Link href="/driver" className="pointer-events-auto flex size-10 items-center justify-center rounded-2xl bg-white/95 text-ink-700 shadow-card" aria-label="Назад">
              <ArrowLeft className="size-5" />
            </Link>
            <span className="pointer-events-auto rounded-2xl bg-white/95 px-3 py-2.5 text-xs font-bold shadow-card">Заказ №{order.number}</span>
          </div>
        }
      >
        <div className="space-y-3 px-4 pb-8 pt-3 sm:px-5 lg:pt-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-ink-400">Заказ №{order.number}</div>
              <div className="text-xl font-extrabold tracking-[-0.02em] text-ink-900">{STATUS_LABEL[order.status]}</div>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {order.status === 'en_route' && (
            <div className="rounded-3xl bg-ink-900 p-4 text-white">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">До клиента</span>
                <span className="font-bold">≈ {etaRemaining(order, now, speed)} мин</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-aqua-400 transition-[width] duration-1000" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          )}
          {order.status === 'delivering' && (
            <div className="rounded-3xl bg-ink-900 p-4 text-white">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-white/70">
                  <Droplets className="size-4" /> Слив воды
                </span>
                <span className="font-bold tabular">
                  {(order.volume * deliveryProgress(order, now, speed)).toFixed(1).replace('.', ',')} / {formatVolume(order.volume)}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-aqua-400 transition-[width] duration-1000" style={{ width: `${deliveryProgress(order, now, speed) * 100}%` }} />
              </div>
            </div>
          )}

          {action && (
            <div>
              <Button size="xl" block onClick={advance} variant={order.status === 'delivering' ? 'success' : 'primary'}>
                {action.label}
              </Button>
              <p className="mt-1.5 text-center text-xs text-ink-400">{action.hint}</p>
            </div>
          )}

          {order.status === 'completed' && (
            <div className="rounded-3xl bg-white p-5 text-center shadow-card">
              <CheckCircle2 className="mx-auto size-12 text-ok-500" />
              <div className="mt-2 text-xl font-extrabold text-ink-900">Доставка завершена</div>
              <div className="text-sm text-ink-500">Ваш доход по заказу</div>
              <div className="mt-1 text-3xl font-extrabold text-ok-600 tabular">+{formatMoney(eco.driverIncome)}</div>
              {order.rating && <div className="mt-2 text-lg tracking-widest text-warn-500">{'★'.repeat(order.rating)}</div>}
              <Button className="mt-4" block size="lg" onClick={() => router.push('/driver')}>
                К новым заявкам
              </Button>
            </div>
          )}
          {order.status === 'cancelled' && (
            <div className="rounded-3xl bg-white p-5 text-center shadow-card">
              <XCircle className="mx-auto size-12 text-bad-500" />
              <div className="mt-2 text-xl font-extrabold text-ink-900">Заказ отменён</div>
              <div className="text-sm text-ink-500">{order.cancelReason}</div>
              <Button className="mt-4" block size="lg" onClick={() => router.push('/driver')}>
                К заявкам
              </Button>
            </div>
          )}

          <div className="rounded-3xl bg-white p-4 shadow-card">
            <div className="flex items-center gap-3">
              <Avatar name={client?.name ?? 'Клиент'} color={client?.avatarColor} size={48} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-ink-400">Клиент</div>
                <div className="font-bold text-ink-900">{client?.name}</div>
                <div className="text-sm text-ink-500">{client ? maskPhone(client.phone) : ''}</div>
              </div>
              {!finished && (
                <div className="flex gap-2">
                  <button onClick={() => setCall(true)} aria-label="Позвонить" className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 hover:bg-brand-100">
                    <Phone className="size-5" />
                  </button>
                  <button onClick={() => setChat(true)} aria-label="Написать" className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 hover:bg-brand-100">
                    <MessageCircle className="size-5" />
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex gap-2.5">
                <MapPin className="size-4.5 shrink-0 text-brand-600" />
                <span className="font-semibold text-ink-900">{order.address}</span>
              </div>
              <div className="flex gap-2.5">
                <Droplets className="size-4.5 shrink-0 text-brand-600" />
                <span className="text-ink-700">
                  {formatVolume(order.volume)} · {WATER_TYPE_FULL[order.waterType]}
                  {order.scheduledAt ? ` · ${formatDateTime(order.scheduledAt)}` : ''}
                </span>
              </div>
              {order.comment && (
                <div className="flex gap-2.5">
                  <MessageSquareText className="size-4.5 shrink-0 text-brand-600" />
                  <span className="text-ink-700">{order.comment}</span>
                </div>
              )}
            </div>
            {!finished && (
              <button onClick={() => toast.show({ kind: 'info', title: 'Навигатор', body: 'В продакшене откроется Яндекс Навигатор / 2ГИС с маршрутом до клиента' })} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink-50 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-100">
                <Navigation className="size-4" /> Открыть в навигаторе
              </button>
            )}
          </div>

          <EconomicsCard total={eco.total} rate={order.commissionRate} />

          <div className="rounded-3xl bg-white p-4 shadow-card">
            <div className="mb-3 font-bold text-ink-900">Статусы заказа</div>
            <OrderTimeline order={order} compact />
          </div>

          {(order.status === 'driver_selected' || order.status === 'en_route') && (
            <Button variant="ghost" block className="text-bad-600 hover:bg-bad-50" onClick={() => setDecline(true)}>
              Отказаться от заказа
            </Button>
          )}
        </div>
      </MapLayout>

      <ChatSheet open={chat} onClose={() => setChat(false)} order={order} me="driver" peerName={client?.name ?? 'Клиент'} peerColor={client?.avatarColor} />
      <CallModal open={call} onClose={() => setCall(false)} name={client?.name ?? 'Клиент'} phone={client?.phone ?? ''} color={client?.avatarColor} />
      <ConfirmModal
        open={decline}
        onClose={() => setDecline(false)}
        danger
        title="Отказаться от заказа?"
        text="Заказ вернётся в поиск, клиент выберет другого водителя. Частые отказы снижают рейтинг."
        confirmText="Отказаться"
        onConfirm={() => {
          run(() => driverDecline(order.id, driver.id), 'Вы отказались от заказа');
          router.push('/driver');
        }}
      />
    </>
  );
}

export default function DriverOrderPage() {
  return (
    <Suspense>
      <DriverOrderScreen />
    </Suspense>
  );
}
