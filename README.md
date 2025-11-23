# SmartTutor

Система управления репетиторством с Node.js backend и React frontend.

## Структура проекта

```
SmartTutor/
├── backend/          # Node.js + Express API
└── frontend/         # React приложение
```

## Установка и запуск

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend будет доступен на http://localhost:3000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend будет доступен на http://localhost:5173

## База данных

Проект использует PostgreSQL. SQL миграции находятся в `backend/migrations/`.

Для запуска базы данных используйте docker-compose:

```bash
docker-compose up -d
```

### Создание тестовых пользователей

После запуска миграций создайте тестовых пользователей:

```bash
cd backend
npm run seed
```

Это создаст 3 пользователя:
- **student@test.com** (роль: STUDENT)
- **tutor@test.com** (роль: TUTOR)  
- **admin@test.com** (роль: ADMIN)

Пароль для всех: `password123`

## API Endpoints

- `GET /api/users` - Получить всех пользователей
- `GET /api/users/:id` - Получить пользователя по ID
- `POST /api/users` - Создать пользователя
- `PUT /api/users/:id` - Обновить пользователя
- `DELETE /api/users/:id` - Удалить пользователя

## Технологии

### Backend
- Node.js
- Express
- PostgreSQL
- bcryptjs (для хеширования паролей)
- express-validator (для валидации)

### Frontend
- React
- React Router
- Axios
- Vite

