# ROBOCUS 2.0: the two-PC online test (15 Nov 2026; brought up to date 22 Nov 2026, T64)

Tool: `tools/mp-scenario/remote.js` (`tools\remote-host.cmd`, `tools\remote-join.cmd`, `tools\remote-setup.cmd`). Latest commit b1c210b.

## For Kev, 22 Nov: two ways to use two PCs

The game on GitHub `main` is the one to test. Before you start, the orchestrator has pushed it and told you the **files stamp**
(for example `files 28762982`). GitHub Pages needs a few minutes after a push.

### (a) The automated run (the robots click, you watch)

**Once on the second PC** (skip if you did it on 15 Nov and the folder still works):
1. Install Node.js (LTS, nodejs.org).
2. Get a fresh copy of the ROBOCUS folder: GitHub page, green "Code" button, "Download ZIP", unzip. (A ZIP from before today misses
   nothing the run needs, but a fresh one is safest.)
3. Double-click `tools\remote-setup.cmd` in that folder.

**Each run:**
1. Main PC: double-click `tools\remote-host.cmd`. It asks for a code: type a few letters, e.g. `KEV`, Enter.
2. Second PC: double-click `tools\remote-join.cmd`, the same code. Start it within ten minutes of the first.
3. Leave both running: 5 games of at most 15 minutes, 3 joined players on the second PC. A line every minute. About 30-75 minutes.
4. Send back: `playtests\remote-runs\latest-remote-host.txt` (main PC; Claude can read it if it is in your folder) and
   `playtests\remote-runs\latest-remote-join.txt` (second PC: copy it over, e.g. paste it in the chat).

What it checks: getting in, direct link or relay, fights the same on both PCs, a dropped link in every second game, stuck steps,
page errors, all four logs on the host.

### (b) Playing yourself on two PCs (you click)

**Main PC = the host.**
1. Open a command window in your ROBOCUS folder (click the folder's address bar, type `cmd`, Enter) and type `play-latest online`.
   It updates your folder and opens the GitHub Pages copy: exactly what friends get. (Plain double-clicked `play-latest` works too:
   your PC's copy hosts and the invite link still points friends at GitHub Pages; if the two differ, a joining player is told to
   refresh. For a test with friends, `online` is the safer pick.)
2. Bottom left: check the files stamp matches the one in the orchestrator's report.
3. Click **🌐 Online**, then **👑 Host a game**. Click **📋 Copy invite link**. Send it to yourself (Discord, mail).
4. Keep this tab open the whole game. It **is** the game: closing or reloading it stops the game for everyone. Since 22 Nov the
   browser asks "Leave site?" first, and if it happens anyway, Host a game again and click **↩ Resume the last game (round N)**
   in the lobby (your friends join with the same names; the game goes on from the start of that round).

**Second PC = a friend.**
1. Open the invite link (Chrome or Edge). Type a name, **Join**, **I'm ready**.
2. Bottom left: the same files stamp as the host. If you see a **red bar** at the top or "Your game is a different version":
   press Ctrl+F5 and open the link again.
3. On the host, press **▶ Start game** (empty seats are AI teams).

**Since 28 Nov (T70, `docs/robocus-joined-lag.md`):** the joined PC should feel quicker. Look at:
- the **📶 number** in the 🌐 badge on the second PC (the link delay to the host and back; the host's 🌐 menu shows each
  player's). Note it down: under 100 ms is good, over 200 ms you feel it.
- a clicked button on the second PC shows a **small spinner** (a board click: a spinning ring) until the host has answered.
  If you ever see one stay for seconds, note when.
- keep the **host's game window in front** (not minimised or covered by another window): a hidden host tab used to make every
  joined click wait up to a second; that is fixed for clicks, but the host's clocks and AI still slow down there.

**What to try** (each is new since the last two-PC run):
- Every question has a timer now (the count in the note). Let one run out once: the game picks the default and says so with ⌛.
- Market: make an offer on the **trading floor** (under the pit) from each PC, answer Yes / Counter / No, take one back.
- Upkeep waits for **Done**. On the second PC do not click Done for a while: the host gets a ⏳ row with **🔔 Nudge** and **⏭ Skip**.
  Try both.
- Upkeep, the **garage**: move a part on the second PC, **Lock in**, check the host sees the move.
- Close the second PC's tab in the middle of a round and open the link again with the **same name**: the host shows "⏸ Game paused,
  waiting for ...", and you are back where you were.
- Once, let the host pick "🤖 Let the AI play" for a player who left.
- If you host and an invited team drops out: "👑 Who steps in?".

**What to send back:**
- The playtest log: on the **host**, the 📝 button in the log header, **⬇️ Download this game** (it holds the logs of every joined
  screen too). Or pick the `ROBOCUS/playtests` folder once with **📁 Save to a folder** and the logs land there by themselves.
- Something odd: press **🐞** (log header) on the screen where it happened and type one line. It marks that moment in every log.
- Screenshots of anything confusing, with the bottom-left files stamp in the picture.

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
