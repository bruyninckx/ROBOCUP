# ROBOCUS 2.0.1 screen rework (started 15 Nov 2026)

Why: Friday playtest (13 Nov). Friends said it was not clear when they had to click, there was too much clicking, and they wanted the hand more visible. Kev asked for a slideshow feel (the screen slides left to right on every phase) with a clean overview on the right of who we are still waiting for. Never played on a phone, so phone layout does not matter.

Mockup: Design artifact "ROBOCUS slideshow UI" (https://claude.ai/artifact/5fBhSgA8e3UeQDzKN4hW4n). Kev's decision: rework the current screen (tabletop-2.html), not a new screen beside it.

## Layout now (device commits 52e6469 and 3a606e0, BUILD "tabletop 2.0.1 2026-11-15c ...")

- Left: your robots and Stash. Middle: the pit, and under it the hand, always open, cards side by side (`HAND_H` in `benchLayout` is worked out in screen pixels: 222 px). Right, top to bottom: the note (`L.note`, 176), the waiting list (`L.wait`, 232), the log.
- `#waitRail` (drawn by `renderWaiting()` from `netWaiting`): one row per team with YOUR MOVE / DECIDING / READY / NOTHING TO DO / AI / PLAYING, heading "WAITING FOR n" or "NOBODY HAS TO CLICK". In a reaction window every row says CAN ANSWER (no names); the window itself is in the note (T2, below). On your own row, when it is your move, the note's main button is repeated and flashes (`.wr-go`; a click presses the note's button); with no button to press the YOUR MOVE pill flashes.
- The note has three states (`promptState()`): YOUR MOVE yellow, LOCKED IN green, NOTHING FOR YOU TO DO grey. LOCKED IN for bids and bets can be undone by changing them while others still decide (T16, below).
- Phase slide (`SLIDE` in `renderWorld`): the old pit slides out left, the new one in from the right, 520 ms; only pixels move. `window.__noSlide = true` turns it off.
- The banner over the pit, the dots in the top bar, the hand's tab and pin are gone.

## Choices in the note (T9, 16 Nov)

Kev: "When you can send a robot to the pit, also make that 'to the pit' option visible in the yellow window on the right. As much as possible."

- Invited to a fight (any format): one green button per robot in the note, `▶ <name>` with a hint on the right (no damage, damaged ⚔, broken ⚙; pinkish when damaged). Exhausted robots are shown greyed out. Same click as the card's SEND … TO THE PIT (`act('sendBot', id)`); the card button stays.
- Same idea, same action paths as the pit/card: Keep <starter> (`pickStarter`), fit a won part on a robot (`install`; hint: the odds change, greyed when there is no room), host invite toggles per team (`pickTeam`; hint: ready robots), tie rebid − / + (`rebidAdj`).
- Built with `pickBtn()` (class `.act.pick`, data-send / data-fit / data-keep / data-sign / data-inv). The waiting list does not repeat them (`.wr-go` skips `.pick`). In a tight note the buttons come first (as before); with 4 or more they go two per row without hints (`.many`).
- Not in the note (need a picker): lot bids, bets, Intrigue cards. (Repairs: in the note since T22, 17 Nov, below.)

## Change after locking (T16, 16 Nov)

Kev: "also, when people lock bids, people can still change their bids after that if there are other people not locked yet but if everybody locked it it continues"

- Before: a lock was one-way. After locking, the lot steppers (and the host-bid stepper) were still drawn and clickable, but the host ignored the click without a word (`ACT.bid` returned on `iDone(S)`); the bet chips and the fight-card −/+ were hidden ("(locked)"), a click on a robot's bet card was ignored the same way; the robot-count button and the rebid −/+ were gone from the note.
- Now: lot bids (`lots`), the host bid and robot count (`hostbid`, `ACT.hostCount`), bets and fight-card bids (`bets`) and a tie rebid (`ACT.rebidAdj`) stay editable after locking while someone else has not locked. A real change (the amount moves) takes your own lock off on the host: `unlockSeat(S, step)` deletes `G.gather.done[S]` (rebid: the seat goes back into `tie.waiting`) and writes a line in your log. Your note goes back to YOUR MOVE with the lock button, every waiting list shows you DECIDING again (no amounts: sealed bids stay sealed). Lock again when you are done. A click that changes nothing (− at 0, + with no credits left) keeps the lock.
- The locked notes say so: "You can still change … until everyone has locked. A change unlocks you; then lock again." The host-bid note keeps the 🤖 robot-count button, a locked rebid keeps its −/+ (the pit shows "LOCKED · A CHANGE UNLOCKS YOU").
- Solo (one person): the lock is the last lock, so the step goes on at once, as before.
- Online: everything runs on the host in the order the actions arrive, so a change and the last lock can't cross. A change that arrives after the step went on is refused with a line in that player's log ("⌛ Too late: … your change was not made.").
- Bets kept their older rule on top: a changed public bet also un-locks everyone else who locked.
- Bot (`?bot=1`): makes its bids/bets once per step (`botDid`) and after that only locks. A joined screen sees its own lock a moment late, so without this a bot would bid again on the stale screen and un-lock itself over and over.
- Not changed (one-off actions, not amounts): Upkeep (repairs after "done"), "Start the auction" (trading stays open anyway; the button is gone since T26), sending a robot, picks, Market results, next round, Bookie's Friend and Hedge Bet (card plays; since T47 their buttons stay in the locked note and playing one keeps your lock, see below).

## A click in the note shows it worked (T15, 16 Nov)

Kev: "when I clicked it it somehow didn't register, or perhaps it did register but the button still showed, should be something like a checkmark after that button so we know it did its work"

- What happened: after a send, the bookie's test fights started at once. On a page opened from a file (`play-latest.cmd`) they run on the page itself (no workers) for `BAL.bookie.ms` (4 s), and each test fight blocks the screen, so nothing was painted for seconds; and the note had no text for "fighters in, bookie busy", so it kept the old green buttons (a host who invited itself got the invite buttons back). Measured here (file://, a loaded test box): first paint 5.4 s after the click in a duel, 7.8 s after the second-robot click in a double duel.
- Now: `pickNow(kind, value, label, run)` marks the choice (`pickWait`, local only), redraws the note (clicked button `✓ Mauler sent`, class `.done`; the rest greyed, `.sent`, disabled; note grey AT THE TABLE, not YOUR MOVE; your row in the waiting list no longer YOUR MOVE) and runs the action only after that frame is on screen (`afterPaint`: next frame, 0.1 s at most). The robot card's SEND button and the pit text show the same ✓. Measured: ✓ painted 4-35 ms after the click.
- New note while the fighters are in (`G.fight`, not choosing): `✓ <robots> sent`, then "🎩 The bookie is watching test fights of this matchup…" while this page's bookie runs (`bookieOn`, set at the call in `afterChoose`, which also waits one paint before the test fights start), or "2 robots per side: send a second robot (the question in the middle), or Just one" / "Fighters are in. The bookie sets the odds next…".
- Same ✓ for Keep <starter>, fit on <robot>. Invite toggles and rebid −/+ already change at once; on a joined screen they get a green ring (`.pressed`) until the host answers.
- Online: display only, the action is the same `act()`. On the host's page (and solo) the mark is dropped just before the action runs, so a refused click (exhausted robot, too late) re-renders the real state at once. On a joined screen it stays until the host's answer re-renders the note, 4 s at most.

## Fewer clicks (Kev said yes to all four, 15 Nov)

- Upkeep: a player with nothing to repair and no Stash part that fits (also no robots, round 1) is ready after 0.6 s (`upkeepIdle`, `autoStep`).
- Market results (after the lots, after the host bid) and "next round": go on by themselves after `BAL.autoMs` (6 s). The count only runs while nobody has something else to do (fitting a part, trade-in, open question, reaction window). The note shows "Goes on by itself in N s" (`G.autoLeft`); the button stays. `window.__noAuto = true` turns it off.
- Bets: one chip per amount on each robot (`bet_amt`, `ACT.bet(S, side, amt)`); the same amount again takes the bet back. Lock bets is still a click (the card bids are in the same step).
- A won part goes on at once (`applyMarketWins`, `BAL.autoFit`); since T12 also with two or three robots that can take it (see below). Since T47 (`BAL.autoFit: 'ask'`) the game asks first when two or more robots can take it.

## A bought part goes on at once, with Undo; the note flashes red for a choice (T12, 16 Nov)

Kev: "when you buy a part, put it on the robot immediately but do show an undo button for 5 sec in the yellow box so people can undo that ... try to put options to click also in the yellow box at all time." And: "the your move box should flash red when a choice needs to be made".

- A part a person wins goes on at once (`autoFitPart` from `applyMarketWins`): one robot with room: that one; several: the one whose odds vs the field gain most (`bestFit`: the same `fieldOdds` with / without the part that the fit buttons show; ties: the stronger robot; while the bookie is still working: the AI's pick, `aiPickRobot`). No room anywhere: the Stash, as before.
- The note shows "🔩 <part> fitted on <robot> (best fit), odds a → b", an **↶ Undo N s** button with a shrinking bar, and with several robots one **↪ <robot>** button per other robot that can take it (hint: its odds). Moving starts the 5 s again. Records: `PS(S).fitUndo` (robot, part, rarity tier and slot state before the fit).
- **Undo** (`ACT.undoFit`): the part comes off (`fitOff`: parts, legendary slot, rarity tier exactly as before) and waits in `PS.install` as before T12: pick a robot (note, card or bay) or 📦 Keep in Stash; Continue still puts an unfitted part in the Stash. **Move** (`ACT.moveFit`): off the one robot, on the other.
- When it is final (decided on the host only): 5 s on the host's clock (`fitUndoTick`, every screen shows the host's count `left`), any other action of that player (`runAct`), or the Market moving on (`continueMarket`). A late Undo / Move is refused with a log line for that player.
- Online: Undo and Move are ordinary actions sent to the host (`act` → `sendAct`), nothing new in src2/net.js. Nobody waits for the window: the waiting list does not list it (the seat is "reading the results" as before), and the 6 s auto-advance keeps counting; if it fires first, the fit is final.
- AI teams fit as before (`aiPickRobot`). The test bot (`?bot=1`) never needs to click: its part is already on.
- Red flash (`flashNote`, `choiceKey` in `promptState`): when a new choice lands on you (a new step, question or part to fit, or a fitted part you can move), the YOUR MOVE note pulses red three times (~1.7 s, `@keyframes pbFlash`) and goes back to yellow; with reduced motion a red outline for 2 s instead. Not for LOCKED IN, NOTHING FOR YOU TO DO, steps that go on by themselves, a Move or the end of the window, or a part on your only robot with room (Undo only).
- Fix: the pit header said "FIT … ON A ROBOT (RIGHT)"; your robots are on the left.
- Not changed: the Stash's own Fit button still asks "On which robot?" in a popup when several robots can take a Stash part.

## The reaction window is in the note (T2, 17 Nov)

Kev agreed on 15 Nov ("Reaction window inside the note instead of a popup"); from the playtests: "it wasn't very clear when people had to click", options to click "in the yellow box at all time", "the your move box should flash red when a choice needs to be made".

- Before: a small box over the pit (`#reactWin`) with a countdown, its cards and Pass, or "You have no card to play here" and OK.
- Now (`smallAsk` draws into the note through `RX` / `rxNote()`; same `askSeat(..., { small: true })` path, same `reactionWindow()`): the note shows the window's title, the seconds and a shrinking bar, the text the box had (who plays what on whom, the card's text), and one button per answer (`.act.pick`, data-rk), then Pass. A label with a part in brackets ("🤖 Roll a Security Bot (1 in your garage, blocks on 4–6)") shows the bracket as the quiet hint on the right.
- Holding an answer: YOUR MOVE · ANSWER?, the note flashes red (`flashNote`, key `rx|<id>`). Nothing to answer: label REACTION WINDOW, grey, the same countdown, "You have no card to play here." and one quiet OK button (as the box had; a click shows ✓), no YOUR MOVE, no flash. A screen with no window during someone else's window (the player of the scheme) is AT THE TABLE, no longer YOUR MOVE.
- A click: ✓ on the button at once, the rest greyed, label ANSWER SENT; the answer goes out after that frame is painted (`afterPaint`, as T15's `pickNow`, but its own state, so it can't grey the next note). The note keeps the ✓ and the count until the host closes the window (`G.reacting` cleared) or the count runs out. Coming back from the window to the step you were on does not flash again.
- Fit: 1–3 answers plus Pass fit at 1600x900 (note 179 px) and 1280x720 (141 px). Four or more buttons go two per row (hints hidden). When the note is tight the seconds move up to the label line and the title goes (the text says it); the text keeps at least one line and scrolls; the buttons never shrink. Six or more (Botched Install with several parts) scroll inside the note.
- Unchanged: window length (`REACT_MS`, 10 s), early end, who gets a window, the default on timeout (null: let it happen), first answer on the host wins, the waiting list (CAN ANSWER on every row), online path (`N.ask` with `small`, `N.cancelSmall`, client `showAsk`). Nothing new is synced.
- Timing exactly as before T2: the window lasts `REACT_MS` (10 s) and ends early when a card is played or when every person in it has clicked (card, Pass or OK). In a game with one person only someone holding an answer gets a window at all (no card: no window, no wait), as before.
- Other mid-turn questions stay as the big question box (`ivModal`): Joint Venture, Hostile Buyout, Tag Team, second robot, Treacherous, threats and payoffs, spare or scrap deals, Hacker / Scope / Bookie's Friend information, upkeep debt, hand limit. They are one person's question, not a timed window for the whole table; some have checkboxes or long text; moving them is a look Kev has not asked for. `askSeat(..., { small: true })` would put one in the note (with a countdown) if he wants. (T20, 17 Nov: these now go in the note too, see below.)
- Test hooks: `ROBOCUS_DEBUG.RX`; tools/mp-scenario/reaction-note.js (solo, both screen sizes, screenshots), reaction.js and lib.js / clicker.js / cards.js find the window in the note (`#promptBar.rxmode [data-rk]`).

## Repairs in the note (T22, 17 Nov)

Kev, 17 Nov (round 2 Upkeep, one broken Body on Wrecker): "also add repair options in red box".

- Upkeep, something to repair: the note says `🔧 Upkeep: repairs. N actions left, then 2 Cr each.` with Done → Intrigue on the same line (right), and under it one button per damaged zone of your robots: `Wrecker · ⛨ Body (broken)` with the cost on the right: `2 actions · exhausts 2 Mechanics`, `2 free actions`, `1 action + 2 Cr` or `4 Cr`. Broken zones are red, like the card; damaged ones dark. A cost in credits is shown in pink (yellow on red). Zones that are ok get no button. The full rule (who repairs, costs, free actions) is in the hover help of the text and in each button's tooltip.
- How it is paid comes from `repairPlan(t, n)`: the same order as `spendRepair` (free actions, crew already at work, fresh crew who are then exhausted, then credits), without changing anything.
- A click: `pickNow('rep', ...)` (✓ at once), then the same `act('repairZone', robotId, zone)` as the zone click on the card (welding sparks on the card too). The button goes, the counts update, and the text adds `✓ Wrecker ⛨ Body repaired.` (also after a zone click on the card). On a joined screen the ✓ mark is dropped as soon as the host's answer shows the zone repaired, so the next repair can be clicked at once.
- Can't be paid (no actions, not enough credits): the button stays, greyed, `can't pay: 4 Cr (you have 1)`; it can't be clicked, and the host refuses `repairZone` as before.
- Order: broken zones first, then the worst damage (lowest health), then weapon, drive, body, then robots in bay order.
- Fit: up to 3 buttons one per row (name left, cost right); from 4 on two per row with the cost on a second line. Done stays visible; the button list scrolls inside the note when it is longer (1600x900: 6 fit, 9 scroll; 1280x720: 2-3 rows show, the rest scroll).
- Also in the note in Upkeep: `🔩 <part> → <robot>` for each Stash part that fits a robot now (hint: the odds), the same `act('fitStash', k, id, robotId)` as the Stash card's Fit.
- Nothing to repair and no Stash part to fit: the old one-line text and Done (a person with nothing to do still goes on by itself after 0.6 s).
- Not changed: repair rules, costs, the zone buttons on the card, what is synced, the bots and AI teams.
- Test: tools/mp-scenario/repair-note.js (solo, both screen sizes, screenshots), tools/mp-scenario/repair-note-online.js (a joined client presses the note buttons and the card zone).

## Questions in the note (T20, 17 Nov)

Kev, 17 Nov: "1 ok so window can end early", "2 let it happen", "3 move into note yes"; from the playtest: "this joint venture should
also be in the yellow box with a timer", and "wonder why I suddenly ended up with snapjaw in my garage" (an AI offer opened as a
popup where his pointer was, right after End turn, and his next click landed on Accept).

- The reaction window's "Pass" reads **Let it happen** (the value behind it is the same; a player with no card still gets OK, so the window can end early).
- A question to one player (`askSeat` without `small`, and the Stash's "On which robot?") is drawn in the YOUR MOVE note: `askBox()` →
  `noteAsk()` (RX.q) when `noteFits()`, else the old box (`ivModal(..., game=true)`). In the note: its title and text, one button per
  answer (✓ when clicked, ANSWER SENT), YOUR MOVE and the red flash when it lands. Same answers, same values, same order (one question
  at a time per screen: `modalChain`), same host-side decisions, same messages online (a joined screen decides note or box from the same html).
- `noteFits`: 1 to 6 answers (4+ two per row), no ticks or text fields, fewer than 3 lines of list (`<br>`) and at most 320 letters. Otherwise it
  stays in the box over the pit, and the note says `YOUR MOVE · IN THE MIDDLE ←` "This question is open in the box in the middle of the
  screen: answer it there." (and flashes). A deal panel gets the same pointer ("A deal panel is open in the middle of the screen").
- (T31, 20 Nov: every question is timed now, see "Every question is timed" below.) Countdown: only the questions that had a time limit in the code (it was never shown or used since Kev's 6 Nov "no countdown bars"):
  Joint Venture, Hostile Buyout, the Host step's Arena card. They count down **20 s** in the note (bar and seconds, as the reaction
  window), then take their default: Joint Venture **Defect** (it was Commit: Commit loses your 2 Cr if the other side defects, and a
  "yes" that can cost you is never the default), Hostile Buyout Refuse (−1 fame, the card's own price for saying no), Host step No.
  Online the joined screen counts down and sends "no answer"; if that never arrives the host closes it 4 s later (its default). Every
  other question waits for its answer, as before.
- No answer by a click already on its way: a question's buttons (note or box) are inactive for 0.8 s after it appears (greyed, `.arming`),
  and a button that opened under the mouse pointer stays inactive until the pointer has left it (`armBtns`, `PTR`). The test bot and the
  AI answer through the code, not by a click.
- AI offers say what you give and what you get: "Rust Rivets offers you its robot Snapjaw (...) for 2 Cr. You give 2 Cr, you get Snapjaw in
  your garage."; a part: "you give 2 Cr, you get the part"; a Stash part they want: "you give the part, you get 3 Cr". Default on a closed
  offer: refuse (unchanged).
- Fate step (T25): under a question in the note, or under the pointer at a deal panel ("Plead to spare Angler"), the note keeps T25's
  status of your losing robots ("▶ Angler: the host decides; you can offer credits to spare it · Wrecker: safe (Fan Favourite, ...)").
- Sponsor step (T21): its bids, lock and tie rebid are the note's own buttons, not questions: no 0.8 s wait, no pointer; the waiting list
  says YOUR MOVE · sponsor bids.
- Waiting list: while a question is open for you (note or box or deal panel), your row says YOUR MOVE with the question's title and the
  heading is WAITING FOR n (the box now redraws the list when it opens; before T20 it could stay NOTHING TO DO). For a joined player the host
  lists the open question's title, as before. A reaction window still shows no names.

| Question | Where now | Why |
|---|---|---|
| Reaction window (cards, Security Bots, Let it happen / OK) | note (T2), 10 s | as T2; "Pass" now "Let it happen" |
| 🤖🤖 Second robot? (double duel) | note | a few robots + Just one |
| 🤝 Joint Venture | note, 20 s, default Defect | two answers; Kev asked for a timer |
| 🏢 Hostile Buyout | note, 20 s, default Refuse | two answers |
| 🤝 Tag Team Licence (pick ally) | note | up to 3 teams |
| 🤝 Tag Team offer (Team up / Refuse) | note | two answers |
| 🤝 … hesitates (sweeten the Tag Team) | box (deal panel) + pointer in the note | a deal panel: credits, parts, robots to put on the table |
| 🔩 Fit … On which robot? (Stash card) | note | robots + Cancel |
| 🧾 You can't pay your upkeep | note up to 6 robots; box + pointer with 7+ | one button per robot |
| 🤝 Ask for backing | box + pointer | ticks (which teams, Board Seat) |
| 🤝 Ask … for backing (offer) | box (deal panel) + pointer | a deal panel |
| 🤝 Backing request (Accept / Refuse) | note | two answers |
| 🤝 Offer from … (AI: part, robot, Stash part) | note | two answers; says what you give and get |
| 🤝 Trade with … (your own trade) | box (deal panel) | you opened it yourself |
| 🤝 Trade offer from … (Accept / Refuse) | note | two answers |
| 💰 Paid Off (which team gets your 3 Cr) | note | up to 3 teams |
| 🙅 Not My Robot (who is hit instead) | note | up to 3 teams |
| 🏛️ Museum Donation | note up to 6 choices; box + pointer with more | one button per robot / ready crew member |
| 💰 Over your hand limit | box + pointer | ticks (cards to cash in) |
| 🔧 Botch it now? | note | two answers |
| 💰 A threat (Pay / Refuse, or Accept / Refuse a demand) | note | two answers |
| 💰 Payoff from … / Buy off … (demand or offer) | box (deal panel) + pointer | a deal panel |
| 👑 Host … picks the fighters (Invite me / Leave me out / No deal) | note | three answers |
| ✋ Ask to be invited / 🙈 left out (offer) | box (deal panel) + pointer | a deal panel |
| 🏟️ Host step (play an Arena card?) | note, 20 s, default No; box + pointer with 3+ cards | card texts are long |
| 💻 Hacker (what it saw) | note (OK) | one line |
| 🔍 Bookie's Friend | note with 1-2 hidden cards; box + pointer with 3+ | a list to read |
| 🔀 Swap the Entry? | note up to 5 swaps + No; box + pointer with more | one button per swap |
| 🔀 Swap or payoff? | note | two answers |
| 👑 Spare or scrap? | note | three answers |
| 👍 Plead to spare / 👎 Push to scrap (offer) | box (deal panel) + pointer | a deal panel |
| ✦ Treacherous, ✦ Scope | note (not asked in 2.0: robots have no quirks there) | two answers / one line |
| 🐞 Report a problem, Add a note, Playtest log | box | playtest tools, not game questions (text field) |

- Tests: tools/mp-scenario/questions-note.js (solo, 1600x900 and 1280x720: every moved question answered each way, closed, and Joint
  Venture left to run out; countdowns; the waiting list; Bookie's Friend 1 and 4 cards; six answers with a long text; the robot offer:
  Decline changes nothing, a click at once or under the pointer does nothing, Accept after the pointer moved buys the robot);
  tools/mp-scenario/questions-remote.js (a joined player: second robot both ways, Hostile Buyout both ways, Joint Venture countdown and
  closed by the host = Defect, its own waiting list says YOUR MOVE). Screenshots in /home/claude/t20-shots (not in the repo).

## Every question is timed (T31, 20 Nov)

Kev, 20 Nov: "yes, put them all on a timer" (his answer to "Should threats, Tag Team offers and backing requests get a timer too?";
his friends found the game slow, "too much waiting").

- Every question the game asks **one** player while the table waits now counts down and then takes a safe default. Lengths are three
  constants in `BAL` (tunable with `?bal=`): `askMs` **20 s** (a question in the note: one click), `askBoxMs` **30 s** (a question that
  stays in the box: ticks to set or a list to read; and the host picking the fighters: robots and arenas to look at), `askDealMs`
  **45 s** (a deal panel: credits and parts to drag onto the table). `askSeat` picks 20 or 30 s from the same `noteFits` test that puts
  it in the note or the box. Never less than the reaction window's 10 s (unchanged).
- Looks: as T20's Joint Venture: seconds and bar in the note; in the box and on a deal panel the seconds and bar sit over its buttons,
  and the note that points at the box shows the same seconds. The last 5 seconds: red seconds and a pulsing bar (`q-low`; with reduced
  motion no pulse, a thicker bar). The 0.8 s click guard and the red flash when it lands are unchanged.
- Time up: one line in that player's log, e.g. `⌛ No answer in time (🤝 Offer from Rust Rivets): the offer was refused, nothing changes.`
- Defaults: the answer that commits you to nothing you did not choose (decline, refuse, no swap, just one robot, the part stays in the
  Stash, no deal). Forced choices take what the game already does for the AI or on the host's Skip. Where every answer costs something
  (marked ★) the safest one is taken and it is a question for Kev (below).
- Clocks: one game clock (`clkNow`) that **stops while the game is paused** (online: a player is away), on the host and on every joined
  screen (⏸ before the seconds). A question's clock starts **when it is shown**, so a second question waiting behind another one gets its
  full time. Online the **host judges** every time-out: the joined screen tells the host when it shows a question (`shown`, src2/net.js),
  the host's clock starts then, and the host closes it 1 s after the screen's own count reached 0 (`cancelQ`: the default answer; the
  screen's count is for show and never answers by itself). A player who drops and rejoins gets the open question again with the time
  it had left (the game was paused meanwhile). (T20 had two holes here: the host's fallback could close a queued question before the
  player saw all 20 s, and the timer kept running while the game was paused. Both fixed.)
- The host's own steps for a person host (picking the fighters; spare or scrap) count down in the note too (`G.qclk`, so a joined host
  sees it); the clock waits while that player has a question or deal panel of its own open.

| Question | Seconds | Time up | Note or box |
|---|---|---|---|
| 🤖🤖 Second robot? (double duel) | 20 | Just one | note |
| 🤝 Joint Venture | 20 | Defect (your 2 Cr are never at risk) | note |
| 🏢 Hostile Buyout | 20 | ★ Refuse (−1 fame; Sell gives the robot away) | note |
| 🤝 Tag Team Licence (pick your ally; the card is played) | 20 | the AI's pick: the strongest ready robot outside the leader | note |
| 🤝 Tag Team offer (Team up / Refuse −1 fame) | 20 | ★ Team up (by the card only Refuse costs, 1 fame) | note |
| 🤝 … hesitates (sweeten the Tag Team) | 45 | No deal (the AI ally refuses, as without an offer) | deal panel |
| 🔩 Fit … On which robot? (Stash) | 20 | Cancel: the part stays in the Stash | note |
| 🧾 You can't pay your upkeep | 20 (30 with 7+ robots) | ★ the weakest robot is scrapped (the AI's pick) | note / box |
| 🤝 Ask for backing (ticks) | 30 | Cancel: nobody is asked, the card stays in your hand | box |
| 🤝 Ask … for backing (offer) | 45 | No deal: that team is not asked | deal panel |
| 🤝 Backing request (Accept / Refuse) | 20 | Refuse | note |
| 🤝 Offer from … (AI: part, robot, buy your Stash part) | 20 | Refuse: nothing changes | note |
| 🤝 Trade offer from … (a person) | 20 | Refuse: nothing changes | note |
| 🤝 Trade with … (your own trade panel) | none | you opened it yourself during the Market (a step for everyone at once) | deal panel |
| 💰 Paid Off (who gets your 3 Cr; the card is played) | 20 | the team with the least fame (the AI's pick) | note |
| 🙅 Not My Robot (who is hit instead) | 20 | the team with the most fame (the AI's pick) | note |
| 🏛️ Museum Donation (you played it) | 20 (30 with 7+ choices) | ★ a crew member (as the AI does); your first robot if you have no ready crew | note / box |
| 💰 Over your hand limit (ticks) | 30 | ★ the pre-ticked (cheapest) cards are cashed in, so the turn can end | box |
| 🔧 Botch it now? | 20 | Let it go (the card stays in your hand) | note |
| 💰 A threat (Pay / Offer something else / Refuse; or Accept / Refuse a demand) | 20 | ★ Refuse (never spends credits; the card can still be played, and you can still block it) | note |
| 💰 Payoff from … / 🤝 Buy off … (deal) | 45 | No deal | deal panel |
| 👑 Host … picks the fighters (Invite me / Leave me out / No deal) | 20 | No deal | note |
| ✋ Ask to be invited / 🙈 left out (offer) | 45 | No deal | deal panel |
| 🏟️ Host step (play an Arena card?) | 20 (30 with 3+ cards) | No (the card stays in your hand) | note / box |
| 💻 Hacker, ✦ Scope (OK) | 20 | closes | note |
| 🔍 Bookie's Friend (OK) | 20 (30 with 3+ hidden cards) | closes | note / box |
| 🔀 Swap the Entry? | 20 (30 with 6+ swaps) | No (the card stays in your hand) | note / box |
| 🔀 Swap or payoff? (you picked a swap) | 20 | Swap now (what you picked, without the wait for a deal) | note |
| 💰 A threat (Swap the Entry: pay 2 Cr) | 20 | ★ Refuse (your robot is swapped; the bets stand) | note |
| 👑 Spare or scrap? (offer to the host) | 20 | Stay out | note |
| 👍 Plead to spare / 👎 Push to scrap (offer) | 45 | No deal | deal panel |
| ✦ Treacherous (not asked in 2.0) | 20 | Stay | note |
| 👑 You host: pick the fighters | 30 | your picks, filled up with the most fame (what the host's Skip does) | note (the host step) |
| 👑 You host: spare or scrap | 20 | ★ Spare (what the host's Skip does) | note (the host step) |
| Reaction window | 10 (T2, unchanged) | Let it happen | note |
| ⚔️ Send a robot (invited; T47) | 30 | your strongest ready robot (what the host's Skip does) | note (the send step) |
| 🔩 Which robot gets a won part (2+ can take it; T47) | 20 | the robot T12's auto-fit picks (best odds), then Undo / Move | note (the install step) |
| Not in scope: Upkeep, open market and bids, host bid, bets, sponsor bids, the starter draft, trade-in, Stash trim | — | everyone acts at the same time: their own rules (auto-advance, host Nudge / Skip) | — |

- Not changed: what each answer does, the order, who is asked, the AI and the test bot (they answer in code, at once), the reaction
  window, the Market steps. Report a problem / Add a note / Playtest log are not game questions: no timer.
- Tests: tools/mp-scenario/questions-note.js (solo, both sizes: every question shows a countdown; left alone at 1600x900 with short
  clocks: second robot, Tag Team offer, Tag Team Licence, Stash fit, upkeep debt, Bookie's Friend, robot offer, Museum Donation, hand
  limit, deal panel, the host's fighters and spare or scrap; a queued question gets its full time; a paused game stops the clock);
  tools/mp-scenario/questions-remote.js (a joined player: the host judges the time-out and logs ⌛ to that player, a queued second
  question, pause, closing the tab and coming back). Screenshots in /home/claude/t31-shots (not in the repo).

## Tested

All 9 fixed checks pass on 3a606e0's file except that the last small addition (button in the waiting list) was re-checked with waiting.js, reaction.js and a click on the new button only; 8 mouse-driven games without findings over the two steps.

## Open

- Questions from T20 (17 Nov): Joint Venture without an answer counts as Defect now (was Commit): right? 20 s for Joint Venture, Hostile Buyout and the Host step: right length, and should other questions that hold up the table (threats, Tag Team offer, backing requests) get one too? Should the reaction window's buttons also wait 0.8 s / for the pointer to leave? The wording "YOUR MOVE · IN THE MIDDLE ←" for a question that stays in the box? Bookie's Friend: a box from 3 hidden cards on, or always the note?
- Questions from T31 (20 Nov): 20 s (note), 30 s (box, and the host picking the fighters), 45 s (deal panels): right lengths? Where every answer costs something, the game picks for you on time-out: Hostile Buyout Refuse (−1 fame); Tag Team offer Team up (only Refuse costs, by the card); a threat Refuse (no credits, but the card may land); can't pay upkeep: your weakest robot; Museum Donation: a crew member; hand limit: the cheapest cards; you host, spare or scrap: spare. Right? ("Send a robot": yes, 30 s, T47.) Should your own trade panel in the Market get one?
- Questions from T22 (17 Nov): the order of the repair buttons (broken first, then worst damage)? Broken zones red like the card, credits in pink? Done at the top right of the note (beside the text) or at the bottom? The wording "exhausts 2 Mechanics" / "can't pay: 4 Cr (you have 1)"?
- Questions from T9 (16 Nov): bets and lot bids in the note too? Colours of the choice buttons (green send, dark others)?
- Questions from T2 (17 Nov): wording "YOUR MOVE · ANSWER?" / "REACTION WINDOW" / "ANSWER SENT" and "Pass" (or "Let it happen")? Should a player with no card have to click at all (today: an OK that ends the window early once everyone has clicked, as before T2)?
- Questions from T15 (16 Nov): the wording "✓ Mauler sent" and "The bookie is watching test fights…"? Should the second robot of a double duel be picked in the note too, instead of the question box?

- Fight as a slide (still its own full screen).
- With 6 or more cards the open hand overlaps again.
- The log is small now (about 270 world units); robot value, timers and deals could use the right column instead.

## Sponsor auction (T21, 17 Nov)
- Kev (17 Nov, online): "when another player picked another sponsor suddenly the screen flipped for the player ... let people bet on sponsors instead, with rebid, if rebid still undecided, do random".
- Cause of the flip: with 4 people the 2-sponsor deals overlapped; when one person signed a sponsor that was also in another person's deal, the game swapped that card for a free sponsor on the other person's screen (same place, other sponsor; also the note's Sign button).
- Now: the pit shows all 6 sponsors in a 3 × 2 grid, each with − / + (your sealed bid, a BID n tag) like the Market lots; the note (two lines) explains it, with Lock Bids (or "Lock: bid nothing"), ✖ Bid nothing, and in solo Start fame and Quick-Start. Locked: LOCKED IN, "You can still change …". A tie: the tied sponsor glows orange; tied players get − / + in the pit and in the note and Lock Rebid, with the red flash; the others see "… rebid in secret". Signed sponsors show SIGNED: <team> and the price (REBID / RANDOM DRAW / FREE). Chips at the foot of the pit: who is still bidding / locked ✓ / rebidding (never amounts). The waiting list says "sponsor bids" / "tie-break bid".
- Reproduced on 4bd3f89 (host + 3 joined, seed 5): P1 signed Lucky Seven; P3 had Lucky Seven in its deal, and its left card and its note button turned into Blackwire Syndicate (which the host also held) within a frame. No camera move, no phase slide (`SLIDE` keys on the phase, and the whole setup is one key). Screens: t21-shots/flip-before-s3-0before.png → flip-before-s3-600.png.
- Fit (T21 follow-up): the note is two short lines ("Bid for a sponsor in secret (n/8 Cr): − / + on the cards." / "Top bid signs it and pays. Tie: rebid. Win none: one free."), so it fits at 1280x720 with the solo buttons; the tie note likewise ("Tie at 3 Cr for <sponsor> (<teams>). Add on top in secret: +n → m Cr." / "Still tied after this: a random draw."). The starter-draft note is two lines too. The auction ends straight in the draft, so the first draft shows the result as chips at the top of the pit: `You: Lucky Seven · free`, `Moss Gears: Blackwire Syndicate · 3 Cr`, `… · 4 Cr, draw`.
- Nothing on a screen changes because of someone else's bid or lock except the chips and the waiting list (checked frame by frame: camera target, scroll, note box, pit click boxes, note buttons). The starter draft was already safe (deals are made once, revealed together) and was checked the same way.

## Trade and bid in one step (T26, 17 Nov)

Kev (17 Nov): "lets do the open auction during the betting, and when everybody locks bids, the open auction is done and we can move on to rebids or next". Asked "If you've locked your bids and then make a trade that changes your credits, should that unlock you, the way changing a bid does?": "yes". ("betting" = bidding on the lots, "open auction" = the open market.) Friends found the game had too many clicks and too much waiting; this takes one whole wait-for-everyone step out of every round.

What a player is told: **"Market: trade and bid. Bid on the lots in secret; trade and sell while you bid. Lock when done."** The lots are biddable from the start; the 🤝 buttons in the note open a trade with that team, the 📦 Stash card (left) sells parts to the bank, AI offers arrive in the note. When everyone has locked, trading ends and the lots go out (tie rebids, results, installs, then the host bid, as before).

- Before: Market = (1) open market, ended by everyone pressing "Start the auction →" (gather `open`), (2) sealed bids on the lots (gather `lots`), (3) host bid. Now (1) and (2) are one step: `startMarket` sets `G.marketStage = 'lots'` and starts `openMarketAI()` at once; `mktOpen()` (phase market, stage lots, no auction yet) is when trades are allowed. `ACT.startLots`, `startLots()`, the `open` gather and `G.openBusy`'s button are gone.
- Note: YOUR MOVE "📦 Market: trade and bid. Bid on the lots in secret (spent/credits Cr); trade and sell while you bid. Lock when done." + 🤝 one button per team + Lock Bids →. LOCKED IN: "📦 Bids locked (n Cr). Waiting for … You can still change bids, trade or sell until everyone has locked. A change or a trade unlocks you; then lock again." with the 🤝 buttons (a locked player may still trade; it unlocks them). Next round's lots are no longer repeated in this note (they are on the pit's NEXT ROUND strip; the line did not fit at 1280x720).
- Pit: "3 · MARKET · TRADE AND BID", "SEALED BIDS · TRADE AND SELL WHILE YOU BID"; the lots with − / + from the start (the grey "bids open after the open market" preview is gone).
- A completed trade (both sides) or a bank sale unlocks you (`tradeUnlock`, a 🔓 line). Both sides of a trade between two people who had locked are unlocked.
- Bids may never be more than your credits: Lock is refused with a line ("Your bids add up to 9 Cr, but you have 8 Cr. Lower them, then lock.") and the note greys Lock and says so in red; after a trade that leaves them too high you also get a ⚠️ line. At the resolve, any person's bids above their credits are lowered from the last lot down (`fitBids`; only a skipped or dropped seat can get there). Host Skip on the step does the same and then locks.
- **An open deal at the last lock** (T47, Kev 21 Nov: "Cancel the open trade and go on": it is called off now, see the T47 section; what follows is the T26 rule it replaced): the last lock waits for it. `G.mDeals` counts the open deals per person (the panel of the one who proposes from the moment they open it, the question to the other person, an AI offer to a person); `recheckGather` does not end the `lots` step while any is open. The waiting list shows that person ("Trade with …" / "a trade"). When it closes, yes or no, the step ends at once if everyone has locked (a yes unlocks both, so then they lock again). Nothing is cancelled and nobody can lose credits or a part to a half-made deal: nothing moves until both said yes, and then `bundleHeld` checks on the host that both sides still hold everything on the table (else "fell through", nothing moved), and the transfer runs in one go.
- AI teams: `openMarketAI` (part sales to whoever can use them, a spare robot to a team down to one robot, offers to buy a person's Stash part) runs at the start of the step, while people bid; same rules and limits as before (one pass, one offer at a time, through the note since T20). It sends no new offer to a person who has locked, and stops when the step ends. AI bids are made at the resolve, as before; the step never waits for AI.
- Online: all through the host's action path (`trade`, `sellStash`, `bid`, `lockBids`); bids stay sealed (`snapFor`); a trade or bid after the step is refused ("⌛ Too late: the Market bids are closed …" / "… the bids on the lots already went through …"). `G.mDeals` is part of G (so every screen's list can show who is in a deal); it is cleared when the lots resolve and on load.
- Botched Install: unchanged. It was and is after the lots are resolved, before the installs (it never touched the open market).
- Bot (`?bot=1`): bids once per step, sometimes sells a Stash part while bidding (25%), lowers bids that a trade left too high (one − a tick), waits while its own deal is open, then locks.
- Test tools: new tools/mp-scenario/market-step.js (solo, both sizes) and market-step-online.js (host + 3 joined); tools/market-step-measure.js (solo bot games, before/after); questions-note.js puts the table in the merged step for its AI offer; game-sim's Market snapshot reads the merged step.
- Measured (60 + 60 solo bot games, seeds 1-60, test-bot person + 3 AI): click waits per round 3.73 ± 0.05 → 2.90 ± 0.03 (the open-market wait is gone); rounds 10.58 → 10.30 (paired −0.28 ± 0.55); trades per game 4.70 → 4.02 (± 0.5), AI offers to the person 5.85 → 5.07 (± 0.9: none once locked); Market spend 90.6 → 87.0 (± 4). Details in PROGRESS.md (17-20 Nov, T26).
- A timed question (another branch adds countdowns to offers): an offer that times out answers its default (no), which closes the deal (`dealIn(-1)` in `finally`), so it cannot hold the step.

## The voting page (T47, 21 Nov)

Kev chose on a voting page (21 Nov). Each line: the question as he saw it, his choice, what the game does now. Everything is decided on the host; nobody waits for anything new. Tests: tools/mp-scenario/vote-rules.js (solo at 1600x900 and 1280x720; online with a joined client for 3, 4, 5, 7 and 8). Screenshots in /home/claude/t47-shots (not in the repo).

1. **Crunch Week** ("I tick everything myself: crew, bots and robots"). One question in the box (30 s): a tick per ready crew member, Security Bot and robot; crew and bots ticked to start with, robots not. Exhaust the ticked / Exhaust nothing. No answer: the ticks as they opened (all crew and bots, no robots: what happened before), ⌛ line. AI unchanged. Details in docs/intrigue-deck.md.
2. **Repair kit: 2 copies** in the Market deck (`BAL.lots.partCopies.repair: 2`; the card's own copies in src2/lineup.js stay 1). The deck is now 29 cards (21 parts, 8 of them modules; 4 New Robot, 4 New Crew).
3. **Bookie's Friend and Hedge Bet after locking** ("Keep them playable after locking"). Their buttons stay in the LOCKED IN bets note. Playing one keeps your lock: neither changes a bet (Bookie's Friend shows hidden cards; Hedge Bet lets you bet up to 4 on any side). If you then use Hedge Bet's room and change your bet, that unlocks you, as any bet change does (T16). Once the bets went through, a click is refused with a line ("⌛ Too late: the bets already went through, so Hedge Bet was not played (it stays in your hand).") and the card stays in your hand. Note: both cards have 0 copies in the deck since 7-8 Nov (docs/intrigue-deck.md, "Cut"), so this matters only if they come back.
4. **The Market closes over open deals** ("Cancel the open trade and go on"). When the last person locks, every open deal (the proposer's trade panel, the question to the other side, an AI offer to a person) is called off as no deal: both people in it get "🤝 The Market closed (everyone had locked): the open deal between A and B was called off. No deal, nothing moved.", nothing moves, the lots go out at once. Code: each such deal runs through `mktDeal`; `closeMarketDeals` (from `recheckGather`) answers them all at once and closes what is on screen (a joined screen: `N.cancelQ`, as a time-out; this page: the note, box or panel; a question still queued behind another never opens). `G.mDeals` no longer holds the step; the waiting list shows "a trade" only for a person who has not locked. A Yes that reached the host before the last lock went through first (the host runs actions in order) and unlocked both (T26), so the step did not end on that lock.
5. **Send a robot** ("30 seconds, then my strongest ready robot goes"). The invite note counts down 30 s (`BAL.sendMs`) with the T31 bar and seconds; time up: the strongest ready robot (what the host's Skip does), ⌛ line "No answer in time (⚔️ send a robot): the game sends Hydra, your strongest ready robot." Per-person clocks (`SEATC`, `PS(s).sclk`): host-judged, on the game clock (stops while paused), wait while that player has a question of its own open; two invited people count at the same time. The second robot of a double duel was already timed (T31, 20 s).
6. **A won part** ("Always ask me first which robot"). Reading (a question for Kev): with **two or more** robots that can take it the note asks first: "🔩 You won Energy shield: which robot gets it? No answer: Wrecker (best odds)." with one button per robot (the odds change), 📦 Keep in Stash, and a 20 s count; a pick fits it there (final). No answer: the robot T12's auto-fit picks, then T12's 5 s Undo / Move. With exactly **one** robot that can take it, it still goes on at once with Undo. `BAL.autoFit`: `'ask'` (new default), `true` = T12 (fit at once on the best), `false` = always the plain pick without a timer. A part taken off with Undo goes back to the plain pick (no clock). AI unchanged; the test bot picks the robot the auto-fit would have picked.
7. **Unlock line** ("Also a line in everyone's log"). When a person who had locked changes a bid (lots, host bid, sponsor bids), a bet or a tie rebid, every other person's log gets "🔓 Rust Rivets changed a bid and is deciding again." (or "a bet", "its host bid", "its rebid"), no amounts. Their own log keeps its own line.
8. **Trades between others** ("Show it more clearly, for example a short banner"; "this would also be relevant when 2 players trade in a real life game which you are not involved in"). Every completed Market trade (AI-AI, AI-person, person-person: part sales, robot sales, trade panels; `tradeDone`) shows a banner over the top of the pit to every team not in it: "🤝 Rust Rivets traded with Moss Gears" and the log line under it (what moved). 4 s, fades, not a question, never over the note; several in a row wait their turn; the log line stays. The host keeps the last 6 in `G.tradeBan`; a screen that joins or a new game shows none of the old ones. Not covered: Hostile Buyout (another branch is changing it), Fire Sale (a bank sale, not a trade).

Multiplayer: all on the host's action path; the clocks are host-judged like T31's; nothing new in src2/net.js; `G.tradeBan` and `PS(s).sclk` travel in the normal snapshot. Balance: see PROGRESS.md (21 Nov, T47).

Questions for Kev (T47): 6, the reading "ask only when two or more robots can take it, one robot still goes on at once with Undo": right? 20 s for that question and 30 s for sending a robot: right? The banner shows for 4 s over the top of the pit: long enough, in the right place? Should a Hostile Buyout that goes through show the banner too? Bookie's Friend and Hedge Bet are out of the deck: bring them back?

