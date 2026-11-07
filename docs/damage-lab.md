# Damage Lab (beta sandbox)

Separate test arena with a much deeper, visual damage model. Not connected to the main game or `src/sim.js`.

- Play: `prototypes/damage-lab.html` (double-click; needs internet once for planck.js + fonts). Published copy: https://claude.ai/artifact/Ez2MaYXTobWmFpF77TBXPC
- Sources: `tools/damage-lab/` (`engine.js` = sim, `ui.js` = renderer/UI, `shell.html`), rebuild with `python3 tools/damage-lab/build.py`.
- Headless: `cd tools/damage-lab && npm i planck@1.4.3 && node test.js open` (round robin, any arena), `node test.js killbox Buzzkill,Doorstop` (4 seeds + logs), `node trace.js A B seed arena T`, `bash rr.sh <arena>` (KO causes, fight length, wins per preset), `node causes.js` (damage/s by cause).

Decided with Kev (7 Nov interview): top-down 2D rigid-body physics; part-based damage; melee + existing guns + rams + arena hazards; first version is a watch-and-tinker sandbox.

## Model
- planck.js (Box2D) at a fixed 120 Hz, seeded RNG, deterministic (same seed + builds = same fight). Arena 8 x 8 m.
- Robot = chassis body with parts as fixtures: chassis, wheels (2 or 4), armour plates (front / sides / rear, levels 0-3; top armour has no fixture, it cuts overhead hits 18% per level), front tool. The bar spinner is its own body on a motorised revolute joint (real spin-up, real recoil).
- Internal parts (no fixture): battery, radio, one motor per wheel, weapon motor, turret / axe arm. Hits on the bare chassis pass 55% to the nearest internal; armour passes only hits above 3x its threshold.
- Damage = (collision impulse - 7) x 0.2 x sharpness of the hitter x toughness of the part, times the global damage scale (`TUNE.dmg`, 0.65) and the weapon knob. Bar 3.4, spikes 1.8, saws, wedge 0.25, wall 0.25, blunt robot parts 0.35.
- Parts at 0 HP tear off as physical debris (keeps speed and spin; loose wheels keep rolling). Chassis at 0 = everything falls off.
- Effects: bent wheel (wobble, 60% grip), dead motor (wheel freewheels), missing wheel (corner scrapes, robot pulls), jolts on big hits (motor jammed on = circles, weapon jam, radio glitch), heat (stalled pushing, flames, laser; motors cut power above 85, parts take damage above 75), battery fire, upside-down (turret / axe / crusher robots lie helpless unless they self-right; flipper and axe self-right; wall bash can roll you back).
- KO: battery or radio destroyed, chassis torn apart, fell in the pit, no drive for 6 s (incl. stuck upside down), or crippled (a dead wheel/motor) with no controlled movement for 12 s while not being attacked up close. 3:00 limit, judges = damage + 12 per enemy part ripped off + 3 per second of aggression.
- Weapons: bar spinner, drum (kicks into the air), flipper (12 shots of gas), axe hammer (overhead, through top armour), crusher (grab + drag to hazards), wedge (lifts the other robot's grip, pushes to hazards), rapid / medium / heavy gun, laser, mortar, saw launcher, flamethrower.
- Arenas: open floor, centre pit, floor saws, killbox (pit + saws + spiked walls).

## First headless numbers (78-pair round robin, one seed)
Open floor: median fight 67 s; KOs mostly chassis torn apart, then immobilised, battery, radio, upside down. Wedge (Doorstop) wins nothing on open floor but works in hazard arenas; mortar, axe and flamethrower are strongest; spinner middling. Nothing balanced yet, numbers are a starting point.

## Open / ideas
- Kev to watch and steer: what feels real, what is too strong, which weapons to add (vertical spinner, shell spinner, lifter).
- Tracks drive, self-righting arm module, gas tank / weapon heat, repairs between fights (could feed engineers + repair costs in the main game later).

## Market robots (balanced 7 Nov)
Seven presets meant as the robots you can buy. Balanced together over 200 fights per matchup (100 seeds x open floor + centre pit, sides swapped every other seed), checked on seeds never used while tuning.

| Robot | Build | kg |
|---|---|---|
| Buzzkill | bar spinner, heavy, 2 wheels, hot motors, armour side 3 / rear 1 / top 2 | 115 |
| Rumbler | drum, heavy, 2 wheels, big battery, side 2 / rear 1 / top 1 | 103 |
| Popcorn | flipper, medium, 4 wheels, side 2 / rear 2 / top 2 | 96 |
| Thumper | axe, light, 4 wheels, big battery, front 2 / side 2 / top 2 | 89 |
| Snapjaw | crusher, medium, 4 wheels, side 3 / top 1 | 96 |
| Peppershot | medium gun, medium, 4 wheels, front 1 / side 2 / rear 1 / top 1 | 90 |
| Blowtorch | flamethrower, light, 4 wheels, big battery, front 2 / side 1 / top 1 | 74 |

Win % (row beats column):

| | Buzzkill | Rumbler | Popcorn | Thumper | Snapjaw | Peppershot | Blowtorch | avg |
|---|---|---|---|---|---|---|---|---|
| Buzzkill | - | 34 | 50 | 53 | 36 | 73 | 40 | 48 |
| Rumbler | 66 | - | 28 | 34 | 65 | 36 | 71 | 50 |
| Popcorn | 50 | 73 | - | 57 | 47 | 36 | 47 | 51 |
| Thumper | 47 | 66 | 43 | - | 30 | 44 | 52 | 47 |
| Snapjaw | 64 | 35 | 54 | 71 | - | 35 | 56 | 52 |
| Peppershot | 27 | 65 | 65 | 56 | 66 | - | 34 | 52 |
| Blowtorch | 61 | 29 | 54 | 48 | 45 | 67 | - | 51 |

Every robot averages 47-52%, no matchup is worse than 73/27, every robot has at least one good and one bad matchup. Median fight 76 s (middle half 48-108 s), 16% go to the judges.
Endings: chassis torn apart 31%, crippled count-out 26%, judges 16%, pit 12%, no drive 5%, stuck upside down 4%, radio 3%, battery 2%.

Weapon knobs (`TUNE` in engine.js, damage multipliers): global 0.65, spinner 1.15, drum 0.85, flipper 0.9, axe 0.72, crusher 1.15, medium gun 0.8, flame 0.62. Test builds (Doorstop, Rattler, Boomer, Sparky, Lobster, Grinder) are not balanced.

Engine changes made while balancing: flips/kicks credit wall slams to the thrower; flipper does not flip a helpless upside-down robot back over, plate HP 130; drums are deflected by flipper and wedge plates; crushers cannot grab a spinning drum or bar; gunners keep extra distance from flamethrowers and spinners; flamethrower robots can drive upside down but cannot burn until righted; both robots back off and re-engage after 4 s of shoving with no damage; wall/corner escape; crippled count-out; 3 min limit.
Tools: `node market.js market-final.json` (matrix), `node search.js in.json out.json` (coordinate search over builds + knobs), `node why.js file.json A B` (damage by cause), `node tos.js file.json N` (time-outs per matchup).
