# Power map (in-game overlay)

Kev, 16 Nov 2026 (T13): "what I would love, but don't know if feasible, is to have an interactive powermap as an overlay with
all the robots in game"; asked whether robots show as new or as they are now: "power map shold be the shifted version".

The first power map was a claude.ai artifact (15 Nov, "Robocus Power Map"). It is now in the repo as
`docs/robocus-power-map.html` (double-click it; it has its own data from 6,336 duels, the part values and a build calculator).
The in-game overlay below is new and works from the game's own data.

## Opening it

- `🗺 power map` in the top bar (next to `📋 changes`), or the key **M**. Esc, M, ✕ or a click outside closes it.
- Any phase, on any screen (host or joined), from that screen's own view of the game. It updates itself while open
  (every 0.7 s it checks whether a robot, a part, damage or the Market changed).
- Opens in about 5-60 ms on the test box (125 ms once under heavy load). The robot pictures come from the table's picture
  cache; pictures it has not drawn yet are filled in over the next frames (the first time: about 4 ms a picture).

## What it shows

- Five bands, Level 4 on top, Starters at the bottom. Each band: how many robots it has, how often one of its robots beats a
  robot a level down (both as they come, from the matchup table), and how many of this game's robots stand in it.
- Left to right: strength for its level, in levels (quarter ticks; the dashed line is the level's average). The axis is ±¾
  level, ±1 when a robot of this game needs it.
- Every lineup robot (33) has a token with the game's own picture (`RobocusView.portrait`, top-down).
- This game's robots stand out: full size, a ring in the team's colour, yours with a thick ring and `YOU`; Market robot lots
  with a dashed orange ring and `LOT`; next round's robot lots that the conveyor shows with `NEXT`. The other robots are small
  and dimmed. The switch "only this game's robots" hides them.
- A robot with parts or damage stands where it fights now, with a tag like `★2.6` (orange: up; red: down). Its as-new spot
  keeps a faint copy, and a dotted line in the team colour joins the two.
- Hover: name, level, weapon, owner, parts (with tier and what each adds), damage, "fights like".
- Click: green arrows to the robots it counters, red arrows from the robots that counter it, everything else dimmed. The side
  panel lists both, and for a robot in this game the bookie's band against each rival robot (open floor, `pairP` with parts
  and damage, the same chip as the scout panel: a band for changed robots, the 20% range when both come as new; 🎯 / ⚠️ as
  in the game).

## How positions are computed

- As new: a Bradley-Terry rating fitted to the open-floor matchup table (`src2/matrix.js`, 20 fights a pair, half a fight
  each way added to every pair so 20-0 pairs stay finite), 150 rounds, once per page. `dev` = the robot's rating minus the
  average of its level, divided by `Repair2.LEVEL` (0.62, the model's step for one level). Done on first open, cached.
- Shift (levels) = what its parts add, the game's own "fights like" (`upLv`: `PART_LV` for its level + the rarity tier's
  `RAR[t].lv`) − what its damage costs (`(baseStr − str2) / Repair2.LEVEL`, the strength model as the bookie counts it,
  `BAL.oddsDamage`). Part fit / epic combos are not in the shift (the bookie's odds do count them).
- Band = its level + the shift rounded, kept within Starters..Level 4. Place in the band = `dev` + what is left of the shift.
  So a ★2 robot that fights like ★2.6 stands in the Level 3 band, about ½ level left of the average, with its dotted line
  going down to its ★2 copy. Past the edge of the axis it stands at the edge with « or »; below starters it reads `< ★0`.
- Tokens of a band are spread so names do not overlap: robots in this game first, each placed as close to its true spot as
  possible (5 rows at most, sideways as needed).
- "Counters" use the game's tag rule (`counterOf`: the matchup is `BAL.counterTag`, 40 points, off what the level gap
  gives), on the robots as they come. The arrows go to this game's copies of a robot when it has some.

## Display only

Reads `G`, `LOTS`, the matchup table and the strength model; writes nothing to the game, the AI, the odds, bets or the
network, and calls no dice. Face-down cards are not counted (the strength model never sees them); the conveyor's mystery
lot stays a mystery. Checked: a state hash of `G` and `LOTS` before opening and after hovering and clicking every token and
both switch positions is identical; an online game with every screen opening and closing the map every 3 s had 0 desyncs.

Code: `openPowerMap` / `closePowerMap` and the `pm*` helpers in `prototypes/tabletop-2.html` (CSS `#pmapBox`). Debug:
`ROBOCUS_DEBUG.openPowerMap()`, `ROBOCUS_DEBUG.PM` (items with their place, `msOpen`).
