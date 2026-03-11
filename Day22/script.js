// script.js
document.addEventListener('DOMContentLoaded', () => {
    const card = document.querySelector('#card');
    const container = document.querySelector('.container');
    const glowOverlay = document.querySelector('#glowOverlay');
    const bubblesContainer = document.querySelector('#bubbles');
    const ambientParticles = document.querySelector('#ambientParticles');

    // ── Custom Cursor ──
    const cursorDot = document.createElement('div');
    cursorDot.classList.add('cursor-dot');
    document.body.appendChild(cursorDot);

    const cursorRing = document.createElement('div');
    cursorRing.classList.add('cursor-ring');
    document.body.appendChild(cursorRing);

    let ringX = 0, ringY = 0;
    let targetRingX = 0, targetRingY = 0;

    document.addEventListener('mousemove', (e) => {
        cursorDot.style.left = e.clientX + 'px';
        cursorDot.style.top = e.clientY + 'px';
        targetRingX = e.clientX;
        targetRingY = e.clientY;
    });

    // Smooth trailing ring
    function animateRing() {
        ringX += (targetRingX - ringX) * 0.15;
        ringY += (targetRingY - ringY) * 0.15;
        cursorRing.style.left = ringX + 'px';
        cursorRing.style.top = ringY + 'px';
        requestAnimationFrame(animateRing);
    }
    animateRing();

    // Show/hide custom cursor over card
    card.addEventListener('mouseenter', () => {
        cursorDot.classList.add('visible');
    });
    card.addEventListener('mouseleave', () => {
        cursorDot.classList.remove('visible');
    });

    // Enlarge ring over explore button
    const exploreBtn = document.querySelector('#exploreBtn');
    if (exploreBtn) {
        exploreBtn.addEventListener('mouseenter', () => {
            cursorRing.classList.add('hovering-btn');
        });
        exploreBtn.addEventListener('mouseleave', () => {
            cursorRing.classList.remove('hovering-btn');
        });
    }

    // ── 3D Tilt Effect ──
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        card.style.transition = 'transform 0.08s ease-out';
        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

        // Dynamic glow overlay
        glowOverlay.style.background = `
            radial-gradient(
                600px circle at ${x}px ${y}px,
                rgba(255,255,255,0.08),
                transparent 50%
            )
        `;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';
        glowOverlay.style.background = 'transparent';
    });

    // ── Bubbles on hover ──
    let bubbleInterval = null;

    function createBubble() {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        const size = Math.random() * 8 + 3;
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        bubble.style.left = Math.random() * 100 + '%';
        bubble.style.bottom = '0px';
        bubblesContainer.appendChild(bubble);

        // Animate upward
        const duration = Math.random() * 2000 + 1500;
        const drift = (Math.random() - 0.5) * 60;

        bubble.animate([
            { transform: `translate(0, 0) scale(0.5)`, opacity: 0 },
            { opacity: 0.7, offset: 0.1 },
            { transform: `translate(${drift}px, -${300 + Math.random() * 200}px) scale(1)`, opacity: 0 }
        ], {
            duration: duration,
            easing: 'ease-out',
            fill: 'forwards'
        });

        setTimeout(() => bubble.remove(), duration);
    }

    card.addEventListener('mouseenter', () => {
        bubbleInterval = setInterval(createBubble, 180);
    });

    card.addEventListener('mouseleave', () => {
        clearInterval(bubbleInterval);
        bubbleInterval = null;
    });

    // ── Ambient Background Particles ──
    function spawnAmbientDots() {
        for (let i = 0; i < 30; i++) {
            const dot = document.createElement('div');
            dot.classList.add('ambient-dot');
            dot.style.left = Math.random() * 100 + '%';
            dot.style.animationDuration = (Math.random() * 8 + 6) + 's';
            dot.style.animationDelay = (Math.random() * 10) + 's';
            dot.style.width = (Math.random() * 2 + 1.5) + 'px';
            dot.style.height = dot.style.width;
            ambientParticles.appendChild(dot);
        }
    }
    spawnAmbientDots();

    // ── Ripple click effect on button ──
    if (exploreBtn) {
        exploreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255,255,255,0.4)';
            ripple.style.pointerEvents = 'none';

            const rect = exploreBtn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 2;
            ripple.style.width = size + 'px';
            ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

            exploreBtn.appendChild(ripple);

            ripple.animate([
                { transform: 'scale(0)', opacity: 1 },
                { transform: 'scale(1)', opacity: 0 }
            ], {
                duration: 600,
                easing: 'ease-out'
            });

            setTimeout(() => ripple.remove(), 600);
        });
    }
});
