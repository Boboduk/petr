import styles from './Illustration.module.css';

/**
 * Декоративная схема диаграммы Ганта: задачи, критический путь (янтарный)
 * и балансировка загрузки персонала. Без подписей и цифр — это иллюстрация,
 * а не данные.
 */
const rows = [
  { x: 0, w: 3, critical: true },
  { x: 1, w: 2 },
  { x: 3, w: 3, critical: true },
  { x: 3.5, w: 2.5 },
  { x: 6, w: 2, critical: true },
  { x: 5, w: 3.5 },
  { x: 8, w: 3, critical: true },
];
const COL = 34;
const ROW = 34;
const LEFT = 108;
const TOP = 62;

export function GanttIllustration({ className }: { className?: string }) {
  return (
    <div className={`${styles.window} ${className ?? ''}`} aria-hidden="true">
      <svg viewBox="0 0 520 400" className={styles.svg} role="presentation">
        {/* Шапка окна */}
        <rect x="0" y="0" width="520" height="400" rx="18" fill="#fff" />
        <rect x="0" y="0" width="520" height="40" rx="18" fill="#F4F6F9" />
        <rect x="0" y="22" width="520" height="18" fill="#F4F6F9" />
        <circle cx="22" cy="20" r="5" fill="#E2E7EF" />
        <circle cx="38" cy="20" r="5" fill="#E2E7EF" />
        <circle cx="54" cy="20" r="5" fill="#E2E7EF" />
        <rect x="200" y="14" width="120" height="12" rx="6" fill="#E2E7EF" />

        {/* Сетка дней */}
        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={i}
            x1={LEFT + i * COL}
            x2={LEFT + i * COL}
            y1={TOP - 12}
            y2={TOP + rows.length * ROW}
            stroke={i % 5 === 0 ? '#E2E7EF' : '#EEF1F6'}
          />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <rect key={i} x={LEFT + i * COL + 11} y={TOP - 22} width="12" height="5" rx="2.5" fill="#E2E7EF" />
        ))}

        {/* Строки: подписи-заглушки и полосы задач */}
        {rows.map((row, i) => {
          const y = TOP + i * ROW;
          return (
            <g key={i}>
              <rect x="20" y={y + 12} width={56 + ((i * 17) % 28)} height="8" rx="4" fill="#E2E7EF" />
              <rect
                x={LEFT + row.x * COL + 2}
                y={y + 7}
                width={row.w * COL - 4}
                height="18"
                rx="6"
                fill={row.critical ? '#F5A524' : '#3478F0'}
                opacity={row.critical ? 1 : 0.9}
                className={styles.bar}
                style={{ animationDelay: `${120 + i * 70}ms` }}
              />
            </g>
          );
        })}

        {/* Связи критического пути */}
        {[
          [0, 2],
          [2, 4],
          [4, 6],
        ].map(([from, to]) => {
          const a = rows[from];
          const x1 = LEFT + (a.x + a.w) * COL - 2;
          const y1 = TOP + from * ROW + 16;
          const y2 = TOP + to * ROW + 16;
          return (
            <path
              key={from}
              d={`M${x1} ${y1} h8 V${y2} h${LEFT + rows[to].x * COL + 2 - x1 - 8}`}
              fill="none"
              stroke="#D98A0B"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          );
        })}

        {/* Линия «сегодня» */}
        <line x1={LEFT + 5.5 * COL} x2={LEFT + 5.5 * COL} y1={TOP - 14} y2={TOP + rows.length * ROW} stroke="#1F5FD6" strokeWidth="1.5" />
        <circle cx={LEFT + 5.5 * COL} cy={TOP - 14} r="4" fill="#1F5FD6" />

        {/* Балансировка загрузки персонала */}
        <line x1="20" x2="500" y1="318" y2="318" stroke="#EEF1F6" />
        <rect x="20" y="336" width="64" height="8" rx="4" fill="#E2E7EF" />
        <rect x="20" y="352" width="44" height="8" rx="4" fill="#EEF1F6" />
        {Array.from({ length: 11 }, (_, i) => {
          const h = [26, 32, 30, 34, 28, 33, 31, 29, 34, 30, 27][i];
          return (
            <rect key={i} x={LEFT + i * COL + 7} y={378 - h} width={COL - 14} height={h} rx="4" fill={i === 5 ? '#1F5FD6' : '#BCD3FC'} />
          );
        })}
        <line x1={LEFT} x2={LEFT + 11 * COL} y1="346" y2="346" stroke="#1F5FD6" strokeDasharray="4 4" opacity="0.5" />
      </svg>
    </div>
  );
}
