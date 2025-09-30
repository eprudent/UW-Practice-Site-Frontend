# UW-Practice-Site-Frontend

A comprehensive AI integration platform combining Node.js, Claude AI, OpenAI Codex, and YOLO object detection for advanced development workflows and machine learning practice.

## 🚀 Features

- **Claude AI Integration**: Advanced AI assistant for code generation, analysis, and refactoring
- **OpenAI Codex**: Code completion, generation, and optimization
- **YOLO Object Detection**: Real-time object detection and model training capabilities
- **Integrated Workflow**: Seamless AI-powered development pipeline
- **Modern Web Interface**: Responsive, user-friendly dashboard
- **RESTful API**: Complete API endpoints for all services
- **Testing Suite**: Comprehensive Jest testing framework

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **AI Services**: Anthropic Claude, OpenAI Codex
- **Machine Learning**: TensorFlow.js, YOLO
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Build Tools**: Webpack, Babel
- **Testing**: Jest
- **Image Processing**: Sharp

## 📋 Prerequisites

- Node.js (v18.0.0 or higher)
- npm or yarn
- API keys for:
  - Anthropic Claude API
  - OpenAI API

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd UW-Practice-Site-Frontend
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
# Claude API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# OpenAI API Configuration (for Codex)
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# YOLO Model Configuration (optional)
YOLO_MODEL_PATH=./models/yolo_model.weights
YOLO_CONFIG_PATH=./models/yolo_config.cfg
YOLO_CLASSES_PATH=./models/yolo_classes.txt
```

### 3. Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm start

# Build for production
npm run build
```

### 4. Access the Application

Open your browser and navigate to:
- **Web Interface**: http://localhost:3000
- **API Health Check**: http://localhost:3000/api/health

## 📚 API Documentation

### Claude AI Endpoints

#### Chat with Claude
```http
POST /api/claude/chat
Content-Type: application/json

{
  "message": "Your message here",
  "model": "claude-3-sonnet-20240229"
}
```

#### Generate Code
```http
POST /api/claude/code
Content-Type: application/json

{
  "prompt": "Create a React component for user authentication",
  "language": "javascript"
}
```

### Codex Endpoints

#### Complete Code
```http
POST /api/codex/complete
Content-Type: application/json

{
  "code": "function calculateSum(a, b) {",
  "language": "javascript"
}
```

#### Generate Code
```http
POST /api/codex/generate
Content-Type: application/json

{
  "prompt": "Create a sorting algorithm",
  "language": "javascript"
}
```

### YOLO Endpoints

#### Detect Objects
```http
POST /api/yolo/detect
Content-Type: application/json

{
  "imageData": "base64_encoded_image_data"
}
```

#### Check Model Status
```http
GET /api/yolo/status
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📁 Project Structure

```
UW-Practice-Site-Frontend/
├── src/
│   ├── services/
│   │   ├── claudeService.js      # Claude AI integration
│   │   ├── codexService.js       # OpenAI Codex integration
│   │   └── yoloService.js        # YOLO model service
│   ├── __tests__/                # Test files
│   └── index.js                  # Main server file
├── public/
│   ├── index.html                # Web interface
│   ├── styles.css                # Styling
│   └── script.js                 # Frontend JavaScript
├── models/                       # YOLO model files (optional)
├── uploads/                      # File upload directory
├── package.json                  # Dependencies and scripts
├── webpack.config.js             # Webpack configuration
├── jest.config.js                # Jest testing configuration
└── README.md                     # This file
```

## 🔧 Configuration

### Claude AI Models
- `claude-3-sonnet-20240229` (default)
- `claude-3-haiku-20240307`
- `claude-3-opus-20240229`

### Supported Languages
- JavaScript
- Python
- Java
- C++
- TypeScript
- And more...

## 🚀 Usage Examples

### 1. AI-Powered Code Generation

```javascript
// Generate a React component
const response = await fetch('/api/claude/code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Create a responsive navigation bar component',
    language: 'javascript'
  })
});
```

### 2. Code Analysis and Optimization

```javascript
// Analyze and optimize existing code
const response = await fetch('/api/codex/optimize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'your_code_here'
  })
});
```

### 3. Object Detection

```javascript
// Detect objects in an image
const response = await fetch('/api/yolo/detect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageData: 'base64_image_data'
  })
});
```

## 🔒 Security Considerations

- Store API keys securely in environment variables
- Never commit `.env` files to version control
- Implement rate limiting for production use
- Validate and sanitize all user inputs
- Use HTTPS in production environments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the test files for usage examples

## 🔮 Future Enhancements

- [ ] Real-time collaboration features
- [ ] Advanced YOLO model training interface
- [ ] Code version control integration
- [ ] Performance monitoring dashboard
- [ ] Multi-language support for the interface
- [ ] Docker containerization
- [ ] CI/CD pipeline setup

---

**Happy Coding with AI! 🚀🤖**
