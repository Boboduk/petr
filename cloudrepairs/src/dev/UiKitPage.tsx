import { Button } from '../components/ui/Button';
import type { ContentPageData, GalleryItem } from '../content/types';
import { ContentPage } from '../pages/ContentPage';

/**
 * Витрина дизайн-системы (только `npm run dev`, адрес /__ui/).
 * Показывает, как будут выглядеть страницы, когда в src/content появятся
 * реальные материалы: оглавление, галерея с полноэкранным просмотром,
 * списки, цитаты, файлы. Все тексты здесь — служебные примеры.
 */
function demoImage(n: number, hue: number): GalleryItem {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><rect width="1600" height="1000" fill="hsl(${hue} 70% 92%)"/><rect x="80" y="80" width="1440" height="840" rx="40" fill="none" stroke="hsl(${hue} 60% 60%)" stroke-width="6" stroke-dasharray="24 16"/><text x="800" y="530" font-family="sans-serif" font-size="96" text-anchor="middle" fill="hsl(${hue} 50% 35%)">Пример ${n}</text></svg>`;
  return {
    src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    alt: `Пример изображения ${n}`,
    caption: `Подпись к примеру ${n}`,
    width: 1600,
    height: 1000,
  };
}

const demoPage: ContentPageData = {
  path: '/__ui/',
  title: 'UI-кит: пример страницы с материалами',
  lead: 'Служебная страница режима разработки. На сайт не публикуется.',
  sourceStatus: 'verified',
  sourceFile: 'src/dev/UiKitPage.tsx',
  toc: true,
  sections: [
    {
      id: 'demo-text',
      title: 'Текст и списки',
      blocks: [
        {
          type: 'paragraph',
          text: 'Абзац основного текста. Ширина колонки ограничена для удобного чтения длинных материалов, межстрочный интервал — 1,62.',
        },
        { type: 'list', items: ['Маркированный список', 'Второй пункт списка', 'Третий пункт списка'] },
        { type: 'list', ordered: true, items: ['Нумерованный шаг', 'Следующий шаг', 'Завершающий шаг'] },
        { type: 'quote', text: 'Выделенная цитата или важное примечание.', cite: 'Подпись' },
      ],
    },
    {
      id: 'demo-gallery',
      title: 'Галерея',
      blocks: [{ type: 'gallery', items: [demoImage(1, 215), demoImage(2, 35), demoImage(3, 160), demoImage(4, 260)] }],
    },
    {
      id: 'demo-files',
      title: 'Файлы и места для материалов',
      blocks: [
        { type: 'file', href: '#demo-files', label: 'Презентация.pdf', meta: 'PDF' },
        { type: 'slot', expected: 'Так выглядит место для материала, который ещё не перенесён.' },
      ],
    },
  ],
};

export default function UiKitPage() {
  return (
    <>
      <ContentPage page={demoPage} />
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingBottom: 64 }}>
        <Button onClick={() => undefined}>Primary</Button>
        <Button onClick={() => undefined} variant="secondary">
          Secondary
        </Button>
        <Button onClick={() => undefined} variant="ghost">
          Ghost
        </Button>
      </div>
    </>
  );
}
