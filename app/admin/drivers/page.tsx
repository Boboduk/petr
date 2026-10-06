'use client';

import { useMemo, useState } from 'react';
import { BadgeCheck, Ban, Eye, Pencil, Search, ShieldCheck, Unlock } from 'lucide-react';
import type { Driver } from '@/types';
import { AdminTitle } from '@/components/admin/AdminShell';
import { DriverDetailModal } from '@/components/client/order/DriverDetailModal';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Rating } from '@/components/ui/Stars';
import { useAction } from '@/components/ui/Toast';
import { useDB } from '@/hooks/useDB';
import { useNow } from '@/hooks/useNow';
import { isDriverBusy, isDriverLive } from '@/lib/store/selectors';
import { updateDriver } from '@/lib/store/actions';
import { formatVolume } from '@/lib/format';
import { cn } from '@/lib/cn';

type Filter = 'all' | 'online' | 'pending' | 'blocked';

function EditDriverModal({ driver, onClose }: { driver: Driver | undefined; onClose: () => void }) {
  const run = useAction();
  const [form, setForm] = useState(() => ({ name: driver?.name ?? '', phone: driver?.phone ?? '', brand: driver?.vehicle.brand ?? '', model: driver?.vehicle.model ?? '', plate: driver?.vehicle.plate ?? '', tankVolume: driver?.vehicle.tankVolume ?? 5, rating: driver?.rating ?? 5 }));
  if (!driver) return null;
  return (
    <Modal
      open
      onClose={onClose}
      title={`Редактирование: ${driver.name}`}
      footer={
        <Button
          size="lg"
          block
          onClick={() => {
            run(() => updateDriver(driver.id, { name: form.name, phone: form.phone, rating: Math.min(5, Math.max(1, form.rating)), vehicle: { brand: form.brand, model: form.model, plate: form.plate, tankVolume: form.tankVolume } }), 'Данные водителя обновлены');
            onClose();
          }}
        >
          Сохранить
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Input label="Имя" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Марка" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
        <Input label="Модель" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        <Input label="Госномер" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} />
        <Input label="Объём цистерны, м³" type="number" min={1} value={form.tankVolume} onChange={(e) => setForm({ ...form, tankVolume: Number(e.target.value) })} />
        <Input label="Рейтинг" type="number" step={0.1} min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
      </div>
    </Modal>
  );
}

export default function AdminDriversPage() {
  const db = useDB();
  const now = useNow(5000);
  const run = useAction();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const list = useMemo(
    () =>
      db.drivers
        .filter((d) => (filter === 'online' ? d.online && !d.blocked : filter === 'pending' ? d.verification !== 'verified' : filter === 'blocked' ? d.blocked : true))
        .filter((d) => !q.trim() || [d.name, d.phone, d.vehicle.brand, d.vehicle.plate].some((s) => s.toLowerCase().includes(q.trim().toLowerCase()))),
    [db, q, filter],
  );
  const viewed = db.drivers.find((d) => d.id === viewId);
  const edited = db.drivers.find((d) => d.id === editId);

  return (
    <>
      <AdminTitle title="Водители" subtitle={`${db.drivers.filter((d) => d.online && !d.blocked).length} на линии из ${db.drivers.length}`} />
      <div className="mb-4 grid gap-3 rounded-3xl bg-white p-4 shadow-card md:grid-cols-[1fr_220px]">
        <Input icon={<Search className="size-4.5" />} placeholder="Имя, телефон, автомобиль, госномер" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} aria-label="Фильтр">
          <option value="all">Все водители</option>
          <option value="online">На линии</option>
          <option value="pending">Не проверены</option>
          <option value="blocked">Заблокированы</option>
        </Select>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="bg-ink-50 text-left text-xs font-bold uppercase tracking-wide text-ink-400">
                {['Водитель', 'Телефон', 'Автомобиль', 'Цистерна', 'Рейтинг', 'Заказов', 'Статус', 'Проверка', 'Действия'].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((d) => {
                const busy = isDriverBusy(db, d.id);
                return (
                  <tr key={d.id} className={cn('border-t border-ink-100', d.blocked && 'bg-bad-50/40')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={d.name} photo={d.photo} color={d.avatarColor} size={36} />
                        <div>
                          <div className="font-bold text-ink-900">{d.name}</div>
                          {d.userId && <div className="text-[11px] font-semibold text-brand-600">{isDriverLive(d, now) ? '● вкладка открыта' : 'есть аккаунт'}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{d.phone}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink-800">{d.vehicle.brand} {d.vehicle.model}</div>
                      <div className="font-mono text-xs text-ink-400">{d.vehicle.plate}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-700">{formatVolume(d.vehicle.tankVolume)}</td>
                    <td className="px-4 py-3">
                      <Rating value={d.rating} />
                    </td>
                    <td className="px-4 py-3 text-ink-700 tabular">{d.ordersCount}</td>
                    <td className="px-4 py-3">
                      {d.blocked ? <Badge tone="danger">Заблокирован</Badge> : busy ? <Badge tone="progress">На заказе</Badge> : d.online ? <Badge tone="success" dot>На линии</Badge> : <Badge>Не на линии</Badge>}
                    </td>
                    <td className="px-4 py-3">{d.verification === 'verified' ? <Badge tone="info">Проверен</Badge> : <Badge tone="warning">Не проверен</Badge>}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setViewId(d.id)} title="Просмотр" className="flex size-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100">
                          <Eye className="size-4" />
                        </button>
                        <button onClick={() => setEditId(d.id)} title="Редактировать" className="flex size-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100">
                          <Pencil className="size-4" />
                        </button>
                        {d.verification !== 'verified' && (
                          <button onClick={() => run(() => updateDriver(d.id, { verification: 'verified' }), `${d.name}: профиль подтверждён`)} title="Подтвердить документы" className="flex size-8 items-center justify-center rounded-lg text-ok-600 hover:bg-ok-50">
                            <ShieldCheck className="size-4" />
                          </button>
                        )}
                        <button
                          onClick={() => run(() => updateDriver(d.id, { blocked: !d.blocked }), d.blocked ? `${d.name} разблокирован` : `${d.name} заблокирован`)}
                          title={d.blocked ? 'Разблокировать' : 'Заблокировать'}
                          className={cn('flex size-8 items-center justify-center rounded-lg', d.blocked ? 'text-ok-600 hover:bg-ok-50' : 'text-bad-500 hover:bg-bad-50')}
                        >
                          {d.blocked ? <Unlock className="size-4" /> : <Ban className="size-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-400">
        <BadgeCheck className="size-3.5" /> Заблокированный водитель снимается с линии и не видит заявки.
      </p>

      <DriverDetailModal open={!!viewed} onClose={() => setViewId(null)} driver={viewed} />
      {edited && <EditDriverModal key={edited.id} driver={edited} onClose={() => setEditId(null)} />}
    </>
  );
}
