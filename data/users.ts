import type { User } from '@/types';

const DAY = 86_400_000;

export const DEMO_PASSWORD = 'demo123';

export const DEMO_ACCOUNTS = {
  client: { email: 'demo@client.ru', password: DEMO_PASSWORD, label: 'Клиент' },
  driver: { email: 'demo@driver.ru', password: DEMO_PASSWORD, label: 'Водитель' },
  admin: { email: 'demo@admin.ru', password: DEMO_PASSWORD, label: 'Администратор' },
} as const;

/** Демо-аккаунты и тестовые клиенты. Все данные вымышленные. */
export function seedUsers(now: number): User[] {
  const bots: Array<[string, string, string, number]> = [
    ['Ольга', '+7 900 100-10-11', '#0EA5E9', 120],
    ['Виктор', '+7 900 100-20-12', '#6366F1', 96],
    ['Елена', '+7 900 100-30-13', '#14B8A6', 80],
    ['Тимур', '+7 900 100-40-14', '#F59E0B', 61],
    ['Мария', '+7 900 100-50-15', '#EC4899', 44],
    ['Георгий', '+7 900 100-60-16', '#8B5CF6', 33],
    ['Светлана', '+7 900 100-70-17', '#10B981', 21],
    ['Константин', '+7 900 100-80-18', '#F43F5E', 9],
  ];
  return [
    {
      id: 'usr_client_demo',
      role: 'client',
      name: 'Анна',
      phone: '+7 900 000-00-01',
      email: 'demo@client.ru',
      password: DEMO_PASSWORD,
      createdAt: now - 140 * DAY,
      avatarColor: '#0B63E5',
    },
    {
      id: 'usr_driver_demo',
      role: 'driver',
      name: 'Алексей',
      phone: '+7 900 000-00-02',
      email: 'demo@driver.ru',
      password: DEMO_PASSWORD,
      createdAt: now - 410 * DAY,
      driverId: 'drv_alexey',
    },
    {
      id: 'usr_admin_demo',
      role: 'admin',
      name: 'Администратор',
      phone: '+7 900 000-00-03',
      email: 'demo@admin.ru',
      password: DEMO_PASSWORD,
      createdAt: now - 500 * DAY,
    },
    ...bots.map(([name, phone, color, days], i): User => ({
      id: `usr_bot_${i + 1}`,
      role: 'client',
      name,
      phone,
      email: `client${i + 1}@demo.test`,
      password: DEMO_PASSWORD,
      createdAt: now - days * DAY,
      isBot: true,
      avatarColor: color,
    })),
  ];
}
