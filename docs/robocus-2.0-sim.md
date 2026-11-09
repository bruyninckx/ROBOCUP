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

Options: `--games` (100), `--par` (games at once, 4), `--start` (start fame; default the page's own: 2.0 0, 1.0 4), `--win` (fame to win, 12), `--seed0` (1),
`--ai` (v2), `--maxRound` (stop a game after this round, 40), `--page` (1.0 by default), `--planck=<file>|cdn`,
`--bal='<JSON>'` and `--balFile=<file.json>` (2.0 balance settings, see below).
The same seeds give the same games (two runs at par 2 and par 3 gave identical results), so two settings compare like for like.

**planck.js:** the page loads planck from cdn.jsdelivr.net. When that can't be reached (a proxy, offline), the sim serves a local copy
of the same version: `node_modules/planck/dist/planck.min.js` if it is there, else `vendor/planck-1.4.3.min.js` (not in git: `npm pack planck@1.4.3` and copy `package/dist/planck.min.js` there). On a normal PC the CDN works and neither is needed.
`--planck=cdn` uses the network. A game whose planck didn't load stops with an error instead of running without fights.

## Balance settings (BAL)

Since 8 Nov every tunable number of 2.0 sits in one object, `BAL`, near the top of the game script in `prototypes/tabletop-2.html`.
The defaults are the rules as they stand: **start fame 0** (Kev, 8 Nov), and since round 3 (Kev, 8 Nov, later) round 2's `combo`, level 4
from round 6 with all 8 level 4 robots, the trade-in and the seat fix (changed defaults are marked **R3**). The code reads `BAL` when it needs a
number, so a change before the game starts applies everywhere (rules, AI, help texts, card and crew texts).

How to change it:
- **URL**: `tabletop-2.html?bal=<url-encoded JSON>`, deep-merged into `BAL` before anything is dealt (objects merge, arrays and
  plain values replace). This is what the sim uses.
- **Console / tests**: `ROBOCUS_DEBUG.bal({...})` merges, then deals a fresh game from the same seed (only during setup).
  `ROBOCUS_DEBUG.BAL` is the live object, `ROBOCUS_DEBUG.BAL_DEFAULT()` the defaults.
- **Sim**: `--bal='{"repair":{"brokenTwo":true}}'`, `--balFile=variant.json` (`--bal` is merged on top), `--start=N` (same as
  `startFame`). The overrides are saved in `sims/<tag>.json` (`bal`, `balFile`, and the page's whole `balFull`) and
  `game-sim-report.js` prints them (`BAL overrides` row and a line under the table).
- Saved games keep their `BAL`. The start-fame select in the setup bar still offers 7 / 4 / 2 / 1 / 0.

| key | default | what it does |
|---|---|---|
| `startFame` | 0 | fame every team starts with (was 4) |
| `winFame` | 12 | fame to win (same as `ROBOCUS_DEBUG.tune({win})`) |
| `fameFloor` | 1 | losing fame stops here, or at the start fame if that is lower (start 0: fame can drop to 0) |
| `startCredits` | 8 | credits at the start |
| `startCrew` | **R3** `{mechanic: 2, chief: 0, accountant: 1, analyst: 1}` (was `{mechanic: 3, chief: 1}`) | starting crew cards per kind (objects merge: a variant that sets `startCrew` should name every kind, with 0 for none) |
| `sovereignMechanics` | 4 | Mechanics a Sovereign Foundry team starts with |
| `mechanicCr` | 1 | credits each Mechanic earns in Upkeep |
| `crewDeck` | **R3** 3 mechanic, 3 chief, 2 repairtech, accountant, hacker, analyst, fixer, secchief (was 2 mechanic, 2 chief, 1 repairtech + the 5) | the New Crew deck (list of kinds) |
| `lots.robot` / `lots.crew` | 4 / **R3** 7 (was 4) | New Robot and New Crew lots in the Market lot deck (4 lots a round stays fixed) |
| `lots.partCopies` | **R3** `{medic: 1, laser: 0, waller: 0, blocker: 0, spotter: 0, shield: 1}` (was `{}`) | copies per part id (`src2/lineup.js` PARTS key, e.g. `{"shield": 2}`); others: the part's own `copies` |
| `lots.kindCopies` | `{}` | copies for every part of a kind (`drone`, `module`, `stat`); `partCopies` wins |
| `robotLevels.scheme` | **R3** `gradual` (was `waves`) | which level a New Robot lot deals by round (a missing level falls back to the nearest, then starters) |
| `robotLevels.rounds` | 5 | rounds 1..N always offer a robot lot |
| `robotLevels.schemes` | see below | `[from round, {level: weight}]` lists; one level = no dice roll |
| `level4.on` | true | level 4 end-game robots in the game (`docs/robocus-2.0-tabletop.md`, "Level 4 in the tabletop"); off = exactly the game before level 4 |
| `level4.fromRound` / `perGame` / `lotEvery` | **R3** 6 / 8 / 1 (was 7 / 4 / 1) | first round with a level 4 lot; how many of the 8 are dealt per game; a level 4 lot every N rounds while any are left (a scheme in `robotLevels` may also name level 4, from `fromRound`) |
| `level4.minBid` / `upkeep` / `announce` | 5 / 0 / true | lowest winning bid; extra Cr upkeep per level 4 robot (option: 1); name next round's level 4 robot a round ahead |
| `repair.credits` | 2 | Cr per repair action once free and crew actions are used up |
| `repair.crewActs` | `{default: 1}` | repair actions per crew member, per kind (e.g. `{"default": 1, "chief": 2}`) |
| `repair.engineersOnly` | **R3** true | **switch**: only `repair.engineers` give repair actions; the others' cards say "Does not repair." |
| `repair.engineers` | mechanic, chief, repairtech | the engineer kinds |
| `repair.actsDamaged` / `repair.actsBroken` | 1 / 1 | actions to fix a damaged / broken zone |
| `repair.brokenTwo` | **R3** true | **switch**: a broken zone costs 2 actions (same as `actsBroken: 2`) |
| `repair.bodyHeal` | 0.5 | body parts heal back to this every Upkeep for free |
| `repair.freeLoser` / `freeLoserVulture` / `freeAegis` | 1 / 2 / 1 | free repair actions: fight loser next Upkeep (Vulture Salvage), Aegis Heavy every Upkeep |
| `fame.win` | 1 | fame for a fight win (once per team) |
| `fame.host` | 1 | host fame (the sole fame leader still gets none: `CATCHUP.leaderhost`) |
| `fame.fanFav` | 1 | Fan Favourite fame (while the robot stays on the team) |
| `fame.favTokens` / `favTokensApex` | 3 / 2 | Fan tokens (wins) for a Fan Favourite; Apex Media |
| `fame.finalMult` | 2 | Grand Final win fame multiplier |
| `cards.upDmg` / `cards.upHp` | 1.2 / 1.2 | Secret Upgrade weapon damage / HP factor |
| `cards.lens` | 0.85 | Smudged Lens weapon damage factor |
| `cards.sugar` | 0.6 | Sugar in the Tank: drive motors start the fight at this |
| `cards.ocAfter` | 0.4 | Overclock: drive motors left at this after the fight |
| `cards.boltsLid` | 0.3 | Loose Bolts (`boltsMode: 'lid'`): top plate left at this |
| `cards.boltsMode` / `boltsWheel` | `lid` / 0.3 | **R3** Loose Bolts: `lid` (top plate, Body) or `wheel` (its first wheel left at `boltsWheel`, Drive damage until repaired; the free heal doesn't fix it) |
| `cards.ocMode` | `heat` | **R3** Overclock: `heat` = hot-wound motors (+35% force, 1.9× heat), `noheat` = +35% force without the extra heat (engine motor `oc`) |
| `tradeIn.on` / `base` / `perLevel` | true / 1 / 1 | **R3** a robot lot won with a full garage (3 bays): scrap one of your robots for `base + perLevel × level` Cr, its parts go to the Stash (off: the old rule, 2 Cr and the robot goes back) |
| `auction.perFight` / `minBid` | 2 / 1 | **R3** fight cards offered per fight (Bets step); lowest bid that counts |
| `seats.fairTies` | true | **R3** seat fix: ties between teams follow a seat order shuffled each round (was: lower seat), the AI reacts in that order, round 1 Intrigue starts at a random seat; false = the old order |
| `live.overclockS` | 3.5 | Target Overclock nitro seconds (`DamageLab.LIVE_K` in `src2/engine.js`) |
| `live.fieldHp` | 18 | Field Engineer HP to chassis and worst part |
| `live.empStun` / `live.empDmg` | 0.9 / 5 | EMP Grenade stun seconds / damage |
| `live.oilS`, `smokeS`, `magnetS`, `hypeS`, `supplyS` | 8, 5, 2, 6, 12 | Oil Canister, Smoke Bomb, Electromagnet, Hype Surge, Supply Drop crate seconds |
| `live.rattleLid` | 0.3 | Rattle Loose: top plate down to this |
| `copies` | `{}` | Intrigue / Auction card copies by card name, e.g. `{"Smear Campaign": 2, "Remote Trigger": 0}` |

Robot level schemes (`robotLevels.schemes`; add your own under a new name):

| scheme | rounds 1–2 | 3–4 | 5+ |
|---|---|---|---|
| `waves` (the default before round 3) | L1 | L2 | L3 |
| `waves2` | L1 | L2 | mixed: L1 25%, L2 25%, L3 50% |
| `gradual` (**R3 default**) | r1 L1; r2 L1 2:1 L2 | r3 L1 1:2 L2; r4 L2 2:1 L3 | r5 L2 1:2 L3; r6+ L3 |
| `flat` | L1/L2/L3 equally every round | | |

The card and crew texts that quote a number (Secret Upgrade, Smudged Lens, Sugar in the Tank, the live cards, Mechanic / Chief
Engineer / Repair Tech, repair help, zone help, robot level help, Loose Bolts and Overclock in their modes) are rebuilt from `BAL`. The AI's robot-card
values (`CARD_SWING`) follow `cards.*` since round 3: a small table of measured swings per setting (`SWING_AT`, `SWING_MODE`), interpolated
between measured numbers.

Run a variant:

```
node tools/game-sim.js --page=prototypes/tabletop-2.html --tag=v2_eng --games=40 --par=2 --bal='{"repair":{"engineersOnly":true}}'
node tools/game-sim.js --page=prototypes/tabletop-2.html --tag=v2_w2 --games=40 --par=2 --bal='{"robotLevels":{"scheme":"waves2"}}'
node tools/game-sim.js --page=prototypes/tabletop-2.html --tag=v2_mix --games=40 --par=2 --balFile=variants/mix.json
node tools/game-sim-report.js v2_s0 v2_eng v2_w2        # same seeds: compare like for like
```

(On Windows cmd, write the JSON with escaped quotes: `--bal="{\"repair\":{\"brokenTwo\":true}}"`, or use `--balFile`.)

## Round 2 results (Kev's PC, `tools/run-sims3.cmd`, `tools/bal2/`)

| finding | |
|---|---|
| best variant | `combo` (lean lots, robot levels `gradual`, broken zone 2 actions, engineers only, new start crew and crew deck): 52% of damaged zones fixed, 30% of fighters carry body damage into a fight, close finish (runner-up within 1) 56%, fights 58 s |
| level 4 | neutral for balance; lots from round 6 (`combo_L4r6`) give more level 4 fights |
| win share by seat 1-4 (pooled, 600 games) | 20.5% / 23% / 26% / 30.5%: a real bias (±1.8 points each) |
| AI robot price by level | L1 4.7, L2 5.4, **L3 4.5**, L4 7.0 Cr: level 3 cheaper than level 2 (AI valuation bug: a full garage valued every robot lot at 1) |

Kev's decisions (8 Nov): `combo` + level 4 from round 6 with all 8 level 4 robots become the defaults; a full garage becomes a trade-in;
round 3 looks at the seat bias, the AI's robot values, the robot-card proposals and fight-card prices.

## Round 3 (8 Nov, later): plan and first results

Code (all in `BAL`, see the table): the new defaults; `tradeIn`; `seats.fairTies` (seat fix); `cards.boltsMode` / `boltsWheel` /
`ocMode`; `auction.perFight` / `minBid`. AI: robot values from `Repair2.strength` and the trade-in value; `CARD_SWING` per card setting.
Rules and AI details: `docs/robocus-2.0-tabletop.md`, "Round 3". The sim now records trade-ins (`v2.tradeIns`; report row
`trade-ins / game`) and prints `final fame by seat` and the standard error of the seat shares.

PC run: `tools\run-sims4.cmd 100` (or `sh tools/run-sims4.sh 100`), every file in `tools/bal3/` (tags `o3_*`, `sims/overhaul3.txt`):

| variant | what it tests |
|---|---|
| `base` | the new defaults |
| `cards_new` | all robot-card proposals (Secret Upgrade +15%/+15%, Smudged Lens −25%, Sugar 40%, Loose Bolts one wheel at 30%, Overclock without extra heat) |
| `fight1` | 1 fight card per fight |
| `fightMin2` | fight cards: lowest bid 2 Cr |
| `cards_new_fight1` | both |
| `seats_old` | the old seat order (to measure the seat fix with many games) |

Checks here (2 cores, 8 Nov), new defaults, start 0, win 12, AI v2:

| | `o3_base60` (new defaults, 60 games) | `o3_seatsold60` (old seat order, 60) |
|---|---|---|
| games, errors | 60 / 60, 0 page errors, no stalls | 60 / 60, 0 |
| rounds: mean (median, 10–90%) | 11.3 (12, 9–13) | 11.4 |
| close finish: within 1 / 2 fame | 50% / 82% | 62% / 85% |
| win share by seat 1-4 (±5.6 each) | 23 / 25 / 15 / 37% | 27 / 27 / 32 / 15% |
| final fame by seat | 9.5 / 9.6 / 8.9 / 9.9 | 9.4 / 9.8 / 10.3 / 9.7 |
| fame / game | cards +14.9 / −3.3, wins 11.6, host 10.7, Grand Final 2.1, Fan Favourite 2.1: 69% from fights | |
| trade-ins / game | 4.2 (scrap 2.7 Cr, scrapped robots level 1.7 on average) | 4.6 |
| repairs / team / Upkeep | 1.1 (crew 0.7, free 0.3, Cr 0.1); damaged zones 2.1 → 1.0 (53% fixed); body damage carried 30% (28% broken) | |
| fights | 10.8 / game, 57 s, 5% to the judges; duel 53%, double 28%, 2v2 17% | |
| level 4 | 5.9 lots / game, 98% sold, 4.2 fights / game with a level 4 robot | |
| robots bought / game, price L1 L2 L3 L4 | 2.1 / 2.1 / 3.6 / 5.8; **6.1 / 7.2 / 6.5 / 8.3 Cr** (round 2: 4.7 / 5.4 / 4.5 / 7.0) | 6.1 / 7.3 / 6.5 / 8.4 |
| fight cards | 0.9 won / fight (45% of offered) at 1.1 Cr | |
| bookie | favourite wins 69% (649 fights), Brier 0.206 | |

Robot prices (`o3_base60`): the AI's values now rise with level, and so do prices at the same garage size (robots at that Upkeep; 1 robot: L1 6.1,
L2 7.6, L3 8.2, L4 10.0; 2 robots: L2 6.2, L3 6.6, L4 8.2; 3 robots, a trade-in: L2 5.1, L3 5.6, L4 8.1) and in rounds without a level 4 lot (L1 6.1, L2 7.3,
**L3 8.3**, L4 8.3). The overall L3 average is still below L2 (6.5 vs 7.2) because two thirds of level 3 lots sell in rounds 6+, next to a
level 4 lot: the AI bids on the level 4 robot first (higher value, 5 Cr minimum) and spends what is left on the level 3 one
(L3 next to a level 4 lot 5.7 Cr, 146 lots). A first try with the scrapped robot at its full value gave L3 5.6 vs L2 7.1.
Open: a "one robot lot a round" budget rule for the AI, or fewer level 4 lots, if the L3 price should rise overall.

Smoke runs, 2 games per `tools/bal3` file: all finished, 0 page errors. Fight cards: `fight1` 0.5 won / fight (54% of offered) at 1.2 Cr;
**`fightMin2` 0.0 won / fight (2% of offered)**: the AI values a fight card at about 1 Cr (measured swing × the fight's stake), so with a
2 Cr minimum it almost never bids. Raise the AI's card values (or the cards) before a 2 Cr minimum means anything.

## Credits: AI surplus spending (8 Nov, later)

Kev's playtest (AI v2): Rust Rivets held 61 Cr by round 10 (backing fees from 8 backings, 5 Mechanics, a Fan Favourite's appearance
money, cash-ins, sales to Kev) and never spent more than about 8 Cr a round, because the AI's lot values were fixed amounts. Now the
AI spends a **surplus** (AI rules: `docs/robocus-2.0-tabletop.md`, "AI spending"; params `spendK` … `spendMkt` in `AI_PARAMS`).

**New sim stats** (page: one `cr` event per credit change, `{k:'cr', team, amt, src}` via `addCr` / `payCr` / `transfer(…, src)`; no rule
change, and the playtest log has them too). Sim: `res[i].v2.cr` = `[round, team, amount, source]`, `v2.crStart`. Report rows: credits at
the end (mean / max, winner / others), credits held by round 1–13 (end of round), most held by a team in round 10+, income by source,
spend by sink, host bid price, repairs paid with credits, and a check that every change was logged (`credit changes not logged`: 0.0).
Below the table: a backing-fee block. `--aip='{"spendK":0}'` sets AI params for all four teams. Sources: `mechanics`, `upkeep`,
`backing`, `appearance`, `cashin`, `bet` (stakes out, payouts and refunds in), `sale` (bank: Stash, trade-in scrap money, full bays),
`trade`, `card` (Intrigue effects, both ways), `hostdeal` (invite / spare / scrap offers), `deal` (payoffs, Tag Team), `market`, `host`,
`fightcard`, `repair`, `wager` (2 per side), `sponsor`, `quirk`, `lot`, `catchup`.

**Before / after** (40 games each, seeds 1–40, start 0, win 12, AI v2). Before = `--aip='{"spendK":0}'` on the new page, which plays the
same games as the page before this change (checked: same seeds give identical final fame and credits). `v1` = the first committed
version (extras added inside the sealed-bid loop, credit repairs from any surplus), `after` = the fix below (tags `sp_before40`,
`sp_after40_v1`, `sp_after40`; also kept: `sp_after40_k05` (spendK 0.5), `sp_after40_v2`, `_v3`, the steps in between).

| | before | v1 (regression) | **after** |
|---|---|---|---|
| credits held by round 1–12 (mean / team) | 7.0 6.5 7.0 8.0 8.7 9.1 9.8 10.6 11.1 12.0 12.5 12.9 | 6.8 6.2 6.7 7.2 7.4 7.4 7.3 7.7 7.9 8.7 9.3 10.4 | 7.0 6.5 6.8 7.9 8.2 8.2 8.6 9.0 10.1 10.4 10.5 11.0 |
| most held by one team, round 10+ (mean / max) | 26.8 / 68 | 19.1 / 28 | **21.9 / 39** |
| end credits: mean / max; winner / others | 12.7 / 49; 18.4 / 10.9 | 9.5 / 27; 13.6 / 8.1 | 10.7 / 39; 14.2 / 9.5 |
| spend / game: market, host, bets, fight cards, repairs | 144, 81, 28, 10.7, 15.8 | 139, 83, 28, 11.3, 27.6 | **153**, 81, 28, 10.5, 15.1 |
| spend / game: backing paid, upkeep, card costs, host deals | 22.5, 47.4, 34.7, 26.5 | 23.1, 45.3, 30.0, 28.3 | 23.4, 48.1, 35.4, 25.4 |
| robot price L1 / L2 / L3 / L4 | 6.1 / 7.3 / 6.4 / 8.4 | 7.1 / 8.6 / 5.9 / 9.7 | 6.4 / 7.3 / 6.5 / 8.9 |
| parts / crew bought per game; lots unsold | 14.7 / 5.8; 23% | 9.5 / 3.4; 40% | **14.1 / 6.0; 23%** |
| host bid price (hostings paid / game) | 7.3 (11.1) | 7.6 (11.0) | 7.3 (11.1) |
| repairs paid with credits / game | 7.9 (15.8 Cr) | 13.8 (27.6 Cr) | 7.6 (15.1 Cr) |
| rounds; close finish within 1 / 2 | 11.3; 53% / 88% | 11.2; 50% / 78% | 11.5; 55% / 83% |
| win share by seat 1–4 (±7 each) | 28 / 20 / 15 / 38% | 20 / 28 / 18 / 35% | 30 / 15 / 33 / 23% |
| page errors, stalls | 0 | 0 | 0 |

Why v1 bought fewer parts and crew (40% of lots unsold): its base bids already used the old reserve, but (1) the surplus extra was added
inside the sealed-bid loop, so a robot lot's extra used up the shared budget before the lower-value lots (parts, crew) got their base
bid, and (2) credit repairs at Upkeep (before the Market) spent 12 Cr a game more, so teams came to the Market poorer. The fix: base
bids are computed exactly as before (same budget, same random numbers); then the extras are added in a second pass, only from what
is left above the full reserve after the base bids. Credit repairs, host-bid and fight-card extras use only the surplus above
`spendMkt` (8 Cr), which keeps money for this and next round's Market (with that, credit repairs are back to the old level). The war
chest is capped at `spendWar` (12 Cr).

Income / game (all teams, before → after): Mechanics 104 → 106, appearance 91 → 87, card effects 64 → 65, cash-ins 61 → 63, host deals
27 → 25, backing fees 22.5 → 23, sales 13.5 → 14, trades 11 → 13, bets net +9 → +7, sponsor / quirk / lot 13 → 14.

Reads: the Market gets more money (+9 Cr a game) and sells as many lots as before; robot prices are within 0.5 Cr of before; credits still
climb, but slower (round 12: 11.0 vs 12.9 a team) and the richest team late holds 22 Cr instead of 27 (max 39 vs 68). This is a smaller
cut than v1's (19 / 28), because the spending now only adds to bids and never takes money from the Market. No average over 20 Cr
held late, so no new credit sink is needed for AI games.

**Backing fees** (before; after is within noise): 10.8 payments a game, 2.1 Cr each (22.5 Cr a game, 5% of all team income); per team
5.6 Cr received and 5.6 paid. Backers risk nothing: the fee is paid only when the backing is enough, the backer can't be the target,
and no fame is lost. It is a transfer between teams, not new money, but it flows uphill: the AI asks the highest-fame team first and
a 0-fame team can't back, so the top quarter of backers (12.2 Cr received, net +7.7 a game) win 43% of games, the rest (3.4 Cr) 19%.
The AI backs 65% of 2 Cr requests (`aiWillBack`: 15% + 25% per Cr offered; 85% when the card hurts the leader; a leader or a
team on 9+ fame asking gets backing only for 3+ Cr, 40%). Kev's playtest:
Rust Rivets backed 8 of the 14 backings (about 16 Cr). Not changed (rule question for Kev: a backer could lose 1 fame if the scheme is
blocked, or the fee could go to the bank).

**AI benchmark** (`node tools/ai-bench.js 60 2 <A> <B> --page=prototypes/tabletop-2.html`: one spending AI vs three with `spendK=0`,
seat rotates, seeds 1–60, ±10–12 points):

| A (one team) vs three `spendK=0` | A wins | A's final fame |
|---|---|---|
| control: `spendK=0` (the same AI) | 23% | 9.5 |
| v1 tries: spendK 0.5, cap 0.6, no war chest / war chest / war chest without credit repairs | 18% / 20% / 17% | 9.0 / 8.9 / 9.1 |
| v1: spendK 0.3, cap 0.4, war chest | 25% | 9.75 |
| two-pass extras, credit repairs above `spendMkt` (step `_v3`) | 33% | 10.1 |
| **after (defaults: host / card extras also keep `spendMkt`)** | **20%** | **9.1** |

All within noise of the control (±10–12 points: 20% is 12 of 60 games, the control 14, `_v3` 20). The defaults keep the Market whole;
`_v3` (host and card extras from the whole surplus) benchmarked better but left 26% of lots unsold. A 200+ game run on the PC would tell
them apart. `tools/ai-bench.js` now takes `--page` (and `--planck`) so it runs on 2.0.

If AI or human games still pile up credits late, options for Kev (not built): (1) a late-game sink with fame, e.g. "Sponsor Gala": in the
Market, buy 1 fame for 10 + 5 × (times bought) Cr, once a round; (2) upkeep that grows with credits held (a 10% "storage fee" on credits
over 15 at Upkeep, to the bank); (3) bigger late lots: from round 8, a "Prototype" lot (a level 4 robot or legendary with a 10 Cr
minimum), so rich teams have something worth the money.

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

## Baselines: start fame 0 (new default) next to start fame 4

`v2_s0`: 100 games, start 0, win 12, AI v2, seeds 1–100, all `BAL` defaults (8 Nov, after the BAL change):
`node tools/game-sim.js --page=prototypes/tabletop-2.html --tag=v2_s0 --games=100 --par=2 --start=0`.
`v2_base`: the old 120-game baseline at start 4 (full detail further down).

| | start 0 (`v2_s0`, 100 games) | start 4 (`v2_base`, 120 games) |
|---|---|---|
| games finished | 100 / 100, no stalls, no page or game errors | 120 / 120, no errors |
| rounds | mean 10.9, median 11 (10–90%: 9–13), histogram 7:1 8:4 9:15 10:21 11:25 12:16 13:13 14:5 | mean 7.2, median 7 (5–9) |
| close finish | runner-up within 1 fame 46%, within 2 fame 75%; winner − last 5.2 | 53% / 79%; 4.5 |
| win share by seat | 17% 27% 35% 21% | 24% 24% 23% 28% |
| fame / game (all teams) | cards +14.3, fight wins +11.3, host +10.5, cards −3.2, Fan Favourite +2.7, Grand Final +2.4 | cards +11.0, wins +7.2, host +6.7, cards −4.3, GF +1.5, FF +1.3 |
| **fights vs net Intrigue fame** | fights + host + Fan Favourite + Grand Final 26.9 vs net cards 11.0: **71% from fights** (target ≥ 60%) | 16.7 vs 6.7: 71% |
| Intrigue | 142 cards drawn / game (106% of the 134-card deck: the deck is reshuffled in long games), 13.2 attacks / game, 66% land, 4.6 Security Bot rolls, 49 cards cashed (59 Cr) | 93 drawn (70%), 16.3 attacks, 74% land, 10.9 cashed |
| credits | 12.4 Cr held per team at Upkeep; Market 106 Cr / game, bets 29 Cr, fight cards 10.9 Cr, repairs 0.6 Cr | 9.7; 73, 18, 6.7, 0.2 |
| fights | 10.6 / game: duel 54%, double 27%, 2v2 18%; 70 s average, 15% to the judges | 6.8 / game; 69 s, 12% |
| repairs | 1.4 per team per Upkeep: crew 1.1, free 0.4, credits 0.0; drive 36% / weapon 27% / body 37% | 1.3 (1.0, 0.4, 0.0) |
| crew vs damage | 4.2 crew per team vs 1.6 damaged zones; 87% fixed (0.2 left) | 4.0 vs 1.5; 89% |
| damage carried into fights | drive 0%, weapon 0%, body 6% (5% broken) | 0%, 0%, 5% (3%) |
| fight cards | 0.9 won per fight (45% of offered), 1.2 Cr each; 89% of won cards played | 0.9 (45%), 1.1 Cr; 84% |
| robots bought / game (price) | L1 2.2 (4.7 Cr), L2 2.1 (5.2), L3 3.5 (5.2) | L1 2.2 (4.8), L2 2.1 (5.2), L3 1.9 (5.5) |
| parts / crew bought | 23.8 parts / game (2.3 Cr), 4.2 crew (2.4 Cr); 16% of lots unsold; 2.3 robots per team at the end | 15.6 (2.3), 2.3 (2.3); 13%; 2.0 |
| scraps / game | 2.1 by the host, 0.2 unpaid upkeep; a team had no robot 0.7 times | 1.8, 0.2; 0.6 |
| bookie | favourite wins 65% (1,055 fights), stronger side 66%; Brier 0.218 vs 0.250 | 68%, 69%; 0.203 |

Start 0 reads:
- **Games get 50% longer** (11 rounds instead of 7) and every team plays about 4 more fights. Close finishes drop a little (46% within 1).
- **Fights already lead**: 71% of net fame comes from fights, hosting, Fan Favourites and the Grand Final (the same share as at start 4).
  Card fame is +14.3 / −3.2: fewer smears land at the bottom of the table (a team at 0 can't lose fame, and the AI doesn't waste them).
- **Dead or near-dead Intrigue cards** (played per game, of ~2–3 drawn): Smudged Lens 0.0, Sugar in the Tank 0.0, Loose Bolts 0.0,
  Overclock 0.0, EMP the Garage 0.1, Mirror 0.0, Grand Melee 0.0, Unleash the House Robot 0.0, Kick When Down 0.2, Underdog Story 0.2,
  Hostile Buyout 0.2, Launch Party 0.2. They are cashed in instead. Fight cards: Remote Trigger is the least wanted (0.2 won / game of
  1.3 offered), then Target Overclock, Oil Canister, Chip Hack, Rattle Loose, Electromagnet (0.4 each).
- **Repairs are still not a choice** and robot prices still barely rise with level (4.7 → 5.2 Cr). Level 3 robots are bought most
  (3.5 / game) because rounds 5+ only deal level 3.

Start 4 check after the BAL change (`v2_s4chk`: `--start=4`, 40 games, seeds 1–40): rounds 7.1, close 50% / 63%, fame cards +11.7 /
−4.9, wins +7.4, host +6.8; repairs 1.3 (1.0 / 0.3 / 0.0); body damage carried 4%; fight cards 0.9 at 1.1 Cr; robots L1–L3 4.8 / 5.3 /
5.5 Cr; favourite wins 69%. No errors. Within noise of the old baseline (fewer games), so the defaults are unchanged. A deck and
deal check (same seed, `?bal={"startFame":4}` against the page before the change) gave identical Intrigue deck, lot deck, crew deck,
start crew, credits and card texts.

Repair switches (20 games each, start 0, seeds 1–20, against the same 20 seeds of `v2_s0`):

| | defaults | `engineersOnly` | `brokenTwo` |
|---|---|---|---|
| repairs / team / Upkeep (crew, free, Cr) | 1.4 (1.0, 0.4, 0.0) | 1.4 (1.0, 0.4, 0.0) | 1.2 (0.9, 0.3, 0.0) |
| damaged zones at Upkeep → left after | 1.5 → 0.2 (89% fixed) | 1.5 → 0.2 (89%) | 1.7 → 0.5 (72%) |
| fighters carrying body damage (broken) | 5% (4%) | 5% (5%) | 19% (17%) |
| repair Cr / game | 0.8 | 0.8 | 1.1 |
| rounds, close within 1 | 11.0, 60% | 11.0, 55% | 10.9, 55% |
| errors | none | none | none |

`engineersOnly` hardly moves anything yet: every team starts with 4 engineers (3 Mechanics + 1 Chief Engineer) and 6 of the 10 crew
cards are engineers, so non-engineer crew is rarely needed for 1.5 damaged zones. It needs fewer starting engineers to bite.
`brokenTwo` works as expected: fewer zones fixed, damage starts to carry into fights (mostly broken body zones, which the AI fixes last).

## Baseline at start fame 4 (120 games, start fame 4, win 12, AI v2, seeds 1–120)

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

## Balance rounds 3 and 4 (Kev's PC, 9 Nov; 6 variants × 100 games each)

Round 3 ran on the old AI (Kev's copy had not pulled the AI-spending change); round 4 is the same six variants with the spending AI.

| | round 3 (old AI) | round 4 (spending AI) |
|---|---|---|
| credits held per team at Upkeep | 10.1 | 9.3 |
| Market spend / game (all teams) | 144.5 | 156.4 |
| repairs paid with credits / game | about 2 (4.1 Cr) | 8.0 (15.9 Cr) |
| close finish (runner-up within 1 / 2 fame) | 46% / 83% | 56% / 82% |
| fame gap winner − last | 5.2 | 5.1 |
| lots unsold | 21% | 22% |

Base variant; the other variants move the same way. Credits at game end, all 2,400 teams of round 4: median 10, 90th percentile 22;
67 teams ended with 30+, mostly winners collecting in their last round. Credits still drift up from about 7 a team (round 2) to 11 (round 12).

Decisions (Kev, 9 Nov):
- Fight cards: keep 2 per fight. In round 4 the 2-card variants had the closest finishes (56–60% within 1 fame against 52–54% with 1 card); a 2 Cr minimum bid kills the auction (5% sold).
- Remote Trigger is replaced by **Floor Spikes** (offered 1.3 a game, bought 0.1). Engine check: a fight with Floor Spikes played blind on the rival at 15 s is won 58% against 56% without (160 fights; oil 57%). First tabletop games: offered 1.6, won 0.6, played 0.6 per game.
- Backing stays as it is (Kev: it will work out at a real table). Big Mallet stays as it is (about 20% hits, small sample).
- Level 3 robots sell below level 2 (6.5 against 7.6 Cr): left alone, an AI quirk; people set their own prices.
- Seats with shuffled ties, pooled over 500 games: 26 / 26 / 22 / 26% wins.
