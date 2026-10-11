import { useCallback, useEffect, useRef } from 'react';
import type { GalleryItem } from '../../content/types';
import { Icon } from './Icon';
import styles from './Lightbox.module.css';

interface LightboxProps {
  items: GalleryItem[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
}

/** Полноэкранный просмотр изображений на нативном <dialog>: Esc, стрелки, свайп */
export function Lightbox({ items, index, onIndexChange }: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const open = index !== null;
  const count = items.length;

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      onIndexChange((index + delta + count) % count);
    },
    [index, count, onIndexChange],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.classList.add('menu-open');
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go]);

  // Соседние изображения подгружаем заранее
  useEffect(() => {
    if (index === null || count < 2) return;
    for (const i of [(index + 1) % count, (index - 1 + count) % count]) {
      const img = new Image();
      img.src = items[i].src;
    }
  }, [index, count, items]);

  const item = index !== null ? items[index] : null;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label="Просмотр изображения"
      onClose={() => {
        document.documentElement.classList.remove('menu-open');
        onIndexChange(null);
      }}
      onClick={(event) => {
        // Клик по фону закрывает просмотр
        if (event.target === event.currentTarget) onIndexChange(null);
      }}
      onTouchStart={(event) => {
        touchX.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touchX.current === null) return;
        const dx = event.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      {item && (
        <div className={styles.frame} onClick={(event) => event.target === event.currentTarget && onIndexChange(null)}>
          <figure className={styles.figure}>
            <img key={item.src} src={item.src} alt={item.alt} width={item.width} height={item.height} className={styles.image} />
            {(item.caption || count > 1) && (
              <figcaption className={styles.caption}>
                {count > 1 && (
                  <span className={styles.counter} aria-live="polite">
                    {index! + 1} / {count}
                  </span>
                )}
                {item.caption && <span>{item.caption}</span>}
              </figcaption>
            )}
          </figure>

          <button type="button" className={`${styles.btn} ${styles.close}`} onClick={() => onIndexChange(null)} aria-label="Закрыть">
            <Icon name="close" size={22} />
          </button>
          {count > 1 && (
            <>
              <button type="button" className={`${styles.btn} ${styles.prev}`} onClick={() => go(-1)} aria-label="Предыдущее изображение">
                <Icon name="chevron-left" size={24} />
              </button>
              <button type="button" className={`${styles.btn} ${styles.next}`} onClick={() => go(1)} aria-label="Следующее изображение">
                <Icon name="chevron-right" size={24} />
              </button>
            </>
          )}
        </div>
      )}
    </dialog>
  );
}
