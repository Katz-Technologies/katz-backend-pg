# Скрипт для настройки GitHub Environments через GitHub CLI
# Создает environments для production и staging с необходимыми настройками

$env:Path += ";C:\Program Files\GitHub CLI"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  GitHub Environments Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Получение информации о репозитории
try {
    $repoInfo = gh repo view --json nameWithOwner 2>&1 | ConvertFrom-Json
    $REPO = $repoInfo.nameWithOwner
    $USER = gh api user --jq .login 2>&1
} catch {
    Write-Host "[ERROR] Failed to get repository info" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Repository: $REPO" -ForegroundColor Green
Write-Host "[INFO] User: $USER" -ForegroundColor Green
Write-Host ""

# Проверка существующих environments
Write-Host "[INFO] Checking existing environments..." -ForegroundColor Green
try {
    $existingEnvs = gh api "repos/$REPO/environments" 2>&1 | ConvertFrom-Json
    $envNames = $existingEnvs.environments | ForEach-Object { $_.name }
    Write-Host "[INFO] Existing environments: $($envNames -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "[INFO] No existing environments found" -ForegroundColor Yellow
    $envNames = @()
}
Write-Host ""

# Функция для создания/обновления environment
function Setup-Environment {
    param(
        [string]$EnvName,
        [string]$BranchName,
        [bool]$RequireReviewers = $false,
        [int]$ReviewerCount = 0
    )
    
    Write-Host "[INFO] Setting up environment '$EnvName'..." -ForegroundColor Green
    
    $envConfig = @{
        deployment_branch_policy = @{
            protected_branches = $false
            custom_branch_policies = $true
        }
        reviewers = @()
    }
    
    # Добавляем branch policy
    if ($BranchName) {
        $envConfig.deployment_branch_policy.custom_branches = @($BranchName)
    }
    
    # Добавляем reviewers если требуется
    if ($RequireReviewers -and $ReviewerCount -gt 0) {
        for ($i = 0; $i -lt $ReviewerCount; $i++) {
            $envConfig.reviewers += @{
                type = "User"
                reviewer = @{
                    type = "User"
                    login = $USER
                }
            }
        }
    }
    
    $jsonBody = $envConfig | ConvertTo-Json -Depth 10
    
    try {
        # Проверяем, существует ли environment
        $existing = gh api "repos/$REPO/environments/$EnvName" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[INFO] Environment '$EnvName' already exists, updating..." -ForegroundColor Yellow
            $jsonBody | gh api "repos/$REPO/environments/$EnvName" --method PUT --input - 2>&1 | Out-Null
        } else {
            Write-Host "[INFO] Creating new environment '$EnvName'..." -ForegroundColor Green
            $jsonBody | gh api "repos/$REPO/environments/$EnvName" --method PUT --input - 2>&1 | Out-Null
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[INFO] ✅ Environment '$EnvName' configured" -ForegroundColor Green
        } else {
            Write-Host "[WARN] Failed to configure '$EnvName'" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[WARN] Error configuring '$EnvName': $_" -ForegroundColor Yellow
    }
}

# Настройка production environment
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Production Environment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$response = Read-Host "Configure production environment with manual approval? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    Setup-Environment -EnvName "production" -BranchName "main" -RequireReviewers $true -ReviewerCount 1
} else {
    Write-Host "[INFO] Skipping production environment setup" -ForegroundColor Yellow
}
Write-Host ""

# Настройка staging environment
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Staging Environment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$response = Read-Host "Configure staging environment? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    Setup-Environment -EnvName "staging" -BranchName "stage" -RequireReviewers $false -ReviewerCount 0
} else {
    Write-Host "[INFO] Skipping staging environment setup" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[INFO] ==========================================" -ForegroundColor Green
Write-Host "[INFO] Setup completed!" -ForegroundColor Green
Write-Host "[INFO] ==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "[INFO] Next steps:" -ForegroundColor Green
Write-Host "1. Add secrets to environments:" -ForegroundColor Cyan
Write-Host "   https://github.com/$REPO/settings/environments" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Required secrets for production:" -ForegroundColor Yellow
Write-Host "   - SSH_HOST" -ForegroundColor Yellow
Write-Host "   - SSH_USER" -ForegroundColor Yellow
Write-Host "   - SSH_PRIVATE_KEY" -ForegroundColor Yellow
Write-Host "   - SSH_PORT (optional, default: 22)" -ForegroundColor Yellow
Write-Host "   - DEPLOY_PATH" -ForegroundColor Yellow
Write-Host "   - GIT_TOKEN (if using HTTPS)" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Update workflows to use environments:" -ForegroundColor Yellow
Write-Host "   Add 'environment: production' or 'environment: staging' to deploy jobs" -ForegroundColor Yellow

