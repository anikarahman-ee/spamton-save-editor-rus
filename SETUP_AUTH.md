# Настройка авторизации и облачных сохранений — Supabase

Этот редактор использует [Supabase](https://supabase.com) в качестве бэкенда:
авторизация, облачные сохранения, публичная библиотека, комментарии, коллекции и настройки профиля.

---

## 1. Создание проекта Supabase

1. Перейдите на [supabase.com](https://supabase.com) и зарегистрируйтесь (бесплатно)
2. Нажмите **"New project"**
3. Выберите организацию, задайте **Name** (например, `spamton-editor`) и придумайте **Database Password**
4. Выберите регион (ближайший к аудитории) и нажмите **"Create new project"**
5. Дождитесь окончания инициализации (~1 минута)

---

## 2. Получение ключей API

1. В левом меню Supabase откройте **Project Settings → API**
2. Скопируйте:
   - **Project URL** — вида `https://xxxxxxxxxxxx.supabase.co`
   - **anon / public key** — длинная строка под заголовком `anon`

3. Откройте файл `js/supabaseConfig.js` и вставьте значения:

```javascript
var SUPABASE_URL      = 'https://xxxxxxxxxxxx.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';
```

---

## 3. Создание таблиц

В Supabase откройте **SQL Editor** и выполните скрипт целиком.

```sql
-- Расширение для UUID
create extension if not exists "pgcrypto";

-- ─── Личные облачные сохранения ────────────────────────────────────────
create table if not exists public.user_saves (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    chapter     text not null,
    save_name   text not null,
    save_data   text not null,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- ─── Публичная библиотека сохранений ───────────────────────────────────
create table if not exists public.public_saves (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users(id) on delete cascade,
    author_name  text not null default 'Аноним',
    is_supporter boolean not null default false,
    chapter      text not null,
    save_name    text not null,
    description  text not null default '',
    save_data    text not null,
    downloads    integer not null default 0,
    likes        integer not null default 0,
    published_at timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

-- ─── Лайки (отдельная таблица для уникальности) ────────────────────────
create table if not exists public.save_likes (
    id       uuid primary key default gen_random_uuid(),
    user_id  uuid not null references auth.users(id) on delete cascade,
    save_id  uuid not null references public.public_saves(id) on delete cascade,
    unique (user_id, save_id)
);

-- ─── Профили пользователей ─────────────────────────────────────────────
create table if not exists public.user_profiles (
    id               uuid primary key default gen_random_uuid(),
    user_id          uuid not null unique references auth.users(id) on delete cascade,
    display_name     text not null default '',
    bio              text not null default '',
    avatar           text not null default '',
    is_supporter     boolean not null default false,
    role             text,           -- 'admin', 'moderator' или null
    supporter_token  text unique,    -- уникальный токен для выдачи Supporter (формат SPT-XXXXXXXX)
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);

-- Если таблица уже существует, добавьте колонку через миграцию:
-- alter table public.user_profiles add column if not exists supporter_token text unique;

-- ─── Комментарии ───────────────────────────────────────────────────────
create table if not exists public.comments (
    id             uuid primary key default gen_random_uuid(),
    save_id        uuid not null references public.public_saves(id) on delete cascade,
    user_id        uuid not null references auth.users(id) on delete cascade,
    author_name    text not null default 'Аноним',
    author_avatar  text not null default '',
    is_supporter   boolean not null default false,
    text           text not null,
    created_at     timestamptz not null default now()
);

-- ─── Жалобы ────────────────────────────────────────────────────────────
create table if not exists public.reports (
    id          uuid primary key default gen_random_uuid(),
    type        text not null,        -- 'save', 'comment', 'user'
    target_id   text not null,        -- ID объекта жалобы
    reporter_id uuid references auth.users(id) on delete set null,
    reason      text not null default '',
    status      text not null default 'pending',  -- 'pending', 'resolved', 'rejected'
    created_at  timestamptz not null default now(),
    resolved_at timestamptz
);

-- ─── Предложения (suggestions) ─────────────────────────────────────────
create table if not exists public.suggestions (
    id             uuid primary key default gen_random_uuid(),
    user_id        uuid references auth.users(id) on delete set null,
    author_name    text not null default 'Аноним',
    category       text not null default 'general',
    title          text not null,
    description    text not null default '',
    status         text not null default 'pending',
    admin_response text not null default '',
    created_at     timestamptz not null default now(),
    resolved_at    timestamptz
);

-- ─── Коллекции сохранений ──────────────────────────────────────────────
create table if not exists public.save_collections (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users(id) on delete cascade,
    author_name  text not null default 'Аноним',
    name         text not null,
    description  text not null default '',
    save_ids     uuid[] not null default '{}',
    is_public    boolean not null default true,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);
```

---

## 4. RPC-функции для лайков

Атомарно меняют счётчик лайков, чтобы избежать гонки данных.

```sql
-- Увеличить лайки
create or replace function increment_likes(save_id uuid)
returns void language sql security definer as $$
    update public.public_saves
    set likes = likes + 1
    where id = save_id;
$$;

-- Уменьшить лайки (не ниже 0)
create or replace function decrement_likes(save_id uuid)
returns void language sql security definer as $$
    update public.public_saves
    set likes = greatest(likes - 1, 0)
    where id = save_id;
$$;
```

---

## 5. Row Level Security (политики доступа)

```sql
-- ─── user_saves ────────────────────────────────────────────────────────
alter table public.user_saves enable row level security;

create policy "Пользователь читает свои сохранения"
    on public.user_saves for select using (auth.uid() = user_id);
create policy "Пользователь создаёт свои сохранения"
    on public.user_saves for insert with check (auth.uid() = user_id);
create policy "Пользователь обновляет свои сохранения"
    on public.user_saves for update using (auth.uid() = user_id);
create policy "Пользователь удаляет свои сохранения"
    on public.user_saves for delete using (auth.uid() = user_id);

-- ─── public_saves ──────────────────────────────────────────────────────
alter table public.public_saves enable row level security;

create policy "Все читают публичные сохранения"
    on public.public_saves for select using (true);
create policy "Авторизованный пользователь публикует"
    on public.public_saves for insert with check (auth.uid() = user_id);
create policy "Автор обновляет своё сохранение"
    on public.public_saves for update using (auth.uid() = user_id);
create policy "Автор удаляет своё сохранение"
    on public.public_saves for delete using (auth.uid() = user_id);

-- ─── save_likes ────────────────────────────────────────────────────────
alter table public.save_likes enable row level security;

create policy "Пользователь видит свои лайки"
    on public.save_likes for select using (auth.uid() = user_id);
create policy "Пользователь ставит лайк"
    on public.save_likes for insert with check (auth.uid() = user_id);
create policy "Пользователь снимает лайк"
    on public.save_likes for delete using (auth.uid() = user_id);

-- ─── user_profiles ─────────────────────────────────────────────────────
alter table public.user_profiles enable row level security;

create policy "Все читают профили"
    on public.user_profiles for select using (true);
create policy "Пользователь создаёт свой профиль"
    on public.user_profiles for insert with check (auth.uid() = user_id);
create policy "Пользователь обновляет свой профиль"
    on public.user_profiles for update using (auth.uid() = user_id);

-- ─── comments ──────────────────────────────────────────────────────────
alter table public.comments enable row level security;

create policy "Все читают комментарии"
    on public.comments for select using (true);
create policy "Авторизованный добавляет комментарий"
    on public.comments for insert with check (auth.uid() = user_id);
create policy "Автор удаляет свой комментарий"
    on public.comments for delete using (auth.uid() = user_id);

-- ─── reports ───────────────────────────────────────────────────────────
alter table public.reports enable row level security;

create policy "Авторизованный создаёт жалобу"
    on public.reports for insert with check (auth.uid() = reporter_id);
create policy "Все читают жалобы"
    on public.reports for select using (true);
create policy "Обновление жалобы (admin)"
    on public.reports for update using (true);
create policy "Удаление жалобы (admin)"
    on public.reports for delete using (true);

-- ─── suggestions ───────────────────────────────────────────────────────
alter table public.suggestions enable row level security;

create policy "Все читают предложения"
    on public.suggestions for select using (true);
create policy "Авторизованный создаёт предложение"
    on public.suggestions for insert with check (auth.uid() = user_id);
create policy "Обновление предложения (admin)"
    on public.suggestions for update using (true);
create policy "Удаление предложения (admin)"
    on public.suggestions for delete using (true);

-- ─── save_collections ──────────────────────────────────────────────────
alter table public.save_collections enable row level security;

create policy "Все читают публичные коллекции"
    on public.save_collections for select
    using (is_public = true or auth.uid() = user_id);
create policy "Авторизованный создаёт коллекцию"
    on public.save_collections for insert with check (auth.uid() = user_id);
create policy "Автор обновляет коллекцию"
    on public.save_collections for update using (auth.uid() = user_id);
create policy "Автор удаляет коллекцию"
    on public.save_collections for delete using (auth.uid() = user_id);
```

> **Примечание:** политики для `reports` и `suggestions` намеренно открытые — реальная проверка роли `admin` происходит в `js/admin.js`. Для более строгой защиты добавьте проверку через `user_profiles.role`.

---

## 6. Авторизация через Email + Пароль

По умолчанию уже включена. Чтобы убедиться:

1. Откройте **Authentication → Providers → Email**
2. Проверьте, что провайдер включён
3. Опционально: выключите **Confirm email** (подтверждение по почте) через
   **Authentication → Settings → Disable email confirmations** — удобно на этапе разработки

---

## 7. Авторизация через Google OAuth

1. Откройте [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Создайте **OAuth 2.0 Client ID** (тип: **Web application**)
3. В **Authorized JavaScript origins** добавьте:
   - `https://xxxxxxxxxxxx.supabase.co`
   - `https://yourdomain.com`
4. В **Authorized redirect URIs** добавьте:
   - `https://xxxxxxxxxxxx.supabase.co/auth/v1/callback`
5. Скопируйте **Client ID** и **Client Secret**
6. В Supabase откройте **Authentication → Providers → Google**
7. Включите провайдер, вставьте **Client ID** и **Client Secret**, нажмите **Save**

---

## 8. Разрешённые URL для редиректа

1. Откройте **Authentication → URL Configuration**
2. **Site URL**: `https://yourdomain.com`
3. **Redirect URLs** — добавьте:
   - `https://yourdomain.com`
   - `https://yourdomain.com/**`
   - `http://localhost:*` (для локальной разработки)

---

## 9. Проверка работоспособности

1. Откройте сайт в браузере
2. В правом верхнем углу должны появиться кнопки **«Войти»** и **«Регистрация»**
3. Зарегистрируйтесь через email или войдите через Google
4. Откройте любую главу, загрузите сохранение
5. Нажмите **«Сохранить в облако»** — появится окно с полем для имени
6. Нажмите **«Мои сохранения»** — откроется список облачных сохранений
7. Перейдите в **Библиотеку** — должна работать публикация и поиск

---

## Структура файлов

```
js/
  supabaseConfig.js   — URL и anon-ключ, инициализация клиента Supabase
  auth.js             — регистрация, вход, Google OAuth, UI-панель авторизации
  cloudSaves.js       — личные облачные сохранения (CRUD)
  saveLibrary.js      — публичная библиотека (публикация, поиск, лайки, загрузки)
  comments.js         — комментарии к публичным сохранениям
  profile.js          — профиль пользователя (имя, аватар, биография)
  admin.js            — панель администратора (роли, жалобы, предложения)
  collections.js      — коллекции сохранений
css/
  auth.css            — панель авторизации, модальные окна, список сохранений
  library.css         — страница публичной библиотеки
  collections.css     — страница коллекций
library.html          — публичная библиотека сохранений
collections.html      — коллекции сохранений
admin.html            — панель администратора
```

---

## Лимиты бесплатного плана Supabase

| Ресурс               | Лимит           |
|----------------------|-----------------|
| База данных          | 500 МБ          |
| Хранилище файлов     | 1 ГБ            |
| Пользователи         | Без ограничений |
| Запросы к API        | 500 000 / месяц |
| Auth MAU             | 50 000 / месяц  |

Этого более чем достаточно для редактора сохранений.
