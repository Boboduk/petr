import { Icon } from './Icon';
import styles from './ContentSlot.module.css';

interface ContentSlotProps {
  expected: string;
  kind?: 'text' | 'media';
  sourceFile?: string;
}

/**
 * Место для оригинального материала, который не удалось получить.
 * Видно на сайте намеренно: так пропуски не останутся незамеченными.
 */
export function ContentSlot({ expected, kind = 'text', sourceFile }: ContentSlotProps) {
  return (
    <div className={`${styles.slot} ${kind === 'media' ? styles.media : ''}`} role="note">
      <span className={styles.icon}>
        <Icon name={kind === 'media' ? 'image' : 'text'} size={22} />
      </span>
      <div>
        <p className={styles.title}>Оригинальный материал не получен</p>
        <p className={styles.text}>{expected}</p>
        {import.meta.env.DEV && sourceFile && (
          <p className={styles.dev}>
            Добавьте содержимое в <code>{sourceFile}</code>
          </p>
        )}
      </div>
    </div>
  );
}
