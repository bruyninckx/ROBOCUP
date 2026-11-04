# Upgrade Cards Specification (`docs/upgrade-cards.md`)

This document defines the complete catalog of robot upgrade cards for **Scrapyard Dominus** and the **Robot Arena Sandbox** (`Sim`). It is designed so Agent 1 can plug the values directly into `Sim` (`STRAIN`, `MODS`, `HELPERS`, `LOTS`) and the market/crate economy.

A machine-readable companion file is also provided in `docs/upgrade-cards.json`.

---

## 1. Slot & Strain Rules Summary

Each robot has a chassis with **7 core stats** (`hp`, `armor`, `speed`, `turret`, `fp`, `acc`, `bullet`, levels `0–4` in standard play, up to `8` for Squadron Titans) and the following equipment slots:

| Slot | Capacity | Visibility | Strain Rule | Break Consequence (`breakPart`) |
|---|---|---|---|---|
| **`weapon`** | 1 per robot | Open | `1–3` strain depending on weapon | **WEAPON DAMAGED** (`BLADE CRACKED` on spinner): deals `×0.5` damage/firepower for the rest of the fight |
| **`calibre`** | 1 per gun robot | Open | `0` (Rapid/Medium) or `1` (Heavy) | **BARREL WARPED**: `−25` accuracy (min 20) for the rest of the fight |
| **`module`** | 1 per robot | **Hidden (`?`)** until triggered or spotted | `0–2` strain depending on module | **MODULE FRIED**: module is disabled (`mod = null`), active shield drops to `0`, and module is revealed |
| **`helper`** | 0–3 per robot | Open | `1` strain per helper drone | **DRONE FAILURE**: that specific helper drone immediately shuts down (`hp = 0`) |
| **`stat`** | Levels `0–4` (`0–8` squad) | Open | `0` at levels `1–3`; **Overdrive strain** `+1` at level `4–6` (`+2` at level `7+`) on `speed`, `turret`, or `fp` | **ENGINE BLOWN** (`speed ×0.6`), **TURRET MOTOR BURNT** (`turret ×0.5`), or **OVERHEATED** (`fp/dmg ×0.7`) |
| **`drive`** *(Phase 2)* | 1 per robot | Open | `0–1` strain | **DRIVE LOCKED**: loses lateral strafe / boost multiplier (`speed ×0.6`) |
| **`processor`** *(Phase 2)* | 1 per robot | Hidden or Open | `0–1` strain | **LOGIC GLITCH**: reverts to default movement & nearest-target behaviour |

### How Strain & Engineers Work (Reference Formula)
- **Total Strain (`S`)**: sum of weapon strain + calibre strain + module strain + helper strain + stat overdrive strain (+ drive/processor strain).
- **Overload Multiplier**: `overload = 1 + 0.15 × max(0, S - 4)`.
- **Malfunction Chance (per fight)**: `glitch = min(0.90, 0.08 × S × 0.6^E)` where `E` is the number of assigned **Engineers (`0–3`)**. Triggers a temporary **ENGINE STALL** (speed = 0) or **TURRET JAMMED** (cannot rotate/fire) lasting `2.5 / (1 + 0.4 × E)` seconds.
- **Part Break Chance (per strained part, per fight)**: `p_break = min(0.50, 0.035 × part_strain × overload × 0.5^E)`.

---

## 2. Weapon Cards (`slot: "weapon"`)

Replacing a weapon swaps the robot's primary armament and sets its recommended engagement range if needed.

| ID | Card Name | Slot | Effect (Sim Parameters) | Strain | Price Range (Credits) | Crate Tier |
|---|---|---|---|---|---|---|
| `gun` | **Autocannon (Standard Gun)** | `weapon` | Default ballistic gun. Uses chosen calibre (`rapid`, `medium`, `heavy`). | `1` | `1–2 cr` (Stock) | Scrap / Winner |
| `laser` | **Laser Retrofit** | `weapon` | Continuous beam (`280 px` range), deals `60%` of `fp` per second, **ignores armour**, pierces all robots in line, stopped by enemy energy walls. Sets range to `mid`. | `2` | `3–5 cr` | Winner |
| `mortar` | **Mortar Retrofit** | `weapon` | Lobbed shell (`0.45 shots/s`, `0.55×` bullet speed, min range `110 px`). Explodes at target point (`45 px` splash radius: `100%` dmg within `22 px`, `50%` dmg out to `45 px`). Lobs over walls. Sets range to `long`. | `2` | `3–5 cr` | Winner |
| `saw` | **Saw Blade Launcher** | `weapon` | Fires ricocheting discs (`1.1 blades/s`, `0.95×` bullet speed, `0.8×` per-hit dmg). Bounces off arena walls, enemy energy walls, and robots (`×0.75` dmg decay per bounce/hit, up to `3` robot hits, `4 s` life). Never hits own squad. | `2` | `4–6 cr` | Winner |
| `flame` | **Flamethrower** | `weapon` | Short cone of fire (`140 px` range, `±22°` cone). Deals `50%` of `fp`/s (ignores armour) and ignites targets for up to `4 s` (`5 dmg/s` true damage). Burning robots spread fire (`2 s`) on contact to friend or foe. Blocked by enemy energy walls. | `2` | `3–5 cr` | Winner |
| `spinner` | **Spinner Blade** | `weapon` | Whole-body spinning disc (`+15%` charge speed). Rams enemies (`2 hits/s` max): contact deals `0.75 × fp` (can crit), hurls enemy back (`340 px/s`, `0.35 s` stun), recoils self (`200 px/s`). **Deflects `25%`** of incoming bullets and saw blades. | `3` | `4–6 cr` | Winner |
| `railgun` | **Prototype Railgun** *(Legendary)* | `weapon` | Instant hitscan slug (`0.4 shots/s`, `450 px` range, requires `<2°` aim). Pierces all targets and energy walls; ignores `50%` of armour and deals `25` knockback. Only 1 copy per game. | `3` | `6–9 cr` | Legendary |

---

## 3. Calibre & Barrel Tuning Cards (`slot: "calibre"`)

Installed on `gun` robots (installing a calibre kit on a non-gun robot converts its weapon back to `gun` with that calibre, or tunes its existing gun).

| ID | Card Name | Slot | Effect (Sim Parameters) | Strain | Price Range (Credits) | Crate Tier |
|---|---|---|---|---|---|---|
| `rapid` | **Rapid-Fire Kit** | `calibre` | `4.0 shots/s`, bullet speed `×1.3`, turret turn `×1.25`, aim tolerance `7°`, `+8%` bonus dmg per shot. Shreds unarmoured targets and decoys; weak vs high armour. | `0` | `2–3 cr` | Scrap / Winner |
| `medium` | **Balanced Receiver** | `calibre` | Standard `1.4 shots/s`, bullet speed `×1.0`, turret turn `×1.0`, aim tolerance `5°`. | `0` | `1–2 cr` (Stock) | Scrap |
| `heavy` | **Heavy Cannon Kit** | `calibre` | `0.5 shots/s`, shell speed `×0.6`, turret turn `×0.55`, aim tolerance `3°`. Massive single-hit damage punches straight through flat armour. | `1` | `2–4 cr` | Winner |

---

## 4. Surprise Module Cards (`slot: "module"`)

Each robot holds **1 module**, installed face-down (`?` badge) until it triggers in combat or is revealed by an enemy `Spotter` within `220 px`.

### 4.1 Core Modules (Built in `Sim`)

| ID | Card Name | Slot | Effect (Sim Parameters) | Strain | Price Range (Credits) | Crate Tier |
|---|---|---|---|---|---|---|
| `shield` | **Energy Shield** | `module` | Starts with a `25 HP` bubble that absorbs damage before armour/HP. Recharges at `10 HP/s` after `3.0 s` without taking a hit. | `1` | `4–6 cr` | Winner |
| `decoy` | **Decoy Hologram** | `module` | Once per fight at `≤60%` HP, spawns a moving hologram clone for `2.5 s`. Enemies currently targeting this robot switch aim to the decoy. | `1` | `4–6 cr` | Winner |
| `smoke` | **Smoke Screen** | `module` | Once per fight at `≤50%` HP, deploys a `75 px` radius smoke cloud for `4.0 s`. Shots aimed into smoke suffer `+22°` bullet/saw spread (`+70 px` mortar scatter, `+18°` laser wobble). Spotters see through smoke. | `0` | `2–4 cr` | Scrap / Winner |
| `repair` | **Repair Drone** | `module` | Internal micro-drone repairs `6 HP/s` whenever the robot has not been hit for `1.2 s` (capped at `35%` of max HP repaired per fight). | `1` | `3–5 cr` | Winner |
| `mines` | **Mine Layer** | `module` | Drops a proximity mine every `1.6 s` while driving (max `5` active, arms after `0.6 s`). Triggers within `20 px`, dealing `22` splash damage (`40 px` radius, ignores armour) to any robot outside own squad. | `1` | `3–5 cr` | Winner |
| `emp` | **EMP Burst** | `module` | Triggers when an enemy enters `130 px`: stuns all enemy robots and drones within `150 px` for `1.8 s` (`12 s` cooldown). | `2` | `3–5 cr` | Winner |
| `flipper` | **Hydraulic Flipper** | `module` | Cooldown `3.0 s`. When ready, robot charges to melee (`25 px`). Contact deals `14` damage, launches enemy (`380 px/s`), and stuns for `1.3 s`. Wall slam at `>150 px/s` deals `+8` true damage. | `2` | `2–4 cr` | Scrap / Winner |
| `boom` | **Self-Destruct Core** | `module` | Below `30%` HP, robot overrides range to `0` and rams nearest enemy. On death, detonates for up to `45` true damage within `90 px` (hits friend and foe). | `1` | `2–3 cr` | Scrap / Winner |

### 4.2 Phase 2 Expansion Modules (Spec Ready)

| ID | Card Name | Slot | Effect (Sim Parameters) | Strain | Price Range (Credits) | Crate Tier |
|---|---|---|---|---|---|---|
| `reflect` | **Reflective Plating** | `module` | Bounces `50%` of incoming `laser` damage back at the shooter and reduces `flame` build-up by `50%`. Reveals on first laser/flame hit. | `0` | `2–4 cr` | Scrap / Winner |
| `grapple` | **Grappling Hook** | `module` | Cooldown `8.0 s`. Fires a tether at target within `240 px`, yanking it `140 px` toward this robot (`320 px/s` pull) and stunning for `0.4 s`. Combos with `mines`, `spinner`, `flame`. | `2` | `3–5 cr` | Winner |
| `jets` | **Jump Jets** | `module` | Cooldown `7.0 s`. When an enemy enters `90 px` (or mortar shell is `<0.4 s` from impact), leaps `160 px` away over obstacles/bots (`0.35 s` airtime, untargetable mid-leap). | `2` | `3–5 cr` | Winner |
| `oil` | **Oil Slick Dispenser** | `module` | At `≤65%` HP (and every `8 s`), leaves a `65 px` oil puddle for `5 s`. Robots crossing oil lose traction (`turnBody ×0.25`, slide along current velocity vector). Ignites if hit by `flame` (`12 dmg/s` fire zone for `3 s`). | `1` | `2–3 cr` | Scrap / Winner |

---

## 5. Helper Drone Cards (`slot: "helper"`)

Each main robot can bring up to **3 helper drones** (`+1 strain` each). Helpers are **open information** and shut down immediately if their parent robot is destroyed.

| ID | Card Name | Slot | Drone Stats | Effect (Sim Parameters) | Strain | Price Range (Credits) | Crate Tier |
|---|---|---|---|---|---|---|---|
| `medic` | **Medic Drone** | `helper` | `18 HP`, `150 spd`, `20 px` | Trails `45 px` behind owner; heals owner `4 HP/s` (`130 px` beam range, max `8 HP/s` from multiple medics). High priority target for enemy `medics` focus. | `1` | `3–5 cr` | Winner |
| `waller` | **Waller Drone** | `helper` | `40 HP`, `130 spd`, `20 px` | Rides `55 px` ahead of owner; deploys a `64 px` wide energy wall (`40 HP`, lasts `6 s`) every `5 s` (max `2` walls). Stops enemy bullets/lasers, bounces saw blades; own team's shots pass through; mortars lob over. | `1` | `3–5 cr` | Winner |
| `bodyguard` | **Bodyguard Drone** | `helper` | `60 HP`, `2 AR`, `140 spd`, `26 px` | Heavy armoured drone that parks `38 px` in front of owner along the line of fire to body-block bullets and saws. Lasers pierce through it. | `1` | `3–4 cr` | Winner |
| `gunner` | **Gun Drone** | `helper` | `30 HP`, `160 spd`, `20 px` | Orbits owner at `55 px` radius; fires `2 shots/s` (`3 dmg` each, `380 px/s` bullet speed) at owner's target. Weak vs armour, great vs light bots and enemy drones. | `1` | `3–5 cr` | Winner |
| `spotter` | **Spotter Drone** | `helper` | `25 HP`, `160 spd`, `20 px` | Hovers behind owner (`60 px`). Grants owner `+15%` accuracy (up to `99%`), ignores enemy Smoke Screens, and reveals hidden enemy modules within `220 px`. | `1` | `2–4 cr` | Scrap / Winner |
| `jammer` | **Jammer Drone** | `helper` | `25 HP`, `150 spd`, `20 px` | Advances toward owner's target (up to `130 px` ahead). Enemy main robots within `160 px` of the Jammer turn their turrets at `45%` speed (`jam = 0.45`). | `1` | `2–4 cr` | Scrap / Winner |
| `bomber` | **Bomber Drone** | `helper` | `20 HP`, `190 spd`, `20 px` | Waits `2.0 s` behind owner, then dives at owner's target and detonates within `22 px` for `24` splash damage (`50 px` radius, ignores armour). Single use per fight. | `1` | `2–4 cr` | Scrap / Winner |
| `miner` | **Miner Drone** | `helper` | `30 HP`, `160 spd`, `20 px` | Orbits owner at `48 px` radius, dropping a mine every `1.6 s` (max `5`, `24` splash damage within `40 px`). Hits any robot outside own squad (including allied teams!). | `1` | `3–5 cr` | Winner |

---

## 6. Stat & Chassis Upgrade Cards (`slot: "stat"`)

Stat cards permanently raise one stat on a chosen robot by `+1` level (capped at level `4` for standard robots).
- **Weight Rule**: each `hp` level reduces speed by `4%`; each `armor` level reduces speed by `9%`.
- **Overdrive Strain Rule**: raising `speed`, `turret`, or `fp` to **level 4** adds **`+1` overdrive strain** to the robot (level `7+` on Squadron Titans adds `+2` strain). `hp`, `armor`, `acc`, and `bullet` never add overdrive strain.

| ID | Card Name | Slot | Stat Modified | Level Values (`0 → 1 → 2 → 3 → 4`) | Overdrive Strain at Lv 4 | Price Range (Credits) | Crate Tier |
|---|---|---|---|---|---|---|---|
| `hull` | **Reinforced Hull** | `stat` | `hp` (`+1`) | `60 → 85 → 110 → 135 → 160 HP` (`−4%` spd/lv) | `0` | `2–3 cr` | Scrap / Winner |
| `plate` | **Armour Plate** | `stat` | `armor` (`+1`) | `0 → 1.5 → 3.0 → 4.5 → 6.0` flat reduction (`−9%` spd/lv) | `0` | `2–4 cr` | Scrap / Winner |
| `engine` | **Tuned Engine** | `stat` | `speed` (`+1`) | `60 → 95 → 130 → 165 → 200 px/s` | `+1` at Lv 4 | `2–3 cr` | Scrap / Winner |
| `motor` | **Turret Motor** | `stat` | `turret` (`+1`) | `30 → 60 → 100 → 150 → 220 °/s` | `+1` at Lv 4 | `1–3 cr` | Scrap / Winner |
| `core` | **High-Output Core** | `stat` | `fp` (`+1`) | `7 → 10 → 13.5 → 17.5 → 22 dmg/s` | `+1` at Lv 4 | `3–5 cr` | Winner |
| `chip` | **Targeting Chip** | `stat` | `acc` (`+1`) | `45% → 60% → 75% → 87% → 97%` | `0` | `2–3 cr` | Scrap / Winner |
| `barrel` | **Long Barrel** | `stat` | `bullet` (`+1`) | `250 → 350 → 470 → 600 → 800 px/s` | `0` | `1–3 cr` | Scrap / Winner |
| `patch` | **Scrap Patch Kit** | `stat` | Repair / `hp` | Immediately repairs `40` damage on a robot (or `+1 hp` if at level `0`). Consumed on use. | `0` | `1–2 cr` | Scrap |

---

## 7. Processor & Drive Cards (`slot: "processor"` / `"drive"`, Phase 2)

Full kinematic formulas and state machines for these cards are specified in `docs/processors-and-drives.md`. Summary table for economy/strain integration:

| ID | Card Name | Slot | Summary Effect | Strain | Price Range (Credits) | Crate Tier |
|---|---|---|---|---|---|---|
| `proc_std` | **Stock Controller** | `processor` | Standard orbit-and-strafe behaviour at preferred range; targets nearest enemy. | `0` | `0 cr` (Stock) | — |
| `proc_zigzag` | **Zigzag Evasion Chip** | `processor` | Rapid `0.45 s` lateral direction reversals with `1.25×` strafe weight and `+35°` approach weaving when closing distance. Counters slow shells & mortars. | `1` | `2–4 cr` | Winner |
| `proc_kiter` | `processor` | **Kiter Logic Chip** | Maintains `[range - 20, range + 40]` buffer; reverses away at `1.1×` radial weight when enemies close within `0.75 × range`, firing over its shoulder. | `1` | `2–4 cr` | Winner |
| `proc_rammer` | **Rammer Aggression Chip** | `processor` | Ignores enemy separation buffer, locks onto lowest-HP or nearest enemy, drives straight into contact (`want_r = 0`), dealing collision knockback + chip damage on high-speed impact. | `1` | `2–3 cr` | Scrap / Winner |
| `drive_wheels` | **Standard Wheels** | `drive` | Balanced `180 °/s` body turn, `550 px/s²` acceleration, `0.25` lateral drift factor. | `0` | `0 cr` (Stock) | — |
| `drive_tracks` | **Heavy Tank Tracks** | `drive` | Pivot-in-place (`260 °/s` turn even at `0` speed), ignores `50%` of armour/HP weight penalty, `50%` knockback resistance, `0.90×` top speed, no sideways slip. | `0` | `2–4 cr` | Winner |
| `drive_omni` | **Omni-Drive / Hover** | `drive` | Full holonomic movement (`align = 1.0` regardless of body facing; moves sideways at `100%` speed), `0.92×` base speed, takes `1.35×` knockback. | `1` | `3–5 cr` | Winner |
| `drive_boost` | **Overboost Thrusters** | `drive` | `1.15×` top speed and a `1.6×` dash burst for `0.6 s` every `4.5 s`, at the cost of wider turns (`135 °/s` body turn). | `1` | `2–4 cr` | Scrap / Winner |

---

## 8. Personnel & Garage Cards (`slot: "crew"`)

Sold in the Market or pulled from Crates alongside robot parts:

| ID | Card Name | Slot | Effect | Strain | Price Range (Credits) | Crate Tier |
|---|---|---|---|---|---|---|
| `mech` | **Mechanic** | `crew` | `+1` credit income every Upkeep phase. | `0` | `3–4 cr` | Winner |
| `engineer` | **Chief Engineer** | `crew` | Assigned to a robot (`max 3`). Cuts malfunction chance by `40%`, halves part break chance (`×0.5`), and shortens glitches (`÷1.4`). | `0` | `2–4 cr` | Scrap / Winner |
| `robot` | **Fresh Chassis** | `crew` | Adds a new random preset robot to your garage (`max 3`; sells for `2 cr` if garage is full). | `0` | `4–6 cr` | Winner |
