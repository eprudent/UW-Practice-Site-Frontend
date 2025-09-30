// Global variables
let currentImageData = null;
let yoloClasses = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkSystemStatus();
    loadYOLOClasses();
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
            yoloStatus.textContent = data.services.yoloInfo.fallback ? 'Simulation Mode' : 'Loaded';
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

// Claude AI functions
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

// Codex functions
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

// Enhanced YOLO v8 functions
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

// Integrated workflow functions
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
            <p><strong>Fallback Mode:</strong> ${data.modelInfo?.fallback ? 'Yes' : 'No'}</p>
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
