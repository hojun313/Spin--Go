// Spin & Go - Game Logic
console.log("game.js loaded");

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas 사이즈 설정
canvas.width = 800;
canvas.height = 600;

let gameState = 'playing'; // playing, won
let justChangedMap = false;

// 맵 설정
const map = {
    centerX: 0,
    centerY: 0,
    corridors: [],
    changeThreshold: 500, // 맵 변경이 일어나는 거리
    exitChance: 0.25 // 탈출구 생성 확률 (25%)
};

// 최초 맵 생성
generateMap();

// 플레이어 설정
const player = {
    x: map.centerX - 200, // 왼쪽에서 시작
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
    speed: 0.02,
    color: '#ff0000'
};

// 키 입력 상태
const keys = {
    w: false, a: false, s: false, d: false
};

function generateMap() {
    console.log(`Generating new map layout at ${map.centerX}, ${map.centerY}`);
    map.corridors = [];
    let exitGenerated = false;

    const roomSize = 100;
    const minLength = 200;
    const maxLength = 600;

    map.corridors.push({ x: map.centerX - roomSize / 2, y: map.centerY - roomSize / 2, width: roomSize, height: roomSize });

    const directions = ['n', 's', 'w', 'e'];
    if (Math.random() < map.exitChance) {
        const exitDir = directions.splice(Math.floor(Math.random() * directions.length), 1)[0];
        console.log(`Generating EXIT to the ${exitDir}`);
        const exitLength = 150;
        let exit;
        if (exitDir === 'n') exit = { x: map.centerX - roomSize / 2, y: map.centerY - roomSize / 2 - exitLength, width: roomSize, height: exitLength, isExit: true };
        if (exitDir === 's') exit = { x: map.centerX - roomSize / 2, y: map.centerY + roomSize / 2, width: roomSize, height: exitLength, isExit: true };
        if (exitDir === 'w') exit = { x: map.centerX - roomSize / 2 - exitLength, y: map.centerY - roomSize / 2, width: exitLength, height: roomSize, isExit: true };
        if (exitDir === 'e') exit = { x: map.centerX + roomSize / 2, y: map.centerY - roomSize / 2, width: exitLength, height: roomSize, isExit: true };
        map.corridors.push(exit);
        exitGenerated = true;
    }

    directions.forEach(dir => {
        const length = Math.random() * (maxLength - minLength) + minLength;
        if (dir === 'n') map.corridors.push({ x: map.centerX - roomSize / 2, y: map.centerY - roomSize / 2 - length, width: roomSize, height: length });
        if (dir === 's') map.corridors.push({ x: map.centerX - roomSize / 2, y: map.centerY + roomSize / 2, width: roomSize, height: length });
        if (dir === 'w') map.corridors.push({ x: map.centerX - roomSize / 2 - length, y: map.centerY - roomSize / 2, width: length, height: roomSize });
        if (dir === 'e') map.corridors.push({ x: map.centerX + roomSize / 2, y: map.centerY - roomSize / 2, width: length, height: roomSize });
    });
}

function drawPlayer() { ctx.fillStyle = player.color; ctx.beginPath(); ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2); ctx.fill(); }

function drawMap() {
    map.corridors.forEach(corridor => {
        ctx.fillStyle = corridor.isExit ? '#0077ff' : '#444'; // 탈출구 색상 변경
        ctx.fillRect(corridor.x, corridor.y, corridor.width, corridor.height);
    });
}

function drawObstacle() { ctx.save(); ctx.translate(obstacle.x, obstacle.y); ctx.rotate(obstacle.angle); ctx.fillStyle = obstacle.color; ctx.fillRect(-obstacle.length / 2, -obstacle.thickness / 2, obstacle.length, obstacle.thickness); ctx.restore(); }

function isPointInCorridors(x, y) { for (const corridor of map.corridors) { if (x >= corridor.x && x <= corridor.x + corridor.width && y >= corridor.y && y <= corridor.y + corridor.height) return true; } return false; }

function isPositionValid(x, y, size) { const halfSize = size / 2; if (!isPointInCorridors(x - halfSize, y - halfSize)) return false; if (!isPointInCorridors(x + halfSize, y - halfSize)) return false; if (!isPointInCorridors(x - halfSize, y + halfSize)) return false; if (!isPointInCorridors(x + halfSize, y + halfSize)) return false; return true; }

function checkMapChange() { const distX = Math.abs(player.x - map.centerX); const distY = Math.abs(player.y - map.centerY); if (distX > map.changeThreshold || distY > map.changeThreshold) { console.log("Player reached threshold, triggering map change."); map.centerX = player.x; map.centerY = player.y; generateMap(); justChangedMap = true; } }

function updateObstacle() { obstacle.x = map.centerX; obstacle.y = map.centerY; obstacle.angle += obstacle.speed; }

function checkCollision() { if (map.centerX !== obstacle.x || map.centerY !== obstacle.y) return; const playerRadius = player.size / 2; const lineHalfLength = obstacle.length / 2; const p1 = { x: obstacle.x + Math.cos(obstacle.angle) * lineHalfLength, y: obstacle.y + Math.sin(obstacle.angle) * lineHalfLength }; const p2 = { x: obstacle.x - Math.cos(obstacle.angle) * lineHalfLength, y: obstacle.y - Math.sin(obstacle.angle) * lineHalfLength }; const l2 = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2); if (l2 === 0) { const dist2 = Math.pow(player.x - p1.x, 2) + Math.pow(player.y - p1.y, 2); if (dist2 < playerRadius * playerRadius) handleCollision(); return; } let t = ((player.x - p1.x) * (p2.x - p1.x) + (player.y - p1.y) * (p2.y - p1.y)) / l2; t = Math.max(0, Math.min(1, t)); const closestPoint = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) }; const dist2 = Math.pow(player.x - closestPoint.x, 2) + Math.pow(player.y - closestPoint.y, 2); if (dist2 < playerRadius * playerRadius) handleCollision(); }

function handleCollision() { 
    console.log("Collision! Resetting game.");
    // 게임 상태 완전 리셋
    map.centerX = 0;
    map.centerY = 0;
    player.x = map.centerX - 200; // 리스폰 위치를 왼쪽으로 수정
    player.y = map.centerY;
    obstacle.angle = 0;
    generateMap(); 
}

function checkWinCondition() {
    const exit = map.corridors.find(c => c.isExit);
    if (exit) {
        const playerLeft = player.x - player.size / 2;
        const playerRight = player.x + player.size / 2;
        const playerTop = player.y - player.size / 2;
        const playerBottom = player.y + player.size / 2;
        if (playerRight > exit.x && playerLeft < exit.x + exit.width && playerBottom > exit.y && playerTop < exit.y + exit.height) {
            gameState = 'won';
            console.log("Player reached the exit!");
        }
    }
}

function update() {
    if (gameState !== 'playing') return;

    let nextX = player.x;
    let nextY = player.y;

    if (keys.w) nextY -= player.speed;
    if (keys.s) nextY += player.speed;
    if (keys.a) nextX -= player.speed;
    if (keys.d) nextX += player.speed;

    if (isPositionValid(nextX, player.y, player.size)) player.x = nextX;
    if (isPositionValid(player.x, nextY, player.size)) player.y = nextY;

    checkMapChange();
    updateObstacle();

    if (justChangedMap) {
        justChangedMap = false; // Skip collision check for this frame
    } else {
        checkCollision();
    }
    
    checkWinCondition();
}

function drawWinScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = '50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("You Escaped!", canvas.width / 2, canvas.height / 2);

    ctx.font = '20px sans-serif';
    ctx.fillText("Refresh to play again.", canvas.width / 2, canvas.height / 2 + 50);
}

function gameLoop() {
    if (gameState === 'won') {
        drawWinScreen();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2 - player.x, canvas.height / 2 - player.y);

    drawMap();
    drawObstacle();
    drawPlayer();

    ctx.restore();
    update();
    requestAnimationFrame(gameLoop);
}

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

console.log("Starting game loop");
gameLoop();
