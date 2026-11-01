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

- Claude → Antigravity / Kev (2026-11-01): we share one working copy, so switching branches there moves the other assistant's uncommitted files onto your branch (it happened once; Claude cleaned it up). Suggest each assistant uses its own `git worktree` (e.g. `git worktree add ../ROBOCUS-antigravity antigravity/...`), or always commit/stash before switching. Claude now commits to its branches without checking them out.

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

- 2026-11-01, Claude (branch `claude/squadrons`, on top of `claude/balance-pass`): squadron leader cards (Lone Wolf 1×28 pts cap 8, Duo 2×18 cap 6, Trio 3×14 cap 4, Swarm 5×9 cap 3) in `Sim` and a "Squadron battle" mode in `prototypes/arena-sandbox.html` (pick a card per side, example squads, random squads within budget, "GIANT SLAYER" callout when the smaller side wins, up to 10 robots, robot size per card). Stat levels now go up to 8 for bigger robots; uneven team spawns. `tools/watchdog.js --mode squad` + `docs/watchdog-report-squad.md`. Design notes in `docs/robot-card-ideas.md`. Not merged to main yet.
- 2026-11-01, Claude (branch `claude/balance-pass`): balance pass on `prototypes/arena-sandbox.html` after the watchdog (saw blades weaker per bounce, rapid +8%, armour keeps ≥25% of a hit, flipper buff, bomber and medic nerfs, 10% critical hits, 40% of robots get one malfunction per fight) and two new weapons from Kev: spinner blade (Whirlwind preset) and flamethrower with spreading fire (Torch preset). `tools/watchdog.js` now has `--mode team` (4v4) and reads the weapon list from Sim. Reports: `docs/watchdog-report.md` (duels), `docs/watchdog-report-team.md` (4v4). Docs: `docs/robot-arena-balance-findings.md`. Not merged to main yet.
- 2026-11-01, Claude (branch `claude/watchdog`): added `tools/watchdog.js` (combo watchdog, reads `Sim` from `prototypes/arena-sandbox.html`) and the first `docs/watchdog-report.md`; README section on how to run it. First findings: saw blades too strong in random builds (1.7× over-represented, best build 97% vs competitive builds), rapid calibre nearly dead, turret turn and accuracy undervalued, 49% of competitive matchups 90/10+, upset rate 15% (target 25–35%). Not fixed yet: Kev to decide.
- 2026-11-01, Claude (branch `claude/saw-blades`): brought `prototypes/arena-sandbox.html` up to date with the published sandbox (helper drones: medic, waller, bodyguard, spotter, jammer, gun drone, bomber, miner; secret targeting order; 2–8 robots incl. 3v3/4v4 in a bigger arena; team health bars; random squads) and added a new weapon: bouncing saw blades + Buzzsaw preset (balanced to ~47% duel avg, 27% in 4-robot free-for-all). Updated `docs/robot-arena-balance-findings.md` (weapons section, 7×7 matchup table) and `docs/robot-card-ideas.md` (helpers). Open: helpers/modules still have no price; Kev to decide if branch goes to `main`.
- 2026-11-01, Antigravity: redesigned `prototypes/tabletop-prototype.html` after `/grill-me` with Kev — replaced webpage HTML boxes/tables/forms with a full-viewport minimalist architectural Scrapyard Compound (`<canvas>` world with 4 surrounding Team Garages, 3 physical Robot Bays per garage, animated mechanics, sliding blast doors, and smooth camera zoom into the central Arena Pit) plus a Hearthstone-style arched hand of cards (`Intrigue Schemes` dragged onto garages + `Live Combat Cards` like *Remote Trigger*, *Pilot Waypoint*, *Target Overclock*, *Oil Canister*, and *EMP Grenade* dragged into the Arena mid-fight with a curved targeting arrow).
- 2026-11-01, Claude: set up the shared folder: README, AGENTS.md, GEMINI.md, this file, design docs in `docs/`, the two prototypes in `prototypes/`, git repo.
