# ROBOCUS: the combo hunt (T58, 22 Nov 2026)

Kev (22 Nov): "can we do a recheck on epic and ultimate combos, see if we find some new or different things with the new damage
models etc, make a gigantic program to run on my pc to find combos that work really well".

Branch `claude/combo-hunt`. **Nothing in the game changes yet.** The game's tables (PART_FIT, EPIC, TRIPLE) change only after
Kev's run has come back and he has seen the list.

## Run it (Kev)

1. Double-click **`tools\combo-hunt.cmd`** (from the ROBOCUS folder, the Desktop, anywhere: it is self-contained).
2. It asks one thing: "How many hours? [3]". Enter = 3 hours. Type 8 for overnight.
3. Leave the window open. One progress line shows the stage, the fights done, the speed and the time left.
4. Close the window to stop; double-click again to go on (it does not ask again, it keeps every fight already done).
5. At the end it names **one file to send back**: `%USERPROFILE%\robocus-combo\combo-results\combo-hunt-results.json.gz`.
   The plain-English report is next to it (`report.md`) if you want to read it first.

It does not touch the ROBOCUS folder: it clones this branch into `%USERPROFILE%\robocus-combo` (or updates that clone), installs
planck there once, and runs on all logical processors but one (15 of 16), each at low priority, so the PC stays usable (it just
gets slower). Needs Git and Node (no Python).

## What it searches

Today's engine (wear on: bends, cracks, fragments, saw grooves), the tuned lineup as retuned on 21 Nov (33 robots), all 27 part
cards (9 drones, 7 modules, 5 stat parts, 3 legendaries, 3 tuning chips) and the rarity tiers, every robot built exactly as the
game builds it (`Lineup.build`, the game's part strengths, parts that grow with the robot's level), open floor.

Slot rules are the game's own `canFit` (prototypes/tabletop-2.html): 2 part slots (a tuning chip takes one), one chip, at most 3
drones, one legendary. Two rules of ours on top: a second module would replace the first (pointless, not tried) and a part with one
card in the deck can't be on a robot twice (Weapon overhaul, Reinforced hull, Medic drone and Energy shield have two). A Field
hospital whose drone would not fit (3 drones already) only adds HP: not tried.

**"Ultimate" = a full build: 2 parts + a legendary** (the most a robot can carry). That is the same shape as the game's
giant-slayer builds (TRIPLE).

## The stages

Every fight has a fixed seed from (seed set, robot, opponent, fight number); a robot with and without parts meets the same seeds
(paired), sides alternate. Each stage uses its own seed set, so what is reported was never used to pick it.

| Stage | What | Opponents | Fights a pair |
|---|---|---|---|
| 1 screen | every part on every robot, and the bare robot | 4 robots a level up + 2 of its own level (level 4: 6 of its own) | 4 |
| 2 confirm | the promising and the surprising (both ends) plus every combo in the game's PART_FIT / EPIC today | every robot a level up | 2 a round, up to `r2` rounds |
| 2 verify | everything stage 2 calls epic / great / poor, plus the game's list | every robot a level up, fresh seeds | `fv` |
| 3 pairs | each robot's best `top` single parts paired up, plus `rnd` random pairs (synergy nobody would guess) | stage 1's panel (a level up), stage 1's seeds | 4 |
| 3 synergy | the pairs with the most (and least) synergy, with each half alone and bare | every robot a level up, fresh seeds | `fvy` |
| 3 builds | full builds from the best `P` pairs and the best synergy pair x each legendary (and the game's TRIPLE build) | 3 robots a level up + 3 two levels up | successive halving: 2, 2, 4, 8, 16 more a round, the better half goes on |
| 3 verify | the best build of each robot (and the game's TRIPLE build) | every robot one and two levels up (level 0-2: every level 3-4 robot), **bare and kitted with their own best build**; plus the robot as it comes | `fw` |
| 4 tiers | Tuned / Race-spec / Works / Masterwork copies, only on the verified epics and great fits and each robot's best single part | every robot a level up | `ft` |

Stage 2 is sequential: after each round (from the second on) a candidate stops when its 95% range says it is clearly average
(gain over the part's average surely between -15 and +15), surely epic, surely poor, or surely great but not epic. The rest keep
being sampled until the round limit. Candidates for stage 2: a fit residual (gain minus part average minus robot average, the
15 Nov method) or a gain over the part's average of 15+ points either way, most extreme first, up to `cap`.

### The rules (the same as on 15 Nov, so old and new compare)

- gain = win % with the part minus without, against robots a level up (level 4: its own level), same seeds.
- **Great fit**: gain 15+ points above the part's average gain (and the screen agrees in sign).
- **Poor fit**: gain 15+ points below the part's average.
- **Epic**: gain 30+ and 20+ above the part's average.
- **Giant-slayer** (TRIPLE): a level 0-2 robot whose best full build wins 80%+ against bare level 3-4 robots.
- **Found** = the same verdict on the sorting fights (stage 2) and on the fresh verify fights (the weaker of the two counts).
  Passed only once = "borderline". The report shows the verify numbers alone (not inflated by the picking) and all fights together.
- New on top: synergy = gain of the pair minus the two single gains, per fight on the same seeds, with its 95% range ("real" only
  when the range is above 0); a logit column says the same on a scale where independent parts add up.

### How deep: `--hours`

Stage 1 is the same for every run (33 robots: 22,176 fights). It is timed; then the depth that fits the hours (with 15% spare) is
chosen once and kept in `state.json`. The depths:

| Depth | cap | r2 | fv | top | rnd | synV | fvy | P | hr | fw | tiers | ft | fights (33 robots, all stages) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 100 | 4 | 6 | 4 | 4 | 10 | 6 | 3 | 3 | 2 | Race-spec | 4 | about 52,000 |
| 2 | 160 | 6 | 8 | 5 | 6 | 16 | 8 | 4 | 4 | 4 | Race-spec, Masterwork | 4 | about 74,000 |
| 3 | 240 | 8 | 12 | 6 | 10 | 24 | 10 | 5 | 4 | 8 | + Tuned | 6 | about 108,000 |
| 4 | 320 | 10 | 16 | 7 | 16 | 32 | 12 | 6 | 5 | 12 | all four | 8 | about 147,000 |
| 5 | 400 | 12 | 20 | 8 | 24 | 40 | 16 | 7 | 5 | 16 | all four | 12 | about 184,000 |
| 6 | 500 | 16 | 24 | 9 | 32 | 48 | 20 | 8 | 5 | 24 | all four | 16 | about 233,000 |
| 7 | 600 | 20 | 32 | 10 | 48 | 64 | 24 | 9 | 5 | 32 | all four | 24 | about 302,000 |
| 8 | 700 | 24 | 48 | 11 | 64 | 80 | 32 | 10 | 5 | 48 | all four | 32 | about 402,000 |

(Fight counts are the program's own rough estimate with 250 candidates; the real count depends on what stage 1 finds.)

## What comes back

In `%USERPROFILE%\robocus-combo\combo-results\`:

- `fights.jsonl`: one line a fight, `[key, score, length, how]`, key = `set~robot~build~opponent~opponent build~fight`. Kept between
  starts. If the engine or the lineup changes (a newer branch), the old folder is renamed `combo-results-old-<fingerprint>` and a
  fresh one started, so results of two engines never mix.
- `state.json`: the robots, the measured speed, the depth chosen.
- `analysis.json`: every number the stages computed.
- `report.md`: plain English: top new epics, the game's epics that no longer hold, great and poor fits (new / gone), borderline
  ones, synergy pairs, the best build per robot (vs one and two levels up, bare and kitted), giant slayers, builds that beat kitted
  robots two levels up, rarity tiers, anything 95%+, and whether the old rules still fit.
- `combo-results.json`: compact, what the game tables need (`fits` in PART_FIT form, `epic`, `triple`, `builds`, `synergy`, `tiers`,
  `partAvg`, every single combo).
- `combo-hunt-results.json.gz`: all of the above in one file: **the one to send back**.

After it comes back (orchestrator): unpack it (`node -e "const z=require('zlib'),f=require('fs');const p=JSON.parse(z.gunzipSync(f.readFileSync('combo-hunt-results.json.gz')));f.mkdirSync('cr',{recursive:true});f.writeFileSync('cr/combo-results.json',JSON.stringify(p.results));f.writeFileSync('cr/report.md',p.report);f.writeFileSync('cr/analysis.json',JSON.stringify(p.analysis));f.writeFileSync('cr/fights.jsonl',p.fights)"`), show Kev `report.md`, then
`node tools/damage-lab/combo-apply.js cr/combo-results.json` prints the new PART_FIT / EPIC / TRIPLE text (new epics come out as
`NEW <robot> + <part>`: they need names) and what changed against the game. It changes no file. `node tools/damage-lab/combo-report.js
cr/analysis.json` re-writes the report (for example after a fix to the report code) without fighting. Running the hunt again on the
same folder with `--report` re-plays the plan from `fights.jsonl` and fails if a fight is missing.

## Files

- `tools/combo-hunt.cmd`: the double-click file.
- `tools/damage-lab/combo-hunt.js`: the search (coordinator and workers in one file; `node tools/damage-lab/combo-hunt.js --help`
  is not there: the options are in the first lines of the file). Options: `--hours=N`, `--workers=N`, `--out=dir`,
  `--robots=A,B` (a slice), `--depth=0-8` (0 = the small test slice), `--screen=N` (stage 1 fights a pair, default 4), `--report`.
- `tools/damage-lab/combo-report.js`: report.md and combo-results.json from analysis.json.
- `tools/damage-lab/combo-apply.js`: the table text for review.
