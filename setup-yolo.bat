@echo off
echo Setting up YOLO v8 Integration for UW Practice Site
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from https://python.org/
    pause
    exit /b 1
)

echo Python found. Installing YOLO v8 dependencies...
echo.

REM Install Python dependencies
echo Installing ultralytics and dependencies...
pip install ultralytics opencv-python pillow numpy torch

if %errorlevel% neq 0 (
    echo Error: Failed to install Python dependencies
    pause
    exit /b 1
)

echo.
echo Installing Node.js dependencies...
npm install

if %errorlevel% neq 0 (
    echo Error: Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo.
echo Creating necessary directories...
if not exist "python" mkdir python
if not exist "models" mkdir models
if not exist "uploads" mkdir uploads

echo.
echo Copying updated files...
copy "src\index-updated.js" "src\index.js" /Y
copy "public\index-updated.html" "public\index.html" /Y
copy "public\script-updated.js" "public\script.js" /Y
copy "src\services\yoloV8Service.js" "src\services\yoloService.js" /Y

echo.
echo ✅ YOLO v8 integration setup complete!
echo.
echo To start the application:
echo   npm run dev
echo.
echo Or use the startup script:
echo   start.bat
echo.
pause
