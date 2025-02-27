// Function to render file tree
function renderFileTree(files, parentElement = document.getElementById('file-tree')) {
    if (!parentElement || !files) {
        console.error('Invalid parameters for renderFileTree', { parentElement, files });
        return;
    }

    parentElement.innerHTML = '';

    for (const [name, file] of Object.entries(files)) {
        if (file.type === 'folder') {
            const folderElement = document.createElement('div');
            folderElement.className = 'folder';
            folderElement.innerHTML = `
                <svg class="folder-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#f0883e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 5v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5"></path>
                    <path d="M1 5a1 1 0 0 1 1-1h4l2 2h6a1 1 0 0 1 1 1v1"></path>
                </svg>
                <span class="folder-name">${name}</span>
            `;

            const folderContent = document.createElement('div');
            folderContent.className = 'folder-content';
            
            if (file.children) {
                renderFileTree(file.children, folderContent);
            }

            folderElement.addEventListener('click', (e) => {
                e.stopPropagation();
                folderElement.classList.toggle('open');
            });

            folderElement.appendChild(folderContent);
            parentElement.appendChild(folderElement);
        } else if (file.type === 'file') {
            const fileElement = document.createElement('div');
            fileElement.className = 'file';

            let fileIcon;
            switch (file.language) {
                case 'javascript':
                    fileIcon = `<svg class="file-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f0883e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 19l-7-7 7-7"></path>
                        <path d="M19 5v14"></path>
                    </svg>`;
                    break;
                case 'python':
                    fileIcon = `<svg class="file-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#58a6ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 5.5v8M5.5 12h13"></path>
                        <path d="M6 4v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2Z"></path>
                    </svg>`;
                    break;
                    default:
                        fileIcon = `<svg class="file-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b949e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <path d="M14 2v6h6"></path>
                            <path d="M16 13H8"></path>
                            <path d="M16 17H8"></path>
                            <path d="M10 9H8"></path>
                        </svg>`;
                }
    
                fileElement.innerHTML = `
                    ${fileIcon}
                    <span class="file-name language-${file.language}">${name}</span>
                    ${file.outdated ? '<span class="outdated-badge">Outdated</span>' : ''}
                `;
    
                fileElement.addEventListener('click', () => {
                    showFileContent(name, file);
                });
    
                parentElement.appendChild(fileElement);
            }
        }
    }