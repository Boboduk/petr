'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Camera, Clock3, ExternalLink, FileCheck2, FileClock, LogOut, Pencil, Phone, Truck } from 'lucide-react';
import { PageScaffold } from '@/components/client/ClientShell';
import { TruckArt } from '@/components/brand/TruckArt';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { ChoiceChip } from '@/components/ui/Segmented';
import { Rating } from '@/components/ui/Stars';
import { useAction } from '@/components/ui/Toast';
import { useCurrentUser } from '@/hooks/useSession';
import { logout } from '@/lib/auth';
import { updateDriver } from '@/lib/store/actions';
import { readImageFile } from '@/lib/image';
import { formatDate, formatVolume, maskPlate, pluralize } from '@/lib/format';

const VERIFICATION = {
  verified: { label: 'Проверен', tone: 'success' as const },
  pending: { label: 'На проверке', tone: 'warning' as const },
  rejected: { label: 'Отклонён', tone: 'danger' as const },
};
const TANKS = [3, 4, 5, 6, 8, 10, 12];

export default function DriverProfilePage() {
  const router = useRouter();
  const run = useAction();
  const { driver } = useCurrentUser();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(() => ({
    name: driver?.name ?? '',
    phone: driver?.phone ?? '',
    experienceYears: driver?.experienceYears ?? 1,
    brand: driver?.vehicle.brand ?? '',
    model: driver?.vehicle.model ?? '',
    plate: driver?.vehicle.plate ?? '',
    tankVolume: driver?.vehicle.tankVolume ?? 5,
    photo: driver?.photo,
    carPhoto: driver?.vehicle.photo,
  }));
  if (!driver) return null;
  const v = VERIFICATION[driver.verification];

  const save = () => {
    run(
      () =>
        updateDriver(driver.id, {
          name: form.name,
          phone: form.phone,
          experienceYears: form.experienceYears,
          photo: form.photo,
          vehicle: { brand: form.brand, model: form.model, plate: form.plate, tankVolume: form.tankVolume, photo: form.carPhoto },
        }),
      'Профиль сохранён',
    );
    setEdit(false);
  };

  return (
    <PageScaffold
      title="Профиль водителя"
      action={
        <Button size="sm" variant="secondary" icon={<Pencil className="size-4" />} onClick={() => setEdit(true)}>
          Редактировать профиль
        </Button>
      }
    >
      <Card className="overflow-hidden">
        <TruckArt cabColor={driver.vehicle.color} photo={driver.vehicle.photo} volume={driver.vehicle.tankVolume} className="h-44 w-full rounded-none" />
        <div className="-mt-10 px-5 pb-5">
          <Avatar name={driver.name} photo={driver.photo} color={driver.avatarColor} size={84} ring />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-2xl font-extrabold tracking-[-0.03em] text-ink-900">{driver.name}</span>
            <Badge tone={v.tone} dot>
              {v.label}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
            <Rating value={driver.rating} count={driver.ratingCount} />
            <span className="flex items-center gap-1">
              <Phone className="size-3.5" /> {driver.phone}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-ink-50 p-3">
              <div className="text-xl font-extrabold text-ink-900">{driver.ordersCount}</div>
              <div className="text-xs text-ink-500">доставок</div>
            </div>
            <div className="rounded-2xl bg-ink-50 p-3">
              <div className="text-xl font-extrabold text-ink-900">
                {driver.experienceYears} {pluralize(driver.experienceYears, ['год', 'года', 'лет'])}
              </div>
              <div className="text-xs text-ink-500">стаж</div>
            </div>
            <div className="rounded-2xl bg-ink-50 p-3">
              <div className="text-xl font-extrabold text-brand-700">{formatVolume(driver.vehicle.tankVolume)}</div>
              <div className="text-xs text-ink-500">цистерна</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <SectionTitle>Автомобиль</SectionTitle>
          <Card className="divide-y divide-ink-100 px-4">
            {[
              ['Марка', driver.vehicle.brand],
              ['Модель', driver.vehicle.model],
              ['Госномер', maskPlate(driver.vehicle.plate)],
              ['Объём цистерны', formatVolume(driver.vehicle.tankVolume)],
              ['Год выпуска', String(driver.vehicle.year)],
              ['На сервисе с', formatDate(driver.joinedAt)],
            ].map(([k, val]) => (
              <div key={k} className="flex justify-between py-3 text-sm">
                <span className="flex items-center gap-2 text-ink-500">
                  {k === 'Марка' && <Truck className="size-4" />}
                  {k}
                </span>
                <span className="font-semibold text-ink-900">{val}</span>
              </div>
            ))}
          </Card>
        </div>
        <div>
          <SectionTitle>Документы</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {driver.documents.map((d) => (
              <Card key={d.id} className="p-3.5">
                {d.status === 'verified' ? <FileCheck2 className="size-6 text-ok-500" /> : <FileClock className="size-6 text-warn-500" />}
                <div className="mt-2 text-sm font-bold leading-tight text-ink-900">{d.title}</div>
                <div className="mt-0.5 font-mono text-xs text-ink-400">{d.number}</div>
                <div className={`mt-1.5 text-xs font-semibold ${d.status === 'verified' ? 'text-ok-600' : 'text-warn-600'}`}>{VERIFICATION[d.status].label}</div>
              </Card>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-400">Демонстрационные карточки: реальные документы не загружаются.</p>
        </div>
      </div>

      <div className="mt-6">
        <SectionTitle>Отзывы клиентов</SectionTitle>
        <div className="grid gap-2 md:grid-cols-2">
          {driver.reviews.length === 0 && <Card className="p-4 text-sm text-ink-500">Отзывов пока нет</Card>}
          {driver.reviews.slice(0, 6).map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink-900">{r.author}</span>
                <span className="text-sm tracking-wider text-warn-500">{'★'.repeat(r.rating)}</span>
              </div>
              <p className="mt-1 text-sm text-ink-600">{r.text}</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-ink-400">
                <Clock3 className="size-3" /> {formatDate(r.createdAt)}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="mt-6 divide-y divide-ink-100">
        <a href="/login?demo=client" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 text-sm font-semibold text-ink-800 hover:bg-ink-50">
          Открыть клиента в новой вкладке <ExternalLink className="size-4 text-ink-400" />
        </a>
        <div className="flex items-center gap-2 p-4 text-sm text-ink-500">
          <BadgeCheck className="size-4 text-brand-600" /> Пока вкладка водителя открыта, вашими заказами управляете вы, а не симулятор.
        </div>
      </Card>

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

      <Modal open={edit} onClose={() => setEdit(false)} title="Редактировать профиль" footer={<Button size="lg" block onClick={save}>Сохранить</Button>}>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer">
              <Avatar name={form.name || driver.name} photo={form.photo} color={driver.avatarColor} size={72} />
              <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-brand-600 text-white ring-2 ring-white">
                <Camera className="size-3.5" />
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => e.target.files?.[0] && setForm({ ...form, photo: await readImageFile(e.target.files[0], 320) })} />
            </label>
            <label className="flex-1 cursor-pointer">
              <TruckArt photo={form.carPhoto} cabColor={driver.vehicle.color} volume={form.tankVolume} className="h-20 w-full" />
              <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-brand-600">
                <Camera className="size-3.5" /> Фото автомобиля
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => e.target.files?.[0] && setForm({ ...form, carPhoto: await readImageFile(e.target.files[0]) })} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Имя" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Марка" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <Input label="Модель" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            <Input label="Госномер" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} />
            <Input label="Стаж, лет" type="number" min={0} value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })} />
          </div>
          <div>
            <div className="mb-1.5 text-[13px] font-semibold text-ink-700">Объём цистерны</div>
            <div className="flex flex-wrap gap-2">
              {TANKS.map((t) => (
                <ChoiceChip key={t} active={form.tankVolume === t} onClick={() => setForm({ ...form, tankVolume: t })} className="h-10 px-4 text-sm">
                  {t} м³
                </ChoiceChip>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </PageScaffold>
  );
}
