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

- Kev: "test fight bookie does not ignore damage, it should run the simulation as is". The test fights keep each robot's real damage (K1 in `TASKS.md`, answered). The formula still reads robots as new (`BAL.oddsDamage` false): question K5.
- The odds shown in the Market and auction overlays come from the formula (matchup table and part values), not from test fights. Test fights run only for the fight itself, in `afterChoose()`.
