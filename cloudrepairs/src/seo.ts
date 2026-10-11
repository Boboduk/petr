import { site } from './content/site';

export interface PageSeo {
  title: string;
  description: string;
  /** Закрыть страницу от индексации */
  noindex?: boolean;
}

/**
 * SEO-данные страниц. Оригинальный <title> главной — «Cloud Repairs» —
 * сохранён в начале заголовка. Title и description остальных страниц
 * получить не удалось: значения ниже — нейтральные, замените их оригинальными.
 */
export const seoByPath: Record<string, PageSeo> = {
  '/': {
    title: 'Cloud Repairs — сервис планирования и управления ремонтами',
    description:
      'CloudRepairs — облачный SaaS сервис по планированию и управлению ремонтами и техническим обслуживанием: автопланирование, диаграмма Ганта, личный кабинет сотрудника, монитор руководителя.',
  },
  '/obuchen/': {
    title: 'Обучение — Cloud Repairs',
    description: 'Обучение CloudRepairs.',
  },
  '/about/': {
    title: 'О нас — Cloud Repairs',
    description: 'О компании CloudRepairs — облачного сервиса по планированию и управлению ремонтами и техническим обслуживанием.',
  },
  '/vnutyankaya-training/': {
    title: 'Внутреннее обучение — Cloud Repairs',
    description: 'Внутреннее обучение CloudRepairs.',
  },
};

export const notFoundSeo: PageSeo = {
  title: 'Страница не найдена — Cloud Repairs',
  description: 'Такой страницы нет на сайте CloudRepairs.',
  noindex: true,
};

/** Приводит путь к виду с завершающим слешем, как в URL оригинального сайта */
export function normalizePath(pathname: string): string {
  if (pathname === '' || pathname === '/') return '/';
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

export function seoFor(pathname: string): PageSeo {
  return seoByPath[normalizePath(pathname)] ?? notFoundSeo;
}

export const OG_IMAGE = `${site.url}/og-image.jpg`;

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Теги <head> для статического пререндера */
export function headTags(pathname: string): string {
  const seo = seoFor(pathname);
  const url = `${site.url}${normalizePath(pathname)}`;
  const e = escapeHtml;
  return [
    `<title>${e(seo.title)}</title>`,
    `<meta name="description" content="${e(seo.description)}" />`,
    seo.noindex ? `<meta name="robots" content="noindex" />` : `<link rel="canonical" href="${e(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="ru_RU" />`,
    `<meta property="og:site_name" content="Cloud Repairs" />`,
    `<meta property="og:title" content="${e(seo.title)}" />`,
    `<meta property="og:description" content="${e(seo.description)}" />`,
    `<meta property="og:url" content="${e(url)}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ');
}
