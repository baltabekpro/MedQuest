Ты опытный React-разработчик. Твоя задача — реализовать полноценный frontend для
проекта **MedQuest CRM** — медицинской CRM-системы управления пациентами и запросами.

---

## Структура репозитория

```
MedQuest/
├── backend/          ← FastAPI backend (уже работает, порт 8000)
├── design/
│   ├── html/         ← 12 готовых HTML-макетов от Stitch (ТВОЙ ОСНОВНОЙ ИСТОЧНИК ДИЗАЙНА)
│   └── screenshots/  ← скриншоты всех страниц
├── swagger.yml       ← OpenAPI спецификация текущего API
```

**Frontend должен находиться в папке `frontend/` в корне репозитория.**

---

## Стек технологий

- **React 18 + TypeScript** (строгая типизация, `noImplicitAny: true`)
- **Vite** (билд-тул, dev server на порту 5173)
- **React Router v6** — маршрутизация
- **Axios** — HTTP-клиент (базовый URL `http://localhost:8000`)
- **Zustand** — состояние (auth store, опционально другие)
- **React Hook Form + Zod** — формы и валидация
- **TanStack Query (React Query v5)** — кэширование и синхронизация данных сервера
- **Tailwind CSS v3** — стилизация (используй дизайн-токены из макетов)
- **shadcn/ui** (или **Radix UI**) — базовые UI-компоненты (Dialog, Select, Table, Toast)
- **Lucide React** — иконки

> ⚠️ Не изобретай собственные компоненты с нуля — используй shadcn/ui как основу.
> Кастомизируй под наш дизайн через Tailwind-классы.

---

## Дизайн-система (из макетов)

```
Цвета:
  Primary:     #2563EB  (кнопки, активные ссылки, акценты)
  Background:  #F8FAFC  (фон страниц)
  Sidebar:     #FFFFFF  (белый)
  Border:      #E2E8F0
  Text:        #0F172A  (основной)
  Text muted:  #64748B  (вторичный)

Статусы запросов:
  new:         green  (#16A34A bg-green-100 text-green-800)
  in_progress: orange (#D97706 bg-orange-100 text-orange-800)
  closed:      gray   (#6B7280 bg-gray-100 text-gray-700)

Роли пользователей:
  admin:       purple (#7C3AED bg-purple-100 text-purple-800)
  registrar:   blue   (#2563EB bg-blue-100 text-blue-800)
  doctor:      teal   (#0D9488 bg-teal-100 text-teal-800)

Шрифт: Inter (подключить через fontsource или Google Fonts)
Радиус: rounded-lg (8px) для карточек, rounded-md для кнопок/инпутов
Тени: shadow-sm для карточек
```

---

## Страницы и маршруты

Все страницы реализованы в HTML-макетах (`design/html/`). **Открой каждый файл и точно
воспроизведи дизайн.** Ниже описание каждой страницы и её особенности.

### Публичные маршруты (без авторизации)

#### `/login` → `01-login.html`
- Двухколоночный layout: слева hero с градиентом и тегом «MedQuest — Умная регистратура»,
  справа белая карточка входа.
- Поля: Email, Пароль (с кнопкой show/hide), кнопка «Войти».
- При ошибке API показывать alert с текстом ошибки (неверный email/пароль).
- После успешного входа → сохранить `access_token` и `refresh_token` в Zustand + localStorage,
  редирект на `/dashboard`.
- Если пользователь уже авторизован → редирект на `/dashboard`.

---

### Защищённые маршруты (с `PrivateRoute` wrapper)

Все защищённые страницы имеют единый layout: **левый сайдбар + шапка**.

**Сайдбар** (компонент `<Sidebar />`):
- Логотип MedQuest (синий крест + текст)
- Навигация с иконками (Lucide):
  - Dashboard → `/dashboard` (LayoutDashboard icon)
  - Пациенты → `/patients` (Users icon)
  - Запросы → `/requests` (FileText icon)
  - Пользователи → `/users` (UserCog icon) — только для `admin`
  - Аудит → `/audit` (ClipboardList icon) — только для `admin`
- Нижняя секция: аватар-инициалы, имя, роль, кнопка выхода.

**Шапка** (компонент `<Header />`): заголовок текущей страницы, дата, иконка уведомлений.

---

#### `/dashboard` → `02-dashboard.html`
- 4 карточки-метрики: получить из `GET /dashboard/stats`.
  - Всего пациентов (`total_patients`)
  - Активных запросов (`requests_in_progress`)
  - Новых запросов (`requests_new`)
  - Закрыто сегодня (`requests_closed_today` — если поле ещё не реализовано в API,
    показывай значение `requests_closed` временно с пометкой в коде `// TODO`)
- Таблица «Последние запросы»: `GET /requests?limit=5&page=1` (или без пагинации если
  backend ещё не готов — получи все и срежь первые 5).
- Колонки таблицы: №, Пациент (`patient_full_name`), Заголовок, Статус (badge), Приоритет, Врач,
  Дата. Если `patient_full_name` не приходит с бэкенда — показывай `patient_id`.
- Кликнув на строку → переход на `/requests/{id}`.
- Справа мини-бар-чарт «Активность за неделю» — реализуй через `recharts` или
  заглушку с 7 столбиками из фиксированных данных (пока API не готово).

---

#### `/patients` → `03-patients.html`
- Поиск (debounce 300ms) → `GET /patients?search=...`
- Таблица с пагинацией: `GET /patients?page=N&limit=20`
- Колонки: ID, ФИО (bold, кликабельное → `/patients/{id}`), Дата рождения, Телефон, Email,
  Адрес, Дата регистрации, Действия (eye → просмотр, pencil → редактирование, trash → удаление).
- Кнопка «+ Добавить пациента» → открыть модалку `<PatientModal />`
- Подтверждение удаления через `<AlertDialog />` от shadcn/ui.
- Пагинация снизу: «Показано X–Y из Z», предыдущая/следующая страница.

---

#### `/patients/:id` → `07-patient-profile.html`
- Два столбца:
  - Левый: карточка с данными пациента (аватар-инициалы, все поля из `PatientResponse`).
    Кнопка «Редактировать» → открыть модалку с формой.
  - Правый: «История запросов» — `GET /requests?patient_id={id}`.
    Таблица похожа на страницу запросов. Кнопка «+ Создать запрос» → модалка создания
    с предзаполненным полем «Пациент».
- Breadcrumb: `Пациенты / {full_name}`.

---

#### `/requests` → `04-requests.html`
- Фильтры: статус (select), приоритет (select 1-5), врач (select из списка докторов),
  диапазон дат (два `<Input type="date">`), поиск (debounced).
- Все фильтры → query-параметры к `GET /requests`.
- Таблица с пагинацией аналогично пациентам.
- Колонки: ID, Пациент (ссылка), Заголовок, Описание (truncate 60px), Статус (badge),
  Приоритет (число), Врач, Дата, Действия.
- Кнопка «+ Создать запрос» → модалка `<RequestModal />`.
- Клик на строку → `/requests/{id}`.

---

#### `/requests/:id` → `08-request-detail.html`
- Breadcrumb: `Запросы / {title} #{id}`, badges статус и приоритет в шапке.
- Два столбца:
  - Левый (шире):
    - Карточка «Информация»: заголовок, описание, ссылка на пациента.
    - Карточка «Смена статуса»: три кнопки (Новый, В работе, Закрыть).
      При смене → `PATCH /requests/{id}/status`. Текущий статус выделен.
    - Карточка «История изменений»: вертикальный timeline из `GET /audit/logs?entity_type=PatientRequest&entity_id={id}` (если поддерживается) или статичная заглушка.
  - Правый:
    - Карточка «Назначенный врач»: аватар + имя. Кнопка «Сменить врача» →
      dropdown с `GET /users?role=doctor` → `PATCH /requests/{id}/assign`.
    - Карточка «Детали»: приоритет 1–5 (кликабельный), дата создания, кем создан.

---

#### `/users` → `05-users.html` (только для `role === 'admin'`)
- Вкладки (tabs): Все / Администраторы / Регистраторы / Врачи.
  При переключении → `GET /users?role={role}` или фильтрация на клиенте.
- Поиск → `GET /users?search=...`
- Таблица: ID, Аватар+ФИО, Email, Роль (badge), Статус (Активен/Неактивен badge),
  Дата создания, Действия (pencil, toggle is_active, trash).
- Кнопка «+ Добавить пользователя» → `<UserModal />`.
- Toggle активности → `PUT /users/{id}` с `{ is_active: !current }`.

---

#### `/audit` → `06-audit.html` (только для `role === 'admin'`)
- Фильтры: дата (from/to), пользователь (select), тип действия (CREATE/UPDATE/DELETE/LOGIN),
  сущность (Пациент/Запрос/Пользователь), поиск.
- Таблица: ID, Дата+время (monospace), Пользователь, Действие (badge), Сущность,
  Описание, IP-адрес.
- Кнопка «Экспорт CSV» — реализуй как простой download через `data:text/csv,...`.
- Пагинация.

---

#### `/profile` → `12-profile-settings.html`
- Секция «Личные данные»: редактирование `full_name` → `PATCH /auth/me`.
- Секция «Безопасность»: форма смены пароля → `POST /auth/change-password`.
  Индикатор надёжности пароля (слабый/средний/сильный по длине и символам).
- Секция «Активность»: `GET /auth/sessions` (если не реализовано — заглушка с фейк-данными).

---

## Модальные окна (компоненты)

### `<PatientModal />` → `09-modal-patient-form.html`
- Режимы: создание и редактирование (пропс `patient?: PatientResponse`).
- Поля: ФИО*, Дата рождения*, Телефон*, Email, Адрес.
- Валидация через Zod:
  - ФИО: min 2 символа
  - Дата: обязательна, не в будущем
  - Телефон: паттерн `+7 (xxx) xxx-xx-xx`
  - Email: valid email или пустое
- Создание: `POST /patients`, редактирование: `PUT /patients/{id}`.
- После успеха: закрыть, инвалидировать React Query кэш `['patients']`, показать toast.

### `<RequestModal />` → `10-modal-request-form.html`
- Режимы: создание и редактирование.
- Поля: Пациент* (searchable select из `GET /patients`), Заголовок*, Описание*,
  Приоритет (1–5, дефолт 3), Назначить врача (select из `GET /users?role=doctor`), Статус.
- Создание: `POST /requests`, редактирование: `PUT /requests/{id}`.

### `<UserModal />` → `11-modal-user-form.html`
- Только создание (редактирование через отдельную форму поверх PUT).
- Поля: ФИО*, Email*, Роль* (3 карточки: Администратор/Регистратор/Врач), Пароль* (мин 6),
  Подтвердить пароль*, переключатель «Активен».
- `POST /users`.

---

## Auth & API-клиент

### `src/api/client.ts`
```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

// Интерцептор запросов: добавлять Authorization: Bearer {access_token}
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Интерцептор ответов: при 401 пробовать refresh
// Если refresh не удался — разлогинить и редирект на /login
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // попробовать POST /auth/refresh с refresh_token
      // если ок — повторить оригинальный запрос
      // если нет — logout()
    }
    return Promise.reject(error)
  }
)
```

### `src/store/authStore.ts` (Zustand)
```typescript
interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: UserResponse | null
  setTokens: (access: string, refresh: string) => void
  setUser: (user: UserResponse) => void
  logout: () => void
}
```
Персистировать `accessToken` + `refreshToken` в `localStorage` через `zustand/middleware persist`.

---

## Структура папок

```
frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── client.ts         ← axios instance со всеми интерцепторами
│   │   ├── auth.ts           ← login, refresh, me, changePassword, logout
│   │   ├── patients.ts       ← listPatients, getPatient, createPatient, updatePatient, deletePatient
│   │   ├── requests.ts       ← listRequests, getRequest, createRequest, updateRequest, changeStatus, assignDoctor
│   │   ├── users.ts          ← listUsers, getUser, createUser, updateUser, deleteUser
│   │   ├── audit.ts          ← listAuditLogs
│   │   └── dashboard.ts      ← getStats
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── AppLayout.tsx  ← Sidebar + Header + <Outlet />
│   │   ├── modals/
│   │   │   ├── PatientModal.tsx
│   │   │   ├── RequestModal.tsx
│   │   │   └── UserModal.tsx
│   │   └── ui/               ← shadcn/ui компоненты (копируй командой npx shadcn-ui add ...)
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── PatientsPage.tsx
│   │   ├── PatientProfilePage.tsx
│   │   ├── RequestsPage.tsx
│   │   ├── RequestDetailPage.tsx
│   │   ├── UsersPage.tsx
│   │   ├── AuditPage.tsx
│   │   └── ProfilePage.tsx
│   ├── store/
│   │   └── authStore.ts
│   ├── types/
│   │   └── api.ts            ← TypeScript-типы из swagger.yml (все схемы)
│   ├── hooks/
│   │   ├── usePatients.ts    ← React Query хуки
│   │   ├── useRequests.ts
│   │   └── ...
│   ├── utils/
│   │   ├── formatDate.ts
│   │   ├── roleLabel.ts      ← admin → 'Администратор', etc.
│   │   └── statusLabel.ts    ← new → 'Новый', in_progress → 'В работе', etc.
│   ├── router.tsx            ← React Router маршруты с PrivateRoute
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Типы из API (`src/types/api.ts`)

Перепиши все схемы из `swagger.yml` как TypeScript-интерфейсы:

```typescript
export type Role = 'admin' | 'registrar' | 'doctor'
export type RequestStatus = 'new' | 'in_progress' | 'closed'

export interface UserResponse {
  id: number
  email: string
  full_name: string
  role: Role
  is_active: boolean
  created_at: string
}

export interface PatientResponse {
  id: number
  full_name: string
  birth_date: string  // ISO date "YYYY-MM-DD"
  phone: string
  email: string | null
  address: string | null
  created_at: string
  created_by_id: number
  created_by_full_name?: string  // может отсутствовать (BACKEND_TASK #9)
}

export interface PatientRequestResponse {
  id: number
  patient_id: number
  patient_full_name?: string    // BACKEND_TASK #8 — пока может отсутствовать
  title: string
  description: string
  status: RequestStatus
  priority: number
  assigned_doctor_id: number | null
  assigned_doctor_full_name?: string | null  // BACKEND_TASK #8
  created_by_id: number
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_patients: number
  total_requests: number
  requests_new: number
  requests_in_progress: number
  requests_closed: number
  requests_closed_today?: number  // BACKEND_TASK #6
}

export interface AuditLogResponse {
  id: number
  user_id: number
  user_full_name?: string   // BACKEND_TASK #7
  action: string
  entity_type: string
  entity_id: number
  details: Record<string, unknown>
  timestamp: string
  ip_address?: string | null  // BACKEND_TASK #7
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}
```

---

## Особые требования

### Защита маршрутов
```typescript
// PrivateRoute — редирект на /login если нет токена
// AdminRoute — редирект на /dashboard если роль не admin
function PrivateRoute() {
  const { accessToken } = useAuthStore()
  return accessToken ? <Outlet /> : <Navigate to="/login" />
}
function AdminRoute() {
  const { user } = useAuthStore()
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" />
}
```

### Обработка ошибок API
- Все ошибки показывать через shadcn/ui `toast` (`sonner` или встроенный).
- 422 Validation Error → парсить `detail[].msg` и показывать под полями формы.
- Сетевые ошибки → «Нет соединения с сервером».

### Toast-уведомления
- Успех (зелёный): «Пациент добавлен», «Статус изменён», «Сохранено».
- Ошибка (красный): текст ошибки из API.

### Доступность (a11y)
- Все интерактивные элементы — фокусируемые.
- Кнопки без текста → `aria-label`.

### API-ошибки: graceful degradation
Некоторые эндпоинты из `BACKEND_TASKS.md` ещё не реализованы.
**Подписывай каждый такой вызов комментарием `// TODO: BACKEND_TASK #N — не реализовано`
и показывай заглушку вместо краша.**

---

## Команда для старта

```bash
cd frontend
npm install
npm run dev  # запустится на http://localhost:5173
```

---

## Начальные учётные данные для тестирования

```
Email:    admin@medquest.kz
Пароль:   admin123
```
(берутся из seed в `backend/app/main.py`)

---

## Порядок реализации (рекомендуемый)

1. Инициализация проекта: `npm create vite@latest frontend -- --template react-ts`
2. Установка зависимостей (tailwind, shadcn/ui, react-query, zustand, react-router, axios, zod, react-hook-form, lucide-react)
3. `src/types/api.ts` — все типы
4. `src/api/client.ts` + `src/store/authStore.ts`
5. `LoginPage` — проверить весь auth flow
6. `AppLayout` (Sidebar + Header)
7. `DashboardPage` — убедиться что layout работает
8. `PatientsPage` + `PatientModal`
9. `PatientProfilePage`
10. `RequestsPage` + `RequestModal`
11. `RequestDetailPage`
12. `UsersPage` + `UserModal` (admin only)
13. `AuditPage` (admin only)
14. `ProfilePage`
15. Финальная полировка: адаптивность (mobile sidebar как drawer), skeleton loaders,
    empty states
