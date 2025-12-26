# Чек-лист настройки серверов для деплоя

## ✅ Проверка перед первым деплоем

### 1. Настройка SSH доступа

- [ ] Публичный SSH ключ добавлен на оба сервера в `~/.ssh/authorized_keys`
- [ ] Проверено SSH подключение с вашего компьютера:
  ```bash
  ssh ubuntu@51.250.122.192  # staging
  ssh ubuntu@51.250.50.213   # production
  ```
- [ ] GitHub Actions может подключиться (проверьте после первого запуска workflow)

### 2. Установка Docker и Docker Compose

**На обоих серверах (staging и production):**

- [ ] Docker установлен:
  ```bash
  docker --version
  ```
- [ ] Docker Compose установлен:
  ```bash
  docker compose version
  ```
- [ ] Пользователь добавлен в группу docker:
  ```bash
  sudo usermod -aG docker $USER
  # Перелогиньтесь после этого
  ```

**Если не установлено, установите:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER
```

### 3. Создание директории для деплоя

**На обоих серверах:**

- [ ] Директория создана:
  ```bash
  mkdir -p /home/ubuntu/katz-backend
  cd /home/ubuntu/katz-backend
  ```
- [ ] Права доступа настроены (если нужно):
  ```bash
  sudo chown -R ubuntu:ubuntu /home/ubuntu/katz-backend
  ```

### 4. Создание файла .env

**На staging сервере (51.250.122.192):**

- [ ] Файл `.env` создан в `/home/ubuntu/katz-backend/.env`
- [ ] Содержимое файла:
  ```env
  PORT=3000
  NODE_ENV=production
  EXTERNAL_REDIS_HOST=51.250.55.144
  EXTERNAL_REDIS_PORT=6379
  INTERNAL_REDIS_HOST=redis
  INTERNAL_REDIS_PORT=6379
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

**На production сервере (51.250.50.213):**

- [ ] Файл `.env` создан в `/home/ubuntu/katz-backend/.env`
- [ ] Содержимое такое же, как для staging

**Создание файла:**
```bash
cd /home/ubuntu/katz-backend
nano .env
# Вставьте содержимое выше, сохраните (Ctrl+O, Enter, Ctrl+X)
```

### 5. Проверка сетевого доступа

**На обоих серверах:**

- [ ] Доступ к Redis (51.250.55.144:6379):
  ```bash
  telnet 51.250.55.144 6379
  # или
  nc -zv 51.250.55.144 6379
  ```
- [ ] Доступ к ClickHouse (51.250.120.186:8123):
  ```bash
  curl http://51.250.120.186:8123
  ```

### 6. Настройка Firewall (если используется)

**На обоих серверах:**

- [ ] Порт 3000 открыт для входящих подключений (если нужен внешний доступ)
- [ ] Порт 22 (SSH) открыт
- [ ] Исходящие подключения к Redis и ClickHouse разрешены

**Пример для UFW:**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw enable
```

### 7. Проверка GitHub Secrets

**В GitHub репозитории:**

- [ ] Все secrets установлены для `staging` environment:
  - SSH_HOST
  - SSH_USER
  - SSH_PRIVATE_KEY
  - SSH_PORT
  - DEPLOY_PATH
- [ ] Все secrets установлены для `production` environment:
  - SSH_HOST
  - SSH_USER
  - SSH_PRIVATE_KEY
  - SSH_PORT
  - DEPLOY_PATH

## 🚀 Первый деплой

### Staging

1. Создайте ветку `stage` (если еще нет):
   ```bash
   git checkout -b stage
   git push origin stage
   ```

2. Запустите workflow вручную или сделайте push в ветку `stage`

3. Проверьте логи деплоя в GitHub Actions

4. После успешного деплоя проверьте:
   ```bash
   curl http://51.250.122.192:3000/api/health
   ```

### Production

1. После успешного деплоя на staging, создайте PR из `stage` в `main`

2. После мержа в `main`, workflow запустится автоматически

3. Проверьте логи деплоя в GitHub Actions

4. После успешного деплоя проверьте:
   ```bash
   curl http://51.250.50.213:3000/api/health
   ```

## 🔍 Проверка после деплоя

### На сервере:

- [ ] Docker контейнеры запущены:
  ```bash
  cd /home/ubuntu/katz-backend
  docker compose ps
  ```
- [ ] Логи приложения:
  ```bash
  docker compose logs katz-backend
  ```
- [ ] Health check работает:
  ```bash
  curl http://localhost:3000/api/health
  ```

### Извне:

- [ ] Health endpoint доступен:
  ```bash
  curl http://51.250.122.192:3000/api/health  # staging
  curl http://51.250.50.213:3000/api/health    # production
  ```

## 🆘 Troubleshooting

### Проблема: "Permission denied" при SSH

**Решение:**
- Проверьте, что публичный ключ добавлен в `~/.ssh/authorized_keys`
- Проверьте права на файлы:
  ```bash
  chmod 700 ~/.ssh
  chmod 600 ~/.ssh/authorized_keys
  ```

### Проблема: "Cannot connect to Docker daemon"

**Решение:**
- Добавьте пользователя в группу docker:
  ```bash
  sudo usermod -aG docker $USER
  ```
- Перелогиньтесь или выполните:
  ```bash
  newgrp docker
  ```

### Проблема: "File .env not found"

**Решение:**
- Создайте файл `.env` в `/home/ubuntu/katz-backend/.env`
- Убедитесь, что файл имеет правильные права:
  ```bash
  chmod 600 /home/ubuntu/katz-backend/.env
  ```

### Проблема: "Cannot connect to Redis/ClickHouse"

**Решение:**
- Проверьте доступность сервисов с сервера:
  ```bash
  telnet 51.250.55.144 6379  # Redis
  curl http://51.250.120.186:8123  # ClickHouse
  ```
- Проверьте firewall на серверах Redis/ClickHouse
- Убедитесь, что IP адреса серверов правильные

### Проблема: "Port already in use"

**Решение:**
- Проверьте, что порт 3000 свободен:
  ```bash
  sudo lsof -i :3000
  ```
- Остановите старые контейнеры:
  ```bash
  docker compose down
  ```

