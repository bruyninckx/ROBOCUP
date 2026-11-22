# ROBOCUS: ready to playtest? (T64, 22 Nov 2026)

Kev: "I'm trying to go to a version to playtest, first myself only (with 2 pcs) then with friends". Feature freeze: no new
features, no balance changes. This page: everything we have, run against `main`, what broke, what was fixed, what could bite.
Branch `claude/playtest-ready`, BUILD 2026-11-22k, files stamp **41c0103e**. Kev, later: "drop the phone, smallest res should
be 1280": tested at 1280 x 720 and 1920 x 1080, no phone.

The box: 2 slow cores shared with other workers, load 14-34 for most of the day. Timing tests flake under that load. A FAIL
that passed when run again alone is marked *flaky* below, not counted as a bug.

What Kev does next: `docs/robocus-two-pc-test.md` (his two-PC session). What friends get: `docs/playtest-kit.md` Part 1.

## 1. Results

First run on main 142c8ac (before any fix), then again after the fixes (rebased on main 2d91339 with T62 and T65).

| Check | What it covers | Result |
|---|---|---|
| `checks.js` (9 checks) | cards, reaction, logs, backing, decline, waiting, fight panels, a bot game, 300 fights per browser engine | 7 OK. cards: killed at its 20-min limit under load; alone: 1 "difference" that was the test (fixed, see 2). reaction: closed 4.1 s after the last click (load); alone OK: *flaky* |
| fight-engines | 300 fights twice in Chromium | identical. Firefox / WebKit not installed here: cross-browser still open |
| serve-check, serve-port-check | play-latest's local server | OK, OK |
| sync-check | 2.0 fights bit for bit | TOTAL CODE 89a95280 (unchanged), before and after |
| l4-regress | stock-fight fingerprint | 470f6923 (unchanged) |
| game-sim check | 2 all-AI games | 2/2 finished, 0 page errors (before and after) |
| 40 all-AI games (seeds 101-140, after the fixes) | stalls, page errors | 40/40 finished, 0 page errors, 0 stalls; rounds 12.1 (10-14) |
| mp-test 3 clients, seeds 11 12 13 14 15 | a whole online game by bots, fights compared | 5 of 5 OK, 0 desyncs on every client; 6-10 fights each |
| mp-test chaos (drop + rejoin in Upkeep, host Skip in the Market, a player leaves for good, save loaded in a new room), seeds 5, 21, 5 again after the net.js fix | rejoin, skip, seat to AI, load | 3 of 3 OK, 0 desyncs |
| mp-test on the 1.0 page | old game still works | OK (3.5 min) |
| 26 single-situation scripts (trading-floor, garage, garage-online, stand-in, repair-note(-online), repair-all, resting, exhaust-cards, vote-rules, market-step(-online), reaction-note, reaction-own, questions-note, questions-remote, buyout-price, robot-value, cards, logs, backing, decline, waiting, fight-panels, reaction) | each feature on host and joined screens | all OK in the end. robot-value: test out of date (fixed). repair-all: test read the screen before it was drawn (fixed). stand-in, questions-remote: *flaky* (OK alone) |
| **new** rejoin.js | drop and rejoin mid-Market with offers open, mid-Upkeep with a garage draft, while "Who steps in?" waits; host Nudge / Skip in Upkeep; seat to AI; an unanswered ticket | see 4 |
| **new** host-reload.js | host closes its tab mid-game and comes back | OK after the fixes (see 2 and 4) |
| **new** first-minute.js | a friend's first minute at 1280 x 720 and 1920 x 1080 | OK: no button off screen, no box over the note, 0 page errors; notes in 3 |
| layout-check 1280x720, 1920x1080 | every phase, help regions hidden, modals that don't fit | LAYOUT_RESULT |
| click-many, 6 games x 8 min (real mouse clicks on 4 screens, 2 with reloads) | trapped overlays, stuck steps | 33 rounds, **no findings**. Coverage: the clicker never used the trading floor (offerSend / offerAnswer / offerBack), the garage (garageLock) or the Stash: those are covered by the scripts above, not by clicks |
| remote.js both (the two-PC tool on one box, 1 game, 10 min) | the tool itself | 9 rounds, 7 fights, 21 of 21 the same on the joined screens, 0 errors; 4 "stuck" on the joined side: all the rarity ladder panel left open by the clicker (a person closes it with ×, Esc or a click beside it). The clicker now closes it (see 2). REMOTE2 |

## 2. What was fixed

**In the game** (players see these; CHANGES block "safe host reload", BUILD 2026-11-22k):
1. **The host's page asks "Leave site?"** while an online game with joined players runs. Before, a reload (for example Ctrl+F5
   on the red bar) or a closed tab ended the game for everyone without a word.
2. **Resume after a host reload.** The host's page keeps the last round-start save in the browser (12 hours, cleared when a game
   ends). Host a game again: the lobby shows **↩ Resume the last game (round N, time)**; it loads that save like "Load saved game".
3. **net.js: a joined screen sees the host's new lobby.** A joined screen whose host came back stayed on the old game screen
   with no Ready button (the old "game started" flag was kept), so the host could never press Start. Now the lobby shows.
4. **net.js: loading a save puts players on their saved seats.** Players who joined before the host loaded the save kept their
   arrival seats (Bob could get Ann's team). Now they move to the seat with their name (swapping if needed).
5. **index.html:** the first link is now "▶ Play ROBOCUS" (2.0). Before, the first game link was the old 1.0 tabletop
   ("Online with friends") and 2.0 said "work in progress, separate from the game above": a friend would pick the wrong one.

3 and 4 change `src2/net.js`, so the files stamp moved 28762982 → 41c0103e; every online test above ran again after it.

**Tests** (out of date or wrong, the game was fine): robot-value.js (the AI's robot offer is a trading-floor ticket since T55),
cards.js (the host is named "Host", so "Hostile Buyout" read as a name), repair-all.js (waits two frames, not 120 ms),
clicker.js (closes the rarity ladder panel), rejoin.js (its own wait bug, see 4).

## 3. The friend's first minute (1280 x 720 and 1920 x 1080)

Path: index.html → ▶ Play ROBOCUS → (host) 🌐 Online → 👑 Host a game → 📋 Copy invite link → (friend) the link → name →
Join → I'm ready → (host) Start → round 1 and into round 2, looked at in 12 steps per size. Screenshots: `/home/claude/out/t64-*.png`
(not in git).

What works: the join box is short and clear ("Your name", Join, "Rejoining a game? Use the same name as before"); the files
stamp is bottom left on every screen; the note says YOUR MOVE with a countdown; the "Before we move on" list says who is
deciding; the trading floor fits under the pit at 1280 x 720; no button off screen at either size.

Confusions (not fixed: looks / wording, Kev's call):
1. **1280 x 720: long questions in the note are cut.** The note's text runs under its buttons: "Host Moss Gears picks the
   fighters. This round: ⚔️ Duel · open floor." loses its last line under "Invite me"; the reaction window's "You have no card to
   play here." is half hidden. The buttons work; the sentence is lost. At 1920 x 1080 it fits.
2. The trading floor's hint line is cut with "..." at 1280 ("A deal that goes through...").
3. In the friend's first round the backing request ("Plum Ohms asks you to back a scheme and offers 2 Cr") arrives within
   seconds of the start: a new player won't know what backing is. The rules page explains it; the question does not link there.
4. The host lobby says "Start fame 4 (rulebook)" but the solo screen's default is 0. Two different defaults (not a bug, may confuse).
5. Nothing tells a friend what the robots' level stars or the band pills mean until they hover; fine for a playtest with Kev
   on Discord.
6. The host's ⏳ row says "upkeep" in small letters where the rest of the screen says "Upkeep" (raw step name). Cosmetic.

## 4. Rejoin and recovery

| Situation | Result |
|---|---|
| Joined player closes the tab mid-Market with two offers open (to and from it), comes back with the same name | host shows "⏸ Game paused, waiting for P1" with "🤖 Let the AI play P1"; offers stay open; back: its floor shows the same tickets as the host at once; its Yes moves the credits on every screen; the last lock calls the rest off |
| ... mid-Upkeep with a garage draft | the draft was only on its screen and is gone (expected); the host's team unchanged; Upkeep waits; a new move locked after the rejoin is applied |
| ... while it is the joined host and "👑 Who steps in?" waits for it | the question comes back on its screen; its answer picks the team that fights |
| Host's Nudge / Skip on a player who does not click Done in Upkeep (new since T56) | the ⏳ row shows the player after 8 s; Nudge reaches the screen ("The host is waiting for you!" + a beep); Skip ends its Upkeep |
| Host's Skip on a player with an unanswered trading-floor ticket | Skip locks its bids; the ticket runs out on its own clock (⌛ NO ANSWER), nothing moves |
| A player leaves for good: "Let the AI play" | the seat goes to the AI, the pause box closes, the game plays on (rejoin.js, mp-test chaos ×3) |
| Host closes its tab (or the browser crashes) | since T64: "Leave site?" first; the joined screens say "📡 Lost the host, trying to reconnect" after 10 s; the host opens the game, Host a game (same or new room), ↩ Resume; the friends come back to the lobby by themselves (same room) or open the new link with the same name, get their seats, Start: the game is back at the start of that round, with the joined screens in step |
| A friend on an old cached page | two guards: the red bar ("Old game files are loaded ... Press Ctrl+F5, or close the tab and open the game again") when the page and the game files differ; and the host refuses a different version with a message that says what to do ("Refresh this page with Ctrl+F5 ... If it still differs, the host should refresh too, before starting"), and the host's lobby names who has another version. Clear enough; the friend note repeats it |

REJOIN3

Not covered by any script: a friend's internet dropping (rather than a closed tab) over a real PeerJS link with the new
features; the 15 Nov two-PC run covered drops in principle and remote.js drops the link in every second game.

## 5. GO / NOT YET

**GO for Kev's own two-PC session now. GO for friends after that session, if it shows nothing new.**

Why: every test we have passes on the final branch (the flaky ones pass alone); 5 + 3 online bot games and 6 click games with
0 desyncs, 0 page errors and no stuck step; the biggest hole found (a host reload ends the game) is closed and tested.

**Known risks, ranked:**
1. **Never run between two real PCs since 15 Nov.** Everything today (timers, trading floor, garage, stand-in, Upkeep Done,
   Resume) was tested in tabs of one browser. Kev's two-PC run is the test that matters. The relay is essential (15 Nov: no
   direct link between his home network and the 5G PC); if the relay is down, a friend on such a network can't join.
2. **The host's PC is the game.** If it sleeps, crashes or loses internet, everyone waits. Resume brings the game back to the
   start of the round (the round's moves are lost); the friends must use the same names. Joined screens need 10 s to notice.
3. **Only Chrome-family browsers tested.** Fights must come out the same on every screen; Firefox / Safari never tested
   (not installed here). Ask friends to use Chrome or Edge.
4. **1280 x 720 is tight**: the note cuts long questions (3.1). Friends on a laptop at 1280 x 720 may miss a line; zooming the
   browser out (Ctrl + minus) helps.
5. **Joining before the host opens the room** gives a misleading message (15 Nov; not fixed): "No game in room" or "no direct
   link after 15 s". Fix: the host opens the room first; a friend tries again.
6. **An update during the session.** If main is pushed while friends play, a friend who reloads gets the new version and is
   refused ("different version"). Don't merge during a session.
7. Bot-only coverage of the new step flows: the click games never clicked the trading floor or the garage (covered by scripts).

**What was not tested:** a phone (dropped by Kev), Firefox / Safari / Mac, two real networks today, more than 3 joined
players' worth of real people, a full 2-hour game played by people, the relay under load, sound.

## Questions for Kev
1. Keep "Resume the last game" and the "Leave site?" question? (Safest for a playtest; easy to switch off.)
2. 1280 x 720: shorten the long questions in the note, or let the note grow? (Looks: your call; not done in the freeze.)
3. Start fame: 4 in the online lobby ("rulebook"), 0 solo. Which for the friends' game?
