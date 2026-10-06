'use client';

import Link from 'next/link';
import { Bell, CheckCheck, CircleCheck, MessageCircle, Radar, Tag, Truck, XCircle, MapPin, Info } from 'lucide-react';
import type { AppNotification, NotificationKind } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { timeAgo } from '@/lib/format';
import { useNow } from '@/hooks/useNow';
import { cn } from '@/lib/cn';

const ICONS: Record<NotificationKind, typeof Bell> = {
  search: Radar,
  offer: Tag,
  selected: CircleCheck,
  en_route: Truck,
  arrived: MapPin,
  completed: CheckCheck,
  cancelled: XCircle,
  new_order: Bell,
  message: MessageCircle,
  system: Info,
};

export function NotificationsList({ items, linkFor }: { items: AppNotification[]; linkFor: (n: AppNotification) => string | undefined }) {
  const now = useNow(15000);
  if (!items.length) return <EmptyState icon={<Bell className="size-7" />} title="Пока тихо" text="Здесь появятся предложения водителей и статусы ваших заказов" />;
  return (
    <ul className="space-y-2">
      {items.map((n) => {
        const Icon = ICONS[n.kind] ?? Bell;
        const href = linkFor(n);
        const body = (
          <div className={cn('flex gap-3 rounded-2xl p-3.5 transition', n.read ? 'bg-white' : 'bg-brand-50/70', href && 'hover:bg-ink-50')}>
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-2xl',
                n.kind === 'cancelled' ? 'bg-bad-50 text-bad-600' : n.kind === 'completed' ? 'bg-ok-50 text-ok-600' : 'bg-white text-brand-600 shadow-sm',
              )}
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[15px] font-semibold leading-snug text-ink-900">{n.title}</div>
                {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-600" />}
              </div>
              <div className="mt-0.5 text-sm leading-snug text-ink-500">{n.body}</div>
              <div className="mt-1 text-xs text-ink-400">{timeAgo(n.createdAt, now)}</div>
            </div>
          </div>
        );
        return <li key={n.id}>{href ? <Link href={href}>{body}</Link> : body}</li>;
      })}
    </ul>
  );
}
