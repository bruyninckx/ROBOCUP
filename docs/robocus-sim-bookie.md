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
- A page opened from a file (what `play-latest.cmd` does) can't start the helpers: the fights then run on the page itself in slices of 5 ms (`sliceMs`; up to 10 ms when the browser is idle), so the game never freezes, but it is very slow (in the cloud test box about 100 engine steps a second, so a single duel takes about 25 s and the grid stays on the formula). From the web (`play-latest online`, GitHub Pages) the helpers run. The note under the grid says how the fights run and how many matchups are checked.
- Switches: `BAL.overview = { per, mine, prior, sliceMs }`; `window.__noOddsFights = true` keeps the grid on the formula.

Display only: these numbers never feed game state, the AI, the fight odds, bets, payouts or anything sent between players (each PC works out its own). Nothing in it uses the game's dice. No change under `src2/`, so the files stamp stays the same.

Measured in the cloud test box (2 slow cores, so 1 helper; 4 teams of 3 robots, Quantum shield lot):
- Opening: 12-15 ms on the first click, 2 to 33 ms over 16 reopenings (4 lots x 4 winners). Later, with the box shared by other jobs (load 20 on 2 cores): 480 openings, median 2.5-6 ms, 95% under 48 ms, a few spikes of 180-430 ms when the page was not given the CPU. A cold page (no Market drawn yet, so no robot builds cached) took 122 ms once.
- Test fights: about 0.5 to 0.7 a second. With the default budget the grid has 63 pair states (about 950 fights): 5 of 63 checked after 3 minutes (your changed duels first), so a full grid would take about half an hour there. With a test budget of 3 / 6 fights (`?bal={"overview":{"per":3,"mine":6}}`): the whole grid (297 fights) in 400 s, and the next tab (another winner) in 47 s, because most pairs were already in the cache.
- Frames stay smooth while it works (helpers: median 16.7 ms, worst 100 ms in 3 s; from a file: median 16.8 ms, worst 50 ms).
- Kev's PC (section above) runs 16-20 duels a second on the page, about 30 times this box. From the web (helpers, cores minus 2) a full grid should then take well under a minute, your changed duels (about 18 pair states, 430 fights) first. From a file the slices get about a tenth of the page's time at most, so expect 1-2 duels a second there: a few minutes for your changed duels, longer for the whole grid. Not measured on his PC yet.
- Game state (G) is the same before and after opening the overview and running test fights (checked with a hash).
