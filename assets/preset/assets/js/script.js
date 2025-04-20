// Loading Screen Management
document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.querySelector('.main-content');
    
    // Show loading screen initially
    loadingScreen.style.display = 'flex';
    loadingScreen.style.opacity = '1';
    mainContent.style.display = 'none';
    
    // Simulate loading time (you can remove this in production)
    setTimeout(() => {
        // Hide loading screen and show main content
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainContent.style.display = 'block';
            setTimeout(() => {
                mainContent.style.opacity = '1';
            }, 100);
        }, 500);
    }, 2000);
});

// ... rest of your existing JavaScript code ... 