import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { App, prerenderRoutes } from './App';
import { site } from './content/site';
import { headTags } from './seo';

/** Используется только скриптом scripts/prerender.mjs при сборке */
export function render(url: string): string {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  );
}

export { headTags, prerenderRoutes };
export const siteUrl = site.url;
