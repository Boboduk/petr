import { Blocks } from '../components/content/Blocks';
import { BuyBand } from '../components/content/BuyBand';
import { PageHero } from '../components/ui/PageHero';
import { Toc } from '../components/ui/Toc';
import type { ContentPageData } from '../content/types';
import styles from './ContentPage.module.css';

/** Общий шаблон текстовых страниц: «Обучение», «О нас», «Внутреннее обучение» */
export function ContentPage({ page }: { page: ContentPageData }) {
  const tocEntries = page.sections.filter((s) => s.title).map((s) => ({ id: s.id, title: s.title! }));
  const showToc = !!page.toc && tocEntries.length >= 2;

  return (
    <>
      <PageHero title={page.title} lead={page.lead} />

      <div className={`container ${styles.body} ${showToc ? styles.withToc : ''}`}>
        {showToc && (
          <aside className={styles.aside}>
            <Toc entries={tocEntries} />
          </aside>
        )}
        <div className={styles.content}>
          {page.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className={styles.section}
              aria-labelledby={section.title ? `${section.id}-title` : undefined}
            >
              {section.title && (
                <h2 id={`${section.id}-title`} className={styles.sectionTitle}>
                  {section.title}
                </h2>
              )}
              <Blocks blocks={section.blocks} sourceFile={page.sourceFile} />
            </section>
          ))}
        </div>
      </div>

      <BuyBand />
    </>
  );
}
