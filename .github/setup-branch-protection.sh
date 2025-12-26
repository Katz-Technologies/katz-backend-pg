#!/bin/bash

# Скрипт для автоматической настройки Branch Protection Rules через GitHub CLI
# Требует установленного GitHub CLI (gh) и прав администратора репозитория

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка наличия GitHub CLI
if ! command -v gh &> /dev/null; then
    error "GitHub CLI (gh) не установлен. Установите его с https://cli.github.com/"
    exit 1
fi

# Проверка авторизации
if ! gh auth status &> /dev/null; then
    error "Вы не авторизованы в GitHub CLI. Выполните: gh auth login"
    exit 1
fi

# Получение информации о репозитории
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")

if [ -z "$REPO" ]; then
    error "Не удалось определить репозиторий. Убедитесь, что вы находитесь в директории репозитория."
    exit 1
fi

info "Настройка Branch Protection Rules для репозитория: $REPO"
echo ""

# Функция для настройки защиты ветки main
setup_main_protection() {
    info "Настройка защиты ветки 'main' (PRODUCTION)..."
    
    gh api repos/$REPO/branches/main/protection \
        --method PUT \
        --field required_status_checks='{"strict":true,"contexts":["dev - lint and test","stage - test and deploy","production - test and deploy"]}' \
        --field enforce_admins=true \
        --field required_pull_request_reviews='{"required_approving_review_count":2,"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
        --field restrictions=null \
        --field required_linear_history=true \
        --field allow_force_pushes=false \
        --field allow_deletions=false \
        --field block_creations=false \
        --field required_conversation_resolution=true \
        --field lock_branch=false \
        --field allow_fork_syncing=false || {
        warn "Не удалось настроить защиту для 'main'. Возможно, правила уже существуют или у вас нет прав."
        warn "Попробуйте настроить вручную через веб-интерфейс GitHub."
    }
    
    info "✅ Защита ветки 'main' настроена"
}

# Функция для настройки защиты ветки stage
setup_stage_protection() {
    info "Настройка защиты ветки 'stage' (STAGING)..."
    
    gh api repos/$REPO/branches/stage/protection \
        --method PUT \
        --field required_status_checks='{"strict":true,"contexts":["dev - lint and test","stage - test and deploy"]}' \
        --field enforce_admins=false \
        --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
        --field restrictions=null \
        --field required_linear_history=false \
        --field allow_force_pushes=false \
        --field allow_deletions=false \
        --field block_creations=false \
        --field required_conversation_resolution=true \
        --field lock_branch=false \
        --field allow_fork_syncing=false || {
        warn "Не удалось настроить защиту для 'stage'. Возможно, ветка не существует или у вас нет прав."
        warn "Создайте ветку 'stage' сначала или настройте вручную через веб-интерфейс GitHub."
    }
    
    info "✅ Защита ветки 'stage' настроена"
}

# Функция для настройки защиты ветки dev
setup_dev_protection() {
    info "Настройка защиты ветки 'dev' (DEVELOPMENT)..."
    
    gh api repos/$REPO/branches/dev/protection \
        --method PUT \
        --field required_status_checks='{"strict":true,"contexts":["dev - lint and test"]}' \
        --field enforce_admins=false \
        --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":false,"require_code_owner_reviews":false}' \
        --field restrictions=null \
        --field required_linear_history=false \
        --field allow_force_pushes=false \
        --field allow_deletions=false \
        --field block_creations=false \
        --field required_conversation_resolution=false \
        --field lock_branch=false \
        --field allow_fork_syncing=false || {
        warn "Не удалось настроить защиту для 'dev'. Возможно, ветка не существует или у вас нет прав."
        warn "Создайте ветку 'dev' сначала или настройте вручную через веб-интерфейс GitHub."
    }
    
    info "✅ Защита ветки 'dev' настроена"
}

# Проверка существования веток
check_branches() {
    info "Проверка существования веток..."
    
    branches=("main" "stage" "dev")
    missing_branches=()
    
    for branch in "${branches[@]}"; do
        if gh api repos/$REPO/branches/$branch &> /dev/null; then
            info "✅ Ветка '$branch' существует"
        else
            warn "⚠️  Ветка '$branch' не существует"
            missing_branches+=("$branch")
        fi
    done
    
    if [ ${#missing_branches[@]} -gt 0 ]; then
        echo ""
        warn "Следующие ветки не существуют: ${missing_branches[*]}"
        warn "Создайте их перед настройкой защиты или настройте защиту вручную."
        echo ""
        read -p "Продолжить настройку для существующих веток? (y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Отменено пользователем"
            exit 0
        fi
    fi
}

# Главная функция
main() {
    echo "=========================================="
    echo "  Настройка Branch Protection Rules"
    echo "=========================================="
    echo ""
    
    check_branches
    echo ""
    
    # Подтверждение
    read -p "Вы уверены, что хотите настроить Branch Protection Rules? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Отменено пользователем"
        exit 0
    fi
    
    echo ""
    
    # Настройка защиты для каждой ветки
    setup_main_protection
    echo ""
    
    setup_stage_protection
    echo ""
    
    setup_dev_protection
    echo ""
    
    info "=========================================="
    info "Настройка завершена!"
    info "=========================================="
    echo ""
    info "Проверьте настройки в GitHub:"
    info "https://github.com/$REPO/settings/branches"
    echo ""
    warn "Примечание: Status checks будут доступны после первого запуска соответствующих workflows."
    warn "Вернитесь и добавьте их в настройки защиты веток после настройки workflows."
}

# Запуск главной функции
main

