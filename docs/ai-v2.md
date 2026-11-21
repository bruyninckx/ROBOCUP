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

## Surplus spending (2.0, 8 Nov, later)

The 2.0 AI (`prototypes/tabletop-2.html`) now spends credits above a reserve: higher lot, host and fight-card bids, and credit repairs (params `spendK`, `spendCap`, `spendShare`, `spendRes`, `spendBody`, `spendLate`). Details: `docs/robocus-2.0-tabletop.md`, "AI spending"; numbers: `docs/robocus-2.0-sim.md`, "Credits". `tools/ai-bench.js` takes `--page=prototypes/tabletop-2.html` for 2.0 benchmarks.

## Found while testing (7 Nov)

- Fixed: while a player's "over your hand limit" question was open, the host still accepted card plays and cash-ins from that player. A late click over the network could crash the host and hang the game. The question now blocks plays (like other Intrigue windows) and asks again if the hand changed anyway.
- Test bot only (`?bot=1`): it now invites any team when fewer than 2 have robots ready (it got stuck before).
- Not fixed: in 1 of 6 chaos runs of `tools/mp-test.js` (seed 21), a client that later dropped out showed screen errors (`needsRobot`/`robotLot`: Market code running on that client). The game finished and stayed in sync. `mp-test` now logs longer error stacks to catch it next time.


## Hosts invite like people; a guard for the host seat; deals between AI teams (T46, 21 Nov 2026)

Kev (21 Nov): "improving AI is always good"; on hoarding: teach the AI (no credit sink, no cap, no rule change); on the
voting page: "AI teams should make the same deals with each other". AI behaviour only: no rule, price or card text changed.
Every part is an `AI_PARAMS` switch, on by default; `--aip='{"invite":0,"guard":0,"favCards":0,"aiDeals":0}'` is the AI as
before (seeds 1-3: the same games as main 885ea64, every credit change and every fight identical).

What the AI does differently:
- **`invite`: an AI host weighs what an invitation gives.** For each team it could invite: appearance money (2 Cr, +2 per Fan
  token, 6 for a Fan Favourite), the chance of a win (its fame, a Fan token or the Fan Favourite it makes), against damage and,
  unless it is a Fan Favourite, the chance the host scraps it when it loses. That gift is weighted by how dangerous the team is to
  the host (`aiThreat`: fame, near the win, grudges; plus `invCrK` per 10 Cr it holds above the host). A host that stays out
  invites the pair that helps its rivals least (score noise `invNoise` 0.25, and `invRand` 12% any pair: people are not perfect).
  A host that fights itself picks, among its 55%+ matchups, the one where it gains most and the rival least. Before, a host
  that stayed out put the fame leader against its best counter 80% of the time, Fan Favourite or not.
- **Deals priced with the same numbers.** An AI host takes an invite / leave-out deal when it is worth what the deal changes
  (the harm of its best pair with that team in, or out, against its best pair; at least 2 Cr as before). A person's deal screen
  says the price. An AI team asks a person who hosts to be invited when the invitation is worth 3+ Cr to it, to be left out
  when it would cost it.
- **`aiDeals`: AI teams make those deals with an AI host too** (55% of the time, 1-2 Cr, the same rule "no gifts for a leader
  who keeps hosting"), settled at once (no question, no timer), one log line per deal the host takes. Backing was already the
  same between AI teams as towards a person (`aiBacking` asks every team and pays AI backers: about 19-20 Cr a game moved
  between AI teams before this task), so nothing changed there.
- **`guard`: one AI team watches the host seat** (and at match point, `guardMatch`, see below). When a rival piles up credits (3+ Cr above the others' average, or it hosted
  2 of the last 3 rounds and holds as much as the guard), is within 1 fame of the top and is dangerous (a Fan Favourite it would
  invite itself with, or within 3 fame of the win), the richest AI team other than it keeps credits back through the Market and
  bids up to its own host value + 0.6 x what that rival's hosting would give it (all of it when hosting wins the game), at most
  14 Cr and at most the rival's credits + 1. Only one team guards, so the AI teams don't all save at once.
- **`favCards`:** harmful cards aim a little harder (+0.5 threat) at a team with a Fan Favourite that leads or is within 1.

### Numbers

`tools/game-sim.js`, 2.0 page, all four seats AI v2, seeds 1-60 (or 1-40), paired seed by seed; ± is a 95% range.
Base: main 885ea64 (before T41 wear). "before" = all four switches off, "after" = all on.

All-AI games:

| | before (58) | after without AI-to-AI deals (60) | after (37) | paired change, after vs before (36) |
|---|---|---|---|---|
| Game length (rounds) | 11.5 | 11.4 | 11.9 | +0.1 ±0.7 |
| Fame per round (all teams) | 3.2 | 3.4 | 3.3 | +0.1 ±0.2 |
| Market Cr per game (all teams) | 116 | 110 | 117 | +1 ±8 |
| Host bids paid per game (all teams) | 78 | 82 | 87 | **+8 ±6** |
| Host changes per game | 8.1 | 8.1 | 8.6 | |
| Invite deals + fate pleas paid to hosts per game | 19.7 | 15.7 | 25.8 | about +10 from AI-to-AI invite deals |
| Backing paid between teams per game | 19.2 | 20.1 | 20.5 | (unchanged code) |
| Close finish (runner-up within 1 fame) | 34% | 47% | 49% | +14 ±22 pts |
| A host that stays out invites the sole fame leader | 95% (87 picks) | 46% (91) | 40% (47) | |
| ... a rival's ready Fan Favourite | 89% (38) | 56% (39) | 45% (22) | |
| ... the leader when it has a ready Fan Favourite | 95% (21) | 29% (24) | 25% (12) | |
| The guard raises its host bid (per game) | - | 2.2 (6.6 -> 9.7 Cr) | 2.3 (6.4 -> 9.5 Cr) | |
| Seat 0 (normal AI) wins (par 25%) | 38% ±13 | 33% ±12 | 38% ±16 | +3 ±20 pts |

So the host seat is worth a little more (+8 Cr a game in host bids across all teams, about +0.7 Cr a round) and the host takes
about 10 Cr a game more in invite deals; games are as long, the Market is not starved, finishes are a bit closer.
The seat-0 edge (T35: 29-40% for the normal AI in seat 0) stays where it was, within noise (38% before, 38% after).

The "Kev line" test AI in seat 0 (`--aip0='{"rw":1,"spendK":0,"rwTips":1}'`, T35), against three normal AI teams:

| Kev line in seat 0 | before (59) | after (60) | paired change (59) |
|---|---|---|---|
| Seat 0 wins | 17% ±10 | 10% ±8 | -7 ±10 pts |
| Its appearance money per game | 40.8 Cr | 31.9 Cr | **-9 ±5 Cr** |
| It hosts per game | 4.2 | 3.8 | -0.3 ±0.5 |
| What it pays for host seats per game | 32.0 | 32.6 | +0.6 ±4.6 |
| ... per host seat won | 7.7 | 8.5 | |
| An AI host that stays out invites the sole fame leader | 98% (41 picks) | 37% (30) | |
| Game length | 11.4 | 11.9 | +0.5 ±0.5 |
| Host bids paid per game (all teams) | 82 | 94 | +12 ±6 |
| Market Cr per game (all teams) | 105 | 97 | -7 ±6 |

The guard rarely meets a true saver in these runs: the AI Kev line repairs and bids what hosting is worth, so its credits stay
at 7-10 (T35); it fires about 3 times a game against it (bid 7 -> 10 Cr). Against a person with 20-45 Cr it keeps up to 14 Cr
back and makes that person pay up to 15 for the seat; it can't outbid 45 Cr (moneyCap: nobody bids more than the richest
rival + 1 could; no cap on what people bid).

The hoard-and-host variant (`--aip0='{"rw":1,"rwOff":["apex","self","deal","back"],"spendK":0}'`: no Market but a 2nd robot
and Mechanics, no surplus spending, +4 Cr on the host value; seeds 1-40):

| Hoard-and-host in seat 0 | before (39) | after (40) | paired change (39) |
|---|---|---|---|
| Seat 0 wins | 31% ±15 | 33% ±15 | +3 ±18 pts |
| Its appearance money per game | 31.3 Cr | 23.0 Cr | **-8 ±4 Cr** |
| It hosts per game | 5.1 | 4.8 | -0.3 ±0.6 |
| What it pays for host seats per game | 39.6 | 41.2 | +1.6 ±4.8 (7.8 -> 8.5 a seat) |
| Game length | 12.3 | 11.7 | -0.6 ±0.8 |
| Host bids paid per game (all teams) | 91 | 96 | +5 ±7 |
| Market Cr per game (all teams) | 112 | 100 | -12 ±8 |

Watch: next to a team that hoards and hosts, the Market gets 10% less (-12 ±8 Cr a game; -7 ±6 next to the Kev line, +1 ±8
in normal games): the guard keeps credits back and the host deals move credits to the host. Not a collapse, but the place to
look if AI robots feel plainer against a saver. `guardK` / `guardCap` turn it down.

### Match point (Kev's playtest of 21 Nov) and the new base

Kev's solo game (build 2026-11-21k, 15 rounds): he hosted 9 of 15 rounds for 7-12 Cr (76 Cr in all, 6 of his 13 fame) and
took the last three host seats for 9, 12 and 8 Cr one fame from the win; the AI teams' host bids were 1-13. He was no
hoarder: he earned 137 Cr and spent more than half on the host seat. So `guardMatch` (2): a rival within 2 fame of the win that
could win the game by hosting (host fame plus the fight it picks; a sole leader gets no host fame) is outbid by the guard with
**everything it has**, saver or not (it keeps those credits through the Market too).

Measured on main 1a395da (T41 wear and T45 buyout prices in; 25 games each, seeds 1-25, paired; small runs: read the
± ranges):

| Seat 0 plays | | before | after | paired change |
|---|---|---|---|---|
| **host every round** (`--aip0='{"hostMin":10,"rw":1,"rwOff":["apex","deal","hoard","back"]}'`: bids at least 10 Cr or all it has, invites itself, buys in the Market) | wins | 20% | 32% | +12 ±26 pts (25) |
| | hosts per game | 5.6 | 4.7 | -0.9 ±0.8 |
| | appearance Cr per game | 40.3 | 31.1 | -9 ±6 |
| | pays for host seats per game | 48.6 | 40.8 | -8 ±8 |
| | rounds at 10-11 fame in which it hosts | 26% (23) | 19% (21) | |
| | Market Cr per game (all) | 122 | 111 | -11 ±9 |
| **Kev line** | wins | 8% | 13% | +4 ±14 pts (24) |
| | appearance Cr per game | 36.8 | 27.4 | **-9 ±8** (same as on the old base) |
| | host bids per game (all) | 83 | 95 | +13 ±11 |
| | game length | 11.2 | 11.7 | +0.5 ±0.9 |

The guard's match-point bid came 29 times in 25 host-every-round games and won the seat 23 times. The host-every-round line
loses about 1 host seat a game and 9 Cr of appearance money; its win rate did not drop (+12 ±26: noise at 25 games). Taking the
host seat from a person at match point needs one AI team to have more credits than that person bids; with 8-12 Cr bids that
usually holds, against a 40 Cr pile it doesn't (no cap: Kev's choice).

From the same log, not changed here: 9 of 15 fights had a 90%+ favourite (hosts, Kev and the AI, pick mismatches: an AI host
that stays out now prefers a pair that gains little, which is often a mismatch of two weak teams); an AI team (Moss) sent
Buzzkill with a broken Body three times (robot pick by matchup odds; T51 / K46 on the task board).

Not run: the seat-0 normal AI against `aiDeals` off alone beyond the 37-game run above; the counters one at a time; the
`favCards` part alone (it is on by default as part of the package; its effect is not separated). Stalled games (1-3 per run)
are left out, not re-run (the server restarted twice during the runs).
