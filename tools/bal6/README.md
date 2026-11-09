# Balance variants, round 6 (9 Nov): tuning chips

Each `.json` is a set of `BAL` overrides for `prototypes/tabletop-2.html` on top of the current defaults (`_note` is ignored).
`tools\run-sims6.cmd` (Windows) or `sh tools/run-sims6.sh` runs every file here (tags `o6_<file>`) and writes `sims/round6.txt`.

| file | what it tests |
|---|---|
| base | the current defaults: a chip takes one of the 2 part slots, chips can turn up in the Market from round 1, 1 copy of each |
| slot | its own chip slot: a robot can carry 2 parts + 1 chip + 1 legendary |
| slot_r3, slot_r4, slot_r5 | own slot, chips only turn up in the Market from round 3 / 4 / 5 |
| slot_x2 | own slot, 2 copies of each chip (6 in the lot deck) |

What to look at: the `chips:` rows (sold per game, price, first round sold, the level of robots fighting with one,
how chip sides do against the bookie's odds), plus game length, close finishes, comebacks and whether the leader runs away.
