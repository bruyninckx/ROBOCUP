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

**The bookie ignores damage** (Kev: "don't take damages into account for bookie odds anymore"). Every robot's odds now read it as new: duels, free-for-alls, 2v2 and the starter values. A damaged robot still shows its range like a robot as it comes.
- The switch is `BAL.oddsDamage` (false; true brings the old behaviour back).
- Damage still matters in the fight itself and to the AI's choices.
