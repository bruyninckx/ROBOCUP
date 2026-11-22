# ROBOCUS: the bookie watches test fights (15 Nov 2026)

Why: Friday playtest, "people were very sensitive about not having the right odds". Kev: can the host simulate games so the odds are correct? Then: "build the bookie then do the measurements".

## What was built (commit 6898d89 on branch claude/2.0.1-merge, bundle robocus-2.0.1-merge.bundle)

- `simOdds(F)` in `prototypes/tabletop-2.html`, called in `afterChoose()` once the fighters are known, before the bands and payouts are set.
- The host runs this very fight (robots with parts and damage, arena, House Robot; `buildFight(F, seed, false)`, so open information only: no face-down cards, no live cards) up to `BAL.bookie.n` = 200 times with other seeds, for `BAL.bookie.ms` = 4 s at most.
- Fights run in background workers (`bookiePool`: dmath + planck + engine loaded with importScripts; cores minus 2, 8 at most), so the page does not freeze. A page opened from a file can't load the engine in a worker: it then runs fights on the page itself in the same time limit.
- Odds = (wins + 8 x formula odds) / (fights + 8). Fewer than `BAL.bookie.min` = 40 fights done: the formula's odds stay, and the log says so.
- Bot test games (`?bot=1` without `watch=1`) give it 0.4 s only, so the test tools are not slowed down.
- Log line in the game ("The bookie watched N test fights...") and a `bookie` event in the playtest log: n, ms, how (workers or page), wins, formula odds, final odds, used.
- Switches: `window.__noBookie = true` (off), `BAL.bookie = { n, ms, min, prior }`.

## Not known yet

- How many fights Kev's PC does in 4 s. In the cloud test box (2 slow cores) one duel takes about 0.3 s and a four-robot fight 0.8 s, so only a handful fit and it falls back to the formula. The first real game's log shows the number: look for the `bookie` events or the log line.
- A host on a slow laptop gets the formula more often.

## Measurement: how wrong were the formula odds? (before the tuned-robots merge)

229 fights from 22 bot games (old lineup, main at 3a606e0). Per fight: the formula's odds, 24 test fights of the same matchup, and who really won (the real fight includes face-down and live cards).

| | Fights | Formula vs test fights, mean gap | Sides off by 20+ points | Score vs real result, formula | Score, test fights (24) |
|---|---|---|---|---|---|
| Duel, robots as new | 33 | 12.6 | 15% | 0.139 | 0.172 |
| Duel, parts or damage | 106 | 13.6 | 23% | 0.140 | 0.116 |
| Three or more robots, House Robot | 90 | 17.4 | 36% | 0.155 | 0.125 |
| All | 229 | 14.9 | 27% | 0.146 | 0.128 |

Score = Brier (lower is better; a coin is 0.25). 24 test fights alone have about 5 points of noise, so the formula's own error per fight is roughly 12 to 14 points.

What it says:
- On average the formula is honest (sides it gives 50% win 49%, 91% win 93%), but per fight it is often a band off: a quarter of all sides, a third in fights with three or more robots.
- It is too sure in the middle: sides it gives 20-40% really win about 37-41% in duels with parts or damage; sides it gives 60-80% win about 58%.
- Even 24 test fights predict real results better than the formula, except for duels between robots as new, where the matchup table (20 real fights a pair) is already good and 24 fights are just noisier. With 200 fights that disadvantage goes.
- Limits: bot games, not people; 33 stock duels is a small group; measured before the tuned lineup and levelled parts came in (the other session measured the formula there as "within 5 points" on average for parts, which is the average, not per fight).

Scripts (cloud scratch, not in the repo): measure.js (bot games, 24 test fights per fight), analyse.js.

## Upgrades in levels (same bundle, commit 20f509d)

`PART_LV` in tabletop-2.html: levels a part adds [all, on level 0-1, level 2-3, level 4], from the parts test rounds 3 and 4 (see robocus-part-levels.md). Shown in quarters: orange coins next to a robot's level on its work order, the value behind each part, "fights like ★x", "+¾ LEVEL" on market part cards, per-level row in the hover. The bookie's formula still uses the flat values in src2/repair.js (0.42 a part, 0.9 a legendary); with the simulating bookie that matters only when it falls back.

## Decided (16 Nov)

- Kev: "test fight bookie does not ignore damage, it should run the simulation as is". The test fights keep each robot's real damage (K1 in `TASKS.md`, answered). The formula then still read robots as new (`BAL.oddsDamage` false): question K5.
- Kev (K5, answered): "let the formula count damage again". `BAL.oddsDamage` is true again, so the formula odds (Market and auction overlays, bands, the AI's valuations, the fallback at a fight when the host's PC is too slow for test fights) count each robot's damage, like the test fights. Example (seed 3, round 2): Scythe L0 with a broken Body against a new Mincer L0 drops from 65% (read as new) to 56%.
- The odds shown in the Market and auction overlays come from the formula (matchup table and part values), not from test fights. Test fights run only for the fight itself, in `afterChoose()`.

## Kev's PC: how many test fights fit in 4 s (16 Nov, from his playtest log)

Log `robocus2-playtest-2026-11-16T19-10-46.json`, build 2026-11-16a, 6 fights, game opened with `play-latest.cmd` (a file, so no workers: every run says `how: page`).

| Round | Fight | Test fights | Time | Used | Formula → final odds |
|---|---|---|---|---|---|
| 1 | Duel | 71 | 4.1 s | yes | 81% → 74% |
| 2 | Duel | 65 | 4.0 s | yes | 91% → 87% |
| 3 | Mirror (2v2) | 11 | 4.4 s | no (under 40) | 65% (all 11 test fights went to the favourite) |
| 4 | Duel | 62 | 4.1 s | yes | 95% → 91% |
| 5 | Duel | 81 | 4.0 s | yes | 16% → 3% |
| 6 | Double duel (2v2) | 9 | 4.1 s | no (under 40) | 86% (8 of 9 to the favourite) |

- Duels: 62-81 fights, about 16-20 a second on the page. Enough to use, short of the 200 target.
- Fights with four robots: 9-11, about 2.5 a second. They always fall back to the formula on this setup.
- Workers never ran, because a page opened from a file can't start them. Through a web address (GitHub Pages, or a local server) the PC would use its cores minus 2.
- `BAL.bookie` is unchanged; the options are question K9 in `TASKS.md`.

## From a local address (20 Nov, T32)

Kev (K9): "yes" to a local server for `play-latest`. Now `play-latest.cmd` starts `tools/serve.js` (Node; `tools/serve.py` if there is only Python) and opens the game at `http://127.0.0.1:8765/prototypes/tabletop-2.html`. From there the page can start its helpers, so the fight bookie and the odds overview run their test fights in workers (`how: "N workers"` in the `bookie` event). `play-latest file` still opens the file (page only). Kev's guide: docs/orchestration.md, "What play-latest does".

Measured in the cloud test box (`node tools/serve-check.js`: one AI game, seed 3, then `simOdds` on its first duel and its first 4-robot fight, a 2v2 in round 9). The box has 2 slow cores, so the bookie makes 1 worker (cores minus 2, at least 1), and it was shared with five other jobs (load 20-35 on 2 cores): the counts swing a lot from run to run and say nothing about Kev's PC. What they do show: where the fights run, and how long the screen stands still.

| Budget | Address | Duel: test fights | 4-robot fight: test fights | Longest screen freeze (4-robot) |
|---|---|---|---|---|
| 4 s | file | 14-40, `how: page` | 1 (one fight took 13-18 s, past the budget) | 12.5-18 s |
| 4 s | http://127.0.0.1 | 4-14, `how: 1 workers` | 0 (none finished in time) | 0.9-1.6 s |
| 12 s | file | 33, `how: page` | 1 (17 s) | 17 s |
| 12 s | http://127.0.0.1 | 139, `how: 1 workers` | 0 | 1.6 s |

- A worker runs the same fight in the same number of steps as the page (checked: 6 duels, steps identical), at about the same speed once warm; its first fights are slower (a fresh worker's engine is not warmed up yet: 15 s against 7 s for the first duel here, 4.2 s against 4.9 s by the sixth). The pool lives as long as the page, so this costs only the first fight of a game.
- With one worker there is no speed gain, only no freezes. The gain is the number of workers: `cores minus 2, 8 at most`. On Kev's PC the page did 16-20 duels and about 2.5 four-robot fights a second. Per worker that should be about the same, so with 6 workers (an 8-core PC) roughly 60 four-robot fights in 4 s (over `min` = 40: used) and the 200 duels well inside 4 s; with 4 cores (2 workers) about 20 four-robot fights, still under 40. His next log's `bookie` events say how many workers ran (`how`) and how many fights fitted.
- When no worker result arrives in time (here: the 4-robot fight), `how` says `page` with n 0: the page loop does not start either, because the budget is used up. Only the label is off.
- Files stamp and red bar: same from both addresses (no red bar). Planck: the page falls back to `vendor/` when the CDN is blocked, and the workers try the same addresses in the same order.

## Odds overview on a Market lot (16 Nov, T7)

Kev: "the overlay when checking odds on parts/robot should give an overview of effect of all the robots vs all the other robots, also from the opponents and how these changes affect you"; on a quick formula or test fights: "lets refine a bit".

What it shows (`openOddsOverview` in `prototypes/tabletop-2.html`):
- Click the 🎩 odds at the bottom of a part lot or a robot lot in the Market (sealed bids or the open-market preview). A click there used to add 1 Cr to the bid like the rest of the card; now it opens the overview (the − / + buttons and the rest of the card still bid). Esc or a click outside closes it.
- One tab per team that could win the lot ("You win it", "Rust wins it", ...). Each tab says how many of your duels move up (▲) or down (▼) a band.
- Under the tabs: which robot the part goes on (or, for a robot lot with a full garage, which robot is scrapped). The default is the robot the bookie thinks gains most, the same pick the AI makes (`aiPickRobot`, `aiTradeInPick`), marked "(likely)". Click another to see that case.
- A line "For you:" lists the band moves of your robots, biggest first ("your Scythe vs Rust's Mincer: Even → Underdog").
- The grid: rows = every robot (yours first, yellow edge), columns = every robot of the other teams, plus "vs the field". A cell is the row robot's chance in a duel on open floor, as a band. Cells that change are coloured: filled = it moves a band ("Even→Dog"), tinted = it moves inside its band (▲ ▼). Cells on your rows that change are outlined. A new robot shows "new Fav"; a scrapped one "—". No percentages, only bands (Kev, 9 Nov).

Refinement with test fights:
- The formula (matchup table + part values, with damage) fills the grid at once. Opening takes 2 to 30 ms in the cloud test box (4 teams, 12 robots; the first open of a page can take longer while the caches fill).
- Then duels of the two robots as they would be (parts, tiers, damage; open information only, `spec2`) run in the bookie's worker pool. Per pair state: `BAL.overview.per` = 12 fights, 24 for the changed duels of your robots (`mine`); the result is mixed with the formula as `prior` = 8 fights, like `simOdds`. A cell takes the checked number only when all its fights are in (no flicker), and then gets a small dot in its corner.
- Order: your changed duels first (after, then before), then the other changed duels, then your other duels, then the rest. Only the tab on screen is worked on.
- Seeds come from the two robot names and the fight number, so the same pair state always gives the same numbers, whatever order the fights finish in, and a pair before and after the lot fights with the same dice (less noise in the change). Results are cached per pair state (3,000 at most), so reopening or switching back is free; a pair that shows up in another lot's grid is reused too.
- It stops when the overlay closes, when the Market moves on or the lot is gone, and it waits whenever the fight bookie (`simOdds`) holds the pool.
- A page opened from a file (`play-latest file`; until 20 Nov also plain `play-latest`) can't start the helpers: the fights then run on the page itself in slices of 5 ms (`sliceMs`; up to 10 ms when the browser is idle), so the game never freezes, but it is very slow (in the cloud test box about 100 engine steps a second, so a single duel takes about 25 s and the grid stays on the formula). From a web address (`play-latest`, which since 20 Nov serves the game from the PC, or `play-latest online`) the helpers run. The note under the grid says how the fights run and how many matchups are checked.
- Switches: `BAL.overview = { per, mine, prior, sliceMs }`; `window.__noOddsFights = true` keeps the grid on the formula.

Display only: these numbers never feed game state, the AI, the fight odds, bets, payouts or anything sent between players (each PC works out its own). Nothing in it uses the game's dice. No change under `src2/`, so the files stamp stays the same.

Measured in the cloud test box (2 slow cores, so 1 helper; 4 teams of 3 robots, Quantum shield lot):
- Opening: 12-15 ms on the first click, 2 to 33 ms over 16 reopenings (4 lots x 4 winners). Later, with the box shared by other jobs (load 20 on 2 cores): 480 openings, median 2.5-6 ms, 95% under 48 ms, a few spikes of 180-430 ms when the page was not given the CPU. A cold page (no Market drawn yet, so no robot builds cached) took 122 ms once.
- Test fights: about 0.5 to 0.7 a second. With the default budget the grid has 63 pair states (about 950 fights): 5 of 63 checked after 3 minutes (your changed duels first), so a full grid would take about half an hour there. With a test budget of 3 / 6 fights (`?bal={"overview":{"per":3,"mine":6}}`): the whole grid (297 fights) in 400 s, and the next tab (another winner) in 47 s, because most pairs were already in the cache.
- Frames stay smooth while it works (helpers: median 16.7 ms, worst 100 ms in 3 s; from a file: median 16.8 ms, worst 50 ms).
- Kev's PC (section above) runs 16-20 duels a second on the page, about 30 times this box. From the web (helpers, cores minus 2) a full grid should then take well under a minute, your changed duels (about 18 pair states, 430 fights) first. From a file the slices get about a tenth of the page's time at most, so expect 1-2 duels a second there: a few minutes for your changed duels, longer for the whole grid. Not measured on his PC yet.
- Game state (G) is the same before and after opening the overview and running test fights (checked with a hash).

## 21 Nov (T41): wear on, new matchup table

Wear (bends, cracks, saw cuts) is on in every fight and the robots were retuned. With the 15 Nov table the bookie's Brier on the
retuned fights went from 0.182 to 0.201; with the table measured again with wear on (Kev's PC, 10,560 fights) it is 0.179 on the
same 1,976 fights. Whole games (40, same seeds): favourite wins 74% → 77%, Brier 0.177 → 0.164. The test fights see wear marks
(they are in `spec.wear`); the formula prices them (`src2/repair.js` `markCost`, small: marks cost little next to the health damage).
Details: `docs/robocus-wear-in-game.md`.

## 21 Nov (T52): all cores and more time for fights with 3-4 robots

Kev's solo game of 21 Nov (build 2026-11-21k, 15 rounds, served from his PC: Ryzen 7 9800X3D, 8 cores / 16 logical processors).
Every `bookie` event said `how: "8 workers"` (cores minus 2 = 14, capped at 8):

| Round | Fight | Robots | Test fights in 4 s | Per helper a second | Used |
|---|---|---|---|---|---|
| 1, 2, 3, 6-10, 12, 13, 15 | duels | 2 | 77-200 (200 = the cap, reached in 2.2-3.7 s) | 2.4-11.4 | yes |
| 5 | 2v2 (3 robots: 2 against 1) | 3 | 160 | 5.0 | yes |
| 4 | 2v2 | 4 | 29 | 0.91 | no (under 40) |
| 11 | 2v2 | 4 | 37 | 1.16 | no |
| 14 | 2v2 | 4 | 26 | 0.81 | no |

Fights with 4 robots last longer (wear makes them longer still; his real 2v2s ran 68-124 s of fight time, a duel 11-119 s), so a
helper finishes about one a second on his PC. A fight still running at the end of the budget is thrown away, so with 8
helpers about 4 fights are lost at the cut: the true rate is about (n + 4) / 4 s / 8 = 1.0-1.3 fights a second a helper.

### What changed (`BAL.bookie`, defaults)

| Setting | Before | Now | Why |
|---|---|---|---|
| `cap` (most helpers) | 8 | **14** (cores minus 2) | his PC has 16 logical processors |
| `msBig` (budget for 3+ robots: copies and the House Robot count) | 4 s | **8 s** | the fights that fell short |
| `ms` (duels) | 4 s | 4 s | duels were fine |
| `stopN` / `stopMiss` | none | **60 / 1** | stop early once 60 are in and the other sides together won at most 1: the odds sit at the 95% cap whatever comes next (his rounds 12, 13 and 15 would have started 1-2 s sooner) |
| `min`, `prior`, `n` | 40, 8, 200 | unchanged | see "Fewer test fights?" below |

A page without helpers (opened from a file) keeps 4 s also for big fights: there each test fight blocks the screen.

### What to expect on his PC (arithmetic from his log)

- 8 helpers, 8 s: (1.0-1.3 a second) x 8 helpers x 8 s - 4 lost at the cut = **about 60-80** test fights for his three 4-robot fights (29, 37, 26 before). Over 40: used.
- 14 helpers on 8 cores / 16 threads: the extra 6 share cores with the first 8 (SMT), so they add perhaps 20-40%, not 75%: about 70-110 in 8 s. In 4 s alone they would give 35-50: not enough on their own, which is why the time goes up too.
- Duels: same 4 s, more helpers, so 77-200 becomes about 90-200; clear duels stop at 60 (one of his took 122 of 122 in 4.0 s: now about 2 s).
- His next log: `bookie` events with `how: "14 workers"`, `cores: 16`, `bots: 4` and `budget: 8000` on 2v2 / free-for-all / House Robot fights, `n` 50-110 and `used: true`; duels `budget: 4000`, some with `early: true`, `n` 60 and `ms` under 4000. If a 4-robot fight still shows `used: false`, the `n` and `ms` say by how much.
- While it watches, the note says "The bookie is watching test fights of this matchup to set the odds… (a few seconds)" (unchanged); the fighters stand in the pit. Nothing freezes: the fights run in the helpers.

### Measured in the cloud test box (2 slow cores, shared: load 7-21; absolute speeds say little)

`node tools/bookie-speed.js` (served page, pretends 16 processors, AI game seed 3, a duel and a 4-robot fight from round 5 on):

- Memory: the browser grows by 33 MB with 1 helper, 62 MB with 8, 124 MB with 14 (each loads planck and the engine): **about 8-10 MB a helper**, so 14 helpers about 125 MB. The pool starts 5 s after the page loads and lives as long as the page (no start-up cost per fight).
- Speed per helper, quiet box (load 3): the round-7 duel 39.9 fights a second with 1 helper (27.6 each with 2: 2 cores, and the page
  needs some), the round-5 double duel (4 robots) 0.65 with 1 helper (0.47 each with 2), i.e. 1.5-2.1 s a fight. Loaded box (load 11):
  12.8 and 0.27. This 4-robot fight costs about 60 of this (short) duel; on Kev's PC his 4-robot fights cost 2-14 of his duels.
- The game's own settings on the served page with 14 helpers (on 2 cores, so each helper gets a seventh of a core): the duel
  stopped early at 60 of 60 in 3.7 s (`early: true`, `budget: 4000`); the 4-robot fight got `budget: 8000` and only 1 fight in it
  here. That shows the paths work; the counts belong to this box, not to his PC.
- Measured with `tools/bookie-speed.js` (it also stores the fights in `--out`); `node tools/serve-check.js` below for the served page.

### Fewer test fights for big fights? (not changed)

`node tools/bookie-brier.js` (AI games, T41 wear build; at every real fight with 3+ robots, 30 test fights of that fight on the
page, open information only; the game goes on with the formula; score against who really won, face-down and live cards in).
Only **15 fights from 3 games** finished before the box restarted, so this is a direction, not a result:

| 15 fights with 3-4 robots | Brier (coin 0.25) | change vs formula (paired, ± 1 s.e.) |
|---|---|---|
| formula alone | 0.210 | |
| 25 test fights + formula as 8 fights | 0.152 | -0.058 ± 0.056 |
| 30 + 8 | 0.161 | -0.049 ± 0.057 |
| 30 + 16 | 0.161 | -0.049 ± 0.049 |
| 10 + 8 | 0.153 | -0.057 ± 0.049 |

Same direction as the 15 Nov measurement (90 fights with 3+ robots: 24 test fights 0.125 against the formula's 0.155): even a short
run of test fights plus the formula as a prior predicts big fights better than the formula. Lowering `min` to about 25 for 3+ robots
looks safe, but 15 fights can't show it, so `min` stays 40 and the longer budget does the work (question for Kev in the hand-back;
`BAL.bookie.min` is the switch). A longer run: `node tools/bookie-brier.js --games=30 --n=30` (about 5 min a game on a free 2-core box).

### Game state stays the same for everyone

Checked: the odds a fight uses are worked out only on the host. `afterChoose` (which runs `simOdds`) is reached only from host
actions (a client's `act` goes to the host), the helpers are started only when the page is not a client, and the odds (`F.p`,
bands, payouts) reach the other screens in the synced game state. The helpers use the bookie's own seeds, never the game's dice;
more helpers or an early stop change only how many test fights the host counts, not any game random number. `node tools/mp-test.js` (3 clients, seed 5): OK, desyncs 0 on every client, 9 fights checked, 3.3 min.

## 22 Nov (T56): the screen says what the odds rest on

Kev's playtest of 22 Nov (build 2026-11-22b, 14 workers): the bookie ran 200, 60 (stopped early), 200, 60 (early), 158, 112 (the
2v2, 8 s), 199, 200, 127, 182, 173, 185 test fights. Kev: "be open about how many fights the bookie was able to process".

- The host writes `F.bk = { n, used, early, off, min, file }` into the fight in `afterChoose` (display only, synced with `G.fight`,
  so every screen shows the same number; nothing reads it back into the game; not set in fast all-AI games).
- `bookieTxt(F)`: "odds from 158 test fights" · "odds from 60 test fights (stopped early: clear favourite)" · "only 26 test fights:
  odds from the formula" (+ "(the host's game opened as a file)" when they ran on the page from a file) · "no test fights finished in time:
  odds from the formula" · "no test fights (switched off): odds from the formula". `bookieHelp(F)` says it in a sentence for the hover.
- Where: the Bets pit (a line under the side cards; with the fight-card auction up, before "Public bets"; brown for the formula),
  the yellow note in Bets, each band's hover help, the fight screen's side card, and a fighter's odds panel in Bets / Fight
  ("This fight: Fav pays 1.5× · odds from …"). Screenshots: t56-bookie-count.png (staged: `min` 5, `stopN` 6, so "6 test fights
  (stopped early)"), t56-bookie-count-formula.png (a file page in the cloud box: "only 7 test fights (the host's game opened as a file)").
- The log line says "stopped early (clear favourite)" when it did; the fallback line says "these odds come from the formula"
  (was "its estimate, as before").

