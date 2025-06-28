// Enhanced canvas-based space background
class CanvasSpaceBackground {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.stars = [];
        this.shootingStars = [];
        this.animationId = null;
        this.lastTime = 0;
        
        // Performance settings
        this.starCount = 400;
        this.maxShootingStars = 3;
        this.shootingStarPool = [];
        
        // Canvas dimensions
        this.width = 0;
        this.height = 0;
        
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.setupStars();
        this.createShootingStarPool();
        this.setupEventListeners();
        this.animate();
    }
    
    createCanvas() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'spaceCanvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            pointer-events: none;
        `;
        
        // Insert as first child of body
        document.body.insertBefore(this.canvas, document.body.firstChild);
        
        this.ctx = this.canvas.getContext('2d');
        this.updateCanvasSize();
    }
    
    updateCanvasSize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.width = rect.width;
        this.height = rect.height;
        
        // Set canvas size with device pixel ratio for sharp rendering
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        
        // Scale context to match device pixel ratio
        this.ctx.scale(dpr, dpr);
        
        // Update canvas style size
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
    }
    
    setupStars() {
        this.stars = [];
        
        for (let i = 0; i < this.starCount; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 3 + 0.5, // 0.5 to 3.5px
                opacity: Math.random() * 0.8 + 0.2, // 0.2 to 1.0
                twinkleSpeed: Math.random() * 0.02 + 0.005, // Slow twinkling
                twinkleOffset: Math.random() * Math.PI * 2,
                color: this.getStarColor()
            });
        }
    }
    
    getStarColor() {
        const colors = [
            '#ffffff',  // White
            '#ffffcc',  // Light yellow
            '#ccccff',  // Light blue
            '#ffcccc',  // Light pink
            '#ccffcc'   // Light green
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    createShootingStarPool() {
        // Create a pool of shooting star objects to reuse
        for (let i = 0; i < this.maxShootingStars * 2; i++) {
            this.shootingStarPool.push({
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                size: 0,
                opacity: 0,
                trail: [],
                active: false,
                life: 0,
                maxLife: 0
            });
        }
    }
    
    getShootingStarFromPool() {
        return this.shootingStarPool.find(star => !star.active);
    }
    
    createShootingStar() {
        if (this.shootingStars.length >= this.maxShootingStars) return;
        
        const star = this.getShootingStarFromPool();
        if (!star) return;
        
        // Random starting position (from top and left edges)
        star.x = Math.random() * this.width;
        star.y = Math.random() * this.height * 0.3; // Top 30% of screen
        
        // Velocity (diagonal movement)
        const speed = 3 + Math.random() * 4;
        const angle = Math.PI / 6 + Math.random() * Math.PI / 6; // 30-60 degrees
        star.vx = Math.cos(angle) * speed;
        star.vy = Math.sin(angle) * speed;
        
        star.size = 1 + Math.random() * 2;
        star.opacity = 1;
        star.trail = [];
        star.active = true;
        star.life = 0;
        star.maxLife = 60 + Math.random() * 40; // 60-100 frames
        
        this.shootingStars.push(star);
    }
    
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateCanvasSize();
            this.setupStars(); // Recreate stars for new dimensions
        });
        
        // Create shooting stars periodically
        setInterval(() => {
            if (Math.random() < 0.3) { // 30% chance every interval
                this.createShootingStar();
            }
        }, 2000);
    }
    
    animate(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Clear canvas with space background
        this.clearCanvas();
        
        // Update and draw stars
        this.updateStars(currentTime);
        this.drawStars();
        
        // Update and draw shooting stars
        this.updateShootingStars();
        this.drawShootingStars();
        
        // Continue animation
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }
    
    clearCanvas() {
        // Create space background gradient
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, Math.max(this.width, this.height) / 2
        );
        gradient.addColorStop(0, '#1e3c72');
        gradient.addColorStop(0.5, '#2a5298');
        gradient.addColorStop(1, '#0f0f23');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    updateStars(currentTime) {
        // Update twinkling effect
        this.stars.forEach(star => {
            const twinkle = Math.sin(currentTime * star.twinkleSpeed + star.twinkleOffset);
            star.currentOpacity = star.opacity + twinkle * 0.3;
            star.currentOpacity = Math.max(0.1, Math.min(1, star.currentOpacity));
        });
    }
    
    drawStars() {
        this.ctx.save();
        
        this.stars.forEach(star => {
            this.ctx.globalAlpha = star.currentOpacity;
            this.ctx.fillStyle = star.color;
            
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add glow effect for larger stars
            if (star.size > 2) {
                this.ctx.globalAlpha = star.currentOpacity * 0.3;
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        this.ctx.restore();
    }
    
    updateShootingStars() {
        for (let i = this.shootingStars.length - 1; i >= 0; i--) {
            const star = this.shootingStars[i];
            
            // Add current position to trail
            star.trail.push({ x: star.x, y: star.y, opacity: star.opacity });
            
            // Limit trail length
            if (star.trail.length > 15) {
                star.trail.shift();
            }
            
            // Update position
            star.x += star.vx;
            star.y += star.vy;
            
            // Update life and opacity
            star.life++;
            star.opacity = 1 - (star.life / star.maxLife);
            
            // Remove if off screen or life expired
            if (star.x > this.width + 50 || star.y > this.height + 50 || star.life >= star.maxLife) {
                star.active = false;
                star.trail = [];
                this.shootingStars.splice(i, 1);
            }
        }
    }
    
    drawShootingStars() {
        this.ctx.save();
        
        this.shootingStars.forEach(star => {
            // Draw trail
            star.trail.forEach((point, index) => {
                const trailOpacity = (index / star.trail.length) * star.opacity * 0.8;
                const trailSize = star.size * (index / star.trail.length);
                
                this.ctx.globalAlpha = trailOpacity;
                this.ctx.fillStyle = '#ffffff';
                
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
                this.ctx.fill();
            });
            
            // Draw main shooting star
            this.ctx.globalAlpha = star.opacity;
            this.ctx.fillStyle = '#ffffff';
            
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add bright glow
            this.ctx.globalAlpha = star.opacity * 0.5;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    // Cleanup method
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Initialize canvas space background when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.spaceBackground = new CanvasSpaceBackground();
});