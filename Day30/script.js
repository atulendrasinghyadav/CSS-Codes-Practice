const scoreEl = document.getElementById("score");
const roundEl = document.getElementById("round");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");

const arena = document.getElementById("arena");
const circle = document.getElementById("circle");
const pulse = document.getElementById("pulse");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const overlayBtn = document.getElementById("overlayBtn");

const game = {
  score: 0,
  round: 1,
  running: false,
  canTap: false,
  currentTimer: null,
  shrinkRaf: null,
  baseDuration: 1450,
  minDuration: 420,
  currentScale: 1,
  currentX: 0,
  currentY: 0,
  currentSize: 120,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getRoundDuration(round) {
  const accelerated = game.baseDuration * Math.pow(0.9, round - 1);
  return Math.max(game.minDuration, Math.round(accelerated));
}

function getRoundSize(round, arenaMinEdge) {
  const start = Math.max(72, arenaMinEdge * 0.18);
  const decrease = (round - 1) * 4;
  return clamp(Math.round(start - decrease), 52, 140);
}

function updateHud() {
  scoreEl.textContent = String(game.score);
  roundEl.textContent = String(game.round);
}

function setStatus(text) {
  statusEl.textContent = text;
}

function showOverlay(title, text, buttonText) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayBtn.textContent = buttonText;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function flashPulse(x, y) {
  pulse.classList.remove("hidden");
  pulse.style.left = `${x}px`;
  pulse.style.top = `${y}px`;
  pulse.classList.remove("pulse");
  void pulse.offsetWidth;
  pulse.classList.add("pulse");

  window.setTimeout(() => {
    pulse.classList.add("hidden");
  }, 250);
}

function stopTimers() {
  if (game.currentTimer) {
    window.clearTimeout(game.currentTimer);
    game.currentTimer = null;
  }

  if (game.shrinkRaf) {
    window.cancelAnimationFrame(game.shrinkRaf);
    game.shrinkRaf = null;
  }
}

function loseRound() {
  game.running = false;
  game.canTap = false;
  stopTimers();
  circle.classList.add("hidden");

  arena.classList.add("shake");
  window.setTimeout(() => arena.classList.remove("shake"), 340);

  setStatus(`Missed! Final score: ${game.score}`);
  showOverlay(
    "Game Over",
    `You reached round ${game.round}. Final score: ${game.score}.`,
    "Play Again"
  );
}

function startShrink(duration) {
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = clamp(elapsed / duration, 0, 1);
    game.currentScale = 1 - progress;
    circle.style.transform = `scale(${game.currentScale})`;

    if (progress < 1 && game.running && game.canTap) {
      game.shrinkRaf = window.requestAnimationFrame(step);
    } else if (progress >= 1 && game.running && game.canTap) {
      loseRound();
    }
  }

  game.shrinkRaf = window.requestAnimationFrame(step);
}

function placeCircle() {
  const arenaRect = arena.getBoundingClientRect();
  const margin = 10;
  const minEdge = Math.min(arenaRect.width, arenaRect.height);

  game.currentSize = getRoundSize(game.round, minEdge);
  const maxX = Math.max(margin, arenaRect.width - game.currentSize - margin);
  const maxY = Math.max(margin, arenaRect.height - game.currentSize - margin);

  game.currentX = Math.random() * (maxX - margin) + margin;
  game.currentY = Math.random() * (maxY - margin) + margin;

  circle.style.width = `${game.currentSize}px`;
  circle.style.height = `${game.currentSize}px`;
  circle.style.left = `${game.currentX}px`;
  circle.style.top = `${game.currentY}px`;
  circle.style.transform = "scale(1)";
}

function spawnRound() {
  stopTimers();

  const duration = getRoundDuration(game.round);
  placeCircle();

  game.canTap = true;
  circle.classList.remove("hidden");

  const speedHint = (1450 / duration).toFixed(2);
  setStatus(`Round ${game.round}: x${speedHint} speed`);

  startShrink(duration);
  game.currentTimer = window.setTimeout(() => {
    if (game.running && game.canTap) {
      loseRound();
    }
  }, duration + 16);
}

function startGame() {
  game.score = 0;
  game.round = 1;
  game.running = true;
  game.canTap = false;

  updateHud();
  hideOverlay();
  setStatus("Get ready...");

  window.setTimeout(() => {
    if (game.running) {
      spawnRound();
    }
  }, 280);
}

function onCircleTap(event) {
  if (!game.running || !game.canTap) {
    return;
  }

  event.preventDefault();
  game.canTap = false;

  stopTimers();
  flashPulse(game.currentX + game.currentSize / 2, game.currentY + game.currentSize / 2);

  game.score += 1;
  game.round += 1;
  updateHud();

  circle.classList.add("pop");
  window.setTimeout(() => circle.classList.remove("pop"), 220);

  window.setTimeout(() => {
    if (game.running) {
      spawnRound();
    }
  }, 180);
}

function bindEvents() {
  startBtn.addEventListener("click", startGame);
  overlayBtn.addEventListener("click", startGame);

  circle.addEventListener("click", onCircleTap);
  circle.addEventListener("touchstart", onCircleTap, { passive: false });

  window.addEventListener("resize", () => {
    if (game.running && game.canTap) {
      placeCircle();
    }
  });
}

bindEvents();
updateHud();
showOverlay("Ready?", "Tap Start to begin your reflex challenge.", "Start");
