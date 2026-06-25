# Life Manager — Персональная система управления жизнью

## Быстрый старт

### Через Docker (рекомендуется)
```bash
# Запустить всё одной командой
docker-compose up --build

# Или двойной клик на start.bat (Windows)
```

### Локальный запуск без Docker

**Backend:**
```bash
cd backend
pip install -r requirements.txt
# Создай .env файл (скопируй из .env и измени DATABASE_URL на локальный PostgreSQL)
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Доступ

| Сервис | URL |
|--------|-----|
| Приложение | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

**Логин:** admin  
**Пароль:** admin123

## Модули

1. **Dashboard** — Сводная панель с ключевыми метриками дня
2. **Цели** — Постановка и отслеживание целей по категориям
3. **Привычки** — Трекер привычек с сериями и статистикой
4. **Задачи** — Менеджер задач по статусам и приоритетам
5. **Финансы** — Доходы, расходы, бюджеты, цели накоплений
6. **Здоровье** — Вес, сон, вода, активность
7. **Дневник** — Ежедневные записи с оценками дня
8. **Отчёты** — Еженедельный и ежемесячный отчёт
9. **Аналитика** — Глубокий анализ по всем модулям
10. **Настройки** — Профиль, тема, безопасность

## Стек

- **Backend:** Python, FastAPI, PostgreSQL, SQLAlchemy, JWT
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Recharts
- **Инфраструктура:** Docker, Docker Compose
- **PWA:** Установка как приложение на iPhone/Android
