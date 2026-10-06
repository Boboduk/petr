'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, LogOut, Mail, Pencil, Phone, Repeat, RotateCcw, Trash2 } from 'lucide-react';
import { PageScaffold } from '@/components/client/ClientShell';
import { CitySwitcher } from '@/components/shared/CitySwitcher';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { useAction } from '@/components/ui/Toast';
import { useCurrentUser } from '@/hooks/useSession';
import { logout } from '@/lib/auth';
import { deletePlan, togglePlan, updateUser } from '@/lib/store/actions';
import { resetDatabase } from '@/lib/store/store';
import { clientOrders } from '@/lib/store/selectors';
import { formatDate, formatMoney, formatVolume } from '@/lib/format';
import { shortAddress } from '@/lib/geo';
import { FREQUENCY_LABEL, WATER_TYPE_LABEL, WEEKDAYS } from '@/lib/status';

export default function ClientProfilePage() {
  const router = useRouter();
  const run = useAction();
  const { db, user } = useCurrentUser();
  const [edit, setEdit] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '', email: user?.email ?? '' });
  if (!user) return null;

  const orders = clientOrders(db, user.id);
  const done = orders.filter((o) => o.status === 'completed');
  const plans = db.plans.filter((p) => p.clientId === user.id);

  return (
    <PageScaffold title="Профиль">
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} color={user.avatarColor} size={64} />
          <div className="min-w-0 flex-1">
            <div className="text-xl font-extrabold tracking-[-0.02em] text-ink-900">{user.name}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-500">
              <Phone className="size-3.5" /> {user.phone}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-ink-500">
              <Mail className="size-3.5" /> {user.email}
            </div>
          </div>
          <Button variant="secondary" size="sm" icon={<Pencil className="size-4" />} onClick={() => setEdit(true)}>
            <span className="hidden sm:inline">Изменить</span>
          </Button>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-ink-50 p-3">
            <div className="text-xl font-extrabold text-ink-900">{done.length}</div>
            <div className="text-xs text-ink-500">доставок</div>
          </div>
          <div className="rounded-2xl bg-ink-50 p-3">
            <div className="text-xl font-extrabold text-ink-900">{formatVolume(done.reduce((s, o) => s + o.volume, 0))}</div>
            <div className="text-xs text-ink-500">воды</div>
          </div>
          <div className="rounded-2xl bg-ink-50 p-3">
            <div className="text-xl font-extrabold text-ink-900">{formatMoney(done.reduce((s, o) => s + (o.finalPrice ?? 0), 0))}</div>
            <div className="text-xs text-ink-500">оплачено</div>
          </div>
        </div>
        <div className="mt-3 text-center text-xs text-ink-400">С нами с {formatDate(user.createdAt)}</div>
      </Card>

      <div className="mt-6">
        <SectionTitle>Регулярные доставки</SectionTitle>
        {plans.length === 0 && <Card className="p-4 text-sm text-ink-500">Оформите заказ с типом «Регулярная доставка» — он появится здесь.</Card>}
        <div className="space-y-2">
          {plans.map((p) => (
            <Card key={p.id} className="flex items-center gap-3 p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-aqua-100 text-aqua-600">
                <Repeat className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-ink-900">
                  {formatVolume(p.volume)} · {WATER_TYPE_LABEL[p.waterType]}
                </div>
                <div className="truncate text-sm text-ink-500">
                  {FREQUENCY_LABEL[p.config.frequency]}, {WEEKDAYS[p.config.weekday - 1]} в {p.config.time} · {formatMoney(p.price)}
                </div>
                <div className="truncate text-xs text-ink-400">{shortAddress(p.address)}</div>
              </div>
              <Switch checked={p.active} onChange={() => togglePlan(p.id)} label="Активна" />
              <button onClick={() => deletePlan(p.id)} aria-label="Удалить" className="text-ink-300 hover:text-bad-500">
                <Trash2 className="size-4.5" />
              </button>
            </Card>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-400">В демо регулярные заказы не создаются автоматически — интерфейс показывает будущую функцию подписки.</p>
      </div>

      <div className="mt-6">
        <SectionTitle>Тестовый город</SectionTitle>
        <CitySwitcher value={db.settings.cityId} />
      </div>

      <div className="mt-6">
        <SectionTitle>Демо-режим</SectionTitle>
        <Card className="divide-y divide-ink-100">
          <a href="/login?demo=driver" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 text-sm font-semibold text-ink-800 hover:bg-ink-50">
            Открыть водителя в новой вкладке <ExternalLink className="size-4 text-ink-400" />
          </a>
          <button onClick={() => setResetOpen(true)} className="flex w-full items-center justify-between p-4 text-left text-sm font-semibold text-ink-800 hover:bg-ink-50">
            Сбросить демо-данные <RotateCcw className="size-4 text-ink-400" />
          </button>
        </Card>
      </div>

      <Button
        variant="danger"
        size="lg"
        block
        className="mt-6"
        icon={<LogOut className="size-4.5" />}
        onClick={() => {
          logout();
          router.push('/');
        }}
      >
        Выйти
      </Button>

      <Modal
        open={edit}
        onClose={() => setEdit(false)}
        title="Личные данные"
        footer={
          <Button
            size="lg"
            block
            onClick={() => {
              run(() => updateUser(user.id, form), 'Профиль обновлён');
              setEdit(false);
            }}
          >
            Сохранить
          </Button>
        }
      >
        <div className="space-y-3">
          <Input label="Имя" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
      </Modal>
      <ConfirmModal open={resetOpen} onClose={() => setResetOpen(false)} onConfirm={() => resetDatabase(db.settings.cityId)} title="Сбросить демо-данные?" text="Все заказы и изменения будут удалены, тестовые данные создадутся заново." confirmText="Сбросить" danger />
    </PageScaffold>
  );
}
