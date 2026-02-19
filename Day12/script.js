const cursorDot = document.querySelector('[data-cursor-dot]');
const cursorOutline = document.querySelector('[data-cursor-outline]');
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let hoverElements = document.querySelectorAll('[data-hover]');

// Mouse state
const mouse = { x: -100, y: -100 }; // Start off-screen
const cursor = { x: -100, y: -100 };

// Resize Canvas
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Track Mouse Movement
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    // Instant update for dot
    cursorDot.style.left = `${mouse.x}px`;
    cursorDot.style.top = `${mouse.y}px`;

    // Add particles on move
    createParticles(mouse.x, mouse.y);
});

// Smooth Cursor Animation (Lerp)
function animateCursor() {
    // Linear Interpolation for smoothness
    // cursor.x += (mouse.x - cursor.x) * 0.15;
    // cursor.y += (mouse.y - cursor.y) * 0.15;

    // Improved damping for outline
    const dt = 1.0 - Math.pow(1.0 - 0.15, 1); // Helper if we had delta time, simpler here:
    cursor.x += (mouse.x - cursor.x) * 0.12;
    cursor.y += (mouse.y - cursor.y) * 0.12;

    cursorOutline.style.left = `${cursor.x}px`;
    cursorOutline.style.top = `${cursor.y}px`;

    // Magnetic Pull on Hover
    // (Optional: add slight offset towards element center if hovering)

    requestAnimationFrame(animateCursor);
}
animateCursor();

// --- Particle System ---

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2 + 0.5; // Random size
        this.speedX = Math.random() * 4 - 2; // Increased spread
        this.speedY = Math.random() * 4 - 2; // Increased spread
        this.color = `hsl(${Math.random() * 60 + 200}, 100%, 70%)`; // Blue/Purple gradient
        // Alternative white: 
        // this.color = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.1})`;
        this.life = 1.0; // Life starts at 100%
        this.decay = Math.random() * 0.015 + 0.005; // Slower decay for longer trails
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        this.size -= 0.02; // Shrink
    }

    draw() {
        ctx.fillStyle = this.color;
        // Fade out based on life
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0, this.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0; // Reset
    }
}

function createParticles(x, y) {
    // Create a few particles per frame on move
    for (let i = 0; i < 6; i++) {
        particles.push(new Particle(x, y));
    }
}

function handleParticles() {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Enable additive blending for glow effect
    ctx.globalCompositeOperation = 'lighter';

    // Logic to handle particles
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        // Remove dead particles
        if (particles[i].life <= 0 || particles[i].size <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
}

// Animation Loop
function animate() {
    handleParticles();
    requestAnimationFrame(animate);
}
animate();

// --- Hover Interactions ---

hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        document.body.classList.add('hovering');
        // Optional: Scale the element slightly
        // el.style.transform = 'scale(1.05)';
    });
    el.addEventListener('mouseleave', () => {
        document.body.classList.remove('hovering');
        // el.style.transform = 'scale(1)';
    });
});
