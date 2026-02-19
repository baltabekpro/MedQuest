Ты опытный Python-разработчик. Тебе нужно доработать FastAPI backend для проекта **MedQuest CRM** — медицинской системы управления пациентами и их запросами.

## Контекст проекта

- **Backend:** FastAPI + SQLAlchemy (SQLite в MVP) + Pydantic v2 + JWT-аутентификация
- **Роли:** `admin`, `registrar`, `doctor`
- **Сущности:** User, Patient, PatientRequest, AuditLog
- **Текущий Swagger:** swagger.yml в корне репозитория

Все изменения нужно вносить строго в соответствии с существующей архитектурой проекта.
Изучи структуру папок backend/ прежде чем писать код.

---

## Задачи для выполнения (по приоритету)

### 🔴 КРИТИЧНО

**Задача 1. Пагинация для всех списков**

Создай generic-схему `PaginatedResponse[T]` (Pydantic Generic model):
```python
class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    limit: int
```

Добавь query-параметры `page: int = Query(1, ge=1)` и `limit: int = Query(20, ge=1, le=100)` 
к следующим эндпоинтам и измени их response_model:
- `GET /patients` → `PaginatedResponse[PatientResponse]`
- `GET /requests` → `PaginatedResponse[PatientRequestResponse]`
- `GET /users` → `PaginatedResponse[UserResponse]`
- `GET /audit/logs` → `PaginatedResponse[AuditLogResponse]`

Используй SQLAlchemy `.offset((page-1)*limit).limit(limit)` и отдельный `count()` для `total`.

---

**Задача 2. Вложенные имена в PatientRequestResponse**

Проблема: frontend показывает имя пациента и имя врача прямо в строке таблицы запросов,
но сейчас возвращаются только `patient_id: int` и `assigned_doctor_id: int | None`.

Добавь к схеме `PatientRequestResponse`:
```python
patient_full_name: str
assigned_doctor_full_name: str | None
```

В эндпоинтах `GET /requests` и `GET /requests/{id}` подгружай эти данные через JOIN или 
отдельные запросы (eager loading через `selectinload` / `joinedload` в SQLAlchemy).

---

**Задача 3. Новый эндпоинт `GET /users/{user_id}`**

```python
@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, ...):
    ...
    # 404 если не найден
```

Требования к правам: только `admin` может просматривать произвольного пользователя.

---

**Задача 4. Фильтр `patient_id` в `GET /requests`**

Добавь query-параметр `patient_id: int | None = None` к `GET /requests`.
Используется на странице карточки пациента для получения его истории запросов.

---

### 🟡 ВАЖНО

**Задача 5. Расширенный поиск и фильтры**

`GET /patients` — добавь:
- `search: str | None` — поиск по `full_name ILIKE`, `phone ILIKE`, `email ILIKE`

`GET /requests` — добавь:
- `priority: int | None` (1–5)
- `date_from: date | None` — фильтр по `created_at >= date_from`
- `date_to: date | None` — фильтр по `created_at <= date_to`
- `search: str | None` — ILIKE по `title` и `description`

`GET /users` — добавь:
- `search: str | None` — ILIKE по `full_name`, `email`
- `role: str | None` — точное совпадение роли

`GET /audit/logs` — добавь:
- `action: str | None` — фильтр по типу действия (CREATE/UPDATE/DELETE/LOGIN)
- `date_from: datetime | None`
- `date_to: datetime | None`
- `search: str | None` — поиск в `details` (JSON поле, cast to string)

---

**Задача 6. Dashboard — закрыто сегодня**

В `DashboardStats` добавь поле:
```python
requests_closed_today: int
```
В эндпоинте `GET /dashboard/stats` считай запросы где `status = 'closed'` И 
`updated_at >= сегодня 00:00:00` (локальное время или UTC — определись и задокументируй).

---

**Задача 7. Обновление профиля `PATCH /auth/me`**

```python
class UpdateProfileRequest(BaseModel):
    full_name: str

@router.patch("/auth/me", response_model=UserResponse)
async def update_me(body: UpdateProfileRequest, current_user: User = Depends(get_current_user)):
    # обновить full_name текущего пользователя
    # записать в AuditLog
    ...
```

---

**Задача 8. Смена пароля `POST /auth/change-password`**

```python
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)

@router.post("/auth/change-password")
async def change_password(body: ChangePasswordRequest, current_user = Depends(get_current_user)):
    # 1. Проверить current_password через bcrypt verify
    # 2. Если неверный → 400 "Неверный текущий пароль"
    # 3. Захешировать new_password и сохранить
    # 4. Записать в AuditLog (action=UPDATE, entity_type=User)
    return {"message": "Пароль успешно изменён"}
```

---

**Задача 9. IP-адрес и full_name в AuditLog**

Модель `AuditLog` и схема `AuditLogResponse`:
- Добавить поле `ip_address: str | None`
- Добавить поле `user_full_name: str` (денормализованное, берётся из User при записи)

При записи в AuditLog передавать `ip_address` из HTTP-запроса:
```python
ip = request.client.host  # FastAPI Request object
```

---

### 🟢 ЖЕЛАТЕЛЬНО

**Задача 10. Выход из системы `POST /auth/logout`**

Реализуй blocklist refresh-токенов (достаточно хранить в памяти в виде `set` для MVP или
в отдельной таблице `RevokedToken` в БД):

```python
@router.post("/auth/logout")
async def logout(body: RefreshRequest):
    # добавить refresh_token в blocklist
    # при /auth/refresh проверять, не отозван ли токен
    return {"message": "Выход выполнен"}
```

---

**Задача 11. История входов `GET /auth/sessions`**

1. Создай модель `LoginEvent(id, user_id, timestamp, ip_address, user_agent, success)`.
2. В `POST /auth/login` сохраняй `LoginEvent` для каждой попытки (успешной и нет).
3. Добавь эндпоинт:
   ```python
   GET /auth/sessions
   → list[LoginEventResponse]  # последние 20, desc по timestamp
   # доступно только текущему пользователю (Depends(get_current_user))
   ```

---

## Требования к качеству кода

1. **Права доступа:** проверяй роль через `Depends`. Только `admin` может: удалять пользователей, смотреть чужие профили. `registrar` и выше — CRUD пациентов/запросов.
2. **AuditLog:** каждое создание/обновление/удаление записей должно создавать запись в AuditLog.
3. **Валидация:** используй Pydantic validators, возвращай 422 с понятным `detail`.
4. **Типизация:** все функции должны иметь аннотации типов.
5. **Тесты:** для каждого нового эндпоинта напиши минимум один тест через `httpx.AsyncClient`.
6. **Обратная совместимость:** не ломай существующие эндпоинты — старые response_model оберни в `PaginatedResponse` аккуратно, убедись что поля остаются прежними внутри `items`.

## После выполнения

Обнови `swagger.yml` через FastAPI auto-generated OpenAPI (`GET /openapi.json`):
```bash
python -c "import json; from app.main import app; print(json.dumps(app.openapi(), indent=2, ensure_ascii=False))" > openapi.json
```
И замени содержимое `swagger.yml` обновлённой спецификацией.
