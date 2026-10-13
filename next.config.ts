import type { NextConfig } from 'next';

/**
 * NEXT_OUTPUT=export — статическая сборка в папку out/ для Android-приложения (Capacitor).
 * Без переменной — обычный режим Next.js (npm run dev / npm start).
 */
const isStaticExport = process.env.NEXT_OUTPUT === 'export';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isStaticExport ? { output: 'export', images: { unoptimized: true } } : {}),
};

export default nextConfig;
