# Processor & Drive Type Specification (`docs/processors-and-drives.md`)

This specification defines the exact kinematic parameters, steering vectors, and state rules for **Drive Types** (`slot: "drive"`) and **AI Processors** (`slot: "processor"`) in `Sim`. Phase 2 can copy the constants and equations below straight into `prototypes/arena-sandbox.html` (and later `src/sim.js`).

> **Determinism Rule**: All timing jitter and tie-breakers MUST use the battle's seeded RNG (`B.rng()`), never `Math.random()`.

---

## 1. Drive Types (`slot: "drive"`)

A robot's **Drive** governs how the desired movement vector `(mx, my)` from its AI processor is translated into hull rotation (`b.body`) and velocity `(b.vx, b.vy)`.

### 1.1 Drive Parameter Table

| Parameter | Key | `wheels` (Standard Wheels) | `tracks` (Heavy Tank Tracks) | `omni` (Omni-Drive / Hover) | `boost` (Overboost Thrusters) |
|---|---|---|---|---|---|
| **Display Name** | `name` | Standard Wheels | Heavy Tank Tracks | Omni-Drive | Overboost Thrusters |
| **Top Speed Multiplier** | `speedMult` | `1.00×` | `0.90×` | `0.92×` | `1.15×` |
| **Hull Turn Rate (`°/s`)** | `turnBody` | `180 °/s` | `260 °/s` | `200 °/s` | `135 °/s` |
| **Acceleration (`px/s²`)** | `accel` | `550 px/s²` | `700 px/s²` | `480 px/s²` | `800 px/s²` |
| **Braking / Decel (`px/s²`)** | `decel` | `650 px/s²` | `900 px/s²` | `420 px/s²` | `500 px/s²` |
| **Sideways Speed Factor** | `sideways` | `0.15` | `0.00` (pivots instead) | `1.00` (full holonomic) | `0.10` |
| **Reverse Gear Cap** | `reverseMult` | `0.65×` | `0.85×` | `1.00×` | `0.40×` |
| **Weight Penalty Multiplier** | `weightMult` | `1.00×` | `0.50×` *(halves AR/HP slow)* | `1.15×` *(sensitive to weight)* | `0.85×` |
| **Knockback Taken** | `kbMult` | `1.00×` | `0.50×` *(planted)* | `1.35×` *(light/hover)* | `1.00×` |
| **Dash Burst** | `dash` | None | None | None | `1.60×` spd for `0.6 s` every `4.5 s` |
| **Strain** | `strain` | `0` | `0` | `1` | `1` |

### 1.2 Kinematic Equations (Replacing Lines 458–465 in `Sim.step`)

Given the desired movement vector `(mx, my)` produced by the robot's processor:

1. **Desired Direction & Magnitude**:
   ```js
   const mag = Math.min(1, Math.hypot(mx, my));
   const want = mag > 0.01 ? Math.atan2(my, mx) : b.body;
   ```
2. **Effective Weight Penalty (in `statsOf`)**:
   ```js
   const rawPenalty = 0.09 * Math.min(4, b.lv.armor) + 0.04 * Math.min(4, b.lv.hp)
                    + 0.04 * Math.max(0, b.lv.armor - 4) + 0.02 * Math.max(0, b.lv.hp - 4);
   s.speed *= drive.speedMult * Math.max(0.3, 1 - rawPenalty * drive.weightMult);
   ```
3. **Hull Rotation & Reverse Check**:
   - Compute angle error `diff = wrapA(want - b.body)`.
   - **Reverse Gear (`tracks` & `wheels` when Kiting)**: If `b.proc === 'kiter'` and `Math.abs(diff) > rad(105)`, the robot steers its *rear* toward `want` (`b.body = turnToward(b.body, wrapA(want + Math.PI), rad(drive.turnBody) * dt)`) and drives backward at up to `drive.reverseMult * b.s.speed`.
   - **Normal Forward Steering**: Otherwise, `b.body = turnToward(b.body, want, rad(drive.turnBody) * dt)`.
4. **Forward & Sideways Velocity Components**:
   - Decompose the desired velocity vector into hull-forward (`u_fwd`) and hull-lateral (`u_side`) components:
     ```js
     const errA = wrapA(want - b.body);
     const fwdAlign = Math.cos(errA) >= 0
       ? Math.cos(errA)
       : (b.proc === 'kiter' ? Math.cos(errA) * drive.reverseMult : 0);
     const sideAlign = Math.sin(errA) * drive.sideways;
     ```
   - For **`omni`**: `fwdAlign = Math.cos(errA)` and `sideAlign = Math.sin(errA)` (`sideways = 1.0`), so the robot glides in direction `want` at `100%` of `b.s.speed * mag` regardless of where `b.body` points!
   - For **`tracks`**: `sideways = 0.0`, `turnBody = 260 °/s`, so it snaps its hull toward `want` and powers straight ahead with high traction.
   - For **`boost`**: every `4.5 s` (`b.dashCd <= 0` and `mag > 0.4`), triggers `b.dashT = 0.6` (`b.dashCd = 4.5`), multiplying top speed by `1.60×` while `b.dashT > 0`.
5. **Smooth Acceleration (`accel` / `decel`)**:
   ```js
   const targetVx = (Math.cos(b.body) * fwdAlign - Math.sin(b.body) * sideAlign) * topSp * mag;
   const targetVy = (Math.sin(b.body) * fwdAlign + Math.cos(b.body) * sideAlign) * topSp * mag;
   const dvx = targetVx - b.vx, dvy = targetVy - b.vy, dv = Math.hypot(dvx, dvy);
   const rate = (Math.hypot(targetVx, targetVy) >= Math.hypot(b.vx, b.vy) ? drive.accel : drive.decel) * dt;
   if (dv <= rate || dv < 1e-4) { b.vx = targetVx; b.vy = targetVy; }
   else { b.vx += (dvx / dv) * rate; b.vy += (dvy / dv) * rate; }
   ```
6. **Strain Break (`DRIVE LOCKED`)**:
   - If `omni` or `boost` breaks from strain, set `b.driveBroken = true`: `sideways` drops to `0`, `dash` is disabled, and `b.s.speed *= 0.6`.

---

## 2. Processor Types (`slot: "processor"`)

A robot's **Processor** computes the desired movement vector `(mx, my)` and target priority each tick before the Drive executes it.

### 2.1 Overview & Comparison Table

| Processor ID | Name | Radial Weight | Strafe Weight | Strafe Flip Interval (`strafeT`) | Special Behaviour | Strain |
|---|---|---|---|---|---|---|
| `standard` | **Stock Controller** | `1.00` | `0.80` | `0.80 – 2.50 s` | Orbits at `want_r`; standard separation (`60 px`). | `0` |
| `zigzag` | **Zigzag Evasion Chip** | `0.95` | `1.25` | `0.35 – 0.60 s` | Serpentine `+35°` approach weave; jukes incoming shells/saws within `95 px`. | `1` |
| `kiter` | **Kiter Logic Chip** | `1.15` (retreat) | `0.45` (retreat) / `0.85` (band) | `0.90 – 1.80 s` | Retreats at `adist < 0.78 × want_r`; steers out of arena corners; fires while reversing. | `1` |
| `rammer` | **Rammer Aggression Chip** | `1.30` | `0.15` | `1.20 – 2.20 s` | Sets `want_r = 0`, ignores enemy separation, leads target by `0.25 s`, deals blunt collision damage on high-speed impact. | `1` |

---

### 2.2 Detailed Processor Rules

#### A. `standard` (Stock Controller — Current Baseline)
- **Strafe Timer**: When `b.strafeT <= 0`, flip `b.strafe *= -1` and set `b.strafeT = 0.8 + rng() * 1.7`.
- **Desired Vector**:
  ```js
  const radial = Math.max(-1, Math.min(1, (adist - want_r) / 80));
  let mx = Math.cos(toO) * radial + Math.cos(toO + Math.PI / 2) * b.strafe * 0.8;
  let my = Math.sin(toO) * radial + Math.sin(toO + Math.PI / 2) * b.strafe * 0.8;
  ```
- **Separation & Walls**: Standard `60 px` repulsion from main robots (`32 px` from enemy helpers) and `70 px` wall margin.

#### B. `zigzag` (Zigzag Evasion Chip)
Designed for light/medium skirmishers (`Dasher`, `Hornet`, `Burner`) to dodge slow projectiles (`heavy` cannon shells, `mortar` lobs, `saw` blades).
1. **High-Frequency Strafe Flip**:
   - When `b.strafeT <= 0`, flip `b.strafe *= -1` and set `b.strafeT = 0.35 + rng() * 0.25`.
2. **Projectile Juke Reflex (`b.jukeCd`)**:
   - Cooldown `0.60 s`. If `b.jukeCd <= 0`, check if any enemy bullet/saw is within `95 px` and moving toward `b`, OR an enemy mortar shell has `hypot(tx - b.x, ty - b.y) < 60`.
   - If detected: immediately flip `b.strafe = toRightOfThreat ? 1 : -1`, reset `b.strafeT = 0.45`, and set `b.jukeCd = 0.60`.
3. **Serpentine Approach Vector**:
   - When closing distance (`adist > want_r + 25`), offset the approach angle `toO` by `weave = b.strafe * rad(35)` so the robot approaches in sharp diagonal tacks rather than walking straight down the enemy's barrel:
     ```js
     const closing = adist > want_r + 25;
     const dirA = closing ? toO + b.strafe * rad(35) : toO;
     const radial = Math.max(-1, Math.min(1, (adist - want_r) / 70)) * 0.95;
     const sw = closing ? 0.95 : 1.25;
     let mx = Math.cos(dirA) * radial + Math.cos(toO + Math.PI / 2) * b.strafe * sw;
     let my = Math.sin(dirA) * radial + Math.sin(toO + Math.PI / 2) * b.strafe * sw;
     ```

#### C. `kiter` (Kiter Logic Chip)
Designed for ranged specialists (`Marksman`, `Lobber`, `Saw` / `Laser` mid-rangers) to stay out of brawl range (`spinner`, `flame`, `flipper`, `emp`).
1. **Three-Zone Range Band**:
   - Let `minSafe = Math.max(150, want_r * 0.78)` and `maxBand = want_r + 45`.
   - **Danger Zone (`adist < minSafe`)**: Robot enters **Retreat**.
     - `radial = -1.15` (prioritises opening distance over strafing).
     - `strafeWeight = 0.45`.
   - **Sweet Spot (`minSafe <= adist <= maxBand`)**:
     - `radial = (adist - want_r) / 120 * 0.5` (gentle range keeping).
     - `strafeWeight = 0.85`.
   - **Too Far (`adist > maxBand`)**:
     - `radial = Math.min(0.85, (adist - maxBand) / 90)` (cautious advance).
     - `strafeWeight = 0.75`.
2. **Corner-Escape Steering**:
   - Kiters die when they back straight into an arena corner. Whenever `b.x < 120 || b.x > W - 120 || b.y < 120 || b.y > H - 120`:
     - Compute vector from robot to arena centre: `cx = W / 2 - b.x, cy = H / 2 - b.y`.
     - Set `b.strafe` to the tangent direction that points toward the centre of the arena:
       ```js
       const tangCross = -Math.sin(toO) * cx + Math.cos(toO) * cy;
       b.strafe = tangCross >= 0 ? 1 : -1;
       b.strafeT = 0.7;
       ```
     - Increase tangential weight to `1.10` so the Kiter arcs smoothly around the perimeter away from the corner.
3. **Expanded Personal Space**:
   - Repulsion radius against enemy main robots is increased from `60 px` to `95 px`.

#### D. `rammer` (Rammer Aggression Chip)
Designed for heavy bruisers (`Bulwark`, `Spinner`, `Flipper`, `Flame`, `Self-Destruct`) to pressure kiters and disrupt formations.
1. **Opportunistic Target Lock**:
   - In `pickTarget`, a `rammer` reduces sticky-target hysteresis from `1.35×` to `1.15×` and gives a `0.75×` effective distance bonus to any enemy below `45%` HP (finishing off wounded targets).
2. **Intercept Pursuit Vector**:
   - Overrides `want_r = 0` (unless `b.s.weapon === 'spinner'` and `b.cd > 0.15`, where it briefly bounces to `45 px` to re-arm).
   - Aims movement at a `0.25 s` lead point ahead of the target:
     ```js
     const lx = anchor.x + (anchor.vx || 0) * 0.25 - b.x;
     const ly = anchor.y + (anchor.vy || 0) * 0.25 - b.y;
     const toLead = Math.atan2(ly, lx);
     let mx = Math.cos(toLead) * 1.30 + Math.cos(toLead + Math.PI / 2) * b.strafe * 0.15;
     let my = Math.sin(toLead) * 1.30 + Math.sin(toLead + Math.PI / 2) * b.strafe * 0.15;
     ```
   - **No Enemy Separation**: Skips repulsion (`sd < RR`) against all enemy robots so it drives straight into hull contact.
3. **Blunt Ram Impact (`b.ramCd`)**:
   - Even if the robot does not carry a `spinner` or `flipper`, a `rammer` deals collision damage when slamming into an enemy (`d < (b.size + e.size) / 2 + 4`) while `b.ramCd <= 0` and closing speed `> 100 px/s`:
     - **Impact Damage**: `dmg = 4 + 1.5 * b.lv.armor + 1.0 * b.lv.hp` (armour applies normally).
     - **Knockback & Micro-Stun**: Pushes target at `240 px/s` (scaled by target's `drive.kbMult`) with `0.25 s` stun; recoils self at `90 px/s`; sets `b.ramCd = 1.8 s`.

---

## 3. Drop-In Reference Code for Phase 2 (`Sim`)

```js
const DRIVES = {
  wheels: { name: 'Standard Wheels', speedMult: 1.00, turnBody: 180, accel: 550, decel: 650, sideways: 0.15, reverseMult: 0.65, weightMult: 1.00, kbMult: 1.00, strain: 0 },
  tracks: { name: 'Heavy Tank Tracks', speedMult: 0.90, turnBody: 260, accel: 700, decel: 900, sideways: 0.00, reverseMult: 0.85, weightMult: 0.50, kbMult: 0.50, strain: 0 },
  omni:   { name: 'Omni-Drive', speedMult: 0.92, turnBody: 200, accel: 480, decel: 420, sideways: 1.00, reverseMult: 1.00, weightMult: 1.15, kbMult: 1.35, strain: 1 },
  boost:  { name: 'Overboost Thrusters', speedMult: 1.15, turnBody: 135, accel: 800, decel: 500, sideways: 0.10, reverseMult: 0.40, weightMult: 0.85, kbMult: 1.00, strain: 1, dash: true },
};

const PROCS = {
  standard: { name: 'Stock Controller', strain: 0 },
  zigzag:   { name: 'Zigzag Evasion Chip', strain: 1 },
  kiter:    { name: 'Kiter Logic Chip', strain: 1 },
  rammer:   { name: 'Rammer Aggression Chip', strain: 1 },
};
```
