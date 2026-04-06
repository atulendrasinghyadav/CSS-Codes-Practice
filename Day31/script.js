let level = 1;
let score = 0;
let timeLeft = 10.0;
let timerInterval;
let gameActive = false;

const levelEl = document.getElementById('level');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const progressBar = document.getElementById('progress-bar');
const gridContainer = document.getElementById('grid-container');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalLevelEl = document.getElementById('final-level');
const finalScoreEl = document.getElementById('final-score');

// Maximum grid size
const MAX_GRID_SIZE = 10;
const INITIAL_TIME = 10.0;

function getRandomColor() {
    // Generate RGB avoiding extreme dark/light
    const r = Math.floor(Math.random() * 150) + 50; 
    const g = Math.floor(Math.random() * 150) + 50;
    const b = Math.floor(Math.random() * 150) + 50;
    return { r, g, b };
}

function getGridSize() {
    // Size starts at 2x2, goes up every few levels
    let size = 2 + Math.floor((level - 1) / 3);
    return Math.min(size, MAX_GRID_SIZE);
}

function getDifficultyDiff() {
    // Higher level = smaller rgb difference
    // Start with a large diff (e.g. 60), approach diff of 5
    let diff = 60 - (level * 2);
    return Math.max(diff, 5); 
}

function generateLevel() {
    gridContainer.innerHTML = '';
    
    const size = getGridSize();
    gridContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    
    // Gap size adapts to grid
    const gap = size > 6 ? 2 : size > 4 ? 4 : 8;
    gridContainer.style.gap = `${gap}px`;

    const baseColor = getRandomColor();
    const diff = getDifficultyDiff();
    
    // Randomize if we add or subtract the difference for each channel randomly
    // For more deceptive colors, we can shift only one or two channels
    const mixSign = () => Math.random() > 0.5 ? 1 : -1;
    
    // To make it slightly different, just apply diff to all channels
    let rSign = mixSign();
    let gSign = mixSign();
    let bSign = Math.random() > 0.5 ? 0 : mixSign(); // Sometimes leave a channel alone

    let oddR = baseColor.r + (diff * rSign);
    let oddG = baseColor.g + (diff * gSign);
    let oddB = baseColor.b + (diff * bSign);
    
    oddR = Math.max(0, Math.min(255, oddR));
    oddG = Math.max(0, Math.min(255, oddG));
    oddB = Math.max(0, Math.min(255, oddB));

    const totalBlocks = size * size;
    const oddIndex = Math.floor(Math.random() * totalBlocks);

    const baseColorStr = `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`;
    const oddColorStr = `rgb(${oddR}, ${oddG}, ${oddB})`;

    for (let i = 0; i < totalBlocks; i++) {
        const block = document.createElement('div');
        block.classList.add('color-block');
        
        let isOdd = i === oddIndex;
        block.style.backgroundColor = isOdd ? oddColorStr : baseColorStr;
        
        const tapHandler = (e) => {
            if (e.type === 'touchstart') e.preventDefault();
            if (!gameActive) return;

            if (isOdd) {
                // Correct
                levelUp();
            } else {
                // Wrong block tapped!
                block.classList.add('wrong');
                gameOver("Wrong Color!");
            }
        };

        block.addEventListener('mousedown', tapHandler);
        block.addEventListener('touchstart', tapHandler, {passive: false});

        gridContainer.appendChild(block);
    }
}

function levelUp() {
    score += level * 10; 
    level++;
    
    levelEl.textContent = level;
    scoreEl.textContent = score;
    
    // Reset timer to 10s
    timeLeft = INITIAL_TIME;
    updateTimerUI();
    
    generateLevel();
}

function updateTimerUI() {
    timeEl.textContent = timeLeft.toFixed(1);
    
    let percentage = (timeLeft / INITIAL_TIME) * 100;
    progressBar.style.width = `${percentage}%`;
    
    if (timeLeft <= 3) {
        timeEl.classList.add('danger');
        progressBar.classList.add('danger');
    } else {
        timeEl.classList.remove('danger');
        progressBar.classList.remove('danger');
    }
}

function timerLoop() {
    if (!gameActive) return;
    
    timeLeft -= 0.1;
    if (timeLeft <= 0) {
        timeLeft = 0;
        updateTimerUI();
        gameOver("Time's Up!");
        return;
    }
    updateTimerUI();
}

function startGame() {
    gameActive = true;
    level = 1;
    score = 0;
    timeLeft = INITIAL_TIME;
    
    levelEl.textContent = level;
    scoreEl.textContent = score;
    updateTimerUI();
    
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    clearInterval(timerInterval);
    timerInterval = setInterval(timerLoop, 100);
    
    generateLevel();
}

function gameOver(reason) {
    gameActive = false;
    clearInterval(timerInterval);
    
    const titleEl = document.getElementById('game-over-title');
    titleEl.textContent = reason;
    
    finalLevelEl.textContent = level;
    finalScoreEl.textContent = score;
    
    setTimeout(() => {
        gameOverScreen.classList.remove('hidden');
    }, 500);
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Prevent default touch actions on game area to avoid scrolling
gridContainer.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });
