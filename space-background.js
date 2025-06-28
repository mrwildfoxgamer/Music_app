// Create enhanced space background (optimized)
function createSpaceBackground() {
  const STAR_COUNT = 400;
  const STAR_SIZES = ['star-small', 'star-medium', 'star-large'];
  const starsContainer = document.createElement('div');
  starsContainer.className = 'stars-container';
  document.body.appendChild(starsContainer);

  // 1) Batch-create static stars via DocumentFragment
  const frag = document.createDocumentFragment();
  for (let i = 0; i < STAR_COUNT; i++) {
    const star = document.createElement('div');
    star.className = `star ${STAR_SIZES[(i % STAR_SIZES.length)]}`; 
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 5}s`;
    frag.appendChild(star);
  }
  starsContainer.appendChild(frag);

  // 2) Single interval for shooting stars
  function launchShootingStar() {
    const star = document.createElement('div');
    star.className = 'shooting-star';
    const topStart = Math.random() * 100;
    const angle = (Math.random() - 0.5) * 30;
    const size = 1 + Math.random() * 3;
    const speed = 3 + Math.random() * 3;

    Object.assign(star.style, {
      top:    `${topStart}%`,
      '--angle': `${angle}deg`,
      width:  `${size}px`,
      height: `${size}px`,
      animationDuration: `${speed}s`,
    });

    starsContainer.appendChild(star);
    setTimeout(() => star.remove(), speed * 1000);
  }

  // Only one interval; randomize frequency per tick
  setInterval(() => {
    // ~50% chance per tick to create one shooting star
    if (Math.random() < 0.5) launchShootingStar();
  }, 800);
}

// Initialize when ready
document.addEventListener('DOMContentLoaded', createSpaceBackground);
