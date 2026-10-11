import type { ReactNode } from 'react';
import styles from './Section.module.css';

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  intro?: ReactNode;
  tone?: 'paper' | 'surface' | 'dark';
  align?: 'start' | 'center';
  children?: ReactNode;
  className?: string;
}

/** Секция страницы с единым ритмом отступов и шапкой (надзаголовок, H2, вводный текст) */
export function Section({ id, eyebrow, title, intro, tone = 'paper', align = 'start', children, className }: SectionProps) {
  const headingId = id && title ? `${id}-title` : undefined;
  return (
    <section id={id} className={[styles.section, styles[tone], className].filter(Boolean).join(' ')} aria-labelledby={headingId}>
      <div className="container">
        {(eyebrow || title || intro) && (
          <header className={`${styles.head} ${align === 'center' ? styles.center : ''}`}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            {title && (
              <h2 id={headingId} className={styles.title}>
                {title}
              </h2>
            )}
            {intro && <div className={styles.intro}>{intro}</div>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

export function Eyebrow({ children, inverse = false }: { children: ReactNode; inverse?: boolean }) {
  return <p className={`${styles.eyebrow} ${inverse ? styles.eyebrowInverse : ''}`}>{children}</p>;
}
