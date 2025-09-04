// 获取Canvas元素和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 获取DOM元素
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const speedStatusElement = document.getElementById('speedStatus');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const upBtn = document.getElementById('upBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const downBtn = document.getElementById('downBtn');
const difficultySelect = document.getElementById('difficultySelect');

// 游戏配置
const gridSize = 15; // 网格大小

// 难度级别配置
const difficultySettings = {
    easy: {
        speed: 200, // 简单难度的初始速度（毫秒）
        acceleratedSpeed: 120, // 简单难度的加速速度（毫秒）
        growthRate: 1 // 每次吃到食物增长的长度
    },
    medium: {
        speed: 150, // 中等难度的初始速度（毫秒）
        acceleratedSpeed: 80, // 中等难度的加速速度（毫秒）
        growthRate: 1 // 每次吃到食物增长的长度
    },
    hard: {
        speed: 100, // 困难难度的初始速度（毫秒）
        acceleratedSpeed: 50, // 困难难度的加速速度（毫秒）
        growthRate: 2 // 每次吃到食物增长的长度
    }
};

// 当前难度设置
let currentDifficulty = 'medium';
let initialSpeed = difficultySettings[currentDifficulty].speed;
let acceleratedSpeed = difficultySettings[currentDifficulty].acceleratedSpeed;
let growthRate = difficultySettings[currentDifficulty].growthRate;

// 游戏状态
let snake = [];
let food = {};
let obstacles = []; // 障碍物数组
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameInterval;
let isPaused = false;
let isGameOver = true;
let isAccelerated = false; // 是否处于加速状态
let keyPressTime = 0; // 按键按下的时间戳

// 障碍物配置
const obstacleSettings = {
    easy: {
        count: 3, // 简单难度的障碍物数量
        minDistance: 5 // 障碍物与蛇和食物的最小距离
    },
    medium: {
        count: 5, // 中等难度的障碍物数量
        minDistance: 4 // 障碍物与蛇和食物的最小距离
    },
    hard: {
        count: 8, // 困难难度的障碍物数量
        minDistance: 3 // 障碍物与蛇和食物的最小距离
    }
};

// 初始化游戏
function initGame() {
    // 更新当前难度设置
    currentDifficulty = difficultySelect.value;
    initialSpeed = difficultySettings[currentDifficulty].speed;
    acceleratedSpeed = difficultySettings[currentDifficulty].acceleratedSpeed;
    growthRate = difficultySettings[currentDifficulty].growthRate;
    
    // 初始化蛇（3个格子长，位于画布中央）
    const centerX = Math.floor(canvas.width / gridSize / 2);
    const centerY = Math.floor(canvas.height / gridSize / 2);
    
    snake = [
        {x: centerX, y: centerY},
        {x: centerX - 1, y: centerY},
        {x: centerX - 2, y: centerY}
    ];
    
    // 生成第一个食物
    generateFood();
    
    // 生成障碍物
    generateObstacles();
    
    // 重置游戏状态
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    isGameOver = false;
    isPaused = false;
    isAccelerated = false;
    
    // 重置速度状态指示器
    speedStatusElement.textContent = '正常';
    speedStatusElement.style.color = '#388E3C';
    
    // 清除之前的游戏循环
    if (gameInterval) {
        clearInterval(gameInterval);
    }
}

// 生成食物
function generateFood() {
    // 随机生成食物位置
    let newFood;
    let isInvalidPosition;
    
    do {
        isInvalidPosition = false;
        newFood = {
            x: Math.floor(Math.random() * (canvas.width / gridSize)),
            y: Math.floor(Math.random() * (canvas.height / gridSize))
        };
        
        // 检查食物是否在蛇身上
        for (let segment of snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                isInvalidPosition = true;
                break;
            }
        }
        
        // 检查食物是否在障碍物上
        if (!isInvalidPosition) {
            for (let obstacle of obstacles) {
                if (obstacle.x === newFood.x && obstacle.y === newFood.y) {
                    isInvalidPosition = true;
                    break;
                }
            }
        }
    } while (isInvalidPosition);
    
    food = newFood;
}

// 生成障碍物
function generateObstacles() {
    // 清空现有障碍物
    obstacles = [];
    
    // 获取当前难度的障碍物设置
    const settings = obstacleSettings[currentDifficulty];
    const count = settings.count;
    const minDistance = settings.minDistance;
    
    // 生成指定数量的障碍物
    for (let i = 0; i < count; i++) {
        let newObstacle;
        let isInvalidPosition;
        
        do {
            isInvalidPosition = false;
            newObstacle = {
                x: Math.floor(Math.random() * (canvas.width / gridSize)),
                y: Math.floor(Math.random() * (canvas.height / gridSize))
            };
            
            // 检查障碍物是否在蛇身上或太靠近蛇
            for (let segment of snake) {
                const distance = Math.sqrt(
                    Math.pow(segment.x - newObstacle.x, 2) + 
                    Math.pow(segment.y - newObstacle.y, 2)
                );
                if (distance < minDistance) {
                    isInvalidPosition = true;
                    break;
                }
            }
            
            // 检查障碍物是否在食物上或太靠近食物
            if (!isInvalidPosition) {
                const distance = Math.sqrt(
                    Math.pow(food.x - newObstacle.x, 2) + 
                    Math.pow(food.y - newObstacle.y, 2)
                );
                if (distance < minDistance) {
                    isInvalidPosition = true;
                }
            }
            
            // 检查障碍物是否与其他障碍物重叠
            if (!isInvalidPosition) {
                for (let obstacle of obstacles) {
                    if (obstacle.x === newObstacle.x && obstacle.y === newObstacle.y) {
                        isInvalidPosition = true;
                        break;
                    }
                }
            }
        } while (isInvalidPosition);
        
        obstacles.push(newObstacle);
    }
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.fillStyle = '#e8f5e9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格线（可选）
    drawGrid();
    
    // 绘制障碍物
    drawObstacles();
    
    // 绘制蛇
    drawSnake();
    
    // 绘制食物
    drawFood();
    
    // 如果游戏结束，显示游戏结束文字
    if (isGameOver) {
        drawGameOver();
    }
}

// 绘制障碍物
function drawObstacles() {
    ctx.fillStyle = '#795548'; // 障碍物颜色（棕色）
    
    obstacles.forEach(obstacle => {
        // 绘制圆角矩形作为障碍物
        roundRect(
            obstacle.x * gridSize, 
            obstacle.y * gridSize, 
            gridSize, 
            gridSize, 
            2, // 圆角半径
            true // 填充
        );
        
        // 添加纹理效果
        ctx.strokeStyle = '#5D4037'; // 深棕色
        ctx.lineWidth = 1;
        
        // 绘制十字纹理
        ctx.beginPath();
        // 水平线
        ctx.moveTo(obstacle.x * gridSize + 3, obstacle.y * gridSize + gridSize / 2);
        ctx.lineTo(obstacle.x * gridSize + gridSize - 3, obstacle.y * gridSize + gridSize / 2);
        // 垂直线
        ctx.moveTo(obstacle.x * gridSize + gridSize / 2, obstacle.y * gridSize + 3);
        ctx.lineTo(obstacle.x * gridSize + gridSize / 2, obstacle.y * gridSize + gridSize - 3);
        ctx.stroke();
    });
}

// 绘制网格线
function drawGrid() {
    ctx.strokeStyle = '#d0e8d0';
    ctx.lineWidth = 0.5;
    
    // 绘制垂直线
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // 绘制左边框和下边框的边界线
    ctx.strokeStyle = '#388E3C';
    ctx.lineWidth = 2;
    
    // 左边框
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();
    
    // 下边框
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.stroke();
}

// 绘制蛇
function drawSnake() {
    snake.forEach((segment, index) => {
        // 蛇头和蛇身使用不同颜色
        if (index === 0) {
            ctx.fillStyle = '#388E3C'; // 蛇头颜色
        } else {
            ctx.fillStyle = '#4CAF50'; // 蛇身颜色
        }
        
        // 绘制圆角矩形作为蛇的身体部分
        roundRect(
            segment.x * gridSize, 
            segment.y * gridSize, 
            gridSize, 
            gridSize, 
            4, // 圆角半径
            true
        );
        
        // 为蛇头添加眼睛
        if (index === 0) {
            drawSnakeEyes(segment);
        }
    });
}

// 绘制蛇的眼睛
function drawSnakeEyes(head) {
    ctx.fillStyle = 'white';
    
    // 根据方向确定眼睛位置
    const eyeSize = gridSize / 5;
    const eyeOffset = gridSize / 3;
    
    let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
    
    switch(direction) {
        case 'up':
            leftEyeX = head.x * gridSize + eyeOffset;
            leftEyeY = head.y * gridSize + eyeOffset;
            rightEyeX = head.x * gridSize + gridSize - eyeOffset - eyeSize;
            rightEyeY = head.y * gridSize + eyeOffset;
            break;
        case 'down':
            leftEyeX = head.x * gridSize + eyeOffset;
            leftEyeY = head.y * gridSize + gridSize - eyeOffset - eyeSize;
            rightEyeX = head.x * gridSize + gridSize - eyeOffset - eyeSize;
            rightEyeY = head.y * gridSize + gridSize - eyeOffset - eyeSize;
            break;
        case 'left':
            leftEyeX = head.x * gridSize + eyeOffset;
            leftEyeY = head.y * gridSize + eyeOffset;
            rightEyeX = head.x * gridSize + eyeOffset;
            rightEyeY = head.y * gridSize + gridSize - eyeOffset - eyeSize;
            break;
        case 'right':
            leftEyeX = head.x * gridSize + gridSize - eyeOffset - eyeSize;
            leftEyeY = head.y * gridSize + eyeOffset;
            rightEyeX = head.x * gridSize + gridSize - eyeOffset - eyeSize;
            rightEyeY = head.y * gridSize + gridSize - eyeOffset - eyeSize;
            break;
    }
    
    // 绘制眼睛
    ctx.fillRect(leftEyeX, leftEyeY, eyeSize, eyeSize);
    ctx.fillRect(rightEyeX, rightEyeY, eyeSize, eyeSize);
    
    // 绘制瞳孔
    ctx.fillStyle = 'black';
    const pupilSize = eyeSize / 2;
    ctx.fillRect(leftEyeX + eyeSize/4, leftEyeY + eyeSize/4, pupilSize, pupilSize);
    ctx.fillRect(rightEyeX + eyeSize/4, rightEyeY + eyeSize/4, pupilSize, pupilSize);
}

// 绘制食物
function drawFood() {
    ctx.fillStyle = '#F44336'; // 食物颜色
    
    // 绘制圆形食物
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 1,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // 添加食物光泽
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 3,
        food.y * gridSize + gridSize / 3,
        gridSize / 6,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// 绘制游戏结束文字
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 15);
    
    ctx.font = '16px Arial';
    ctx.fillText(`最终得分: ${score}`, canvas.width / 2, canvas.height / 2 + 15);
}

// 绘制圆角矩形
function roundRect(x, y, width, height, radius, fill) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    if (fill) {
        ctx.fill();
    } else {
        ctx.stroke();
    }
}

// 移动蛇
function moveSnake() {
    // 如果游戏暂停或结束，不移动
    if (isPaused || isGameOver) {
        return;
    }
    
    // 更新方向
    direction = nextDirection;
    
    // 获取蛇头
    const head = {...snake[0]};
    
    // 根据方向移动蛇头
    switch(direction) {
        case 'up':
            head.y -= 1;
            break;
        case 'down':
            head.y += 1;
            break;
        case 'left':
            head.x -= 1;
            break;
        case 'right':
            head.x += 1;
            break;
    }
    
    // 检查碰撞
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    // 将新头部添加到蛇身体前面
    snake.unshift(head);
    
    // 检查是否吃到食物
if (head.x === food.x && head.y === food.y) {
    // 吃到食物，增加分数
    score += 10;
    scoreElement.textContent = score;
    
    // 更新最高分
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
    }
    
    // 生成新食物
    generateFood();
    
    // 根据当前难度增加蛇的长度
    // 注意：growthRate - 1 是因为我们已经添加了一个头部
    for (let i = 0; i < growthRate - 1; i++) {
        snake.push({...snake[snake.length - 1]});
    }
    
    // 播放吃食物音效（可选）
    // playEatSound();
} else {
    // 没吃到食物，移除尾部
    snake.pop();
}
}

// 检查碰撞
function checkCollision(head) {
    // 检查是否撞墙
    if (
        head.x < 0 || 
        head.y < 0 || 
        head.x >= canvas.width / gridSize || 
        head.y >= canvas.height / gridSize
    ) {
        return true;
    }
    
    // 检查是否撞到自己（从第二个身体部分开始检查）
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    // 检查是否撞到障碍物
    for (let obstacle of obstacles) {
        if (head.x === obstacle.x && head.y === obstacle.y) {
            return true;
        }
    }
    
    return false;
}

// 游戏结束
function gameOver() {
    isGameOver = true;
    clearInterval(gameInterval);
    drawGame(); // 立即重绘以显示游戏结束画面
}

// 开始游戏
function startGame() {
    if (!isGameOver && isPaused) {
        // 如果游戏只是暂停，则继续游戏
        isPaused = false;
        gameInterval = setInterval(gameLoop, initialSpeed);
        pauseBtn.textContent = '暂停';
    } else if (isGameOver) {
        // 如果游戏结束，则初始化并开始新游戏
        initGame();
        gameInterval = setInterval(gameLoop, difficultySettings[currentDifficulty].speed);
        startBtn.textContent = '开始游戏';
        pauseBtn.textContent = '暂停';
    }
    // 重置加速状态
    isAccelerated = false;
}

// 暂停游戏
function pauseGame() {
    if (!isGameOver) {
        if (isPaused) {
            // 继续游戏
            isPaused = false;
            gameInterval = setInterval(gameLoop, difficultySettings[currentDifficulty].speed);
            pauseBtn.textContent = '暂停';
        } else {
            // 暂停游戏
            isPaused = true;
            clearInterval(gameInterval);
            pauseBtn.textContent = '继续';
        }
        // 重置加速状态
        isAccelerated = false;
        speedStatusElement.textContent = '正常';
        speedStatusElement.style.color = '#333';
    }
}

// 重新开始游戏
function restartGame() {
    initGame();
    gameInterval = setInterval(gameLoop, difficultySettings[currentDifficulty].speed);
    startBtn.textContent = '开始游戏';
    pauseBtn.textContent = '暂停';
}

// 游戏主循环
function gameLoop() {
    moveSnake();
    drawGame();
}

// 键盘控制
function handleKeyDown(e) {
    // 防止方向键滚动页面
    if ([37, 38, 39, 40].includes(e.keyCode)) {
        e.preventDefault();
    }
    
    // 记录按键按下的时间
    keyPressTime = Date.now();
    
    // 根据按键更改方向（防止180度转弯）
    switch(e.keyCode) {
        case 38: // 上箭头
        case 87: // W键
            if (direction !== 'down') nextDirection = 'up';
            checkForAcceleration();
            break;
        case 40: // 下箭头
        case 83: // S键
            if (direction !== 'up') nextDirection = 'down';
            checkForAcceleration();
            break;
        case 37: // 左箭头
        case 65: // A键
            if (direction !== 'right') nextDirection = 'left';
            checkForAcceleration();
            break;
        case 39: // 右箭头
        case 68: // D键
            if (direction !== 'left') nextDirection = 'right';
            checkForAcceleration();
            break;
        case 32: // 空格键
            if (isGameOver) {
                startGame();
            } else {
                pauseGame();
            }
            break;
    }
}

// 键盘释放事件
function handleKeyUp(e) {
    // 如果释放的是方向键，取消加速并清除加速定时器
    if ([37, 38, 39, 40, 65, 68, 83, 87].includes(e.keyCode)) {
        // 清除加速定时器，防止短按也触发加速
        if (window.accelerationTimer) {
            clearTimeout(window.accelerationTimer);
            window.accelerationTimer = null;
        }
        cancelAcceleration();
    }
}

// 检查是否需要加速
function checkForAcceleration() {
    if (!isPaused && !isGameOver && !isAccelerated) {
        // 设置一个定时器，如果按键持续按下超过200毫秒，则启动加速
        // 存储定时器ID，以便在按键释放时可以取消
        window.accelerationTimer = setTimeout(() => {
            const currentTime = Date.now();
            // 只有当按键仍然处于按下状态时才激活加速
            if (currentTime - keyPressTime >= 200) {
                activateAcceleration();
            }
        }, 200);
    }
}

// 激活加速
function activateAcceleration() {
    if (!isPaused && !isGameOver && !isAccelerated) {
        isAccelerated = true;
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, difficultySettings[currentDifficulty].acceleratedSpeed);
        
        // 更新状态指示器
        speedStatusElement.textContent = '加速中';
        speedStatusElement.style.color = '#F44336';
    }
}

// 取消加速
function cancelAcceleration() {
    if (isAccelerated) {
        isAccelerated = false;
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, difficultySettings[currentDifficulty].speed);
        
        // 更新状态指示器
        speedStatusElement.textContent = '正常';
        speedStatusElement.style.color = '#388E3C';
    }
}

// 触摸控制
function setupTouchControls() {
    // 为每个方向按钮添加触摸事件
    setupTouchButton(upBtn, 'up', 'down');
    setupTouchButton(downBtn, 'down', 'up');
    setupTouchButton(leftBtn, 'left', 'right');
    setupTouchButton(rightBtn, 'right', 'left');
}

// 设置触摸按钮的长按和触摸事件
function setupTouchButton(button, newDirection, oppositeDirection) {
    let touchStartTime;
    let longPressTimer;
    
    // 触摸开始
    button.addEventListener('touchstart', (e) => {
        e.preventDefault(); // 防止滚动
        touchStartTime = Date.now();
        
        // 更改方向
        if (direction !== oppositeDirection) {
            nextDirection = newDirection;
        }
        
        // 设置长按定时器
        longPressTimer = setTimeout(() => {
            if (!isPaused && !isGameOver) {
                activateAcceleration();
            }
        }, 200);
    });
    
    // 触摸结束
    button.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
        cancelAcceleration();
    });
    
    // 触摸取消
    button.addEventListener('touchcancel', () => {
        clearTimeout(longPressTimer);
        cancelAcceleration();
    });
    
    // 点击事件（用于非触摸设备）
    button.addEventListener('click', () => {
        if (direction !== oppositeDirection) {
            nextDirection = newDirection;
        }
    });
}

// 调整Canvas大小
function resizeCanvas() {
    // 获取Canvas容器的当前宽度
    const container = document.querySelector('.canvas-container');
    const containerWidth = container.offsetWidth;
    
    // 确保Canvas宽度是gridSize的整数倍
    const newWidth = Math.floor(containerWidth / gridSize) * gridSize;
    const newHeight = newWidth; // 保持正方形
    
    // 设置Canvas尺寸
    if (canvas.width !== newWidth) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // 如果游戏正在进行，重新绘制
        if (!isGameOver) {
            drawGame();
        }
    }
}

// 初始化函数
function init() {
    // 显示最高分
    highScoreElement.textContent = highScore;
    
    // 添加事件监听器
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    restartBtn.addEventListener('click', restartGame);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', resizeCanvas);
    difficultySelect.addEventListener('change', handleDifficultyChange);
    
    // 设置触摸控制
    setupTouchControls();
    
    // 初始调整Canvas大小
    resizeCanvas();
    
    // 初始绘制游戏（显示空白网格）
    drawGame();
}

// 难度变更处理函数
function handleDifficultyChange() {
    // 只有在游戏未开始或已结束时才允许更改难度
    if (isGameOver || !gameInterval) {
        currentDifficulty = difficultySelect.value;
        initialSpeed = difficultySettings[currentDifficulty].speed;
        acceleratedSpeed = difficultySettings[currentDifficulty].acceleratedSpeed;
        growthRate = difficultySettings[currentDifficulty].growthRate;
    } else {
        // 如果游戏正在进行中，将难度选择器重置为当前难度
        difficultySelect.value = currentDifficulty;
        alert('游戏进行中无法更改难度！请先结束当前游戏。');
    }
}

// 页面加载完成后初始化游戏
window.addEventListener('load', init);