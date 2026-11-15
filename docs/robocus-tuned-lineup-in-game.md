# ROBOCUS: the tuned lineup in the game, and are there too many counters? (15 Nov 2026)

Kev (15 Nov): "would the amount of counters be too much I'm wondering now" … "set it up".

## 1. What changed in the game

The tabletop (`prototypes/tabletop-2.html`) now plays the tuned 33-robot lineup.

- **Robots** (`tools/damage-lab/lineup.js`, copied to `src2/`):
  - The 33 robots with their tuned power dial: damage x p and HP x p, with no per-preset damage knob (`TUNED`).
  - Level sizes 9 / 5 / 5 / 6, plus 8 at level 4.
  - The old tables stay in the file as `ROBOTS_2_0` / `ROBOTS4_2_0`.
  - Ten new market descriptions.
- **Strength model** (`src2/repair.js`):
  - Under the tuned lineup every robot of a level counts as exactly that level. There is no extra grade bonus any more, because the grade is what makes it the level.
  - Level 4 is a full step (it was level 3 + 0.27).
  - Armour costs (body damage) come from the re-measured numbers.
- **Matchup table** (`tools/damage-lab/matrix-data.json` → `src2/matrix.js`):
  - Re-run on the tuned lineup: every pair 20 fights on open floor (10,560 fights).
  - Same-level pairs in the four arenas (7,920 fights).
- **Bookie tables:** STYLE, HITTER, FFA_FIT, TEAM_FIT (now empty), ARENA_FIT, PART_FIT, EPIC (6 combos), TRIPLE (3 giant-slayer builds) and BODY_COST are all from `docs/robocus-tuned-lineup-tags.md`.
  - Epic names: Whiplash (Thwacker + Tow cable), Air Support (Buzzkill + Gun drone), Tug of War (Buzzkill + Tow cable), Launch Pad (Thumper + Pop-up flipper), Drill & Drip (Corkscrew + Field hospital), Flip & Maul (Mauler + Pop-up flipper).
  - Giant-slayer builds against kitted level 3-4 robots: Yo-yo 57%, Pincher 31%, Angler 31%.
- **Counter tags:** 🎯 Counter pick / ⚠️ Bad matchup now only show for matchups 40+ points off the level gap (`BAL.counterTag`, was 0.25). The odds still use the whole table.
- **New switch `BAL.counterTrust`** (default 1, no change): how far the bookie trusts the matchup table over the level gap. See section 3.

## 2. Whole games: old lineup vs tuned lineup

`tools/game-sim.js`, 120 games each, AI v2, the same seeds. The old lineup ran on the commit before the switch. Report: `node tools/counter-report.js <tag> <matrix-data.json>` (new) and `tools/game-sim-report.js`.

| Duels in real games | Old lineup | Tuned lineup | Tuned + counterTrust 0.65 |
|---|---|---|---|
| Duels (with table data) | 789 | 800 | 788 |
| Counter matchup, 25+ points off the level gap | 28% | 35% | 34% |
| Big counter, 40+ (gets a tag now) | 9% | 10% | 10% |
| Different levels: the lower level wins | 32% | 32% | 33% |
| Different levels: the lower level is the table favourite | 18% | **13%** | 12% |
| Higher level wins, 1 / 2 / 3 / 4 levels apart | 65 / 65 / 80 / 88% | 67 / 70 / 68 / 74% | 61 / 75 / 77 / 74% |
| Bookie favourite wins | 76% | 78% | 78% |
| Counter duels: underdog's odds / how often it won | 17% / 24% | 19% / **31%** | **24% / 27%** |
| Close finish (runner-up within 1 fame) | 36% | 46% | **51%** |
| Win share by seat | 25 23 25 28% | 24 19 30 27% | 24 24 27 25% |
| Fights decided by the judges | 5% | **15%** | 14% |
| Average fight | 55 s | 67 s | 65 s |

**Answer to Kev's question: no, counters are not too much.**

1. **Upsets are unchanged.** The lower level wins 32% of mixed-level duels, the same as with the old lineup.
2. **Upsets are tied to counters.** In a counter matchup the lower level wins 43%; otherwise 27%.
3. **The level badge is wrong less often than before.** The lower-level robot is the favourite in 13% of mixed duels (18% before).
4. **Tags are rarer.** With the 40+ rule, about 1 duel in 10 shows a counter tag.
5. **Levels still mean something in a game.** The higher level wins about 2 duels in 3 at any gap. In whole games, parts and damage flatten the bigger gaps compared with the lab: 70% two levels apart, where the lab gives 83%.

## 3. The thing to fix: the bookie trusts counters too much

In real games counters hold at about **two thirds** of what the table says.

- In the 40+ counter duels the table says the counter wins 87%; it won 68%. The old lineup was the same (86% → 69%).
- The reasons are parts, damage and table noise (20 fights a pair).
- So the bookie's underdog in a counter duel won 31% at odds of 19%. Backing the underdog of a counter is a free edge.

`BAL.counterTrust = 0.65` pulls the table two thirds of the way. The best fit on both lineups was 0.6–0.75.

- The underdog then gets 24% and wins 27%.
- Close finishes went from 46% to 51%, and the seat spread narrowed.
- Nothing else moved (game length, spend, fame sources).

**Suggestion:** make 0.65 the default. It is a bookie (odds) change only, the same for every player.

## 4. Other things the runs show

- **More fights go to the judges (15%, was 5%) and fights are 12 s longer.** Several tuned robots are grinders (Gaucho 91 s, Thwacker 88 s, Pincher 87 s, Whaler 84 s). If that feels slow at the table, the time limit or the Grinder robots' power can come down.
- **Level prices barely follow level:** 6.5 / 7.5 / 7.4 / 8.9 Cr for levels 1-4, the same as with the old lineup. That is an economy question, not a lineup one.
- **Level 2 is the softest level** (60% vs level 1 in the lab). Its game win rate moves a lot from run to run (51% and 69%), so it needs more games before acting on it.

## 5. Kev decides

- counterTrust 0.65 as the default?
- Do the longer fights / judges at 15% matter?
