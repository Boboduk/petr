import styles from './Illustration.module.css';

/** Декоративный календарь задач из личного кабинета сотрудника */
const tasks = [
  { d: 0, r: 0, h: 1, state: 'done' },
  { d: 0, r: 1.2, h: 1.4, state: 'done' },
  { d: 1, r: 0.4, h: 1.6, state: 'done' },
  { d: 2, r: 0, h: 1.1, state: 'active' },
  { d: 2, r: 1.3, h: 1.2, state: 'todo' },
  { d: 3, r: 0.6, h: 1.8, state: 'todo' },
  { d: 4, r: 0, h: 1, state: 'todo' },
  { d: 4, r: 1.2, h: 1.1, state: 'todo' },
] as const;

const COLW = 88;
const LEFT = 20;
const TOP = 80;
const UNIT = 62;

export function CalendarIllustration({ className }: { className?: string }) {
  return (
    <div className={`${styles.window} ${className ?? ''}`} aria-hidden="true">
      <svg viewBox="0 0 480 300" className={styles.svg} role="presentation">
        <rect width="480" height="300" rx="18" fill="#fff" />
        <rect x="20" y="22" width="110" height="12" rx="6" fill="#0B1626" opacity="0.85" />
        <rect x="380" y="18" width="80" height="22" rx="11" fill="#EEF4FE" />
        <rect x="392" y="26" width="56" height="6" rx="3" fill="#8DB4FA" />
        {Array.from({ length: 5 }, (_, d) => (
          <g key={d}>
            <rect x={LEFT + d * COLW} y="54" width={COLW - 8} height="16" rx="6" fill={d === 2 ? '#1F5FD6' : '#F4F6F9'} />
            <rect x={LEFT + d * COLW + 24} y="59" width={COLW - 56} height="6" rx="3" fill={d === 2 ? '#fff' : '#CBD4E0'} />
            <rect x={LEFT + d * COLW} y={TOP} width={COLW - 8} height="200" rx="10" fill={d === 2 ? '#F7FAFF' : '#FBFCFD'} />
          </g>
        ))}
        {tasks.map((t, i) => {
          const x = LEFT + t.d * COLW + 6;
          const y = TOP + 6 + t.r * UNIT;
          const w = COLW - 20;
          const h = t.h * UNIT - 10;
          const fill = t.state === 'done' ? '#EEF1F6' : t.state === 'active' ? '#FDEFD6' : '#DCE8FD';
          const bar = t.state === 'done' ? '#8493A8' : t.state === 'active' ? '#F5A524' : '#3478F0';
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} rx="8" fill={fill} />
              <rect x={x} y={y} width="4" height={h} rx="2" fill={bar} />
              <rect x={x + 12} y={y + 12} width={w - 28} height="6" rx="3" fill={bar} opacity="0.55" />
              <rect x={x + 12} y={y + 24} width={(w - 28) * 0.6} height="6" rx="3" fill={bar} opacity="0.3" />
              {t.state === 'done' && (
                <path
                  d={`M${x + w - 18} ${y + h - 14} l3 3 6-6`}
                  stroke="#59697F"
                  strokeWidth="1.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {t.state === 'active' && <circle cx={x + w - 13} cy={y + h - 12} r="4" fill="#F5A524" className={styles.pulse} />}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
