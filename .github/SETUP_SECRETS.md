# Настройка GitHub Secrets через CLI

## Быстрый старт

### 1. Добавьте GitHub CLI в PATH (если еще не добавлен)

```powershell
# Запустите скрипт для добавления в PATH
.\github\add-gh-to-path.ps1
```

Или вручную добавьте в PATH текущей сессии:
```powershell
$env:Path += ";C:\Program Files\GitHub CLI"
```

### 2. Установите secrets

Запустите интерактивный скрипт:
```powershell
.\github\setup-secrets.ps1
```

Скрипт предложит:
- Выбрать уровень secrets (repository или environment)
- Установить каждый secret по очереди
- Для SSH ключа можно указать путь к файлу или вставить содержимое

## Необходимые Secrets

### Для деплоя (обязательные):
- `SSH_HOST` - IP адрес или hostname сервера
- `SSH_USER` - имя пользователя для SSH
- `SSH_PRIVATE_KEY` - приватный SSH ключ (полное содержимое)
- `SSH_PORT` - порт SSH (опционально, по умолчанию 22)
- `DEPLOY_PATH` - путь на сервере для деплоя (опционально, по умолчанию `/home/ubuntu/katz-backend`)

### Опциональные:
- `GIT_TOKEN` - GitHub token для HTTPS клонирования (если не используется SSH)
- `PRODUCTION_URL` - URL production сервера для health checks
- `STAGING_URL` - URL staging сервера для health checks

## Ручная установка через CLI

### Repository-level secrets:
```powershell
# Добавить PATH для текущей сессии
$env:Path += ";C:\Program Files\GitHub CLI"

# Установить secret
echo "your-secret-value" | gh secret set SECRET_NAME

# Установить SSH ключ из файла
Get-Content ~/.ssh/id_rsa | gh secret set SSH_PRIVATE_KEY
```

### Environment-level secrets:
```powershell
# Для production environment
echo "your-secret-value" | gh secret set SECRET_NAME --env production

# Для staging environment
echo "your-secret-value" | gh secret set SECRET_NAME --env staging
```

## Просмотр установленных secrets

```powershell
# Repository-level
gh secret list

# Environment-level
gh secret list --env production
gh secret list --env staging
```

## Удаление secrets

```powershell
# Repository-level
gh secret delete SECRET_NAME

# Environment-level
gh secret delete SECRET_NAME --env production
```

## Troubleshooting

### Проблема: "gh: command not found"

**Решение:**
1. Убедитесь, что GitHub CLI установлен: https://cli.github.com/
2. Добавьте в PATH: `$env:Path += ";C:\Program Files\GitHub CLI"`
3. Или используйте полный путь: `& "C:\Program Files\GitHub CLI\gh.exe" --version`

### Проблема: "Resource not accessible by integration"

**Решение:**
- Убедитесь, что вы авторизованы: `gh auth status`
- Проверьте права доступа к репозиторию
- Для environment secrets убедитесь, что environment создан

### Проблема: "Authentication required"

**Решение:**
```powershell
gh auth login
```

## Примечания

- Secrets шифруются GitHub и не могут быть прочитаны после установки
- Для обновления secret установите его заново с новым значением
- Environment secrets имеют приоритет над repository secrets
- SSH ключ должен быть в формате OpenSSH (начинается с `-----BEGIN OPENSSH PRIVATE KEY-----` или `-----BEGIN RSA PRIVATE KEY-----`)

