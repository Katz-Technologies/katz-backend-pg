# Чеклист настройки CI/CD

## ✅ Шаг 1: Настройка GitHub Secrets

Перейдите в ваш репозиторий на GitHub:
1. Откройте `Settings` → `Secrets and variables` → `Actions`
2. Нажмите `New repository secret` и добавьте следующие секреты:

### Обязательные секреты для SSH деплоя:

| Имя секрета | Значение | Описание |
|------------|----------|----------|
| `SSH_HOST` | IP адрес или домен вашего сервера | Например: `123.45.67.89` |
| `SSH_USER` | Имя пользователя для SSH | Например: `ubuntu` или `root` |
| `SSH_PRIVATE_KEY` | Приватный SSH ключ | См. инструкцию ниже по генерации |
| `SSH_PORT` | Порт SSH (опционально) | По умолчанию `22`, можно не указывать |
| `DEPLOY_PATH` | Путь на сервере (опционально) | По умолчанию `/home/ubuntu/katz-backend` |
| `GIT_REPO` | Имя репозитория (опционально) | По умолчанию используется текущий репозиторий |
| `GIT_TOKEN` | GitHub Personal Access Token (опционально) | Только для приватных репозиториев |

### Генерация SSH ключа:

```bash
# На вашем локальном компьютере
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_deploy

# Скопируйте публичный ключ на сервер
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub user@your-server

# Скопируйте приватный ключ в GitHub Secrets
cat ~/.ssh/github_actions_deploy
# Скопируйте весь вывод (включая -----BEGIN и -----END) в секрет SSH_PRIVATE_KEY
```

## ✅ Шаг 2: Создание Environment в GitHub

1. Перейдите в `Settings` → `Environments`
2. Нажмите `New environment`
3. Введите имя: `production`
4. (Опционально) Настройте правила защиты:
   - `Required reviewers` - если нужна ручная проверка перед деплоем
   - `Wait timer` - задержка перед деплоем
5. Нажмите `Configure environment`
6. В разделе `Environment secrets` добавьте те же секреты, что и в репозитории (SSH_HOST, SSH_USER, SSH_PRIVATE_KEY и т.д.)

**Примечание:** Если вы добавили секреты в Environment, они будут использоваться вместо репозиторных секретов.

## ✅ Шаг 3: Настройка сервера

### Для прямого деплоя (deploy.yml):

1. **Установите Node.js 20.x:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Создайте директорию:**
   ```bash
   mkdir -p /home/ubuntu/katz-backend
   cd /home/ubuntu/katz-backend
   ```

3. **Установите PM2 (рекомендуется):**
   ```bash
   npm install -g pm2
   ```

4. **Создайте файл `.env` в `/home/ubuntu/katz-backend/`:**
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

5. **Создайте PM2 ecosystem файл** `/home/ubuntu/katz-backend/ecosystem.config.js`:
   ```javascript
   module.exports = {
     apps: [{
       name: 'katz-backend',
       script: './current/dist/main.js',
       cwd: '/home/ubuntu/katz-backend/current',
       instances: 1,
       exec_mode: 'fork',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       },
       env_file: '/home/ubuntu/katz-backend/.env',
       error_file: '/home/ubuntu/katz-backend/logs/err.log',
       out_file: '/home/ubuntu/katz-backend/logs/out.log',
       log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
       merge_logs: true,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G'
     }]
   };
   ```

6. **Создайте директорию для логов:**
   ```bash
   mkdir -p /home/ubuntu/katz-backend/logs
   ```

7. **Обновите deploy.yml** - раскомментируйте строки с PM2:
   ```yaml
   # В шаге "Extract and restart application" замените комментарии на:
   pm2 restart katz-backend || pm2 start ecosystem.config.js
   ```

### Для Docker деплоя (deploy-docker.yml):

1. **Установите Docker и Docker Compose:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo usermod -aG docker $USER
   # Выйдите и войдите снова, чтобы применить изменения
   ```

2. **Установите Git (если не установлен):**
   ```bash
   sudo apt-get update
   sudo apt-get install -y git
   ```

3. **Создайте директорию:**
   ```bash
   mkdir -p /home/ubuntu/katz-backend
   cd /home/ubuntu/katz-backend
   ```

4. **Создайте файл `.env` в директории `/home/ubuntu/katz-backend/`:**
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

5. **Настройте Git на сервере:**

   **Вариант A: Использование SSH (рекомендуется для приватных репозиториев):**
   ```bash
   # На сервере под пользователем ubuntu
   ssh-keygen -t ed25519 -C "server-git" -f ~/.ssh/id_ed25519_github
   
   # Покажите публичный ключ
   cat ~/.ssh/id_ed25519_github.pub
   
   # Добавьте публичный ключ в GitHub:
   # Settings → SSH and GPG keys → New SSH key
   
   # Настройте SSH config для GitHub
   cat >> ~/.ssh/config << EOF
   Host github.com
     HostName github.com
     User git
     IdentityFile ~/.ssh/id_ed25519_github
     IdentitiesOnly yes
   EOF
   
   chmod 600 ~/.ssh/config
   ```
   
   **Вариант B: Использование Personal Access Token (для HTTPS):**
   ```bash
   # Создайте Personal Access Token в GitHub:
   # Settings → Developer settings → Personal access tokens → Tokens (classic)
   # Права: repo (для приватных репозиториев)
   
   # Добавьте GIT_TOKEN в GitHub Secrets
   ```

**Важно:** При первом деплое репозиторий будет автоматически клонирован. Убедитесь, что:
- Пользователь SSH имеет права на запись в `/home/ubuntu/katz-backend`
- Git установлен на сервере
- Для приватных репозиториев: либо настроен SSH ключ, либо добавлен `GIT_TOKEN` в GitHub Secrets

## ✅ Шаг 4: Выбор workflow для деплоя

У вас есть два варианта:

### Вариант A: Прямой деплой (deploy.yml)
- Используется, если приложение запускается напрямую через Node.js или PM2
- Не требует Docker на сервере
- Проще в настройке

### Вариант B: Docker деплой (deploy-docker.yml)
- Используется, если приложение запускается в Docker контейнере
- Требует Docker и Docker Compose на сервере
- Более изолированное окружение

**Рекомендация:** Если вы уже используете Docker локально, используйте `deploy-docker.yml`.

**Важно:** Если вы используете Docker деплой, удалите или переименуйте `deploy.yml`, чтобы избежать конфликтов.

## ✅ Шаг 5: Тестирование

1. **Создайте тестовую ветку:**
   ```bash
   git checkout -b feature/dev-test
   git push origin feature/dev-test
   ```
   Должен запуститься CI workflow.

2. **Создайте PR в `dev`:**
   - CI должен пройти успешно
   - После мерджа в `dev` - CI снова запустится

3. **Создайте PR из `dev` в `main`:**
   - После мерджа в `main` должен запуститься деплой

4. **Или запустите деплой вручную:**
   - Перейдите в `Actions` → `Deploy to Production`
   - Нажмите `Run workflow`
   - Выберите ветку `main` и нажмите `Run workflow`

## ✅ Шаг 6: Проверка деплоя

После успешного деплоя проверьте:

1. **Логи приложения:**
   ```bash
   # Для PM2:
   pm2 logs katz-backend
   
   # Для Docker:
   docker compose logs -f katz-backend
   ```

2. **Проверка health endpoint:**
   ```bash
   curl http://your-server:3000/api/health
   ```

3. **Проверка основного API:**
   ```bash
   curl http://your-server:3000/api/v1/smart-money/tokens
   ```

## 🔧 Troubleshooting

### Проблемы с SSH подключением:
- Проверьте, что SSH ключ правильно скопирован (включая BEGIN и END строки)
- Убедитесь, что публичный ключ добавлен на сервер: `cat ~/.ssh/authorized_keys`
- Проверьте права на файл: `chmod 600 ~/.ssh/authorized_keys`

### Проблемы с правами доступа:
- Убедитесь, что пользователь SSH имеет права на запись в DEPLOY_PATH
- Для PM2: `chown -R $USER:$USER /home/ubuntu/katz-backend`

### Проблемы с переменными окружения:
- Проверьте, что `.env` файл создан и содержит все необходимые переменные
- Для PM2: убедитесь, что `env_file` указан правильно в ecosystem.config.js

### Проблемы с деплоем:
- Проверьте логи GitHub Actions в разделе `Actions`
- Проверьте логи на сервере: `pm2 logs` или `docker compose logs`

