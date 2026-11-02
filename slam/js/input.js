// Clean Input Manager: Responsive Movement & Jump with Robust Mobile Touch Handling
class InputManager {
    constructor() {
        this.keys = {};

        // Control states
        this.left = false;
        this.right = false;
        this.down = false;
        this.jumpPressed = false;

        this.initKeyboard();
        this.detectTouchDevice();
        this.initTouch();
    }

    detectTouchDevice() {
        // Immediate detection of mobile/touch capability
        const isTouch = ('ontouchstart' in window) ||
                        (navigator.maxTouchPoints > 0) ||
                        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

        if (isTouch) {
            document.body.classList.add('touch-device');
        }

        // Failsafe: on first touch anywhere, mark as touch-device and resume audio
        window.addEventListener('touchstart', () => {
            document.body.classList.add('touch-device');
            if (window.soundEngine) window.soundEngine.resume();
        }, { passive: true, once: true });
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
        // Bind Mobile Touch Buttons with robust multi-touch support
        this.setupTouchButton('btn-touch-left', (active) => { this.left = active; });
        this.setupTouchButton('btn-touch-right', (active) => { this.right = active; });
        this.setupTouchButton('btn-touch-jump', (active) => { if (active) this.jumpPressed = true; });
        this.setupTouchButton('btn-touch-down', (active) => { this.down = active; });
    }

    setupTouchButton(elementId, callback) {
        const btn = document.getElementById(elementId);
        if (!btn) return;

        let activeTouchId = null;

        const startAction = (id) => {
            activeTouchId = id;
            btn.classList.add('pressed');
            callback(true);
        };

        const endAction = () => {
            activeTouchId = null;
            btn.classList.remove('pressed');
            callback(false);
        };

        // Touch Start
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (activeTouchId === null && e.changedTouches.length > 0) {
                startAction(e.changedTouches[0].identifier);
            }
        }, { passive: false });

        // Touch End
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === activeTouchId) {
                    endAction();
                    break;
                }
            }
        }, { passive: false });

        // Touch Cancel (interrupted gesture / off-screen)
        btn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === activeTouchId) {
                    endAction();
                    break;
                }
            }
        }, { passive: false });

        // Mouse Fallback for testing in responsive emulator
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startAction('mouse');
        });

        window.addEventListener('mouseup', () => {
            if (activeTouchId === 'mouse') {
                endAction();
            }
        });
    }

    update(player, dt) {
        if (!player || !player.isAlive) return;

        // Horizontal Movement (Keyboard or Touch)
        let moveX = 0;
        if (this.keys['KeyA'] || this.keys['ArrowLeft'] || this.left) moveX -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight'] || this.right) moveX += 1;

        // Platform Drop Through & Fast Fall
        const wantDown = this.keys['KeyS'] || this.keys['ArrowDown'] || this.down;
        player.dropThrough = wantDown;

        // Fast fall downward when airborne and DOWN is held
        if (wantDown && !player.grounded) {
            player.vy = Math.max(player.vy + 2200 * dt, 480);
        }

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
