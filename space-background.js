// Optimized space background with mobile performance improvements
function createSpaceBackground() {
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    // Adjust counts based on device
    const starCount = isMobile ? 150 : 400;
    const spiralArms = isMobile ? 4 : 8;
    
    // Create stars container with hardware acceleration
    const starsContainer = document.createElement('div');
    starsContainer.className = 'stars-container';
    starsContainer.style.willChange = 'transform';
    document.body.appendChild(starsContainer);
    
    // Create galaxy core
    const galaxy = document.createElement('div');
    galaxy.className = 'galaxy';
    galaxy.style.willChange = 'transform';
    starsContainer.appendChild(galaxy);
    
    // Create spiral arms with reduced count on mobile
    for (let i = 0; i < spiralArms; i++) {
        const arm = document.createElement('div');
        arm.className = 'spiral-arm';
        arm.style.transform = `rotate(${i * (360/spiralArms)}deg)`;
        arm.style.willChange = 'transform';
        galaxy.appendChild(arm);
    }
    
    // Batch DOM operations for stars
    const fragment = document.createDocumentFragment();
    const starSizes = ['star-small', 'star-medium', 'star-large'];
    const starWeights = [0.7, 0.25, 0.05]; // More small stars, fewer large ones
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        
        // Weighted random selection for star sizes
        const rand = Math.random();
        let sizeIndex = 0;
        let cumWeight = 0;
        for (let j = 0; j < starWeights.length; j++) {
            cumWeight += starWeights[j];
            if (rand <= cumWeight) {
                sizeIndex = j;
                break;
            }
        }
        
        star.className = `star ${starSizes[sizeIndex]}`;
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 5 + 's';
        star.style.willChange = 'opacity';
        
        fragment.appendChild(star);
    }
    
    starsContainer.appendChild(fragment);
    
    // Optimized shooting star system
    let shootingStarCount = 0;
    const maxShootingStars = isMobile ? 2 : 4;
    const shootingStarPool = [];
    
    // Pre-create shooting star elements
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
        const size = 1 + Math.random() * 2; // Smaller max size
        const speed = 2 + Math.random() * 2; // Faster animation
        
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
    
    // Reduced frequency for mobile
    const intervals = isMobile ? [2000, 3000] : [800, 1200, 1600];
    intervals.forEach(interval => {
        setInterval(createShootingStar, interval);
    });
    
    // Pause animations when tab is not visible
    let isVisible = true;
    document.addEventListener('visibilitychange', () => {
        isVisible = !document.hidden;
        starsContainer.style.animationPlayState = isVisible ? 'running' : 'paused';
        
        // Pause all child animations
        const allAnimated = starsContainer.querySelectorAll('.star, .spiral-arm, .shooting-star');
        allAnimated.forEach(el => {
            el.style.animationPlayState = isVisible ? 'running' : 'paused';
        });
    });
    
    // Reduce frame rate on mobile using intersection observer
    if (isMobile) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                } else {
                    entry.target.style.animationPlayState = 'paused';
                }
            });
        }, { threshold: 0.1 });
        
        // Observe only shooting stars for mobile optimization
        const shootingStars = starsContainer.querySelectorAll('.shooting-star');
        shootingStars.forEach(star => observer.observe(star));
    }
}

// Use requestAnimationFrame for smooth initialization
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