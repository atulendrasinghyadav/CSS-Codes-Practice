const arena = document.getElementById("arena");
const ship = document.getElementById("ship");
const starsLayer = document.getElementById("stars");
const overlay = document.getElementById("overlay");
const gameOverOverlay = document.getElementById("gameOver");
const startBtn = document.getElementById("startBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const finalScoreEl = document.getElementById("finalScore");
const shieldEl = document.getElementById("shield");
const waveEl = document.getElementById("wave");
const livesEl = document.getElementById("lives");
const threatEl = document.getElementById("threat");
const asteroidTemplate = document.getElementById("asteroidTemplate");

const state = {
  running: false,
  paused: false,
  gameOver: false,
  score: 0,
  bestScore: Number(localStorage.getItem("asteroid-dodge-best") || 0),
  shield: 100,
  wave: 1,
  pointerActive: false,
  pointerId: null,
  width: 0,
  height: 0,
  shipX: 0,
  shipY: 0,
  targetX: 0,
  targetY: 0,
  shipRadius: 0,
  shipTilt: 0,
  lastTime: 0,
  spawnTimer: 0,
  asteroidRate: 900,
  asteroidSpeed: 1.8,
  asteroidBurst: 0,
  asteroidId: 0,
  asteroids: [],
  stars: [],
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateScoreboard() {
  scoreEl.textContent = Math.floor(state.score).toString();
  bestScoreEl.textContent = Math.floor(state.bestScore).toString();
  shieldEl.textContent = Math.max(0, Math.round(state.shield)).toString();
  waveEl.textContent = state.wave.toString();
  livesEl.textContent = state.gameOver ? "0" : "1";

  if (state.shield > 60) {
    threatEl.textContent = "Low";
    threatEl.className = "";
  } else if (state.shield > 30) {
    threatEl.textContent = "Rising";
    threatEl.className = "warning";
  } else {
    threatEl.textContent = "Critical";
    threatEl.className = "danger";
  }
}

function measureArena() {
  const bounds = arena.getBoundingClientRect();
  state.width = bounds.width;
  state.height = bounds.height;
  state.shipRadius = ship.offsetWidth * 0.42;

  if (!state.shipX || !state.shipY) {
    state.shipX = state.width * 0.5;
    state.shipY = state.height * 0.78;
    state.targetX = state.shipX;
    state.targetY = state.shipY;
  }
}

function createStars() {
  starsLayer.innerHTML = "";
  state.stars = [];
  const total = Math.max(42, Math.floor((window.innerWidth * window.innerHeight) / 28000));

  for (let index = 0; index < total; index += 1) {
    const star = document.createElement("i");
    const size = Math.random() * 2.2 + 0.8;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const speed = 0.04 + Math.random() * 0.24;
    star.style.position = "absolute";
    star.style.left = `${x}%`;
    star.style.top = `${y}%`;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.borderRadius = "50%";
    star.style.background = "rgba(255,255,255,0.82)";
    star.style.boxShadow = "0 0 10px rgba(102, 226, 255, 0.35)";
    star.style.opacity = `${0.18 + Math.random() * 0.82}`;
    starsLayer.appendChild(star);
    state.stars.push({ el: star, x, y, speed });
  }
}

function resetGame() {
  state.running = false;
  state.paused = false;
  state.gameOver = false;
  state.score = 0;
  state.shield = 100;
  state.wave = 1;
  state.spawnTimer = 0;
  state.asteroidRate = 900;
  state.asteroidSpeed = 1.8;
  state.asteroidBurst = 0;
  state.asteroids.forEach((asteroid) => asteroid.el.remove());
  state.asteroids = [];
  overlay.classList.add("is-visible");
  gameOverOverlay.classList.remove("is-visible");
  pauseBtn.textContent = "Pause";
  measureArena();
  state.shipX = state.width * 0.5;
  state.shipY = state.height * 0.78;
  state.targetX = state.shipX;
  state.targetY = state.shipY;
  state.shipTilt = 0;
  ship.style.left = `${state.shipX}px`;
  ship.style.top = `${state.shipY}px`;
  ship.style.transform = "translate(-50%, -50%) rotate(0deg)";
  updateScoreboard();
}

function startGame() {
  if (state.gameOver) {
    resetGame();
  }
  state.running = true;
  state.paused = false;
  overlay.classList.remove("is-visible");
}

function pauseGame() {
  if (!state.running || state.gameOver) {
    return;
  }
  state.paused = !state.paused;
  pauseBtn.textContent = state.paused ? "Resume" : "Pause";
  overlay.classList.toggle("is-visible", state.paused);
  if (state.paused) {
    overlay.querySelector("h2").textContent = "Paused";
    overlay.querySelector(".overlay-card p:nth-of-type(2)").textContent = "Take a breath and drag the ship back into action when ready.";
    overlay.querySelector(".launch-btn").textContent = "Resume Mission";
  } else {
    overlay.querySelector("h2").textContent = "Guide the ship through the storm.";
    overlay.querySelector(".overlay-card p:nth-of-type(2)").textContent = "Press start, then drag anywhere inside the field to steer. Narrow escapes build momentum, but one direct hit ends the run.";
    overlay.querySelector(".launch-btn").textContent = "Start Mission";
  }
}

function spawnAsteroid() {
  const node = asteroidTemplate.content.firstElementChild.cloneNode(true);
  const size = 28 + Math.random() * 58;
  const laneX = Math.random() * (state.width - size);
  const drift = (Math.random() - 0.5) * 0.8;
  const wobble = 0.6 + Math.random() * 1.4;
  const top = -size - 18;
  const asteroid = {
    id: ++state.asteroidId,
    el: node,
    x: laneX,
    y: top,
    size,
    radius: size * 0.44,
    speed: state.asteroidSpeed + Math.random() * 2.4,
    drift,
    wobble,
    spin: (Math.random() - 0.5) * 6,
    rotation: Math.random() * 360,
    damage: size > 70 ? 34 : size > 50 ? 24 : 16,
  };

  node.style.setProperty("--size", `${size}px`);
  node.style.left = `${asteroid.x}px`;
  node.style.top = `${asteroid.y}px`;
  node.style.transform = `rotate(${asteroid.rotation}deg)`;
  arena.appendChild(node);
  state.asteroids.push(asteroid);
}

function setPointerTarget(clientX, clientY) {
  const bounds = arena.getBoundingClientRect();
  const x = clamp(clientX - bounds.left, 18, state.width - 18);
  const y = clamp(clientY - bounds.top, state.height * 0.35, state.height - 24);
  state.targetX = x;
  state.targetY = y;
}

function onPointerDown(event) {
  if (state.gameOver) {
    return;
  }
  arena.setPointerCapture?.(event.pointerId);
  state.pointerActive = true;
  state.pointerId = event.pointerId;
  setPointerTarget(event.clientX, event.clientY);
  if (!state.running) {
    startGame();
  }
}

function onPointerMove(event) {
  if (!state.pointerActive || state.pointerId !== event.pointerId) {
    return;
  }
  setPointerTarget(event.clientX, event.clientY);
}

function onPointerUp(event) {
  if (state.pointerId !== event.pointerId) {
    return;
  }
  state.pointerActive = false;
  state.pointerId = null;
}

function moveShip(dt) {
  const previousX = state.shipX;
  const follow = clamp(0.08 + dt * 0.0007, 0.08, 0.22);
  state.shipX += (state.targetX - state.shipX) * follow;
  state.shipY += (state.targetY - state.shipY) * follow;
  state.shipX = clamp(state.shipX, 18, state.width - 18);
  state.shipY = clamp(state.shipY, state.height * 0.35, state.height - 24);
  ship.style.left = `${state.shipX}px`;
  ship.style.top = `${state.shipY}px`;
  const drift = clamp(state.shipX - previousX, -14, 14);
  state.shipTilt = drift * 1.25;
  ship.style.transform = `translate(-50%, -50%) rotate(${state.shipTilt}deg)`;
}

function updateDifficulty() {
  state.wave = 1 + Math.floor(state.score / 15);
  state.asteroidSpeed = 1.8 + state.wave * 0.18;
  state.asteroidRate = Math.max(260, 900 - state.wave * 52);
  state.asteroidBurst = Math.min(3, Math.floor(state.wave / 4));
}

function updateStars(dt) {
  state.stars.forEach((star) => {
    star.y += star.speed * dt * 0.08;
    if (star.y > 100) {
      star.y = -2;
      star.x = Math.random() * 100;
    }
    star.el.style.left = `${star.x}%`;
    star.el.style.top = `${star.y}%`;
  });
}

function rectCollision(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = Math.hypot(dx, dy);
  return distance < a.radius + b.radius;
}

function hitEffect() {
  arena.animate(
    [
      { transform: "translateX(0px)" },
      { transform: "translateX(-3px)" },
      { transform: "translateX(3px)" },
      { transform: "translateX(-2px)" },
      { transform: "translateX(0px)" },
    ],
    { duration: 240, easing: "ease-out" }
  );
}

function endGame() {
  state.gameOver = true;
  state.running = false;
  state.paused = false;
  finalScoreEl.textContent = Math.floor(state.score).toString();
  gameOverOverlay.classList.add("is-visible");
  overlay.classList.remove("is-visible");
  pauseBtn.textContent = "Pause";
  if (state.score > state.bestScore) {
    state.bestScore = Math.floor(state.score);
    localStorage.setItem("asteroid-dodge-best", state.bestScore.toString());
  }
  updateScoreboard();
}

function tick(time) {
  if (!state.lastTime) {
    state.lastTime = time;
  }
  const dt = Math.min(32, time - state.lastTime);
  state.lastTime = time;

  if (state.running && !state.paused && !state.gameOver) {
    state.score += dt * 0.018;
    updateDifficulty();
    state.spawnTimer += dt;

    if (state.spawnTimer >= state.asteroidRate) {
      state.spawnTimer = 0;
      spawnAsteroid();
      if (state.asteroidBurst > 0 && Math.random() > 0.55) {
        setTimeout(spawnAsteroid, 140);
      }
    }

    moveShip(dt);
    updateStars(dt);

    state.asteroids = state.asteroids.filter((asteroid) => {
      asteroid.y += asteroid.speed * dt * 0.08;
      asteroid.x += asteroid.drift * dt * 0.08;
      asteroid.rotation += asteroid.spin * dt * 0.08;

      if (asteroid.x < -asteroid.size) {
        asteroid.x = state.width + asteroid.size * 0.4;
      } else if (asteroid.x > state.width + asteroid.size) {
        asteroid.x = -asteroid.size * 0.4;
      }

      asteroid.el.style.left = `${asteroid.x}px`;
      asteroid.el.style.top = `${asteroid.y}px`;
      asteroid.el.style.transform = `rotate(${asteroid.rotation}deg)`;

      const shipBox = { x: state.shipX, y: state.shipY, radius: state.shipRadius };
      const asteroidBox = { x: asteroid.x + asteroid.size / 2, y: asteroid.y + asteroid.size / 2, radius: asteroid.radius };

      if (rectCollision(shipBox, asteroidBox)) {
        state.shield -= asteroid.damage;
        hitEffect();
        asteroid.el.remove();
        if (state.shield <= 0) {
          endGame();
        }
        return false;
      }

      if (asteroid.y > state.height + asteroid.size + 80) {
        asteroid.el.remove();
        return false;
      }

      return true;
    });

    state.bestScore = Math.max(state.bestScore, Math.floor(state.score));
    localStorage.setItem("asteroid-dodge-best", state.bestScore.toString());
    updateScoreboard();
  }

  requestAnimationFrame(tick);
}

function handleKeyMove(event) {
  const delta = 26;
  if (state.gameOver) {
    return;
  }

  if (!state.running) {
    startGame();
  }

  switch (event.key.toLowerCase()) {
    case "arrowleft":
    case "a":
      state.targetX -= delta;
      break;
    case "arrowright":
    case "d":
      state.targetX += delta;
      break;
    case "arrowup":
    case "w":
      state.targetY -= delta;
      break;
    case "arrowdown":
    case "s":
      state.targetY += delta;
      break;
    case " ":
      pauseGame();
      event.preventDefault();
      return;
    default:
      return;
  }

  event.preventDefault();
  state.targetX = clamp(state.targetX, 18, state.width - 18);
  state.targetY = clamp(state.targetY, state.height * 0.35, state.height - 24);
  state.pointerActive = false;
}

arena.addEventListener("pointerdown", onPointerDown);
arena.addEventListener("pointermove", onPointerMove);
arena.addEventListener("pointerup", onPointerUp);
arena.addEventListener("pointercancel", onPointerUp);
arena.addEventListener("lostpointercapture", onPointerUp);
startBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", () => {
  resetGame();
  startGame();
});
restartBtn.addEventListener("click", () => {
  resetGame();
  startGame();
});
pauseBtn.addEventListener("click", pauseGame);
window.addEventListener("keydown", handleKeyMove);
window.addEventListener("resize", () => {
  measureArena();
  createStars();
  state.shipX = clamp(state.shipX, 18, state.width - 18);
  state.shipY = clamp(state.shipY, state.height * 0.35, state.height - 24);
  state.targetX = state.shipX;
  state.targetY = state.shipY;
});

createStars();
measureArena();
resetGame();
updateScoreboard();
requestAnimationFrame(tick);
