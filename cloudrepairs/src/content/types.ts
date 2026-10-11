/**
 * Модель содержимого сайта.
 *
 * Все тексты живут в src/content/*.ts, компоненты только отображают их.
 * Чтобы перенести оригинальные материалы CloudRepairs, достаточно заменить
 * блоки `slot` на реальные блоки (paragraph, list, image, gallery …).
 */

/** Насколько содержимое страницы сверено с оригиналом cloudrepairs.ru */
export type SourceStatus =
  /** Оригинал не удалось получить — страница содержит места для материалов */
  | 'missing'
  /** Восстановлено по фрагментам из поискового индекса, формулировки нужно сверить */
  | 'partial'
  /** Сверено с оригиналом */
  | 'verified';

export interface GalleryItem {
  src: string;
  alt: string;
  caption?: string;
  /** Исходные размеры — чтобы зарезервировать место и не было скачков вёрстки */
  width?: number;
  height?: number;
}

export type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'quote'; text: string; cite?: string }
  | ({ type: 'image' } & GalleryItem)
  | { type: 'gallery'; items: GalleryItem[] }
  /** Встраиваемое видео или презентация (YouTube, RuTube, VK Видео, Google Slides …) */
  | { type: 'embed'; src: string; title: string; ratio?: '16:9' | '4:3' }
  /** Ссылка на файл: презентация, PDF и т. п. */
  | { type: 'file'; href: string; label: string; meta?: string }
  /** Место для оригинального материала, который не удалось получить */
  | { type: 'slot'; expected: string; kind?: 'text' | 'media' };

export interface ContentSection {
  id: string;
  title?: string;
  blocks: Block[];
}

export interface ContentPageData {
  path: string;
  /** Заголовок H1 */
  title: string;
  lead?: string;
  sourceStatus: SourceStatus;
  /** Файл, в котором редактируется страница (подсказка в dev-режиме) */
  sourceFile: string;
  /** Показывать оглавление по разделам (если разделов с заголовками ≥ 2) */
  toc?: boolean;
  sections: ContentSection[];
}
