# ROBOCUS task board

Kept by the orchestrator (see `CLAUDE.md`). Workers change only the status line of their own task. Newest at the top of
each list. A task is done when it is on `main` (commit and files stamp in the Done list).

## Waiting for Kev

Questions only Kev can answer. The orchestrator collects them here and asks in one message.

- **K34. Trade and bid in one step** (T26): (a) a trade still open when the last person locks: the game waits for it
  (answer or time-out); or cancel it? (b) any trade or bank sale unlocks your bids, also one that leaves credits the
  same: OK? (c) AI teams send no offers once you have locked: OK? (d) next round's lots only on the strip under the
  lots, not in the note: OK? (e) show AI-to-AI trades more clearly than a log line?
- **K33. Crunch Week, Press Tour, Repair kit** (T33/T34): (a) Crunch Week still takes all your crew and Security Bots by
  itself, only robots are a choice: should crew and bots be a choice too (the text says "any of")? (b) the AI only gives
  spare robots, weakest first: OK? (c) Press Tour played on you: 20 s, no answer is "no": OK? (d) Repair kit at 1 copy?
- **K32. Timers** (T31): (a) are 20 s (note), 30 s (box, host picking fighters) and 45 s (deal panel) right? (b) where
  every answer costs something, time up now picks: Hostile Buyout → Refuse (−1 fame); Tag Team offer → Team up; a threat
  → Refuse (the card may land); can't pay upkeep → weakest robot scrapped; Museum Donation → a crew member; hand limit →
  cheapest cards cashed in; you host spare or scrap → spare. Right? (c) a timer on "send a robot" too (default: strongest
  ready robot)? (d) a timer on your own trade panel in the Market?
- **K30. Start credits** (T29): 10 Cr makes the first Market a bit richer than before sponsors cost money (9.6 Cr spent,
  was 8.2). Keep 10, or try 9 (not measured)?
- **K31. Local server** (T32): how many logical processors does Kev's PC have (under about 6, four-robot fights may still
  fall back to the formula)? Hosting from the local copy works only when it matches GitHub Pages (a few minutes after an
  update): fine, or host through `play-latest online`?
- **K29. Reaction offers** (T27): a team that made a block can no longer Override its own block: fine? Robot Rights
  Protest: any team but its player may still Override a block of it, though that team then loses 1 fame too: keep?
- **K28. Reaction window buttons** (T20): should they also wait 0.8 s before taking a click, like the other questions?
- **K24. Power map arrows** (T23): counters from 30 points off (about 4 arrows a robot, up to 14 for Hydra and Gyro):
  right amount, or 35 (fewer)? Smooth widths, or 3 fixed sizes?
- **K22. Repairs in the note** (T22): order broken first, then worst damage: fine? Done at the top right of the note, or
  at the bottom? Stash parts that fit also get a button in Upkeep: keep?
- **K21. Arenas in whole games** (T19): the bookie's formula uses old per-arena tables for same-level duels and the new
  `ARENA_FIT` for the rest. Make it one source (drop the old tables: a few lines)? Let the AI host pay for an arena down
  to 1 Cr left (it keeps 3 Cr now, so arenas are rare in bot games)?
- **K18. Repair kit** (T5): it is now worth about two thirds of a level and won't go higher by healing faster. Good
  enough, or should it do something extra (protect the battery, points for repairing)? Should Mauler's built-in repair also work under fire? Card text "Repairs the robot all the time, fast
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

- **K27 (20 Nov): Crunch Week and Press Tour exhaust robots as well.** Kev: "exhaust robots as well". T34 (same worker as
  T33).
- **Repair kit (20 Nov): back into the deck.** Kev: "put it back". T33. (The rest of K18 stays open.)
- **K9 (20 Nov): `play-latest` starts a local server.** Kev: "yes". T32.
- **K28 (20 Nov): timers.** Kev: "yes, put them all on a timer" (to: should threats, Tag Team offers and backing requests
  get a timer too?). 20 s for the three already timed stays (no objection). T31.
- **K26 (17 Nov): sponsors.** Kev: "10, fine, ok": teams start with 10 Cr (was 8), T29; the AI bidding at most 3 Cr for a
  sponsor is fine; Joint Venture with no answer counts as Defect.
- **K25 (17 Nov): a trade after locking unlocks you.** Kev: "yes" (to: a trade that changes your credits after you locked
  your bids takes your lock off, as a changed bid does). He did not object to the reading of T26 (the open market runs
  during the sealed bids), so T26 goes ahead on that reading once T21 is merged.
- **K23 (17 Nov): the fate step tie stays.** Kev: "I think the spare scrap situation was handled well". The host keeps
  deciding between equal offers as it does now; T25 only makes the outcome clearer.
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

- **T36. `play-latest.cmd` must survive updating itself; port 8765 busy on Kev's PC.** Kev's first run (21 Nov) worked
  (server on 8766, game opened) but printed "'folder' is not recognized as an internal or external command": the update
  replaced the batch file while cmd was reading it, so cmd went on in the middle of a line of the new file. Goal: the
  batch reads itself whole before updating (one parenthesised block, or re-start itself from a temp copy), so a changed
  `play-latest.cmd` can never run half a line. Also: say in the window what holds port 8765 when it is busy and not ours
  (Kev got 8766; settings are per port). Done when: a scripted update that changes the batch mid-run runs clean (needs
  a Windows run by Kev or careful reading), `tools/serve-check.js` passes.
- **T30. Watch: `click-game.js` got stuck once on the rarity ladder panel** (a joined seat's Intrigue turn, the panel
  open over the screen, nothing but its ✕ to click; passed on a re-run). Clicker flake or a real trap for a player?
- **T28. Check: a broken weapon with no repair button.** Seen by the T21 worker in `repair-note.js` with seed 11 (a broken
  weapon on Thumper gave no button in the note). Test setup or a T22 bug? Reproduce and say.
- **T18. Watch: one online test run stalled in round 8, step "after", nobody waited for** (seen once by the T16 worker,
  0 desyncs, not seen again in three later runs). If it shows again: find it.
- **T3. Level 2 is the softest step** (60% vs level 1; the others 64-66%). Small power nudges for Pincher and Whaler, then
  check the level steps again (`tools/damage-lab/tag-sim2.js` duel section). Done when: every step is 63-68%.
- **T1. Kev: retire the side folders.** Double-click `tools/retire-side-folders.cmd` once: it pushes the three 11 Nov
  experiment branches (`claude/arena-25d`, `claude/arena-3d`, `claude/arena-looks`; 4 commits only on Kev's PC) and only
  then removes the `.wt` folders.

## In progress

- **T37. Bending and wear in real fights: measure first.** Kev (21 Nov): "I saw a fight between buzzkil and whirlwind
  and his blades didn't even really bend at any point. Did we forget to include this? at one point we had this"; then
  "yes do this first step". The 11 Nov wear effects (`ARC.cx.crack`, `frag`, `bend`, `grindout`) are off in the game;
  balance with them on was never measured. Goal: numbers for two variants, (A) bending only, (B) all four wear effects,
  against today's game (all off), same seeds: win rate per robot, how the level steps move (higher level wins, per
  step), fight length and knockouts, which robots gain or lose most, how far the bookie's odds would be off, and what
  the game's fight view (`src2/view.js`) draws of a bend or crack today. Nothing is switched on in the game. Done when:
  `docs/robocus-wear-in-game.md` with the numbers, fight counts and ±, and options for Kev. Worker on branch
  `claude/wear-measure`, started 21 Nov.
- **T35. Is a Fan Favourite a money runaway? Measure, then propose.** Kev (20 Nov, after a solo game he led with 45 Cr
  against 6-7): "I can runaway in money by making a robot fan favourite and after that getting into battles by whatever
  means, they cannot scrap it and I get payed a lot. Can you check by doing AI battles if this can be countered or should
  we balance it". His log: appearance money was 18 of his income, the same as Rust Rivets's 18; he also earned 12 from
  backing, 12 from cashing in cards, 9 from host deals, and spent less than the AI teams. Goal: bot games that show (a)
  what a Fan Favourite is worth in credits and wins, (b) whether a team playing Kev's line beats normal AI teams far more
  than 1 in 4, (c) whether counters the game already has stop it, (d) what each balance option would do. Measuring and
  options behind `BAL` switches (default off): no change to the game as played until Kev picks. Worker on branch
  `claude/fan-favourite-check`, started 20 Nov. Done when: `docs/robocus-fan-favourite.md` with the numbers, game counts,
  ± and a recommendation.
## Done

- **T26. Open market and sealed bids are one step** (20 Nov): the lots can be bid on from the start of the Market; trades,
  bank sales and AI offers run while people bid; no "Start the auction". Everyone locked: trading closes, the lots go out.
  A trade that goes through or a bank sale unlocks you; bids above your credits grey the Lock (Skip or a drop lowers them
  from the last lot down); an open deal at the last lock holds the step until it is answered or times out (`G.mDeals`).
  60 solo bot games each way: one click-wait less per round (3.73 → 2.90), rounds −0.28 ± 0.55, Market spend unchanged,
  trades with the person 3.52 → 2.92. New tests `market-step.js`, `market-step-online.js`, `tools/market-step-measure.js`.
  Branch `claude/market-one-step`, commit `62cb06b`; build `2026-11-20f`, files stamp `352be701`. Orchestrator's checks
  on the merge: game-sim 2/2, 0 page errors; market-step, market-step-online 7 (0 desyncs), questions-note,
  exhaust-cards OK; mp-test OK (0 desyncs, 8 fights); click-game 5 3 OK.
- **T33. Repair kit back in the deck; T34. Crunch Week and Press Tour exhaust robots** (20 Nov): `BAL.lots.partCopies`
  no longer has `repair: 0` (1 card; part cards 19 → 20). Crunch Week: crew and Security Bots as before, plus the robots
  you tick (+1 Cr each). Press Tour: crew, then bots, then robots the target picks, or "No thanks". The AI only gives
  spare robots, never its strongest ready one. Banner "RESTING · Crunch Week (you) · ready next Upkeep". 40 bot games
  each way (start credits 8): kit bought 58% of offers, median 2 Cr; game length −0.25 ± 0.62 rounds (kit), +0.23 ± 0.35
  (cards). New test `tools/mp-scenario/exhaust-cards.js`. Branch `claude/repair-kit-back`, commit `fdd76db`; build
  `2026-11-20e`, files stamp `352be701` (unchanged by this task). Orchestrator's checks on the merge: game-sim 2/2, 0 page
  errors; exhaust-cards, resting, questions-note OK; mp-test OK, 0 desyncs.
- **T31. Every question to one player has a timer** (20 Nov): 20 s in the note, 30 s in the box and for the host picking
  the fighters, 45 s for a deal panel (`BAL.askMs`, `askBoxMs`, `askDealMs`); time up takes the default and logs a ⌛ line.
  One game clock that stops while paused; a queued question gets its full time; online the host judges every time-out
  (new `shown` message and `cancelQ` in `src2/net.js`), a rejoining player gets the time left. Table of every question
  in `docs/robocus-2.0.1-screen.md`. Fixes on the way: Tag Team Licence crash on a closed question; hand limit that could
  not end; upkeep debt cleared without a scrap. Branch `claude/timers-everywhere`, commit `6f649ea`; build `2026-11-20d`,
  files stamp `352be701`. Orchestrator's checks: game-sim 2/2, 0 page errors; questions-note, questions-remote 7,
  reaction 7, waiting 7 OK; mp-test OK, 0 desyncs, 8 fights. Known limit: a reaction window over a question does not stop its clock.
- **T32. `play-latest` serves the game from this PC** (20 Nov): `tools/serve.js` (Node; `tools/serve.py` for Python), on
  127.0.0.1:8765 only, read-only, repo files only; `play-latest` starts it and opens the game there, reuses a running
  one; `play-latest file` is the old way, `play-latest online` unchanged. From a local address the invite link points to
  the GitHub Pages copy. The batch file was not run on Windows (none here): Kev's first double-click is the test. Branch
  `claude/play-local-server`, commit `e6364d5`.
- **T29. Teams start with 10 Cr** (20 Nov): `BAL.startCredits` 10. 80 bot games each way: the first Market spends 9.6 Cr and
  sells 2.15 lots (before sponsors cost money: 8.2 Cr, 1.65 lots; with 8 Cr: 6.9, 1.36), so 10 overshoots a little; game
  length unchanged. Branch `claude/start-10`, commit `a3846f3`.
  T29 + T32 merged together: BUILD `2026-11-20c`, files stamp `a63dc7e9` (net.js changed); game-sim 2/2, online test 0
  desyncs; the server checked by hand (200 for the game, 403 for `..`, `.git` and a foreign Host).
- **T27. Reactions are only offered where they can help you; buttons say what they do** (20 Nov): the scheme's player is
  no longer offered Firewall against an Override that pushes its own scheme through (Kev's case); a team is not offered a
  block of a scheme that only gives it something, nor Override against its own block; the AI follows the same rule;
  every button and the window text say what happens to whom. Table in `docs/intrigue-deck.md`. Branch
  `claude/reaction-own-scheme`, commit `61f38c8`. BUILD `2026-11-20a`, files stamp `d318237d`; game-sim 2/2;
  `reaction-own.js`, `reaction.js`, `questions-note.js` OK (the last one failed once on a timing check with the box at
  load 18, passed on re-run); online test: the worker's run 0 desyncs (6 fights); the orchestrator's run timed out at
  round 5 on the overloaded box with no desync.
- **T20. Questions and offers in the note; timers; no accidental yes** (17 Nov): the reaction button reads "Let it
  happen"; second robot, Joint Venture, Hostile Buyout, Tag Team, Stash fit, backing requests, AI and player trade offers,
  threats, spare-or-scrap and more are asked in the note with the red flash; offers say what you give and get; answer
  buttons ignore clicks for 0.8 s and while the pointer was already on them; a yes that costs credits or changes the
  garage is never the default; Joint Venture, Hostile Buyout and the host's Arena card count down 20 s (Defect, Refuse,
  No); the waiting list shows YOUR MOVE for any open question. Tick-box and deal-panel questions stay boxes with the
  note pointing at them. Sent back once (broke with T21 and T25 merged), fixed. Branch `claude/questions-in-note`, commit
  `abddac4`. BUILD `2026-11-17g`, files stamp `d318237d`; game-sim 2/2; `questions-note.js`, `resting.js`,
  `repair-note.js`, `reaction.js`, `waiting.js` OK; online test 0 desyncs (12 fights).
- **T21. Sponsors are bid for** (17 Nov): all 6 sponsors on the table; sealed bids, a change after locking unlocks, tie
  rebid, a random draw if still tied, a free sponsor for a team that wins none; the draft shows who signed what for how
  much. The "flip": with 4 people the dealt hands overlapped, and when another player signed a sponsor you also held, your
  card was swapped for another in place. Economy (80 bot games each way): teams pay 1.6 Cr on average, round-1 Market
  spend 8.2 → 6.9 Cr, game length unchanged (+0.11 ± 0.29 rounds). Branch `claude/sponsor-auction`, commit `68cdd60`.
- **T25. Resting robots say why and when they are back; the fate step says why** (17 Nov): banner "OUT · Rogue Firmware
  (Rust Rivets) · back in round 8"; Rogue Firmware reads "out for 2 rounds" everywhere; per-robot status at the fate step
  and a why line after the host decides. No robot can get stuck resting (checked). Branch `claude/resting-and-fate`,
  commit `ef5feef`.
  T21 + T25 merged together: BUILD `2026-11-17f`, files stamp `d318237d`; game-sim 2/2, `resting.js` and
  `repair-note.js` OK, online test 0 desyncs.
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
