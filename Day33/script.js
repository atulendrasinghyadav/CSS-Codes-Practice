const canvas = document.getElementById("scratchCanvas");
const shell = document.querySelector(".card-shell");
const secretHeadline = document.getElementById("secretHeadline");
const secretBody = document.getElementById("secretBody");
const context = canvas.getContext("2d", { willReadFrequently: true });

const secretMessages = [
  {
    headline: "You are my favorite hello and my softest forever.",
    body:
      "Every scratch clears away a little more of my shyness, and every little bit says the same thing: you make my world gentler, warmer, and a lot more beautiful.",
  },
  {
    headline: "My heart picked you and never looked back.",
    body:
      "If this tiny surprise made you smile, then my mission is complete. You are the sweetest part of my day and the calm in my favorite chaos.",
  },
  {
    headline: "You make ordinary moments feel like magic.",
    body:
      "I hope this little secret feels like a hug in disguise, because that is exactly what you are to me: comfort, sparkle, and a soft place to land.",
  },
  {
    headline: "You are the cutest reason my heart does backflips.",
    body:
      "One smile from you is enough to brighten everything. If love had a favorite person, I am pretty sure it would be you.",
  },
];

function setRandomSecretMessage() {
  const message = secretMessages[Math.floor(Math.random() * secretMessages.length)];
  secretHeadline.textContent = message.headline;
  secretBody.textContent = message.body;
}

let drawing = false;
let revealChecked = false;
let rafPending = false;
let lastPoint = null;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;

  canvas.width = Math.floor(rect.width * ratio);
  canvas.height = Math.floor(rect.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  if (revealChecked) {
    return;
  }

  paintCover();
}

function paintCover() {
  context.globalCompositeOperation = "source-over";
  context.clearRect(0, 0, canvas.width, canvas.height);

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const base = context.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, "#ffd5e1");
  base.addColorStop(0.55, "#f5aabc");
  base.addColorStop(1, "#ff8fad");

  context.fillStyle = base;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "rgba(255,255,255,0.16)";
  for (let i = 0; i < 14; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 30 + Math.random() * 80;
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.fill();
  }

  drawCenterCopy();
}

function drawCenterCopy() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  context.fillStyle = "rgba(255, 255, 255, 0.92)";
  context.strokeStyle = "rgba(255, 111, 145, 0.3)";
  context.lineWidth = 2;

  context.beginPath();
  roundRect(context, width * 0.19, height * 0.29, width * 0.62, height * 0.29, 24);
  context.fill();
  context.stroke();

  context.fillStyle = "#c85f7d";
  context.font = "700 20px Inter, sans-serif";
  context.textAlign = "center";
  context.fillText("Scratch me, cutie", width / 2, height * 0.42);

  context.font = "500 14px Inter, sans-serif";
  context.fillStyle = "rgba(124, 73, 96, 0.92)";
  context.fillText("There is a secret message underneath", width / 2, height * 0.49);

  context.font = "700 22px serif";
  context.fillStyle = "#ff6f91";
  context.fillText("♥ ♥ ♥", width / 2, height * 0.58);
}

function roundRect(ctx, x, y, width, height, radius) {
  const corner = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + corner, y);
  ctx.arcTo(x + width, y, x + width, y + height, corner);
  ctx.arcTo(x + width, y + height, x, y + height, corner);
  ctx.arcTo(x, y + height, x, y, corner);
  ctx.arcTo(x, y, x + width, y, corner);
  ctx.closePath();
}

function getPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const clientX = event.clientX ?? (event.touches && event.touches[0].clientX) ?? 0;
  const clientY = event.clientY ?? (event.touches && event.touches[0].clientY) ?? 0;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

function scratchAt(point) {
  context.globalCompositeOperation = "destination-out";
  context.beginPath();
  context.arc(point.x, point.y, 26, 0, Math.PI * 2);
  context.fill();

  if (lastPoint) {
    context.lineWidth = 52;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  lastPoint = point;
  requestRevealCheck();
}

function requestRevealCheck() {
  if (rafPending || revealChecked) {
    return;
  }

  rafPending = true;
  window.requestAnimationFrame(() => {
    rafPending = false;
    checkRevealProgress();
  });
}

function checkRevealProgress() {
  if (revealChecked) {
    return;
  }

  const width = canvas.width;
  const height = canvas.height;
  const imageData = context.getImageData(0, 0, width, height).data;
  let cleared = 0;

  for (let index = 3; index < imageData.length; index += 4) {
    if (imageData[index] === 0) {
      cleared += 1;
    }
  }

  const clearedRatio = cleared / (width * height);
  if (clearedRatio > 0.48) {
    revealChecked = true;
    shell.classList.add("revealed");
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    canvas.style.pointerEvents = "none";
  }
}

function startScratch(event) {
  drawing = true;
  lastPoint = null;
  canvas.setPointerCapture?.(event.pointerId);
  scratchAt(getPoint(event));
}

function moveScratch(event) {
  if (!drawing) {
    return;
  }

  scratchAt(getPoint(event));
}

function stopScratch() {
  drawing = false;
  lastPoint = null;
}

window.addEventListener("resize", resizeCanvas);
canvas.addEventListener("pointerdown", startScratch);
canvas.addEventListener("pointermove", moveScratch);
canvas.addEventListener("pointerup", stopScratch);
canvas.addEventListener("pointercancel", stopScratch);
canvas.addEventListener("pointerleave", stopScratch);

setRandomSecretMessage();
resizeCanvas();
