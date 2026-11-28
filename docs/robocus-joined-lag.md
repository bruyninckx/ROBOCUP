# ROBOCUS 2.0: why a joined screen feels slow, and what we did (28 Nov 2026, T70)

Kev: "when I played multiplayer on 2 pcs, the non-host pc had noticeably more sluggish response, like a certain lag present
when clicking buttons, what are our options in this regard to try and make this more smooth?"

Branch `claude/joined-lag`, BUILD 2026-11-28a, files stamp 8a074599. Tool: `tools/mp-scenario/lag.js`.

## In short

- A click on a joined screen travels to the host, the host runs it, the answer travels back, and the joined screen redraws.
  The biggest part we could remove: **the host only sent its answer at its next 100 ms tick**, on average 50-65 ms extra on
  every click, up to 100 ms. If the host's tab was in the background, the browser runs that tick **once a second**: almost
  **1 s** extra per click.
- Fixed: the host now answers **at once** after it ran the click (the tick stays as a safety net). Measured: **148 → 82 ms**
  per click with no network delay (median), **277 → 145 ms** for the slow 1 in 10. A hidden host tab: **965 → 70 ms**.
- New: a clicked button **looks pressed with a small spinner** (a click on the board: a small spinning ring where you clicked)
  until the host's answer is back. A second click on a pressed Done / Lock / End turn button is not sent twice (Kev's
  23 Nov log has 4 double clicks on such buttons; 2 reached the host twice).
- New: the 🌐 badge shows **📶 and the link delay** (to the host and back, in ms). On the host: the slowest player's, and each
  player's in the 🌐 menu. Kev's 15 Nov two-PC run went through the relay at about 80-120 ms.
- What is left is mostly the link itself: each way costs what the network costs. With the usual relay delay (about 50 ms each
  way) a click now takes about 0.2 s instead of about 0.3 s.

## How it was measured

`node tools/mp-scenario/lag.js` opens one host and 1 or 3 joined tabs in one browser (the local transport, no internet) and
lets the test bots play (or, with `--click`, plays the first joined screen with real mouse clicks on the board's +/- buttons,
bets, repairs and the note's → button). For every action of a joined screen it records:

| part | from | to |
|---|---|---|
| c2s | the mouse click | the action is sent (only with real clicks) |
| up | sent | the host has it (the link) |
| host | the host has it | the host sends the first snapshot that has the result |
| down | that snapshot leaves the host | the joined screen has it (the link) |
| apply | received | parsed and redrawn (`JSON.parse`, `applySnap`, `updateHud`) |
| paint | redrawn | the next frame is on screen |
| total | click (or send) | painted |

`--lag=MS` holds every message MS ms more, each way (a slow link). `--hidden-host` gives the host page Chrome's timers of a hidden
tab (once a second: the test browser can't hide a tab, so the timers are slowed instead). `--http` serves the game like
play-latest (the bookie's helpers run). `--ovr` keeps the odds overview open on the first joined screen (its test fights run).

The test box has 2 cores and another worker was using them: "up" and "down" are 12-40 ms even with no added delay, because
the receiving tab is busy drawing. On Kev's PC they are near 0 on one PC; over the internet they are the link. Each setup ran
3 minutes (1-3 games); numbers are medians over all timed actions. Left out: actions that changed nothing on the host (the bots
press a lot of those; nothing to show), and the last bet lock (it starts the fight; in a bot game the whole fight is computed
at once there, which is not a click delay).

## Numbers: before (main, cf02782) and after (this branch)

Medians in ms; n = actions timed.

| setup | n before / after | up | host before → after | down | apply | paint | total before → after | slow 1 in 10 (p90) |
|---|---|---|---|---|---|---|---|---|
| 1 joined screen, no added delay (3 games) | 275 / 245 | 18 / 17 | **60 → 4** | 19 / 18 | 4 / 3 | 35 / 30 | **148 → 82** | 277 → 145 |
| real clicks, no added delay | 23 / 33 | 13 / 12 | **56 → 3** | 16 / 16 | 5 / 4 | 34 / 23 | **119 → 84** | 213 → 106 |
| + 30 ms each way | 133 / 84 | 80 / 73 | 54 → 4 | 82 / 79 | 5 / 3 | 30 / 36 | 266 → 205 | 356 → 300 |
| + 80 ms each way | 83 / 107 | 117 / 117 | 68 → 5 | 122 / 122 | 6 / 4 | 31 / 28 | 351 → 282 | 420 → 370 |
| real clicks, + 80 ms each way | 40 / 24 | 114 / 115 | 67 → 4 | 121 / 123 | 6 / 4 | 23 / 29 | 343 → 282 | 452 → 344 |
| + 200 ms each way | 118 / 91 | 238 / 234 | 55 → 5 | 243 / 243 | 4 / 3 | 24 / 30 | 581 → 522 | 661 → 605 |
| 3 joined screens | 325 / 312 | 41 / 41 | 99 → 7 | 37 / 42 | 8 / 6 | 73 / 68 | 270 → 183 | 417 → 306 |
| **host tab hidden** (timers once a second) | 60 / 65 | 10 / 12 | **876 → 1** | 22 / 16 | 5 / 2 | 33 / 30 | **965 → 70** | 1105 → 103 |
| served like play-latest (helpers on) | 89 / 56 | 21 / 16 | 66 → 5 | 22 / 20 | 4 / 3 | 33 / 29 | 148 → 78 | 242 → 118 |
| odds overview open on the joined screen | 85 / 68 | 21 / 20 | 75 → 6 | 21 / 22 | 5 / 4 | 45 / 46 | 167 → 122 | 264 → 187 |

By kind of click (1 and 3 joined screens together, no added delay; total median before → after): Done / Lock buttons
213 → 140 ms (273 / 269 clicks); market bids 241 → 123 (146 / 148); bets 202 → 123 (45 / 64); Upkeep repairs and garage
217 → 182 (72 / 71); trading floor 116 → 77 (21 / 18). Early and late: rounds 1-2 217 → 123, rounds 5+ 215 → 158.

The pressed look: on screen in the next frame after the click (it does not wait for anything). With 1.5 s of added delay
the button showed its spinner and the board click its ring until the answer came; a second click on the pressed Lock Bids →
did not reach the host (20 actions on the host before and after it).

## What each part costs, and what that says

- **The wait for the host's tick** was the largest part we control: 55-100 ms (median 60 with one joined screen, 99 with three).
  Now 1-8 ms (running the action plus building one snapshot).
- **Building the snapshot** on the host: median 0.3 ms per player, 1 in 10 over 1-3 ms late in a game (the whole game, as JSON,
  filtered for that player). Not a problem: even 10 times a second for 3 players it is a few % of one core.
- **Size**: 7 kB in round 1-2, 10-14 kB by round 6, plus about 4 kB of "meta" in every snapshot (the game's settings `BAL`, the
  names, who the game waits for). On a home connection this is nothing; on a slow relay it is one or two network packets more.
- **The joined screen's redraw** (apply): 3-8 ms median, 1 in 10 over 10-18 ms. Not the problem.
- **Paint** (until the next frame): 25-45 ms on the busy test box with several game tabs drawing; on a normal PC about one
  frame (16 ms).
- **The link**: exactly the added delay, each way. Over the relay (Kev's 15 Nov run: 77-117 ms) that is the largest part left.
- **The host's tab in the background** (another window over it, minimised, the PC locked, or a second tab in front): Chrome runs
  its timers once a second there ([Chrome's timer rules](https://developer.chrome.com/blog/timer-throttling-in-chrome-88)). A
  page with an online link is never slowed more than that. Before, every click on a joined screen then waited up to a second;
  now the host answers inside the message handler, which the browser does not hold back. Other changes (the AI's moves, the
  clocks) still go out at the next once-a-second tick in a hidden host tab. **Tip for Kev: keep the host's game window in front
  (not minimised, not covered) during a game.** (The host's fights already keep running in a hidden tab, since 15 Nov.)
- **The bookie's test fights**: they run on the host only, in the time after the robots are sent and before the bets, when
  nobody has anything to click. On the test box (2 cores, 1 helper) no click landed while they ran; with play-latest the
  helpers run beside the game on separate cores. **The odds overview** on a joined screen (its own test fights there): clicks
  167 vs 122 ms with it open after the fix, the same as with it closed (171 vs 175 before, 19 and 71 clicks): no effect seen.
- **Is anything on the joined screen locked while it waits?** No button was disabled waiting for the host, except the note's
  choice buttons from T15 (✓ and greyed until the answer, 4 s at most). Those waited one frame (16-100 ms) before sending, so the
  ✓ would be painted first; a joined screen now sends at once (no bookie runs there). Same for the trading floor's Yes / No.
- **One more thing seen** (not changed): when a fight is skipped (or a joined screen first sees a fight that is already over),
  the joined screen computes the rest of that fight at once to check it ended the same: in the bot test that froze the joined
  screen for 0.6-1.3 s. In a real game that happens when the host clicks "Skip to result". If Kev notices a hiccup right after a
  skip, this is it (fix idea below).
- **Kev's two logs of 23 Nov** (`pc-a.json` host, `pc-b.json` joined) have no timings per message: the two PCs' clocks differ,
  so the click-to-host time can't be read from them. They do show the habit that the pressed look answers: 45 repeat clicks
  within 1.5 s on the joined PC, most on + buttons (fine, each counts), and 4 double clicks on a → step button (Done → Intrigue,
  Lock Host Bid, Invite Fighters, Next Round); two of them (Done and Next Round) reached the host twice.

## What changed (the cheap fixes)

1. **The host answers at once** (`src2/net.js`): after it runs a joined screen's action it sends that screen its new snapshot
   (or, if nothing that screen sees changed, a tiny "ack"). Every other change goes out 15 ms after the page redraws
   (`updateHud` calls `ROBOCUS_NET.changed()`; changes that come together go out together). The 100 ms tick stays as the safety
   net. Unchanged snapshots are still never sent twice (the same key check as before). Cost: about a quarter more snapshots
   in a busy bot game (3 joined screens: 680 → 860 a minute, each 9 kB + 4 kB meta); fewer with people, who click less often.
2. **A pressed look** (`prototypes/tabletop-2.html`): each action carries a number; the joined screen keeps a pressed look and a
   small spinner on the clicked button (a ring on the board) until the host's answer with that number is back, 4 s at most.
   Nothing is guessed: the result shows with the host's picture, as before. A second click on a pressed → button waits.
3. **📶 ping** in the 🌐 badge: every 2 s the joined screen sends a ping, the host answers at once; the badge shows the smoothed
   time to the host and back. Under 100 ms is good; over 200 ms you feel it.

Online: both screens must run this version (the version check already makes sure). Fights, rules and the AI are untouched.

## Bigger options (written up, not built)

| option | what it gains | what it risks | size of the job |
|---|---|---|---|
| **A nearer or better relay** (the TURN server in `src/net-config.js`), or getting a direct link more often | The link is now the largest part: 50-120 ms each way through the relay vs 5-30 ms for a direct link in one country. Halving it saves 50-100 ms on every click, for everyone. | A paid or self-hosted service; a wrong setup means friends can't join at all. The 15 Nov run never got a direct link between home Wi-Fi and the 5G work PC. | Small in code (settings), the work is choosing and testing a service. First step: read the 📶 numbers in the next playtest. |
| **Send only what changed** (a diff of the snapshot, and the 4 kB meta only when it changes) | Smaller messages: 10-14 kB → mostly under 1 kB. Helps on a slow or busy link (phones, the relay), and the host's upload with 3 players. On a normal link: a few ms. | A diff that goes wrong leaves a screen out of step until the next full snapshot; needs a full resync rule and a check. The meta part alone is easy and safe (the joined screen already accepts snapshots without it). | Meta only: small. A real diff: medium, with new tests. |
| **Let the joined screen guess simple clicks** (a bid +1 shows at once, then the host's answer replaces it) | The number changes the moment you click, like on the host. | When the host says no (out of credits, the step is over), the number jumps back: confusing; every guessed action needs its own guess code that must stay equal to the host's rules. | Medium per kind of click; easy to get subtly wrong. The pressed look now covers most of the feel. |
| **Build snapshots off the 100 ms tick entirely** (only on change, never on a timer) | A little less work for the host (it now builds about 10 a second per player even when nothing changed: 0.3 ms each). | Something that changes the game without a redraw would never be sent; the tick is the safety net for exactly that. | Small, but not worth the risk now. |
| **Finish a skipped fight on the joined screen in small slices** | No freeze of 0.5-1.5 s on a joined screen after "Skip to result". | The fight check (same result on every screen) must still happen; the next phase's screen must wait for it or check later. | Small to medium. |

My advice: try the playtest with this build first and read the 📶 number on the joined screens. Under 100 ms: the rest is
now one network round trip and a frame, about as good as it gets with this design. Over 150-200 ms: the relay is the next thing
to look at.

## Files

- `src2/net.js`: flush after an action, `changed()` hook, `ack`, `ping` / `pong`, 📶 in the badges and the host menu.
- `prototypes/tabletop-2.html`: `netPress` / `netAck` (the pressed look), `updateHud` tells the host's net it changed, T15's
  `pickNow` and the trading floor send at once on a joined screen, CHANGES line, BUILD 2026-11-28a.
- `tools/mp-scenario/lag.js`: the measurement (options above). Raw output of every run in the hand-back of T70.
