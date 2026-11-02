// Power-up Entities and Spawner System
class PowerUp {
    constructor(id, type, x, y) {
        this.id = id;
        this.type = type; // 'speed', 'shield', 'knockback', 'jump', 'giant', 'star'
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.radius = 20;
        this.active = true;
        this.bobPhase = Math.random() * Math.PI * 2;
        this.spin = 0;
        this.respawnTimer = 0;
        this.respawnCooldown = 18; // Respawns after 18s

        // Type definitions
        this.config = this._getConfig(type);
    }

    _getConfig(type) {
        switch (type) {
            case 'speed':
                return {
                    name: 'Speed Shoes',
                    color: '#00f5d4',
                    glow: 'rgba(0, 245, 212, 0.5)',
                    icon: '⚡',
                    duration: 10
                };
            case 'shield':
                return {
                    name: 'Bubble Shield',
                    color: '#4cc9f0',
                    glow: 'rgba(76, 201, 240, 0.5)',
                    icon: '🛡️',
                    duration: 12
                };
            case 'knockback':
                return {
                    name: 'Mega Bash',
                    color: '#ffbe0b',
                    glow: 'rgba(255, 190, 11, 0.5)',
                    icon: '💥',
                    duration: 9
                };
            case 'jump':
                return {
                    name: 'Spring Boost',
                    color: '#70e000',
                    glow: 'rgba(112, 224, 0, 0.5)',
                    icon: '🦘',
                    duration: 11
                };
            case 'giant':
                return {
                    name: 'Mega Titan',
                    color: '#f72585',
                    glow: 'rgba(247, 37, 133, 0.5)',
                    icon: '🍄',
                    duration: 8
                };
            case 'star':
            default:
                return {
                    name: 'Star Frenzy',
                    color: '#fee440',
                    glow: 'rgba(254, 228, 64, 0.6)',
                    icon: '⭐',
                    duration: 8
                };
        }
    }

    update(dt) {
        if (!this.active) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
                this.active = true;
                // Randomize power-up type on respawn
                const types = ['speed', 'shield', 'knockback', 'jump', 'giant', 'star'];
                this.type = types[Math.floor(Math.random() * types.length)];
                this.config = this._getConfig(this.type);
            }
            return;
        }

        this.bobPhase += dt * 3;
        this.y = this.baseY + Math.sin(this.bobPhase) * 8;
        this.spin += dt * 2;
    }

    collect(character) {
        if (!this.active) return false;
        this.active = false;
        this.respawnTimer = this.respawnCooldown + Math.random() * 6;

        character.applyPowerUp(this.type, this.config);
        if (window.soundEngine) {
            window.soundEngine.playPowerup();
        }
        return true;
    }

    draw(ctx) {
        if (!this.active) {
            // Draw empty pedestal with countdown ring
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.ellipse(this.x, this.baseY + 14, 24, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        ctx.save();

        // Pedestal base shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.baseY + 16, 26, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outer pulsing aura
        const pulse = Math.sin(this.bobPhase * 1.5) * 4;
        const grad = ctx.createRadialGradient(this.x, this.y, 4, this.x, this.y, this.radius + 12 + pulse);
        grad.addColorStop(0, this.config.glow);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 12 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Orb body
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Shiny highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.arc(this.x - 6, this.y - 6, 6, 0, Math.PI * 2);
        ctx.fill();

        // Icon text
        ctx.font = 'bold 20px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.config.icon, this.x, this.y + 1);

        ctx.restore();
    }
}

class PowerUpManager {
    constructor(arena) {
        this.arena = arena;
        this.powerups = [];
        this.init();
    }

    init() {
        this.powerups = [];
        const types = ['speed', 'giant', 'shield', 'knockback', 'jump', 'star', 'giant'];
        for (let i = 0; i < this.arena.powerupSpawns.length; i++) {
            const spawn = this.arena.powerupSpawns[i];
            const type = types[i % types.length];
            this.powerups.push(new PowerUp(`pup_${i}`, type, spawn.x, spawn.y));
        }
    }

    update(dt) {
        for (let i = 0; i < this.powerups.length; i++) {
            this.powerups[i].update(dt);
        }
    }

    checkCollisions(character) {
        if (!character.isAlive) return;
        const charR = character.radius;
        for (let i = 0; i < this.powerups.length; i++) {
            const pup = this.powerups[i];
            if (!pup.active) continue;
            const dx = character.x - pup.x;
            const dy = character.y - pup.y;
            const distSq = dx * dx + dy * dy;
            const totalR = charR + pup.radius;
            if (distSq <= totalR * totalR) {
                pup.collect(character);
            }
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.powerups.length; i++) {
            this.powerups[i].draw(ctx);
        }
    }
}

window.PowerUpManager = PowerUpManager;
