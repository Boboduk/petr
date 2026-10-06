'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Раскладка «карта + панель»:
 *  смартфон — карта сверху, под ней шторка с контентом, наезжающая на карту при прокрутке;
 *  десктоп — карта на весь экран, панель плавает слева.
 */
export function MapLayout({ map, overlay, children, mapHeight = 'h-[42dvh]', panelClassName }: { map: ReactNode; overlay?: ReactNode; children: ReactNode; mapHeight?: string; panelClassName?: string }) {
  return (
    <div className="relative lg:h-dvh lg:overflow-hidden">
      <div className={cn('sticky top-0 isolate lg:absolute lg:inset-0 lg:h-full', mapHeight)}>
        {map}
        {overlay && <div className="pointer-events-none absolute inset-x-0 top-0 z-[600] p-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:left-[480px] lg:p-5">{overlay}</div>}
      </div>
      <div
        className={cn(
          'relative z-10 -mt-7 min-h-[60dvh] rounded-t-[28px] bg-[#f6f9fc] shadow-[0_-12px_30px_-18px_rgba(10,26,47,0.35)]',
          'lg:absolute lg:bottom-5 lg:left-5 lg:top-5 lg:mt-0 lg:min-h-0 lg:w-[440px] lg:overflow-y-auto lg:rounded-[28px] lg:shadow-float',
          panelClassName,
        )}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-ink-200 lg:hidden" />
        {children}
      </div>
    </div>
  );
}
