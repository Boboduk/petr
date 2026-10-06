'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Label({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <span className="text-[13px] font-semibold text-ink-700">{children}</span>
      {hint && <span className="text-xs text-ink-400">{hint}</span>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  suffix?: ReactNode;
  error?: string;
  inputClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, icon, suffix, error, className, inputClassName, ...rest }, ref) {
  return (
    <label className={cn('block', className)}>
      {label && <Label hint={hint}>{label}</Label>}
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-2xl bg-ink-50 px-4 ring-1 ring-inset ring-ink-100 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500',
          error && 'ring-bad-500',
        )}
      >
        {icon && <span className="shrink-0 text-ink-400">{icon}</span>}
        <input ref={ref} className={cn('h-12 w-full min-w-0 bg-transparent text-[15px] font-medium text-ink-900 outline-none placeholder:font-normal placeholder:text-ink-400', inputClassName)} {...rest} />
        {suffix && <span className="shrink-0 text-ink-500">{suffix}</span>}
      </div>
      {error && <span className="mt-1 block text-xs text-bad-600">{error}</span>}
    </label>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
}

export function Textarea({ label, hint, className, ...rest }: TextareaProps) {
  return (
    <label className={cn('block', className)}>
      {label && <Label hint={hint}>{label}</Label>}
      <textarea
        className="min-h-[88px] w-full resize-none rounded-2xl bg-ink-50 px-4 py-3 text-[15px] text-ink-900 outline-none ring-1 ring-inset ring-ink-100 transition placeholder:text-ink-400 focus:bg-white focus:ring-2 focus:ring-brand-500"
        {...rest}
      />
    </label>
  );
}

export function Select({ label, className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: ReactNode }) {
  return (
    <label className={cn('block', className)}>
      {label && <Label>{label}</Label>}
      <select
        className="h-12 w-full rounded-2xl bg-ink-50 px-4 text-[15px] font-medium text-ink-900 outline-none ring-1 ring-inset ring-ink-100 focus:bg-white focus:ring-2 focus:ring-brand-500"
        {...rest}
      >
        {children}
      </select>
    </label>
  );
}
