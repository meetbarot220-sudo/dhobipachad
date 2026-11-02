# Squish: 60-Second Survival Brawler

A fast-paced, bouncy, chaotic 2.5D arcade survival brawler inspired directly by the mechanics and feel of *Squish* on CrazyGames.

---

## 🎮 Core Game Design

- **4 Characters Total in a Small Arena**:
  - **Player**: 🔴 **RED** blob (Crown + `▼ YOU` indicator).
  - **Enemy 1**: 🟢 **GREEN** bot (High hopper hunter).
  - **Enemy 2**: 🔵 **BLUE** bot (Fast sprint charger).
  - **Enemy 3**: 🟡 **YELLOW** bot (Ledge pouncer).
- **Match Objective**:
  - **SURVIVE FOR 60 SECONDS** and rack up the highest score possible.
  - Player starts with **3 LIVES** (❤️❤️❤️).
  - Enemy bots have **INFINITE RESPAWNS** and continuously hunt down the player.
- **Pure Jump-to-Squish Combat (No punches, no weapons)**:
  - **Player Stomps Bot**: Land on a bot's head from above to **SQUISH** them! You bounce high into the air with a boing sound, receive **+100 SCORE** (with combo multipliers for chains), and the bot respawns after 1.6s.
  - **Bot Stomps Player**: If a bot successfully lands on you from above, you get **SQUISHED**, lose 1 life, and respawn after a short delay with brief invulnerability.
  - **Horizontal Bump**: Running into a bot horizontally causes an elastic knockback bounce without dying.
- **End Game Conditions**:
  - **Victory**: Survive the full **60 SECONDS** countdown to see **TIME SURVIVED** and your Final Score.
  - **Game Over**: Lose all 3 lives to trigger **GAME OVER** immediately with your Final Score.

---

## 🕹️ Controls

### Desktop:
- **A / D** or **Arrow Keys**: Move Left / Right
- **SPACE** (or **W / Up Arrow**): Jump / Double Jump (variable bounce height)
- **S** or **Down Arrow**: Drop through semi-solid platforms
- **Attack Mechanic**: Jump and land on the heads of enemy bots to squish them!

### Mobile / Touchscreen:
- **LEFT (◀)** and **RIGHT (▶)** movement buttons on bottom-left.
- **JUMP (🦘)** button on bottom-right.
- Automatically detected on touch devices and positioned inside safe margins; hidden on desktop.

---

## 🚀 How to Launch & Play

- **Option 1**: Double-click `start_game.bat`.
- **Option 2**: Run `python -m http.server 8000` and open `http://localhost:8000` in your browser.
- **Option 3**: Open `index.html` directly in any web browser.
