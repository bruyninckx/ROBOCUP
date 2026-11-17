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
- **K23. Fate step tie.** A 2 Cr plea to spare lost to a 2 Cr offer to scrap: should a tie go to the owner (spare)?
- **K24. Power map arrows** (T23): counters from 30 points off (about 4 arrows a robot, up to 14 for Hydra and Gyro):
  right amount, or 35 (fewer)? Smooth widths, or 3 fixed sizes?
- **K22. Repairs in the note** (T22): order broken first, then worst damage: fine? Done at the top right of the note, or
  at the bottom? Stash parts that fit also get a button in Upkeep: keep?
- **K21. Arenas in whole games** (T19): the bookie's formula uses old per-arena tables for same-level duels and the new
  `ARENA_FIT` for the rest. Make it one source (drop the old tables: a few lines)? Let the AI host pay for an arena down
  to 1 Cr left (it keeps 3 Cr now, so arenas are rare in bot games)?
- **K18. Repair kit** (T5): it is now worth about two thirds of a level and won't go higher by healing faster. Good
  enough, or should it do something extra (protect the battery, points for repairing)? Back into the deck (it has been
  out since 9 Nov)? Should Mauler's built-in repair also work under fire? Card text "Repairs the robot all the time, fast
  when it is not being hit": fine?
- **K17. Power map** (T13): axis in levels (quarter ticks), not the -60..+60 points of the old map: fine? Position counts
  parts, tiers and damage, not part fit or epic combos: should those move the robot too? A robot with a broken weapon
  lands far left tagged "< ★0": fine? Light paper look, not dark: fine? Next round's robot lots shown as NEXT: fine?
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

- **Rogue Firmware (17 Nov): out for 2 rounds.** Kev: "this is ambigous to me, just make it 2 rounds then, how can it sit
  out its next fight if it cannot be selected its fight". The rule stays as coded (this round and the next); every text
  says "2 rounds" and the round it is back, not "its next fight". Part of T25.
- **K20 (17 Nov): reaction window.** Kev: "1 ok so window can end early; 2 let it happen; 3 move into note yes": a player
  with no card keeps the OK button; the button "Pass" becomes "Let it happen"; the other popup questions move into the
  note (T20).
- **K19 (17 Nov): arenas.** Kev: "Keep arena credit at 1. 2. Good 3. Ok": an arena stays 1 Cr; Thwacker's weakness on Ice
  and in the Cage stays; Whaler stays the Saw specialist. (The Killbox question was not asked: it stays as it is.)
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
- **T3. Level 2 is the softest step** (60% vs level 1; the others 64-66%). Small power nudges for Pincher and Whaler, then
  check the level steps again (`tools/damage-lab/tag-sim2.js` duel section). Done when: every step is 63-68%.
- **T1. Kev: retire the side folders.** Double-click `tools/retire-side-folders.cmd` once: it pushes the three 11 Nov
  experiment branches (`claude/arena-25d`, `claude/arena-3d`, `claude/arena-looks`; 4 commits only on Kev's PC) and only
  then removes the `.wt` folders.

## In progress

- **T25. Say why a robot rests and when it is back; make the fate step clear.** From Kev's playtest log of 17 Nov (two
  in-game reports): "it seems like my robot wrecker is permanently resting, I cannot seem to unlock it" (Rogue Firmware,
  played on him in round 6, keeps the robot out of round 6 and round 7: `sitOut`; the banner only said "RESTING · can't
  fight this round · ready next Upkeep") and "I think I only was able to spare angler, not wrecker?" (Wrecker was safe
  as a Fan Favourite; his 2 Cr plea for Angler lost to Plum's 2 Cr to scrap). Goal: the resting banner and hover name the
  cause, who did it and the round the robot is back; the fate step shows per robot why there is or isn't a plea (safe:
  Fan Favourite) and how the host decided. No rule change (K23). Files: `prototypes/tabletop-2.html` (robot card banner,
  fate step texts). Worker on branch `claude/resting-and-fate`, started 17 Nov. Done when: screenshots of both, game-sim
  and `mp-test` pass.
- **T21. Bid on sponsors; no screen flip when someone else picks.** (Stopped 18:30, resumed 18:50 on Kev's word:
  "continue both".) Kev (17 Nov): "when game starts and sponsor needs to be
  chosen, when another player picked another sponsor suddenly the screen flipped for the player, which is strange, let
  people bet on sponsors instead, with rebid, if rebid still undecided, do random". Goal: the sponsor step is a sealed
  auction (everyone bids at the same time, ties rebid, a rebid that is still tied is decided at random); nobody's screen
  moves because of another player's choice. Files: `prototypes/tabletop-2.html` (setup step, `ACT.pickSponsor`, AI,
  bot), `rules.html`, `docs/sponsors.md`. Worker on branch `claude/sponsor-auction`, started 17 Nov. Done when: scripted
  solo and 4-player online runs (bids, tie, rebid, random), screenshots, game-sim and `mp-test` pass, and what the prices
  do to start credits is measured.
- **T20. Popup questions move into the yellow note; "Pass" becomes "Let it happen".** (Stopped 18:30, resumed 18:50 on Kev's
  word: "continue both".) Kev (17 Nov): "let it happen";
  "move into note yes" (to: other popup questions such as the second robot in a double duel, Joint Venture, Hostile
  Buyout). Goal: every question the game asks one player mid-turn shows in the note with its answers as buttons, the same
  way the reaction window does since T2; popups stay only where the note cannot hold the question (say which). Files:
  `prototypes/tabletop-2.html` (`askSeat`, `smallAsk`, `RX`). Worker on branch `claude/questions-in-note`, started 17 Nov.
  Done when: screenshots of each moved question in the note at both window sizes, scripted answers work solo and from a
  joined client, game-sim, `reaction.js`, `waiting.js` and `mp-test` pass.
## Done

- **T23. Power map: counter arrows sized by strength** (17 Nov): width and head grow from 30 to 85+ points off the level
  odds; 30-39 thin and light (no tag in the game), 40+ dark (the game's 🎯/⚠️ counters); lists strongest first with a
  bar; hover picks out a pair. Arrows per robot: median 2 → 4 (max 14). Display only. Branch `claude/power-map-arrows`,
  commit `c614f0c`. BUILD `2026-11-17d`, files stamp `d318237d`; game-sim 2/2.
- **T22. Repair buttons in the YOUR MOVE note** (17 Nov): one button per damaged zone with its cost (actions, crew
  exhausted, credits), broken first; greyed with the reason when it can't be paid; Done stays at the top right; Stash
  parts that fit also get a button. Same `repairZone` / `fitStash` actions as the card. Branch `claude/repairs-in-note`,
  commit `86ba19b`. BUILD `2026-11-17c`, files stamp `d318237d`; game-sim 2/2, `repair-note.js` OK, online test 0
  desyncs.
- **T19. Game length after the arena change** (17 Nov, measuring only): 200 paired bot games, 11.55 → 11.63 rounds
  (+0.09 ± 0.13): not longer. Also found: the host's edge on its own picked arena is not seen in whole games (78% won vs
  77% expected without the arena); the bookie's same-level arena duels still use the 15 Nov per-arena tables; the AI
  rarely pays for an arena (keeps 3 Cr back). `docs/robocus-game-length-arenas.md`, `tools/arena-games-report.js`.
  Branch `claude/game-length`, commit `0ab3723`. No game file changed.
- **T2. The reaction window lives in the yellow note** (17 Nov): the floating box is gone; a player who can answer gets
  the cards and Pass as buttons and the note flashes red; a player with nothing to answer gets a quiet OK in a grey note.
  Timing as before (10 s, closes early when everyone has clicked; the first hand-back dropped the OK and was sent back).
  Branch `claude/reaction-in-note`, commit `9f6d1b4`. BUILD `2026-11-17b`, files stamp `d318237d`; game-sim 2/2,
  `reaction.js` OK, online test 0 desyncs.
- **T4. Arenas change who wins** (17 Nov): Saws and Killbox damage grows with the victim's level, Killbox spikes along the
  whole wall, Cage 4.75 m (was 6), Ice grip 0.3 (was 0.4). Robots moved 8+ points vs open floor: Saws 19, Cage 15,
  Ice 17, Killbox 9 (3,168 fights an arena; a cell ±4 to ±6). An arena pick is worth about +11 points to the host (was
  +4). Open floor unchanged (25 of 32 fingerprint lines identical; the 7 Killbox lines changed, as intended). New
  `ARENA_FIT`, tags, texts; `docs/robocus-arenas.md`. Also: Scythe + Repair kit poor-fit tag removed. Branch
  `claude/arenas`, commit `6794fff`. BUILD `2026-11-17a`, files stamp `d318237d`; game-sim 2/2, online test 0 desyncs.
- **T5. The Repair kit card repairs under fire too** (16 Nov): slowly (0.3 of its rate) while hit, full rate after 1.5 s
  without a hit. Measured +0.64 of a level (was +0.53), about ±0.13, 1,632 fights each way: at the bottom edge of the
  +0.65 to +0.85 target, not clearly inside; healing faster does not lift it (K18). Mauler's own module and every robot
  without the card fight as before (stock-fight fingerprint unchanged). The card is still out of the deck
  (`partCopies.repair: 0`). Branch `claude/repair-kit`, commit `9124a4c`. BUILD `2026-11-16j`, files stamp `b62ec563`;
  game-sim 2/2, online test 0 desyncs (9 fights checked).
- **T14 + T17. The online check tests the 2.0 page, also offline; `market-install-test.js` updated** (16 Nov):
  `node tools/mp-test.js` now runs `tabletop-2.html` with a local planck (`tools/planck-local.js`, shared with game-sim
  and the scenario scripts); planck is a devDependency; `AGENTS.md` 4.3 names the command and what a pass looks like.
  `market-install-test.js` covers the fit-at-once flow (32 checks). Tools only: no game file changed. Branch
  `claude/mp-test-2`, commit `e21c984`.
- **T13. Power map overlay** (16 Nov): `🗺 power map` button and key M; all 33 robots by level and strength for their
  level; this game's robots ringed in team colours and placed where they fight now (parts, tiers, damage) with a ghost
  at their as-new spot; click for counters and bands. The 15 Nov artifact is now in the repo as
  `docs/robocus-power-map.html`. Display only. Branch `claude/power-map`, commit `618037a`. BUILD `2026-11-16i`, files
  stamp `c572d16c`; game-sim 2/2, online test on the 2.0 page 0 desyncs (8 fights checked).
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
