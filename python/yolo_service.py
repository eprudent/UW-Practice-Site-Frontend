#!/usr/bin/env python3
"""
YOLO v8 Service for Node.js Integration
Handles object detection using Ultralytics YOLO v8
"""

import cv2
import numpy as np
import base64
import json
import sys
import os
from pathlib import Path

try:
    from ultralytics import YOLO
    import torch
except ImportError:
    print("Error: ultralytics not installed. Run: pip install ultralytics")
    sys.exit(1)

class YOLOV8Service:
    def __init__(self, model_path='yolov8n.pt'):
        """Initialize YOLO v8 service with model"""
        self.model_path = model_path
        self.model = None
        self.classes = []
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.load_model()
        
    def load_model(self):
        """Load YOLO v8 model"""
        try:
            print(f"Loading YOLO v8 model from {self.model_path}...")
            self.model = YOLO(self.model_path)
            self.classes = self.model.names
            print(f"✅ Model loaded successfully on {self.device}")
            print(f"Classes: {len(self.classes)} classes available")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            # Fallback to downloading model
            self.download_and_load_model()
    
    def download_and_load_model(self):
        """Download and load YOLO v8 model if not found"""
        try:
            print("Downloading YOLO v8 nano model...")
            self.model = YOLO('yolov8n.pt')  # This will auto-download
            self.classes = self.model.names
            print("✅ Model downloaded and loaded successfully")
        except Exception as e:
            print(f"❌ Error downloading model: {e}")
            raise e
    
    def detect_objects(self, image_data, confidence_threshold=0.5):
        """Detect objects in image using YOLO v8"""
        try:
            # Decode base64 image
            if isinstance(image_data, str):
                if image_data.startswith('data:image'):
                    image_data = image_data.split(',')[1]
                
                image_bytes = base64.b64decode(image_data)
            else:
                image_bytes = image_data
            
            # Convert to OpenCV format
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                return {
                    'success': False,
                    'error': 'Could not decode image'
                }
            
            # Run YOLO v8 detection
            results = self.model(image, conf=confidence_threshold)
            
            detections = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Get bounding box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0].cpu().numpy())
                        class_id = int(box.cls[0].cpu().numpy())
                        
                        # Calculate width and height
                        width = x2 - x1
                        height = y2 - y1
                        
                        detections.append({
                            'class': self.classes[class_id],
                            'confidence': round(confidence, 3),
                            'bbox': [int(x1), int(y1), int(width), int(height)],
                            'classId': class_id,
                            'center': [int((x1 + x2) / 2), int((y1 + y2) / 2)]
                        })
            
            return {
                'success': True,
                'detections': detections,
                'model': 'YOLOv8n',
                'device': self.device,
                'confidence_threshold': confidence_threshold,
                'image_size': [image.shape[1], image.shape[0]],
                'num_detections': len(detections)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'model': 'YOLOv8n'
            }
    
    def get_model_info(self):
        """Get model information"""
        return {
            'success': True,
            'model': 'YOLOv8n',
            'device': self.device,
            'classes': list(self.classes.values()),
            'num_classes': len(self.classes),
            'model_loaded': self.model is not None
        }
    
    def get_supported_classes(self):
        """Get list of supported classes"""
        return {
            'success': True,
            'classes': list(self.classes.values()),
            'num_classes': len(self.classes),
            'description': 'COCO dataset classes (80 classes)'
        }

def main():
    """Main function for command line usage"""
    try:
        # Initialize service
        service = YOLOV8Service()
        
        # Read input from stdin
        input_data = sys.stdin.read().strip()
        
        if not input_data:
            print(json.dumps({
                'success': False,
                'error': 'No input data provided'
            }))
            return
        
        # Parse input
        try:
            input_json = json.loads(input_data)
            image_data = input_json.get('image_data', '')
            confidence = input_json.get('confidence', 0.5)
            action = input_json.get('action', 'detect')
        except json.JSONDecodeError:
            # Assume raw image data
            image_data = input_data
            confidence = 0.5
            action = 'detect'
        
        # Handle different actions
        if action == 'detect':
            result = service.detect_objects(image_data, confidence)
        elif action == 'info':
            result = service.get_model_info()
        elif action == 'classes':
            result = service.get_supported_classes()
        else:
            result = {
                'success': False,
                'error': f'Unknown action: {action}'
            }
        
        # Output result
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'Service error: {str(e)}'
        }))

if __name__ == "__main__":
    main()
