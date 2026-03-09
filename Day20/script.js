// =============================================
// 🎂  Birthday Wish – Confetti & Interactions
// =============================================

(function () {
    'use strict';

    // ---------- Background Stars ----------
    function createStars() {
        const count = 60;
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            const size = Math.random() * 3 + 1;
            star.style.width = size + 'px';
            star.style.height = size + 'px';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = (Math.random() * 3) + 's';
            star.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
            document.body.appendChild(star);
        }
    }
    createStars();

    // ---------- Confetti / Party Popper Particles ----------
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animating = false;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const CONFETTI_COLORS = [
        '#ff6b9d', '#ffd700', '#ff7f6e', '#81ecec', '#a29bfe',
        '#fd79a8', '#00cec9', '#fab1a0', '#55efc4', '#e17055',
        '#6c5ce7', '#fdcb6e', '#e84393', '#00b894', '#d63031',
        '#0984e3', '#ff9ff3', '#f368e0'
    ];

    const SHAPES = ['rect', 'circle', 'triangle', 'star', 'ribbon'];

    class Particle {
        constructor(x, y, burst) {
            this.x = x;
            this.y = y;
            this.color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
            this.shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            this.size = Math.random() * 8 + 4;
            this.rotation = Math.random() * 360;
            this.rotationSpeed = (Math.random() - 0.5) * 12;

            if (burst) {
                // Burst from a point (party popper style)
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 8 + 3;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed - 4;
            } else {
                // Gentle rain from top
                this.vx = (Math.random() - 0.5) * 3;
                this.vy = Math.random() * 3 + 1.5;
            }

            this.gravity = 0.12;
            this.drag = 0.98;
            this.opacity = 1;
            this.fadeRate = Math.random() * 0.005 + 0.002;
            this.wobble = Math.random() * 10;
            this.wobbleSpeed = Math.random() * 0.1 + 0.03;
        }

        update() {
            this.vy += this.gravity;
            this.vx *= this.drag;
            this.vy *= this.drag;
            this.x += this.vx + Math.sin(this.wobble) * 0.5;
            this.y += this.vy;
            this.rotation += this.rotationSpeed;
            this.wobble += this.wobbleSpeed;
            this.opacity -= this.fadeRate;
        }

        draw(ctx) {
            if (this.opacity <= 0) return;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;

            switch (this.shape) {
                case 'rect':
                    ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
                    break;
                case 'circle':
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'triangle':
                    ctx.beginPath();
                    ctx.moveTo(0, -this.size / 2);
                    ctx.lineTo(-this.size / 2, this.size / 2);
                    ctx.lineTo(this.size / 2, this.size / 2);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case 'star':
                    this.drawStar(ctx, 0, 0, 5, this.size / 2, this.size / 4);
                    break;
                case 'ribbon':
                    ctx.fillRect(-this.size / 6, -this.size, this.size / 3, this.size * 2);
                    break;
            }
            ctx.restore();
        }

        drawStar(ctx, cx, cy, spikes, outerR, innerR) {
            let rot = (Math.PI / 2) * 3;
            const step = Math.PI / spikes;
            ctx.beginPath();
            ctx.moveTo(cx, cy - outerR);
            for (let i = 0; i < spikes; i++) {
                ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
                rot += step;
                ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
                rot += step;
            }
            ctx.closePath();
            ctx.fill();
        }
    }

    function spawnConfettiRain() {
        for (let i = 0; i < 5; i++) {
            particles.push(
                new Particle(Math.random() * canvas.width, -10, false)
            );
        }
    }

    function spawnConfettiBurst(x, y, count) {
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(x, y, true));
        }
    }

    function animateParticles() {
        if (!animating) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p) => {
            p.update();
            p.draw(ctx);
        });

        // Remove dead particles
        particles = particles.filter((p) => p.opacity > 0 && p.y < canvas.height + 50);

        requestAnimationFrame(animateParticles);
    }

    function startConfettiRain() {
        animating = true;
        animateParticles();

        // Continuous gentle rain
        const rainInterval = setInterval(() => {
            spawnConfettiRain();
        }, 80);

        // Party popper bursts from corners and sides
        setTimeout(() => {
            spawnConfettiBurst(0, 0, 60);
            spawnConfettiBurst(canvas.width, 0, 60);
        }, 800);

        setTimeout(() => {
            spawnConfettiBurst(canvas.width / 2, 0, 40);
        }, 1500);

        setTimeout(() => {
            spawnConfettiBurst(0, canvas.height * 0.3, 30);
            spawnConfettiBurst(canvas.width, canvas.height * 0.3, 30);
        }, 2200);

        // Stop rain after a while
        setTimeout(() => {
            clearInterval(rainInterval);
        }, 8000);
    }

    // Start the confetti rain on page load
    startConfettiRain();

    // ---------- Blow Candle Interaction ----------
    const blowBtn = document.getElementById('blow-btn');

    blowBtn.addEventListener('click', () => {
        blowBtn.classList.add('hidden');

        // Blow out the flame
        const flame = document.querySelector('.flame');
        const glow = document.querySelector('.glow');
        flame.classList.add('blown');
        glow.classList.add('blown');

        // Add smoke wisps
        const candleGroup = document.getElementById('candle-group');
        for (let i = 0; i < 4; i++) {
            const smoke = document.createElement('div');
            smoke.classList.add('smoke');
            smoke.style.animationDelay = (i * 0.2) + 's';
            smoke.style.left = (45 + Math.random() * 10) + '%';
            candleGroup.querySelector('.candle').appendChild(smoke);
        }

        // Big confetti celebration burst
        setTimeout(() => {
            spawnConfettiBurst(canvas.width * 0.2, canvas.height * 0.2, 80);
            spawnConfettiBurst(canvas.width * 0.8, canvas.height * 0.2, 80);
            spawnConfettiBurst(canvas.width * 0.5, canvas.height * 0.1, 100);
            spawnConfettiBurst(canvas.width * 0.1, canvas.height * 0.5, 50);
            spawnConfettiBurst(canvas.width * 0.9, canvas.height * 0.5, 50);
        }, 600);

        // Extra celebration bursts
        setTimeout(() => {
            const burstInterval = setInterval(() => {
                spawnConfettiBurst(
                    Math.random() * canvas.width,
                    Math.random() * canvas.height * 0.4,
                    30
                );
            }, 400);

            setTimeout(() => clearInterval(burstInterval), 4000);
        }, 1200);

        // Restart confetti rain for celebration
        const celebrationRain = setInterval(() => spawnConfettiRain(), 50);
        setTimeout(() => clearInterval(celebrationRain), 6000);
    });

})();
``