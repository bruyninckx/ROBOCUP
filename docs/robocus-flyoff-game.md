# ROBOCUS next gen: parts that fly off, in the game (T73, 28 Nov 2026)

Kev voted Yes on his third rule: "It shows on the card afterwards: the robot card shows the robot without its piece until you pay
for the repair in the garage." He also said how much losing a piece hurts, and how often it happens, are fine as they are.
Branch `claude/flyoff-game` (from `claude/flyoff-buzzkill`, for `nextgen`; **not for `main`**). The mechanism itself (all 33
robots, what each loses): `docs/robocus-flyoff.md`.

## What a player sees

- **In the fight**: robots lose a piece that fits their look (Gyro its shell, Buzzkill one arm of its bar, Scavenger its hopper,
  Tarantula up to three legs, Hydra two heads...). It lies on the floor for the rest of the fight, and the robot fights differently.
- **After the fight**: the piece stays lost. The robot's picture (its card, the garage, the power map, every picture of it) shows it
  without the piece, with a **red tag naming it** ("SHELL LOST", "2 LEGS LOST"). The zone the piece belongs to shows broken, with the
  same words ("⚔ WEAPON · SHELL LOST · FIX"). Hovering the tag or the zone says what was lost and what it changes in the fight (the
  lab page's words).
- **In Upkeep**: the garage offers the repair like any broken zone: click the zone, or the repair button in the note. Repairing the
  zone puts the piece back on (and mends the rest of that zone, as a zone repair always does).
- **A first-time tip** ("A piece flew off") points at the first card with a red tag.
- The changelog has a "2.0.1 nextgen, parts that fly off" entry; the build line starts `tabletop 2.0.1 nextgen 2026-11-28a`.

## The rules chosen (the safest, all changeable)

| Question | Chosen | Why |
|---|---|---|
| Which zone does a piece belong to? | its **Weapon** zone; Tarantula's legs: its **Drive** | the pieces are the weapon or sit on it; legs drive |
| What does the repair cost? | **the same as a broken zone today: 2 repair actions** (a crew action each, or 2 Cr each once they are used up; free actions count) | the brief: the price of repairing one broken part of that robot |
| Several pieces (Tarantula, Hydra)? | one repair puts all of them back | a zone repair mends the whole zone |
| Repair kit, Field hospital (and medic drones) | in a fight they mend the piece like a part (its wear goes back at the same rate as a part's health), but **a piece that is off stays off** | the same as a lost part: they heal what is there, they never bring back what is gone |
| The AI | repairs it by its rule for broken zones (broken weapon / drive first; the repair that wins back the most strength first) | the same rule; it sees the piece's cost below |
| The bookie, the odds, the power map | the test fights start the robot without its piece (it is in the robot's state); the formula odds and the power map charge a lost piece what it costs in fights (below) | "count with the robot's real state" |
| Online play, saved games, Resume | the lost pieces are part of the robot's damage (`r.wear.fo`), which already travels in the game state and in every fight's options; the switch is in the fight's options too | nothing is worked out again on a joined screen |
| The switch | `BAL.flyoff: true` on this branch; `false` plays fights without pieces flying off (a piece already lost stays lost until repaired). The engine's own default stays **off** | one setting |

Formula cost of a lost piece (logits, `Repair2.PIECE_COST`, from the wins starting without the piece against the same fights keeping it,
128 fights each way, `docs/robocus-flyoff.md`): Gyro 2.86, Jukebox 2.64, Rotisserie 2.33, Pogo 2.32, Scavenger 2.08, Orbiter 1.83, Tarantula 1.76
(all three legs), Yoyo 1.72, Popcorn 1.58, Trebuchet 1.45, Mincer 1.39, Mauler 1.34, Wrecker 1.28, Hornet 1.27, Corkscrew 1.22, Vertigo 1.11,
Scythe 1.08, Gaucho 0.76, Hydra 0.67 (both heads), Slingshot 0.63, Thumper 0.61, Whaler 0.41, Snapjaw 0.41, Lodestone 0.27, Thwacker 0.19,
Blacksmith 0.16, Forklift 0.13, Angler 0.10, Railgun 0.08, Pincher 0.06, Buzzkill 0.04 (T72's lopsided bar), Grandmaster 0 (it wins more without
its hat); Bricklayer 2.20 (measured for this task: 97 -> 33 of 128 starting without its stack). One level is 0.62.

## How it works (for the next person)

- Engine (`tools/damage-lab/engine.js`): `wearOf(R)` writes `w.fo` = pieces lost (`R.fo.n`). The parts a piece's pop changed (the shell
  that came off, the bar that was reshaped, Gyro's flywheel that was put in) are left out of the rest of the wear: `foInit` makes them
  again at the start of the next fight from `spec.wear.fo`, the same way `spec.flyoffGone` does. `create()` runs `foInit` for a robot with
  `wear.fo` even with the switch off. Repair kit and medic heal the piece's pool (switch on only).
- `src2/repair.js`: `zones()` puts the piece in its zone (`q.piece`: tag, label, how many), makes the zone broken and skips the parts the
  pop took off; `repairZone()` deletes `wear.fo` when the zone has the piece; `wearCost()` charges `PIECE_COST` instead of "weapon lost"
  when the piece is the only thing missing.
- Game page: `BAL.flyoff`, `flyoff` in every fight's options (`buildFight`, the odds overview, the bookie's record), the tag on
  `drawPortrait`, the zone words (`brokenTxt`), the help texts (`pieceWhat`, from `RobocusView.FO_WHAT`, moved out of the lab page), the tip.
- `src2/view.js`: `FO_WHAT` (the lab page reads it from here now); `portrait()` frames a robot with `wear.fo` like one with `flyoffGone`.

## Numbers

Whole AI games (`node tools/game-sim.js --page=prototypes/tabletop-2.html --tag=t73on --games=8 --par=2`, and the same seeds with
`--bal='{"flyoff":false}'`; the counts come from `res.v2.fo`):

| | switch on | switch off (same seeds) |
|---|---|---|
| games finished | 8 of 8, 0 page errors | 8 of 8, 0 page errors |
| rounds a game | 12.3 (11-14) | 12.4 (10-15) |
| fights a game | 11.9 | 11.6 |
| pieces lost a game | **13.4** (107 in 250 robot fight starts) | 0 |
| pieces repaired a game | **9.4** (75) | 0 |
| robots that started a fight with a piece missing | **9 of 250 (4%)** | 0 |

So about four in ten robots lose a piece in a fight; the AI repairs most before their next fight (the rest belong to robots that do not
fight again soon, or were traded or scrapped); only 4% of fights start with a piece missing. Game length is the same.

## Checks

- With the switch off (engine default), nothing changed: stock-fight fingerprint 470f6923, sync check 89a95280.
- `game-sim` check 2/2, 0 page errors; the longer run above.
- `mp-test` (3 clients, `node tools/mp-test.js 3 5 27`): OK, desyncs 0 on all three clients, 8 fights checked, 3.2 min.
- mp-scenarios rejoin, trading-floor, stand-in, host-reload: OK. tips: OK after updating the scenario for the 13th tip (its list of tip
  ids now includes `piecelost`; without it the new tip could take the Bets phase's one tip and the bookie tip did not show).
- Screenshots (`node tools/flyoff-game-shots.js /home/claude/out Gyro`): `/home/claude/out/t73-1280x720-card.png`, `-hover.png`,
  `-pmap.png`, `-repaired.png`, and the same at 1920x1080. The script also clicks FIX and checks the piece is back on.

## Questions for Kev

1. A lost piece now costs a broken zone's price (2 actions). Cheaper (1 action), since some pieces hardly matter (Railgun's clamp)?
2. Should the bookie's formula show the cost of a lost piece on the card (for example "-2.9" next to Gyro's tag), or is the tag enough?
