'use client';

import { useEffect } from 'react';
import { PageScaffold } from '@/components/client/ClientShell';
import { NotificationsList } from '@/components/shared/NotificationsList';
import { Button } from '@/components/ui/Button';
import { useCurrentUser } from '@/hooks/useSession';
import { markNotificationsRead } from '@/lib/store/actions';

export default function DriverNotificationsPage() {
  const { db, user } = useCurrentUser();
  const items = user ? db.notifications.filter((n) => n.userId === user.id) : [];
  const unread = items.filter((n) => !n.read).length;
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
        unread > 0 && userId ? (
          <Button size="sm" variant="secondary" onClick={() => markNotificationsRead(userId)}>
            Прочитать все
          </Button>
        ) : undefined
      }
    >
      <NotificationsList items={items} linkFor={(n) => (n.orderId ? (n.kind === 'new_order' ? '/driver' : `/driver/order/${n.orderId}`) : undefined)} />
    </PageScaffold>
  );
}
