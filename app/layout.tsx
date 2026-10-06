import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { Providers } from '@/components/shared/Providers';
import './globals.css';

const manrope = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font-manrope', display: 'swap' });

export const metadata: Metadata = {
  title: 'Водовоз — вызов водовоза онлайн',
  description: 'Укажите адрес, объём и свою цену — ближайшие водовозы предложат доставку воды. Демо-версия MVP.',
  applicationName: 'Водовоз',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B57E8',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
