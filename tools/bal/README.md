# Balance variants (ROBOCUS 2.0 overhaul)

Each `.json` here is a set of `BAL` overrides for `prototypes/tabletop-2.html` (every key: `docs/robocus-2.0-sim.md`).
`tools\run-sims2.cmd` (Windows) or `sh tools/run-sims2.sh` runs the baseline plus every file here and writes `sims/overhaul1.txt`.
One variant on its own: `node tools/game-sim.js --page=prototypes/tabletop-2.html --tag=mytest --games=100 --par=8 --balFile=tools/bal/rep_b2.json`.
Try a variant by hand in the browser: open `prototypes/tabletop-2.html?bal=` + the JSON (URL-encoded), or run `ROBOCUS_DEBUG.bal({...})` in the console before starting.

Round 1 (all start at 0 fame, win 12):

| file | what it tests |
|---|---|
| lots_lean | fewer drones (10 → 5) and modules (6 → 5), more crew lots (4 → 7) |
| lv_waves2 | robot levels: rounds 1–2 L1, 3–4 L2, then mixed (L3 half the time) |
| lv_gradual | robot levels shift up one step a round, L3 from round 6 |
| lv_flat | any level any round |
| rep_b2 | a broken zone costs 2 repair actions |
| rep_b2_eng | + only engineers repair; start crew 2 Mechanics + Accountant + Analyst (was 3 Mechanics + Chief Engineer) |
| rep_b2_eng_deck | + 7 crew lots and a crew deck with more engineers (3 Mechanics, 3 Chief Engineers, 2 Repair Techs) |
| combo1 | lots_lean + lv_waves2 + rep_b2_eng_deck |
