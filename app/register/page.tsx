'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Camera, Car, Lock, Mail, MessageSquareCode, Phone, User } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { TruckArt } from '@/components/brand/TruckArt';
import { DataGate } from '@/components/shared/DataGate';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { ChoiceChip, Segmented } from '@/components/ui/Segmented';
import { homePath, registerClient, registerDriver } from '@/lib/auth';
import { readImageFile } from '@/lib/image';
import { cn } from '@/lib/cn';

const TANKS = [3, 4, 5, 6, 8, 10, 12];

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<'client' | 'driver'>(params.get('role') === 'driver' ? 'driver' : 'client');
  const [stage, setStage] = useState<'form' | 'code'>('form');
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', brand: 'КАМАЗ', model: '43118 АЦПТ', plate: '', tankVolume: 10, experienceYears: 3, photo: '' });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    if (form.name.trim().length < 2) return 'Укажите имя';
    if (form.phone.replace(/\D/g, '').length < 10) return 'Укажите телефон';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Укажите корректный email';
    if (form.password.length < 6) return 'Пароль — минимум 6 символов';
    if (role === 'driver' && (!form.brand.trim() || form.plate.trim().length < 5)) return 'Укажите автомобиль и госномер';
    return '';
  };

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    setError(err);
    if (!err) setStage('code');
  };

  const finish = (e: React.FormEvent) => {
    e.preventDefault();
    if (code !== '1234') {
      setError('Неверный код. В демо-режиме код — 1234');
      return;
    }
    try {
      const s =
        role === 'client'
          ? registerClient(form)
          : registerDriver({ ...form, photo: form.photo || undefined });
      router.push(homePath(s.role) + (role === 'driver' ? '/profile' : ''));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
      setStage('form');
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(900px_500px_at_100%_0%,#d5f7fb_0%,transparent_60%)]">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/login" className="flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900">
          <ArrowLeft className="size-4" /> Ко входу
        </Link>
        <Logo size={30} />
      </header>
      <main className="flex flex-1 justify-center px-5 pb-10">
        <div className="w-full max-w-lg rounded-[32px] bg-white p-6 shadow-float sm:p-8">
          {stage === 'form' ? (
            <form onSubmit={next}>
              <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-ink-900">Регистрация</h1>
              <Segmented
                className="mt-5"
                value={role}
                onChange={(v) => setRole(v)}
                options={[
                  { value: 'client', label: 'Я клиент' },
                  { value: 'driver', label: 'Я водитель' },
                ]}
              />
              <div className="mt-5 space-y-4">
                <Input label="Имя" icon={<User className="size-4.5" />} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Как к вам обращаться" />
                <Input label="Телефон" type="tel" icon={<Phone className="size-4.5" />} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+7 900 000-00-00" />
                <Input label="Email" type="email" icon={<Mail className="size-4.5" />} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.ru" />
                <Input label="Пароль" type="password" icon={<Lock className="size-4.5" />} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Минимум 6 символов" />
              </div>

              {role === 'driver' && (
                <div className="mt-6 space-y-4 border-t border-ink-100 pt-5">
                  <div className="flex items-center gap-2 font-bold text-ink-900">
                    <Car className="size-5 text-brand-600" /> Автомобиль
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Марка" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
                    <Input label="Модель" value={form.model} onChange={(e) => set('model', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Госномер" value={form.plate} onChange={(e) => set('plate', e.target.value)} placeholder="А 123 ВС 14" />
                    <Input label="Стаж, лет" type="number" min={0} value={form.experienceYears} onChange={(e) => set('experienceYears', Number(e.target.value))} />
                  </div>
                  <div>
                    <div className="mb-1.5 text-[13px] font-semibold text-ink-700">Объём цистерны</div>
                    <div className="flex flex-wrap gap-2">
                      {TANKS.map((t) => (
                        <ChoiceChip key={t} active={form.tankVolume === t} onClick={() => set('tankVolume', t)} className="h-10 px-4 text-sm">
                          {t} м³
                        </ChoiceChip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 text-[13px] font-semibold text-ink-700">Фото автомобиля</div>
                    <label className={cn('flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-ink-200 p-3 transition hover:bg-ink-50')}>
                      <TruckArt photo={form.photo || undefined} volume={form.tankVolume} className="h-20 w-32 shrink-0" />
                      <span className="flex items-center gap-2 text-sm font-semibold text-brand-600">
                        <Camera className="size-4.5" /> {form.photo ? 'Заменить фото' : 'Загрузить фото'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) set('photo', await readImageFile(f));
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-ink-400">Документы (ВУ, СТС, санпаспорт цистерны) в демо принимаются автоматически и отправляются на проверку администратору.</p>
                </div>
              )}
              {error && <div className="mt-4 rounded-xl bg-bad-50 px-3 py-2 text-sm text-bad-600">{error}</div>}
              <Button type="submit" size="lg" block className="mt-6">
                Получить код
              </Button>
            </form>
          ) : (
            <form onSubmit={finish}>
              <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <MessageSquareCode className="size-7" />
              </div>
              <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.03em] text-ink-900">Код из SMS</h1>
              <p className="mt-1 text-sm text-ink-500">Отправили код на {form.phone}. В демо-режиме SMS не отправляется — введите <b className="text-ink-900">1234</b>.</p>
              <input
                autoFocus
                inputMode="numeric"
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="mt-6 h-16 w-full rounded-2xl bg-ink-50 text-center text-3xl font-extrabold tracking-[0.6em] text-ink-900 outline-none ring-1 ring-inset ring-ink-100 focus:bg-white focus:ring-2 focus:ring-brand-500"
                placeholder="••••"
              />
              {error && <div className="mt-4 rounded-xl bg-bad-50 px-3 py-2 text-sm text-bad-600">{error}</div>}
              <Button type="submit" size="lg" block className="mt-6" disabled={code.length < 4}>
                Подтвердить
              </Button>
              <button type="button" onClick={() => setCode('1234')} className="mt-3 w-full text-sm font-semibold text-brand-600">
                Подставить демо-код
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <DataGate>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </DataGate>
  );
}
