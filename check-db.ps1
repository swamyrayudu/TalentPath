# Database Migration Check and Runner
Write-Host "🔍 Checking TalentPath Database..." -ForegroundColor Cyan
Write-Host ""

# Check if tables exist
Write-Host "Checking for notification tables..." -ForegroundColor Yellow

$dbCheck = @"
SELECT 
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
    ) as notifications_exists,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_preferences'
    ) as preferences_exists;
"@

Write-Host ""
Write-Host "SQL Query to check tables:" -ForegroundColor Gray
Write-Host $dbCheck -ForegroundColor DarkGray
Write-Host ""

Write-Host "Please run the above query in your PostgreSQL client to check if tables exist." -ForegroundColor White
Write-Host ""
Write-Host "If tables don't exist, run this migration:" -ForegroundColor Yellow
Write-Host "  migrations/add_notifications.sql" -ForegroundColor Green
Write-Host ""
Write-Host "Method 1 - PostgreSQL CLI:" -ForegroundColor Cyan
Write-Host '  psql -U your_username -d your_database_name -f ".\migrations\add_notifications.sql"' -ForegroundColor White
Write-Host ""
Write-Host "Method 2 - Copy the SQL file contents and paste into:" -ForegroundColor Cyan
Write-Host "  - pgAdmin" -ForegroundColor White
Write-Host "  - TablePlus" -ForegroundColor White
Write-Host "  - DBeaver" -ForegroundColor White
Write-Host "  - Any PostgreSQL client" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue..."

Write-Host ""
Write-Host "After running the migration, restart your dev server:" -ForegroundColor Yellow
Write-Host "  1. Stop the current server (Ctrl+C)" -ForegroundColor White
Write-Host "  2. Run: npm run dev" -ForegroundColor White
Write-Host "  3. Create a test job as admin" -ForegroundColor White
Write-Host "  4. Check browser console for notification logs" -ForegroundColor White
Write-Host ""
