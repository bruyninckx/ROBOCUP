# Balance variants, round 5 (9 Nov): Security Bots and the level gap

Each `.json` is a set of `BAL` overrides for `prototypes/tabletop-2.html` on top of the current defaults (`_note` is ignored).
`tools\run-sims5.cmd` (Windows) or `sh tools/run-sims5.sh` runs every file here (tags `o5_<file>`) and writes `sims/round5.txt`.

| file | what it tests |
|---|---|
| base | the current defaults (18 Security Bots of 137 Intrigue cards, every team starts with 1 installed) |
| sec12, sec8, sec5 | 12, 8 or 5 Security Bots in the Intrigue deck: do fewer blocks make the game better (more attacks land) or just more chaotic? |
| gap8 | every level step +8% power (weapon damage and HP, compounding): about +5 win points between neighbouring levels |
| gap15 | +15% per level step: about +10 win points |

What to look at: attacks that land, close finishes and fame gap (Security Bots); bookie favourite wins, close finishes, how much
the fame leader buys level 4, and comebacks (level gap).
