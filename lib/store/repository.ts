import type { Database } from '@/types';

/**
 * Абстракция хранилища. Весь UI и бизнес-логика работают через неё,
 * поэтому localStorage можно заменить на Supabase/REST без переписывания экранов:
 * достаточно реализовать этот интерфейс (см. README → «Переход на реальную БД»).
 */
export interface DataRepository {
  /** Прочитать актуальное состояние (или null, если данных ещё нет) */
  read(): Database | null;
  /** Сохранить состояние целиком */
  write(db: Database): void;
  /** Подписка на изменения, сделанные в других вкладках/клиентах */
  onExternalChange(cb: () => void): () => void;
  clear(): void;
}

const KEY = 'vodovoz:db';

export class LocalStorageRepository implements DataRepository {
  private rawCache: string | null = null;
  private parsedCache: Database | null = null;

  read(): Database | null {
    if (typeof window === 'undefined') return null;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(KEY);
    } catch {
      return this.parsedCache;
    }
    if (raw === null) return null;
    if (raw === this.rawCache && this.parsedCache) return this.parsedCache;
    try {
      this.parsedCache = JSON.parse(raw) as Database;
      this.rawCache = raw;
      return this.parsedCache;
    } catch {
      return null;
    }
  }

  write(db: Database): void {
    const raw = JSON.stringify(db);
    this.rawCache = raw;
    this.parsedCache = db;
    try {
      window.localStorage.setItem(KEY, raw);
    } catch (e) {
      console.warn('[vodovoz] Не удалось сохранить данные в localStorage', e);
    }
  }

  onExternalChange(cb: () => void): () => void {
    const handler = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) cb();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }

  clear(): void {
    this.rawCache = null;
    this.parsedCache = null;
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
  }
}
