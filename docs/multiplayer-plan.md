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

## Phases
0. Seat refactor. Pass A DONE (dialogs → `askSeat`). Pass B: per-seat state for simultaneous steps + remote `dealPanel`.
1. Transport + lobby (room code, name, colour, ready, AI for empty seats).
2. Client mirror mode (snapshot render, remote modals, actions).
3. Synced fights + live combat cards.
4. Setup picks per player, pause/rejoin, host nudge/skip, save/rematch, per-client playtest logs.
5. Tests: headless 4-tab bot games over the local transport, then real PeerJS; GitHub Pages deploy (Kev: Settings → Pages → main).
