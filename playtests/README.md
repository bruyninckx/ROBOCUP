# Playtest logs

The tabletop prototype records every game you play (`prototypes/tabletop-prototype.html`).

- **Turn on saving to this folder once:** click **📝** in the log header (top left), then **📁 Save to a folder…** and pick this `playtests` folder. From then on every game is written here as `<date-time>.json` while you play. After a browser restart the button shows **📝 ↻**: click it once to allow writing again.
- Without a folder, games are kept in the browser (the last 10) and you can **⬇️ Download** one and drop it here.
- **🐞 Add a note** (also in the 📝 menu) saves a comment together with the game state at that moment: odd behaviour, rule questions, bugs, ideas.
- Errors are recorded automatically with where they happened; the 📝 button shows 🐞 and a count when there are any.

What's in a log: build, settings, every log line, a snapshot of every team at each phase (fame, credits, robots and builds, Stash), every click and button, Market results and bids, deals, every Intrigue/arena play with its steps and result, each fight (format, entrants, bookie odds, bets, result, knockouts, cards played), notes and errors.

Summary: `node tools/playtest-report.js` (or `--md docs/playtest-report.md` to write it to a file).
