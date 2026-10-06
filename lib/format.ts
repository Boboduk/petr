const moneyFmt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

export function formatMoney(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return '—';
  return `${moneyFmt.format(Math.round(value))} ₽`;
}

export function formatVolume(v: number): string {
  const s = Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',');
  return `${s} м³`;
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} м`;
  return `${km.toFixed(1).replace('.', ',')} км`;
}

export function formatMinutes(min: number): string {
  const m = Math.max(1, Math.round(min));
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} ч ${rest} мин` : `${h} ч`;
}

const dateTimeFmt = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
const shortDateFmt = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' });

/** «06 октября, 15:30» */
export function formatDateTime(ts: number): string {
  return dateTimeFmt.format(ts).replace(' в ', ', ');
}

export function formatDate(ts: number): string {
  return dateFmt.format(ts);
}

export function formatShortDate(ts: number): string {
  return shortDateFmt.format(ts);
}

export function formatTime(ts: number): string {
  return timeFmt.format(ts);
}

export function timeAgo(ts: number, now = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const sec = Math.floor(diff / 1000);
  if (sec < 30) return 'только что';
  const min = Math.floor(sec / 60);
  if (min < 1) return `${sec} сек назад`;
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  return formatDateTime(ts);
}

/** Маскирует телефон: +7 914 ••• ••-12 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 11) return phone;
  return `+7 ${digits.slice(1, 4)} ••• ••-${digits.slice(-2)}`;
}

/** Частично скрывает госномер: К 7•• МН 14 */
export function maskPlate(plate: string): string {
  const parts = plate.split(' ');
  if (parts.length < 2) return plate;
  return parts
    .map((p, i) => (i === 1 && /\d{3}/.test(p) ? `${p[0]}••` : p))
    .join(' ');
}

export function pluralize(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function normalizePhone(input: string): string {
  const d = input.replace(/\D/g, '');
  const digits = d.startsWith('8') ? `7${d.slice(1)}` : d.startsWith('7') ? d : `7${d}`;
  const x = digits.padEnd(11, '0').slice(0, 11);
  return `+7 ${x.slice(1, 4)} ${x.slice(4, 7)}-${x.slice(7, 9)}-${x.slice(9, 11)}`;
}
