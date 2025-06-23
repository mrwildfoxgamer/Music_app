// Enhanced Space Background for Music Player
document.addEventListener('DOMContentLoaded', () => {
    // Create the main space container
    const spaceContainer = document.createElement('div');
    spaceContainer.className = 'space-container';
    document.body.appendChild(spaceContainer);
    
    // Create nebula background layer
    const nebula = document.createElement('div');
    nebula.className = 'nebula';
    spaceContainer.appendChild(nebula);
    
    // Create galaxy container
    const galaxy = document.createElement('div');
    galaxy.className = 'galaxy';
    spaceContainer.appendChild(galaxy);
    
    // Create galaxy core
    const galaxyCore = document.createElement('div');
    galaxyCore.className = 'galaxy-core';
    galaxy.appendChild(galaxyCore);
    
    // Create galaxy arms
    for (let i = 0; i < 3; i++) {
        const arm = document.createElement('div');
        arm.className = 'galaxy-arm';
        arm.style.setProperty('--rotation', `${i * 120}deg`);
        galaxy.appendChild(arm);
    }
    
    // Create stars container
    const starsContainer = document.createElement('div');
    starsContainer.className = 'stars-container';
    spaceContainer.appendChild(starsContainer);
    
    // Create stars layers (distant, medium, close)
    const starLayers = ['distant', 'medium', 'close'];
    
    starLayers.forEach(layer => {
        const layerContainer = document.createElement('div');
        layerContainer.className = `stars-layer ${layer}`;
        starsContainer.appendChild(layerContainer);
        
        // Create stars for this layer
        const starCount = layer === 'distant' ? 250 : layer === 'medium' ? 150 : 100;
        const starSizes = layer === 'distant' ? ['star-tiny'] : 
                         layer === 'medium' ? ['star-small'] : 
                         ['star-medium', 'star-large'];
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = `star ${starSizes[Math.floor(Math.random() * starSizes.length)]}`;
            
            // Random position
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            
            // Random animation delay and duration for more natural feel
            star.style.animationDelay = Math.random() * 5 + 's';
            star.style.animationDuration = (Math.random() * 3 + 2) + 's';
            
            layerContainer.appendChild(star);
        }
    });
    
    // Create shooting stars
    function createShootingStar() {
        const shootingStar = document.createElement('div');
        shootingStar.className = 'shooting-star';
        
        // Random starting position (from top edge)
        const startX = Math.random() * 100;
        shootingStar.style.left = startX + '%';
        shootingStar.style.top = '-20px';
        
        // Random trajectory (downward at various angles)
        const angle = Math.random() * 60 - 30; // -30 to 30 degrees
        const distance = 120 + Math.random() * 80; // 120-200vh
        shootingStar.style.setProperty('--angle', `${angle}deg`);
        shootingStar.style.setProperty('--distance', `${distance}vh`);
        
        // Random color (white, blue, or yellow)
        const colors = ['#ffffff', '#5d8aa8', '#f0e68c'];
        shootingStar.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        starsContainer.appendChild(shootingStar);
        
        // Remove after animation
        setTimeout(() => {
            if (shootingStar.parentNode) {
                shootingStar.parentNode.removeChild(shootingStar);
            }
        }, 3000);
    }
    
    // Create shooting stars periodically
    setInterval(createShootingStar, 3000);
    
    // Create occasional large shooting stars
    function createLargeShootingStar() {
        const shootingStar = document.createElement('div');
        shootingStar.className = 'shooting-star large';
        
        // Random starting position
        const startX = Math.random() * 100;
        shootingStar.style.left = startX + '%';
        shootingStar.style.top = '-40px';
        
        // Random trajectory
        const angle = Math.random() * 30 - 15; // -15 to 15 degrees
        const distance = 150 + Math.random() * 100; // 150-250vh
        shootingStar.style.setProperty('--angle', `${angle}deg`);
        shootingStar.style.setProperty('--distance', `${distance}vh`);
        
        // Yellow-orange color
        shootingStar.style.backgroundColor = '#ffa500';
        
        starsContainer.appendChild(shootingStar);
        
        // Remove after animation
        setTimeout(() => {
            if (shootingStar.parentNode) {
                shootingStar.parentNode.removeChild(shootingStar);
            }
        }, 4000);
    }
    
    // Create large shooting stars less frequently
    setInterval(createLargeShootingStar, 10000);
    
    // Create floating space dust particles
    const dustContainer = document.createElement('div');
    dustContainer.className = 'dust-container';
    spaceContainer.appendChild(dustContainer);
    
    for (let i = 0; i < 50; i++) {
        const dust = document.createElement('div');
        dust.className = 'dust-particle';
        
        // Random position
        dust.style.left = Math.random() * 100 + '%';
        dust.style.top = Math.random() * 100 + '%';
        
        // Random size
        const size = 0.5 + Math.random() * 1.5;
        dust.style.width = size + 'px';
        dust.style.height = size + 'px';
        
        // Random animation
        dust.style.animationDuration = (10 + Math.random() * 20) + 's';
        dust.style.animationDelay = Math.random() * 10 + 's';
        
        dustContainer.appendChild(dust);
    }
    
    // Add a subtle color shift animation to the nebula
    function animateNebula() {
        const hue = (Date.now() / 100000) % 360;
        nebula.style.background = `radial-gradient(circle at center, 
            hsl(${hue}, 70%, 15%) 0%, 
            hsl(${(hue + 60) % 360}, 85%, 8%) 50%, 
            hsl(${(hue + 120) % 360}, 95%, 5%) 100%)`;
        requestAnimationFrame(animateNebula);
    }
    
    animateNebula();
});