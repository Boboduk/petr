import { useState } from 'react';
import type { GalleryItem } from '../../content/types';
import { Icon } from './Icon';
import { Lightbox } from './Lightbox';
import styles from './Gallery.module.css';

/** Сетка изображений; по клику — просмотр во весь экран */
export function Gallery({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <>
      <ul className={styles.grid}>
        {items.map((item, index) => (
          <li key={item.src}>
            <figure className={styles.item}>
              <button
                type="button"
                className={styles.trigger}
                onClick={() => setActive(index)}
                aria-label={`Открыть изображение: ${item.alt}`}
              >
                <img src={item.src} alt={item.alt} width={item.width} height={item.height} loading="lazy" decoding="async" />
                <span className={styles.zoom} aria-hidden="true">
                  <Icon name="expand" size={18} />
                </span>
              </button>
              {item.caption && <figcaption className={styles.caption}>{item.caption}</figcaption>}
            </figure>
          </li>
        ))}
      </ul>
      <Lightbox items={items} index={active} onIndexChange={setActive} />
    </>
  );
}
