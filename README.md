# ROBOCUS

A 4-player online robot-fighting strategy game: a digital Robot Wars take on *Spartacus: A Game of Blood & Treachery*.
Teams run a garage, scheme against each other, bid on parts, bet on fights, and their robots auto-battle in a top-down arena.
Goal: first team to 12 fame. About 2 hours per game, strategy + luck + banter.

## Folder layout

| Path | What it is |
|---|---|
| `prototypes/scrapyard-dominus.html` | Main game prototype: you vs 3 AI teams, full round loop (upkeep, intrigue, market, arena, bets, fight, aftermath). |
| `prototypes/arena-sandbox.html` | Arena sandbox: build robots (14 stat points, weapon, calibre, range, module, up to 3 helpers; weapons gun, laser, mortar, saw blades, spinner, flamethrower), 2–8 robot fights incl. 4v4, squadron battles (Lone Wolf / Duo / Trio / Swarm cards), crits, strain/engineers (malfunctions and broken parts), a bookie's board with fuzzy odds bands, a fight recap after each fight, drives (wheels / tracks / omni / boost) and processors (zigzag / kiter / rammer), legendary railgun, matchup table. |
| `tools/watchdog.js` | Combo watchdog: simulates thousands of random robots with the sandbox's `Sim` and reports dominant builds, dead options, lopsided matchups, upset rate and synergies. Writes `docs/watchdog-report.md`. |
| `docs/` | Design docs: game concept, balance findings, card ideas. Read these before changing rules. |
| `docs/archive/` | Older or rejected directions, kept for reference. |
| `AGENTS.md` | Rules for AI coding assistants (Claude, Antigravity, ...) working in this folder. |
| `PROGRESS.md` | Who works on what, plus a log of changes. Update it after every work session. |

## How to run

No build step. Double-click an `.html` file in `prototypes/` to open it in a browser.

## Balance check (watchdog)

Run after every new weapon, module, helper or stat change (needs Node.js):

```
node tools/watchdog.js --quick     # about 2 minutes, rough
node tools/watchdog.js             # about 2-5 minutes, writes docs/watchdog-report.md
node tools/watchdog.js --mode team # 4v4 battles with random robots, writes to --out (e.g. docs/watchdog-report-team.md)
node tools/watchdog.js --mode squad --out docs/watchdog-report-squad.md   # squadron cards against each other
node tools/watchdog.js --helpers random --module random   # see how much stacking helpers/modules adds
```

Targets: no build above 80% against other competitive builds, under 35% of matchups at 90/10 or worse, upset rate 25–35%, no option that almost never shows up in good builds.

## Code notes

- Both prototypes contain a copy of the same deterministic battle simulator (`Sim`, seeded RNG, 60 Hz).
  The copy in `arena-sandbox.html` is newer: it adds surprise modules, helper drones, saw blades and team battles up to 4v4. The watchdog reads `Sim` straight from that file.
- A good first refactor is to move `Sim` into a shared `src/sim.js` that both pages load, so it isn't edited in two places.
