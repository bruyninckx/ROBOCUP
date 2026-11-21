# ROBOCUS garage: swap parts in Upkeep (T38, 21 Nov 2026)

Kev, 21 Nov: "modify the upkeep phase to also allow swapping of parts onto other robots for a small fee. To make this work, when a
robot get scrapped it should also still give the parts back (perhaps damaged as well?) into the stash (stash limit should perhaps be
removed). People can play around with swapping items and a sort of garage bill will be displayed which they can lock in".
His answers: fee "1 coin for removal and 1 coin for install, maybe 2 for legandaries", "4 in total" for a legendary move; on piling
everything onto one robot: "I would make swapping cost money and pay for removing + pay for putting an item on"; "stash limit gone";
parts from a scrapped robot: "perhaps depends on what was damaged?" (a part from a broken zone comes back broken and needs a repair,
the rest whole); a part you just won still goes on free, a Stash part pays 1 to go on: "yes"; "should be seemless for people with no
parts indeed. I'm also thinking about a nice visual about the upkeep with a garage and your robots in the arena area".

Branch `claude/garage`, page `prototypes/tabletop-2.html`, BUILD `2026-11-21m`.

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
9. **Online:** the draft is local. Lock sends ONE action (`garageLock`, the bill and a fingerprint of the garage it was drafted on);
   the host checks every line again (phase, not done yet, same garage, slots, ownership, credits) and applies all of it or nothing; a
   refusal is a line in that player's log. The other screens see the change only then, with a log line per move ("🔧 Rust Rivets moves
   Tow cable from Snapjaw to Mincer (2 Cr)."). Host Skip, a dropped seat or the auto-advance: an unlocked draft is simply gone.
   Nothing new is synced except the broken parts in the Stash (a broken part is its own lot id, `<id>~b`). Old saves load as they are.
10. **AI:** at Upkeep (host, after its repairs, no dice) an AI team repairs a broken Stash part a robot could use, then makes the best
    move while its value beats the fee (at most 3 bills, keeping 2 Cr): 15 Cr per 1.0 of odds on the robot it expects to send (its
    strongest ready robot), half that on its other robots, plus a Stash part's Market value over its bank price when it is put to use.
    It keeps its Stash at 4 parts at most (selling the least useful to the bank, as the old limit did).

Switches: `BAL.garage = { on: true, feeOff: 1, feeOn: 1, legOff: 2, legOn: 2, stashLimit: 0, partsBack: true, idleMs: 8000 }`.
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

## Numbers

NUMBERS

## Tests

- `node tools/mp-scenario/garage.js [shots]`: solo at 1600x900 and 1280x720: the four kinds of move by clicks (2 / 4 / 1 / 1 Cr), bill
  and credits after in the note, Undo a line, Reset, not enough credits (no Lock, Done disabled), Lock applies all with log lines, a
  broken Stash part refused on a robot and by `fitStash`, repaired from the note with 1 action, then it fits; 9 Stash parts fit (the card
  scrolls, the page does not); a host scrap (real `resolveFate`) gives the parts back, the Body part broken; Done with a bill pays it
  and ends Upkeep; a late Lock is refused; a player with no parts goes on by itself (~1.2 s) with no bill; with parts and untouched after
  idleMs; touched: it waits.
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
