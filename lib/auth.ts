import type { Driver, Role, Session, User } from '@/types';
import { mutate, readDB } from './store/store';
import { DomainError } from './store/actions';
import { uid } from './id';
import { normalizePhone } from './format';
import { currentCity } from './store/selectors';
import { offsetPoint } from './geo';

/**
 * Демо-авторизация. Сессия хранится в sessionStorage (у каждой вкладки своя роль —
 * можно открыть клиента и водителя рядом), а последняя — в localStorage для удобства.
 * В продакшене заменяется на Supabase Auth / SMS-OTP.
 */
const SESSION_KEY = 'vodovoz:session';
const listeners = new Set<() => void>();
let cached: { raw: string | null; value: Session | null } = { raw: null, value: null };

function readRaw(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(SESSION_KEY) ?? window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  const raw = readRaw();
  if (raw === cached.raw) return cached.value;
  let value: Session | null = null;
  try {
    value = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    value = null;
  }
  cached = { raw, value };
  return value;
}

export function subscribeSession(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function setSession(s: Session | null) {
  try {
    if (s) {
      const raw = JSON.stringify(s);
      window.sessionStorage.setItem(SESSION_KEY, raw);
      window.localStorage.setItem(SESSION_KEY, raw);
    } else {
      window.sessionStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* noop */
  }
  listeners.forEach((l) => l());
}

export function login(email: string, password: string): Session {
  const db = readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) throw new DomainError('Неверный email или пароль');
  if (user.blocked) throw new DomainError('Аккаунт заблокирован администратором');
  const s: Session = { userId: user.id, role: user.role };
  setSession(s);
  return s;
}

export function logout() {
  setSession(null);
}

export function homePath(role: Role): string {
  return role === 'client' ? '/client' : role === 'driver' ? '/driver' : '/admin';
}

export interface ClientRegistration {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export interface DriverRegistration extends ClientRegistration {
  brand: string;
  model: string;
  plate: string;
  tankVolume: number;
  photo?: string;
  experienceYears: number;
}

function assertUnique(users: User[], email: string) {
  if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) throw new DomainError('Пользователь с таким email уже существует');
}

export function registerClient(input: ClientRegistration): Session {
  const user = mutate((db) => {
    assertUnique(db.users, input.email);
    const u: User = {
      id: uid('usr'),
      role: 'client',
      name: input.name.trim(),
      phone: normalizePhone(input.phone),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      createdAt: Date.now(),
      avatarColor: '#0B63E5',
    };
    db.users.push(u);
    db.notifications.unshift({
      id: uid('ntf'),
      userId: u.id,
      kind: 'system',
      title: `Добро пожаловать, ${u.name}!`,
      body: 'Укажите адрес и объём — ближайшие водовозы предложат цену за пару минут.',
      createdAt: Date.now(),
      read: false,
    });
    return u;
  });
  const s: Session = { userId: user.id, role: 'client' };
  setSession(s);
  return s;
}

export function registerDriver(input: DriverRegistration): Session {
  const user = mutate((db) => {
    assertUnique(db.users, input.email);
    const city = currentCity(db);
    const userId = uid('usr');
    const driverId = uid('drv');
    const offset: [number, number] = [(Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.06];
    const now = Date.now();
    const driver: Driver = {
      id: driverId,
      userId,
      name: input.name.trim(),
      phone: normalizePhone(input.phone),
      photo: undefined,
      avatarColor: '#0B63E5',
      rating: 5,
      ratingCount: 0,
      ordersCount: 0,
      experienceYears: input.experienceYears,
      vehicle: {
        brand: input.brand.trim(),
        model: input.model.trim(),
        plate: input.plate.trim().toUpperCase(),
        tankVolume: input.tankVolume,
        year: new Date().getFullYear() - 5,
        color: '#2F6FED',
        photo: input.photo,
      },
      homeOffset: offset,
      location: offsetPoint(city.center, offset),
      online: false,
      verification: 'pending',
      blocked: false,
      priceFactor: 1,
      documents: [
        { id: 'license', title: 'Водительское удостоверение', number: 'загружено', status: 'pending' },
        { id: 'sts', title: 'СТС автомобиля', number: 'загружено', status: 'pending' },
        { id: 'sanpass', title: 'Санитарный паспорт цистерны', number: 'загружено', status: 'pending' },
        { id: 'med', title: 'Медицинская книжка', number: 'загружено', status: 'pending' },
      ],
      reviews: [],
      joinedAt: now,
    };
    const u: User = {
      id: userId,
      role: 'driver',
      name: driver.name,
      phone: driver.phone,
      email: input.email.trim().toLowerCase(),
      password: input.password,
      createdAt: now,
      driverId,
    };
    db.users.push(u);
    db.drivers.push(driver);
    db.notifications.unshift({
      id: uid('ntf'),
      userId,
      kind: 'system',
      title: 'Профиль отправлен на проверку',
      body: 'В демо-режиме можно сразу выйти на линию. Администратор подтвердит документы.',
      createdAt: now,
      read: false,
    });
    return u;
  });
  const s: Session = { userId: user.id, role: 'driver' };
  setSession(s);
  return s;
}
