// =========================================
//  GitHub Streak Shooter — Game Engine
// =========================================

(() => {
    'use strict';

    // ---- Canvas Setup ----
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // ---- Constants ----
    const GITHUB_GREENS = ['#0e4429', '#006d32', '#26a641', '#39d353'];
    const CELL_SIZE = 18;
    const CELL_GAP = 4;
    const GRID_ROWS = 7;    // days of the week
    const GRID_COLS_MIN = 20;
    const GRID_COLS_MAX = 35;
    const EMPTY_CELL_CHANCE = 0.25; // 25% cells empty
    const ROCKET_SPEED = 2;
    const BULLET_SPEED = 10;
    const BULLET_COOLDOWN = 50; // ms between shots

    // ---- State ----
    let gameState = 'start'; // start | playing | win
    let stars = [];
    let gridCells = [];
    let rocket = null;
    let bullets = [];
    let particles = [];
    let shockwaves = [];
    let totalCells = 0;
    let destroyedCells = 0;
    let shotsFired = 0;
    let lastShotTime = 0;
    let gridOffsetX = 0;
    let gridOffsetY = 0;
    let gridCols = 0;
    let animFrame = null;
    let gameStartTime = 0;

    // ---- DOM ----
    const hud = document.getElementById('hud');
    const hudScore = document.getElementById('hud-score');
    const hudCells = document.getElementById('hud-cells');
    const hudAccuracy = document.getElementById('hud-accuracy');
    const startScreen = document.getElementById('start-screen');
    const winScreen = document.getElementById('win-screen');
    const winStats = document.getElementById('win-stats');
    const startBtn = document.getElementById('start-btn');
    const replayBtn = document.getElementById('replay-btn');

    // ---- Stars Background ----
    function generateStars() {
        stars = [];
        const count = Math.floor((canvas.width * canvas.height) / 3000);
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.5 + 0.3,
                alpha: Math.random() * 0.7 + 0.3,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                twinkleOffset: Math.random() * Math.PI * 2
            });
        }
    }

    function drawStars(time) {
        for (const s of stars) {
            const alpha = s.alpha * (0.6 + 0.4 * Math.sin(time * s.twinkleSpeed + s.twinkleOffset));
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
        }
    }

    // ---- Grid ----
    function generateGrid() {
        gridCells = [];
        gridCols = Math.floor(Math.random() * (GRID_COLS_MAX - GRID_COLS_MIN + 1)) + GRID_COLS_MIN;
        const gridWidth = gridCols * (CELL_SIZE + CELL_GAP) - CELL_GAP;
        const gridHeight = GRID_ROWS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
        gridOffsetX = (canvas.width - gridWidth) / 2;
        gridOffsetY = 60;

        totalCells = 0;
        destroyedCells = 0;

        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < gridCols; col++) {
                if (Math.random() < EMPTY_CELL_CHANCE) continue; // empty cell
                const color = GITHUB_GREENS[Math.floor(Math.random() * GITHUB_GREENS.length)];
                gridCells.push({
                    row,
                    col,
                    x: gridOffsetX + col * (CELL_SIZE + CELL_GAP),
                    y: gridOffsetY + row * (CELL_SIZE + CELL_GAP),
                    w: CELL_SIZE,
                    h: CELL_SIZE,
                    color,
                    alive: true,
                    scale: 1,
                    popIn: 0 // animation progress 0→1
                });
                totalCells++;
            }
        }
    }

    function drawGrid(time) {
        for (const cell of gridCells) {
            if (!cell.alive) continue;

            // Pop-in animation
            if (cell.popIn < 1) {
                cell.popIn = Math.min(1, cell.popIn + 0.04);
            }
            const ease = easeOutBack(cell.popIn);
            const s = ease * cell.scale;

            const cx = cell.x + cell.w / 2;
            const cy = cell.y + cell.h / 2;
            const hw = (cell.w / 2) * s;
            const hh = (cell.h / 2) * s;

            // Glow
            ctx.shadowColor = cell.color;
            ctx.shadowBlur = 6;

            // Rounded rect
            const r = 3 * s;
            ctx.beginPath();
            ctx.moveTo(cx - hw + r, cy - hh);
            ctx.lineTo(cx + hw - r, cy - hh);
            ctx.arcTo(cx + hw, cy - hh, cx + hw, cy - hh + r, r);
            ctx.lineTo(cx + hw, cy + hh - r);
            ctx.arcTo(cx + hw, cy + hh, cx + hw - r, cy + hh, r);
            ctx.lineTo(cx - hw + r, cy + hh);
            ctx.arcTo(cx - hw, cy + hh, cx - hw, cy + hh - r, r);
            ctx.lineTo(cx - hw, cy - hh + r);
            ctx.arcTo(cx - hw, cy - hh, cx - hw + r, cy - hh, r);
            ctx.closePath();
            ctx.fillStyle = cell.color;
            ctx.fill();

            ctx.shadowBlur = 0;
        }
    }

    // ---- Rocket ----
    function createRocket() {
        const gridHeight = GRID_ROWS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
        rocket = {
            x: gridOffsetX - 60,
            y: gridOffsetY + gridHeight / 2,
            w: 44,
            h: 28,
            speed: ROCKET_SPEED,
            direction: 1, // 1 = down, -1 = up
            exhaust: [],
            // Vertical bounds for oscillation
            minY: gridOffsetY,
            maxY: gridOffsetY + gridHeight
        };
    }

    function updateRocket() {
        // Move up and down within the streak grid bounds
        rocket.y += rocket.speed * rocket.direction;
        if (rocket.y >= rocket.maxY) {
            rocket.y = rocket.maxY;
            rocket.direction = -1;
        } else if (rocket.y <= rocket.minY) {
            rocket.y = rocket.minY;
            rocket.direction = 1;
        }

        // Exhaust particles — fly leftward from the rocket tail
        if (Math.random() > 0.3) {
            rocket.exhaust.push({
                x: rocket.x - 2,
                y: rocket.y + (Math.random() - 0.5) * 10,
                vx: -Math.random() * 3 - 1.5,
                vy: (Math.random() - 0.5) * 1.2,
                life: 1,
                size: Math.random() * 4 + 2
            });
        }

        // Update exhaust
        for (let i = rocket.exhaust.length - 1; i >= 0; i--) {
            const p = rocket.exhaust[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.03;
            p.size *= 0.97;
            if (p.life <= 0) rocket.exhaust.splice(i, 1);
        }
    }

    function drawRocket() {
        // Draw exhaust particles
        for (const p of rocket.exhaust) {
            const alpha = p.life * 0.8;
            const hue = 20 + (1 - p.life) * 30;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
            ctx.fill();
        }

        // All coordinates relative to rocket.x (tail-left) and rocket.y (center-y)
        const x = rocket.x;
        const y = rocket.y;
        const W = rocket.w; // total length (44)
        const H = rocket.h; // total height (28)
        const halfH = H / 2;

        // ---- Flame (exits leftward from the tail) ----
        const flicker = Math.sin(Date.now() * 0.02) * 4;
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x - 18 - flicker, y);
        ctx.lineTo(x, y + 6);
        ctx.closePath();
        const flameGrad = ctx.createLinearGradient(x, y, x - 20, y);
        flameGrad.addColorStop(0, '#ffaa00');
        flameGrad.addColorStop(0.5, '#ff6600');
        flameGrad.addColorStop(1, 'rgba(255, 50, 0, 0.15)');
        ctx.fillStyle = flameGrad;
        ctx.fill();

        // ---- Body (horizontal: tail at x, nose at x+W) ----
        ctx.beginPath();
        ctx.moveTo(x + W, y);                   // nose tip (rightmost)
        ctx.lineTo(x + W - 12, y - halfH);      // top-right shoulder
        ctx.lineTo(x + 2, y - halfH + 2);       // top-left
        ctx.lineTo(x, y);                        // tail center
        ctx.lineTo(x + 2, y + halfH - 2);       // bottom-left
        ctx.lineTo(x + W - 12, y + halfH);      // bottom-right shoulder
        ctx.closePath();
        const bodyGrad = ctx.createLinearGradient(x, y - halfH, x, y + halfH);
        bodyGrad.addColorStop(0, '#c9d1d9');
        bodyGrad.addColorStop(0.5, '#f0f3f6');
        bodyGrad.addColorStop(1, '#8b949e');
        ctx.fillStyle = bodyGrad;
        ctx.fill();
        ctx.strokeStyle = '#58a6ff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // ---- Window (cockpit) ----
        ctx.beginPath();
        ctx.arc(x + W - 18, y, 5, 0, Math.PI * 2);
        const winGrad = ctx.createRadialGradient(x + W - 18, y, 1, x + W - 18, y, 5);
        winGrad.addColorStop(0, '#79c0ff');
        winGrad.addColorStop(1, '#1f6feb');
        ctx.fillStyle = winGrad;
        ctx.fill();

        // ---- Top fin ----
        ctx.beginPath();
        ctx.moveTo(x + 6, y - halfH + 2);
        ctx.lineTo(x, y - halfH - 8);
        ctx.lineTo(x - 2, y - halfH + 4);
        ctx.closePath();
        ctx.fillStyle = '#f85149';
        ctx.fill();

        // ---- Bottom fin ----
        ctx.beginPath();
        ctx.moveTo(x + 6, y + halfH - 2);
        ctx.lineTo(x, y + halfH + 8);
        ctx.lineTo(x - 2, y + halfH - 4);
        ctx.closePath();
        ctx.fillStyle = '#f85149';
        ctx.fill();

        // ---- Nose tip glow ----
        ctx.shadowColor = '#58a6ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x + W, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#79c0ff';
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // ---- Bullets ----
    function fireBullet() {
        const now = Date.now();
        if (now - lastShotTime < BULLET_COOLDOWN) return;
        lastShotTime = now;
        shotsFired++;

        bullets.push({
            x: rocket.x + rocket.w, // launch from nose tip
            y: rocket.y,
            vx: BULLET_SPEED, // horizontal rightward
            w: 14,
            h: 3,
            alive: true
        });
    }

    function updateBullets() {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.x += b.vx; // move horizontally
            if (b.x > canvas.width) {
                bullets.splice(i, 1);
                continue;
            }

            // Collision with grid
            for (const cell of gridCells) {
                if (!cell.alive) continue;
                if (
                    b.x + b.w >= cell.x &&
                    b.x <= cell.x + cell.w &&
                    b.y + b.h / 2 >= cell.y &&
                    b.y - b.h / 2 <= cell.y + cell.h
                ) {
                    cell.alive = false;
                    b.alive = false;
                    destroyedCells++;
                    spawnExplosion(cell.x + cell.w / 2, cell.y + cell.h / 2, cell.color);
                    spawnShockwave(cell.x + cell.w / 2, cell.y + cell.h / 2);
                    break;
                }
            }

            if (!b.alive) {
                bullets.splice(i, 1);
            }
        }
    }

    function drawBullets() {
        for (const b of bullets) {
            // Trail glow
            ctx.shadowColor = '#39d353';
            ctx.shadowBlur = 12;

            // Horizontal gradient (trail fades behind the bullet)
            const grad = ctx.createLinearGradient(b.x - b.w, b.y, b.x + b.w, b.y);
            grad.addColorStop(0, 'rgba(57, 211, 83, 0.1)');
            grad.addColorStop(1, '#39d353');

            ctx.fillStyle = grad;
            ctx.fillRect(b.x - b.w, b.y - b.h / 2, b.w * 2, b.h);

            // Bright core
            ctx.fillStyle = '#fff';
            ctx.fillRect(b.x + b.w - 6, b.y - 1, 6, 2);

            ctx.shadowBlur = 0;
        }
    }

    // ---- Particles ----
    function spawnExplosion(x, y, color) {
        const count = 16;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
            const speed = Math.random() * 4 + 2;
            particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color,
                size: Math.random() * 4 + 2
            });
        }
    }

    function spawnShockwave(x, y) {
        shockwaves.push({
            x,
            y,
            radius: 2,
            maxRadius: 40,
            life: 1
        });
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.vy += 0.08; // gravity
            p.life -= 0.025;
            if (p.life <= 0) particles.splice(i, 1);
        }

        for (let i = shockwaves.length - 1; i >= 0; i--) {
            const s = shockwaves[i];
            s.radius += 2;
            s.life -= 0.04;
            if (s.life <= 0) shockwaves.splice(i, 1);
        }
    }

    function drawParticles() {
        for (const p of particles) {
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;

        for (const s of shockwaves) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(57, 211, 83, ${s.life * 0.5})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    // ---- HUD ----
    function updateHUD() {
        hudScore.textContent = destroyedCells * 10;
        hudCells.textContent = `${destroyedCells}/${totalCells}`;
        const acc = shotsFired > 0 ? Math.round((destroyedCells / shotsFired) * 100) : 0;
        hudAccuracy.textContent = acc + '%';
    }

    // ---- Grid Label ----
    function drawGridLabel() {
        ctx.font = '600 13px "Outfit", sans-serif';
        ctx.fillStyle = '#8b949e';
        ctx.textAlign = 'left';
        const gridWidth = gridCols * (CELL_SIZE + CELL_GAP) - CELL_GAP;
        const gridBottom = gridOffsetY + GRID_ROWS * (CELL_SIZE + CELL_GAP);
        ctx.fillText(`${totalCells - destroyedCells} contributions remaining`, gridOffsetX, gridBottom + 20);

        // Progress bar
        const progress = totalCells > 0 ? destroyedCells / totalCells : 0;
        const barY = gridBottom + 28;
        const barH = 4;
        ctx.fillStyle = '#21262d';
        ctx.beginPath();
        ctx.roundRect(gridOffsetX, barY, gridWidth, barH, 2);
        ctx.fill();

        if (progress > 0) {
            const progGrad = ctx.createLinearGradient(gridOffsetX, barY, gridOffsetX + gridWidth * progress, barY);
            progGrad.addColorStop(0, '#26a641');
            progGrad.addColorStop(1, '#39d353');
            ctx.fillStyle = progGrad;
            ctx.shadowColor = '#39d353';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.roundRect(gridOffsetX, barY, gridWidth * progress, barH, 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    // ---- Win Check ----
    function checkWin() {
        if (destroyedCells >= totalCells && totalCells > 0) {
            gameState = 'win';
            showWinScreen();
        }
    }

    function showWinScreen() {
        hud.classList.remove('visible');
        const elapsed = ((Date.now() - gameStartTime) / 1000).toFixed(1);
        const acc = shotsFired > 0 ? Math.round((destroyedCells / shotsFired) * 100) : 0;

        winStats.innerHTML = `
            <div class="stat-card"><div class="stat-val">${destroyedCells * 10}</div><div class="stat-label">Score</div></div>
            <div class="stat-card"><div class="stat-val">${destroyedCells}</div><div class="stat-label">Cells Hit</div></div>
            <div class="stat-card"><div class="stat-val">${shotsFired}</div><div class="stat-label">Shots</div></div>
            <div class="stat-card"><div class="stat-val">${acc}%</div><div class="stat-label">Accuracy</div></div>
            <div class="stat-card"><div class="stat-val">${elapsed}s</div><div class="stat-label">Time</div></div>
        `;
        winScreen.classList.remove('hidden');
    }

    // ---- Helpers ----
    function easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    // ---- Game Loop ----
    function gameLoop(time) {
        animFrame = requestAnimationFrame(gameLoop);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawStars(time);

        if (gameState === 'playing') {
            updateRocket();
            updateBullets();
            updateParticles();
            updateHUD();

            drawGrid(time);
            drawGridLabel();
            drawBullets();
            drawParticles();
            drawRocket();

            checkWin();
        } else if (gameState === 'win') {
            // Keep rendering particles and the cleared grid
            updateParticles();
            drawGrid(time);
            drawGridLabel();
            drawParticles();
            drawRocket();
        }
    }

    // ---- Init / Reset ----
    function initGame() {
        gameState = 'playing';
        bullets = [];
        particles = [];
        shockwaves = [];
        shotsFired = 0;
        lastShotTime = 0;
        gameStartTime = Date.now();

        generateStars();
        generateGrid();
        createRocket();

        startScreen.classList.add('hidden');
        winScreen.classList.add('hidden');
        hud.classList.add('visible');
    }

    // ---- Input ----
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (gameState === 'playing') {
                fireBullet();
            } else if (gameState === 'start') {
                initGame();
            }
        }
    });

    canvas.addEventListener('click', (e) => {
        if (gameState === 'playing') {
            fireBullet();
        }
    });

    canvas.addEventListener('touchstart', (e) => {
        if (gameState === 'playing') {
            e.preventDefault();
            fireBullet();
        }
    }, { passive: false });

    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        initGame();
    });

    replayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        initGame();
    });

    // ---- Handle resize ----
    window.addEventListener('resize', () => {
        resizeCanvas();
        generateStars();
        if (gameState === 'playing') {
            // Recalculate grid positions
            const gridWidth = gridCols * (CELL_SIZE + CELL_GAP) - CELL_GAP;
            const gridHeight = GRID_ROWS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
            gridOffsetX = (canvas.width - gridWidth) / 2;
            for (const cell of gridCells) {
                cell.x = gridOffsetX + cell.col * (CELL_SIZE + CELL_GAP);
                cell.y = gridOffsetY + cell.row * (CELL_SIZE + CELL_GAP);
            }
            if (rocket) {
                rocket.x = gridOffsetX - 60;
                rocket.minY = gridOffsetY;
                rocket.maxY = gridOffsetY + gridHeight;
                // Clamp Y within new bounds
                rocket.y = Math.max(rocket.minY, Math.min(rocket.maxY, rocket.y));
            }
        }
    });

    // ---- Start rendering (behind start screen) ----
    generateStars();
    gameLoop(0);

})();
