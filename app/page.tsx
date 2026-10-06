'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Banknote, Clock3, Droplets, ExternalLink, LayoutDashboard, MapPin, RotateCcw, ShieldCheck, Truck, User, Users } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { TruckArt } from '@/components/brand/TruckArt';
import { DataGate } from '@/components/shared/DataGate';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { DEMO_ACCOUNTS } from '@/data/users';
import { homePath, login } from '@/lib/auth';
import { resetDatabase } from '@/lib/store/store';
import { useDB } from '@/hooks/useDB';
import { currentCity, dashboardStats } from '@/lib/store/selectors';
import { formatMoney } from '@/lib/format';
import type { Role } from '@/types';

const ROLES: Array<{ role: Role; title: string; text: string; icon: typeof User; points: string[] }> = [
  {
    role: 'client',
    title: 'Клиент',
    text: 'Заказать воду, сравнить предложения водителей и отследить доставку',
    icon: User,
    points: ['Заказ за 30 секунд', 'Своя цена и торг', 'Водовоз на карте'],
  },
  {
    role: 'driver',
    title: 'Водитель',
    text: 'Выйти на линию, принять заявку или предложить свою цену',
    icon: Truck,
    points: ['Лента заявок рядом', 'Своя цена и время', 'Доход и комиссия'],
  },
  {
    role: 'admin',
    title: 'Администратор',
    text: 'Статистика, заказы, водители, клиенты и настройки комиссии',
    icon: LayoutDashboard,
    points: ['Дашборд и карта', 'Управление статусами', 'Блокировка и проверка'],
  },
];

const STEPS = [
  { icon: MapPin, title: 'Адрес', text: 'Куда доставить воду' },
  { icon: Droplets, title: 'Объём', text: 'От 1 до 10+ м³ и тип воды' },
  { icon: Clock3, title: 'Время', text: 'Сейчас, к сроку или регулярно' },
  { icon: Banknote, title: 'Цена', text: 'Вы предлагаете свою цену' },
  { icon: Truck, title: 'Водитель', text: 'Выбираете лучшее предложение' },
];

function Landing() {
  const router = useRouter();
  const toast = useToast();
  const db = useDB();
  const city = currentCity(db);
  const stats = dashboardStats(db);

  const enter = (role: Role) => {
    const acc = DEMO_ACCOUNTS[role];
    try {
      login(acc.email, acc.password);
      router.push(homePath(role));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка входа');
    }
  };

  return (
    <div className="min-h-dvh bg-[radial-gradient(1200px_600px_at_80%_-10%,#d9e8ff_0%,transparent_60%),radial-gradient(900px_500px_at_-10%_10%,#d5f7fb_0%,transparent_55%)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-ink-600 shadow-sm sm:inline">Демо · г. {city.name}</span>
          <Link href="/login" className="rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800">
            Войти
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <section className="grid items-center gap-10 pb-10 pt-4 lg:grid-cols-[1.1fr_0.9fr] lg:pt-10">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand-700 shadow-sm">
              <span className="size-1.5 rounded-full bg-ok-500" /> {stats.driversOnline} водовозов на линии сейчас
            </span>
            <h1 className="mt-5 text-[40px] font-extrabold leading-[1.02] tracking-[-0.04em] text-ink-900 sm:text-6xl">
              Вода к дому —<br />
              <span className="bg-gradient-to-r from-brand-600 to-aqua-500 bg-clip-text text-transparent">по вашей цене</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-600">
              Укажите адрес, объём и сколько готовы заплатить. Ближайшие водовозы примут заказ или предложат свою цену — вы выбираете лучшее.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="xl" onClick={() => enter('client')} iconRight={<ArrowRight className="size-5" />}>
                Заказать воду
              </Button>
              <Button size="xl" variant="outline" onClick={() => enter('driver')}>
                Я водитель
              </Button>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute -inset-6 rounded-[48px] bg-gradient-to-br from-brand-500/20 to-aqua-400/20 blur-2xl" />
            <div className="relative rounded-[36px] bg-white p-6 shadow-float">
              <TruckArt volume={10} className="h-56 w-full" />
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-ink-50 p-3">
                  <div className="text-xl font-extrabold text-ink-900 tabular">{stats.ordersToday}</div>
                  <div className="text-xs text-ink-500">заказов сегодня</div>
                </div>
                <div className="rounded-2xl bg-ink-50 p-3">
                  <div className="text-xl font-extrabold text-ink-900 tabular">≈ 12 мин</div>
                  <div className="text-xs text-ink-500">до прибытия</div>
                </div>
                <div className="rounded-2xl bg-ink-50 p-3">
                  <div className="text-xl font-extrabold text-ink-900 tabular">{formatMoney(stats.avgCheck)}</div>
                  <div className="text-xs text-ink-500">средний чек</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Демо-режим */}
        <section className="rounded-[32px] bg-white/80 p-5 shadow-card backdrop-blur sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">Demo Mode</div>
              <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-ink-900 sm:text-3xl">Войдите в один клик</h2>
              <p className="mt-1.5 max-w-xl text-[15px] text-ink-500">Без SMS, банковских карт и GPS. Все данные тестовые и хранятся в браузере.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw className="size-4" />}
              onClick={() => {
                resetDatabase(db.settings.cityId);
                toast.success('Демо-данные пересозданы');
              }}
            >
              Сбросить демо-данные
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {ROLES.map(({ role, title, text, icon: Icon, points }) => (
              <div key={role} className="group flex flex-col rounded-3xl bg-white p-5 ring-1 ring-ink-100 transition hover:-translate-y-0.5 hover:shadow-float">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="size-6" />
                  </span>
                  <div>
                    <div className="text-lg font-bold text-ink-900">{title}</div>
                    <div className="font-mono text-xs text-ink-400">{DEMO_ACCOUNTS[role].email} · demo123</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-ink-500">{text}</p>
                <ul className="mt-3 space-y-1.5">
                  {points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-ink-700">
                      <ShieldCheck className="size-4 text-aqua-500" /> {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex gap-2">
                  <Button block onClick={() => enter(role)}>
                    Войти
                  </Button>
                  <a
                    href={`/login?demo=${role}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Открыть в новой вкладке"
                    className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-ink-100 text-ink-600 transition hover:bg-ink-200"
                  >
                    <ExternalLink className="size-4.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-aqua-50 p-4 text-sm text-ink-700">
            <Users className="mt-0.5 size-5 shrink-0 text-aqua-600" />
            <div>
              <b>Совет для презентации:</b> откройте клиента и водителя в двух вкладках (кнопка <ExternalLink className="inline size-3.5" />) — заявка клиента появится у водителя, а его предложение цены — у клиента. Если вкладка водителя закрыта, демо-водители отвечают автоматически.
            </div>
          </div>
        </section>

        {/* Как это работает */}
        <section className="mt-12">
          <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-ink-900">Как это работает</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="rounded-3xl bg-white p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-3xl font-extrabold text-ink-100">{i + 1}</span>
                </div>
                <div className="mt-3 font-bold text-ink-900">{title}</div>
                <div className="text-sm text-ink-500">{text}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-ink-900 p-6 text-white md:col-span-2">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-aqua-400">Бизнес-модель</div>
            <div className="mt-2 text-2xl font-extrabold tracking-[-0.02em]">Комиссия сервиса с каждого заказа</div>
            <p className="mt-2 max-w-lg text-white/70">Клиент платит водителю цену сделки, сервис удерживает настраиваемую комиссию (по умолчанию 10%).</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <div className="text-xs text-white/60">Заказ</div>
                <div className="text-lg font-bold">2 700 ₽</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <div className="text-xs text-white/60">Водителю</div>
                <div className="text-lg font-bold">2 430 ₽</div>
              </div>
              <div className="rounded-2xl bg-aqua-500/25 p-3">
                <div className="text-xs text-white/60">Сервису</div>
                <div className="text-lg font-bold">270 ₽</div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-card">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">Новый водитель?</div>
            <div className="mt-2 text-xl font-extrabold tracking-[-0.02em] text-ink-900">Зарабатывайте на своей цистерне</div>
            <p className="mt-2 text-sm text-ink-500">Регистрация за 2 минуты, заявки рядом с вами.</p>
            <Link href="/register?role=driver" className="mt-4 inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700">
              Стать водителем <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-ink-100 py-6 text-center text-xs text-ink-400">Водовоз · демо-версия MVP · все данные вымышленные</footer>
    </div>
  );
}

export default function Home() {
  return (
    <DataGate>
      <Landing />
    </DataGate>
  );
}
