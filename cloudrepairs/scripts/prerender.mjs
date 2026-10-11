/**
 * Статический пререндер: превращает SPA в готовые HTML-файлы по адресам
 * оригинального сайта (dist/index.html, dist/obuchen/index.html, …),
 * добавляет мета-теги, sitemap.xml и robots.txt.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const ssrDir = path.join(root, 'dist-ssr');

const template = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
const { render, headTags, prerenderRoutes, siteUrl } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href);

async function write(url, file, marker = url) {
  // data-prerendered: по нему клиент понимает, что HTML отрисован для этого адреса
  const html = template
    .replace('<!--app-head-->', headTags(url))
    .replace('<div id="root">', `<div id="root" data-prerendered="${marker}">`)
    .replace('<!--app-html-->', render(url));
  const target = path.join(dist, file);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, html);
  console.log(`  ${url.padEnd(26)} → dist/${file.split(path.sep).join('/').replace(/^\/+/, '')}`);
}

console.log('Пререндер страниц:');
for (const url of prerenderRoutes) {
  await write(url, url === '/' ? 'index.html' : path.join(url, 'index.html'));
}
await write('/404/', '404.html', '404');

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${prerenderRoutes.map((url) => `  <url><loc>${siteUrl}${url}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;
await fs.writeFile(path.join(dist, 'sitemap.xml'), sitemap);
await fs.writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
console.log('  sitemap.xml, robots.txt');

await fs.rm(ssrDir, { recursive: true, force: true });
