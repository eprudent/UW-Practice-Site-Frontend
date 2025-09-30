@echo off
echo Starting UW Practice Site - AI Integration Platform
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo Warning: .env file not found
    echo Please copy .env.example to .env and configure your API keys
    echo.
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

REM Start the application
echo Starting the application...
echo Web Interface: http://localhost:3000
echo API Health Check: http://localhost:3000/api/health
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
