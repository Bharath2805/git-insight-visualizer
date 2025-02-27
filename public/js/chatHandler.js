// Chat-related functionality
const chatInput = document.getElementById('chat-input');
const chatSubmit = document.getElementById('chat-submit');
const chatBody = document.getElementById('chat-body');
const explainBtn = document.getElementById('explain-btn');
const explainDetailBtn = document.getElementById('explain-detail-btn');

// Conversation history management
const MAX_HISTORY_LENGTH = 5; // Keep last 5 messages
let conversationHistory = [];

// Predefined loading messages
const LOADING_MESSAGES = [
    "Thinking deeply about your question...",
    "Analyzing repository context...",
    "Crafting a thoughtful response...",
    "Diving into the code details...",
    "Preparing insights...",
    "Connecting the dots...",
    "Gathering repository wisdom..."
];

// Get a random loading message
function getRandomLoadingMessage() {
    return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}

// Update typing indicator message
function updateTypingIndicator(typingIndicator) {
    if (!typingIndicator) return;
    
    // Cycle through loading messages
    const msgElem = typingIndicator.querySelector('.typing-message');
    if (msgElem) {
        msgElem.textContent = getRandomLoadingMessage();
    }
}

// Add message to chat
function addChatMessage(message, isUser) {
    if (!chatBody) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${isUser ? 'user-message' : 'ai-message'}`;
    
    // If it's an AI message, format it
    if (!isUser) {
        messageElement.innerHTML = formatChatResponse(message);
    } else {
        // User messages don't need special formatting
        messageElement.textContent = message;
    }
    
    chatBody.appendChild(messageElement);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Manage conversation history
    conversationHistory.push({
        role: isUser ? 'user' : 'assistant',
        content: message
    });

    // Trim history
    if (conversationHistory.length > MAX_HISTORY_LENGTH * 2) {
        conversationHistory = conversationHistory.slice(-MAX_HISTORY_LENGTH * 2);
    }
}

// Format chat response to be more structured
function formatChatResponse(response) {
    // Default formatting logic
    let formatted = response;
    
    // Check for code analysis blocks
    if (response.includes("function") && response.includes("Lines")) {
        let formattedAnalysis = '<div class="code-analysis">';
        
        // Split by line markers
        const sections = response.split(/Lines \d+-\d+/);
        const lineMarkers = response.match(/Lines \d+-\d+/g) || [];
        
        if (lineMarkers.length > 0) {
            formattedAnalysis += '<h3 class="analysis-header">Code Analysis Summary</h3>';
            
            for (let i = 0; i < lineMarkers.length; i++) {
                formattedAnalysis += '<div class="analysis-section">';
                formattedAnalysis += `<div class="section-header">${lineMarkers[i]}</div>`;
                
                if (sections[i + 1]) {
                    formattedAnalysis += `<div class="section-content">${sections[i + 1]}</div>`;
                }
                
                formattedAnalysis += '</div>';
            }
        } else {
            formattedAnalysis += response;
        }
        
        formattedAnalysis += '</div>';
        return formattedAnalysis;
    }
    
    // Format code blocks
    formatted = formatted.replace(/```([a-z]*)([\s\S]*?)```/g, (match, language, code) => {
        return `<div class="code-block">
            <div class="code-header">${language || 'code'}</div>
            <pre class="code-content language-${language || 'none'}">${code.trim()}</pre>
        </div>`;
    });
    
    // Convert lists
    formatted = formatted.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)(?!\s*<li>)/gs, '<ul>$1</ul>');
    
    // Convert headings
    formatted = formatted.replace(/^#{1,6}\s+(.+)$/gm, (match, content) => {
        const level = match.trim().indexOf(' ');
        return `<h${level} class="chat-heading">${content}</h${level}>`;
    });
    
    // Format bold and italic
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return formatted;
}

// Handle chat submission
async function handleChatSubmit() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    addChatMessage(message, true);
    chatInput.value = '';
    
    // Show enhanced typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-message ai-message typing-indicator';
    typingIndicator.innerHTML = `
        <div class="typing-animation">
            <span>.</span><span>.</span><span>.</span>
        </div>
        <div class="typing-message">${getRandomLoadingMessage()}</div>
    `;
    chatBody.appendChild(typingIndicator);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // Start periodic message updates
    const messageUpdateInterval = setInterval(() => {
        updateTypingIndicator(typingIndicator);
    }, 3000);
    
    try {
        // Set up request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout
        
        // Prepare context
        let context = {};
        if (window.selectedNode) {
            context.selectedNode = {
                id: window.selectedNode.id,
                type: window.selectedNode.type,
                language: window.selectedNode.language
            };
        }
        
        // Prepare request payload
        const requestPayload = {
            message,
            repoData: window.repoData ? {
                name: window.repoData.name,
                fullName: window.repoData.fullName,
                description: window.repoData.description
            } : null,
            context,
            history: conversationHistory.slice(-MAX_HISTORY_LENGTH * 2)
        };

        // Make API call
        const response = await fetch('/api/openai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        clearInterval(messageUpdateInterval);
        
        if (!response.ok) {
            throw new Error('Failed to get response from AI');
        }
        
        const data = await response.json();
        
        // Remove typing indicator
        if (typingIndicator.parentNode) {
            chatBody.removeChild(typingIndicator);
        }
        
        // Add AI response to chat
        addChatMessage(data.response, false);
        
        // Show character speech bubble
        if (window.AnimationManager && typeof window.AnimationManager.showSpeechBubble === 'function') {
            window.AnimationManager.showSpeechBubble("I've answered your question in the chat below!");
        }
        
    } catch (error) {
        console.error('Error getting AI response:', error);
        
        // Clear intervals
        clearInterval(messageUpdateInterval);
        
        // Remove typing indicator
        if (typingIndicator.parentNode) {
            chatBody.removeChild(typingIndicator);
        }
        
        // Handle specific error types
        if (error.name === 'AbortError') {
            addChatMessage("Sorry, the request took too long. The repository might be complex or the connection is slow. Please try again.", false);
        } else {
            addChatMessage("Sorry, I encountered an error while processing your request. Please check your connection and try again.", false);
        }
    }
}

// Handle file explanation
async function explainFile(detailed = false) {
    const filePath = document.getElementById('file-path');
    if (!filePath) return;
    
    const path = filePath.textContent;
    if (!path) return;
    
    // Show loading
    if (typeof showLoading === 'function') {
        showLoading();
    }
    
    // Add message to chat
    addChatMessage(`Explaining ${detailed ? 'in detail' : ''}: ${path}...`, false);
    
    // Show typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-message ai-message typing-indicator';
    typingIndicator.innerHTML = `
        <span>.</span><span>.</span><span>.</span>
    `;
    chatBody.appendChild(typingIndicator);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    try {
        // Get code content
        const codeContent = document.getElementById('code-content');
        if (!codeContent) {
            throw new Error('Code content element not found');
        }
        
        const code = codeContent.innerText;
        
        // Call API for explanation
        const response = await fetch('/api/openai/explain-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filePath: path,
                fileContent: code,
                detailed
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to get explanation from AI');
        }
        
        const data = await response.json();
        
        // Remove typing indicator
        if (typingIndicator.parentNode) {
            chatBody.removeChild(typingIndicator);
        }
        
        // Add explanation to chat
        addChatMessage(detailed ? 
            `Here's my line-by-line explanation of ${path}:` : 
            `Here's my explanation of ${path}:`, false);
        addChatMessage(data.explanation, false);
        
        // Show character speech bubble
        if (window.AnimationManager && typeof window.AnimationManager.showSpeechBubble === 'function') {
            window.AnimationManager.showSpeechBubble(detailed ? 
                "I've analyzed this file line by line! Check the chat for details." : 
                "I've analyzed this file! Check the chat for a summary.");
        }
        
    } catch (error) {
        console.error('Error getting file explanation:', error);
        
        // Remove typing indicator
        if (typingIndicator.parentNode) {
            chatBody.removeChild(typingIndicator);
        }
        
        // Add error message to chat
        addChatMessage("Sorry, I encountered an error while analyzing this file. Please try again.", false);
    } finally {
        // Hide loading
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    }
}

// Event Listeners
if (chatSubmit) {
    chatSubmit.addEventListener('click', handleChatSubmit);
}

if (chatInput) {
    chatInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            handleChatSubmit();
        }
    });
}

if (explainBtn) {
    explainBtn.addEventListener('click', () => {
        explainFile(false);
    });
}

if (explainDetailBtn) {
    explainDetailBtn.addEventListener('click', () => {
        explainFile(true);
    });
}