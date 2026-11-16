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

## Fewer clicks (Kev said yes to all four, 15 Nov)

- Upkeep: a player with nothing to repair and no Stash part that fits (also no robots, round 1) is ready after 0.6 s (`upkeepIdle`, `autoStep`).
- Market results (after the lots, after the host bid) and "next round": go on by themselves after `BAL.autoMs` (6 s). The count only runs while nobody has something else to do (fitting a part, trade-in, open question, reaction window). The note shows "Goes on by itself in N s" (`G.autoLeft`); the button stays. `window.__noAuto = true` turns it off.
- Bets: one chip per amount on each robot (`bet_amt`, `ACT.bet(S, side, amt)`); the same amount again takes the bet back. Lock bets is still a click (the card bids are in the same step).
- A won part with exactly one robot it fits goes on at once (`applyMarketWins`, `BAL.autoFit`). With two or three robots that can take it you still pick the bay.

## Tested

All 9 fixed checks pass on 3a606e0's file except that the last small addition (button in the waiting list) was re-checked with waiting.js, reaction.js and a click on the new button only; 8 mouse-driven games without findings over the two steps.

## Open

- Questions from T9 (16 Nov): repairs, bets and lot bids in the note too? Colours of the choice buttons (green send, dark others)?

- Reaction window inside the note instead of a popup.
- Fight as a slide (still its own full screen).
- With 6 or more cards the open hand overlaps again.
- The log is small now (about 270 world units); robot value, timers and deals could use the right column instead.
