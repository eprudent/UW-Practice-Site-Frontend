// Global variables
let currentImageData = null;
let yoloClasses = [];
let cameraActive = false;
let detectionActive = false;
let detectionInterval = null;
let currentDetections = [];
let frameCount = 0;
let lastFrameTime = Date.now();
let totalDetections = 0;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkSystemStatus();
    loadYOLOClasses();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Confidence slider
    const confidenceSlider = document.getElementById('confidence-slider');
    if (confidenceSlider) {
        confidenceSlider.addEventListener('input', function() {
            document.getElementById('confidence-value').textContent = this.value;
        });
    }
    
    // Detection interval slider
    const intervalSlider = document.getElementById('detection-interval');
    if (intervalSlider) {
        intervalSlider.addEventListener('input', function() {
            document.getElementById('interval-value').textContent = this.value + 'ms';
        });
    }
}

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
    
    // Stop detection when switching away from YOLO tab
    if (tabName !== 'yolo' && detectionActive) {
        stopLiveDetection();
    }
}

// System status check
async function checkSystemStatus() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        // Update AI status
        const aiStatus = document.getElementById('ai-status');
        const aiStatusItem = document.getElementById('ai-status-item');
        const claudeAvailable = data.services.claude;
        const codexAvailable = data.services.codex;
        
        if (claudeAvailable && codexAvailable) {
            aiStatus.textContent = 'Active';
            aiStatusItem.classList.add('active');
            aiStatus.classList.add('active');
        } else {
            aiStatus.textContent = 'Partial';
            aiStatusItem.classList.remove('active');
            aiStatus.classList.remove('active');
        }
        
        // Update YOLO status
        const yoloStatus = document.getElementById('yolo-status');
        const yoloStatusItem = document.getElementById('yolo-status-item');
        
        if (data.services.yolo) {
            yoloStatus.textContent = 'Active';
            yoloStatusItem.classList.add('active');
            yoloStatus.classList.add('active');
        } else {
            yoloStatus.textContent = 'Inactive';
            yoloStatusItem.classList.remove('active');
            yoloStatus.classList.remove('active');
        }
        
    } catch (error) {
        console.error('Error checking system status:', error);
    }
}

// Load YOLO classes
async function loadYOLOClasses() {
    try {
        const response = await fetch('/api/yolo/classes');
        const data = await response.json();
        
        if (data.success) {
            yoloClasses = data.classes;
            console.log('YOLO classes loaded:', yoloClasses.length);
        }
    } catch (error) {
        console.error('Error loading YOLO classes:', error);
    }
}

// AI Functions (Combined Claude + Codex)
async function sendClaudeMessage() {
    const message = document.getElementById('claude-message').value;
    const model = document.getElementById('claude-model').value;
    const responseArea = document.getElementById('ai-response');
    
    if (!message.trim()) {
        showError(responseArea, 'Please enter a message');
        return;
    }
    
    showLoading(responseArea, 'Sending message to Claude...');
    
    try {
        const response = await fetch('/api/claude/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, model })
        });
        
        const data = await response.json();
        
        if (data.content) {
            showSuccess(responseArea, `Claude Response:\n\n${data.content}`);
        } else {
            throw new Error(data.error || 'No response from Claude');
        }
    } catch (error) {
        showError(responseArea, 'Error: ' + error.message);
    }
}

async function generateCode() {
    const prompt = document.getElementById('codex-prompt').value;
    const language = document.getElementById('codex-language').value;
    const responseArea = document.getElementById('ai-response');
    
    if (!prompt.trim()) {
        showError(responseArea, 'Please enter a code prompt');
        return;
    }
    
    showLoading(responseArea, 'Generating code with Codex...');
    
    try {
        const response = await fetch('/api/codex/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, language })
        });
        
        const data = await response.json();
        
        if (data.code) {
            showCode(responseArea, `Generated ${language.toUpperCase()} Code:\n\n${data.code}`);
        } else {
            throw new Error(data.error || 'No code generated');
        }
    } catch (error) {
        showError(responseArea, 'Error: ' + error.message);
    }
}

async function explainCode() {
    const code = document.getElementById('code-input').value;
    const responseArea = document.getElementById('ai-response');
    
    if (!code.trim()) {
        showError(responseArea, 'Please enter code to explain');
        return;
    }
    
    showLoading(responseArea, 'Explaining code with Codex...');
    
    try {
        const response = await fetch('/api/codex/explain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        
        if (data.explanation) {
            showSuccess(responseArea, `Code Explanation:\n\n${data.explanation}`);
        } else {
            throw new Error(data.error || 'No explanation generated');
        }
    } catch (error) {
        showError(responseArea, 'Error: ' + error.message);
    }
}

async function optimizeCode() {
    const code = document.getElementById('code-input').value;
    const responseArea = document.getElementById('ai-response');
    
    if (!code.trim()) {
        showError(responseArea, 'Please enter code to optimize');
        return;
    }
    
    showLoading(responseArea, 'Optimizing code with Codex...');
    
    try {
        const response = await fetch('/api/codex/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        
        if (data.optimizedCode) {
            showCode(responseArea, `Optimized Code:\n\n${data.optimizedCode}`);
        } else {
            throw new Error(data.error || 'No optimized code generated');
        }
    } catch (error) {
        showError(responseArea, 'Error: ' + error.message);
    }
}

async function analyzeCode() {
    const code = document.getElementById('code-input').value;
    const responseArea = document.getElementById('ai-response');
    
    if (!code.trim()) {
        showError(responseArea, 'Please enter code to analyze');
        return;
    }
    
    showLoading(responseArea, 'Analyzing code with Claude...');
    
    try {
        const response = await fetch('/api/claude/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        
        if (data.analysis) {
            showSuccess(responseArea, `Code Analysis:\n\n${data.analysis}`);
        } else {
            throw new Error(data.error || 'No analysis generated');
        }
    } catch (error) {
        showError(responseArea, 'Error: ' + error.message);
    }
}

async function debugCode() {
    const code = document.getElementById('code-input').value;
    const responseArea = document.getElementById('ai-response');
    
    if (!code.trim()) {
        showError(responseArea, 'Please enter code to debug');
        return;
    }
    
    showLoading(responseArea, 'Debugging code with Codex...');
    
    try {
        const response = await fetch('/api/codex/debug', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        
        if (data.debugInfo) {
            showSuccess(responseArea, `Debug Analysis:\n\n${data.debugInfo}`);
        } else {
            throw new Error(data.error || 'No debug info generated');
        }
    } catch (error) {
        showError(responseArea, 'Error: ' + error.message);
    }
}

async function refactorCode() {
    const code = document.getElementById('code-input').value;
    const responseArea = document.getElementById('ai-response');
    
    if (!code.trim()) {
        showError(responseArea, 'Please enter code to refactor');
        return;
    }
    
    showLoading(responseArea, 'Refactoring code with Claude...');
    
    try {
        const response = await fetch('/api/claude/refactor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        
        if (data.refactoredCode) {
            showCode(responseArea, `Refactored Code:\n\n${data.refactoredCode}`);
        } else {
            throw new Error(data.error || 'No refactored code generated');
        }
    } catch (error) {
        showError(responseArea, 'Error: ' + error.message);
    }
}

// YOLO Camera Functions
async function startCamera() {
    const responseArea = document.getElementById('yolo-response');
    const statusElement = document.getElementById('camera-status-text');
    const indicator = document.getElementById('camera-indicator');
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
            indicator.classList.add('active');
            startBtn.disabled = true;
            stopBtn.disabled = false;
            document.getElementById('start-detection-btn').disabled = false;
            
            // Hide placeholder and show camera feed
            document.getElementById('camera-placeholder').style.display = 'none';
            document.getElementById('camera-feed').style.display = 'block';
            
            showSuccess(responseArea, 'Camera started successfully!');
            startLiveDetection(); // Auto-start detection
        } else {
            throw new Error(data.message || 'Failed to start camera');
        }
    } catch (error) {
        showError(responseArea, 'Error starting camera: ' + error.message);
    }
}

async function stopCamera() {
    const responseArea = document.getElementById('yolo-response');
    const statusElement = document.getElementById('camera-status-text');
    const indicator = document.getElementById('camera-indicator');
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
        indicator.classList.remove('active');
        startBtn.disabled = false;
        stopBtn.disabled = true;
        document.getElementById('start-detection-btn').disabled = true;
        document.getElementById('stop-detection-btn').disabled = true;
        document.getElementById('analyze-btn').disabled = true;
        
        // Hide camera feed and show placeholder
        document.getElementById('camera-feed').style.display = 'none';
        document.getElementById('camera-placeholder').style.display = 'block';
        document.getElementById('detection-stats').style.display = 'none';
        document.getElementById('detection-list').style.display = 'none';
        
        // Clear detections
        clearDetections();
        
        showSuccess(responseArea, 'Camera stopped successfully!');
    } catch (error) {
        showError(responseArea, 'Error stopping camera: ' + error.message);
    }
}

async function startLiveDetection() {
    if (!cameraActive) {
        showError(document.getElementById('yolo-response'), 'Please start camera first');
        return;
    }
    
    const responseArea = document.getElementById('yolo-response');
    const startBtn = document.getElementById('start-detection-btn');
    const stopBtn = document.getElementById('stop-detection-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    
    detectionActive = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    analyzeBtn.disabled = false;
    
    // Show stats and detection list
    document.getElementById('detection-stats').style.display = 'block';
    document.getElementById('detection-list').style.display = 'block';
    
    showSuccess(responseArea, 'Live detection started!');
    
    // Start detection loop
    const interval = parseInt(document.getElementById('detection-interval').value);
    detectionInterval = setInterval(async () => {
        await getFrameWithDetections();
    }, interval);
}

function stopLiveDetection() {
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
    
    detectionActive = false;
    document.getElementById('start-detection-btn').disabled = false;
    document.getElementById('stop-detection-btn').disabled = true;
    document.getElementById('analyze-btn').disabled = true;
    
    showSuccess(document.getElementById('yolo-response'), 'Live detection stopped!');
}

async function getFrameWithDetections() {
    if (!detectionActive) return;
    
    try {
        const confidence = parseFloat(document.getElementById('confidence-slider').value);
        const response = await fetch(`/api/yolo/frame?confidence=${confidence}`);
        const data = await response.json();
        
        if (data.success) {
            // Update camera feed
            if (data.frame) {
                const cameraFeed = document.getElementById('camera-feed');
                cameraFeed.src = 'data:image/jpeg;base64,' + data.frame;
            }
            
            // Update detections
            currentDetections = data.detections || [];
            updateDetectionOverlay();
            updateDetectionStats();
            updateDetectionList();
            
            // Update FPS
            frameCount++;
            const now = Date.now();
            const fps = Math.round(1000 / (now - lastFrameTime));
            document.getElementById('fps-counter').textContent = fps;
            lastFrameTime = now;
            
            totalDetections += currentDetections.length;
            document.getElementById('total-detections').textContent = totalDetections;
        }
    } catch (error) {
        console.error('Detection error:', error);
    }
}

function updateDetectionOverlay() {
    const overlay = document.getElementById('detection-overlay');
    overlay.innerHTML = '';
    
    const cameraFeed = document.getElementById('camera-feed');
    if (!cameraFeed.complete || !cameraFeed.naturalWidth) return;
    
    const rect = cameraFeed.getBoundingClientRect();
    const scaleX = rect.width / 640; // Assuming 640px width
    const scaleY = rect.height / 480; // Assuming 480px height
    
    currentDetections.forEach((detection, index) => {
        const [x, y, w, h] = detection.bbox;
        const scaledX = x * scaleX;
        const scaledY = y * scaleY;
        const scaledW = w * scaleX;
        const scaledH = h * scaleY;
        
        const box = document.createElement('div');
        box.className = 'detection-box';
        box.style.left = scaledX + 'px';
        box.style.top = scaledY + 'px';
        box.style.width = scaledW + 'px';
        box.style.height = scaledH + 'px';
        
        const label = document.createElement('div');
        label.className = 'detection-label';
        label.textContent = detection.class;
        box.appendChild(label);
        
        const confidence = document.createElement('div');
        confidence.className = 'detection-confidence';
        confidence.textContent = Math.round(detection.confidence * 100) + '%';
        box.appendChild(confidence);
        
        overlay.appendChild(box);
    });
}

function updateDetectionStats() {
    document.getElementById('objects-count').textContent = currentDetections.length;
    document.getElementById('detection-time').textContent = Date.now() - lastFrameTime + 'ms';
}

function updateDetectionList() {
    const container = document.getElementById('detections-container');
    container.innerHTML = '';
    
    if (currentDetections.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #718096; padding: 20px;">No objects detected</div>';
        return;
    }
    
    currentDetections.forEach((detection, index) => {
        const item = document.createElement('div');
        item.className = 'detection-item';
        item.innerHTML = `
            <span class="detection-class">${detection.class}</span>
            <span class="detection-conf">${Math.round(detection.confidence * 100)}%</span>
        `;
        container.appendChild(item);
    });
}

function clearDetections() {
    currentDetections = [];
    document.getElementById('detection-overlay').innerHTML = '';
    document.getElementById('detections-container').innerHTML = '';
    document.getElementById('objects-count').textContent = '0';
    document.getElementById('fps-counter').textContent = '0';
    document.getElementById('detection-time').textContent = '0ms';
    totalDetections = 0;
    document.getElementById('total-detections').textContent = '0';
}

async function analyzeDetections() {
    if (currentDetections.length === 0) {
        showError(document.getElementById('yolo-response'), 'No detections to analyze');
        return;
    }
    
    const responseArea = document.getElementById('yolo-response');
    showLoading(responseArea, 'Analyzing detections with AI...');
    
    try {
        const response = await fetch('/api/yolo/analyze-detections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                detections: currentDetections,
                prompt: 'Analyze what you see in this scene and provide insights about the detected objects and their context.'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(responseArea, `AI Analysis:\n\n${data.analysis}`);
        } else {
            throw new Error(data.error || 'Analysis failed');
        }
    } catch (error) {
        showError(responseArea, 'Error analyzing detections: ' + error.message);
    }
}

// Utility functions
function showLoading(element, message) {
    element.innerHTML = `<div class="loading">${message}</div>`;
}

function showSuccess(element, message) {
    element.innerHTML = `<div class="success">${message}</div>`;
}

function showError(element, message) {
    element.innerHTML = `<div class="error">${message}</div>`;
}

function showCode(element, message) {
    element.innerHTML = `<div class="code-display">${message}</div>`;
}

function clearResponse(elementId) {
    document.getElementById(elementId).innerHTML = '';
}

