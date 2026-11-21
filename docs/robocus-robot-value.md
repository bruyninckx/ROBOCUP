# A robot's value in credits (T44, 21 Nov 2026)

Kev, 21 Nov: "I would like it [Hostile Buyout] to only target robots. But then we should have a clear visual on robot value as
well, that was a problem last time". Asked what the value should show: "A price in credits: one number per robot, from its level,
parts and damage: what it is worth in a trade, an offer or a buyout". Background: in a playtest he got Snapjaw through an AI offer he
did not understand, and his friends could not tell what a robot was worth.

Display only in T44. No price, rule, AI choice or network message changed (since T45 Hostile Buyout and Fire Sale use it as a price: see the end). Every screen works the number out from the game state it
already has, so every player sees the same number for the same robot. Switch: `BAL.showValue` (default true; false hides it all).

## The formula (`robotValue(robot)` in prototypes/tabletop-2.html)

| Piece | Credits | Why |
|---|---|---|
| Level | 1 + 2 × level (starter 1, L1 3, L2 5, L3 7, L4 9) | the level part of the AI's own trade price (`robotWorth`) and a New Robot lot's own `value` |
| Each fitted part (legendary too) | its bank price: half its Market value, at least 1 (rarity counts) | the number on the Stash's 🏦 button; the AI pays about this in trades (see below) |
| Fan tokens | +1 each (up to the Fan Favourite count) | each pays 2 Cr appearance money when the robot fights |
| Fan Favourite | +2 more | its +1 fame goes with it to the new owner |
| Damage | −1 per repair action it needs (damaged zone 1, broken zone 2) | the repair a buyer inherits (2 Cr an action once crew is used up) |
| Out longer (a rival's Rogue Firmware) | −1 per extra round it is out | it misses fights |
| Floor | at least 1 Cr | |

Ordinary resting (after a fight, a buyout, Crunch Week) changes nothing: the robot is back at the next Upkeep. Damage is read only
through the game's helpers (`zonesOf`, `repairCost`), so the wear task (T41) changing how damage is stored does not touch this.

`robotValue(r, forTeam)`: `forTeam` only decides whose Fan Favourite rule counts (Apex Media: 2 tokens); the screens use the owner's.

## Value against what robots really sold for

48 AI games (`node tools/game-sim.js --page=prototypes/tabletop-2.html --games=12 --par=2 --seed0=1/13/25/37`; 47 finished, 1
stalled late, 0 page errors). `tools/game-sim.js` records each robot's value at the moment it changes hands; `node
tools/robot-value-report.js --halfParts` makes the table (these runs were recorded while parts still counted at full Market value;
`--halfParts` recounts each part line at its bank price, as the game does now). ± is one standard error.

| What | Robots | Value (mean) | Paid (mean) | Paid − value | Typical miss |
|---|---|---|---|---|---|
| AI-to-AI robot sales, all | 94 | 4.9 | 5.2 ± 0.3 | +0.3 ± 0.2 | 1.6 |
| · level 0 | 37 | 3.4 | 3.5 ± 0.3 | +0.1 ± 0.3 | 1.1 |
| · level 1 | 20 | 4.7 | 4.8 ± 0.5 | +0.1 ± 0.5 | 1.8 |
| · level 2 | 22 | 6.0 | 6.6 ± 0.5 | +0.7 ± 0.5 | 2.0 |
| · level 3 | 8 | 7.1 | 8.1 ± 0.7 | +1.0 ± 0.7 | 2.0 |
| · level 4 | 7 | 7.0 | 6.9 ± 1.9 | −0.1 ± 1.1 | 2.4 |
| Market robot lots (new robots), all | 424 | 6.4 | 7.8 ± 0.1 | +1.4 ± 0.1 | 2.3 |
| · level 1 | 93 | 3 | 6.5 ± 0.2 | +3.5 ± 0.2 | 3.6 |
| · level 2 | 96 | 5 | 7.3 ± 0.2 | +2.3 ± 0.2 | 2.3 |
| · level 3 | 82 | 7 | 7.7 ± 0.3 | +0.7 ± 0.3 | 2.1 |
| · level 4 | 153 | 9 | 9.0 ± 0.2 | 0.0 ± 0.2 | 1.6 |
| · rounds 1-2 | 97 | 3.3 | 6.7 ± 0.2 | +3.4 ± 0.2 | 3.4 |
| · rounds 3-4 | 94 | 5.2 | 7.4 ± 0.2 | +2.2 ± 0.2 | 2.3 |
| · rounds 5-6 | 103 | 7.6 | 8.3 ± 0.2 | +0.7 ± 0.2 | 1.9 |
| · rounds 7-9 | 61 | 8.5 | 8.9 ± 0.3 | +0.4 ± 0.3 | 1.9 |
| · rounds 10+ | 69 | 8.8 | 8.2 ± 0.3 | −0.6 ± 0.3 | 1.6 |
| Hostile Buyout (flat 4 Cr) | 3 | 5.7 | 4 | −1.7 | 1.7 |
| Trade-in (scrap money 1 + level; value without its parts, they stay in the Stash) | 45 | 3.0 | 1.9 ± 0.2 | −1.1 ± 0.2 | 1.3 |

Unsold robot lots: 8 (6 level 4 under the 5 Cr minimum, 1 level 1, 1 level 3). No Fire Sale and no AI-to-person trade in these
games (all four seats were AI); the AI's robot offer to a person uses the same price rule as its AI-to-AI sale (below), so the
sales rows stand for it.

Of the 94 sales, 40 had parts, 32 damage, 56 Fan tokens. The first try counted parts at their full Market value (the number in the
rarity overlay): sales were then 1.3 ± 0.4 Cr under the value overall and 4-8 Cr under it for robots with 2-3 parts (the typical
miss 2.7). Counting each part at its bank price brings the bias to +0.3 and the typical miss to 1.6. Fan tokens and damage at −1 an
action fit as they are (counting damage at −2, or leaving Fan tokens out, made the fit worse or no better).

**Confirmation with the final formula** (24 more games, seeds 101-124, recorded with parts at their bank price, no recount; 23
finished, 1 stalled late, 0 page errors; `node tools/robot-value-report.js t44f`):

| What | Robots | Value | Paid | Paid − value | Typical miss |
|---|---|---|---|---|---|
| AI-to-AI robot sales | 55 | 4.2 | 4.6 ± 0.4 | +0.4 ± 0.3 | 1.9 |
| Market robot lots | 214 | 6.5 | 7.5 ± 0.1 | +1.0 ± 0.2 | 2.1 |
| · level 1 / 2 / 3 / 4 | 43 / 48 / 44 / 79 | 3 / 5 / 7 / 9 | 6.5 / 7.2 / 7.1 / 8.6 | +3.5 / +2.2 / +0.1 / −0.4 | |
| Trade-in (without parts) | 30 | 3.7 | 2.2 ± 0.3 | −1.5 ± 0.4 | 1.6 |
| Hostile Buyout | 2 | 6 (1 and 11) | 4 | | |

**Reading it.** In trades, the number on the chip is what the AI teams pay, give or take 1-2 Cr. A new robot in the Market sells
above it early in the game: in rounds 1-4 every team still needs robots and has spare credits, so a level 1 robot goes for about
6.5 Cr against a value of 3. From round 5 on the Market price is close to the value, and level 4 robots sell right at it.

## Where the AI's own pricing disagrees with itself (not changed in this task)

- **Market bids vs trades.** Bids for a robot lot come from `robotWant`: its strength (`3.64 + 2.2 × strength`), the odds against
  this team's rivals, a bonus when it would be the team's best robot, +3 / +1 when the team has 0 / 1 robots, and with a full garage
  minus half the robot it would scrap. Trades use `robotWorth`: `1 + 2 × level + 1.5 per part + 3 legendary + (odds − 50%) × 8 −
  1.5 × damage (strength) + 2 if it is the team's only robot`. The two disagree most for level 1-2 robots (bids 6.5-7.3 Cr, trade
  worth 3-5).
- **Parts.** In a trade a fitted part counts 1.5 Cr (legendary 3) whatever its rarity; the same part in a Stash counts
  `partWorth` = its full Market value (2-3, legendary 5, +1/+2/+3/+6 by rarity) plus what it does for the odds. So a part is worth
  more to the AI on a shelf than on a robot.
- **Trade-in.** Scrap money is 1 + level (half the level part of `robotWorth`); `robotWant` counts the scrapped robot at half its
  strength value.
- **AI sells a spare robot** at `max(2, min(worth to the buyer, worth to the seller + 1))`: a buyer down to one robot gets the
  +2 "only robot" bonus, so it pays a little above the seller's own worth.
- **Hostile Buyout** was a flat 4 Cr; **Fire Sale** sold the weakest robot to the bank for a flat 2 Cr, while the card text said
  "at value +1 each". Both read the value since T45 (below).
- **Spare or scrap:** an AI that pleads to spare its robot offers up to `1 + 2 × Fan tokens` Cr, capped by its own `robotWorth`.

## Where it is shown

- **Robot cards:** your robots (left): a gold chip "◉ 6 Cr" right of the odds chip (the odds chip gives up the room). Rival tickets
  (top): the same chip right of the short odds chip on each robot. A robot lot in the Market: the chip top right of the lot, above
  the bid stepper. Hover any chip: the sum line by line (level, each part, Fan tokens, each damaged zone) and how the value works.
- **Questions in the note and the box:** an AI robot offer says "(starter, Flail, damage: no damage, worth 4 Cr) for 5 Cr";
  Hostile Buyout: "wants to buy your Wrecker (worth 3 Cr) for 4 Cr"; spare or scrap (the question, the plead / push deal panel and
  the host's judgment): the losing robot's worth; Museum Donation: each robot's button has "◉ N Cr" as its quiet hint; can't pay
  upkeep: "👎 Scrap Wrecker (◉ 3 Cr)"; trade-in: "♻️ Wrecker · L1 · 2 Cr (◉ worth 3 Cr) · …" (what you get, then what it is worth).
  Every "worth N Cr" has the same hover.
- **The trade panel:** every robot chip has "◉ N" beside its name, and its hover adds the sum. A robot in a trade offer to you
  ("Trade offer from …") is named with its worth.
- **Stash:** a part's hover says what it adds to a robot once fitted (its bank price, half its Market value), the same number as
  its 🏦 button.
- **Not shown:** the power map and the odds overview. Both are already dense grids of odds; a credit number there would compete
  with what they are for. The robot cards next to them carry the chip.
- **Fit:** 1600x900 and 1280x720, nothing clipped (tools/mp-scenario/robot-value.js checks every chip is on screen). The hover text
  is fully escaped inside the attribute, so `noteFits()` sees no extra `<br>` and only the short "(worth N Cr)" as text: every
  question lands where it did (tools/mp-scenario/questions-note.js passes unchanged).

## Checks

- `node tools/mp-scenario/robot-value.js [shots]`: both sizes: a chip for every robot on the table and the Market lot, all on
  screen; the sum adds up; the hover shows it; the trade panel's robots carry it; the AI offer and Hostile Buyout are in the note
  with "worth N Cr"; `?bal={"showValue":false}` shows no chip.
- See PROGRESS.md (21 Nov, T44) for the run results.

## Open questions for Kev

1. (Answered 21 Nov, T45: "ok, it should cost something to take a big robot": the value, at least 4.) Should Hostile Buyout's price follow the value later (for example the value, at least 4)? Today it is a flat 4 Cr: a buyer
   gets a 6 Cr robot for 4, and a damaged starter costs more than it is worth.
2. Is the value the same for every viewer (now), or should it be "worth to you" (your odds against your rivals, whether you need a
   robot)? The AI's own prices are per team; one shared number is easier to read at the table.
3. New robots sell 2-3.5 Cr above the value in rounds 1-4. Keep the value as the trade price (now), or show a separate Market
   estimate on lots early in the game?
4. (Answered 21 Nov, T45: "pay value +1".) Fire Sale's card says "at value +1 each" but the game pays a flat 2 Cr for the weakest robot. Should Fire Sale pay the value + 1
   now that there is one?
5. Should the AI price parts on a robot the same way as in a Stash? (Not changed: it would change AI trades.)

## T45 (21 Nov 2026): Hostile Buyout and Fire Sale use the value as a price

Kev, asked whether Hostile Buyout's price should follow the value with 4 as the minimum: "ok, it should cost something to take a
big robot". Asked whether Fire Sale should pay value + 1 or the text be fixed: "pay value +1". Branch `claude/value-prices`.

**Hostile Buyout.** "Target sells you its weakest robot for its value (at least 4 credits), or loses 1 fame." (was "for 4
credits"). The price is `buyPrice(T) = max(BAL.buyout.min (4), robotValue(weakest robot))`, worked out when the card resolves.
Still the target's weakest robot (the buyer does not choose), refusing still costs 1 fame, no answer in 20 s still = Refuse.
- Play condition: a free bay, a target with 2+ robots, and the price in hand. Short: "Hostile Buyout costs 9 Cr here: Rust
  Rivets's weakest robot, Popcorn, is worth 9 Cr (the price is its value, at least 4). You have 3 Cr."
- The question: "… wants to buy your Popcorn (worth 9 Cr) for 9 Cr." or "(worth 1 Cr) for 4 Cr (the 4 Cr minimum)"; the button
  "Sell it (+9 Cr)". The log: "buys Popcorn from Steel Bolts for 9 Cr (its value)" / "refuses the buyout (Popcorn for 6 Cr) and
  loses 1 fame". The reaction window adds "Now: Popcorn for 9 Cr." The card in your hand: its hover lists the price at each rival
  with 2+ robots. If the buyer can no longer pay when it resolves, it fizzles (nothing happens).
- Scalper Bot: line "Bought every unit at launch. Full price, no refunds." (was "Four credits each, no refunds."); the price tag
  in its drawing says "4+ Cr".
- AI target (`aiSellsBuyout`): sells when price + 1 fame (its own fame price, ×1.6 near the win; 0 if its fame is at the floor)
  ≥ `robotWorth` (what the robot is worth to it). Before: sold when it had 3 robots or 2 fame or less.
- AI buyer (`aiCardValue`): chance the target sells (1 or 0 for an AI target by the rule above, ½ for a person) × (the robot's
  worth to the buyer − the price) + chance it refuses × the fame hit. Before: a flat 2.
- `BAL.buyout = { min: 4, value: true }` (`value: false`: the flat 4 again). Test only: `--aip='{"hbFlat":2}'` gives the AI the
  old flat card value, to see many buyouts.

**Fire Sale** (0 copies: not in the deck, players do not see it). "Any time: sell your robots, crew or parts to the bank at
value +1 each." now does that. You tick (a box with checkboxes) any of your robots, crew members and Stash parts; each pays its
value + 1: a robot its ◉ value, a Stash part its bank price (the 🏦 button, half its Market value), a crew member its card value
`CREW[k].value` (1 or 2; not shown anywhere on screen; Headhunter Fee doubles the same number). You keep at least one robot (if
you tick them all, the strongest stays). No answer in time: nothing sold. The AI plays it only for spare things: every Stash part,
a third robot it rates under the price, a second copy of a crew card (not Mechanic or Chief). Before: the weakest robot for a flat 2.

**Money pump?** Not a loop: every sale needs a Fire Sale card, it is one card for one batch, and the deck has 0 copies (1-2 if it
comes back). But a robot can be bought and sold for more: over 1,479 Market robot lots in this task's 160 bot games, value + 1 at
the moment of the sale beat the price paid for 35% of them (L1 6 of 313, L2 28 of 328, L3 168 of 311, L4 322 of 527), by 2.1 Cr on
average where it did, at most 7 (a level 3 robot won cheap); over all lots −0.4 Cr. Parts pay 1 more than the Stash's own 🏦 button.
So one Fire Sale late in the game is worth a few credits more than its sale value; it cannot run away.

### Measured (bot games, `tools/game-sim.js`, seeds 1-40, `--par=2`, paired by seed; `node tools/buyout-report.js <tag>`)

Stalled games were re-run alone (base seed 39, new seeds 11 and 40, new 6-copy seed 38: all stalled in round 1 under load; all
finished alone). ± is one standard error; "diff" is new − old on the same seed.

| Run (40 games each) | Rounds | Fame / round (4 teams) | End credits / team | Hostile Buyout played / game |
|---|---|---|---|---|
| Normal deck, old (flat 4) | 11.80 ± 0.21 | 3.16 ± 0.06 | 9.74 ± 0.41 | 0.25 ± 0.07 |
| Normal deck, new | 12.05 ± 0.25 | 3.13 ± 0.06 | 9.63 ± 0.43 | 0.00 |
| · diff | +0.25 ± 0.19 | −0.03 ± 0.04 | −0.11 ± 0.14 | −0.25 ± 0.07 |
| 6 copies, old | 11.75 ± 0.27 | 3.31 ± 0.06 | 9.09 ± 0.38 | 0.80 ± 0.20 |
| 6 copies, new | 11.63 ± 0.24 | 3.31 ± 0.06 | 9.15 ± 0.36 | 0.07 ± 0.04 |
| · diff | −0.13 ± 0.23 | 0.00 ± 0.04 | +0.06 ± 0.32 | −0.72 ± 0.20 |
| 6 copies, new, AI with the old flat card value (test) | 11.60 ± 0.24 | 3.35 ± 0.06 | 9.21 ± 0.41 | 0.57 ± 0.15 |

Buyouts that resolved (sold / refused, price against value at that moment):

| Run | Resolved | Sold | Refused | Price paid | Value | Price − value |
|---|---|---|---|---|---|---|
| Normal deck, old | 5 | 3 | 2 | 4 | 5.7 | −1.7 |
| 6 copies, old | 23 | 14 (61%) | 9 | 4 | 4.3 ± 1.0 | −0.3 ± 1.0 |
| 6 copies, new | 2 | 2 | 0 | 4 and 6 | 3 and 6 | |
| 6 copies, new, flat AI value (test) | 17 | 17 (100%) | 0 | 4.8 ± 0.4 (4 ×12, 5 ×2, 6, 8, 9) | 3.1 ± 0.7 | +1.6 ± 0.4 |

**Reading it.** Game length, fame per round and credits do not move (all diffs inside their ±). What changes is the card: the AI
almost never plays Hostile Buyout now (0 in 40 normal games, was 1 in 4 games). An AI target sells whenever the price plus 1 fame
covers the robot (its own price for 1 fame is high, about 6 Cr), so an AI buyer only gains when it rates the robot above its value,
which is rare; and a refusal (the fame hit) almost never happens. When the AI is made to play it anyway, every buyout sells, 10 of 17
at the 4 Cr minimum (damaged or bare starters worth 1-3), the rest at the value (up to 9). Against a person the card still works as
before: they choose between the price and 1 fame. Fire Sale with 2 copies (20 games, test only): played 0.10 a game, 5 things
sold (3 parts, 2 robots), each paid value + 1, 11.5 Cr per play; game length 11.5 ± 0.4 rounds, no page errors.
