# ROBOCUS 2.0: Level 4 robots, the end-game wave (plan, 8 Nov 2026)

Kev's brief (8 Nov): take the Lineup Arena with the streamlined level 1, 2 and 3 robots and find **4 to 8 level 4 robots** that earn their level **without power-creep knobs** (no bigger `dmgK` / `hpK` than the current band). The edge has to come from **exotic physical mechanisms** (multi-levered arms, multi-jointed sweepers, flying circular blades that retract, combinations) and from **smarter decision-making**. End-game material: it can be wild, it should look great (flashing lamps, light shows), and a robot that turns out really too strong can become a crazy legendary instead of being cut. Some deviation from strict level-4 numbers is fine if it is close.

This doc is the plan. **Status (8 Nov, later): built.** All eight robots, the shared helpers and the test tools are in; results, deviations and what is left open are in `docs/robocus-2.0-level4.md`.

Opus implements it. Everything builds on `tools/damage-lab/engine.js` + `ui.js` (rebuilt into `src2/` with `python3 tools/damage-lab/build.py`), `tools/damage-lab/lineup.js` and the Lineup Arena (`prototypes/lineup-arena.html`). Read `docs/robocus-2.0-lineup.md` and `docs/damage-lab.md` first: they hold the level model, the physics model and every lesson learned so far.

## 1. What "level 4" has to mean

The level ladder today (1v1, open floor): each level beats the one below **60-62%**, two levels **76-77%**, three **91%**. One level is about +13% power. All 25 robots sit at power grade **p = 0.76 to 1.21** (`ROBOTS` in `lineup.js`: weapon damage x p and every part's HP x p).

Targets for a level 4 robot, tested against the five **level 3 robots** (Whaler, Forklift, Vertigo, Sawblast, Ramrod) and the level 2 robots:

| Metric | Target | Why |
|---|---|---|
| Win vs level 3 (5 robots, 70+ fights each, fresh seeds) | **55-65%** | one level above, like every other step |
| Win vs level 2 | **70-85%** | two levels, not three |
| Power grade p needed to get there | **0.9-1.15**, hard cap 1.2 | the whole point: the mechanism earns the level, not the knob. If a design needs p > 1.2, redesign the mechanism (more reach-around, better timing, a second stage), don't raise p |
| Worst single level-3 matchup | **≥ 10%** | hard counters are fine (they exist at every level), 0% is not, except for a documented rock-paper-scissors pair |
| Big moments per minute (`excite.js`) | **≥ 18** | the market robots score 16-26; end-game robots must be at least as watchable |
| Median fight | 40-80 s | no hug fests, no 10-second deletions |
| Parts flying | ≥ what level 3 does | the lab's whole identity |

If a robot at **p = 1.0 beats level 3 by more than 72%** and no mechanical nerf (slower deploy, fewer blades, shorter hold) brings it into range without killing the fun, it goes to the **legendary** bin (section 5) instead of being cut.

A note on `dmgK`: the trial robots already carry weapon-specific `dmgK` (Thwacker 5, Forklift 2, Pincher 1.8) because the physics of those weapons produces tiny impulses. That is **normalisation**, not power creep: a new weapon may get a `dmgK` that brings its raw hits in line with a bar spinner's, set once by `causes.js` / `why.js` damage-per-hit comparison, and then frozen before the level test. The level then has to come from everything else.

## 2. Shared engine work (do this first, every robot uses it)

These are the pieces that make the eight designs cheap to build and consistent to look at. Build and commit them before the first robot.

### 2.1 Articulated chain helper
The thwack tail already builds a 3-segment revolute chain with limits (`engine.js` ~line 560: `prev` → `sb` with `lowerAngle/upperAngle`). Lift that into a helper: `chain(S, R, { base: [x, y], segs: [{ len, w, mass, lo, hi, torque }], head })` that returns the segment bodies and joints, with per-joint motors (`enableMotor`, `maxMotorTorque`) so a controller can **drive each joint to a target angle** (simple P-controller on `getJointAngle()` → `setMotorSpeed`). Losing a segment drops everything beyond it, exactly like the tail. Used by: Hydra, Angler, Tarantula's legs.

### 2.2 Tether helper
The harpoon already does a rope (`RopeJoint`, ~line 1836) with reel-in and snap under force. Generalise: `tether(S, R, body, { len, minLen, reelRate, snapForce })` with `reel(len)`, `release()`, and a **wrap check** (if the rope segment crosses the enemy's chassis twice within 0.4 s, convert to a short weld on the enemy = "LASSOED!", like a snag). Used by: Orbiter, Angler's hook.

### 2.3 Weapon-state reader (the "Tactician" API)
A pure function `readEnemy(S, R)` that returns what a clever driver could see: enemy weapon kind and `cat`, `bladeW / bladeMax` (spin fraction), gas shots left, gun / rocket / harpoon reload timers, module cooldown and whether the module is offline, `stun`, `onSide`, lid gone / chip exposed, which wheels and motors are dead, `carry` / `grab` / `clampT` / `tether` flags, current heading vs its weapon arc, distance to the nearest wall, and active arena events (closing walls, bumper circles, ceiling-hammer circle with its remaining countdown) and crates. Nothing in it is new information; it is all in `S` and `E` already. Chips in section 3 use it. **Add a 0.4-0.6 s decision latency** (`R.plan` is recomputed every 0.5 s, not every step) so a smart robot is clever, not omniscient, and so a chip glitch / BRAIN FRIED visibly makes it dumb.

### 2.4 Lamp and light-show system (renderer)
A generic `lamps` list on a robot spec, drawn in `ui.js` (`drawMech` / `drawTop`) with additive glow, capped on small screens like particles:

```
lamps: [{ x, y, r, color, mode, src }]
mode: 'on' | 'pulse' (slow breathe) | 'strobe' (fast, warning) | 'chase' (runs along a list of lamps, for arms and rails)
     | 'state' (colour from src: R.fx[src] in 0..1, e.g. charge level green→red) | 'beacon' (rotating sweep)
```
The engine exposes `R.fx = { charge, armed, locked, thinking, ready }` per robot (0..1 or booleans) so lamps follow the mechanism: strobing while a thrower charges, chase lights running down an arm as it strikes, eye-LEDs blinking when the Tactician re-plans, a beacon when a weapon is ready. Lamps are **cosmetic only**, but they are also the player's tell: a strobing Trebuchet means "get away now". Callout text (`KAPOW!` style) gets one new entry per robot.

### 2.5 Huge chassis
A new `CHASSIS.huge` (bigger footprint than `heavy`, more mass, lower top speed): the stronger robots get the bigger frame and hitbox, which balances by design and makes them unmistakable on the floor (Kev's idea list). Default for level 4; a robot may stay `heavy` if the design wants speed.

### 2.6 Overhead-hit flag reuse
The axe hammer's overhead hits (through top armour, 60% into the lid) are the mechanism that gets lids off and chips exposed. Make "this contact is an overhead hit" a flag any weapon body can carry (`fixture.userData.overhead = true`) so Hydra's head and Trebuchet's landings use it.

## 3. The eight robots

Each one: the mechanism, how it earns a level by physics or brains, what beats it, the light show, the implementation route (what it reuses), size of the job (S/M/L) and the OP risk.

### 3.1 HYDRA, the multi-jointed strike arm (multi-levered arm)
**Mechanism.** A three-segment articulated arm (0.32 + 0.28 + 0.24 m, chain helper) on a turret ring at the centre of a huge chassis, ending in a spiked hammer head. At rest it lies folded flat across the top like a scorpion tail, inside the robot's own footprint (so no long-lever trap: nothing sticks out to be grabbed or levered). When the enemy is within 1.1 m the joints unfold in sequence (chase lights follow) and the head comes down **over** the enemy's front weapon onto its lid: an overhead hit (flag 2.6). It strikes every 1.6 s and can reach the enemy's **sides and back without the robot turning**, because the turret ring swivels independently.
**Why it is a level up.** The level-3 robots are all front-weapon robots (forks, ram, vertical disc, saw, harpoon). Hydra hits past the front weapon from above, exactly the hit class that removes lids and exposes chips, while the robot itself keeps its armoured face toward the enemy. The arm folds instead of levering: a hard hit on an extended arm bends a joint (the joint limit gives) rather than tipping the robot.
**Weaknesses.** Spinners and the vertical disc shear segments (lose the tip segment = lose the head = a glorified pusher); Whaler can hook the arm and snap it; a flipper or Trebuchet throw while extended folds it on top of its own lid (self-hit, 50% damage). Shell spinner (Gyro) has no lid to hit.
**Light show.** Chase lights along the segments on every strike, a red eye on the head that locks (steady) on the lid, amber ring on the turret when it swivels.
**Build.** Chain helper + turret joint + overhead flag + a joint-angle controller with three poses (folded, raised, strike). Reuse the tail's segment-loss code and the hammer's overhead damage path. **M.** OP risk: medium (overhead every 1.6 s). Mechanical nerf levers: strike interval, head mass, whether the ring can swivel while driving.

### 3.2 ORBITER, the flying blades that retract (retractable flying circular blades)
**Mechanism.** Two saw discs (0.16 m, like the buzzsaw body) docked in bays on the robot's flanks, where they are plates (they count as side armour, they spin lazily as a tell). On deploy, each disc is launched outward on a tether (tether helper, 1.3 m) and the robot spins its hull gently so the discs **orbit** it like a meteor hammer, at tip speeds the buzzsaw never reaches. Anything in the ring gets cut and flung along the disc's edge. On a command (retract), the tethers reel in and the discs re-dock in 0.9 s; while docked the hull is armoured, while deployed the flanks are bare.
**Why it is a level up.** A 2.6 m diameter kill ring with two independent bodies: the enemy can only face one. Ramrod's charge and Forklift's approach meet a disc before they meet the hull; Sawblast has to trade saw-on-disc. Hits on a disc don't lever the robot (it is on a rope). The **retract** is the brains: the chip retracts when a spinner is coming in (so the discs aren't knocked around), when a tether is about to wrap the enemy (or lets it wrap on purpose: "LASSOED!" reels the enemy into the other disc), and when a disc is below 30% HP (docked discs heal with Body repairs).
**Weaknesses.** Whaler harpoons a disc and the rope snaps (disc lost: it skids off as a **spinning debris hazard** that keeps cutting for a few seconds, which can hurt either robot). Blocker and waller drones stop discs. Fibreglass bumpers shatter on a disc, rubber shrugs it off. Heavy tracked pushers that close during the retract window get a free shove into the bare flank.
**Light show.** Disc rims glow by spin speed with motion trails; the tethers glow when taut; the bays strobe blue during retract; a beacon on top while the ring is live.
**Build.** Tether helper x2, buzzsaw body code for the discs, a dock/undock state machine, a hull-rotation controller (the robot has to keep driving while orbiting, so the orbit comes from the discs' own motors plus a slow hull spin, like Gyro's shell but on ropes). **L.** OP risk: **high** (this is the one most likely to end up legendary); mechanical nerfs: one disc instead of two, shorter tethers, longer re-deploy time.

### 3.3 TREBUCHET, the throwing arm (combination: scoop + launch)
**Mechanism.** Low forks (the lifter's slide-under code) scoop the enemy; when it sits halfway up the forks the frame **locks** (weld, 0.5 s charge with strobing lamps), then a counterweighted throwing arm on a revolute joint with a big one-shot motor pulse swings 150 degrees and **launches** the enemy ballistically: 1.8-2.6 m of flight with real height (the drum's air-time code), landing with an overhead impulse on whatever it lands on, usually itself. Landing rolls the on-side / upside-down dice with a heavy bias. 6 throws of gas per fight, like the flipper's 12 shots.
**Why it is a level up.** It is the flipper's and the forklift's end-game: a full carry and launch instead of a kick. Robots that cannot self-right (Ramrod, Forklift, Sawblast) are often done after one throw; a wall landing adds the wall slam credit; a landing on the enemy's own lid is an overhead hit. Open-floor friendly: it does not need a pit.
**Weaknesses.** Weight: robots above 1.35x its weight only get tipped (so a huge-chassis enemy, e.g. another level 4, is nearly immune: built-in rock-paper-scissors inside the level). Round shells (Whaler) roll back onto their wheels. Vertigo works upside down. Spinners knock the forks away before the scoop, as they do the lifter's. Only 6 throws.
**Light show.** Amber strobe on the arm during the charge (the tell), white flash at release, a flying shadow that grows and a "AIRMAIL!" callout, landing dust ring.
**Build.** Lifter carry code + flipper gas + a revolute arm with a pulse motor + ballistic flight (drum kick has height already) + landing damage with the overhead flag. **M.** OP risk: medium; nerfs: throws per fight, charge time, weight limit.

### 3.4 CORKSCREW, the boring drill (anchor and spin)
**Mechanism.** A heavy auger on a prismatic rail (the battering ram's rail) that spins (revolute motor). On contact it bites: first it grinds (sparks, buzzsaw-style damage), then after 0.8 s of continuous contact on a chassis or plate it **anchors** (weld, like the crusher's grab) and keeps driving its spin motor into the victim, which now **rotates around the drill axis** with its front wheels lifted off the floor (no grip on the lifted side; the carry code's grip removal). The robot is pinned and turned like a rotisserie while the auger goes deeper: damage walks inward from the plate to the chassis to the internals ("DRILLED!" → "CORED!" when it reaches a battery or radio). 2.2 s, then it withdraws (rail retracts) and needs 3 s to clear the swarf.
**Why it is a level up.** It converts a plain frontal contact, which every pusher gets, into a pin plus internal damage that bypasses the 55%-to-internals rule by going through the hole it made. Against heavy boxes with thick plates (Ramrod, Forklift) the pin matters more than the plate. It does not depend on hazards or on the enemy being light.
**Weaknesses.** Spinning weapons knock the auger off line before it bites (bar, shell, vertical disc); a jammed auger (snag code, 50% chance when it meets a spinner) stalls dead. Rubber bumpers resist the bite (sharp x1.5 would make it worse, so rubber counts as "no anchor, grinding only"). Hit-and-run kiters never give it the 0.8 s of contact. A harpoon fling breaks the anchor and wrenches the auger.
**Light show.** A row of lamps on the rail that fills as the auger goes deeper (state lamp, green→red), swarf particles, the pinned victim's lamps flicker.
**Build.** Battering-ram rail + buzzsaw spin + crusher weld + lifter grip removal + a depth counter that walks damage inward. **M.** OP risk: medium-low; nerfs: bite time, anchor duration, swarf cooldown.

### 3.5 TARANTULA, the walker with the pounce (new drive + smart timing)
**Mechanism.** A legged drive: six short legs (fixtures with a gait controller that applies the drive force only while a leg is "planted", alternating tripods), so it moves on any surface including oil and shows no wheels to shoot off. Legs are lost one at a time (each leg is a part), and it keeps walking, slower, down to two legs. Mobility is omni-like (can sidestep while facing the enemy) at a lower top speed than wheels. The weapon is a pair of **fangs**: a crusher-type grab that also injects heat (battery fire chance), the venom. The brain is the point: the Tactician chip (2.3) makes it a **stalker**. It keeps 1.6 m away, circles against the enemy's turning direction, and **pounces** (overboost-style dash) only in the enemy's weak moment: spin fraction below 40%, flipper out of gas, harpoon reloading, ram extended, forks lifting someone else, a module on cooldown, or the enemy on its side. If no window opens for 6 s it feints a charge to provoke a swing or a shot, then goes in behind it.
**Why it is a level up.** "No drive for 6 s" and the crippled count-out are the top KO causes in the lab (about half of all endings). A walker has no wheels and no drive motors to lose, so those KOs barely exist for it: that alone is worth a level against saw and spear robots. The timing chip then turns every level-3 weapon's downtime into Tarantula's attack window.
**Weaknesses.** Slow top speed: Ramrod's charge still lands if Tarantula mistimes; a Trebuchet throw on its back is fatal (legs in the air, no self-right unless it keeps three legs on one side); EMP freezes the gait; chip glitch / lid off / BRAIN FRIED makes it dumb, which on a brains robot is a bigger loss than on anyone else. Flamethrowers and lasers cook the legs' thin joints.
**Light show.** Eight eye-LEDs in two rows that blink in a scanning pattern while it stalks, go solid red 0.4 s before the pounce (the tell), and fall dark when the chip is hit. Leg tips spark on hard floor.
**Build.** New `DRIVES.legs` (gait: per-leg contact timer, force only when planted, leg loss, side-step), crusher grab + a heat injection, Tactician chip with the pounce rule set. **L** (the drive is the new thing). OP risk: medium; nerfs: pounce cooldown, pounce speed, the 6 s feint timer.

### 3.6 GRANDMASTER, the robot that picks its weapon (super smart decision robot)
**Mechanism.** A carousel turret (revolute joint, indexed 120 degrees) carrying three small tools: a wedge plate, a short axe and a saw. At the start of the fight and every 6 s afterwards the Tactician chip reads the enemy and the state and **indexes the tool that counters it**: wedge against spinners, drums and rams (deflects, gets under, uses their energy), axe against anything with a lid, especially a loose one (overhead), saw against exposed chips, drones, and anything crippled. The carousel click takes 0.7 s, during which the robot backs off. The chip also uses the arena: it **baits** the enemy onto the ceiling-hammer circle and the floor-bumper circles during their countdown, steers clear of closing walls, denies crates when the enemy is closer, and dodges rockets with the zigzag juke.
**Why it is a level up.** Chip fit is the biggest single lever found in the lab (+12 to +20 win points with the right chip, -11 to -20 with the wrong one). Grandmaster carries the right chip for every matchup, plus arena awareness nobody else has. Each individual tool is small and would be level 1 on its own.
**Weaknesses.** Everything it has is small: no single hit is big, so against a robot that has no bad matchup with any of the three tools (Whaler at range, or Gyro's shell) it is just a mediocre robot. The 0.7 s carousel window is a free shove. A jammer drone (module blocked, turret at 45%) halves its brain. Lid off → chip hit → it keeps the wrong tool (REBOOTING freezes the carousel): one hit on the chip turns the best brain into the worst.
**Light show.** A ring of lamps around the carousel; the selected tool's lamp burns steady, the other two pulse; a "THINKING…" tell (a small chess-knight icon) for 0.3 s when it re-plans; a victory flourish (lamps chase) when the bait lands ("BAITED!").
**Build.** Carousel joint with three existing weapon bodies attached at 120 degrees (reuse wedge, hammer and buzzsaw code; only the front one is "active"), Tactician chip with a matchup table and the arena rules. **L** (mostly AI). OP risk: **hard to predict**: the arena-baiting alone could be huge in killbox arenas and worth little on open floor; measure both. Nerf levers: re-plan interval, carousel time, tool count (two instead of three).

### 3.7 LODESTONE, the electromagnet (material rock-paper-scissors)
**Mechanism.** A big coil in the nose. Within 1.4 m it applies a pull force to **steel** bodies in its cone: steel-bumpered robots, loose steel debris, torn-off plates, wheels, saw discs, bullets in flight. It has three moves on a 7 s cycle: **PULL** (3 s, reels the enemy in and drags its front wheels, like the grappling hook but continuous, and collects a cloud of debris orbiting the coil), **CLAMP** (steel enemy stuck to the coil for 1.2 s, enough to turn it and push it, no damage), **REPULSE** (polarity flip: everything in the cloud is flung outward as shrapnel, 0.25 sharpness each, and the clamped enemy is shoved away with a jolt that rolls the lid-rattle dice). A docked drum (small) does the actual damage while the enemy is clamped.
**Why it is a level up.** Every level-3 robot wears steel. Against steel it controls range completely: pushers can't push, Whaler's harpoon is pulled off line, Vertigo's disc eats the debris cloud and spins down. The REPULSE shrapnel is free damage made of the enemy's own parts.
**Weaknesses.** Pure material rock-paper-scissors: **rubber** (Haymaker, Brawler) and **fibreglass** (Jouster) are immune to the pull and the clamp, and spring bumpers bounce out of the clamp; the magnet is just a weak drum robot against them. This means a level-0 Haymaker has a real chance against it, which is wonderful for the table and must be documented, not fixed. Aluminium? not a material yet; leave it. The coil is an internal part: a hit on the nose can kill it (module-offline path).
**Light show.** Coil rings pulse blue during PULL, lock white on CLAMP, flash red on REPULSE; debris cloud sparkles; field-line arcs to the enemy's plates.
**Build.** A force field in the step loop (like oil puddles, but a pull on steel fixtures within a cone), a clamp weld with a timer, a shrapnel fling (apply impulses to debris bodies, give them sharpness for 1 s), the grappling-hook wheel-drag. **M.** OP risk: medium vs steel, zero vs rubber; measured on the lineup it will show a strange profile (strong vs 3, weak vs some level 0s). That is the design.

### 3.8 ANGLER, the hook that feeds the drum (multi-levered arm + combination weapon)
**Mechanism.** A two-segment pantograph arm (chain helper, folded flat on one flank at rest) with a barbed hook at the end. On a target within 1.5 m the pantograph **snaps out sideways and round** (0.2 s), hooks behind the enemy's rear plate or a wheel (weld on contact with a rear-arc fixture), and **drags the enemy backwards** toward the robot's chest, where a drum (the Juggernaut drum, slower) chews the back of the victim, the side with the least armour and the exposed wheels. The hook releases after 2 s or when the arm takes a hit; the pantograph folds back.
**Why it is a level up.** It is the flanker chip done in steel: it hits the back without having to get round the enemy (the flanker chip gave +27 on a spinner and 46% back/side damage on a spear; the robot gets the back hits without the kiting trade-off). Combination weapon, bigger frame, Kev's second-weapon idea. Open-floor friendly.
**Weaknesses.** The arm is a long lever for 0.2 s and a target for 2 s: spinners and Vertigo take the hook off (segment loss); a robot that turns fast (omni, light 2wd) shows no rear; Trebuchet throws it while it is holding on and the hook rips the Angler's own flank plate off ("SELF-HOOKED!"). Whaler reels it in before the pantograph reaches. The drum needs spin-up: a hook before the drum is up is wasted.
**Light show.** Chase lights down the pantograph on the snap, a green hook lamp when it bites, the drum's rim glows by spin, "GAFFED!" callout.
**Build.** Chain helper (2 segments, high torque, sideways deploy pose), hook weld on rear-arc fixtures (the rear arc is known: the flanker chip's side/back tracking), the drum code with a mount offset, drag controller (reverse the drive while hooked). **M.** OP risk: medium-high (back hits plus drum); nerfs: hook hold time, drum size, re-deploy time.

### Coverage check against the brief
Multi-levered arms: Hydra, Angler. Multi-jointed sweeper: Hydra (turret + chain). Flying circular blades that retract: Orbiter. Combinations: Trebuchet (scoop + launch), Corkscrew (grind + anchor + spin), Angler (hook + drum), Lodestone (pull + clamp + repulse + drum). Super smart decisions: Grandmaster, Tarantula (both on the shared Tactician API), Orbiter's retract. Other things: a legged drive, material rock-paper-scissors, a drill. Every robot has a readable **tell** in its lamps and at least one level-3 robot that beats it.

## 4. Build order and budget

Shared first, then the robots in order of confidence and reuse. Each robot is a branch `claude/l4-<name>` off `main`, merged when it passes section 6.

| Step | What | Reuses | Size |
|---|---|---|---|
| 0 | Shared: chain helper, tether helper, Tactician reader, lamps, huge chassis, overhead flag | tail, harpoon rope, hammer, drum height | M |
| 1 | **Corkscrew** | ram rail, buzzsaw, crusher weld, lifter grip | M |
| 2 | **Hydra** | chain, turret, overhead | M |
| 3 | **Trebuchet** | lifter carry, flipper gas, drum air time | M |
| 4 | **Angler** | chain, drum, flanker rear arc | M |
| 5 | **Lodestone** | oil-puddle field loop, grapple drag, debris | M |
| 6 | **Orbiter** | tether x2, buzzsaw bodies, Gyro hull spin | L |
| 7 | **Tarantula** | crusher, boost dash, Tactician | L (legs) |
| 8 | **Grandmaster** | wedge/hammer/buzzsaw bodies, zigzag juke, Tactician | L (AI) |

Four robots (steps 1-4) are the minimum deliverable the brief asks for and all reuse existing weapon code; steps 5-8 are where the wild ones live. If time is short, ship 1-4 plus Orbiter and put Tarantula and Grandmaster in the reserve list.

Per robot, a rough budget: engine 150-400 lines, renderer 60-150 lines, a preset in `PRESETS` (`trial: true` until it passes), a row in `lineup.js` `ROBOTS` with level 4 and its fitted p, test script run, a paragraph in `docs/robocus-2.0-lineup.md`, a PROGRESS log line.

## 5. Legendary bin and reserves

**Legendary robots** (if a design is too strong at p = 1.0 and the mechanical nerfs kill the fun): one copy per game, announced a round ahead like the legendary parts, bigger price. Orbiter is the most likely candidate; Grandmaster if arena baiting turns out dominant. A legendary robot should still have the ≥ 10% worst-matchup rule.

**Legendary part, Tactician chip**: if the Tactician API on its own is worth more than a level on ordinary robots (test: Hornet, Whirlwind, Ramrod with the chip vs their next level), it becomes the fourth legendary part card instead of being baked into two robots only. Measure it (section 6) before deciding.

**Reserve designs** (not planned, written down so they are not lost):
- **GEMINI**, the splitting robot: a weld between two half-robots (wedge half + saw half) on a short chain; it splits on contact, flanks from both sides, the chain trips the enemy, and rejoins to share armour when one half is hurt. Needs the engine to accept two bodies per robot for KOs and judges. Legendary by nature. **XL.**
- **TESLA**, the arc bumper: the robot is the weapon: an electrified spiked hull that arcs on contact through armour into internals (radio, chip) and splashes to drones; rubber and fibreglass bumpers insulate. Non-mechanical, so it is last in line, but the material rock-paper-scissors and the lamp show (coil discharges) are strong. **M.**
- **WINDMILL**, a four-blade multi-jointed sweeper: four sweeper axes on a slow central ring, each on its own hinge, that fold back when hit and spring forward again. A sweeper that can't be levered. **M.** (Could replace Hydra if the strike arm disappoints.)

## 6. Test protocol (every robot, before it leaves `trial`)

1. **Normalise, then freeze.** `node causes.js` / `why.js` on 20 fights vs Juggernaut: set the weapon `dmgK` so its mean damage per hit sits in the bar-spinner to drum band. Write the value in the preset and don't touch it again.
2. **Level test.** A `tools/damage-lab/l4.js` modelled on `newweap.js`: the robot at p = 1.0 vs the five level-3 robots and the five level-2 robots, 70 fights each, fresh seeds (10xxx range), sides swapped. Report win %, median length, big moments / min, parts per fight, first hit, KO causes, worst matchup. Pass: section 1 targets. Then `tiers.js scan` to fit p; p must land in 0.9-1.15.
3. **Lineup round robin.** `tiers.js verify` with the robot added at level 4: level-vs-level table must read L4 vs L3 ≈ 60%, vs L2 ≈ 77%, vs L1 ≈ 90%, vs L0 ≥ 95% is fine.
4. **Parts and legendaries.** `parts2.js` with the level-3 robots carrying one part vs the level-4 robot: a part should still close the level (≈ 50%), Prototype core two.
5. **Team formats.** `multi.js ffa` and `2v2` with one level-4 robot in random lineups: no single robot above 45% in FFA.
6. **Determinism and no-regression.** Same seed, same fight; and every existing 1v1 (`node test.js open` round robin on a fixed seed list) bit-identical before and after the engine change (the lab's standing rule; the shared helpers must not change existing robots' fights).
7. **Watch it.** 10 fights in the Lineup Arena with the lamps on; if the tell isn't readable or the mechanism doesn't read as what it is, fix the visuals before tuning numbers.
8. **Phone budget.** Particle and glow count within the current caps; step time still under 0.1 ms average.

Record the numbers in `docs/robocus-2.0-lineup.md` (a new "Level 4" section with the same table columns as levels 1-3) and the knobs that were tried and rejected, as the lab docs do now.

## 7. Game integration (for the tabletop 2.0 page, later, Kev's decisions)

Not part of this build, but the robots should be designed with it in mind:
- **Entry wave:** level 4 lots appear from round 7 (after the level-3 wave, rounds 5-6), 1 copy each, and only 3-4 of the 8 are dealt per game, drawn at random, so games differ and nobody can plan for a specific one. Announced a round ahead like legendary parts.
- **Price and upkeep:** at least a level-3 price plus the legendary mark-up; a huge chassis could cost 2 upkeep instead of 1 (the frame is the tax).
- **Repairs:** new part classes map onto the three repair zones: legs, tethers and carousel → Drive / Weapon / Weapon; the Lodestone coil → Weapon; docked Orbiter discs heal with Body.
- **Robot card:** four stars pressed into the lid (the level-star code in `ui.js`), plus a one-line tell ("strobe = it is about to throw").
- **Live cards (when they come):** EMP the Garage against a Tactician robot is a real counter (chip glitch); a Smudged Lens on Grandmaster is funny and fair.

## 8. Risks and things Opus should flag early

- **Determinism:** every helper must use `S.rng()` and fixed-step logic; no `Math.random`, no wall-clock. Joint-driven controllers are deterministic per JS engine, like the existing ones.
- **Box2D stability:** chains of light segments with high motor torque can jitter or explode; use the tail's mass ratios (no segment lighter than 1/10 of its parent) and `maxMotorTorque` well below what tears the joint; prismatic limits as on the ram.
- **Pile-ups:** Orbiter's two extra bodies plus debris plus drones can push the worst single step above the current 14 ms; cap live debris in that fight.
- **Hazard dependence:** nothing in this list needs a pit or a saw to win on open floor; keep it that way (Whaler's 25% lesson).
- **Sim vs eye:** a mechanism can score well and look wrong (the first forklift did not visibly go under). Watch every new robot before measuring it.
- **The Tactician API makes the AI strictly stronger** wherever it is used; keep it to the two robots (and the possible legendary part) and keep the 0.5 s latency, or the level ladder below will shift.
- **PROGRESS.md on `main` currently contains an unresolved merge marker** (`<<<<<<< HEAD` just under "## Log"); clean it up in the first commit.
