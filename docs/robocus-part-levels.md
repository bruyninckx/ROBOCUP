# ROBOCUS: are the parts worth a level? (15 Nov 2026)

Kev (15 Nov): "run an investigation on balance issues with all the module and part upgrades available, see if it makes sense, most upgrades should increase level by 1".

**Had we done this before?**
- Partly. On 10 Nov, on the old lineup, we measured which part suits which robot. That produced the great/poor fits and the epic combos.
- The game's odds assume every part is worth one level and a legendary two (`src2/repair.js`: PART 0.62, LEG 1.24 logits).
- Nobody had checked that assumption, and nothing at all had been measured on the tuned lineup.

## 1. The test

- **Single parts:** every part (27) on every robot (33) against 4 robots a level up (level 4: its own level), with the same seeds with and without the part. That is 14,784 fights, from the tag recheck (`tools/damage-lab/tag-tuned/parts_*.json`).
- **What "worth a level" means:** with the part, a robot should beat the level above as often as it beats its own level, about 50% where it starts at 38%. The numbers below turn the change in wins into levels (one level = 64% vs 36% in the tuned lineup).
- **Stacking:** every level 0-2 robot with 8 random pairs of parts (no legendaries or chips, at most one module) against 4 robots two levels up. 4,864 fights (`tools/damage-lab/part-stack.js`).

## 2. Each part, in levels

Win % = with the part, vs a level up, all robots (no part: 38%). Then levels gained: all robots / on level 0-1 robots / level 2-3 / level 4. **Bold** = far off the target (1 for a part, 2 for a legendary). About ±0.15 for "all", ±0.3 for a group.

| Part | Kind | Win % | All | L0-1 | L2-3 | L4 |
|---|---|---|---|---|---|---|
| Gun drone | drone | 53% | +1.1 | **+1.7** | +0.7 | +0.6 |
| Laser drone | drone | 49% | +0.8 | +1.1 | +0.5 | **+0.5** |
| Waller drone | drone | 48% | +0.7 | +0.6 | +0.7 | +1.0 |
| Booster drone | drone | 48% | +0.7 | +1.1 | **+0.5** | **+0.4** |
| Jammer drone | drone | 45% | **+0.5** | +0.7 | **+0.3** | **+0.5** |
| Bodyguard drone | drone | 44% | **+0.4** | **+0.3** | **+0.2** | +0.8 |
| Blocker drone | drone | 44% | **+0.4** | **+0.4** | **+0.4** | +0.6 |
| Spotter drone | drone | 44% | **+0.4** | **+0.5** | **+0.0** | +0.8 |
| Medic drone | drone | 43% | **+0.4** | +0.5 | **+0.3** | **+0.2** |
| Tow cable | module | 55% | +1.2 | **+1.5** | +1.0 | +1.0 |
| EMP burst | module | 52% | +0.9 | +1.4 | +0.5 | +0.8 |
| Sensor scrambler | module | 51% | +0.9 | +1.1 | +0.7 | +0.9 |
| Energy shield | module | 50% | +0.8 | +0.9 | +1.1 | **+0.3** |
| Mine layer | module | 49% | +0.8 | **+1.5** | **+0.3** | **+0.1** |
| Pop-up flipper | module | 48% | +0.7 | +1.1 | **+0.5** | **+0.4** |
| Repair kit | module | 41% | **+0.2** | **+0.4** | **+0.0** | **+0.2** |
| Weapon overhaul | stat | 57% | +1.3 | **+1.7** | +0.8 | **+1.5** |
| Overdrive | stat | 51% | +0.9 | +0.9 | +0.7 | +1.1 |
| Reinforced hull | stat | 49% | +0.8 | +1.0 | **+0.3** | +1.2 |
| Armour kit | stat | 48% | +0.7 | +1.0 | **+0.5** | +0.7 |
| Power kit | stat | 46% | +0.5 | +0.6 | **+0.5** | +0.6 |
| Prototype core | legendary | 60% | +1.6 | +1.8 | **+1.4** | **+1.4** |
| Quantum shield | legendary | 58% | **+1.4** | **+1.3** | +1.7 | **+1.3** |
| Field hospital | legendary | 52% | **+1.0** | **+1.3** | **+0.7** | **+0.9** |
| Matador chip | chip | 47% | +0.6 | +1.2 | **-0.0** | **+0.5** |
| Wall Bait chip | chip | 46% | +0.6 | +1.1 | **+0.0** | **+0.5** |
| Pester chip | chip | 45% | **+0.5** | +0.7 | **+0.2** | +0.7 |

## 3. What it says

1. **The average part is worth 0.7 of a level, not 1.**
   - Only 12 of the 21 normal parts land between 0.7 and 1.3.
   - Range: Repair kit +0.2 to Weapon overhaul +1.3.
2. **Legendaries are worth 1.0-1.55 levels, not 2.**
   - Field hospital (+1.0) is no better than a Gun drone (+1.1) or Tow cable (+1.2).
3. **Parts lose value on bigger robots.**

   | Robots | Average normal part |
   |---|---|
   | Level 0-1 | +0.95 |
   | Level 2-3 | +0.5 |
   | Level 4 | +0.65 |

   - The cause: drones and modules use fixed numbers. The gun drone does 3.2 a shot, the laser 3.5 a second, a mine 22, the pop-up flipper 14; the medic and the repair kit heal fixed amounts, and the shield has 30 HP.
   - In the tuned lineup a robot's health grows with its power dial: a level 3 robot has 1.4-2.4x the health of a starter. So the same drone does less and less against bigger robots.
   - Parts that multiply (Weapon overhaul, Reinforced hull, Overdrive, Prototype core) keep their value much better.
4. **Parts stack, but stay short of a level each.** A level 0-2 robot against robots two levels up:

   | Parts | Wins | If each part were a full level |
   |---|---|---|
   | None | 17% | |
   | 1 part | 27% | 36% |
   | 2 parts | 40% | 50% |

   Two parts add up (no diminishing returns), but together they are worth about 1.3 levels.
5. **The weak ones:**
   - Repair kit (+0.2): useless at level 2-3.
   - Medic drone (+0.4).
   - Spotter, Bodyguard and Blocker drones (+0.4): Spotter is 0 at level 2-3.
   - Jammer drone (+0.5).
   - Power kit (+0.5).
   - The three chips do nothing on level 2-3 robots. That part is by design (chips are for level 0-1, where they are worth +0.7 to +1.2).
6. **The strong ones:** Weapon overhaul (+1.3, +1.7 on small robots), Tow cable (+1.2), Gun drone (+1.7 on small robots), Prototype core and Quantum shield (+1.4-1.55).
7. **The bookie overrates parts.**
   - The odds count every part as a full level (+1.08 in these units) and a legendary as two. Measured: 0.7 and 1.0-1.55.
   - That is part of why counters and favourites held less well in whole games than the odds said.

## 4. Suggested fix (not done yet, Kev decides)

1. **Scale the fixed-number parts with the robot that carries them.** Drone damage and HP, mine and pop-up damage, heal rates, shield HP, EMP and scrambler duration all get x the carrier's power dial: a big robot carries a big drone.
   - This is one engine change (`pk()` gets the robot).
   - It should lift parts on level 2-4 to about where they are on level 0-1.
2. **Then tune each part's strength to +1 level** (legendaries +2, chips +1 on level 0-1), with the same test.
   - Up: Repair kit, Medic, Spotter, Bodyguard, Blocker, Jammer, Power kit, Field hospital.
   - Down a little: Weapon overhaul (x1.35 → about x1.25), Tow cable.
3. **Set the bookie's PART / LEG numbers to what is measured** afterwards. Until then: PART 0.62 → 0.42 and LEG 1.24 → 0.8 would match today's parts.
4. Re-check the epic combos and giant-slayer builds after step 2, since they sit on top of the part strengths.

## 5. Also done today

**The bookie ignored damage** (Kev, 15 Nov: "don't take damages into account for bookie odds anymore"). Every robot's odds read it as new: duels, free-for-alls, 2v2 and the starter values.
- **Undone on 16 Nov (K5):** Kev: "let the formula count damage again". `BAL.oddsDamage` is true again: the formula odds drop for a damaged robot, the same as the test fights (`simOdds`), which always kept real damage. A damaged robot shows a band again, not the range of a robot as it comes.
- The switch is `BAL.oddsDamage` (true; false reads every robot as new, the 15 Nov test).
- Damage always mattered in the fight itself and to the AI's choices.


---

# Update (15 Nov, later): the parts are levelled

Kev: "do 1 and 2, perhaps 0.7 is not the worst actually, could be better for balance than 1, but of course we need to level the upgrades a bit".

**Target:**

| Upgrade | Worth about |
|---|---|
| Normal part | 0.75 of a level |
| Legendary | 1.5 levels |
| Chip on a level 0-1 robot | 0.75 of a level |

So the average stays where it was; what changed is that the upgrades now sit close to each other.

## Step 1: parts grow with the robot that carries it

- What grows: drones and modules from part cards, in their damage, healing and HP.
- What stays the same: durations (stuns, scrambles, walls), pushes, and a robot's own built-in module (Mauler's repair, Hornet's jets).
- The multiplier follows how much health robots of that level carry:

  | Robot level | Starters | 1 | 2 | 3 | 4 |
  |---|---|---|---|---|---|
  | Part multiplier | x1 | x1.15 | x1.45 | x2.0 | x2.1 |

- Not the robot's own power dial: Thwacker's 2.9 is there because its tail is weak, and it would have made its drones huge.
- Where:
  - Engine `pkR()`: only for drones and modules listed in `spec.fromParts`.
  - lineup.js: `PART_K`; the stat multipliers are now in `STAT`.
  - New settings for parts that had none: spotter, jammer, booster, quantum shield, Matador counter-strike.
- Check: robots without parts fight exactly as before (same fights, same seeds).

## Step 2: each part tuned

- How: 3 full rounds of `tools/damage-lab/parttest.js`, every part on every robot against every robot a level up, 11,424 fights a round. Then a targeted round for the last five parts.
- Results:
  - Normal parts: +0.5 to +0.9 levels (was +0.2 to +1.3).
  - Legendaries: +1.5 to +1.6.
  - Chips on level 0-1 robots: +0.8 to +1.0.

| Part | Strength (before → now) | Levels before | After step 1 | **Now** | Now on L0-1 / L2-3 |
|---|---|---|---|---|---|
| Medic drone | 0.6 → 0.68 | +0.37 | +0.58 | **+0.64** | +0.84 / +0.85 |
| Gun drone | 1.8 → 0.9 | +1.06 | +1.89 | **+0.71** | +1.04 / +0.85 |
| Laser drone | 1.6 → 0.96 | +0.77 | +1.19 | **+0.78** | +0.69 / +1.38 |
| Booster drone | push +50% → +42% | +0.70 | +0.88 | **+0.71** | +1.44 / +0.76 |
| Waller drone | walls x1.5 → x1.57 | +0.71 | +0.64 | **+0.73** | +0.84 / +1.25 |
| Bodyguard drone | HP x1.8 → x1.3 | +0.41 | +0.92 | **+0.85** | +0.94 / +0.98 |
| Spotter drone | +25% → +22% | +0.40 | +0.78 | **+0.80** | +0.79 / +0.94 |
| Jammer drone | weapon x0.5 → x0.45 | +0.49 | +0.68 | **+0.76** | +0.59 / +1.03 |
| Blocker drone | HP x1.5 → x2.9 | +0.41 | +0.52 | **+0.63** | +0.69 / +0.89 |
| Energy shield | 1.5 → 1.2 | +0.83 | +0.95 | **+0.82** | +0.79 / +1.16 |
| EMP burst | 1.6 → 1.03 | +0.95 | +1.16 | **+0.76** | +0.89 / +0.80 |
| Mine layer | 1.4 → 0.95 | +0.75 | +1.11 | **+0.75** | +0.59 / +1.25 |
| Pop-up flipper | 2.4 → 1.04 | +0.69 | +1.52 | **+0.63** | +0.74 / +1.03 |
| Tow cable | 1 → 0.59 | +1.23 | +1.21 | **+0.61** | +0.27 / +0.67 |
| Sensor scrambler | 1 → 0.75 | +0.94 | +1.14 | **+0.70** | +1.04 / +0.94 |
| Overdrive | x1.55 → x1.52 | +0.90 | +1.00 | **+0.80** | +0.79 / +0.80 |
| Repair kit | 4 → 12, then (16 Nov) also repairs under fire at 0.3 of that | +0.21 | +0.37 | **+0.64** (was +0.53) | +0.92 / +0.74 |
| Weapon overhaul | x1.35 → x1.29 | +1.32 | +0.92 | **+0.75** | +0.94 / +0.62 |
| Reinforced hull | x1.45 → x1.36 | +0.81 | +0.85 | **+0.80** | +1.04 / +0.76 |
| Power kit | HP x1.2 → x1.13 | +0.54 | +1.04 | **+0.87** | +0.64 / +1.25 |
| Armour kit | HP x1.25 → x1.23 | +0.73 | +0.83 | **+0.73** | +1.44 / +0.43 |
| Prototype core | x1.3 → x1.28 | +1.55 | +1.63 | **+1.52** | +1.79 / +1.61 |
| Field hospital | HP x1.1 → x1.13, medic x1.3 | +1.00 | +1.16 | **+1.56** | +1.95 / +1.52 |
| Quantum shield | phase 1.5 s → 1.3 s | +1.43 | +1.70 | **+1.60** | +1.09 / +2.36 |
| Matador chip | counter-strike x3 → x1.5 | +0.63 | +0.70 | **+0.25** | +1.24 / +0.15 |
| Wall Bait chip | - | +0.58 | +0.39 | **+0.37** | +0.84 / +0.20 |
| Pester chip | - | +0.50 | +0.52 | **+0.54** | +0.79 / +0.76 |

Two parts don't tune cleanly:
- **Overdrive** jumps between +0.6 and +1.1 for tiny changes, because every hit also strains its own weapon motor. It is set in between, at x1.52.
- **Repair kit** stayed at about +0.5 however fast it healed, because it only worked while the robot was not being hit. **Fixed on 16 Nov (T5)** with a new trigger, below.

## Update (16 Nov): the Repair kit repairs under fire (T5)

Kev: "start repair kit fix".

- **New trigger:** the Repair kit card repairs the robot all the time: slowly (0.3 of its full rate) while it is being hit, at the full rate after 1.5 s without a hit. Card: "Repairs the robot all the time, fast when it is not being hit".
- Only the part card. Mauler's built-in repair module still only works after 1.5 s without a hit (the stock-fight fingerprint, `l4-regress.js`, is unchanged).
- Where: engine `modules()`, the `repair` branch (a kit is a `repair` in `spec.fromParts`); the setting is `PK.repairFire` in lineup.js (engine `ARC.pk.repairFire`; unset = the old behaviour).
- **Measured** (`parttest.js`, every robot with and without the kit against every robot a level up, same seeds; 1,632 fights each way):

  | | All | Level 0-1 | Level 2-3 | Level 4 |
  |---|---|---|---|---|
  | Before (only when not hit) | +0.53 | +0.70 | +0.67 | +0.19 |
  | **Now** | **+0.64** | **+0.92** | **+0.74** | **+0.25** |

  Good to about ±0.13 overall (the per-group numbers about ±0.2-0.3). Wins vs a level up: 37% without, 46% with.
- **Tried:**
  - Repair under fire at 0.06 of the full rate: +0.59 (816 fights). At 0.15: no better (+0.54 on 612 fights). At 0.4: +0.66 (1,020 fights), the same as 0.3.
  - So the kit levels off at about +0.65. More healing does not help much: most fights end on points at time-out (healing doesn't score), or on a broken battery, drive or weapon rather than an empty chassis. 0.3 is the gentler setting with the same result.
- **Robots it helps most** (120 fights each way vs every robot a level up): Vertigo 35 → 58% (+1.7 levels), Thumper 38 → 60% (+1.5). Snapjaw and Pincher about +2 on 40 fights (noisy). Least: Buzzkill -0.9, Orbiter -0.6, Whaler -0.6 (40-56 fights, noisy). Thumper was already the top gainer under the old trigger.
- **Scythe + Repair kit is no longer a poor fit:** 31 → 43% (120 fights each way), about the kit's average gain (+9 points). Its 🧩 poor fit tag (`PART_FIT` in tabletop-2) should go. No epic combo or great fit uses the Repair kit.
- The bookie (`src2/repair.js`) counts every part as 0.42 (about 0.72 of a level), close enough to the kit's +0.64: unchanged. `PART_LV.repair` in tabletop-2 now has the new numbers.
- The Repair kit is still out of the game's deck (`partCopies.repair: 0`, Kev, 9 Nov), so the change shows in the Lineup Arena and in tests, and in games only if the card comes back.

Each value in "now" is good to about ±0.15. Level 4 robots gain less from parts, mostly because they already win most fights at their own level. Their per-group number is good only to about ±0.35.

## The bookie and the tags

- **Strength model** (`src2/repair.js`):
  - a part is 0.42 (was 0.62);
  - a legendary is 0.9 (was 1.24);
  - a chip is 0.5 / 0.5 / 0.2 / 0.2 / -0.05 by level.
- **Epic combos re-tested twice on fresh seeds** (60-96 fights each). Wins vs robots a level up, without → with:

  | Name | Combo | Without → with |
  |---|---|---|
  | Whiplash | Thwacker + Tow cable (still holds) | 25 → 65% |
  | Phantom Hook | Angler + Quantum shield | 14 → 67% |
  | Overclock | Vertigo + Power kit | 43 → 77% |
  | Haywire | Popcorn + Sensor scrambler | 17 → 48% |
  | Iron Bolas | Gaucho + Overdrive | 32 → 62% |

  Gone: Air Support, Tug of War, Launch Pad and Flip & Maul, because the Gun drone and Pop-up flipper were toned down. Drill & Drip (Corkscrew + Field hospital) is now a great fit.
- **Great fits:** Corkscrew + Field hospital, Wrecker + Pester chip, Thwacker + Mine layer.
- **Poor fits:** Forklift + Laser drone, Scythe + Repair kit (no longer, 16 Nov: see the Repair kit update), Rotisserie + Pester chip, Yo-yo + Blocker drone.
- **Giant-slayer builds:**

  | Robot | Parts | Wins vs level 3-4, as it comes → kitted | vs kitted level 3-4 |
  |---|---|---|---|
  | Gyro | Quantum shield + Spotter + Waller | 38 → 89% | 66% |
  | Whaler | Quantum shield + Tow cable + Waller | 23 → 82% | 50% |

  Both need the one Quantum shield. Yo-yo, Pincher and Angler no longer make it.

## Whole games (120 games each, AI v2, same seeds)

| | Tuned lineup (before today) | Parts levelled, bookie ignores damage | Parts levelled, damage in the odds |
|---|---|---|---|
| Higher level wins, 1 / 2 / 3 / 4 levels apart | 67 / 70 / 68 / 74% | **67 / 78 / 83 / 93%** | 63 / 77 / 79 / 86% |
| Lower level wins a mixed-level duel | 32% | 27% | 30% |
| Bookie favourite wins / Brier | 78% / 0.158 | 73% / **0.180** | 76% / 0.164 |
| One part more: odds / won | 59% / 62% | 63% / 63% | 54% / 59% |
| Two parts more: odds / won | 71% / 77% | 67% / 72% | 66% / 71% |
| Counter duels, underdog odds / won | 19% / 31% | 20% / 33% | 22% / 32% |
| Close finish (within 1 fame) | 46% | 43% | |
| Rounds | 11.6 | 11.7 | |

What it says:
1. **Levels mean more in a real game now.** Before, parts on small robots flattened the bigger gaps; now a level 1 robot rarely beats a level 4 robot.
2. **The odds for robots with parts are about right.** The bookie is within 5 points everywhere.
3. **Ignoring damage costs the bookie accuracy.** Brier 0.180 against 0.164 with damage in, and the favourite wins 73% instead of 76%. That was Kev's call (15 Nov); on 16 Nov he turned damage back on in the odds (K5), so the right-hand column is what the game does now.
4. **counterTrust 0.65 would still help.** The underdog of a counter still wins about 33% at odds of 20%.
