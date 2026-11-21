# How Kev runs ROBOCUS work: one orchestrator, Opus workers (16 Nov 2026)

Kev: "we need to avoid things like this, I need to orchestrate via fable and set tasks up for opus".

**What went wrong before:**
- Sessions that couldn't push to GitHub.
- Work sitting on branches nobody merged.
- Another session merging while Kev played an old copy.
- A browser running a new page on an old robot file.

**The setup:**
- **You** talk to one session only: the orchestrator.
- **The orchestrator** (Fable) owns GitHub `main`. It writes the tasks, starts Opus workers, checks their work, merges, pushes and reports to you.
- **Opus workers** each do one task in their own copy of the repo and never touch `main`.
- **You** play with `play-latest.cmd` (it starts a small game server on your PC; leave its window open) and check the stamp.

The rules every assistant follows are in `AGENTS.md`; the roles and the worker brief are in `CLAUDE.md`; the work and your open questions are in `TASKS.md`.

## One-time setup

1. **Retire the side folders.** Double-click `tools\retire-side-folders.cmd` in your ROBOCUS folder.
   - It first pushes the three experiment branches from 11 Nov (2.5D arena, 3D arena, art looks), whose 4 commits were only on your PC.
   - Only then does it remove the `.wt` folders.
2. **Start the orchestrator session.**
   - Start a new Claude session (Claude Code, or a Cowork task) and pick **Fable** as the model.
   - Add the GitHub repo **bruyninckx/ROBOCUP** to the session's sources, so it can push. This is the step every earlier session was missing.
   - Attach the "game dev" project.
   - Keep this one session for orchestration and come back to it, rather than starting new sessions per idea.
3. **Give it this first message:**

   ```
   You are the ROBOCUS orchestrator. Read CLAUDE.md, AGENTS.md, TASKS.md and docs/orchestration.md.
   Check you can push to GitHub (git push --dry-run); if not, stop and tell me.
   Then: show me the "Waiting for Kev" questions and the To do list, and suggest what to start first.
   ```

4. **GitHub Pages** already serves `main` (`https://bruyninckx.github.io/ROBOCUP/`): what the orchestrator pushes is what your friends get, usually within a few minutes.

## Day to day

1. **Tell the orchestrator what you want**, in your own words, as before. It writes the tasks into `TASKS.md` and starts Opus workers for them, several at once when they don't touch the same files.
2. **It reports back once per batch:**
   - what changed;
   - what to try;
   - the **files stamp** (for example `files e63a7588`);
   - your open questions.
3. **Play it.** Double-click `play-latest.cmd`.
   - It updates your folder to `main` and opens the game (more below: "What play-latest does").
4. **Check the stamp.**
   - Bottom left of the game shows `files <code> · <date> · <n> robots`. It should match the report.
   - A red bar at the top means the browser mixed old and new files: press Ctrl+F5.
5. **Answer the "Waiting for Kev" questions** when you like. Workers never stop to wait for you: they pick the safest option and note the question.

## What play-latest does (20 Nov; 22 Nov: runs from a copy, says what holds the port)

1. It gets the newest `main` from GitHub, as before.
2. It starts a small **game server** on your PC and opens the game at `http://127.0.0.1:8765/prototypes/tabletop-2.html`.
   - The black window that stays open **is** the server. Its title says "ROBOCUS game server". **Leave this window open while you play. Close it when you are done.** Closing it stops the server; nothing keeps running.
   - Why: a game opened as a file can't run the bookie's test fights beside the game. From the server it can, on all your cores but two. So fights with three or four robots get real test fights too (from a file they got 9-11 and fell back to the formula), and the screen no longer stands still while the bookie watches. The odds overview on Market lots fills much faster too.
   - Double-click `play-latest` again while the server runs: it does not start a second one, it just opens the game in a new tab.
   - It needs Node.js (you very likely have it: the test tools in your folder were installed with it). Without Node it tries Python; without either it opens the game as a file, as before, and says so in one line (fix: install Node.js, the LTS button, from nodejs.org).
   - **Windows Firewall should not ask anything:** the server only listens to your own PC (127.0.0.1), not to your network. If it does ask anyway, you can press Cancel; the game still works on your PC.
3. The three ways to start it (type in a command window in your ROBOCUS folder, or double-click for the first):

   | Command | What it opens |
   |---|---|
   | `play-latest` | the game from your PC's game server (the normal way) |
   | `play-latest online` | the GitHub Pages copy your friends use |
   | `play-latest file` | the game as a file, the old way (for when the server does not work) |

**What changes for you with the new address** (the browser keeps what it remembers per address, and `127.0.0.1:8765` is a new one):
- Settings start fresh once: sound on/off, hand pinned and its side, the log folded or open, your online name. Set them again once.
- The playtest log: the last 10 games stored in the browser stay with the old file address. If you want them, open the game once with `play-latest file`, click 📝 and "All saved games" to download them. If you had picked a log folder (📝, "Save to a folder"), pick `ROBOCUS/playtests` again once on the new address.
- Saved games (💾 Save game in the online lobby) are files on your disk: nothing changes.
- The port stays 8765 so this happens only once. If 8765 is taken by another program, the window says **which program holds it** (for example `Port 8765 is used by node.exe (process 15872).`, or `... by another ROBOCUS game server, for the folder C:\...`), that it used the next one (8766...), and that the browser keeps settings and playtest logs per address, so they start fresh on that one. Close that program (an old game server window, or end it in Task Manager, Details tab) and the next double-click gets 8765 back with your settings.

**It runs from a copy of itself (22 Nov, T53).** On 21 Nov the window said `'folder' is not recognized as an internal or external command`: the update replaced `play-latest.cmd` while Windows was still reading it, and Windows went on reading in the middle of a line of the new file. Now play-latest first copies itself to your Temp folder (`robocus-play-latest-<number>.cmd`) and runs that copy, so the update can change the real file safely. The copy deletes itself at the end; copies left by a window you closed are deleted the next day. A changed play-latest takes effect from the next double-click.

**Your next double-click after this change** (the 20 Nov play-latest updates itself to this one): the window shows `Checking GitHub...`, the update lines, then **again** `Checking GitHub...` and `Up to date: main <commit>` (the old file hands over to the new one, which checks once more: that is expected), then the game server lines as before. There should be **no** "is not recognized" line. From then on it is `Checking GitHub...` once. If you see "is not recognized", "The batch file cannot be found", or `(Could not copy play-latest to ...)`, send a photo of the whole window, and what `echo %TEMP%` prints in a command window.

**Hosting online from your PC:** the invite link in the lobby now points at the public copy (`https://bruyninckx.github.io/ROBOCUP/...?room=CODE`), not at your PC (a link to your PC or to a file never worked for friends). The lobby says so. Your copy and the public copy must be the same version: right after the orchestrator pushes, GitHub Pages takes a few minutes. If they differ, a friend who joins is told "different version" and can't join yet; wait a few minutes and they refresh. To be sure you all run the same, host from `play-latest online`.

### If play-latest does not work

1. Run `play-latest file`: it opens the game the old way.
2. Send the orchestrator what the black window says (a photo is fine).
3. Tell it what you see in the browser (nothing, an error page, the game without the stamp bottom left).

## Things not to do any more

- **Don't let other sessions work in your ROBOCUS folder on branches** (no switching branches there, no `.wt` folders). That folder stays on `main` for playing. Workers have their own copies.
- **Don't push bundles by hand.** If a session can't push, give the task to the orchestrator instead.
- **Don't keep docs only in the claude.ai project.** The repo's `docs/` is the real copy; the project gets a copy. Four project-only docs were copied into `docs/` on 16 Nov.

## If something looks wrong

| You see | It means | Do |
|---|---|---|
| Red bar "Old game files are loaded" | browser cache | Ctrl+F5, or close and reopen |
| Stamp differs from the orchestrator's report | your folder or tab is old | run `play-latest.cmd` |
| `play-latest` says "unsaved changes" or "local commits" | something was edited in your play folder | tell the orchestrator; don't delete anything |
| The browser says "This site can't be reached" at 127.0.0.1 | the server window was closed | double-click `play-latest` again |
| Your sound setting or online name is gone | the game now runs from a new address (once) | set it again |
| A robot or rule you thought was gone | old files (see stamp), or a real bug | send a screenshot with the stamp |
