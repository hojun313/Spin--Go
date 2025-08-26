// ==================================================
// YOUR STORY HERE
// ==================================================
const storyContent = `
Please write your story here. <br><br> You can use &lt;br&gt; for line breaks.
`;
// ==================================================

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

// --- Color Schemes ---
const normalColors = {
    background: '#111',
    corridor: '#444',
    player: '#00ff00',
    exit: '#0077ff',
    obstacle: '#ff0000',
    star: '#fff'
};
const invertedColors = {
    background: '#fff',
    corridor: '#AAA',
    player: '#ff00ff',
    exit: '#ff8800',
    obstacle: '#00ffff',
    star: '#000'
};
let colorScheme = { ...normalColors };

// 게임 상태 변수
let stage = 1;
let stageStartTime = Date.now();
let lastExitDirection = null;
// 0: normal, 1: blue flash, 2: inverted walk, 3: whiteout
let endingState = 0; 
let endingStartTime = 0;
let finalTime = 0;
let starfield = [];


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
};

// 장애물 설정
const obstacle = {
    x: 0,
    y: 0,
    angle: 0,
};

const stageObstacles = [
    { wings: 0, speed: 0,    length: 0,   thickness: 0 },  // Stage 0 (not used)
    { wings: 2, speed: 0.01, length: 250, thickness: 3 },  // Stage 1
    { wings: 3, speed: 0.01, length: 280, thickness: 5 },  // Stage 2
    { wings: 4, speed: 0.015,length: 300, thickness: 6 },  // Stage 3
    { wings: 2, speed: 0.015,length: 350, thickness: 8 },  // Stage 4
    { wings: 5, speed: 0.015,length: 320, thickness: 7 },  // Stage 5
    { wings: 6, speed: 0.02, length: 340, thickness: 9 },  // Stage 6
    { wings: 4, speed: 0.02, length: 300, thickness: 12},  // Stage 7
    { wings: 6, speed: 0.02, length: 380, thickness: 10},  // Stage 8
    { wings: 5, speed: 0.025,length: 350, thickness: 13},  // Stage 9
    { wings: 6, speed: 0.025,length: 400, thickness: 15},  // Stage 10
    { wings: 3, speed: 0.025,length: 300, thickness: 20},  // Stage 11
    { wings: 6, speed: 0.025,length: 400, thickness: 16},  // Stage 12
    { wings: 4, speed: 0.03, length: 400, thickness: 14},  // Stage 13
    { wings: 6, speed: 0.03, length: 380, thickness: 17},  // Stage 14
    { wings: 5, speed: 0.03, length: 400, thickness: 20},  // Stage 15
    { wings: 6, speed: 0.03, length: 400, thickness: 20},  // Stage 16
    { wings: 1, speed: 0.2, length: 175, thickness: 20},  // Stage 17
    { wings: 12, speed: 0.003, length: 400, thickness: 2 }, // Stage 18
    { wings: 6, speed: 0.03, length: 400, thickness: 20},  // Stage 19
    { wings: 7, speed: 0.03, length: 400, thickness: 20}   // Stage 20
];

// 키 입력 상태
const keys = {
    w: false, a: false, s: false, d: false
};

// 조이스틱 설정
const joystick = {
    x: 0, y: 0, radius: 70, knobRadius: 30, active: false,
    touchStartX: 0, touchStartY: 0, touchX: 0, touchY: 0
};

function generateFinalCorridor() {
    console.log("Generating the final corridor.");
    map.corridors = [];
    starfield = [];
    const corridorWidth = 150;
    const corridorLength = 5000;
    const buffer = 1000;

    let corridor;
    switch(lastExitDirection) {
        case 'n':
            corridor = { x: map.centerX - corridorWidth / 2, y: map.centerY - corridorLength, width: corridorWidth, height: corridorLength + buffer };
            player.y = map.centerY - 10;
            break;
        case 's':
            corridor = { x: map.centerX - corridorWidth / 2, y: map.centerY - buffer, width: corridorWidth, height: corridorLength + buffer };
            player.y = map.centerY + 10;
            break;
        case 'w':
            corridor = { x: map.centerX - corridorLength, y: map.centerY - corridorWidth / 2, width: corridorLength + buffer, height: corridorWidth };
            player.x = map.centerX - 10;
            break;
        case 'e':
            corridor = { x: map.centerX - buffer, y: map.centerY - corridorWidth / 2, width: corridorLength + buffer, height: corridorWidth };
            player.x = map.centerX + 10;
            break;
    }
    map.corridors.push(corridor);

    // Generate starfield on the "walls" next to the corridor
    const wallWidth = 1000; // How wide the starfield on each side is
    for (let i = 0; i < 2000; i++) {
        let x, y;
        if (lastExitDirection === 'n' || lastExitDirection === 's') {
            // Vertical corridor, stars on left/right walls
            const side = Math.random() < 0.5 ? -1 : 1;
            x = corridor.x + (side * Math.random() * wallWidth) + (side < 0 ? 0 : corridor.width);
            y = corridor.y + Math.random() * corridor.height;
        } else {
            // Horizontal corridor, stars on top/bottom walls
            const side = Math.random() < 0.5 ? -1 : 1;
            x = corridor.x + Math.random() * corridor.width;
            y = corridor.y + (side * Math.random() * wallWidth) + (side < 0 ? 0 : corridor.height);
        }
        starfield.push({
            x: x,
            y: y,
            size: Math.random() * 2 + 1
        });
    }
}

function generateMap() {
    if (stage === 21) {
        generateFinalCorridor();
        return;
    }
    console.log(`[generateMap] Called for stage ${stage}`);
    map.corridors = [];
    const corridorWidth = 150;
    const corridorLength = 1000;
    const exitLength = 5;
    map.corridors.push({ x: map.centerX - corridorWidth / 2, y: map.centerY - corridorLength / 2, width: corridorWidth, height: corridorLength });
    map.corridors.push({ x: map.centerX - corridorLength / 2, y: map.centerY - corridorWidth / 2, width: corridorLength, height: corridorWidth });
    let possibleDirections = ['n', 's', 'w', 'e'];
    if (lastExitDirection) {
        possibleDirections = possibleDirections.filter(dir => dir !== lastExitDirection);
    }
    const exitDir = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
    lastExitDirection = exitDir;
    let exit;
    const halfCorridor = corridorLength / 2;
    if (exitDir === 'n') exit = { x: map.centerX - corridorWidth / 2, y: map.centerY - halfCorridor - exitLength, width: corridorWidth, height: exitLength, isExit: true };
    if (exitDir === 's') exit = { x: map.centerX - corridorWidth / 2, y: map.centerY + halfCorridor, width: corridorWidth, height: exitLength, isExit: true };
    if (exitDir === 'w') exit = { x: map.centerX - halfCorridor - exitLength, y: map.centerY - corridorWidth / 2, width: exitLength, height: corridorWidth, isExit: true };
    if (exitDir === 'e') exit = { x: map.centerX + halfCorridor, y: map.centerY - corridorWidth / 2, width: exitLength, height: corridorWidth, isExit: true };
    map.corridors.push(exit);
}

function drawPlayer() {
    ctx.fillStyle = colorScheme.player;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawMap() {
    map.corridors.forEach(corridor => {
        ctx.fillStyle = corridor.isExit ? colorScheme.exit : colorScheme.corridor;
        ctx.fillRect(corridor.x, corridor.y, corridor.width, corridor.height);
    });
}

function drawStarfield() {
    // Stars only appear after the blue flash, in the inverted world
    if (endingState < 2) return;
    ctx.fillStyle = colorScheme.star;
    starfield.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
}

function drawObstacle() {
    if (stage >= 21) return;
    const stageConfig = stageObstacles[stage] || stageObstacles[0];
    if (stageConfig.wings === 0) return;
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);
    ctx.rotate(obstacle.angle);
    ctx.fillStyle = colorScheme.obstacle;
    for (let i = 0; i < stageConfig.wings; i++) {
        ctx.save();
        ctx.rotate((i * 2 * Math.PI) / stageConfig.wings);
        ctx.fillRect(0, -stageConfig.thickness / 2, stageConfig.length / 2, stageConfig.thickness);
        ctx.restore();
    }
    ctx.restore();
}

function drawHUD() {
    if (endingState > 0) return;
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Stage: ${stage}`, 20, 40);
    const elapsedTime = ((Date.now() - stageStartTime) / 1000).toFixed(2);
    ctx.fillText(`Time: ${elapsedTime}`, 20, 70);
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
    if (stage >= 21) return;
    const stageConfig = stageObstacles[stage] || stageObstacles[0];
    if (stageConfig.wings === 0) return;
    obstacle.x = map.centerX;
    obstacle.y = map.centerY;
    obstacle.angle += stageConfig.speed;
}

function checkCollision() {
    if (stage >= 21) return;
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
            if (dist2 < playerRadius * playerRadius) { handleCollision(); return; }
            continue;
        }
        let t = ((player.x - p1.x) * (p2.x - p1.x) + (player.y - p1.y) * (p2.y - p1.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const closestPoint = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
        const dist2 = Math.pow(player.x - closestPoint.x, 2) + Math.pow(player.y - closestPoint.y, 2);
        if (dist2 < playerRadius * playerRadius) { handleCollision(); return; }
    }
}

function handleCollision() {
    console.log("Collision! Resetting to Stage 1.");
    stage = 1;
    endingState = 0;
    colorScheme = { ...normalColors }; // Reset colors on collision
    starfield = []; // Clear stars
    stageStartTime = Date.now();
    map.centerX = 0;
    map.centerY = 0;
    player.x = map.centerX - 300;
    player.y = map.centerY;
    obstacle.angle = 0;
    generateMap();
}

function checkStageCompletion() {
    if (stage >= 21) return;
    const exit = map.corridors.find(c => c.isExit);
    if (exit) {
        const playerLeft = player.x - player.size / 2;
        const playerRight = player.x + player.size / 2;
        const playerTop = player.y - player.size / 2;
        const playerBottom = player.y + player.size / 2;
        if (playerRight > exit.x && playerLeft < exit.x + exit.width &&
            playerBottom > exit.y && playerTop < exit.y + exit.height) {
            if (stage === 1) {
                console.log("Final Stage Cleared! Entering ending sequence.");
                stage = 21;
                finalTime = ((Date.now() - stageStartTime) / 1000).toFixed(2);
                generateMap();
                endingState = 1;
                endingStartTime = Date.now();
            } else {
                console.log("Stage complete!");
                stage++;
                generateMap();
            }
        }
    }
}

function update() {
    // Player movement is always active, even during the ending sequence
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

    // Game logic only runs if not in the ending sequence
    if (endingState === 0) {
        updateObstacle();
        checkCollision();
        checkStageCompletion();
    }
}

function drawJoystick() {
    if (endingState > 0) {
        joystickCtx.clearRect(0, 0, joystickCanvas.width, joystickCanvas.height);
        return;
    }
    if (!joystick.active) return;
    joystickCtx.clearRect(0, 0, joystickCanvas.width, joystickCanvas.height);
    joystickCtx.beginPath();
    joystickCtx.arc(joystick.x, joystick.y, joystick.radius, 0, Math.PI * 2);
    joystickCtx.fillStyle = 'rgba(128, 128, 128, 0.5)';
    joystickCtx.fill();
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

function drawEndingOverlay() {
    const elapsed = Date.now() - endingStartTime;

    // State 1: Blue flash effect (1s total), color inversion at peak
    if (endingState === 1) {
        const flashDuration = 1000;
        const halfFlash = flashDuration / 2;
        let blueAlpha = 0;

        if (elapsed < halfFlash) { // Fading in
            blueAlpha = elapsed / halfFlash;
        } else { // Fading out
            blueAlpha = 1 - ((elapsed - halfFlash) / halfFlash);
        }
        
        // Invert colors at the peak of the flash
        if (elapsed > halfFlash && colorScheme.background === normalColors.background) {
            console.log("Inverting colors");
            colorScheme = { ...invertedColors };
        }

        ctx.fillStyle = `rgba(0, 119, 255, ${blueAlpha})`; // #0077ff
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Transition to next state
        if (elapsed >= flashDuration) {
            endingState = 2;
            endingStartTime = Date.now();
        }
        return;
    }
    
    // State 2: Walk in the inverted world for a moment
    if (endingState === 2) {
        const walkDuration = 4000; // 4 seconds
        if (elapsed >= walkDuration) {
            endingState = 3;
            endingStartTime = Date.now();
        }
        return;
    }

    // State 3: Final whiteout and text
    if (endingState === 3) {
        const duration = 8000;
        const fadeToWhiteDuration = duration / 2;
        const whiteAlpha = Math.min(1, elapsed / fadeToWhiteDuration);
        ctx.fillStyle = `rgba(255, 255, 255, ${whiteAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const textDelay = duration / 2; // "...At last." 텍스트가 나타나기 시작하는 시간
        if (elapsed > textDelay) {
            const textElapsed = elapsed - textDelay;
            const textFadeDuration = duration / 2;
            const atLastAlpha = Math.min(1, textElapsed / textFadeDuration);

            ctx.fillStyle = `rgba(0, 0, 0, ${atLastAlpha})`;
            ctx.font = '48px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("...At last.", canvas.width / 2, canvas.height / 2 - 30);

            // "...At last." 텍스트가 완전히 나타나면 Final Time을 서서히 표시
            if (atLastAlpha >= 1) {
                const finalTimeDelay = textDelay + textFadeDuration; // 첫 텍스트 애니메이션이 끝나는 시간
                const finalTimeElapsed = elapsed - finalTimeDelay;
                const finalTimeFadeDuration = 4000; // 4초에 걸쳐 나타남
                const finalTimeAlpha = Math.min(1, finalTimeElapsed / finalTimeFadeDuration);

                ctx.fillStyle = `rgba(0, 0, 0, ${finalTimeAlpha})`;
                ctx.font = '24px sans-serif';
                ctx.fillText(`Time Trapped: ${finalTime}`, canvas.width / 2, canvas.height / 2 + 30);

                if (finalTimeAlpha >= 1) {
                    ctx.fillStyle = 'red';
                    ctx.font = '40px sans-serif';
                    ctx.fillText("Refresh to re-experience...", canvas.width / 2, canvas.height / 2 + 180);
                }
            }
        }
    }
}

function gameLoop() {
    // Clear canvas with the current background color
    ctx.fillStyle = colorScheme.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // World-space drawing (affected by camera)
    ctx.save();
    ctx.translate(canvas.width / 2 - player.x, canvas.height / 2 - player.y);
    drawMap();
    drawStarfield();
    drawObstacle();
    drawPlayer();
    ctx.restore();

    // Screen-space drawing (not affected by camera)
    drawHUD();
    if (endingState > 0) {
        drawEndingOverlay();
    }
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
    e.preventDefault();
    const speedChange = 0.1;
    const minSpeed = 0;
    const maxSpeed = 5;
    if (e.deltaY < 0) {
        player.speed = Math.min(maxSpeed, player.speed + speedChange);
    } else {
        player.speed = Math.max(minSpeed, player.speed - speedChange);
    }
    console.log(`Player speed: ${player.speed.toFixed(1)}`);
});

function handleJoystickMove(x, y) {
    if (!joystick.active) return;
    joystick.touchX = x;
    joystick.touchY = y;
    const dx = joystick.touchX - joystick.x;
    const dy = joystick.touchY - joystick.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx*dx + dy*dy);
    keys.w = false; keys.s = false; keys.a = false; keys.d = false;
    if (distance > joystick.radius / 4) {
        if (angle > -Math.PI * 0.75 && angle < -Math.PI * 0.25) { keys.w = true; }
        else if (angle > Math.PI * 0.25 && angle < Math.PI * 0.75) { keys.s = true; }
        if (angle > Math.PI * 0.75 || angle < -Math.PI * 0.75) { keys.a = true; }
        else if (angle < Math.PI * 0.25 && angle > -Math.PI * 0.25) { keys.d = true; }
    }
}

function stopJoystick() {
    joystick.active = false;
    joystickCtx.clearRect(0, 0, joystickCanvas.width, joystickCanvas.height);
    keys.w = false; keys.s = false; keys.a = false; keys.d = false;
}

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

joystickCanvas.addEventListener('touchend', (e) => { e.preventDefault(); stopJoystick(); });

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
    if (joystick.active) { stopJoystick(); }
});

// --- Game Initialization & Startup ---
document.addEventListener('DOMContentLoaded', () => {
    const storyModal = document.getElementById('story-modal');
    const startGameBtn = document.getElementById('start-game-btn');
    const storyText = document.getElementById('story-text');

    // 1. Fill the story text into the modal.
    if (storyText) {
        storyText.innerHTML = storyContent;
    }

    // 2. Add a listener to the start button.
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            // 3. When clicked, hide the modal.
            if (storyModal) {
                storyModal.style.display = 'none';
            }
            // 4. And start the game loop.
            console.log("Starting game loop");
            gameLoop(); 
        });
    }
});