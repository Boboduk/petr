import type { ContentPageData } from './types';

/**
 * Обучение — https://cloudrepairs.ru/obuchen/
 *
 * Статус: MISSING. Страница была недоступна из среды разработки, в поисковом
 * индексе её содержимого нет. Ничего не придумано: на месте материалов стоят
 * блоки `slot`. Замените их оригинальными текстами и изображениями,
 * например:
 *
 *   sections: [
 *     { id: 'programmy', title: '…', blocks: [
 *       { type: 'paragraph', text: '…' },
 *       { type: 'list', items: ['…', '…'] },
 *       { type: 'image', src: '/media/obuchen/photo-1.webp', alt: '…', width: 1600, height: 1067 },
 *     ] },
 *   ]
 *
 * После `npm run import:original` (на машине с доступом к сайту) исходные
 * тексты и изображения будут лежать в папке import/obuchen/.
 */
export const obuchenPage: ContentPageData = {
  path: '/obuchen/',
  title: 'Обучение',
  sourceStatus: 'missing',
  sourceFile: 'src/content/obuchen.ts',
  toc: true,
  sections: [
    {
      id: 'content',
      blocks: [
        {
          type: 'slot',
          expected: 'Тексты страницы «Обучение»: описание обучения, программы и направления с их оригинальными названиями, условия.',
        },
        {
          type: 'slot',
          kind: 'media',
          expected: 'Изображения и материалы страницы «Обучение».',
        },
      ],
    },
  ],
};
