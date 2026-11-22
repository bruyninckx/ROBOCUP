# What is a part worth in THIS matchup? (T63, 22 Nov 2026)

Kev, about his Gyro (level 2, Race-spec Booster drone, Race-spec Jammer drone, Quantum shield) against Scavenger (level 3,
Overdrive + Weapon overhaul), where leaving one part out showed only the Quantum shield counted (T60: without it 7.5%, without
the Booster 37.3%, without the Jammer 41.5%, full build 39.3%): "why were they worthless exactly and it would be nice indeed to
somehow know this, or was it only worthless in this matchup. In case yes, can you do a design for me to check the feel of a
change like that before we do any big work".

A study: no game change, no engine change, no BUILD. Branch `claude/parts-by-matchup`. Scripts: `tools/t63-drones.js` (Part 1),
`tools/t63-opponents.js` (Part 2), `tools/t63-spread.js` (Part 2, old data); results in `tools/t63-out/`.

## Part 1: why exactly

The round-11 fight (open floor, both robots new, Gyro first), built as the game builds it (the same builds as
`tools/gyro-scavenger.js`: seed 2 gives the same fight as T60, shell motor lost at 5.1 s, KO at 78.5 s), measured step by step
from outside the engine. Seeds 1-200 for every row, the same seeds with and without each part.

**In four lines:**
1. **The drones do not die early.** Neither drone was shot down in any of 800 fights. Scavenger's fired junk passes through
   them (drones hover; only weapons, shots, beams and blasts reach them), and its scoop touched them in about 1 fight in 10, for a
   few HP.
2. **The Jammer works, but it slows the wrong thing.** It sits within 1.7 m of Scavenger 93% of the fight and jams it 87% of the
   time; Scavenger's cannon does reload slower (gaps under 1 s: 42% of shots without the Jammer, 7% with it). But Scavenger is
   short of **junk**, not of reload time. It starts with 3 scrap lumps and fires them at 0.5 s, about 3 s and 4-7 s. Then it has to
   vacuum up new junk (4th shot at 11-22 s). Those first 3-4 shots take Gyro's 40-HP shell motor (lost in 91% of fights, median
   8.5 s with the Jammer, 9.6 s without). The Jammer pushes shots 2 and 3 back by 0.6-3 s, and the motor goes anyway.
3. **What the Booster boosts is mostly already lost.** It is docked 57% of the fight, but docked *while the shell spins* only
   12%. Gyro's shell spins (over 12 rad/s) only 25% of the fight and its weapon is gone after a median 13 s. The +8% damage applies
   to about 128 of Gyro's 416 damage a fight (+10 HP). Push and speed do little for a shell spinner: the spinning shell does the
   damage, not the shove. Gyro deals 7% more with it (416 against 390) and wins 3 points more (± 9).
4. **Half a wiring gap (reported, not fixed):** the Jammer slows every other weapon by its own strength (a reload timer that runs
   at `jk` = 0.12 for this Race-spec Jammer, so about **8 times** slower). Scavenger's cannon has its own timer and gets a flat
   **x1.6**, whatever the Jammer's strength (`SCAV.reload * (c.jk < 1 ? 1.6 : 1)`, tools/damage-lab/engine.js). So Kev's Race-spec
   tier did nothing extra here. As a what-if (the same 200 seeds, a jammed Scavenger reloading like any other jammed weapon,
   0.9 s → 7.5 s): **Gyro wins 88.5%** instead of 38.5%, its shell motor is lost in 38% of fights instead of 91% (then at a
   median 53 s), and Scavenger fires 7.5 shots instead of 9.6.

So the answer is the second one ("they work, but what they boost is already lost") for the Booster. For the Jammer it is the
second one plus a weakly wired effect: it slows Scavenger's reload by 1.6x, not by its full strength.

### The numbers (200 fights each, seeds 1-200, `node tools/t63-drones.js --report`)

| | Full build | without Jammer | without Booster | What-if: Jammer slows the cannon fully |
|---|---|---|---|---|
| Gyro wins | 38.5% | 44.5% | 35.5% | 88.5% |
| Paired gain of the part (± 95%) | | Jammer −6 ± 9 | Booster +3 ± 9 | +50 ± 8 against the real Jammer |
| Drones shot down | 0 / 200 | 0 | 0 | 0 |
| Scavenger jammed (share of fight) | 87% | 0% | 88% | 97% |
| Scavenger shots a fight (a minute) | 9.6 (8.8) | 10.6 (9.8) | 9.8 (7.8) | 7.5 (4.2) |
| Time between shots, median | 2.2 s | 1.5 s | 2.4 s | 10 s |
| Shots 2 / 3 / 4 at (median) | 3.0 / 7.0 / 21.6 s | 2.4 / 3.8 / 11.5 s | | |
| Shots fired before the shell motor dies (median) | 3 | 4 | | |
| Shell motor lost (median time) | 91% (8.5 s) | 92% (9.6 s) | 94% (12.3 s) | 38% (53 s) |
| Gyro's weapon works until (median) | 12.8 s | 14.6 s | 17.1 s | 100 s |
| Shell spinning (share of fight) | 25% | 25% | 26% | 61% |
| Booster docked / docked while the shell spins | 57% / 12% | 58% / 13% | | 58% / 31% |
| Gyro damage dealt a fight | 416 | 455 | 390 | 728 |

- "Within 1.7 m" is the Jammer's own range: it flies to 1.15 m from the enemy, so it nearly always is. Jammed share is a little
  below that because the jam is set by the drone's position each step.
- The shell still does damage after its motor dies (a coasting or loose shell is still "shell" damage), which is why Gyro deals
  ~290 shell damage a fight with a working weapon for only 13 s.
- The Jammer's other effects do not apply to Scavenger: it has no turret (turret turn 45%), no module (module blocked) and no
  spinner (spin-up). Its vacuum is not slowed.
- Gyro is slower while the Booster is docked (0.73 against 1.05 m/s): the drone only docks when Gyro goes straight-ish. Over the
  whole fight Gyro is about 17% faster with it (0.87 against 0.74 m/s).
- The without-Jammer row is a little better than the full build (−6 ± 9 for the Jammer; T60 had −2 on 400 fights). Both are
  within the noise: the Jammer is worth about zero here, not clearly negative.

## Part 2: only this matchup?

### Kev's Gyro against 8 other robots

The same Gyro build (level 2, Race-spec Booster, Race-spec Jammer, Quantum shield), open floor, Gyro first, opponents bare as
they come at their lineup level. Each cell: the win % of the full build minus the build without that part, on the same seeds,
with the 95% range. `node tools/t63-opponents.js --report`.

**PARTIAL: stopped when Kev parked the idea (22 Nov).** Only 25 fights a cell (Hydra 6, Pogo and Railgun none), not the 150
planned, so the ranges are wide. The Scavenger row is Part 1 / T60 (200-400 fights).

| Opponent (level) | fights a cell | Gyro full build | Booster gain | Jammer gain | Quantum gain |
|---|---|---|---|---|---|
| Scavenger (3) | 200-400 | 39% | +2 ± 7 | −2 ± 7 | +31 ± 7 |
| Mauler (1) | 25 | 100% | 0 | 0 | 0 |
| Thwacker (1) | 25 | 96% | 0 ± 11 | 0 | +20 ± 16 |
| Whaler (2) | 25 | 100% | 0 | **+64 ± 19** | +4 ± 8 |
| Pincher (2) | 25 | 40% | +4 ± 26 | +20 ± 23 | +4 ± 18 |
| Slingshot (3) | 25 | 96% | −4 ± 8 | 0 ± 11 | 0 ± 11 |
| Hydra (3) | 6 | 100% | 0 | 0 | 0 |
| Pogo (4), Railgun (4) | not run | | | | |

What it already shows:
- This Gyro build wins nearly every fight against most of these robots, so a part has no room to show (a 0 there means "already
  won", not "useless"). Only Pincher and Scavenger are close fights.
- The Jammer swings most: worth about 0 against Scavenger, Slingshot and Hydra, and **+64 against Whaler** (without it Gyro wins
  only about a third of those fights). So "worth nothing" really was only this matchup for the Jammer.
- The Booster shows about 0 everywhere measured; the Quantum shield is what carries Gyro against Scavenger (+31) and Thwacker (+20).
- Raw fights: `tools/t63-out/p2.jsonl`; `node tools/t63-opponents.js --n=150` resumes the run if it is ever wanted.

### How much does a part's value swing from opponent to opponent, in general?

From fights already in the repo (`node tools/t63-spread.js`, output `tools/t63-out/spread.txt`). For every robot + part, the gain
against each opponent (same seeds with and without), then: how much the gains differ between opponents, minus what the few fights
a cell would give by chance alone (the fight-by-fight differences on the same seeds give that noise).

| Data | Robot + part combos | Opponents each | Fights a cell | Average gain (size) | Spread between opponents, true SD |
|---|---|---|---|---|---|
| Combo hunt slice (22 Nov, wear on) | 194 | 6 | 4 | 19 points | about 8 points |
| Tag recheck (15 Nov) | 891 | 4 | 4 | 16 | about 10 |
| Part levels round 1 (15 Nov) | 891 | 5 | 2 | 18 | about 12 |
| Part levels round 3 (15 Nov) | 891 | 5 | 2 | 16 | about 8 |
| Engine's drone table (8 Nov, 120 fights a cell, 9 drones x 7 opponents) | 9 | 7 | 120 | 15 | 3-11 per drone (Booster 3 to 31) |

What it says:
- A part's value against one opponent typically sits **8-12 points** away from its value against the average opponent, where that
  average is itself only about 16-19 points. So a part worth +15 "on average" is worth **0 or less against 1 opponent in 10 to
  1 in 30**, and 15+ points off its average (either way) against **1 in 5 to 1 in 16** (normal model with SD 8-12). A robot with
  3 parts in a game with 9 rival robots has 27 part-rival pairs: expect 2-6 of them far off the part's usual value.
- So "this part does little against that robot" is an **everyday thing**, not a curiosity. Kev's Booster and Jammer against
  Scavenger are a real example, not an outlier.
- The parts that swing most are the ones that act on the other robot: **Jammer** (true SD 18-21 in both big data sets; it only
  slows what the rival has: a turret, a module, a spinner, a reload), EMP, Pester chip, Blocker, **Booster** (14). Parts that just
  add to your own robot swing least: Quantum shield, Reinforced hull, Overdrive, Repair kit, Armour kit (0-5 in the tag recheck).
- These spreads are rough: 2-4 fights a cell is mostly noise and the noise has to be taken off. The direct measurement above (150
  fights a cell) is the clean check.

### How many fights does it take to say it honestly?

On the same seeds the two fights (with and without the part) end differently in **34%** of pairs on average (combo slice) and
**44%** in a close matchup like Gyro against Scavenger. That gives a noise of 0.58-0.66 per fight pair, so:

| To say | Paired fights per part per opponent |
|---|---|
| "about +X", ± 15 points (95%) | 60-75 |
| "about +X", ± 10 points | 130-170 |
| "about +X", ± 5 points | 520-670 |
| "does little here (0)" against "normal (+15)", 95% sure, found 4 times in 5 | 120-150 |

Pairing helps less than hoped: the fights are chaotic enough that a third to half of the pairs flip anyway (unpaired, the noise
would be about 0.69 per fight: pairing saves only 10-30% of fights). Fewer fights are enough where the matchup is lopsided
(fewer pairs flip), and parts cannot show any value where a robot already wins (or loses) nearly every fight.

## Part 3: what it would cost to show in the game

### Speeds (from Kev's logs, docs/robocus-sim-bookie.md)

| | Duels a second | 4-robot fights a second | From |
|---|---|---|---|
| Kev's PC (Ryzen 7 9800X3D, 16 threads, 14 helpers) | about 50-90 | about 10-14 | 8 helpers: 200 duels in 2.2-3.7 s, 4-robot fights 1.0-1.3 a second a helper (21 Nov); 14 helpers: 200 duels inside 4 s, a 2v2 112 in 8 s (22 Nov) |
| A 4-core laptop (2 helpers, each taken as half as fast as one of Kev's) | about 7-11 | about 1.0-1.3 | arithmetic, not measured |

### What leave-one-out costs

N = paired fights per variant (the bookie's own seeds; the full build is the bookie's run, already paid for).

| What | Extra fights | Kev's PC | 4-core laptop |
|---|---|---|---|
| Duel, every part on both robots (up to 3 + 3 = 6 variants), N = 150 | 900 | 10-18 s | 1.5-2 min |
| the same, N = 60 (enough for ± 15) | 360 | 4-7 s | 35-50 s |
| 4-robot fight (up to 12 variants), N = 150 | 1,800 | 2-3 min | 23-30 min |
| the same, N = 60 | 720 | 50-70 s | 9-12 min |
| Market: one part on one of your robots against each of ~9 rival robots, with and without, N = 150 | 2,700 | 30-55 s | 4-6.5 min |
| the same, "without" taken from the odds-overview cache, N = 150 | 1,350 | 15-27 s | 2-3 min |
| every part lot (say 4) on each of your robots (say 3) against ~9 rivals, N = 100 | 10,800 | 2-3.5 min | 16-26 min |

So on Kev's PC the duel version fits behind the Bets pit (a few seconds after the bookie), and a Market check for the lot on screen
fits while people bid. 4-robot fights and slower PCs do not fit at N = 150.

### The cheapest honest scheme (a suggestion for the design)

1. **First a free line: what each part actually did.** The bookie already runs up to 200 test fights of the real matchup. If each
   test fight counted a few things per part (drone alive, jamming, docked while the weapon works, shield phases) and how long each
   robot's weapon lasts, the screen could say, with zero extra fights: "Jammer: jamming 87% of the fight. Booster: helps your working
   shell 12% of the fight (Scavenger's junk takes the shell motor at about 9 s)." That alone explains Kev's case. It needs small
   counters in the engine's fight stats (engine work, `tools/damage-lab`), no more fights.
2. **Value numbers only for duels, from paired fights with a prior and a sequential stop.** Run each variant on the bookie's seeds
   in blocks of 20. Start from the part's usual value (the parts table) counted as about **40 fights** (that is what a true spread
   of ~10 points against a noise of ~0.6 a fight is worth). Stop when the 95% range is clearly within ± 10 of the usual value ("as
   usual": no flag) or clearly below it ("does little here") or above ("strong here"); at most 150. Checked on the fights we have (`node tools/t63-seqstop.js`, two 5%-error sequential tests, usual value against
   usual ± 15, resampling each cell 2,000 times): **median 40 pairs, mean about 55-60, 90% of runs within 150**. Clear cases are
   quick (Jammer vs Whaler, "strong": 16 pairs; Jammer vs Scavenger, "does little": 76 pairs, right 91% of the time). Gaps under
   15 points (Booster vs Scavenger: +2 against a usual +13) often get no call by 150 (44%): then it shows "as usual". Based on
   partial data (25 fights a cell for the 8 others).
3. **Show bands, not numbers:** "does little against Scavenger" / "as usual" / "strong against Scavenger", like the odds bands.
4. **Cache per pair state and fill in the background**, like the odds overview: the fight's robots first (Bets), then in the Market
   only the lot and robot on screen, your changed duels first. Reuse the "without" fights already in the overview's cache.
5. **Skip what cannot be measured:** a robot that wins (or loses) 90%+ anyway gets "already decided"; 4-robot fights use the
   duels of the same robots (the parts' effects are per rival) instead of running 4-robot variants.
6. Display only, like the odds overview: it never feeds the odds, bets, payouts or anything sent between players.
