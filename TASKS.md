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
- **K15. Bid lock** (T16): a change takes your lock off and you lock again (taken), or stay locked while changing? Should
  others see a log line when someone unlocks? Bookie's Friend / Hedge Bet playable after locking bets?
- **K16. Send feedback** (T15): wording "✓ Mauler sent" and the bookie line: fine? In a double duel, pick the second robot
  in the note too, instead of the question box?
- **K14. Part goes on at once** (T12): "best robot" = the one whose odds gain most: right? Undo puts the part back to
  "pick a robot or keep it in the Stash": fine? A Move starts the 5 s again: fine? No red flash when the part went on your
  only robot (nothing you must do): fine? The Stash panel's own Fit still asks "On which robot?" in a popup: move that to
  the note too?
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

- **T18. Watch: one online test run stalled in round 8, step "after", nobody waited for** (seen once by the T16 worker,
  0 desyncs, not seen again in three later runs). If it shows again: find it.
- **T17. `tools/market-install-test.js` is stale** (it expects the 8 Nov install prompt). Update or retire it.
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

- **T5. Repair kit needs a different trigger.** Kev (16 Nov): "start repair kit fix". It stays at about +0.5 of a level
  however fast it heals, because it only works while the robot is not hit (`docs/robocus-part-levels.md`). Files:
  `tools/damage-lab/` (engine, lineup), then `build.py`. Worker on branch `claude/repair-kit`, started 16 Nov. Done when:
  the part test (`tools/damage-lab/parttest.js`, `PARTS=repair`) gives +0.65 to +0.85, and robots without the part card
  (Mauler's own repair module too) fight exactly as before.

## Done

- **T15. A click in the note shows it worked** (16 Nov): cause found: after a send the bookie's test fights ran on the page
  before anything was painted (5.4 s frozen on the test box), and the note had no text for "bookie busy". Now: "✓ <robot>
  sent" at once (25 ms), others greyed, a bookie line, the same ✓ on the card and for the other note choices. Branch
  `claude/send-feedback`, commit `0531870`.
- **T16. Bids can change after locking until everyone has locked** (16 Nov): lot bids, host bid and robot count, bets,
  fight-card bids, tie rebids; a change takes your lock off; late changes are refused with a line. Test bot bids once per
  step. Branch `claude/relock-bids`, commit `3e5a3e1`.
  T15 + T16 merged together: BUILD `2026-11-16h`, files stamp `c572d16c`; game-sim 2/2, 0 page errors; online test on the
  2.0 page 0 desyncs (12 fights checked).
- **T12. A won part goes on at once, with Undo and Move; the note flashes red for a choice** (16 Nov): one robot: fitted,
  Undo for 5 s; several robots: fitted on the one whose odds gain most, the others as Move buttons; Undo and Move are
  synced actions, final on the host's clock. Also a test-bot fix (repairs once per round). Branch `claude/fit-at-once`,
  commit `504fbee`. BUILD `2026-11-16f`, files stamp `c572d16c`; game-sim 2/2, online test on the 2.0 page 0 desyncs
  (11 fights checked).
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
