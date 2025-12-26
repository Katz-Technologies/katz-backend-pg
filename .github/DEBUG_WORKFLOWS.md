# Отладка: Workflows не запускаются для PR

## Проблема
Проверки "dev - lint and test" и "stage - test and deploy" показывают "Expected — Waiting for status to be reported", что означает, что workflows не запустились или не отправили статус.

## Шаг 1: Проверить, запустились ли workflows

1. Откройте Actions: https://github.com/Froloveee3/katz-backend-pg/actions
2. Проверьте, есть ли запуски для:
   - **CI** workflow (должен запуститься на PR)
   - **Deploy to Staging** workflow (должен запуститься на PR)

### Если workflows НЕ запустились:

**Вариант A: Добавить коммит в PR (рекомендуется)**

```bash
# Убедитесь, что вы на ветке dev
git checkout dev
git pull origin dev

# Добавьте пустой коммит
git commit --allow-empty -m "chore: trigger workflows"

# Запушьте
git push origin dev
```

**Вариант B: Запустить workflows вручную**

1. Перейдите в Actions: https://github.com/Froloveee3/katz-backend-pg/actions
2. Найдите workflow "CI"
3. Нажмите "Run workflow"
4. Выберите ветку `dev`
5. Запустите

Повторите для "Deploy to Staging"

### Если workflows запустились, но статус не появился:

1. Проверьте логи workflows - возможно, они падают с ошибкой
2. Убедитесь, что job имеет правильное имя:
   - Для CI: `dev - lint and test`
   - Для Stage: `stage - test and deploy`

## Шаг 2: Проверить конфигурацию Branch Protection

1. Settings → Branches → stage → Edit rule
2. Проверьте, что в "Require status checks" указаны правильные имена:
   - `dev - lint and test`
   - `stage - test and deploy`
3. Убедитесь, что имена точно совпадают (с учетом регистра и пробелов)

## Шаг 3: Проверить триггеры workflows

Убедитесь, что workflows настроены на запуск для PR:

**CI workflow** должен иметь:
```yaml
pull_request:
  branches:
    - dev
    - main
    - stage
```

**Stage workflow** должен иметь:
```yaml
pull_request:
  branches:
    - stage
```

## Быстрое решение

Самый быстрый способ - добавить пустой коммит:

```bash
git commit --allow-empty -m "chore: trigger workflows for PR"
git push origin dev
```

После push workflows должны запуститься автоматически в течение 1-2 минут.

