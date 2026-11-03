// Smooth Camera tailored for compact 4-player arena brawler
class Camera {
    constructor(canvas, arena) {
        this.canvas = canvas;
        this.arena = arena;

        this.x = arena.width / 2;
        this.y = arena.height / 2;
        this.targetX = this.x;
        this.targetY = this.y;

        // Auto-scale zoom so the compact arena fills the screen cleanly
        this.zoom = 1.0;
        this.targetZoom = 1.0;

        // Screen Shake
        this.trauma = 0;
        this.shakeAngle = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }

    onResize() {
        const scaleX = this.canvas.width / this.arena.width;
        const scaleY = this.canvas.height / this.arena.height;
        this.targetZoom = Math.min(scaleX, scaleY);
        this.zoom = this.targetZoom;
        this.x = this.arena.width / 2;
        this.y = this.arena.height / 2;
    }

    addShake(amount) {
        this.trauma = Math.min(1.0, this.trauma + amount);
    }

    update(player, dt) {
        if (!player) return;

        // Auto-scale zoom so the arena cleanly fills the screen width and height
        const scaleX = this.canvas.width / this.arena.width;
        const scaleY = this.canvas.height / this.arena.height;
        const baseZoom = Math.min(scaleX, scaleY);

        this.targetZoom = baseZoom;
        this.zoom += (this.targetZoom - this.zoom) * (dt * 6);

        // Keep camera centered on the broader arena with subtle player focus
        const arenaCenterX = this.arena.width / 2;
        const arenaCenterY = this.arena.height / 2;

        const lookAheadX = player.vx * 0.08;
        this.targetX = arenaCenterX + lookAheadX * 0.35;
        this.targetY = arenaCenterY + (player.y - arenaCenterY) * 0.25;

        // Smooth Lerp
        const lerpFactor = Math.min(1.0, 8 * dt);
        this.x += (this.targetX - this.x) * lerpFactor;
        this.y += (this.targetY - this.y) * lerpFactor;

        // Clamp camera within arena bounds
        const halfVisibleW = (this.canvas.width / 2) / this.zoom;
        const halfVisibleH = (this.canvas.height / 2) / this.zoom;

        const minCamX = halfVisibleW;
        const maxCamX = this.arena.width - halfVisibleW;
        const minCamY = halfVisibleH;
        const maxCamY = this.arena.height - halfVisibleH;

        if (maxCamX >= minCamX) {
            this.x = Math.max(minCamX, Math.min(maxCamX, this.x));
        } else {
            this.x = arenaCenterX;
        }

        if (maxCamY >= minCamY) {
            this.y = Math.max(minCamY, Math.min(maxCamY, this.y));
        } else {
            this.y = arenaCenterY;
        }

        // Screen Shake decay
        if (this.trauma > 0) {
            this.trauma = Math.max(0, this.trauma - dt * 2.5);
            const shake = this.trauma * this.trauma;
            const maxOffset = 16;
            this.shakeOffsetX = (Math.random() * 2 - 1) * maxOffset * shake;
            this.shakeOffsetY = (Math.random() * 2 - 1) * maxOffset * shake;
            this.shakeAngle = (Math.random() * 2 - 1) * 0.03 * shake;
        } else {
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
            this.shakeAngle = 0;
        }
    }

    apply(ctx) {
        ctx.save();
        ctx.translate(this.canvas.width / 2 + this.shakeOffsetX, this.canvas.height / 2 + this.shakeOffsetY);
        ctx.rotate(this.shakeAngle);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    restore(ctx) {
        ctx.restore();
    }
}

window.Camera = Camera;
