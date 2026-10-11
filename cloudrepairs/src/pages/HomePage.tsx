import { Link } from 'react-router';
import { BuyBand } from '../components/content/BuyBand';
import { CalendarIllustration } from '../components/illustrations/CalendarIllustration';
import { GanttIllustration } from '../components/illustrations/GanttIllustration';
import { MonitorIllustration } from '../components/illustrations/MonitorIllustration';
import { Button } from '../components/ui/Button';
import { Icon, type IconName } from '../components/ui/Icon';
import { Eyebrow, Section } from '../components/ui/Section';
import { home } from '../content/home';
import { mainNav, site } from '../content/site';
import styles from './HomePage.module.css';

const pageIcons: Record<string, IconName> = {
  '/obuchen/': 'book',
  '/about/': 'info',
  '/vnutyankaya-training/': 'clipboard',
};

export function HomePage() {
  return (
    <>
      {/* Первый экран */}
      <div className={styles.heroWrap}>
        <div className="container">
          <section className={styles.hero} aria-labelledby="hero-title">
            <div className={styles.heroGrid} aria-hidden="true" />
            <div className={styles.heroMain}>
              <div className={styles.heroText}>
                <Eyebrow inverse>{home.hero.eyebrow}</Eyebrow>
                <h1 id="hero-title" className={styles.heroTitle}>
                  {home.hero.title}
                </h1>
                <p className={styles.heroLead}>{home.hero.lead}</p>
                <div className={styles.heroActions}>
                  <Button to="/#buy" variant="inverse" size="l" icon="arrow-right">
                    Приобрести сервис
                  </Button>
                  <Button href={site.loginUrl} variant="inverse-ghost" size="l" icon="login" iconPosition="start">
                    Войти в сервис
                  </Button>
                </div>
              </div>
              <div className={styles.heroArt}>
                <GanttIllustration />
              </div>
            </div>

            <div className={styles.foundation}>
              <h2 className="visually-hidden">{home.foundation.title}</h2>
              <ol className={styles.foundationList}>
                {home.foundation.items.map((item, index) => (
                  <li key={item}>
                    <span className={styles.foundationNum}>{String(index + 1).padStart(2, '0')}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>
      </div>

      {/* Автопланирование */}
      <Section id="planning" eyebrow={home.planning.eyebrow} title={home.planning.title}>
        <ul className={styles.features}>
          {home.planning.items.map((item) => (
            <li key={item.title} className={styles.feature}>
              <span className={styles.featureIcon}>
                <Icon name={item.icon as IconName} size={24} />
              </span>
              <h3 className={styles.featureTitle}>{item.title}</h3>
              <p className={styles.featureText}>{item.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Сотрудникам и руководителю */}
      <div className={styles.rolesWrap}>
        <div className="container">
          <section id="employee" className={styles.role} aria-labelledby="employee-title">
            <div className={styles.roleText}>
              <Eyebrow>{home.employee.eyebrow}</Eyebrow>
              <h2 id="employee-title" className={styles.roleTitle}>
                {home.employee.title}
              </h2>
              <p className={styles.roleLead}>{home.employee.text}</p>
              <ul className={styles.checks}>
                {home.employee.points.map((point) => (
                  <li key={point}>
                    <Icon name="check" size={18} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.roleArt}>
              <CalendarIllustration />
            </div>
          </section>

          <section id="manager" className={`${styles.role} ${styles.reverse}`} aria-labelledby="manager-title">
            <div className={styles.roleText}>
              <Eyebrow>{home.manager.eyebrow}</Eyebrow>
              <h2 id="manager-title" className={styles.roleTitle}>
                {home.manager.title}
              </h2>
              <p className={styles.roleLead}>{home.manager.text}</p>
              <ul className={styles.checks}>
                {home.manager.points.map((point) => (
                  <li key={point}>
                    <Icon name="check" size={18} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.roleArt}>
              <MonitorIllustration />
            </div>
          </section>
        </div>
      </div>

      {/* Справочники и отчёты */}
      <Section id="modules" eyebrow={home.modules.eyebrow} title={home.modules.title}>
        <ul className={styles.modules}>
          {home.modules.items.map((item) => (
            <li key={item.title} className={styles.module}>
              <span className={styles.moduleIcon}>
                <Icon name={item.icon as IconName} size={22} />
              </span>
              <h3 className={styles.moduleTitle}>{item.title}</h3>
              <p className={styles.moduleText}>{item.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* Разделы сайта */}
      <Section id="sections" title={home.sections.title} tone="surface" className={styles.pagesSection}>
        <ul className={styles.pages}>
          {mainNav
            .filter((item) => item.to !== '/')
            .map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={styles.pageLink}>
                  <span className={styles.pageIcon}>
                    <Icon name={pageIcons[item.to] ?? 'arrow-right'} size={22} />
                  </span>
                  <span className={styles.pageLabel}>{item.label}</span>
                  <Icon name="arrow-right" size={20} className={styles.pageArrow} />
                </Link>
              </li>
            ))}
        </ul>
      </Section>

      <BuyBand id="buy" />
    </>
  );
}
