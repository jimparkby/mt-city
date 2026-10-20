# МТ Сити

Веб-игра о финансовой грамотности для детей. Открывается в WebView приложения Moby.
Стек: Phaser 4 + React 19 + TypeScript + Vite на клиенте, Node.js + Fastify + Prisma на сервере.

Полное ТЗ: [`docs/ТЗ МТ Сити.docx`](docs/).

## Быстрый старт

Нужны **Node.js 22+** (LTS), **Git**, **VS Code**, **Chrome**.

```bash
git clone <url-репозитория> mt-city
cd mt-city
npm install                        # заодно соберёт @mt/shared и сгенерирует Prisma Client
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
npm run db:setup                   # миграция SQLite + seed магазинов
npm run dev                        # клиент http://localhost:8080, сервер http://localhost:3000
```

Проверка на телефоне: телефон в той же Wi‑Fi‑сети, `npm run dev -w client -- --host`,
открыть `http://<IP-компьютера>:8080`. В `apps/client/.env` поставить `VITE_API_URL=http://<IP>:3000/api/v1`,
в `apps/server/.env` добавить этот адрес в `CLIENT_ORIGIN` (через запятую).

## Команды

| Команда                           | Что делает                                    |
| --------------------------------- | --------------------------------------------- |
| `npm run dev`                     | shared (watch) + клиент + сервер одновременно |
| `npm test`                        | тесты формул экономики (Vitest)               |
| `npm run typecheck`               | проверка типов клиента и сервера              |
| `npm run lint` / `npm run format` | ESLint / Prettier                             |
| `npm run build`                   | продакшн-сборка всего                         |
| `npm run db:setup`                | первая миграция + seed                        |
| `npm run db:migrate -w server`    | новая миграция после правки `schema.prisma`   |
| `npm run db:seed -w server`       | перезалить справочник магазинов и товаров     |
| `npm run db:studio -w server`     | Prisma Studio — база в браузере               |

## Структура

```
apps/client/      Phaser 4 + React + Vite
  src/game/       всё, что рисует Phaser: сцены City, Barista, объекты
  src/ui/         React-экраны поверх карты (HUD, банк, магазин, ...)
  src/api/        fetch-клиент + хуки TanStack Query
  src/store/      Zustand: сессия, открытый экран
  src/moby/       MobyBridge и его mock
apps/server/      Fastify + Prisma
  prisma/         schema.prisma, seed.ts
  src/routes/     роуты по секторам
  src/services/   логика: tick, сессии
packages/shared/  типы, Zod-схемы, формулы экономики, константы баланса
```

**Правила:**

- Phaser — только карта и мини-игры; всё с текстом и формами — React. Связь — через `EventBus` (`src/game/EventBus.ts`, события описаны в `GameEvents`).
- Деньги считает только сервер. Все суммы — целые копейки MTcoin, ставки — базисные пункты (1% = 100 bp).
- Любое изменение баланса — через `moveMoney()` (`apps/server/src/lib/money.ts`) внутри `prisma.$transaction`: так пишется журнал `Transaction`.
- Таймеры не крутятся в фоне: перед каждым запросом `services/tick.ts` «догоняет» время.
- Формулы — в `packages/shared/src/economy.ts`, константы — в `config.ts`, каждая формула покрыта тестом.
- Округление в пользу банка: что получает игрок — `Math.floor`, что платит — `Math.ceil`.
- К Moby — только через `moby` из `src/moby`. В браузере работает `MockMobyBridge`.
- Не используем `alert`/`confirm`, учитываем safe area — игра живёт в WebView.

## Что уже готово

- Монорепо на npm workspaces, ESLint + Prettier, CI на GitHub Actions.
- `@mt/shared`: все формулы раздела 8 ТЗ с тестами, Zod-схемы всех запросов раздела 7, типы ответов.
- Сервер: Prisma-схема и seed, авторизация по токену сессии, rate limit, единый формат ошибок,
  `POST /auth/session`, `GET /player/me`, `POST /onboarding/complete`, `GET /transactions`,
  `GET /bank/overview`, `POST /bank/loans/quote`, `GET /shops`, `GET /shops/:id/products`, `GET /jobs`, `GET /lessons`,
  `POST /dev/time-skip`, `POST /dev/reset`. Остальные эндпоинты ТЗ уже зарегистрированы и отвечают `501 NOT_IMPLEMENTED`
  с подсказкой, в какой ветке их делать.
- Клиент: изометрический город-заглушка (здания-ромбы, перетаскивание, pinch-zoom, тап → экран), HUD, онбординг,
  экраны банка и магазина (только чтение), заглушки остальных экранов, мини-игра «Бариста» (черновик механики),
  MobyBridge + mock, PWA service worker, кнопка «+1 день» в dev-режиме.

Что осталось — в [Issues](../../issues) и по `TODO(feat/...)` в коде (`grep -rn "TODO(" apps packages`).

## Git

- `main` всегда рабочая — её показываем.
- Работа — в `feat/<сектор>`: `feat/bank`, `feat/shop`, `feat/business`, `feat/jobs`, `feat/city`, ...
- Маленькие PR, мерж после быстрой проверки товарищем; CI должен быть зелёным.
- Коммиты: `feat: ...`, `fix: ...`, `chore: ...`.

## Окружения

|       | База                     | Moby          | Игровой день           |
| ----- | ------------------------ | ------------- | ---------------------- |
| local | SQLite                   | mock          | 1 мин (`DAY_MS=60000`) |
| demo  | SQLite на Render/Railway | mock          | 1 мин                  |
| pilot | PostgreSQL               | реальный мост | 1 ч (`DAY_MS=3600000`) |

### Деплой демо

- **Клиент** → Vercel/Netlify (корень репозитория): build `npm run build -w @mt/shared && npm run build -w client`,
  output `apps/client/dist`, переменная `VITE_API_URL=https://<сервер>/api/v1`.
- **Сервер** → Render/Railway: build `npm install && npm run build -w @mt/shared && npm run build -w server && npm run db:deploy -w server && npm run db:seed -w server`,
  start `npm start -w server`. Переменные — из `apps/server/.env.example`; `SESSION_SECRET` — случайная строка,
  `CLIENT_ORIGIN` — адрес клиента. Для SQLite нужен persistent disk.

Для защиты держите запасной вариант: локальный запуск на ноутбуке + видеозапись демо.

## Ассеты

Изометрические паки [Kenney](https://kenney.nl/assets/tag:isometric) (CC0), иконки — Lucide или Phosphor.
Карту рисуем в [Tiled](https://www.mapeditor.org/) (изометрия, `.tmj`) → `apps/client/public/assets/maps/city.tmj`.

## Вход и демо-режим

- **Регистрации нет.** Игрок приходит из Moby: клиент берёт одноразовый токен `moby.getAuthToken()`, сервер меняет его на профиль ребёнка (`POST /auth/session`). В mock-режиме это демо-профиль «Алиса, 10 лет» (`MOCK_MOBY_PROFILE` в `@mt/shared`).
- **Демо-режим без сервера и БД.** Если в клиенте не задан `VITE_API_URL`, все запросы обрабатываются в браузере (`apps/client/src/api/demo.ts`) по тем же формулам из `@mt/shared`, состояние хранится в `localStorage`. Так работает деплой на Vercel: https://mt-city.vercel.app. Новые эндпоинты добавляйте и на сервер, и в `demo.ts`.
- Сбросить демо-прогресс: DevTools → Application → Local Storage → удалить `mt-city:demo-state`.
