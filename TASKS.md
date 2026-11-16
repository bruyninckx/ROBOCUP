# ROBOCUS task board

Kept by the orchestrator (see `CLAUDE.md`). Workers change only the status line of their own task. Newest at the top of
each list. A task is done when it is on `main` (commit and files stamp in the Done list).

## Waiting for Kev

Questions only Kev can answer. The orchestrator collects them here and asks in one message.

- **K4. Full odds overview in the auction: formula now, or test fights too?** (T7.) The auction odds come from the matchup
  table and the part values, with no test fights, so a whole grid is instant. Test fights for every pair would be far too
  slow (a dozen robots is about 50 pairs). Safest choice taken for T7: the formula grid. Later option: refine the grid with
  a few test fights in the background.

### Answered

- **K5 (16 Nov): the formula counts damage again.** Kev: "let the formula count damage again". Task T8.
- **K1 (16 Nov): the test-fight bookie keeps damage.** Kev: "test fight bookie does not ignore damage, it should run the
  simulation as is". No change to the code.
- **K2 (16 Nov): counter trust stays 1.** Kev: "don't counter trust, bookies run simulations anyway".
- **K3 (16 Nov): judges' calls stay as they are.** Kev: "leave as is". T3 no longer waits for this.

## To do

- **T7. Full odds overview in the auction overlay.** Kev (16 Nov): "the overlay when checking odds on parts/robot should
  give an overview of effect of all the robots vs all the other robots, also from the opponents and how these changes
  affect you". Goal: the odds overlay on a lot shows a grid, every robot against every rival robot, for each team that
  could win the lot: bands before and after, with the changes that touch your robots marked. Formula odds only (K4).
  Files: `prototypes/tabletop-2.html` (the `sc-t` overlay, `partThreat`, the lot odds near "what a lot does to this robot").
  Depends on: after T2 (same file). Done when: a screenshot of the grid in a 4-team game, the game-sim check passes, and
  opening the overlay takes under 100 ms.
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

- **T8. The formula bookie counts damage again** (K5). `BAL.oddsDamage` true, help texts and docs corrected. Worker on
  branch `claude/formula-counts-damage`, started 16 Nov. Done when: a damaged robot's formula odds are lower than as new
  (numbers), the game-sim check passes, changelog line and new `BUILD`.

## Done

- **Orchestration setup** (16 Nov): `AGENTS.md` rules, `CLAUDE.md` roles and worker brief, this board,
  `docs/orchestration.md` (Kev's guide), `play-latest.cmd`, files stamp and stale-file warning (`tools/stamp.py`, run by
  `build.py`), `tools/retire-side-folders.cmd`, the project-only docs copied into `docs/`. Branch `claude/orchestration`.
