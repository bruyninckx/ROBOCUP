# AI v2 (7 Nov 2026)

The AI teams in `prototypes/tabletop-prototype.html` now play "v2" by default (`AI_DEFAULT = 2`). The old AI ("v1") is still in the code, so the two can be measured against each other. Measured with `tools/ai-bench.js`: one team plays the AI being tested, the other three the AI it is compared with; the tested seat rotates; all four teams AI, 12 fame. A fair share is 25%.

| Test | Games | Tested AI wins |
| --- | --- | --- |
| v2 (first version) vs v1 | 300 | 43% ±6 |
| v2 tuned vs v1 | 300 | **46% ±6** |

## What v2 does better

| Decision | v1 (old) | v2 | Worth (switched off one at a time, 160 games, v2 = 43%) |
| --- | --- | --- | --- |
| Host bid | a fixed 1.5–3 Cr × a random factor | what hosting is worth: its fame (none for a sole leader) × `hostFame` + 1, everything when it wins the game; rebids up to that value | **+20 points** (23% without) |
| Lot bids | a fixed value × 0.4–1.5 | the bookie's gain on the robot the part fits (`partWorth` × `partK`), highest value first, keeps a reserve and some for the host bid | +10 (32.5% without) |
| Spare or scrap | mostly random | scraps robots of teams that are a fame threat to the host | +5 (37.5%, within noise) |
| Live combat cards | a random card every second, 35% | Field Engineer when hurt or glitching, Overclock and Remote Trigger with a rival close, EMP and Oil on rivals with its own robot clear; one card per 3 s | +4 (39%, within noise) |
| Bets | 1–3 Cr at random, mostly on its own side | only when the payout beats its estimate (the bookie's odds plus its own face-down cards) | +3 (40%, within noise) |

Hosting is by far the biggest lever, which matches the sponsor check (`docs/sponsor-balance.md`): the team that hosts most wins most.

## Self-play tuning

One team with one changed setting against three teams with the default settings, 120 games each (±8 points).

| Setting | Tried | Wins | Kept |
| --- | --- | --- | --- |
| `hostFame` (Cr per host fame) | 2 / 4.5 / then 6 | 15% / **39%** / 27% more on top of 4.5 | **6** |
| `partK` (part value) | 0.7 / 1.4 / then 0.5 | **38%** / 8% / 32% more on top of 0.7 | **0.5** |
| `hostFame` 6 + `partK` 0.5 together vs 4.5 + 0.7 | | 34% | yes |
| `reserve` (credits kept back) | 1 / 3 | 28% / 28% | 2 (no difference) |
| Bets: bigger, any edge | `betK` 1, `betEdge` 0 | 24% | no |
| `scrapThreat` | 0 / 4 | 26% / 24% | 2 |
| `playMax` (schemes per turn) | 3 | 22.5% | 2 |
| `bidNoise` | 0.1 | 25% | 0.25 |

So the tuned AI pays a lot more to host (about 6 Cr for 1 fame) and a lot less for parts. Only those two settings matter much.

Watch in the playtest: v2 buys fewer parts, so AI robots may stay plainer; and since every AI now bids hard to host, hosting gets expensive for people too (that is probably right: it was underpriced).

## Effect on the rest

- Online play: none. The AI only runs on the host's browser.
- Balance numbers: the sponsor check (`docs/sponsor-balance.md`) was measured with the old AI and was not re-run (Kev, 7 Nov: bigger changes are coming, so stop here). Earlier checks (starters) don't depend on the AI.
- Solo `?seed` games play out differently (new seed-check numbers).

## Tools

- `node tools/ai-bench.js <games> <parallel> v2 v1` (short specs: `v2:hostFame=8,partK=0.5`, `v2:off=bets+host`).
- `node tools/sponsor-check.js <games> <parallel>`.
- In the game: `ROBOCUS_DEBUG.ai({ versions: [2, 1, 1, 1], params: [{ hostFame: 8 }, {}, {}, {}] })`.

## Found while testing (7 Nov)

- Fixed: while a player's "over your hand limit" question was open, the host still accepted card plays and cash-ins from that player. A late click over the network could crash the host and hang the game. The question now blocks plays (like other Intrigue windows) and asks again if the hand changed anyway.
- Test bot only (`?bot=1`): it now invites any team when fewer than 2 have robots ready (it got stuck before).
- Not fixed: in 1 of 6 chaos runs of `tools/mp-test.js` (seed 21), a client that later dropped out showed screen errors (`needsRobot`/`robotLot`: Market code running on that client). The game finished and stayed in sync. `mp-test` now logs longer error stacks to catch it next time.
