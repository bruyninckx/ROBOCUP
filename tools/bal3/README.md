# Balance variants, round 3 (ROBOCUS 2.0 overhaul)

Each `.json` here is a set of `BAL` overrides for `prototypes/tabletop-2.html` (every key: `docs/robocus-2.0-sim.md`; `_note` is ignored),
on top of the **new defaults** (Kev, 8 Nov): round 2's `combo` (lean part lots, robot levels `gradual`, a broken zone costs 2 actions,
only engineers repair, start crew 2 Mechanics + Accountant + Analyst, crew deck with more engineers, 7 crew lots) + level 4 from round 6
with all 8 level 4 robots in the pool, the trade-in on a full garage, and the seat fix.

`tools\run-sims4.cmd` (Windows) or `sh tools/run-sims4.sh` runs every file here (tags `o3_<file>`) and writes `sims/overhaul3.txt`.
One variant on its own: `node tools/game-sim.js --page=prototypes/tabletop-2.html --tag=mytest --games=100 --par=8 --balFile=tools/bal3/cards_new.json`.

All start at 0 fame, win 12.

| file | what it tests |
|---|---|
| base | the new defaults |
| cards_new | all robot-card proposals: Secret Upgrade +15% / +15%, Smudged Lens −25%, Sugar in the Tank 40%, Loose Bolts = one wheel at 30% until repaired, Overclock without extra heat |
| fight1 | 1 fight card offered per fight (was 2) |
| fightMin2 | fight cards: lowest bid that counts is 2 Cr (was 1) |
| cards_new_fight1 | cards_new and fight1 together |
| seats_old | the old seat order (ties to the lower seat, AI reacts in seat order, round 1 Intrigue at seat 1): the seat fix measured with many games |
