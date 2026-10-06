'use client';

import { useMemo, useState } from 'react';
import { LocateFixed, MapPin, X } from 'lucide-react';
import type { City, LatLng } from '@/types';
import { geocode, suggestAddresses } from '@/lib/geo';
import { cn } from '@/lib/cn';

interface Props {
  city: City;
  value: string;
  onChange: (address: string, location?: LatLng) => void;
  /** Подставить «текущее местоположение» (в демо — сохранённый адрес) */
  onLocate?: () => void;
  autoFocus?: boolean;
  large?: boolean;
}

/** Поле «Куда доставить воду?» с подсказками демо-геокодера */
export function AddressField({ city, value, onChange, onLocate, autoFocus, large }: Props) {
  const [focused, setFocused] = useState(false);
  const suggestions = useMemo(() => (value.trim().length >= 2 ? suggestAddresses(value, city, 5) : []), [value, city]);
  const showList = focused && suggestions.length > 0 && !suggestions.includes(value);

  const pick = (addr: string) => {
    const g = geocode(addr, city);
    onChange(g.address, g.location);
    setFocused(false);
  };

  return (
    <div className="relative">
      <div className={cn('flex items-center gap-3 rounded-2xl bg-white px-4 ring-1 ring-inset ring-ink-200 transition focus-within:ring-2 focus-within:ring-brand-500', large ? 'h-15' : 'h-13')}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <MapPin className="size-4.5" />
        </span>
        <input
          value={value}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 150)}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) {
              e.preventDefault();
              pick(suggestions[0] ?? value);
            }
          }}
          placeholder={`г. ${city.name}, ул. Ленина, 15`}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-ink-900 outline-none placeholder:font-medium placeholder:text-ink-400"
          aria-label="Куда доставить воду?"
        />
        {value ? (
          <button type="button" onClick={() => onChange('')} aria-label="Очистить" className="text-ink-300 hover:text-ink-600">
            <X className="size-4.5" />
          </button>
        ) : (
          onLocate && (
            <button type="button" onClick={onLocate} aria-label="Моё местоположение" className="text-brand-600 hover:text-brand-700">
              <LocateFixed className="size-5" />
            </button>
          )
        )}
      </div>
      {showList && (
        <ul className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-white py-1.5 shadow-float ring-1 ring-ink-100">
          {suggestions.map((s) => (
            <li key={s}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-ink-50">
                <MapPin className="size-4 shrink-0 text-ink-400" />
                <span className="font-medium text-ink-800">{s}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
