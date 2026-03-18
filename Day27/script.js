const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width, height;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// UI Elements
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const fuelFillEl = document.getElementById('fuel-bar-fill');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score');
const finalCoinsEl = document.getElementById('final-coins');

const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const btnGas = document.getElementById('btn-gas');
const btnBrake = document.getElementById('btn-brake');

// Game State
let gameState = 'START'; // START, PLAYING, GAMEOVER
let distance = 0;
let coins = 0;
let fuel = 100;
let cameraX = 0;
let speed = 0;

// Inputs
let keys = {
    ArrowRight: false,
    ArrowLeft: false,
    d: false,
    a: false
};

// Touch / Button controls
let gasPressed = false;
let brakePressed = false;

function setupControls(btn, setGas, setBrake) {
    btn.addEventListener('mousedown', () => { if(setGas) gasPressed=true; if(setBrake) brakePressed=true; });
    btn.addEventListener('mouseup', () => { if(setGas) gasPressed=false; if(setBrake) brakePressed=false; });
    btn.addEventListener('mouseleave', () => { if(setGas) gasPressed=false; if(setBrake) brakePressed=false; });
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); if(setGas) gasPressed=true; if(setBrake) brakePressed=true; });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); if(setGas) gasPressed=false; if(setBrake) brakePressed=false; });
}

setupControls(btnGas, true, false);
setupControls(btnBrake, false, true);

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// Terrain Generation
const terrainCache = new Map();
let items = []; // Coins and Gas cans

function noise(x) {
    return Math.sin(x * 0.01) * 50 + Math.sin(x * 0.005) * 100 + Math.sin(x * 0.002) * 150;
}

function getElevation(x) {
    // Quantize x to avoid recalculating too finely? Not really, just return noise.
    let base = height * 0.7; // Base height of terrain
    let y = base - noise(x);
    // Add flat areas or steep hills based on bigger noise
    let multiplier = (Math.sin(x * 0.0005) + 1) / 2; // 0 to 1
    y -= noise(x * 2) * 0.5 * multiplier;
    return y;
}

function generateItems(startX, endX) {
    // Generate items ahead of the camera
    let chunk = Math.floor(startX / 1000);
    
    // Quick random based on chunk
    if (!terrainCache.has(chunk)) {
        terrainCache.set(chunk, true);
        
        let numCoins = Math.floor(Math.random() * 5);
        for(let i=0; i<numCoins; i++) {
            let cx = chunk * 1000 + Math.random() * 800 + 100;
            items.push({
                type: 'coin',
                x: cx,
                y: getElevation(cx) - 30, // Hover above ground
                collected: false
            });
        }
        
        // Sometimes spawn fuel
        if (Math.random() > 0.5) {
            let fx = chunk * 1000 + Math.random() * 800 + 100;
            items.push({
                type: 'fuel',
                x: fx,
                y: getElevation(fx) - 25,
                collected: false
            });
        }
    }
}

// Bike Physics
let bike = {
    x: 300,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    rotV: 0,
    wheelRadius: 20,
    wheelBase: 60,
    motorPower: 0.6,
    brakePower: 0.4,
    gravity: 0.35,
    friction: 0.98,
    airFriction: 0.99
};

function resetGame() {
    distance = 0;
    coins = 0;
    fuel = 100;
    cameraX = 0;
    speed = 0;
    terrainCache.clear();
    items = [];
    
    bike.x = 300;
    bike.y = getElevation(bike.x) - 100;
    bike.vx = 0;
    bike.vy = 0;
    bike.angle = 0;
    bike.rotV = 0;
    
    scoreEl.innerText = '0m';
    coinsEl.innerText = '0';
    fuelFillEl.style.width = '100%';
    fuelFillEl.style.background = 'linear-gradient(90deg, #f56565, #48bb78)';
    
    gameState = 'PLAYING';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    requestAnimationFrame(gameLoop);
}

function updatePhysics() {
    let drive = (keys.ArrowRight || keys.d || gasPressed) ? 1 : 0;
    let brake = (keys.ArrowLeft || keys.a || brakePressed) ? 1 : 0;
    
    if (drive && fuel > 0) {
        bike.vx += Math.cos(bike.angle) * bike.motorPower;
        bike.vy += Math.sin(bike.angle) * bike.motorPower;
        bike.rotV -= 0.005; // Tilt back
        fuel -= 0.05; // Consume fuel when driving
    }
    if (brake) {
        bike.vx -= Math.cos(bike.angle) * bike.brakePower;
        bike.vy -= Math.sin(bike.angle) * bike.brakePower;
        bike.rotV += 0.007; // Tilt forward
    }
    
    // Constant fuel consumption
    fuel -= 0.02;
    if (fuel < 0) fuel = 0;
    
    // Apply gravity
    bike.vy += bike.gravity;
    
    // Move bike
    bike.x += bike.vx;
    bike.y += bike.vy;
    
    // Rotate bike
    bike.angle += bike.rotV;
    bike.rotV *= 0.95; // Rotation friction
    
    // Calculate wheel positions
    let wx1 = bike.x - Math.cos(bike.angle) * (bike.wheelBase/2);
    let wy1 = bike.y - Math.sin(bike.angle) * (bike.wheelBase/2);
    
    let wx2 = bike.x + Math.cos(bike.angle) * (bike.wheelBase/2);
    let wy2 = bike.y + Math.sin(bike.angle) * (bike.wheelBase/2);
    
    // Terrain collision
    let ground1 = getElevation(wx1);
    let ground2 = getElevation(wx2);
    
    let onGround = false;
    
    // Rear wheel coll
    if (wy1 + bike.wheelRadius > ground1) {
        wy1 = ground1 - bike.wheelRadius;
        bike.vy -= 0.5; // Bounce / support
        let targetAngle = Math.atan2(wy2 - wy1, wx2 - wx1);
        bike.angle += (targetAngle - bike.angle) * 0.1;
        onGround = true;
    }
    
    // Front wheel coll
    if (wy2 + bike.wheelRadius > ground2) {
        wy2 = ground2 - bike.wheelRadius;
        bike.vy -= 0.5;
        let targetAngle = Math.atan2(wy2 - wy1, wx2 - wx1);
        bike.angle += (targetAngle - bike.angle) * 0.1;
        onGround = true;
    }
    
    // Resolve bike position based on wheels
    if (onGround) {
        bike.y = (wy1 + wy2) / 2;
        // Friction on ground
        bike.vx *= bike.friction;
    } else {
        // Air friction
        bike.vx *= bike.airFriction;
    }
    
    // Crash detection (head hit ground)
    let localHeadX = -4;
    let localHeadY = -71;
    let headX = bike.x + Math.cos(bike.angle)*localHeadX - Math.sin(bike.angle)*localHeadY;
    let headY = bike.y + Math.sin(bike.angle)*localHeadX + Math.cos(bike.angle)*localHeadY;
    
    // Normalize angle to -PI to PI to check if we are actually upside down
    let normalizedAngle = ((bike.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2;
    
    // Only crash if the head is physically underground AND the bike is significantly tilted
    if (headY + 12 > getElevation(headX) && Math.abs(normalizedAngle) > Math.PI * 0.5) {
        endGame();
    }
    
    if (fuel <= 0 && Math.abs(bike.vx) < 0.5) {
        endGame();
    }
    
    // Update camera
    cameraX = bike.x - 300;
}

function updateItems() {
    generateItems(cameraX, cameraX + width * 2);
    
    for (let i = items.length - 1; i >= 0; i--) {
        let it = items[i];
        if (it.collected) continue;
        
        let dx = bike.x - it.x;
        let dy = bike.y - it.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 50) {
            it.collected = true;
            if (it.type === 'coin') {
                coins += 10;
            } else if (it.type === 'fuel') {
                fuel = Math.min(100, fuel + 40);
            }
        }
        
        // Remove old items
        if (it.x < cameraX - 500 || it.collected) {
            items.splice(i, 1);
        }
    }
}

function drawTerrain() {
    ctx.fillStyle = '#2d3748';
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    let startX = Math.floor(cameraX);
    let endX = startX + width;
    
    ctx.lineTo(0, getElevation(startX));
    
    // Draw ground
    for (let x = startX; x < endX; x += 10) {
        let screenX = x - cameraX;
        ctx.lineTo(screenX, getElevation(x));
    }
    
    ctx.lineTo(width, height);
    ctx.fill();
    
    // Draw grass line
    ctx.strokeStyle = '#48bb78';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let x = startX; x < endX; x += 10) {
        let screenX = x - cameraX;
        let y = getElevation(x);
        if (x === startX) ctx.moveTo(screenX, y);
        else ctx.lineTo(screenX, y);
    }
    ctx.stroke();
}

function drawBike() {
    ctx.save();
    ctx.translate(bike.x - cameraX, bike.y);
    ctx.rotate(bike.angle);
    
    // Wheels - Modern rims
    ctx.fillStyle = '#111827'; // Dark tires
    ctx.strokeStyle = '#9ca3af'; // Rims
    ctx.lineWidth = 5;
    
    // Back wheel tire
    ctx.beginPath();
    ctx.arc(-bike.wheelBase/2, 0, bike.wheelRadius, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Front wheel tire
    ctx.beginPath();
    ctx.arc(bike.wheelBase/2, 0, bike.wheelRadius, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
    
    // Wheel spokes (Mags)
    let wheelAngle = bike.x * 0.05; 
    ctx.save();
    ctx.translate(-bike.wheelBase/2, 0);
    ctx.rotate(wheelAngle);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#4b5563';
    for(let i=0; i<5; i++) {
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, bike.wheelRadius - 2); ctx.stroke();
        ctx.rotate((Math.PI*2)/5);
    }
    ctx.restore();
    
    ctx.save();
    ctx.translate(bike.wheelBase/2, 0);
    ctx.rotate(wheelAngle);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#4b5563';
    for(let i=0; i<5; i++) {
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, bike.wheelRadius - 2); ctx.stroke();
        ctx.rotate((Math.PI*2)/5);
    }
    ctx.restore();
    
    // Suspension / Frame
    ctx.strokeStyle = '#e2e8f0'; // Silver frame
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(bike.wheelBase/2, 0);
    ctx.lineTo(20, -40); // Handlebars base
    ctx.lineTo(-20, -35); // Seat base
    ctx.lineTo(-bike.wheelBase/2, 0);
    ctx.stroke();
    
    // Engine block
    ctx.fillStyle = '#4a5568';
    ctx.beginPath();
    ctx.moveTo(20, -40);
    ctx.lineTo(10, -10);
    ctx.lineTo(-10, -10);
    ctx.lineTo(-20, -35);
    ctx.fill();
    
    // Gas tank
    ctx.fillStyle = '#ef4444'; // Bright red tank
    ctx.beginPath();
    ctx.ellipse(0, -38, 18, 10, 0, 0, Math.PI*2);
    ctx.fill();
    
    // Rider
    ctx.save();
    ctx.translate(-15, -35); // Sit on seat
    ctx.rotate(0.3); // Lean forward
    
    // Torso
    ctx.beginPath();
    ctx.lineJoin = "round";
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#2563eb';
    ctx.moveTo(0, -25);
    ctx.lineTo(0, -5);
    ctx.stroke();
    
    // Head (helmet)
    ctx.fillStyle = '#1e293b'; // Black helmet
    ctx.beginPath();
    ctx.arc(0, -38, 12, 0, Math.PI*2);
    ctx.fill();
    
    // Visor
    ctx.fillStyle = '#93c5fd';
    ctx.beginPath();
    ctx.arc(4, -38, 8, -Math.PI/4, Math.PI/4);
    ctx.fill();
    ctx.restore();
    
    // Arm
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -55); // Shoulder
    ctx.lineTo(5, -45); // Elbow
    ctx.lineTo(20, -45); // Hands on handle
    ctx.stroke();
    
    // Leg
    ctx.strokeStyle = '#1e3a8a'; // Dark pants
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-15, -35); // Hip
    ctx.lineTo(-5, -20); // Knee
    ctx.lineTo(-10, -5); // Foot peg
    ctx.stroke();
    
    ctx.restore();
}

function drawItems() {
    items.forEach(it => {
        let screenX = it.x - cameraX;
        let screenY = it.y;
        
        // Simple culling
        if(screenX < -50 || screenX > width + 50) return;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        
        if (it.type === 'coin') {
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI*2);
            ctx.fill();
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Coin inner detail
            ctx.fillStyle = '#fef3c7';
            ctx.font = '14px Outfit';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 1);
            
            // Floating anim
            it.y += Math.sin(Date.now() * 0.005) * 0.5;
            
        } else if (it.type === 'fuel') {
            ctx.fillStyle = '#fc8181';
            ctx.fillRect(-10, -15, 20, 30);
            ctx.fillStyle = '#fff';
            ctx.fillRect(-6, -20, 12, 5);
            ctx.fillStyle = '#9b2c2c';
            ctx.font = '10px Outfit';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GAS', 0, 0);
            
            it.y += Math.sin(Date.now() * 0.005 + 1) * 0.5;
        }
        
        ctx.restore();
    });
}

function drawBackground() {
    // Parallax background
    let bgOff = (cameraX * 0.2) % width;
    
    // Just draw some distant mountains
    ctx.fillStyle = '#4a5568';
    ctx.beginPath();
    ctx.moveTo(0, height);
    for(let i=0; i<=width; i+=20) {
        let mY = height * 0.5 + Math.sin((i + bgOff*2) * 0.005) * 100;
        ctx.lineTo(i, mY);
    }
    ctx.lineTo(width, height);
    ctx.fill();
}

function updateUI() {
    let currDist = Math.max(0, Math.floor(bike.x / 10));
    if (currDist > distance) distance = currDist;
    
    scoreEl.innerText = distance + 'm';
    coinsEl.innerText = coins;
    
    let fuelPct = Math.max(0, fuel) + '%';
    fuelFillEl.style.width = fuelPct;
    
    if (fuel < 20) {
        fuelFillEl.style.background = '#f56565';
    } else {
        fuelFillEl.style.background = 'linear-gradient(90deg, #f56565, #48bb78)';
    }
}

function endGame() {
    gameState = 'GAMEOVER';
    finalScoreEl.innerText = distance;
    finalCoinsEl.innerText = coins;
    gameOverScreen.classList.remove('hidden');
}

function gameLoop() {
    if (gameState !== 'PLAYING') return;
    
    ctx.clearRect(0, 0, width, height);
    
    drawBackground();
    
    updatePhysics();
    updateItems();
    
    drawItems();
    drawTerrain();
    drawBike();
    
    updateUI();
    
    requestAnimationFrame(gameLoop);
}

btnStart.addEventListener('click', resetGame);
btnRestart.addEventListener('click', resetGame);

// Render initial background before start
drawBackground();
drawTerrain();
