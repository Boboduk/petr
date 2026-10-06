'use client';

import { useId } from 'react';
import { cn } from '@/lib/cn';

/** Знак «Водовоз»: капля с волной и линией движения */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  // уникальный id градиента: одинаковые id в скрытом SVG ломают заливку в Chrome
  const gid = `vv-g-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="6" y1="2" x2="34" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2DD4E8" />
          <stop offset="0.55" stopColor="#1F6BFF" />
          <stop offset="1" stopColor="#0A47BF" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill={`url(#${gid})`} />
      <path d="M20 8.5c4.6 5.6 8 10 8 14.3A8 8 0 0 1 12 22.8c0-4.3 3.4-8.7 8-14.3Z" fill="#fff" />
      <path d="M13.2 24.6c2.2-1.6 4.4-1.6 6.6 0s4.4 1.6 6.6 0" stroke="#1F6BFF" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M4 31.5h7M6.5 35h5" stroke="#fff" strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, light, size = 36 }: { className?: string; light?: boolean; size?: number }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      <span className={cn('text-[19px] font-extrabold tracking-[-0.03em]', light ? 'text-white' : 'text-ink-900')}>
        Водовоз
      </span>
    </span>
  );
}
