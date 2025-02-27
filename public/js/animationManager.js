/**
 * Animation Manager
 * Uses SVG animations instead of Lottie to avoid loading issues
 */

// Wrap entire file in IIFE to prevent global scope pollution
(function(global) {
    // Store references to active animations
    let currentLanguageAnim = null;
    let currentCharacterAnim = null;
    let logoAnim = null;
    let loadingAnim = null;

    /**
     * Initialize the main UI animations with SVG
     */
    function initializeAnimations() {
        try {
            const logoContainer = document.getElementById('logo-animation');
            const loadingContainer = document.getElementById('loading-animation');
            
            if (logoContainer) {
                // Create SVG logo animation
                logoContainer.innerHTML = `<svg width="60" height="60" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="25" fill="#58a6ff">
                        <animate attributeName="r" values="20;25;20" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0.8;1" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="30" cy="30" r="15" fill="#0d1117">
                        <animate attributeName="r" values="12;15;12" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <path d="M20,30 L25,25 L35,35 L40,30" stroke="#58a6ff" stroke-width="3" fill="none" stroke-linecap="round">
                        <animate attributeName="d" values="M20,30 L25,25 L35,35 L40,30;M20,30 L25,35 L35,25 L40,30;M20,30 L25,25 L35,35 L40,30" dur="3s" repeatCount="indefinite" />
                    </path>
                </svg>`;
            }
            
            if (loadingContainer) {
                // Create SVG loading animation
                loadingContainer.innerHTML = `<svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#58a6ff" stroke-width="8" fill="none" stroke-linecap="round">
                        <animate attributeName="stroke-dasharray" values="1, 250;125, 125;250, 1" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="stroke-dashoffset" values="0;-250;-500" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="50" cy="50" r="30" stroke="#8b949e" stroke-width="4" fill="none" stroke-dasharray="1, 150" stroke-dashoffset="0">
                        <animate attributeName="stroke-dashoffset" values="0;150;0" dur="3s" repeatCount="indefinite" />
                    </circle>
                </svg>`;
            }
        } catch (error) {
            console.error('Error initializing SVG animations:', error);
        }
    }

    /**
     * Load a language-specific animation
     * @param {string} language - Programming language identifier
     */
    function loadLanguageAnimation(language) {
        try {
            // Get the container element
            const container = document.getElementById('language-animation');
            if (!container) return;
            
            // Remove previous content
            container.innerHTML = '';

            // Create SVG based on language
            let fallbackColor = '#58a6ff';  // Default blue
            
            switch (language) {
                case 'javascript':
                    fallbackColor = '#f0db4f';
                    break;
                case 'python':
                    fallbackColor = '#3572A5';
                    break;
                case 'java':
                    fallbackColor = '#b07219';
                    break;
                case 'html':
                    fallbackColor = '#e34c26';
                    break;
                case 'css':
                    fallbackColor = '#563d7c';
                    break;
                case 'json':
                    fallbackColor = '#5dbcd2';
                    break;
                case 'markdown':
                    fallbackColor = '#083fa1';
                    break;
                default:
                    fallbackColor = '#58a6ff';
            }
            
            container.innerHTML = `<svg width="150" height="150" viewBox="0 0 150 150">
                <rect x="25" y="25" width="100" height="100" fill="${fallbackColor}" opacity="0.3" rx="15" ry="15">
                    <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite" />
                </rect>
                <rect x="45" y="45" width="60" height="60" fill="${fallbackColor}" opacity="0.6" rx="10" ry="10">
                    <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="width" values="55;60;55" dur="4s" repeatCount="indefinite" />
                    <animate attributeName="height" values="55;60;55" dur="4s" repeatCount="indefinite" />
                    <animate attributeName="x" values="47;45;47" dur="4s" repeatCount="indefinite" />
                    <animate attributeName="y" values="47;45;47" dur="4s" repeatCount="indefinite" />
                </rect>
                <text x="75" y="85" font-family="monospace" font-size="16" text-anchor="middle" fill="white">${language}</text>
            </svg>`;
            
            // Add classes for special effects
            container.classList.add('fade-in');
        } catch (error) {
            console.error('Error loading language animation:', error);
        }
    }

    /**
     * Load a character animation based on language
     * @param {string} language - Programming language identifier
     */
    function loadCharacterAnimation(language) {
        try {
            // Get the container element
            const container = document.getElementById('character-container');
            if (!container) return;
            
            // Remove previous content
            container.innerHTML = '';

            // Remove any existing animation classes
            container.classList.remove('float', 'bounce');

            // Create SVG character based on language
            let svgContent = '';
            let className = 'float';
            
            switch (language) {
                case 'javascript':
                    svgContent = `
                        <svg width="120" height="120" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="50" fill="#f0db4f" />
                            <circle cx="40" cy="50" r="7" fill="#000" />
                            <circle cx="80" cy="50" r="7" fill="#000" />
                            <path d="M40,75 Q60,90 80,75" stroke="#000" stroke-width="4" fill="none" />
                            <text x="60" y="40" font-family="monospace" font-size="10" text-anchor="middle">JS</text>
                        </svg>
                    `;
                    className = 'float';
                    break;
                case 'python':
                    svgContent = `
                        <svg width="120" height="120" viewBox="0 0 120 120">
                            <path d="M20,60 Q60,20 100,60 Q60,100 20,60" fill="#3572A5" />
                            <circle cx="40" cy="50" r="7" fill="#fff" />
                            <circle cx="80" cy="50" r="7" fill="#fff" />
                            <path d="M45,80 Q60,70 75,80" stroke="#fff" stroke-width="3" fill="none" />
                            <text x="60" y="40" font-family="monospace" font-size="10" text-anchor="middle" fill="white">PY</text>
                        </svg>
                    `;
                    className = 'bounce';
                    break;
                case 'java':
                    svgContent = `
                        <svg width="120" height="120" viewBox="0 0 120 120">
                            <rect x="35" y="30" width="50" height="70" rx="10" fill="#b07219" />
                            <rect x="45" y="20" width="30" height="20" rx="5" fill="#b07219" />
                            <circle cx="40" cy="50" r="5" fill="#fff" />
                            <circle cx="80" cy="50" r="5" fill="#fff" />
                            <path d="M50,80 L70,80" stroke="#fff" stroke-width="3" />
                            <text x="60" y="40" font-family="monospace" font-size="10" text-anchor="middle" fill="white">JAVA</text>
                        </svg>
                    `;
                    className = 'float';
                    break;
                case 'json':
                    svgContent = `
                        <svg width="120" height="120" viewBox="0 0 120 120">
                            <rect x="30" y="30" width="60" height="60" rx="5" fill="#5dbcd2" />
                            <circle cx="45" cy="50" r="5" fill="#fff" />
                            <circle cx="75" cy="50" r="5" fill="#fff" />
                            <path d="M45,80 Q60,70 75,80" stroke="#fff" stroke-width="3" fill="none" />
                            <text x="60" y="100" font-family="monospace" font-size="10" text-anchor="middle" fill="#5dbcd2">JSON</text>
                        </svg>
                    `;
                    className = 'float';
                    break;
                case 'markdown':
                    svgContent = `
                        <svg width="120" height="120" viewBox="0 0 120 120">
                            <rect x="30" y="20" width="60" height="80" rx="5" fill="#083fa1" />
                            <line x1="40" y1="40" x2="80" y2="40" stroke="#fff" stroke-width="2" />
                            <line x1="40" y1="50" x2="80" y2="50" stroke="#fff" stroke-width="2" />
                            <line x1="40" y1="60" x2="80" y2="60" stroke="#fff" stroke-width="2" />
                            <line x1="40" y1="70" x2="60" y2="70" stroke="#fff" stroke-width="2" />
                            <circle cx="45" cy="30" r="5" fill="#fff" />
                            <circle cx="75" cy="30" r="5" fill="#fff" />
                            <text x="60" y="105" font-family="monospace" font-size="10" text-anchor="middle" fill="#083fa1">MD</text>
                        </svg>
                    `;
                    className = 'float';
                    break;
                default:
                    svgContent = `
                        <svg width="120" height="120" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="50" fill="#58a6ff" />
                            <circle cx="40" cy="50" r="7" fill="#fff" />
                            <circle cx="80" cy="50" r="7" fill="#fff" />
                            <path d="M40,75 Q60,90 80,75" stroke="#fff" stroke-width="4" fill="none" />
                            <text x="60" y="40" font-family="monospace" font-size="10" text-anchor="middle" fill="white">CODE</text>
                        </svg>
                    `;
                    className = 'float';
            }

            // Set SVG content and animation class
            container.innerHTML = svgContent;
            container.classList.add(className);
            
            // Add fade-in effect
            container.classList.add('fade-in');
        } catch (error) {
            console.error('Error loading character animation:', error);
        }
    }

    /**
     * Show character speech bubble with message
     * @param {string} message - The text to display in the speech bubble
     * @param {number} duration - How long to show the bubble (milliseconds)
     */
    function showSpeechBubble(message, duration = 5000) {
        try {
            const speechBubble = document.getElementById('speech-bubble');
            if (!speechBubble) return;
            
            speechBubble.textContent = message;
            speechBubble.classList.add('active');
            
            // Hide the speech bubble after the specified duration
            setTimeout(() => {
                speechBubble.classList.remove('active');
            }, duration);
        } catch (error) {
            console.error('Error showing speech bubble:', error);
        }
    }

    /**
     * Show the loading animation overlay
     */
    function showLoading() {
        try {
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('active');
            }
        } catch (error) {
            console.error('Error showing loading overlay:', error);
        }
    }

    /**
     * Hide the loading animation overlay
     */
    function hideLoading() {
        try {
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.classList.remove('active');
            }
        } catch (error) {
            console.error('Error hiding loading overlay:', error);
        }
    }

    /**
     * Play a quick celebration animation
     * @param {string} type - Type of celebration ('success', 'info', 'warning')
     */
    function playCelebration(type = 'success') {
        try {
            const container = document.getElementById('character-container');
            if (!container) return;
            
            // Add the celebration class temporarily
            container.classList.add('bounce');

            // Remove the class after animation
            setTimeout(() => {
                container.classList.remove('bounce');
            }, 1000);  // Adjust timing to match your CSS animation
        } catch (error) {
            console.error('Error playing celebration animation:', error);
        }
    }

    // Universal module definition
    const AnimationManager = {
        initializeAnimations,
        loadLanguageAnimation,
        loadCharacterAnimation,
        showSpeechBubble,
        showLoading,
        hideLoading,
        playCelebration
    };

    // Export for different module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AnimationManager;
    }

    if (typeof define === 'function' && define.amd) {
        define([], function() { return AnimationManager; });
    }

    // Attach to global object (window in browser)
    global.AnimationManager = AnimationManager;

})(typeof window !== 'undefined' ? window : this);