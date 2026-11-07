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

## Arcade update (8 Nov): drama first
Kev: more drama, crazier weapons, bumpers of different hardness, no hug fests; keep the flying parts. Picked: bigger hit physics, hype meter, power-ups, arena events; one bumper type per robot; looser balance (40-60%).
- New weapons: boxing glove (punch sends robots across the arena, no flip), spear (long lance, lines up and dashes in, pierces armour, can snap), flail (spiked ball on a chain swung by a motor arm).
- Bumpers (material of all armour plates): steel, rubber (blunt hits x0.35, sharp x1.5, bouncy), spring (throws attackers back), spiked (hurts whoever rams it), fibreglass (35% weight, shatters into shards).
- Arcade physics (`ARC` in engine.js): spinner / flail / spear hits add knockback and make the victim skid; torn-off parts fly twice as far and spin more; battery KOs blow every part off.
- Crates every 13-19 s (nitro, overcharge x1.8 damage, repair, shield 60). Robots go for one when it is closer to them than to the enemy.
- Arena events every 16-22 s (every 7 s in the last 30 s, "sudden death"): closing walls (two walls move in 1.1 m for 6 s and crush what is in the way), floor bumpers (4 red circles, then robots on them are launched), ceiling hammer (red circle, then a 30-damage slam from above).
- Hype: damage and ripped-off parts fill a hype bar; full = 6 s of rage (damage x1.4, push x1.2). Comic callouts on the canvas (KAPOW!, SKEWERED!, WHEEL GONE!...), hit-stop and flashes on big hits, motion trails.
- Anti-hug: back off after 2.5 s of shoving with no damage (was 4), pinning limited to 2 s, 2:00 time limit, AI paths round the pit (first hit in pit arenas went from 17 s to 3 s).
- Bug fixed on the way: closing walls moved the wrong way through robots.

### Market roster (10 robots, 80 fights per matchup on fresh seeds, open floor + centre pit)
| Robot | Weapon | Build | Bumper | kg |
|---|---|---|---|---|
| Buzzkill | bar spinner | medium, 4 wheels, hot motors, side 3 / rear 1 / top 2 | spiked | 112 |
| Rumbler | drum | heavy, 2 wheels, big battery, side 2 / rear 1 / top 1 | steel | 103 |
| Popcorn | flipper | light, 4 wheels, side 2 / rear 2 / top 2 | steel | 84 |
| Thumper | axe | medium, 4 wheels, big battery, front 2 / side 2 / top 2 | spiked | 105 |
| Snapjaw | crusher | medium, 4 wheels, side 3 / top 1 | steel | 96 |
| Peppershot | medium gun | medium, 4 wheels, front 1 / side 2 / rear 1 / top 1 | steel | 90 |
| Blowtorch | flamethrower | light, 4 wheels, big battery, front 2 / side 1 / top 1 | steel | 74 |
| Haymaker | boxing glove | medium, 4 wheels, side 2 / rear 1 / top 1 | rubber | 85 |
| Jouster | spear | medium, 2 wheels, hot motors, side 2 / rear 1 / top 1 | fibreglass | 72 |
| Wrecker | flail | medium, 4 wheels, big battery, front 1 / side 3 / top 2 | spiked | 114 |

Averages 44-57%. Strongest counters: Jouster beats Peppershot 86%, Snapjaw beats Jouster 83%, Haymaker loses to Jouster 20%, Rumbler loses to Thumper 22%. Median fight 55 s (middle half 36-78 s), 3-4% judges. Endings: chassis torn apart 29%, crippled count-out 23%, pit 13%, no drive 8%, upside down 5%, radio 5%, judges 4%, battery 1%.
Knobs: global damage 0.68, spinner 1.15, drum 0.62, flipper 1.6, axe 0.75, crusher 1.5, gun 0.8, flame 0.72, glove 0.85, spear 0.9, flail 1.25. `node drama.js` prints first-hit time, parts lost and fight length per arena.

## Battleground parts (8 Nov, second pass)
Kev: bring the modules, drives and processors of the real Battleground (`docs/processors-and-drives.md`, `docs/upgrade-cards.md`) into the carnage and make 7 market robots with good, exciting fights. All of them are in the builder (Drive, Processor, Module) and have their own visuals.
- **Drives:** 2 wheels, 4 wheels, plus tank tracks (one long track per side, 1.6x grip, 1.45x push, 0.84x top speed, half the knockback), omni wheels (slides sideways while facing the enemy, little side grip, 1.35x knockback) and overboost thrusters (rocket at the back: a 0.6 s dash every 4.5 s, turns at 72%). Tracks and the thruster are parts that can be shot off or blown.
- **Processors:** stock, zigzag (weaves in on +-35 degree diagonals, jukes bullets), kiter (gunners keep their distance and back off; melee robots hit and run), rammer (chases with a 0.5 s lead, backs off later, a fast ram adds up to 22 damage, a shove and a 0.25 s stun).
- **Modules** (an internal part: when it is destroyed the module is offline): energy shield (30 HP, recharges 8/s after 3 s), EMP (1.8 s stun within 1.5 m, every 10 s), grappling hook (yanks the enemy in from up to 3.2 m, every 6 s), jump jets (leaps 1.6 m clear, every 5 s), oil slick (puddles: grip x0.22 and spin), mine layer (max 3 mines, 22 damage from below), repair drone, self-destruct (below 30%: charges, 50 damage blast, blows its own armour and weapon off but survives), quantum shield (once, 3 s of no damage), smoke screen (guns spray x5, the enemy aims at a guess), pop-up flipper (14 damage, throw, 0.8 s stun, every 3 s).
- **Strain:** chips and modules add strain as on the cards. Every strain point is a 0.4% chance per second of a malfunction: chip glitch, module offline for 3 s, or omni rollers / thrusters locked for 3 s.
- Per-robot damage knob `dmgK` in the build (so the classic roster keeps its numbers). The 10 arcade robots from the first pass are kept as "Arcade classics".

### Market roster (7 robots, 60 fights per matchup on seeds not used for tuning, open floor + centre pit)
| Robot | Weapon | Build | Drive | Processor | Module | kg |
|---|---|---|---|---|---|---|
| Juggernaut | drum | medium, big battery, side 1 / rear 1 / top 1, steel | tracks | rammer | grappling hook | 94 |
| Hornet | spear | medium, side 2 / rear 1 / top 1, steel, dmg x1.25 | thrusters | zigzag | jump jets | 91 |
| Whirlwind | bar spinner | medium, hot motors, side 2 / rear 1 / top 2, steel, dmg x0.9 | 4 wheels | kiter (hit and run) | energy shield | 104 |
| Brawler | boxing glove | heavy, side 3 / top 1, rubber, dmg x0.92 | 4 wheels | rammer | EMP | 109 |
| Slick | medium gun | heavy, front 1 / side 1 / rear 1 / top 1, spring | omni | kiter | oil slick | 101 |
| Hellfire | flamethrower | light, big battery, front 2 / side 1 / top 1, steel, dmg x1.25 | 4 wheels | zigzag | self-destruct | 79 |
| Mauler | flail | light, big battery, front 1 / side 2 / top 1, spiked, dmg x0.9 | tracks | stock | repair drone | 94 |

Averages 45-58% (Juggernaut 45, Hornet 48, Whirlwind 52, Brawler 49, Slick 58, Hellfire 48, Mauler 49). Hard counters: Hellfire beats Juggernaut 85%, Mauler beats Juggernaut 82%, Brawler beats Hellfire 82%, Slick beats Hellfire 82%, Juggernaut beats Brawler 77%. Median fight 62 s (middle half 43-89 s), 8% go to the judges. First hit after 1.4 s on open floor, 3.5 s in the pit arena; about 6-7 parts fly off per fight. Endings: chassis torn apart 24%, crippled count-out 24%, immobilised 23%, pit 16%, judges 8%, upside down 3%, radio 2%, battery 1%. Per fight on average: 1.9 grapples, 1.7 EMPs, 1 jump-jet escape, 0.6 strain malfunctions.
Found while balancing: omni wheels on the bar spinner were far too strong (76% average: it always faced the enemy and bounced off to spin up again), so Whirlwind runs on 4 wheels and Slick (gunner) keeps the omni drive. The 20-fight search overfitted (score looked fine, holdout showed 35-76%), so the final numbers were set by hand on 40- and 60-fight holdouts. `node row.js market-final.json Name '{"dmgK":0.8}' 101 120` checks one robot's row.

## Helper drones, top plate and processor chip (8 Nov, third pass)
Kev: helper drones as upgrades (not in the market deck) that can turn a battle, plus a damage effect where the top plate comes off and exposes the chip inside.
- **Drones** (builder: Drone 1-3; up to 3 per robot, each adds 1 strain; separate bodies that fly on their own, not counted in the robot's weight). Hovering drones are only reached by shots, beams, flames, saw discs, mortar blasts and swinging weapons; the blocker is a solid disc. A shot-down drone crashes as debris ("DRONE DOWN!"). An EMP knocks the enemy's drones offline for 2.5 s; a strain malfunction can drop one offline for 3 s.
  - Medic: hangs behind, chassis +4 HP/s, parts +3 HP/s, puts out battery fires, restarts a burnt-out motor after 9 s of patching.
  - Gun drone: orbits at 0.8 m, 2 small shots per second (3.2 damage).
  - Laser drone: hangs back about 2 m, thin beam (3.5 damage/s plus heat).
  - Booster: docks on the back: +50% push, +15% speed, +15% damage, a nitro kick every 4.5 s when lined up.
  - Blocker: heavy armoured disc (150 HP) that sits in front of its robot and takes charges and hits.
  - Bodyguard: takes 40% of every hit on its robot while close (90 HP) and eats shots and beams.
  - Waller: every 4.5 s an energy wall towards the enemy for 3.5 s (stops shots and robots).
  - Spotter: +25% damage, guns 40% more accurate, sees through smoke.
  - Jammer: flies in close to the enemy: its turret turns at 45%, reloads and spin-up at half speed, module blocked.
- **Drone value** (each market robot + 1 drone vs the other six, 120 fights per cell, `node dronevalue.js out.json`): medic +19, gun +13, laser +13, jammer +13, booster +12, waller +11, spotter +11, blocker +10, bodyguard +8 win points on average. Best fits: medic on Juggernaut/Brawler (+32), jammer on Juggernaut (+23), waller and spotter on Mauler (+22/+23). Slick gains least from most drones. The table is on the page (click a cell to watch that fight). First pass had the laser drone at +27 and medic/bodyguard/booster at +1-3; the medic only healed the chassis while most robots die from lost wheels and motors.
- **Top plate**: every robot has a lid over its electronics (18 HP + 26 per top armour level). Overhead hits put 60% into the lid, big chassis hits (9+) rattle it for 30% extra; below 40% it rattles loose, at 0 it flies off as debris ("LID OFF!"): top armour no longer counts and the processor chip is exposed (35% of damage going inside now hits the chip, overhead hits go straight for it).
- **Processor chip** (30 HP, only reachable once the lid is gone). Every hit on it (2.2 s cooldown) rolls one effect: chip glitch (steering haywire), REBOOTING (frozen 1-2.5 s, weapon dead), WIRES CROSSED (controls reversed), BERSERK (charges straight in, never backs off, +30% damage), MISFIRE (weapon flickers on and off). At 0 HP: BRAIN FRIED, the robot limps on backup control (60% speed, wanders, stock AI, module and drones dead).
- In 42 market fights: lid off 22 times, berserk 8, crossed wires 4, reboot 4, brain fried 5. The market table barely moved (44-57%, median 63 s, 10% judges); it is updated on the page.

## Flanker chip (8 Nov, experiment)
Kev: a real flanker processor that tries to hit the sides of other robots. New processor `flanker` in the builder (1 strain):
- While it is in the enemy's front arc (wider against front weapons: spinner, drum, flipper, glove, spear, crusher, wedge) it circles round at close range, against the direction the enemy is turning, to get behind its weapon.
- When the enemy charges at it, it sidesteps at the last moment ("SIDESTEP!"): the enemy overshoots and shows its side.
- From the side or the back it goes in, aiming at the enemy's rear quarter so the enemy can't turn its weapon round in time. Hits on sides and back do +25% ("FLANKED!", "BACKSTAB!").
- If it can't get round in 3 s it commits and charges straight in for 1.2 s, then tries the other way round. It backs off to re-flank sooner than other chips (1.8 s of shoving instead of 2.5 s).
- Every robot now tracks how much of its damage lands on the enemy's sides and back.

Experiment (`node flank.js 501 504`): each market robot with its own chip vs with the flanker chip, 48 fights against the other six:

| Robot | Own chip: wins, side/back share | Flanker: wins, side/back share |
|---|---|---|
| Juggernaut (drum) | 46%, 29% | 48%, 23% |
| Hornet (spear) | 54%, 25% | 63%, 46% |
| Whirlwind (spinner) | 40%, 22% | 67%, 31% |
| Brawler (glove) | 48%, 59% | 48%, 48% |
| Slick (gun) | 54%, 17% | 44%, 30% |
| Hellfire (flame) | 48%, 43% | 50%, 43% |
| Mauler (flail) | 58%, 34% | 54%, 34% |

It shines on the spear (almost half its damage goes into sides and back, fights over in 39 s) and the bar spinner (+27 win points: too strong as it stands). Pushing weapons (drum, glove) do worse: they want to face the enemy and shove, and Juggernaut's grappling hook keeps pulling flankers back in front of it. On the gunner it hits more sides but loses its kiting distance. The market robots keep their own chips; the flanker is a builder option for now.

## Physical weapons, snags, hull shapes and a new roster (8 Nov, fourth pass)
Kev: guns and the boxing glove are boring to watch (no fun interaction); try projectile guns, a small front saw with a slow rocket, more movement and mechanical interaction; the spear getting stuck in Whirlwind's bar was great, and robots don't have to be boxes.
- **Real bullets**: every shot is now a physics body. Slugs ricochet off walls (2 bounces, 75% damage per bounce), shove robots (medium gun kick 7, cannon 45 plus a small lift), push debris, and are stopped by drones, energy walls and other robots in the way.
- **Rocket pod** (new weapon): 4 s reload, the rocket launches slowly, accelerates to 13 m/s and homes in a little, so it can be dodged or knocked off course; it explodes on anything (22 damage blast, 0.95 m radius, throws robots).
- **Buzzsaw + rocket pod** (new): a small 0.14 m saw on the nose that spins at 110 rad/s, grinds whatever it touches, flings it sideways along its edge, sprays debris and bogs down while it bites; plus a rocket pod (5 s reload, 15 damage). Also as a plain **Buzzsaw**.
- **Harpoon gun** (new): fires a harpoon on a rope (real rope joint). It reels the victim in fast, circles, and after 2.4 s flings it at the nearest wall or the pit ("HOOKED!", "FLUNG!"); the rope snaps under too much force.
- **Boxing glove** is now a real piston: the glove is its own body on a sliding joint that shoots out 0.5 m, hits whatever is there (and can be hit and ripped off), and pulls back.
- **Snags**: when two weapons hit hard they can lock together for 1.4-2.8 s (spear in a spinner bar or saw: 50%; spear into anything: 25%; other weapon pairs 6%). A jammed spinning part stops dead. Both robots then tug and twist; if the weld is pulled too hard the weaker part is "WRENCHED!" (26 damage), otherwise "UNSTUCK!". About one snag per fight.
- **Hull shapes** (builder: Hull): box, chamfered (corners cut, glancing hits, rolls back over a bit easier), wedge nose (narrow pointed front), round shell (eight-sided, rolls back onto its wheels when flipped).

### Roster change
Slick (gun) and Hellfire (flamethrower) leave the market: Slick was the least exciting robot (9 big moments per minute) and the flamethrower lost 95% against the new ranged weapons. They stay in the builder under "Older robots". In: **Sawblast** (buzzsaw + rocket pod, medium, 4 wheels, zigzag) and **Whaler** (harpoon, heavy, tank tracks, round shell). Rocketeer (rocket pod) and Grindstone (buzzsaw only) are trial builds.

Big moments per minute against the roster (6 fights per opponent): Whaler 26, Sawblast 24, Rocketeer 23, Brawler 20 (was 17 before the piston), Juggernaut 18, Hornet 18, Whirlwind 17, Mauler 16; Slick 13 and Hellfire 13 for comparison.

Market table (60 fights per matchup on fresh seeds, open floor + centre pit): Juggernaut 56, Hornet 44, Whirlwind 47, Brawler 49, Mauler 49, Sawblast 52, Whaler 53. Median fight 56 s, 8% judges. Hard counters: Juggernaut beats Whaler 93% (the drum flips it), Whaler beats Whirlwind 88%, Brawler beats Juggernaut 80%, Whirlwind beats Brawler 78%. Knobs: Juggernaut and Whirlwind and Mauler dmg x1.0, Hornet x1.35, Brawler x0.75.
Drone values were measured again for the new roster (+3 blocker to +15 medic); medic on Sawblast and Juggernaut (+28/+25) and booster on Sawblast (+28) are the best fits.
`node excite.js Name,Name 6` prints win %, big moments per minute, parts per fight, throws, length and first hit against the roster.
