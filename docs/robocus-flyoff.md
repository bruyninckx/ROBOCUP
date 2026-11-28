# ROBOCUS next gen: parts that fly off (T67 step 1, T68 step 2, T69 step 3)

Kev, 28 Nov 2026: "a new damage model that has more unique parts flying off from the robots depending on how the robot
looks, the shell can come off from gyro which is nice, we need more like this, some tops that come off easily and expose a
unique robot design". And: "keep in mind this is a test phase for next gen, not for current gen".

He voted "Build it" on 15 robots and Yes on three rules: (1) what comes off stays on the floor as a real object for the rest
of the fight; (2) every lost piece changes how the robot fights, never only looks; (3) it shows on the robot card afterwards
until repaired. Step 1 did rules 1 and 2 for three robots (Buzzkill, Popcorn, Bricklayer); step 2 (28 Nov, T68) adds six more: Gyro, Railgun,
Scavenger, Grandmaster, Whaler, Jukebox; step 3 (28 Nov, T69) adds the last six of the first 15: Pogo, Blacksmith, Lodestone,
Hornet, Tarantula, Hydra. Fifteen robots now. Rule 3 is a later step.

**Not in the game.** One switch, off by default. With it off, every fight is exactly as before (checked: stock-fight
fingerprint 470f6923 and sync check 89a95280 unchanged, the game page plays 2 of 2 test games with 0 errors; step 3: the six robots'
own fights are bit-identical to `nextgen` before the change, 64 fights each).

## Try it

`prototypes/flyoff-lab.html` (double-click; needs internet for planck.js). Pick one of the fifteen robots and an
opponent, tick or untick "Parts fly off", then "Watch the fight" (same seed = same fight) or "Run 40 seeds" for quick
numbers. The two pictures show the robot as it comes and without its piece.

## Step 1: three robots

| Robot | What comes off | What is left | How it fights after |
|---|---|---|---|
| Buzzkill | half of the spinning bar: first it bends at the hub, then it snaps | a short half bar | spins 1.5x faster, reaches half as far: quicker, smaller hits |
| Popcorn | the yellow teeth plate | a thin bare steel flipper | flips 38% weaker, and every flip bends the bare flipper a bit more (each bend takes about 6% off the next flip, down to about a third of a full flip) |
| Bricklayer | the brick stack topples | an empty crane | the iron blocks on its back break into small bricks that lie around for everyone; the crane drops and lifts nothing any more; it shoves with its dozer blade |

The piece on the floor is a real object: robots bump into it, push it and get pushed onto it. Like all loose junk it barely
hurts anyone. Pictures: `/home/claude/out/t67-*.png` (before / after in the fight view, the arena, the two portraits).

## Step 1 numbers (28 Nov, open floor, wear on as in the game)

Each robot against all 32 other robots of the tuned lineup, 8 seeds each, sides swapped every other seed: **256 fights with the
switch on and the same 256 fights with it off** (`node tools/damage-lab/flyoff.js <robot> 8`, report with
`node tools/damage-lab/flyoff.js report <files>`). "±" is a 95% range.

| | Buzzkill | Popcorn | Bricklayer |
|---|---|---|---|
| piece comes off | 116 of 256 = 45% (±6) | 167 of 256 = 65% (±6) | 121 of 256 = 47% (±6) |
| when (median) | 28 s | 12 s | 14 s |
| fights where robots touched the loose piece | 116 of 116 | 166 of 167 | 121 of 121 |
| contacts with the loose piece(s), a fight | 17 (6 by the other robot) | 18 (10 by the other robot) | 105 (49 by the other robot; 6 to 9 small bricks) |
| win rate vs the field, switch off | 29.7% | 21.1% | 75.8% |
| win rate vs the field, switch on | 30.1% | 19.1% | 56.6% |
| difference (same fights) | +0.4 ± 4.0 | -2.0 ± 3.5 | **-19.1 ± 5.2** |

How the robot fights without its piece: the same robot starting a fight without its piece (`spec.flyoffGone`), against the
whole field, 4 seeds each (128 fights each way, same seeds):

- Buzzkill: spinner hits 0.66 a second -> 0.90 (+36%), 6.7 damage a hit -> 5.3 (-21%), damage a second 4.4 -> 4.8. Quick
  small hits instead of big ones, as on the voting page. Wins 44 of 128 with the full bar, 31 of 128 with the half bar.
- Popcorn: landings that hurt 0.26 a second -> 0.13, 9.8 damage a landing -> 6.5. Wins 28 of 128 with the plate, 7 of 128
  bare. In real fights the plate comes off on average after 12 s and the bare flipper then flips 1 or 2 more times (gas runs
  out), so the bend gets to about 0.1 of its 0.5 maximum.
- Bricklayer: block drops on the enemy 0.33 a second (15.9 damage a hit) before the stack topples, about none after; dozer
  blade shoves go up from 0.17 to 0.55 a second.

So: Buzzkill and Popcorn lose very little when it happens in a fight (it happens late enough); Bricklayer loses its weapon
and drops from 76% to 57% against the field. Starting a fight without the piece (what rule 3 would do if it is not repaired)
costs much more: Buzzkill about 10 points, Popcorn about 16.

Re-run on 28 Nov after step 2 (same command, same seeds): Buzzkill 44% off, +1.2 ± 4.1; Popcorn 64%, -2.0 ± 3.5; Bricklayer 46%,
-16.8 ± 5.5 (was 45 / 65 / 47% and +0.4 / -2.0 / -19.1). The three robots work exactly as before (checked fight by fight); the
numbers move a little only because some of their opponents (Gyro, Jukebox, ...) now lose their own piece too when the switch is on.

## Step 2: six more robots (T68)

| Robot | What comes off (lies on the floor) | What is left | How it fights after |
|---|---|---|---|
| Gyro | the grey shell (a big bump on the floor) | a bare gold flywheel on its blue base | lighter (flywheel 5 kg, shell 11) and spun 1.35x faster, but smaller, no teeth and out of true (it wobbles): soft hits |
| Railgun | the clamp that holds the rails together | two rails peeled apart | still fires, but wide: up to 0.3 rad (17°) off its aim, at random; it can miss, or hit something else |
| Scavenger | the hopper cracks open; all its junk pours out behind it in one pile; a shard of hopper glass | an open, cracked hopper | starts collecting from zero; its own lost junk can't be sucked up again (it is a rough patch for both) |
| Grandmaster | the yellow hat | its "brain": a wheel of six tools round a red "?" | stops choosing: every time it may change tool (every 6 s) it grabs one at random |
| Whaler | a strip of the hull seam: the hull splits down the middle | the winch drum and the rope show in the gap | the harpoon still fires, the winch reels in at half speed, and a spinning weapon or a saw across the bare rope cuts it |
| Jukebox | the record crate tips over; the records still in it slide out onto the floor | no crate; the loader arm is bent | it reaches 0.25 m instead of 0.7 m, so it has to drive right up to a record on the floor before it can throw again |

Pictures (fight view, just before and 2.5 s after): `/home/claude/out/t68-<robot>-before.png`, `-after.png`, the whole arena
`-arena.png`, the two portraits `-portraits.png` (`node tools/flyoff-shots.js /home/claude/out t68`).

Gyro's shell could already come loose before (when its HP ran out). With the switch on, that is now this mechanism: the shell comes
off when its pool runs out or its HP does, and Gyro keeps fighting with the flywheel. With the switch off nothing changed.

Jukebox: its stack of four records is empty after 3 to 9 s in most fights (it throws them and then fetches them from the floor
anyway), so a crate that only spilled records would change almost nothing. That is why the crate tipping also bends the loader arm
(short reach): a lasting change, as rule 2 asks. This is my choice; see question 11.

### Step 2 numbers (28 Nov, open floor, wear on)

Same method as step 1: each robot against all 32 others, 8 seeds each, sides swapped every other seed, **256 fights with the switch
on and the same 256 with it off**. "±" is a 95% range.

| | Gyro | Railgun | Scavenger | Grandmaster | Whaler | Jukebox |
|---|---|---|---|---|---|---|
| piece comes off | 158 of 256 = 62% (±6) | 83 = 32% (±6) | 118 = 46% (±6) | 116 = 45% (±6) | 103 = 40% (±6) | 87 = 34% (±6) |
| when (median) | 39 s | 21 s | 33 s | 31 s | 43 s | 28 s |
| fights where robots touched the loose piece | 158 of 158 | 83 of 83 | 118 of 118 | 116 of 116 | 103 of 103 | 87 of 87 |
| contacts with the loose piece(s), a fight | 17 (4 by the other robot) | 13 (5) | 55 (22; the junk pile) | 11 (4) | 11 (5) | 17 (6) |
| win rate vs the field, switch off | 53.5% | 73.8% | 67.2% | 61.7% | 52.0% | 80.1% |
| win rate vs the field, switch on | 49.6% | 72.7% | 62.9% | 63.7% | 52.7% | 77.7% |
| difference (same fights) | -3.9 ± 4.8 | -1.2 ± 4.0 | -4.3 ± 4.0 | +2.0 ± 3.7 | +0.8 ± 2.7 | -2.3 ± 3.9 |

What happened in those fights after the piece came off: Gyro's shell hits 1.18 a second, 5.2 damage each -> 0.66 a second, 2.3
each. Railgun fired 150 wide shots; slug hits 0.16 -> 0.09 a second. Scavenger poured out 372 pieces of junk (3.2 a fight); junk
hits 0.27 -> 0.12 a second. Grandmaster made 723 blind picks (6 a fight). Whaler's rope was cut 42 times, in 13 of 103 fights.
Jukebox spilled records in only 7 of 87 fights (the stack is usually empty by then); record hits 1.13 -> 0.41 a second.

How the robot fights without its piece: the same robot starting the fight without it (`spec.flyoffGone`) against the same robot
keeping it (`spec.flyoffKeep`, the switch off, hits counted), the whole field, 4 seeds each: **128 fights each way, same seeds**
(`node tools/damage-lab/flyoff.js gone <robot> 4`, report with `flyoff.js gonereport <files>`).

| | wins keeping it | wins without it | the change |
|---|---|---|---|
| Gyro | 69 of 128 | 8 of 128 | flywheel hits 1.00 -> 0.57 a second, 5.4 -> 2.7 damage a hit (damage a second 5.4 -> 1.6) |
| Railgun | 93 | 91 | slugs fired 6.5 -> 5.2 a minute, hits 6.1 -> 4.6 a minute (it still hits big: 45 a hit) |
| Scavenger | 83 | 24 | it fires 10.3 -> 2.4 times a minute: an empty hopper at the start (no starter junk) is a long time without ammo |
| Grandmaster | 77 | 89 | **better without its brain**: random tools beat its own choice (axe and landing hits up, saw down) |
| Whaler | 72 | 59 | harpoon hits about the same (0.21 -> 0.20 a second); the rope is cut 0.5 times a minute |
| Jukebox | 101 | 27 | throws 10.1 -> 2.5 a minute, record hits 1.19 -> 0.51 a second: the short loader arm is a big handicap |

So: in a fight, losing the piece costs these six between nothing and 4 points against the field (it happens late enough). Starting
without it (rule 3, if not repaired) is very hard on Gyro, Scavenger and Jukebox, mild on Whaler, nothing for Railgun, and Grandmaster
gets **better** (its brain picks worse than chance against this field: a finding about the brain itself, not only about the hat).

## How it works (engine, `tools/damage-lab/engine.js`, section "PARTS THAT FLY OFF")

- Switch: `ARC.flyoff` (default `false`) or the fight option `flyoff: true / false`. Read once when the fight is built
  (`S.fo`), so it travels with the fight's options and every screen plays the same fight. Seeded RNG only.
- `FLYOFF` is a table by robot name. Each entry has a damage pool. Every hit on one of the robot's parts drains it by the
  damage times `feed(R, part, h, d)` (which parts count, and how much). At `warn` (share of the pool gone) `bend()` shows the
  piece going. At 0, or when the part it sits on would break (`watch`), `pop()` runs: it makes the floor pieces (real bodies,
  never cleaned up during the fight) and changes the robot. The pool is multiplied by the robot's power dial.
- Pieces count their touches (own robot / other robots). The robot counts its hits before and after (`R.fo.dealt`).
- `spec.flyoffGone: true`: the robot starts without its piece (changed behaviour, nothing on the floor; Jukebox's records still lie
  round it, it needs them). Works with the switch off too; it is what the robot card and garage would use for rule 3. Nothing in the
  game sets it. `spec.flyoffKeep: true` (T68, for measuring): the piece never comes off, but hits are counted as with the switch on.
- Step 2 helpers: `foPart` swaps a new part in (Gyro's flywheel on a new joint), `foRopeCut` (Whaler). Small hooks where the robots
  fight, each only active once the piece is off: Railgun's spread (`R.foSpread`), Grandmaster's blind pick (`R.foRandom`), Whaler's
  winch (`R.foReel`, `R.foCut`), Jukebox's reach (`R.foReach`), Scavenger's lost junk (`d.foLost`).
- Drawing: `src2/view.js` (`drawFoPiece`, bare flipper, leaning stack; step 2: `drawFlywheel`, `drawFoRobot` (Whaler's split
  hull), `drawHat`, `drawBrain`, `drawCrate`, peeled rails, cracked hopper). The half bar is drawn from its new shape.

### Add the next robot (a few lines)

```js
// in FLYOFF (engine.js), then python3 tools/damage-lab/build.py
Grandmaster: { weapon: 'carousel', label: 'Hat', pool: 60, warn: 0.5,
  feed: (R, q, h) => h.top ? 1 : q.kind === 'chassis' ? 0.3 : 0,            // which hits count
  bend(S, R) { /* optional: show it going */ },
  pop(S, R, h, floor) {                                                      // floor false = spec.flyoffGone (no piece)
    const pc = floor ? spawnLoose(S, R, 'Hat', verts, [x, y], 3, [kx, ky]) : null;   // the floor piece
    if (pc) pc.foShape = 'hat';                                              // draw it in view.js drawFoPiece
    R.randomTool = true;                                                     // and read this where the robot fights
    return pc ? [pc] : [];
  } },
```

Then tune the pool so the piece comes off in about a third to two thirds of fights (`flyoff.js`), and add the look to
`drawFoPiece` in `src2/view.js`.

## Step 3: the last six (T69)

| Robot | What comes off (lies on the floor) | What is left | How it fights after | What the loose piece / the exposed part does |
|---|---|---|---|---|
| Pogo | the round casing over its spring, in two halves; the gold spring uncoils across the floor | an empty socket, a stub of spring | it can't jump any more: it drives in and shoves with its skid plate | the spring bounces whoever drives into it (its own robot too): a small shove and 0.3 s off the floor, at most once every 1.2 s per robot |
| Blacksmith | the dark hood | a glowing forge on its back | the forge overheats: after about 12 s of work it stops hammering (and lets go) for 3 s | whoever touches Blacksmith gets burnt: 5 damage a second on the part that touches (and some heat), for as long as it touches |
| Lodestone | the copper coil unwinds | a thin bare magnet core | it pulls half as hard (robots and loose steel) | the loose wire tangles the tracks or wheels on that side of whoever drives into it, its own too: 1.2 s (same effect as a bola), at most once every 2.5 s per robot |
| Hornet | the spear tip breaks off | a blunt stump (sharpness 0.3 instead of 3.2) | it can only shove (it still lunges) | if the tip broke off in the other robot it stays stuck there and stings its hull: 0.6 every 0.5 s for the rest of the fight; otherwise it lies on the floor |
| Tarantula | up to three legs, one at a time, all on the side that takes the hits | sparking stumps | one gone: it limps (a lame gait, 90% top speed); two (one side): it turns in circles; three: that side drags (60% top speed) | the legs are plain junk on the floor |
| Hydra | its two side heads, one by one | sparking stumps | fewer heads, fewer bites: the strike arm waits 1.4 times as long between strikes with one gone, twice as long with both | a stump zaps whoever touches it: 2 damage and 0.15 s stunned, at most once every 2 s per stump |

Hydra's middle head is its strike arm (the one it always had); the two side heads are new (drawn on short necks at the front corners, as
in the sketch). With the switch off it has no side heads and nothing changes. Hornet's tip wears both from hits on the spear and from the
hits it deals with it (a third of them), so it breaks on a hard target. Tarantula's first lost leg picks the side (the side of the hit);
the next legs go on the same side: front, rear, middle. Pogo already in the air when the casing bursts still lands its jump.

Pictures (fight view, just before and 2.5 s after; Tarantula and Hydra after their second piece): `/home/claude/out/t69-<robot>-before.png`,
`-after.png`, `-arena.png`, `-portraits.png`, and all 15 robots with and without their piece on one sheet: `/home/claude/out/t69-portraits-all.png`
(`node tools/flyoff-shots.js /home/claude/out t69`, `... t69 sheet`).

### Step 3 numbers (28 Nov, open floor, wear on)

Same method: each robot against all 32 others, 8 seeds each, sides swapped every other seed, **256 fights with the switch on and the same
256 with it off** (`node tools/damage-lab/flyoff.js <robot> 8`, `flyoff.js report <files>`). "±" is a 95% range.

| | Pogo | Blacksmith | Lodestone | Hornet | Tarantula | Hydra |
|---|---|---|---|---|---|---|
| a piece comes off | 125 of 256 = 49% (±6) | 111 = 43% (±6) | 123 = 48% (±6) | 128 = 50% (±6) | 158 = 62% (±6) | 156 = 61% (±6) |
| when (median, first piece) | 12 s | 30 s | 19 s | 22 s | 22 s | 30 s |
| pieces a fight | 1 (casing + spring) | 1 | 1 | 1 | 0: 98, 1: 78, 2: 42, 3: 38 fights (1.75 where any came off) | 0: 100, 1: 124, 2: 32 fights (1.21 where any came off) |
| fights where robots touched the loose piece(s) | 125 of 125 | 111 of 111 | 122 of 123 | 17 of 128 (the tip was stuck in the other robot in 106) | 156 of 158 | 156 of 156 |
| contacts with the loose piece(s), a fight | 32 (14 by the other robot) | 10 (4) | 22 (10) | 1 (0.5) | 26 (13) | 21 (8) |
| the effect, in the fights where it came off | 2.8 bounces a fight (1.2 the other robot, 1.6 itself) | burns 11 s a fight; overheats 1.5 times a fight | 4.4 tangles a fight (2.0 the other robot, 2.5 itself) | stuck tip: 79 stings a fight (about 47 damage, half of it counted on the hull) | - | 8.3 zaps a fight |
| win rate vs the field, switch off | 76.2% | 43.0% | 75.4% | 16.4% | 71.1% | 60.5% |
| win rate vs the field, switch on | 63.3% | 44.1% | 75.0% | 16.4% | 69.1% | 59.0% |
| difference (same fights) | **-12.9 ± 5.0** | +1.2 ± 3.0 | -0.4 ± 3.5 | 0.0 ± 4.2 | -2.0 ± 6.0 | -1.6 ± 5.5 |

What happened in those fights after the piece came off: Pogo's stomps 0.64 a second (16 damage each) -> 0.01; Hornet's spear hits 2.0 a
second -> 0.02; Hydra's strikes 0.67 -> 0.42 a second; Tarantula's fang bites 1.48 -> 0.83 a second; Blacksmith's hammer 0.48 -> 0.27 a
second (overheat pauses), but each blow is bigger (it holds robots on a hot anvil); Lodestone's drum 1.8 -> 0.35 hits a second (late in fights).

How the robot fights without its piece(s): the same robot starting without them (`spec.flyoffGone`: all pieces) against the same robot keeping
them (`spec.flyoffKeep`), switch off, the whole field, 4 seeds each: **128 fights each way, same seeds** (`flyoff.js gone <robot> 4`,
`flyoff.js gonereport <files>`).

| | wins keeping it | wins without it | the change |
|---|---|---|---|
| Pogo | 97 of 128 | 4 of 128 | no stomps at all (15.4 damage a second -> 0); its shoves do 0.2 damage a second. Fights last 70 s instead of 27 |
| Blacksmith | 56 | 51 | hammer 0.67 -> 0.54 blows a second (the pauses); the forge burns 1.2 damage a second on whoever touches it |
| Lodestone | 95 | 88 | the drum hits as before (1.56 -> 1.50 a second); the weaker pull costs a little |
| Hornet | 19 | 1 | spear 4.4 damage a second -> 0; the stump shoves for 0.4 damage a second |
| Tarantula (three legs gone) | 92 | 39 | fang bites 1.57 -> 0.71 a second (it can't catch anyone) |
| Hydra (both side heads gone) | 67 | 46 | strikes 0.60 -> 0.30 a second |

So in a fight losing the piece costs Pogo a lot (-13 points: without its jump it has no weapon, like Bricklayer without its stack) and the
others between nothing and 2 points. Starting without it (rule 3, if not repaired) is very hard on Pogo and Hornet, hard on Tarantula and
Hydra, mild on Blacksmith and Lodestone.

### The nine earlier robots, re-run (same command, same seeds)

| | piece comes off | difference with the switch on | (step 2 re-run) |
|---|---|---|---|
| Buzzkill | 45% | +3.1 ± 4.6 | 44%, +1.2 |
| Popcorn | 64% | -1.6 ± 3.8 | 64%, -2.0 |
| Bricklayer | 47% | -16.0 ± 5.9 | 46%, -16.8 |
| Gyro | 61% | -2.7 ± 4.9 | 62%, -3.9 |
| Railgun | 32% | 0.0 ± 4.1 | 32%, -1.2 |
| Scavenger | 45% | -3.5 ± 4.1 | 46%, -4.3 |
| Grandmaster | 42% | +3.5 ± 4.1 | 45%, +2.0 |
| Whaler | 39% | +3.1 ± 2.8 | 40%, +0.8 |
| Jukebox | 33% | +0.4 ± 4.3 | 34%, -2.3 |

They work exactly as before (checked: 54 switch-on fights of the nine against six robots without a piece, bit-identical to the step-2
engine). Their numbers move up 1 to 3 points because six more of their opponents now lose a piece too. Within the ranges, nothing changed.

### The whole field: who gains, who loses

The new effects act on the other robot, so here is every robot's win rate against the whole field, switch on minus switch off
(`node tools/damage-lab/flyoff.js field <all the run files>`). Fights between two robots without a piece are the same with the switch on,
so a robot without a piece only moves through its fights against the 15 (8 seeds each, 120 fights); a robot with a piece: its own 256.

The three that move most: **Bricklayer -16.0 ± 5.9**, **Pogo -12.9 ± 5.0**, **Angler +4.7 ± 2.5** (it wins 10 points more of its fights
against the 15). Next: Gaucho +4.3 ± 3.6, Orbiter +4.3 ± 2.4, Grandmaster +3.5, Scavenger -3.5, Rotisserie +3.5. Every robot without a
piece moves between -0.4 and +4.7: the switch makes the field a bit easier for them, never harder.

## How step 3 extends the mechanism (the four new abilities)

- **Several pieces per robot**: `count` in the entry (default 1). `R.fo.n` pieces lost, `R.fo.offs` when, `R.fo.done` when all are gone.
  After a piece the pool refills (`nextK` times the first pool, so later pieces can be harder to lose). `pop(S, R, h, floor, idx)` gets the
  piece number; `pieceLabel(idx)` names it in the log. `spec.flyoffGone: true` starts without all of them, a number starts without that many.
- **Touching a loose piece**: `touch(S, R, piece, part)` runs when a robot part starts touching one of R's loose pieces (begin-contact,
  like the touch counter). Spring and wire keep a per-robot cool-down on the piece (`piece.cd`).
- **A per-step hook**: `tick(S, R)` runs every step for every robot with an entry (`foStep`, after the contacts, before hits are applied;
  only when a robot in the fight has an entry: `S.foAny`). For exposed parts that act on whoever touches them, `foContacts(S, R)` lists the
  other robots' parts touching R's hull this step, with the point (Blacksmith's forge, Hydra's stumps).
- **A piece that sticks in another robot**: `foStick(S, piece, T, point)`: welded to T at that point, no longer collides, drawn over the
  robots; `piece.stuckIn = T`. The owner's `tick` makes it do something (Hornet's tip stings).
- Also new: `dealt(R, d, cause)`: the share of the damage the robot deals that wears its piece (Hornet's tip, `foFedBy`).
- Small hooks where the robots fight, each only set once a piece is off: `R.foNoJump` (Pogo), `R.foPause` (Blacksmith), `R.foPull`
  (Lodestone, and loose wire is not magnetic: `noMag`), `R.foLegs` (Tarantula's drive), `R.foBite` (Hydra's wait between strikes).
  With the switch off they are never set (`x * (R.foPull || 1)` is the same number), and fights stay bit-identical.

## What a 16th robot needs

Everything the voting page asked for now exists. A new robot is one `FLYOFF` entry (as in the example above) plus its look:

1. The entry: which hits feed the pool (`feed`), what comes off (`pop`: `spawnLoose` for a new floor piece, `detach` for a part it has,
   `foPart` to swap a new part in), and how the robot changes (a flag you read where it fights). Optional: `count` for several pieces,
   `touch` if the loose piece does something, `tick` for an exposed part or a lasting effect, `foStick` for a piece that stays in the
   other robot, `dealt` if the piece wears from its own hits.
2. Tune the pool with `flyoff.js <robot> 2 0/1 on` until it comes off in a third to two thirds of fights, then run the full 8 seeds.
3. The look in `src2/view.js`: the piece on the robot (`drawFoRobot`, or where the robot's mechanism is drawn), what is left, and the floor
   piece in `drawFoPiece` (`foShape`). Then the portrait sheet (`flyoff-shots.js ... sheet`) shows it with and without.
4. Check the switch off: `l4-regress.js` fingerprint, the robot's own fights bit-identical, sync check.

## Open questions for Kev

1. **How often.** Now: Buzzkill 45% of fights, Popcorn 65% ("tops that come off easily"), Bricklayer 47%. Right, or more /
   less?
2. **Bricklayer gets much weaker** when its stack topples: 76% -> 57% against the field. Keep it that hard (it becomes a
   pusher), or let the crane still pick up the blocks it already laid on the floor (only the stack on its back breaks)?
3. **Buzzkill's half bar**: 36% more hits, 21% softer each. Starting a fight with the half bar costs it about 10 points
   against the field. Fine?
4. **Popcorn's bare flipper**: 38% weaker flips, and each flip bends it more (about 6% off the next flip, down to a third). In real fights it
   rarely bends far, because the gas runs out. Stronger bending?
5. **Looks**: the iron blocks break into small rust-red bricks (like the sketch). Or keep them grey iron?
6. **Should loose pieces hurt?** Now they are plain junk (they barely hurt anyone, like every loose part). Should a snapped
   bar flying off cut whoever it hits?
7. **For rule 3 (later)**: starting without the piece costs Buzzkill about 10 and Popcorn about 16 points. Should repairs be
   cheap for these, or is that the point?

8. **Gyro without its shell** is weak: starting a fight without it, it wins 8 of 128 instead of 69. In a fight it costs about 4
   points. Make the flywheel stronger, or is that the price of losing the shell?
9. **Grandmaster plays better without its hat** (89 wins of 128 instead of 77): picking tools at random beats its brain against
   this field. Keep it as it is (a funny surprise), make the blind picks worse (e.g. sometimes no tool at all), or look at the
   brain itself?
10. **Railgun's wide shots** cost it almost nothing (-1 point; still 91 of 128 wins without the clamp). Wider (now up to 17°)?
11. **Jukebox's crate**: its records leave the crate within seconds anyway, so I made the crate tipping also bend the loader arm
    (it must drive right up to a record). That costs a lot when it starts without the crate (27 wins of 128 instead of 101). Is that
    the right idea, or should records come back into the crate (and the crate is what lets it reload quickly)?
12. **Whaler's rope** is cut by spinning weapons and saws (about once every two minutes). Should anything sharp cut it?
13. **Scavenger's lost junk** stays a rough patch it can't eat again (same rule as step 1). Or may it suck it back up?

Step 3:

14. **Pogo without its spring has no weapon**: -13 points in a fight, and starting without it it wins 4 of 128 instead of 97. Keep it
    (like Bricklayer), or let it do a small hop or a weak stomp without the casing?
15. **The bouncy spring** bounces Pogo itself more often than the other robot (1.6 against 1.2 times a fight). Stronger bounce, or only
    the other robot?
16. **Blacksmith's forge**: burns 5 damage a second on whoever touches it, overheats every ~12 s for 3 s. In a fight it comes out even
    (+1). Hotter burn, or longer pauses?
17. **Lodestone's weaker pull** costs almost nothing (95 -> 88 wins when it starts without the coil). Should the bare core lose the clamp
    too, or tangle longer than 1.2 s?
18. **Hornet's stuck tip** stays in the other robot for the rest of the fight (about 47 damage over a fight, on its hull). Too much, too
    little, or should it fall out after a while?
19. **Tarantula's legs**: up to three, all on one side. Fine, or should all six be able to go (then it is crippled)?
20. **Hydra's side heads** are new (the sketch has three heads; until now Hydra only had its strike arm). Should they also bite for real
    (not only set how often it strikes)?
21. **The field gets easier** for robots without a piece (up to +4.7 for Angler). Fine for a test, or keep pieces off robots that are
    already weak?

Safest choices made where Kev has not decided: pieces barely hurt (like all junk); rates between a third and two thirds;
Bricklayer's laid blocks stay on the floor but can't be picked up again; the game page is untouched (switch off). Step 2: the rates
are 32% to 62% of fights; Scavenger can't eat its own spilled junk again; Jukebox's records can be fetched (the stated exception);
Grandmaster's blind pick happens at the same moments it would have re-chosen (every 6 s); Railgun's spread is up to 0.3 rad;
Whaler's winch half speed; the look follows the voting-page sketches (`tools/flyoff-page/gen.py` on main). Step 3: rates 43% to 62%;
every touch effect mild (bounce 0.3 s, tangle 1.2 s, burn 5 a second, zap 2 damage and 0.15 s, stuck tip 1.2 a second); pieces can't be put
back; Pogo, Hornet and Tarantula lose what the voting page said (jump, point, legs) even where that costs them a lot.
