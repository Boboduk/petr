import { home } from '../../content/home';
import { site } from '../../content/site';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Eyebrow } from '../ui/Section';
import styles from './BuyBand.module.css';

/** Почта с мягким переносом перед «@», чтобы адрес не рвался посреди слова */
function EmailText({ email }: { email: string }) {
  const [user, domain] = email.split('@');
  return (
    <>
      {user}
      <wbr />@{domain}
    </>
  );
}

/**
 * Блок «Приобрести Сервис» со стоимостью и контактами.
 * На главной он стоит с якорем #buy, на остальных страницах — как финальный призыв.
 */
export function BuyBand({ id, headingLevel = 2 }: { id?: string; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} className={styles.wrap} aria-labelledby={headingId}>
      <div className="container">
        <div className={styles.band}>
          <div className={styles.glow} aria-hidden="true" />
          <div className={styles.pricing}>
            <Eyebrow inverse>{home.pricing.title}</Eyebrow>
            <Heading id={headingId} className={styles.title}>
              {home.buy.title}
            </Heading>
            <p className={styles.text}>{home.pricing.text}</p>
          </div>

          <div className={styles.contacts}>
            <a href={`mailto:${site.contacts.email}`} className={styles.contact}>
              <span className={styles.icon}>
                <Icon name="mail" size={22} />
              </span>
              <span className={styles.contactBody}>
                <span className={styles.label}>Электронная почта</span>
                <span className={styles.value}>
                  <EmailText email={site.contacts.email} />
                </span>
              </span>
            </a>
            <a href={site.contacts.phoneHref} className={styles.contact}>
              <span className={styles.icon}>
                <Icon name="phone" size={22} />
              </span>
              <span className={styles.contactBody}>
                <span className={styles.label}>Телефон</span>
                <span className={styles.value}>{site.contacts.phone}</span>
              </span>
            </a>
            <div className={styles.actions}>
              <Button href={`mailto:${site.contacts.email}`} variant="inverse" size="l" icon="arrow-right">
                Написать
              </Button>
              <Button href={site.contacts.phoneHref} variant="inverse-ghost" size="l" icon="phone" iconPosition="start">
                Позвонить
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
