// Aggressive Hunter Bot AI: 3 Enemy Bots Actively Hunting the Red Player
class BotAIController {
    constructor() {
        // Individual bot personalities
        this.personalities = {
            1: { type: 'jumper', jumpTendency: 0.85, speedMult: 1.0 }, // Green Bot: High Hopper
            2: { type: 'sprinter', jumpTendency: 0.65, speedMult: 1.15 }, // Blue Bot: Fast Charger
            3: { type: 'highground', jumpTendency: 0.90, speedMult: 0.95 } // Yellow Bot: Ledge Pouncer
        };
    }

    update(bot, player, arena, dt) {
        if (!bot.isAlive || bot.isPlayer || !player) return;

        // Ensure AI internal state is initialized
        if (!bot.ai) {
            const profile = this.personalities[bot.id] || { type: 'hunter', jumpTendency: 0.75, speedMult: 1.0 };
            bot.ai = {
                profile: profile,
                stuckTimer: 0,
                lastX: bot.x,
                reactionTimer: 0.1,
                repositionTimer: 0
            };
        }

        const ai = bot.ai;

        // If player is dead/invulnerable, still move near player's location or stalk
        const targetX = player.x;
        const targetY = player.y;

        const dx = targetX - bot.x;
        const dy = targetY - bot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Stuck detection
        if (Math.abs(bot.x - ai.lastX) < 1.5 * dt * 60) {
            ai.stuckTimer += dt;
        } else {
            ai.stuckTimer = Math.max(0, ai.stuckTimer - dt * 2);
        }
        ai.lastX = bot.x;

        let moveDir = 0;
        let wantJump = false;

        // Face player
        bot.facing = dx >= 0 ? 1 : -1;

        // Tactical positioning to land on player:
        // The bot wants to be ABOVE the player (bot.y < player.y) and close in horizontal distance!
        const isAbovePlayer = bot.y < player.y - 20;

        if (isAbovePlayer) {
            // Already above! Steer directly toward player's X to fall on top of them!
            moveDir = Math.sign(dx);

            // Drop through platforms if standing on a jumpthrough ledge above player
            if (bot.grounded && Math.abs(dx) < 60 && dy > 40) {
                bot.dropThrough = true;
            } else {
                bot.dropThrough = false;
            }
        } else {
            // Below or level with player: Bot MUST jump to gain altitude and land on player!
            bot.dropThrough = false;

            if (Math.abs(dx) > 20) {
                moveDir = Math.sign(dx);
            }

            // Jump decision when approaching player to leap over them
            if (bot.grounded) {
                if (Math.abs(dx) < 180 && dy >= -80) {
                    // Close approach jump!
                    wantJump = true;
                } else if (dy < -60 && Math.abs(dx) < 260) {
                    // Player is on higher platform, jump up!
                    wantJump = true;
                } else if (Math.random() < 0.03 * ai.profile.jumpTendency) {
                    // Occasional hop to navigate platforms
                    wantJump = true;
                }
            } else if (bot.canDoubleJump) {
                // In air: use double jump to get directly above player!
                if (dy > -20 && Math.abs(dx) < 120 && bot.vy > 0) {
                    wantJump = true;
                }
            }
        }

        // Unstuck emergency jump / reversal
        if (ai.stuckTimer > 0.35) {
            wantJump = true;
            moveDir = -bot.facing;
            if (ai.stuckTimer > 0.8) {
                ai.stuckTimer = 0;
            }
        }

        // Apply movement forces
        if (bot.knockbackTimer <= 0 && moveDir !== 0) {
            const accel = bot.grounded ? 2000 : 1200;
            const topSpeed = bot.maxSpeed * ai.profile.speedMult;
            bot.vx += moveDir * accel * dt;
            if (Math.abs(bot.vx) > topSpeed) {
                bot.vx = Math.sign(bot.vx) * topSpeed;
            }
        }

        // Trigger Jump
        if (wantJump) {
            bot.jump(Math.random() < 0.15);
        }
    }
}

window.BotAIController = BotAIController;
