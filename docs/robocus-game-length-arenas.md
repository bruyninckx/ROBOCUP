# Game length and the arena change (17 Nov 2026, T19)

Question (orchestrator, 17 Nov): the arenas were made stronger on 17 Nov (T4, merge 9f50f3b). The two standard check games
(seeds 1 and 2) ran 11 and 12 rounds before and 15 and 13 after. Did the arena change make games longer, or change how
they play? Kev wants games of about 2 hours (about 11-12 rounds in bot games).

This is a measurement only: no game file, balance or tool behaviour changed.

## Answer in plain words

**Games are not longer.** Over 200 games with the same seeds before and after, the difference is **+0.1 rounds ± 0.13**
(11.55 → 11.63 rounds). The 15 and 13 rounds in the check games were chance: after any change to the fights, each game
plays out differently from the first changed fight on, so one game can move by 2-4 rounds either way (the spread of a
before/after pair is 1.8 rounds). Two games cannot show a change smaller than about 2.5 rounds.

Why so little moves: the bot hosts put only **14% of fights on a special arena** (9% before), so even a strong arena
changes about 1 fight in 7. Fame per round, fame sources, credits, fight length and the bookie's overall accuracy are all the same.

Two smaller things did show up (section 4 and 5), and they matter for the arena itself, not for game length:
- In whole games the host's arena pick is **worth about +1 point, not the +7 the bookie expects** (±3). The edge measured in the
  lab does not show up in game fights.
- On same-level duels on an arena, the formula bookie still uses the **15 Nov arena matchup table**, measured on the old
  arenas. That table barely agrees with the new arenas.

## 1. How it was measured

Same seeds (1-200), same settings (start fame 0, win at 12, AI v2 for all 4 teams), the page before the arena change
against the page after it.

- Before: commit 963defd, unpacked outside the repo: `git archive 963defd | tar -x -C /home/claude/t19-before`
- After: commit f731739 (= main after the T4 merge 9f50f3b; the board commits change nothing in the game)

```
node tools/game-sim.js --page=/home/claude/t19-before/prototypes/tabletop-2.html --tag=t19-before   --games=100 --par=2
node tools/game-sim.js --page=prototypes/tabletop-2.html                   --tag=t19-after    --games=100 --par=2
node tools/game-sim.js --page=/home/claude/t19-before/prototypes/tabletop-2.html --tag=t19-before-b --seed0=101 --games=100 --par=2
node tools/game-sim.js --page=prototypes/tabletop-2.html                   --tag=t19-after-b  --seed0=101 --games=100 --par=2
# 4 games stalled in round 1 while the shared box was loaded (before: seeds 61, 63; after: 31, 43), no page errors;
# run again one by one (--seed0=<s> --games=1 --par=1 --tag=t19-before-s<s> / t19-after-s<s>), all finished
node tools/arena-games-report.js t19-before+t19-before-s31+t19-before-s43+t19-before-s61+t19-before-s63+t19-before-b \
                                 t19-after+t19-after-s31+t19-after-s43+t19-after-s61+t19-after-s63+t19-after-b
```

200 of 200 games finished on each side, 0 page errors. Seeds 1 and 2 give 11 and 12 rounds before and 15 and 13 after, as the
check games did, so the runs reproduce. `tools/arena-games-report.js` is new (reporting only); `tools/game-sim-report.js` gives
the usual summary on the same files. The sims/ files are not in the repo (gitignored, 9-18 MB each).

The bot games use the formula bookie only (the simulating bookie, which watches test fights of the real matchup, is
switched off in fast bot games). Kev's games use the simulating bookie, so section 5 is about bot games and about the
bookie's first guess before it watches.

## 2. Before and after (200 games each, paired by seed)

± is one standard error.

| | Before (963defd) | After (f731739) | Difference |
|---|---|---|---|
| Rounds: mean ± sd | 11.55 ± 1.57 | 11.63 ± 1.71 | **+0.09 ± 0.13** (paired; 59 longer, 88 same, 53 shorter) |
| Rounds: median (10%-90%) | 12 (10-14) | 12 (9-14) | 0 |
| Games over 13 rounds | 10% | 14% | +3.5 ± 2.8 points |
| Games of 15+ rounds | 4% | 5% | |
| Fame handed out per round (all teams, net) | 3.22 | 3.21 | 0 |
| Winner's fame per round | 1.08 | 1.08 | 0 |
| Fame per game: fight wins / host / cards + / cards - / fan | 12.1 / 10.7 / 12.5 / -2.9 / 2.4 | 12.2 / 10.9 / 12.4 / -3.0 / 2.5 | none clear |
| Runner-up within 1 fame at the end | 38% | 37% | |
| Fame spread at round 8 (top - bottom) | 4.0 | 4.1 | |
| Leader at round 8 wins the game | 57% ±3 | 48% ±4 | -9 ± 5 (a hint only) |
| Fights per game | 11.3 | 11.3 | |
| Fight length (s), judges' decisions | 67.2, 15% | 67.2, 16% | |
| Fights on a special arena | 9% | 14% | +5 ± 1 |
| ... which | saws 4, ice 3, cage 2, killbox 1% | saws 6, ice 4, cage 2, killbox 1% | |
| Arena picked when the host fights itself / stays out | 10% / 7% | 16% / 7% | |
| Arena credits paid per game (all teams) | 1.05 | 1.55 | +0.5 Cr |
| Arena fights: length (s) | 60 | 58 (open 69) | |
| Duels between levels: lower level wins (upset) | 32% ±2 (875) | 30% ±2 (873) | none |
| ... on an arena only | 25% ±4 (111) | 29% ±4 (157) | |
| Duels one level apart: the higher wins | 60% ±2 | 64% ±2 | none clear |
| Bookie: favourite wins, all fights | 76% | 76% | |
| Bookie Brier, all fights (coin flip 0.250) | 0.163 | 0.162 | |
| Bookie Brier, duels on an arena | 0.114 (166) | 0.154 (243) | worse, see 5 |
| End credits per team / Market spend per game | 8.7 / 117 | 8.7 / 117 | |
| Robots bought / host scraps per game | 9.4 / 2.6 | 9.5 / 2.6 | |

Upsets are counted on the robots' base level; parts and damage decide more than the level badge (the stronger side by the
game's own strength, parts and damage included, wins 75-76% both times).

Nothing in the whole-game numbers moves beyond the noise except what was meant to move (more arena fights). The leader at
round 8 winning less often (57 → 48%) fits "arenas flatten the level gap", but it is within two standard errors and the end
spread and close finishes did not change.

## 3. Why the check games looked longer

A game is a long chain: change one fight and the Market, the bets and the cards that follow all go another way. The pair
spread (after minus before, same seed) is **1.8 rounds**, as large as the spread between games. So the mean of 2 pairs has
a standard error of about 1.3 rounds, and +2.5 rounds is about a 1-in-20 result: unusual, not rare. Two check games tell you the page runs, not
how long games are.

## 4. The host's own arena pick in whole games

Host duels (the host sends a robot; 2 robots, no House Robot):

| | Before | After |
|---|---|---|
| Open floor: host wins / bookie | 75% / 78% (679) | 76% / 79% (594) |
| Picked arena: host wins / bookie / bookie without the arena | 85% / 84% / 81% (125) | **78% ±3** / 84% / **77%** (201) |
| ARENA_FIT edge of the robots sent (host - rival, logit) | 0.23 | 0.54 |
| The picked arena helps the robots that fought (edge > 0) | 89% | 89% |
| Open-floor host duels where an arena had an edge > 0.15 | 41% | 72% |
| ... of those, the host held under 4 Cr | 56% | 59% |

- **The +11 points is not seen in whole games.** With the new table the picked arenas give the host's robot 0.54 logit, which
  should lift the host from about 77% to 84%. It won 78% ±3: about what it wins without any arena. Before the change: 85% vs
  81% expected without the arena. Split by parts: with stock robots on both sides (71 duels) the host won 68% ±6 vs 73% without
  the arena; with parts on either robot (130 duels) 83% ±3 vs 79%. No reason stands out; the likely ones:
  1. The lab measured each robot against the average robot of its level. A fit edge between two particular robots
     (fit of one minus fit of the other) need not hold for that pair: two hit-and-run robots both gain on the saws.
  2. The host picks the best of 4 arenas, so it picks where the measured fit is luckiest (winner's curse), even after the noise shrink.
  3. In games robots carry parts and damage; the lab fights are stock and fresh.
  The ±3 leaves room for a gain of up to about +5, but not +7 or more.
- **Does the AI pick sensibly?** Mostly yes: 89% of picks favour the robots that actually fought; it picks saws and ice most
  (the strongest tables), the Killbox hardly ever (its fits are small). It stays on the open floor in 72% of its own duels where
  an arena would help, and in 59% of those because it keeps 3 Cr after paying (`aiPickArena`: `credits - cost >= 3`); hosts
  have just paid a host bid. The rest: it judges the pick on its strongest robot and the rival's strongest, before the fighters
  are chosen (the robots sent can differ). When the host stays out of the fight it still picks a random arena 30% of the time
  (if it has the credits): 7% of those fights.

## 5. The bookie on arena fights

| Duels on an arena | Before | After |
|---|---|---|
| All: favourite wins, Brier | 85%, 0.114 (166) | 80%, 0.154 (243) |
| Same level (bookie: 15 Nov arena matchup table) | 87%, 0.115 (55) | 77%, 0.173 (86) |
| Levels differ (bookie: open-floor table + ARENA_FIT) | 84%, 0.114 (111) | 82%, 0.144 (157) |
| Side the ARENA_FIT favours (edge >= 0.2): wins / bookie said | 86% / 80% (84) | 72% / 76% (204) |

The bookie got worse on arena duels after the change (Brier 0.114 → 0.154; all fights unchanged at 0.162 because arena
duels are 11% of fights). Two reasons:
- **The same-level matchup tables per arena (`src2/matrix.js`, `arenas.saws/killbox/cage/ice`, made 15 Nov, 20 fights a pair)
  are from the old arenas.** `pairP` uses them first for a same-level pair and only falls back to the open-floor table +
  `ARENA_FIT` for other pairs. Compared with the new `ARENA_FIT`, the old table's arena shift per pair agrees only weakly
  (correlation: saws 0.54, ice 0.30, killbox 0.21, cage 0.09) and is mostly noise (spread 0.8-1.1 logit against 0.2-0.7 for
  the new fits). So for same-level duels the formula bookie and the AI's choice of fighter run on the old arenas, while the AI's
  arena pick runs on the new fits. Swapping in open table + new fit for those 86 duels gives a Brier of 0.189 instead of 0.173:
  no better in these games (too few duels to tell), so this is a consistency issue more than a measured loss.
- As in section 4, arena edges in game fights come out smaller than the lab fits say, so the bookie over-favours the side
  the arena suits (76% said, 72% won).

In Kev's games the simulating bookie watches 20+ test fights of the real matchup on the real arena, so the odds he sees on
arena fights are right either way; the formula is its starting guess and the bot games' only bookie.

## 6. Options for Kev (none needed for game length)

Game length: **nothing to do**; the arena change did not make games longer. Bot games stay at about 11.5 rounds.

For the arenas (none implemented):
1. **Leave it.** Arenas show up in 1 fight in 7 in bot games; with humans hosting (no 3 Cr reserve) probably more. Cost: none.
2. **Bookie consistency: drop or redo the per-arena matchup tables.** a) Drop them: same-level arena duels use open table +
   `ARENA_FIT` like every other pair (a few lines in `pairP` / the matrix build; formula odds only, multiplayer unaffected as
   every browser runs the same code). b) Re-measure them on the new arenas with enough fights a pair (hours of CPU on this box).
   a) is cheap and makes the AI's pick, its fighter choice and the bookie agree.
3. **Shrink `ARENA_FIT` for game use** (for example x0.5) because the edge in game fights looks smaller. Cost: one constant;
   it would cut the tags and the AI's urge to pick. The evidence is one 200-game run (±3 points); worth a second run with
   fresh seeds first, or a lab check of the actual pairs the AI picks for.
4. **AI host: pay for an arena down to 1 Cr left** (now 3 Cr). Arenas would come up in about twice as many host duels. Cost:
   one line; changes bot games and the AI's credits a little; worth it only if bot games should show arenas as often as
   people will pick them.
5. **AI host: judge the pick on the robots it will actually send** (choose the fighters first, then the arena, or try each
   ready robot). Cost: a small AI change; gain small (the pick already favours the robots sent 89% of the time).

## 7. Open questions

- Is about 11.5 rounds still the target for a 2 hour game? (Unchanged by the arenas.)
- Option 2a (one bookie for arena duels): yes or no?
- Should arena edges in games be re-checked (option 3) before Kev decides on arena prices? The pick is worth less in game
  fights than the lab said, so the 1 Cr price is, if anything, generous to the host, not too cheap.
