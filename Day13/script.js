const GAME = document.getElementById('game');
const LEVEL = document.getElementById('level');
const RESTART = document.getElementById('restart');
const MSG = document.getElementById('message');

const GAME_W = 360;
const GAME_H = 640;
const LAYER_H = 30;
const START_W = 220;
const SPEED = 3.2;
const WIN_LAYERS = 20;
const DEPTH = 8; // pixels per layer for translateZ depth

let layers = []; // each: {left,width,el}
let moving = null; // {left,width,dir}
let animId = null;
let running = false;

function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

function colorForLevel(i){
  // map 0..WIN_LAYERS to hue from 0 (red) to 220 (blue)
  const ratio = clamp(i / WIN_LAYERS, 0, 1);
  const hue = Math.round(0 + (220 - 0) * ratio);
  return `hsl(${hue}deg 80% 55%)`;
}

function createLayer(left, width, index){
  const el = document.createElement('div');
  el.className = 'block';
  el.style.left = left + 'px';
  el.style.width = width + 'px';
  el.style.bottom = (index * LAYER_H) + 'px';
  el.style.height = LAYER_H + 'px';
  el.style.background = colorForLevel(index);
  // push the element slightly in Z depending on its stack index
  el.style.transform = `translateZ(${index * DEPTH}px)`;
  GAME.appendChild(el);
  return {left,width,el};
}

function setup(){
  GAME.style.width = GAME_W + 'px';
  GAME.style.height = GAME_H + 'px';
  GAME.innerHTML = '';
  layers = [];
  running = true;
  MSG.classList.add('hidden');
  // base layer centered
  const baseLeft = Math.round((GAME_W - START_W)/2);
  layers.push(createLayer(baseLeft, START_W, 0));
  // initial moving block
  spawnMoving();
  updateHUD();
  loop();
}

function spawnMoving(){
  const prev = layers[layers.length-1];
  const width = prev.width;
  // start from left outside left
  moving = {left: -width, width, dir: 1};
  if (!moving.el){
    const el = document.createElement('div');
    el.className = 'block';
    el.style.height = LAYER_H + 'px';
    el.style.bottom = (layers.length * LAYER_H) + 'px';
    GAME.appendChild(el);
    moving.el = el;
  }
  moving.el.style.width = moving.width + 'px';
  moving.el.style.background = colorForLevel(layers.length);
  // set moving block depth to the correct Z plane
  moving.el.style.transform = `translateZ(${layers.length * DEPTH}px)`;
}

function loop(){
  animId = requestAnimationFrame(loop);
  if (!running) return;
  // move
  const m = moving;
  if (!m) return;
  m.left += SPEED * m.dir;
  // reverse on bounds
  if (m.left + m.width > GAME_W){ m.left = GAME_W - m.width; m.dir = -1; }
  if (m.left < 0){ m.left = 0; m.dir = 1; }
  m.el.style.left = m.left + 'px';
}

function place(){
  if (!running || !moving) return;
  const prev = layers[layers.length-1];
  const m = moving;
  const overlapLeft = Math.max(prev.left, m.left);
  const overlapRight = Math.min(prev.left + prev.width, m.left + m.width);
  const overlap = Math.round(overlapRight - overlapLeft);
  if (overlap <= 0){
    // lose
    end(false);
    return;
  }
  // cut moving block to overlap
  const newLeft = overlapLeft;
  const newWidth = overlap;
  // finalize top block
  m.el.style.left = newLeft + 'px';
  m.el.style.width = newWidth + 'px';
  // ensure correct Z position for the finalized block
  m.el.style.transform = `translateZ(${(layers.length) * DEPTH}px)`;
  // push into layers
  layers.push({left:newLeft, width:newWidth, el:m.el});
  // prepare next moving block
  moving = null;
  // check win
  updateHUD();
  if (layers.length > WIN_LAYERS){
    end(true);
    return;
  }
  // spawn next after a tiny delay
  setTimeout(()=>{
    spawnMoving();
  },120);
}

function updateHUD(){
  LEVEL.textContent = 'Level: ' + (layers.length - 1);
}

function end(win){
  running = false;
  if (animId) cancelAnimationFrame(animId);
  MSG.classList.remove('hidden');
  MSG.textContent = win ? 'You win! 🎉' : 'Game Over — Press space to restart';
}

// controls
GAME.addEventListener('click', ()=>{ if (running) place(); else setup(); });
window.addEventListener('keydown', (e)=>{ if (e.code === 'Space'){ e.preventDefault(); if (running) place(); else setup(); } });
RESTART.addEventListener('click', setup);

// start
setup();
