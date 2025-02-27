// DOM Elements
const repoInput = document.getElementById('repo-input');
const analyzeBtn = document.getElementById('analyze-btn');
const mainContent = document.getElementById('main-content');
const repoTitle = document.getElementById('repo-title');
const repoDescription = document.getElementById('repo-description');
const filesCount = document.getElementById('files-count');
const lastUpdated = document.getElementById('last-updated');
const loadingOverlay = document.getElementById('loading-overlay');
const structureBtn = document.getElementById('structure-btn');
const dependenciesBtn = document.getElementById('dependencies-btn');
const insightsBtn = document.getElementById('insights-btn');

let selectedNode = null;
let repoData = null;

// Add stream indicator and code view toggle to the DOM
function addUIElements() {
  // Add stream indicator
  const streamIndicator = document.createElement('div');
  streamIndicator.className = 'stream-indicator';
  streamIndicator.innerHTML = `
    <div class="spinner"></div>
    <div>Loading repository data...</div>
  `;
  document.body.appendChild(streamIndicator);
  
  // Add code view toggle button
  const codeViewToggle = document.createElement('button');
  codeViewToggle.className = 'code-view-toggle';
  codeViewToggle.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  `;
  codeViewToggle.setAttribute('title', 'Toggle Code View');
  document.body.appendChild(codeViewToggle);
  
  // Add event listener for code view toggle
  codeViewToggle.addEventListener('click', toggleCodeView);
}

// Show and hide loading with streaming info
function showStreamLoading(message) {
  const streamIndicator = document.querySelector('.stream-indicator');
  if (streamIndicator) {
    streamIndicator.querySelector('div:last-child').textContent = message || 'Processing...';
    streamIndicator.classList.add('active');
  }
}

function hideStreamLoading() {
  const streamIndicator = document.querySelector('.stream-indicator');
  if (streamIndicator) {
    streamIndicator.classList.remove('active');
  }
}

// Toggle between code view and chat view
function toggleCodeView() {
  const codeViewer = document.getElementById('code-viewer');
  const visualizationContent = document.querySelector('.visualization-content');
  
  if (codeViewer && visualizationContent) {
    if (codeViewer.style.display === 'flex') {
      codeViewer.style.display = 'none';
      visualizationContent.style.display = 'block';
    } else {
      if (window.selectedNode && window.selectedNode.type === 'file') {
        codeViewer.style.display = 'flex';
        visualizationContent.style.display = 'none';
      } else {
        // Show a notification if no file is selected
        addChatMessage("Please select a file from the repository first.", false);
      }
    }
  }
}

// Show loading animation with custom message
function showLoading(message = 'Analyzing repository... Please wait.') {
  if (loadingOverlay) {
    const loadingMessage = loadingOverlay.querySelector('.loading-message');
    
    if (loadingMessage) {
      loadingMessage.textContent = message;
    }
    
    loadingOverlay.classList.add('active');
  }
}

// Hide loading animation
function hideLoading() {
  if (loadingOverlay) {
    loadingOverlay.classList.remove('active');
  }
}

// Validate GitHub repository URL
function validateRepoUrl(url) {
  const githubRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+\/?$/;
  return githubRegex.test(url);
}

// Improved repository analysis with streaming
async function analyzeRepositoryWithStreaming(repoUrl) {
  if (!repoUrl) return;
  
  // Show loading
  showStreamLoading('Connecting to GitHub...');
  
  try {
    // Parse repository URL to get owner and repo name
    const urlParts = repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//, '').split('/');
    const owner = urlParts[0];
    const repo = urlParts[1];
    
    if (!owner || !repo) {
      throw new Error('Invalid repository URL format. Please use format: https://github.com/username/repository');
    }
    
    // Add initial message to chat
    addChatMessage(`Starting analysis of ${owner}/${repo}...`, false);
    
    // Fetch repository data with periodic updates
    showStreamLoading(`Fetching repository structure...`);
    
    const response = await fetch(`/api/github/repo?owner=${owner}&repo=${repo}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    showStreamLoading(`Processing repository data...`);
    
    // Process the data
    const repoData = await response.json();
    window.repoData = repoData;
    
    // Update UI elements
    displayRepositoryInfo(repoData);
    renderFileTree(repoData.files);
    renderVisualization(repoData);
    
    // Show main content
    document.getElementById('main-content').style.display = 'grid';
    
    // Add completion message to chat
    addChatMessage(`Repository analysis complete! Found ${countFiles(repoData.files)} files. Ask me questions about the code structure or any specific file.`, false);
    
    // Hide loading
    hideStreamLoading();
    
  } catch (error) {
    console.error('Error analyzing repository:', error);
    
    // Add error message to chat
    addChatMessage(`Error analyzing repository: ${error.message}`, false);
    
    // Hide loading
    hideStreamLoading();
  }
}

// Enhanced chat submission with better loading UI
async function enhancedChatSubmit() {
  const chatInput = document.getElementById('chat-input');
  const message = chatInput.value.trim();
  if (!message) return;
  
  // Add user message to chat
  addChatMessage(message, true);
  chatInput.value = '';
  
  // Show loading
  const chatBody = document.getElementById('chat-body');
  const loadingMessage = document.createElement('div');
  loadingMessage.className = 'chat-message ai-message typing-indicator';
  loadingMessage.innerHTML = `
    <span>.</span><span>.</span><span>.</span>
  `;
  chatBody.appendChild(loadingMessage);
  chatBody.scrollTop = chatBody.scrollHeight;
  
  showStreamLoading('Processing your question...');
  
  try {
    // Prepare context
    let context = {};
    if (window.selectedNode) {
      context.selectedNode = {
        id: window.selectedNode.id,
        type: window.selectedNode.type,
        language: window.selectedNode.language,
        outdated: window.selectedNode.outdated
      };
    }
    
    // Make API call
    const response = await fetch('/api/openai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        repoData: window.repoData ? {
          name: window.repoData.name,
          fullName: window.repoData.fullName,
          description: window.repoData.description
        } : null,
        context
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to get response from AI');
    }
    
    const data = await response.json();
    
    // Remove loading message
    if (loadingMessage.parentNode) {
      loadingMessage.parentNode.removeChild(loadingMessage);
    }
    
    // Add AI response to chat
    addChatMessage(data.response, false);
    
    // Hide loading
    hideStreamLoading();
    
    // Show character speech bubble if AnimationManager is available
    if (window.AnimationManager && typeof window.AnimationManager.showSpeechBubble === 'function') {
      window.AnimationManager.showSpeechBubble("I've answered your question in the chat below!");
    }
    
  } catch (error) {
    console.error('Error getting AI response:', error);
    
    // Remove loading message
    if (loadingMessage.parentNode) {
      loadingMessage.parentNode.removeChild(loadingMessage);
    }
    
    // Add error message to chat
    addChatMessage("Sorry, I encountered an error while processing your request. Please try again.", false);
    
    // Hide loading
    hideStreamLoading();
  }
}

// Function to analyze repository with enhanced loading
async function analyzeRepository(repoUrl) {
  // Reset UI
  if (mainContent) {
    mainContent.style.display = 'none';
  }

  // Validate URL
  if (!validateRepoUrl(repoUrl)) {
    showLoading('Invalid GitHub repository URL. Please check the format.');
    setTimeout(hideLoading, 3000);
    return;
  }

  // Show initial loading state
  showLoading(`Preparing to analyze ${repoUrl}...`);
  
  try {
    // Parse repository URL to get owner and repo name
    const urlParts = repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//, '').split('/');
    const owner = urlParts[0];
    const repo = urlParts[1];

    if (!owner || !repo) {
      throw new Error('Invalid repository URL format. Please use format: https://github.com/username/repository');
    }

    // Update loading message
    showLoading(`Connecting to GitHub for ${owner}/${repo}...`);
    
    // Make API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
    
    try {
      // Fetch repository data
      showLoading(`Fetching repository details for ${owner}/${repo}...`);
      
      const response = await fetch(`/api/github/repo?owner=${owner}&repo=${repo}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Handle specific HTTP error codes
        switch (response.status) {
          case 404:
            throw new Error('Repository not found. Please check the URL.');
          case 403:
            throw new Error('Access forbidden. The repository might be private or rate limit exceeded.');
          default:
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
      }
      
      // Process repository data
      showLoading(`Processing repository data for ${owner}/${repo}...`);
      
      repoData = await response.json();
      window.repoData = repoData;
      
      // Validate repository data
      if (!repoData || !repoData.files) {
        throw new Error('No repository data received. The repository might be empty.');
      }
      
      // Display repository information
      displayRepositoryInfo(repoData);
      
      // Render file tree
      renderFileTree(repoData.files);
      
      // Render visualization
      renderVisualization(repoData);
      
      // Show main content
      if (mainContent) {
        mainContent.style.display = 'grid';
      }
      
      // Final loading state
      showLoading('Repository analysis complete!');
      
      // Hide loading after a short delay
      setTimeout(hideLoading, 1500);
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        showLoading('Repository analysis timed out. This might be a large repository.');
      } else {
        showLoading(`Error: ${fetchError.message}`);
      }
      
      // Hide loading after error display
      setTimeout(hideLoading, 3000);
      
      console.error('Repository analysis error:', fetchError);
    }
  } catch (error) {
    console.error('Error analyzing repository:', error);
    
    // Update loading with error message
    showLoading(`Error: ${error.message}`);
    
    // Hide loading after error display
    setTimeout(hideLoading, 3000);
  }
}

// Display repository information
function displayRepositoryInfo(repoData) {
  if (!repoData) return;
  
  if (repoTitle) repoTitle.textContent = repoData.fullName || 'Unknown Repository';
  if (repoDescription) repoDescription.textContent = repoData.description || 'No description available';

  if (filesCount) {
    let fileCount = countFiles(repoData.files);
    filesCount.textContent = `${fileCount} files`;
  }

  if (lastUpdated && repoData.lastUpdated) {
    const date = new Date(repoData.lastUpdated);
    lastUpdated.textContent = `Last updated: ${date.toLocaleDateString()}`;
  }
}

// Count the number of files in the repository
function countFiles(files, count = 0) {
  if (!files) return count;
  
  for (const [key, value] of Object.entries(files)) {
    if (value.type === 'file') {
      count++;
    } else if (value.type === 'folder' && value.children) {
      count = countFiles(value.children, count);
    }
  }
  return count;
}

// Setup event listeners after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add custom UI elements
  addUIElements();
  
  // Replace the analyze button click handler
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', function() {
      const repoUrl = repoInput ? repoInput.value.trim() : '';
      if (repoUrl) {
        analyzeRepositoryWithStreaming(repoUrl);
      }
    });
  }
  
  // Replace the chat submit handler
  const chatSubmit = document.getElementById('chat-submit');
  if (chatSubmit) {
    chatSubmit.addEventListener('click', enhancedChatSubmit);
  }
  
  // Also replace the keyup handler for the chat input
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keyup', function(event) {
      if (event.key === 'Enter') {
        enhancedChatSubmit();
      }
    });
  }
  
  // Load theme from localStorage if available
  try {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.body.className = savedTheme;
      document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === savedTheme) {
          btn.classList.add('active');
        }
      });
    }
    
    // Initialize animations if AnimationManager is available
    if (typeof window.AnimationManager !== 'undefined' && 
        typeof window.AnimationManager.initializeAnimations === 'function') {
      window.AnimationManager.initializeAnimations();
    }
  } catch (error) {
    console.error('Error during initialization:', error);
  }
  
  // View mode toggle buttons (now hidden by default)
  if (structureBtn) {
    structureBtn.addEventListener('click', () => {
      structureBtn.classList.add('active');
      if (dependenciesBtn) dependenciesBtn.classList.remove('active');
      if (insightsBtn) insightsBtn.classList.remove('active');
      
      if (window.repoData && window.repoData.files) {
        renderVisualization(window.repoData);
      }
    });
  }

  if (dependenciesBtn) {
    dependenciesBtn.addEventListener('click', () => {
      if (structureBtn) structureBtn.classList.remove('active');
      dependenciesBtn.classList.add('active');
      if (insightsBtn) insightsBtn.classList.remove('active');
      
      if (window.repoData && window.repoData.files) {
        renderVisualization(window.repoData);
      }
    });
  }

  if (insightsBtn) {
    insightsBtn.addEventListener('click', () => {
      if (structureBtn) structureBtn.classList.remove('active');
      if (dependenciesBtn) dependenciesBtn.classList.remove('active');
      insightsBtn.classList.add('active');
      
      if (window.repoData && window.repoData.files) {
        renderVisualization(window.repoData);
      }
    });
  }
  
  // Allow pressing Enter in the input field
  if (repoInput) {
    repoInput.addEventListener('keyup', (event) => {
      if (event.key === 'Enter' && analyzeBtn) {
        analyzeBtn.click();
      }
    });
  }
});