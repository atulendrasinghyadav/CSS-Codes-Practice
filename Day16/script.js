/**
 * Liquid Blob Loading Animation
 * ──────────────────────────────
 * • 4 morphing blobs merged with SVG gooey filter
 * • SVG circular progress ring
 * • Percentage counter looping 0→100
 * • Floating micro-particles on canvas
 */

(() => {
  /* ───── SVG gradient for ring stroke ───── */
  const svgNS = 'http://www.w3.org/2000/svg';
  const ringSvg = document.querySelector('.ring-svg');

  const defs = document.createElementNS(svgNS, 'defs');
  const grad = document.createElementNS(svgNS, 'linearGradient');
  grad.setAttribute('id', 'ringGrad');
  grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
  grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');

  const stops = [
    { offset: '0%', color: '#6366f1' },
    { offset: '50%', color: '#ec4899' },
    { offset: '100%', color: '#06b6d4' },
  ];
  stops.forEach(s => {
    const stop = document.createElementNS(svgNS, 'stop');
    stop.setAttribute('offset', s.offset);
    stop.setAttribute('stop-color', s.color);
    grad.appendChild(stop);
  });
  defs.appendChild(grad);
  ringSvg.insertBefore(defs, ringSvg.firstChild);

  /* ───── Elements ───── */
  const ringFill = document.getElementById('ringFill');
  const pctEl = document.getElementById('pct');
  const labelEl = document.getElementById('label');

  const CIRCUMF = 2 * Math.PI * 88; // ≈ 553
  const CYCLE = 5000;
  const PAUSE = 600;
  const TOTAL = CYCLE + PAUSE;

  const LABELS = [
    { at: 0, text: 'Loading' },
    { at: 20, text: 'Preparing' },
    { at: 40, text: 'Building' },
    { at: 60, text: 'Optimizing' },
    { at: 80, text: 'Finishing' },
  ];

  function getLabel(p) {
    let t = LABELS[0].text;
    for (const l of LABELS) if (p >= l.at) t = l.text;
    return t;
  }

  /* ───── Micro-particle canvas ───── */
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  const P_COUNT = 60;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function initParticles() {
    particles = [];
    for (let i = 0; i < P_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.4 + 0.1,
        color: ['#6366f1', '#ec4899', '#06b6d4', '#a78bfa'][Math.floor(Math.random() * 4)],
      });
    }
  }
  initParticles();

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw dots
    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  /* ───── Main animation loop ───── */
  let start = null;

  function loop(ts) {
    if (!start) start = ts;
    const elapsed = (ts - start) % TOTAL;
    const rawPct = Math.min(100, (elapsed / CYCLE) * 100);
    const pct = Math.round(rawPct);

    // Update counter
    pctEl.textContent = pct;

    // Update ring
    const offset = CIRCUMF - (CIRCUMF * rawPct) / 100;
    ringFill.style.strokeDashoffset = offset;

    // Update label
    labelEl.textContent = getLabel(pct);

    // Draw particles
    drawParticles();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
