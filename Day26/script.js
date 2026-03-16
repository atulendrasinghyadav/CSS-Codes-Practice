const road = document.getElementById("road");
const playerEl = document.getElementById("player");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const speedEl = document.getElementById("speed");
const finalScoreEl = document.getElementById("finalScore");
const startOverlay = document.getElementById("startOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

const LANES = 3;
const state = {
  running: false,
  paused: false,
  score: 0,
  best: Number(localStorage.getItem("neon-best-score") || 0),
  lane: 1,
  targetLane: 1,
  roadWidth: 0,
  roadHeight: 0,
  playerWidth: 58,
  playerHeight: 94,
  playerX: 0,
  playerYOffset: 0,
  steeringDeg: 0,
  laneLerp: {
    active: false,
    startX: 0,
    targetX: 0,
    dir: 0,
    progress: 0,
    duration: 260,
  },
  speed: 4.2,
  speedStep: 0.0016,
  spawnTimer: 0,
  spawnEvery: 820,
  obstacles: [],
  lastFrame: 0,
};

bestEl.textContent = String(state.best);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

function laneToX(lane, width, itemWidth) {
  const laneWidth = width / LANES;
  const centerX = laneWidth * lane + laneWidth / 2;
  return Math.round(centerX - itemWidth / 2);
}

function updateMetrics() {
  const rect = road.getBoundingClientRect();
  state.roadWidth = rect.width;
  state.roadHeight = rect.height;
  state.playerWidth = playerEl.offsetWidth;
  state.playerHeight = playerEl.offsetHeight;
}

function renderPlayer() {
  playerEl.style.left = `${Math.round(state.playerX)}px`;
  playerEl.style.transform = `translateY(${state.playerYOffset}px) rotate(${state.steeringDeg}deg)`;
}

function setPlayerToLaneInstant() {
  const x = laneToX(state.targetLane, state.roadWidth, state.playerWidth);
  state.playerX = x;
  state.playerYOffset = 0;
  state.steeringDeg = 0;
  state.laneLerp.active = false;
  state.lane = state.targetLane;
  renderPlayer();
}

function startLaneChange(nextLane) {
  if (nextLane === state.targetLane) {
    return;
  }

  const startX = state.playerX;
  const targetX = laneToX(nextLane, state.roadWidth, state.playerWidth);
  const dir = Math.sign(targetX - startX);

  state.targetLane = nextLane;
  state.laneLerp = {
    active: true,
    startX,
    targetX,
    dir,
    progress: 0,
    duration: 260,
  };
}

function updatePlayerMovement(dt) {
  if (!state.laneLerp.active) {
    state.playerYOffset = 0;
    state.steeringDeg = 0;
    return;
  }

  state.laneLerp.progress = clamp(
    state.laneLerp.progress + dt / state.laneLerp.duration,
    0,
    1
  );

  const eased = easeInOutCubic(state.laneLerp.progress);
  state.playerX =
    state.laneLerp.startX + (state.laneLerp.targetX - state.laneLerp.startX) * eased;
  state.playerYOffset = -Math.sin(state.laneLerp.progress * Math.PI) * 16;
  state.steeringDeg = state.laneLerp.dir * Math.sin(state.laneLerp.progress * Math.PI) * 8;
  renderPlayer();

  if (state.laneLerp.progress >= 1) {
    state.lane = state.targetLane;
    state.laneLerp.active = false;
    state.playerX = state.laneLerp.targetX;
    state.playerYOffset = 0;
    state.steeringDeg = 0;
    renderPlayer();
  }
}

function setObstacleToLane(el, lane, width) {
  const x = laneToX(lane, state.roadWidth, width);
  el.style.left = `${x}px`;
  return x;
}

function resetUI() {
  scoreEl.textContent = "0";
  speedEl.textContent = "1.0x";
  finalScoreEl.textContent = "0";
}

function clearObstacles() {
  for (const item of state.obstacles) {
    item.el.remove();
  }
  state.obstacles = [];
}

function createObstacle() {
  const lane = Math.floor(Math.random() * LANES);
  const el = document.createElement("div");
  el.className = `car enemy${Math.random() > 0.5 ? " alt" : ""}`;
  const width = 58;
  const height = 94;

  const x = setObstacleToLane(el, lane, width);
  el.style.top = `${-height - 8}px`;
  road.appendChild(el);

  state.obstacles.push({
    lane,
    x,
    y: -height - 8,
    width,
    height,
    el,
  });
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function getPlayerRect() {
  return {
    x: state.playerX,
    y: state.roadHeight - state.playerHeight - 14 + state.playerYOffset,
    width: state.playerWidth,
    height: state.playerHeight,
  };
}

function endGame() {
  state.running = false;
  gameOverOverlay.classList.remove("hidden");
  finalScoreEl.textContent = String(Math.floor(state.score));

  if (state.score > state.best) {
    state.best = Math.floor(state.score);
    localStorage.setItem("neon-best-score", String(state.best));
    bestEl.textContent = String(state.best);
  }
}

function updateHUD() {
  scoreEl.textContent = String(Math.floor(state.score));
  const speedFactor = (state.speed / 4.2).toFixed(1);
  speedEl.textContent = `${speedFactor}x`;
}

function update(dt) {
  if (!state.running || state.paused) {
    return;
  }

  updatePlayerMovement(dt);
  state.speed += state.speedStep * dt;
  state.score += 0.012 * dt;
  state.spawnTimer += dt;

  const dynamicSpawnEvery = clamp(state.spawnEvery - state.score * 1.6, 300, 820);
  if (state.spawnTimer >= dynamicSpawnEvery) {
    state.spawnTimer = 0;
    createObstacle();
  }

  const playerRect = getPlayerRect();

  for (let i = state.obstacles.length - 1; i >= 0; i -= 1) {
    const o = state.obstacles[i];
    o.y += state.speed * (dt / 16.666);
    o.el.style.top = `${o.y}px`;

    if (o.y > state.roadHeight + 20) {
      o.el.remove();
      state.obstacles.splice(i, 1);
      continue;
    }

    if (intersects(playerRect, o)) {
      endGame();
      return;
    }
  }

  updateHUD();
}

function loop(ts) {
  if (!state.lastFrame) {
    state.lastFrame = ts;
  }

  const dt = ts - state.lastFrame;
  state.lastFrame = ts;
  update(dt);
  requestAnimationFrame(loop);
}

function restartState() {
  updateMetrics();
  clearObstacles();

  state.running = true;
  state.paused = false;
  state.score = 0;
  state.lane = 1;
  state.targetLane = 1;
  state.speed = 4.2;
  state.spawnTimer = 0;

  setPlayerToLaneInstant();
  resetUI();
  startOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  document.body.classList.remove("paused");
}

function moveLane(dir) {
  if (!state.running || state.paused) {
    return;
  }
  const nextLane = clamp(state.targetLane + dir, 0, LANES - 1);
  startLaneChange(nextLane);
}

function moveLeft() {
  moveLane(-1);
}

function moveRight() {
  moveLane(1);
}

function togglePause() {
  if (!state.running) {
    return;
  }
  state.paused = !state.paused;
  document.body.classList.toggle("paused", state.paused);
}

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
    e.preventDefault();
    moveLeft();
  }

  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
    e.preventDefault();
    moveRight();
  }

  if (e.code === "Space") {
    e.preventDefault();
    togglePause();
  }
});

function bindTouchButton(btn, handler) {
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    handler();
  });
}

bindTouchButton(leftBtn, moveLeft);
bindTouchButton(rightBtn, moveRight);

startBtn.addEventListener("click", restartState);
restartBtn.addEventListener("click", restartState);

window.addEventListener("resize", () => {
  updateMetrics();
  setPlayerToLaneInstant();
});

updateMetrics();
setPlayerToLaneInstant();
resetUI();
requestAnimationFrame(loop);
