'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronDown, FastForward, PackageSearch } from 'lucide-react';
import type { LatLng } from '@/types';
import { MapView, type MapMarker } from '@/components/map/MapView';
import { MapLayout } from '@/components/client/MapLayout';
import { OrderStepper } from '@/components/client/OrderStepper';
import { SearchingView } from '@/components/client/order/SearchingView';
import { OfferCard } from '@/components/client/order/OfferCard';
import { DriverDetailModal } from '@/components/client/order/DriverDetailModal';
import { TrackingView } from '@/components/client/order/TrackingView';
import { CancelledView, CompletedView } from '@/components/client/order/CompletedView';
import { CancelModal } from '@/components/client/order/CancelModal';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { OrderTimeline } from '@/components/shared/OrderTimeline';
import { ChatSheet } from '@/components/shared/ChatSheet';
import { CallModal } from '@/components/shared/CallModal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Segmented } from '@/components/ui/Segmented';
import { useAction } from '@/components/ui/Toast';
import { useCurrentUser } from '@/hooks/useSession';
import { useNow } from '@/hooks/useNow';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { deliveryProgress, driverPosition, etaRemaining, findDriver, findOrder, nearbyDrivers, tripProgress } from '@/lib/store/selectors';
import { cancelOrder, demoAdvance, offersSummary, selectOffer } from '@/lib/store/actions';
import { saveDraft, loadDraft } from '@/lib/draft';
import { pointAlong } from '@/lib/geo';
import { IN_DELIVERY, SCHEDULE_LABEL, WATER_TYPE_FULL } from '@/lib/status';
import { formatDateTime, formatMoney, formatVolume } from '@/lib/format';
import { cn } from '@/lib/cn';

type Sort = 'price' | 'time' | 'rating';

function ClientOrderScreen() {
  const id = useSearchParams().get('id') ?? undefined;
  const router = useRouter();
  const run = useAction();
  const { db, user } = useCurrentUser();
  const now = useNow(1000);
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [sort, setSort] = useState<Sort>('price');
  const [viewDriverId, setViewDriverId] = useState<string | null>(null);
  const [hoverDriverId, setHoverDriverId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const order = findOrder(db, id);
  const speed = db.settings.demoSpeed;
  const driver = findDriver(db, order?.driverId);

  const nearby = useMemo(() => (order ? nearbyDrivers(db, order.location, now, 6) : []), [db, order, now]);

  if (!order || order.clientId !== user?.id) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <EmptyState icon={<PackageSearch className="size-7" />} title="Заказ не найден" text="Возможно, он был удалён администратором" action={<Button onClick={() => router.push('/client')}>На главную</Button>} />
      </div>
    );
  }

  const searchWindow = 7500 / Math.max(0.25, speed);
  const phase: 'searching' | 'offers' | 'tracking' | 'done' | 'cancelled' =
    order.status === 'new' || order.status === 'searching'
      ? 'searching'
      : order.status === 'offers'
        ? now - order.createdAt < searchWindow && order.offers.length < 3
          ? 'searching'
          : 'offers'
        : IN_DELIVERY.includes(order.status)
          ? 'tracking'
          : order.status === 'completed'
            ? 'done'
            : 'cancelled';

  /* ---------- Предложения ---------- */
  const offers = order.offers
    .map((o) => ({ offer: o, driver: findDriver(db, o.driverId)! }))
    .filter((x) => x.driver)
    .sort((a, b) => (sort === 'price' ? a.offer.price - b.offer.price : sort === 'time' ? a.offer.etaMin - b.offer.etaMin : b.driver.rating - a.driver.rating));
  const bestPrice = Math.min(...offers.map((o) => o.offer.price));
  const bestTime = Math.min(...offers.map((o) => o.offer.etaMin));
  const bestRating = Math.max(...offers.map((o) => o.driver.rating));
  const badgeFor = (x: (typeof offers)[number]): Sort | undefined =>
    offers.length < 2 ? undefined : x.offer.price === bestPrice ? 'price' : x.offer.etaMin === bestTime ? 'time' : x.driver.rating === bestRating ? 'rating' : undefined;

  const viewed = offers.find((o) => o.driver.id === viewDriverId);

  /* ---------- Карта ---------- */
  const progress = tripProgress(order, now, speed);
  const driverPos: LatLng | undefined = driver ? driverPosition(db, driver, now) : undefined;
  let markers: MapMarker[] = [{ id: 'client', kind: 'client', position: order.location }];
  let route: LatLng[] | undefined;
  let routePassed: LatLng[] | undefined;
  let fitTo: LatLng[] | undefined;
  let fitKey: string = phase;

  if (phase === 'searching') {
    markers = [...nearby.map((n) => ({ id: n.driver.id, kind: 'truck' as const, position: n.position, busy: n.busy, tag: n.busy ? undefined : `≈ ${n.etaMin} мин` })), ...markers];
    fitTo = [order.location, ...nearby.slice(0, 4).map((n) => n.position)];
  } else if (phase === 'offers') {
    markers = [
      ...offers.map(({ offer, driver: d }) => ({
        id: d.id,
        kind: 'truck' as const,
        position: driverPosition(db, d, now),
        tag: formatMoney(offer.price),
        active: hoverDriverId === d.id || viewDriverId === d.id,
        onClick: () => setViewDriverId(d.id),
      })),
      ...markers,
    ];
    fitTo = [order.location, ...offers.map(({ driver: d }) => driverPosition(db, d, now))];
    fitKey = `offers-${offers.length}`;
  } else if (phase === 'tracking' && driver && driverPos) {
    markers = [{ id: driver.id, kind: 'truck', position: driverPos, active: true, tag: order.status === 'en_route' ? `≈ ${etaRemaining(order, now, speed)} мин` : undefined }, ...markers];
    if (order.status === 'en_route' && order.route) {
      const pts = order.route;
      const idx = Math.max(1, Math.ceil(progress * (pts.length - 1)));
      routePassed = [...pts.slice(0, idx), pointAlong(pts, progress)];
      route = [pointAlong(pts, progress), ...pts.slice(idx)];
      fitTo = pts;
    } else if (order.status === 'driver_selected') {
      route = [driverPos, order.location];
      fitTo = [driverPos, order.location];
    }
    fitKey = `track-${order.status}`;
  }

  const repeat = () => {
    saveDraft({ ...loadDraft(), address: order.address, location: order.location, volume: order.volume, waterType: order.waterType, price: order.clientPrice, comment: order.comment, scheduleType: 'now' });
    router.push('/client/new?step=3');
  };

  const choose = (offerId: string) => {
    run(() => selectOffer(order.id, offerId), 'Водитель выбран');
    setViewDriverId(null);
  };

  const unreadMessages = order.messages.filter((m) => m.from === 'driver' && m.createdAt <= now && now - m.createdAt < 20_000).length;
  const active = phase === 'searching' || phase === 'offers' || phase === 'tracking';

  return (
    <>
      <MapLayout
        mapHeight={phase === 'tracking' ? 'h-[50dvh]' : 'h-[40dvh]'}
        map={<MapView center={order.location} zoom={14} markers={markers} route={route} routePassed={routePassed} fitTo={fitTo} fitKey={fitKey} padding={desktop ? { left: 480, top: 60, right: 60, bottom: 60 } : { top: 70, bottom: 50 }} radar={phase === 'searching' ? order.location : undefined} />}
        overlay={
          <div className="flex justify-between lg:hidden">
            <Link href="/client/orders" aria-label="Назад" className="pointer-events-auto flex size-10 items-center justify-center rounded-2xl bg-white/95 text-ink-700 shadow-card backdrop-blur">
              <ArrowLeft className="size-5" />
            </Link>
            <span className="pointer-events-auto rounded-2xl bg-white/95 px-3 py-2.5 text-xs font-bold shadow-card backdrop-blur">Заказ №{order.number}</span>
          </div>
        }
      >
        <div className="space-y-4 px-4 pb-8 pt-3 sm:px-5 lg:pt-5">
          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/client/orders" aria-label="Назад" className="flex size-10 items-center justify-center rounded-2xl bg-white text-ink-700 shadow-card">
              <ArrowLeft className="size-5" />
            </Link>
            <div className="flex-1">
              <div className="text-xs font-semibold text-ink-400">{formatDateTime(order.createdAt)}</div>
              <div className="text-lg font-extrabold tracking-[-0.02em]">Заказ №{order.number}</div>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {(phase === 'searching' || phase === 'offers') && <OrderStepper current={4} />}

          {phase === 'searching' && <SearchingView order={order} nearby={nearby} progress={Math.min(1, (now - order.createdAt) / searchWindow)} />}

          {phase === 'offers' && (
            <div className="space-y-3">
              <div className="rounded-3xl bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xl font-extrabold tracking-[-0.02em] text-ink-900">{offersSummary(offers.length)}</div>
                    <div className="mt-0.5 text-sm text-ink-500">
                      Ваша цена: <b className="text-ink-900">{formatMoney(order.clientPrice)}</b> · {formatVolume(order.volume)}
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-ok-50 px-2.5 py-1 text-[11px] font-bold text-ok-600">
                    <span className="size-1.5 animate-pulse rounded-full bg-ok-500" /> ждём ещё
                  </span>
                </div>
                <Segmented
                  size="sm"
                  className="mt-3"
                  value={sort}
                  onChange={setSort}
                  options={[
                    { value: 'price', label: 'Дешевле' },
                    { value: 'time', label: 'Быстрее' },
                    { value: 'rating', label: 'Рейтинг' },
                  ]}
                />
              </div>
              <div className="space-y-4 pt-1">
                {offers.map((x) => (
                  <OfferCard
                    key={x.offer.id}
                    offer={x.offer}
                    driver={x.driver}
                    clientPrice={order.clientPrice}
                    best={badgeFor(x)}
                    highlighted={hoverDriverId === x.driver.id}
                    onHover={(v) => setHoverDriverId(v ? x.driver.id : null)}
                    onSelect={() => choose(x.offer.id)}
                    onView={() => setViewDriverId(x.driver.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {phase === 'tracking' && driver && (
            <TrackingView
              order={order}
              driver={driver}
              eta={etaRemaining(order, now, speed)}
              progress={order.status === 'driver_selected' ? 0.04 : progress}
              deliveryProgress={deliveryProgress(order, now, speed)}
              onCall={() => setCallOpen(true)}
              onChat={() => setChatOpen(true)}
              onCancel={() => setCancelOpen(true)}
              unreadMessages={unreadMessages}
            />
          )}

          {phase === 'done' && <CompletedView order={order} driver={driver} onRepeat={repeat} />}
          {phase === 'cancelled' && <CancelledView order={order} onRepeat={repeat} />}

          {/* Детали заказа */}
          <div className="overflow-hidden rounded-3xl bg-white shadow-card">
            <button onClick={() => setDetailsOpen((v) => !v)} className="flex w-full items-center justify-between p-4 text-left">
              <span className="font-bold text-ink-900">Подробнее о заказе</span>
              <ChevronDown className={cn('size-5 text-ink-400 transition', detailsOpen && 'rotate-180')} />
            </button>
            {detailsOpen && (
              <div className="space-y-4 px-4 pb-4">
                <div className="divide-y divide-ink-100 rounded-2xl bg-ink-50 px-3 text-sm">
                  {[
                    ['Адрес', order.address],
                    ['Вода', `${formatVolume(order.volume)} · ${WATER_TYPE_FULL[order.waterType]}`],
                    ['Когда', order.scheduledAt ? `${SCHEDULE_LABEL[order.scheduleType]} · ${formatDateTime(order.scheduledAt)}` : SCHEDULE_LABEL.now],
                    ['Ваша цена', formatMoney(order.clientPrice)],
                    ['Цена сделки', formatMoney(order.finalPrice)],
                    ['Комментарий', order.comment || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 py-2.5">
                      <span className="shrink-0 text-ink-500">{k}</span>
                      <span className="text-right font-semibold text-ink-900">{v}</span>
                    </div>
                  ))}
                </div>
                <OrderTimeline order={order} compact />
              </div>
            )}
          </div>

          {active && (
            <div className="flex flex-col gap-2">
              {(phase === 'searching' || phase === 'offers') && (
                <Button variant="ghost" block className="text-bad-600 hover:bg-bad-50" onClick={() => setCancelOpen(true)}>
                  Отменить заказ
                </Button>
              )}
              {!(phase === 'offers' && offers.length >= 3) && (
                <button onClick={() => demoAdvance(order.id)} className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-200 py-2.5 text-xs font-semibold text-ink-400 transition hover:border-brand-300 hover:text-brand-600">
                  <FastForward className="size-3.5" /> Демо: перейти к следующему этапу
                </button>
              )}
            </div>
          )}
        </div>
      </MapLayout>

      <DriverDetailModal open={!!viewed} onClose={() => setViewDriverId(null)} driver={viewed?.driver} offer={viewed?.offer} clientPrice={order.clientPrice} onOrder={viewed ? () => choose(viewed.offer.id) : undefined} />
      <CancelModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        warning={order.status === 'en_route' ? 'Водитель уже в пути. В реальном сервисе может взиматься плата за отмену.' : undefined}
        onConfirm={(reason) => run(() => cancelOrder(order.id, 'client', reason), 'Заказ отменён')}
      />
      {driver && <ChatSheet open={chatOpen} onClose={() => setChatOpen(false)} order={order} me="client" peerName={driver.name} peerColor={driver.avatarColor} />}
      {driver && <CallModal open={callOpen} onClose={() => setCallOpen(false)} name={driver.name} phone={driver.phone} color={driver.avatarColor} photo={driver.photo} />}
    </>
  );
}

export default function ClientOrderPage() {
  return (
    <Suspense>
      <ClientOrderScreen />
    </Suspense>
  );
}
