/** Russian is the source language: its shape is the contract every other locale must match */
export const ru = {
  common: {
    close: "Закрыть",
    cancel: "Отмена",
    save: "Сохранить",
    done: "Готово",
    retry: "Повторить",
    loading: "Загрузка…",
    verified: "Подтверждённый аккаунт",
    showPassword: "Показать пароль",
    hidePassword: "Скрыть пароль",
    errorTitle: "Что-то пошло не так",
    errorDescription: "Не удалось загрузить данные. Проверьте соединение и попробуйте ещё раз.",
  },
  nav: {
    main: "Основная навигация",
    home: "Главная",
    search: "Поиск",
    explore: "Интересное",
    reels: "Reels",
    messages: "Сообщения",
    notifications: "Уведомления",
    create: "Создать",
    profile: "Профиль",
    more: "Ещё",
  },
  menu: {
    settings: "Настройки",
    saved: "Сохранённое",
    appearance: "Оформление",
    themeSystem: "Как в системе",
    themeLight: "Светлая",
    themeDark: "Тёмная",
    switchToDark: "Тёмная тема",
    switchToLight: "Светлая тема",
    language: "Язык",
    logout: "Выйти",
  },
  time: {
    now: "только что",
    minutes: "{count} мин.",
    hours: "{count} ч.",
    days: "{count} дн.",
    weeks: "{count} нед.",
  },
};

export type Messages = typeof ru;
