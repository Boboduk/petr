'use client';

import { useEffect } from 'react';
import { PageScaffold } from '@/components/client/ClientShell';
import { NotificationsList } from '@/components/shared/NotificationsList';
import { Button } from '@/components/ui/Button';
import { useCurrentUser } from '@/hooks/useSession';
import { markNotificationsRead } from '@/lib/store/actions';

export default function ClientNotificationsPage() {
  const { db, user } = useCurrentUser();
  const items = user ? db.notifications.filter((n) => n.userId === user.id) : [];
  const unread = items.filter((n) => !n.read).length;

  // помечаем прочитанными при уходе со страницы, чтобы пользователь успел увидеть новые
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    return () => markNotificationsRead(userId);
  }, [userId]);

  return (
    <PageScaffold
      title="Уведомления"
      subtitle={unread ? `${unread} новых` : 'Все прочитаны'}
      action={
        unread > 0 && user ? (
          <Button size="sm" variant="secondary" onClick={() => markNotificationsRead(user.id)}>
            Прочитать все
          </Button>
        ) : undefined
      }
    >
      <NotificationsList items={items} linkFor={(n) => (n.orderId ? `/client/order/${n.orderId}` : undefined)} />
    </PageScaffold>
  );
}
