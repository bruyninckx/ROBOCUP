# ROBOCUS task board

Kept by the orchestrator (see `CLAUDE.md`). Workers change only the status line of their own task. Newest at the top of
each list. A task is done when it is on `main` (commit and files stamp in the Done list).

## Waiting for Kev

Questions only Kev can answer. The orchestrator collects them here and asks in one message.

- **K1. The test-fight bookie counts damage; Kev said the odds should ignore damage (15 Nov).** The formula odds ignore it
  (`BAL.oddsDamage` false), but the bookie that runs test fights (`simOdds`, 15 Nov) runs them with each robot's real damage,
  and it decides the odds when the host's PC is fast enough. Options: (a) test fights with robots as new, (b) keep damage in
  test fights (the most accurate odds; whole games: Brier 0.164 with damage vs 0.180 without), (c) leave as is.
  Docs: `docs/robocus-part-levels.md`, `docs/robocus-sim-bookie.md`.
- **K2. Counter trust 0.65 as the default?** The formula bookie trusts the matchup table fully; in whole games counters held
  at about two thirds (the underdog of a counter wins 33% at odds of 20%). Matters less now that the test-fight bookie sets
  most odds. Doc: `docs/robocus-tuned-lineup-in-game.md`.
- **K3. More fights end on the judges' call (15%, was 5%; fights 12 s longer).** Shorter time limit, or a little less power for
  the grinders (Gaucho, Thwacker, Pincher, Whaler)? Doc: `docs/robocus-tuned-lineup-in-game.md`.

## To do

- **T6. Bookie speed on Kev's PC.** How many test fights the host's PC runs in 4 s; read the `bookie` events of the next real
  game's log (`docs/robocus-sim-bookie.md`). Done when: the number is in that doc, and `BAL.bookie` is set to suit.
- **T5. Repair kit needs a different trigger.** It stays at about +0.5 of a level however fast it heals, because it only
  works while the robot is not hit (`docs/robocus-part-levels.md`). Done when: the part test (`tools/damage-lab/parttest.js`,
  `PARTS=repair`) gives +0.65 to +0.85.
- **T4. Arenas barely change who wins.** With 32 fights a robot per arena only Whaler (Saws) stands out
  (`docs/robocus-tuned-lineup-tags.md` 4.5). If Kev wants arena picks to matter: stronger or more selective hazards, then
  re-measure `ARENA_FIT`. Ask Kev first (K-question) before building.
- **T3. Level 2 is the softest step** (60% vs level 1; the others 64-66%). Small power nudges for Pincher and Whaler, then
  check the level steps again (`tools/damage-lab/tag-sim2.js` duel section). Done when: every step is 63-68%.
- **T2. Reaction window inside the note instead of a popup** (open item of the 2.0.1 screen rework,
  `docs/robocus-2.0.1-screen.md`).
- **T1. Kev: retire the side folders.** Double-click `tools/retire-side-folders.cmd` once: it pushes the three 11 Nov
  experiment branches (`claude/arena-25d`, `claude/arena-3d`, `claude/arena-looks`; 4 commits only on Kev's PC) and only
  then removes the `.wt` folders.

## In progress

_None._

## Done

- **Orchestration setup** (16 Nov): `AGENTS.md` rules, `CLAUDE.md` roles and worker brief, this board,
  `docs/orchestration.md` (Kev's guide), `play-latest.cmd`, files stamp and stale-file warning (`tools/stamp.py`, run by
  `build.py`), `tools/retire-side-folders.cmd`, the project-only docs copied into `docs/`. Branch `claude/orchestration`.
