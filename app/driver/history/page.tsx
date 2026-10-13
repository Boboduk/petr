'use client';

import Link from 'next/link';
import { History, Star } from 'lucide-react';
import { PageScaffold } from '@/components/client/ClientShell';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { useCurrentUser } from '@/hooks/useSession';
import { orderEconomics } from '@/lib/pricing';
import { formatDateTime, formatMoney, formatVolume } from '@/lib/format';
import { shortAddress } from '@/lib/geo';
import { driverOrderPath } from '@/lib/routes';

export default function DriverHistoryPage() {
  const { db, driver } = useCurrentUser();
  if (!driver) return null;
  const orders = db.orders.filter((o) => o.driverId === driver.id && (o.status === 'completed' || o.status === 'cancelled')).sort((a, b) => (b.completedAt ?? b.updatedAt) - (a.completedAt ?? a.updatedAt));
  const done = orders.filter((o) => o.status === 'completed');
  const income = done.reduce((s, o) => s + orderEconomics(o.finalPrice ?? 0, o.commissionRate).driverIncome, 0);
  const commission = done.reduce((s, o) => s + orderEconomics(o.finalPrice ?? 0, o.commissionRate).commission, 0);
  const weekAgo = Date.now() - 7 * 86_400_000;
  const week = done.filter((o) => (o.completedAt ?? 0) >= weekAgo).reduce((s, o) => s + orderEconomics(o.finalPrice ?? 0, o.commissionRate).driverIncome, 0);

  return (
    <PageScaffold title="История" subtitle={`${done.length} выполненных доставок в демо-данных`}>
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3.5">
          <div className="text-xs text-ink-500">За 7 дней</div>
          <div className="mt-1 text-lg font-extrabold text-ink-900 tabular">{formatMoney(week)}</div>
        </Card>
        <Card className="p-3.5">
          <div className="text-xs text-ink-500">Всего доход</div>
          <div className="mt-1 text-lg font-extrabold text-ok-600 tabular">{formatMoney(income)}</div>
        </Card>
        <Card className="p-3.5">
          <div className="text-xs text-ink-500">Комиссия</div>
          <div className="mt-1 text-lg font-extrabold text-ink-900 tabular">{formatMoney(commission)}</div>
        </Card>
      </div>
      <div className="mt-5 space-y-2">
        {orders.length === 0 && <EmptyState icon={<History className="size-7" />} title="Пока нет выполненных заказов" text="Выйдите на линию и примите первую заявку" />}
        {orders.map((o) => {
          const e = orderEconomics(o.finalPrice ?? 0, o.commissionRate);
          return (
            <Link key={o.id} href={driverOrderPath(o.id)} className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-card transition hover:bg-ink-50">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink-900">№{o.number}</span>
                  <StatusBadge status={o.status} />
                  {o.rating && (
                    <span className="flex items-center gap-0.5 text-xs font-bold text-ink-700">
                      <Star className="size-3 fill-warn-500 text-warn-500" />
                      {o.rating}
                    </span>
                  )}
                </div>
                <div className="mt-1 truncate text-sm text-ink-600">
                  {formatVolume(o.volume)} · {shortAddress(o.address)}
                </div>
                <div className="text-xs text-ink-400">{formatDateTime(o.completedAt ?? o.updatedAt)}</div>
              </div>
              {o.status === 'completed' && (
                <div className="text-right">
                  <div className="font-extrabold text-ok-600 tabular">+{formatMoney(e.driverIncome)}</div>
                  <div className="text-xs text-ink-400 tabular">из {formatMoney(e.total)}</div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </PageScaffold>
  );
}
