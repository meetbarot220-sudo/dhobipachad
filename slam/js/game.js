// Core Game Engine: 60-Second 4-Character Squish Survival Match
class SquishGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.setupCanvas();

        // Game Systems
        this.arena = new Arena();
        this.particleSystem = new ParticleSystem(300, 40);
        window.particleSystem = this.particleSystem;

        this.camera = new Camera(this.canvas, this.arena);
        window.camera = this.camera;

        this.aiController = new BotAIController();
        this.input = new InputManager();

        // Match State
        this.matchState = 'playing'; // 'playing', 'gameover', 'victory'
        this.matchDuration = 60.0;
        this.timeRemaining = 60.0;
        this.score = 0;
        this.playerLives = 3;
        this.comboCount = 0;
        this.comboTimer = 0;

        // Characters (Exactly 4: 1 Player + 3 Enemy Bots)
        this.player = null;
        this.bots = [];
        this.characters = [];

        // Respawn queue for dead characters
        this.respawnQueue = [];

        window.addEventListener('resize', () => this.setupCanvas());
        this.setupUI();
        this.startMatch();

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupUI() {
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.startMatch());
        }

        const victoryBtn = document.getElementById('victory-restart-btn');
        if (victoryBtn) {
            victoryBtn.addEventListener('click', () => this.startMatch());
        }

        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                if (window.soundEngine) {
                    const isMuted = window.soundEngine.toggleMute();
                    muteBtn.textContent = isMuted ? '🔇' : '🔊';
                    muteBtn.classList.toggle('muted', isMuted);
                }
            });
        }
    }

    startMatch() {
        this.matchState = 'playing';
        this.timeRemaining = 60.0;
        this.score = 0;
        this.playerLives = 3;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.respawnQueue = [];

        // Hide overlay screens
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('victory-screen').classList.add('hidden');

        // Spawn Characters: 1 Player (RED) + 3 Bots (GREEN, BLUE, YELLOW)
        this.spawnCharacters();
        this.updateHUD();
    }

    spawnCharacters() {
        this.characters = [];
        this.bots = [];

        // 1. RED PLAYER
        this.player = new Character(0, true, '#ff1744', 'YOU', 600, 430);
        this.characters.push(this.player);

        // 2. GREEN BOT (#00e676)
        const bot1 = new Character(1, false, '#00e676', 'Green Bot', 250, 310);
        this.bots.push(bot1);
        this.characters.push(bot1);

        // 3. BLUE BOT (#00b0ff)
        const bot2 = new Character(2, false, '#00b0ff', 'Blue Bot', 950, 310);
        this.bots.push(bot2);
        this.characters.push(bot2);

        // 4. YELLOW BOT (#ffd600)
        const bot3 = new Character(3, false, '#ffd600', 'Yellow Bot', 600, 180);
        this.bots.push(bot3);
        this.characters.push(bot3);
    }

    onPlayerDied() {
        this.playerLives--;
        this.updateHUD();

        if (this.playerLives <= 0) {
            // STOP THE GAME IMMEDIATELY
            this.triggerGameOver();
        } else {
            // Schedule Player Respawn after 1.2s
            this.respawnQueue.push({
                character: this.player,
                timer: 1.2,
                invuln: 2.2,
                spawnX: 600,
                spawnY: 430
            });
        }
    }

    onBotDied(bot, killedByPlayer = false) {
        if (killedByPlayer) {
            // Combo and Score only awarded when the PLAYER kills the bot
            this.comboCount++;
            this.comboTimer = 3.0; // 3 seconds window to chain combos
            const pts = 100 * this.comboCount;
            this.score += pts;

            const comboText = this.comboCount > 1 ? `+${pts} COMBO x${this.comboCount}!` : `+${pts}`;
            if (window.particleSystem) {
                window.particleSystem.addFloatingText(comboText, bot.x, bot.y - 35, bot.color, this.comboCount > 1 ? 1.3 : 1.1);
            }
            this.updateHUD();
        } else {
            // Bot was squished by another bot!
            if (window.particleSystem) {
                window.particleSystem.addFloatingText('SQUISHED!', bot.x, bot.y - 35, bot.color, 1.1);
            }
        }

        // Prevent duplicate queue entries for the same bot
        if (this.respawnQueue.some(item => item.character.id === bot.id)) {
            return;
        }

        // Infinite bot respawn after 0.5-1.5s (1.0s delay)
        // Bot retains its original identity, color, and properties
        const spawnPt = this.arena.getRandomSpawnPoint();
        this.respawnQueue.push({
            character: bot,
            timer: 1.0,
            invuln: 1.2,
            spawnX: spawnPt.x,
            spawnY: spawnPt.y
        });
    }

    triggerGameOver() {
        this.matchState = 'gameover';
        if (window.soundEngine) window.soundEngine.playGameOver();

        const goScreen = document.getElementById('game-over-screen');
        const statsEl = document.getElementById('game-over-stats');
        if (statsEl) {
            statsEl.textContent = `FINAL SCORE: ${this.score} | Time Survived: ${Math.floor(60 - this.timeRemaining)}s`;
        }
        goScreen.classList.remove('hidden');
    }

    triggerVictory() {
        this.matchState = 'victory';
        if (window.soundEngine) window.soundEngine.playVictory();

        const vicScreen = document.getElementById('victory-screen');
        const statsEl = document.getElementById('victory-stats');
        if (statsEl) {
            statsEl.textContent = `FINAL SCORE: ${this.score} | Lives Left: ${this.playerLives}`;
        }
        vicScreen.classList.remove('hidden');
    }

    updateCollisions() {
        if (this.matchState !== 'playing') return;

        // Check Stomp and Collisions between all 4 characters
        for (let i = 0; i < this.characters.length; i++) {
            const c1 = this.characters[i];
            if (!c1.isAlive) continue;

            for (let j = i + 1; j < this.characters.length; j++) {
                const c2 = this.characters[j];
                if (!c2.isAlive) continue;

                const dx = c2.x - c1.x;
                const dy = c2.y - c1.y;
                const distSq = dx * dx + dy * dy;
                const minDist = c1.radius + c2.radius;

                if (distSq < minDist * minDist && distSq > 0.0001) {
                    const dist = Math.sqrt(distSq);
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // Stomp Detection:
                    // Character A is falling down onto Character B:
                    // - A is moving downward (vy > 20)
                    // - A is higher in the arena (c1.y < c2.y - 12)
                    // - Target is not currently invulnerable

                    const stompThreshold = 12;

                    // Case 1: c1 stomps c2
                    if (c1.vy > 30 && c1.y < c2.y - stompThreshold && c2.invulnerableTimer <= 0) {
                        c2.squish(c1);
                        c1.vy = -560; // Huge bouncy upward rebound!
                        c1.canDoubleJump = true;
                        c1.triggerSquash(0.6, 1.55);

                        if (c2.isPlayer) {
                            this.onPlayerDied();
                        } else if (c1.isPlayer) {
                            this.onBotDied(c2, true); // true = killed by player (gives score)
                        } else {
                            this.onBotDied(c2, false); // false = bot killed by bot (respawns!)
                        }
                        continue;
                    }

                    // Case 2: c2 stomps c1
                    if (c2.vy > 30 && c2.y < c1.y - stompThreshold && c1.invulnerableTimer <= 0) {
                        c1.squish(c2);
                        c2.vy = -560;
                        c2.canDoubleJump = true;
                        c2.triggerSquash(0.6, 1.55);

                        if (c1.isPlayer) {
                            this.onPlayerDied();
                        } else if (c2.isPlayer) {
                            this.onBotDied(c1, true); // true = killed by player (gives score)
                        } else {
                            this.onBotDied(c1, false); // false = bot killed by bot (respawns!)
                        }
                        continue;
                    }

                    // Case 3: Horizontal Bump (Side collision)
                    // Elastic repulsion so characters shove and bounce off each other without dying!
                    const overlap = minDist - dist;
                    const push = overlap * 0.5;
                    c1.x -= nx * push;
                    c1.y -= ny * push;
                    c2.x += nx * push;
                    c2.y += ny * push;

                    const relVx = c2.vx - c1.vx;
                    const relVy = c2.vy - c1.vy;
                    const dot = relVx * nx + relVy * ny;
                    if (dot < 0) {
                        const impulse = dot * 0.6;
                        c1.vx += nx * impulse;
                        c1.vy += ny * impulse;
                        c2.vx -= nx * impulse;
                        c2.vy -= ny * impulse;
                    }
                }
            }
        }
    }

    gameLoop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;

        if (this.matchState === 'playing') {
            // Countdown timer
            this.timeRemaining -= dt;
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.triggerVictory();
            }

            // Combo timer
            if (this.comboTimer > 0) {
                this.comboTimer -= dt;
                if (this.comboTimer <= 0) {
                    this.comboCount = 0;
                }
            }

            // Process Respawn Queue
            for (let i = this.respawnQueue.length - 1; i >= 0; i--) {
                const item = this.respawnQueue[i];
                item.timer -= dt;
                if (item.timer <= 0) {
                    item.character.respawn(item.spawnX, item.spawnY, item.invuln);
                    this.respawnQueue.splice(i, 1);
                }
            }

            // 1. Player Input
            this.input.update(this.player, dt);

            // 2. AI for 3 Enemy Bots
            for (let i = 0; i < this.bots.length; i++) {
                this.aiController.update(this.bots[i], this.player, this.arena, dt);
            }

            // 3. Update Character Physics
            for (let i = 0; i < this.characters.length; i++) {
                this.characters[i].update(dt, this.arena);
            }

            // 4. Stomp & Crowd Collisions
            this.updateCollisions();

            this.updateHUD();
        }

        // Arena background animation (motes & subtle lighting)
        this.arena.update(dt);

        // Camera & Particles
        this.camera.update(this.player, dt);
        this.particleSystem.update(dt);

        // Render
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply Camera Transform
        this.camera.apply(this.ctx);

        // 1. Draw Arena Geometry
        this.arena.draw(this.ctx);

        // 2. Draw 4 Characters
        for (let i = 0; i < this.characters.length; i++) {
            this.characters[i].draw(this.ctx);
        }

        // 3. Draw Impact & Splat Particles
        this.particleSystem.draw(this.ctx);

        this.camera.restore(this.ctx);
    }

    updateHUD() {
        // Timer display (e.g. "60", "59", "08")
        const timerEl = document.getElementById('match-timer');
        if (timerEl) {
            const secs = Math.ceil(this.timeRemaining);
            timerEl.textContent = secs < 10 ? `0${secs}` : `${secs}`;
            if (secs <= 10) {
                timerEl.style.color = '#ff1744';
                timerEl.style.animation = 'pulse-timer 0.5s infinite alternate';
            } else {
                timerEl.style.color = '#ffd166';
                timerEl.style.animation = 'none';
            }
        }

        // Score display
        const scoreEl = document.getElementById('score-display');
        if (scoreEl) {
            scoreEl.textContent = `SCORE: ${this.score.toString().padStart(4, '0')}`;
        }

        // Lives display (3 Hearts: ❤️❤️❤️, ❤️❤️🖤, ❤️🖤🖤, 🖤🖤🖤)
        const livesEl = document.getElementById('lives-display');
        if (livesEl) {
            let hearts = '';
            for (let i = 1; i <= 3; i++) {
                hearts += (i <= this.playerLives) ? '❤️' : '🖤';
            }
            livesEl.textContent = hearts;
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new SquishGame();
});
