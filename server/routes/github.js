const express = require('express');
const axios = require('axios');
const router = express.Router();

// GitHub API client
const github = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Authorization: process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
        Accept: 'application/vnd.github.v3+json'
    },
    timeout: 30000 // 30 second timeout
});

// Get repository info
router.get('/repo', async (req, res) => {
    try {
        const { owner, repo } = req.query;
        
        if (!owner || !repo) {
            return res.status(400).json({ error: 'Owner and repo parameters are required' });
        }
        
        console.log(`Processing repository: ${owner}/${repo}`);
        
        // Get repository info
        const repoResponse = await github.get(`/repos/${owner}/${repo}`);
        
        // Get repository contents (just top level to start)
        const contentsResponse = await github.get(`/repos/${owner}/${repo}/contents`);
        
        // Process repository data with limitations for large repos
        const repoData = {
            name: repoResponse.data.name,
            fullName: repoResponse.data.full_name,
            description: repoResponse.data.description || 'No description provided',
            stars: repoResponse.data.stargazers_count,
            forks: repoResponse.data.forks_count,
            lastUpdated: repoResponse.data.updated_at,
            files: {}
        };

        // For large repositories like VSCode, limit the depth and file count
        const isLargeRepo = repoResponse.data.size > 100000; // Size in KB
        console.log(`Repository size: ${repoResponse.data.size}KB, Large repo: ${isLargeRepo}`);
        
        // Process contents with limitations
        repoData.files = await processContents(
            owner, 
            repo, 
            contentsResponse.data, 
            '', 
            isLargeRepo ? 2 : 3,  // Max depth for large repos
            isLargeRepo ? 100 : 500  // Max files for large repos
        );
        
        res.json(repoData);
    } catch (error) {
        console.error('Error fetching repository data:', error.message);
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
            res.status(error.response.status).json({ 
                error: `GitHub API error: ${error.response.data.message || 'Unknown error'}`,
                status: error.response.status
            });
        } else {
            res.status(500).json({ error: `Failed to fetch repository data: ${error.message}` });
        }
    }
});

// Process repository contents recursively with limitations
async function processContents(owner, repo, contents, path = '', maxDepth = 3, maxFiles = 500, currentDepth = 0, fileCount = { count: 0 }) {
    const result = {};
    
    // Stop if we've reached the maximum depth or file count
    if (currentDepth >= maxDepth || fileCount.count >= maxFiles) {
        if (currentDepth >= maxDepth) {
            console.log(`Max depth reached at ${path || 'root'}`);
        }
        if (fileCount.count >= maxFiles) {
            console.log(`Max file count reached (${fileCount.count}/${maxFiles})`);
        }
        return result;
    }
    
    // Sort contents to process directories first (makes the visualization more organized)
    const sortedContents = [...contents].sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return 0;
    });
    
    // Process up to maxFiles items
    for (const item of sortedContents) {
        // Skip certain directories and files that are typically large or not relevant
        if (shouldSkipItem(item.name, item.path)) {
            console.log(`Skipping: ${item.path}`);
            continue;
        }
        
        if (fileCount.count >= maxFiles) {
            console.log(`File limit reached at ${fileCount.count}`);
            break;
        }
        
        if (item.type === 'file') {
            fileCount.count++;
            
            // For large files, don't fetch content
            if (item.size > 100000) { // 100KB
                console.log(`Skipping large file content: ${item.path} (${item.size} bytes)`);
                result[item.name] = {
                    type: 'file',
                    language: getLanguageFromFilename(item.name),
                    content: `// File too large to display (${(item.size / 1024).toFixed(2)} KB)`,
                    outdated: false,
                    size: item.size
                };
                continue;
            }
            
            try {
                // Get file content
                const fileResponse = await github.get(item.download_url);
                
                // Determine language based on file extension
                const language = getLanguageFromFilename(item.name);
                
                // Check if the file is a dependency file (simplified for performance)
                const outdated = isDependencyFile(item.name);
                
                result[item.name] = {
                    type: 'file',
                    language,
                    content: typeof fileResponse.data === 'string' ? fileResponse.data : JSON.stringify(fileResponse.data, null, 2),
                    outdated,
                    size: item.size
                };
            } catch (error) {
                console.error(`Error fetching file ${item.path}:`, error.message);
                result[item.name] = {
                    type: 'file',
                    language: getLanguageFromFilename(item.name),
                    content: `// Error fetching file content: ${error.message}`,
                    outdated: false,
                    size: item.size
                };
            }
        } else if (item.type === 'dir') {
            try {
                // Only fetch subdirectories if we haven't reached the depth limit
                if (currentDepth < maxDepth - 1) {
                    // Get directory contents
                    const dirPath = path ? `${path}/${item.name}` : item.name;
                    const dirResponse = await github.get(`/repos/${owner}/${repo}/contents/${dirPath}`);
                    
                    result[item.name] = {
                        type: 'folder',
                        children: await processContents(
                            owner, 
                            repo, 
                            dirResponse.data, 
                            dirPath,
                            maxDepth,
                            maxFiles,
                            currentDepth + 1,
                            fileCount
                        )
                    };
                } else {
                    // We've reached max depth, add folder but don't process children
                    result[item.name] = {
                        type: 'folder',
                        children: {}
                    };
                }
            } catch (error) {
                console.error(`Error fetching directory ${item.path}:`, error.message);
                result[item.name] = {
                    type: 'folder',
                    children: {},
                    error: error.message
                };
            }
        }
    }
    
    return result;
}

// Determine if we should skip certain files/directories
function shouldSkipItem(name, path) {
    // Skip common large or non-essential directories
    const skipDirs = [
        'node_modules', '.git', 'dist', 'build', 'out', 'bin', 'obj',
        'assets', 'images', 'vendor', 'test', 'tests', 'lib',
        '.github'
    ];
    
    // Skip large binary or generated files
    const skipExtensions = [
        '.exe', '.dll', '.so', '.dylib', '.obj', '.bin',
        '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
        '.mp3', '.mp4', '.wav', '.avi', '.mov',
        '.zip', '.gz', '.tar', '.7z', '.rar'
    ];
    
    // Check directory patterns
    for (const dir of skipDirs) {
        if (path && (path.startsWith(dir + '/') || path === dir || path.includes(`/${dir}/`))) {
            return true;
        }
    }
    
    // Check file extensions
    for (const ext of skipExtensions) {
        if (name.endsWith(ext)) {
            return true;
        }
    }
    
    return false;
}

// Determine language from filename
function getLanguageFromFilename(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    
    const languageMap = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'javascript',
        'tsx': 'javascript',
        'py': 'python',
        'java': 'java',
        'html': 'html',
        'css': 'css',
        'scss': 'css',
        'json': 'json',
        'md': 'markdown',
        'c': 'c',
        'cpp': 'cpp',
        'h': 'c',
        'hpp': 'cpp',
        'cs': 'csharp',
        'go': 'go',
        'rb': 'ruby',
        'php': 'php',
        'rs': 'rust',
        'swift': 'swift',
        'kt': 'kotlin',
        'xml': 'xml',
        'yml': 'yaml',
        'yaml': 'yaml',
        'sh': 'shell',
        'bat': 'batch',
        'ps1': 'powershell'
    };
    
    return languageMap[extension] || 'unknown';
}

// Simplified dependency file check
function isDependencyFile(filename) {
    const dependencyFiles = [
        'package.json',
        'requirements.txt',
        'Gemfile',
        'build.gradle',
        'pom.xml',
        'Cargo.toml',
        'composer.json'
    ];
    
    return dependencyFiles.includes(filename);
}

module.exports = router;