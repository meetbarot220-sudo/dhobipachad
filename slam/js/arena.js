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

// Compact Arcade Arena with polished cartoon nature background and platforms
class Arena {
    constructor(canvasWidth, canvasHeight) {
        this.height = 750;
        this.bgTime = 0;
        this.ambientMotes = [];

        this.resize(canvasWidth || 1400, canvasHeight || 750);

        // Nature Background: Soft floating dandelion seeds / pollen sparkles
        for (let i = 0; i < 28; i++) {
            this.ambientMotes.push({
                x: Math.random() * (this.width + 400) - 200,
                y: Math.random() * this.height,
                radius: Math.random() * 2.0 + 1.2,
                speedY: Math.random() * 12 + 8,
                speedX: (Math.random() - 0.5) * 6,
                phase: Math.random() * Math.PI * 2,
                alpha: Math.random() * 0.35 + 0.25
            });
        }
    }

    resize(canvasWidth, canvasHeight) {
        const aspect = (canvasWidth && canvasHeight) ? (canvasWidth / canvasHeight) : (16 / 9);
        let targetW = 1400;
        if (aspect >= 1.2) {
            // Desktop/landscape: match screen aspect ratio so the arena seamlessly fills 100% of the screen width
            targetW = Math.max(1360, Math.round(750 * aspect));
        } else {
            // Portrait mobile
            targetW = 1200;
        }

        if (this.width !== targetW) {
            this.initLayout(targetW);
        }
    }

    initLayout(width) {
        this.width = width || 1400;
        this.height = 750;
        const W = this.width;

        // Outer boundaries (Solid side walls, upper wall removed)
        const wallW = 32;
        this.walls = [
            // Left Wall
            { x: 0, y: -1000, w: wallW, h: 1750, color: '#1a2233' },
            // Right Wall
            { x: W - wallW, y: -1000, w: wallW, h: 1750, color: '#1a2233' }
        ];

        // Platforms layout: natural proportions, slightly broader spacing
        const centerStageW = Math.min(420, Math.round(W * 0.28));
        const topCenterW = Math.min(340, Math.round(W * 0.23));
        const lowerLedgeW = Math.min(300, Math.round(W * 0.20));
        const midLedgeW = Math.min(270, Math.round(W * 0.18));
        const highLedgeW = Math.min(210, Math.round(W * 0.14));

        const sideMargin = Math.max(70, Math.round(W * 0.065));
        const midMargin = Math.max(150, Math.round(W * 0.13));
        const highMargin = Math.max(50, Math.round(W * 0.05));

        this.platforms = [
            // Main Bottom Ground
            { id: 'floor', x: wallW, y: 680, w: W - (wallW * 2), h: 70, type: 'solid', color: '#241a4a', topColor: '#00f5d4' },

            // Lower Side Ledges
            { id: 'lower_left', x: sideMargin, y: 530, w: lowerLedgeW, h: 22, type: 'jumpthrough', color: '#312363', topColor: '#ff007f' },
            { id: 'lower_right', x: W - sideMargin - lowerLedgeW, y: 530, w: lowerLedgeW, h: 22, type: 'jumpthrough', color: '#312363', topColor: '#ff007f' },

            // Center Floating Battle Stage
            { id: 'center_stage', x: Math.round((W - centerStageW) / 2), y: 470, w: centerStageW, h: 24, type: 'jumpthrough', color: '#2a1e58', topColor: '#fee440' },

            // Mid Side Platforms
            { id: 'mid_left', x: midMargin, y: 350, w: midLedgeW, h: 22, type: 'jumpthrough', color: '#312363', topColor: '#00f5d4' },
            { id: 'mid_right', x: W - midMargin - midLedgeW, y: 350, w: midLedgeW, h: 22, type: 'jumpthrough', color: '#312363', topColor: '#00f5d4' },

            // Top Crown Overpass
            { id: 'top_center', x: Math.round((W - topCenterW) / 2), y: 220, w: topCenterW, h: 22, type: 'jumpthrough', color: '#442b78', topColor: '#ffbe0b' },

            // High Corner Perches
            { id: 'high_left', x: highMargin, y: 190, w: highLedgeW, h: 20, type: 'jumpthrough', color: '#312363', topColor: '#ff007f' },
            { id: 'high_right', x: W - highMargin - highLedgeW, y: 190, w: highLedgeW, h: 20, type: 'jumpthrough', color: '#312363', topColor: '#ff007f' }
        ];

        // Respawn spots (safe elevated points)
        this.spawnPoints = [
            { x: Math.round(W / 2), y: 440 }, // Center
            { x: Math.round(midMargin + midLedgeW / 2), y: 320 }, // Left Mid
            { x: Math.round(W - midMargin - midLedgeW / 2), y: 320 }, // Right Mid
            { x: Math.round(W / 2), y: 190 }, // Top Center
            { x: Math.round(highMargin + highLedgeW / 2), y: 160 }, // High Left
            { x: Math.round(W - highMargin - highLedgeW / 2), y: 160 } // High Right
        ];
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
            m.x += Math.sin(this.bgTime * 1.2 + m.phase) * (m.speedX * dt * 4);
            if (m.y < 30) {
                m.y = this.height - 30;
                m.x = Math.random() * (this.width + 400) - 200;
            }
        }
    }

    draw(ctx, camera) {
        ctx.save();

        const camOffsetX = camera ? (camera.x - this.width / 2) : 0;
        const camOffsetY = camera ? (camera.y - this.height / 2) : 0;

        const W = this.width;
        const H = this.height;

        // =========================================================================
        // 1. BRIGHT BLUE SKY GRADIENT (Generous margin ensures 100% viewport coverage)
        // =========================================================================
        const skyGrad = ctx.createLinearGradient(0, -200, 0, H * 0.95);
        skyGrad.addColorStop(0, '#3aa4f7');    // Rich cartoon sky blue
        skyGrad.addColorStop(0.45, '#72c2fa'); // Cheerful light cyan
        skyGrad.addColorStop(0.85, '#bae3ff'); // Soft glowing horizon
        skyGrad.addColorStop(1, '#e3f3ff');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(-800, -800, W + 1600, H + 1600);

        // =========================================================================
        // 2. LAYER 1: PUFFY CARTOON CLOUDS (Subtle Parallax & Gentle Drift)
        // =========================================================================
        const cloudDrift = (this.bgTime * 6) % (W + 800);
        const cloudP = camOffsetX * 0.05;

        ctx.save();
        this.drawCloudBank(ctx, -300 + cloudDrift - cloudP, 130, 1.25);
        this.drawCloudBank(ctx, W * 0.35 + cloudDrift - cloudP, 95, 1.05);
        this.drawCloudBank(ctx, -900 + cloudDrift - cloudP, 110, 1.15);
        this.drawCloudBank(ctx, W * 0.82 + cloudDrift - cloudP, 140, 1.3);
        ctx.restore();

        // =========================================================================
        // 3. LAYER 2: DISTANT LAYERED MOUNTAINS / HIGH HILLS (Atmospheric Haze)
        // =========================================================================
        const mtnP = camOffsetX * 0.12;
        ctx.save();
        ctx.fillStyle = '#b7dcfa';
        ctx.beginPath();
        ctx.moveTo(-600, H + 200);
        ctx.lineTo(-600, 390);
        ctx.bezierCurveTo(-100 - mtnP, 340, W * 0.15 - mtnP, 300, W * 0.3 - mtnP, 340);
        ctx.bezierCurveTo(W * 0.45 - mtnP, 410, W * 0.6 - mtnP, 310, W * 0.75 - mtnP, 300);
        ctx.bezierCurveTo(W * 0.9 - mtnP, 380, W * 1.05 - mtnP, 330, W + 600, 370);
        ctx.lineTo(W + 600, H + 200);
        ctx.closePath();
        ctx.fill();

        // Secondary soft mountain ridge
        ctx.fillStyle = '#9eccf6';
        ctx.beginPath();
        ctx.moveTo(-600, H + 200);
        ctx.lineTo(-600, 440);
        ctx.bezierCurveTo(-80 - mtnP * 1.2, 380, W * 0.18 - mtnP * 1.2, 360, W * 0.35 - mtnP * 1.2, 380);
        ctx.bezierCurveTo(W * 0.5 - mtnP * 1.2, 460, W * 0.68 - mtnP * 1.2, 380, W * 0.85 - mtnP * 1.2, 370);
        ctx.bezierCurveTo(W * 0.98 - mtnP * 1.2, 430, W * 1.08 - mtnP * 1.2, 390, W + 600, 420);
        ctx.lineTo(W + 600, H + 200);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // =========================================================================
        // 4. LAYER 3: MIDDLE ROLLING HILLS WITH STYLIZED TREES
        // =========================================================================
        const midHillP = camOffsetX * 0.22;
        ctx.save();
        ctx.fillStyle = '#7ac098'; // Soft cartoon meadow green
        ctx.beginPath();
        ctx.moveTo(-600, H + 200);
        ctx.lineTo(-600, 510);
        ctx.bezierCurveTo(-100 - midHillP, 460, W * 0.2 - midHillP, 420, W * 0.4 - midHillP, 450);
        ctx.bezierCurveTo(W * 0.6 - midHillP, 530, W * 0.8 - midHillP, 435, W + 600, 510);
        ctx.lineTo(W + 600, H + 200);
        ctx.closePath();
        ctx.fill();

        // Stylized Cartoon "Lollipop" Trees along mid hills
        const treeFracs = [0.08, 0.16, 0.25, 0.36, 0.64, 0.74, 0.84, 0.92];
        for (let i = 0; i < treeFracs.length; i++) {
            const trX = W * treeFracs[i];
            this.drawCartoonTree(ctx, trX - midHillP, 445, 0.85, '#5a8d74', '#8edba8', '#67b884');
        }
        ctx.restore();

        // =========================================================================
        // 5. LAYER 4: FOREGROUND NATURE HILLS WITH GRASS TUFTS & STONES
        // =========================================================================
        const foreHillP = camOffsetX * 0.35;
        ctx.save();

        // Primary rolling foreground hill
        const foreGrad = ctx.createLinearGradient(0, 520, 0, H);
        foreGrad.addColorStop(0, '#53ab76'); // Fresh cartoon grass green
        foreGrad.addColorStop(1, '#3b875a');
        ctx.fillStyle = foreGrad;
        ctx.beginPath();
        ctx.moveTo(-600, H + 200);
        ctx.lineTo(-600, 580);
        ctx.bezierCurveTo(-80 - foreHillP, 530, W * 0.22 - foreHillP, 510, W * 0.45 - foreHillP, 530);
        ctx.bezierCurveTo(W * 0.68 - foreHillP, 600, W * 0.88 - foreHillP, 515, W + 600, 580);
        ctx.lineTo(W + 600, H + 200);
        ctx.closePath();
        ctx.fill();

        // Small cartoon pebbles/stones on hillside
        this.drawCartoonPebbles(ctx, W * 0.12 - foreHillP, 590);
        this.drawCartoonPebbles(ctx, W * 0.35 - foreHillP, 560);
        this.drawCartoonPebbles(ctx, W * 0.62 - foreHillP, 610);
        this.drawCartoonPebbles(ctx, W * 0.88 - foreHillP, 570);

        // Cartoon grass tufts along the ridges
        this.drawGrassTuft(ctx, W * 0.15 - foreHillP, 545, 1.0);
        this.drawGrassTuft(ctx, W * 0.28 - foreHillP, 535, 1.1);
        this.drawGrassTuft(ctx, W * 0.50 - foreHillP, 560, 0.9);
        this.drawGrassTuft(ctx, W * 0.72 - foreHillP, 545, 1.15);
        this.drawGrassTuft(ctx, W * 0.89 - foreHillP, 535, 1.0);
        ctx.restore();

        // =========================================================================
        // 6. AMBIENT DRIFTING NATURE MOTES (Pollen / Dandelion Seeds)
        // =========================================================================
        ctx.save();
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < this.ambientMotes.length; i++) {
            const m = this.ambientMotes[i];
            ctx.globalAlpha = m.alpha;
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // =========================================================================
        // 7. ARENA BOUNDARY WALLS (Solid & Clean Frame)
        // =========================================================================
        for (let i = 0; i < this.walls.length; i++) {
            const w = this.walls[i];
            ctx.fillStyle = w.color;
            ctx.fillRect(w.x, w.y, w.w, w.h);

            // Clean glowing arcade edge trim
            ctx.fillStyle = '#00f5d4';
            if (w.w < w.h) {
                const trimX = (w.x < this.width / 2) ? w.x + w.w - 5 : w.x;
                ctx.fillRect(trimX, w.y, 5, w.h);
            } else {
                ctx.fillRect(w.x, w.y + w.h - 5, w.w, 5);
            }
        }

        // =========================================================================
        // 8. PLAYABLE ARENA PLATFORMS (Crisp High-Contrast Floating Decks)
        // =========================================================================
        for (let i = 0; i < this.platforms.length; i++) {
            const p = this.platforms[i];

            // Platform Base
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.w, p.h, 6);
            ctx.fill();

            // Neon top cap
            ctx.fillStyle = p.topColor || '#ff007f';
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.w, 6, [6, 6, 0, 0]);
            ctx.fill();

            // Highlight line
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(p.x + 8, p.y + 1, p.w - 16, 2);
        }

        ctx.restore();
    }

    // Helper: Draw Stylized Puffy Cartoon Cloud Bank
    drawCloudBank(ctx, cx, cy, scale = 1.0) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

        // Soft cloud shadow / underside
        ctx.fillStyle = '#d7edfc';
        ctx.beginPath();
        ctx.arc(0, 10, 60, 0, Math.PI * 2);
        ctx.arc(60, 8, 50, 0, Math.PI * 2);
        ctx.arc(-55, 12, 45, 0, Math.PI * 2);
        ctx.arc(115, 14, 40, 0, Math.PI * 2);
        ctx.arc(-105, 16, 35, 0, Math.PI * 2);
        ctx.fill();

        // Fluffy white top lobes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 56, 0, Math.PI * 2);
        ctx.arc(58, -2, 46, 0, Math.PI * 2);
        ctx.arc(-52, 2, 42, 0, Math.PI * 2);
        ctx.arc(112, 6, 36, 0, Math.PI * 2);
        ctx.arc(-102, 8, 32, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Helper: Draw Stylized Cartoon "Lollipop" Tree
    drawCartoonTree(ctx, tx, ty, scale = 1.0, trunkColor = '#5a8d74', crownColor = '#8edba8', shadowColor = '#67b884') {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.scale(scale, scale);

        // Slender trunk
        ctx.fillStyle = trunkColor;
        ctx.beginPath();
        ctx.roundRect(-4, 0, 8, 38, 3);
        ctx.fill();

        // Round leafy crown (circular with subtle shadow underneath)
        ctx.fillStyle = shadowColor;
        ctx.beginPath();
        ctx.arc(0, -6, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = crownColor;
        ctx.beginPath();
        ctx.arc(0, -10, 24, 0, Math.PI * 2);
        ctx.fill();

        // Subtle soft highlight lobe
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(-7, -17, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Helper: Draw Cartoon Grass Tufts
    drawGrassTuft(ctx, gx, gy, scale = 1.0) {
        ctx.save();
        ctx.translate(gx, gy);
        ctx.scale(scale, scale);

        ctx.fillStyle = '#398b58';
        // Left blade
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-12, -14, -16, -20);
        ctx.quadraticCurveTo(-10, -10, -4, 0);
        ctx.fill();

        // Center blade
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.quadraticCurveTo(0, -18, 0, -26);
        ctx.quadraticCurveTo(4, -14, 3, 0);
        ctx.fill();

        // Right blade
        ctx.beginPath();
        ctx.moveTo(2, 0);
        ctx.quadraticCurveTo(12, -14, 16, -18);
        ctx.quadraticCurveTo(8, -10, 5, 0);
        ctx.fill();

        ctx.restore();
    }

    // Helper: Draw Cartoon Pebbles / Stones
    drawCartoonPebbles(ctx, px, py) {
        ctx.save();
        ctx.fillStyle = '#83a8ba';
        ctx.beginPath();
        ctx.ellipse(px, py, 9, 5, -0.2, 0, Math.PI * 2);
        ctx.ellipse(px + 14, py + 3, 6, 3.5, 0.1, 0, Math.PI * 2);
        ctx.ellipse(px - 10, py + 2, 5, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

window.Arena = Arena;
