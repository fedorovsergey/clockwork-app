# Model Context

Этот файл предназначен для быстрого погружения модели или разработчика в проект Clockwork App.

## Назначение проекта

Clockwork App - клиентская часть Clockwork, инструмента разработчика для PHP-приложений. Приложение показывает метаданные выполнения PHP-кода прямо в браузере: HTTP-запросы, консольные команды, задачи очередей, тесты, производительность, логи, SQL-запросы, кеш, Redis, события, представления, уведомления и другие данные.

Проект может работать в трех режимах:

- browser extension - панель DevTools для Chrome, Edge и Firefox;
- standalone web app - отдельное веб-приложение, обычно доступное из серверного Clockwork;
- share app - просмотр опубликованного snapshot-запроса.

## Технологии

- Vue 3 Options API.
- Vite.
- SCSS.
- Browser extension APIs для Chrome, Edge и Firefox.
- `urijs` для URL.
- `@sqltools/formatter` для форматирования SQL.
- `date-fns`, `prismjs`, `feather-icons`, `vue-clipboard2`, `@vueuse/components`.

## Основные entry points

- `src/main.js` - выбирает платформу, создает сервисы и глобальный объект приложения, монтирует Vue.
- `src/app.js` - создает Vue-приложение, регистрирует глобальные компоненты, директивы, миксины и доступ к сервисам через computed-свойства.
- `src/App.vue` - корневой layout: список запросов, детали выбранного запроса, боковая панель и whats-new overlay.
- `vite.config.js` - конфигурация Vite, сборка в `build`, SVG loader, Vue devtools, SCSS modern compiler, dev proxy для standalone metadata API.
- `index.html` - HTML entry point.

## Платформы

- `src/platform/extension.js` - режим browser extension. Получает URL активной вкладки, слушает сообщения от background/service worker, создает placeholder-запросы по Clockwork headers, подгружает metadata API, работает с cookie через extension API.
- `src/platform/standalone.js` - standalone-режим. Настраивает metadata URL от текущей страницы или `metadataPath`, в dev-режиме использует Vite proxy, периодически опрашивает metadata API.
- `src/platform/share.js` - режим просмотра shared request. Загружает JSON из `/data/`, отключает часть возможностей, умеет работать в screenshot-режиме.
- `platforms/chrome`, `platforms/edge`, `platforms/firefox` - manifest, devtools page и background/service worker файлы для расширений.

## Поток данных

1. `src/main.js` выбирает платформу: `Share`, `Extension` или `Standalone`.
2. Создаются сервисы: `$store`, `$requests`, `$settings`, `$authentication`, `$profiler`, `$sharing` и другие.
3. Платформа вызывает `requests.setRemote()` и `requests.setClient()`.
4. `src/features/requests.js` загружает metadata API (`latest`, `next`, `previous`, конкретный `request`, `extended`) и превращает ответы в модели `Request`.
5. `src/features/request.js` нормализует данные запроса: SQL, timeline, логи, ошибки, кеш, Redis, события, уведомления, web vitals, user tabs и прочее.
6. UI берет активный запрос из `global.$request` и показывает вкладки в `src/components/RequestDetails.vue`.

## Ключевые сервисы

- `src/features/requests.js` - reactive-коллекция запросов, загрузка, merge, сортировка, exclusive-загрузки, auth header.
- `src/features/request.js` - доменная модель одного Clockwork-запроса и вся обработка сырых metadata.
- `src/features/settings.js` - глобальные и site-specific настройки, сохранение в local storage или browser storage.
- `src/features/local-store.js` - абстракция поверх `localStorage` и extension storage.
- `src/features/authentication.js` - запрос учетных данных, если metadata API возвращает 403.
- `src/features/profiler.js` - Xdebug profiler, загрузка extended `xdebug`, парсинг callgrind.
- `src/features/on-demand.js` - включает on-demand profiling через cookie `clockwork-profile`.
- `src/features/sharing.js` - публикация запроса, фильтрация данных перед отправкой, удаление shared request.
- `src/features/requests-search.js` - поиск по списку запросов.
- `src/features/editor-links.js` - ссылки из stack trace/путей в локальный редактор.
- `src/features/text-filters.js` - глобальные форматтеры текста и дат.
- `src/features/update-notification.js`, `src/features/whats-new.js`, `src/features/credits.js` - вспомогательные UI-сценарии.

## UI-структура

- `src/components/RequestsList.vue` - список запросов, поиск, load more, clear, автофокус на новых запросах.
- `src/components/RequestDetails.vue` - центральная область с вкладками.
- `src/components/RequestSidebar.vue` - боковая панель с краткой информацией, деталями запроса и действиями share/delete.
- `src/components/Details/*` - tab bar, request header, whats-new, messages overlay.
- `src/components/Sidebar/*` - parent request и exception section.
- `src/components/Tabs/*` - вкладки доменных данных.
- `src/components/UI/*` - переиспользуемые UI-компоненты: modal, popover, details table, code highlight, stack trace, icons.

## Функциональные возможности проекта

- Просмотр списка Clockwork-запросов с методом/типом, статусом, временем выполнения и временем базы данных.
- Поддержка разных типов записей: HTTP request, AJAX request, console command, queue job, test.
- Автоматическое обнаружение запросов в browser extension по заголовкам `X-Clockwork-Id`, `X-Clockwork-Path`, `X-Clockwork-Version`, `X-Clockwork-Subrequest`.
- Поддержка subrequests и связи parent request.
- Standalone polling metadata API: загрузка latest, next, previous и конкретного request по hash.
- Загрузка дополнительных полей запроса через extended metadata.
- Поиск по списку запросов.
- Загрузка более старых запросов.
- Очистка списка запросов.
- Настройка сохранения или сброса лога при навигации.
- Сворачивание списка запросов и правой боковой панели.
- Светлая, темная и automatic theme.
- Просмотр performance summary: duration, database, cache, memory и custom metrics.
- Timeline выполнения запроса с событиями database, cache, Redis, queue jobs, notifications, HTTP requests и views.
- Client-side metrics и Web Vitals.
- Xdebug profiler: включение profiling cookie, загрузка callgrind profile, показ функций, self/inclusive metrics, проценты и лимит отображения.
- On-demand profiling через cookie с secret.
- Просмотр логов, уровней warning/error, exception data и stack trace.
- Выделение ошибок и предупреждений в списке запросов и боковой панели.
- Просмотр SQL-запросов, статистики SELECT/INSERT/UPDATE/DELETE/other, slow queries, bindings, модели и форматированного SQL.
- Просмотр Eloquent/model actions: retrieved, created, updated, deleted и custom actions.
- Просмотр cache operations: reads, hits, misses, writes, deletes, duration, expiration и values.
- Просмотр Redis commands.
- Просмотр queue jobs внутри запроса и отдельного типа queue-job.
- Просмотр dispatched events и listeners.
- Просмотр rendered views, данных view и времени рендера.
- Просмотр notifications, включая mail/email data.
- Просмотр outgoing HTTP requests с request/response данными и status message.
- Просмотр routes.
- Просмотр custom user tabs из `userData`.
- Просмотр command output для command-запросов.
- Просмотр деталей HTTP request: headers, GET/POST/request data, cookies, middleware, session, controller, URL.
- Просмотр деталей command: arguments, options, defaults и command line.
- Просмотр деталей queue job: payload/options/connection/status.
- Просмотр деталей test: group, name, status, asserts.
- Копирование URL запроса из sidebar.
- Открытие файлов из stack trace через настроенные editor links и local path map.
- Аутентификация metadata API при 403, включая username/password requirements.
- Share request: отправка выбранных частей metadata на sharing endpoint.
- Фильтрация данных перед share: можно исключать log, events, models, database, cache, Redis, queue, views, notifications, routes, output, userData.
- Просмотр shared request в отдельном share-режиме.
- Удаление shared request, если платформа поддерживает feature `delete-shared`.
- Уведомления об обновлениях server version и whats-new release notes.
- Хранение настроек в `localStorage` или browser storage.

## Сборка и запуск

- `npm run serve` - dev server.
- `npm run build` - базовая Vite-сборка в `build`.
- `npm run build-chrome` / `npm run build-chrome-dev` - сборка Chrome extension в `dist/chrome`.
- `npm run build-edge` / `npm run build-edge-dev` - сборка Edge extension в `dist/edge`.
- `npm run build-firefox` / `npm run build-firefox-dev` - сборка Firefox extension в `dist/firefox`.
- `npm run build-web` / `npm run build-web-dev` - standalone web app в `dist/web`.
- `npm run build-share` / `npm run build-share-dev` - share app в `dist/share`.

## Важные настройки окружения

- `VITE_PLATFORM=share` - включает share platform.
- `VITE_SHARING_URL` - endpoint для публикации shared request.
- `VITE_STANDALONE_REMOTE_HOST` - remote host для standalone dev proxy.
- `VITE_STANDALONE_REMOTE_PATH` - metadata path для standalone dev proxy, без `DNSID`.
- `VITE_STANDALONE_PROXY_TLS_VERIFY=1` - включает TLS verification для dev proxy.

`DNSID` не задается через env. Это пользовательская настройка в `Settings -> Show advanced`; standalone-режим добавляет ее как query-параметр к metadata-запросам в development и production.

## Соглашения и замечания

- Глобальные сервисы доступны в компонентах через app mixin как `$requests`, `$settings`, `$platform`, `$request` и т.д.
- В проекте преобладает Vue Options API, tab-компоненты и сервисы-классы с `shallowReactive`.
- Platform features проверяются через `$platform.hasFeature(feature)`.
- Сырые metadata API данные не используются напрямую в UI: сначала проходят через `Request` processing.
- Не хранить секреты в документации и коммитах. В репозитории есть `.env`, его содержимое не нужно читать или включать в контекст модели.
- При изменении поведения загрузки standalone metadata нужно держать в синхронизации `src/platform/standalone.js` и dev proxy в `vite.config.js`.
