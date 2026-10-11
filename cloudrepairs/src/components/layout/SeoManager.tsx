import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { site } from '../../content/site';
import { normalizePath, seoFor } from '../../seo';

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

/**
 * Обновляет <title> и мета-теги при переходах внутри приложения.
 * При первой загрузке те же теги уже есть в HTML (их пишет пререндер).
 */
export function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = seoFor(pathname);
    const url = `${site.url}${normalizePath(pathname)}`;
    document.title = seo.title;
    setMeta('meta[name="description"]', 'name', 'description', seo.description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', seo.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', seo.description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (seo.noindex) {
      canonical?.remove();
    } else {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = url;
    }
  }, [pathname]);

  return null;
}
