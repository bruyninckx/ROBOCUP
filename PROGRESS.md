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
- 2026-11-01, Antigravity: redesigned `prototypes/tabletop-prototype.html` after `/grill-me` with Kev — replaced webpage HTML boxes/tables/forms with a full-viewport minimalist architectural Scrapyard Compound (`<canvas>` world with 4 surrounding Team Garages, 3 physical Robot Bays per garage, animated mechanics, sliding blast doors, and smooth camera zoom into the central Arena Pit) plus a Hearthstone-style arched hand of cards (`Intrigue Schemes` dragged onto garages + `Live Combat Cards` like *Remote Trigger*, *Pilot Waypoint*, *Target Overclock*, *Oil Canister*, and *EMP Grenade* dragged into the Arena mid-fight with a curved targeting arrow).
- 2026-11-01, Claude: set up the shared folder: README, AGENTS.md, GEMINI.md, this file, design docs in `docs/`, the two prototypes in `prototypes/`, git repo.
