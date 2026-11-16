# ROBOCUS 2.0.1 screen rework (started 15 Nov 2026)

Why: Friday playtest (13 Nov). Friends said it was not clear when they had to click, there was too much clicking, and they wanted the hand more visible. Kev asked for a slideshow feel (the screen slides left to right on every phase) with a clean overview on the right of who we are still waiting for. Never played on a phone, so phone layout does not matter.

Mockup: Design artifact "ROBOCUS slideshow UI" (https://claude.ai/artifact/5fBhSgA8e3UeQDzKN4hW4n). Kev's decision: rework the current screen (tabletop-2.html), not a new screen beside it.

## Layout now (device commits 52e6469 and 3a606e0, BUILD "tabletop 2.0.1 2026-11-15c ...")

- Left: your robots and Stash. Middle: the pit, and under it the hand, always open, cards side by side (`HAND_H` in `benchLayout` is worked out in screen pixels: 222 px). Right, top to bottom: the note (`L.note`, 176), the waiting list (`L.wait`, 232), the log.
- `#waitRail` (drawn by `renderWaiting()` from `netWaiting`): one row per team with YOUR MOVE / DECIDING / READY / NOTHING TO DO / AI / PLAYING, heading "WAITING FOR n" or "NOBODY HAS TO CLICK". In a reaction window every row says CAN ANSWER (no names). On your own row, when it is your move, the note's main button is repeated and flashes (`.wr-go`; a click presses the note's button); with no button to press the YOUR MOVE pill flashes.
- The note has three states (`promptState()`): YOUR MOVE yellow, LOCKED IN green, NOTHING FOR YOU TO DO grey.
- Phase slide (`SLIDE` in `renderWorld`): the old pit slides out left, the new one in from the right, 520 ms; only pixels move. `window.__noSlide = true` turns it off.
- The banner over the pit, the dots in the top bar, the hand's tab and pin are gone.

## Choices in the note (T9, 16 Nov)

Kev: "When you can send a robot to the pit, also make that 'to the pit' option visible in the yellow window on the right. As much as possible."

- Invited to a fight (any format): one green button per robot in the note, `▶ <name>` with a hint on the right (no damage, damaged ⚔, broken ⚙; pinkish when damaged). Exhausted robots are shown greyed out. Same click as the card's SEND … TO THE PIT (`act('sendBot', id)`); the card button stays.
- Same idea, same action paths as the pit/card: Sign <sponsor> (`pickSponsor`), Keep <starter> (`pickStarter`), fit a won part on a robot (`install`; hint: the odds change, greyed when there is no room), host invite toggles per team (`pickTeam`; hint: ready robots), tie rebid − / + (`rebidAdj`).
- Built with `pickBtn()` (class `.act.pick`, data-send / data-fit / data-keep / data-sign / data-inv). The waiting list does not repeat them (`.wr-go` skips `.pick`). In a tight note the buttons come first (as before); with 4 or more they go two per row without hints (`.many`).
- Not in the note (need a picker): repairs, lot bids, bets, Intrigue cards.

## A click in the note shows it worked (T15, 16 Nov)

Kev: "when I clicked it it somehow didn't register, or perhaps it did register but the button still showed, should be something like a checkmark after that button so we know it did its work"

- What happened: after a send, the bookie's test fights started at once. On a page opened from a file (`play-latest.cmd`) they run on the page itself (no workers) for `BAL.bookie.ms` (4 s), and each test fight blocks the screen, so nothing was painted for seconds; and the note had no text for "fighters in, bookie busy", so it kept the old green buttons (a host who invited itself got the invite buttons back). Measured here (file://, a loaded test box): first paint 5.4 s after the click in a duel, 7.8 s after the second-robot click in a double duel.
- Now: `pickNow(kind, value, label, run)` marks the choice (`pickWait`, local only), redraws the note (clicked button `✓ Mauler sent`, class `.done`; the rest greyed, `.sent`, disabled; note grey AT THE TABLE, not YOUR MOVE; your row in the waiting list no longer YOUR MOVE) and runs the action only after that frame is on screen (`afterPaint`: next frame, 0.1 s at most). The robot card's SEND button and the pit text show the same ✓. Measured: ✓ painted 4-35 ms after the click.
- New note while the fighters are in (`G.fight`, not choosing): `✓ <robots> sent`, then "🎩 The bookie is watching test fights of this matchup…" while this page's bookie runs (`bookieOn`, set at the call in `afterChoose`, which also waits one paint before the test fights start), or "2 robots per side: send a second robot (the question in the middle), or Just one" / "Fighters are in. The bookie sets the odds next…".
- Same ✓ for Sign <sponsor>, Keep <starter>, fit on <robot>. Invite toggles and rebid −/+ already change at once; on a joined screen they get a green ring (`.pressed`) until the host answers.
- Online: display only, the action is the same `act()`. On the host's page (and solo) the mark is dropped just before the action runs, so a refused click (exhausted robot, too late) re-renders the real state at once. On a joined screen it stays until the host's answer re-renders the note, 4 s at most.

## Fewer clicks (Kev said yes to all four, 15 Nov)

- Upkeep: a player with nothing to repair and no Stash part that fits (also no robots, round 1) is ready after 0.6 s (`upkeepIdle`, `autoStep`).
- Market results (after the lots, after the host bid) and "next round": go on by themselves after `BAL.autoMs` (6 s). The count only runs while nobody has something else to do (fitting a part, trade-in, open question, reaction window). The note shows "Goes on by itself in N s" (`G.autoLeft`); the button stays. `window.__noAuto = true` turns it off.
- Bets: one chip per amount on each robot (`bet_amt`, `ACT.bet(S, side, amt)`); the same amount again takes the bet back. Lock bets is still a click (the card bids are in the same step).
- A won part goes on at once (`applyMarketWins`, `BAL.autoFit`); since T12 also with two or three robots that can take it (see below).

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

## Tested

All 9 fixed checks pass on 3a606e0's file except that the last small addition (button in the waiting list) was re-checked with waiting.js, reaction.js and a click on the new button only; 8 mouse-driven games without findings over the two steps.

## Open

- Questions from T9 (16 Nov): repairs, bets and lot bids in the note too? Colours of the choice buttons (green send, dark others)?
- Questions from T15 (16 Nov): the wording "✓ Mauler sent" and "The bookie is watching test fights…"? Should the second robot of a double duel be picked in the note too, instead of the question box?

- Reaction window inside the note instead of a popup.
- Fight as a slide (still its own full screen).
- With 6 or more cards the open hand overlaps again.
- The log is small now (about 270 world units); robot value, timers and deals could use the right column instead.
