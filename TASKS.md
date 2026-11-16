# ROBOCUS task board

Kept by the orchestrator (see `CLAUDE.md`). Workers change only the status line of their own task. Newest at the top of
each list. A task is done when it is on `main` (commit and files stamp in the Done list).

## Waiting for Kev

Questions only Kev can answer. The orchestrator collects them here and asks in one message.

- **K9. The bookie on your PC: play through a local address so it uses all cores?** (T6.) Opened as a file
  (`play-latest.cmd`), the game can't use background workers: test fights run on the page, 62-81 a duel in 4 s, but only
  9-11 for a 2v2 or mirror fight, which is under the minimum of 40, so those fights fall back to the formula. Options:
  (a) `play-latest` starts a small local server (needs Node or Python on the PC) so workers run; (b) more time for fights
  with 3+ robots (8 s); (c) a lower minimum (20 fights); (d) leave it.
- **K13. Odds overview** (T7): a click on a lot's odds strip now opens the overview instead of adding 1 Cr: fine? 12 test
  fights a pair (24 for your changed duels): enough? A rival is assumed to fit the part where the AI would: fine?
- **K10. Rarity overlay** (T11): glow and shine on Works and Masterwork only, or Race-spec too? A click on a part card's
  header now opens the ladder instead of bidding +1: fine, or a small "?" button? On rivals' small tickets too?
- **K11. Tow cable and wall slams** (T10): yellow-and-black cable or plain steel? Comic impact star or a plain flash? Wall
  dents stay all fight (newest 18): fine, or fade? The same impact when a robot is slammed into another robot? The lab
  pages still draw the old thin line: port it?
- **K12. Choices in the note** (T9): should repairs, bets or lot bids also get buttons in the note, even if it gets
  crowded? Send buttons are green, other choices dark: fine?

### Answered

- **K7 (16 Nov): the YOUR MOVE box flashes red when a choice has to be made.** Kev: "I meant the your move box should
  flash red when a choice needs to be made". Part of T12.
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

- **T14. `mp-test` can't test the 2.0 page where the planck CDN is blocked.** `tools/mp-test.js` tests the 1.0 page by
  default and has no local planck like `game-sim.js`. Give it the same fallback and make `PAGE=tabletop-2.html` the
  check in `AGENTS.md` 4.3. Done when: `node tools/mp-test.js` passes on the 2.0 page with no network.
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

- **T16. Bids can still be changed after locking, until everybody has locked.** Kev (16 Nov): "when people lock bids,
  people can still change their bids after that if there are other people not locked yet but if everybody locked it it
  continues". Goal: a locked player can still change a bid while somebody else has not locked; the step goes on only when
  every player is locked. Safest reading taken: changing a bid takes your lock off, and you lock again (so the step can't
  resolve on a half-made change). The same for bets and the host bid where they use the same lock. Files:
  `prototypes/tabletop-2.html` (`gather`, `ACT.lockBids`, `ACT.lockBets`, the bid clicks). Worker on branch
  `claude/relock-bids`, started 16 Nov. Done when: scripted solo and online checks (lock, change, others see you
  unlocked, lock again, resolves with the new bid), game-sim check and the online test on the 2.0 page pass.
- **T15. The send button in the note must show it worked.** Kev (16 Nov): "when I clicked it it somehow didn't register,
  or perhaps it did register but the button still showed, should be something like a checkmark after that button so we
  know it did its work". Likely cause: right after the last robot is sent the bookie runs its test fights on the page
  (the game opened as a file has no workers), so the screen stands still for about 4 s with the buttons unchanged. Goal:
  the clicked button shows a checkmark at once, the others grey out, and the note says the bookie is working; the same
  for the other choice buttons in the note. Files: `prototypes/tabletop-2.html` (the note's send buttons). Worker on
  branch `claude/send-feedback`, started 16 Nov. Done when: a screenshot taken straight after the click shows the
  checkmark, on a page opened as a file; game-sim check and the online test on the 2.0 page pass.
- **T12. A bought part goes on the robot at once, with undo; the YOUR MOVE box flashes red for a choice.** Kev (16 Nov):
  "when you buy a part, put it on the robot immediately but do show an undo button for 5 sec in the yellow box so people
  can undo that, also not sure yet how it works for multiple robots (not seen that yet in my playtest), but also in these
  case try to put options to click also in the yellow box at all time"; "the your move box should flash red when a choice
  needs to be made". Goal: winning a part fits it straight away; the note shows Undo for 5 s; with several robots it goes
  on the best fit and the note offers the other robots; the note flashes red when the game waits for your choice. Also:
  the pit header says "FIT … ON A ROBOT (RIGHT)" but the robots are on the left. Files: `prototypes/tabletop-2.html`.
  Worker on branch `claude/fit-at-once`, started 16 Nov. Done when: screenshots of the note with Undo and with the robot
  choices, undo works online (0 desyncs on the 2.0 page), game-sim check passes.
- **T5. Repair kit needs a different trigger.** Kev (16 Nov): "start repair kit fix". It stays at about +0.5 of a level
  however fast it heals, because it only works while the robot is not hit (`docs/robocus-part-levels.md`). Files:
  `tools/damage-lab/` (engine, lineup), then `build.py`. Worker on branch `claude/repair-kit`, started 16 Nov. Done when:
  the part test (`tools/damage-lab/parttest.js`, `PARTS=repair`) gives +0.65 to +0.85, and robots without the part card
  (Mauler's own repair module too) fight exactly as before.

## Done

- **T7. Odds overview on Market lots, refined with test fights** (16 Nov): click the 🎩 odds strip of a lot; a tab per team
  that could win it, every robot against every rival robot, bands before → after, your changed duels outlined; test
  fights in the background (12 a pair, 24 for your changed duels). Display only. Branch `claude/odds-overview`, commit
  `4465b9b`. BUILD `2026-11-16e`, files stamp `c572d16c`.
- **T9. Send to the pit and other choices in the yellow note** (16 Nov): a button per robot when you are invited; also
  sponsor, starter, fitting a part, host invite, tie rebid. Branch `claude/pit-in-note`, commit `962cafa`.
- **T10. Tow cable and wall slams can be seen** (16 Nov): `src2/view.js`, drawing only; stock-fight fingerprint unchanged.
  Branch `claude/sling-visuals`, commit `a477ee1`. Files stamp `c572d16c`.
- **T11. Rarity ladder overlay** (16 Nov): hover tip and click-through overlay from part card headers, robots' parts
  lines, the Stash, the log. Branch `claude/rarity-overlay`, commit `bb02d5c`.
  T9-T11 merged together: BUILD `2026-11-16d`, files stamp `c572d16c`; game-sim 2/2 games, 0 page errors; online test on
  the 2.0 page (`PAGE=tabletop-2.html`, planck served locally) 0 desyncs, 5 fights checked.
- **T6. Bookie speed on Kev's PC** (16 Nov, from Kev's playtest log): 62-81 test fights a duel in 4 s, 9-11 for a mirror
  or double duel; always on the page, not in workers (the game was opened as a file). `BAL.bookie` not changed yet: K9.
  Numbers in `docs/robocus-sim-bookie.md`.
- **T8. The formula bookie counts damage again** (16 Nov, K5): `BAL.oddsDamage` true; changelog line, BUILD
  `2026-11-16a`. Example: a Scythe with a broken Body against a new Mincer, 65% as new, 56% damaged. Check: 2/2 games,
  0 page errors. Branch `claude/formula-counts-damage`, commit `8017271`. Files stamp unchanged: `e63a7588`.
- **Orchestration setup** (16 Nov): `AGENTS.md` rules, `CLAUDE.md` roles and worker brief, this board,
  `docs/orchestration.md` (Kev's guide), `play-latest.cmd`, files stamp and stale-file warning (`tools/stamp.py`, run by
  `build.py`), `tools/retire-side-folders.cmd`, the project-only docs copied into `docs/`. Branch `claude/orchestration`.
