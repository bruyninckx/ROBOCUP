# ROBOCUS 2.0 lineup: robots in levels, parts that close a level (draft, 8 Nov 2026)

Kev's brief (8 Nov): 1.0 is the current tabletop. For 2.0:
- **9 starter robots** (level 0), roughly even, rock-paper-scissors allowed.
- **15-16 market robots** in **levels 1, 2 and 3**, entering in waves; each level beats the one below by 10-20 points more.
- **About 25 parts** that fit any robot, each strong enough to **close one level**; a **legendary part closes two**.

Everything below comes from the ROBOCUS 2.0 Damage Lab (physics sim), **1v1 on open floor**, about 45,000 fights. Data: `tools/damage-lab/robocus2-lineup.json`.

## How a robot's level is set

The physics doesn't produce clean levels by itself: the robots we have are all within about 0.8 win-odds of each other. So each robot card gets a **power grade p**: its weapon damage x p and every part's HP x p (thicker plates, a stronger weapon motor). One level is about +13% power. The grades below are all between x0.76 and x1.21, so no robot is pushed far from its natural strength. The more exciting mechanics sit in the higher levels.

## The robots

| Level | Robot | Weapon | Power p | vs own level | vs level below |
|---|---|---|---|---|---|
| 0 | Haymaker | Boxing glove | 0.76 | 56% | |
| 0 | Rumbler | Drum | 0.88 | 41% | |
| 0 | Thumper | Axe hammer | 0.94 | 57% | |
| 0 | Jouster | Spear | 0.93 | 43% | |
| 0 | Popcorn | Flipper | 0.95 | 54% | |
| 0 | Blowtorch | Flamethrower | 1.04 | 47% | |
| 0 | Buzzkill | Bar spinner | 0.97 | 46% | |
| 0 | Snapjaw | Crusher | 0.96 | 43% | |
| 0 | Wrecker | Flail | 1.10 | 64% | |
| 1 | Hornet | Spear + jump jets | 0.98 | 53% | 58% |
| 1 | Whirlwind | Bar spinner + shield | 1.02 | 38% | 61% |
| 1 | Mincer | Twin grinders | 1.14 | 73% | 60% |
| 1 | Scythe | Sweeper axe | 1.08 | 70% | 56% |
| 1 | Mauler | Flail + repair | 1.09 | 20% | 82% |
| 1 | Rocketeer | Rocket pod | 1.01 | 45% | 53% |
| 2 | Juggernaut | Drum + grapple | 1.14 | 48% | 68% |
| 2 | Gyro | Shell spinner | 1.03 | 29% | 81% |
| 2 | Pincher | Clapper arms | 1.19 | 71% | 67% |
| 2 | Brawler | Piston glove + EMP | 1.06 | 65% | 38% |
| 2 | Thwacker | Thwack tail | 1.02 | 38% | 58% |
| 3 | Whaler | Harpoon | 1.14 | 27% | 72% |
| 3 | Forklift | Lifter fork | 1.14 | 69% | 62% |
| 3 | Vertigo | Vertical disc | 1.16 | 48% | 60% |
| 3 | Sawblast | Buzzsaw + rocket | 1.18 | 42% | 57% |
| 3 | Ramrod | Battering ram | 1.21 | 65% | 52% |

Starters are the classic robots with no module or chip (1.0 had the same idea). Market robots keep their chips and modules as part of their identity. That's 16 market robots (6 / 5 / 5); drop Rocketeer for 15.

**Level vs level** (row wins, 12 fresh seeds, 3,600 fights):

| | vs L0 | vs L1 | vs L2 |
|---|---|---|---|
| L1 | 62% | | |
| L2 | 77% | 62% | |
| L3 | 91% | 76% | 60% |

So each level adds 10-12 points over the one below, two levels 26-27, three levels 41.

Re-check after robots stopped landing on their side (8 Nov, later; 3,600 fights, seeds 7101-7112): L1 vs L0 67 → 68%, L2 vs L0 71 → 72%, L2 vs L1 62 → 62%, L3 vs L0 86 → 88%, L3 vs L1 77 → 78%, **L3 vs L2 65 → 71%** (the one move over 5 points). Details in `docs/damage-lab.md`, "On its side removed". (The 'before' numbers are this re-run on the same seeds, not the table above.)

**Rock-paper-scissors worth knowing:**
- Mauler is the weakest L1 within its level (20%) but crushes the starters (82%).
- Brawler and Ramrod are the opposite: strong in their own level, weak against the level below (38% / 52%). The rubber bumper and the glove are hard counters.
- Whaler is the soft L3 (27% in its level): Forklift and Ramrod shrug off the harpoon.
- Starters range 41-64% among themselves (Wrecker on top).

## Parts: 18 types, 22 cards

Test: a level-n robot with the part against the stock robots of level n+1 (50% = the gap is closed; stock is 38% on these seeds). 4 seeds x every pairing, about 11,800 fights per round, three rounds of tuning.

| Part | Copies | 2.0 setting | Win vs next level | Robots that reach 40% |
|---|---|---|---|---|
| Gun drone | 1 | shot damage x1.8 | 57% | 17/20 |
| Booster drone | 1 | as is | 56% | 17/20 |
| Laser drone | 1 | beam damage x1.6 | 54% | 17/20 |
| Weapon overhaul | 2 | weapon damage x1.35 | 52% | 14/20 |
| Reinforced hull | 2 | every part HP x1.45 | 52% | 15/20 |
| Waller drone | 1 | walls last x1.5 | 51% | 17/20 |
| Power kit | 1 | hot motors + big battery + HP x1.2 | 50% | 13/20 |
| Medic drone | 2 | heals at 60% | 50% | 15/20 |
| Bodyguard drone | 1 | drone HP x1.8 | 50% | 17/20 |
| Mine layer | 1 | blast x1.4 (own mines no longer go off under it) | 49% | 15/20 |
| Energy shield | 2 | 45 HP bubble | 48% | 15/20 |
| Spotter drone | 1 | as is | 48% | 16/20 |
| Jammer drone | 1 | as is | 47% | 12/20 |
| EMP burst | 1 | 2.9 s stun | 47% | 16/20 |
| Blocker drone | 1 | drone HP x1.5 | 46% | 12/20 |
| Armour kit | 1 | +1 on every plate + HP x1.25 | 46% | 13/20 |
| Pop-up flipper | 1 | hit and shove x1.8 | 45% | 14/20 |
| Repair kit | 1 | heal rate x4 | 42% | 12/20 |

18 types + 4 duplicates (Medic, Shield, Weapon overhaul, Reinforced hull, like 1.0's doubles) = **22 cards**.

**Dropped** (do nothing or hurt, even when made stronger): oil slick, smoke screen, grappling hook, self-destruct, jump jets, spiked bumpers, a big battery or hot motors on their own, and the processor chips. Chips help one robot and hurt the next (-20 to +20 points), so in 2.0 they stay part of a robot's identity, as in 1.0.

**Robots that parts barely help:**
- Haymaker and Wrecker: 21% and 8% stock vs level 1, only 26% and 27% with a part. Their next-level matchups are bad, and a part doesn't fix a bad matchup.
- Gyro gets slightly worse with most parts (40% → 34%).
- Wrecker, Haymaker and Gyro are worth a look before the lineup is final.

## Legendary parts (close two levels)

Test: a level-n robot with the part against the level n+2 robots (stock: 28%).

| Legendary | What it does | Win vs two levels up | Robots that reach 40% |
|---|---|---|---|
| Prototype core | weapon damage x1.3 and every part HP x1.3 | 50-54% | 11-13/15 |
| Field hospital | a full-strength medic drone + HP x1.1 | 55% | 14/15 |
| Quantum shield (2.0) | the first hit of 6+ damage after it recharges is cancelled and the robot phases out for 1.5 s; recharges in 8 s | 48% | 11/15 |
| Quantum shield (1.0 style, dropped) | 12 s invulnerable once below 40% | 27% | 2/15 |

The 1.0 Quantum Shield doesn't work as a one-off, so it was reworked into a recharging phase shield (Kev, 8 Nov). The first Field hospital test (46%) accidentally ran its medic at the reduced 60%; with a full-strength medic it is 55%. Retest on the final grades, 4 seeds per pairing: Prototype core 50%, stock 24-25%.

Proposed: **22 parts + Prototype core + Field hospital + a reworked Quantum shield = 25 cards.**

A normal part is also worth a little more than one level: with one part, a robot reaches about 45% against robots two levels up. So "one level" is a floor, not a ceiling.

## How it fits the 1.0 supply picture

- 1.0 found robots scarce (99% of robot lots sell) and parts plentiful (39 lots, half unseen per game). 2.0 cuts parts to 25 and makes each one matter. A part is now worth a level, so a team that loses the robot auction can still catch up with a part. That should soften the robot scarcity.
- Waves: levels 1, 2 and 3 entering in auctions 1-2, 3-4 and 5-6 (Kev's idea) works with these numbers. A level-1 robot with one part keeps up with a fresh level-2 robot, and with a legendary it keeps up with level 3.

## Not tested yet

- Two parts on one robot (do they stack to two levels?).
- 2v2 and free-for-all: all numbers are 1v1.
- Arenas with hazards (saws, killbox).
- The Damage Lab page still uses 1.0 part strengths. The 2.0 settings live in `robocus2-lineup.json` and `ARC.pk`.

## Level 4: the end-game wave (8 Nov, later)

Eight level 4 robots built from exotic mechanisms instead of bigger knobs: Hydra (strike arm), Corkscrew (drill), Trebuchet (throwing arm), Angler (gaff hook + drum), Lodestone (electromagnet), Orbiter (blades on telescoping booms), Tarantula (six-legged walker with a stalker brain), Grandmaster (tool carousel with a brain). Power grades 0.97-1.18 (level 3: 1.14-1.21), 57-63% against level 3. They live in `ROBOTS4` (not `ROBOTS`), so the tabletop and the tier tools don't see them; the Lineup Arena shows them. Full write-up: `docs/robocus-2.0-level4.md`, plan: `docs/robocus-2.0-level4-plan.md`.

## Lineup Arena

`prototypes/lineup-arena.html` (built with `python3 tools/damage-lab/build.py`): the 25 robots by level at their power grades, two part slots and a legendary slot with the 2.0 part strengths, Watch or Test (10/20/50 fights, sides swapped every other fight), and random matchups (same level, one or two levels apart). Data in `tools/damage-lab/lineup.js`.

## Tools

In `tools/damage-lab/`:
- `tiers.js scan` fits strength and power slope; `tiers.js verify` runs the round robin at the chosen grades; `calib.js` shows the level-vs-level table and suggests grades.
- `parts.js` + `partfit.js` measure parts against a fixed panel.
- `parts2.js` + `part2fit.js` measure "does a part close a level" (set `PK=` for part potencies, `GAP=2` for legendaries).
