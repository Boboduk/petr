import type { LatLng } from '@/types';

export type MarkerKind = 'client' | 'truck' | 'order' | 'me';

export interface MapMarker {
  id: string;
  position: LatLng;
  kind: MarkerKind;
  /** Подпись над маркером (например «≈ 8 мин») */
  tag?: string;
  /** Текст внутри маркера заказа (например «5 м³») */
  label?: string;
  active?: boolean;
  busy?: boolean;
  onClick?: () => void;
}

export interface MapPadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface MapViewProps {
  center: LatLng;
  zoom?: number;
  markers?: MapMarker[];
  /** Пройденная (серым) и оставшаяся (синим) часть маршрута */
  route?: LatLng[];
  routePassed?: LatLng[];
  /** Точки, в которые нужно вписать карту; пересчитывается при изменении fitKey */
  fitTo?: LatLng[];
  fitKey?: string;
  padding?: MapPadding;
  radar?: LatLng;
  onMapClick?: (p: LatLng) => void;
  className?: string;
  zoomControl?: boolean;
}
