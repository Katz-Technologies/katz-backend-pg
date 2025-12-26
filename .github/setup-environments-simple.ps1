# Простой скрипт для настройки GitHub Environments
# Автоматически настраивает production и staging environments

$env:Path += ";C:\Program Files\GitHub CLI"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  GitHub Environments Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Получение информации
$repoInfo = gh repo view --json nameWithOwner | ConvertFrom-Json
$REPO = $repoInfo.nameWithOwner
$USER = gh api user --jq .login

Write-Host "[INFO] Repository: $REPO" -ForegroundColor Green
Write-Host "[INFO] User: $USER" -ForegroundColor Green
Write-Host ""

# Настройка production environment
Write-Host "[INFO] Setting up 'production' environment..." -ForegroundColor Green
$prodConfig = @{
    deployment_branch_policy = @{
        protected_branches = $false
        custom_branch_policies = $true
        custom_branches = @("main")
    }
    reviewers = @(
        @{
            type = "User"
            reviewer = @{
                type = "User"
                login = $USER
            }
        }
    )
} | ConvertTo-Json -Depth 10

$prodConfig | gh api "repos/$REPO/environments/production" --method PUT --input - 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[INFO] ✅ Production environment configured" -ForegroundColor Green
} else {
    Write-Host "[WARN] Failed to configure production (may already exist)" -ForegroundColor Yellow
}
Write-Host ""

# Настройка staging environment
Write-Host "[INFO] Setting up 'staging' environment..." -ForegroundColor Green
$stageConfig = @{
    deployment_branch_policy = @{
        protected_branches = $false
        custom_branch_policies = $true
        custom_branches = @("stage")
    }
    reviewers = @()
} | ConvertTo-Json -Depth 10

$stageConfig | gh api "repos/$REPO/environments/staging" --method PUT --input - 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[INFO] ✅ Staging environment configured" -ForegroundColor Green
} else {
    Write-Host "[WARN] Failed to configure staging" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[INFO] ==========================================" -ForegroundColor Green
Write-Host "[INFO] Setup completed!" -ForegroundColor Green
Write-Host "[INFO] ==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "[INFO] Check environments at:" -ForegroundColor Green
Write-Host "https://github.com/$REPO/settings/environments" -ForegroundColor Cyan
Write-Host ""
Write-Host "[WARN] Next steps:" -ForegroundColor Yellow
Write-Host "1. Add secrets to environments (SSH_HOST, SSH_USER, SSH_PRIVATE_KEY, etc.)" -ForegroundColor Yellow
Write-Host "2. Update workflows to use 'environment: production' or 'environment: staging'" -ForegroundColor Yellow

