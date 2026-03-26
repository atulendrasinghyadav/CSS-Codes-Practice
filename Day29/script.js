/* ═══════════════════════════════════════════════════
   Don't Touch the Spikes — Game Engine
   ═══════════════════════════════════════════════════ */

(() => {
    'use strict';

    // ── Canvas Setup ──
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const bgCanvas = document.getElementById('bg-canvas');
    const bgCtx = bgCanvas.getContext('2d');

    // ── DOM Elements ──
    const startScreen = document.getElementById('start-screen');
    const gameoverScreen = document.getElementById('gameover-screen');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const hud = document.getElementById('hud');
    const scoreDisplay = document.getElementById('score-display');
    const finalScore = document.getElementById('final-score');
    const finalBest = document.getElementById('final-best');
    const startBest = document.getElementById('start-best');

    // ── Constants ──
    const GRAVITY = 0.38;
    const FLAP_FORCE = -7.5;
    const BALL_RADIUS = 14;
    const SPIKE_WIDTH = 22;
    const SPIKE_BASE = 30;
    const MIN_SPIKES = 3;
    const MAX_SPIKES = 8;
    const WALL_MARGIN = 10;
    const PARTICLE_COUNT = 30;

    // ── Game State ──
    let W, H;
    let ball, spikes, particles, trailParticles;
    let score, bestScore;
    let gameRunning, gameDead;
    let direction; // 1 = moving right, -1 = moving left
    let screenShake = 0;
    let comboFlash = 0;
    let bgParticles = [];
    let animFrameId;

    // ── Resize ──
    function resize() {
        const wrapper = document.getElementById('game-wrapper');
        W = wrapper.clientWidth;
        H = wrapper.clientHeight;
        canvas.width = W;
        canvas.height = H;
        bgCanvas.width = W;
        bgCanvas.height = H;
        initBgParticles();
    }

    // ── Background Particles ──
    function initBgParticles() {
        bgParticles = [];
        for (let i = 0; i < 50; i++) {
            bgParticles.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.3 + 0.1,
                alpha: Math.random() * 0.3 + 0.05,
                hue: Math.random() * 60 + 240
            });
        }
    }

    function drawBackground() {
        // Gradient background
        const grad = bgCtx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0d0d2b');
        grad.addColorStop(0.5, '#121236');
        grad.addColorStop(1, '#0a0a1a');
        bgCtx.fillStyle = grad;
        bgCtx.fillRect(0, 0, W, H);

        // Floating particles
        for (const p of bgParticles) {
            p.y -= p.speed;
            if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
            bgCtx.beginPath();
            bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            bgCtx.fillStyle = `hsla(${p.hue}, 60%, 70%, ${p.alpha})`;
            bgCtx.fill();
        }
    }

    // ── Init ──
    function init() {
        bestScore = parseInt(localStorage.getItem('dttsBest') || '0', 10);
        startBest.textContent = bestScore;
        resize();
        drawBackground();
        window.addEventListener('resize', resize);
    }

    // ── Start Game ──
    function startGame() {
        score = 0;
        gameDead = false;
        gameRunning = true;
        direction = 1;
        screenShake = 0;
        comboFlash = 0;
        particles = [];
        trailParticles = [];
        scorePopups = [];

        ball = {
            x: W / 2,
            y: H / 2,
            vy: 0,
            vx: 3.5,
            radius: BALL_RADIUS,
            hue: 45,
            squash: 1
        };

        spikes = {
            left: generateSpikes('left'),
            right: generateSpikes('right'),
            top: generateSpikeRow('top'),
            bottom: generateSpikeRow('bottom')
        };

        startScreen.classList.remove('active');
        gameoverScreen.classList.remove('active');
        hud.classList.add('visible');
        scoreDisplay.textContent = '0';

        if (animFrameId) cancelAnimationFrame(animFrameId);
        loop();
    }

    // ── Generate Wall Spikes ──
    function generateSpikes(side) {
        const count = MIN_SPIKES + Math.floor(Math.random() * (MAX_SPIKES - MIN_SPIKES + 1));
        const spikeArr = [];
        const availableH = H - 40; // margin top/bottom
        const gap = availableH / count;

        // Pick random positions with gaps
        const positions = [];
        for (let i = 0; i < count; i++) {
            positions.push(20 + gap * i + Math.random() * (gap - SPIKE_BASE));
        }

        // Remove some to create safe gaps
        const removeCount = Math.floor(Math.random() * 2) + 1;
        const removeIndices = new Set();
        while (removeIndices.size < removeCount && removeIndices.size < positions.length - 1) {
            removeIndices.add(Math.floor(Math.random() * positions.length));
        }

        for (let i = 0; i < positions.length; i++) {
            if (removeIndices.has(i)) continue;
            spikeArr.push({
                y: positions[i],
                side: side,
                h: SPIKE_BASE
            });
        }

        return spikeArr;
    }

    // ── Generate Top/Bottom Spike Rows ──
    function generateSpikeRow(position) {
        const spikeArr = [];
        const count = Math.floor(W / SPIKE_BASE);
        for (let i = 0; i < count; i++) {
            spikeArr.push({
                x: i * SPIKE_BASE,
                position: position,
                w: SPIKE_BASE
            });
        }
        return spikeArr;
    }

    // ── Draw Spikes ──
    function drawSpike(spike) {
        ctx.save();
        const gradient = ctx.createLinearGradient(0, 0, SPIKE_WIDTH, 0);
        gradient.addColorStop(0, '#ff4757');
        gradient.addColorStop(1, '#ff6b81');

        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(255, 71, 87, 0.4)';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        if (spike.side === 'left') {
            const x = 0;
            ctx.moveTo(x, spike.y);
            ctx.lineTo(x + SPIKE_WIDTH, spike.y + spike.h / 2);
            ctx.lineTo(x, spike.y + spike.h);
        } else {
            const x = W;
            ctx.moveTo(x, spike.y);
            ctx.lineTo(x - SPIKE_WIDTH, spike.y + spike.h / 2);
            ctx.lineTo(x, spike.y + spike.h);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function drawHorizontalSpike(spike) {
        ctx.save();
        ctx.fillStyle = '#ff4757';
        ctx.shadowColor = 'rgba(255, 71, 87, 0.3)';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        if (spike.position === 'top') {
            ctx.moveTo(spike.x, 0);
            ctx.lineTo(spike.x + spike.w / 2, SPIKE_WIDTH);
            ctx.lineTo(spike.x + spike.w, 0);
        } else {
            ctx.moveTo(spike.x, H);
            ctx.lineTo(spike.x + spike.w / 2, H - SPIKE_WIDTH);
            ctx.lineTo(spike.x + spike.w, H);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // ── Draw Ball ──
    function drawBall() {
        ctx.save();
        ctx.translate(ball.x, ball.y);

        // Squash/stretch
        const sx = ball.squash;
        const sy = 2 - ball.squash;
        ctx.scale(sx, sy);

        // Outer glow
        const glowGrad = ctx.createRadialGradient(0, 0, ball.radius * 0.5, 0, 0, ball.radius * 2.5);
        glowGrad.addColorStop(0, `hsla(${ball.hue}, 100%, 70%, 0.25)`);
        glowGrad.addColorStop(1, `hsla(${ball.hue}, 100%, 70%, 0)`);
        ctx.beginPath();
        ctx.arc(0, 0, ball.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // Ball body
        const ballGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, ball.radius);
        ballGrad.addColorStop(0, `hsl(${ball.hue}, 100%, 85%)`);
        ballGrad.addColorStop(0.6, `hsl(${ball.hue}, 90%, 65%)`);
        ballGrad.addColorStop(1, `hsl(${ball.hue}, 80%, 45%)`);

        ctx.beginPath();
        ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ballGrad;
        ctx.fill();

        // Highlight
        ctx.beginPath();
        ctx.arc(-3, -4, ball.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fill();

        ctx.restore();
    }

    // ── Trail Particles ──
    function spawnTrail() {
        trailParticles.push({
            x: ball.x,
            y: ball.y,
            r: ball.radius * 0.5,
            alpha: 0.4,
            hue: ball.hue
        });
    }

    function updateTrail() {
        for (let i = trailParticles.length - 1; i >= 0; i--) {
            const t = trailParticles[i];
            t.alpha -= 0.02;
            t.r *= 0.96;
            if (t.alpha <= 0) trailParticles.splice(i, 1);
        }
    }

    function drawTrail() {
        for (const t of trailParticles) {
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${t.hue}, 80%, 65%, ${t.alpha})`;
            ctx.fill();
        }
    }

    // ── Death Particles ──
    function spawnDeathParticles() {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const angle = (Math.PI * 2 / PARTICLE_COUNT) * i + Math.random() * 0.3;
            const speed = Math.random() * 6 + 2;
            particles.push({
                x: ball.x,
                y: ball.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                r: Math.random() * 5 + 2,
                alpha: 1,
                hue: ball.hue + Math.random() * 40 - 20,
                life: 1
            });
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life -= 0.02;
            p.alpha = p.life;
            p.r *= 0.98;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function drawParticles() {
        for (const p of particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${p.alpha})`;
            ctx.fill();
        }
    }

    // ── Score particles ──
    let scorePopups = [];
    function spawnScorePopup() {
        scorePopups.push({
            x: ball.x,
            y: ball.y - 30,
            alpha: 1,
            text: '+1',
            vy: -1.5
        });
    }

    function updateScorePopups() {
        for (let i = scorePopups.length - 1; i >= 0; i--) {
            const s = scorePopups[i];
            s.y += s.vy;
            s.alpha -= 0.025;
            if (s.alpha <= 0) scorePopups.splice(i, 1);
        }
    }

    function drawScorePopups() {
        for (const s of scorePopups) {
            ctx.save();
            ctx.font = '600 18px Outfit';
            ctx.fillStyle = `rgba(255, 217, 61, ${s.alpha})`;
            ctx.textAlign = 'center';
            ctx.fillText(s.text, s.x, s.y);
            ctx.restore();
        }
    }

    // ── Wall Glow Lines ──
    function drawWallGlow() {
        // Left wall
        const lg = ctx.createLinearGradient(0, 0, 6, 0);
        lg.addColorStop(0, 'rgba(255, 71, 87, 0.15)');
        lg.addColorStop(1, 'rgba(255, 71, 87, 0)');
        ctx.fillStyle = lg;
        ctx.fillRect(0, 0, 6, H);

        // Right wall
        const rg = ctx.createLinearGradient(W, 0, W - 6, 0);
        rg.addColorStop(0, 'rgba(255, 71, 87, 0.15)');
        rg.addColorStop(1, 'rgba(255, 71, 87, 0)');
        ctx.fillStyle = rg;
        ctx.fillRect(W - 6, 0, 6, H);

        // Top
        const tg = ctx.createLinearGradient(0, 0, 0, 6);
        tg.addColorStop(0, 'rgba(255, 71, 87, 0.15)');
        tg.addColorStop(1, 'rgba(255, 71, 87, 0)');
        ctx.fillStyle = tg;
        ctx.fillRect(0, 0, W, 6);

        // Bottom
        const bg = ctx.createLinearGradient(0, H, 0, H - 6);
        bg.addColorStop(0, 'rgba(255, 71, 87, 0.15)');
        bg.addColorStop(1, 'rgba(255, 71, 87, 0)');
        ctx.fillStyle = bg;
        ctx.fillRect(0, H - 6, W, 6);
    }

    // ── Collision Detection ──
    function checkCollision() {
        const bx = ball.x;
        const by = ball.y;
        const br = ball.radius;

        // Wall spikes (left & right)
        const sides = ['left', 'right'];
        for (const side of sides) {
            for (const spike of spikes[side]) {
                let tipX, tipY;
                if (side === 'left') {
                    tipX = SPIKE_WIDTH;
                    tipY = spike.y + spike.h / 2;
                } else {
                    tipX = W - SPIKE_WIDTH;
                    tipY = spike.y + spike.h / 2;
                }

                // Triangle vertices
                let x1, y1, x2, y2, x3, y3;
                if (side === 'left') {
                    x1 = 0; y1 = spike.y;
                    x2 = SPIKE_WIDTH; y2 = spike.y + spike.h / 2;
                    x3 = 0; y3 = spike.y + spike.h;
                } else {
                    x1 = W; y1 = spike.y;
                    x2 = W - SPIKE_WIDTH; y2 = spike.y + spike.h / 2;
                    x3 = W; y3 = spike.y + spike.h;
                }

                // Circle vs triangle approximation — check distance to tip
                const dx = bx - tipX;
                const dy = by - tipY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < br + 4) return true;

                // Check if ball center is inside triangle area
                if (pointInTriangle(bx, by, x1, y1, x2, y2, x3, y3)) return true;

                // Also check edges
                if (distToSegment(bx, by, x1, y1, x2, y2) < br) return true;
                if (distToSegment(bx, by, x2, y2, x3, y3) < br) return true;
                if (distToSegment(bx, by, x3, y3, x1, y1) < br) return true;
            }
        }

        // Top / bottom spikes
        if (by - br <= SPIKE_WIDTH) return true;
        if (by + br >= H - SPIKE_WIDTH) return true;

        return false;
    }

    function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
        const d1 = sign(px, py, x1, y1, x2, y2);
        const d2 = sign(px, py, x2, y2, x3, y3);
        const d3 = sign(px, py, x3, y3, x1, y1);
        const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
        return !(hasNeg && hasPos);
    }

    function sign(px, py, x1, y1, x2, y2) {
        return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
    }

    function distToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;
        return Math.hypot(px - closestX, py - closestY);
    }

    // ── Flap (tap) ──
    function flap() {
        if (!gameRunning || gameDead) return;
        ball.vy = FLAP_FORCE;
        ball.squash = 1.3;
    }

    // ── Wall Bounce ──
    function wallBounce() {
        direction *= -1;
        ball.vx *= -1;
        score++;
        comboFlash = 1;

        // Update HUD
        scoreDisplay.textContent = score;
        scoreDisplay.classList.add('bump');
        setTimeout(() => scoreDisplay.classList.remove('bump'), 150);

        // Change ball color
        ball.hue = (ball.hue + 30 + Math.random() * 20) % 360;

        spawnScorePopup();

        // Regenerate spikes on the side we're heading toward
        if (direction === 1) {
            spikes.right = generateSpikes('right');
        } else {
            spikes.left = generateSpikes('left');
        }

        // Slight speed increase
        const absVx = Math.abs(ball.vx);
        if (absVx < 6) {
            ball.vx = direction * (absVx + 0.08);
        }
    }

    // ── Die ──
    function die() {
        gameDead = true;
        gameRunning = false;
        screenShake = 15;
        spawnDeathParticles();

        // Update best
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('dttsBest', bestScore);
        }

        // Show game over after a delay
        setTimeout(() => {
            finalScore.textContent = score;
            finalBest.textContent = bestScore;
            startBest.textContent = bestScore;

            if (score >= bestScore && score > 0) {
                finalBest.classList.add('new-best');
                setTimeout(() => finalBest.classList.remove('new-best'), 600);
            }

            gameoverScreen.classList.add('active');
            hud.classList.remove('visible');
        }, 800);
    }

    // ── Main Loop ──
    function loop() {
        animFrameId = requestAnimationFrame(loop);

        drawBackground();
        ctx.clearRect(0, 0, W, H);

        // Screen shake
        ctx.save();
        if (screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * screenShake;
            const shakeY = (Math.random() - 0.5) * screenShake;
            ctx.translate(shakeX, shakeY);
            screenShake *= 0.85;
            if (screenShake < 0.5) screenShake = 0;
        }

        // Combo flash
        if (comboFlash > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${comboFlash * 0.06})`;
            ctx.fillRect(0, 0, W, H);
            comboFlash *= 0.9;
            if (comboFlash < 0.01) comboFlash = 0;
        }

        if (gameRunning && !gameDead) {
            // Physics
            ball.vy += GRAVITY;
            ball.x += ball.vx;
            ball.y += ball.vy;

            // Squash recovery
            ball.squash += (1 - ball.squash) * 0.15;

            // Wall bounce check
            if (ball.x - ball.radius <= 0) {
                ball.x = ball.radius;
                wallBounce();
            } else if (ball.x + ball.radius >= W) {
                ball.x = W - ball.radius;
                wallBounce();
            }

            // Collision
            if (checkCollision()) {
                die();
            }

            // Spawn trail
            if (Math.random() > 0.4) spawnTrail();
        }

        // Update effects
        updateTrail();
        updateParticles();
        updateScorePopups();

        // Draw wall glow
        drawWallGlow();

        // Draw spikes
        for (const s of spikes.left) drawSpike(s);
        for (const s of spikes.right) drawSpike(s);
        for (const s of spikes.top) drawHorizontalSpike(s);
        for (const s of spikes.bottom) drawHorizontalSpike(s);

        // Draw trail
        drawTrail();

        // Draw ball (if alive)
        if (!gameDead) {
            drawBall();
        }

        // Draw death particles
        drawParticles();
        drawScorePopups();

        ctx.restore();
    }

    // ── Input Handlers ──
    function handleInput(e) {
        e.preventDefault();
        if (!gameRunning && !gameDead) return;
        flap();
    }

    canvas.addEventListener('pointerdown', handleInput);
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            if (gameRunning) flap();
        }
    });

    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startGame();
    });

    restartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startGame();
    });

    // ── Boot ──
    init();

})();
