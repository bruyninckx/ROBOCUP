# ROBOCUS garage: swap parts in Upkeep (T38, 21 Nov 2026)

Kev, 21 Nov: "modify the upkeep phase to also allow swapping of parts onto other robots for a small fee. To make this work, when a
robot get scrapped it should also still give the parts back (perhaps damaged as well?) into the stash (stash limit should perhaps be
removed). People can play around with swapping items and a sort of garage bill will be displayed which they can lock in".
His answers: fee "1 coin for removal and 1 coin for install, maybe 2 for legandaries", "4 in total" for a legendary move; on piling
everything onto one robot: "I would make swapping cost money and pay for removing + pay for putting an item on"; "stash limit gone";
parts from a scrapped robot: "perhaps depends on what was damaged?" (a part from a broken zone comes back broken and needs a repair,
the rest whole); a part you just won still goes on free, a Stash part pays 1 to go on: "yes"; "should be seemless for people with no
parts indeed. I'm also thinking about a nice visual about the upkeep with a garage and your robots in the arena area".

Branch `claude/garage`, page `prototypes/tabletop-2.html`, BUILD `2026-11-21o`.

## The rules as built

1. **Upkeep garage.** A team may take a fitted part off a robot into its Stash (1 Cr; legendary 2) and put a Stash part on a robot
   that can take it (1 Cr; legendary 2). Robot to robot pays both (2 Cr; legendary 4). Slot rules as always (`canFit`: 2 part slots,
   1 legendary slot, 3 drones, 1 tuning chip). The rarity tier travels with the part.
2. **The bill.** Moves are a draft on your own screen. The bill shows each move (part, from → to, fee), the total and the credits after;
   each robot's odds vs the field and its value chip are drawn as drafted. ✕ undoes a line, Reset clears it. Nothing is paid or moved
   until you lock it in: **🔒 Lock in** (clipboard or note), or **Done**, which locks the bill first and then finishes Upkeep (its label
   says so: "🔒 Pay 4 Cr, Done →"). Not enough credits: the bill says so; Lock and Done are disabled until you undo or Reset.
3. **A part you win in the Market still goes on free** (T12 untouched). A Stash part pays its install fee also in the Market (the Stash
   card's Fit says "Fit 1 Cr").
4. **Scrapped robots give their parts back** to the owner's Stash: host scrap (Fate), can't pay upkeep, trade-in, Museum Donation. A
   part comes back **broken** when the zone it belongs to is broken at that moment. Zones of the part cards: Weapon overhaul and
   Overdrive → Weapon; Power kit (motors) → Drive; drones, modules, tuning chips, hull and armour kits and the legendaries → Body (the
   Body covers "chassis, armour, chip, module, drones" in `Repair2.ZONES`). A robot sold, traded, bought out or Fire-Sold keeps its
   parts. Vulture Salvage still gets +2 Cr per scrap.
5. **The same in the garage:** a part taken off a robot whose zone for it is broken comes off broken (otherwise taking a part off would
   be a free repair). It can only go to the Stash.
6. **Broken parts** can't be fitted. 1 repair action in Upkeep fixes one (free actions, crew, then 2 Cr, as a zone): a 🔧 button in the
   note, on the rack and on the Stash card. A broken part sells to the bank for half its bank price (at least 1) and can be traded.
7. **No Stash limit** (was 4): nothing is trimmed or sold because the Stash is full. The Stash card scrolls inside itself.
8. **Seamless:** a player with nothing to move (no part on 2+ robots, empty Stash) and nothing to repair sees no bill and goes on by
   itself after 0.6 s, as before. A player with parts to move but nothing to repair goes on by itself after 8 s (`idleMs`) unless they
   click in the garage; the note counts down. A player with repairs presses Done as before.
   **Changed 22 Nov (T56, Kev: "we should have to click here I think, there are many options"):** a person's Upkeep never ends by
   itself: no 0.6 s skip, no 8 s count. It ends with Done, which says "Nothing to repair · Done → Intrigue" when there is nothing to
   repair. `BAL.upkeepAuto: true` brings back the old way above (`idleMs` then counts again). AI teams: unchanged.
9. **Online:** the draft is local. Lock sends ONE action (`garageLock`, the bill and a fingerprint of the garage it was drafted on);
   the host checks every line again (phase, not done yet, same garage, slots, ownership, credits) and applies all of it or nothing; a
   refusal is a line in that player's log. The other screens see the change only then, with a log line per move ("🔧 Rust Rivets moves
   Tow cable from Snapjaw to Mincer (2 Cr)."). Host Skip, a dropped seat or the auto-advance: an unlocked draft is simply gone.
   Nothing new is synced except the broken parts in the Stash (a broken part is its own lot id, `<id>~b`). Old saves load as they are.
10. **AI:** at Upkeep (host, after its repairs, no dice) an AI team repairs a broken Stash part a robot could use, then makes the best
    move while its value beats the fee (at most 3 bills, keeping 2 Cr): 15 Cr per 1.0 of odds on the robot it expects to send (its
    strongest ready robot), half that on its other robots, plus a Stash part's Market value over its bank price when it is put to use.
    It keeps its Stash at 4 parts at most (selling the least useful to the bank, as the old limit did).

Switches: `BAL.garage = { on: true, feeOff: 1, feeOn: 1, legOff: 2, legOn: 2, stashLimit: 0, partsBack: true, idleMs: 8000 }` (`idleMs` only with `BAL.upkeepAuto: true`, T56).
`on: false` = no garage (Stash fits free, the old Upkeep note; with `stashLimit: 4` and `partsBack: false` it plays as before T38).

## The look

Upkeep, the pit: a small fame race across the top; your robots side by side on a workshop floor (hazard-taped bays, the game's own
top-down portrait drawn as drafted, name, level, odds chip with "a → b" when the bill changes it, the gold value chip, the three repair
zones clickable as on the card), under each robot its sockets (2 part slots, the legendary slot) holding part tiles (T39 drawing or the
part's icon, name, rarity diamonds; broken ones red; moved ones dashed blue with NEW); the parts rack (your Stash) along the bottom;
the bill on a clipboard on the right. Click-then-click (no drag). The yellow note keeps text, Done and repairs, and mirrors the bill
(total, credits after, Reset, Lock in). After Done the garage stays on screen, closed. Screenshots (not in the repo): /home/claude/t38-shots.

## Choices made where the brief left room

- **Done locks the bill** (and there is also a Lock in on the clipboard and in the note): one click for the usual case, and no accident
  because Done's label carries the amount ("🔒 Pay 4 Cr, Done →"); Done is disabled while the bill can't be paid.
- **Repairs stay immediate** (T22, as before), not on the bill: repairs are paid in actions and exhausted crew, and the note already
  shows their cost; a bill mixing actions and credits would be harder to read. Repairing a broken Stash part is immediate too.
- **Zones of the part cards** (above): there was no mapping for part cards (Repair2.zoneOfPart is for the robot's own pieces).
- **A part taken off a robot with that zone broken comes off broken** (rule 5): not in Kev's words, but without it moving a part
  would be a free repair of a broken part, and it matches "depends on what was damaged".
- **Swap**: clicking a part on a robot while another part is picked swaps the two (both lines go on the bill).
- **8 s auto-Done** for a player who could move parts but has nothing to repair (0 clicks, as before; before T38 they went on after 0.6 s).
- **The AI keeps at most 4 Stash parts** (it sells the least useful), so AI Stashes don't pile up now the limit is gone.
- `stashLimit`, `partsBack` and `on` keep the old code paths (trim prompt, free Stash fits) for comparison runs.

## Multiplayer and balance

- **Multiplayer:** everyone must be on this version (new actions `garageLock` and `repairPart`; an old screen would not know the
  `~b` broken lot ids). Nothing new in src2/net.js: the bill is one ordinary action, checked on the host. Drafts are never sent.
- **Balance:** a little more value survives a host scrap; AI teams recycle Stash parts; robot-to-robot moves are rare at these fees;
  the Market, the bookie and game length are unchanged within the ranges (length maybe +0.4 rounds).

## Numbers

All-AI bot games (tools/game-sim.js, 4 AI teams, seeds 101-160 both ways, --par=2): before = origin/main c1b5914 (no garage), after =
this branch before its rebase on T46/T47 (so both sides share the same base). 60 games each; 1 "before" game stalled (a timing stall
seen on main too) and is left out. ± = 95% range per game (per fight for the bookie rows); the two sides are separate runs on the same
seeds, so a difference counts only where the ranges clearly part. 0 page errors on both sides.

| | before (59 of 60 games, 1 stalled) | after (60 of 60) |
|---|---|---|
| rounds per game | 11.54 ± 0.42 | 11.93 ± 0.45 |
| fame per round (all teams) | 3.32 ± 0.10 | 3.25 ± 0.10 |
| close finish (winner ≤ 1 fame ahead) | 34% ± 12 | 27% ± 11 |
| garage moves per team per game | 0.00 ± 0.00 | 0.71 ± 0.19 |
|   of which robot → robot | 0.00 ± 0.00 | 0.00 ± 0.00 |
|   of which Stash → robot | 0.00 ± 0.00 | 0.68 ± 0.18 |
| garage fees per team per game (Cr) | 0.00 ± 0.00 | 0.83 ± 0.23 |
| Stash parts per team at the end | 0.64 ± 0.12 | 0.47 ± 0.12 |
| parts back from scraps per game | 0.00 ± 0.00 | 0.92 ± 0.36 |
|   of which broken | 0.00 ± 0.00 | 0.83 ± 0.34 |
| parts per robot (at fights) | 1.05 ± 0.03 | 1.11 ± 0.03 |
| parts on a team's top robot | 1.34 ± 0.04 | 1.42 ± 0.04 |
| parts on its other robots (mean) | 0.70 ± 0.04 | 0.76 ± 0.04 |
| top robot has 2 parts + legendary | 23% ± 2 | 25% ± 2 |
| Market spend on parts per team, rounds 1-4 (Cr) | 2.07 ± 0.25 | 2.06 ± 0.25 |
|   rounds 5-8 | 4.75 ± 0.31 | 4.60 ± 0.29 |
|   rounds 9+ | 4.16 ± 0.57 | 4.09 ± 0.46 |
| parts bought per game | 20.36 ± 0.92 | 19.97 ± 0.74 |
| host scraps per game | 2.37 ± 0.27 | 2.50 ± 0.30 |
| value a host scrap costs the victim (Cr) | 1.62 ± 0.25 | 1.27 ± 0.21 |
| parts on a host-scrapped robot | 0.32 ± 0.12 | 0.33 ± 0.12 |
| bookie favourite wins (fights) | 79% ± 3 | 80% ± 3 |
| Brier (2-sided fights) | 0.147 ± 0.016 | 0.144 ± 0.015 |

fights: before 663, after 697; host scraps: before 140, after 150

What it says:
- **Moves.** AI teams make 0.7 garage moves per team per game (0.8 Cr in fees), nearly all Stash → robot (a part from a scrapped robot
  or a part kept aside going back to use). **Robot → robot: 0 in 60 games.** The trace (window.__garTrace) shows why: moving a part
  from one of its robots to the one it sends gains about 0-4 points of odds vs the field (the bookie's formula), worth at most ~0.6 Cr
  by the AI's valuation (15 Cr per 1.0 of odds), against a 2 Cr fee (4 for a legendary). With Kev's fees, swapping between robots
  rarely pays in odds alone; for a person it is about which robot to send.
- **Parts pile onto one robot?** Hardly: the top robot carries 1.42 parts vs 1.34 (+0.08, just outside the ranges), 2 parts + a
  legendary 25% vs 23% of fights. Parts per robot 1.11 vs 1.05.
- **Market:** spend on parts per round unchanged (rounds 1-4, 5-8, 9+ all within ±0.3); 20.0 vs 20.4 parts bought per game. The Market
  does not cool late.
- **Scrap:** a host scrap costs its victim 1.27 Cr of value now vs 1.62 before (−0.35, ranges ±0.2 each): it matters a little less.
  Most returned parts come back broken (0.83 of 0.92 per game): a robot that lost and is scrapped is usually broken in the Body, and
  drones, modules and legendaries sit there. AI hosts scrap as often as before (2.50 vs 2.37 a game).
- **Game:** length 11.9 vs 11.5 rounds (+0.4, ranges ±0.45: likely a small real lengthening or noise), fame per round 3.25 vs 3.32,
  close finishes 27% vs 34% (±11: no clear change), bookie 80% vs 79% favourite wins, Brier 0.144 vs 0.147: unchanged.
- **Stash:** 0.47 parts per AI team at the end vs 0.64 (they now put parts back to use).
- **Clicks for a player who changes nothing:** 0 extra. Nothing to move: as before (0.6 s). Parts to move, nothing to repair: Done by
  itself after 8 s (it was 0.6 s): slower, not a click. Repairs to do: Done, as before.


## Tests

- `node tools/mp-scenario/garage.js [shots]`: solo at 1600x900 and 1280x720: the four kinds of move by clicks (2 / 4 / 1 / 1 Cr), bill
  and credits after in the note, Undo a line, Reset, not enough credits (no Lock, Done disabled), Lock applies all with log lines, a
  broken Stash part refused on a robot and by `fitStash`, repaired from the note with 1 action, then it fits; 9 Stash parts fit (the card
  scrolls, the page does not); a host scrap (real `resolveFate`) gives the parts back, the Body part broken; Done with a bill pays it
  and ends Upkeep; a late Lock is refused; a player with no parts sees no bill. T56: with no parts, and with parts untouched, Upkeep
  waits (no count) until the Done click ("Nothing to repair · Done → Intrigue"), the waiting list says Upkeep; with `upkeepAuto: true`
  the old way: no parts on by itself (~1 s), parts untouched after idleMs, touched: it waits.
- `node tools/mp-scenario/garage-online.js [seed] [shots]`: host + 3 joined: a client drafts by clicking on its canvas (host and other
  client unchanged), locks (host applies, other client sees the move and the log line), the broken flag is synced, a bill over its credits
  and one on an old garage are refused, Done, a late Lock refused, reload/rejoin gets the garage back.
- The test bot (`?bot=1`) locks one random affordable move in half its Upkeeps, so `tools/mp-test.js` runs the online bill.
- `node tools/garage-report.js <before files> -- <after files>`: the table above.

## Open questions for Kev

- Is 8 s right for "parts you could move, nothing to repair, you touched nothing" (then Done by itself)? 0.6 s would never give you the
  time to swap; never would cost a click every round.
- A part taken off a robot whose zone is broken comes off broken (rule 5): keep?
- Scrapped robots are almost always broken somewhere: most parts come back broken (see the numbers). Is a repair action per part the
  right price, or should only the zone that broke the part matter less often (for example only "broken" from a lost piece)?
- The AI keeps at most 4 Stash parts: fine, or should it hoard like a person may?
