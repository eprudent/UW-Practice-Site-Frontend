#!/bin/bash

echo "Setting up YOLO v8 Integration for UW Practice Site"
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    echo "Please install Python 3 from https://python.org/"
    exit 1
fi

echo "Python found. Installing YOLO v8 dependencies..."
echo

# Install Python dependencies
echo "Installing ultralytics and dependencies..."
pip3 install ultralytics opencv-python pillow numpy torch

if [ $? -ne 0 ]; then
    echo "Error: Failed to install Python dependencies"
    exit 1
fi

echo
echo "Installing Node.js dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "Error: Failed to install Node.js dependencies"
    exit 1
fi

echo
echo "Creating necessary directories..."
mkdir -p python models uploads

echo
echo "Copying updated files..."
cp src/index-updated.js src/index.js
cp public/index-updated.html public/index.html
cp public/script-updated.js public/script.js
cp src/services/yoloV8Service.js src/services/yoloService.js

echo
echo "✅ YOLO v8 integration setup complete!"
echo
echo "To start the application:"
echo "  npm run dev"
echo
echo "Or use the startup script:"
echo "  ./start.sh"
echo
