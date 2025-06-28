// Optimized space background with selected performance improvements
function createSpaceBackground() {
    // Create stars container with hardware acceleration
    const starsContainer = document.createElement('div');
    starsContainer.className = 'stars-container';
    starsContainer.style.willChange = 'transform';
    document.body.appendChild(starsContainer);
    
    // Create galaxy core with hardware acceleration
    const galaxy = document.createElement('div');
    galaxy.className = 'galaxy';
    galaxy.style.willChange = 'transform';
    starsContainer.appendChild(galaxy);
    
    // Create spiral arms with hardware acceleration
    for (let i = 0; i < 8; i++) {
        const arm = document.createElement('div');
        arm.className = 'spiral-arm';
        arm.style.transform = `rotate(${i * 45}deg)`;
        arm.style.willChange = 'transform';
        galaxy.appendChild(arm);
    }
    
    // DOM Batching: Batch DOM operations for stars
    const fragment = document.createDocumentFragment();
    const starCount = 400;
    const starSizes = ['star-small', 'star-medium', 'star-large'];
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = `star ${starSizes[Math.floor(Math.random() * starSizes.length)]}`;
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 5 + 's';
        star.style.willChange = 'opacity';
        
        fragment.appendChild(star);
    }
    
    starsContainer.appendChild(fragment);
    
    // Object Pooling: Pre-create shooting star elements
    let shootingStarCount = 0;
    const maxShootingStars = 4;
    const shootingStarPool = [];
    
    for (let i = 0; i < maxShootingStars; i++) {
        const shootingStar = document.createElement('div');
        shootingStar.className = 'shooting-star';
        shootingStar.style.willChange = 'transform';
        shootingStarPool.push(shootingStar);
    }
    
    function createShootingStar() {
        if (shootingStarCount >= maxShootingStars) return;
        
        const shootingStar = shootingStarPool[shootingStarCount];
        shootingStarCount++;
        
        // Reset and configure
        const topStart = Math.random() * 100;
        const angle = Math.random() * 30 - 15;
        const size = 1 + Math.random() * 3;
        const speed = 3 + Math.random() * 3;
        
        shootingStar.style.top = `${topStart}%`;
        shootingStar.style.setProperty('--angle', `${angle}deg`);
        shootingStar.style.width = `${size}px`;
        shootingStar.style.height = `${size}px`;
        shootingStar.style.animationDuration = `${speed}s`;
        
        starsContainer.appendChild(shootingStar);
        
        // Remove and reset counter
        setTimeout(() => {
            if (shootingStar.parentNode) {
                shootingStar.parentNode.removeChild(shootingStar);
            }
            shootingStarCount--;
        }, speed * 1000);
    }
    
    // Create shooting stars with original intervals
    setInterval(createShootingStar, 800);
    setInterval(createShootingStar, 1200);
    setInterval(createShootingStar, 1600);
    
    // Visibility API: Pause animations when tab is not visible
    document.addEventListener('visibilitychange', () => {
        const isVisible = !document.hidden;
        starsContainer.style.animationPlayState = isVisible ? 'running' : 'paused';
        
        // Pause all child animations
        const allAnimated = starsContainer.querySelectorAll('.star, .spiral-arm, .shooting-star');
        allAnimated.forEach(el => {
            el.style.animationPlayState = isVisible ? 'running' : 'paused';
        });
    });
}

// Faster Initialization: Use requestAnimationFrame for smooth initialization
function initializeBackground() {
    requestAnimationFrame(() => {
        createSpaceBackground();
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBackground);
} else {
    initializeBackground();
}