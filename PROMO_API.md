# Система промокодов

## Endpoints

### Валидация промокода
```bash
POST /api/promo/validate
Content-Type: application/json

{
  "code": "PROMO50"
}
```

**Ответ:**
```json
{
  "valid": true,
  "code": "PROMO50",
  "discount": 50,
  "discountType": "percent",
  "description": "Скидка 50% на премиум анализ"
}
```

### Активация промокода (начисляет кредиты = бесплатные анализы)
```bash
POST /api/promo/redeem
Content-Type: application/json

{
  "initData": "query_id=...",
  "code": "PROMO50"
}
```

**Ответ:**
```json
{
  "success": true,
  "code": "PROMO50",
  "credits_granted": 1,
  "total_credits": 1
}
```

### Баланс кредитов
```bash
POST /api/credits
{ "initData": "query_id=..." }
```
Ответ: `{ "success": true, "credits": 1 }`

### Премиум-анализ за 1 кредит
```bash
POST /api/premium/use-credit
{ "initData": "...", "followers": 1000, "likes": 50, "views": 800, "comments": 5, "platform": "tiktok" }
```
Списывает 1 кредит, возвращает полный премиум-анализ. Если кредитов нет → HTTP 402.

### Создать промокод (Admin)
```bash
POST /api/admin/promo/create
Content-Type: application/json

{
  "adminToken": "your_admin_token",
  "code": "SUMMER2024",
  "discount": 30,
  "discountType": "percent",
  "maxUses": 100,
  "expiresAt": "2026-08-31T23:59:59Z",
  "description": "Летняя скидка"
}
```

### Получить статистику промокода (Admin)
```bash
GET /api/admin/promo/stats/SUMMER2024?adminToken=your_admin_token
```

**Ответ:**
```json
{
  "code": "SUMMER2024",
  "discount": 30,
  "discountType": "percent",
  "uses": 42,
  "maxUses": 100,
  "isActive": true,
  "expiresAt": "2026-08-31T23:59:59Z",
  "description": "Летняя скидка",
  "createdAt": "2026-06-20T10:00:00Z"
}
```

## Особенности

- **Скидки**: процент (0-100%) или фиксированная сумма в рублях
- **Ограничения**: максимальное количество использований, дата истечения
- **Пользователь**: может использовать промокод только один раз
- **Логирование**: все применённые промокоды записываются в БД

## Переменные окружения

```
MONGODB_URI=mongodb://localhost:27017/statsflow
ADMIN_TOKEN=your_secret_admin_token
```

## Примеры промокодов

```bash
# 50% скидка, без ограничений
curl -X POST http://localhost:3000/api/admin/promo/create \
  -H "Content-Type: application/json" \
  -d '{
    "adminToken": "admin123",
    "code": "HALF50",
    "discount": 50,
    "discountType": "percent",
    "description": "50% скидка"
  }'

# 100₽ скидка, максимум 50 использований
curl -X POST http://localhost:3000/api/admin/promo/create \
  -H "Content-Type: application/json" \
  -d '{
    "adminToken": "admin123",
    "code": "FIXED100",
    "discount": 100,
    "discountType": "fixed",
    "maxUses": 50,
    "description": "Фиксированная скидка 100₽"
  }'
```
