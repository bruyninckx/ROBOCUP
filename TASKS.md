# ROBOCUS task board

Kept by the orchestrator (see `CLAUDE.md`). Workers change only the status line of their own task. Newest at the top of
each list. A task is done when it is on `main` (commit and files stamp in the Done list).

## Waiting for Kev

Questions only Kev can answer. The orchestrator collects them here and asks in one message.

- **K7. Which box is "the red box" that should flash yellow for a decision?** (T12.) Guess taken if no answer: your own
  robot's card (the red team's work order) flashes yellow when it needs a click.

### Answered

- **K8 (16 Nov): the in-game power map shows robots as they are.** Kev: "power map shold be the shifted version, lets wait
  until other workers finish and then start". Each robot is placed by its level plus its parts and damage.
- **K4 (16 Nov): the auction odds overview is refined with test fights.** Kev: "lets refine a bit, put another worker on
  it". Part of T7.
- **K6 (16 Nov): big odds swings against a wrecked robot stay.** Kev: "no it is what it is". No change.
- **K5 (16 Nov): the formula counts damage again.** Kev: "let the formula count damage again". Task T8.
- **K1 (16 Nov): the test-fight bookie keeps damage.** Kev: "test fight bookie does not ignore damage, it should run the
  simulation as is". No change to the code.
- **K2 (16 Nov): counter trust stays 1.** Kev: "don't counter trust, bookies run simulations anyway".
- **K3 (16 Nov): judges' calls stay as they are.** Kev: "leave as is". T3 no longer waits for this.

## To do

- **T13. Interactive power map as an in-game overlay.** Kev (16 Nov, with a screenshot of the Robocus Power Map: robots by
  level, left to right by strength for their level, counter arrows for the picked robot): "what I would love, but don't
  know if feasible, is to have an interactive powermap as an overlay with all the robots in game". Feasible: the game
  already loads the matchup table (`src2/matrix.js`) and the levels. Goal: a button opens the map over the game; the
  robots in this game (teams' robots in team colours, Market lots) stand out, the rest are dimmed; click a robot for its
  counters (green = it beats, red = it loses to). Source: the map is only a claude.ai artifact today ("Robocus Power Map",
  15 Nov; `docs/robocus-power-map.html` is named in a doc but is not in the repo): bring it into the repo first. Files:
  `prototypes/tabletop-2.html`, `docs/`. Robots are placed as they are in this game: shifted by parts and damage (K8). Depends on: starts when the running
  workers (T5, T7, T9, T10, T11) are merged (Kev). Done when:
  screenshots of the overlay in a 4-team game with a robot picked; opens in under 200 ms; game-sim check and `mp-test`.
- **T12. A bought part goes on the robot at once, with undo.** Kev (16 Nov): "when you buy a part, put it on the robot
  immediately but do show an undo button for 5 sec in the yellow box so people can undo that, also not sure yet how it
  works for multiple robots (not seen that yet in my playtest), but also in these case try to put options to click also in
  the yellow box at all time. Flash the red box yellow for decision". Goal: winning a part fits it straight away (today:
  a "Fit" button on the robot card, and a popup "On which robot?" when several robots can take it); the note shows an
  Undo button for 5 s; with several robots the part goes on the best fit and the note offers the other robots as buttons;
  the box that needs a decision flashes yellow. Files: `prototypes/tabletop-2.html` (install flow near `ivModal('🔩 Fit`,
  the note). Depends on: after T9 (same note code). Open: K7. Done when: screenshots of the note with Undo and with the
  robot choices, undo works online (`mp-test` 0 desyncs), game-sim check passes.
- **T6. Bookie speed on Kev's PC.** How many test fights the host's PC runs in 4 s; read the `bookie` events of the next real
  game's log (`docs/robocus-sim-bookie.md`). Done when: the number is in that doc, and `BAL.bookie` is set to suit.
- **T4. Make arenas change who wins.** Kev (16 Nov): "yes, lets change the arenas so they have an impact. If impact is a
  lot more we can decide on coins it needs as well". Today, with 32 fights a robot per arena, only Whaler (Saws) stands
  out (`docs/robocus-tuned-lineup-tags.md` 4.5). Goal: stronger or more selective hazards, so each arena clearly helps some
  robots and hurts others; then re-measure `ARENA_FIT` and the arena tags. Report how big the effect is, so Kev can decide
  whether picking an arena should cost credits. Files: `tools/damage-lab/` (engine hazards, `arenafit.js`), then `build.py`.
  Depends on: after T5 (same engine files). Done when: on every arena at least 4 robots move 8 points or more against
  their open-floor record (numbers with fight counts), and the open floor is unchanged.
- **T3. Level 2 is the softest step** (60% vs level 1; the others 64-66%). Small power nudges for Pincher and Whaler, then
  check the level steps again (`tools/damage-lab/tag-sim2.js` duel section). Done when: every step is 63-68%.
- **T2. Reaction window inside the note instead of a popup** (after T7: same file) (open item of the 2.0.1 screen rework,
  `docs/robocus-2.0.1-screen.md`).
- **T1. Kev: retire the side folders.** Double-click `tools/retire-side-folders.cmd` once: it pushes the three 11 Nov
  experiment branches (`claude/arena-25d`, `claude/arena-3d`, `claude/arena-looks`; 4 commits only on Kev's PC) and only
  then removes the `.wt` folders.

## In progress

- **T11. A nice overlay for part rarity.** Kev (16 Nov, with a screenshot of the card headers "PART ◇◇◇◇" and
  "TUNED ◆◇◇◇"): "make a nice overlay for the part rarity". Goal: hovering or clicking the diamonds on a part card opens
  an overlay that shows the five tiers (name, colour, diamonds, how rare, what it adds), which tier this card rolled and
  what that does for this part. Files: `prototypes/tabletop-2.html` (`RAR`, the market tile header, the help overlays).
  Runs next to T7 and T9 in the same file; later merges rebase. Worker on branch `claude/rarity-overlay`, started 16 Nov.
  Done when: screenshots of the overlay on a Standard, a Tuned and a Masterwork card; game-sim check and `mp-test` pass.
- **T10. Tow cable and wall slams need to be seen.** Kev (16 Nov, with a screenshot of Snapjaw slinging Forklift): "the tow
  cable upgrade on the snapjaw was barely visible, forklift just slammed in the wall without much visual effect". Goal: the
  tow cable is a clear cable from hook to victim for the whole sling; a hard wall hit shows on the wall and the robot.
  Drawing only, no change to how fights go. Files: `src2/view.js` (and `tools/damage-lab/ui.js` if the labs share it).
  Worker on branch `claude/sling-visuals`, started 16 Nov. Done when: before/after screenshots of a sling into the wall,
  the stock-fight fingerprint is unchanged, game-sim check and `mp-test` pass.
- **T5. Repair kit needs a different trigger.** Kev (16 Nov): "start repair kit fix". It stays at about +0.5 of a level
  however fast it heals, because it only works while the robot is not hit (`docs/robocus-part-levels.md`). Files:
  `tools/damage-lab/` (engine, lineup), then `build.py`. Worker on branch `claude/repair-kit`, started 16 Nov. Done when:
  the part test (`tools/damage-lab/parttest.js`, `PARTS=repair`) gives +0.65 to +0.85, and robots without the part card
  (Mauler's own repair module too) fight exactly as before.
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
