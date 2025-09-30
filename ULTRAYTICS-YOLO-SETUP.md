# 🚀 Ultralytics YOLO v8 Integration Setup

This guide will help you set up the official [Ultralytics YOLO v8](https://github.com/ultralytics/ultralytics.git) integration with live camera detection and LLM analysis.

## 🎯 What's Included

### ✅ **Real Ultralytics YOLO v8 Integration**
- **Official Ultralytics Package**: Uses the latest YOLO v8 from [ultralytics/ultralytics](https://github.com/ultralytics/ultralytics.git)
- **Live Camera Detection**: Real-time object detection with your webcam
- **80 COCO Classes**: Full object detection capabilities
- **LLM Integration**: Claude AI analysis of detected objects
- **Fallback Mode**: Works without Python (simulation mode)

### 🔧 **New Features**
- **Live Camera Tab**: Dedicated interface for real-time detection
- **Bounding Box Overlay**: Visual detection results on camera feed
- **Confidence Thresholds**: Adjustable detection sensitivity
- **Detection Statistics**: Real-time FPS and object counts
- **AI Analysis**: Claude AI analyzes what the camera sees

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
setup-ultralytics.bat
```

**Linux/Mac:**
```bash
chmod +x setup-ultralytics.sh
./setup-ultralytics.sh
```

### Option 2: Manual Setup

1. **Install Python 3.8+** from [python.org](https://python.org/)
   - Make sure to check "Add to PATH" during installation

2. **Install Ultralytics and Dependencies:**
```bash
pip install ultralytics opencv-python pillow numpy torch
```

3. **Install Node.js Dependencies:**
```bash
npm install
```

4. **Copy Integration Files:**
```bash
# Replace existing files with Ultralytics versions
cp src/index-ultralytics.js src/index.js
cp public/index-live.html public/index.html
cp public/script-live.js public/script.js
cp src/services/yoloUltralyticsService.js src/services/yoloService.js
```

5. **Start the Application:**
```bash
npm run dev
```

## 🎮 How to Use Live Camera Detection

### 1. **Access the Live Camera Tab**
- Open http://localhost:3000
- Click the "Live Camera" tab

### 2. **Start Camera Detection**
- Click "Start Camera" button
- Allow camera permissions when prompted
- Adjust confidence threshold (0.1 - 1.0)
- Click "Start Live Detection"

### 3. **View Real-time Results**
- See live camera feed with bounding boxes
- View detection statistics (FPS, object count)
- Click "Analyze with LLM" for AI insights

### 4. **LLM Analysis Features**
- **Object Description**: What objects are detected
- **Scene Analysis**: Context and activities
- **Safety Insights**: Practical considerations
- **Custom Prompts**: Ask specific questions about detections

## 🔧 API Endpoints

### Live Camera Detection
```http
POST /api/yolo/start-camera
POST /api/yolo/stop-camera
GET /api/yolo/frame?confidence=0.5
GET /api/yolo/camera-info
```

### LLM Analysis
```http
POST /api/yolo/analyze-detections
Content-Type: application/json

{
  "detections": [...],
  "prompt": "Analyze what you see in this scene"
}
```

## 📊 Detection Results Format

```json
{
  "success": true,
  "frame": "base64_encoded_image",
  "detections": [
    {
      "class": "person",
      "confidence": 0.95,
      "bbox": [100, 150, 200, 300],
      "classId": 0,
      "center": [200, 300]
    }
  ],
  "model": "Ultralytics YOLOv8n",
  "device": "CPU",
  "timestamp": 1696000000
}
```

## 🎯 Supported Object Classes (80 COCO Classes)

The integration supports detection of 80 different object classes including:

### **People & Animals**
- person, cat, dog, horse, sheep, cow, elephant, bear, zebra, giraffe

### **Vehicles**
- car, truck, bus, motorcycle, bicycle, airplane, boat, train

### **Furniture & Electronics**
- chair, couch, bed, dining table, tv, laptop, mouse, keyboard, cell phone

### **Food & Drinks**
- bottle, wine glass, cup, banana, apple, pizza, donut, cake

### **And 60+ more classes...**

## ⚙️ Configuration

### Environment Variables
```env
# YOLO Model Configuration
YOLO_MODEL_PATH=./models/yolov8n.pt
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### Camera Settings
- **Resolution**: 640x480 (optimized for performance)
- **FPS**: 30 (adjustable)
- **Buffer**: Minimal for real-time detection

## 🔍 Troubleshooting

### Python Not Found
```bash
# Install Python from https://python.org/
# Make sure it's added to PATH
python --version
```

### Ultralytics Installation Issues
```bash
# Upgrade pip first
pip install --upgrade pip

# Install with specific versions
pip install ultralytics==8.0.196 opencv-python==4.8.1.78 torch==2.0.1
```

### Camera Not Working
1. **Check camera permissions** in browser
2. **Try different camera index** (0, 1, 2)
3. **Close other applications** using the camera
4. **Check camera drivers** are up to date

### Model Download Issues
The first run will automatically download YOLOv8n model (~6MB). If it fails:
1. Check internet connection
2. Try: `python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"`

## 🚀 Performance Tips

1. **GPU Acceleration**: Install CUDA for faster detection
2. **Confidence Threshold**: Use 0.6+ to reduce false positives
3. **Detection Interval**: Adjust for your system performance
4. **Camera Resolution**: Lower resolution = faster detection

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

- ✅ **Real Ultralytics YOLO v8** object detection
- ✅ **Live camera detection** with bounding boxes
- ✅ **80 COCO classes** supported
- ✅ **LLM analysis** of detections
- ✅ **Configurable thresholds** and settings
- ✅ **Fallback simulation** mode
- ✅ **Modern web interface** with live controls

## 🔗 References

- [Ultralytics YOLO v8 Repository](https://github.com/ultralytics/ultralytics.git)
- [Ultralytics Documentation](https://docs.ultralytics.com/)
- [COCO Dataset Classes](https://cocodataset.org/#home)
- [OpenCV Documentation](https://opencv.org/)

Your UW Practice Site now has full Ultralytics YOLO v8 integration with live camera detection! 🚀
