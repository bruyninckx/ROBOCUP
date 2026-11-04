# ROBOCUS progress

## Who owns what

Kev: fill in or change this split. Each assistant only edits its own areas.

| Area | Files | Owner |
|---|---|---|
| Battle simulator, balance, modules, watchdog | `prototypes/arena-sandbox.html` (the `Sim` part), `tools/watchdog.js`, later `src/sim.js` | Claude (Agent 1) |
| Strategy layer (rounds, intrigue, market, bets, crates, sponsors) | `prototypes/scrapyard-dominus.html` | Antigravity (Agent 2) |
| Visuals / UI polish & tabletop multiplayer layout | `prototypes/tabletop-prototype.html` | Antigravity (Agent 2) |
| Design docs & specs | `docs/upgrade-cards.md`, `docs/processors-and-drives.md`, `docs/sponsors.md`, `docs/playtest-kit.md` (`docs/` shared) | Antigravity (Agent 2) / shared |

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
- Watchdog flags (see `docs/watchdog-report.md`): nerf saw blades, rescue rapid calibre, make fights less predictable (upset rate 15% → 25–35%).

## Log

Newest first. Format: `YYYY-MM-DD, who: what changed (files)`.

- 2026-11-01, Claude (branch `claude/watchdog`): added `tools/watchdog.js` (combo watchdog, reads `Sim` from `prototypes/arena-sandbox.html`) and the first `docs/watchdog-report.md`; README section on how to run it. First findings: saw blades too strong in random builds (1.7× over-represented, best build 97% vs competitive builds), rapid calibre nearly dead, turret turn and accuracy undervalued, 49% of competitive matchups 90/10+, upset rate 15% (target 25–35%). Not fixed yet: Kev to decide.
- 2026-11-01, Claude (branch `claude/saw-blades`): brought `prototypes/arena-sandbox.html` up to date with the published sandbox (helper drones: medic, waller, bodyguard, spotter, jammer, gun drone, bomber, miner; secret targeting order; 2–8 robots incl. 3v3/4v4 in a bigger arena; team health bars; random squads) and added a new weapon: bouncing saw blades + Buzzsaw preset (balanced to ~47% duel avg, 27% in 4-robot free-for-all). Updated `docs/robot-arena-balance-findings.md` (weapons section, 7×7 matchup table) and `docs/robot-card-ideas.md` (helpers). Open: helpers/modules still have no price; Kev to decide if branch goes to `main`.
- 2026-11-01, Antigravity: redesigned `prototypes/tabletop-prototype.html` after `/grill-me` with Kev — replaced webpage HTML boxes/tables/forms with a full-viewport minimalist architectural Scrapyard Compound (`<canvas>` world with 4 surrounding Team Garages, 3 physical Robot Bays per garage, animated mechanics, sliding blast doors, and smooth camera zoom into the central Arena Pit) plus a Hearthstone-style arched hand of cards (`Intrigue Schemes` dragged onto garages + `Live Combat Cards` like *Remote Trigger*, *Pilot Waypoint*, *Target Overclock*, *Oil Canister*, and *EMP Grenade* dragged into the Arena mid-fight with a curved targeting arrow).
- 2026-11-01, Claude: set up the shared folder: README, AGENTS.md, GEMINI.md, this file, design docs in `docs/`, the two prototypes in `prototypes/`, git repo.
