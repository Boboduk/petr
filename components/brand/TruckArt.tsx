'use client';

import { useId } from 'react';
import { cn } from '@/lib/cn';

interface Props {
  cabColor?: string;
  volume?: number;
  className?: string;
  /** Если у водителя есть загруженное фото авто — показываем его */
  photo?: string;
  label?: string;
}

/** Иллюстрация водовоза — используется как «фото автомобиля» в демо */
export function TruckArt({ cabColor = '#2F6FED', volume, className, photo, label }: Props) {
  const gid = `tank-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={label ?? 'Автомобиль'} className={cn('rounded-2xl object-cover', className)} />;
  }
  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 via-white to-aqua-50', className)}>
      <svg viewBox="0 0 240 130" className="absolute inset-0 size-full" role="img" aria-label={label ?? 'Водовоз'}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F4F8FC" />
            <stop offset="0.45" stopColor="#D7E2EE" />
            <stop offset="1" stopColor="#A9BACD" />
          </linearGradient>
        </defs>
        <ellipse cx="120" cy="112" rx="96" ry="7" fill="#0A1A2F" opacity=".08" />
        {/* шасси */}
        <rect x="30" y="86" width="176" height="9" rx="3" fill="#24364F" />
        {/* цистерна */}
        <rect x="26" y="42" width="128" height="44" rx="22" fill={`url(#${gid})`} stroke="#8A98AC" strokeWidth="1.2" />
        <rect x="40" y="48" width="100" height="5" rx="2.5" fill="#fff" opacity=".7" />
        <path d="M76 58c3.8 4.6 6.6 8.2 6.6 11.7a6.6 6.6 0 0 1-13.2 0c0-3.5 2.8-7.1 6.6-11.7Z" fill="#1F6BFF" />
        {volume !== undefined && (
          <text x="112" y="74" fontSize="14" fontWeight="800" fill="#0A47BF" textAnchor="middle" fontFamily="inherit">
            {volume} м³
          </text>
        )}
        <rect x="84" y="36" width="16" height="7" rx="2" fill="#8A98AC" />
        {/* кабина */}
        <path d="M160 46h22c5 0 8 2 10.5 6.5L204 72c1.4 2.4 2 4.6 2 7.3V90h-46Z" fill={cabColor} />
        <path d="M166 52h14.5c3 0 4.6 1.2 6 3.8l6.5 12.7H166Z" fill="#0A1A2F" opacity=".72" />
        <path d="M170 55h9" stroke="#fff" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" />
        <rect x="198" y="80" width="9" height="5" rx="2" fill="#FFD166" />
        <rect x="160" y="74" width="12" height="3" rx="1.5" fill="#0A1A2F" opacity=".25" />
        {/* колёса */}
        {[56, 96, 182].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="97" r="13" fill="#15273F" />
            <circle cx={cx} cy="97" r="6" fill="#B7C2D1" />
            <circle cx={cx} cy="97" r="2" fill="#15273F" />
          </g>
        ))}
        {/* шланг */}
        <path d="M26 70c-8 0-12 6-12 12v8" stroke="#15273F" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}
