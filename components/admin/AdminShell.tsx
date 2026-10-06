'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { ClipboardList, LayoutDashboard, LogOut, Settings, Truck, Users } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { useCurrentUser } from '@/hooks/useSession';
import { currentCity } from '@/lib/store/selectors';
import { logout } from '@/lib/auth';
import { ACTIVE_STATUSES } from '@/lib/status';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Заказы', icon: ClipboardList },
  { href: '/admin/drivers', label: 'Водители', icon: Truck },
  { href: '/admin/clients', label: 'Клиенты', icon: Users },
  { href: '/admin/settings', label: 'Настройки', icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { db, user } = useCurrentUser();
  const city = currentCity(db);
  const active = db.orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-dvh bg-[#f1f5fa] lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-[1200] hidden w-64 flex-col border-r border-ink-100 bg-white p-4 lg:flex">
        <div className="px-2 py-2">
          <Logo />
          <div className="mt-1 pl-[46px] text-xs font-semibold text-ink-400">Панель администратора</div>
        </div>
        <nav className="mt-6 space-y-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href} className={cn('flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition', isActive(href, exact) ? 'bg-brand-600 text-white shadow-glow' : 'text-ink-600 hover:bg-ink-50')}>
              <Icon className="size-5" />
              {label}
              {href === '/admin/orders' && active > 0 && <span className={cn('ml-auto rounded-full px-2 py-0.5 text-xs', isActive(href) ? 'bg-white/20' : 'bg-brand-50 text-brand-700')}>{active}</span>}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-ink-50 p-3">
          <div className="text-xs text-ink-400">Город</div>
          <div className="font-bold text-ink-900">{city.name}</div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-700">{user?.name}</span>
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="flex size-8 items-center justify-center rounded-xl text-ink-400 hover:bg-white hover:text-bad-500"
              aria-label="Выйти"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-[1100] border-b border-ink-100 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Logo size={30} />
          <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-bold text-ink-600">Админ · {city.name}</span>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href} className={cn('flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold', isActive(href, exact) ? 'bg-brand-600 text-white' : 'text-ink-600')}>
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}

export function AdminTitle({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-[-0.035em] text-ink-900">{title}</h1>
        {subtitle && <div className="mt-0.5 text-sm text-ink-500">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}
