const GAME_SCALE = 0.65;
let VELOCITY_SCALE = 0.41; 
const BG_STAR_COUNT = 970;

class Ship {
    constructor() {
        this.worldX = innerWidth / 2;
        this.screenY = innerHeight / 2;
        this.camX = 0;
        this.shipScreenX = 0;
        this.angle = -Math.PI / 2;
        this.vx = 0;
        this.vy = 0;
        this.thrusting = false;

        const baseSize = 35 * GAME_SCALE;
        this.halfW = baseSize;
        this.halfH = baseSize;

        this.bodyPoints = [
            [35 * GAME_SCALE, 0],
            [8 * GAME_SCALE, -18 * GAME_SCALE],
            [-8 * GAME_SCALE, -18 * GAME_SCALE],
            [-22 * GAME_SCALE, -12 * GAME_SCALE],
            [-22 * GAME_SCALE, 12 * GAME_SCALE],
            [-8 * GAME_SCALE, 18 * GAME_SCALE],
            [8 * GAME_SCALE, 18 * GAME_SCALE]
        ];

        this.flamePoints = [
            [-30 * GAME_SCALE, -8 * GAME_SCALE],
            [-30 * GAME_SCALE, 8 * GAME_SCALE],
            [-50 * GAME_SCALE, 0]
        ];
    }

    update(keys) {
        // Rotation
        const rotSpeed = 0.1;
        if (keys.ArrowLeft) this.angle -= rotSpeed;
        if (keys.ArrowRight) this.angle += rotSpeed;

        // Thrust
        if (keys.ArrowUp) {
            const thrust = 0.5;
            this.vx += Math.cos(this.angle) * thrust;
            this.vy += Math.sin(this.angle) * thrust;
            this.thrusting = true;
        } else {
            this.thrusting = false;
        }

        // Gravity
        this.vy += 0.18;

        // Drag (adjusted for frame rate)
        this.vx *= 0.991;
        this.vy *= 0.991;

        // Max speed
        const maxSpeed = 15 * VELOCITY_SCALE;
        this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));
        this.vy = Math.max(-maxSpeed, Math.min(maxSpeed, this.vy));

        // Position update
        this.worldX += this.vx;
        this.screenY += this.vy;

        this.camX = Math.max(0, this.worldX - innerWidth / 2);
        this.shipScreenX = this.worldX - this.camX;

        // Horizontal bounce
        if (this.shipScreenX < this.halfW) {
            this.worldX = this.camX + this.halfW;
            this.vx *= -0.4;
        }
        if (this.shipScreenX > innerWidth - this.halfW) {
            this.worldX = this.camX + (innerWidth - this.halfW);
            this.vx *= -0.4;
        }

        // Bottom bounce
        if (this.screenY > innerHeight - this.halfH) {
            this.screenY = innerHeight - this.halfH;
            this.vy *= -0.3;
        }
    }

    getRotatedPoints(points) {
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        return points.map(([x, y]) => [
            x * cos - y * sin,
            x * sin + y * cos
        ]);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.shipScreenX, this.screenY);

        // Body
        const body = this.getRotatedPoints(this.bodyPoints);
        ctx.fillStyle = '#0064ff';
        ctx.beginPath();
        ctx.moveTo(body[0][0], body[0][1]);
        for (let i = 1; i < body.length; i++) {
            ctx.lineTo(body[i][0], body[i][1]);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2 * GAME_SCALE;
        ctx.stroke();

        // Flame
        if (this.thrusting) {
            const flame = this.getRotatedPoints(this.flamePoints);
            ctx.fillStyle = 'orange';
            ctx.beginPath();
            ctx.moveTo(flame[0][0], flame[0][1]);
            for (let i = 1; i < flame.length; i++) {
                ctx.lineTo(flame[i][0], flame[i][1]);
            }
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}

class Obstacle {
    constructor(spawnX) {
        this.worldX = spawnX;
        const baseW = Math.random() * 80 + 80;
        const baseH = Math.random() * 80 + 80;
        this.width = baseW * GAME_SCALE;
        this.height = baseH * GAME_SCALE;
        this.screenY = Math.random() * (innerHeight - this.height);
        this.screenX = 0;
    }

    update(camX, speed) {
        this.worldX -= speed;
        this.screenX = this.worldX - camX;
        return this.screenX + this.width > 0;
    }

    draw(ctx) {
        ctx.fillStyle = 'green';
        ctx.fillRect(this.screenX, this.screenY, this.width, this.height);
        ctx.fillStyle = '#c80000';
        ctx.fillRect(this.screenX + 20 * GAME_SCALE, this.screenY + 20 * GAME_SCALE, this.width - 40 * GAME_SCALE, this.height - 40 * GAME_SCALE);
    }

    collidesWith(ship) {
        return (
            ship.shipScreenX - ship.halfW < this.screenX + this.width &&
            ship.shipScreenX + ship.halfW > this.screenX &&
            ship.screenY - ship.halfH < this.screenY + this.height &&
            ship.screenY + ship.halfH > this.screenY
        );
    }
}

class Star {
    constructor(spawnX) {
        this.worldX = spawnX;
        this.screenY = Math.random() * (innerHeight - 20 * GAME_SCALE);
        const baseSpeed = Math.random() * 2 + 4.5;
        this.speed = baseSpeed * VELOCITY_SCALE;
        const baseSize = Math.random() * 4 + 4;
        this.size = baseSize * GAME_SCALE;
        this.screenX = 0;
    }

    update(camX) {
        this.worldX -= this.speed;
        this.screenX = this.worldX - camX;
        return this.screenX + this.size > 0;
    }

    draw(ctx) {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.screenX + this.size / 2, this.screenY + this.size / 2, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    collidesWith(ship) {
        const dx = ship.shipScreenX - (this.screenX + this.size / 2);
        const dy = ship.screenY - (this.screenY + this.size / 2);
        return Math.hypot(dx, dy) < ship.halfW;
    }
}

// Game state
let ship, obstacles, stars, bgStars;
let score = 0, lives = 1, level = 1;
let obsSpawnTimer = 0, starSpawnTimer = 0;
let gameOver = false, win = false;
let gameRunning = true;

function resetGame() {
    ship = new Ship();
    obstacles = [];
    stars = [];
    bgStars = Array.from({ length: BG_STAR_COUNT }, () => [
        Math.random() * innerWidth,
        Math.random() * innerHeight,
        (Math.random() * 2.5 + 1) * VELOCITY_SCALE
    ]);
    score = 0;
    lives = 1;
    level = 1;
    obsSpawnTimer = 0;
    starSpawnTimer = 0;
    gameOver = false;
    win = false;
    gameRunning = true;
}


const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
resize();
window.addEventListener('resize', resize);

// Input
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if ((gameOver || win) && (e.key.toLowerCase() === 'r')) {
        resetGame();
    } else if ((gameOver || win) && (e.key === 'Escape' || e.key.toLowerCase() === 'q')) {
        gameRunning = false;
    }
});
window.addEventListener('keyup', e => {
    keys[e.key] = false;
});

// Main loop
let lastTime = 0;
function loop(time) {
    if (!gameRunning) return;

    if (!lastTime) lastTime = time;
    const dt = (time - lastTime) / 16.67; // Normalize to ~60fps
    lastTime = time;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Background stars (fixed recompute sx after reset)
    bgStars.forEach(star => {
        star[0] -= star[2];
        let sx = star[0] - ship.camX;
        if (sx < -10) {
            star[0] = ship.camX + canvas.width + Math.random() * 100;
            star[1] = Math.random() * canvas.height;
            sx = star[0] - ship.camX; // Recompute after reset
        }
        ctx.fillStyle = 'white';
        ctx.fillRect(sx, star[1], 1, 1);
    });

    if (!gameOver && !win) {
        ship.update(keys);

        // Die on ceiling
        if (ship.screenY - ship.halfH <= 0) {
            lives--;
            if (lives <= 0) gameOver = true;
        }
                if (ship.screenx - ship.halfH <= 0) {
            lives--;
            if (lives <= 0) gameOver = true;
        }

        
        obsSpawnTimer += 0.8 * VELOCITY_SCALE ;
        let spawnRate = Math.max(35 - (level * 3.5), 15);
        if (obsSpawnTimer > spawnRate) {
            const spawnX = ship.camX + canvas.width + (Math.random() * 100 + 50);
            obstacles.push(new Obstacle(spawnX));
            obsSpawnTimer = 0;
        }

        // Spawn stars (less frequent)
        starSpawnTimer += 1 * VELOCITY_SCALE;
        const starSpawnThreshold = 70;
        if (starSpawnTimer > starSpawnThreshold) {
            const spawnX = ship.camX + canvas.width + (Math.random() * 300 + 100);
            stars.push(new Star(spawnX));
            starSpawnTimer = 0;
        }

        // Update obstacles (fixed speeds)
        const obsSpeed = (5.5 + (level * 1.8)) * VELOCITY_SCALE;
        obstacles = obstacles.filter(obs => {
            if (!obs.update(ship.camX, obsSpeed)) {
                score += 20;
                return false;
            }
            if (obs.collidesWith(ship)) {
                lives--;
                if (lives <= 0) gameOver = true;
                return false;
            }
            obs.draw(ctx);
            return true;
        });

        // Update stars (FIXED: correct filter logic)
        stars = stars.filter(star => {
            if (!star.update(ship.camX)) {
                return false;
            }
            if (star.collidesWith(ship)) {
                score += 100;
                return false;
            }
            star.draw(ctx);
            return true;
        });

        // Level up
        const newLevel = Math.min(1 + Math.floor(score / 1500), 3);
        if (newLevel > level) level = newLevel;
        // Win
        if (score >= 4200) win = true;
    }
    if (level == 1){
        VELOCITY_SCALE = .41}
    if (level == 2 ){
        VELOCITY_SCALE = .55}
    if (level == 3 );{
        VELOCITY_SCALE = .71}

    // Draw ship
    ship.draw(ctx);

    // UI (scaled)
    const fontSize = Math.floor(canvas.height / 20 * GAME_SCALE);
    const smallFontSize = Math.floor(canvas.height / 35 * GAME_SCALE);
    const uiMarginX = 30 * GAME_SCALE;
    const uiMarginY = 40 * GAME_SCALE;
    const lineHeight = fontSize + 10 * GAME_SCALE;

    ctx.fillStyle = 'white';
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'start';
    ctx.fillText(`Score: ${score}`, uiMarginX, uiMarginY);
    ctx.fillText(`Lives: ${lives}`, uiMarginX, uiMarginY + lineHeight);
    ctx.fillText(`Level: ${level}`, uiMarginX, uiMarginY + lineHeight * 2);

    if (gameOver || win) {
        const bigFontSize = Math.floor(canvas.height / 15 * GAME_SCALE);
        ctx.fillStyle = gameOver ? 'red' : 'lime';
        ctx.font = `${bigFontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(gameOver ? 'GAME OVER!' : 'YOU WIN! Rocket Master!', canvas.width / 2, canvas.height / 2 - 80 * GAME_SCALE);
        ctx.fillStyle = 'white';
        ctx.font = `${fontSize}px Arial`;
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 - 20 * GAME_SCALE);
        ctx.font = `${smallFontSize}px Arial`;
        ctx.fillText('R: Restart | ESC/Q: Quit', canvas.width / 2, canvas.height / 2 + 40 * GAME_SCALE);
        ctx.textAlign = 'start';
        level = 1
    } else {
        ctx.font = `${smallFontSize}px Arial`;
        ctx.fillText('LEFT/RIGHT: Rotate | UP: Thrust', uiMarginX, canvas.height - 60 * GAME_SCALE);
        ctx.fillText('(Gravity pulls down! Dodge & Collect!)', uiMarginX, canvas.height - 30 * GAME_SCALE);
    }
    
    requestAnimationFrame(loop);
}
resetGame();
requestAnimationFrame(loop);