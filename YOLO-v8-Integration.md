# YOLO v8 Integration Guide

This guide explains how to fully integrate YOLO v8 object detection into your UW Practice Site.

## 🎯 What's Included

### New Files Created:
- `python/yolo_service.py` - Python YOLO v8 service
- `src/services/yoloV8Service.js` - Node.js YOLO v8 wrapper
- `src/index-updated.js` - Updated server with YOLO v8 endpoints
- `public/index-updated.html` - Enhanced web interface
- `public/script-updated.js` - Updated frontend JavaScript
- `setup-yolo.bat` / `setup-yolo.sh` - Setup scripts

### New Features:
- ✅ **Real YOLO v8 object detection** using Ultralytics
- ✅ **80 COCO dataset classes** for comprehensive detection
- ✅ **Configurable confidence thresholds** (0.1 - 1.0)
- ✅ **Multiple image upload methods** (base64 and file upload)
- ✅ **Real-time detection results** with bounding boxes
- ✅ **Model status monitoring** and health checks
- ✅ **Fallback simulation mode** when Python is not available
- ✅ **Enhanced web interface** with detection controls

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
setup-yolo.bat
```

**Linux/Mac:**
```bash
chmod +x setup-yolo.sh
./setup-yolo.sh
```

### Option 2: Manual Setup

1. **Install Python dependencies:**
```bash
pip install ultralytics opencv-python pillow numpy torch
```

2. **Install Node.js dependencies:**
```bash
npm install
```

3. **Copy updated files:**
```bash
# Replace existing files with updated versions
cp src/index-updated.js src/index.js
cp public/index-updated.html public/index.html
cp public/script-updated.js public/script.js
cp src/services/yoloV8Service.js src/services/yoloService.js
```

4. **Start the application:**
```bash
npm run dev
```

## 🔧 API Endpoints

### YOLO v8 Detection
```http
POST /api/yolo/detect
Content-Type: application/json

{
  "imageData": "base64_encoded_image",
  "confidence": 0.5
}
```

### File Upload Detection
```http
POST /api/yolo/upload
Content-Type: multipart/form-data

image: [file]
confidence: 0.5
```

### Model Status
```http
GET /api/yolo/status
```

### Supported Classes
```http
GET /api/yolo/classes
```

## 🎮 Usage Examples

### 1. Basic Object Detection

```javascript
// Upload image and detect objects
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('confidence', '0.7');

const response = await fetch('/api/yolo/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Detections:', result.detections);
```

### 2. Base64 Image Detection

```javascript
// Convert image to base64 and detect
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const img = new Image();
img.onload = async () => {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  const imageData = canvas.toDataURL('image/jpeg');
  
  const response = await fetch('/api/yolo/detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      imageData: imageData,
      confidence: 0.6 
    })
  });
  
  const result = await response.json();
  console.log('Detections:', result.detections);
};
img.src = 'path/to/image.jpg';
```

## 📊 Detection Results Format

```json
{
  "success": true,
  "detections": [
    {
      "class": "person",
      "confidence": 0.95,
      "bbox": [100, 150, 200, 300],
      "classId": 0,
      "center": [200, 300]
    }
  ],
  "model": "YOLOv8n",
  "device": "CPU",
  "confidenceThreshold": 0.5,
  "numDetections": 1
}
```

## 🎯 Supported Classes (80 COCO Classes)

The model can detect 80 different object classes including:
- **People & Animals:** person, cat, dog, horse, etc.
- **Vehicles:** car, truck, bus, motorcycle, bicycle, etc.
- **Furniture:** chair, couch, bed, dining table, etc.
- **Electronics:** tv, laptop, mouse, keyboard, cell phone, etc.
- **Food & Drinks:** bottle, wine glass, cup, banana, apple, etc.
- **And many more...**

## ⚙️ Configuration

### Environment Variables
```env
# YOLO Model Configuration
YOLO_MODEL_PATH=./models/yolov8n.pt
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### Confidence Thresholds
- **0.1-0.3:** Very sensitive, many detections
- **0.4-0.6:** Balanced (recommended)
- **0.7-0.9:** Conservative, high confidence only
- **1.0:** Maximum confidence only

## 🔍 Troubleshooting

### Python Not Found
```bash
# Install Python from https://python.org/
# Make sure Python is in your PATH
python --version
```

### Ultralytics Not Installed
```bash
pip install ultralytics
```

### Model Download Issues
The first run will automatically download the YOLOv8n model (~6MB). If it fails:
1. Check internet connection
2. Try running: `python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"`

### Fallback Mode
If Python/Ultralytics is not available, the system will automatically use simulation mode with realistic mock detections.

## 🚀 Performance Tips

1. **Image Size:** Resize large images before detection for better performance
2. **Confidence:** Use higher confidence thresholds (0.6+) to reduce false positives
3. **Batch Processing:** For multiple images, process them sequentially
4. **GPU:** Install CUDA for GPU acceleration (optional)

## 📈 Advanced Features

### Custom Model Training
```javascript
// Train custom YOLO v8 model
const response = await fetch('/api/yolo/train', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ trainingData: yourData })
});
```

### Model Validation
```javascript
// Validate model performance
const response = await fetch('/api/yolo/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ testData: yourTestData })
});
```

## 🎉 Success!

Once setup is complete, you'll have:
- ✅ Real-time object detection with YOLO v8
- ✅ 80 COCO classes supported
- ✅ Configurable confidence thresholds
- ✅ Multiple upload methods
- ✅ Comprehensive API endpoints
- ✅ Modern web interface
- ✅ Fallback simulation mode

Your UW Practice Site now has full YOLO v8 integration! 🚀
