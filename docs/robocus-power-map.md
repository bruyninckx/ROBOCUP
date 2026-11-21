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
- Click: green arrows to the robots it counters, red arrows from the robots that counter it, everything else dimmed. The
  thicker the arrow, the stronger the counter (Kev, 17 Nov, T23: "increasing the size of the arrow depending on how much it
  counters"); see "Counter arrows" below. The side panel lists both, strongest first, each with a bar as long and thick as its
  arrow and the chance range. Hover an arrow, its robot or its row to pick out the pair: the others fade, and a label gives the
  chance and what the levels give. The side panel also has, for a robot in this game, the bookie's band against each rival robot (open floor, `pairP` with parts
  and damage, the same chip as the scout panel: a band for changed robots, the 20% range when both come as new; 🎯 / ⚠️ as
  in the game).

## How positions are computed

- As new: a Bradley-Terry rating fitted to the open-floor matchup table (`src2/matrix.js`, 20 fights a pair, half a fight
  each way added to every pair so 20-0 pairs stay finite), 150 rounds, once per page. `dev` = the robot's rating minus the
  average of its level, divided by `Repair2.LEVEL` (0.62, the model's step for one level). Done on first open, cached.
- Shift (levels) = what its parts add, the game's own "fights like" (`upLv`: `PART_LV` for its level + the rarity tier's
  `RAR[t].lv`) − what its damage costs (`(baseStr − str2) / Repair2.LEVEL`, the strength model as the bookie counts it,
  `BAL.oddsDamage`) + what its part fits are worth (T48, below).
- Band = its level + the shift rounded, kept within Starters..Level 4. Place in the band = `dev` + what is left of the shift.
  So a ★2 robot that fights like ★2.6 stands in the Level 3 band, about ½ level left of the average, with its dotted line
  going down to its ★2 copy. Past the edge of the axis it stands at the edge with « or »; below starters it reads `< ★0`.
- Tokens of a band are spread so names do not overlap: robots in this game first, each placed as close to its true spot as
  possible (5 rows at most, sideways as needed).
- Counters on the map (`pmCounters`): the matchup is 30 points (`PM_MIN`) or more off what the level gap gives (`MX_EXP`,
  open floor), on the robots as they come. The arrows go to this game's copies of a robot when it has some.

## Fits and epic combos move the robot (T48, 22 Nov 2026)

Kev (voting page, 21 Nov): a great fit or an epic combo "should move the robot too".

- The shift now adds what the bookie adds for them (`fitAdj` in `prototypes/tabletop-2.html`, used by `pairP`), in levels
  (logits / `Repair2.LEVEL` 0.62), open floor (`pmFits`):
  - great fit (`PART_FIT` +1): +0.3 logit = **+0.5 level**; poor fit (`PART_FIT` −1): **−0.5 level**;
  - epic combo (`EPIC`: Whiplash, Phantom Hook, Overclock, Iron Bolas): +0.7 logit = **+1.1 levels** (instead of the
    great fit it also is, not on top of it);
  - a complete giant-slayer build (`TRIPLE`): +0.6 logit = **+1.0 level**.
  These are the numbers the bookie's formula already used; their source is the fit tests in `docs/robocus-tuned-lineup-tags.md`
  and the T41 re-test (`docs/robocus-wear-in-game.md`).
- The hover card and the side panel say why, e.g. "Fights like ★2.9 (parts +¾, Epic combo Whiplash +1.1 levels)" for a ★1
  Thwacker with a Tow cable (before: ★1.75 in the Level 2 band; now the Level 3 band). A ★0 Forklift with a Pester chip:
  "parts +¾, Poor fit Pester chip −0.5" (★0.75 → ★0.27, back to the Starters band).
- Wear marks: the bookie's `Repair2.markCost` (T41) was already inside the damage (`str2` → `wearCost` → `markCost`). The text
  now splits it out: "damage −¼, wear marks −0.2" (`pmMarkLv`). No change to where a marked robot stands.
- Parts stay in quarters ("+¾", as on the cards); fits, epics and marks are shown in tenths.

## Counter arrows (T23, 17 Nov 2026)

- Width grows smoothly with how far the matchup is from what the levels give: 1.6 px at 30 points, 10 px at 85 points or more
  (`pmW`); the head grows with it. 30-39 points: thin and light (no tag in the game); 40+: dark, the same counters as the game's
  🎯 / ⚠️ tags (`counterOf`, `BAL.counterTag`; those keep their own rule). Strongest drawn on top.
- Examples: Gyro over Pogo (Gyro wins 100% where the levels give 15%: 85 points, the thickest); Buzzkill (a starter) over Pogo
  (65% where 6%: 59 points, thick); Pogo over Hydra (100% where 65%: 35 points, thin and light).
- Why 30: a cell of the table is 20 fights, one standard error is ±11 points at 50% and ±8 at 15/85%; 30 points is at least
  2.7 errors, so of the 528 pairs about 4 could pass by chance (25 would let in about 13). The level-gap value is an average of
  many pairs, nearly noise-free.
- Arrows per robot, over the 33 robots (min / median / max): 0 / 2 / 9 at 40 points (before T23), 1 / 4 / 14 at 30 (Hydra 14,
  Gyro 13, Corkscrew 11).
- When the picked robot, or a robot at its arrows, has parts or damage in this game, the panel says the arrows are as they
  come and the bands above are today's odds.

## Display only

Reads `G`, `LOTS`, the matchup table and the strength model; writes nothing to the game, the AI, the odds, bets or the
network, and calls no dice. Face-down cards are not counted (the strength model never sees them); the conveyor's mystery
lot stays a mystery. Checked: a state hash of `G` and `LOTS` before opening and after hovering and clicking every token and
both switch positions is identical; an online game with every screen opening and closing the map every 3 s had 0 desyncs.

Code: `openPowerMap` / `closePowerMap` and the `pm*` helpers (arrows: `pmCounters`, `pmW`, `pmArrow`, `pmArrowHit`, `pmHl`) in `prototypes/tabletop-2.html` (CSS `#pmapBox`). Debug:
`ROBOCUS_DEBUG.openPowerMap()`, `ROBOCUS_DEBUG.PM` (items with their place, `msOpen`).
