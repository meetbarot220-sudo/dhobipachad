// Lightweight Particle and Floating Text Engine with Object Pooling
class Particle {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = 4;
        this.color = '#fff';
        this.alpha = 1;
        this.life = 1;
        this.maxLife = 1;
        this.gravity = 500;
        this.drag = 0.96;
        this.isRing = false;
        this.ringRadius = 0;
        this.maxRingRadius = 40;
    }

    init(x, y, vx, vy, radius, color, life, gravity = 500, isRing = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.gravity = gravity;
        this.drag = 0.95;
        this.alpha = 1;
        this.isRing = isRing;
        this.ringRadius = radius;
        this.maxRingRadius = radius * 3.5;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return;
        }

        const progress = 1 - (this.life / this.maxLife);
        this.alpha = Math.max(0, 1 - progress);

        if (this.isRing) {
            this.ringRadius += (this.maxRingRadius - this.ringRadius) * dt * 10;
        } else {
            this.vx *= Math.pow(this.drag, dt * 60);
            this.vy += this.gravity * dt;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }
    }

    draw(ctx) {
        if (!this.active || this.alpha <= 0.01) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        if (this.isRing) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = Math.max(1, 4 * (1 - this.ringRadius / this.maxRingRadius));
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.ringRadius, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(1, this.radius * (this.life / this.maxLife)), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class FloatingText {
    constructor() {
        this.active = false;
        this.text = '';
        this.x = 0;
        this.y = 0;
        this.vy = -60;
        this.life = 0;
        this.maxLife = 0.8;
        this.color = '#fff';
        this.scale = 1;
    }

    init(text, x, y, color = '#fff', scale = 1) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.vy = -60;
        this.life = 0.75;
        this.maxLife = 0.75;
        this.color = color;
        this.scale = scale;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return;
        }
        this.y += this.vy * dt;
    }

    draw(ctx) {
        if (!this.active) return;
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${Math.round(18 * this.scale)}px "Segoe UI", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.lineWidth = 4;
        ctx.strokeText(this.text, this.x, this.y);

        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class ParticleSystem {
    constructor(maxParticles = 600, maxTexts = 60) {
        this.particles = [];
        for (let i = 0; i < maxParticles; i++) {
            this.particles.push(new Particle());
        }
        this.texts = [];
        for (let i = 0; i < maxTexts; i++) {
            this.texts.push(new FloatingText());
        }
    }

    getParticle() {
        for (let i = 0; i < this.particles.length; i++) {
            if (!this.particles[i].active) return this.particles[i];
        }
        return null;
    }

    getText() {
        for (let i = 0; i < this.texts.length; i++) {
            if (!this.texts[i].active) return this.texts[i];
        }
        return null;
    }

    spawnImpact(x, y, color = '#ffeb3b', count = 8, isHeavy = false) {
        // Shockwave ring
        const ring = this.getParticle();
        if (ring) {
            ring.init(x, y, 0, 0, isHeavy ? 20 : 12, color, isHeavy ? 0.28 : 0.18, 0, true);
        }

        const num = isHeavy ? count * 1.5 : count;
        for (let i = 0; i < num; i++) {
            const p = this.getParticle();
            if (!p) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 250 + 100) * (isHeavy ? 1.5 : 1);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const radius = Math.random() * 4 + 2;
            p.init(x, y, vx, vy, radius, color, Math.random() * 0.25 + 0.2, 400);
        }
    }

    spawnSquishBurst(x, y, color = '#ff2e51', count = 22) {
        // Splat burst when someone is squished or eliminated
        const ring = this.getParticle();
        if (ring) {
            ring.init(x, y, 0, 0, 24, '#ffffff', 0.35, 0, true);
        }

        for (let i = 0; i < count; i++) {
            const p = this.getParticle();
            if (!p) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 380 + 120;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 120;
            const radius = Math.random() * 6 + 3;
            const life = Math.random() * 0.45 + 0.35;
            p.init(x, y, vx, vy, radius, color, life, 700);
        }
    }

    spawnDust(x, y, count = 4) {
        for (let i = 0; i < count; i++) {
            const p = this.getParticle();
            if (!p) break;
            const vx = (Math.random() - 0.5) * 120;
            const vy = -Math.random() * 50 - 10;
            p.init(x, y, vx, vy, Math.random() * 4 + 2, 'rgba(255, 255, 255, 0.6)', 0.22, 100);
        }
    }

    spawnDashTrail(x, y, radius, color) {
        const p = this.getParticle();
        if (p) {
            p.init(x, y, 0, 0, radius, color, 0.16, 0);
        }
    }

    addFloatingText(text, x, y, color = '#fff', scale = 1) {
        const t = this.getText();
        if (t) {
            t.init(text, x, y, color, scale);
        }
    }

    update(dt) {
        for (let i = 0; i < this.particles.length; i++) {
            if (this.particles[i].active) {
                this.particles[i].update(dt);
            }
        }
        for (let i = 0; i < this.texts.length; i++) {
            if (this.texts[i].active) {
                this.texts[i].update(dt);
            }
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.particles.length; i++) {
            if (this.particles[i].active) {
                this.particles[i].draw(ctx);
            }
        }
        for (let i = 0; i < this.texts.length; i++) {
            if (this.texts[i].active) {
                this.texts[i].draw(ctx);
            }
        }
    }
}

window.ParticleSystem = ParticleSystem;
