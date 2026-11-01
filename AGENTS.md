# Rules for AI assistants working on ROBOCUS

Two AI assistants work on this project (Claude and Antigravity), steered by Kev. Follow these rules so you don't trip over each other.

## Before you start
1. Read `PROGRESS.md`: check the ownership table and the latest log entries.
2. Read the relevant files in `docs/` before changing game rules or balance.
3. Run `git status` and `git log --oneline -10` to see what changed recently.

## While you work
- Only edit the areas assigned to you in `PROGRESS.md`. If you need to change something owned by the other assistant, write it under "Requests / handoffs" in `PROGRESS.md` instead.
- Work on your own git branch (`claude/...` or `antigravity/...`), not directly on `main`, unless Kev says otherwise.
- Keep changes small and commit often, with clear messages.
- The battle simulator (`Sim`) must stay deterministic: use the seeded RNG (`mkRng`), never `Math.random()` inside the sim.
- Keep prototypes runnable by double-clicking the HTML file (no build step, no server) unless Kev agrees to change that.

## When you finish
- Add a dated entry to the log in `PROGRESS.md`: what you changed, which files, and anything left open.
- If you changed rules or found balance results, update the matching doc in `docs/`.
- Commit your work so the other assistant can see it.

## Style
- Plain, rough visuals are fine; show playable sketches early so Kev can steer.
- Keep the UI text short and in plain English.
