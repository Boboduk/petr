'use client';

import { useMemo, useState } from 'react';
import { Ban, Search, Unlock } from 'lucide-react';
import { AdminTitle } from '@/components/admin/AdminShell';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Field';
import { useAction } from '@/components/ui/Toast';
import { useDB } from '@/hooks/useDB';
import { updateUser } from '@/lib/store/actions';
import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';

export default function AdminClientsPage() {
  const db = useDB();
  const run = useAction();
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return db.users
      .filter((u) => u.role === 'client')
      .filter((u) => !query || [u.name, u.phone, u.email].some((s) => s.toLowerCase().includes(query)))
      .map((u) => {
        const orders = db.orders.filter((o) => o.clientId === u.id);
        return { u, count: orders.length, spent: orders.filter((o) => o.status === 'completed').reduce((s, o) => s + (o.finalPrice ?? 0), 0), last: orders[0]?.createdAt };
      })
      .sort((a, b) => b.count - a.count);
  }, [db, q]);

  return (
    <>
      <AdminTitle title="Клиенты" subtitle={`${rows.length} клиентов`} />
      <div className="mb-4 rounded-3xl bg-white p-4 shadow-card">
        <Input icon={<Search className="size-4.5" />} placeholder="Имя, телефон или email" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="overflow-hidden rounded-3xl bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-ink-50 text-left text-xs font-bold uppercase tracking-wide text-ink-400">
                {['Имя', 'Телефон', 'Количество заказов', 'Сумма', 'Дата регистрации', 'Статус', ''].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ u, count, spent }) => (
                <tr key={u.id} className={cn('border-t border-ink-100', u.blocked && 'bg-bad-50/40')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} color={u.avatarColor} size={34} />
                      <div>
                        <div className="font-bold text-ink-900">{u.name}</div>
                        <div className="text-xs text-ink-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{u.phone}</td>
                  <td className="px-4 py-3 font-semibold text-ink-900 tabular">{count}</td>
                  <td className="px-4 py-3 text-ink-700 tabular">{formatMoney(spent)}</td>
                  <td className="px-4 py-3 text-ink-600">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">{u.blocked ? <Badge tone="danger">Заблокирован</Badge> : u.isBot ? <Badge>Тестовый</Badge> : <Badge tone="info">Активен</Badge>}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => run(() => updateUser(u.id, { blocked: !u.blocked }), u.blocked ? 'Клиент разблокирован' : 'Клиент заблокирован')}
                      className={cn('inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold', u.blocked ? 'text-ok-600 hover:bg-ok-50' : 'text-bad-500 hover:bg-bad-50')}
                    >
                      {u.blocked ? <Unlock className="size-3.5" /> : <Ban className="size-3.5" />}
                      {u.blocked ? 'Разблокировать' : 'Заблокировать'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
