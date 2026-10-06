'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, Banknote, ClipboardList, Percent, Truck } from 'lucide-react';
import { AdminTitle } from '@/components/admin/AdminShell';
import { StatCard } from '@/components/admin/StatCard';
import { OrdersChart } from '@/components/admin/OrdersChart';
import { OrderDrawer } from '@/components/admin/OrderDrawer';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MapView, type MapMarker } from '@/components/map/MapView';
import { Avatar } from '@/components/ui/Avatar';
import { useDB } from '@/hooks/useDB';
import { useNow } from '@/hooks/useNow';
import { currentCity, dashboardStats, driverPosition, etaRemaining, findDriver, findUser } from '@/lib/store/selectors';
import { ACTIVE_STATUSES, STATUS_SHORT } from '@/lib/status';
import { formatMoney, formatTime, formatVolume } from '@/lib/format';
import { shortAddress } from '@/lib/geo';

export default function AdminDashboard() {
  const db = useDB();
  const now = useNow(1000);
  const [openId, setOpenId] = useState<string | null>(null);
  const stats = dashboardStats(db, now);
  const city = currentCity(db);
  const active = db.orders.filter((o) => ACTIVE_STATUSES.includes(o.status) && o.cityId === city.id);
  const recent = db.orders.filter((o) => o.cityId === city.id).slice(0, 8);
  const rate = Math.round(db.settings.commissionRate * 100);

  const markers: MapMarker[] = [
    ...db.drivers
      .filter((d) => d.online && !d.blocked)
      .map((d) => ({ id: d.id, kind: 'truck' as const, position: driverPosition(db, d, now), active: active.some((o) => o.driverId === d.id), tag: d.name })),
    ...active.map((o) => ({ id: o.id, kind: 'order' as const, position: o.location, label: `№${o.number} · ${formatVolume(o.volume)}`, onClick: () => setOpenId(o.id) })),
  ];

  return (
    <>
      <AdminTitle title="Дашборд" subtitle={`г. ${city.name} · обновляется в реальном времени`} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Заказов сегодня" value={stats.ordersToday} icon={<ClipboardList className="size-4.5" />} hint={`Всего выполнено: ${stats.completedTotal}`} />
        <StatCard label="Активных заказов" value={stats.activeOrders} icon={<Activity className="size-4.5" />} hint="Поиск, в пути, доставка" />
        <StatCard label="Водителей онлайн" value={stats.driversOnline} icon={<Truck className="size-4.5" />} hint={`из ${stats.driversTotal} зарегистрированных`} />
        <StatCard label="Выручка сегодня" value={formatMoney(stats.revenueToday)} icon={<Banknote className="size-4.5" />} hint={`Средний чек ${formatMoney(stats.avgCheck)}`} />
        <StatCard accent label="Комиссия сервиса" value={formatMoney(stats.commissionToday)} icon={<Percent className="size-4.5" />} hint={`Ставка ${rate}% · за всё время ${formatMoney(stats.commissionTotal)}`} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-3xl bg-white shadow-card">
          <div className="flex items-center justify-between p-5 pb-3">
            <div>
              <div className="font-bold text-ink-900">Карта: водители и активные заказы</div>
              <div className="text-xs text-ink-400">Нажмите на заказ, чтобы открыть детали</div>
            </div>
            <div className="flex gap-3 text-xs font-semibold text-ink-500">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded bg-brand-600" /> в работе
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded bg-white ring-1 ring-ink-300" /> свободен
              </span>
            </div>
          </div>
          <div className="h-[420px]">
            <MapView center={city.center} zoom={city.zoom} markers={markers} />
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-bold text-ink-900">Активные доставки</div>
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">{active.length}</span>
          </div>
          <div className="max-h-[440px] space-y-2 overflow-y-auto">
            {active.length === 0 && <div className="py-10 text-center text-sm text-ink-400">Нет активных заказов</div>}
            {active.map((o) => {
              const d = findDriver(db, o.driverId);
              const c = findUser(db, o.clientId);
              return (
                <button key={o.id} onClick={() => setOpenId(o.id)} className="flex w-full items-center gap-3 rounded-2xl bg-ink-50 p-3 text-left transition hover:bg-brand-50">
                  {d ? <Avatar name={d.name} color={d.avatarColor} photo={d.photo} size={38} /> : <span className="flex size-[38px] items-center justify-center rounded-full bg-white text-ink-400"><Truck className="size-4.5" /></span>}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-ink-900">
                      №{o.number} <StatusBadge status={o.status} />
                    </div>
                    <div className="truncate text-xs text-ink-500">
                      {c?.name} → {d?.name ?? 'ищем водителя'} · {shortAddress(o.address)}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-bold text-ink-900">{formatMoney(o.finalPrice ?? o.clientPrice)}</div>
                    <div className="text-ink-400">{o.status === 'en_route' ? `≈ ${etaRemaining(o, now, db.settings.demoSpeed)} мин` : STATUS_SHORT[o.status]}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.6fr]">
        <div className="rounded-3xl bg-white p-5 shadow-card">
          <div className="font-bold text-ink-900">Заказы за 7 дней</div>
          <div className="mb-4 text-xs text-ink-400">Количество созданных заказов по дням</div>
          <OrdersChart data={stats.byDay} />
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-bold text-ink-900">Последние заказы</div>
            <Link href="/admin/orders" className="flex items-center gap-1 text-sm font-semibold text-brand-600">
              Все заказы <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} onClick={() => setOpenId(o.id)} className="cursor-pointer border-t border-ink-100 hover:bg-ink-50">
                    <td className="py-2.5 pl-1 font-bold text-ink-900">№{o.number}</td>
                    <td className="py-2.5 text-ink-600">{findUser(db, o.clientId)?.name}</td>
                    <td className="py-2.5 text-ink-600">{formatVolume(o.volume)}</td>
                    <td className="max-w-[180px] truncate py-2.5 text-ink-600">{shortAddress(o.address)}</td>
                    <td className="py-2.5 font-semibold text-ink-900 tabular">{formatMoney(o.finalPrice ?? o.clientPrice)}</td>
                    <td className="py-2.5">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-2.5 pr-1 text-right text-ink-400 tabular">{formatTime(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <OrderDrawer orderId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
