# ROBOCUS 2.0: Level 4, the end-game robots (built 8 Nov 2026)

Kev's brief (8 Nov): 4 to 8 level 4 robots on top of the streamlined levels 1-3, without power-creep knobs: the edge has to come from exotic physical mechanisms (multi-levered arms, multi-jointed sweepers, flying blades that retract, combinations) and smarter driving. Wild is fine, nice visuals and flashing lamps, close-to-level-4 is fine, too strong can become a legendary. The plan is `docs/robocus-2.0-level4-plan.md`; this doc is what got built and what it measures.

**All eight robots from the plan are in**, in the Lineup Arena under "Level 4 (end game)" (`prototypes/lineup-arena.html`). None is too strong for level 4, so the legendary bin is empty for now. The tabletop 2.0 page is untouched (see "Not done" below).

## The robots

| Robot | Mechanism | Frame | Grade p | Weapon norm. | vs L3 | vs L2 | Worst L3 matchup |
|---|---|---|---|---|---|---|---|
| Hydra | 3-segment strike arm on a turret ring, folds flat on top, unfolds over the enemy weapon and slams its lid (dazes it 0.3 s) | huge, tracks | 1.18 | 1.8 | 57% | 56% | Ramrod 10% |
| Corkscrew | drill auger on a ram rail: grinds, anchors after 0.8 s of biting, turns the victim on the spit, bores through plate, chassis, then the battery or radio (CORED!) | heavy, tracks | 0.97 | 1.0 | 59% | 44% | Vertigo 20%, Ramrod 20% |
| Trebuchet | low scoops slide under, the frame locks (0.55 s, strobing), a counterweighted arm hurls the enemy over its own back (AIRMAIL!), 6 throws, a compressor tops one up every 9 s | heavy, 4wd | 1.16 | 1.1 | 59% | 73% | Ramrod 40% |
| Angler | pantograph gaff hook folded on the left flank snaps round, hooks the enemy's back, a winch drags it into a chest drum | heavy, 4wd | 1.10 | 1.0 | 63% | 85% | Whaler 45%, Vertigo 45% |
| Lodestone | electromagnet + small drum on a 7 s cycle: PULL (steel robots, loose junk and slugs), CLAMP (welds a steel robot to its nose, drags it to a wall), REPULSE (the junk cloud becomes shrapnel, steel robots are shoved off) | heavy, tracks | 1.01 | 1.0 | 59% | 70% | Vertigo 30% |
| Orbiter | two saw discs docked in the flanks shoot out on telescoping booms from a spinning rotor (a 2.2 m kill ring), and pull back in when a big spinner comes, the rotor stalls or a disc is hurt | heavy, 4wd | 1.18 | 2.0 | 59% | 65% | Sawblast 50% |
| Tarantula | six-legged walker (strafes, ignores oil, walks on down to 3 legs, kicks itself back over) with venom fangs (bite, hold, heat the insides) and a stalker brain: circles at 1.6 m, eyes go solid red, pounces only in the enemy's weak moment, feints after 6 s | medium, legs | 1.17 | 1.4 | 61% | 62% | Forklift 35%, Ramrod 35% |
| Grandmaster | carousel of three tools (flipper, saw, axe) round a round hull; the brain reads the enemy every 0.5 s and indexes the counter (flipper vs front weapons, saw vs exposed chips, drones and cripples, axe vs lids), switches at most every 6 s unless a lid just came off, backs off while the carousel turns, baits the enemy into ceiling-hammer and floor-bumper circles, sidesteps rockets, denies crates | heavy, 4wd | 1.05 | 1.45 | 57% | 65% | Whaler 35%, Forklift 35% |

vs L3 / vs L2: 100 fights each (20 per opponent), open floor, sides swapped every other fight, seeds never used while tuning (60001+, 70001+ for the three robots re-graded last). Every robot also ran on two earlier seed sets: the spread between seed sets was up to ±10 points, so read every number as ±7.

Target (plan section 1): 55-65% vs level 3. All eight land there (57-63%). Median fights 47-62 s, 15-26 big moments per minute (Trebuchet 26, the most of any robot in the game), 2.7-5.9 enemy parts torn off per fight.

### Grades and the "no power creep" rule

- **Grade p** (HP and weapon damage x p, as for levels 0-3) is 0.97-1.18 for level 4. Level 3 is 1.14-1.21. So level 4 sits at level 3's power grade or below; the extra level comes from the mechanism and the brain. Corkscrew and Angler sit at about level 1-2 grades.
- **Weapon normalisation** (`dmgK` in the preset, set once per weapon, as for the trial robots: Thwacker 5, Forklift 2, Pincher 1.8): Hydra 1.8 (one overhead strike, like the axe), Orbiter 2.0 (the discs are not sharp at their tip speed), Grandmaster 1.45 (three small tools), Tarantula 1.4 (small fangs), Trebuchet 1.1, the rest 1.0. The plan wanted these frozen before the level test. In practice Orbiter (1.7 → 2.0) and Grandmaster (1.6 → 1.45) were set together with the grade, so for those two the split between "normalisation" and "grade" is a judgement call.

### What beats them (rock-paper-scissors worth knowing)

- **Ramrod is the level 4 nemesis**: Hydra 10%, Corkscrew 20%, Tarantula 35%, Trebuchet 40%. It rams, bounces off and rams again, so anything that needs half a second of contact misses it. Hydra's arm needs 0.3 s from reach to slam; Ramrod is gone by then.
- **Vertigo** (vertical disc) flips the heavy robots: Corkscrew 20%, Hydra 30%, Lodestone 30%.
- **Gyro** (shell spinner) has no lid to hit and shreds raised arms: Hydra 15%, Tarantula 10%.
- **Brawler's rubber bumper** is immune to the magnet and the drill can't anchor in it: Lodestone 45%, Corkscrew 30%. Lodestone's magnet also ignores Haymaker (rubber) and Jouster (fibreglass), on purpose: a starter can bother an end-game robot.
- **Corkscrew is weak against level 2** (44%: Thwacker, Pincher, Brawler). It is a hard-counter robot: 95-100% against Whaler and Forklift, poor against spinners and rubber.
- Worst-matchup rule (plan: ≥ 10%): Hydra vs Ramrod is right on it (0-10% over three seed sets), Tarantula vs Gyro 10%. Everything else is 15% or more.

## Other checks

- **Level ladder** (40 fights per robot vs each of levels 0 and 1, seeds 80001+):

  | | vs L0 | vs L1 | vs L2 | vs L3 |
  |---|---|---|---|---|
  | L3 (for comparison) | 91% | 76% | 60% | |
  | L4, average of the 8 | 86% | 74% | 65% | 59% |
  | L4 range | 75-94% | 54-96% | 44-85% | 57-63% |

  Level 4 is one level above level 3, but it does **not** stretch further down the way the stat-based levels do: against levels 0-1 it is about as strong as a level 3 robot. The mechanisms are built to beat big front-weapon robots; small fast starters often slip them (Tarantula 75% vs L0, Grandmaster 78%, Corkscrew 54% vs L1). For the game that may be a feature (an end-game robot is not invincible against a cheap one), but it means a level 4 robot is worth about one level more than level 3, not "level 3 plus a lot".
- **Parts still close the gap**: a level 3 robot with one part beats the level 4 robots 62% (stock 43% on the same seeds, 120 fights). A part closes a little more than one level, as it already did lower down.
- **The Prototype core is strong against level 4**: a level 2 robot with it wins 68% (120 fights; the lineup analysis had it at 50-54% against two levels up). Raw HP and damage outlast mechanisms that need time to work. Worth a look before the core goes into the game with level 4 robots in the market.
- **Free-for-all** (one level 4 robot and three level 3 robots, 12 games each): 8-25% wins (25% = even). No level 4 robot dominates a crowd; Trebuchet (8%) wastes its throws.
- **No change to any existing fight**: `node tools/damage-lab/l4-regress.js` (20 old 1v1 pairings incl. killbox, lineup robots with parts, quantum shield, a 2v2 and an FFA) gives bit-identical results before and after. Every level 4 rule is gated on a level 4 weapon, the legs drive or a flag only level 4 robots set.
- **Deterministic**: same seed, same fight (16/16). Average step 0.06-0.08 ms (as before); worst single step 26-49 ms while two other sims were running on the same 2 cores, so worth re-measuring on a quiet machine (the lab's worst was 14 ms).

## How they work (engine notes for whoever tunes them next)

All in one block in `tools/damage-lab/engine.js` ("ROBOCUS 2.0 LEVEL 4"), one object per weapon in `L4W` with `build`, `ok`, `step`, `think` (and `drive`) hooks. Shared helpers:
- `chainArm`: motorised revolute chains (Hydra's arm, Angler's pantograph); losing a segment drops everything beyond it. `jointTo` (P-controller on a joint) and `ik2` (two-link inverse kinematics) pose them.
- **Raised arms** (`part.high`): pass over robots; only tall weapons hit them (spinner bars, flail balls, shells, sweepers, tails, vertical discs, saws, clappers, Orbiter discs, other arms). Pre-solve rule in `create`.
- `readEnemy` (the Tactician): weapon spin, reload, busy (grabbing, carrying, punching...), in its arc, helpless, lid, exposed chip, crippled, drones, magnetic, weight. Tarantula and Grandmaster re-read it every 0.5 s (latency on purpose: clever, not omniscient).
- **Lamps** (`R.lamps`, `R.fx`): drawn by `drawLamps` in `ui.js`; on, pulse, strobe, chase, state (from the mechanism), beacon, eyes. Dark when the robot is out, flickering when its chip is fried or rebooting. Each robot's lamps are its tell: Trebuchet strobes before a throw, Tarantula's eyes go solid red before a pounce, Hydra's red lock lamps light when it strikes, Orbiter's beacon spins while the blades are out, Grandmaster's carousel lamp shows the chosen tool (blinking while it turns).
- **Huge chassis** (`CHASSIS.huge`), **legs drive** (`DRIVES.legs`: 6 legs as 3 slots per side, tripod gait, strafes like omni wheels with half the side grip, ignores oil, counted as crippled only below 3 legs), **magnet grip** (`R.magGrip`), **shrapnel** (debris with `shrapBy` hurts for 1.2 s), **thrown over** (`overFly`: no contact with the thrower during the flight, a flat landing rattles the lid).

Things that were tried and changed:
- Orbiter's discs were first on free ropes from a small rotor (the plan's tethers): the rotor can't whip the discs round, they dangled at 2-5 m/s. Rigid distance links had the same problem. Now the discs sit on telescoping booms (prismatic sliders) on a rotor at 20 rad/s, so the rotor's torque reaches them (tip speed about 22 m/s). The lasso idea needs a rope, so it went with the ropes.
- Orbiter first retracted against every spinning weapon, drums included: it spent the fight docked. Now only big spinners (bar, shell, vertical disc, flail) make it pull in; it also pulls in and backs off when the rotor stalls against the enemy.
- Hydra's first arm (1.04 m) never reached past front weapons; it is 1.36 m now, on tracks (half knockback, it is a crane), meets charging rammers head-on instead of reversing into a wall, and can lever itself back over. A faster, leading strike made it worse (43%), so it was reverted.
- Grandmaster's first front tool was a wedge: useless on open floor (the lab already knew Doorstop wins nothing there). It is a gas flipper now (10 shots), picked against front-weapon robots.
- Trebuchet with 6 throws and no refill ran dry; the compressor refill and the lid rattle on landing took it from 20% to about 60%.

## Not done (open)

- **Tabletop 2.0**: the robots are in `ROBOTS4` in `lineup.js`, kept apart from `ROBOTS` so the tabletop's waves, AI strength model and tier tools don't pick them up. Only the Lineup Arena merges them in. To put them in the game: Kev's decisions in plan section 7 (wave from round 7, 3-4 of the 8 dealt per game, price, repair zones). `src2/view.js` (the full-screen fight view) has its own renderer and does not draw the level 4 mechanisms or lamps yet.
- **Tactician chip as a legendary part** (plan section 5): not tested.
- **Reserve designs** (Gemini, Tesla, Windmill): not built.
- **Two parts on a level 4 robot**, 2v2 balance, killbox and floor-saw arenas: not measured (all numbers are open floor).
- The Damage Lab builder page has them as a "Level 4 (end game)" preset group at power grade 1 (no lineup grades there), and the new weapons, the huge frame and the legs drive are in its pickers for custom builds.

## Tools

In `tools/damage-lab/`:
- `node l4.js [fights per opponent] [Robot,Robot]`: level 4 robots vs levels 3 and 2 (or `VS=0,1`); win %, median, big moments/min, parts, endings, per-opponent. `P=Robot:grade` tries a grade, `DMGK=Robot:k` a weapon knob, `SEED0` the seed set, `OUT=file.json` writes the numbers.
- `node l4diag.js Robot Opponent [fights]`: damage by cause, callouts, `LOG=1` the robot's log. `PG=grade`.
- `node l4parts.js [fights]`: a level 3 robot with a part vs level 4, a level 2 robot with the Prototype core vs level 4, free-for-all.
- `node l4-regress.js`: fingerprint of existing fights; must not change.
