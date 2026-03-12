/* ============================================
   RGB GLITCH — JavaScript Engine
   Noise, random glitch bars, flicker bursts,
   and hex status code cycling.
   ============================================ */

(() => {
    'use strict';

    // ── Noise Canvas ──────────────────────────
    const noiseCanvas = document.getElementById('noiseCanvas');
    const noiseCtx    = noiseCanvas.getContext('2d');

    function resizeNoise() {
        // Lower resolution for performance
        noiseCanvas.width  = window.innerWidth  * 0.25;
        noiseCanvas.height = window.innerHeight * 0.25;
    }

    function drawNoise() {
        const w = noiseCanvas.width;
        const h = noiseCanvas.height;
        const imageData = noiseCtx.createImageData(w, h);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const v = Math.random() * 255;
            data[i]     = v;
            data[i + 1] = v;
            data[i + 2] = v;
            data[i + 3] = 255;
        }

        noiseCtx.putImageData(imageData, 0, 0);
        requestAnimationFrame(drawNoise);
    }

    window.addEventListener('resize', resizeNoise);
    resizeNoise();
    drawNoise();


    // ── Glitch Bars ───────────────────────────
    const glitchBarsContainer = document.getElementById('glitchBars');

    function spawnGlitchBar() {
        const bar = document.createElement('div');
        bar.className = 'glitch-bar active';

        const height = Math.random() * 6 + 1;
        const top    = Math.random() * 100;

        bar.style.top    = `${top}%`;
        bar.style.height = `${height}px`;

        // Random RGB tint per bar
        const tints = [
            'rgba(255, 0, 64, 0.12)',
            'rgba(0, 162, 255, 0.1)',
            'rgba(0, 255, 136, 0.1)',
            'rgba(255, 0, 64, 0.06)',
        ];
        const tint = tints[Math.floor(Math.random() * tints.length)];
        bar.style.background = `linear-gradient(90deg, transparent, ${tint}, transparent)`;

        glitchBarsContainer.appendChild(bar);

        // Remove after animation
        bar.addEventListener('animationend', () => bar.remove());
    }

    function glitchBarLoop() {
        // Spawn 1–4 bars at random intervals
        const count = Math.floor(Math.random() * 4) + 1;
        for (let i = 0; i < count; i++) {
            setTimeout(spawnGlitchBar, Math.random() * 80);
        }

        const next = Math.random() * 2000 + 500;
        setTimeout(glitchBarLoop, next);
    }

    glitchBarLoop();


    // ── Flicker Bursts ────────────────────────
    const glitchWrapper = document.getElementById('glitchWrapper');

    function triggerFlicker() {
        glitchWrapper.classList.add('flicker');
        glitchWrapper.addEventListener('animationend', () => {
            glitchWrapper.classList.remove('flicker');
        }, { once: true });
    }

    function flickerLoop() {
        triggerFlicker();
        const next = Math.random() * 5000 + 2000;
        setTimeout(flickerLoop, next);
    }

    flickerLoop();


    // ── Dynamic RGB Split on main text ────────
    const glitchEl = document.querySelector('.glitch');

    function randomChannelSplit() {
        const rx = (Math.random() * 10 - 5).toFixed(1);
        const ry = (Math.random() * 4 - 2).toFixed(1);
        const bx = (Math.random() * 10 - 5).toFixed(1);
        const by = (Math.random() * 4 - 2).toFixed(1);

        glitchEl.style.textShadow = `
            ${rx}px ${ry}px 0 var(--clr-red),
            ${bx}px ${by}px 0 var(--clr-blue),
            0 0 12px rgba(224, 224, 232, 0.15)`;

        setTimeout(() => {
            glitchEl.style.textShadow = '';
        }, 100 + Math.random() * 100);
    }

    function channelSplitLoop() {
        randomChannelSplit();
        const next = Math.random() * 3000 + 1000;
        setTimeout(channelSplitLoop, next);
    }

    channelSplitLoop();


    // ── Status Code Cycling ───────────────────
    const statusCode = document.getElementById('statusCode');
    const statusTexts = [
        'SIGNAL_CORRUPT',
        'FRAME_DESYNC',
        'BUFFER_OVERFLOW',
        'PIXEL_DRIFT',
        'SYNC_LOST',
        'RENDER_FAULT',
        'CHANNEL_SPLIT',
        'DATA_CORRUPT',
    ];
    const statusTextEl = document.querySelector('.status-text');

    function randomHex() {
        return '0x' + Math.floor(Math.random() * 0xFFFFFF)
            .toString(16)
            .toUpperCase()
            .padStart(6, '0');
    }

    function cycleStatus() {
        statusCode.textContent = randomHex();
        statusTextEl.textContent = statusTexts[Math.floor(Math.random() * statusTexts.length)];
    }

    setInterval(cycleStatus, 2500);


    // ── Intense Glitch Burst (periodic) ───────
    function intenseBurst() {
        const layerR = document.querySelector('.glitch__layer--r');
        const layerG = document.querySelector('.glitch__layer--g');
        const layerB = document.querySelector('.glitch__layer--b');

        // Big random offsets
        const offsets = [
            { x: -12, y: 4 },
            { x: 14, y: -3 },
            { x: -8, y: 6 },
        ];

        layerR.style.transform = `translate(${offsets[0].x}px, ${offsets[0].y}px) skewX(${(Math.random() * 6 - 3).toFixed(1)}deg)`;
        layerG.style.transform = `translate(${offsets[1].x}px, ${offsets[1].y}px) skewX(${(Math.random() * 6 - 3).toFixed(1)}deg)`;
        layerB.style.transform = `translate(${offsets[2].x}px, ${offsets[2].y}px) skewX(${(Math.random() * 6 - 3).toFixed(1)}deg)`;

        // Reset after a short flash
        setTimeout(() => {
            layerR.style.transform = '';
            layerG.style.transform = '';
            layerB.style.transform = '';
        }, 120);

        // Also spawn a dense cluster of bars
        for (let i = 0; i < 8; i++) {
            setTimeout(spawnGlitchBar, Math.random() * 60);
        }
    }

    function intenseBurstLoop() {
        intenseBurst();
        const next = Math.random() * 6000 + 3000;
        setTimeout(intenseBurstLoop, next);
    }

    intenseBurstLoop();


    // ── Horizontal Slice Displacement ─────────
    // Randomly clips + shifts a horizontal slice of the text
    const subtitle = document.getElementById('subtitle');

    function sliceDisplace() {
        const y1 = Math.random() * 100;
        const y2 = y1 + Math.random() * 15 + 5;
        const shift = (Math.random() * 20 - 10).toFixed(1);

        glitchEl.style.clipPath = `inset(${y1.toFixed(0)}% 0 ${(100 - y2).toFixed(0)}% 0)`;
        glitchEl.style.transform = `translateX(${shift}px)`;

        subtitle.style.transform = `translateX(${(-shift * 0.5).toFixed(1)}px)`;

        setTimeout(() => {
            glitchEl.style.clipPath = '';
            glitchEl.style.transform = '';
            subtitle.style.transform = '';
        }, 80 + Math.random() * 60);
    }

    function sliceLoop() {
        sliceDisplace();
        const next = Math.random() * 4000 + 2000;
        setTimeout(sliceLoop, next);
    }

    sliceLoop();

})();
