# ROBOCUS arenas: who each one favours (17 Nov 2026, T4)

Kev: "yes, lets change the arenas so they have an impact. If impact is a lot more we can decide on coins it needs as well."

Goal: each special arena helps some robots and hurts others, for reasons a player can see on the robot, so the host's arena
pick is a real decision. The open floor is unchanged (fingerprint below).

## 1. What was wrong

- The 15 Nov measurement (32 fights a robot an arena) was too noisy to see anything but Whaler on Saws. Measured again with
  more fights (8 seeds, 64-128 fights a robot, before any change), the arenas already did more than the table said: Floor Saws
  moved 15 robots by 8+ points. The in-game `ARENA_FIT` (shrunk x0.5 on top of noisy numbers) was worth only +4 points to a host.
- The Cage (6 x 6 m) and the Ice Rink (grip x0.4) were mostly noise: the share of the spread that was real was 29% (Cage) and 59% (Ice).
- The Killbox's spikes covered only the middle 2.8 m of each wall, and saws and spikes did fixed damage, so they did less and
  less as robots got tougher with level (a level 3 robot carries about twice the health of a level 0).

## 2. What changed (engine, tools/damage-lab/engine.js; lineup.js; drawing in src2/view.js and tools/damage-lab/ui.js)

| Arena | Before | Now | Who it favours (one line, as in the game) |
|---|---|---|---|
| 🪚 Floor Saws | 4 saws, fixed damage | same saws; the bite grows with the victim's level (`hzK` = PART_K: 1 / 1.15 / 1.45 / 2.0 / 2.1) | Hit-and-run robots (harpoon, flipper, spear, tail) win; robots that grab and hold or stand and grind end up on the saws. |
| ☠️ Killbox | spikes on the middle 2.8 m of each wall, 2 saws | spikes along every wall (7.4 m each, `spikeLen` 3.7), spike damage grows with level | Throwers and lifters slam robots into the spikes; spinners bounce themselves into them. |
| 🔒 The Cage | 6 x 6 m | 4.75 x 4.75 m (`inset` 1.625) | Close brawlers and grabbers win; robots that need room (tail, harpoon, orbit blades, spear, railgun) lose. |
| 🧊 Ice Rink | grip x0.4 (legs x1) | wheels x0.3, tracks x0.6 (`iceTracks`), legs x1 | Robots that must line up exactly (tail, forks, clamps, twin saws) slide past; drills, flails and flippers don't mind. |

Drawing: the Killbox spike strips now run along the whole wall (they follow `spikeLen`); the Cage drawing already follows `inset`.
Nothing else in the fight view changed. Hazard damage is also counted in `R.stats.hz` (stats only, for the measuring tool).

## 3. How it was measured

`tools/damage-lab/arenafit.js <arena> <seeds> [firstSeed] --out=f.json`: every robot against every robot of its own level on
that arena, both sides; `arenafit-report.js <dir> --eb` merges runs and prints the tables. Final numbers: 16 seeds = 3,168
fights an arena (and 3,168 on the open floor): **256 fights a robot at level 0, 128 at levels 1-2, 160 at level 3, 224 at level 4**.
The ± below is one standard deviation of the change (open-floor noise included): about ±4 at level 0, ±6 at levels 1-2.

`ARENA_FIT` = logit change x each arena's own noise shrink (the share of the measured spread that is real, rounded): saws 0.85,
cage 0.75, ice 0.75, killbox 0.45 (was a flat 0.5 on much noisier numbers). Tags (🪚 ☠️ 🔒 🧊) at |fit| >= 0.4 (was 0.45).

## 4. Before and after, per arena

Same-level fights. Before: 8 seeds (1,584 fights an arena); after: 16 seeds (3,168). "Real share" = how much of the spread
between robots is real rather than noise.

| Arena | Length s (before → after) | KO % | Judges % | Hazard share of damage | Robots moved 8+ pts (up/down) | Outside 2 sd | Real share |
|---|---|---|---|---|---|---|---|
| 🟫 Open floor | 68.8 | 87 | 13 | 0 | - | - | - |
| 🪚 Floor Saws | 72.6 → 69.9 | 86 → 91 | 14 → 9 | 14.5% → 19.6% | 15 (8/7) → 19 (11/8) | 11 → 16 | 79% → 85% |
| ☠️ Killbox | 66.4 → 61.2 | 89 → 94 | 11 → 6 | 9.9% → 16.9% | 7 (4/3) → 9 (5/4) | 4 → 5 | 43% → 47% |
| 🔒 The Cage | 65.2 → 59.7 | 90 → 92 | 10 → 8 | 0 | 9 (3/6) → 15 (9/6) | 4 → 11 | 29% → 74% |
| 🧊 Ice Rink | 67.4 → 69.4 | 89 → 87 | 11 → 13 | 0 | 10 (5/5) → 17 (9/8) | 2 → 10 | 59% → 73% |

(Robots moved 8+: after = rounded changes of 8 or more; before = 8.0 or more. The "before" counts, on 64-128 fights a robot, include more noise.)
The "why" column is the reading of the robot's weapon that fits the numbers; it was not traced fight by fight. Blank = no obvious reason.
No arena is won by hazards alone: saws and spikes do 17-20% of all damage; KO causes stay the same mix as on the open floor
(saws: more "crippled" KOs, 40% vs 26%, because saws cut wheels).

### 🪚 Floor Saws (win % against its own level)

| Robot | Lv | Open | Saws | Change | Why you can see it coming |
|---|---|---|---|---|---|
| Whaler | 2 | 77 | 97 | +20 ±4 | harpoon reels the enemy across the floor, over the saws |
| Popcorn | 0 | 54 | 70 | +16 ±4 | flips robots and leaves them on the saws |
| Orbiter | 4 | 54 | 69 | +15 ±5 | orbit blades knock robots around, never stands still |
| Thwacker | 1 | 55 | 70 | +14 ±6 | tail swats robots away |
| Lodestone | 4 | 40 | 53 | +13 ±5 | |
| Gyro | 2 | 5 | 18 | +13 ±4 | light, bounces off and away |
| Hornet | 0 | 36 | 48 | +12 ±4 | spear: charge and back off |
| Slingshot | 3 | 67 | 78 | +11 ±5 | flings itself and the enemy across the floor |
| ... | | | | | |
| Thumper | 0 | 43 | 31 | -12 ±4 | hammer: stands and swings |
| Pincher | 2 | 45 | 33 | -12 ±6 | clamps and holds |
| Corkscrew | 1 | 44 | 30 | -14 ±6 | drill: grabs and grinds in one place |
| Yoyo | 2 | 59 | 43 | -16 ±6 | |
| Vertigo | 1 | 59 | 42 | -17 ±6 | |
| Rotisserie | 4 | 45 | 23 | -22 ±4 | roaster: grabs and holds |

### ☠️ Killbox

| Robot | Lv | Open | Killbox | Change | Why |
|---|---|---|---|---|---|
| Trebuchet | 4 | 30 | 47 | +17 ±5 | throws robots into the spiked walls |
| Forklift | 0 | 50 | 66 | +16 ±4 | carries robots to a wall and tips them |
| Grandmaster | 3 | 39 | 53 | +13 ±6 | its brain baits enemies into traps |
| Corkscrew | 1 | 44 | 55 | +11 ±6 | |
| Popcorn | 0 | 54 | 63 | +9 ±4 | flipper |
| Gaucho | 3 | 46 | 39 | -8 ±6 | |
| Vertigo | 1 | 59 | 52 | -8 ±6 | spinner recoil |
| Buzzkill | 0 | 51 | 43 | -9 ±4 | spinner: its own hits bounce it into the spikes |
| Railgun | 4 | 58 | 40 | -17 ±5 | |

The Killbox is the mildest arena (47% of the spread is real); fights get 7 s shorter and judges' calls halve.

### 🔒 The Cage

| Robot | Lv | Open | Cage | Change | Why |
|---|---|---|---|---|---|
| Corkscrew | 1 | 44 | 66 | +22 ±6 | the drill always reaches |
| Pincher | 2 | 45 | 63 | +17 ±6 | clamps: nowhere to dodge |
| Grandmaster | 3 | 39 | 52 | +13 ±6 | |
| Slingshot | 3 | 67 | 78 | +11 ±5 | a wall is always in reach of its grapnel |
| Thumper | 0 | 43 | 53 | +10 ±4 | hammer |
| Trebuchet | 4 | 30 | 40 | +10 ±4 | |
| ... | | | | | |
| Hornet | 0 | 36 | 27 | -9 ±4 | spear needs a run-up |
| Railgun | 4 | 58 | 48 | -9 ±5 | can't keep away |
| Tarantula | 3 | 61 | 49 | -12 ±6 | |
| Orbiter | 4 | 54 | 36 | -19 ±5 | orbit blades hit the walls |
| Whaler | 2 | 77 | 51 | -26 ±6 | harpoon needs distance |
| Thwacker | 1 | 55 | 26 | -30 ±6 | no room to swing the tail |

Tried 5 x 5 m first: only 17% of the spread was real (Thwacker -9). 4.5 x 4.5 m: Thwacker fell to 3% (-52), too much. 4.75 m it is.

### 🧊 Ice Rink

| Robot | Lv | Open | Ice | Change | Why |
|---|---|---|---|---|---|
| Corkscrew | 1 | 44 | 59 | +15 ±6 | tracks, drill |
| Mauler | 1 | 45 | 59 | +13 ±6 | tracks, flail swings anyway |
| Vertigo | 1 | 59 | 73 | +13 ±6 | |
| Grandmaster | 3 | 39 | 49 | +10 ±6 | |
| Popcorn, Hornet, Trebuchet | 0/0/4 | | | +9 | flipper, rocket dash, thrower |
| ... | | | | | |
| Scythe | 0 | 55 | 44 | -11 ±4 | sweeper must line up side-on |
| Pincher | 2 | 45 | 34 | -11 ±6 | clamps slide past |
| Forklift | 0 | 50 | 38 | -13 ±4 | forks must get under |
| Mincer | 0 | 48 | 33 | -15 ±4 | twin saws |
| Thwacker | 1 | 55 | 20 | -36 ±6 | swings its whole body for the tail: on ice it can't stop the spin |

Tried grip x0.25 first: Thwacker 17% and Hornet +21; x0.35 would put Thwacker at about 27% (one check, 128 fights).
Tracked robots: Corkscrew +15, Mauler +13, Whaler +7, but the heavy ones (Hydra, Blacksmith, Bricklayer) -4 to -5.
Kev's guesses vs what physics does: "spinners hate ice" does not hold (Vertigo +13, Buzzkill +7); "long weapons own the Cage" is
the other way round (long weapons need room).

## 5. Does the higher level still win?

Every robot against every robot one level up, 2 seeds, 592 fights an arena (±2): open floor **66.7%**, saws 64.2%, killbox 62.3%,
cage 63.5%, ice 65.0%. Arenas flatten the level gap by 2-4 points: a bit more room for upsets, the level badge still holds.

## 6. Should an arena cost credits? (for Kev)

- Today an arena costs the host 1 Cr (`BAL.arenas.cost`), open floor free.
- What a pick is worth: for every same-level pair, the host picks the arena best for its robot against the rival. On average that
  is **+11 points** of win chance by the bookie's new table (+14.5 by the raw measurement), up from **+4** with the old table.
  The best pick is saws 28%, cage 25%, ice 21%, killbox 16%, open floor 10% of the time.
- For scale: one level is worth about +15 points (66.7% vs a level down), a part card about 0.75 of a level. An arena pick is
  worth about two thirds of a level, but for one fight only, and the bookie prices it into the odds (so it helps the fight, not the bets).
- Suggestion: keep 1 Cr while Kev plays with it; 2 Cr if hosts pick arenas every round. Kev's call.

## 7. Multiplayer and balance

- Engine change: fights on saws, killbox, cage and ice play differently from before (the same in every browser: seeded, the
  same code). Open-floor fights are identical: `l4-regress.js` gives the same 25 open-floor / 2v2 / FFA / level-4 lines as
  origin/main; the 7 lines that changed are its Killbox fights (i % 3 == 0), as expected.
- The bookie and the AI host use the new `ARENA_FIT`: the AI host picks an arena when the gap is worth 0.15 logit or more, which
  now happens more often.
