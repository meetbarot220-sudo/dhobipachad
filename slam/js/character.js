// Bouncy Squishy Cartoon Character Class with Pure Jump-and-Stomp Combat
class Character {
    constructor(id, isPlayer, color, name, x, y) {
        this.id = id;
        this.isPlayer = isPlayer;
        this.color = color;
        this.name = name;

        // Position & Velocity
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.facing = 1;

        // Visual Size
        this.baseRadius = isPlayer ? 24 : 22;
        this.radius = this.baseRadius;

        // Squash & Stretch Spring Physics
        this.scaleX = 1.0;
        this.scaleY = 1.0;
        this.targetScaleX = 1.0;
        this.targetScaleY = 1.0;
        this.wobblePhase = Math.random() * Math.PI * 2;

        // Platformer Movement
        this.grounded = false;
        this.wasGrounded = false;
        this.dropThrough = false;
        this.canDoubleJump = true;
        this.gravity = 1450;
        this.maxSpeed = isPlayer ? 420 : 380;
        this.jumpForce = 580;

        // Life & State
        this.isAlive = true;
        this.respawnTimer = 0;
        this.invulnerableTimer = 0;
        this.knockbackTimer = 0;

        // Expression & Facial Animation
        this.expression = 'normal'; // 'normal', 'shocked', 'squished'
        this.blinkTimer = Math.random() * 3 + 2;
        this.isBlinking = false;

        // Visual respawn drop-in animation
        this.spawnAlpha = 1.0;
    }

    triggerSquash(sx, sy) {
        this.scaleX = sx;
        this.scaleY = sy;
    }

    jump(shortHop = false) {
        if (!this.isAlive) return false;

        if (this.grounded) {
            this.vy = -(shortHop ? this.jumpForce * 0.75 : this.jumpForce);
            this.grounded = false;
            this.canDoubleJump = true;
            this.triggerSquash(0.6, 1.5); // Vertical stretch

            if (this.isPlayer && window.soundEngine) {
                window.soundEngine.playJump();
            }
            if (window.particleSystem) {
                window.particleSystem.spawnDust(this.x, this.y + this.radius, 4);
            }
            return true;
        } else if (this.canDoubleJump) {
            this.vy = -this.jumpForce * 0.88;
            this.canDoubleJump = false;
            this.triggerSquash(0.65, 1.4);

            if (this.isPlayer && window.soundEngine) {
                window.soundEngine.playDoubleJump();
            }
            if (window.particleSystem) {
                window.particleSystem.spawnImpact(this.x, this.y + this.radius, this.color, 6);
            }
            return true;
        }
        return false;
    }

    squish(killer) {
        if (!this.isAlive) return;
        this.isAlive = false;
        this.expression = 'squished';
        this.triggerSquash(2.5, 0.15); // Pancake flatten

        if (window.soundEngine) {
            window.soundEngine.playSquish();
        }

        if (window.particleSystem) {
            window.particleSystem.spawnSquishBurst(this.x, this.y, this.color, 24);
        }

        if (window.camera) {
            window.camera.addShake(this.isPlayer ? 0.9 : 0.45);
        }
    }

    respawn(spawnX, spawnY, invulnSeconds = 1.8) {
        this.x = spawnX;
        this.y = spawnY;
        this.vx = 0;
        this.vy = 0;
        this.isAlive = true;
        this.expression = 'normal';
        this.scaleX = 1.0;
        this.scaleY = 1.0;
        this.invulnerableTimer = invulnSeconds;
        this.canDoubleJump = true;
        this.grounded = false;
        this.triggerSquash(0.7, 1.4);

        if (window.particleSystem) {
            window.particleSystem.spawnImpact(this.x, this.y, this.color, 14, true);
        }
    }

    update(dt, arena) {
        if (!this.isAlive) return;

        // Timers
        if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
        if (this.knockbackTimer > 0) this.knockbackTimer -= dt;

        // Gravity
        if (!this.grounded) {
            this.vy += this.gravity * dt;
            if (this.vy > 1200) this.vy = 1200;
        }

        // Friction / drag
        const friction = this.grounded ? 0.84 : 0.95;
        this.vx *= Math.pow(friction, dt * 60);

        // Integrate position
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Squash & Stretch Spring Recovery
        const springK = Math.min(1.0, 16 * dt);
        this.scaleX += (this.targetScaleX - this.scaleX) * springK;
        this.scaleY += (this.targetScaleY - this.scaleY) * springK;

        // Walking wobble
        if (this.grounded && Math.abs(this.vx) > 30) {
            this.wobblePhase += dt * 18;
            this.scaleX = 1.0 + Math.sin(this.wobblePhase) * 0.12;
            this.scaleY = 1.0 - Math.sin(this.wobblePhase) * 0.12;
        }

        // Arena Collisions
        this.resolveArenaCollisions(arena);

        // Blinking
        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) {
            this.isBlinking = true;
            if (this.blinkTimer < -0.15) {
                this.isBlinking = false;
                this.blinkTimer = Math.random() * 4 + 2;
            }
        }

        // Expression reset
        if (this.expression === 'shocked' && this.knockbackTimer <= 0) {
            this.expression = 'normal';
        }

        // Failsafe bottom pit
        if (this.y > arena.height + 60) {
            const pt = arena.getRandomSpawnPoint();
            this.respawn(pt.x, pt.y);
        }
    }

    resolveArenaCollisions(arena) {
        this.wasGrounded = this.grounded;
        this.grounded = false;

        const feetY = this.y + this.radius;
        const headY = this.y - this.radius;
        const leftX = this.x - this.radius;
        const rightX = this.x + this.radius;

        // Boundary walls
        for (let i = 0; i < arena.walls.length; i++) {
            const w = arena.walls[i];
            if (w.w < w.h) {
                // Vertical wall
                if (feetY > w.y && headY < w.y + w.h) {
                    if (w.x < arena.width / 2) {
                        // Left wall
                        if (leftX < w.x + w.w) {
                            this.x = w.x + w.w + this.radius;
                            this.vx = Math.abs(this.vx) * 0.4;
                            this.triggerSquash(0.75, 1.25);
                        }
                    } else {
                        // Right wall
                        if (rightX > w.x) {
                            this.x = w.x - this.radius;
                            this.vx = -Math.abs(this.vx) * 0.4;
                            this.triggerSquash(0.75, 1.25);
                        }
                    }
                }
            } else {
                // Ceiling
                if (rightX > w.x && leftX < w.x + w.w) {
                    if (headY < w.y + w.h) {
                        this.y = w.y + w.h + this.radius;
                        if (this.vy < 0) this.vy = -this.vy * 0.3;
                        this.triggerSquash(1.3, 0.7);
                    }
                }
            }
        }

        // Platforms
        for (let i = 0; i < arena.platforms.length; i++) {
            const p = arena.platforms[i];

            if (rightX > p.x && leftX < p.x + p.w) {
                if (p.type === 'jumpthrough') {
                    // Jumpthrough: only land when falling down through top
                    const prevFeetY = feetY - this.vy * 0.016;
                    if (!this.dropThrough && this.vy >= 0 && prevFeetY <= p.y + 14 && feetY >= p.y) {
                        this.y = p.y - this.radius;
                        this.vy = 0;
                        this.grounded = true;
                        if (!this.wasGrounded) {
                            this.triggerSquash(1.35, 0.7);
                            if (window.particleSystem) window.particleSystem.spawnDust(this.x, this.y + this.radius, 3);
                        }
                    }
                } else {
                    // Solid platform
                    const prevY = this.y - this.vy * 0.016;
                    if (prevY + this.radius <= p.y + 12 && feetY >= p.y && this.vy >= 0) {
                        this.y = p.y - this.radius;
                        this.vy = 0;
                        this.grounded = true;
                        if (!this.wasGrounded) {
                            this.triggerSquash(1.35, 0.7);
                            if (window.particleSystem) window.particleSystem.spawnDust(this.x, this.y + this.radius, 3);
                        }
                    } else if (headY <= p.y + p.h && prevY - this.radius >= p.y + p.h - 12 && this.vy < 0) {
                        this.y = p.y + p.h + this.radius;
                        this.vy = -this.vy * 0.2;
                        this.triggerSquash(1.3, 0.7);
                    } else if (feetY > p.y + 10 && headY < p.y + p.h - 10) {
                        if (this.x < p.x && rightX > p.x) {
                            this.x = p.x - this.radius;
                            this.vx = Math.min(0, this.vx);
                        } else if (this.x > p.x + p.w && leftX < p.x + p.w) {
                            this.x = p.x + p.w + this.radius;
                            this.vx = Math.max(0, this.vx);
                        }
                    }
                }
            }
        }
    }

    draw(ctx) {
        if (!this.isAlive) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Ground shadow
        if (this.grounded) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(0, this.radius, this.radius * 0.85 * this.scaleX, this.radius * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Squash and Stretch Transform
        ctx.scale(this.scaleX, this.scaleY);

        // Invulnerability Blink (Flashing white/transparent)
        if (this.invulnerableTimer > 0) {
            const flash = Math.floor(Date.now() / 80) % 2 === 0;
            if (flash) {
                ctx.globalAlpha = 0.45;
            }
        }

        // Blob Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Player special outline (Bright glowing white border)
        if (this.isPlayer) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.stroke();
        } else {
            // Subtle dark outline for bots
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }

        // Inner 3D Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(-this.radius * 0.32, -this.radius * 0.32, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Expressive Cartoon Face
        const eyeSpacing = this.radius * 0.45;
        const eyeY = -this.radius * 0.15;
        const eyeRadius = this.radius * 0.28;
        const pupilRadius = eyeRadius * 0.55;
        const lookDir = this.facing;

        if (this.expression === 'squished') {
            // Squished X Eyes
            ctx.strokeStyle = '#10002b';
            ctx.lineWidth = 3;
            // Left X
            ctx.beginPath();
            ctx.moveTo(-eyeSpacing - 4, eyeY - 4);
            ctx.lineTo(-eyeSpacing + 4, eyeY + 4);
            ctx.moveTo(-eyeSpacing + 4, eyeY - 4);
            ctx.lineTo(-eyeSpacing - 4, eyeY + 4);
            // Right X
            ctx.moveTo(eyeSpacing - 4, eyeY - 4);
            ctx.lineTo(eyeSpacing + 4, eyeY + 4);
            ctx.moveTo(eyeSpacing + 4, eyeY - 4);
            ctx.lineTo(eyeSpacing - 4, eyeY + 4);
            ctx.stroke();
        } else if (this.isBlinking) {
            // Blink Lines
            ctx.strokeStyle = '#10002b';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-eyeSpacing - 4, eyeY);
            ctx.lineTo(-eyeSpacing + 4, eyeY);
            ctx.moveTo(eyeSpacing - 4, eyeY);
            ctx.lineTo(eyeSpacing + 4, eyeY);
            ctx.stroke();
        } else {
            // Left Eye
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-eyeSpacing * 0.6 + lookDir * 2, eyeY, eyeRadius, 0, Math.PI * 2);
            ctx.arc(eyeSpacing * 0.6 + lookDir * 2, eyeY, eyeRadius, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = '#10002b';
            ctx.beginPath();
            ctx.arc(-eyeSpacing * 0.6 + lookDir * 5, eyeY, pupilRadius, 0, Math.PI * 2);
            ctx.arc(eyeSpacing * 0.6 + lookDir * 5, eyeY, pupilRadius, 0, Math.PI * 2);
            ctx.fill();

            // Pupil Glint
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-eyeSpacing * 0.6 + lookDir * 4 - 1, eyeY - 2, 2, 0, Math.PI * 2);
            ctx.arc(eyeSpacing * 0.6 + lookDir * 4 - 1, eyeY - 2, 2, 0, Math.PI * 2);
            ctx.fill();

            // Mouth
            ctx.strokeStyle = '#10002b';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            if (this.expression === 'shocked') {
                ctx.ellipse(lookDir * 2, eyeY + eyeRadius + 4, 3, 5, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#10002b';
                ctx.fill();
            } else {
                ctx.arc(lookDir * 2, eyeY + eyeRadius + 1, 4, 0, Math.PI);
                ctx.stroke();
            }
        }

        // Reset scale for overhead markers
        ctx.scale(1 / this.scaleX, 1 / this.scaleY);

        // Player "YOU" Marker and Crown
        if (this.isPlayer) {
            // Golden Crown
            const crownY = -this.radius - 16;
            ctx.fillStyle = '#ffd166';
            ctx.strokeStyle = '#ef476f';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-12, crownY + 8);
            ctx.lineTo(-12, crownY);
            ctx.lineTo(-6, crownY + 4);
            ctx.lineTo(0, crownY - 4);
            ctx.lineTo(6, crownY + 4);
            ctx.lineTo(12, crownY);
            ctx.lineTo(12, crownY + 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Bouncy Floating "▼ YOU"
            const arrowY = crownY - 14 + Math.sin(Date.now() * 0.008) * 3;
            ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            ctx.fillText('▼ YOU', 0, arrowY);
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }
}

window.Character = Character;
