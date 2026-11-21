# ROBOCUS: wear on in the game (T41, 21 Nov 2026)

## Status (T41, kept up to date while the work goes on)

Kev (21 Nov): "bend as much as possible", then "no include all and do a rebalance", "keep bend until repair", "port them then".
Branch `claude/bending-on`.

- [x] Step 1, one switch: `ARC.cx` crack / frag / bend / grindout default **on** in `tools/damage-lab/engine.js` (the one place). A fight
  reads them once at `create()` into `S.wx`; its options can say `wear: false` (all off), `true`, or per effect. The game puts
  `wear: BAL.wear !== false` into every fight's options (`buildFight`, the odds overview), so the host, every joined screen (they build
  the fight from `F.bb`) and the bookie's workers (they get `bb`) agree. `BAL.wear = false` turns all four off. The bump switches
  (slide, under, crush, gut) stay off. Lab pages: the four wear boxes start ticked (were unticked). With all four off, the stock-fight
  fingerprint is bit-identical to `origin/main` (checked).
- [x] Step 1, drawing: the lab's wear layer is in `src2/view.js` (fold lines on bent plates and weapons, cracks incl. chassis cracks
  through the top plate, saw grooves glowing while the saw is in, the bent bar's two reach streaks and off-centre disc, warped
  buzzsaws / orbit discs / grinders / Grandmaster's saw, the shell out of round, Thumper's bent handle); records (Jukebox) now
  draw their warp too (new, in both `ui.js` and `view.js`).
- [x] Carry-over (Kev: "keep bend until repair"): `wearOf` keeps `marks` (per part label: shape, kinks, plate bends, cracks,
  grooves, warp, snapped pieces; numbers only), `applyWear` puts them back. `node tools/damage-lab/wear-carry.js` checks it.
  `src2/repair.js`: repairing a zone clears its marks; a zone with a mark the engine calls out (bent 10°+, warped, a plate in a
  wheel, sawn open, a tip broken off, a crack 10 cm+) counts as damaged (repair button even at full health); `markCost` prices marks.
- [x] Step 2, retune. Round 1 (`WEAR.hpExp` 0.5: a tougher robot's metal bends, cracks and saws less for the same blow, as weapons
  already resisted kinks by the square root of their health): Gaucho -15 → -5, Buzzkill +14 → +2, Thumper -14 → -7, Tarantula
  +12 → +7, Grandmaster +11 → +7; still out: Thwacker -24, Popcorn +20, Orbiter +15, Whaler +14, Hydra -13. Thwacker diagnosed
  (144 fights a variant): no single cause (without its tail kinking -21, without wheel rub -15, bending alone -10, cracks about -7):
  it fights long and wears down. Round 2: power dials for the 11 robots still off (`tools/damage-lab/lineup.js`, comment above
  ROBOTS). Result on 1,976 fights (T37's seeds, paired with the same fights without wear): **no robot outside its 95% range**,
  spread of the changes 5 points (= noise). Details in section "After" below.
- [x] Kev's PC run ready: `tools\wear-tables.cmd` (see "The big run on Kev's PC" below). Waiting for its result file.
- [ ] Step 3, tables (matchup table, arenas, counter tags, fits, combos, bookie): on Kev's PC (below); meanwhile the game keeps the
  15 Nov tables (measured without wear).
- [ ] Step 4, checks.

## The big run on Kev's PC (T41)

Kev: "let me know if you want a big one to run on my pc". **Double-click `tools\wear-tables.cmd`.** It does not touch the ROBOCUS
folder: it clones the branch `claude/bending-on` into `%USERPROFILE%\robocus-wear` (or updates that clone), installs planck and
Playwright's Chromium there once, and runs `tools/damage-lab/wear-tables.js` on **15 workers** (16 logical processors, one left
for Windows). Close the window to stop; double-click again to go on (finished jobs are kept). Progress and the time left are on
one line. At the end it prints one file to send back: `%USERPROFILE%\robocus-wear\wear-results\wear-tables-results.json.gz`.

What it runs (all with wear on and the retuned robots): the open-floor matchup table (528 pairs x 20 = 10,560 fights), the four
arena tables (4 x 99 pairs x 20 = 7,920), arena fits (5 floors x 16 seeds = 15,840), every part on every robot vs a level up
(14,784), the 58 fit / epic candidates with and without the part (2 x 5,248), 750 free-for-alls and 750 2v2, then 120 whole AI
games of the game page (carry-over on). About 77,000 fights. Time: here one duel takes about 1.2 s of one core; a 9800X3D core is
about twice as fast and 15 workers on 8 cores / 16 threads give about 11 cores' worth, so **about 70 minutes of fights plus about
15 minutes of whole games: about 1.5 hours** (on an 8-thread PC with 7 workers, about 3 hours).

Note for the orchestrator: Kev's folder is on `main`, which does not have the .cmd yet. It is self-contained: copy it to his
folder (or let him download it from the branch on GitHub) and double-click it anywhere.

After it comes back: unpack (`node -e` gunzip, `files` map), `matrix-merge.js <dir>` → matrix-data.json → `build.py` (src2/matrix.js);
`style-tags.js <dir>` → STYLE / HITTER in tabletop-2.html; `arenafit-report.js <dir> --eb` → ARENA_FIT; `tag-tuned-report.py` /
`tag-tuned-final.py` with OUT=<tags dir> LINEUP=wear-results/lineup.json → fits, epics, FFA_FIT, 2v2 tags; parttest-style
levels from the parts section → PART_LV if a part moved; `game-sim-report.js` on the games.

---

# Before: bending and wear in real fights, measured (T37, 21 Nov 2026)

Kev (21 Nov): "I saw a fight between buzzkil and whirlwind and his blades didn't even really bend at any point. Did we forget to include this? at one point we had this". Then, to "measure first": "yes do this first step".

**Short answer.** Nothing was lost. The 11 Nov wear effects (`ARC.cx.crack`, `frag`, `bend`, `grindout`, see `contact-lab.md`, "Wear") are still in the engine, but they are **off by default** and the game never switches them on. In the Damage Lab they are tick boxes, unticked when the page opens. So a Buzzkill vs Whirlwind fight shows no bending unless "Bending" is ticked. (Whirlwind is not in the game's 33-robot lineup any more, so that fight was in the Damage Lab, or an older copy.)

This page measures what switching them on would do to the game. **Nothing is switched on.** The game, the lineup and the bookie are unchanged.

## How it was measured

- Tool: `tools/damage-lab/wear-game.js` (new), report `tools/damage-lab/wear-game-report.js` (new). Raw results in `tools/damage-lab/wear-game/`, the full report in `tools/damage-lab/wear-game/report.md`.
- The game's 33 robots, built the way the game builds them (`lineup.js` `build`, game part strengths), no parts, open floor.
- Every pair of robots at most one level apart (247 pairs), **8 fights a pair** (4 seeds x 2 sides). That gives each robot 32-64 fights against its own level and 40-64 against a level up.
- Each fight is played **three times on the same seed and sides**: today (all off), **A: bend only**, **B: crack + frag + bend + grindout**. The bump switches (slide, under, crush, gut) stay off.
- **1,976 matchups x 3 = 5,928 fights**, plus 24 Buzzkill vs Whirlwind fights x 3. About 1 h 35 min on this box (2 slow cores, shared with another worker).
- Changes are paired (the same fight with and without), with a 95% range (±). Note: a change of any kind sends a fight down another path, so about **a third of all winners flip either way** (31% for A, 34% for B). What matters is whether a robot's flips add up to a net gain or loss; the ± says how sure that is.

## 1. Win rate per robot

Win % against its own level and against a level up: today → A / B. The last two columns are the change over all its fights (own level, a level up and a level down), with the 95% range. **Bold**: outside its range.

| Lv | Robot | vs own level: today → A / B | vs a level up: today → A / B | all fights: A | all fights: B |
|---|---|---|---|---|---|
| 0 | Buzzkill | 55 → 59 / 67 | 40 → 40 / 57 | +3 ± 12 | **+14 ± 12** |
| 0 | Forklift | 44 → 48 / 52 | 20 → 20 / 20 | +3 ± 11 | +5 ± 11 |
| 0 | Hornet | 33 → 42 / 38 | 33 → 33 / 33 | +6 ± 13 | +3 ± 12 |
| 0 | Mincer | 48 → 41 / 41 | 28 → 20 / 28 | -8 ± 10 | -5 ± 10 |
| 0 | Popcorn | 41 → 50 / 47 | 8 → 40 / 45 | **+18 ± 11** | **+18 ± 11** |
| 0 | Scythe | 47 → 53 / 55 | 40 → 35 / 20 | +2 ± 11 | -3 ± 12 |
| 0 | Snapjaw | 56 → 55 / 48 | 25 → 23 / 40 | -2 ± 10 | +1 ± 12 |
| 0 | Thumper | 58 → 41 / 41 | 45 → 50 / 35 | -9 ± 13 | **-14 ± 12** |
| 0 | Wrecker | 69 → 61 / 63 | 20 → 48 / 40 | +6 ± 13 | +4 ± 12 |
| 1 | Blacksmith | 41 → 38 / 50 | 57 → 43 / 53 | **-12 ± 9** | -3 ± 8 |
| 1 | Corkscrew | 41 → 47 / 44 | 33 → 10 / 8 | -5 ± 8 | -8 ± 9 |
| 1 | Mauler | 41 → 75 / 53 | 33 → 28 / 28 | **+11 ± 9** | +6 ± 10 |
| 1 | Thwacker | 63 → 28 / 22 | 30 → 23 / 18 | **-23 ± 10** | **-26 ± 10** |
| 1 | Vertigo | 66 → 63 / 81 | 30 → 38 / 35 | +3 ± 10 | +3 ± 10 |
| 2 | Angler | 75 → 75 / 91 | 23 → 31 / 23 | +8 ± 10 | +8 ± 9 |
| 2 | Gyro | 9 → 22 / 25 | 67 → 81 / 71 | +8 ± 9 | +7 ± 9 |
| 2 | Pincher | 50 → 47 / 38 | 29 → 35 / 27 | -3 ± 9 | -10 ± 11 |
| 2 | Whaler | 72 → 72 / 69 | 29 → 38 / 27 | **+17 ± 10** | **+9 ± 9** |
| 2 | Yoyo | 44 → 34 / 28 | 31 → 17 / 10 | -7 ± 11 | -8 ± 11 |
| 3 | Gaucho | 57 → 35 / 35 | 27 → 27 / 20 | **-12 ± 10** | **-15 ± 10** |
| 3 | Grandmaster | 43 → 60 / 43 | 20 → 27 / 31 | **+10 ± 7** | **+11 ± 9** |
| 3 | Hydra | 65 → 65 / 55 | 56 → 44 / 33 | -5 ± 9 | **-13 ± 10** |
| 3 | Scavenger | 38 → 35 / 30 | 36 → 41 / 38 | -1 ± 9 | -1 ± 9 |
| 3 | Slingshot | 63 → 55 / 73 | 50 → 48 / 47 | -3 ± 7 | +5 ± 9 |
| 3 | Tarantula | 35 → 50 / 65 | 42 → 38 / 44 | -1 ± 10 | **+12 ± 10** |
| 4 | Bricklayer | 57 → 55 / 54 | - | -7 ± 10 | -4 ± 12 |
| 4 | Jukebox | 55 → 45 / 48 | - | **-13 ± 12** | -6 ± 12 |
| 4 | Lodestone | 41 → 38 / 36 | - | +0 ± 9 | +4 ± 11 |
| 4 | Orbiter | 48 → 57 / 55 | - | **+11 ± 9** | **+12 ± 10** |
| 4 | Pogo | 57 → 64 / 59 | - | +5 ± 7 | +3 ± 10 |
| 4 | Railgun | 59 → 52 / 61 | - | -1 ± 9 | +5 ± 11 |
| 4 | Rotisserie | 48 → 50 / 50 | - | +6 ± 8 | -6 ± 11 |
| 4 | Trebuchet | 34 → 39 / 38 | - | +4 ± 9 | +4 ± 11 |

(The "today" numbers per robot rest on 32-64 fights, so they are good to about ±15; the tuning used far more fights. Level 4 has no level up.)

- **A (bend only):** 9 robots move outside their range (luck alone would give about 2). The changes spread about 9 points either way, where noise alone gives about 5.
- **B (all four):** 10 robots move outside their range, same spread (9 points).

## 2. The level steps

How often the higher level wins, per step (today's target: about 63-68%).

| Step | Fights | Today | A: bend only | change | B: all four | change |
|---|---|---|---|---|---|---|
| level 0 → 1 | 360 | 71% ± 5 | 66% | -6 ± 6 | 65% | -7 ± 6 |
| level 1 → 2 | 200 | 64% ± 7 | 72% | +9 ± 8 | 72% | +9 ± 8 |
| level 2 → 3 | 240 | 64% ± 6 | 60% | -5 ± 7 | 68% | +4 ± 7 |
| level 3 → 4 | 384 | 61% ± 5 | 63% | +1 ± 5 | 65% | +3 ± 6 |
| all steps | 1,184 | 65% ± 3 | 65% | -1 ± 3 | 67% | +1 ± 3 |

**The levels hold on average.** The step from level 1 to 2 gets steeper (+9) and the step from 0 to 1 softer (-6), mostly because one level 1 robot, Thwacker, gets much weaker. No step leaves the 60-72% band.

## 3. Fight length, knockouts, time-outs

| | Today | A: bend only | B: all four |
|---|---|---|---|
| Fight length | 72.9 ± 1.4 s | 76.1 ± 1.5 s | 71.9 ± 1.5 s |
| Knockouts | 84% | 80% | 82% |
| Ends on time (judges) | 16% | 20% | 18% |
| Winner differs from today (same seed) | | 31% | 34% |

Bending alone makes fights a little longer (+3 s) and gives a few more judges' decisions: bent weapons hit less cleanly. With cracks on as well, the extra damage on cracked parts brings the length back.

## 4. Who gains and who loses most, and why

From the wear events counted on each robot and on its rivals (per fight, in the full report):

| Robot | A | B | Why (one line) |
|---|---|---|---|
| Thwacker (L1) | -23 | -26 | Its long thin tail kinks easily (the engine counts it as one of the most slender beams) and the most plates bend into its wheels (5.6 plate bends, 1 wheel rub a fight): the swing misses. Loses most to Vertigo, Mauler, Popcorn. |
| Gaucho (L3) | -12 | -15 | Its own side plates bend into its wheels (1.1 wheel rubs a fight, its rivals 0.1). |
| Hydra (L3) | -5 | -13 | With cracks: its arm segments crack and break up (2.6 cracks, 2.1 fragments a fight) and saws cut into it. |
| Thumper (L0) | -9 | -14 | Its axe handle wrenches (blows land off to the side), and with cracks it takes the most cracks of the starters (3.1 a fight). |
| Jukebox (L4) | -13 | -6 | Its record warps (0.7 warps a fight): a warped saw cuts less. |
| Blacksmith (L1) | -12 | -3 | Its plates bend into its wheels (4 plate bends, 1 rub a fight). |
| Popcorn (L0) | +18 | +18 | A flipper only bows a little, while its rivals' weapons bend (Hornet's spear points off, Thwacker's tail kinks). Against level 1: 8% → 40%. |
| Whaler (L2) | +17 | +9 | It bends its rivals' plates into their wheels (1.3 rubs a fight on its rivals); best against Mauler and Blacksmith. |
| Mauler (L1) | +11 | +6 | Its flail bends the most plates of anyone (6.8 a fight on its rivals, 1.6 wheel rubs). |
| Grandmaster (L3) | +10 | +11 | Its own weapons barely give (the axe head doesn't bend, the saw warps 0.1 times a fight), while its rivals' do. |
| Orbiter (L4) | +11 | +12 | Discs only warp a little; with grooves on, it saws through rivals (1.3 cuts a fight). |
| Buzzkill (L0) | +3 | +14 | With cracks: its spinner starts cracks (4.4 a fight on its rivals) and a cracked part takes up to 1.8x damage. Its own bar bends too, which costs it about as much as it gains in A. |
| Tarantula (L3) | -1 | +12 | With cracks: its fangs pierce (4.9 cracks a fight on its rivals, 2.1 run into their insides). |

In short: **bending hurts long thin weapons and robots whose side plates fold into their wheels; it helps blunt hitters that fold other robots' plates. Cracks add a bonus for piercing weapons (spinners, fangs).**

## 5. The bookie

The game's odds for robots as they come are the matchup table (`src2/matrix.js`, 20 fights a pair, measured with everything off). Checked against each variant's results (all 1,976 matchups):

| Odds | Results | Brier (lower is better) | favourite wins |
|---|---|---|---|
| Matchup table (the game's odds) | today | 0.182 | 75% ± 2 |
| | A: bend only | 0.204 | 69% ± 2 |
| | B: all four | 0.200 | 70% ± 2 |
| Level only (no matchup table) | today | 0.236 | 65% ± 3 |
| | A / B | 0.237 / 0.234 | 65% / 67% |

Paired change in Brier for the matchup table: **A +0.023 ± 0.012, B +0.018 ± 0.012**. The bookie would still be far better than levels alone, but it would lose about half of what the matchup table adds over levels: the favourite would win 69-70% instead of 75% while the odds still say 77%. **The matchup table, the counter tags and the arena tables would have to be measured again.**

## 6. Buzzkill vs Whirlwind

24 fights a variant (12 seeds, both sides). Whirlwind is the old 2.0 robot (not in the game's lineup), at its own preset strength.

| Variant | Buzzkill wins | Robot | bar bent 10°+ at some point | most bent arm (mean / max) | still bent at the end (mean) | bar snapped |
|---|---|---|---|---|---|---|
| Today | 21% ± 17 | Buzzkill | 0 of 24 | 0° | 0° | 0 |
| | | Whirlwind | 0 of 24 | 0° | 0° | 0 |
| A: bend only | 25% ± 18 | Buzzkill | 23 of 24 | 26° / 34° | 15° | 8 of 24 |
| | | Whirlwind | 24 of 24 | 28° / 34° | 15° | 11 of 24 |
| B: all four | 33% ± 19 | Buzzkill | 24 of 24 | 25° / 34° | 18° | 5 of 24 |
| | | Whirlwind | 24 of 24 | 28° / 34° | 17° | 9 of 24 |

Per fight, bend only (most bent arm, Buzzkill / Whirlwind): 23/29, 7/22, 33/33, 33/33, 33/28, 31/26, 34/31, 17/31, 32/24, 17/30, 26/24, 25/33, 25/33, 29/32, 34/34, 28/23, 30/31, 17/31, 27/26, 17/30, 26/20, 21/16, 33/33, 22/33.

With bending on, **both bars bend in practically every fight**, 20-34° (34° is the most the engine allows), and in about 4 fights out of 10 a bar bends so far that its tip snaps off. Today they never bend, because the switch is off.

## 7. What the game's fight view would draw

![Game view (left) and lab view (right), same fight state, all four switches forced on](robocus-wear-in-game.png)

Top: Buzzkill vs Whirlwind at 70 s, both bars bent 14-25°. Bottom: Mincer vs Hornet at 45 s, cracks, plate bends, grooves and warped grinders. Made with a scratch page (not committed) that forces the switches on and hands the same fight state to `src2/view.js` and to the lab renderer.

The game's view (`src2/view.js`) is an older copy of the lab renderer (`tools/damage-lab/ui.js`) without its wear layer. Read from the code and seen in the pictures:

| Wear mark | Game view today | Lab view |
|---|---|---|
| Bent weapon (kink) | **The bent shape shows** (it draws each part's outline, and the outline is bent) | the shape, plus a fold line across the beam and scuffed paint |
| Spinning bent bar | one plain blur | each arm's own reach streak, the swept disc off centre, a dashed amber ring for the shorter arm |
| Bent plate | the dented outline shows | plus fold lines |
| Crack | **nothing** | dark crack lines on the part; chassis cracks show through the top plate |
| Fragments, snapped tips | **show** (they are ordinary debris pieces) | the same |
| Saw groove | only the notch in the outline, no colour | bright cut metal, glowing while the saw is in it |
| Warped disc (taco) | **nothing** (discs and saws are drawn as circles) | fold line, out-of-round disc, dashed ring |
| Callouts and feed lines ("BENT!", "SNAPPED!", "Buzzkill: spinner bar bent 23°, it wobbles") | **show** (generic) | the same |

To show wear properly in the game, `drawWear`, the bent-bar spin marks, the warp marks and the chassis cracks (about 60 lines) would be copied from `ui.js` into `view.js`.

## 8. Does wear carry to the next fight?

**No. A bent blade comes back straight.** Checked in code and with a test (`node tools/damage-lab/wear-game.js carry`): the game keeps damage with `wearOf` / `spec.wear` (part health, lost parts, insides, top plate, drones, dents on the robot's own body). It does not store kinks, plate bends, cracks, grooves or warps. So next fight:

- a bent or warped weapon is straight again, but keeps its lower health;
- a bar whose tip snapped comes back whole (the tip is not a part the game knows), with the health it had;
- a plate that fragmented or fell off stays lost (as today);
- a cracked part loses its crack and the extra damage it takes.

Carrying bends would need `wearOf` / `applyWear` to store them, the save and online messages to carry them, and a rule for which repair straightens them (Weapon repair, likely). That is an engine change, and the bookie's damage pricing (`repair.js` wear costs) would need a new measure.

## Options for Kev

| Option | What players see | Rework it costs |
|---|---|---|
| **1. Keep off** (today) | No bends in the game. Bends stay in the Damage Lab (tick "Bending"). | None. |
| **2. Bend only, as it is** | Bars, spears, tails and forks kink in most fights; plates fold into wheels. | Retune about 9 robots (Thwacker -23, Jukebox -13, Blacksmith -12, Gaucho -12; Popcorn +18, Whaler +17, Mauler +11, Orbiter +11, Grandmaster +10): two or three tuning rounds. Re-measure the matchup table and arena tables (about 18,000 fights) and the counter tags (about 10,000). Copy the lab's wear drawing into `view.js` (small). Optional: carry bends between fights (engine + save + online). |
| **3. All four, with a retune** | As 2, plus cracks, fragments and saw grooves; the most violent look. | The same as 2 with a slightly different list (Thwacker -26, Gaucho -15, Thumper -14, Hydra -13; Popcorn +18, Buzzkill +14, Orbiter, Tarantula +12, Grandmaster +11, Whaler +9). The crack drawing is the most work in `view.js`. |
| **4. Bending on spinner bars only** (what Kev noticed) | spinner bars (Buzzkill) kink; nothing else changes. | Needs a small new engine switch (bend only for `blade`), then the same measure as here (about 1.5 h here, minutes on Kev's PC). Likely far fewer robots move, so likely no retune. Not measured yet. |

Multiplayer: the switches are global engine settings, so all screens must use the same ones (set from the game's build, not a menu). Fights stay deterministic either way.

## A fuller run on Kev's PC

Here: 8 fights a pair (104-144 fights a robot per variant). For about ±7 per robot instead of ±10, run 24 fights a pair (17,800 fights; on an 8-core PC roughly 20-40 minutes). From the ROBOCUS folder, in a command window:

```
cd tools\damage-lab
set K=24
for /L %i in (0,1,7) do start "wear %i" /min node wear-game.js duel wear-game\pc_%i.jsonl %i 8
```

When the eight windows have closed (it resumes if stopped; run the same line again):

```
set N=48
node wear-game.js bw wear-game\bw_pc.jsonl
node wear-game-report.js wear-game\pc_*.jsonl --bw wear-game\bw_pc.jsonl > wear-game\report-pc.md
```

## Side finding

The **Lineup Arena** and **Contact Lab** pages (`prototypes/lineup-arena.html`, `contact-lab.html`) stop with a script error when they open: their fourth robot card starts as Juggernaut, which is no longer in the lineup (`tools/damage-lab/ui.js`, `st.spec`). The Damage Lab opens fine. A one-word fix in `ui.js` plus a rebuild; not done here (outside this task).
