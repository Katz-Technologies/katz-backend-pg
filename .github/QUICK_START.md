# 🚀 Быстрый старт: Настройка CI/CD на GitHub

Это краткая инструкция для быстрой настройки Branch Protection Rules и GitHub Environments.

---

## 📋 Что нужно сделать

### 1. Настройка Branch Protection Rules (15-20 минут)

**Вариант A: Через веб-интерфейс (Рекомендуется для первого раза)**

1. Откройте: `https://github.com/YOUR_USERNAME/katz-backend/settings/branches`
2. Следуйте инструкции: [`.github/BRANCH_PROTECTION_SETUP.md`](./BRANCH_PROTECTION_SETUP.md)

**Вариант B: Через GitHub CLI (Быстрее, если CLI установлен)**

```bash
# Убедитесь, что вы авторизованы
gh auth login

# Запустите скрипт автоматической настройки
bash .github/setup-branch-protection.sh
```

### 2. Настройка GitHub Environments (10-15 минут)

1. Откройте: `https://github.com/YOUR_USERNAME/katz-backend/settings/environments`
2. Следуйте инструкции: [`.github/GITHUB_ENVIRONMENTS_SETUP.md`](./GITHUB_ENVIRONMENTS_SETUP.md)

### 3. Проверка веток (5 минут)

Убедитесь, что все ветки существуют:

```bash
# Проверить существующие ветки
git branch -a

# Если ветки stage или dev не существуют, создайте их:
git checkout main
git checkout -b stage
git push origin stage

git checkout main
git checkout -b dev
git push origin dev
```

### 4. Настройка секретов (10-15 минут)

Добавьте секреты в GitHub Environments:

**Для production environment:**
- `SSH_HOST` - хост production сервера
- `SSH_USER` - пользователь SSH
- `SSH_PRIVATE_KEY` - приватный SSH ключ
- `SSH_PORT` - порт SSH (обычно 22)
- `DEPLOY_PATH` - путь для деплоя
- `GIT_TOKEN` - токен GitHub (если используется)

**Для staging environment:**
- Те же секреты, но для DEV/staging сервера

---

## ✅ Чеклист

Используйте подробный чеклист: [`.github/SETUP_CHECKLIST.md`](./SETUP_CHECKLIST.md)

---

## 🎯 Минимальная настройка (быстрый вариант)

Если нужно быстро настроить только самое необходимое:

### Branch Protection для `main`:
- ✅ Require PR before merging
- ✅ Require 2 approvals
- ✅ Require status checks: `dev - lint and test`
- ✅ Do not allow bypassing

### GitHub Environment `production`:
- ✅ Required reviewers: 1
- ✅ Deployment branches: только `main`
- ✅ Добавить секреты для деплоя

---

## 📚 Подробные инструкции

- **Branch Protection Rules**: [BRANCH_PROTECTION_SETUP.md](./BRANCH_PROTECTION_SETUP.md)
- **GitHub Environments**: [GITHUB_ENVIRONMENTS_SETUP.md](./GITHUB_ENVIRONMENTS_SETUP.md)
- **Полный чеклист**: [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)
- **CODEOWNERS пример**: [CODEOWNERS.example](./CODEOWNERS.example)

---

## 🆘 Нужна помощь?

1. Проверьте раздел Troubleshooting в подробных инструкциях
2. Убедитесь, что у вас есть права администратора репозитория
3. Проверьте, что все ветки существуют

---

## 🎉 После настройки

После завершения настройки на GitHub:

1. ✅ Переходите к настройке workflows (см. TODO.md, Этап 2)
2. ✅ Обновите существующие workflows для использования environments
3. ✅ Добавьте дополнительные проверки в CI/CD

---

**Время на настройку**: ~40-60 минут
