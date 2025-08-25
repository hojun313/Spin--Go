// Spin & Go - Game Logic
console.log("game.js loaded");

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const joystickCanvas = document.getElementById('joystickCanvas');
const joystickCtx = joystickCanvas.getContext('2d');


// Canvas 사이즈 설정
canvas.width = 800;
canvas.height = 600;
joystickCanvas.width = 800;
joystickCanvas.height = 600;

// 게임 상태 변수
let stage = 1;
let stageStartTime = Date.now();



// 맵 설정
const map = {
    centerX: 0,
    centerY: 0,
    corridors: []
};

// 최초 맵 생성
generateMap();

// 플레이어 설정
const player = {
    x: map.centerX - 200,
    y: map.centerY,
    size: 20,
    speed: 4,
    color: '#00ff00'
};

// 장애물 설정
const obstacle = {
    x: 0,
    y: 0,
    length: 90,
    thickness: 10,
    angle: 0,
    color: '#ff0000'
};

const stageObstacles = [
    { wings: 0, speed: 0 }, // Stage 0 (not used)
    { wings: 0, speed: 0 }, // Stage 1
    { wings: 2, speed: 0 }, // Stage 2
    { wings: 2, speed: 0.03 }, // Stage 3
    { wings: 3, speed: 0.035 }, // Stage 4
    { wings: 4, speed: 0.04 }, // Stage 5
    { wings: 6, speed: 0.045 }  // Stage 6
];

// 키 입력 상태
const keys = {
    w: false, a: false, s: false, d: false
};

// 조이스틱 설정
const joystick = {
    x: 0,
    y: 0,
    radius: 70,
    knobRadius: 30,
    active: false,
    touchStartX: 0,
    touchStartY: 0,
    touchX: 0,
    touchY: 0
};

function generateMap(previousExitDir = null) {
    console.log(`Generating map for stage ${stage}`);
    map.corridors = [];
    const corridorWidth = 100;
    const corridorLength = 1000;
    const exitLength = 5;

    // 기본 복도 생성
    map.corridors.push({ x: map.centerX - corridorWidth / 2, y: map.centerY - corridorLength / 2, width: corridorWidth, height: corridorLength });
    map.corridors.push({ x: map.centerX - corridorLength / 2, y: map.centerY - corridorWidth / 2, width: corridorLength, height: corridorWidth });

    // 출구 생성
    let possibleDirections = ['n', 's', 'w', 'e'];
    if (previousExitDir) {
        possibleDirections = possibleDirections.filter(dir => dir !== previousExitDir);
    }
    
    const exitDir = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];

    console.log(`Generating EXIT to the ${exitDir}`);
    let exit;
    const halfCorridor = corridorLength / 2;
    if (exitDir === 'n') exit = { x: map.centerX - corridorWidth / 2, y: map.centerY - halfCorridor - exitLength, width: corridorWidth, height: exitLength, isExit: true };
    if (exitDir === 's') exit = { x: map.centerX - corridorWidth / 2, y: map.centerY + halfCorridor, width: corridorWidth, height: exitLength, isExit: true };
    if (exitDir === 'w') exit = { x: map.centerX - halfCorridor - exitLength, y: map.centerY - corridorWidth / 2, width: exitLength, height: corridorWidth, isExit: true };
    if (exitDir === 'e') exit = { x: map.centerX + halfCorridor, y: map.centerY - corridorWidth / 2, width: exitLength, height: corridorWidth, isExit: true };
    map.corridors.push(exit);
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawMap() {
    map.corridors.forEach(corridor => {
        ctx.fillStyle = corridor.isExit ? '#0077ff' : '#444'; // 탈출구 색상 변경
        ctx.fillRect(corridor.x, corridor.y, corridor.width, corridor.height);
    });
}

function drawObstacle() {
    const stageConfig = stageObstacles[stage] || stageObstacles[0];
    if (stageConfig.wings === 0) return;

    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);
    ctx.rotate(obstacle.angle);
    ctx.fillStyle = obstacle.color;

    for (let i = 0; i < stageConfig.wings; i++) {
        ctx.save();
        ctx.rotate((i * 2 * Math.PI) / stageConfig.wings);
        ctx.fillRect(0, -obstacle.thickness / 2, obstacle.length / 2, obstacle.thickness);
        ctx.restore();
    }

    ctx.restore();
}

function drawHUD() {
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Stage: ${stage}`, 20, 40);

    const elapsedTime = ((Date.now() - stageStartTime) / 1000).toFixed(2);
    ctx.fillText(`Time: ${elapsedTime}`, 20, 70);
}


function isPointInCorridors(x, y) {
    for (const corridor of map.corridors) {
        if (x >= corridor.x && x <= corridor.x + corridor.width && y >= corridor.y && y <= corridor.y + corridor.height) {
            return true;
        }
    }
    return false;
}

function isPositionValid(x, y, size) {
    const halfSize = size / 2;
    if (!isPointInCorridors(x - halfSize, y - halfSize)) return false;
    if (!isPointInCorridors(x + halfSize, y - halfSize)) return false;
    if (!isPointInCorridors(x - halfSize, y + halfSize)) return false;
    if (!isPointInCorridors(x + halfSize, y + halfSize)) return false;
    return true;
}

function updateObstacle() {
    const stageConfig = stageObstacles[stage] || stageObstacles[0];
    if (stageConfig.wings === 0) return;

    obstacle.x = map.centerX;
    obstacle.y = map.centerY;

    obstacle.angle += stageConfig.speed;
}

function checkCollision() {
    const stageConfig = stageObstacles[stage] || stageObstacles[0];
    if (stageConfig.wings === 0) return;

    if (map.centerX !== obstacle.x || map.centerY !== obstacle.y) return;

    const playerRadius = player.size / 2;
    const lineLength = obstacle.length / 2;

    for (let i = 0; i < stageConfig.wings; i++) {
        const wingAngle = obstacle.angle + (i * 2 * Math.PI) / stageConfig.wings;

        const p1 = { x: obstacle.x, y: obstacle.y };
        const p2 = { x: obstacle.x + Math.cos(wingAngle) * lineLength, y: obstacle.y + Math.sin(wingAngle) * lineLength };

        const l2 = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
        if (l2 === 0) {
            const dist2 = Math.pow(player.x - p1.x, 2) + Math.pow(player.y - p1.y, 2);
            if (dist2 < playerRadius * playerRadius) {
                handleCollision();
                return; // Collision detected, no need to check other wings
            }
            continue; // Skip to next wing if line has zero length
        }

        let t = ((player.x - p1.x) * (p2.x - p1.x) + (player.y - p1.y) * (p2.y - p1.y)) / l2;
        t = Math.max(0, Math.min(1, t));

        const closestPoint = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
        const dist2 = Math.pow(player.x - closestPoint.x, 2) + Math.pow(player.y - closestPoint.y, 2);

        if (dist2 < playerRadius * playerRadius) {
            handleCollision();
            return; // Collision detected, no need to check other wings
        }
    }
}

function handleCollision() {
    console.log("Collision! Resetting to Stage 1.");
    stage = 1;
    stageStartTime = Date.now();
    map.centerX = 0;
    map.centerY = 0;
    player.x = map.centerX - 200;
    player.y = map.centerY;
    obstacle.angle = 0;
    generateMap();
}

function checkStageCompletion() {
    const exit = map.corridors.find(c => c.isExit);
    if (exit) {
        const playerLeft = player.x - player.size / 2;
        const playerRight = player.x + player.size / 2;
        const playerTop = player.y - player.size / 2;
        const playerBottom = player.y + player.size / 2;

        if (playerRight > exit.x && playerLeft < exit.x + exit.width &&
            playerBottom > exit.y && playerTop < exit.y + exit.height) {
            
            console.log("Stage complete!");
            stage++;
            
            let enteredExitDir;
            // Deducing direction based on geometry
            if (exit.y < map.centerY) enteredExitDir = 'n';
            else if (exit.y > map.centerY) enteredExitDir = 's';
            else if (exit.x < map.centerX) enteredExitDir = 'w';
            else enteredExitDir = 'e';

            generateMap(enteredExitDir); // Pass the direction of the exit just used
        }
    }
}


function update() {
    let nextX = player.x;
    let nextY = player.y;

    if (keys.w) nextY -= player.speed;
    if (keys.s) nextY += player.speed;
    if (keys.a) nextX -= player.speed;
    if (keys.d) nextX += player.speed;

    if (isPositionValid(nextX, player.y, player.size)) {
        player.x = nextX;
    }
    if (isPositionValid(player.x, nextY, player.size)) {
        player.y = nextY;
    }

    updateObstacle();
    checkCollision();
    checkStageCompletion();
}

function drawJoystick() {
    if (!joystick.active) return;

    joystickCtx.clearRect(0, 0, joystickCanvas.width, joystickCanvas.height);

    // Draw joystick base
    joystickCtx.beginPath();
    joystickCtx.arc(joystick.x, joystick.y, joystick.radius, 0, Math.PI * 2);
    joystickCtx.fillStyle = 'rgba(128, 128, 128, 0.5)';
    joystickCtx.fill();

    // Draw joystick knob
    let knobX = joystick.touchX;
    let knobY = joystick.touchY;
    const dx = knobX - joystick.x;
    const dy = knobY - joystick.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > joystick.radius) {
        knobX = joystick.x + (dx / distance) * joystick.radius;
        knobY = joystick.y + (dy / distance) * joystick.radius;
    }

    joystickCtx.beginPath();
    joystickCtx.arc(knobX, knobY, joystick.knobRadius, 0, Math.PI * 2);
    joystickCtx.fillStyle = 'rgba(200, 200, 200, 0.7)';
    joystickCtx.fill();
}


function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2 - player.x, canvas.height / 2 - player.y);

    drawMap();
    drawObstacle();
    drawPlayer();

    ctx.restore();

    drawHUD();
    drawJoystick();

    update();
    requestAnimationFrame(gameLoop);
}

// Keyboard controls
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') keys.w = true;
    if (key === 's' || key === 'arrowdown') keys.s = true;
    if (key === 'a' || key === 'arrowleft') keys.a = true;
    if (key === 'd' || key === 'arrowright') keys.d = true;
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') keys.w = false;
    if (key === 's' || key === 'arrowdown') keys.s = false;
    if (key === 'a' || key === 'arrowleft') keys.a = false;
    if (key === 'd' || key === 'arrowright') keys.d = false;
});

// Joystick controls
function handleJoystickMove(x, y) {
    if (!joystick.active) return;

    joystick.touchX = x;
    joystick.touchY = y;

    const dx = joystick.touchX - joystick.x;
    const dy = joystick.touchY - joystick.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx*dx + dy*dy);

    keys.w = false;
    keys.s = false;
    keys.a = false;
    keys.d = false;

    if (distance > joystick.radius / 4) { // Dead zone
        if (angle > -Math.PI * 0.75 && angle < -Math.PI * 0.25) {
            keys.w = true;
        } else if (angle > Math.PI * 0.25 && angle < Math.PI * 0.75) {
            keys.s = true;
        }
        if (angle > Math.PI * 0.75 || angle < -Math.PI * 0.75) {
            keys.a = true;
        } else if (angle < Math.PI * 0.25 && angle > -Math.PI * 0.25) {
            keys.d = true;
        }
    }
}

function stopJoystick() {
    joystick.active = false;
    joystickCtx.clearRect(0, 0, joystickCanvas.width, joystickCanvas.height);
    keys.w = false;
    keys.s = false;
    keys.a = false;
    keys.d = false;
}

// Touch events
joystickCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = joystickCanvas.getBoundingClientRect();
        joystick.active = true;
        joystick.x = touch.clientX - rect.left;
        joystick.y = touch.clientY - rect.top;
        handleJoystickMove(joystick.x, joystick.y);
    }
});

joystickCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = joystickCanvas.getBoundingClientRect();
        handleJoystickMove(touch.clientX - rect.left, touch.clientY - rect.top);
    }
});

joystickCanvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopJoystick();
});

// Mouse events for desktop testing
joystickCanvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const rect = joystickCanvas.getBoundingClientRect();
    joystick.active = true;
    joystick.x = e.clientX - rect.left;
    joystick.y = e.clientY - rect.top;
    handleJoystickMove(joystick.x, joystick.y);
});

joystickCanvas.addEventListener('mousemove', (e) => {
    e.preventDefault();
    if (joystick.active) {
        const rect = joystickCanvas.getBoundingClientRect();
        handleJoystickMove(e.clientX - rect.left, e.clientY - rect.top);
    }
});

window.addEventListener('mouseup', (e) => {
    e.preventDefault();
    if (joystick.active) {
        stopJoystick();
    }
});


console.log("Starting game loop");
gameLoop();
