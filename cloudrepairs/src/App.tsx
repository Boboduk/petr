import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { Layout } from './components/layout/Layout';
import { aboutPage } from './content/about';
import { obuchenPage } from './content/obuchen';
import { internalTrainingPage } from './content/vnutyankaya-training';
import { ContentPage } from './pages/ContentPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

/** Витрина компонентов — только в режиме разработки, в сборку не попадает */
const UiKitPage = import.meta.env.DEV ? lazy(() => import('./dev/UiKitPage')) : null;

/** URL совпадают с адресами оригинального сайта */
export const prerenderRoutes = ['/', '/obuchen/', '/about/', '/vnutyankaya-training/'];

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/obuchen/" element={<ContentPage key="obuchen" page={obuchenPage} />} />
        <Route path="/about/" element={<ContentPage key="about" page={aboutPage} />} />
        <Route path="/vnutyankaya-training/" element={<ContentPage key="training" page={internalTrainingPage} />} />
        {UiKitPage && (
          <Route
            path="/__ui/"
            element={
              <Suspense fallback={null}>
                <UiKitPage />
              </Suspense>
            }
          />
        )}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
