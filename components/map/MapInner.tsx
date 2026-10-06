'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { LatLng } from '@/types';
import { ACTIVE_TILES } from '@/lib/map';
import type { MapMarker, MapPadding, MapViewProps } from './types';

const TRUCK_SVG =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>';
const DROP_SVG =
  '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>';

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
}

function iconFor(m: MapMarker): L.DivIcon {
  if (m.kind === 'client') {
    return L.divIcon({ className: 'vv-marker', html: '<div class="vv-pin"><span class="vv-pin-pulse"></span><span class="vv-pin-core"></span></div>', iconSize: [44, 44], iconAnchor: [22, 22] });
  }
  if (m.kind === 'order') {
    const html = `<div class="vv-order${m.active ? ' is-active' : ''}"><span class="dot">${DROP_SVG}</span>${esc(m.label ?? '')}</div>`;
    return L.divIcon({ className: 'vv-marker', html, iconSize: [80, 30], iconAnchor: [16, 15] });
  }
  const cls = ['vv-truck', m.active && 'is-active', m.kind === 'me' && 'is-me', m.busy && 'is-busy'].filter(Boolean).join(' ');
  const color = m.active || m.kind === 'me' ? '#fff' : '#0B57E8';
  const tag = m.tag ? `<span class="vv-tag">${esc(m.tag)}</span>` : '';
  return L.divIcon({ className: 'vv-marker', html: `<div class="${cls}" style="color:${color}">${tag}${TRUCK_SVG}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] });
}

function MarkerItem({ m }: { m: MapMarker }) {
  const icon = useMemo(() => iconFor(m), [m.kind, m.label, m.tag, m.active, m.busy]); // eslint-disable-line react-hooks/exhaustive-deps
  const handlers = useMemo(() => (m.onClick ? { click: () => m.onClick?.() } : undefined), [m]);
  return <Marker position={m.position} icon={icon} eventHandlers={handlers} zIndexOffset={m.kind === 'client' ? 500 : m.active || m.kind === 'me' ? 1000 : 0} />;
}

function toPadding(p?: MapPadding): L.FitBoundsOptions {
  return {
    paddingTopLeft: [p?.left ?? 40, p?.top ?? 40],
    paddingBottomRight: [p?.right ?? 40, p?.bottom ?? 40],
    maxZoom: 16,
  };
}

function Controller({ center, zoom, fitTo, fitKey, padding, onMapClick }: Pick<MapViewProps, 'center' | 'zoom' | 'fitTo' | 'fitKey' | 'padding' | 'onMapClick'>) {
  const map = useMap();
  const first = useRef(true);
  const centerKey = `${center[0].toFixed(5)}:${center[1].toFixed(5)}:${zoom ?? ''}`;

  useMapEvents({
    click(e) {
      onMapClick?.([e.latlng.lat, e.latlng.lng]);
    },
  });

  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);

  useEffect(() => {
    if (fitTo && fitTo.length > 1) {
      const bounds = L.latLngBounds(fitTo.map((p) => L.latLng(p[0], p[1])));
      map.flyToBounds(bounds, { ...toPadding(padding), duration: first.current ? 0 : 0.8 });
    } else if (!first.current) {
      map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.8 });
    }
    first.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, centerKey]);

  return null;
}

const radarIcon = L.divIcon({ className: 'vv-marker', html: '<div class="vv-radar"><span></span><span></span><span></span></div>', iconSize: [360, 360], iconAnchor: [180, 180] });

export default function MapInner({ center, zoom = 13, markers = [], route, routePassed, fitTo, fitKey, padding, radar, onMapClick, className, zoomControl = true }: MapViewProps) {
  const routeLatLng = useMemo(() => route?.map((p) => [p[0], p[1]] as [number, number]), [route]);
  return (
    <MapContainer center={center as [number, number]} zoom={zoom} zoomControl={false} attributionControl className={className} style={{ height: '100%', width: '100%' }}>
      <TileLayer url={ACTIVE_TILES.url} attribution={ACTIVE_TILES.attribution} subdomains={ACTIVE_TILES.subdomains} detectRetina />
      {zoomControl && <ZoomControl />}
      <Controller center={center} zoom={zoom} fitTo={fitTo} fitKey={fitKey} padding={padding} onMapClick={onMapClick} />
      {radar && <Marker position={radar} icon={radarIcon} interactive={false} zIndexOffset={-1000} />}
      {routePassed && routePassed.length > 1 && <Polyline positions={routePassed as LatLng[]} pathOptions={{ color: '#8A98AC', weight: 5, opacity: 0.55, dashArray: '2 8', lineCap: 'round' }} />}
      {routeLatLng && routeLatLng.length > 1 && (
        <>
          <Polyline positions={routeLatLng} pathOptions={{ color: '#fff', weight: 9, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} />
          <Polyline positions={routeLatLng} pathOptions={{ color: '#0B57E8', weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }} />
        </>
      )}
      {markers.map((m) => (
        <MarkerItem key={m.id} m={m} />
      ))}
    </MapContainer>
  );
}

function ZoomControl() {
  const map = useMap();
  useEffect(() => {
    const ctl = L.control.zoom({ position: 'bottomright', zoomInTitle: 'Приблизить', zoomOutTitle: 'Отдалить' });
    ctl.addTo(map);
    return () => {
      ctl.remove();
    };
  }, [map]);
  return null;
}
