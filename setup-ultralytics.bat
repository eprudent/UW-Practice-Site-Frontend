@echo off
echo Setting up Ultralytics YOLO v8 Integration for UW Practice Site
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed. Please install Python first:
    echo 1. Go to https://python.org/
    echo 2. Download Python 3.8 or higher
    echo 3. Install with "Add to PATH" option checked
    echo 4. Restart this script after installation
    pause
    exit /b 1
)

echo Python found. Installing Ultralytics and dependencies...
echo.

REM Install Python dependencies
echo Installing ultralytics and dependencies...
pip install ultralytics opencv-python pillow numpy torch

if %errorlevel% neq 0 (
    echo Error: Failed to install Python dependencies
    echo Try running: pip install --upgrade pip
    echo Then run: pip install ultralytics opencv-python pillow numpy torch
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
copy "src\index-ultralytics.js" "src\index.js" /Y
copy "public\index-live.html" "public\index.html" /Y
copy "public\script-live.js" "public\script.js" /Y
copy "src\services\yoloUltralyticsService.js" "src\services\yoloService.js" /Y

echo.
echo Testing Ultralytics installation...
python -c "from ultralytics import YOLO; print('Ultralytics YOLO v8 ready!')"

if %errorlevel% neq 0 (
    echo Warning: Ultralytics test failed, but continuing...
) else (
    echo ✅ Ultralytics YOLO v8 installation verified!
)

echo.
echo ✅ Ultralytics YOLO v8 integration setup complete!
echo.
echo Features available:
echo - Real YOLO v8 object detection using Ultralytics
echo - Live camera detection with bounding boxes
echo - 80 COCO dataset classes
echo - LLM integration for detection analysis
echo - Configurable confidence thresholds
echo.
echo To start the application:
echo   npm run dev
echo.
echo Or use the startup script:
echo   start.bat
echo.
echo The application will work in simulation mode if Python/Ultralytics is not available.
echo.
pause
