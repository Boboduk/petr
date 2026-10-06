import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';

interface Props {
  name: string;
  photo?: string;
  color?: string;
  size?: number;
  className?: string;
  ring?: boolean;
}

/** Фото или генерируемый аватар с инициалами (без реальных персональных данных) */
export function Avatar({ name, photo, color = '#0B57E8', size = 48, className, ring }: Props) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={name} style={style} className={cn('shrink-0 rounded-full object-cover', ring && 'ring-4 ring-white', className)} />;
  }
  return (
    <div
      style={{ ...style, background: `linear-gradient(140deg, ${color} 0%, ${shade(color)} 100%)` }}
      className={cn('relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white', ring && 'ring-4 ring-white', className)}
      aria-label={name}
    >
      <svg viewBox="0 0 40 40" className="absolute inset-0 size-full opacity-20" aria-hidden>
        <path d="M0 28 Q10 22 20 28 T40 28 V40 H0Z" fill="#fff" />
      </svg>
      <span className="relative">{initials(name)}</span>
    </div>
  );
}

function shade(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 50);
  const g = Math.max(0, ((n >> 8) & 255) - 40);
  const b = Math.min(255, (n & 255) + 10);
  return `rgb(${r}, ${g}, ${b})`;
}
