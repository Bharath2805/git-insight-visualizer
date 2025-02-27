// Render a simple visualization of the repository files
function renderVisualization(repoData) {
    console.log("renderVisualization called with data:", repoData);
    
    if (!repoData) {
        console.error('Invalid repository data for visualization: repoData is null or undefined');
        return;
    }

    if (!repoData.files) {
        console.error('Invalid repository data for visualization: repoData.files is missing', repoData);
        return;
    }

    const visualizationContainer = document.getElementById('visualization-container');
    if (!visualizationContainer) {
        console.error('Visualization container not found');
        return;
    }

    // Clear previous visualization
    visualizationContainer.innerHTML = '';
    
    // Create a simple file grid
    const gridContainer = document.createElement('div');
    gridContainer.className = 'file-grid';
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
    gridContainer.style.gap = '15px';
    gridContainer.style.padding = '20px';
    gridContainer.style.overflowY = 'auto';
    gridContainer.style.height = '100%';
    
    // Convert to flat list of files
    const filesList = flattenFiles(repoData.files);
    
    // Create file cards
    filesList.forEach(file => {
        const card = document.createElement('div');
        card.className = 'file-card';
        card.style.backgroundColor = 'var(--bg-secondary)';
        card.style.borderRadius = '8px';
        card.style.padding = '15px';
        card.style.border = '1px solid var(--border-color)';
        card.style.cursor = 'pointer';
        card.style.transition = 'transform 0.2s, box-shadow 0.2s';
        
        // Color stripe based on language
        const colorStripe = document.createElement('div');
        colorStripe.style.height = '8px';
        colorStripe.style.width = '100%';
        colorStripe.style.backgroundColor = getNodeColor({ language: file.language, type: file.type });
        colorStripe.style.borderRadius = '4px 4px 0 0';
        colorStripe.style.marginBottom = '10px';
        
        const nameElement = document.createElement('div');
        nameElement.textContent = file.name;
        nameElement.style.fontSize = '14px';
        nameElement.style.fontWeight = 'bold';
        nameElement.style.marginBottom = '5px';
        nameElement.style.wordBreak = 'break-word';
        
        const typeElement = document.createElement('div');
        typeElement.textContent = file.type === 'folder' ? 'Folder' : (file.language || 'Unknown');
        typeElement.style.fontSize = '12px';
        typeElement.style.color = 'var(--text-secondary)';
        
        card.appendChild(colorStripe);
        card.appendChild(nameElement);
        card.appendChild(typeElement);
        
        // Add hover effect
        card.addEventListener('mouseover', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 5px 15px var(--shadow-color)';
            
            // Show speech bubble if available
            if (window.AnimationManager && typeof window.AnimationManager.showSpeechBubble === 'function') {
                const description = file.type === 'folder' 
                    ? `This is the ${file.name} folder` 
                    : `This is a ${file.language || 'unknown'} file: ${file.name}`;
                window.AnimationManager.showSpeechBubble(description);
            }
        });
        
        card.addEventListener('mouseout', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        });
        
        // Add click handler
        card.addEventListener('click', () => {
            if (file.type === 'folder') {
                // For folders, just show info in chat
                if (typeof addChatMessage === 'function') {
                    addChatMessage(`Selected folder: ${file.fullPath}`, false);
                }
            } else {
                // For files, try to show content
                const fileData = findFile(repoData.files, file.fullPath);
                if (fileData) {
                    showFileContent(file.fullPath, fileData);
                }
            }
        });
        
        gridContainer.appendChild(card);
    });
    
    visualizationContainer.appendChild(gridContainer);
    
    // Save reference to selected node (currently none)
    window.selectedNode = null;
}

// Flatten files into a list for grid display
function flattenFiles(files, path = '', result = []) {
    if (!files) {
        console.warn('flattenFiles called with null/undefined files');
        return result;
    }
    
    try {
        for (const [name, file] of Object.entries(files)) {
            const fullPath = path ? `${path}/${name}` : name;
            
            if (file.type === 'file') {
                result.push({
                    name: name,
                    type: 'file',
                    language: file.language,
                    fullPath: fullPath,
                    outdated: file.outdated
                });
            } else if (file.type === 'folder') {
                // Add the folder itself
                result.push({
                    name: name,
                    type: 'folder',
                    fullPath: fullPath
                });
                
                // Add its children
                if (file.children) {
                    flattenFiles(file.children, fullPath, result);
                }
            }
        }
        
        return result;
    } catch (error) {
        console.error('Error in flattenFiles:', error);
        return result;
    }
}

// Get node color based on type and language
function getNodeColor(node) {
    if (!node) return 'var(--text-secondary)';
    
    try {
        if (node.type === 'folder') {
            return 'var(--accent-orange)';
        }
        
        if (node.outdated) {
            return 'var(--accent-red)';
        }
        
        switch (node.language) {
            case 'javascript':
                return 'var(--accent-orange)';
            case 'python':
                return 'var(--accent-blue)';
            case 'java':
                return 'var(--accent-red)';
            case 'html':
                return 'var(--accent-green)';
            case 'css':
                return 'var(--accent-purple)';
            case 'json':
                return 'var(--accent-blue)';
            case 'markdown':
                return 'var(--accent-green)';
            default:
                return 'var(--text-secondary)';
        }
    } catch (error) {
        console.error('Error getting node color:', error);
        return 'var(--text-secondary)';
    }
}

// Find a file in the repository data
function findFile(files, path) {
    if (!files || !path) return null;
    
    try {
        const parts = path.split('/');
        let current = files;
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            
            if (i === parts.length - 1) {
                return current[part];
            }
            
            if (current[part] && current[part].type === 'folder') {
                current = current[part].children;
            } else {
                return null;
            }
        }
    } catch (error) {
        console.error('Error finding file:', error);
    }
    
    return null;
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

// Calculate distribution of languages in the repository
function calculateLanguageDistribution(files, distribution = {}) {
    if (!files) return distribution;
    
    for (const [key, value] of Object.entries(files)) {
        if (value.type === 'file') {
            const language = value.language || 'unknown';
            distribution[language] = (distribution[language] || 0) + 1;
        } else if (value.type === 'folder' && value.children) {
            distribution = calculateLanguageDistribution(value.children, distribution);
        }
    }
    
    return distribution;
}

// Show file content in the code viewer
function showFileContent(fileName, file) {
    const filePath = document.getElementById('file-path');
    const codeContent = document.getElementById('code-content');
    const codeViewer = document.getElementById('code-viewer');
    const visualizationContainer = document.querySelector('.visualization-container').parentElement;
    
    if (!filePath || !codeContent || !codeViewer || !visualizationContainer) {
        console.error('Required elements not found for showing file content');
        return;
    }
    
    if (!file || !file.content) {
        console.error('Invalid file data or missing content', file);
        return;
    }
    
    filePath.textContent = fileName;
    codeContent.innerHTML = '';
    
    const lines = file.content.split('\n');
    lines.forEach((line, index) => {
        const lineElement = document.createElement('div');
        lineElement.className = 'code-line';
        lineElement.innerHTML = `
            <span class="line-number">${index + 1}</span>
            <span class="line-content">${escapeHtml(line)}</span>
        `;
        codeContent.appendChild(lineElement);
    });

    // Update animations if available
    if (window.AnimationManager) {
        if (typeof window.AnimationManager.loadLanguageAnimation === 'function') {
            window.AnimationManager.loadLanguageAnimation(file.language);
        }
        
        if (typeof window.AnimationManager.loadCharacterAnimation === 'function') {
            window.AnimationManager.loadCharacterAnimation(file.language);
        }
        
        if (typeof window.AnimationManager.showSpeechBubble === 'function') {
            window.AnimationManager.showSpeechBubble(`This is a ${file.language} file named ${fileName}. I can explain it if you ask me!`);
        }
    }

    visualizationContainer.style.display = 'none';
    codeViewer.style.display = 'flex';
    
    // Store reference to selected file
    window.selectedNode = {
        id: fileName,
        type: 'file',
        language: file.language,
        outdated: file.outdated
    };
}

// Close code viewer and show visualization
function closeCodeViewer() {
    const codeViewer = document.getElementById('code-viewer');
    const visualizationContainer = document.querySelector('.visualization-container').parentElement;
    
    if (!codeViewer || !visualizationContainer) {
        console.error('Required elements not found for closing code viewer');
        return;
    }
    
    codeViewer.style.display = 'none';
    visualizationContainer.style.display = 'block';
    
    // Reset animations if available
    if (window.AnimationManager) {
        if (typeof window.AnimationManager.loadCharacterAnimation === 'function') {
            window.AnimationManager.loadCharacterAnimation('general');
        }
        
        if (typeof window.AnimationManager.removeLanguageAnimation === 'function') {
            window.AnimationManager.removeLanguageAnimation();
        }
    }
    
    // Clear selected node
    window.selectedNode = null;
}

// Escape HTML to prevent XSS
function escapeHtml(html) {
    if (!html) return '';
    
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

// Ensure the close code button handler is set up
document.addEventListener('DOMContentLoaded', function() {
    const closeCodeBtn = document.getElementById('close-code-btn');
    if (closeCodeBtn) {
        closeCodeBtn.addEventListener('click', closeCodeViewer);
    }
});