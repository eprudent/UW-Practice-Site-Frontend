const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const claudeService = require('./services/claudeService');
const codexService = require('./services/codexService');
const yoloService = require('./services/yoloV8Service'); // Updated to use YOLO v8

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

// YOLO v8 API routes
app.post('/api/yolo/detect', async (req, res) => {
  try {
    const { imageData, confidence = 0.5 } = req.body;
    const detections = await yoloService.detectObjects(imageData, confidence);
    res.json(detections);
  } catch (error) {
    console.error('YOLO v8 detection error:', error);
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
    
    const detections = await yoloService.detectObjects(imageData, parseFloat(confidence));
    res.json(detections);
  } catch (error) {
    console.error('YOLO v8 upload detection error:', error);
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

app.post('/api/yolo/train', async (req, res) => {
  try {
    const { trainingData } = req.body;
    const result = await yoloService.trainModel(trainingData);
    res.json(result);
  } catch (error) {
    console.error('YOLO training error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/yolo/validate', async (req, res) => {
  try {
    const { testData } = req.body;
    const result = await yoloService.validateModel(testData);
    res.json(result);
  } catch (error) {
    console.error('YOLO validation error:', error);
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
  
  // Load YOLO v8 model on startup
  console.log('🔄 Initializing YOLO v8 model...');
  try {
    await yoloService.loadModel();
  } catch (error) {
    console.error('❌ Failed to load YOLO v8 model:', error.message);
    console.log('⚠️  Server will continue with limited functionality');
  }
});

module.exports = app;
