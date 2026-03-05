// ===== DOM Elements =====
const scene = document.getElementById('scene');
const lampBulb = document.getElementById('lampBulb');
const pullString = document.getElementById('pullString');
const pullKnob = document.getElementById('pullKnob');
const loginContainer = document.getElementById('loginContainer');
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');

let isLampOn = false;

// ===== Toggle Lamp =====
function toggleLamp() {
  isLampOn = !isLampOn;
  scene.classList.toggle('lamp-on', isLampOn);

  // Create particles on turn-on
  if (isLampOn) {
    createParticles();
  }
}

// ===== Pull-string click =====
const lampPull = document.querySelector('.lamp-pull');
lampPull.addEventListener('click', () => {
  // Animate the pull
  pullString.style.height = '55px';
  pullKnob.style.transform = 'scale(0.9) translateY(5px)';

  setTimeout(() => {
    pullString.style.height = '40px';
    pullKnob.style.transform = 'scale(1) translateY(0)';
    toggleLamp();
  }, 200);
});

// ===== Also allow clicking the bulb =====
lampBulb.addEventListener('click', () => {
  toggleLamp();
});

// ===== Particle burst on lamp turn-on =====
function createParticles() {
  const bulbRect = lampBulb.getBoundingClientRect();
  const cx = bulbRect.left + bulbRect.width / 2;
  const cy = bulbRect.top + bulbRect.height / 2;

  for (let i = 0; i < 12; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const angle = (Math.PI * 2 * i) / 12;
    const distance = 40 + Math.random() * 60;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    particle.style.left = `${cx}px`;
    particle.style.top = `${cy}px`;
    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);
    particle.style.width = `${2 + Math.random() * 3}px`;
    particle.style.height = particle.style.width;

    document.body.appendChild(particle);

    // Clean up
    setTimeout(() => particle.remove(), 2000);
  }
}

// ===== Button ripple follow =====
loginBtn.addEventListener('mousemove', (e) => {
  const rect = loginBtn.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  loginBtn.style.setProperty('--x', `${x}%`);
  loginBtn.style.setProperty('--y', `${y}%`);
});

// ===== Form submit =====
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const btn = loginBtn;
  btn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    <span>Success!</span>
  `;
  btn.style.background = 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
  btn.style.pointerEvents = 'none';

  setTimeout(() => {
    btn.innerHTML = `
      <span>Sign In</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    `;
    btn.style.background = '';
    btn.style.pointerEvents = '';
    loginForm.reset();
  }, 2000);
});

// ===== Keyboard shortcut: Space to toggle =====
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    toggleLamp();
  }
});
