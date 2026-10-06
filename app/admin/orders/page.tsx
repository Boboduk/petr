'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import type { OrderStatus } from '@/types';
import { AdminTitle } from '@/components/admin/AdminShell';
import { OrderDrawer } from '@/components/admin/OrderDrawer';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Input, Select } from '@/components/ui/Field';
import { useDB } from '@/hooks/useDB';
import { findDriver, findUser } from '@/lib/store/selectors';
import { ACTIVE_STATUSES, STATUS_FLOW, STATUS_LABEL } from '@/lib/status';
import { formatDateTime, formatMoney, formatVolume } from '@/lib/format';
import { shortAddress } from '@/lib/geo';

type StatusFilter = 'all' | 'active' | OrderStatus;
type Period = 'all' | 'today' | 'week';

function OrdersTable() {
  const db = useDB();
  const params = useSearchParams();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [period, setPeriod] = useState<Period>('all');
  const [limit, setLimit] = useState(50);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const id = params.get('id');
    if (id) setOpenId(id);
  }, [params]);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    const since = period === 'today' ? new Date().setHours(0, 0, 0, 0) : period === 'week' ? Date.now() - 7 * 86_400_000 : 0;
    return db.orders
      .filter((o) => o.cityId === db.settings.cityId)
      .filter((o) => (status === 'all' ? true : status === 'active' ? ACTIVE_STATUSES.includes(o.status) : o.status === status))
      .filter((o) => o.createdAt >= since)
      .map((o) => ({ o, client: findUser(db, o.clientId), driver: findDriver(db, o.driverId) }))
      .filter(({ o, client, driver }) => !query || [String(o.number), o.address, client?.name, client?.phone, driver?.name].some((s) => s?.toLowerCase().includes(query)));
  }, [db, q, status, period]);

  const total = rows.filter((r) => r.o.status === 'completed').reduce((s, r) => s + (r.o.finalPrice ?? 0), 0);

  return (
    <>
      <AdminTitle title="Заказы" subtitle={`Найдено ${rows.length} · сумма завершённых ${formatMoney(total)}`} />
      <div className="mb-4 grid gap-3 rounded-3xl bg-white p-4 shadow-card md:grid-cols-[1fr_220px_180px]">
        <Input icon={<Search className="size-4.5" />} placeholder="Поиск: номер, адрес, клиент, телефон, водитель" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} aria-label="Статус">
          <option value="all">Все статусы</option>
          <option value="active">Только активные</option>
          {[...STATUS_FLOW, 'cancelled' as OrderStatus].map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <Select value={period} onChange={(e) => setPeriod(e.target.value as Period)} aria-label="Период">
          <option value="all">За всё время</option>
          <option value="today">Сегодня</option>
          <option value="week">7 дней</option>
        </Select>
      </div>
      <div className="overflow-hidden rounded-3xl bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="bg-ink-50 text-left text-xs font-bold uppercase tracking-wide text-ink-400">
                {['ID', 'Клиент', 'Объём', 'Адрес', 'Водитель', 'Цена', 'Статус', 'Дата'].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map(({ o, client, driver }) => (
                <tr key={o.id} onClick={() => setOpenId(o.id)} className="cursor-pointer border-t border-ink-100 transition hover:bg-brand-50/50">
                  <td className="px-4 py-3 font-bold text-ink-900">№{o.number}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink-800">{client?.name ?? '—'}</div>
                    <div className="text-xs text-ink-400">{client?.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{formatVolume(o.volume)}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-ink-700">{shortAddress(o.address)}</td>
                  <td className="px-4 py-3 text-ink-700">{driver?.name ?? <span className="text-ink-300">—</span>}</td>
                  <td className="px-4 py-3 font-semibold text-ink-900 tabular">{formatMoney(o.finalPrice ?? o.clientPrice)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-500">{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <div className="py-12 text-center text-sm text-ink-400">Ничего не найдено</div>}
        {rows.length > limit && (
          <button onClick={() => setLimit((l) => l + 50)} className="w-full border-t border-ink-100 py-3 text-sm font-semibold text-brand-600 hover:bg-ink-50">
            Показать ещё ({rows.length - limit})
          </button>
        )}
      </div>
      <OrderDrawer orderId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <OrdersTable />
    </Suspense>
  );
}
