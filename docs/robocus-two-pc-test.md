# ROBOCUS 2.0: the two-PC online test (15 Nov 2026)

Tool: `tools/mp-scenario/remote.js` (`tools\remote-host.cmd`, `tools\remote-join.cmd`, `tools\remote-setup.cmd`). Latest commit b1c210b.

## Why

Every other test room is a set of tabs in one browser. This is the only test over the real thing: the game from the web address the friends use (`https://bruyninckx.github.io/ROBOCUP/prototypes/tabletop-2.html`), real rooms, real links between two PCs on two networks.

## How to run it

**Once on the second PC:** install Node.js (LTS), get the ROBOCUS folder there (GitHub's "Download ZIP" or git clone), double-click `tools\remote-setup.cmd`. If the test browser can't be downloaded (a company filter: "unable to get local issuer certificate"), the tools use the Edge or Chrome on that PC.

**Each run:**
1. `git push` on the main PC first (both PCs load the game from the web; the second PC needs the tool files: fresh ZIP after a tool change).
2. Main PC: `tools\remote-host.cmd`. Second PC: `tools\remote-join.cmd`. Same code on both (e.g. KEV), within ten minutes of each other. Start the host first.
3. Default: 5 games of at most 15 minutes, 3 joined players on the second PC. Game k is played in room CODE + k. A progress line every minute.
4. Results: `playtests\remote-runs\latest-remote-host.txt` on the main PC (Claude can read it), `latest-remote-join.txt` on the second PC (send it over).

Options: `--firefox` (joined players in Firefox; needs `npx playwright install firefox`), `--no-drop`, `--url=…`; `both` tries the tool on one PC in a local room.

## First real run, 15 Nov 2026, 12:55 to 13:27 (code KEV)

Main PC hosting, second PC (a work PC on 5G) joining with 3 players. 5 of 5 games played to a winner (rounds 8 to 12, about 6 minutes each).

| | Result |
|---|---|
| Getting in | 15 of 15 player-games joined, 2 to 7 s |
| Link | 0 direct, 15 through the relay; delay 77 to 117 ms |
| Fights | 38 fights on the host; 114 of 114 ended the same on the joined screens |
| Late live cards | 6 (a joined screen replayed the fight; still the same result) |
| Stuck steps, errors, lost-host moments | 0 on both sides |
| Joined logs on the host | all complete, no gaps; the four-logs file of each game is in `playtests\remote-runs\2026-11-15_1255-host\host-KEV<k>.json` |

**What it settles:** over a real link with about 0.1 s delay, the fights, the reaction windows and the logs work; fights are the same on two different PCs (both Chrome-family browsers).

**What it shows:**
- **The relay is essential.** No direct link was ever made between the home network and the 5G/work PC. If the relay service (src/net-config.js) is down or out of quota, such a player can't join.
- **Joining before the host opens the room gives a wrong hint.** In games 2 to 5 the joiners arrived a few seconds before the host; one got "No game in room", the others "Found the game, but no direct link to the host after 15 s" (they were waiting on a room that did not exist yet). All got in on the next try within 3 s. A friend who clicks the link early would see that misleading message. Not fixed.

**What it did not test:**
- **The dropped connection.** The test took the browser offline for 12 s, but that does not cut a game link that is already up: the host never saw anyone leave, so "back after 1 s" meant nothing. Fixed in b1c210b (the links are closed for real; "back" = host messages arrive again); not yet run.
- Another browser engine (Firefox, Safari), phones, a third network.

## Known limits

- All joined players on the second PC share that PC's network.
- The work PC inspects its secure connections; results there say little about a friend's home Wi-Fi.
- The game files stamp (`tools/stamp.py`, 16 Nov) shows bottom left on both PCs: they should match before a run.
