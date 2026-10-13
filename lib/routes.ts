/**
 * Пути к экранам заказа. Используем query-параметр вместо динамического сегмента,
 * чтобы приложение собиралось в статический экспорт (Android-приложение без сервера).
 */
export function clientOrderPath(id: string): string {
  return `/client/order?id=${encodeURIComponent(id)}`;
}

/** Без id открывается текущий активный заказ водителя */
export function driverOrderPath(id?: string): string {
  return id ? `/driver/order?id=${encodeURIComponent(id)}` : '/driver/order';
}
