# Kid Qubit Platform Deployment Script for Windows

Write-Host "Starting Kid Qubit Platform deployment..." -ForegroundColor Green

# Check if .env files exist
if (-not (Test-Path ".env")) {
  Write-Host "Error: .env file not found. Please create it from .env.example" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path ".env.local")) {
  Write-Host "Error: .env.local file not found. Please create it from .env.local.example" -ForegroundColor Red
  exit 1
}

# Install dependencies with increased memory limit
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
$env:NODE_OPTIONS="--max_old_space_size=8192"
npm install
Remove-Item Env:NODE_OPTIONS

Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
Set-Location -Path backend
$env:NODE_OPTIONS="--max_old_space_size=8192"
npm install
Remove-Item Env:NODE_OPTIONS
Set-Location -Path ..

# Build the application
Write-Host "Building backend..." -ForegroundColor Cyan
Set-Location -Path backend
npm run build
Set-Location -Path ..

Write-Host "Building frontend..." -ForegroundColor Cyan
npm run build

# Database setup
Write-Host "Setting up database..." -ForegroundColor Cyan
Set-Location -Path backend

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Cyan
npm run migrate

Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "You can now start the application with:" -ForegroundColor Yellow
Write-Host "  - Backend: cd backend && npm run start" -ForegroundColor Yellow
Write-Host "  - Frontend: npm run start" -ForegroundColor Yellow