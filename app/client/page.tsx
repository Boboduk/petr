'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bell, CalendarClock, ChevronRight, Clock3, Repeat, Truck, Zap } from 'lucide-react';
import type { LatLng, ScheduleType } from '@/types';
import { MapView, type MapMarker } from '@/components/map/MapView';
import { MapLayout } from '@/components/client/MapLayout';
import { AddressField } from '@/components/client/AddressField';
import { VolumePicker } from '@/components/client/VolumePicker';
import { LogoMark } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import { useCurrentUser } from '@/hooks/useSession';
import { useNow } from '@/hooks/useNow';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { clientOrders, currentCity, nearbyDrivers, unreadCount } from '@/lib/store/selectors';
import { loadDraft, saveDraft, type OrderDraft } from '@/lib/draft';
import { geocode, reverseGeocode, shortAddress } from '@/lib/geo';
import { isActive, STATUS_LABEL } from '@/lib/status';
import { formatMinutes, formatVolume, pluralize } from '@/lib/format';
import { cn } from '@/lib/cn';
import { clientOrderPath } from '@/lib/routes';

const MODES: Array<{ value: ScheduleType; title: string; text: string; icon: typeof Zap }> = [
  { value: 'now', title: 'Сейчас', text: 'Как можно скорее', icon: Zap },
  { value: 'scheduled', title: 'К сроку', text: 'Дата и время', icon: CalendarClock },
  { value: 'regular', title: 'Регулярно', text: 'Каждую неделю', icon: Repeat },
];

function greeting() {
  const h = new Date().getHours();
  return h < 6 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
}

export default function ClientHomePage() {
  const router = useRouter();
  const toast = useToast();
  const { db, user } = useCurrentUser();
  const city = currentCity(db);
  const now = useNow(3000);
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [draft, setDraftState] = useState<OrderDraft>(() => loadDraft());

  const setDraft = (patch: Partial<OrderDraft>) =>
    setDraftState((d) => {
      const next = { ...d, ...patch };
      saveDraft(next);
      return next;
    });

  const orders = user ? clientOrders(db, user.id) : [];
  const active = orders.find((o) => isActive(o.status));
  const recentAddresses = Array.from(new Set(orders.map((o) => o.address))).slice(0, 3);
  const point: LatLng = draft.location ?? city.center;
  const nearby = useMemo(() => nearbyDrivers(db, point, now, 6), [db, point, now]);
  const freeNearby = nearby.filter((n) => !n.busy);
  const unread = user ? unreadCount(db, user.id) : 0;

  const markers: MapMarker[] = [
    ...nearby.map((n) => ({ id: n.driver.id, kind: 'truck' as const, position: n.position, busy: n.busy })),
    ...(draft.location ? [{ id: 'me', kind: 'client' as const, position: draft.location }] : []),
  ];

  const onMapClick = (p: LatLng) => setDraft({ location: p, address: reverseGeocode(p, city) });

  const start = (mode?: ScheduleType) => {
    if (!draft.address.trim()) {
      toast.error('Укажите адрес доставки', 'Введите адрес или нажмите на карту');
      return;
    }
    const g = draft.location ? { address: draft.address, location: draft.location } : geocode(draft.address, city);
    const next = { ...draft, ...g, scheduleType: mode ?? draft.scheduleType };
    saveDraft(next);
    router.push('/client/new?step=1');
  };

  return (
    <MapLayout
      map={<MapView center={point} zoom={city.zoom + (draft.location ? 1 : 0)} markers={markers} onMapClick={onMapClick} padding={desktop ? { left: 480 } : undefined} />}
      overlay={
        <div className="flex items-start justify-between lg:justify-end">
          <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/95 py-1.5 pl-1.5 pr-3 shadow-card backdrop-blur lg:hidden">
            <LogoMark size={30} />
            <span className="text-sm font-extrabold tracking-[-0.02em]">Водовоз</span>
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <span className="rounded-2xl bg-white/95 px-3 py-2 text-xs font-bold text-ink-700 shadow-card backdrop-blur">г. {city.name}</span>
            <Link href="/client/notifications" className="relative flex size-10 items-center justify-center rounded-2xl bg-white/95 text-ink-700 shadow-card backdrop-blur lg:hidden" aria-label="Уведомления">
              <Bell className="size-5" />
              {unread > 0 && <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-bad-500 px-1 text-[11px] font-bold text-white">{unread}</span>}
            </Link>
          </div>
        </div>
      }
    >
      <div className="space-y-5 px-4 pb-6 pt-4 sm:px-5 lg:pt-6">
        {active && (
          <Link href={clientOrderPath(active.id)} className="flex items-center gap-3 rounded-3xl bg-ink-900 p-4 text-white shadow-float animate-fade-up">
            <span className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-600">
              <Truck className="size-5.5" />
              <span className="absolute -right-0.5 -top-0.5 size-3 animate-pulse rounded-full bg-aqua-400 ring-2 ring-ink-900" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-white/60">Активный заказ №{active.number}</div>
              <div className="truncate font-bold">{STATUS_LABEL[active.status]}</div>
            </div>
            <ChevronRight className="size-5 text-white/50" />
          </Link>
        )}

        <div>
          <div className="text-sm font-semibold text-ink-500">
            {greeting()}, {user?.name}
          </div>
          <h1 className="mt-1 text-[26px] font-extrabold leading-[1.1] tracking-[-0.035em] text-ink-900">Сколько воды вам нужно и куда её доставить?</h1>
        </div>

        <div>
          <AddressField
            large
            city={city}
            value={draft.address}
            onChange={(address, location) => setDraft({ address, location: location ?? (address ? draft.location : undefined) })}
            onLocate={() => {
              const g = geocode(recentAddresses[0] ?? 'ул. Ленина, 15', city);
              setDraft({ address: g.address, location: g.location });
              toast.show({ kind: 'info', title: 'Местоположение определено', body: 'В демо-режиме используется тестовый адрес' });
            }}
          />
          {recentAddresses.length > 0 && !draft.address && (
            <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto">
              {recentAddresses.map((a) => (
                <button
                  key={a}
                  onClick={() => {
                    const g = geocode(a, city);
                    setDraft({ address: g.address, location: g.location });
                  }}
                  className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold text-ink-700 shadow-sm ring-1 ring-ink-100 hover:ring-brand-300"
                >
                  {shortAddress(a)}
                </button>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-ink-400">Или нажмите на карту, чтобы отметить точку</p>
        </div>

        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[15px] font-bold text-ink-900">Объём воды</span>
            <span className="text-sm font-semibold text-brand-600">{formatVolume(draft.volume)}</span>
          </div>
          <VolumePicker compact value={draft.volume} onChange={(volume) => setDraft({ volume })} />
        </div>

        <Button size="xl" block onClick={() => start('now')} iconRight={<ArrowRight className="size-5" />}>
          Заказать воду
        </Button>

        <div className="flex items-center gap-2 rounded-2xl bg-white p-3 text-sm shadow-card">
          <span className="relative flex size-2.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-ok-500/60" />
            <span className="relative size-2.5 rounded-full bg-ok-500" />
          </span>
          <span className="text-ink-600">
            Рядом <b className="text-ink-900">{freeNearby.length}</b> {pluralize(freeNearby.length, ['свободный водовоз', 'свободных водовоза', 'свободных водовозов'])}
            {freeNearby[0] && (
              <>
                {' '}
                · ближайший ≈ <b className="text-ink-900">{formatMinutes(freeNearby[0].etaMin)}</b>
              </>
            )}
          </span>
        </div>

        <div>
          <div className="mb-2.5 text-[15px] font-bold text-ink-900">Тип заказа</div>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map(({ value, title, text, icon: Icon }) => (
              <button key={value} onClick={() => start(value)} className={cn('rounded-2xl bg-white p-3 text-left shadow-card ring-1 ring-transparent transition hover:ring-brand-300 active:scale-[0.98]')}>
                <span className={cn('flex size-9 items-center justify-center rounded-xl', value === 'now' ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600')}>
                  <Icon className="size-4.5" />
                </span>
                <div className="mt-2 text-sm font-bold text-ink-900">{title}</div>
                <div className="text-[11px] leading-tight text-ink-500">{text}</div>
              </button>
            ))}
          </div>
        </div>

        {orders.filter((o) => o.status === 'completed').slice(0, 1).map((o) => (
          <button
            key={o.id}
            onClick={() => {
              setDraft({ address: o.address, location: o.location, volume: o.volume, waterType: o.waterType, price: o.finalPrice });
              toast.show({ kind: 'info', title: 'Параметры прошлого заказа подставлены' });
            }}
            className="flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left shadow-card transition hover:bg-ink-50"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-aqua-100 text-aqua-600">
              <Clock3 className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-ink-900">Повторить последний заказ</span>
              <span className="block truncate text-xs text-ink-500">
                {formatVolume(o.volume)} · {shortAddress(o.address)}
              </span>
            </span>
            <StatusBadge status={o.status} />
          </button>
        ))}
      </div>
    </MapLayout>
  );
}
