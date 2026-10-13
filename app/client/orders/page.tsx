'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { PageScaffold } from '@/components/client/ClientShell';
import { OrderCard } from '@/components/client/OrderCard';
import { Segmented } from '@/components/ui/Segmented';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useCurrentUser } from '@/hooks/useSession';
import { clientOrders, findDriver } from '@/lib/store/selectors';
import { isActive } from '@/lib/status';
import { formatMoney } from '@/lib/format';
import { clientOrderPath } from '@/lib/routes';

type Filter = 'all' | 'active' | 'completed' | 'cancelled';

export default function ClientOrdersPage() {
  const { db, user } = useCurrentUser();
  const [filter, setFilter] = useState<Filter>('all');
  const all = user ? clientOrders(db, user.id) : [];
  const list = all.filter((o) => (filter === 'all' ? true : filter === 'active' ? isActive(o.status) : o.status === filter));
  const spent = all.filter((o) => o.status === 'completed').reduce((s, o) => s + (o.finalPrice ?? 0), 0);

  return (
    <PageScaffold title="Мои заказы" subtitle={`${all.length} заказов · потрачено ${formatMoney(spent)}`}>
      <Segmented
        value={filter}
        onChange={setFilter}
        className="mb-4"
        options={[
          { value: 'all', label: 'Все' },
          { value: 'active', label: 'Активные' },
          { value: 'completed', label: 'Завершённые' },
          { value: 'cancelled', label: 'Отменённые' },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-7" />}
          title="Здесь пока пусто"
          text="Закажите воду — история появится здесь"
          action={
            <Link href="/client">
              <Button>Заказать воду</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((o) => (
            <OrderCard key={o.id} order={o} driver={findDriver(db, o.driverId)} href={clientOrderPath(o.id)} />
          ))}
        </div>
      )}
    </PageScaffold>
  );
}
