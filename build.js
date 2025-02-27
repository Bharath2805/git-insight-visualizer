// build.js - Script to bundle and minify JavaScript and CSS files
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// Configuration
const config = {
  js: {
    srcDir: 'public/js',
    destDir: 'dist/js',
    bundle: 'bundle.min.js',
    files: [
      'animationManager.js',
      'themeManager.js',
      'fileExplorer.js',
      'visualization.js',
      'chatHandler.js',
      'main.js'
    ]
  }
};

// Create directories if they don't exist
function createDirs() {
  const dirs = [
    config.js.destDir
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

// Bundle and minify JavaScript
async function bundleJS() {
  console.log('📦 Bundling JavaScript...');
  
  try {
    // Read and concatenate all JS files
    let bundleContent = '';
    
    for (const file of config.js.files) {
      const filePath = path.join(config.js.srcDir, file);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        bundleContent += `// ${file}\n${content}\n`;
        console.log(`Added ${file}`);
      } else {
        console.warn(`Warning: File ${filePath} does not exist, skipping.`);
      }
    }
    
    // Minify the bundle
    console.log('🔨 Minifying JavaScript...');
    const minified = await minify(bundleContent, {
      compress: {
        drop_console: false,  // Keep console logs for debugging
        drop_debugger: true
      },
      mangle: true,
      output: {
        comments: false
      }
    });
    
    // Write the minified bundle
    const bundlePath = path.join(config.js.destDir, config.js.bundle);
    fs.writeFileSync(bundlePath, minified.code);
    
    // Calculate size reduction
    const originalSize = Buffer.byteLength(bundleContent, 'utf8');
    const minifiedSize = Buffer.byteLength(minified.code, 'utf8');
    
    console.log(`✅ JavaScript bundle created: ${bundlePath}`);
    console.log(`   Original size: ${formatSize(originalSize)}`);
    console.log(`   Minified size: ${formatSize(minifiedSize)} (${getPercentage(minifiedSize, originalSize)}% of original)`);
  } catch (error) {
    console.error(`❌ Error bundling JavaScript: ${error.message}`);
    process.exit(1);
  }
}

// Format file size in a human-readable way
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Calculate percentage
function getPercentage(part, whole) {
  return Math.round((part / whole) * 100);
}

// Main build function
async function build() {
  console.log('🚀 Starting build process...');
  
  const startTime = Date.now();
  
  createDirs();
  await bundleJS();
  
  const duration = Date.now() - startTime;
  console.log(`✨ Build completed in ${duration}ms`);
}

// Run the build process
build().catch(error => {
  console.error(`❌ Build failed: ${error.message}`);
  process.exit(1);
});