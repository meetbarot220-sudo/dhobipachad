// Clean Input Manager: Movement & Jump only (No attack buttons)
class InputManager {
    constructor() {
        this.keys = {};
        this.touchActive = false;

        // Control states
        this.left = false;
        this.right = false;
        this.down = false;
        this.jumpPressed = false;

        this.initKeyboard();
        this.initTouch();
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (window.soundEngine) window.soundEngine.resume();

            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }

            if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
                this.jumpPressed = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    initTouch() {
        // Detect touch device
        window.addEventListener('touchstart', () => {
            if (!this.touchActive) {
                this.touchActive = true;
                this.updateMobileVisibility(true);
            }
            if (window.soundEngine) window.soundEngine.resume();
        }, { passive: true, once: true });

        // Bind Mobile Touch Buttons
        this.setupTouchButton('btn-touch-left', (active) => { this.left = active; });
        this.setupTouchButton('btn-touch-right', (active) => { this.right = active; });
        this.setupTouchButton('btn-touch-jump', (active) => { if (active) this.jumpPressed = true; });
    }

    setupTouchButton(elementId, callback) {
        const btn = document.getElementById(elementId);
        if (!btn) return;

        const handleStart = (e) => {
            e.preventDefault();
            btn.classList.add('pressed');
            callback(true);
        };

        const handleEnd = (e) => {
            e.preventDefault();
            btn.classList.remove('pressed');
            callback(false);
        };

        btn.addEventListener('touchstart', handleStart, { passive: false });
        btn.addEventListener('touchend', handleEnd, { passive: false });
        btn.addEventListener('touchcancel', handleEnd, { passive: false });
        btn.addEventListener('mousedown', handleStart);
        btn.addEventListener('mouseup', handleEnd);
        btn.addEventListener('mouseleave', handleEnd);
    }

    updateMobileVisibility(show) {
        const controls = document.getElementById('mobile-controls');
        if (controls) {
            controls.style.display = show ? 'flex' : 'none';
        }
    }

    update(player, dt) {
        if (!player || !player.isAlive) return;

        // Horizontal Movement
        let moveX = 0;
        if (this.keys['KeyA'] || this.keys['ArrowLeft'] || this.left) moveX -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight'] || this.right) moveX += 1;

        // Platform Drop Through
        const wantDown = this.keys['KeyS'] || this.keys['ArrowDown'] || this.down;
        player.dropThrough = wantDown;

        // Apply movement forces
        if (player.knockbackTimer <= 0 && moveX !== 0) {
            player.facing = moveX;
            const accel = player.grounded ? 2400 : 1400;
            player.vx += moveX * accel * dt;
            if (Math.abs(player.vx) > player.maxSpeed) {
                player.vx = Math.sign(player.vx) * player.maxSpeed;
            }
        }

        // Jump
        if (this.jumpPressed) {
            player.jump();
            this.jumpPressed = false;
        }
    }
}

window.InputManager = InputManager;
