# Simple script to setup Branch Protection Rules via GitHub CLI
# Requires GitHub CLI (gh) and admin rights

$env:Path += ";C:\Program Files\GitHub CLI"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Branch Protection Rules Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Get repository info
$repoInfo = gh repo view --json nameWithOwner | ConvertFrom-Json
$REPO = $repoInfo.nameWithOwner

Write-Host "[INFO] Repository: $REPO" -ForegroundColor Green
Write-Host ""

# Check branches
Write-Host "[INFO] Checking branches..." -ForegroundColor Green
$branches = @("main", "stage", "dev")
foreach ($branch in $branches) {
    $result = gh api "repos/$REPO/branches/$branch" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[INFO] Branch '$branch' exists" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Branch '$branch' does not exist" -ForegroundColor Yellow
    }
}
Write-Host ""

# Auto-continue (remove this block if you want interactive mode)
Write-Host "[INFO] Proceeding with setup..." -ForegroundColor Green
Write-Host ""

# Setup main branch protection
Write-Host "[INFO] Setting up protection for 'main' branch..." -ForegroundColor Green
$mainConfig = @{
    required_status_checks = @{
        strict = $true
        contexts = @("dev - lint and test", "stage - test and deploy", "production - test and deploy")
    }
    enforce_admins = $true
    required_pull_request_reviews = @{
        required_approving_review_count = 2
        dismiss_stale_reviews = $true
        require_code_owner_reviews = $true
    }
    restrictions = $null
    required_linear_history = $true
    allow_force_pushes = $false
    allow_deletions = $false
    block_creations = $false
    required_conversation_resolution = $true
    lock_branch = $false
    allow_fork_syncing = $false
} | ConvertTo-Json -Depth 10

$mainConfig | gh api "repos/$REPO/branches/main/protection" --method PUT --input - 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[INFO] Protection for 'main' configured" -ForegroundColor Green
} else {
    Write-Host "[WARN] Failed to configure 'main'. Check permissions or configure manually." -ForegroundColor Yellow
}
Write-Host ""

# Setup stage branch protection
Write-Host "[INFO] Setting up protection for 'stage' branch..." -ForegroundColor Green
$stageConfig = @{
    required_status_checks = @{
        strict = $true
        contexts = @("dev - lint and test", "stage - test and deploy")
    }
    enforce_admins = $false
    required_pull_request_reviews = @{
        required_approving_review_count = 1
        dismiss_stale_reviews = $true
        require_code_owner_reviews = $true
    }
    restrictions = $null
    required_linear_history = $false
    allow_force_pushes = $false
    allow_deletions = $false
    block_creations = $false
    required_conversation_resolution = $true
    lock_branch = $false
    allow_fork_syncing = $false
} | ConvertTo-Json -Depth 10

$stageConfig | gh api "repos/$REPO/branches/stage/protection" --method PUT --input - 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[INFO] Protection for 'stage' configured" -ForegroundColor Green
} else {
    Write-Host "[WARN] Failed to configure 'stage'. Branch may not exist or check permissions." -ForegroundColor Yellow
}
Write-Host ""

# Setup dev branch protection
Write-Host "[INFO] Setting up protection for 'dev' branch..." -ForegroundColor Green
$devConfig = @{
    required_status_checks = @{
        strict = $true
        contexts = @("dev - lint and test")
    }
    enforce_admins = $false
    required_pull_request_reviews = @{
        required_approving_review_count = 1
        dismiss_stale_reviews = $false
        require_code_owner_reviews = $true
    }
    restrictions = $null
    required_linear_history = $false
    allow_force_pushes = $false
    allow_deletions = $false
    block_creations = $false
    required_conversation_resolution = $false
    lock_branch = $false
    allow_fork_syncing = $false
} | ConvertTo-Json -Depth 10

$devConfig | gh api "repos/$REPO/branches/dev/protection" --method PUT --input - 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[INFO] Protection for 'dev' configured" -ForegroundColor Green
} else {
    Write-Host "[WARN] Failed to configure 'dev'. Branch may not exist or check permissions." -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[INFO] ==========================================" -ForegroundColor Green
Write-Host "[INFO] Setup completed!" -ForegroundColor Green
Write-Host "[INFO] ==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "[INFO] Check settings at:" -ForegroundColor Green
Write-Host "https://github.com/$REPO/settings/branches" -ForegroundColor Cyan
Write-Host ""
Write-Host "[WARN] Note: Status checks will be available after first workflow run." -ForegroundColor Yellow
Write-Host "[WARN] Return and add them to branch protection after configuring workflows." -ForegroundColor Yellow

