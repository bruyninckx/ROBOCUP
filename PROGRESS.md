# ROBOCUS progress

## Who owns what

Kev: fill in or change this split. Each assistant only edits its own areas.

| Area | Files | Owner |
|---|---|---|
| Battle simulator, balance, modules | `prototypes/arena-sandbox.html` (the `Sim` part), later `src/sim.js` | _unassigned_ |
| Strategy layer (rounds, intrigue, market, bets) | `prototypes/scrapyard-dominus.html` | _unassigned_ |
| Visuals / UI polish & tabletop multiplayer layout | `prototypes/tabletop-prototype.html` | Antigravity |
| Design docs | `docs/` | shared (anyone may add, note it in the log) |

## Requests / handoffs

_Write here when you need the other assistant (or Kev) to do something in an area you don't own._

- (none yet)

## Open questions / next steps

From the design docs:
- Firepower is always maxed (a tax): make weapons parts with their own firepower and cost.
- Counters are too hard (often 0/100); aim for ~65/35.
- Add fame-gated cards, contested cards and team-up cards (see `docs/robot-card-ideas.md`).
- Online play: deterministic sim, only inputs shared.
- Move `Sim` into a shared `src/sim.js`.

## Log

Newest first. Format: `YYYY-MM-DD, who: what changed (files)`.

- 2026-11-01, Claude (branch `claude/saw-blades`): brought `prototypes/arena-sandbox.html` up to date with the published sandbox (helper drones: medic, waller, bodyguard, spotter, jammer, gun drone, bomber, miner; secret targeting order; 2–8 robots incl. 3v3/4v4 in a bigger arena; team health bars; random squads) and added a new weapon: bouncing saw blades + Buzzsaw preset (balanced to ~47% duel avg, 27% in 4-robot free-for-all). Updated `docs/robot-arena-balance-findings.md` (weapons section, 7×7 matchup table) and `docs/robot-card-ideas.md` (helpers). Open: helpers/modules still have no price; Kev to decide if branch goes to `main`.
- 2026-11-01, Antigravity: fixed hand button positioning and DOM structure in `prototypes/tabletop-prototype.html`:
  - Moved `.hand-tab` inside `.hand-tray` (alongside dedicated `.cards-fan`), so the button and cards move together as one cohesive drawer. When idle/tucked, the button sits snug right on the crest of the card fan at the bottom edge (only 66px above viewport bottom), completely clearing the South garage (Blue Bolts) with >110px of open space.
  - Added smooth CSS arrow rotation (`▲` flips to `▼` on hover/pin) and dark active inversion on pin.
  - Re-centered compound camera offset (`cam.ty = 35`), perfectly balancing North and South garages between the top prompt pill and the bottom hand drawer.
- 2026-11-01, Antigravity: tidied up `prototypes/tabletop-prototype.html` to eliminate card-garage overlap and optimize viewport space:
  - Hearthstone hand now rests tucked at the bottom edge by default (~68px peek showing badge, star cost, icon, and card name) with a subtle `▲ HAND (N)` tab; smoothly glides up on hover to reveal full card artwork & text (or click tab to pin open).
  - Implemented dynamic responsive camera auto-fit (`getCompoundZoom` & `getArenaZoom`) that centers and scales the compound with comfortable breathing margins, keeping the player's South garage (Blue Bolts) completely clear and visible above the hand tray at all times.
  - Refined garage & bay dimensions (`570x144` horizontal, `200x430` vertical) with compact 3-bay docking slots, dashed blueprint empty bays, and seamless dynamic corridor blast doors.
- 2026-11-01, Antigravity: redesigned `prototypes/tabletop-prototype.html` after `/grill-me` with Kev — replaced webpage HTML boxes/tables/forms with a full-viewport minimalist architectural Scrapyard Compound (`<canvas>` world with 4 surrounding Team Garages, 3 physical Robot Bays per garage, animated mechanics, sliding blast doors, and smooth camera zoom into the central Arena Pit) plus a Hearthstone-style arched hand of cards (`Intrigue Schemes` dragged onto garages + `Live Combat Cards` like *Remote Trigger*, *Pilot Waypoint*, *Target Overclock*, *Oil Canister*, and *EMP Grenade* dragged into the Arena mid-fight with a curved targeting arrow).
- 2026-11-01, Claude: set up the shared folder: README, AGENTS.md, GEMINI.md, this file, design docs in `docs/`, the two prototypes in `prototypes/`, git repo.
