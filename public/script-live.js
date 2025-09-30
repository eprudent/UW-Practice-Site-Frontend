// Global variables
let currentImageData = null;
let yoloClasses = [];
let cameraActive = false;
let detectionActive = false;
let detectionInterval = null;
let currentDetections = [];
let frameCount = 0;
let lastFrameTime = Date.now();

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkSystemStatus();
    loadYOLOClasses();
    
    // Update confidence slider
    const confidenceSlider = document.getElementById('live-confidence-slider');
    if (confidenceSlider) {
        confidenceSlider.addEventListener('input', function() {
            document.getElementById('live-confidence-value').textContent = this.value;
        });
    }
    
    // Update detection interval slider
    const intervalSlider = document.getElementById('detection-interval');
    if (intervalSlider) {
        intervalSlider.addEventListener('input', function() {
            document.getElementById('interval-value').textContent = this.value;
        });
    }
});

// Tab switching functionality
function switchTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Stop detection when switching away from live camera
    if (tabName !== 'live-camera' && detectionActive) {
        stopLiveDetection();
    }
}

// Check system status
async function checkSystemStatus() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        updateStatusIndicator('claude-status', data.services.claude);
        updateStatusIndicator('codex-status', data.services.codex);
        updateStatusIndicator('yolo-status', data.services.yolo);
        
        // Update YOLO status with more details
        if (data.services.yoloInfo) {
            const yoloStatus = document.getElementById('yolo-status');
            yoloStatus.textContent = data.services.yoloInfo.pythonAvailable ? 'Live Ready' : 'Not Ready';
            yoloStatus.className = `status-value ${data.services.yolo ? 'connected' : 'disconnected'}`;
        }
    } catch (error) {
        console.error('Error checking system status:', error);
        updateStatusIndicator('claude-status', false);
        updateStatusIndicator('codex-status', false);
        updateStatusIndicator('yolo-status', false);
    }
}

function updateStatusIndicator(elementId, isConnected) {
    const element = document.getElementById(elementId);
    element.textContent = isConnected ? 'Connected' : 'Disconnected';
    element.className = `status-value ${isConnected ? 'connected' : 'disconnected'}`;
}

// Load YOLO classes
async function loadYOLOClasses() {
    try {
        const response = await fetch('/api/yolo/classes');
        const data = await response.json();
        
        if (data.success) {
            yoloClasses = data.classes;
            console.log(`Loaded ${yoloClasses.length} YOLO classes`);
        }
    } catch (error) {
        console.error('Error loading YOLO classes:', error);
    }
}

// Camera functions
async function startCamera() {
    const responseArea = document.getElementById('live-response');
    const statusElement = document.getElementById('camera-status');
    const startBtn = document.getElementById('start-camera-btn');
    const stopBtn = document.getElementById('stop-camera-btn');
    
    showLoading(responseArea, 'Starting camera...');
    
    try {
        const response = await fetch('/api/yolo/start-camera', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cameraIndex: 0 })
        });
        
        const data = await response.json();
        
        if (data.success) {
            cameraActive = true;
            statusElement.textContent = 'Camera: Active';
            statusElement.className = 'camera-status active';
            startBtn.disabled = true;
            stopBtn.disabled = false;
            document.getElementById('start-detection-btn').disabled = false;
            
            showSuccess(responseArea, 'Camera started successfully!');
            getCameraInfo();
        } else {
            throw new Error(data.message || 'Failed to start camera');
        }
    } catch (error) {
        showError(responseArea, 'Error starting camera: ' + error.message);
    }
}

async function stopCamera() {
    const responseArea = document.getElementById('live-response');
    const statusElement = document.getElementById('camera-status');
    const startBtn = document.getElementById('start-camera-btn');
    const stopBtn = document.getElementById('stop-camera-btn');
    
    // Stop detection first
    if (detectionActive) {
        stopLiveDetection();
    }
    
    try {
        const response = await fetch('/api/yolo/stop-camera', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        cameraActive = false;
        statusElement.textContent = 'Camera: Stopped';
        statusElement.className = 'camera-status inactive';
        startBtn.disabled = false;
        stopBtn.disabled = true;
        document.getElementById('start-detection-btn').disabled = true;
        document.getElementById('stop-detection-btn').disabled = true;
        document.getElementById('analyze-btn').disabled = true;
        
        // Hide camera feed
        document.getElementById('camera-feed').style.display = 'none';
        document.getElementById('detection-stats').style.display = 'none';
        document.getElementById('analysis-section').style.display = 'none';
        
        showSuccess(responseArea, 'Camera stopped successfully!');
    } catch (error) {
        showError(responseArea, 'Error stopping camera: ' + error.message);
    }
}

async function getCameraInfo() {
    const responseArea = document.getElementById('live-response');
    
    try {
        const response = await fetch('/api/yolo/camera-info');
        const data = await response.json();
        
        if (data.success && data.camera_info.available) {
            const info = data.camera_info;
            showSuccess(responseArea, `Camera Info: ${info.width}x${info.height} @ ${info.fps}fps`);
        } else {
            showError(responseArea, 'Camera not available');
        }
    } catch (error) {
        showError(responseArea, 'Error getting camera info: ' + error.message);
    }
}

// Live detection functions
async function startLiveDetection() {
    if (!cameraActive) {
        showError(document.getElementById('live-response'), 'Please start camera first');
        return;
    }
    
    const responseArea = document.getElementById('live-response');
    const startBtn = document.getElementById('start-detection-btn');
    const stopBtn = document.getElementById('stop-detection-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    
    detectionActive = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    analyzeBtn.disabled = false;
    
    document.getElementById('detection-stats').style.display = 'grid';
    document.getElementById('analysis-section').style.display = 'block';
    
    showSuccess(responseArea, 'Live detection started!');
    
    // Start detection loop
    const interval = parseInt(document.getElementById('detection-interval').value);
    detectionInterval = setInterval(async () => {
        await performDetection();
    }, interval);
}

function stopLiveDetection() {
    detectionActive = false;
    
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
    
    document.getElementById('start-detection-btn').disabled = false;
    document.getElementById('stop-detection-btn').disabled = true;
    document.getElementById('analyze-btn').disabled = true;
    
    showSuccess(document.getElementById('live-response'), 'Live detection stopped!');
}

async function performDetection() {
    if (!detectionActive || !cameraActive) return;
    
    try {
        const confidence = parseFloat(document.getElementById('live-confidence-slider').value);
        const response = await fetch(`/api/yolo/frame?confidence=${confidence}`);
        const data = await response.json();
        
        if (data.success) {
            // Update camera feed
            const cameraFeed = document.getElementById('camera-feed');
            cameraFeed.src = 'data:image/jpeg;base64,' + data.frame;
            cameraFeed.style.display = 'block';
            
            // Update detections
            currentDetections = data.detections || [];
            updateDetectionStats();
            drawDetectionBoxes();
            
            // Update FPS
            frameCount++;
            const now = Date.now();
            const fps = Math.round(1000 / (now - lastFrameTime));
            document.getElementById('fps-counter').textContent = fps;
            lastFrameTime = now;
        }
    } catch (error) {
        console.error('Detection error:', error);
    }
}

function updateDetectionStats() {
    document.getElementById('objects-count').textContent = currentDetections.length;
    document.getElementById('last-detection').textContent = new Date().toLocaleTimeString();
}

function drawDetectionBoxes() {
    const overlay = document.getElementById('detection-overlay');
    overlay.innerHTML = '';
    
    currentDetections.forEach(detection => {
        const box = document.createElement('div');
        box.className = 'detection-box';
        box.style.left = detection.bbox[0] + 'px';
        box.style.top = detection.bbox[1] + 'px';
        box.style.width = detection.bbox[2] + 'px';
        box.style.height = detection.bbox[3] + 'px';
        box.textContent = `${detection.class} (${(detection.confidence * 100).toFixed(1)}%)`;
        overlay.appendChild(box);
    });
}

async function analyzeCurrentDetections() {
    if (currentDetections.length === 0) {
        showError(document.getElementById('live-analysis'), 'No detections to analyze');
        return;
    }
    
    const analysisArea = document.getElementById('live-analysis');
    showLoading(analysisArea, 'Analyzing detections with AI...');
    
    try {
        const response = await fetch('/api/yolo/analyze-detections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                detections: currentDetections,
                prompt: 'Analyze the objects detected in this live camera feed and provide insights about what you see.'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            let html = `
                <div class="success">
                    <h4>🤖 AI Analysis of Live Detection</h4>
                    <p><strong>Objects Detected:</strong> ${data.objectsDescription}</p>
                </div>
                <div class="analysis-content">
                    ${data.analysis}
                </div>
            `;
            analysisArea.innerHTML = html;
        } else {
            showError(analysisArea, data.error);
        }
    } catch (error) {
        showError(analysisArea, 'Error analyzing detections: ' + error.message);
    }
}

// Static image detection functions (from previous implementation)
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        currentImageData = e.target.result;
        const preview = document.getElementById('image-preview');
        preview.innerHTML = `<img src="${currentImageData}" alt="Uploaded image">`;
        document.getElementById('detect-btn').disabled = false;
        
        // Show image info
        const img = new Image();
        img.onload = function() {
            document.getElementById('image-info').innerHTML = `
                <small>Image: ${file.name} (${img.width}x${img.height})</small>
            `;
        };
        img.src = currentImageData;
    };
    reader.readAsDataURL(file);
}

async function detectObjects() {
    const responseArea = document.getElementById('yolo-response');
    const confidenceSlider = document.getElementById('confidence-slider');
    const confidenceValue = confidenceSlider ? confidenceSlider.value : 0.5;
    
    if (!currentImageData) {
        showError(responseArea, 'Please upload an image first');
        return;
    }
    
    showLoading(responseArea, `Detecting objects with YOLO v8 (confidence: ${confidenceValue})...`);
    
    try {
        const response = await fetch('/api/yolo/detect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                imageData: currentImageData,
                confidence: parseFloat(confidenceValue)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showYOLODetections(responseArea, data);
        } else {
            showError(responseArea, data.error);
        }
    } catch (error) {
        showError(responseArea, 'Error detecting objects: ' + error.message);
    }
}

async function detectObjectsWithFile() {
    const fileInput = document.getElementById('file-upload');
    const responseArea = document.getElementById('yolo-response');
    const confidenceSlider = document.getElementById('confidence-slider');
    const confidenceValue = confidenceSlider ? confidenceSlider.value : 0.5;
    
    if (!fileInput.files[0]) {
        showError(responseArea, 'Please select an image file');
        return;
    }
    
    showLoading(responseArea, `Detecting objects with YOLO v8 (confidence: ${confidenceValue})...`);
    
    try {
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        formData.append('confidence', confidenceValue);
        
        const response = await fetch('/api/yolo/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showYOLODetections(responseArea, data);
        } else {
            showError(responseArea, data.error);
        }
    } catch (error) {
        showError(responseArea, 'Error detecting objects: ' + error.message);
    }
}

async function getYOLOStatus() {
    const responseArea = document.getElementById('yolo-response');
    
    showLoading(responseArea, 'Getting YOLO v8 status...');
    
    try {
        const response = await fetch('/api/yolo/status');
        const data = await response.json();
        
        if (data.status) {
            showYOLOStatus(responseArea, data);
        } else {
            showError(responseArea, 'Failed to get YOLO status');
        }
    } catch (error) {
        showError(responseArea, 'Error getting YOLO status: ' + error.message);
    }
}

async function getYOLOClasses() {
    const responseArea = document.getElementById('yolo-response');
    
    showLoading(responseArea, 'Loading YOLO classes...');
    
    try {
        const response = await fetch('/api/yolo/classes');
        const data = await response.json();
        
        if (data.success) {
            showYOLOClasses(responseArea, data);
        } else {
            showError(responseArea, data.error);
        }
    } catch (error) {
        showError(responseArea, 'Error loading YOLO classes: ' + error.message);
    }
}

// Claude AI functions (from previous implementation)
async function sendToClaude() {
    const input = document.getElementById('claude-input').value;
    const responseArea = document.getElementById('claude-response');
    
    if (!input.trim()) {
        showError(responseArea, 'Please enter a message');
        return;
    }
    
    showLoading(responseArea, 'Sending to Claude...');
    
    try {
        const response = await fetch('/api/claude/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: input })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(responseArea, data.content);
        } else {
            showError(responseArea, data.error);
        }
    } catch (error) {
        showError(responseArea, 'Error communicating with Claude: ' + error.message);
    }
}

async function generateCodeWithClaude() {
    const prompt = document.getElementById('claude-code-prompt').value;
    const language = document.getElementById('claude-language').value;
    const responseArea = document.getElementById('claude-response');
    
    if (!prompt.trim()) {
        showError(responseArea, 'Please enter a code generation prompt');
        return;
    }
    
    showLoading(responseArea, 'Generating code with Claude...');
    
    try {
        const response = await fetch('/api/claude/code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt, language })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showCode(responseArea, data.code, language);
        } else {
            showError(responseArea, data.error);
        }
    } catch (error) {
        showError(responseArea, 'Error generating code: ' + error.message);
    }
}

// Codex functions (from previous implementation)
async function completeWithCodex() {
    const code = document.getElementById('codex-input').value;
    const responseArea = document.getElementById('codex-response');
    
    if (!code.trim()) {
        showError(responseArea, 'Please enter code to complete');
        return;
    }
    
    showLoading(responseArea, 'Completing code with Codex...');
    
    try {
        const response = await fetch('/api/codex/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showCode(responseArea, data.completion, 'javascript');
        } else {
            showError(responseArea, data.error);
        }
    } catch (error) {
        showError(responseArea, 'Error completing code: ' + error.message);
    }
}

async function generateWithCodex() {
    const prompt = document.getElementById('codex-input').value;
    const responseArea = document.getElementById('codex-response');
    
    if (!prompt.trim()) {
        showError(responseArea, 'Please enter a generation prompt');
        return;
    }
    
    showLoading(responseArea, 'Generating code with Codex...');
    
    try {
        const response = await fetch('/api/codex/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showCode(responseArea, data.code, 'javascript');
        } else {
            showError(responseArea, data.error);
        }
    } catch (error) {
        showError(responseArea, 'Error generating code: ' + error.message);
    }
}

async function analyzeWithCodex() {
    const code = document.getElementById('codex-analyze').value;
    const responseArea = document.getElementById('codex-response');
    
    if (!code.trim()) {
        showError(responseArea, 'Please enter code to analyze');
        return;
    }
    
    showLoading(responseArea, 'Analyzing code with Codex...');
    
    try {
        const response = await fetch('/api/codex/explain', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(responseArea, data.explanation);
        } else {
            showError(responseArea, data.error);
        }
    } catch (error) {
        showError(responseArea, 'Error analyzing code: ' + error.message);
    }
}

async function optimizeWithCodex() {
    const code = document.getElementById('codex-analyze').value;
    const responseArea = document.getElementById('codex-response');
    
    if (!code.trim()) {
        showError(responseArea, 'Please enter code to optimize');
        return;
    }
    
    showLoading(responseArea, 'Optimizing code with Codex...');
    
    try {
        const response = await fetch('/api/codex/optimize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showCode(responseArea, data.optimizedCode, 'javascript');
        } else {
            showError(responseArea, data.error);
        }
    } catch (error) {
        showError(responseArea, 'Error optimizing code: ' + error.message);
    }
}

// Integrated workflow functions (from previous implementation)
async function startWorkflow() {
    const prompt = document.getElementById('workflow-prompt').value;
    const responseArea = document.getElementById('workflow-response');
    
    if (!prompt.trim()) {
        showError(responseArea, 'Please enter a project description');
        return;
    }
    
    showLoading(responseArea, 'Starting AI-powered workflow...');
    
    try {
        // Step 1: Generate initial code with Claude
        const claudeResponse = await fetch('/api/claude/code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, language: 'javascript' })
        });
        const claudeData = await claudeResponse.json();
        
        if (claudeData.success) {
            document.getElementById('workflow-code').textContent = claudeData.code;
            
            // Step 2: Optimize with Codex
            const codexResponse = await fetch('/api/codex/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: claudeData.code })
            });
            const codexData = await codexResponse.json();
            
            if (codexData.success) {
                document.getElementById('workflow-tests').textContent = 'Generated optimized code and test cases:\n\n' + codexData.optimizedCode;
                showSuccess(responseArea, 'AI workflow completed successfully! Check the code sections above.');
            } else {
                showError(responseArea, 'Error in optimization step: ' + codexData.error);
            }
        } else {
            showError(responseArea, 'Error in code generation step: ' + claudeData.error);
        }
    } catch (error) {
        showError(responseArea, 'Error in workflow: ' + error.message);
    }
}

// Utility functions
function showLoading(element, message) {
    element.innerHTML = `<div class="loading"></div>${message}`;
}

function showError(element, message) {
    element.innerHTML = `<div class="error">Error: ${message}</div>`;
}

function showSuccess(element, message) {
    element.innerHTML = `<div class="success">${message}</div>`;
}

function showCode(element, code, language) {
    element.innerHTML = `<div class="success">Generated ${language} code:</div><pre><code>${code}</code></pre>`;
}

function showYOLODetections(element, data) {
    let html = `
        <div class="success">
            <h4>🎯 YOLO v8 Detection Results</h4>
            <p><strong>Model:</strong> ${data.model || 'YOLOv8n'}</p>
            <p><strong>Device:</strong> ${data.device || 'CPU'}</p>
            <p><strong>Confidence Threshold:</strong> ${data.confidenceThreshold || 0.5}</p>
            <p><strong>Detections Found:</strong> ${data.numDetections || data.detections.length}</p>
        </div>
    `;
    
    if (data.detections && data.detections.length > 0) {
        html += '<div class="detections-list">';
        data.detections.forEach((detection, index) => {
            const confidencePercent = (detection.confidence * 100).toFixed(1);
            html += `
                <div class="detection-item">
                    <div class="detection-header">
                        <span class="detection-class">${detection.class}</span>
                        <span class="detection-confidence">${confidencePercent}%</span>
                    </div>
                    <div class="detection-bbox">
                        <small>Bounding Box: [${detection.bbox.join(', ')}]</small>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    } else {
        html += '<div class="no-detections">No objects detected above confidence threshold</div>';
    }
    
    element.innerHTML = html;
}

function showYOLOStatus(element, data) {
    let html = `
        <div class="success">
            <h4>📊 YOLO v8 Status</h4>
            <p><strong>Status:</strong> ${data.status}</p>
            <p><strong>Model:</strong> ${data.modelInfo?.version || 'Unknown'}</p>
            <p><strong>Input Size:</strong> ${data.modelInfo?.inputSize?.join('x') || 'Unknown'}</p>
            <p><strong>Classes:</strong> ${data.modelInfo?.numClasses || 0}</p>
            <p><strong>Python Available:</strong> ${data.modelInfo?.pythonAvailable ? 'Yes' : 'No'}</p>
        </div>
    `;
    
    element.innerHTML = html;
}

function showYOLOClasses(element, data) {
    let html = `
        <div class="success">
            <h4>🎯 YOLO v8 Classes</h4>
            <p><strong>Total Classes:</strong> ${data.totalClasses || data.classes.length}</p>
            <p><strong>Description:</strong> ${data.description || 'COCO dataset classes'}</p>
        </div>
        <div class="classes-grid">
    `;
    
    if (data.classes && data.classes.length > 0) {
        data.classes.forEach((className, index) => {
            html += `<span class="class-item">${index + 1}. ${className}</span>`;
        });
    }
    
    html += '</div>';
    element.innerHTML = html;
}
