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

### Применение промокода
```bash
POST /api/promo/apply
Content-Type: application/json

{
  "initData": "query_id=...",
  "code": "PROMO50",
  "basePrice": 100
}
```

**Ответ:**
```json
{
  "success": true,
  "originalPrice": 100,
  "discount": "50%",
  "finalPrice": 50,
  "saved": 50
}
```

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
