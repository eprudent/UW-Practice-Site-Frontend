#!/usr/bin/env python3
"""
Ultralytics YOLO v8 Live Camera Service for Node.js Integration
Uses the official ultralytics package for real YOLO detection
"""

import cv2
import numpy as np
import base64
import json
import sys
import os
import time
from pathlib import Path

try:
    from ultralytics import YOLO
    import torch
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False
    print("Error: ultralytics not installed. Run: pip install ultralytics")

class UltralyticsYOLOService:
    def __init__(self, model_path='yolov8n.pt'):
        self.model_path = model_path
        self.model = None
        self.classes = []
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu' if ULTRALYTICS_AVAILABLE else 'cpu'
        self.camera = None
        self.is_running = False
        self.load_model()
        
    def load_model(self):
        if not ULTRALYTICS_AVAILABLE:
            print("Ultralytics not available, using fallback mode")
            return False
            
        try:
            print(f"Loading Ultralytics YOLO model from {self.model_path}...")
            self.model = YOLO(self.model_path)
            self.classes = self.model.names
            print(f"✅ Ultralytics YOLO model loaded successfully on {self.device}")
            print(f"📊 Classes available: {len(self.classes)}")
            return True
        except Exception as e:
            print(f"❌ Error loading Ultralytics model: {e}")
            try:
                print("🔄 Attempting to download model...")
                self.model = YOLO('yolov8n.pt')  # This will auto-download
                self.classes = self.model.names
                print("✅ Model downloaded and loaded successfully")
                return True
            except Exception as e2:
                print(f"❌ Error downloading model: {e2}")
                return False
    
    def start_camera(self, camera_index=0):
        try:
            self.camera = cv2.VideoCapture(camera_index)
            if not self.camera.isOpened():
                raise Exception(f"Could not open camera {camera_index}")
            
            # Set camera properties for optimal performance
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.camera.set(cv2.CAP_PROP_FPS, 30)
            self.camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Reduce buffer for real-time
            
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
        
        if not ULTRALYTICS_AVAILABLE or not self.model:
            # Fallback: return frame without detections
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            return {
                'frame': frame_base64,
                'detections': [],
                'timestamp': time.time(),
                'model': 'Fallback Mode'
            }
        
        # Run Ultralytics YOLO detection
        try:
            results = self.model(frame, conf=confidence_threshold, verbose=False)
            
            # Draw bounding boxes using Ultralytics built-in plotting
            annotated_frame = results[0].plot()
            
            # Convert to base64
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Extract detection data
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
                        'classId': class_id,
                        'center': [int((x1 + x2) / 2), int((y1 + y2) / 2)]
                    })
            
            return {
                'frame': frame_base64,
                'detections': detections,
                'timestamp': time.time(),
                'model': 'Ultralytics YOLOv8n',
                'device': self.device
            }
            
        except Exception as e:
            print(f"Detection error: {e}")
            # Return frame without detections on error
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            return {
                'frame': frame_base64,
                'detections': [],
                'timestamp': time.time(),
                'model': 'Ultralytics YOLOv8n (Error)',
                'error': str(e)
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
    
    def get_model_info(self):
        return {
            'ultralytics_available': ULTRALYTICS_AVAILABLE,
            'model_loaded': self.model is not None,
            'device': self.device,
            'classes': list(self.classes.values()) if self.classes else [],
            'num_classes': len(self.classes),
            'model_path': self.model_path
        }

def main():
    try:
        service = UltralyticsYOLOService()
        
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
                'message': 'Camera started' if result else 'Failed to start camera',
                'model_info': service.get_model_info()
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
                    'timestamp': frame_data['timestamp'],
                    'model': frame_data.get('model', 'Unknown'),
                    'device': frame_data.get('device', 'Unknown')
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
        elif action == 'model_info':
            info = service.get_model_info()
            print(json.dumps({
                'success': True,
                'model_info': info
            }))
        elif action == 'info':
            model_info = service.get_model_info()
            print(json.dumps({
                'success': True,
                'model': 'Ultralytics YOLOv8n',
                'device': service.device,
                'classes': list(service.classes.values()),
                'num_classes': len(service.classes),
                'model_loaded': service.model is not None,
                'ultralytics_available': ULTRALYTICS_AVAILABLE,
                'model_info': model_info
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
