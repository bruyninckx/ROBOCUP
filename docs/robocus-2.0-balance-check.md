# ROBOCUS 2.0 balance check (9 Nov 2026)

Kev asked: test three new parts, then check the whole balance again. Everything here runs on the current engine (`tools/damage-lab/engine.js`, nimble chips on).

## 1. Parts: one part on a level 0/1 robot vs every level 2/3 robot

300 fights per part (every level 0/1 robot x every level 2/3 robot, both sides, open floor). About ±3 points of noise. No part: **25%**.

| Part | Kind | Win % | In the deck |
|---|---|---|---|
| Field hospital | legendary | 52 | 1 |
| Prototype core | legendary | 50 | 1 |
| Quantum shield | legendary | 46 | 1 |
| Waller drone | drone | 45 | 0 (BAL) |
| Gun drone | drone | 44 | 1 |
| **Tow cable** (new) | module | 43 | **1** |
| Weapon overhaul | stat | 43 | 2 |
| Matador chip | chip | 42 | 1 |
| Booster drone | drone | 42 | 1 |
| **Overdrive** (new) | stat | 40 | **1** |
| **Sensor scrambler** (new) | module | 40 | **1** |
| EMP burst | module | 40 | 1 |
| Power kit | stat | 39 | 1 |
| Reinforced hull | stat | 39 | 2 |
| Jammer drone | drone | 39 | 1 |
| Energy shield | module | 39 | 1 |
| Wall Bait chip | chip | 38 | 1 |
| Laser drone | drone | 38 | 0 (BAL) |
| Pester chip | chip | 38 | 1 |
| Armour kit | stat | 37 | **0** (was 1) |
| Bodyguard drone | drone | 37 | **0** (was 1) |
| Medic drone | drone | 37 | 1 |
| Spotter drone | drone | 36 | 0 (BAL) |
| Blocker drone | drone | 35 | 0 (BAL) |
| Mine layer | module | 35 | 1 |
| Pop-up flipper | module | 32 | 1 |
| Repair kit | module | 28 | **0** (was 1) |

The new parts:
- **Tow cable** (module): hooks the enemy and slings it into the nearest wall, a slam that counts as its hit; every 8 s. First version (every 7 s, small pull) did nothing (26%); a hard sling every 6 s was far too strong (62%); now 43%.
- **Sensor scrambler** (module, renamed from "Sensor jammer" so it isn't mixed up with the Jammer drone): within 3 m the enemy steers haywire and its module is offline for 3 s; every 6 s. First version (2 s, every 8 s) 31%, now 40%.
- **Overdrive** (upgrade): weapon damage x1.6, but each hit it lands puts 12% of that damage into its own weapon motor (or the weapon). 40%. On a robot that hits often it burns its own weapon out, which shows as a ⚔ badge on the damage chart.

Deck change: Repair kit, Armour kit and Bodyguard drone are out; Tow cable, Sensor scrambler and Overdrive are in. Protect/heal cards in the deck go from 11 to 8 (Medic, Shield, Hull x2, Power kit, and the three legendaries).

Still weak: Pop-up flipper (32) and Mine layer (35). Both are cheap ideas to buff later.

## 2. Levels (Lineup Arena table, 528 pairs x 20 fights, open floor)

Checked first that the table is still right: 14 pairs re-run on today's engine gave exactly the same wins (the fights are seeded; today's changes only touch chips and the new parts). So `matrix-data.json` stands.

Lower level's win % against a higher level:

| | vs L1 | vs L2 | vs L3 | vs L4 |
|---|---|---|---|---|
| L0 | 35 | 27 | 11 | 14 |
| L1 | | 39 | 26 | **35** |
| L2 | | | 33 | **34** |
| L3 | | | | **42** |

- Levels 0 to 3 step up as they should.
- **Level 4 is too weak**: level 1 beats it 35% of the time, more than it beats level 3 (26%); level 3 wins 42% against it. Level 4 is meant to be the end game.

Within a level (average against its own level, 50 = middle):
- L0: Wrecker 68 ... Rumbler 35
- L1: Scythe 68 ... Mauler 29
- L2: Pincher 63 ... Gyro 43
- L3: **Ramrod 75, Forklift 71** ... **Whaler 29, Sawblast 25**
- L4: Hydra 76 ... **Grandmaster 24**, Trebuchet 33, Lodestone 35

Suggested fix (not done yet: it needs a fresh matrix run, about 1.5 h for open floor): power grades up for level 4 (about +8%, Grandmaster / Trebuchet / Lodestone +12%), Whaler and Sawblast +8%, Ramrod and Forklift -5%, Mauler +6%.

## 3. Counters ("Jouster vs Mincer")

Compared with what the level gap usually gives (same level 50%, one level up 37%, two up 29%, three up 23%, four up 14%), 75 matchups are off by 35 points or more. They follow weapon and shape, rock-paper-scissors style. A few:

- Thumper (L0 hammer) beats Mincer (L1 twin saws) 95% and Juggernaut (L2 drum) 90%.
- Popcorn (L0 flipper) beats Scythe (L1 sweeper) 95%.
- Gyro (L2 shell spinner) beats Ramrod (L3) 95% and Hydra (L4) 100%.
- Whirlwind (L1 spinner) beats Trebuchet (L4) 100%; Scythe beats Corkscrew (L4) 90%.
- Hornet (L1 spear) beats Corkscrew (L4) 85%; Jouster (L0 spear) beats Mincer 55%.

What the game does with it now:
- **The bookie reads the table.** A duel's odds come straight from it (arena data when it has the pair, else open floor plus the arena fit). Parts and damage shift those odds by the strength model (the change from the robot as new).
- **Robots as they come show a 20% range** ("40–60%"), on tickets, the rail and the bets; changed robots show a band only.
- **Counter tags in a duel:** 🎯 Counter pick on the robot that does 25+ points better than its level gap says, ⚠️ Bad matchup on the other. The matchups panel marks them per rival.

## 4. Whole games (game-sim, 12 games, AI v2)

All 12 finished, 0 page errors. 6.2 rounds on average (4 to 8). Seat win share 17 / 25 / 25 / 33% (±13: fair). Close finishes: runner-up within 1 fame in 58% of games. Fame: fights, host and fans 65%, cards 35%. Market spend 48 Cr a game, bets 17 Cr a game. Multiplayer test: 0 desyncs.

Scripts (scratch): `chipt.js` (part test), the matrix re-check with `tools/damage-lab/matrix.js open all 0 40`.
