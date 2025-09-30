const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class YOLOLiveService {
  constructor() {
    this.model = null;
    this.classes = [];
    this.modelPath = process.env.YOLO_MODEL_PATH || './models/yolov8n.pt';
    this.pythonScriptPath = path.join(__dirname, '../../python/yolo_live_service.py');
    this.isLoaded = false;
    this.pythonAvailable = false;
    this.cameraProcess = null;
    
    // COCO dataset classes (80 classes)
    this.cocoClasses = [
      'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
      'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
      'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
      'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
      'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
      'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
      'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake',
      'chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop',
      'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
      'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
    ];
  }

  async loadModel() {
    try {
      console.log('🔄 Loading YOLO v8 model for live detection...');
      
      // Check if Python script exists
      if (!fs.existsSync(this.pythonScriptPath)) {
        console.log('⚠️  Python YOLO live service not found, creating it...');
        await this.createPythonService();
      }

      // Test Python environment
      await this.testPythonEnvironment();
      
      // Test model loading
      const testResult = await this.callPythonService('', 'info');
      if (testResult.success) {
        this.classes = testResult.classes || this.cocoClasses;
        this.isLoaded = true;
        console.log('✅ YOLO v8 live model loaded successfully');
        console.log(`📊 Device: ${testResult.device || 'CPU'}`);
        console.log(`🎯 Classes: ${testResult.num_classes || 80} available`);
        return true;
      } else {
        throw new Error(testResult.error || 'Failed to load model');
      }
    } catch (error) {
      console.error('❌ Error loading YOLO v8 live model:', error.message);
      return false;
    }
  }

  async createPythonService() {
    const pythonServiceContent = `#!/usr/bin/env python3
"""
YOLO v8 Live Camera Service for Node.js Integration
Handles real-time object detection using webcam
"""

import cv2
import numpy as np
import base64
import json
import sys
import os
from pathlib import Path
import threading
import time

try:
    from ultralytics import YOLO
    import torch
except ImportError:
    print("Error: ultralytics not installed. Run: pip install ultralytics")
    sys.exit(1)

class YOLOLiveService:
    def __init__(self, model_path='yolov8n.pt'):
        self.model_path = model_path
        self.model = None
        self.classes = []
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.camera = None
        self.is_running = False
        self.load_model()
        
    def load_model(self):
        try:
            print(f"Loading YOLO v8 model from {self.model_path}...")
            self.model = YOLO(self.model_path)
            self.classes = self.model.names
            print(f"✅ Model loaded successfully on {self.device}")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            self.download_and_load_model()
    
    def download_and_load_model(self):
        try:
            print("Downloading YOLO v8 nano model...")
            self.model = YOLO('yolov8n.pt')
            self.classes = self.model.names
            print("✅ Model downloaded and loaded successfully")
        except Exception as e:
            print(f"❌ Error downloading model: {e}")
            raise e
    
    def start_camera(self, camera_index=0):
        try:
            self.camera = cv2.VideoCapture(camera_index)
            if not self.camera.isOpened():
                raise Exception(f"Could not open camera {camera_index}")
            
            # Set camera properties
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.camera.set(cv2.CAP_PROP_FPS, 30)
            
            self.is_running = True
            print(f"✅ Camera {camera_index} started successfully")
            return True
        except Exception as e:
            print(f"❌ Error starting camera: {e}")
            return False
    
    def stop_camera(self):
        if self.camera:
            self.camera.release()
            self.camera = None
        self.is_running = False
        print("📹 Camera stopped")
    
    def get_frame_with_detections(self, confidence_threshold=0.5):
        if not self.camera or not self.is_running:
            return None
        
        ret, frame = self.camera.read()
        if not ret:
            return None
        
        # Run YOLO detection
        results = self.model(frame, conf=confidence_threshold)
        
        # Draw bounding boxes
        annotated_frame = results[0].plot()
        
        # Convert to base64
        _, buffer = cv2.imencode('.jpg', annotated_frame)
        frame_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # Get detection data
        detections = []
        boxes = results[0].boxes
        if boxes is not None:
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                confidence = float(box.conf[0].cpu().numpy())
                class_id = int(box.cls[0].cpu().numpy())
                
                detections.append({
                    'class': self.classes[class_id],
                    'confidence': round(confidence, 3),
                    'bbox': [int(x1), int(y1), int(x2-x1), int(y2-y1)],
                    'classId': class_id
                })
        
        return {
            'frame': frame_base64,
            'detections': detections,
            'timestamp': time.time()
        }
    
    def get_camera_info(self):
        if not self.camera:
            return {'available': False}
        
        return {
            'available': True,
            'width': int(self.camera.get(cv2.CAP_PROP_FRAME_WIDTH)),
            'height': int(self.camera.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            'fps': int(self.camera.get(cv2.CAP_PROP_FPS))
        }

def main():
    try:
        service = YOLOLiveService()
        
        # Read input from stdin
        input_data = sys.stdin.read().strip()
        
        if not input_data:
            print(json.dumps({
                'success': False,
                'error': 'No input data provided'
            }))
            return
        
        try:
            input_json = json.loads(input_data)
            action = input_json.get('action', 'info')
            camera_index = input_json.get('camera_index', 0)
            confidence = input_json.get('confidence', 0.5)
        except json.JSONDecodeError:
            action = 'info'
            camera_index = 0
            confidence = 0.5
        
        if action == 'start_camera':
            result = service.start_camera(camera_index)
            print(json.dumps({
                'success': result,
                'message': 'Camera started' if result else 'Failed to start camera'
            }))
        elif action == 'stop_camera':
            service.stop_camera()
            print(json.dumps({
                'success': True,
                'message': 'Camera stopped'
            }))
        elif action == 'get_frame':
            frame_data = service.get_frame_with_detections(confidence)
            if frame_data:
                print(json.dumps({
                    'success': True,
                    'frame': frame_data['frame'],
                    'detections': frame_data['detections'],
                    'timestamp': frame_data['timestamp']
                }))
            else:
                print(json.dumps({
                    'success': False,
                    'error': 'Could not get frame'
                }))
        elif action == 'camera_info':
            info = service.get_camera_info()
            print(json.dumps({
                'success': True,
                'camera_info': info
            }))
        elif action == 'info':
            print(json.dumps({
                'success': True,
                'model': 'YOLOv8n',
                'device': service.device,
                'classes': list(service.classes.values()),
                'num_classes': len(service.classes),
                'model_loaded': service.model is not None
            }))
        else:
            print(json.dumps({
                'success': False,
                'error': f'Unknown action: {action}'
            }))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'Service error: {str(e)}'
        }))

if __name__ == "__main__":
    main()
`;

    // Create python directory if it doesn't exist
    const pythonDir = path.dirname(this.pythonScriptPath);
    if (!fs.existsSync(pythonDir)) {
      fs.mkdirSync(pythonDir, { recursive: true });
    }

    // Write the Python service file
    fs.writeFileSync(this.pythonScriptPath, pythonServiceContent);
    console.log('✅ Python live service created');
  }

  async testPythonEnvironment() {
    return new Promise((resolve, reject) => {
      const python = spawn('python', ['-c', 'import ultralytics, cv2; print("OK")']);
      
      python.on('close', (code) => {
        if (code === 0) {
          this.pythonAvailable = true;
          resolve();
        } else {
          reject(new Error('Python ultralytics or opencv not installed. Run: pip install ultralytics opencv-python'));
        }
      });
      
      python.on('error', (error) => {
        reject(new Error(`Python not found: ${error.message}`));
      });
    });
  }

  isModelLoaded() {
    return this.isLoaded && this.model !== null;
  }

  async startCamera(cameraIndex = 0) {
    try {
      if (!this.isModelLoaded()) {
        throw new Error('YOLO v8 model not loaded');
      }

      const result = await this.callPythonService('', 'start_camera', 0, cameraIndex);
      return result;
    } catch (error) {
      throw new Error(`Camera start error: ${error.message}`);
    }
  }

  async stopCamera() {
    try {
      const result = await this.callPythonService('', 'stop_camera');
      return result;
    } catch (error) {
      throw new Error(`Camera stop error: ${error.message}`);
    }
  }

  async getFrameWithDetections(confidenceThreshold = 0.5) {
    try {
      if (!this.isModelLoaded()) {
        throw new Error('YOLO v8 model not loaded');
      }

      const result = await this.callPythonService('', 'get_frame', confidenceThreshold);
      return result;
    } catch (error) {
      throw new Error(`Frame detection error: ${error.message}`);
    }
  }

  async getCameraInfo() {
    try {
      const result = await this.callPythonService('', 'camera_info');
      return result;
    } catch (error) {
      throw new Error(`Camera info error: ${error.message}`);
    }
  }

  async callPythonService(imageData, action = 'info', confidence = 0.5, cameraIndex = 0) {
    return new Promise((resolve, reject) => {
      const python = spawn('python', [this.pythonScriptPath]);
      let result = '';
      let error = '';

      python.stdout.on('data', (data) => {
        result += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const parsedResult = JSON.parse(result);
            resolve(parsedResult);
          } catch (e) {
            reject(new Error(`Failed to parse Python service result: ${e.message}`));
          }
        } else {
          reject(new Error(`Python service error: ${error}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to start Python service: ${error.message}`));
      });

      // Send input data to Python script
      const inputData = {
        image_data: imageData,
        action: action,
        confidence: confidence,
        camera_index: cameraIndex
      };
      
      python.stdin.write(JSON.stringify(inputData));
      python.stdin.end();
    });
  }

  getModelInfo() {
    return {
      loaded: this.isModelLoaded(),
      modelPath: this.modelPath,
      version: 'YOLOv8n Live',
      inputSize: [640, 640],
      classes: this.classes,
      numClasses: this.classes.length,
      modelType: 'YOLOv8n Live',
      pythonAvailable: this.pythonAvailable
    };
  }
}

module.exports = new YOLOLiveService();
