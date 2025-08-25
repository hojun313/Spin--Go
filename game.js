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
let lastExitDirection = null;



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
    x: map.centerX - 300,
    y: map.centerY,
    size: 20,
    speed: 2,
    color: '#00ff00'
};

// 장애물 설정
const obstacle = {
    x: 0,
    y: 0,
    angle: 0,
    color: '#ff0000'
};

const stageObstacles = [
    { wings: 0, speed: 0,    length: 0,   thickness: 0 },  // Stage 0 (not used)
    
    

    // --- 파트 1: 기본기 학습 (전체적인 난이도: 하) ---
    { wings: 2, speed: 0.01, length: 250, thickness: 3 },  // Stage 1: 기본 중의 기본
    { wings: 3, speed: 0.01, length: 280, thickness: 5 },  // Stage 2: 날개와 두께의 첫 경험
    { wings: 4, speed: 0.015,length: 300, thickness: 6 },  // Stage 3: [속도 상승] & 날개 추가. 첫 번째 벽
    { wings: 2, speed: 0.015,length: 350, thickness: 8 },  // Stage 4: [완급 조절] 날개를 줄여 속도에 적응할 시간 제공

    // --- 파트 2: 기술 연마 (전체적인 난이도: 중) ---
    { wings: 5, speed: 0.015,length: 320, thickness: 7 },  // Stage 5: 본격적인 압박 시작
    { wings: 6, speed: 0.02, length: 340, thickness: 9 },  // Stage 6: [속도 상승] & 6개 날개. 중반부의 시작
    { wings: 4, speed: 0.02, length: 300, thickness: 12},  // Stage 7: [기술 점검 #1 - 정교함] 날개는 적지만, 두꺼운 벽 사이를 통과
    { wings: 6, speed: 0.02, length: 380, thickness: 10},  // Stage 8: 다시 일반적인 고난도 스테이지로 복귀

    // --- 파트 3: 한계 돌파 (전체적인 난이도: 상) ---
    { wings: 5, speed: 0.025,length: 350, thickness: 13},  // Stage 9: [속도 상승] & 다시 패턴 변화
    { wings: 6, speed: 0.025,length: 400, thickness: 15},  // Stage 10: [길이 400 제한 적용] 길이로 압도하는 후반부 스테이지
    { wings: 3, speed: 0.025,length: 300, thickness: 20},  // Stage 11: [기술 점검 #2 - 집중력] 날개는 단 3개, 하지만 최대 두께의 벽
    { wings: 6, speed: 0.025,length: 400, thickness: 16},  // Stage 12: [길이 400 제한 적용] 최대 두께 이후 찾아오는 평범한(?) 고난도 스테이지

    // --- 파트 4: 최종장 (전체적인 난이도: 최상) ---
    { wings: 4, speed: 0.03, length: 400, thickness: 14},  // Stage 13: [최고 속도] & [기술 점검 #3 - 순발력] 날개와 두께를 줄여 최고 속도에 집중
    { wings: 6, speed: 0.03, length: 380, thickness: 17},  // Stage 14: 최고 속도와 6개 날개의 조합
    { wings: 5, speed: 0.03, length: 400, thickness: 20},  // Stage 15: [길이 400 제한 적용] 두꺼운 장애물이 최고 속도로 덮쳐오는 압박
    { wings: 6, speed: 0.03, length: 400, thickness: 20},  // Stage 16: [길이 400 제한 적용] 최종 보스 직전, 6개 날개의 모든 것을 담은 스테이지
    
    // --- 보너스/히든 스테이지 제안 ---
    { wings: 1, speed: 0.2, length: 175, thickness: 20},  // Stage 17 (히든): [바늘구멍] 단 하나의 장애물이지만, 통과할 수 있는가?
    { wings: 12, speed: 0.003, length: 400, thickness: 2 },  // Stage 18 (히든): [느림의 미학] [길이 400 제한 적용] 느리지만, 끝없이 길고 촘촘한 장애물
    
    // --- 최종 보스 ---
    { wings: 6, speed: 0.03, length: 400, thickness: 20},  // Stage 19: [길이 400 제한 적용] 사실상 최종 보스. 6개 날개의 극한
    { wings: 7, speed: 0.03, length: 400, thickness: 20}   // Stage 20: [길이 400 제한 적용] [최종 보스] 모든 것이 최대치, 그리고 미지의 7번째 날개
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

function generateMap() {
    console.log(`[generateMap] Called for stage ${stage}`);
    map.corridors = [];
    const corridorWidth = 150;
    const corridorLength = 1000;
    const exitLength = 5;

    // 기본 복도 생성
    map.corridors.push({ x: map.centerX - corridorWidth / 2, y: map.centerY - corridorLength / 2, width: corridorWidth, height: corridorLength });
    map.corridors.push({ x: map.centerX - corridorLength / 2, y: map.centerY - corridorWidth / 2, width: corridorLength, height: corridorWidth });

    // 출구 생성
    let possibleDirections = ['n', 's', 'w', 'e'];
    if (lastExitDirection) {
        possibleDirections = possibleDirections.filter(dir => dir !== lastExitDirection);
    }
    console.log(`[generateMap] Possible directions after filter (excluding ${lastExitDirection}): ${possibleDirections}`);
    
    const exitDir = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
    lastExitDirection = exitDir; // Update lastExitDirection with the newly chosen exit

    console.log(`[generateMap] Generating EXIT to the ${exitDir}. New lastExitDirection: ${lastExitDirection}`);
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
        ctx.fillRect(0, -stageConfig.thickness / 2, stageConfig.length / 2, stageConfig.thickness);
        ctx.restore();
    }

    ctx.restore();
}

function drawHUD() {
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';

    // Left-aligned text
    ctx.textAlign = 'left';
    ctx.fillText(`Stage: ${stage}`, 20, 40);

    const elapsedTime = ((Date.now() - stageStartTime) / 1000).toFixed(2);
    ctx.fillText(`Time: ${elapsedTime}`, 20, 70);

    // Right-aligned text for player speed
    ctx.textAlign = 'right';
    ctx.fillText(`Speed: ${player.speed.toFixed(1)}`, canvas.width - 20, 40);
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
    const lineLength = stageConfig.length / 2;

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
    player.x = map.centerX - 300;
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
            
            generateMap();
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

// Mouse wheel control for player speed
window.addEventListener('wheel', (e) => {
    e.preventDefault(); // Prevent page scrolling

    const speedChange = 0.1;
    const minSpeed = 0;
    const maxSpeed = 5;

    if (e.deltaY < 0) { // Scrolling up
        player.speed = Math.min(maxSpeed, player.speed + speedChange);
    } else { // Scrolling down
        player.speed = Math.max(minSpeed, player.speed - speedChange);
    }
    console.log(`Player speed: ${player.speed.toFixed(1)}`);
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
