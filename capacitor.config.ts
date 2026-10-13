import type { CapacitorConfig } from '@capacitor/cli';

/** Android-приложение «Водовоз»: оболочка Capacitor вокруг статической сборки из out/ */
const config: CapacitorConfig = {
  appId: 'ru.vodovoz.demo',
  appName: 'Водовоз',
  webDir: 'out',
  backgroundColor: '#f1f5fa',
  android: {
    // в демо нет отладочных инструментов для пользователя
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
