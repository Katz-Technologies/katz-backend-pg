# Настройка CI/CD для автоматического деплоя

Этот документ описывает настройку автоматического деплоя приложения на сервер.

## Структура веток

- `main` - главная ветка, в которую делаются PR из `dev`
- `dev` - рабочая ветка
- `feature/dev-<номер>` - ветки для разработки фич

## Workflow файлы

### 1. CI (`.github/workflows/ci.yml`)
Запускается на:
- Push в ветку `dev`
- Push в ветки `feature/dev-*`
- Pull Request в `dev` или `main`

Выполняет:
- Установку зависимостей
- Проверку кода линтером
- Запуск тестов
- Сборку приложения

### 2. Deploy (`.github/workflows/deploy.yml`)
Запускается на:
- Push в ветку `main`
- Ручной запуск через `workflow_dispatch`

Выполняет:
- Сборку приложения
- Деплой на сервер через SSH
- Перезапуск приложения

### 3. Deploy Docker (`.github/workflows/deploy-docker.yml`)
Альтернативный вариант деплоя через Docker. Используйте этот workflow, если вы используете Docker для деплоя.

## Настройка GitHub Secrets

Для работы деплоя необходимо настроить следующие секреты в GitHub:

### Для SSH деплоя (deploy.yml)

Перейдите в `Settings` → `Secrets and variables` → `Actions` → `New repository secret` и добавьте:

1. **SSH_HOST** - IP адрес или домен вашего сервера
2. **SSH_USER** - имя пользователя для SSH подключения
3. **SSH_PRIVATE_KEY** - приватный SSH ключ для подключения к серверу
4. **SSH_PORT** - порт SSH (по умолчанию 22, можно не указывать)
5. **DEPLOY_PATH** - путь на сервере для деплоя (по умолчанию `/home/ubuntu/katz-backend`)
6. **DEPLOY_URL** - URL вашего приложения (для отображения в GitHub)

### Для Docker деплоя (deploy-docker.yml)

Дополнительно к SSH секретам:

1. **DOCKER_REGISTRY** - адрес Docker registry (если используете, например `registry.example.com` или `docker.io`)
2. **DOCKER_USERNAME** - имя пользователя для Docker registry
3. **DOCKER_PASSWORD** - пароль или токен для Docker registry

Если не используете Docker registry, оставьте `DOCKER_REGISTRY` пустым.

## Настройка сервера

### Вариант 1: Прямой деплой (deploy.yml)

1. Установите Node.js 20.x на сервере
2. Создайте директорию для приложения:
   ```bash
   mkdir -p /home/ubuntu/katz-backend
   cd /home/ubuntu/katz-backend
   ```

3. Настройте процесс-менеджер (выберите один):

   **PM2:**
   ```bash
   npm install -g pm2
   ```
   Раскомментируйте в deploy.yml строки с PM2

   **systemd:**
   Создайте файл `/etc/systemd/system/katz-backend.service`:
   ```ini
   [Unit]
   Description=Katz Backend API
   After=network.target

   [Service]
   Type=simple
   User=ubuntu
   WorkingDirectory=/home/ubuntu/katz-backend/current
   ExecStart=/usr/bin/node dist/main.js
   Restart=always
   RestartSec=10
   Environment=NODE_ENV=production
   Environment=PORT=3000
   Environment=REDIS_HOST=51.250.55.144
   Environment=REDIS_PORT=6379
   Environment=CLICKHOUSE_HOST=http://51.250.120.186:8123
   Environment=CLICKHOUSE_USERNAME=katz
   Environment=CLICKHOUSE_PASSWORD=katz-password
   Environment=CLICKHOUSE_DATABASE=xrpl
   Environment=CLICKHOUSE_REQUEST_TIMEOUT=30000
   Environment=CLICKHOUSE_MAX_CONNECTIONS=10
   Environment=CLICKHOUSE_KEEP_ALIVE=true
   Environment=CLICKHOUSE_COMPRESSION=true
   Environment=THROTTLER_LIMIT=60
   Environment=THROTTLER_TTL=60000
   EnvironmentFile=/home/ubuntu/katz-backend/.env

   [Install]
   WantedBy=multi-user.target
   ```
   Раскомментируйте в deploy.yml строки с systemd
   
   **Примечание:** Redis находится на внешнем сервере (51.250.55.144), убедитесь, что сервер имеет доступ к этому адресу

4. Настройте переменные окружения в `.env` файле или через systemd/PM2

5. Настройте SSH ключ:
   ```bash
   # На вашем локальном компьютере
   ssh-keygen -t ed25519 -C "github-actions"
   # Скопируйте публичный ключ на сервер
   ssh-copy-id -i ~/.ssh/id_ed25519.pub user@your-server
   # Скопируйте приватный ключ в GitHub Secrets как SSH_PRIVATE_KEY
   cat ~/.ssh/id_ed25519
   ```

### Вариант 2: Docker деплой (deploy-docker.yml)

**Важно:** Redis находится на внешнем сервере (51.250.55.144). Убедитесь, что:
- Сервер, на котором запускается Docker контейнер, имеет доступ к Redis серверу (51.250.55.144:6379)
- Firewall настроен правильно для доступа к Redis
- Redis сервер принимает подключения с вашего сервера

1. Установите Docker и Docker Compose на сервере:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

2. Создайте директорию для приложения:
   ```bash
   mkdir -p /home/ubuntu/katz-backend
   cd /home/ubuntu/katz-backend
   ```

3. Создайте файл `.env` с переменными окружения:
   ```env
   PORT=3000
   NODE_ENV=production
   REDIS_HOST=51.250.55.144
   REDIS_PORT=6379
   CLICKHOUSE_HOST=http://51.250.120.186:8123
   CLICKHOUSE_USERNAME=katz
   CLICKHOUSE_PASSWORD=katz-password
   CLICKHOUSE_DATABASE=xrpl
   CLICKHOUSE_REQUEST_TIMEOUT=30000
   CLICKHOUSE_MAX_CONNECTIONS=10
   CLICKHOUSE_KEEP_ALIVE=true
   CLICKHOUSE_COMPRESSION=true
   THROTTLER_LIMIT=60
   THROTTLER_TTL=60000
   ```
   
   **Примечание:** Redis находится на внешнем сервере (51.250.55.144), поэтому он не включен в docker-compose.yml

4. Скопируйте `docker-compose.yml` на сервер (или создайте его там)

5. Настройте SSH ключ (как в варианте 1)

## Настройка Environment в GitHub

1. Перейдите в `Settings` → `Environments`
2. Создайте environment с именем `production`
3. Добавьте все необходимые secrets в этот environment
4. При необходимости настройте правила защиты (например, требуйте одобрения для деплоя)

## Проверка работы

1. Создайте feature ветку: `feature/dev-1`
2. Сделайте изменения и запушьте - должен запуститься CI
3. Создайте PR в `dev` - должен запуститься CI
4. После мерджа в `main` - должен запуститься деплой

## Ручной запуск деплоя

Вы можете вручную запустить деплой через GitHub Actions:
1. Перейдите в `Actions` → `Deploy to Production`
2. Нажмите `Run workflow`
3. Выберите ветку и нажмите `Run workflow`

## Troubleshooting

### Проблемы с SSH подключением
- Проверьте, что SSH ключ правильно скопирован в Secrets
- Убедитесь, что на сервере разрешены SSH подключения
- Проверьте правильность SSH_HOST и SSH_PORT

### Проблемы с правами доступа
- Убедитесь, что пользователь SSH имеет права на запись в DEPLOY_PATH
- Проверьте права на выполнение команд для перезапуска приложения

### Проблемы с переменными окружения
- Убедитесь, что все необходимые переменные окружения настроены на сервере
- Проверьте формат переменных (особенно числовые значения)

### Проблемы с Docker
- Убедитесь, что Docker и Docker Compose установлены
- Проверьте, что пользователь добавлен в группу docker
- Проверьте логи: `docker compose logs katz-backend`

