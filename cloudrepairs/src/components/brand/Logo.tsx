import styles from './Logo.module.css';

/**
 * ВРЕМЕННЫЙ логотип-шрифтовой знак.
 *
 * Оригинальный логотип CloudRepairs получить не удалось. Когда файл будет
 * доступен, положите его в public/brand/ (например, logo.svg) и замените
 * содержимое компонента на <img src="/brand/logo.svg" alt="CloudRepairs" … />.
 */
export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`${styles.logo} ${inverse ? styles.inverse : ''}`}>
      <LogoMark className={styles.mark} />
      <span className={styles.word}>
        Cloud<span className={styles.accent}>Repairs</span>
      </span>
    </span>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="#1F5FD6" />
      <path
        d="M10.4 21.5h11.3a4.3 4.3 0 0 0 .5-8.6 6 6 0 0 0-11.4 1.4 3.6 3.6 0 0 0-.4 7.2Z"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12.5 18.2h7" stroke="#F5A524" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
