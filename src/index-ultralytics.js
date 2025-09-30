const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const claudeService = require('./services/claudeService');
const codexService = require('./services/codexService');
const yoloService = require('./services/yoloUltralyticsService'); // Updated to use Ultralytics service

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Claude API routes
app.post('/api/claude/chat', async (req, res) => {
  try {
    const { message, model = 'claude-3-sonnet-20240229' } = req.body;
    const response = await claudeService.chat(message, model);
    res.json(response);
  } catch (error) {
    console.error('Claude API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/claude/code', async (req, res) => {
  try {
    const { prompt, language = 'javascript' } = req.body;
    const response = await claudeService.generateCode(prompt, language);
    res.json(response);
  } catch (error) {
    console.error('Claude Code generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Codex API routes
app.post('/api/codex/complete', async (req, res) => {
  try {
    const { code, language = 'javascript' } = req.body;
    const response = await codexService.completeCode(code, language);
    res.json(response);
  } catch (error) {
    console.error('Codex completion error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/codex/generate', async (req, res) => {
  try {
    const { prompt, language = 'javascript' } = req.body;
    const response = await codexService.generateCode(prompt, language);
    res.json(response);
  } catch (error) {
    console.error('Codex generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ultralytics YOLO v8 Live Camera API routes
app.post('/api/yolo/start-camera', async (req, res) => {
  try {
    const { cameraIndex = 0 } = req.body;
    const result = await yoloService.startCamera(cameraIndex);
    res.json(result);
  } catch (error) {
    console.error('YOLO camera start error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/yolo/stop-camera', async (req, res) => {
  try {
    const result = await yoloService.stopCamera();
    res.json(result);
  } catch (error) {
    console.error('YOLO camera stop error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/yolo/frame', async (req, res) => {
  try {
    const { confidence = 0.5 } = req.query;
    const result = await yoloService.getFrameWithDetections(parseFloat(confidence));
    res.json(result);
  } catch (error) {
    console.error('YOLO frame detection error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/yolo/camera-info', async (req, res) => {
  try {
    const result = await yoloService.getCameraInfo();
    res.json(result);
  } catch (error) {
    console.error('YOLO camera info error:', error);
    res.status(500).json({ error: error.message });
  }
});

// YOLO Static Image Detection
app.post('/api/yolo/detect', async (req, res) => {
  try {
    const { imageData, confidence = 0.5 } = req.body;
    const detections = await yoloService.getFrameWithDetections(confidence);
    res.json(detections);
  } catch (error) {
    console.error('YOLO detection error:', error);
    res.status(500).json({ error: error.message });
  }
});

// File upload route for YOLO detection
app.post('/api/yolo/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Convert buffer to base64
    const imageData = req.file.buffer.toString('base64');
    const { confidence = 0.5 } = req.body;
    
    const detections = await yoloService.getFrameWithDetections(parseFloat(confidence));
    res.json(detections);
  } catch (error) {
    console.error('YOLO upload detection error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/yolo/status', (req, res) => {
  const modelInfo = yoloService.getModelInfo();
  res.json({ 
    status: modelInfo.loaded ? 'loaded' : 'not loaded',
    modelInfo: modelInfo,
    modelPath: process.env.YOLO_MODEL_PATH || 'not configured'
  });
});

app.get('/api/yolo/classes', async (req, res) => {
  try {
    const classes = await yoloService.getSupportedClasses();
    res.json(classes);
  } catch (error) {
    console.error('YOLO classes error:', error);
    res.status(500).json({ error: error.message });
  }
});

// LLM Integration for YOLO detections
app.post('/api/yolo/analyze-detections', async (req, res) => {
  try {
    const { detections, prompt } = req.body;
    
    if (!detections || detections.length === 0) {
      return res.json({
        success: true,
        analysis: "No objects detected in the image.",
        detections: []
      });
    }

    // Create a description of detected objects
    const objectsDescription = detections.map(det => 
      `${det.class} (${(det.confidence * 100).toFixed(1)}% confidence)`
    ).join(', ');

    // Use Claude to analyze the detections
    const analysisPrompt = prompt || `I detected the following objects in an image: ${objectsDescription}. 
    Please provide a detailed analysis of what you see, including:
    1. What the scene likely contains
    2. Any interesting observations about the objects
    3. Potential context or activities happening
    4. Any safety or practical considerations`;

    const claudeResponse = await claudeService.chat(analysisPrompt);
    
    res.json({
      success: true,
      analysis: claudeResponse.content,
      detections: detections,
      objectsDescription: objectsDescription
    });
  } catch (error) {
    console.error('YOLO analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  const modelInfo = yoloService.getModelInfo();
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      claude: !!process.env.ANTHROPIC_API_KEY,
      codex: !!process.env.OPENAI_API_KEY,
      yolo: modelInfo.loaded,
      yoloInfo: modelInfo
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server and load YOLO model
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Web interface: http://localhost:${PORT}`);
  
  // Load Ultralytics YOLO v8 model on startup
  console.log('🔄 Initializing Ultralytics YOLO v8 model...');
  try {
    await yoloService.loadModel();
  } catch (error) {
    console.error('❌ Failed to load Ultralytics YOLO v8 model:', error.message);
    console.log('⚠️  Server will continue with limited functionality');
  }
});

module.exports = app;
