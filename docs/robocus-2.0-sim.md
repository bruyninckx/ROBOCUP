# ROBOCUS 2.0 whole-game sim (8 Nov 2026)

`tools/game-sim.js` now runs `prototypes/tabletop-2.html` as well as 1.0. All 4 teams play with the AI (autopilot, AI v2),
nothing is drawn (`window.__noRender`), and fights run on the real physics engine in headless mode. Nothing on the page changes:
the sim only watches it.

## Run it

```
node tools/game-sim.js --page=prototypes/tabletop-2.html --tag=v2_base --games=120 --par=2
node tools/game-sim-report.js v2_base            # side by side: add more tags
node tools/card-report.js v2_base                # card by card (Intrigue + fight cards)
```

Options: `--games` (100), `--par` (games at once, 4), `--start` (start fame, 4), `--win` (fame to win, 12), `--seed0` (1),
`--ai` (v2), `--maxRound` (stop a game after this round, 40), `--page` (1.0 by default), `--planck=<file>|cdn`.
The same seeds give the same games (two runs at par 2 and par 3 gave identical results), so two settings compare like for like.

**planck.js:** the page loads planck from cdn.jsdelivr.net. When that can't be reached (a proxy, offline), the sim serves a local copy
of the same version: `node_modules/planck/dist/planck.min.js` if it is there, else `vendor/planck-1.4.3.min.js` (not in git: `npm pack planck@1.4.3` and copy `package/dist/planck.min.js` there). On a normal PC the CDN works and neither is needed.
`--planck=cdn` uses the network. A game whose planck didn't load stops with an error instead of running without fights.

## Speed

Physics fights are fast enough; no fight model is needed.

| | 1 game at a time | 2 at a time (2 cores) |
|---|---|---|
| seconds per game (wall) | 16.7 | 24 (12.2 s per game overall) |
| seconds per fight (engine) | 1.9 | 2.7 |
| engine share of game time | 75% | 75% |

The bottleneck is the physics engine (`DamageLab.step`, about 0.2 ms per step, 8,300 steps per fight at 120 Hz). Fights that go
the full 120 s to the judges are 12% of fights but 21% of engine steps. The rest is the AI and the page. Set `--par` to the number of
cores; more than that is slower (par 3 on 2 cores: 13.1 s per game). 120 games take about 25 min on 2 cores.

## What it measures

As in 1.0: rounds, winner and seat, fame by source, Intrigue draws/plays/blocks/cash-ins, attacks, Market spend, bets, credits held.
Added (both versions): close finish (runner-up within 1 / 2 fame), fame gap winner to last. Added for 2.0:

- **Timing**: wall seconds per game, engine seconds and steps per fight, fight length, share of fights decided by the judges.
- **Repairs** per team per Upkeep, split crew / free action (fight loser, Aegis) / 2 Cr, by zone; crew on hand; damaged zones
  before Upkeep (after the free body heal) and left after it.
- **Zone damage carried into fights**: share of fighters with a damaged or broken drive / weapon / body at fight start.
- **Fight cards** (Bets-step auction): won per fight, price, share of offered cards sold, Cr spent, played (live_card events;
  Swap the Entry from its card stats); per card: offered / won / price / played.
- **Market**: robots bought per game by level and their price, parts and crew bought, unsold lots, robots per team at the end.
- **Scraps**: host scraps, can't-pay scraps, teams left with no robot.
- **Bookie calibration**: the bookie's odds (`F.p`, from Repair2 strength) against the result, per 10% band; favourite win rate
  by format; the stronger side by Repair2 strength; Brier score against a coin flip.
- **Errors**: page errors, the game's own error log, sim hook errors, stalls and crashes, grouped by message.

How the 2.0 numbers are caught (sim side, `installHooks` in `tools/game-sim.js`): it wraps `Repair2.repairZone` (and reads the
team's `t.rep` state before/after to tell crew / free / credits), puts a getter/setter on each team's `rep` (a new Upkeep), wraps
`DamageLab.step` (timing), and wraps `PT.game.events.push` to add each entrant's strength and zones at `fight_start` and to note
scraps from the game messages. Results are in `res[i].v2` of `sims/<tag>.json`.

## Baseline (120 games, start fame 4, win 12, AI v2, seeds 1–120)

| | |
|---|---|
| games finished | 120 / 120, no stalls, no page errors, no game errors |
| rounds | mean 7.2, median 7 (10–90%: 5–9), histogram 4:4 5:15 6:19 7:28 8:34 9:15 10:5 |
| close finish | runner-up within 1 fame 53%, within 2 fame 79%; winner − last 4.5 fame |
| win share by seat | 24% 24% 23% 28% |
| fame / game (all teams) | cards +11.0, fight wins +7.2, host +6.7, cards −4.3, Grand Final +1.5, Fan Favourite +1.3 |
| Intrigue | 93 cards drawn / game (70% of the 134-card deck), 16.3 attacks / game, 74% land, 5.7 Security Bot rolls, 10.9 cards cashed (11.4 Cr) |
| credits | 9.7 Cr held per team at Upkeep; Market 73 Cr / game (all teams), bets 18 Cr, fight cards 6.7 Cr, repairs 0.2 Cr |
| fights | 6.8 / game: duel 59%, double 19%, 2v2 17%, FFA 3%, mirror 1%; 69 s average, 12% go to the judges; no draws, no House Robot win |
| repairs | 1.3 per team per Upkeep: crew 1.0, free 0.4, credits 0.0; drive 35% / weapon 26% / body 38%; 71% fix a broken zone |
| crew vs damage | 4.0 crew per team at Upkeep vs 1.5 damaged zones; 89% of damaged zones fixed (0.2 left) |
| damage carried into fights | drive 0%, weapon 0%, body 5% (3% broken) of fighters |
| fight cards | 0.9 won per fight (45% of offered), 1.1 Cr each; 84% of won live cards are played (0.8 per fight) |
| robots bought / game | level 1: 2.2 (4.8 Cr), level 2: 2.1 (5.2 Cr), level 3: 1.9 (5.5 Cr); no starters bought |
| parts / crew bought | 15.6 parts / game (2.3 Cr), 2.3 crew (2.3 Cr); 13% of lots unsold; 2.0 robots per team at the end |
| scraps / game | 1.8 by the host, 0.2 for unpaid upkeep; 0.6 times a team has no robot left |
| bookie | favourite wins 68% (812 fights), stronger side by Repair2 69%; Brier 0.203 vs 0.246 coin flip; calibrated within 3–5 points in every band (FFA 44% favourite, 27 fights) |

Bookie calibration (every side of every fight):

| bookie p | sides | bookie p avg | actual |
|---|---|---|---|
| 0.0–0.1 | 42 | 7% | 10% |
| 0.1–0.2 | 135 | 15% | 16% |
| 0.2–0.3 | 223 | 24% | 24% |
| 0.3–0.4 | 282 | 35% | 35% |
| 0.4–0.5 | 197 | 46% | 43% |
| 0.5–0.6 | 198 | 54% | 58% |
| 0.6–0.7 | 267 | 65% | 65% |
| 0.7–0.8 | 202 | 76% | 76% |
| 0.8–0.9 | 96 | 85% | 83% |
| 0.9–1.0 | 31 | 92% | 87% |

First reads for the balance overhaul:
- **Repairs are not a choice yet.** With 4 crew per team and 1.5 damaged zones per Upkeep the AI fixes nearly everything with crew,
  almost never pays credits, and fighters start almost undamaged. Damage carried between rounds barely matters in AI games.
- **Fight cards are cheap**: about 1 Cr, more than half go unsold; Remote Trigger is the least wanted.
- **Cards are the biggest fame source** (+11 vs +7 from fight wins); games are short (7 rounds) and close (53% within 1 fame).
- **The bookie is well calibrated**: Repair2 strength predicts physics fights nearly perfectly on average.
- Robot prices barely rise with level (4.8 → 5.5 Cr).

Note: the baseline ran while other test runs shared the 2 cores, so its wall times (27 s per game, 13.6 s per game overall) are
slower than the clean timings above.
