'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Bell, ClipboardList, Home, User } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { useCurrentUser } from '@/hooks/useSession';
import { unreadCount } from '@/lib/store/selectors';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/client', label: 'Главная', icon: Home, exact: true },
  { href: '/client/orders', label: 'Заказы', icon: ClipboardList },
  { href: '/client/notifications', label: 'Уведомления', icon: Bell },
  { href: '/client/profile', label: 'Профиль', icon: User },
];

/** Оболочка клиента: нижняя навигация на смартфоне, боковая панель на десктопе */
export function ClientShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { db, user } = useCurrentUser();
  const unread = user ? unreadCount(db, user.id) : 0;
  const focusFlow = pathname.startsWith('/client/new') || pathname.startsWith('/client/order/');

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href) || (href === '/client/orders' && pathname.startsWith('/client/order/')));

  return (
    <div className="min-h-dvh lg:pl-[88px]">
      {/* Боковая навигация (десктоп) */}
      <nav className="fixed inset-y-0 left-0 z-[1200] hidden w-[88px] flex-col items-center gap-2 border-r border-ink-100 bg-white py-5 lg:flex">
        <Link href="/client" className="mb-4" aria-label="Водовоз">
          <LogoMark size={42} />
        </Link>
        {NAV.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn('relative flex w-[72px] flex-col items-center gap-1 rounded-2xl py-2.5 text-[11px] font-semibold transition', isActive(href, exact) ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800')}
          >
            <Icon className="size-5.5" />
            {label}
            {href === '/client/notifications' && unread > 0 && <span className="absolute right-3 top-1.5 flex min-w-4.5 items-center justify-center rounded-full bg-bad-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
          </Link>
        ))}
      </nav>

      <div className={cn(!focusFlow && 'pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-0')}>{children}</div>

      {/* Нижняя навигация (смартфон) */}
      {!focusFlow && (
        <nav className="fixed inset-x-0 bottom-0 z-[1200] border-t border-ink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-4">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link key={href} href={href} className={cn('relative flex h-[68px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition', active ? 'text-brand-600' : 'text-ink-400')}>
                  <span className={cn('flex h-8 w-14 items-center justify-center rounded-full transition', active && 'bg-brand-50')}>
                    <Icon className="size-5.5" strokeWidth={active ? 2.4 : 2} />
                  </span>
                  {label}
                  {href === '/client/notifications' && unread > 0 && <span className="absolute left-1/2 top-2 ml-2 flex min-w-4.5 items-center justify-center rounded-full bg-bad-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

/** Стандартная страница со своим заголовком */
export function PageScaffold({ title, subtitle, action, children, className }: { title: string; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-3xl px-4 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 lg:pt-8', className)}>
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.035em] text-ink-900">{title}</h1>
          {subtitle && <div className="mt-0.5 text-sm text-ink-500">{subtitle}</div>}
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}
