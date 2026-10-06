/**
 * Настройки картографии. Бесплатные тайлы на данных OpenStreetMap.
 * Для продакшена: собственный тайл-сервер или коммерческий тариф провайдера.
 */
export const TILE_PROVIDERS = {
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abc',
  },
} as const;

export const ACTIVE_TILES = TILE_PROVIDERS[(process.env.NEXT_PUBLIC_MAP_TILES as keyof typeof TILE_PROVIDERS) ?? 'voyager'] ?? TILE_PROVIDERS.voyager;
