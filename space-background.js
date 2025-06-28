// Optimized space background with canvas stars and DOM shooting stars
function createSpaceBackground() {
    // Create main container
    const starsContainer = document.createElement('div');
    starsContainer.className = 'stars-container';
    starsContainer.style.willChange = 'transform';
    document.body.appendChild(starsContainer);
    
    // Create canvas for background stars
    const canvas = document.createElement('canvas');
    canvas.className = 'stars-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    starsContainer.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
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
    
    // Canvas stars data
    const stars = [];
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const starCount = isMobile ? 300 : 400;
    
    // Initialize stars
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            opacity: Math.random(),
            opacityDirection: Math.random() > 0.5 ? 1 : -1,
            twinkleSpeed: Math.random() * 0.02 + 0.005
        });
    }
    
    // Animation loop for canvas stars
    let animationId;
    function animateStars() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        stars.forEach(star => {
            // Update opacity for twinkling effect
            star.opacity += star.opacityDirection * star.twinkleSpeed;
            if (star.opacity <= 0 || star.opacity >= 1) {
                star.opacityDirection *= -1;
                star.opacity = Math.max(0, Math.min(1, star.opacity));
            }
            
            // Draw star
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        if (!document.hidden) {
            animationId = requestAnimationFrame(animateStars);
        }
    }
    
    // Start animation
    animateStars();
    
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
   
    
    // Visibility API: Pause animations when tab is not visible
    document.addEventListener('visibilitychange', () => {
        const isVisible = !document.hidden;
        
        if (isVisible) {
            animateStars();
        } else {
            cancelAnimationFrame(animationId);
        }
        
        // Pause spiral arms and shooting stars
        const allAnimated = starsContainer.querySelectorAll('.spiral-arm, .shooting-star');
        allAnimated.forEach(el => {
            el.style.animationPlayState = isVisible ? 'running' : 'paused';
        });
    });
    
    // Handle window resize for stars
    window.addEventListener('resize', () => {
        stars.forEach(star => {
            star.x = Math.random() * canvas.width;
            star.y = Math.random() * canvas.height;
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