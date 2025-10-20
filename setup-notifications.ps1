# Notification System Setup Script
# Run this script to set up the notification system

Write-Host "🔔 Setting up TalentPath Notification System..." -ForegroundColor Cyan
Write-Host ""

# Check if database is accessible
Write-Host "📊 Step 1: Database Migration" -ForegroundColor Yellow
Write-Host "Please run the following SQL migration in your database:" -ForegroundColor White
Write-Host ""
Write-Host "Location: migrations/add_notifications.sql" -ForegroundColor Green
Write-Host ""
Write-Host "If using PostgreSQL CLI:" -ForegroundColor Gray
Write-Host "  psql -d your_database -f migrations/add_notifications.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "Or if using Drizzle ORM:" -ForegroundColor Gray
Write-Host "  npm run db:push" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter when database migration is complete..."

# Install dependencies if needed
Write-Host ""
Write-Host "📦 Step 2: Checking Dependencies" -ForegroundColor Yellow

$dependencies = @("sonner", "date-fns")
$missing = @()

foreach ($dep in $dependencies) {
    $packageJson = Get-Content -Raw package.json | ConvertFrom-Json
    if (-not $packageJson.dependencies.$dep) {
        $missing += $dep
    }
}

if ($missing.Count -gt 0) {
    Write-Host "Installing missing dependencies: $($missing -join ', ')" -ForegroundColor White
    npm install $($missing -join ' ')
} else {
    Write-Host "All dependencies already installed ✓" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Start your development server: npm run dev" -ForegroundColor White
Write-Host "2. Navigate to /dashboard to see notification settings" -ForegroundColor White
Write-Host "3. Enable browser notifications when prompted" -ForegroundColor White
Write-Host "4. Test by creating a job in admin panel" -ForegroundColor White
Write-Host ""
Write-Host "📖 Full documentation: NOTIFICATIONS.md" -ForegroundColor Cyan
Write-Host ""
