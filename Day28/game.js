(function () {
  "use strict";

  /* ── constants ─────────────────────────────────── */
  var COLS = 10;
  var ROWS = 20;
  var BLOCK = 28;
  var EMPTY = 0;

  var COLORS = [
    null,
    "#00f0f0", // I – cyan
    "#f0f000", // O – yellow
    "#a000f0", // T – purple
    "#00f000", // S – green
    "#f00000", // Z – red
    "#0000f0", // J – blue
    "#f0a000"  // L – orange
  ];

  var SHAPES = [
    null,
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],   // I
    [[2,2],[2,2]],                                   // O
    [[0,3,0],[3,3,3],[0,0,0]],                       // T
    [[0,4,4],[4,4,0],[0,0,0]],                       // S
    [[5,5,0],[0,5,5],[0,0,0]],                       // Z
    [[6,0,0],[6,6,6],[0,0,0]],                       // J
    [[0,0,7],[7,7,7],[0,0,0]]                        // L
  ];

  var POINTS = [0, 100, 300, 500, 800];
  var SPEED_CURVE = [
    800, 720, 630, 550, 470, 380, 300, 220, 140, 100,
    80,  80,  80,  70,  70,  70,  50,  50,  50,  30
  ];

  /* ── dom refs ──────────────────────────────────── */
  var canvas  = document.getElementById("gameBoard");
  var ctx     = canvas.getContext("2d");
  var nextCvs = document.getElementById("nextCanvas");
  var nextCtx = nextCvs.getContext("2d");
  var holdCvs = document.getElementById("holdCanvas");
  var holdCtx = holdCvs.getContext("2d");

  var scoreEl   = document.getElementById("score");
  var linesEl   = document.getElementById("lines");
  var levelEl   = document.getElementById("level");
  var overlay   = document.getElementById("overlay");
  var overlayT  = document.getElementById("overlayTitle");
  var overlayM  = document.getElementById("overlayMsg");
  var startBtn  = document.getElementById("startBtn");

  canvas.width  = COLS * BLOCK;
  canvas.height = ROWS * BLOCK;

  /* ── state ─────────────────────────────────────── */
  var board, current, nextPiece, holdPiece, holdUsed;
  var score, totalLines, level;
  var dropTimer, dropInterval, lastDrop;
  var running, paused, gameOver;
  var bag = [];
  var lockDelay = 0;
  var LOCK_LIMIT = 500;      // ms before piece locks after landing
  var animRows = [];          // rows being cleared (flash animation)
  var animFrame = 0;
  var animating = false;

  /* ── helpers ───────────────────────────────────── */
  function createBoard() {
    var b = [];
    for (var r = 0; r < ROWS; r++) {
      b[r] = [];
      for (var c = 0; c < COLS; c++) b[r][c] = EMPTY;
    }
    return b;
  }

  function randomBag() {
    var ids = [1,2,3,4,5,6,7];
    for (var i = ids.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = ids[i]; ids[i] = ids[j]; ids[j] = t;
    }
    return ids;
  }

  function nextInBag() {
    if (bag.length === 0) bag = randomBag();
    return bag.pop();
  }

  function cloneShape(s) {
    var n = [];
    for (var r = 0; r < s.length; r++) n[r] = s[r].slice();
    return n;
  }

  function makePiece(id) {
    return {
      id: id,
      shape: cloneShape(SHAPES[id]),
      row: 0,
      col: Math.floor((COLS - SHAPES[id][0].length) / 2)
    };
  }

  /* ── collision & rotation ──────────────────────── */
  function valid(shape, row, col) {
    for (var r = 0; r < shape.length; r++) {
      for (var c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        var nr = row + r;
        var nc = col + c;
        if (nc < 0 || nc >= COLS || nr >= ROWS) return false;
        if (nr < 0) continue;
        if (board[nr][nc]) return false;
      }
    }
    return true;
  }

  function rotateCW(shape) {
    var size = shape.length;
    var n = [];
    for (var r = 0; r < size; r++) {
      n[r] = [];
      for (var c = 0; c < size; c++) {
        n[r][c] = shape[size - 1 - c][r];
      }
    }
    return n;
  }

  var KICKS_NORMAL = [[0,0],[-1,0],[1,0],[0,-1],[-1,-1],[1,-1]];
  var KICKS_I      = [[0,0],[-2,0],[1,0],[-2,1],[1,-2]];

  function tryRotate() {
    var rotated = rotateCW(current.shape);
    var kicks = current.id === 1 ? KICKS_I : KICKS_NORMAL;
    for (var i = 0; i < kicks.length; i++) {
      var nc = current.col + kicks[i][0];
      var nr = current.row + kicks[i][1];
      if (valid(rotated, nr, nc)) {
        current.shape = rotated;
        current.col = nc;
        current.row = nr;
        return true;
      }
    }
    return false;
  }

  /* ── lock & clear ──────────────────────────────── */
  function lockPiece() {
    var s = current.shape;
    for (var r = 0; r < s.length; r++) {
      for (var c = 0; c < s[r].length; c++) {
        if (!s[r][c]) continue;
        var br = current.row + r;
        if (br < 0) { endGame(); return; }
        board[br][current.col + c] = s[r][c];
      }
    }
    checkClear();
  }

  function checkClear() {
    animRows = [];
    for (var r = 0; r < ROWS; r++) {
      var full = true;
      for (var c = 0; c < COLS; c++) {
        if (!board[r][c]) { full = false; break; }
      }
      if (full) animRows.push(r);
    }
    if (animRows.length) {
      animating = true;
      animFrame = 0;
      flashClear();
    } else {
      spawnNext();
    }
  }

  function flashClear() {
    animFrame++;
    if (animFrame > 6) {
      clearRows();
      animating = false;
      return;
    }
    draw();
    setTimeout(flashClear, 60);
  }

  function clearRows() {
    var cleared = animRows.length;
    for (var i = animRows.length - 1; i >= 0; i--) {
      board.splice(animRows[i], 1);
      var emptyRow = [];
      for (var c = 0; c < COLS; c++) emptyRow[c] = EMPTY;
      board.unshift(emptyRow);
    }
    totalLines += cleared;
    score += POINTS[cleared] * level;
    level = Math.floor(totalLines / 10) + 1;
    dropInterval = SPEED_CURVE[Math.min(level - 1, SPEED_CURVE.length - 1)];
    updateHUD();
    animRows = [];
    spawnNext();
  }

  function spawnNext() {
    current = nextPiece;
    nextPiece = makePiece(nextInBag());
    holdUsed = false;
    lockDelay = 0;
    drawPreview(nextCtx, nextPiece);
    if (!valid(current.shape, current.row, current.col)) {
      endGame();
    }
  }

  /* ── hold ──────────────────────────────────────── */
  function holdSwap() {
    if (holdUsed) return;
    holdUsed = true;
    var id = current.id;
    if (holdPiece) {
      current = makePiece(holdPiece);
      holdPiece = id;
    } else {
      holdPiece = id;
      current = nextPiece;
      nextPiece = makePiece(nextInBag());
      drawPreview(nextCtx, nextPiece);
    }
    drawHold();
  }

  function drawHold() {
    if (!holdPiece) {
      holdCtx.clearRect(0, 0, holdCvs.width, holdCvs.height);
      return;
    }
    drawMiniShape(holdCtx, holdCvs, SHAPES[holdPiece], holdPiece);
  }

  /* ── drawing ───────────────────────────────────── */
  function drawBlock(context, x, y, colorIdx) {
    var c = COLORS[colorIdx];
    var px = x * BLOCK;
    var py = y * BLOCK;
    context.fillStyle = c;
    context.fillRect(px, py, BLOCK, BLOCK);

    // lighter top-left edge
    context.fillStyle = "rgba(255,255,255,0.18)";
    context.fillRect(px, py, BLOCK, 3);
    context.fillRect(px, py, 3, BLOCK);

    // darker bottom-right edge
    context.fillStyle = "rgba(0,0,0,0.25)";
    context.fillRect(px, py + BLOCK - 3, BLOCK, 3);
    context.fillRect(px + BLOCK - 3, py, 3, BLOCK);

    // inner stroke
    context.strokeStyle = "rgba(0,0,0,0.35)";
    context.lineWidth = 1;
    context.strokeRect(px + 0.5, py + 0.5, BLOCK - 1, BLOCK - 1);
  }

  function ghostY() {
    var gy = current.row;
    while (valid(current.shape, gy + 1, current.col)) gy++;
    return gy;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (var r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK + 0.5);
      ctx.lineTo(canvas.width, r * BLOCK + 0.5);
      ctx.stroke();
    }
    for (var c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK + 0.5, 0);
      ctx.lineTo(c * BLOCK + 0.5, canvas.height);
      ctx.stroke();
    }

    // locked cells
    for (var r = 0; r < ROWS; r++) {
      // flash animation
      if (animating && animRows.indexOf(r) !== -1) {
        if (animFrame % 2 === 0) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, r * BLOCK, canvas.width, BLOCK);
        }
        continue;
      }
      for (var c = 0; c < COLS; c++) {
        if (board[r][c]) drawBlock(ctx, c, r, board[r][c]);
      }
    }

    if (!current || animating) return;

    // ghost
    var gy = ghostY();
    var s = current.shape;
    for (var r = 0; r < s.length; r++) {
      for (var c = 0; c < s[r].length; c++) {
        if (!s[r][c]) continue;
        var px = (current.col + c) * BLOCK;
        var py = (gy + r) * BLOCK;
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(px, py, BLOCK, BLOCK);
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, BLOCK - 1, BLOCK - 1);
      }
    }

    // current piece
    for (var r = 0; r < s.length; r++) {
      for (var c = 0; c < s[r].length; c++) {
        if (!s[r][c]) continue;
        drawBlock(ctx, current.col + c, current.row + r, s[r][c]);
      }
    }
  }

  function drawMiniShape(context, cvs, shape, id) {
    var sz = 18;
    context.clearRect(0, 0, cvs.width, cvs.height);
    var w = shape[0].length;
    var h = shape.length;
    var ox = Math.floor((cvs.width  - w * sz) / 2);
    var oy = Math.floor((cvs.height - h * sz) / 2);
    for (var r = 0; r < h; r++) {
      for (var c = 0; c < w; c++) {
        if (!shape[r][c]) continue;
        var px = ox + c * sz;
        var py = oy + r * sz;
        context.fillStyle = COLORS[id];
        context.fillRect(px, py, sz, sz);
        context.strokeStyle = "rgba(0,0,0,0.3)";
        context.lineWidth = 1;
        context.strokeRect(px + 0.5, py + 0.5, sz - 1, sz - 1);
      }
    }
  }

  function drawPreview(context, piece) {
    drawMiniShape(context, nextCvs, SHAPES[piece.id], piece.id);
  }

  function updateHUD() {
    scoreEl.textContent = score;
    linesEl.textContent = totalLines;
    levelEl.textContent = level;
  }

  /* ── movement ──────────────────────────────────── */
  function moveLeft() {
    if (valid(current.shape, current.row, current.col - 1)) {
      current.col--;
      draw();
    }
  }
  function moveRight() {
    if (valid(current.shape, current.row, current.col + 1)) {
      current.col++;
      draw();
    }
  }
  function moveDown() {
    if (valid(current.shape, current.row + 1, current.col)) {
      current.row++;
      lockDelay = 0;
      draw();
      return true;
    }
    return false;
  }
  function hardDrop() {
    var dropped = 0;
    while (valid(current.shape, current.row + 1, current.col)) {
      current.row++;
      dropped++;
    }
    score += dropped * 2;
    updateHUD();
    lockPiece();
    draw();
  }

  /* ── game loop ─────────────────────────────────── */
  function tick(now) {
    if (!running) return;
    if (paused || animating) {
      dropTimer = requestAnimationFrame(tick);
      return;
    }
    if (!lastDrop) lastDrop = now;
    var dt = now - lastDrop;

    // check if piece is sitting on something
    var onGround = !valid(current.shape, current.row + 1, current.col);
    if (onGround) {
      lockDelay += dt;
      if (lockDelay >= LOCK_LIMIT) {
        lockPiece();
        draw();
        lastDrop = now;
        dropTimer = requestAnimationFrame(tick);
        return;
      }
    }

    if (dt >= dropInterval) {
      if (!onGround) {
        current.row++;
        lockDelay = 0;
      }
      draw();
      lastDrop = now;
    }
    dropTimer = requestAnimationFrame(tick);
  }

  /* ── start / end ───────────────────────────────── */
  function startGame() {
    board = createBoard();
    bag = randomBag();
    score = 0;
    totalLines = 0;
    level = 1;
    dropInterval = SPEED_CURVE[0];
    holdPiece = null;
    holdUsed = false;
    animRows = [];
    animating = false;
    gameOver = false;
    paused = false;
    running = true;
    lastDrop = 0;
    lockDelay = 0;

    current = makePiece(nextInBag());
    nextPiece = makePiece(nextInBag());

    updateHUD();
    drawPreview(nextCtx, nextPiece);
    drawHold();
    overlay.classList.add("hidden");
    draw();
    dropTimer = requestAnimationFrame(tick);
  }

  function endGame() {
    running = false;
    gameOver = true;
    cancelAnimationFrame(dropTimer);
    overlayT.textContent = "Game Over";
    overlayM.textContent = "Score: " + score + "  Lines: " + totalLines;
    startBtn.textContent = "RETRY";
    overlay.classList.remove("hidden");
  }

  function togglePause() {
    if (gameOver) return;
    paused = !paused;
    if (paused) {
      overlayT.textContent = "Paused";
      overlayM.textContent = "Press P or tap START to resume";
      startBtn.textContent = "RESUME";
      overlay.classList.remove("hidden");
    } else {
      overlay.classList.add("hidden");
      lastDrop = performance.now();
    }
  }

  /* ── input ─────────────────────────────────────── */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && (!running || gameOver)) {
      startGame();
      return;
    }
    if (!running || gameOver) return;

    if (e.key === "p" || e.key === "P") {
      togglePause();
      return;
    }
    if (paused || animating) return;

    switch (e.key) {
      case "ArrowLeft":  e.preventDefault(); moveLeft();  break;
      case "ArrowRight": e.preventDefault(); moveRight(); break;
      case "ArrowDown":  e.preventDefault(); moveDown(); score += 1; updateHUD(); break;
      case "ArrowUp":    e.preventDefault(); tryRotate(); draw(); break;
      case " ":          e.preventDefault(); hardDrop();  break;
      case "c": case "C": holdSwap(); draw(); break;
    }
  });

  startBtn.addEventListener("click", function () {
    if (paused) { togglePause(); return; }
    startGame();
  });

  /* mobile buttons */
  function bind(id, fn) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("touchstart", function (e) {
      e.preventDefault();
      if (!running || paused || animating || gameOver) return;
      fn();
    });
  }
  bind("btnLeft",   function () { moveLeft(); });
  bind("btnRight",  function () { moveRight(); });
  bind("btnDown",   function () { moveDown(); score += 1; updateHUD(); });
  bind("btnRotate", function () { tryRotate(); draw(); });
  bind("btnDrop",   function () { hardDrop(); });

  /* ── show initial overlay ──────────────────────── */
  overlay.classList.remove("hidden");
})();
