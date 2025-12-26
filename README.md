# Katz Wallet Backend API

Backend API для Katz Wallet - системы анализа и мониторинга токенов и транзакций в экосистеме XRPL (XRP Ledger).

## Описание проекта

Katz Wallet Backend предоставляет RESTful API для:
- Получения информации о трендовых токенах XRPL
- Анализа транзакций и "Smart Money"
- Получения данных о ценах, объемах и торговле
- Управления иконками токенов и аккаунтов
- Интеграции с различными сервисами XRPL (Bithomp, XRPL Meta, Sologenic, XRP Scan, CoinGecko, Gecko Terminal)

## Технологический стек

- **Framework**: NestJS (Node.js)
- **База данных**: ClickHouse (для аналитики)
- **Кэш**: Redis (для кэширования данных и иконок)
- **Обработка изображений**: Sharp (оптимизация иконок)
- **Планировщик задач**: @nestjs/schedule (cron jobs)
- **Валидация**: class-validator, class-transformer
- **Документация**: Swagger (доступна по адресу `/api/doc`)

## Установка и запуск

### Требования

- Node.js >= 18
- Redis
- ClickHouse (опционально, для некоторых функций)

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

```bash
npm run start:dev
```

### Сборка для production

```bash
npm run build
npm run start:prod
```

### Линтинг

```bash
npm run lint
```

## API Endpoints

Все API эндпоинты имеют префикс `/api`.

### Health Check

#### GET `/api/health`

Проверка работоспособности сервера.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-09T13:30:46.000Z"
}
```

---

### Trending Tokens

#### GET `/api/v1/trending-tokens`

Получение списка трендовых токенов с их иконками.

**Response:**
```json
{
  "tokens": [
    {
      "currency": "USD",
      "issuer": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      "icon": "data:image/webp;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "meta": {
        "token": {
          "name": "USD Token",
          "description": "Stablecoin pegged to US Dollar",
          "icon": "https://s1.xrplmeta.org/icon/USD.rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
          "trust_level": 5,
          "asset_class": "fiat",
          "weblinks": ["https://example.com"]
        },
        "issuer": {
          "name": "Issuer Name",
          "description": "Issuer description",
          "icon": "https://s1.xrplmeta.org/icon/issuer.png",
          "kyc": true,
          "trust_level": 5,
          "weblinks": ["https://issuer.com"]
        }
      },
      "metrics": {
        "trustlines": 1000,
        "holders": 500,
        "supply": "1000000000",
        "marketcap": "1000000000",
        "price": "1.0",
        "volume_24h": "1000000",
        "volume_7d": "7000000",
        "exchanges_24h": 100,
        "exchanges_7d": 700,
        "takers_24h": 50,
        "takers_7d": 350
      },
      "changes": {
        "24h": {
          "trustlines": {
            "delta": 10,
            "percent": 1.0
          },
          "holders": {
            "delta": 5,
            "percent": 1.0
          },
          "supply": {
            "delta": "100000",
            "percent": 0.01
          },
          "marketcap": {
            "delta": "100000",
            "percent": 0.01
          },
          "price": {
            "delta": "0.01",
            "percent": 1.0
          }
        },
        "7d": {
          "trustlines": {
            "delta": 70,
            "percent": 7.0
          },
          "holders": {
            "delta": 35,
            "percent": 7.0
          },
          "supply": {
            "delta": "700000",
            "percent": 0.07
          },
          "marketcap": {
            "delta": "700000",
            "percent": 0.07
          },
          "price": {
            "delta": "0.07",
            "percent": 7.0
          }
        }
      }
    }
  ],
  "defaultIcon": "data:image/webp;base64,..."
}
```

**Детальное описание полей:**

**Корневой объект:**
- `tokens` (array, required) - массив трендовых токенов (до 1000 токенов)
- `defaultIcon` (string | null) - base64-encoded дефолтная иконка для токенов без иконки в формате `data:image/webp;base64,...`

**Объект токена (`tokens[]`):**
- `currency` (string, required) - валюта токена (например, "USD", "EUR", "BTC")
- `issuer` (string, required) - адрес эмитента токена в формате XRPL (начинается с "r")
- `icon` (string | null) - base64-encoded иконка токена в формате WebP (оптимизированная до 64x64px, качество 80%) или `null` если иконка недоступна. Формат: `data:image/webp;base64,...`

**Метаданные (`meta`, optional):**
- `meta.token` (object, optional) - метаданные токена:
  - `name` (string, optional) - название токена
  - `description` (string, optional) - описание токена
  - `icon` (string, optional) - URL иконки токена из XRPL Meta
  - `trust_level` (number, optional) - уровень доверия (0-5, где 5 - максимальный)
  - `asset_class` (string, optional) - класс актива: `"fiat"`, `"commodity"`, `"equity"`, `"cryptocurrency"`
  - `weblinks` (string[], optional) - массив ссылок на веб-ресурсы
- `meta.issuer` (object, optional) - метаданные эмитента:
  - `name` (string, optional) - название эмитента
  - `description` (string, optional) - описание эмитента
  - `icon` (string, optional) - URL иконки эмитента
  - `kyc` (boolean, optional) - наличие KYC проверки
  - `trust_level` (number, optional) - уровень доверия к эмитенту (0-5)
  - `weblinks` (string[], optional) - массив ссылок на веб-ресурсы эмитента

**Метрики (`metrics`, required):**
- `trustlines` (number) - количество trustlines (доверительных линий)
- `holders` (number) - количество держателей токена
- `supply` (string) - общее предложение токена (в формате строки для больших чисел)
- `marketcap` (string) - рыночная капитализация (supply * price)
- `price` (string) - текущая цена токена
- `volume_24h` (string) - объем торгов за 24 часа
- `volume_7d` (string) - объем торгов за 7 дней
- `exchanges_24h` (number) - количество обменов за 24 часа
- `exchanges_7d` (number) - количество обменов за 7 дней
- `takers_24h` (number) - количество активных трейдеров за 24 часа
- `takers_7d` (number) - количество активных трейдеров за 7 дней

**Изменения (`changes`, optional):**
- `changes.24h` (object, optional) - изменения за 24 часа:
  - `trustlines`, `holders`, `supply`, `marketcap`, `price` (object, optional) - каждый содержит:
    - `delta` (number | string) - абсолютное изменение
    - `percent` (number) - процентное изменение
- `changes.7d` (object, optional) - изменения за 7 дней (структура аналогична `24h`)

#### POST `/api/v1/trending-tokens/icons/accounts`

Получение иконок для списка аккаунтов.

**Request Body:**
```json
{
  "addresses": [
    "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
    "rBithomp3UNknnjo8HKNbSdNjQ3f5q6Mb6N"
  ]
}
```

**Response:**
```json
{
  "icons": [
    {
      "address": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      "icon": "data:image/webp;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    },
    {
      "address": "rBithomp3UNknnjo8HKNbSdNjQ3f5q6Mb6N",
      "icon": null
    }
  ],
  "defaultIcon": "data:image/webp;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Детальное описание полей:**

**Корневой объект:**
- `icons` (array, required) - массив иконок аккаунтов:
  - `address` (string, required) - адрес аккаунта в формате XRPL (начинается с "r")
  - `icon` (string | null) - base64-encoded иконка аккаунта в формате WebP (оптимизированная до 64x64px, качество 80%) или `null` если иконка недоступна. Формат: `data:image/webp;base64,...`
- `defaultIcon` (string | null) - base64-encoded дефолтная иконка для аккаунтов без иконки в формате `data:image/webp;base64,...`

#### POST `/api/v1/trending-tokens/icons/tokens`

Получение иконок для списка токенов.

**Request Body:**
```json
{
  "tokens": [
    {
      "currency": "USD",
      "issuer": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
    },
    {
      "currency": "EUR",
      "issuer": "rBithomp3UNknnjo8HKNbSdNjQ3f5q6Mb6N"
    }
  ]
}
```

**Response:**
```json
{
  "icons": [
    {
      "currency": "USD",
      "issuer": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      "icon": "data:image/webp;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    },
    {
      "currency": "EUR",
      "issuer": "rBithomp3UNknnjo8HKNbSdNjQ3f5q6Mb6N",
      "icon": null
    }
  ],
  "defaultIcon": "data:image/webp;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Детальное описание полей:**

**Корневой объект:**
- `icons` (array, required) - массив иконок токенов:
  - `currency` (string, required) - валюта токена (например, "USD", "EUR", "BTC")
  - `issuer` (string, required) - адрес эмитента токена в формате XRPL (начинается с "r")
  - `icon` (string | null) - base64-encoded иконка токена в формате WebP (оптимизированная до 64x64px, качество 80%) или `null` если иконка недоступна. Формат: `data:image/webp;base64,...`
- `defaultIcon` (string | null) - base64-encoded дефолтная иконка для токенов без иконки в формате `data:image/webp;base64,...`

---

### Smart Money

#### GET `/api/v1/smart-money/sales`

Получение данных о продажах для аккаунта.

**Query Parameters:**
- `address` (string, required) - адрес аккаунта
- `limit` (number, optional) - количество записей
- `offset` (number, optional) - смещение

**Response:**
```json
[
  {
    "qty": 1000,
    "fromAmount": 1000,
    "toAmount": 1.0,
    "fromAmountUsd": 1000,
    "toAmountUsd": 1.0,
    "pnl": -999,
    "pnlUsd": -999,
    "roi": -99.9,
    "chain": [
      {
        "hash": "ABC123...",
        "txCloseTime": "2025-12-09T13:30:46.000Z",
        "fromAsset": "USD.rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
        "toAsset": "XRP",
        "fromAmount": 1000,
        "toAmount": 1.0,
        "proportionalFromAmount": 1000,
        "proportionalToAmount": 1.0
      }
    ]
  }
]
```

**Детальное описание полей:**

**Массив продаж (`SaleData[]`):**
- `qty` (number) - количество проданного токена
- `fromAmount` (number) - количество токена, которое было продано (в единицах токена)
- `toAmount` (number) - количество полученного актива (обычно XRP)
- `fromAmountUsd` (number) - стоимость проданного токена в USD на момент продажи
- `toAmountUsd` (number) - стоимость полученного актива в USD на момент продажи
- `pnl` (number) - прибыль/убыток в XRP (toAmount - fromAmount в XRP эквиваленте)
- `pnlUsd` (number) - прибыль/убыток в USD
- `roi` (number) - доходность в процентах (может быть отрицательной)
- `chain` (array) - цепочка транзакций, приведших к продаже:
  - `hash` (string) - хеш транзакции
  - `txCloseTime` (string) - время закрытия транзакции (ISO 8601)
  - `fromAsset` (string) - идентификатор актива источника (формат: "CURRENCY.ISSUER" или "XRP")
  - `toAsset` (string) - идентификатор актива назначения
  - `fromAmount` (number) - количество актива источника
  - `toAmount` (number) - количество актива назначения
  - `proportionalFromAmount` (number, optional) - пропорциональное количество актива источника
  - `proportionalToAmount` (number, optional) - пропорциональное количество актива назначения

#### GET `/api/v1/smart-money/token-history`

Получение истории транзакций токена.

**Query Parameters:**
- `asset` (string, required) - идентификатор токена
- `limit` (number, optional) - количество записей
- `offset` (number, optional) - смещение

**Response:**
```json
[
  {
    "from_address": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
    "to_address": "rBithomp3UNknnjo8HKNbSdNjQ3f5q6Mb6N",
    "from_asset": "XRP",
    "to_asset": "USD.rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
    "from_amount": "1.0",
    "to_amount": "1000",
    "init_from_amount": "1.0",
    "init_to_amount": "1000",
    "price_usd": "1.0",
    "kind": "swap",
    "close_time": "2025-12-09T13:30:46.000Z",
    "ledger_index": 12345678,
    "in_ledger_index": 12345678,
    "tx_hash": "ABC123DEF456..."
  }
]
```

**Детальное описание полей:**

**Массив транзакций (`MoneyFlowRow[]`):**
- `from_address` (string) - адрес отправителя (формат XRPL: начинается с "r")
- `to_address` (string) - адрес получателя
- `from_asset` (string) - идентификатор актива источника (формат: "CURRENCY.ISSUER" или "XRP")
- `to_asset` (string) - идентификатор актива назначения
- `from_amount` (string) - количество актива источника (в формате строки для точности)
- `to_amount` (string) - количество актива назначения (в формате строки)
- `init_from_amount` (string) - начальное количество актива источника (до конвертаций)
- `init_to_amount` (string) - начальное количество актива назначения
- `price_usd` (string) - цена в USD на момент транзакции
- `kind` (string) - тип операции: `"swap"` (обмен), `"dexOffer"` (DEX оффер), `"transfer"` (перевод)
- `close_time` (string) - время закрытия транзакции (ISO 8601)
- `ledger_index` (number) - индекс ledger'а, в котором была транзакция
- `in_ledger_index` (number) - индекс в ledger'е
- `tx_hash` (string) - хеш транзакции

#### GET `/api/v1/smart-money/token-summary/:asset`

Получение сводной информации о токене.

**Path Parameters:**
- `asset` (string, required) - идентификатор токена

**Response:**
```json
{
  "holders": [
    {
      "address": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      "balance": 1000000,
      "volume": 5000000,
      "tags": ["whale", "smart_money"]
    }
  ],
  "traders": 500,
  "sellers": 250,
  "buyers": 300,
  "exchanges": 10000,
  "avgBalance": 2000,
  "volume": {
    "buyVolume": 5000000,
    "saleVolume": 4500000,
    "totalVolume": 9500000
  },
  "avgVolume": 19000,
  "richList": [
    {
      "address": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      "balance": 1000000
    }
  ],
  "volumeRichList": [
    {
      "address": "rBithomp3UNknnjo8HKNbSdNjQ3f5q6Mb6N",
      "volume": 5000000
    }
  ]
}
```

**Детальное описание полей:**

**Корневой объект (`TokenSummary`):**
- `holders` (array) - массив держателей токена:
  - `address` (string) - адрес аккаунта
  - `balance` (number) - баланс токена
  - `volume` (number) - объем торгов аккаунта
  - `tags` (string[]) - теги аккаунта (например, "whale", "smart_money", "bot")
- `traders` (number) - общее количество трейдеров (уникальных аккаунтов, которые торговали)
- `sellers` (number) - количество продавцов (уникальных аккаунтов, которые продавали)
- `buyers` (number) - количество покупателей (уникальных аккаунтов, которые покупали)
- `exchanges` (number) - общее количество обменов/транзакций
- `avgBalance` (number) - средний баланс среди держателей
- `volume` (object) - статистика объемов:
  - `buyVolume` (number) - общий объем покупок
  - `saleVolume` (number) - общий объем продаж
  - `totalVolume` (number) - общий объем торгов
- `avgVolume` (number) - средний объем торгов на аккаунт
- `richList` (array) - список самых богатых держателей (по балансу):
  - `address` (string) - адрес аккаунта
  - `balance` (number) - баланс токена
- `volumeRichList` (array) - список аккаунтов с наибольшим объемом торгов:
  - `address` (string) - адрес аккаунта
  - `volume` (number) - объем торгов

#### GET `/api/v1/smart-money/tokens`

Получение списка всех токенов.

**Response:**
```json
{
  "tokens": {
    "USD.rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH": {
      "currency": "USD",
      "issuer": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      "volume24h": "1000000",
      "price": "1.0",
      "holders": 500
    }
  }
}
```

**Детальное описание полей:**

**Корневой объект:**
- `tokens` (object) - объект с токенами, где ключ - идентификатор токена в формате "CURRENCY.ISSUER":
  - `currency` (string) - валюта токена
  - `issuer` (string) - адрес эмитента
  - `volume24h` (string, optional) - объем торгов за 24 часа
  - `price` (string, optional) - текущая цена
  - `holders` (number, optional) - количество держателей

#### GET `/api/v1/smart-money/top-holders-tokens`

Получение токенов с наибольшим объемом.

**Response:**
```json
{
  "tokens": [
    {
      "currency": "USD",
      "issuer": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      "volume24h": "1000000",
      "holders": 500,
      "price": "1.0",
      "marketcap": "1000000000"
    }
  ]
}
```

**Детальное описание полей:**

**Корневой объект:**
- `tokens` (array) - массив токенов, отсортированных по объему:
  - `currency` (string) - валюта токена
  - `issuer` (string) - адрес эмитента
  - `volume24h` (string) - объем торгов за 24 часа
  - `holders` (number) - количество держателей
  - `price` (string, optional) - текущая цена
  - `marketcap` (string, optional) - рыночная капитализация

#### GET `/api/v1/smart-money/money-flows`

Получение потоков денег для аккаунта.

**Query Parameters:**
- `address` (string, required) - адрес аккаунта
- `limit` (number, optional) - количество записей
- `offset` (number, optional) - смещение

**Response:**
```json
[
  {
    "from_address": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
    "to_address": "rBithomp3UNknnjo8HKNbSdNjQ3f5q6Mb6N",
    "from_asset": "XRP",
    "to_asset": "USD.rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
    "from_amount": "1.0",
    "to_amount": "1000",
    "init_from_amount": "1.0",
    "init_to_amount": "1000",
    "price_usd": "1.0",
    "kind": "swap",
    "close_time": "2025-12-09T13:30:46.000Z",
    "ledger_index": 12345678,
    "in_ledger_index": 12345678,
    "tx_hash": "ABC123DEF456..."
  }
]
```

**Детальное описание полей:** (см. описание выше для `GET /api/v1/smart-money/token-history`)

#### GET `/api/v1/smart-money/chart/:token`

Получение данных для графика токена.

**Path Parameters:**
- `token` (string, required) - идентификатор токена

**Response:**
```json
{
  "hour": [
    {
      "timestamp": 1702126800,
      "value": 100000
    }
  ],
  "day": [
    {
      "timestamp": 1702040400,
      "value": 2400000
    }
  ],
  "week": [
    {
      "timestamp": 1701522000,
      "value": 16800000
    }
  ],
  "month": [
    {
      "timestamp": 1698843600,
      "value": 72000000
    }
  ]
}
```

**Детальное описание полей:**

**Корневой объект (`TokenVolumeCharts`):**
- `hour` (array) - данные по часам:
  - `timestamp` (number) - Unix timestamp в секундах
  - `value` (number) - объем торгов за период
- `day` (array) - данные по дням (структура аналогична `hour`)
- `week` (array) - данные по неделям (структура аналогична `hour`)
- `month` (array) - данные по месяцам (структура аналогична `hour`)

#### GET `/api/v1/smart-money/top-pnl-accounts`

Получение аккаунтов с наибольшей прибылью/убытком.

**Response:**
```json
[
  {
    "address": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
    "totalPnl": 10000,
    "totalPnlUsd": 10000,
    "avgPnl": 1000,
    "avgPnlUsd": 1000,
    "avgBuy": 0.5,
    "avgBuyUsd": 0.5,
    "avgSale": 0.6,
    "avgSaleUsd": 0.6,
    "avgRoi": 20.0,
    "positiveCount": 8,
    "negativeCount": 2,
    "totalCount": 10,
    "winrate": 80.0,
    "buyVolume": 5000,
    "buyVolumeUsd": 5000,
    "saleVolume": 6000,
    "saleVolumeUsd": 6000,
    "totalVolume": 11000,
    "totalVolumeUsd": 11000
  }
]
```

**Детальное описание полей:**

**Массив аккаунтов (`SmartMoneySummary[]`):**
- `address` (string) - адрес аккаунта
- `totalPnl` (number) - общая прибыль/убыток в XRP
- `totalPnlUsd` (number) - общая прибыль/убыток в USD
- `avgPnl` (number) - средняя прибыль/убыток на сделку в XRP
- `avgPnlUsd` (number) - средняя прибыль/убыток на сделку в USD
- `avgBuy` (number) - средняя цена покупки в XRP
- `avgBuyUsd` (number) - средняя цена покупки в USD
- `avgSale` (number) - средняя цена продажи в XRP
- `avgSaleUsd` (number) - средняя цена продажи в USD
- `avgRoi` (number) - средняя доходность в процентах
- `positiveCount` (number) - количество прибыльных сделок
- `negativeCount` (number) - количество убыточных сделок
- `totalCount` (number) - общее количество сделок
- `winrate` (number) - процент выигрышных сделок (0-100)
- `buyVolume` (number) - общий объем покупок в XRP
- `buyVolumeUsd` (number) - общий объем покупок в USD
- `saleVolume` (number) - общий объем продаж в XRP
- `saleVolumeUsd` (number) - общий объем продаж в USD
- `totalVolume` (number) - общий объем торгов в XRP
- `totalVolumeUsd` (number) - общий объем торгов в USD

---

### Bithomp

#### GET `/api/v1/bithomp/avatar/:address`

Получение аватара аккаунта.

**Path Parameters:**
- `address` (string, required) - адрес аккаунта

**Response:** PNG изображение (binary)

**Headers:**
- `Content-Type: image/png`

#### GET `/api/v1/bithomp/issued-token/:issuer/:currencyHex`

Получение иконки токена.

**Path Parameters:**
- `issuer` (string, required) - адрес эмитента
- `currencyHex` (string, required) - валюта в hex формате

**Response:** PNG изображение (binary)

**Headers:**
- `Content-Type: image/png`

---

### Sologenic

#### GET `/api/v1/sologenic/ohlc`

Получение OHLC (Open, High, Low, Close) данных.

**Query Parameters:**
- `assetCurrency` (string, required) - валюта первого актива (или "XRP")
- `assetIssuer` (string, optional) - эмитент первого актива (если не XRP)
- `asset2Currency` (string, required) - валюта второго актива (или "XRP")
- `asset2Issuer` (string, optional) - эмитент второго актива (если не XRP)
- `period` (string, required) - период (например, "1h", "4h", "1d")
- `from` (string, optional) - начальная дата (ISO 8601)
- `to` (string, optional) - конечная дата (ISO 8601)

**Response:**
```json
{
  "data": [
    {
      "time": 1702126800,
      "open": "1.0",
      "high": "1.1",
      "low": "0.9",
      "close": "1.05",
      "volume": "1000000"
    }
  ]
}
```

**Детальное описание полей:**

**Корневой объект:**
- `data` (array) - массив OHLC данных:
  - `time` (number) - Unix timestamp в секундах
  - `open` (string) - цена открытия периода
  - `high` (string) - максимальная цена за период
  - `low` (string) - минимальная цена за период
  - `close` (string) - цена закрытия периода
  - `volume` (string) - объем торгов за период

#### POST `/api/v1/sologenic/tickers/24h`

Получение тикеров за 24 часа для списка пар.

**Request Body:**
```json
{
  "symbols": [
    {
      "assetCurrency": "USD",
      "assetIssuer": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      "asset2Currency": "XRP"
    }
  ]
}
```

**Response:**
```json
{
  "tickers": [
    {
      "symbol": "USD.rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH/XRP",
      "lastPrice": "1.0",
      "volume24h": "1000000",
      "change24h": "0.05",
      "high24h": "1.1",
      "low24h": "0.9",
      "bid": "0.99",
      "ask": "1.01"
    }
  ]
}
```

**Детальное описание полей:**

**Корневой объект:**
- `tickers` (array) - массив тикеров:
  - `symbol` (string) - символ пары (формат: "CURRENCY.ISSUER/CURRENCY2" или "CURRENCY.ISSUER/XRP")
  - `lastPrice` (string) - последняя цена сделки
  - `volume24h` (string) - объем торгов за 24 часа
  - `change24h` (string) - изменение цены за 24 часа (в процентах или абсолютных единицах)
  - `high24h` (string, optional) - максимальная цена за 24 часа
  - `low24h` (string, optional) - минимальная цена за 24 часа
  - `bid` (string, optional) - цена покупки (bid)
  - `ask` (string, optional) - цена продажи (ask)

#### GET `/api/v1/sologenic/trades`

Получение истории сделок.

**Query Parameters:**
- `assetCurrency` (string, optional) - валюта первого актива
- `assetIssuer` (string, optional) - эмитент первого актива
- `asset2Currency` (string, optional) - валюта второго актива
- `asset2Issuer` (string, optional) - эмитент второго актива
- `account` (string, optional) - адрес аккаунта
- `limit` (number, optional) - количество записей
- `beforeId` (string, optional) - ID для пагинации (до)
- `afterId` (string, optional) - ID для пагинации (после)

**Response:**
```json
{
  "trades": [
    {
      "id": 12345,
      "price": "1.0",
      "amount": "1000",
      "timestamp": 1702126246,
      "buyer": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      "seller": "rBithomp3UNknnjo8HKNbSdNjQ3f5q6Mb6N",
      "asset": "USD.rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      "asset2": "XRP",
      "txHash": "ABC123DEF456..."
    }
  ]
}
```

**Детальное описание полей:**

**Корневой объект:**
- `trades` (array) - массив сделок:
  - `id` (number) - уникальный идентификатор сделки
  - `price` (string) - цена сделки
  - `amount` (string) - количество актива
  - `timestamp` (number) - Unix timestamp в секундах
  - `buyer` (string) - адрес покупателя
  - `seller` (string) - адрес продавца
  - `asset` (string, optional) - идентификатор первого актива
  - `asset2` (string, optional) - идентификатор второго актива
  - `txHash` (string, optional) - хеш транзакции

---

### XRP Scan

#### GET `/api/v1/xrp-scan/amm/pools`

Получение списка AMM пулов.

**Query Parameters:**
- `limit` (number, optional) - количество записей
- `offset` (number, optional) - смещение

**Response:**
```json
{
  "pools": [
    {
      "account": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      "asset1": "XRP",
      "asset2": "USD.rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      "liquidity": "1000000",
      "volume24h": "500000",
      "fee": "0.003"
    }
  ],
  "total": 50
}
```

**Детальное описание полей:**

**Корневой объект:**
- `pools` (array) - массив AMM пулов:
  - `account` (string) - адрес аккаунта пула
  - `asset1` (string) - первый актив (может быть "XRP" или "CURRENCY.ISSUER")
  - `asset2` (string) - второй актив
  - `liquidity` (string) - общая ликвидность пула
  - `volume24h` (string, optional) - объем торгов за 24 часа
  - `fee` (string, optional) - комиссия пула (обычно в формате "0.003" для 0.3%)
- `total` (number) - общее количество пулов

#### GET `/api/v1/xrp-scan/amm/:account`

Получение AMM пула по адресу аккаунта.

**Path Parameters:**
- `account` (string, required) - адрес аккаунта пула

**Response:**
```json
{
  "account": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
  "asset1": "XRP",
  "asset2": "USD.rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
  "liquidity": "1000000",
  "volume24h": "500000",
  "fee": "0.003",
  "lpTokens": "1000000",
  "asset1Balance": "500000",
  "asset2Balance": "500000"
}
```

**Детальное описание полей:**

**Корневой объект:**
- `account` (string) - адрес аккаунта пула
- `asset1` (string) - первый актив
- `asset2` (string) - второй актив
- `liquidity` (string) - общая ликвидность пула
- `volume24h` (string) - объем торгов за 24 часа
- `fee` (string, optional) - комиссия пула
- `lpTokens` (string, optional) - количество LP токенов
- `asset1Balance` (string, optional) - баланс первого актива в пуле
- `asset2Balance` (string, optional) - баланс второго актива в пуле

#### GET `/api/v1/xrp-scan/token`

Получение информации о токене.

**Query Parameters:**
- `asset` (string, required) - валюта токена
- `issuer` (string, required) - адрес эмитента

**Response:**
```json
{
  "currency": "USD",
  "issuer": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
  "name": "USD Token",
  "totalSupply": "1000000000",
  "holders": 500,
  "trustlines": 1000,
  "volume24h": "1000000",
  "price": "1.0"
}
```

**Детальное описание полей:**

**Корневой объект:**
- `currency` (string) - валюта токена
- `issuer` (string) - адрес эмитента
- `name` (string, optional) - название токена
- `totalSupply` (string) - общее предложение токена
- `holders` (number) - количество держателей
- `trustlines` (number, optional) - количество trustlines
- `volume24h` (string, optional) - объем торгов за 24 часа
- `price` (string, optional) - текущая цена

---

### XRPL Meta

#### GET `/api/v1/xrpl-meta/tokens`

Получение списка токенов из XRPL Meta.

**Query Parameters:**
- `limit` (number, optional) - количество записей
- `offset` (number, optional) - смещение

**Response:**
```json
{
  "tokens": [
    {
      "currency": "USD",
      "issuer": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      "meta": {
        "token": {
          "name": "USD Token",
          "description": "Stablecoin pegged to US Dollar",
          "icon": "https://s1.xrplmeta.org/icon/USD.rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
          "trust_level": 5,
          "asset_class": "fiat",
          "weblinks": ["https://example.com"]
        },
        "issuer": {
          "name": "Issuer Name",
          "description": "Issuer description",
          "icon": "https://s1.xrplmeta.org/icon/issuer.png",
          "kyc": true,
          "trust_level": 5,
          "weblinks": ["https://issuer.com"]
        }
      },
      "metrics": {
        "trustlines": 1000,
        "holders": 500,
        "supply": "1000000000",
        "marketcap": "1000000000",
        "price": "1.0",
        "volume_24h": "1000000",
        "volume_7d": "7000000",
        "exchanges_24h": 100,
        "exchanges_7d": 700,
        "takers_24h": 50,
        "takers_7d": 350
      },
      "changes": {
        "24h": {
          "trustlines": {
            "delta": 10,
            "percent": 1.0
          },
          "holders": {
            "delta": 5,
            "percent": 1.0
          },
          "supply": {
            "delta": "100000",
            "percent": 0.01
          },
          "marketcap": {
            "delta": "100000",
            "percent": 0.01
          },
          "price": {
            "delta": "0.01",
            "percent": 1.0
          }
        },
        "7d": {
          "trustlines": {
            "delta": 70,
            "percent": 7.0
          },
          "holders": {
            "delta": 35,
            "percent": 7.0
          },
          "supply": {
            "delta": "700000",
            "percent": 0.07
          },
          "marketcap": {
            "delta": "700000",
            "percent": 0.07
          },
          "price": {
            "delta": "0.07",
            "percent": 7.0
          }
        }
      }
    }
  ],
  "count": 1000
}
```

**Детальное описание полей:** (см. описание выше для `GET /api/v1/trending-tokens`)

#### GET `/api/v1/xrpl-meta/token`

Получение информации о конкретном токене.

**Query Parameters:**
- `currency` (string, required) - валюта токена
- `issuer` (string, required) - адрес эмитента

**Response:**
```json
{
  "currency": "USD",
  "issuer": "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
  "meta": {
    "token": {
      "name": "USD Token",
      "description": "Stablecoin pegged to US Dollar",
      "icon": "https://s1.xrplmeta.org/icon/USD.rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH",
      "trust_level": 5,
      "asset_class": "fiat",
      "weblinks": ["https://example.com"]
    },
    "issuer": {
      "name": "Issuer Name",
      "description": "Issuer description",
      "icon": "https://s1.xrplmeta.org/icon/issuer.png",
      "kyc": true,
      "trust_level": 5,
      "weblinks": ["https://issuer.com"]
    }
  },
  "metrics": {
    "trustlines": 1000,
    "holders": 500,
    "supply": "1000000000",
    "marketcap": "1000000000",
    "price": "1.0",
    "volume_24h": "1000000",
    "volume_7d": "7000000",
    "exchanges_24h": 100,
    "exchanges_7d": 700,
    "takers_24h": 50,
    "takers_7d": 350
  },
  "changes": {
    "24h": {
      "trustlines": {
        "delta": 10,
        "percent": 1.0
      },
      "holders": {
        "delta": 5,
        "percent": 1.0
      },
      "supply": {
        "delta": "100000",
        "percent": 0.01
      },
      "marketcap": {
        "delta": "100000",
        "percent": 0.01
      },
      "price": {
        "delta": "0.01",
        "percent": 1.0
      }
    },
    "7d": {
      "trustlines": {
        "delta": 70,
        "percent": 7.0
      },
      "holders": {
        "delta": 35,
        "percent": 7.0
      },
      "supply": {
        "delta": "700000",
        "percent": 0.07
      },
      "marketcap": {
        "delta": "700000",
        "percent": 0.07
      },
      "price": {
        "delta": "0.07",
        "percent": 7.0
      }
    }
  }
}
```

**Детальное описание полей:** (см. описание выше для `GET /api/v1/trending-tokens`)

---

### CoinGecko

#### GET `/api/v1/coingecko/price`

Получение цены токена из CoinGecko.

**Query Parameters:**
- `ids` (string, required) - идентификатор токена в CoinGecko
- `vs_currencies` (string, optional) - валюта для конвертации (по умолчанию "usd")

**Response:**
```json
{
  "price": {
    "usd": 1.0,
    "eur": 0.92
  },
  "last_updated": "2025-12-09T13:30:46.000Z"
}
```

---

### Gecko Terminal

#### GET `/api/v1/gecko-terminal/last-24h-volume`

Получение объема торгов за последние 24 часа.

**Query Parameters:**
- `asset` (string, required) - идентификатор актива

**Response:**
```json
{
  "volume24h": "1000000",
  "volumeChange24h": "0.05",
  "timestamp": "2025-12-09T13:30:46.000Z"
}
```

---

## Обработка ошибок

Все ошибки возвращаются в следующем формате:

```json
{
  "timestamp": "2025-12-09T13:30:46.000Z",
  "url": "/api/v1/trending-tokens",
  "method": "GET",
  "code": "VALIDATE_ERROR",
  "messageUI": "Invalid input provided",
  "messageDebug": "Detailed error message for debugging",
  "data": {}
}
```

**HTTP Status Codes:**
- `200` - Успешный запрос
- `400` - Ошибка валидации
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера

---

## Cron Jobs

Сервис автоматически выполняет следующие задачи:

1. **Обновление трендовых токенов** - каждый час
2. **Загрузка иконок токенов** - каждый час
3. **Загрузка иконок аккаунтов** - каждый час
4. **Обновление fallback иконки** - каждый час

Иконки оптимизируются (WebP, 64x64px, качество 80%) и кэшируются в Redis на 24 часа.

---

## Кэширование

- **Trending Tokens**: TTL 6 часов
- **Token Icons**: TTL 24 часа
- **Account Icons**: TTL 24 часа
- **Fallback Icon**: TTL 24 часа

Иконки оптимизируются перед сохранением в кэш:
- Размер: максимум 64x64px
- Формат: WebP
- Качество: 80%
- Размер файла: обычно 1-3 KB

---

## CI/CD

Проект настроен с автоматическим CI/CD через GitHub Actions:

- **CI** - автоматическая проверка кода (lint, test, build) на ветках `dev` и `feature/dev-*`
- **Deploy** - автоматический деплой на production при мердже в ветку `main`

### Структура веток

- `main` - главная ветка (production)
- `dev` - рабочая ветка
- `feature/dev-<номер>` - ветки для разработки фич

---

## Документация

Swagger документация доступна по адресу: `/api/doc`

---
