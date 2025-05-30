// Create space background
function createSpaceBackground() {
    // Create stars container
    const starsContainer = document.createElement('div');
    starsContainer.className = 'stars-container';
    document.body.appendChild(starsContainer);
    
    // Create galaxy
    const galaxy = document.createElement('div');
    galaxy.className = 'galaxy';
    document.body.appendChild(galaxy);
    
    // Create stars
    const starCount = 200;
    const starSizes = ['star-small', 'star-medium', 'star-large'];
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = `star ${starSizes[Math.floor(Math.random() * starSizes.length)]}`;
        
        // Random position
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        
        // Random animation delay
        star.style.animationDelay = Math.random() * 3 + 's';
        
        starsContainer.appendChild(star);
    }
    
    // Create shooting stars
    function createShootingStar() {
        const shootingStar = document.createElement('div');
        shootingStar.className = 'shooting-star';
        
        // Random starting position
        shootingStar.style.left = '-100px';
        shootingStar.style.top = Math.random() * 50 + '%';
        
        starsContainer.appendChild(shootingStar);
        
        // Remove after animation
        setTimeout(() => {
            if (shootingStar.parentNode) {
                shootingStar.parentNode.removeChild(shootingStar);
            }
        }, 8000);
    }
    
    // Create shooting stars periodically
    setInterval(createShootingStar, 5000);
}

// Initialize space background when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    createSpaceBackground();
});