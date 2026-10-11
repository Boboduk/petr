import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import styles from './Toc.module.css';

export interface TocEntry {
  id: string;
  title: string;
}

/** Оглавление длинной страницы с подсветкой текущего раздела */
export function Toc({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState(entries[0]?.id);

  useEffect(() => {
    const targets = entries.map((e) => document.getElementById(e.id)).filter((el): el is HTMLElement => !!el);
    if (!targets.length) return;
    const observer = new IntersectionObserver(
      (records) => {
        const visible = records.filter((r) => r.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -60% 0px' },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [entries]);

  const links = (
    <ol className={styles.list}>
      {entries.map((entry, index) => (
        <li key={entry.id}>
          <a href={`#${entry.id}`} className={styles.link} aria-current={entry.id === activeId ? 'location' : undefined}>
            <span className={styles.num}>{String(index + 1).padStart(2, '0')}</span>
            <span>{entry.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <nav className={styles.desktop} aria-label="Содержание страницы">
        <p className={styles.title}>Содержание</p>
        {links}
      </nav>
      <details className={styles.mobile}>
        <summary className={styles.summary}>
          <span>Содержание</span>
          <Icon name="chevron-down" size={18} />
        </summary>
        <nav aria-label="Содержание страницы">{links}</nav>
      </details>
    </>
  );
}
