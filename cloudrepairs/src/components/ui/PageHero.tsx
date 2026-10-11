import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from './Icon';
import styles from './PageHero.module.css';

interface PageHeroProps {
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
}

/** Первый экран внутренних страниц: хлебные крошки, H1, вводный текст */
export function PageHero({ title, lead, children }: PageHeroProps) {
  return (
    <div className={styles.wrap}>
      <div className="container">
        <div className={styles.hero}>
          <div className={styles.grid} aria-hidden="true" />
          <nav aria-label="Хлебные крошки" className={styles.crumbs}>
            <ol>
              <li>
                <Link to="/">Главная</Link>
                <Icon name="chevron-right" size={14} />
              </li>
              <li aria-current="page">{title}</li>
            </ol>
          </nav>
          <h1 className={styles.title}>{title}</h1>
          {lead && <div className={styles.lead}>{lead}</div>}
          {children}
        </div>
      </div>
    </div>
  );
}
