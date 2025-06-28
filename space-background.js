// Mobile-optimized space background with performance improvements
function createSpaceBackground() {
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth <= 768;
    
    // Reduce complexity on mobile
    const starCount = isMobile ? 150 : 400;
    const spiralArms = isMobile ? 4 : 8;
    const maxShootingStars = isMobile ? 2 : 4;
    
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
    
    // Create spiral arms with reduced count on mobile
    for (let i = 0; i < spiralArms; i++) {
        const arm = document.createElement('div');
        arm.className = 'spiral-arm';
        arm.style.transform = `rotate(${i * (360/spiralArms)}deg)`;
        arm.style.willChange = 'transform';
        galaxy.appendChild(arm);
    }
    
    // DOM Batching: Batch DOM operations for stars
    const fragment = document.createDocumentFragment();
    const starSizes = isMobile ? ['star-small', 'star-medium'] : ['star-small', 'star-medium', 'star-large'];
    
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
    
    // Canvas-based shooting stars with mobile optimization
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    canvas.style.willChange = 'transform';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    let animationId;
    let isCanvasVisible = true;
    let lastTime = 0;
    const targetFPS = isMobile ? 30 : 60;
    const frameInterval = 1000 / targetFPS;
    
    function resizeCanvas() {
        // Use device pixel ratio for crisp rendering but limit on mobile
        const pixelRatio = isMobile ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio;
        canvas.width = window.innerWidth * pixelRatio;
        canvas.height = window.innerHeight * pixelRatio;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.scale(pixelRatio, pixelRatio);
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Shooting star system
    const shootingStars = [];
    
    class ShootingStar {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = -50;
            this.y = Math.random() * window.innerHeight;
            this.length = isMobile ? 30 + Math.random() * 50 : 50 + Math.random() * 100;
            this.speed = isMobile ? 2 + Math.random() * 3 : 3 + Math.random() * 5;
            this.angle = (Math.random() * 30 - 15) * Math.PI / 180;
            this.opacity = 1;
            this.size = isMobile ? 1 + Math.random() : 1 + Math.random() * 2;
            this.active = true;
        }
        
        update() {
            if (!this.active) return;
            
            this.x += this.speed * Math.cos(this.angle);
            this.y += this.speed * Math.sin(this.angle);
            
            if (this.x > window.innerWidth + 100 || this.y > window.innerHeight + 100 || this.y < -100) {
                this.active = false;
            }
        }
        
        draw() {
            if (!this.active) return;
            
            ctx.save();
            ctx.globalAlpha = this.opacity;
            
            const gradient = ctx.createLinearGradient(
                this.x, this.y,
                this.x - this.length * Math.cos(this.angle),
                this.y - this.length * Math.sin(this.angle)
            );
            
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#87ceeb');
            gradient.addColorStop(1, 'transparent');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = this.size;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x - this.length * Math.cos(this.angle),
                this.y - this.length * Math.sin(this.angle)
            );
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    // Initialize shooting stars
    for (let i = 0; i < maxShootingStars; i++) {
        shootingStars.push(new ShootingStar());
        shootingStars[i].active = false;
    }
    
    function createShootingStar() {
        const inactiveStar = shootingStars.find(star => !star.active);
        if (inactiveStar) {
            inactiveStar.reset();
        }
    }
    
    function animate(currentTime) {
        if (!isCanvasVisible) {
            animationId = requestAnimationFrame(animate);
            return;
        }
        
        // Throttle frame rate on mobile
        if (currentTime - lastTime < frameInterval) {
            animationId = requestAnimationFrame(animate);
            return;
        }
        
        lastTime = currentTime;
        
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        
        shootingStars.forEach(star => {
            star.update();
            star.draw();
        });
        
        animationId = requestAnimationFrame(animate);
    }
    
    animate();
    
    // Create shooting stars with adjusted intervals for mobile
    const intervals = isMobile ? [1500, 2000] : [800, 1200, 1600];
    intervals.forEach(interval => {
        setInterval(createShootingStar, interval);
    });
    
    // Visibility API: Pause animations when tab is not visible
    document.addEventListener('visibilitychange', () => {
        const isVisible = !document.hidden;
        isCanvasVisible = isVisible;
        starsContainer.style.animationPlayState = isVisible ? 'running' : 'paused';
        
        // Pause all child animations
        const allAnimated = starsContainer.querySelectorAll('.star, .spiral-arm');
        allAnimated.forEach(el => {
            el.style.animationPlayState = isVisible ? 'running' : 'paused';
        });
    });
    
    // Pause animations on mobile when scrolling
    if (isMobile) {
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            isCanvasVisible = false;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isCanvasVisible = true;
            }, 150);
        });
    }
}

// Initialize when DOM is ready
function initializeBackground() {
    requestAnimationFrame(() => {
        createSpaceBackground();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBackground);
} else {
    initializeBackground();
}