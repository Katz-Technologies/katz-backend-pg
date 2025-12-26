# CI Workflow Documentation

## Обзор

CI workflow выполняет комплексную проверку кода перед merge в `dev` или `main`. Все проверки выполняются **параллельно** для максимальной скорости.

## Структура CI

### 1. **lint-and-test** (Основные проверки)
**Время выполнения**: ~5-10 минут

- ✅ Lint проверка (ESLint)
- ✅ TypeScript type checking
- ✅ Unit тесты с coverage (минимум 70%)
- ✅ Build проверка
- ✅ Проверка размера бандла

**Артефакты**: Coverage report сохраняется на 7 дней

### 2. **security** (Проверка безопасности)
**Время выполнения**: ~3-5 минут

- ✅ npm audit (проверка уязвимостей зависимостей)
- ✅ TruffleHog (сканирование секретов в коде)
- ✅ Проверка на hardcoded secrets (grep patterns)

**Примечание**: npm audit может иметь `continue-on-error: true` для предупреждений

### 3. **code-quality** (Качество кода)
**Время выполнения**: ~3-5 минут

- ✅ Проверка сложности кода (ESLint complexity)
- ✅ Проверка дублирования кода (jscpd)
- ✅ Валидация package.json
- ✅ Валидация tsconfig.json

### 4. **docker-checks** (Docker файлы)
**Время выполнения**: ~2-3 минуты

- ✅ Hadolint (проверка Dockerfile на best practices)
- ✅ Валидация docker-compose.yml

### 5. **config-validation** (Конфигурация)
**Время выполнения**: ~1-2 минуты

- ✅ Валидация всех JSON файлов
- ✅ Валидация всех YAML файлов

### 6. **ci-success** (Финальная проверка)
**Время выполнения**: ~10 секунд

- ✅ Проверяет, что все предыдущие jobs прошли успешно

## Параллельное выполнение

Все jobs (кроме `ci-success`) выполняются **параллельно**, что значительно ускоряет CI:

```
┌─────────────────┐
│  lint-and-test  │
└─────────────────┘
┌─────────────────┐
│    security     │
└─────────────────┘
┌─────────────────┐
│  code-quality   │
└─────────────────┘
┌─────────────────┐
│  docker-checks  │
└─────────────────┘
┌─────────────────┐
│ config-validation│
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   ci-success    │
└─────────────────┘
```

**Общее время**: ~5-10 минут (вместо 20+ минут при последовательном выполнении)

## Требования к коду

### Coverage
- Минимум **70%** для branches, functions, lines, statements
- Проверяется автоматически в тестах

### Code Duplication
- Максимум **5%** дублирования кода
- Минимум 5 строк и 50 токенов для обнаружения

### Security
- Все зависимости должны пройти `npm audit --audit-level=moderate`
- Не должно быть hardcoded secrets в коде
- TruffleHog проверяет историю коммитов на утечки секретов

### Docker
- Dockerfile должен соответствовать best practices (hadolint)
- docker-compose.yml должен быть валидным

## Как исправить ошибки

### Coverage слишком низкий
```bash
# Добавьте больше тестов
npm test -- --coverage
# Проверьте coverage отчет
```

### Code duplication обнаружено
```bash
# Запустите jscpd локально
npx jscpd src/ --min-lines 5 --min-tokens 50 --threshold 5
# Рефакторите дублирующийся код
```

### Security issues
```bash
# Проверьте уязвимости
npm audit
# Обновите зависимости
npm audit fix
```

### Docker issues
```bash
# Проверьте Dockerfile
docker run --rm -i hadolint/hadolint < Dockerfile
# Проверьте docker-compose
docker compose config
```

## Локальный запуск проверок

Перед созданием PR рекомендуется запустить проверки локально:

```bash
# Все основные проверки
npm run lint
npx tsc --noEmit
npm test -- --coverage

# Security
npm audit --audit-level=moderate

# Code quality
npx jscpd src/ --min-lines 5 --min-tokens 50 --threshold 5

# Docker
docker run --rm -i hadolint/hadolint < Dockerfile
docker compose config
```

## Troubleshooting

### CI падает на проверке секретов
- Убедитесь, что нет hardcoded secrets в коде
- Используйте environment variables или secrets management

### Coverage не проходит
- Добавьте тесты для непокрытых участков кода
- Проверьте coverage отчет: `coverage/lcov-report/index.html`

### Docker checks падают
- Проверьте Dockerfile на best practices
- Убедитесь, что docker-compose.yml синтаксически корректен

## Дополнительные улучшения (TODO)

- [ ] Добавить проверку API контрактов (OpenAPI/Swagger)
- [ ] Добавить проверку производительности
- [ ] Добавить проверку доступности (a11y)
- [ ] Интеграция с SonarQube для детального анализа
- [ ] Добавить проверку миграций БД (если есть)

---

**Последнее обновление**: 2024

