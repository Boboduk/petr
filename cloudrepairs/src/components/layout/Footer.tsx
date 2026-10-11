import { Link } from 'react-router';
import { mainNav, site } from '../../content/site';
import { Logo } from '../brand/Logo';
import { Icon } from '../ui/Icon';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brandCol}>
          <Link to="/" className={styles.brand} aria-label="CloudRepairs — на главную">
            <Logo inverse />
          </Link>
          <p className={styles.tagline}>{site.tagline}</p>
        </div>

        <nav className={styles.col} aria-label="Разделы сайта">
          <h2 className={styles.title}>Разделы</h2>
          <ul className={styles.list}>
            {mainNav.map((item) => (
              <li key={item.to}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.col}>
          <h2 className={styles.title}>Приобрести сервис</h2>
          <ul className={styles.list}>
            <li>
              <a href={`mailto:${site.contacts.email}`} className={styles.contact}>
                <Icon name="mail" size={18} />
                {site.contacts.email}
              </a>
            </li>
            <li>
              <a href={site.contacts.phoneHref} className={styles.contact}>
                <Icon name="phone" size={18} />
                {site.contacts.phone}
              </a>
            </li>
          </ul>
        </div>

        <div className={styles.col}>
          <h2 className={styles.title}>Сервис</h2>
          <ul className={styles.list}>
            <li>
              <a href={site.loginUrl} className={styles.contact}>
                <Icon name="login" size={18} />
                Войти в CloudRepairs
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p suppressHydrationWarning>© {new Date().getFullYear()} CloudRepairs</p>
      </div>
    </footer>
  );
}
