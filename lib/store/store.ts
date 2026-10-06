import type { Database } from '@/types';
import { createSeed, DB_VERSION } from '@/data/seed';
import { LocalStorageRepository, type DataRepository } from './repository';

/**
 * Реактивное хранилище поверх репозитория.
 * mutate() всегда перечитывает свежие данные перед изменением —
 * так клиент, водитель и админ в разных вкладках видят одно состояние.
 */
const repo: DataRepository = new LocalStorageRepository();
const listeners = new Set<() => void>();
let snapshot: Database | null = null;
let externalUnsub: (() => void) | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function ensure(): Database {
  let db = repo.read();
  if (!db || db.version !== DB_VERSION) {
    db = createSeed();
    repo.write(db);
  }
  return db;
}

export function getSnapshot(): Database | null {
  if (typeof window === 'undefined') return null;
  if (!snapshot) snapshot = ensure();
  return snapshot;
}

export function getServerSnapshot(): Database | null {
  return null;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!externalUnsub && typeof window !== 'undefined') {
    externalUnsub = repo.onExternalChange(() => {
      snapshot = ensure();
      emit();
    });
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && externalUnsub) {
      externalUnsub();
      externalUnsub = null;
    }
  };
}

/** Атомарное изменение данных. Возвращает результат функции-мутатора. */
export function mutate<T>(fn: (db: Database) => T): T {
  const fresh = ensure();
  const draft = structuredClone(fresh);
  const result = fn(draft);
  repo.write(draft);
  snapshot = draft;
  emit();
  return result;
}

export function readDB(): Database {
  return getSnapshot() ?? ensure();
}

export function resetDatabase(cityId?: string) {
  repo.clear();
  const db = createSeed(cityId);
  repo.write(db);
  snapshot = db;
  emit();
}
