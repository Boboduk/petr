/**
 * Сборка внутри Android-приложения (Capacitor). Задаётся при сборке:
 * NEXT_PUBLIC_APP_TARGET=android (см. npm run build:android).
 * В приложении нет вкладок браузера, поэтому ссылки «открыть в новой вкладке» скрываются.
 */
export const IS_NATIVE_APP = process.env.NEXT_PUBLIC_APP_TARGET === 'android';
