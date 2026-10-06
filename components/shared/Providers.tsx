'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { useEngine } from '@/hooks/useEngine';
import { useDBMaybe } from '@/hooks/useDB';
import { useSession } from '@/hooks/useSession';
import type { AppNotification, Role } from '@/types';

function EngineRunner() {
  useEngine();
  return null;
}

function notificationLink(n: AppNotification, role: Role): string | undefined {
  if (!n.orderId) return undefined;
  if (role === 'client') return `/client/order/${n.orderId}`;
  if (role === 'driver') return n.kind === 'new_order' ? '/driver' : `/driver/order/${n.orderId}`;
  return `/admin/orders?id=${n.orderId}`;
}

/** Показывает всплывающие уведомления текущей вкладки (имитация push) */
function NotificationToaster() {
  const db = useDBMaybe();
  const session = useSession();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const seen = useRef<Set<string> | null>(null);
  const userRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!db || !session) return;
    const mine = db.notifications.filter((n) => n.userId === session.userId);
    if (!seen.current || userRef.current !== session.userId) {
      seen.current = new Set(mine.map((n) => n.id));
      userRef.current = session.userId;
      return;
    }
    for (const n of [...mine].reverse()) {
      if (seen.current.has(n.id)) continue;
      seen.current.add(n.id);
      if (Date.now() - n.createdAt > 15_000) continue;
      // пользователь уже смотрит на этот заказ — экран обновится сам
      if (n.orderId && pathname.includes(n.orderId)) continue;
      const link = notificationLink(n, session.role);
      toast.show({ kind: n.kind === 'cancelled' ? 'error' : n.kind === 'completed' ? 'success' : 'info', title: n.title, body: n.body, onClick: link ? () => router.push(link) : undefined });
    }
  }, [db, session, toast, router, pathname]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <EngineRunner />
      <NotificationToaster />
      {children}
    </ToastProvider>
  );
}
