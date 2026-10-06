'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock, Mail } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { DataGate } from '@/components/shared/DataGate';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Segmented } from '@/components/ui/Segmented';
import { DEMO_ACCOUNTS } from '@/data/users';
import { homePath, login } from '@/lib/auth';
import type { Role } from '@/types';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = (params.get('role') as Role) || 'client';
  const [role, setRole] = useState<Role>(['client', 'driver', 'admin'].includes(initialRole) ? initialRole : 'client');
  const [email, setEmail] = useState<string>(DEMO_ACCOUNTS[role].email);
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');

  // /login?demo=driver — мгновенный вход в новой вкладке
  useEffect(() => {
    const demo = params.get('demo') as Role | null;
    if (demo && DEMO_ACCOUNTS[demo]) {
      login(DEMO_ACCOUNTS[demo].email, DEMO_ACCOUNTS[demo].password);
      router.replace(homePath(demo));
    }
  }, [params, router]);

  const pickRole = (r: Role) => {
    setRole(r);
    setEmail(DEMO_ACCOUNTS[r].email);
    setPassword('demo123');
    setError('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const s = login(email, password);
      router.push(homePath(s.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(900px_500px_at_100%_0%,#d9e8ff_0%,transparent_60%)]">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900">
          <ArrowLeft className="size-4" /> На главную
        </Link>
        <Logo size={30} />
      </header>
      <main className="flex flex-1 items-start justify-center px-5 pb-10 sm:items-center">
        <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-float sm:p-8">
          <h1 className="text-2xl font-extrabold tracking-[-0.03em] text-ink-900">Вход</h1>
          <p className="mt-1 text-sm text-ink-500">Демо-аккаунты уже подставлены — просто нажмите «Войти»</p>
          <Segmented
            className="mt-5"
            value={role}
            onChange={pickRole}
            options={[
              { value: 'client', label: 'Клиент' },
              { value: 'driver', label: 'Водитель' },
              { value: 'admin', label: 'Админ' },
            ]}
          />
          <form onSubmit={submit} className="mt-5 space-y-4">
            <Input label="Email" type="email" autoComplete="email" icon={<Mail className="size-4.5" />} value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Пароль" type="password" autoComplete="current-password" icon={<Lock className="size-4.5" />} value={password} onChange={(e) => setPassword(e.target.value)} error={error || undefined} />
            <Button type="submit" size="lg" block>
              Войти
            </Button>
          </form>
          <div className="mt-5 rounded-2xl bg-ink-50 p-4 text-xs leading-relaxed text-ink-500">
            <div className="mb-1 font-semibold text-ink-700">Тестовые логины (пароль demo123)</div>
            {(['client', 'driver', 'admin'] as Role[]).map((r) => (
              <button key={r} type="button" onClick={() => pickRole(r)} className="block font-mono hover:text-brand-600">
                {DEMO_ACCOUNTS[r].email} — {DEMO_ACCOUNTS[r].label}
              </button>
            ))}
          </div>
          {role !== 'admin' && (
            <p className="mt-5 text-center text-sm text-ink-500">
              Нет аккаунта?{' '}
              <Link href={`/register?role=${role}`} className="font-semibold text-brand-600 hover:text-brand-700">
                Зарегистрироваться
              </Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <DataGate>
      <Suspense>
        <LoginForm />
      </Suspense>
    </DataGate>
  );
}
