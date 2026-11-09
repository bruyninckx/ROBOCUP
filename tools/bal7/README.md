# Balance variants, round 7 (9 Nov): crew = Mechanics only

Each `.json` is a set of `BAL` overrides for `prototypes/tabletop-2.html` on top of the current defaults (`_note` is ignored).
`tools\run-sims7.cmd` (Windows) or `sh tools/run-sims7.sh` runs every file here (tags `o7_<file>`) and writes `sims/round7.txt`.

Kev, 9 Nov: crew cards are too many and too fiddly for what they give; keep only Mechanics (+1 Cr and 1 repair each Upkeep).
Every team started with an Accountant, so the Mechanics-only variants give everyone the Accountant's rule (`robotUpkeep: 'first'`).

| file | what it tests |
|---|---|
| base | the current crew: 13-card crew deck, start 2 Mechanics + Accountant + Analyst, 7 crew lots |
| mech | Mechanics only: start 2, 7 Mechanic lots |
| mech3 | Mechanics only: start 3, 5 Mechanic lots |
| mech_few | Mechanics only: start 2, 4 Mechanic lots (more room for parts and robots in the Market) |

What to look at: credits held and spent, repairs and damage left, game length, close finishes, lots unsold, robots and parts bought.
