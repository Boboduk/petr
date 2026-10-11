import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { mainNav, site } from '../../content/site';
import { Logo } from '../brand/Logo';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import styles from './Header.module.css';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Закрываем меню при переходе на другую страницу или к якорю
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash, location.key]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', menuOpen);
    if (!menuOpen) return;

    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    // Мобильное меню не нужно на широком экране — закрываем при повороте/ресайзе
    const desktop = window.matchMedia('(min-width: 1025px)');
    const onChange = () => desktop.matches && setMenuOpen(false);

    window.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onChange);
      document.documentElement.classList.remove('menu-open');
    };
  }, [menuOpen]);

  return (
    <>
      <header className={styles.header} data-scrolled={scrolled || menuOpen || undefined}>
        <div className={`container ${styles.inner}`}>
          <Link to="/" className={styles.brand} aria-label="CloudRepairs — на главную">
            <Logo />
          </Link>

          <nav className={styles.nav} aria-label="Основная навигация">
            <ul className={styles.navList}>
              {mainNav.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.actions}>
            <Button href={site.loginUrl} variant="ghost" icon="login" iconPosition="start" className={styles.login}>
              Войти
            </Button>
            <Button to="/#buy" className={styles.cta}>
              Приобрести
            </Button>
            <button
              ref={toggleRef}
              type="button"
              className={styles.toggle}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Панель вне <header>: backdrop-filter шапки иначе ограничил бы position: fixed её размерами */}
      <div
        id="mobile-menu"
        ref={panelRef}
        className={styles.mobile}
        data-open={menuOpen || undefined}
        inert={!menuOpen}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Мобильная навигация" className="container">
          <ul className={styles.mobileList}>
            {mainNav.map((item, index) => (
              <li key={item.to} style={{ transitionDelay: `${menuOpen ? 40 + index * 35 : 0}ms` }}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.active : ''}`}
                >
                  <span>{item.label}</span>
                  <Icon name="arrow-right" size={20} />
                </NavLink>
              </li>
            ))}
          </ul>
          <div className={styles.mobileActions}>
            <Button to="/#buy" size="l">
              Приобрести сервис
            </Button>
            <Button href={site.loginUrl} variant="secondary" size="l" icon="login" iconPosition="start">
              Войти в сервис
            </Button>
          </div>
          <div className={styles.mobileContacts}>
            <a href={`mailto:${site.contacts.email}`}>{site.contacts.email}</a>
            <a href={site.contacts.phoneHref}>{site.contacts.phone}</a>
          </div>
        </nav>
      </div>
    </>
  );
}
