import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Шрифты и иконки подключаются отдельными файлами, а не base64 внутри CSS
    assetsInlineLimit: 2048,
  },
  css: {
    modules: {
      // Одинаковые имена классов в клиентской и SSR-сборке — нужно для гидратации
      generateScopedName: '[name]_[local]_[hash:base64:5]',
    },
  },
});
