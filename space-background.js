let starsContainer;
let canvas;
let ctx;
let stars = [];
let animationId;

function createSpaceBackground() {
    // Main container
    starsContainer = document.createElement('div');
    starsContainer.className = 'stars-container';
    starsContainer.style.willChange = 'transform';
    document.body.appendChild(starsContainer);

    // Canvas for background stars
    canvas = document.createElement('canvas');
    canvas.className = 'stars-canvas';
    Object.assign(canvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '-1',
        pointerEvents: 'none'
    });
    starsContainer.appendChild(canvas);
    ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Galaxy core
    const galaxy = document.createElement('div');
    galaxy.className = 'galaxy';
    galaxy.style.willChange = 'transform';
    starsContainer.appendChild(galaxy);

    for (let i = 0; i < 8; i++) {
        const arm = document.createElement('div');
        arm.className = 'spiral-arm';
        arm.style.transform = `rotate(${i * 45}deg)`;
        arm.style.willChange = 'transform';
        galaxy.appendChild(arm);
    }

    // Star data
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const starCount = isMobile ? 300 : 400;
    stars = [];

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

    function animateStars() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(star => {
            star.opacity += star.opacityDirection * star.twinkleSpeed;
            if (star.opacity <= 0 || star.opacity >= 1) {
                star.opacityDirection *= -1;
                star.opacity = Math.max(0, Math.min(1, star.opacity));
            }
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        animationId = requestAnimationFrame(animateStars);
    }

    animateStars();

    function createShootingStar() {
        const shootingStar = document.createElement('div');
        shootingStar.className = 'shooting-star';
        const topStart = Math.random() * 100;
        const angle = Math.random() * 30 - 15;

        Object.assign(shootingStar.style, {
            top: `${topStart}%`,
            width: `${1 + Math.random() * 3}px`,
            height: `${1 + Math.random() * 3}px`,
            animationDuration: `${3 + Math.random() * 3}s`
        });
        shootingStar.style.setProperty('--angle', `${angle}deg`);

        starsContainer.appendChild(shootingStar);
        setTimeout(() => {
            shootingStar.remove();
        }, parseFloat(shootingStar.style.animationDuration) * 1000);
    }

    setInterval(createShootingStar, 800);
    setInterval(createShootingStar, 1200);
    setInterval(createShootingStar, 1600);

    // Visibility handling
    document.addEventListener('visibilitychange', () => {
        const isVisible = !document.hidden;
        if (isVisible) {
            animateStars();
        } else {
            cancelAnimationFrame(animationId);
        }
        const animatedEls = starsContainer.querySelectorAll('.spiral-arm, .shooting-star');
        animatedEls.forEach(el => {
            el.style.animationPlayState = isVisible ? 'running' : 'paused';
        });
    });

    // Star reposition on resize
    window.addEventListener('resize', () => {
        stars.forEach(star => {
            star.x = Math.random() * canvas.width;
            star.y = Math.random() * canvas.height;
        });
    });
}

// Smooth initialization
function initializeBackground() {
    requestAnimationFrame(createSpaceBackground);
}

// Run once DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBackground);
} else {
    initializeBackground();
}
