# YOLO Model Files

This directory should contain your YOLO model files for object detection.

## Required Files

- `yolo_model.weights` - Pre-trained YOLO weights file
- `yolo_config.cfg` - YOLO configuration file
- `yolo_classes.txt` - Class names file (one class per line)

## Getting YOLO Models

You can download pre-trained YOLO models from:
- [YOLO Official Website](https://pjreddie.com/darknet/yolo/)
- [OpenCV DNN Models](https://github.com/opencv/opencv/tree/master/samples/dnn)

## Example Structure

```
models/
├── yolo_model.weights
├── yolo_config.cfg
├── yolo_classes.txt
└── README.md
```

## Configuration

Set the model paths in your `.env` file:

```env
YOLO_MODEL_PATH=./models/yolo_model.weights
YOLO_CONFIG_PATH=./models/yolo_config.cfg
YOLO_CLASSES_PATH=./models/yolo_classes.txt
```

## Note

The YOLO service will work without these files but will only return mock detection results. For real object detection, you need to provide the actual model files.
