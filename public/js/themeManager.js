// Theme manager script
document.addEventListener('DOMContentLoaded', function() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            themeButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Remove all theme classes from body
            document.body.classList.remove('theme-dark', 'theme-cyberpunk', 'theme-forest', 'theme-sunset');
            
            // Add selected theme class to body
            document.body.classList.add(button.dataset.theme);
            
            // Save theme preference to localStorage
            localStorage.setItem('theme', button.dataset.theme);
        });
    });
});