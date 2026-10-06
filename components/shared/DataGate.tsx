'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useDBMaybe } from '@/hooks/useDB';
import { useSession } from '@/hooks/useSession';
import { LogoMark } from '@/components/brand/Logo';
import { findUser } from '@/lib/store/selectors';
import { logout } from '@/lib/auth';
import type { Role } from '@/types';

export function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f1f5fa]">
      <div className="flex flex-col items-center gap-4">
        <LogoMark size={56} className="animate-float" />
        <div className="h-1 w-24 overflow-hidden rounded-full bg-ink-100">
          <div className="shimmer h-full w-full" />
        </div>
      </div>
    </div>
  );
}

/** Дожидается загрузки данных и проверяет роль пользователя */
export function DataGate({ role, children }: { role?: Role; children: ReactNode }) {
  const db = useDBMaybe();
  const session = useSession();
  const router = useRouter();
  const user = db ? findUser(db, session?.userId) : undefined;
  const allowed = !role || (session?.role === role && !!user && !user.blocked);

  useEffect(() => {
    if (!db || !role) return;
    if (!allowed) {
      if (user?.blocked) logout();
      router.replace(`/login?role=${role}`);
    }
  }, [db, role, allowed, user, router]);

  if (!db || !allowed) return <Splash />;
  return <>{children}</>;
}
