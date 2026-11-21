# ROBOCUS task board

Kept by the orchestrator (see `CLAUDE.md`). Workers change only the status line of their own task. Newest at the top of
each list. A task is done when it is on `main` (commit and files stamp in the Done list).

## Waiting for Kev

Questions only Kev can answer. The orchestrator collects them here and asks in one message.

- **K48. Smarter AI hosts** (T46): (a) next to a team that hoards and hosts, AI teams spend about 10% less in the
  Market (they keep credits for the host seat): fine, or should they save less? (b) the host seat costs about 0.7 Cr a
  round more and hosts take about 10 Cr a game more in deals: fine? (c) the AI still can't outbid a 40+ Cr pile; only
  a cap or a credit sink would, and Kev chose neither: leave it?
- **K46. From the 21 Nov playtest** (T51): (a) as host you ran out of time picking the fighters (30 s) and on spare or
  scrap (20 s): longer for the host (60 s / 30 s)? (b) six AI trade offers timed out while you were bidding: fewer
  offers, longer, or keep them out of the way until you open them? (c) 9 of 15 fights were 90%+ for one side: is that
  the game you want (the host's power), or should something pull fights closer?
- **K45. Fire Sale and Hostile Buyout** (T45): (a) a person can win a cheap level 3-4 robot in the Market and Fire-Sell
  it the same round for +1 to +7 Cr: stop that (a robot gained this round sells without the +1, or can't be
  fire-sold that round)? (b) the AI now almost never plays Hostile Buyout and an AI target never refuses: fine, or
  should the AI use it to cost a target fame? (c) Fire Sale pays crew by a card value shown nowhere: show a value on
  crew, or leave crew out? (d) Fire Sale with no answer in time sells nothing and the card is spent: right?
- **K47. From the rules batch** (T47): (a) a won part asks only when two or more robots can take it (with one it goes
  on at once, with Undo): right? (b) 20 s for which robot, 30 s for sending a robot: right? (c) the trade banner: 4 s
  over the top of the pit; also for a Hostile Buyout? (d) Bookie's Friend and Hedge Bet are out of the deck (0
  copies): bring them back? (e) Crunch Week: keep the second button "Exhaust nothing"?
- **K43. Wear, after the merge** (T41): (a) level steps 0→1 (74%) and 1→2 (70%) are above the 63-68% band, and Hornet
  (-16) and Buzzkill (+13) moved: nudge them now (about 6-8% power each)? (b) Overdrive now measures about half a
  level stronger: run a parts test on Kev's PC (about 23,000 fights)? (c) three combos held at epic level in both
  rounds (Thwacker + Mine layer, Thwacker + Pester chip, Wrecker + Pester chip): make them epics, with names?

### Answered

- **Voting page "ROBOCUS open questions" (21 Nov, saved 17:35 UTC, https://claude.ai/artifact/XCgvAo3mtoDkWjSzU5uiZi):**
  39 questions, all of K10-K42 closed. Changes Kev chose: a wear mark is shown only, repair optional, AI ignores it
  (T41); Fire Sale back with 2 copies (T45); AI teams make the same deals with each other (T46); Crunch Week: "I tick
  everything myself: crew, bots and robots"; Repair kit 2 copies and "give it something extra, for example protecting
  the battery"; Bookie's Friend and Hedge Bet playable after locking; an open trade is cancelled when the last player
  locks; trades between other teams shown more clearly ("this would also be relevant when 2 players trade in a real
  life game which you are not involved in right"); "send a robot" gets 30 s, then the strongest ready robot; a won
  part: "Always ask me first which robot"; a log line for everyone when someone unlocks; rarity: "make them all
  distinctive with bigger glow for rarer items"; power map: great fits and epic combos move the robot; power map look:
  "draw me up some ideas to see if we can improve, can be fancy, try to be creative for some attempts"; wall slam: a
  plain flash and dents that fade; the impact also robot against robot. Kept as built: hoarding = teach the AI only;
  10 start credits; early robot prices; arenas rare with AI hosts ("we have to explore different arenas in the future
  that add real decisions"); Press Tour no answer = no; Mauler's repair; no Override of your own block; any trade
  unlocks; no AI offers after locking; timers 20/30/45 and their defaults; no timer on your own trade panel; no click
  delay on the reaction window; next lots on the strip; Done top right; Stash fit button; odds strip and rarity header
  clicks; bets on the cards only; power map arrows from 30 points, smooth; yellow-and-black cable. Left to the
  orchestrator (not asked): bookie arena tables one source, AI part pricing on a robot vs in a Stash, lab pages.
- **Fan Favourite, AI, prices (21 Nov):** no Fan Favourite brake ("lets not do that"); AI hosts should stop inviting
  a rival's Fan Favourite and the fame leader ("improving AI is always good"); hoarding: "yes" (read as: teach the AI
  to save for host bids, the first of the three options; no new sink or cap); Hostile Buyout's price follows the value,
  at least 4 ("ok, it should cost something to take a big robot"); Fire Sale: "pay value +1". T45, T46.
- **Hostile Buyout and robot value (21 Nov):** Kev: "I would like it to only taget robots. But then we should have a
  clear visual on robot value as well, that was a problem last time". Asked: Hostile Buyout stays as now (weakest
  robot, flat 4 Cr); robot value = a price in credits on the robot card. T44.
- **Kev's PC (21 Nov):** AMD Ryzen 7 9800X3D, 8 cores / 16 logical processors, 31 GB RAM. Enough for the bookie's
  test fights through workers (K31's processor question is answered). He offers it for big runs: "let me know if you
  want a big one to run on my pc, which is pretty fast".
- **Bump effects (21 Nov): stay out.** Kev: "no, I didnt like the visual aspect of the bump effects". The four
  Contact Lab bump switches (slide, under, crush, gut) stay off and are not measured for the game.
- **Card names (21 Nov):** fight formats keep the game's names ("keep games name"). Antikythera Core: "decide
  yourself" → on the Matador chip (T42). Wear drawing in the game's fight view: "port them then" (cracks, fold lines,
  saw grooves; part of T41).
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

- **T51. From Kev's playtest of 21 Nov (build 2026-11-21k, 15 rounds, 64 min, he won 13-10-9-9; log in
  /home/claude/t-play/kev-log.json).** Findings: (1) he hosted 9 of 15 rounds for 76 Cr and took 6 fame from hosting;
  AI host bids were 1-9 (T46 is on this); (2) the bookie ran 8 workers: duels got 77-200 test fights, but the three
  4-robot fights got 26-37, under the 40 needed, so they fell back to the formula: raise the worker cap (8 → cores
  minus 2) or the time for 4-robot fights; (3) 10 timeouts: 6 AI trade offers in the Market (20 s, while he was
  bidding), 2 backing requests, and twice as host: picking the fighters (30 s, round 7) and spare or scrap (round 11);
  (4) Plum (AI) traded in 6 robots, one of them its Fan Favourite (−1 fame), and spent 111 Cr in the Market: the AI
  trade-in rule churns; (5) 9 of 15 fights had a 90%+ favourite and the favourite won 14 of 15: hosts pick
  mismatches, and teams send robots with a broken Body; (6) round 5: he had no ready robot and sat out (−1 fame).
  Not started: (2) and (4) are worker tasks; (3) and (5) need Kev (K46).
- **T48. Look from the voting page (after T41 is merged: it rewrites the fight view).** (1) rarity: every tier
  distinctive, bigger glow for rarer; (2) wall slam: a plain flash, dents fade; (3) the same impact robot against
  robot; (4) power map: great fits and epic combos move the robot. Done when: screenshots at both sizes, checks pass.
- **T49. Repair kit: something extra** (after T41). Kev: "Give it something extra, for example protecting the
  battery". Measure options with `parttest.js` (target about three quarters of a level, as other parts), then propose.
- **T50. Power map: new look, ideas first.** Kev: "draw me up some ideas to see if we can improve, can be fancy, try
  to be creative for some attempts". The orchestrator draws 3-4 concepts on a design canvas; Kev picks; then a worker.
- **Idea box (Kev, 21 Nov):** "we have to explore different arenas in the future that add real decisions".
- **T40. Lineup Arena and Contact Lab pages throw a script error when they open** (found by T37, 21 Nov): the fourth
  robot card defaults to Juggernaut, which is no longer in the lineup (`tools/damage-lab/ui.js` `st.spec`). Fix there,
  rebuild with `build.py`. Done when: both pages open with 0 page errors, stock-fight fingerprint unchanged.
- **T36. `play-latest.cmd` must survive updating itself; port 8765 busy on Kev's PC.** Kev's first run (21 Nov) worked
  (server on 8766, game opened) but printed "'folder' is not recognized as an internal or external command": the update
  replaced the batch file while cmd was reading it, so cmd went on in the middle of a line of the new file. Goal: the
  batch reads itself whole before updating (one parenthesised block, or re-start itself from a temp copy), so a changed
  `play-latest.cmd` can never run half a line. Also: say in the window what holds port 8765 when it is busy and not ours
  (Kev got 8766; settings are per port). Done when: a scripted update that changes the batch mid-run runs clean (needs
  a Windows run by Kev or careful reading), `tools/serve-check.js` passes.
- **T30. Watch: `click-game.js` got stuck once on the rarity ladder panel** (a joined seat's Intrigue turn, the panel
  open over the screen, nothing but its ✕ to click; passed on a re-run). Clicker flake or a real trap for a player?
- (T41 saw `repair-note.js` fail on a clean main: "9 repairs: 8 buttons", Thumper's Weapon at 50% gets no button: T28.)
- **T28. Check: a broken weapon with no repair button.** Seen by the T21 worker in `repair-note.js` with seed 11 (a broken
  weapon on Thumper gave no button in the note). Test setup or a T22 bug? Reproduce and say.
- **T18. Watch: one online test run stalled in round 8, step "after", nobody waited for** (seen once by the T16 worker,
  0 desyncs, not seen again in three later runs). If it shows again: find it.
- (T41, 21 Nov: with wear on the steps are 74 / 70 / 69 / 63%; level 2→3 is no longer the soft one; see K43.)
- **T3. Level 2 is the softest step** (60% vs level 1; the others 64-66%). Small power nudges for Pincher and Whaler, then
  check the level steps again (`tools/damage-lab/tag-sim2.js` duel section). Done when: every step is 63-68%.
- **T1. Kev: retire the side folders.** Double-click `tools/retire-side-folders.cmd` once: it pushes the three 11 Nov
  experiment branches (`claude/arena-25d`, `claude/arena-3d`, `claude/arena-looks`; 4 commits only on Kev's PC) and only
  then removes the `.wt` folders.

## In progress

- **T38. (started 21 Nov, worker on branch `claude/garage`) NEXT BIG TASK (Kev, 21 Nov: "wait for some agents to finnish before implemnting this but this should be the
  next big task in line"). Garage: swap parts between robots in Upkeep.** Kev's idea: "modify the upkeep phase to also
  allow swapping of parts onto other robots for a small fee. To make this work, when a robot get scrapped it should
  also still give the parts back (perhaps damaged as well?) into the stash (stash limit should perhaps be removed).
  People can play around with swapping items and a sort of garage bill will be displayed which they can lock in".
  His answers (21 Nov): fee "1 coin for removal and 1 coin for install, maybe 2 for legandaries"; on piling onto one
  robot: "I would make swapping cost money and pay for removing + pay for putting an item on, which should reduce
  swapping all the time because money is important"; parts from a scrapped robot: "perhaps depends on what was
  damaged?"; "stash limit gone"; "should be seemless for people with no parts indeed"; and "I'm also thinking about a
  nice visual about the upkeep with a garage and your robots in the arena area". Starts after T41 (wear decides how
  damage sits on a part), T35 (what a scrap is worth) and T44 (robot value on the bill). Settled with Kev (21 Nov, "1 yes / 2 4 in total / 3 right"): fitting a
  part you just won stays free; a part from the Stash pays the 1 Cr install; a legendary costs 2 to remove and 2 to
  install (4 for a move); a part from a broken zone of a scrapped robot comes back broken and needs a repair, the rest
  come back whole. Then measure: scrap matters less, parts pile onto the best robot,
  fewer Market parts bought, AI must learn to swap, Upkeep clicks for a player who changes nothing (must be zero).
- **T44. A robot's value in credits on its card** (21 Nov): `robotValue(r)`: 1 + 2 x level; each fitted part at its bank
  price (half its Market value, at least 1); +1 per Fan token, +2 more for a Fan Favourite; -1 per repair action
  needed; -1 per extra round a rival's card keeps it out; never below 1. Shown as a gold "N Cr" chip on own robots,
  rival tickets and Market robot lots, and as "worth N Cr" where a robot changes hands. Display only; `BAL.showValue`.
  72 AI games: AI-to-AI sales paid value +0.3 +/- 0.2 (n=94); Market lots +1.4 (level 1 lots +3.5 in rounds 1-4).
  Doc `docs/robocus-robot-value.md`, test `tools/mp-scenario/robot-value.js`. Branch `claude/robot-value`, commit
  `058d62b`; build `2026-11-21j`, files stamp `352be701` (unchanged). Orchestrator's checks on the merge:
  game-sim 2/2, 0 page errors; robot-value, questions-note, market-step OK; mp-test OK, 0 desyncs, 8 fights.
- **T43. Mirror and Hostile Buyout texts say what the game does** (21 Nov; Kev: "fix text"): Mirror "fights as 2
  copies"; Hostile Buyout "Target sells you its weakest robot for 4 credits, or loses 1 fame" (the game never takes
  crew and always the weakest robot). Scalper Bot line: "Four credits each, no refunds." No rule changes. Branch
  `claude/card-flavour`, commit `bffe510`; build `2026-11-21i`, files stamp `352be701`. Orchestrator's checks on the
  merge: game-sim 2/2, 0 page errors; questions-note OK.
- **T42. Antikythera Core on the Matador chip** (21 Nov; Kev: "decide yourself"): 19 themed cards now. Branch
  `claude/card-flavour`, commit `c938616`; build `2026-11-21h`, files stamp `352be701` (unchanged). Orchestrator's
  checks on the merge: game-sim 2/2, 0 page errors; market-step and questions-note OK.
- **T37. Bending and wear measured for the game** (21 Nov): nothing switched on. 5,928 fights (every pair at most one
  level apart, 8 fights, three variants on the same seeds). Level steps hold on average (65% → 65% bend only / 67% all
  four) but 9-10 robots move outside their range (Thwacker −23/−26, Popcorn +18/+18, Whaler +17/+9, Gaucho −12/−15);
  bookie Brier 0.182 → 0.204 / 0.200, favourite wins 75% → 69% / 70%. Buzzkill vs Whirlwind bend 26-28° on average with
  bending on. The game's fight view draws bent outlines and debris but not fold lines, cracks, grooves or warps; a bend
  does not carry to the next fight. Doc `docs/robocus-wear-in-game.md`, tools `tools/damage-lab/wear-game*.js`. Branch
  `claude/wear-measure`, commit `4872da4`. Side finding: Lineup Arena and Contact Lab pages throw a script error on
  opening (fourth robot card defaults to Juggernaut, no longer in the lineup): T40.
- **T39. Themed names and drawings on 18 cards** (21 Nov): `FLAVOR` table keyed by card ids (6 parts, 12 cards), 18
  drawings in the scrapyard style (`FLAV_ART`), new name big with the game's name small under it, the line in the hover;
  `BAL.flavor` (true) turns it off. The log, rules and docs keep the game's names; a question that names a themed card
  says "Flavour name (Game name)". Display only. Antikythera Core held back (K35). Branch `claude/card-flavour`, commit
  `574317a`; build `2026-11-21g`, files stamp `352be701` (unchanged). Orchestrator's checks on the merge: game-sim
  2/2, 0 page errors; market-step, exhaust-cards, reaction 7 OK; questions-note OK on 2 of 3 runs (one 1-second
  countdown mismatch on a loaded box); mp-test OK, 0 desyncs, 9 fights. Doc: `docs/robocus-card-flavour.md`.
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
