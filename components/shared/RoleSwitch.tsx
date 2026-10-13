'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftRight, ExternalLink } from 'lucide-react';
import type { Role } from '@/types';
import { DEMO_ACCOUNTS } from '@/data/users';
import { homePath, login } from '@/lib/auth';
import { IS_NATIVE_APP } from '@/lib/platform';

const NAMES: Record<Role, [string, string]> = {
  client: ['клиента', 'клиента'],
  driver: ['водителя', 'водителя'],
  admin: ['администратора', 'администратора'],
};

/**
 * Демо-переход в другую роль.
 * В браузере — новая вкладка (обе роли работают одновременно),
 * в Android-приложении — переключение роли в том же окне.
 */
export function RoleSwitchRow({ role }: { role: Role }) {
  const router = useRouter();
  const cls = 'flex w-full items-center justify-between p-4 text-left text-sm font-semibold text-ink-800 hover:bg-ink-50';
  if (IS_NATIVE_APP) {
    return (
      <button
        className={cls}
        onClick={() => {
          login(DEMO_ACCOUNTS[role].email, DEMO_ACCOUNTS[role].password);
          router.push(homePath(role));
        }}
      >
        Переключиться на {NAMES[role][0]} <ArrowLeftRight className="size-4 text-ink-400" />
      </button>
    );
  }
  return (
    <a href={`/login?demo=${role}`} target="_blank" rel="noreferrer" className={cls}>
      Открыть {NAMES[role][1]} в новой вкладке <ExternalLink className="size-4 text-ink-400" />
    </a>
  );
}
