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
    
    // Canvas-based shooting stars
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
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Shooting star system
    const shootingStars = [];
    const maxShootingStars = 4;
    
    class ShootingStar {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = -50;
            this.y = Math.random() * canvas.height;
            this.length = 50 + Math.random() * 100;
            this.speed = 3 + Math.random() * 5;
            this.angle = (Math.random() * 30 - 15) * Math.PI / 180;
            this.opacity = 1;
            this.size = 1 + Math.random() * 2;
            this.active = true;
        }
        
        update() {
            if (!this.active) return;
            
            this.x += this.speed * Math.cos(this.angle);
            this.y += this.speed * Math.sin(this.angle);
            
            if (this.x > canvas.width + 100 || this.y > canvas.height + 100 || this.y < -100) {
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
    
    function animate() {
        if (!isCanvasVisible) {
            animationId = requestAnimationFrame(animate);
            return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        shootingStars.forEach(star => {
            star.update();
            star.draw();
        });
        
        animationId = requestAnimationFrame(animate);
    }
    
    animate();
    
    // Create shooting stars with original intervals
    setInterval(createShootingStar, 800);
    setInterval(createShootingStar, 1200);
    setInterval(createShootingStar, 1600);
    
    // Visibility API: Pause animations when tab is not visible
    document.addEventListener('visibilitychange', () => {
        const isVisible = !document.hidden;
        isCanvasVisible = isVisible;
        starsContainer.style.animationPlayState = isVisible ? 'running' : 'paused';
        
        // Pause DOM-based animations
        const allAnimated = starsContainer.querySelectorAll('.star, .spiral-arm');
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