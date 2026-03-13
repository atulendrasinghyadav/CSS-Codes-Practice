/* ============================================
   SVG Draw Border — JavaScript Animation Engine
   ============================================ */

(function () {
  'use strict';

  // ——— Speed multiplier ———
  let speedMultiplier = 1;

  // ——— DOM refs ———
  const btnPlay = document.getElementById('btnPlay');
  const btnReset = document.getElementById('btnReset');
  const speedRange = document.getElementById('speedRange');
  const speedValue = document.getElementById('speedValue');
  const particlesContainer = document.getElementById('particles');

  // ——— Generate ambient particles ———
  function createParticles(count = 30) {
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
      p.style.animationDelay = (Math.random() * 8).toFixed(2) + 's';
      p.style.animationDuration = (6 + Math.random() * 6).toFixed(2) + 's';
      const colors = ['#6c5ce7', '#a29bfe', '#00cec9', '#fd79a8', '#ffeaa7'];
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
      particlesContainer.appendChild(p);
    }
  }
  createParticles();

  // ——— Utility: Animate a value from → to using requestAnimationFrame ———
  function animateValue(element, attr, from, to, durationMs, easeFn) {
    return new Promise((resolve) => {
      const start = performance.now();
      const delta = to - from;

      function tick(now) {
        const elapsed = now - start;
        const t = Math.min(elapsed / durationMs, 1);
        const eased = easeFn ? easeFn(t) : t;
        const current = from + delta * eased;

        if (attr === 'stroke-dashoffset') {
          element.setAttribute('stroke-dashoffset', current);
        } else {
          element.style[attr] = current;
        }

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      }

      requestAnimationFrame(tick);
    });
  }

  // ——— Easing functions ———
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInOutQuart(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  // ——— SVG gradient injection (for Card 2) ———
  function injectGradient() {
    const svg2 = document.querySelector('#card2 .border-svg');
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'grad2');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');

    const stops = [
      { offset: '0%', color: '#00cec9' },
      { offset: '50%', color: '#6c5ce7' },
      { offset: '100%', color: '#fd79a8' },
    ];

    stops.forEach((s) => {
      const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop.setAttribute('offset', s.offset);
      stop.setAttribute('stop-color', s.color);
      gradient.appendChild(stop);
    });

    defs.appendChild(gradient);
    svg2.prepend(defs);
  }
  injectGradient();

  // ============================================
  //  CARD 1 — Sequential Stroke-by-Stroke
  // ============================================
  function initCard1() {
    const lines = document.querySelectorAll('#card1 .border-line');
    lines.forEach((line) => {
      const len = parseFloat(getComputedStyle(line).getPropertyValue('--line-length'));
      line.setAttribute('stroke-dasharray', len);
      line.setAttribute('stroke-dashoffset', len);
    });
  }

  async function animateCard1() {
    const card = document.getElementById('card1');
    card.classList.add('animated');

    const lines = [
      { el: document.querySelector('#card1 .line-top'), len: 332 },
      { el: document.querySelector('#card1 .line-right'), len: 212 },
      { el: document.querySelector('#card1 .line-bottom'), len: 332 },
      { el: document.querySelector('#card1 .line-left'), len: 212 },
    ];

    for (const { el, len } of lines) {
      const dur = (len * 2.2) / speedMultiplier;
      await animateValue(el, 'stroke-dashoffset', len, 0, dur, easeOutCubic);
    }
  }

  function resetCard1() {
    const card = document.getElementById('card1');
    card.classList.remove('animated');
    initCard1();
  }

  // ============================================
  //  CARD 2 — Continuous Rounded Rect
  // ============================================
  let card2PathLen = 0;

  function initCard2() {
    const rect = document.querySelector('#card2 .border-rect');
    card2PathLen = rect.getTotalLength();
    rect.setAttribute('stroke-dasharray', card2PathLen);
    rect.setAttribute('stroke-dashoffset', card2PathLen);
  }

  async function animateCard2() {
    const rect = document.querySelector('#card2 .border-rect');
    const dur = (card2PathLen * 2) / speedMultiplier;
    await animateValue(rect, 'stroke-dashoffset', card2PathLen, 0, dur, easeInOutQuart);
  }

  function resetCard2() {
    initCard2();
  }

  // ============================================
  //  CARD 3 — Dual Converge
  // ============================================
  let card3LenA = 0;
  let card3LenB = 0;

  function initCard3() {
    const pathA = document.querySelector('#card3 .path-a');
    const pathB = document.querySelector('#card3 .path-b');
    card3LenA = pathA.getTotalLength();
    card3LenB = pathB.getTotalLength();
    pathA.setAttribute('stroke-dasharray', card3LenA);
    pathA.setAttribute('stroke-dashoffset', card3LenA);
    pathB.setAttribute('stroke-dasharray', card3LenB);
    pathB.setAttribute('stroke-dashoffset', card3LenB);
  }

  async function animateCard3() {
    const pathA = document.querySelector('#card3 .path-a');
    const pathB = document.querySelector('#card3 .path-b');
    const durA = (card3LenA * 2) / speedMultiplier;
    const durB = (card3LenB * 2) / speedMultiplier;
    await Promise.all([
      animateValue(pathA, 'stroke-dashoffset', card3LenA, 0, durA, easeOutCubic),
      animateValue(pathB, 'stroke-dashoffset', card3LenB, 0, durB, easeOutCubic),
    ]);
  }

  function resetCard3() {
    initCard3();
  }

  // ============================================
  //  CARD 4 — Dashed Reveal
  // ============================================
  let card4Len = 0;

  function initCard4() {
    const dashedRect = document.querySelector('#card4 .border-dashed');
    card4Len = dashedRect.getTotalLength();
    // We use a big dasharray so the dashes appear sequentially
    // The trick: set dashoffset = total length to hide, then animate to 0
    dashedRect.style.strokeDasharray = '12 8';

    // Calculate total visible "fill" length based on dash pattern
    const segLen = 12 + 8; // dash + gap
    const numSegs = Math.ceil(card4Len / segLen);
    const totalDash = numSegs * segLen;

    dashedRect.setAttribute('stroke-dasharray', totalDash + ' ' + totalDash);
    dashedRect.setAttribute('stroke-dashoffset', totalDash);
    dashedRect._totalDash = totalDash;
  }

  async function animateCard4() {
    const dashedRect = document.querySelector('#card4 .border-dashed');
    const total = dashedRect._totalDash;
    const dur = (total * 1.6) / speedMultiplier;

    await animateValue(dashedRect, 'stroke-dashoffset', total, 0, dur, easeInOutQuart);

    // Now swap back to the nice dashed look
    dashedRect.style.strokeDasharray = '12 8';
    dashedRect.setAttribute('stroke-dashoffset', '0');
  }

  function resetCard4() {
    initCard4();
  }

  // ============================================
  //  Orchestration
  // ============================================
  function initAll() {
    initCard1();
    initCard2();
    initCard3();
    initCard4();
  }

  async function playAll() {
    btnPlay.disabled = true;
    btnPlay.querySelector('.btn-icon').textContent = '⏸';
    btnPlay.querySelector('.btn-icon').nextSibling.textContent = ' Playing…';

    // Stagger cards for a cascading effect
    const delay = 200 / speedMultiplier;

    // Launch in overlapping waves
    const p1 = animateCard1();
    await sleep(delay);
    const p2 = animateCard2();
    await sleep(delay);
    const p3 = animateCard3();
    await sleep(delay);
    const p4 = animateCard4();

    await Promise.all([p1, p2, p3, p4]);

    btnPlay.disabled = false;
    btnPlay.querySelector('.btn-icon').textContent = '▶';
    btnPlay.querySelector('.btn-icon').nextSibling.textContent = ' Play Animation';
  }

  function resetAll() {
    resetCard1();
    resetCard2();
    resetCard3();
    resetCard4();
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ——— Initialize ———
  initAll();

  // ——— Event Listeners ———
  btnPlay.addEventListener('click', () => {
    resetAll();
    // Small delay to allow reset to render
    requestAnimationFrame(() => requestAnimationFrame(playAll));
  });

  btnReset.addEventListener('click', resetAll);

  speedRange.addEventListener('input', () => {
    speedMultiplier = parseFloat(speedRange.value);
    speedValue.textContent = speedMultiplier.toFixed(1) + '×';
  });

  // ——— Hover-triggered animation per card ———
  const cardAnimators = {
    card1: { animate: animateCard1, reset: resetCard1 },
    card2: { animate: animateCard2, reset: resetCard2 },
    card3: { animate: animateCard3, reset: resetCard3 },
    card4: { animate: animateCard4, reset: resetCard4 },
  };

  Object.keys(cardAnimators).forEach((id) => {
    const card = document.getElementById(id);
    let hoverTimeout;

    card.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
      cardAnimators[id].reset();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        cardAnimators[id].animate();
      }));
    });

    card.addEventListener('mouseleave', () => {
      hoverTimeout = setTimeout(() => {
        cardAnimators[id].reset();
      }, 1500);
    });
  });
})();
