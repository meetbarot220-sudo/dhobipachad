// Polyfill for CanvasRenderingContext2D.prototype.roundRect
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
        if (!radii) radii = 0;
        if (typeof radii === 'number') radii = [radii, radii, radii, radii];
        const r1 = radii[0] || 0;
        const r2 = radii[1] || r1;
        const r3 = radii[2] || r1;
        const r4 = radii[3] || r2;
        this.moveTo(x + r1, y);
        this.lineTo(x + w - r2, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r2);
        this.lineTo(x + w, y + h - r3);
        this.quadraticCurveTo(x + w, y + h, x + w - r3, y + h);
        this.lineTo(x + r4, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r4);
        this.lineTo(x, y + r1);
        this.quadraticCurveTo(x, y, x + r1, y);
        return this;
    };
}

// Compact Arcade Arena with polished synthwave atmosphere, platforms, and spawn points
class Arena {
    constructor() {
        this.width = 1200;
        this.height = 750;

        // Outer boundaries (Solid enclosing walls and ceiling)
        this.walls = [
            // Left Wall
            { x: 30, y: 0, w: 40, h: 750, color: '#1a103c' },
            // Right Wall
            { x: 1130, y: 0, w: 40, h: 750, color: '#1a103c' },
            // Ceiling
            { x: 30, y: 20, w: 1140, h: 30, color: '#1a103c' }
        ];

        // Platforms layout: compact, multi-level for frequent jump encounters
        this.platforms = [
            // Main Bottom Ground
            { id: 'floor', x: 70, y: 680, w: 1060, h: 50, type: 'solid', color: '#2d1b69', topColor: '#00f5d4' },

            // Lower Side Ledges
            { id: 'lower_left', x: 120, y: 530, w: 260, h: 22, type: 'jumpthrough', color: '#44318d', topColor: '#ff007f' },
            { id: 'lower_right', x: 820, y: 530, w: 260, h: 22, type: 'jumpthrough', color: '#44318d', topColor: '#ff007f' },

            // Center Floating Battle Stage
            { id: 'center_stage', x: 420, y: 470, w: 360, h: 24, type: 'jumpthrough', color: '#3a0ca3', topColor: '#fee440' },

            // Mid Side Platforms
            { id: 'mid_left', x: 180, y: 350, w: 240, h: 22, type: 'jumpthrough', color: '#560bad', topColor: '#00f5d4' },
            { id: 'mid_right', x: 780, y: 350, w: 240, h: 22, type: 'jumpthrough', color: '#560bad', topColor: '#00f5d4' },

            // Top Crown Overpass
            { id: 'top_center', x: 450, y: 220, w: 300, h: 22, type: 'jumpthrough', color: '#7209b7', topColor: '#ffbe0b' },

            // High Corner Perches
            { id: 'high_left', x: 90, y: 190, w: 170, h: 20, type: 'jumpthrough', color: '#480ca8', topColor: '#ff007f' },
            { id: 'high_right', x: 940, y: 190, w: 170, h: 20, type: 'jumpthrough', color: '#480ca8', topColor: '#ff007f' }
        ];

        // Respawn spots (safe elevated points)
        this.spawnPoints = [
            { x: 600, y: 440 }, // Center
            { x: 250, y: 320 }, // Left Mid
            { x: 950, y: 320 }, // Right Mid
            { x: 600, y: 190 }, // Top Center
            { x: 170, y: 160 }, // High Left
            { x: 1020, y: 160 } // High Right
        ];

        // Atmospheric Background: Floating ambient dust motes / glowing particles
        this.ambientMotes = [];
        const moteColors = ['#00f5d4', '#f72585', '#7209b7', '#4cc9f0', '#fee440'];
        for (let i = 0; i < 35; i++) {
            this.ambientMotes.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 2.2 + 1.2,
                speedY: Math.random() * 16 + 10,
                speedX: (Math.random() - 0.5) * 8,
                phase: Math.random() * Math.PI * 2,
                color: moteColors[Math.floor(Math.random() * moteColors.length)],
                alpha: Math.random() * 0.25 + 0.15
            });
        }
        this.bgTime = 0;
    }

    getRandomSpawnPoint() {
        const pt = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
        return { x: pt.x + (Math.random() * 40 - 20), y: pt.y };
    }

    update(dt) {
        this.bgTime += dt;
        for (let i = 0; i < this.ambientMotes.length; i++) {
            const m = this.ambientMotes[i];
            m.y -= m.speedY * dt;
            m.x += Math.sin(this.bgTime * 1.5 + m.phase) * (m.speedX * dt * 4);
            if (m.y < 30) {
                m.y = this.height - 30;
                m.x = Math.random() * this.width;
            }
        }
    }

    draw(ctx) {
        ctx.save();

        // 1. Polished Deep Blue/Purple Gradient Background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
        bgGrad.addColorStop(0, '#09041a');   // Deep space violet
        bgGrad.addColorStop(0.35, '#13092e'); // Midnight arcade purple
        bgGrad.addColorStop(0.75, '#1f0f47'); // Soft indigo
        bgGrad.addColorStop(1, '#2d145c');   // Warm neon glow horizon
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. Soft Atmospheric Center Spotlight Glow
        const centerGlow = ctx.createRadialGradient(this.width / 2, 420, 50, this.width / 2, 420, 550);
        centerGlow.addColorStop(0, 'rgba(114, 9, 183, 0.28)');
        centerGlow.addColorStop(0.5, 'rgba(67, 97, 238, 0.12)');
        centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = centerGlow;
        ctx.fillRect(0, 0, this.width, this.height);

        // 3. Subtle Diagonal God Rays / Volumetric Light Shafts
        const beamPulse = Math.sin(this.bgTime * 0.8) * 0.012 + 0.038;
        ctx.save();
        ctx.fillStyle = `rgba(180, 160, 255, ${beamPulse})`;
        // Left Light Beam
        ctx.beginPath();
        ctx.moveTo(180, 0);
        ctx.lineTo(340, 0);
        ctx.lineTo(580, this.height);
        ctx.lineTo(380, this.height);
        ctx.closePath();
        ctx.fill();
        // Right Light Beam
        ctx.beginPath();
        ctx.moveTo(860, 0);
        ctx.lineTo(1020, 0);
        ctx.lineTo(820, this.height);
        ctx.lineTo(620, this.height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 4. Subtle Decorative Backdrop Pillars & Archways (Depth)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
        for (let x = 110; x < this.width - 100; x += 190) {
            ctx.fillRect(x, 70, 70, this.height - 90);
            ctx.beginPath();
            ctx.arc(x + 35, 70, 35, Math.PI, 0);
            ctx.fill();
        }

        // 5. Faint Neon Horizon Scanner Line at lower background
        const scanY = 660 + Math.sin(this.bgTime * 0.5) * 8;
        const lineGrad = ctx.createLinearGradient(100, scanY, this.width - 100, scanY);
        lineGrad.addColorStop(0, 'rgba(0, 245, 212, 0)');
        lineGrad.addColorStop(0.5, 'rgba(0, 245, 212, 0.08)');
        lineGrad.addColorStop(1, 'rgba(247, 37, 133, 0)');
        ctx.fillStyle = lineGrad;
        ctx.fillRect(100, scanY, this.width - 200, 2);

        // 6. Floating Ambient Sparkle / Dust Motes
        for (let i = 0; i < this.ambientMotes.length; i++) {
            const m = this.ambientMotes[i];
            ctx.fillStyle = m.color;
            ctx.globalAlpha = m.alpha;
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // 7. Draw Walls and Ceiling with vibrant border trim
        for (let i = 0; i < this.walls.length; i++) {
            const w = this.walls[i];
            ctx.fillStyle = w.color;
            ctx.fillRect(w.x, w.y, w.w, w.h);

            // Glowing boundary lines
            ctx.fillStyle = '#00f5d4';
            if (w.w < w.h) {
                const trimX = (w.x < this.width / 2) ? w.x + w.w - 5 : w.x;
                ctx.fillRect(trimX, w.y, 5, w.h);
            } else {
                ctx.fillRect(w.x, w.y + w.h - 5, w.w, 5);
            }
        }

        // 8. Draw Platforms
        for (let i = 0; i < this.platforms.length; i++) {
            const p = this.platforms[i];

            // Platform Base
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.w, p.h, 6);
            ctx.fill();

            // Neon glowing top rim
            ctx.fillStyle = p.topColor || '#ff007f';
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.w, 6, [6, 6, 0, 0]);
            ctx.fill();

            // Subtle highlight line
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fillRect(p.x + 8, p.y + 1, p.w - 16, 2);
        }

        ctx.restore();
    }
}

window.Arena = Arena;
