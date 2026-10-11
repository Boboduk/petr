import type { ContentPageData } from './types';

/**
 * Внутреннее обучение — https://cloudrepairs.ru/vnutyankaya-training/
 *
 * Статус: MISSING. Страница была недоступна из среды разработки, в поисковом
 * индексе её содержимого нет.
 *
 * Страница уже умеет показывать длинные обучающие материалы:
 *  - оглавление со «следящей» подсветкой появится, когда у разделов будут
 *    заголовки (title) и их станет два и больше;
 *  - блок `gallery` — сетка изображений с просмотром во весь экран
 *    (стрелки, свайп, Esc);
 *  - блок `embed` — встроенные видео и презентации;
 *  - блок `file` — ссылки на презентации и документы.
 *
 * Как это выглядит с реальными данными — см. /__ui/ в режиме `npm run dev`.
 */
export const internalTrainingPage: ContentPageData = {
  path: '/vnutyankaya-training/',
  title: 'Внутреннее обучение',
  sourceStatus: 'missing',
  sourceFile: 'src/content/vnutyankaya-training.ts',
  toc: true,
  sections: [
    {
      id: 'materials',
      blocks: [
        {
          type: 'slot',
          expected: 'Обучающие материалы страницы «Внутреннее обучение»: разделы, тексты, инструкции — с оригинальными заголовками.',
        },
        {
          type: 'slot',
          kind: 'media',
          expected: 'Презентации, галереи, видео и изображения страницы «Внутреннее обучение».',
        },
      ],
    },
  ],
};
