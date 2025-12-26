# CI/CD Setup Guide

## 📋 Обзор

Настроен production-ready CI/CD pipeline с многоуровневой защитой и автоматизацией.

## 🔄 Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)
**Триггеры:**
- Push в `dev` или `feature/dev-*`
- Pull Request в `dev` или `main`

**Проверки:**
- ✅ Linting (ESLint)
- ✅ Type checking (TypeScript)
- ✅ Unit tests с покрытием (минимум 70%)
- ✅ Security scanning (npm audit, TruffleHog)
- ✅ Code quality (complexity, duplication)
- ✅ Docker file validation (Hadolint)
- ✅ Config file validation (JSON, YAML)

### 2. Stage Deployment (`.github/workflows/stage.yml`)
**Триггеры:**
- Push в `stage`
- Manual dispatch

**Процесс:**
1. Проверка что код прошел CI на `dev`
2. Запуск тестов и проверок
3. Деплой на staging сервер
4. Smoke tests после деплоя

**Требуемые Secrets:**
- `SSH_HOST` - адрес staging сервера
- `SSH_USER` - пользователь для SSH
- `SSH_PRIVATE_KEY` - приватный SSH ключ
- `SSH_PORT` - порт SSH (опционально, по умолчанию 22)
- `DEPLOY_PATH` - путь для деплоя (опционально)
- `GIT_TOKEN` - токен для доступа к репозиторию (опционально)
- `STAGING_URL` - URL staging сервера для smoke tests (опционально)

### 3. Production Deployment (`.github/workflows/deploy-docker.yml`)
**Триггеры:**
- Push в `main`
- Manual dispatch

**Процесс:**
1. Запуск тестов и проверок
2. Проверка что код прошел CI на `stage`
3. **Manual approval** (через GitHub Environments)
4. Деплой на production сервер
5. Smoke tests после деплоя

**Требуемые Secrets:**
- `SSH_HOST` - адрес production сервера
- `SSH_USER` - пользователь для SSH
- `SSH_PRIVATE_KEY` - приватный SSH ключ
- `SSH_PORT` - порт SSH (опционально)
- `DEPLOY_PATH` - путь для деплоя (опционально)
- `GIT_TOKEN` - токен для доступа к репозиторию (опционально)
- `PRODUCTION_URL` - URL production сервера для smoke tests (опционально)

**Важно:** Для production деплоя требуется настройка GitHub Environment с manual approval.

### 4. Security Scanning (`.github/workflows/security.yml`)
**Триггеры:**
- Push в `main`, `stage`, `dev`
- Pull Request в эти ветки
- Еженедельно (воскресенье в 00:00)
- Manual dispatch

**Проверки:**
- Dependency vulnerability scanning (npm audit)
- Secret scanning (TruffleHog, grep patterns)
- Container security scanning (Trivy)
- Code security analysis
- License compliance check

### 5. Smoke Tests (`.github/workflows/smoke-tests.yml`)
**Триггеры:**
- Manual dispatch

**Использование:**
Запускается вручную для проверки работоспособности сервиса после деплоя.

**Параметры:**
- `environment` - staging или production
- `url` - базовый URL для тестирования

## 🔐 Настройка GitHub Secrets

### Для Staging:
1. Перейдите в Settings → Secrets and variables → Actions
2. Добавьте следующие secrets:
   - `SSH_HOST`
   - `SSH_USER`
   - `SSH_PRIVATE_KEY`
   - `STAGING_URL` (опционально)

### Для Production:
1. Перейдите в Settings → Environments
2. Создайте environment `production`
3. Настройте **Required reviewers** для manual approval
4. Добавьте secrets для production environment:
   - `SSH_HOST`
   - `SSH_USER`
   - `SSH_PRIVATE_KEY`
   - `PRODUCTION_URL` (опционально)

## 🚀 Процесс деплоя

### Development → Staging
1. Создайте PR из `dev` в `stage`
2. После approval и успешных проверок - merge
3. Автоматический деплой на staging
4. Smoke tests выполняются автоматически

### Staging → Production
1. Создайте PR из `stage` в `main`
2. После approval и успешных проверок - merge
3. **Требуется manual approval** в GitHub Environments
4. После approval - автоматический деплой на production
5. Smoke tests выполняются автоматически

## 📊 Мониторинг

### Health Check Endpoint
Все smoke tests используют `/api/health` endpoint, который проверяет:
- Общий статус сервиса
- Статус Redis
- Статус ClickHouse
- Использование памяти
- Uptime

### Smoke Tests проверяют:
- ✅ Доступность health endpoint
- ✅ Валидность JSON ответа
- ✅ Статус сервиса (ok/degraded/down)
- ✅ Статус Redis
- ✅ Статус ClickHouse
- ✅ Время ответа

## 🔧 Troubleshooting

### Деплой не запускается
- Проверьте что все required checks прошли
- Проверьте что branch protection rules настроены правильно
- Проверьте что secrets настроены

### Smoke tests падают
- Проверьте что сервер доступен по указанному URL
- Проверьте что health endpoint работает
- Проверьте логи контейнеров: `docker compose logs`

### Manual approval не работает
- Убедитесь что environment `production` создан
- Проверьте что в environment настроены required reviewers
- Проверьте что у пользователей есть права на approval

## 📝 Дополнительные улучшения

См. `TODO.md` для списка дополнительных улучшений:
- Performance testing
- Advanced monitoring
- Blue-Green deployments
- Feature flags
- И другие

