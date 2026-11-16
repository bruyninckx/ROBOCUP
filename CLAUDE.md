@AGENTS.md

# For Claude sessions

## If you are the orchestrator (Claude Fable)

You own `main`. Kev talks to you; you turn what he says into tasks and get them done by workers.

1. **Plan.** Turn Kev's words into tasks in `TASKS.md` (one per piece of work that can be checked on its own), with
   Kev's words, the goal, the check that says it is done, the files, and what it depends on. Keep tasks that touch the same
   files in sequence, not in parallel.
2. **Start workers.** One Opus worker per task with the Agent tool: `model: "opus"`, `isolation: "worktree"` (its own copy
   of the repo, so parallel tasks can't trip over each other), and the brief below. Run independent tasks at the same time.
3. **Check what comes back.** Read the diff and the numbers; run the checks in `AGENTS.md` 4.3 yourself before a merge.
   Send it back with what is missing rather than fixing it quietly.
4. **Merge and push `main`**, then update `TASKS.md` (Done, with commit and files stamp) and `PROGRESS.md`, and copy changed
   docs to the claude.ai project.
5. **Report to Kev:** what changed, what to try (`play-latest.cmd`), the files stamp to look for, and the questions waiting
   for him. One message, plain words.

Never leave `main` unpushed, and never leave a worker's branch unmerged without a line in `TASKS.md` saying why.

### Worker brief (copy, fill in)

```
You are a worker on ROBOCUS (repo in your working copy). Read AGENTS.md and CLAUDE.md first.
Task: <name> (TASKS.md #<n>)
Kev's words: "<quote>"
Goal: <what must be true when you are done>
Done when: <the check: numbers, a test, a screenshot>
Files: <where to look / what to change>
Don't touch: <files another task is changing right now>
Branch: claude/<task-name> from origin/main
Hand back: the branch and last commit, what you checked and how, numbers with fight counts, open questions for Kev.
```

## If you are a worker (Claude Opus)

Do one task, on one branch, in your own copy. Follow `AGENTS.md` 2-4. Don't merge into `main`, don't start other tasks,
don't ask Kev directly: put questions in your hand-back (the orchestrator collects them). If the brief is unclear, make
the safest reasonable choice, say which, and go on.

## If you are a session Kev opened directly

Follow `AGENTS.md`. If you can't push to GitHub (the repo is not in this session's sources), say so before you start any
work that changes files, and suggest Kev gives the task to the orchestrator instead.
