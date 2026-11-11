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

## 5. Level fix (done, 9 Nov evening)

Three passes of power-grade changes plus three level moves (Kev: robots are not fixed to a level). The robot's best-fit level was estimated from its results against every level.

- Grades (overall change): level 4 x1.07, but Trebuchet and Lodestone x1.19, Hydra x1.03; Whaler, Sawblast x1.08; Ramrod, Forklift x0.95; Mauler x1.11; Rumbler x1.09; Hornet x1.05.
- Level moves: **Whirlwind 1 -> 2** (fought like a 1.7), **Juggernaut 2 -> 1** (fought like a 1.5), **Grandmaster 4 -> 3** (fought like a 3.2; grade x1.05 overall).
- New table: open floor fully re-run (528 pairs x 20 fights), the other four arenas re-run for every changed robot; arena pairs that are no longer same-level dropped. `matrix.js` takes `ONLY=a,b` to re-run just those robots' pairs.

Lower level's win % now (before in brackets):

| | vs L1 | vs L2 | vs L3 | vs L4 |
|---|---|---|---|---|
| L0 | 34 (35) | 27 (27) | 12 (11) | 9 (14) |
| L1 | | 42 (39) | 28 (26) | 21 (35) |
| L2 | | | 33 (33) | 30 (34) |
| L3 | | | | 27 (42) |

Spread within a level (worst to best against its own level), before -> now: L0 35-68 -> 43-67, L1 29-68 -> 37-62, L2 43-63 -> 40-63, L3 25-75 -> 39-68, L4 24-76 -> 31-68.

Still at the edges: Wrecker 67 (level 0; it is the Hard hitter), Grandmaster 68 at level 3, Corkscrew 68 and Trebuchet 31 at level 4. Giant killer tags re-measured: Thwacker, Vertigo, Ramrod, Blowtorch (Whirlwind dropped: it moved up).

game-sim 8/8 games, 0 errors; multiplayer test OK.

## 6. Parts check after the level fix (9 Nov, late)

Test: every robot with the part against every robot one level up (both sides, 312 fights a part, open floor). No part: **35%** wins. Also measured: fight length, KO share, health left on both robots. Per-robot results are only 12 fights each, too noisy to read (a re-run with other seeds flipped several of them).

| Tier | Parts (win %) |
|---|---|
| Legendary level | Prototype core 66, Field hospital 65, Quantum shield 60 |
| Strong | Booster drone 62 -> **51** (nerfed), Overdrive 62 -> **54** (nerfed), Weapon overhaul 55, Gun drone 54, Sensor scrambler 53, Laser drone 52, Waller drone 52, Bodyguard 51, Tow cable 50 |
| Middle | Spotter 50, Medic 49, Reinforced hull 48, Jammer drone 48, Pop-up flipper 42 -> **48** (buffed), EMP 47, Armour kit 47, Mine layer 47, Power kit 46, Blocker 46, Energy shield 45 |
| Weak | Matador chip 45, Pester chip 42, Wall Bait chip 39 -> **42** (buffed), Repair kit 39 (out of the deck) |

What the parts change besides winning:
- **Shorter fights:** Tow cable 53 s, Weapon overhaul 54, Booster, Gun drone and Pester chip 55 (no part: 62 s).
- **Longer fights:** Quantum shield 69 s, EMP 68, Field hospital 68, Reinforced hull 67, Repair kit 66. Field hospital also has the fewest knockouts (85%): its robot keeps 79% of its health.
- **Most damage dealt:** Prototype core (enemy left at 50% health) and Gun drone (49%).
- **Chips** glitch about 1.4 times a fight on level 2-3 robots, which is why they look weak in this table. On level 0 they are mid-table (Matador 51% for level 0 robots vs 33% with no part).
- Modules replace a robot's own module (Hornet's jets, Juggernaut's grapple, Mauler's repair kit, Brawler's EMP, Whirlwind's shield): for those robots a module card swaps, it does not add.

Changes made:
- **Overdrive** x1.6 -> **x1.55** weapon damage (strain still 12% of each hit): 62 -> 54%. (x1.4 with 15% strain fell to 42%, x1.5 with 13% to 47%.)
- **Booster drone:** nitro kick every 4.5 -> **7 s**, its damage boost +15% -> **+8%**: 62 -> 51%.
- **Pop-up flipper** strength 1.8 -> **2.4**: 42 -> 48%.
- **Wall Bait chip** counter hit x2.4 -> **x3**, stun after a crash x2 -> x2.5: 39 -> 42%.

None of these touch robots as they come, so the Lineup Arena table stays valid.

## 7. Which part suits which robot (10 Nov)

Test (`tools/damage-lab/partfit.js`): every deck part (20, legendaries included) on every robot (33) against 4 robots a level up (level 4: its own level), 4 seeds x 2 sides = 32 fights a robot and part, with the same seeds as the robot without a part. Measured: win and health margin at the end (own health minus the enemy's), which is far less noisy than win/lose. 21,000 fights.

**Is it random?** Partly. The seeds were split in two halves and the results compared:
- How much a part changes a fight splits about evenly into three: the part itself, the robot (some robots gain from any part), and the specific robot + part fit.
- About 40% of the fit spread is noise (the two halves disagree); the rest is real. So most combos are "a part is a part", but a set of them really stand out.
- 56 of 660 combos stand out on both halves and in wins: **32 great fits, 24 poor fits**.

Patterns behind them:
- **Pester chip** is great on level 1-2 robots and on spinners (Whirlwind, Mincer, Rocketeer, Brawler, Gyro), terrible on heavy level 3-4 frames (Corkscrew, Vertigo, Ramrod, Lodestone, Forklift: chip overload).
- **Overdrive** suits ranged and saw robots (Whaler, Sawblast, Rocketeer, Popcorn) and does nothing for Thumper (hammer) or Corkscrew.
- **Tow cable and Sensor scrambler** need a heavier robot: weak on level 0 (Blowtorch, Thumper, Rumbler), strong on Thwacker, Forklift, Angler, Whaler.
- **Energy shield** helps level 0 and slow heavies (Thumper, Juggernaut, Lodestone) but not robots that already have a shield or lean on their own module (Whirlwind, Brawler's EMP, Hydra).
- **Modules on Brawler** are poor (it loses its EMP); drones and power suit it (Medic, Booster, Power kit, Field hospital).
- Biggest single fits: Ramrod + Power kit (+53 wins), Scythe + Booster (+63), Orbiter + Matador (+53), Sawblast + Overdrive (+53), Mincer + Pop-up flipper (+50).

**In the game:**
- Bookie tag on a robot with such a part: 🧩 **Great fit** (green) or 🧩 **Poor fit** (red), with the test numbers in the help.
- The bookie's odds move by a small step for each (+-0.3 in log-odds, about 7 points at even odds).
- Market lots say "🧩 great fit" / "🧩 poor fit" next to the odds change for your robot.

## 8. Epic combos (10 Nov)

The 14 strongest great fits were re-tested on fresh seeds against **every** robot a level up (30-42 fights each, `tools/damage-lab/epic-confirm.js`). An epic combo has to win far more than the part does for an average robot (the average gain per part is +2 to +32 points). Seven held up:

| Combo | Robot + part | Wins vs a level up: without -> with |
|---|---|---|
| **Freight Train** | Ramrod + Power kit | 38 -> 93% |
| **Killer Whale** | Whaler + Overdrive | 17 -> 67% |
| **Stun Ram** | Ramrod + EMP burst | 38 -> 79% (open floor only, section 9) |
| **Matador Moon** | Orbiter + Matador chip | 39 -> 78% |
| **Heavyweight** | Brawler + Power kit | 50 -> 86% |
| **Popcorn Blast** | Popcorn + Overdrive | 36 -> 69% |
| **Grim Rush** | Scythe + Booster drone | 33 -> 63% |

Dropped on the re-test (good, not epic): Angler + Prototype core and Brawler + Field hospital (legendaries are that strong on anyone), Sawblast + Overdrive, Mincer + Pop-up flipper, Brawler + Booster, Mincer + Pester, Pincher + Medic.

In the game:
- A robot with its epic part gets a gold **⚡ EPIC: <name>** bookie tag (always shown first).
- When a Market lot would make an epic combo with any robot on the table, the lot gets a gold **⚡ EPIC: <NAME>** ribbon and a pulsing gold edge, and the log calls it out ("Epic combo in the Market: Overdrive on Moss Gears' Popcorn = Popcorn Blast, wins 36% -> 69%"). The lot's odds line says "⚡ EPIC" too.
- The bookie's odds move more for an epic combo (0.7 in log-odds instead of 0.3).

## 9. Double check (10 Nov)

Everything above re-run on seeds it had not seen (`matrix-fresh.js`, `epic-arenas.js`, part tiers again).

**The bookie's table is well calibrated.** All 528 open-floor pairs, 6 fresh fights each, grouped by the 20% range the table gives:

| Table says | Fresh fights won |
|---|---|
| 0-20% | 9% |
| 20-40% | 29% |
| 40-60% | 46% |
| 60-80% | 67% |
| 80-100% | 83% |

**Levels hold** on fresh seeds: lower level wins 32% (L0 v L1), 47% (L1 v L2), 33% (L2 v L3), 28% (L3 v L4). L1 v L2 is close to even (42% in the table, 47% here): the smallest step on the ladder.

**Counters are real:** of 149 pairs 25+ points off what the level gap gives, 141 lean the same way on fresh fights, 133 are still 15+ points off.

**Part tiers reproduce** within about +-3 points (9 parts re-run): Prototype core 66 -> 69, Weapon overhaul 55 -> 56, Booster 51 -> 50, Overdrive 54 -> 51, Pop-up flipper 48 -> 48, Tow cable 50 -> 47, Pester chip 42 -> 39, no part 35 -> 33. Sensor scrambler came out lower (53 -> 47): it is a middle-tier part, not a strong one.

**Epic combos in every arena, own level and two levels up** (gain in wins with the part):

| Combo | Cage | Ice | Killbox | Saws | Own level | 2 levels up |
|---|---|---|---|---|---|---|
| Freight Train | +50 | +29 | +35 | +21 | +40 | - |
| Killer Whale | +35 | **+7** | +28 | +22 | +55 | - |
| Stun Ram | +14 | +7 | +28 | +28 | +20 | - |
| Matador Moon | +66 | **+9** | +50 | +16 | +42 | - |
| Heavyweight | +25 | **+8** | +50 | +25 | +43 | +18 |
| Popcorn Blast | +58 | +50 | +59 | +33 | +37 | +35 |
| Grim Rush | +50 | **-20** | +70 | +50 | +45 | +38 |

(10-14 fights per cell: about +-14 points.)

Changes: **Stun Ram is epic on open floor only** (Kev: keep the tag there); in the other arenas it is a great fit. Killer Whale, Matador Moon, Heavyweight and Grim Rush do not hold on the **Ice Rink** (speed and sidesteps slide away): there the epic tag and its odds bump are off, and the help and Market call-out say "not on Ice Rink". Popcorn Blast and Freight Train hold everywhere.

## 10. Triple combos: can a small robot beat the big ones? (10 Nov)

Search (`tools/damage-lab/triple-search.js`): every level 0-2 robot (20) fully kitted, i.e. two of its four best-fitting parts plus one of the three legendaries (up to 18 builds a robot, no double modules or chips), against every level 3 and 4 robot (13), both sides. 9,400 fights.

**Yes, and not only with exceptional combos.** As they come these robots beat level 3-4 robots 0-42% of the time; with their best three parts:
- 14 of the 20 reach 88% or more, every one of them at least 77% except Snapjaw (50%).
- Top: Gyro (L2) Tow cable + Jammer drone + Field hospital and Scythe (L1) Booster + Power kit + Prototype core: 26 out of 26.
- Gun drone is in 13 of the 20 best builds.

**Parts stack about evenly** (fresh seeds, `triple-stack.js`), roughly +20 points per part against bare level 3-4 robots:

| Robot | As it comes | 1 part | 2 parts | 3 parts | 3 parts vs L3-L4 with Weapon overhaul + Hull | ... + Prototype core |
|---|---|---|---|---|---|---|
| Gyro (L2) Tow + Jammer + Field hospital | 35 | 58 | 77 | 96 | 77 | 31 |
| Scythe (L1) Booster + Power kit + Core | 27 | 58 | 69 | 92 | 73 | 31 |
| Brawler (L2) Power kit + Gun drone + Field hospital | 19 | 54 | 69 | 92 | 58 | 31 |
| Mauler (L1) Gun drone + Weapon overhaul + Core | 35 | 62 | 77 | 88 | 65 | 23 |
| Buzzkill (L0) Medic + Gun drone + Core | 23 | 46 | 65 | 85 | 38 | 19 |
| Popcorn (L0) Gun drone + Overdrive + Quantum | 8 | 15 | 42 | 81 | 35 | 15 |

So a kitted small robot crushes a bare big one, but once the big robot is kitted too the level gap comes back (15-31%, about one level's worth). In a game that is the real situation: parts cost credits and there is one copy of each legendary.

**Giant-slayer builds** (the ones that stay at ~30% even against fully kitted level 3-4 robots, two or three levels up): Scythe Booster + Power kit + Prototype core, Gyro Tow cable + Jammer drone + Field hospital, Brawler Power kit + Gun drone + Field hospital, Mauler Gun drone + Weapon overhaul + Prototype core.

In the game:
- A robot with all three gets a purple **👑 Giant-slayer build** bookie tag (shown first), and a bigger odds bump.
- When a Market lot is the last part a robot needs, the lot gets a **👑 COMPLETES GIANT-SLAYER** ribbon and the log says so.

Worth watching: the Gun drone is in most top builds, and three parts on any robot are worth about three levels against an unkitted robot. If games show cheap kitted robots running over the late game, the first knob is the Gun drone (or a cap of one drone per robot).

## 11. Modules sweep, free-for-all and 2v2 specialists (10 Nov)

**Every module on every level 0-2 robot** (`sweep-modsweep.js`): each of the 6 deck modules with the robot's best non-module part and its best legendary, against every level 3-4 robot (same seeds as section 10). Module averages: Tow cable 75%, Sensor scrambler 73, EMP 72, Mine layer 71, Pop-up flipper 71, Energy shield 67. Only Wrecker found a better build than section 10's: Sensor scrambler + Gun drone + Field hospital, 85% (was 77%, within the +-10 noise of 26 fights). Nothing was missed: modules are about as good as the other parts in a full build.

**Free-for-all** (1,200 four-robot fights, random lineups from all 33 robots, `sweep-ffa.js`). Each robot's win share against what its duel strength (the matchup table, Bradley-Terry) predicts:
- Duel favourites win less in a free-for-all than their duel record says: FFA win = 10 + 0.59 x the duel-based share. A heavy favourite gets ganged up on, an underdog picks up wins.
- On top of that some robots are clearly better or worse at it. **Split-half r = 0.81**: the same robots come out on top in both halves of the fights, so it is real.

| Brawl masters (points above) | | Lost in a melee (points below) | |
|---|---|---|---|
| Mauler (L1) | +17 | Trebuchet (L4) | -19 |
| Orbiter (L4) | +14 | Corkscrew (L4) | -18 |
| Ramrod (L3) | +14 | Forklift (L3) | -17 |
| Thwacker (L2) | +14 | Jouster (L0) | -11 |
| Rocketeer (L1) | +13 | | |
| Gyro, Vertigo, Whirlwind | +11 | | |

Most masters hit whatever comes close (flail, tail, orbiting discs, spinners); Rocketeer fires from range and Ramrod charges through. The misfits commit to one target at a time (lifter, spear, corkscrew drill, trebuchet).

**2v2** (1,200 fights, `sweep-tv.js`): a team wins about as its two robots' duel strengths add up (slope 1.1). Extra 2v2 skill is mostly noise (split-half r = 0.22). Two robots are worse partners on both halves: **Trebuchet -11** (its throws hit its own partner too) and **Snapjaw -10**.

In the game:
- In a free-for-all: 🌀 **Brawl master** (green) / 🌀 **Lost in a melee** (red) tags, shown first.
- In a 2v2: 🤝 **Lone wolf** (red) on Trebuchet and Snapjaw.
- The bookie's free-for-all odds now use the calibration above (favourites less sure) plus the specialists; 2v2 odds move by the two lone wolves' points.

## 12. Access baseline: can players reach parts, combos and answers? (10 Nov)

60 whole games of the 2.0 page, all four teams AI (`node tools/game-sim.js --page=prototypes/tabletop-2.html --games=60 --tag=access_base`, then `node tools/access-report.js access_base`). game-sim now records what the Market offered each round, who won it, and what every robot carried. All 60 finished, 0 page errors. **A 2.0 game lasts 11 rounds on average (9-13)**, not 6: the 6 quoted earlier came from game-sim's default page, which is the 1.0 prototype (see the note at the end).

**Parts come late and once.**
- A given part has been offered by round 2 in 24% of games, by round 4 in 47%, by round 6 in 68%; in 7% of games it never shows.
- It is offered 1.2 times a game. A Market has 2.2 part lots, 1.2 robots and 0.4 crew on average.
- Only 61% of part lots find a buyer.

**Combos mostly slip by.**
- 82% of games have at least one epic chance in the Market (1.4 a game), but the robot's owner gets it only 27% of the time; a rival takes it 38%, 35% go unsold. Epic combos completed: 0.37 a game (about one game in three).
- Great fits: 5.5 chances a game, the owner gets 24%; 1.4 fitted a game.
- Giant-slayer builds: none in 60 games (one robot got two of its three parts).
- At the end 52% of robots carry no part, 18% one, 20% two, 10% three. Fully kitted small robots overrunning the late game does not happen at this table.

**Robot answers are reachable.** A "threat" is a rival robot none of your robots beats 40% of the time (table odds); teams face one in 63% of their rounds. A robot lot that beats it 60%+ is in the Market the same round for 58% of threats and within two more rounds for 92%; the threatened team buys one 55% of the time.

Reading: counters by robot are accessible; **parts and combos are the bottleneck** (late, single shot, and the AI at least does not recognise them). The target for the conveyor step: owner gets an epic chance about half the time, about one epic combo a game, a given part seen by round 4 in 65%+ of games.

Caveats: AI bidders, not people; the AI values a fit only through the bookie's odds. "Epic chance" counts a robot without a free slot too.

**Note on earlier game checks.** The quick "N test games, no errors" checks in sections 5-11 used `game-sim.js` without `--page`, which runs the frozen 1.0 page, so they did not exercise the 2.0 changes. The multiplayer test and the browser checks did run on 2.0, and this 60-game run confirms the current 2.0 page plays whole games without errors.

## 13. The conveyor and the guaranteed mix (10 Nov)

**Built** (prototypes/tabletop-2.html):
- **Every Market is dealt a round ahead** (`dealMarket(round)`, `G.nextMarket`). A strip under the lots, the log and the prompt bar show next round's lots: three face up, one 📦 mystery crate. An announced legendary or level 4 robot takes the mystery slot and is shown.
- **Guaranteed mix:** slot 1 a robot (rounds 1-5, as before; later a wild lot), slots 2-3 two part lots of different groups (drone / module / upgrade-or-chip), slot 4 the mystery crate (wild: a part of a third group, a robot or crew). Parts are picked from the top of the shuffled lot deck; a fresh deck goes under what is left.
- Late swaps (a team without robots, a level 4 robot not announced) take the mystery slot, so the face-up lots stay as promised.
- **Bookie marks on the strip:** ⚡ gold edge when the lot makes an epic combo / completes a giant-slayer build for any team, 🧩 when it is a great fit for one of your robots; the hover lists who and what.
- **The AI plays it:** its own epic combo or great fit is worth more, a rival's epic part gets a denial bid (to the Stash), and it keeps 4 Cr back when its epic part is face up for next round.

**Measured** (60 AI games each, same seeds; base = section 12):

| | Base | Conveyor + mix | + AI knows combos |
|---|---|---|---|
| A given part seen by round 4 (target 65%) | 47% | 58% | 58% |
| ... by round 6 | 68% | 79% | 79% |
| ... never in the game | 7% | 2% | 2% |
| Part lots per Market | 2.2 | 2.5 | 2.5 |
| Epic chances per game | 1.4 | 1.8 | 1.8 |
| Owner gets the epic part (target ~50%) | 27% | 20% | 36% |
| A rival takes it | 38% | 44% | 48% |
| It goes unsold | 35% | 36% | 17% |
| Epic combos completed per game (target ~1) | 0.37 | 0.27 | 0.68 |
| Great fits fitted per game | 1.4 | 1.5 | 2.6 |
| Robots ending with 2-3 parts | 30% | 39% | 41% |
| Giant-slayer builds | 0 | 0 | 0 |

Game length (11.4 rounds), credits held, Market spend and seat fairness are unchanged; close finishes 42% -> 50%. 60/60 games, 0 page errors; multiplayer test OK.

Reading: the conveyor alone shows parts earlier but changes nothing until bidders act on it; once the AI knows the combos, epic builds nearly double and denial becomes the main fight over them (a rival takes almost half). Short of the targets on two counts: parts by round 4 (58 vs 65%) and owner capture (36 vs 50%). People who read the strip should do better than this AI. Next levers if wanted: a second copy of the single-copy parts, or the Workshop order (pay to dig for a part).

## 14. 200 AI games of 2.0 (10 Nov, evening)

`node tools/game-sim.js --page=prototypes/tabletop-2.html --games=200 --par=2 --tag=v2_200`, then `game-sim-report.js`, `deep-report.js` (new: robots, parts, tags and the game's arc) and `access-report.js`. Full outputs: docs/reports/v2_200-*.txt. **200 / 200 games finished, 0 page errors, 0 stalls, 2,260 fights.**

**Healthy**
- Length 11.6 rounds (10-14). Seats win 23 / 28 / 27 / 22% (±3: fair).
- Close: runner-up within 1 fame in 48% of games, within 2 in 80%. 2.3 lead changes a game; the winner led at half-time in only 46%; 43% of winners were 3+ fame behind at some point.
- The bookie is calibrated in real games: every 10% band is within 4 points (Brier 0.169 vs 0.249 for a coin). The favourite loses 25% of fights; a 20%-or-less long shot wins 0.6 times a game.
- Levels step up: fighters win 39% (L0), 50% (L1), 52% (L2), 58% (L3), 62% (L4). Level 4 beats level 3 49% in duels.
- Parts stack as measured and the bookie prices it: 0 parts 43% wins, 1 part 51%, 2 parts 60%, 3 parts 70%.
- Economy: every credit change is logged (0.0 unlogged); income mechanics 115, appearance 92, cash-ins 68 a game; spend Market 146, host bids 80, bets 32.

**Worth a decision**
1. **Free-for-alls almost never happen:** 11 of 2,260 fights (0.5%); Mirror 3. Duel 53%, double duel 29%, 2v2 17%. The 🌀 free-for-all tags and odds are there but nobody sees them. Arenas: open floor 85% (saws 6, killbox 5, ice 3, cage 2).
2. **Level 4 floods the late game:** from round 6 a level 4 lot every round, 6.1 bought a game, almost as many as levels 1-3 together (6.6). The fame leader buys 48% of them. Level 4 robots are 21% of all fighters.
3. **Hosting gives nearly as much fame as fighting:** fame per game from cards +13.7, fight wins 12.1, hosting 11.3 (host bids cost 80 Cr a game, 7 Cr each).
4. **The bookie overrates a few things:** Grandmaster wins 47% where the odds say 58%; Blowtorch -8, Brawler -7; Lodestone +10, Trebuchet +8, Thwacker +7. Counter picks win 75% where the odds say 81%: the table's counters are a bit weaker once robots carry damage and parts. Pester chip (+10) and Tow cable (+8) do better than their odds.
5. **Combos are rare in practice:** 0.58 epic combos a game (owner gets the part 37%, a rival 43%); a robot with its epic part wins 58%, as the odds say (57%): priced right, not overpowered. **No giant-slayer build in 200 games** (two of three parts: 12 times).
6. **Parts go unsold:** 27% of all lots. Weapon overhaul and Reinforced hull (2 copies each) sell 44% of the time at 1.4 Cr although their carriers win 70%; chips sell under 50%; Matador carriers win 50%.
7. **Damage lingers:** a third of fighters start with a broken Body zone; Upkeep fixes 41% of damaged zones.
8. **Credits pile up late:** the winner ends with 14.8 Cr unspent (others 8.7); the richest team from round 10 holds 21.5 Cr on average.

Access numbers (section 13) hold at 200 games: a part seen by round 4 in 58%, by round 6 in 79%; robot answers within 2 rounds for 91% of threats.

## 15. Kev's decisions on section 14 (10 Nov)

| # | Point | Decision |
|---|---|---|
| 1 | Free-for-alls are rare (0.5% of fights) | **Keep it rare**: only through the Grand Melee card. |
| 2 | Level 4 floods the late game | **Rarer: a level 4 lot every 2nd round** from round 6 (about 3 a game). |
| 3 | Hosting fame ~ fight fame | **Keep it.** |
| 4 | Bookie off on a few robots / counters | **Fix the robots, not the odds**: find why Grandmaster and the others play differently in real games; the bookie stays honest. |
| 5 | Combos are rare | **More epic combos in the list** (search and confirm more; each stays rare). |
| 6 | 27% of lots unsold | **Bargain bin**: an unsold part stays one more round at a marked-down minimum, shown on the conveyor. |
| 7 | Lingering damage | **Keep it gritty.** |
| 8 | Credits pile up late | **Leave it for now**; re-measure after 2 and 6. |

To do, in order: 2 (one setting, BAL.level4.lotEvery), 6 (bargain bin), 5 (epic search), 4 (robot investigation), then 200 games again.

## 16. Acting on the decisions (10 Nov, night)

**Done**
- **Level 4 every 2nd round** (`BAL.level4.lotEvery: 2`). 60 AI games: 3.1 level 4 robots bought a game (was 6.1), 98% sold.
- **Bargain bin.** An unsold part used to drop out of the lot deck until the deck was rebuilt. Now the first unsold part of a round comes back next round in the mystery slot, face up on the conveyor, **1 Cr off the winning bid** (a 1 Cr bid gets it free); other unsold parts go to the bottom of the deck. Never two rounds running, and never over an announced legendary / level 4, so the mystery crate keeps its turn. 60 AI games: parts bought 17.6 -> 19.9 a game; robots ending with 2-3 parts 40% -> 59% (level 4 money now goes to parts); 0 errors.
- **Five more epic combos** (12 in all). 28 further candidates from the part-fit data were re-tested on fresh seeds against every robot a level up (30-42 fights), the best again in every arena:

| Combo | Robot + part | Wins vs a level up | Not on |
|---|---|---|---|
| Rocket Ram | Ramrod + Booster drone | 38 -> 90% | Ice Rink |
| Whiplash | Thwacker + Tow cable | 44 -> 81% | - |
| Cornerman | Brawler + Medic drone | 50 -> 83% | Cage |
| Pinball | Orbiter + Pop-up flipper | 39 -> 75% | Saws |
| Blackout Lure | Angler + Sensor scrambler | 39 -> 75% | Saws |

  At most two epic combos a robot (plus Ramrod's open-floor Stun Ram): Ramrod + Gun drone (+40), Orbiter + Wall Bait (+33) and Orbiter + Sensor scrambler (+31) also passed but would make everything on those robots "epic". Short 10-game check: 2.9 epic chances a game (was 1.7).

**Open: the robots that are off their odds.** Looked at the 200 games by format: Lodestone, Trebuchet and Thwacker are spot on in duels (66 / 66%, 69 / 69%, 54 / 50%) and only beat their odds in double duels and 2v2 (+14, +10, +9). Grandmaster and Blowtorch are below their odds in both. Tried giving team fights table-based strengths (Bradley-Terry ratings from the matchup table instead of level and grade): no better over 60 games (mean robot gap 8.0 vs 7.4 points), so it was taken out again. This needs fight-level study (how these robots play with a partner, and how Grandmaster and Blowtorch fight when damaged) before changing anything.

## 17. The robots that were off their odds: it was the damage (11 Nov)

Kev's decision 4: find why Grandmaster and the others play differently in real games; the bookie stays honest.

**What the 200 games said, fight by fight** (6,574 fighters; then checked on 120 more games held back):
- It is not about a few robots. **Every damaged robot won less than its odds, every healthy one more**, at every level and in every format: healthy +4 points, a broken zone -7, a broken Drive -18. Healthy robot against a hurt one in a duel: 79% wins where the odds said 69%.
- Stock, healthy duels (the matchup table alone) were fine: every 20% band within 4 points.
- The robots on the list are the ones that suffer most (or least) from a broken Body: Brawler -24 with a broken Body and +0 healthy; Grandmaster -25 / -7; Blowtorch -15 / -3; Lodestone -1 / +14.

**Why: the wear study** (`tools/damage-lab/wear-study.js`, `wear-report.js`, `wear-fit.js`). Every robot was sent into fights, the damage it carried out was kept as the game keeps it (with the free Upkeep heal), and each of the 623 damaged copies fought the same 16 fights as the robot as new (9,968 fights).

| State (Drive and Weapon repaired, as in most real fights) | Wins as new | Wins damaged | Real cost | The bookie charged |
|---|---|---|---|---|
| Body broken | 48% | 31% | 0.74 | 0.15 |
| ... only armour gone (1-2 pieces) | 49-51% | 40% | 0.4 | 0.15 |
| ... 4 or more pieces gone | 47% | 21% | 1.2 | 0.15 |
| ... **processor chip dead** | 46% | 14% | 1.6 | 0.15 |

(cost in strength; one level = 0.62)

- **A dead processor chip was hidden inside "Body broken".** The robot starts its next fight "brain fried": it wanders on backup control at 60% power. Brawler, Corkscrew, Forklift, Rocketeer and Grandmaster won 0 of 16 with a dead chip. In the 200 games about 6% of all fighters walked in like that, and nothing on screen said so.
- Armour matters very differently per robot: Thumper, Forklift, Rocketeer, Wrecker, Corkscrew, Grandmaster, Thwacker and Blowtorch lose 1.2-1.5 with their armour gone; Whirlwind, Lodestone, Buzzkill, Juggernaut and Angler lose almost nothing.
- Drive: one wheel gone was priced right (1.2); two or more were far too cheap (real 3.2-3.8, charged 2.2-2.6).

**Changed**
- `src2/repair.js`: damage is priced by what is lost. `BODY_COST[robot] = [armour and top plate gone, chip dead]` from the study, Drive by wheels and motors lost (1.5 / 2.6 / 3.4), Weapon gone 3.0. A first 100-game check showed damaged robots still 6-9 points under these lab costs, so armour is x 1.2 and a dead chip + 0.6.
- The game says it: a red **🧠 CHIP FRIED** strip on the robot, "(🧠 chip fried)" in the damage line, and a bookie tag that always shows. Two more damage tags when a Body is broken: **🩹 Needs its armour** and **🩹 Shrugs it off**.
- The AI repairs by strength won back (it used to do Body last, and only with spare credits), so it pays to replace a fried chip.
- Left alone: the robots themselves, the matchup table, team-fight odds. Table-based ratings for team fights were tested again offline on 3,500 recorded fights: no real gain.

**200 AI games again** (`v2_200b`, reports in docs/reports/v2_200b-*.txt): 200 / 200 finished, 0 errors, 11.5 rounds, seats 29 / 25 / 27 / 20%.

| | Before (section 14) | Now |
|---|---|---|
| Bookie's error (Brier, lower is better; a coin = 0.25) | 0.169 | **0.152** |
| Healthy fighters, wins vs odds | +4 | +1 |
| Body broken | -7 | +1 |
| Favourite loses | 25% | 22% |
| Grandmaster / Blowtorch / Brawler / Lodestone | -11 / -8 / -7 / +10 | **+2 / -4 / -1 / +1** |

Still off: Corkscrew -11 (102 fights), Trebuchet +7, Orbiter +8, Mauler +8, Thwacker +6. A fried chip, a broken Drive or a lost weapon still win 9-10% where the odds say 16-18%: the odds cannot go below 3-5%, and these robots are close to that floor. 6% of fighters still walk in with a fried chip (a team with one robot has no choice).

## 18. Kev's playtest: the host snowball (11 Nov)

Kev's game (log 2026-11-10T21-40): he cashed in almost every card, won the host bid in 9 of 10 rounds for 7-13 Cr (the AIs bid 6-8), put his best robot against the weakest every time (odds 80-97%) and won 13-7-3-0. Hosting cost him 80 Cr; appearance money (38), cash-ins (40), AI offers to the host (18) and backing fees (16) paid for it.

**Is it the strategy or the player?** A test AI that does only this ("the bully": always bids 9 for the host seat, cashes every card, otherwise the normal AI) in seat 0 against three normal AIs, 60 games each (`node tools/game-sim.js ... --aip0='{"hostMin":9,"cashAll":true}'`):

| Table | Bully wins | Bully hosts |
|---|---|---|
| Normal AIs | **63%** | most rounds |
| AIs bid to deny (+2 Cr per round the same rival hosted of the last 3, +3 for its fame lead) | 50% | 58% |
| AIs bid much harder (deny 3 + lead 4, host fame 8) | 48% | 54% |
| Rule: a repeat host's bid counts 3 Cr less per round in a row (bully bids 12) | 43% | 54% |
| Rule: **last round's host cannot bid for the host seat** | **30%** | 43% |

A fair seat wins about 25%. The bully wins about 80% of the fights it hosts for itself, so bidding against it only makes it pay a little more; the seat itself is the problem.

**Kev (11 Nov): no host ban. Hosting is essential; other mechanisms should fight it.** So the AIs now defend the way a table of people would, three steps, each 60 games against the same bully:

| Normal AIs plus... | Bully wins | Bully's income from host deals |
|---|---|---|
| nothing | 63% | 20 Cr |
| 1. bid to deny a repeat host (`hostDeny 2, hostDenyLead 3`) | 50% | |
| 2. and stop paying the host to spare every robot | 37% | 6 Cr |
| 3. and aim their cards at a team that keeps hosting | **28%** | |

1. **Deny bids.** +2 Cr on the host bid per round the same rival hosted of the last 3 (from 2), up to +3 for its fame lead.
2. **Spare pleas.** The AI used to pay the host after every lost fight. Now only for a robot worth saving (level + parts + 2 per win, +3 for its last robot, at least 2) and only when the host has a reason to scrap it (the loser is within 2 fame of the host, or leads). AIs also stop paying to be invited or left out by a fame leader who hosted 2 of the last 3 rounds.
3. **Card targets.** A team that hosted 2-3 of the last 3 rounds counts as a bigger threat (+0.3 per round) when the AI picks who to hit.

The bully still hosts 54% of rounds and still wins 76% of the fights it hosts for itself; it now pays for it and gets hit for it. 60 normal AI games with all three: 60 / 60 finished, 0 errors, 11.6 rounds, host spend unchanged (20 Cr a team).

**Cash everything, on its own** (no host bids, 60 games): 37% wins. The casher gets 3.9 Cr a round from cards (2.6 cards at 1.5 Cr) against 1.4 for a normal AI, and spends it on the host seat (41% of rounds). A mild edge over the AI's own card play; card values left alone (Kev: cards are stronger between people).

`BAL.hostRule` (noRepeat / streakTax) stays in the code, off.

**Multiplayer and screen check (11 Nov):** `PAGE=tabletop-2.html node tools/mp-test.js 3 5 10` and the chaos run (drop-out and rejoin, host skips a player, AI takes a seat, save loaded): both OK, 0 desyncs, 0 errors. This is the local transport in one browser, not separate devices on a network. The 🧠 FRIED strip, the CHIP FRIED tag and the red Body chip show on the robot tickets.

## 19. AI styles, grudges, sponsors, and what fame and cards are worth (11 Nov, evening)

**What fame is worth in credits** (`node tools/worth-report.js <runs>`, docs/reports/worth.txt). For every round: each team's fame, credits, robots and cards, and who won in the end. Two sets of normal AI games (420 and 510 games) give the same shape but not the same numbers, so these are ranges:

| Leader's fame at that point | 1 fame is worth | 1 robot is worth | 1 card in hand |
|---|---|---|---|
| 0-3 | 0.1-1.0 Cr | 5.6-5.7 Cr | 0-0.5 Cr |
| 4-6 | 0.4-1.2 Cr | 4.4-5.4 Cr | 1.1-1.7 Cr |
| 7-9 | 2.1-2.2 Cr | 5.7-6.1 Cr | 0.9-2.6 Cr |
| 10-11 | 4-10 Cr | 5.4-10 Cr | 3.3-3.4 Cr |

Early fame hardly decides who wins (leaders get hit, comebacks are common); credits and robots do. In the last stretch one fame is worth several times more. The AI prices fame at 6 Cr all game. An AI that follows a rising curve instead ("investor": 2 / 3 / 5 / 10 Cr) hosts less (17% of rounds) and wins 26% of 50 games: no better, so the flat 6 stays.

**What a card is worth** (same report, part 2): per play, what the player and the others gained, with fame at 6 Cr. Nearly every card is worth more played than cashed (cash-in 0-2 Cr): the +1 fame Publicity cards about 5 Cr, Roadshow 9, Underdog Story 12, the income cards 2.5-5, smears 3-5 (blocked 40-45% of the time), Tax Audit 1.6, Hype Reel 1, Shill Bidder 0. With early fame worth about 1 Cr or less, cashing the fame cards early costs little; late it throws away several credits a card. That is why "cash everything" works early and why Kev still won with it.

**Grudges and favours** (new, `G.rel`): a team remembers who hit it with a card (-2 landed, -1 blocked), who scrapped its robot (-3) and who backed its schemes (+1); it fades 15% a round. A grudge makes that team a bigger target and stops backing; a favour does the opposite. The log says "😠 X holds a grudge against Y" and "🗡️ X turns on Y, who helped it before". In 400 AI games: 11 attacks a game, 3.2 of them on a grudge target, 0.56 backstabs.

**AI styles** (`AI_STYLES`; test with `--aip0='{"style":"vengeful"}'`), one in seat 0 against three normal AIs, 50 games each (±6 points; fair is 25%):

| Style | What it does | Wins |
|---|---|---|
| schemer | plays up to 4 cards a turn, lower bar | 32% |
| backstabber | forgets favours; turns on a helper within 3 fame of the win | 28% |
| investor | fame priced by the curve above | 26% |
| miser | no surplus spending, low host bids | 26% |
| normal | | 22% |
| showman | values hosting more, 3 cards a turn | 22% |
| loyal | spares teams that helped it | 16% |
| vengeful | goes hard after anyone who hurt it | 10% |

Revenge and loyalty cost games; playing more cards and dropping friends pay a little. In solo games every AI team now gets a style (`BAL.aiStyles`), named in the log at the start. All AIs: mild grudges and loyalty by default, and they never bid more than the richest rival could (its credits + 1).

**Sponsors** (`node tools/sponsor-report.js <runs>`; normal AI seats only):

| Sponsor | Before (about 205 seats each) | After (about 130 seats each) |
|---|---|---|
| Sovereign Foundry | **45%** | 35% |
| Blackwire Syndicate | 29% | 33% |
| Vulture Salvage | 24% | 17% |
| Apex Media | 20% | 19% |
| Lucky Seven | 19% | 23% |
| Aegis Heavy | **14%** | 24% |

**Changed:** Sovereign Foundry starts with 3 Mechanics (was 4; others have 2: the extra 2 Cr a round compounded, and it was Kev's sponsor in the snowball game). Aegis Heavy gets 2 free repair actions every Upkeep (was 1). Still uneven: Sovereign and Blackwire high, Vulture and Apex low (±4 points on these counts).
