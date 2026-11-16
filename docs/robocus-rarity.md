# ROBOCUS: part rarity (16 Nov 2026)

Kev: "a subtle mechanism that gives the parts a rarity like real loot feel, every time an item gets dropped it is assigned a rarity which boosts its power with linear steps and a real epic (or other name) category for 1% chances ... we need to balance this also, but some OPness for very rare items is ok".

Commit 31d7334 (on main since 16 Nov, with 6fb85dc: rarity diamonds, market card header).

## The rule

Every time a part card comes off the deck (the Market, a crate) it rolls a tier:

| Tier | Chance | Strength | Shown as | Measured |
|---|---|---|---|---|
| Standard | 62% | x1 | the part's own value | |
| Tuned | 24% | x1.3 | +¼ level | about +0.2 |
| Race-spec | 10% | x1.6 | +½ level | about +0.4 |
| Works | 3% | x1.9 | +¾ level | about +0.55 |
| Masterwork | 1% | x2.8 | +1 level | about +0.9 |

- Names avoid "epic" and "legendary", which the game already uses (epic combos, legendary parts).
- Tiers 1 to 3 are equal steps of +0.3; the 1% tier jumps.
- The tier stays with the card, the robot it is fitted on and the Stash. A card that goes back into the deck (unsold, botched) loses it and rolls again.
- Legendary parts roll too. Tuning chips do not.
- Strength = what the part does: a drone's or module's numbers (damage, healing, HP, stun and scramble time, wall time, push), and for stat parts and legendaries the bonus over 1 (Weapon overhaul x1.29 becomes x1.38 Tuned, x1.81 Masterwork).

## Where in the code

- `tools/damage-lab/lineup.js` (copied to src2): `RAR_Q`, `build(name, parts, rar)`, `spec.partQ`.
- `tools/damage-lab/engine.js`: `pq`, `pkQ`, `pkR`; the jammer drone carries its tier in `E.jamQ`.
- `prototypes/tabletop-2.html`: `RAR` (names, colours, chances, levels), `rollRar`, lot ids `p_<part>~<tier>`, `r.rar[part] = tier`, `rarStr` (the odds model counts a tier as its levels), `partValue` (+1/+2/+3/+6 Cr for the AI and the bank), market tile header in the tier's colour, a glow on Works and Masterwork, ▲ marks on the robot's work order.
- Switches: `BAL.rarity = { on: false }` turns it off; `BAL.rarity.odds = [62, 24, 10, 3, 1]`.
- Known shortcut: two copies of the same part on one robot share the newest copy's tier.

## The measurement

`tools/damage-lab/rarity-test.js`: every non-chip part (24) at every tier on 13 robots (levels 0-3) against 2 robots a level up, same seed for every tier; 3,146 fights a run, two runs with different multipliers.

| Multiplier | Wins (standard copy in that run) | Gain in levels |
|---|---|---|
| x1.2 | 49% (48%) | +0.1 |
| x1.3 | 46% (45%) | +0.1 |
| x1.4 | 50% (48%) | +0.2 |
| x1.6 | 57% (48%), 53% (45%) | +0.6, +0.6 |
| x1.9 | 53% (45%) | +0.6 |
| x2.2 | 60% (48%) | +0.9 |
| x2.8 | 58% (45%) | +0.9 |

- Each number is good to about ±0.2 of a level (624 fights a tier).
- The gain flattens above about x2: a part can only do so much. So the 1% copy is about a level better, not more, even at x2.8.
- By kind the 1% copy is strongest on legendaries (a Masterwork legendary measured about +1.9 levels on 78 fights) and on modules.
- Not measured: whole games with rarity on (how often a rare copy decides a game, what it does to prices), and very long stuns (a Masterwork EMP stuns for about 5 s every 10 s).

## Shown to players (16 Nov 2026, T11)

- A part card's header shows the tier name in its colour and four diamonds (◇◇◇◇ standard ... ◆◆◆◆ Masterwork); Works and Masterwork cards glow in the Market.
- Hover the header: a short tip (tier, what it adds, how rare). Click it: the **rarity ladder** overlay: the card as a loot tag, what this copy adds (in levels, its power, card value and bank price, next to a standard copy), the five tiers with their chances (read from `BAL.rarity.odds`) and the rule (rolled off the deck, stays with the card, rolls again back in the deck, legendaries roll, chips don't).
- Also opens from the parts lines of your own robots, the Stash and part names in the log. Display only: nothing in it is synced or changes the game.
