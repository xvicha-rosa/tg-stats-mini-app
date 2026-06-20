# Stats Analyzer - Telegram Mini App

Анализ статистики TikTok, Instagram, YouTube с рекомендациями по росту. Бесплатная быстрая оценка + платный полный анализ.

## 🚀 Быстрый старт

### Локальное тестирование

1. **Установка зависимостей**
```bash
npm install
```

2. **Создание .env файла**
```bash
cp .env.example .env
# Добавь свой TELEGRAM_BOT_TOKEN
```

3. **Запуск сервера**
```bash
npm run dev
```

Сервер доступен на `http://localhost:3000`

### Тестирование Mini App в Telegram

1. Создай бота через @BotFather:
   - `/newbot`
   - Задай имя и username
   - Получишь API token

2. Скопируй token в `.env`

3. Настройка Mini App в @BotFather:
   - Выбери своего бота
   - `/setmenubutton`
   - Укажи URL приложения (после деплоя)

4. Открой чат с ботом и нажми на кнопку Mini App

## 📦 Развёртывание на Railway

### Шаг 1: Подготовка репозитория

```bash
git add .
git commit -m "Initial commit"
git remote add origin <твой-github-repo>
git push -u origin main
```

### Шаг 2: Деплой на Railway

1. Перейди на [railway.app](https://railway.app)
2. Нажми "New Project"
3. Выбери "Deploy from GitHub"
4. Подключи свой репозиторий
5. Railway автоматически обнаружит Node.js проект

### Шаг 3: Переменные окружения

В Railway добавь переменные:
- `TELEGRAM_BOT_TOKEN` - твой bot token
- `NODE_ENV` - production
- `PORT` - будет автоматически (обычно 8080)

### Шаг 4: Регистрация Mini App

После деплоя в @BotFather:

1. `/setmenubutton`
2. Выбери своего бота
3. Укажи URL: `https://твой-railway-домен.railway.app`
4. Нажми Save

## 🏗️ Структура проекта

```
.
├── server/
│   ├── index.js              # Главный сервер Express
│   └── utils/
│       ├── analytics.js       # Расчёты статистики
│       └── telegram.js        # Верификация Telegram
├── public/
│   └── index.html             # Mini App UI
├── package.json
├── .env.example
└── Procfile                   # Railway конфиг
```

## 📊 API Endpoints

### Бесплатный анализ
```
POST /api/analyze
Content-Type: application/json

{
  "followers": 10000,
  "likes": 500,
  "views": 5000,
  "comments": 50,
  "reposts": 20,
  "platform": "tiktok"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "engagement_rate": 2.54,
    "like_to_view_ratio": 0.1,
    "comment_rate": 0.1,
    "quality_score": 75
  },
  "preview": {
    "engagement_rate": 2.54,
    "potential_growth": 11500,
    "recommendation": "✨ Отличный тренд!"
  }
}
```

### Премиум анализ
```
POST /api/premium-analyze
Content-Type: application/json

{
  "initData": "<telegram-init-data>",
  "followers": 10000,
  "likes": 500,
  "views": 5000,
  "comments": 50,
  "reposts": 20,
  "platform": "tiktok"
}
```

## 💰 Интеграция Telegram Stars

Оплата через Telegram Stars (встроенная система):

```javascript
// В frontend
tg.sendData(JSON.stringify({
  action: 'premium_payment',
  stars: 5
}));
```

## 📈 Формулы расчёта

### Engagement Rate
```
(likes + comments + reposts) / followers * 100
```

### Potential Growth (неделя)
```
followers * base_growth_rate * (1 + engagement_multiplier)
base_growth_rate = 15%
engagement_multiplier = likes / followers
```

### Quality Score
```
Base 50 + бонусы за метрики:
- Engagement > 5% = +20
- Like/View > 5% = +15
- Comment rate > 5% = +10
- Repost rate > 2% = +10
Max 100
```

## 🔐 Безопасность

- Telegram данные верифицируются по HMAC-SHA256
- Все вводы валидируются
- Token хранится в .env (не в коде)
- CORS настроен для Mini App

## 🐛 Дебаг

```bash
# Смотреть логи Railway
railway logs

# Локальный дебаг
NODE_DEBUG=* npm run dev
```

## 📝 TODO

- [ ] MongoDB интеграция для сохранения анализов
- [ ] История анализов для каждого юзера
- [ ] Расширенные графики и статистика
- [ ] A/B тестирование рекомендаций
- [ ] Экспорт результатов в PDF

## 📞 Поддержка

Вопросы? Проверь:
1. Правильность TELEGRAM_BOT_TOKEN
2. URL Mini App в @BotFather
3. Логи Railway
4. Сеть (CORS может блокировать)
