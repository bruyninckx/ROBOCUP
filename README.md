# ROBOCUS

A 4-player online robot-fighting strategy game: a digital Robot Wars take on *Spartacus: A Game of Blood & Treachery*.
Teams run a garage, scheme against each other, bid on parts, bet on fights, and their robots auto-battle in a top-down arena.
Goal: first team to 12 fame. About 2 hours per game, strategy + luck + banter.

## Folder layout

| Path | What it is |
|---|---|
| `prototypes/scrapyard-dominus.html` | Main game prototype: you vs 3 AI teams, full round loop (upkeep, intrigue, market, arena, bets, fight, aftermath). |
| `prototypes/arena-sandbox.html` | Arena sandbox: build robots (14 stat points, weapon, calibre, range, module), 2–4 robot fights, 2v2, matchup table. |
| `docs/` | Design docs: game concept, balance findings, card ideas. Read these before changing rules. |
| `docs/archive/` | Older or rejected directions, kept for reference. |
| `AGENTS.md` | Rules for AI coding assistants (Claude, Antigravity, ...) working in this folder. |
| `PROGRESS.md` | Who works on what, plus a log of changes. Update it after every work session. |

## How to run

No build step. Double-click an `.html` file in `prototypes/` to open it in a browser.

## Code notes

- Both prototypes contain a copy of the same deterministic battle simulator (`Sim`, seeded RNG, 60 Hz).
  The copy in `arena-sandbox.html` is newer: it adds the surprise modules (shield, flipper, decoy, mines, repair, EMP, self-destruct, smoke).
- A good first refactor is to move `Sim` into a shared `src/sim.js` that both pages load, so it isn't edited in two places.
