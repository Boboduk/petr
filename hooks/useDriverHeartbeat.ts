'use client';

import { useEffect } from 'react';
import { driverGone, driverHeartbeat } from '@/lib/store/actions';

/**
 * «Пульс» вкладки водителя: пока она открыта (даже в фоне), заказами
 * этого водителя управляет человек, а не симулятор демо-режима.
 */
export function useDriverHeartbeat(driverId: string | undefined) {
  useEffect(() => {
    if (!driverId) return;
    driverHeartbeat(driverId);
    const t = window.setInterval(() => driverHeartbeat(driverId), 4000);
    const gone = () => driverGone(driverId);
    window.addEventListener('pagehide', gone);
    return () => {
      window.clearInterval(t);
      window.removeEventListener('pagehide', gone);
      gone();
    };
  }, [driverId]);
}
