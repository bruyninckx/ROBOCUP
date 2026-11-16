# Rules for AI assistants working on ROBOCUS

Kev steers. One **orchestrator** session (Claude Fable) plans the work, hands tasks to **workers** (Claude Opus), checks
what comes back, merges it into `main` and pushes. How Kev sets this up: `docs/orchestration.md`. The open work and
Kev's open questions: `TASKS.md`. (Antigravity is paused since 5 Nov; these rules hold for it too.)

Why these rules (16 Nov 2026): work sat on branches nobody could push, a session merged another session's branch while
Kev played an old copy, and a browser mixed an old robot file with a new page (a dropped robot was dealt). Every rule
below closes one of those holes.

## 1. Where the truth is

- **GitHub `main` is the game.** GitHub Pages serves it (`https://bruyninckx.github.io/ROBOCUP/`), and Kev plays it with
  `play-latest.cmd`. Nothing counts as done until it is on `main`.
- **Only the orchestrator merges into `main` and pushes it.** Workers never push `main`.
- **Kev's ROBOCUS folder on his PC stays on `main`.** Do not switch branches, make worktrees, commit or stash in it: work in
  your own copy of the repo (the orchestrator gives each worker one). Reading files there is fine.
- **Docs live in the repo** (`docs/`). A doc written to the claude.ai project is a copy of the repo doc, never the only one.

## 2. Starting a task

1. Read the task in `TASKS.md` (or the brief you were given): Kev's words, the goal, the check that says it is done.
2. `git fetch origin`, then branch `claude/<task-name>` from `origin/main` (never from an old branch).
3. Read `PROGRESS.md` (latest entries) and the docs the task names before changing rules or balance.

## 3. While you work

- Keep commits small, with clear messages, on your task branch only.
- **Generated files are never edited by hand.** `src2/dmath.js`, `src2/engine.js`, `src2/lineup.js`, `src2/matrix.js`,
  `prototypes/damage-lab.html`, `prototypes/lineup-arena.html`, `prototypes/contact-lab.html` come from `tools/damage-lab/`:
  edit there, then run `python3 tools/damage-lab/build.py` (it also runs `tools/stamp.py`, see 5).
- Simulations stay deterministic: seeded RNG only, never `Math.random()` inside a simulation.
- Prototypes stay runnable by double-clicking the HTML file (no build step, no server) unless Kev agrees otherwise.
- A choice that is Kev's (rules, balance targets, looks, anything players see): don't stop. Pick the safest option, say so,
  and add the question under **Waiting for Kev** in `TASKS.md`.

## 4. Handing back (a worker) or finishing (the orchestrator)

Before you say "done":
1. `git fetch origin` and rebase your branch on `origin/main`; fix conflicts.
2. Run `python3 tools/damage-lab/build.py` if anything under `tools/damage-lab/` or `src2/` changed.
3. Run the checks that fit the change (all of them before a merge to `main`):
   - always: `node tools/game-sim.js --page=prototypes/tabletop-2.html --tag=check --games=2 --par=2` → 2 finished games,
     0 page errors;
   - engine or robots: the stock-fight fingerprint is unchanged unless the task was to change it
     (`tools/damage-lab/l4-regress.js`, compare with a run on `origin/main`);
   - online play or anything in `src2/net.js`: `node tools/mp-test.js` (the 2.0 page, 3 bot clients) → last line "OK",
     desyncs 0 on every client line; `prototypes/sync-check.html` unchanged. It takes 3-20 minutes; a TIMEOUT line says how
     far it got (give more minutes: `node tools/mp-test.js 3 5 90`). The 1.0 page: `PAGE=tabletop-prototype.html node tools/mp-test.js`;
   - offline or with the CDN blocked: `npm install --no-package-lock` once (it brings playwright and a local planck; there is no
     package-lock.json, so `npm ci` fails); the tools then serve that planck themselves (`tools/planck-local.js`);
   - balance: the numbers the task asked for, with how many fights and how sure they are.
4. Write it down: a dated entry in `PROGRESS.md`; the matching doc in `docs/` (and its claude.ai project copy); for anything
   players see, a line in the changelog (`CHANGES` in `prototypes/tabletop-2.html`) and a new `BUILD` string.
5. Commit everything. **Never end with uncommitted or unpushed work.** A worker pushes its task branch if it can and tells
   the orchestrator the branch and its last commit. If you cannot push, say so in the first line of your reply and stop
   there: do not stack more work on unpushed commits.
6. The orchestrator merges into `main` (no fast-forward needed; keep the task's commits), pushes, moves the task to Done in
   `TASKS.md` with the commit and the files stamp, and tells Kev in plain words what changed and what to look at.

## 5. Knowing which version is running

- `tools/stamp.py` fingerprints the shared game files (`src2/*.js`), writes `src2/version.js`, and puts the fingerprint on
  every `../src2/*.js` link in the pages that load them, so a browser or GitHub Pages can't mix old and new files.
- The game shows `files <fingerprint> · <date> · <n> robots` bottom left, and a red bar when the loaded files don't match the
  page. Put the fingerprint in every report to Kev, so he can see at a glance that he plays what you built.

## 6. Writing for Kev

- Plain, short English. Say what changed, what to try, and what you need from him.
- Rough visuals are fine; show playable sketches early. Top-down drawings, no skewed views. Flag what a change does to
  multiplayer and balance.
