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
- **You** play with `play-latest.cmd` and check the stamp.

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
   - It updates your folder to `main` and opens the game.
   - `play-latest online` opens the GitHub Pages copy your friends use.
4. **Check the stamp.**
   - Bottom left of the game shows `files <code> · <date> · <n> robots`. It should match the report.
   - A red bar at the top means the browser mixed old and new files: press Ctrl+F5.
5. **Answer the "Waiting for Kev" questions** when you like. Workers never stop to wait for you: they pick the safest option and note the question.

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
| A robot or rule you thought was gone | old files (see stamp), or a real bug | send a screenshot with the stamp |
