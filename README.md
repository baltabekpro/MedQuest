# MedQuest

CRM-система для регистрации и обработки запросов пациентов.

## Цель проекта

Разработать веб-приложение для медицинского центра, где сотрудники могут:
- регистрировать пациентов;
- создавать и обрабатывать запросы пациентов;
- назначать врача на запрос;
- отслеживать статусы заявок и базовую статистику;
- вести аудит изменений.

## Технологический стек

- Frontend: React + TypeScript
- Backend: FastAPI (Python)
- База данных: SQLite (этап MVP)
- Аутентификация: JWT (access + refresh)
- Роли: `admin`, `registrar`, `doctor`

## План реализации

### 1) Архитектура
- Монорепозиторий с каталогами `frontend/` и `backend/`.
- REST API на FastAPI.
- SQLAlchemy ORM + Pydantic схемы.

### 2) Backend (текущий этап)
- Инициализация FastAPI-приложения.
- Подключение SQLite.
- Модели: User, Patient, PatientRequest, AuditLog.
- JWT-аутентификация и проверка ролей.
- Эндпоинты:
	- `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`
	- CRUD для пользователей (admin)
	- CRUD для пациентов
	- CRUD для запросов пациентов
	- `GET /dashboard/stats`
	- `GET /audit/logs` (admin)

### 3) Frontend (следующий этап)
- Страницы: Login, Dashboard, Patients, Requests, Users, Audit.
- Интеграция с API через Axios.
- Маршрутизация и защита маршрутов по ролям.

## Бизнес-сущности

- Пользователь: email, ФИО, роль, пароль.
- Пациент: ФИО, дата рождения, телефон, email, адрес.
- Запрос пациента: пациент, заголовок, описание, статус, приоритет, назначенный врач.
- Аудит: кто, что, когда изменил.

## Статусы запроса

- `new`
- `in_progress`
- `closed`

## Ближайшие шаги

1. Реализовать backend MVP.
2. Проверить работу API через Swagger (`/docs`).
3. Подключить frontend на React.

## Миграции БД (Alembic)

Из каталога `backend/`:

- применить все миграции:
	- `alembic upgrade head`
- откатить последнюю миграцию:
	- `alembic downgrade -1`
- создать новую миграцию:
	- `alembic revision -m "your_message"`

## Запуск backend

Из каталога `backend/`:

1. Установить зависимости:
	- `pip install -r requirements.txt`
2. Применить миграции:
	- `alembic upgrade head`
3. Запустить API:
	- `python run.py`

Примечание: метрика `requests_closed_today` в Dashboard считается по границам текущих суток в UTC.