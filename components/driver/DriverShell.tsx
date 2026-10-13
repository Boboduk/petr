'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { History, ListChecks, Navigation, UserRound } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { useCurrentUser } from '@/hooks/useSession';
import { useDriverHeartbeat } from '@/hooks/useDriverHeartbeat';
import { driverActiveOrder } from '@/lib/store/selectors';
import { cn } from '@/lib/cn';
import { driverOrderPath } from '@/lib/routes';

/** Оболочка водителя: отдельный интерфейс с тёмным акцентом */
export function DriverShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { db, driver } = useCurrentUser();
  useDriverHeartbeat(driver?.id);
  const active = driver ? driverActiveOrder(db, driver.id) : undefined;

  const nav = [
    { href: '/driver', label: 'Заявки', icon: ListChecks, exact: true },
    { href: driverOrderPath(active?.id), label: 'Заказ', icon: Navigation, badge: !!active, match: '/driver/order' },
    { href: '/driver/history', label: 'История', icon: History },
    { href: '/driver/profile', label: 'Профиль', icon: UserRound },
  ];
  const isActive = (n: (typeof nav)[number]) => (n.exact ? pathname === n.href : pathname.startsWith(n.match ?? n.href));

  return (
    <div className="min-h-dvh lg:pl-[88px]">
      <nav className="fixed inset-y-0 left-0 z-[1200] hidden w-[88px] flex-col items-center gap-2 bg-ink-900 py-5 lg:flex">
        <Link href="/driver" className="mb-1" aria-label="Водовоз">
          <LogoMark size={42} />
        </Link>
        <span className="mb-3 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-aqua-400">Водитель</span>
        {nav.map((n) => (
          <Link
            key={n.label}
            href={n.href}
            className={cn('relative flex w-[72px] flex-col items-center gap-1 rounded-2xl py-2.5 text-[11px] font-semibold transition', isActive(n) ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white')}
          >
            <n.icon className="size-5.5" />
            {n.label}
            {n.badge && <span className="absolute right-4 top-2 size-2.5 rounded-full bg-aqua-400 ring-2 ring-ink-900" />}
          </Link>
        ))}
      </nav>
      <div className="pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-0">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-[1200] bg-ink-900 pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {nav.map((n) => {
            const a = isActive(n);
            return (
              <Link key={n.label} href={n.href} className={cn('relative flex h-[68px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition', a ? 'text-white' : 'text-white/45')}>
                <span className={cn('flex h-8 w-14 items-center justify-center rounded-full transition', a && 'bg-white/10')}>
                  <n.icon className="size-5.5" />
                </span>
                {n.label}
                {n.badge && <span className="absolute left-1/2 top-2.5 ml-3 size-2.5 rounded-full bg-aqua-400 ring-2 ring-ink-900" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
