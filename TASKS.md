# ROBOCUS task board

Kept by the orchestrator (see `CLAUDE.md`). Workers change only the status line of their own task. Newest at the top of
each list. A task is done when it is on `main` (commit and files stamp in the Done list).

## Waiting for Kev

Questions only Kev can answer. The orchestrator collects them here and asks in one message.

_None._

### Answered

- **K4 (16 Nov): the auction odds overview is refined with test fights.** Kev: "lets refine a bit, put another worker on
  it". Part of T7.
- **K6 (16 Nov): big odds swings against a wrecked robot stay.** Kev: "no it is what it is". No change.
- **K5 (16 Nov): the formula counts damage again.** Kev: "let the formula count damage again". Task T8.
- **K1 (16 Nov): the test-fight bookie keeps damage.** Kev: "test fight bookie does not ignore damage, it should run the
  simulation as is". No change to the code.
- **K2 (16 Nov): counter trust stays 1.** Kev: "don't counter trust, bookies run simulations anyway".
- **K3 (16 Nov): judges' calls stay as they are.** Kev: "leave as is". T3 no longer waits for this.

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
- **T2. Reaction window inside the note instead of a popup** (after T7: same file) (open item of the 2.0.1 screen rework,
  `docs/robocus-2.0.1-screen.md`).
- **T1. Kev: retire the side folders.** Double-click `tools/retire-side-folders.cmd` once: it pushes the three 11 Nov
  experiment branches (`claude/arena-25d`, `claude/arena-3d`, `claude/arena-looks`; 4 commits only on Kev's PC) and only
  then removes the `.wt` folders.

## In progress

- **T9. "Send to the pit" in the yellow note.** Kev (16 Nov): "When you can send a robot to the pit, also make that 'to the
  pit' option visible in the yellow window on the right. As much as possible". Goal: when you have to send a robot, the
  note on the right has a button per robot you can send; the same for other steps where the note only tells you to click
  somewhere else, where it fits. Files: `prototypes/tabletop-2.html` (the note, `pb.innerHTML` per phase). Runs next to T7
  in the same file on Kev's word; the second to merge rebases. Worker on branch `claude/pit-in-note`, started 16 Nov. Done
  when: a screenshot of the note with the buttons, a click sends the robot, game-sim check and `mp-test` pass.
- **T7. Full odds overview in the auction overlay, refined with test fights.** Kev (16 Nov): "the overlay when checking
  odds on parts/robot should give an overview of effect of all the robots vs all the other robots, also from the opponents
  and how these changes affect you"; on test fights: "lets refine a bit". Goal: the odds overlay on a lot shows a grid,
  every robot against every rival robot, for each team that could win the lot: bands before and after, the changes that
  touch your robots marked. The formula fills it at once; test fights in the background then refine the cells, without
  slowing the game or changing what the game decides. Files: `prototypes/tabletop-2.html`. Worker on branch
  `claude/odds-overview`, started 16 Nov. Done when: screenshots of the grid in a 4-team game (formula, then refined), the
  game-sim check passes, `node tools/mp-test.js` 0 desyncs, the overlay opens in under 100 ms.

## Done

- **T8. The formula bookie counts damage again** (16 Nov, K5): `BAL.oddsDamage` true; changelog line, BUILD
  `2026-11-16a`. Example: a Scythe with a broken Body against a new Mincer, 65% as new, 56% damaged. Check: 2/2 games,
  0 page errors. Branch `claude/formula-counts-damage`, commit `8017271`. Files stamp unchanged: `e63a7588`.
- **Orchestration setup** (16 Nov): `AGENTS.md` rules, `CLAUDE.md` roles and worker brief, this board,
  `docs/orchestration.md` (Kev's guide), `play-latest.cmd`, files stamp and stale-file warning (`tools/stamp.py`, run by
  `build.py`), `tools/retire-side-folders.cmd`, the project-only docs copied into `docs/`. Branch `claude/orchestration`.
