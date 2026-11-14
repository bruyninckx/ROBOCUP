# ROBOCUS: everyone vs everyone with no power tweaks (preview, 14 Nov 2026)

Kev (14 Nov): "My goal is to eventually remove all the power tweaks on them, let them all battle against each other and figure levels out like that."

**What was run:** all 41 robots (25 lineup, 8 level 4, 8 candidates) at power grade 1, damage x1, drone and module strengths at engine defaults. Every pair fought 4 times (sides swapped), 3,280 fights, open floor, 2.0.1 switches off. Branch `claude/robots-2.0.1`.
Scripts: `tools/damage-lab/rr-free.js` (the fights, split over CPU cores) and `tools/damage-lab/rr-free-report.js` (the ratings).

**Rating:** one number per robot from all its results (Bradley-Terry, Elo scale): +100 means it beats an average robot about 64% of the time; one level in the current game is about +85. With 4 fights per pair a rating is good to about +-40; a single matchup is not reliable yet.

## The ranking

| # | Robot | Rating | Win % | Level now | Tweaks it had | Beats 75%+ | Loses to 75%+ |
|---|---|---|---|---|---|---|---|
| 1 | Rotisserie | 509 | 94% | candidate (4) | none | 38 | 1 |
| 2 | Corkscrew | 332 | 84% | 4 | p1.04 | 32 | 3 |
| 3 | Lodestone | 254 | 78% | 4 | p1.20 | 31 | 4 |
| 4 | Vertigo | 254 | 78% | 3 | p1.16, dmg x0.95 | 31 | 3 |
| 5 | Angler | 233 | 76% | 4 | p1.18 | 30 | 6 |
| 6 | Brawler | 213 | 74% | 2 | p1.06, dmg x0.65 | 29 | 3 |
| 7 | Ramrod | 170 | 70% | 3 | p1.15, dmg x1.1 | 27 | 9 |
| 8 | Gyro | 130 | 66% | 2 | p1.03, dmg x1.1 | 24 | 11 |
| 9 | Haymaker | 93 | 61% | 0 | p0.76 | 22 | 11 |
| 10 | Trebuchet | 82 | 60% | 4 | p1.38, dmg x1.1 | 21 | 11 |
| 11 | Thumper | 72 | 59% | 0 | p0.94 | 20 | 10 |
| 12 | Talon | 67 | 58% | candidate (2) | none | 20 | 13 |
| 13 | Sawblast | 57 | 57% | 3 | p1.27, dmg x1.12 | 21 | 13 |
| 14 | Blacksmith | 46 | 56% | candidate (3) | none | 17 | 13 |
| 15 | Tarantula | 41 | 55% | 4 | p1.25, dmg x1.4 | 20 | 14 |
| 16 | Juggernaut | 36 | 54% | 1 | p1.14 | 16 | 16 |
| 17 | Jouster | 16 | 52% | 0 | p0.93 | 18 | 15 |
| 18 | Whirlwind | 6 | 51% | 2 | p1.02, dmg x1.12 | 15 | 13 |
| 19 | Popcorn | 1 | 50% | 0 | p0.95 | 17 | 15 |
| 20 | Snapjaw | 1 | 50% | 0 | p0.96 | 14 | 14 |
| 21 | Scythe | -4 | 49% | 1 | p1.08, dmg x1.2 | 20 | 18 |
| 22 | Rumbler | -4 | 49% | 0 | p0.96 | 15 | 17 |
| 23 | Grandmaster | -4 | 49% | 3 (level 4 set) | p1.11, dmg x1.45 | 16 | 15 |
| 24 | Mauler | -14 | 48% | 1 | p1.22, dmg x1.12 | 15 | 18 |
| 25 | Jukebox | -19 | 48% | candidate (0) | none | 13 | 19 |
| 26 | Blowtorch | -19 | 48% | 0 | p1.04 | 14 | 15 |
| 27 | Buzzkill | -24 | 47% | 0 | p0.97 | 14 | 16 |
| 28 | Hydra | -44 | 44% | 4 | p1.21, dmg x1.8 | 12 | 18 |
| 29 | Whaler | -49 | 44% | 3 | p1.23, dmg x1.8 | 16 | 20 |
| 30 | Hornet | -96 | 38% | 1 | p1.03, dmg x1.35 | 6 | 18 |
| 31 | Wrecker | -101 | 38% | 0 | p1.10 | 9 | 21 |
| 32 | Mincer | -101 | 38% | 1 | p1.14, dmg x1.55 | 12 | 22 |
| 33 | Rocketeer | -128 | 34% | 1 | p1.01 | 7 | 23 |
| 34 | Forklift | -128 | 34% | 3 | p1.08, dmg x2 | 9 | 26 |
| 35 | Pincher | -145 | 33% | 2 | p1.19, dmg x1.8 | 9 | 25 |
| 36 | Scavenger | -162 | 31% | candidate (0) | none | 5 | 25 |
| 37 | Orbiter | -198 | 27% | 4 | p1.26, dmg x2 | 4 | 24 |
| 38 | Gaucho | -198 | 27% | candidate (0) | none | 2 | 27 |
| 39 | Slingshot | -224 | 24% | candidate (0) | none | 3 | 28 |
| 40 | Bricklayer | -358 | 14% | candidate (0) | none | 2 | 34 |
| 41 | Thwacker | -595 | 4% | 2 | p1.02, dmg x5 | 0 | 39 |

## What it says

1. **Physics alone spreads the robots enough for levels.** Leaving out the two extremes, they span about 560 rating points, more than six level steps. The earlier worry (8 Nov: everything within a narrow band, so grades were needed) does not hold for today's roster.
2. **But the order is very different from today's levels.** Haymaker, our weakest-graded starter (x0.76), is 9th of 41. Brawler (damage x0.65) is 6th. Five of the eight level 4 robots land mid-table or lower.
3. **The big damage multipliers were propping up weak mechanisms.** Every robot with damage x1.8 or more drops into the bottom third without it: Thwacker (x5) last, Orbiter, Forklift, Pincher, Whaler, Hydra. These need their mechanism fixed (or their weapon's physics recalibrated), not a level.
4. **The top is thin, the middle is crowded.** Cutting at level-sized steps gives about 5 robots at the top (Rotisserie, Corkscrew, Lodestone, Vertigo, Angler), 3 in the next band, 7 in the next, 14 in the middle band and 12 at the bottom. The game wants 9 / 6 / 5 / 5 / 8 (starters up to level 4).
5. **Rotisserie is too strong untweaked** (loses 75%+ to only one robot). Every other robot has at least three matchups it loses badly, which is good for counterplay.
6. **Most of the new candidates sit at the bottom** (Scavenger, Gaucho, Slingshot, Bricklayer), apart from Rotisserie, Talon and Blacksmith (upper middle) and Jukebox (middle).

## Next steps (suggested)

- Bring the two damage models (contact impulse formula and the new energy rule) onto one scale before the final ranking; otherwise the ranking partly ranks the formulas.
- Fix or rethink the mechanisms that only worked with big multipliers: Thwacker, Orbiter, Forklift, Pincher, Whaler, Hydra, Mincer.
- New mechanisms aimed at the top bands (only 5 robots there now).
- Then the full run on Kev's PC: 20 fights per pair, sides swapped, also with the 2.0.1 switches on, and the matchup table next to the ratings.

Full run on a PC with 8 cores (about half an hour; Windows cmd):

```
cd tools/damage-lab
for /L %i in (0,1,7) do start /b node rr-free.js %i 8 20 rr%i.json
node rr-free-report.js rr0.json rr1.json rr2.json rr3.json rr4.json rr5.json rr6.json rr7.json
```
