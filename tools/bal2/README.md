# Balance variants, round 2 (ROBOCUS 2.0 overhaul, with level 4)

Each `.json` here is a set of `BAL` overrides for `prototypes/tabletop-2.html` (every key: `docs/robocus-2.0-sim.md`; `_note` is ignored).
`tools\run-sims3.cmd` (Windows) or `sh tools/run-sims3.sh` runs every file here (tags `o2_<file>`) and writes `sims/overhaul2.txt`.
One variant on its own: `node tools/game-sim.js --page=prototypes/tabletop-2.html --tag=mytest --games=100 --par=8 --balFile=tools/bal2/combo.json`.

All start at 0 fame, win 12. Level 4 default: on, from round 7, 4 of the 8 robots per game, one level 4 lot a round, lowest winning bid 5 Cr, no extra upkeep.

| file | what it tests |
|---|---|
| base | the new defaults (level 4 on) |
| noL4 | the new defaults, level 4 off (the game as before level 4) |
| combo | round 1's combo1 (lean lots, broken zone = 2 actions, engineers only, crew deck) with robot levels `gradual`, level 4 default |
| combo_waves2 | combo1 as it was (robot levels `waves2`), level 4 default |
| combo_L4r6 | combo, level 4 lots from round 6 |
| combo_L4x2 | combo, all eight level 4 robots in the pool (perGame 8) |
