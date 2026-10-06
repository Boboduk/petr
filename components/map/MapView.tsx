'use client';

import dynamic from 'next/dynamic';
import type { MapViewProps } from './types';

/** Карта на Leaflet + OpenStreetMap. Загружается только в браузере. */
const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => <div className="shimmer size-full" />,
});

export function MapView(props: MapViewProps) {
  return <MapInner {...props} />;
}

export type { MapMarker, MapViewProps } from './types';
