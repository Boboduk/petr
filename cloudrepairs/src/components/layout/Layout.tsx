import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';
import { ScrollManager } from './ScrollManager';
import { SeoManager } from './SeoManager';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Перейти к содержимому
      </a>
      <ScrollManager />
      <SeoManager />
      <Header />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}
