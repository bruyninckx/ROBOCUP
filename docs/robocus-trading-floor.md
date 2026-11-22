# The trading floor (T55, 22 Nov 2026)

Kev (22 Nov, with a screenshot of the Market at 1905 x 932): "sometimes there is a lot of open auction action going on and this all
comes into the yellow box and you need to refuse or accept offers one by one, can we make some type of open auction panel so you
can lock in trades with other people while keeping an overview". He was shown two layouts and picked "A, counter is ok, see deals
as they happen".

Branch `claude/trading-floor`, BUILD 2026-11-22d. All in `prototypes/tabletop-2.html`. No change under `src2/` (files stamp unchanged).

## What it is

A panel called **TRADING FLOOR** under the pit, in the middle column. It shows during the Market's trade-and-bid step (the only
time trades are open) and is gone the moment the Market closes.

- **One ticket per open offer.** Team colour on top, who, "You get … / You give …", the seconds left and a shrinking bar.
  - An offer **to you**: **Yes**, **Counter**, **No**.
  - **Your own** open offer: "your offer · waiting" and **Take back**.
  - An offer **between two other teams**: a smaller grey ticket, read only, with both sides ("Moss gives … / Plum gives …").
  - A **finished deal** (or a refused, timed-out, taken-back or fallen-through one) stays a few seconds as a dashed ticket with a
    stamp (✓ DEAL, ✗ REFUSED, ⌛ NO ANSWER, ↩ TAKEN BACK, ✋ FELL THROUGH). AI-to-AI Market deals show here too, for everyone.
- **New offer to [Rust] [Moss] [Plum]** on the right. Click a team: the composer opens inside the panel (no pop-up): You give /
  You get, credits − / +, Security Bots − / + (when a side has any), and "+ Add…" for Stash parts, robots and crew. Click a chip to
  take it off the table. **Send offer** or **Cancel**. While composing, the panel may grow up into the pit, never over the lots.
- **Counter** opens the composer with both sides already filled in, turned to your side (what they asked of you is in "You give").
  Change it and press **Send counter**: it replaces the offer you answered (that one is withdrawn) and goes to the other team as a
  new offer.
- Answer in **any order**; offers never hold up bidding. The yellow note is back to your bids and Lock; it only adds "2 offers wait
  for you on the trading floor ↓".
- While the floor is open, your hand steps down to a strip at the bottom of the screen. Hover the cards to bring the hand up.

## Rules (unchanged)

- Nothing moves until the other side says yes. Then everything moves at once on the host, or nothing: if either side no longer has
  what it put on the table, or a team would lose its last robot or go over 3 robots, the deal "fell through, nothing moved".
- A team always keeps a robot (the composer won't let you put your last one on the table; the host checks again at the yes).
- A deal that goes through unlocks both teams' bids. Bids above your credits must come down before you can lock.
- An unanswered offer is a No after **45 s** (`BAL.askDealMs`). The clock stops while the game is paused.
- The last lock closes the Market: every open offer is called off ("The Market closed…", nothing moved).
- AI teams answer your offer, or your counter, **at once**: yes when it comes out ahead by 1 or more (`bundleWorth`), as before.
- AI offers to you (a robot when you have one, a part you can use, a part from your Stash they want) are the same offers as before,
  made at the same moments; each one is a ticket now. If that AI team already has an open offer to you, the next one waits until
  the first is answered. No new AI offers to a person who has locked.
- Sealed bids are never shown on the floor.
- **New limit:** one open offer from one team to another at a time, in each direction (so up to 3 out and 3 in). `BAL.floorPair`.

## Online

- Open offers live on the host (`G.offers`, finished ones in `G.floorDone`) and go to every screen with the normal snapshot, so
  every screen draws the same floor. A screen that joins late or reloads gets the open offers at once.
- Every click (send, yes, no, counter, take back) is an ordinary action to the host (`offerSend`, `offerAnswer`, `offerBack`).
  Nothing new in `src2/net.js`.
- The host keeps the clocks; every screen shows the host's seconds.
- People see and answer their own tickets and see everyone else's.

## Switches (BAL)

| key | default | what |
|---|---|---|
| `tradeFloor` | `true` | `false` = the old flow: 🤝 buttons in the note, the deal panel pop-up, offers as questions in the note, the trade banner |
| `floorPair` | `1` | open offers one team may have to one other team at a time |
| `floorMs` | `0` | a ticket's time in ms; 0 = `askDealMs` (45 s) |
| `floorShowMs` | `6000` | how long a finished deal stays on the floor |

Try the old flow: add `?bal={"tradeFloor":false}` to the page address.

## What changed next to the old flow

- AI offers to a person used to come one at a time as a 20 s question in the note; now they are 45 s tickets, and offers from
  different AI teams can be open at the same time.
- A trade offer from one person to another used to be a 20 s question in the note; now it is a 45 s ticket.
- The T47 banner over the pit ("X traded with Y") is folded into the floor while it is on (the finished-deal tickets). The log
  lines stay as they were.
- The test bot (`?bot=1`) answers each ticket after a short look (yes or no at random) and sometimes offers 1-2 Cr for another
  team's Stash part.

## Fit

- 1905 x 932 (Kev): panel 832 x 179 under the pit; room for four tickets and the New offer tile side by side.
- 1440 x 900: 655 x 180; two or three tickets show, the rest scroll sideways inside the panel.
- 1920 x 1080: the same height (the hand's room under the pit is fixed in screen pixels).
- The composer grows up into the pit to about 205 px, down to the bottom of the lots.

## Questions for Kev

1. Timer: 45 s for every ticket (it was 20 s for an offer in the note). Shorter?
2. One open offer per team you trade with, each way: enough, or more?
3. AI teams answer your offer at once. Should they "think" a second or two so you can see the ticket first?
4. Other teams' tickets show both sides in full. OK, or only "Moss ⇄ Plum, offer open"?
5. Finished deals stay 6 s. Longer?
