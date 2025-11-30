// 游戏常量
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const NEXT_BLOCK_SIZE = 24;

// 游戏状态
let gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    level: 1,
    lines: 0,
    board: [],
    currentPiece: null,
    nextPiece: null,
    dropInterval: 1000,
    lastDropTime: 0
};

// 方块定义
const TETROMINOS = {
    I: {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#00ffff'
    },
    O: {
        shape: [
            [1, 1],
            [1, 1]
        ],
        color: '#ffff00'
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#800080'
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0]
        ],
        color: '#00ff00'
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0]
        ],
        color: '#ff0000'
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#0000ff'
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0]
        ],
        color: '#ff8000'
    }
};

// 获取DOM元素
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const gameOverDiv = document.getElementById('gameOver');
const finalScoreSpan = document.getElementById('finalScore');
const playAgainBtn = document.getElementById('playAgainBtn');
const scoreSpan = document.getElementById('score');
const levelSpan = document.getElementById('level');
const linesSpan = document.getElementById('lines');

// 虚拟按键元素
const btnUp = document.getElementById('btnUp');
const btnLeft = document.getElementById('btnLeft');
const btnDown = document.getElementById('btnDown');
const btnRight = document.getElementById('btnRight');
const btnRotate = document.getElementById('btnRotate');
const btnDrop = document.getElementById('btnDrop');

// 触摸手势变量
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const SWIPE_THRESHOLD = 30;

// 初始化游戏板
function initBoard() {
    const board = [];
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = 0;
        }
    }
    return board;
}

// 创建随机方块
function createPiece() {
    const keys = Object.keys(TETROMINOS);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const tetromino = TETROMINOS[randomKey];
    return {
        shape: tetromino.shape,
        color: tetromino.color,
        x: Math.floor(COLS / 2) - Math.floor(tetromino.shape[0].length / 2),
        y: 0
    };
}

// 绘制单个方块
function drawBlock(ctx, x, y, color, blockSize = BLOCK_SIZE) {
    ctx.fillStyle = color;
    ctx.fillRect(x * blockSize, y * blockSize, blockSize - 1, blockSize - 1);
    
    // 绘制方块边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x * blockSize, y * blockSize, blockSize - 1, blockSize - 1);
    
    // 绘制方块高光效果
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x * blockSize, y * blockSize, blockSize - 1, 4);
    ctx.fillRect(x * blockSize, y * blockSize, 4, blockSize - 1);
}

// 绘制游戏板
function drawBoard() {
    // 绘制背景网格
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // 绘制网格线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let row = 0; row <= ROWS; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * BLOCK_SIZE);
        ctx.lineTo(gameCanvas.width, row * BLOCK_SIZE);
        ctx.stroke();
    }
    for (let col = 0; col <= COLS; col++) {
        ctx.beginPath();
        ctx.moveTo(col * BLOCK_SIZE, 0);
        ctx.lineTo(col * BLOCK_SIZE, gameCanvas.height);
        ctx.stroke();
    }
    
    // 绘制已放置的方块
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (gameState.board[row][col]) {
                drawBlock(ctx, col, row, gameState.board[row][col]);
            }
        }
    }
    
    // 绘制当前方块
    if (gameState.currentPiece) {
        drawPiece(ctx, gameState.currentPiece);
    }
}

// 绘制方块
function drawPiece(ctx, piece, blockSize = BLOCK_SIZE) {
    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (piece.shape[row][col]) {
                drawBlock(ctx, piece.x + col, piece.y + row, piece.color, blockSize);
            }
        }
    }
}

// 绘制下一个方块
function drawNextPiece() {
    // 清空画布
    nextCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // 绘制下一个方块
    if (gameState.nextPiece) {
        const offsetX = Math.floor((nextCanvas.width / NEXT_BLOCK_SIZE - gameState.nextPiece.shape[0].length) / 2);
        const offsetY = Math.floor((nextCanvas.height / NEXT_BLOCK_SIZE - gameState.nextPiece.shape.length) / 2);
        
        // 保存当前状态
        nextCtx.save();
        
        // 绘制方块
        for (let row = 0; row < gameState.nextPiece.shape.length; row++) {
            for (let col = 0; col < gameState.nextPiece.shape[row].length; col++) {
                if (gameState.nextPiece.shape[row][col]) {
                    drawBlock(nextCtx, offsetX + col, offsetY + row, gameState.nextPiece.color, NEXT_BLOCK_SIZE);
                }
            }
        }
        
        // 恢复状态
        nextCtx.restore();
    }
}

// 检查碰撞
function checkCollision(piece, offsetX = 0, offsetY = 0) {
    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (piece.shape[row][col]) {
                const newX = piece.x + col + offsetX;
                const newY = piece.y + row + offsetY;
                
                // 检查边界碰撞
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }
                
                // 检查与已放置方块的碰撞
                if (newY >= 0 && gameState.board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 旋转方块
function rotatePiece(piece) {
    // 创建旋转后的形状
    const rotatedShape = piece.shape[0].map((_, index) => 
        piece.shape.map(row => row[index]).reverse()
    );
    
    const rotatedPiece = {
        ...piece,
        shape: rotatedShape
    };
    
    // 检查旋转后是否碰撞
    if (!checkCollision(rotatedPiece)) {
        return rotatedPiece;
    }
    
    // 尝试墙踢
    const wallKicks = [
        [0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]
    ];
    
    for (const [dx, dy] of wallKicks) {
        if (!checkCollision(rotatedPiece, dx, dy)) {
            rotatedPiece.x += dx;
            rotatedPiece.y += dy;
            return rotatedPiece;
        }
    }
    
    return piece; // 无法旋转，返回原方块
}

// 锁定方块到游戏板
function lockPiece() {
    for (let row = 0; row < gameState.currentPiece.shape.length; row++) {
        for (let col = 0; col < gameState.currentPiece.shape[row].length; col++) {
            if (gameState.currentPiece.shape[row][col]) {
                const boardRow = gameState.currentPiece.y + row;
                const boardCol = gameState.currentPiece.x + col;
                if (boardRow >= 0) {
                    gameState.board[boardRow][boardCol] = gameState.currentPiece.color;
                }
            }
        }
    }
    
    // 检查并消除完整行
    clearLines();
    
    // 生成新方块
    spawnNewPiece();
    
    // 检查游戏是否结束
    if (checkCollision(gameState.currentPiece)) {
        gameOver();
    }
}

// 消除完整行
function clearLines() {
    let linesCleared = 0;
    
    for (let row = ROWS - 1; row >= 0; row--) {
        if (gameState.board[row].every(cell => cell)) {
            // 移除完整行
            gameState.board.splice(row, 1);
            // 在顶部添加新行
            gameState.board.unshift(new Array(COLS).fill(0));
            // 重新检查当前行
            row++;
            linesCleared++;
        }
    }
    
    if (linesCleared > 0) {
        updateScore(linesCleared);
    }
}

// 更新分数
function updateScore(linesCleared) {
    const lineScores = [0, 100, 300, 500, 800];
    const score = lineScores[linesCleared] * gameState.level;
    gameState.score += score;
    gameState.lines += linesCleared;
    
    // 更新等级
    const newLevel = Math.floor(gameState.lines / 10) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        gameState.dropInterval = Math.max(100, 1000 - (gameState.level - 1) * 100);
    }
    
    // 更新UI
    updateUI();
}

// 更新UI
function updateUI() {
    scoreSpan.textContent = gameState.score;
    levelSpan.textContent = gameState.level;
    linesSpan.textContent = gameState.lines;
}

// 生成新方块
function spawnNewPiece() {
    gameState.currentPiece = gameState.nextPiece || createPiece();
    gameState.nextPiece = createPiece();
    drawNextPiece();
}

// 移动方块
function movePiece(dx, dy) {
    if (!gameState.currentPiece) return;
    
    if (!checkCollision(gameState.currentPiece, dx, dy)) {
        gameState.currentPiece.x += dx;
        gameState.currentPiece.y += dy;
        return true;
    }
    return false;
}

// 方块下落
function dropPiece() {
    if (!gameState.currentPiece) return;
    
    if (!movePiece(0, 1)) {
        lockPiece();
    }
}

// 硬下落（直接落到底部）
function hardDrop() {
    if (!gameState.currentPiece) return;
    
    let dropDistance = 0;
    while (!checkCollision(gameState.currentPiece, 0, dropDistance + 1)) {
        dropDistance++;
    }
    
    if (dropDistance > 0) {
        gameState.currentPiece.y += dropDistance;
        lockPiece();
    }
}

// 游戏主循环
function gameLoop(currentTime) {
    if (!gameState.isPlaying || gameState.isPaused) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // 绘制游戏板和当前方块
    drawBoard();
    
    // 方块自动下落
    if (currentTime - gameState.lastDropTime > gameState.dropInterval) {
        dropPiece();
        gameState.lastDropTime = currentTime;
    }
    
    requestAnimationFrame(gameLoop);
}

// 开始游戏
function startGame() {
    if (!gameState.isPlaying) {
        // 初始化游戏状态
        gameState.isPlaying = true;
        gameState.isPaused = false;
        gameState.score = 0;
        gameState.level = 1;
        gameState.lines = 0;
        gameState.board = initBoard();
        gameState.dropInterval = 1000;
        gameState.lastDropTime = 0;
        
        // 生成初始方块
        spawnNewPiece();
        
        // 更新UI
        updateUI();
        
        // 更新按钮状态
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resetBtn.disabled = false;
        
        // 开始游戏循环
        requestAnimationFrame(gameLoop);
    }
}

// 暂停游戏
function pauseGame() {
    if (gameState.isPlaying) {
        gameState.isPaused = !gameState.isPaused;
        pauseBtn.textContent = gameState.isPaused ? '继续' : '暂停';
    }
}

// 重置游戏
function resetGame() {
    // 重置游戏状态
    gameState.isPlaying = false;
    gameState.isPaused = false;
    
    // 更新按钮状态
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '暂停';
    resetBtn.disabled = true;
    
    // 隐藏游戏结束界面
    gameOverDiv.classList.add('hidden');
    
    // 清空游戏板
    gameState.board = initBoard();
    
    // 绘制空游戏板
    drawBoard();
    
    // 清空下一个方块预览
    nextCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
}

// 游戏结束
function gameOver() {
    gameState.isPlaying = false;
    
    // 显示游戏结束界面
    finalScoreSpan.textContent = gameState.score;
    gameOverDiv.classList.remove('hidden');
    
    // 更新按钮状态
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
}

// 键盘事件处理
function handleKeyPress(e) {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            dropPiece();
            gameState.lastDropTime = 0;
            break;
        case 'ArrowUp':
            gameState.currentPiece = rotatePiece(gameState.currentPiece);
            break;
        case ' ':
            hardDrop();
            break;
    }
}

// 虚拟按键事件处理
function handleVirtualButtonPress(action) {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    switch (action) {
        case 'left':
            movePiece(-1, 0);
            break;
        case 'right':
            movePiece(1, 0);
            break;
        case 'down':
            dropPiece();
            gameState.lastDropTime = 0;
            break;
        case 'up':
            gameState.currentPiece = rotatePiece(gameState.currentPiece);
            break;
        case 'rotate':
            gameState.currentPiece = rotatePiece(gameState.currentPiece);
            break;
        case 'drop':
            hardDrop();
            break;
    }
}

// 触摸事件处理
function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
    e.preventDefault();
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;
}

function handleTouchEnd() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // 检查滑动方向
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
            if (deltaX > 0) {
                // 向右滑动
                movePiece(1, 0);
            } else {
                // 向左滑动
                movePiece(-1, 0);
            }
        }
    } else {
        // 垂直滑动
        if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
            if (deltaY > 0) {
                // 向下滑动
                dropPiece();
                gameState.lastDropTime = 0;
            } else {
                // 向上滑动
                gameState.currentPiece = rotatePiece(gameState.currentPiece);
            }
        }
    }
    
    // 重置触摸坐标
    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
    touchEndY = 0;
}

// 初始化游戏
function initGame() {
    // 初始化游戏板
    gameState.board = initBoard();
    
    // 绘制空游戏板
    drawBoard();
    
    // 清空下一个方块预览
    nextCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // 事件监听器
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    resetBtn.addEventListener('click', resetGame);
    playAgainBtn.addEventListener('click', () => {
        resetGame();
        startGame();
    });
    
    document.addEventListener('keydown', handleKeyPress);
    
    // 虚拟按键事件监听器
    btnUp.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleVirtualButtonPress('up');
    });
    btnUp.addEventListener('mousedown', (e) => {
        e.preventDefault();
        handleVirtualButtonPress('up');
    });
    
    btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleVirtualButtonPress('left');
    });
    btnLeft.addEventListener('mousedown', (e) => {
        e.preventDefault();
        handleVirtualButtonPress('left');
    });
    
    btnDown.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleVirtualButtonPress('down');
    });
    btnDown.addEventListener('mousedown', (e) => {
        e.preventDefault();
        handleVirtualButtonPress('down');
    });
    
    btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleVirtualButtonPress('right');
    });
    btnRight.addEventListener('mousedown', (e) => {
        e.preventDefault();
        handleVirtualButtonPress('right');
    });
    
    btnRotate.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleVirtualButtonPress('rotate');
    });
    btnRotate.addEventListener('mousedown', (e) => {
        e.preventDefault();
        handleVirtualButtonPress('rotate');
    });
    
    btnDrop.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleVirtualButtonPress('drop');
    });
    btnDrop.addEventListener('mousedown', (e) => {
        e.preventDefault();
        handleVirtualButtonPress('drop');
    });
    
    // 触摸滑动事件监听器
    gameCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameCanvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // 防止页面滚动
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
}

// 启动游戏
window.addEventListener('DOMContentLoaded', initGame);