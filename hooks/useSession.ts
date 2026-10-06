'use client';

import { useSyncExternalStore } from 'react';
import type { Session } from '@/types';
import { getSession, subscribeSession } from '@/lib/auth';
import { useDB } from './useDB';
import { findDriver, findUser } from '@/lib/store/selectors';

export function useSession(): Session | null {
  return useSyncExternalStore(subscribeSession, getSession, () => null);
}

/** Текущий пользователь (и профиль водителя, если роль driver) */
export function useCurrentUser() {
  const session = useSession();
  const db = useDB();
  const user = findUser(db, session?.userId);
  const driver = user?.driverId ? findDriver(db, user.driverId) : undefined;
  return { session, user, driver, db };
}
