# Instagram Analytics Restart Script for Windows

Write-Host "🔄 Restarting Instagram Analytics..." -ForegroundColor Cyan
Write-Host ""

# Stop existing processes
Write-Host "Stopping existing processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*python*" -and $_.CommandLine -like "*run.py*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process | Where-Object {$_.ProcessName -like "*node*" -and $_.CommandLine -like "*vite*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start backend
Write-Host "Starting backend..." -ForegroundColor Green
Start-Process -FilePath "python" -ArgumentList "run.py" -WorkingDirectory "backend" -WindowStyle Hidden
Write-Host "Backend started on http://localhost:5001" -ForegroundColor Green

# Wait for backend
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start frontend
Write-Host "Starting frontend..." -ForegroundColor Green
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "frontend" -WindowStyle Hidden
Write-Host "Frontend started on http://localhost:5173" -ForegroundColor Green

Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:5001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop services, close this window or run:" -ForegroundColor Yellow
Write-Host "  Get-Process python,node | Stop-Process" -ForegroundColor Gray
