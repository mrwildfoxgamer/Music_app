// Create enhanced space background
function createSpaceBackground() {
    // Create stars container
    const starsContainer = document.createElement('div');
    starsContainer.className = 'stars-container';
    document.body.appendChild(starsContainer);
    
    // Create galaxy core
    const galaxy = document.createElement('div');
    galaxy.className = 'galaxy';
    starsContainer.appendChild(galaxy);
    
   
    
    // Create stars
    const starCount = 300;
    const starSizes = ['star-small', 'star-medium', 'star-large'];
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = `star ${starSizes[Math.floor(Math.random() * starSizes.length)]}`;
        
        // Random position
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        
        // Random animation delay
        star.style.animationDelay = Math.random() * 5 + 's';
        
        starsContainer.appendChild(star);
    }
    
    // Create shooting stars
    function createShootingStar() {
        const shootingStar = document.createElement('div');
        shootingStar.className = 'shooting-star';
        
        // Random starting position and angle
        const topStart = Math.random() * 100;
        const angle = Math.random() * 30 - 15;
        
        shootingStar.style.top = `${topStart}%`;
        shootingStar.style.setProperty('--angle', `${angle}deg`);
        
        // Random size and speed
        const size = 1 + Math.random() * 3;
        const speed = 3 + Math.random() * 3;
        
        shootingStar.style.width = `${size}px`;
        shootingStar.style.height = `${size}px`;
        shootingStar.style.animationDuration = `${speed}s`;
        
        starsContainer.appendChild(shootingStar);
        
        // Remove after animation
        setTimeout(() => {
            if (shootingStar.parentNode) {
                shootingStar.parentNode.removeChild(shootingStar);
            }
        }, speed * 1000);
    }
    
    // Create shooting stars more frequently
    setInterval(createShootingStar, 800);
    setInterval(createShootingStar, 1200);
    setInterval(createShootingStar, 1600);
}

// Initialize space background when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    createSpaceBackground();
});