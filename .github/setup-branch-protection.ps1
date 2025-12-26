# Скрипт для автоматической настройки Branch Protection Rules через GitHub CLI
# Требует установленного GitHub CLI (gh) и прав администратора репозитория

$ErrorActionPreference = "Stop"

# Функции для вывода сообщений
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Проверка наличия GitHub CLI
try {
    $null = gh --version 2>&1
} catch {
    Write-Error -Message "GitHub CLI (gh) не установлен. Установите его с https://cli.github.com/"
    exit 1
}

# Обновление PATH на случай, если gh не найден
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    $env:Path += ";C:\Program Files\GitHub CLI"
}

# Проверка авторизации
try {
    $null = gh auth status 2>&1
} catch {
    Write-Error -Message "Вы не авторизованы в GitHub CLI. Выполните: gh auth login"
    exit 1
}

# Получение информации о репозитории
try {
    $repoInfo = gh repo view --json nameWithOwner 2>&1 | ConvertFrom-Json
    $REPO = $repoInfo.nameWithOwner
} catch {
    Write-Error -Message "Не удалось определить репозиторий. Убедитесь, что вы находитесь в директории репозитория."
    exit 1
}

    Write-Info -Message "Настройка Branch Protection Rules для репозитория: $REPO"
Write-Host ""

# Функция для настройки защиты ветки main
function Setup-MainProtection {
    Write-Info -Message "Настройка защиты ветки 'main' (PRODUCTION)..."
    
    $protectionConfig = @{
        required_status_checks = @{
            strict = $true
            contexts = @("dev - lint and test", "stage - test and deploy", "production - test and deploy")
        }
        enforce_admins = $true
        required_pull_request_reviews = @{
            required_approving_review_count = 2
            dismiss_stale_reviews = $true
            require_code_owner_reviews = $false
        }
        restrictions = $null
        required_linear_history = $true
        allow_force_pushes = $false
        allow_deletions = $false
        block_creations = $false
        required_conversation_resolution = $true
        lock_branch = $false
        allow_fork_syncing = $false
    }
    
    $jsonBody = $protectionConfig | ConvertTo-Json -Depth 10
    
    $result = $jsonBody | gh api "repos/$REPO/branches/main/protection" --method PUT --input - 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Info -Message "✅ Защита ветки 'main' настроена"
    } else {
        Write-Warn -Message "Не удалось настроить защиту для 'main'. Возможно, правила уже существуют или у вас нет прав."
        Write-Warn -Message "Попробуйте настроить вручную через веб-интерфейс GitHub."
    }
}

# Функция для настройки защиты ветки stage
function Setup-StageProtection {
    Write-Info -Message "Настройка защиты ветки 'stage' (STAGING)..."
    
    $protectionConfig = @{
        required_status_checks = @{
            strict = $true
            contexts = @("dev - lint and test", "stage - test and deploy")
        }
        enforce_admins = $false
        required_pull_request_reviews = @{
            required_approving_review_count = 1
            dismiss_stale_reviews = $true
            require_code_owner_reviews = $false
        }
        restrictions = $null
        required_linear_history = $false
        allow_force_pushes = $false
        allow_deletions = $false
        block_creations = $false
        required_conversation_resolution = $true
        lock_branch = $false
        allow_fork_syncing = $false
    }
    
    $jsonBody = $protectionConfig | ConvertTo-Json -Depth 10
    
    $result = $jsonBody | gh api "repos/$REPO/branches/stage/protection" --method PUT --input - 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Info -Message "✅ Защита ветки 'stage' настроена"
    } else {
        Write-Warn -Message "Не удалось настроить защиту для 'stage'. Возможно, ветка не существует или у вас нет прав."
        Write-Warn -Message "Создайте ветку 'stage' сначала или настройте вручную через веб-интерфейс GitHub."
    }
}

# Функция для настройки защиты ветки dev
function Setup-DevProtection {
    Write-Info -Message "Настройка защиты ветки 'dev' (DEVELOPMENT)..."
    
    $protectionConfig = @{
        required_status_checks = @{
            strict = $true
            contexts = @("dev - lint and test")
        }
        enforce_admins = $false
        required_pull_request_reviews = @{
            required_approving_review_count = 1
            dismiss_stale_reviews = $false
            require_code_owner_reviews = $false
        }
        restrictions = $null
        required_linear_history = $false
        allow_force_pushes = $false
        allow_deletions = $false
        block_creations = $false
        required_conversation_resolution = $false
        lock_branch = $false
        allow_fork_syncing = $false
    }
    
    $jsonBody = $protectionConfig | ConvertTo-Json -Depth 10
    
    $result = $jsonBody | gh api "repos/$REPO/branches/dev/protection" --method PUT --input - 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Info -Message "✅ Защита ветки 'dev' настроена"
    } else {
        Write-Warn -Message "Не удалось настроить защиту для 'dev'. Возможно, ветка не существует или у вас нет прав."
        Write-Warn -Message "Создайте ветку 'dev' сначала или настройте вручную через веб-интерфейс GitHub."
    }
}

# Проверка существования веток
function Check-Branches {
    Write-Info "Проверка существования веток..."
    
    $branches = @("main", "stage", "dev")
    $missingBranches = @()
    
    foreach ($branch in $branches) {
        $result = gh api "repos/$REPO/branches/$branch" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Info -Message "✅ Ветка '$branch' существует"
        } else {
            Write-Warn -Message "⚠️  Ветка '$branch' не существует"
            $missingBranches += $branch
        }
    }
    
    if ($missingBranches.Count -gt 0) {
        Write-Host ""
        Write-Warn -Message "Следующие ветки не существуют: $($missingBranches -join ', ')"
        Write-Warn -Message "Создайте их перед настройкой защиты или настройте защиту вручную."
        Write-Host ""
        $response = Read-Host "Продолжить настройку для существующих веток? (y/n)"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Info -Message "Отменено пользователем"
            exit 0
        }
    }
}

# Главная функция
function Main {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  Настройка Branch Protection Rules" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Check-Branches
    Write-Host ""
    
    # Подтверждение
    $response = Read-Host "Вы уверены, что хотите настроить Branch Protection Rules? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Info -Message "Отменено пользователем"
        exit 0
    }
    
    Write-Host ""
    
    # Настройка защиты для каждой ветки
    Setup-MainProtection
    Write-Host ""
    
    Setup-StageProtection
    Write-Host ""
    
    Setup-DevProtection
    Write-Host ""
    
    Write-Info -Message "=========================================="
    Write-Info -Message "Настройка завершена!"
    Write-Info -Message "=========================================="
    Write-Host ""
    Write-Info -Message "Проверьте настройки в GitHub:"
    Write-Info -Message "https://github.com/$REPO/settings/branches"
    Write-Host ""
    Write-Warn -Message "Примечание: Status checks будут доступны после первого запуска соответствующих workflows."
    Write-Warn -Message "Вернитесь и добавьте их в настройки защиты веток после настройки workflows."
}

# Запуск главной функции
Main

