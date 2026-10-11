import styles from './Illustration.module.css';

/** Декоративный монитор руководителя: ход работ по комплексу, работам и исполнителям */
const lines = [0.92, 0.74, 0.58, 0.81, 0.4];

export function MonitorIllustration({ className }: { className?: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className={`${styles.window} ${className ?? ''}`} aria-hidden="true">
      <svg viewBox="0 0 480 300" className={styles.svg} role="presentation">
        <rect width="480" height="300" rx="18" fill="#fff" />
        <rect x="20" y="22" width="120" height="12" rx="6" fill="#0B1626" opacity="0.85" />
        <circle cx="452" cy="28" r="5" fill="#22C55E" className={styles.pulse} />
        <rect x="400" y="24" width="40" height="8" rx="4" fill="#E2E7EF" />

        {/* Весь комплекс работ */}
        <rect x="20" y="54" width="150" height="226" rx="14" fill="#F4F6F9" />
        <circle cx="95" cy="140" r={r} fill="none" stroke="#DCE8FD" strokeWidth="14" />
        <circle
          cx="95"
          cy="140"
          r={r}
          fill="none"
          stroke="#1F5FD6"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${c * 0.66} ${c}`}
          transform="rotate(-90 95 140)"
        />
        <rect x="70" y="134" width="50" height="12" rx="6" fill="#0B1626" opacity="0.8" />
        <rect x="45" y="214" width="100" height="8" rx="4" fill="#CBD4E0" />
        <rect x="58" y="232" width="74" height="8" rx="4" fill="#E2E7EF" />

        {/* По каждой работе и исполнителю */}
        {lines.map((v, i) => {
          const y = 62 + i * 44;
          return (
            <g key={i}>
              <circle cx="202" cy={y + 14} r="12" fill={i === 4 ? '#FDEFD6' : '#EEF4FE'} />
              <rect x="224" y={y + 4} width={90 + ((i * 23) % 50)} height="7" rx="3.5" fill="#CBD4E0" />
              <rect x="224" y={y + 20} width="232" height="8" rx="4" fill="#EEF1F6" />
              <rect
                x="224"
                y={y + 20}
                width={232 * v}
                height="8"
                rx="4"
                fill={i === 4 ? '#F5A524' : '#3478F0'}
                className={styles.bar}
                style={{ animationDelay: `${150 + i * 90}ms` }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
