'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** sheet — нижняя шторка на мобильных; на десктопе всегда диалог */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  bodyClassName?: string;
  hideClose?: boolean;
}

const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

/** Модальное окно: bottom-sheet на смартфоне, центрированный диалог на десктопе */
export function Modal({ open, onClose, title, children, footer, size = 'md', className, bodyClassName, hideClose }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-950/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-float animate-sheet sm:rounded-[28px]',
          widths[size],
          className,
        )}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-ink-200 sm:hidden" />
        {(title || !hideClose) && (
          <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-2 pt-4 sm:px-6 sm:pt-5">
            <div className="min-w-0 text-lg font-bold tracking-[-0.02em] text-ink-900">{title}</div>
            {!hideClose && (
              <button onClick={onClose} aria-label="Закрыть" className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-600 transition hover:bg-ink-200">
                <X className="size-5" />
              </button>
            )}
          </div>
        )}
        <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6', bodyClassName)}>{children}</div>
        {footer && <div className="shrink-0 border-t border-ink-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  text,
  confirmText = 'Подтвердить',
  danger,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  text?: string;
  confirmText?: string;
  danger?: boolean;
  children?: ReactNode;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {text && <p className="text-[15px] text-ink-600">{text}</p>}
      {children}
      <div className="mt-5 flex gap-2">
        <button onClick={onClose} className="h-12 flex-1 rounded-2xl bg-ink-100 font-semibold text-ink-700 transition hover:bg-ink-200">
          Назад
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={cn('h-12 flex-1 rounded-2xl font-semibold text-white transition', danger ? 'bg-bad-500 hover:bg-bad-600' : 'bg-brand-600 hover:bg-brand-700')}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
