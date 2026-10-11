import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App, prerenderRoutes } from './App';
import { normalizePath } from './seo';
import './styles/global.css';

const container = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// В production HTML уже отрисован пререндером — «оживляем» его. Если сервер отдал
// HTML другой страницы (SPA-фолбэк) или это dev-режим — рисуем с нуля.
const prerendered = container.dataset.prerendered;
const path = normalizePath(window.location.pathname);
const matches = prerendered === path || (prerendered === '404' && !prerenderRoutes.includes(path));

if (prerendered && matches) {
  hydrateRoot(container, app);
} else {
  container.textContent = '';
  createRoot(container).render(app);
}
