import type { City, LatLng } from '@/types';
import { hashString, seededRandom } from './id';

const R = 6371; // км

export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Расстояние «по дорогам» — грубая поправка к прямой для демо. */
export function roadDistanceKm(a: LatLng, b: LatLng): number {
  return distanceKm(a, b) * 1.3;
}

/** Время прибытия: средняя скорость водовоза в городе ~28 км/ч + 3 мин на сборы. */
export function etaMinutes(a: LatLng, b: LatLng): number {
  return Math.max(4, Math.round((roadDistanceKm(a, b) / 28) * 60 + 3));
}

export function offsetPoint(center: LatLng, offset: LatLng): LatLng {
  return [round6(center[0] + offset[0]), round6(center[1] + offset[1])];
}

function round6(n: number) {
  return Math.round(n * 1e6) / 1e6;
}

/**
 * Генерирует правдоподобный маршрут «по кварталам» без платных routing-API.
 * В продакшене заменяется на OSRM / Valhalla / GraphHopper (см. README).
 */
export function buildRoute(from: LatLng, to: LatLng, seed = 1): LatLng[] {
  const rnd = seededRandom(seed);
  const pts: LatLng[] = [from];
  const steps = 3 + Math.floor(rnd() * 2);
  let cur = from;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const target: LatLng = [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
    // чередуем движение по «широте» и «долготе», как по сетке улиц
    const jitter = (rnd() - 0.5) * 0.0025;
    const corner: LatLng = i % 2 === 1 ? [cur[0], target[1] + jitter] : [target[0] + jitter, cur[1]];
    pts.push(corner);
    const next: LatLng = i % 2 === 1 ? [target[0], corner[1]] : [corner[0], target[1]];
    pts.push(next);
    cur = next;
  }
  pts.push([cur[0], to[1]]);
  pts.push(to);
  return pts.map(([a, b]) => [round6(a), round6(b)] as LatLng);
}

export function routeLength(route: LatLng[]): number {
  let sum = 0;
  for (let i = 1; i < route.length; i++) sum += distanceKm(route[i - 1], route[i]);
  return sum;
}

/** Точка на маршруте при прогрессе 0..1 (по длине) */
export function pointAlong(route: LatLng[], progress: number): LatLng {
  if (route.length === 0) return [0, 0];
  if (progress <= 0) return route[0];
  if (progress >= 1) return route[route.length - 1];
  const total = routeLength(route);
  let target = total * progress;
  for (let i = 1; i < route.length; i++) {
    const seg = distanceKm(route[i - 1], route[i]);
    if (target <= seg) {
      const t = seg === 0 ? 0 : target / seg;
      const [a, b] = [route[i - 1], route[i]];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    target -= seg;
  }
  return route[route.length - 1];
}

/** Оставшаяся часть маршрута — для отрисовки «хвоста» на карте */
export function remainingRoute(route: LatLng[], progress: number): LatLng[] {
  if (route.length < 2) return route;
  const pos = pointAlong(route, progress);
  const total = routeLength(route);
  let passed = total * Math.min(1, Math.max(0, progress));
  for (let i = 1; i < route.length; i++) {
    const seg = distanceKm(route[i - 1], route[i]);
    if (passed <= seg) return [pos, ...route.slice(i)];
    passed -= seg;
  }
  return [route[route.length - 1]];
}

/* ---------- Демо-геокодер ----------
 * Превращает адрес в координаты внутри выбранного города детерминированно,
 * чтобы один и тот же адрес всегда попадал в одну точку.
 * Интерфейс совместим с реальными геокодерами (Nominatim, DaData, 2ГИС).
 */
export interface GeocodeResult {
  address: string;
  location: LatLng;
}

export function geocode(address: string, city: City): GeocodeResult {
  const clean = address.trim();
  const rnd = seededRandom(hashString(clean.toLowerCase()));
  const location: LatLng = [
    round6(city.center[0] + (rnd() - 0.5) * 0.05),
    round6(city.center[1] + (rnd() - 0.5) * 0.09),
  ];
  return { address: withCity(clean, city), location };
}

export function reverseGeocode(location: LatLng, city: City): string {
  const h = hashString(`${location[0].toFixed(4)}:${location[1].toFixed(4)}`);
  const street = city.streets[h % city.streets.length];
  const house = (h % 87) + 1;
  return `г. ${city.name}, ${street}, ${house}`;
}

export function withCity(address: string, city: City): string {
  if (address.toLowerCase().includes(city.name.toLowerCase())) return address;
  return `г. ${city.name}, ${address}`;
}

export function suggestAddresses(query: string, city: City, limit = 5): string[] {
  const q = query.trim().toLowerCase().replace(/^г\.?\s*[а-яё-]+,?\s*/i, '');
  const houseMatch = q.match(/(\d+[а-я]?)\s*$/i);
  const house = houseMatch ? houseMatch[1] : '';
  const streetQuery = q.replace(/[\d,]+[а-я]?\s*$/i, '').replace(/^(ул\.?|улица|пр\.?|проспект)\s*/i, '').trim();
  const list = city.streets.filter((s) => !streetQuery || s.toLowerCase().includes(streetQuery));
  return list.slice(0, limit).map((s) => `г. ${city.name}, ${s}${house ? `, ${house}` : ''}`);
}

/** Короткий адрес без города: «ул. Ленина, 15» */
export function shortAddress(address: string): string {
  return address.replace(/^г\.\s*[^,]+,\s*/, '');
}
