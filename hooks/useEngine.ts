'use client';

import { useEffect } from 'react';
import { engineTick, releaseLeadership } from '@/lib/store/engine';

/** Запускает симулятор демо-режима (только в одной вкладке-лидере) */
export function useEngine() {
  useEffect(() => {
    const t = window.setInterval(engineTick, 1000);
    engineTick();
    const release = () => releaseLeadership();
    window.addEventListener('beforeunload', release);
    return () => {
      window.clearInterval(t);
      window.removeEventListener('beforeunload', release);
      releaseLeadership();
    };
  }, []);
}
