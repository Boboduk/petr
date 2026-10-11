/**
 * Общие данные сайта: навигация и контакты.
 *
 * Контакты взяты из раздела «Приобрести Сервис» главной страницы
 * cloudrepairs.ru (по фрагменту поискового индекса, октябрь 2026).
 */

export const site = {
  name: 'CloudRepairs',
  url: 'https://cloudrepairs.ru',
  /** Вход в веб-приложение сервиса (адрес из поискового индекса) */
  loginUrl: 'https://cloudrepairs.ru/Account/Login',
  contacts: {
    email: 'vladimir.slepov.cr@yandex.ru',
    phone: '8 (929) 220-02-45',
    phoneHref: 'tel:+79292200245',
  },
  /** Короткое описание для подвала — формулировка с главной страницы */
  tagline: 'Облачный SaaS сервис по планированию и управлению ремонтами и техническим обслуживанием.',
} as const;

export interface NavItem {
  to: string;
  label: string;
}

/**
 * Пункты меню. Названия соответствуют четырём страницам сайта;
 * оригинальные подписи пунктов меню получить не удалось — при необходимости
 * поправьте их здесь, изменения применятся в шапке, мобильном меню и подвале.
 */
export const mainNav: NavItem[] = [
  { to: '/', label: 'Главная' },
  { to: '/obuchen/', label: 'Обучение' },
  { to: '/about/', label: 'О нас' },
  { to: '/vnutyankaya-training/', label: 'Внутреннее обучение' },
];
