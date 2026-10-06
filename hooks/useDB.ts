'use client';

import { useSyncExternalStore } from 'react';
import type { Database } from '@/types';
import { getServerSnapshot, getSnapshot, subscribe } from '@/lib/store/store';

/** Реактивный доступ к базе. На сервере и до гидратации — null. */
export function useDBMaybe(): Database | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Использовать внутри оболочек, которые уже дождались загрузки данных. */
export function useDB(): Database {
  const db = useDBMaybe();
  if (!db) throw new Error('useDB() вызван до загрузки данных — оберните экран в <DataGate>');
  return db;
}
