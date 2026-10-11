import type { ContentPageData } from './types';

/**
 * О нас — https://cloudrepairs.ru/about/
 *
 * Статус: MISSING. Страница была недоступна из среды разработки, в поисковом
 * индексе её содержимого нет. Сведения о компании не придумывались — на месте
 * материалов стоят блоки `slot`. Формат замены описан в src/content/obuchen.ts.
 */
export const aboutPage: ContentPageData = {
  path: '/about/',
  title: 'О нас',
  sourceStatus: 'missing',
  sourceFile: 'src/content/about.ts',
  sections: [
    {
      id: 'content',
      blocks: [
        {
          type: 'slot',
          expected:
            'Информация о компании с оригинальной страницы «О нас»: описание деятельности, история, команда — только то, что опубликовано на сайте.',
        },
        {
          type: 'slot',
          kind: 'media',
          expected: 'Фотографии и иллюстрации страницы «О нас».',
        },
      ],
    },
  ],
};
