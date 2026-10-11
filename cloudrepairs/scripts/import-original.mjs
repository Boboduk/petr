/**
 * Импорт материалов оригинального сайта cloudrepairs.ru.
 *
 * Запускайте на компьютере, с которого сайт открывается:
 *   npm run import:original
 *
 * Для каждой страницы в папке import/<страница>/ появятся:
 *   page.html     — исходный HTML;
 *   content.md    — title, description и текст страницы по порядку
 *                   (заголовки, абзацы, списки, ссылки, изображения);
 *   images/       — все изображения страницы.
 * Дальше тексты переносятся в src/content/*.ts, а изображения — в public/media/.
 * Скрипт ничего не меняет в исходниках сайта.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.SOURCE_URL ?? 'https://cloudrepairs.ru';
const PAGES = [
  ['home', '/'],
  ['obuchen', '/obuchen/'],
  ['about', '/about/'],
  ['vnutyankaya-training', '/vnutyankaya-training/'],
];
const out = path.resolve(import.meta.dirname, '..', 'import');
const UA = 'Mozilla/5.0 (CloudRepairs site migration)';

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&');
const text = (html) =>
  decode(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''))
    .replace(/[ \t]+/g, ' ')
    .trim();
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];

function extract(html, pageUrl) {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
  const lines = [];
  const images = new Set();
  const re =
    /<(h[1-6]|p|li|a|img|button|figcaption|blockquote|td|th|source)\b([^>]*)>([\s\S]*?)(?=<\/\1>|<(?:h[1-6]|p|li|img|button)\b)|<(img|source|video)\b([^>]*)\/?>/gi;
  for (const m of body.matchAll(re)) {
    const tag = (m[1] ?? m[4]).toLowerCase();
    const attrs = m[2] ?? m[5] ?? '';
    if (tag === 'img' || tag === 'source' || tag === 'video') {
      const srcs = [
        attr(attrs, 'src'),
        attr(attrs, 'data-src'),
        attr(attrs, 'poster'),
        ...(attr(attrs, 'srcset') ?? '').split(',').map((s) => s.trim().split(' ')[0]),
      ].filter(Boolean);
      for (const src of srcs) {
        const abs = new URL(src, pageUrl).href;
        images.add(abs);
        if (tag === 'img') lines.push(`![${attr(attrs, 'alt') ?? ''}](${abs})`);
      }
      continue;
    }
    const t = text(m[3] ?? '');
    if (!t) continue;
    if (tag.startsWith('h')) lines.push(`\n${'#'.repeat(Number(tag[1]))} ${t}\n`);
    else if (tag === 'li') lines.push(`- ${t}`);
    else if (tag === 'a') lines.push(`[${t}](${new URL(attr(attrs, 'href') ?? '#', pageUrl).href})`);
    else if (tag === 'button') lines.push(`[кнопка] ${t}`);
    else lines.push(t);
  }
  // Фоновые изображения из inline-стилей
  for (const m of body.matchAll(/url\((['"]?)([^'")]+)\1\)/gi)) images.add(new URL(m[2], pageUrl).href);

  const title = text(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const description = decode(html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)/i)?.[1] ?? '');
  const md = [`<!-- источник: ${pageUrl} -->`, `title: ${title}`, `description: ${description}`, '', ...lines].join('\n');
  return { md, images: [...images].filter((u) => !u.startsWith('data:')) };
}

await fs.mkdir(out, { recursive: true });
for (const [name, p] of PAGES) {
  const url = new URL(p, BASE).href;
  const dir = path.join(out, name);
  await fs.mkdir(path.join(dir, 'images'), { recursive: true });
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    await fs.writeFile(path.join(dir, 'page.html'), html);
    const { md, images } = extract(html, res.url);
    await fs.writeFile(path.join(dir, 'content.md'), md);
    let saved = 0;
    for (const img of images) {
      try {
        const r = await fetch(img, { headers: { 'User-Agent': UA } });
        if (!r.ok) continue;
        const file = decodeURIComponent(new URL(img).pathname.split('/').pop() || `image-${saved}`);
        await fs.writeFile(path.join(dir, 'images', file), Buffer.from(await r.arrayBuffer()));
        saved++;
      } catch {
        /* пропускаем недоступное изображение */
      }
    }
    console.log(`✓ ${url} → import/${name}/ (изображений: ${saved}/${images.length})`);
  } catch (error) {
    console.error(`✗ ${url}: ${error.message}`);
  }
}
