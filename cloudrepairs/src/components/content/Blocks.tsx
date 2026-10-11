import type { Block } from '../../content/types';
import { ContentSlot } from '../ui/ContentSlot';
import { Gallery } from '../ui/Gallery';
import { Icon } from '../ui/Icon';
import styles from './Blocks.module.css';

/** Отрисовывает блоки содержимого из src/content/*.ts */
export function Blocks({ blocks, sourceFile }: { blocks: Block[]; sourceFile?: string }) {
  return (
    <div className={styles.flow}>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} sourceFile={sourceFile} />
      ))}
    </div>
  );
}

function BlockView({ block, sourceFile }: { block: Block; sourceFile?: string }) {
  switch (block.type) {
    case 'paragraph':
      return <p className={styles.p}>{block.text}</p>;
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul';
      return (
        <List className={`${styles.list} ${block.ordered ? styles.ordered : ''}`}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </List>
      );
    }
    case 'quote':
      return (
        <blockquote className={styles.quote}>
          <p>{block.text}</p>
          {block.cite && <cite>{block.cite}</cite>}
        </blockquote>
      );
    case 'image':
      return (
        <figure className={styles.figure}>
          <img src={block.src} alt={block.alt} width={block.width} height={block.height} loading="lazy" decoding="async" />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    case 'gallery':
      return (
        <div className={styles.wide}>
          <Gallery items={block.items} />
        </div>
      );
    case 'embed':
      return (
        <div className={`${styles.embed} ${styles.wide}`} style={{ aspectRatio: block.ratio === '4:3' ? '4 / 3' : '16 / 9' }}>
          <iframe src={block.src} title={block.title} loading="lazy" allowFullScreen allow="autoplay; fullscreen; picture-in-picture" />
        </div>
      );
    case 'file':
      return (
        <a href={block.href} className={styles.file} target="_blank" rel="noopener noreferrer">
          <span className={styles.fileIcon}>
            <Icon name="file" size={22} />
          </span>
          <span className={styles.fileBody}>
            <span className={styles.fileLabel}>{block.label}</span>
            {block.meta && <span className={styles.fileMeta}>{block.meta}</span>}
          </span>
          <Icon name="arrow-up-right" size={18} />
        </a>
      );
    case 'slot':
      return (
        <div className={styles.wide}>
          <ContentSlot expected={block.expected} kind={block.kind} sourceFile={sourceFile} />
        </div>
      );
  }
}
