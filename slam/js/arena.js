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

// Compact Arcade Arena designed specifically for 4-character squish combat
class Arena {
    constructor() {
        // Small, compact arena dimensions matching reference scale
        this.width = 1200;
        this.height = 750;

        // Outer boundaries (Solid enclosing walls and ceiling)
        this.walls = [
            // Left Wall
            { x: 30, y: 0, w: 40, h: 750, color: '#1f1641' },
            // Right Wall
            { x: 1130, y: 0, w: 40, h: 750, color: '#1f1641' },
            // Ceiling
            { x: 30, y: 20, w: 1140, h: 30, color: '#1f1641' }
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
    }

    getRandomSpawnPoint() {
        const pt = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
        return { x: pt.x + (Math.random() * 40 - 20), y: pt.y };
    }

    draw(ctx) {
        ctx.save();

        // Atmospheric Dark Cartoon Arena Background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
        bgGrad.addColorStop(0, '#0d0722');
        bgGrad.addColorStop(0.6, '#180e3b');
        bgGrad.addColorStop(1, '#281559');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Subtle background grid & glowing arcade pillars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let x = 120; x < this.width - 100; x += 180) {
            ctx.fillRect(x, 60, 80, this.height - 80);
            ctx.beginPath();
            ctx.arc(x + 40, 60, 40, Math.PI, 0);
            ctx.fill();
        }

        // Draw Walls and Ceiling with vibrant border trim
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

        // Draw Platforms
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
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(p.x + 8, p.y + 1, p.w - 16, 2);
        }

        ctx.restore();
    }
}

window.Arena = Arena;
