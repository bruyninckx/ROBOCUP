# ROBOCUS multiplayer plan (interview with Kev, 2026-11-06)

## Decisions (Kev)
- Players: remote friends online, on Discord voice. No in-game chat; deals go through the existing deal panel.
- Platform: browser, join by link + room code. Hosted on GitHub Pages (same speed as itch.io: P2P traffic doesn't touch the page host).
- Network: P2P. The host player's browser runs the game (authoritative); others connect over WebRTC (PeerJS, free public broker). Accepted: the host could peek at hidden cards (friends).
- Sessions: live only. No turn timers; the host gets nudge / skip-this-player buttons.
- Drop-outs: the game pauses until the player is back (same link + name = same seat). No host migration.
- Seats: always 4 teams; AI fills empty seats (2–3 humans is fine).
- Fights: everyone watches in sync (host sends seed + builds + start time; live combat cards sent with sim tick).
- Setup: each player picks sponsor (dealt 2 keep 1) and start-fame slot on their own screen.
- Public: credits, hand SIZE, Stash contents, bets as placed. Hidden: hand card identities, deck order.
- v1 lobby: room code + name + seat colour + Ready; save game to file + rematch. No spectators yet.
- Code: host runs the existing game, other players are screens (send actions, get a filtered state). Solo vs AI keeps working.
- Testing: headless 4-tab bot games (Playwright), Kev solo with 2–4 tabs, friends playtest night (every client writes the playtest log).
- Milestone 1: a full game with 2+ humans (lobby → setup → all phases → synced fights → winner) + save/rematch, with smaller checkpoints on the way.

## Architecture
- Seat model: `SEATS[i]` = 'local' | 'remote' | 'ai' (null = solo). `isHuman(i)`, `isRemote(i)`. `HS` = the person at this screen (drawing).
- `askSeat(seat, title, html, buttons)`: local modal, or for a remote seat the host sends title/html/labels and awaits {k, inputs}.
- Free actions (play card, bid, trade, scout…) become `act(seat, name, args)`; the host validates and runs the handler for that seat.
- State sync: the host sends a redacted snapshot of `G` (others' hands → counts, decks → counts) after each change (throttled); clients render it with `viewerSeat` = own seat and run no game logic.
- Fights: clients run `Sim` from the seed (deterministic); end-of-fight hash compared with the host's.
- Transport with two back ends: `local` (BroadcastChannel: same-PC tabs, headless tests, no internet) and `peer` (PeerJS/WebRTC).
- Game dice seedable (`?seed=N`): regression checks (`tools/seed-check.js`) and save/rematch.

## Phases (all done 7 Nov, branch `claude/multiplayer`; real PeerJS still to try with friends)
0. Seat refactor. Pass A: dialogs → `askSeat`. Pass B: per-seat state `PS(seat)` (bids, host bid + robot count, bets, Hedge Bet, robot pick, installs, rebid adds, sponsor deal), `act(name, …)` for every click, `gather(seat, step)` = a simultaneous step goes on when every person is done, remote `dealPanel`.
1. Transport + lobby: `src/net.js`. Room code + link, name, seat colour, Ready, start fame, AI for empty seats. Transports `peer` (PeerJS 1.5.4 from unpkg, public broker) and `local` (BroadcastChannel).
2. Client mirror mode: the host sends each seat a filtered snapshot (`snapFor`: others' hands and the decks as hidden cards, others' sealed bids and per-seat state blank, face-down cards hidden until the fight), the log as operations (personal "you" lines only to that seat), board moments, questions and deal panels.
3. Synced fights: clients build the same battle from `F.bb` (seed + flags); live combat cards (people's and AI's) go into `F.cmdLog` with a sim tick 15 ticks ahead; a card that arrives late makes the client replay the fight to where it was; the host sends its tick 4×/s and clients catch up or wait; the end hash is compared (`desync` in the client's playtest log if it differs).
4. Setup per player (2 sponsors each, the starter draft one person at a time), pause when a player drops out (fights freeze; the host can let the AI take the seat), rejoin with the same link + name, host nudge/skip banner (after 8 s), save at each round start (💾 in the host's 🌐 badge, load in a new room's lobby: same names = same seats), rematch, every client keeps its own playtest log.
5. Tests: `tools/mp-test.js` (host + bot players in tabs over the local transport, with a chaos mode: drop-out + rejoin, skip, a player leaving, save/load) and `tools/seed-check.js` for solo.

## Notes from the build (7 Nov)
- Start fame is the host's lobby setting (one value for everyone). If "start-fame slot" meant something else (a per-player choice), it still needs doing.
- Changed for sync: AI teams decide their live combat cards with their own dice (`fightAiRng`, from the fight seed), not the fight's dice, because a client can't see AI hands. Solo games with the same `?seed` therefore play out differently than before 7 Nov (seed-check fingerprints changed once).
- A person's team takes their name (log and garages); AI teams keep the team names.
- Not tested here: real PeerJS/WebRTC (the cloud sandbox has no internet). Players behind strict NATs may fail to connect (only Google STUN, no TURN server).
- No spectators, no host migration (if the host closes the tab, the game stops; reload + load the save).
