# Instagram Clone 📸

Полнофункциональный клон Instagram с современной архитектурой FSD (Feature-Sliced Design).

## 🚀 Стек технологий

- **Фреймворк:** Next.js 16 (App Router + Turbopack)
- **Язык:** TypeScript 5
- **Стилизация:** Tailwind CSS 4
- **Стейт-менеджмент:** Zustand 5
- **Асинхронные данные:** TanStack Query v5 (React Query)
- **HTTP клиент:** Axios (с JWT перехватчиками и авто-обновлением токенов)
- **Валидация:** Zod 4
- **Иконки:** React Icons (Feather & FontAwesome)

## 📁 Архитектура (Feature-Sliced Design)

```
instagram-clone-frontend/
├── app/                  # Next.js App Router (страницы и роутинг)
│   ├── auth/             # Авторизация (Login, Register)
│   ├── profile/          # Профиль пользователя
│   ├── providers/        # QueryClient, Theme и App провайдеры
│   ├── layout.tsx        # Корневой layout
│   └── page.tsx          # Главная лента
├── src/
│   ├── widgets/          # Комплексные блоки интерфейса
│   │   ├── Sidebar       # Боковая навигация
│   │   ├── StoriesBar    # Лента историй
│   │   ├── Feed          # Лента публикаций
│   │   └── Suggestions   # Рекомендации пользователей
│   ├── features/         # Интерактивные фичи приложения
│   │   └── auth/         # Логика и формы входа/регистрации (useAuth, authApi)
│   └── entities/         # Бизнес-сущности
│       ├── post/         # Карточки и сетка постов (PostCard, PostGrid)
│       ├── user/         # Аватары и элементы пользователей (UserAvatar, UserListItem)
│       └── story/        # Индикатор и кольцо историй (StoryRing)
└── shared/
    ├── domain/           # Типы сущностей (Post, User, Comment, Story) и Zod-схемы
    └── lib/              # Общие утилиты (apiClient, queryClient, utils)
```

## 🛠 Запуск проекта

```bash
cd instagram-clone-frontend
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.
