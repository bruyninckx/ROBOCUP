# ROBOCUS next gen: parts that fly off (T67 step 1, T68 step 2, T69 step 3, T71a batch A, T71b batch B of all robots)

Kev, 28 Nov 2026: "a new damage model that has more unique parts flying off from the robots depending on how the robot
looks, the shell can come off from gyro which is nice, we need more like this, some tops that come off easily and expose a
unique robot design". And: "keep in mind this is a test phase for next gen, not for current gen".

He voted "Build it" on 15 robots and Yes on three rules: (1) what comes off stays on the floor as a real object for the rest
of the fight; (2) every lost piece changes how the robot fights, never only looks; (3) it shows on the robot card afterwards
until repaired. Step 1 did rules 1 and 2 for three robots (Buzzkill, Popcorn, Bricklayer); step 2 (28 Nov, T68) adds six more: Gyro, Railgun,
Scavenger, Grandmaster, Whaler, Jukebox; step 3 (28 Nov, T69) adds the last six of the first 15: Pogo, Blacksmith, Lodestone,
Hornet, Tarantula, Hydra. Batch A of all robots (28 Nov, T71a; Kev: "implement these changes to all robots go all out") adds Forklift,
Mincer, Scythe, Snapjaw, Thumper, Wrecker; batch B (28 Nov, T71b) adds Corkscrew, Mauler, Thwacker, Vertigo, Angler, Pincher:
twenty-seven robots now. Rule 3 is a later step.

**Not in the game.** One switch, off by default. With it off, every fight is exactly as before (checked: stock-fight
fingerprint 470f6923 and sync check 89a95280 unchanged, the game page plays 2 of 2 test games with 0 errors; step 3: the six robots'
own fights are bit-identical to `nextgen` before the change, 64 fights each; batch A: the same checks, the six robots' own fights
bit-identical; batch B: the same checks, the six robots' own fights bit-identical).

## Try it

`prototypes/flyoff-lab.html` (double-click; needs internet for planck.js). Pick one of the twenty-seven robots and an
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

## Batch A of all robots (T71a, 28 Nov)

Kev, after seeing the first 15: "for the next gen work, implement these changes to all robots go all out". Batch A: Forklift, Mincer,
Scythe, Snapjaw, Thumper, Wrecker. Each loses its own kind of piece in its own way, shows a new inside, and fights differently without it.
Twenty-one robots now.

| Robot | Comes off | You see | In the fight |
|---|---|---|---|
| Forklift | the 14 kg counterweight on its tail drops off (54 kg frame -> 40) | the little engine that drives the lift: a spinning radiator fan, cylinder heads, an exhaust that puffs | it can't hold a robot up any more: it flicks robots off its forks at once (FLICK!) instead of carrying and tipping them, and it nose-dives under a robot over 1.25x its weight. Lighter, so a bit quicker. The block is a heavy lump on the floor |
| Mincer | one grinder disc flies off its spindle and skids away forwards, still spinning | the bare spindle: a gold drive gear, a nut, the torn drive belt flapping, sparks | the other grinder gets all the motor (1.2x spin); Mincer comes in crabwise, the good grinder first; no more pinching a robot between two saws. The loose disc bites whatever it touches while it still spins (its own robot too) |
| Scythe | the curved blade snaps off the end of its arm | a bare steel pole, torn at the end | it stops wiping to and fro: it waits until a robot is in reach and swats it once, hard (SWAT!), knocking it away spinning; the pole can't cut |
| Snapjaw | the cover over its hydraulic ram pops off and the hose under it splits | the red hydraulic ram, its chrome rod to the jaws, a split hose spitting oil | no pressure: the jaws can't hold, so it chomps (bite 0.45 s, let go, bite again) instead of grabbing and dragging a robot to a wall; each bite spits a small oil puddle (at most one every 2 s) that robots slide in |
| Thumper | the axe head flies off the handle and bites into the floor (it barely moves: a spike to drive round) | the jagged end of the broken handle, sparking | it stabs with the broken handle: short, quick (about three stabs for one axe blow), small hits (10) that go through armour, instead of one slow 34-damage chop |
| Wrecker | the chain snaps: the spiked ball flies off and rolls on (it hardly slows down) | a short end of broken chain, the last link torn open | the chain end still whips round; when it hits a robot it wraps round it (LASSOED!), drags it round for 0.8 s and flings it away (FLUNG!), at most once every 2.2 s. Its spiked bumpers do the rest |

Nothing leaves a robot without a way to fight: Forklift flicks, Mincer keeps one grinder, Scythe swats, Snapjaw chomps, Thumper stabs,
Wrecker lassos. Some of these back-ups are weak (Scythe and Wrecker, see the numbers).

Also in this batch, drawing only (no rule change): bolder pictures without the piece for the three that changed least on the portrait
sheet. Tarantula: each lost leg is a thick torn stump that sticks out over the side plate, glowing orange at the break, with big sparks, two
hanging wires and a scorch mark. Lodestone: the coil bay is empty and dark, the bobbin flanges show, the core is a thin rod, and the unwound
wire hangs out over the side of the hull. Blacksmith: a bigger, brighter open forge with flames licking out of the coals and the torn hood
hinges at its back edge.

Pictures (fight view, just before and 2.5 s after): `/home/claude/out/t71a-<robot>-before.png`, `-after.png`, `-arena.png`, `-portraits.png`;
all 21 robots with and without their piece on one sheet: `/home/claude/out/t71a-portraits-all.png` (`node tools/flyoff-shots.js /home/claude/out t71a`,
`... t71a sheet`).

### Batch A numbers (28 Nov, open floor, wear on)

Same method as steps 1-3: each robot against all 32 others, 8 seeds each, sides swapped every other seed, **256 fights with the switch on and
the same 256 with it off** (`node tools/damage-lab/flyoff.js <robot> 8`, `flyoff.js report <files>`). "±" is a 95% range.

| | Forklift | Mincer | Scythe | Snapjaw | Thumper | Wrecker |
|---|---|---|---|---|---|---|
| piece comes off | 116 of 256 = 45% (±6) | 169 = 66% (±6) | 142 = 55% (±6) | 168 = 66% (±6) | 147 = 57% (±6) | 133 = 52% (±6) |
| when (median) | 38 s | 30 s | 34 s | 22 s | 38 s | 61 s |
| fights where robots touched the loose piece | 116 of 116 | 169 of 169 | 142 of 142 | 168 of 168 | 147 of 147 | 111 of 133 |
| contacts with the loose piece, a fight | 8.7 (3.9 by the other robot) | 22.9 (9.1) | 11.5 (4.3) | 8.4 (3.3) | 30.2 (12.9) | 5.3 (1.1) |
| the effect, in the fights where it came off | 0.96 flicks and 1.03 nose-dives a fight | the loose disc bit for 0.15 s a fight (0.02 s of it the other robot) | 11.7 swats a fight | 3.3 chomps, 1.4 oil puddles a fight; robots in its oil 0.8 s (the other) and 0.8 s (itself) | 9.5 stabs a fight | 5.5 lassos (and flings) a fight |
| win rate vs the field, switch off | 21.5% | 21.1% | 25.8% | 20.7% | 25.4% | 27.3% |
| win rate vs the field, switch on | 24.6% | 19.9% | 20.3% | 21.5% | 25.0% | 24.2% |
| difference (same fights) | +3.1 ± 3.0 | -1.2 ± 4.0 | -5.5 ± 4.8 | +0.8 ± 3.6 | -0.4 ± 3.2 | -3.1 ± 4.0 |

What happened in those fights after the piece came off: Forklift's tip-overs (landing hits) 0.34 -> 0.02 a second, its flicks take over;
Mincer's grinder hits 4.2 -> 1.3 a second; Scythe's blade hits 2.1 a second (6.9 damage a second) -> swats 0.34 a second (0.6 damage a
second: it knocks robots away, it hardly hurts them); Snapjaw's crush 4.9 -> 0.9 damage a second; Thumper's axe 0.79 blows a second
(3.6 damage a second) -> stabs; Wrecker's flail 4.0 damage a second -> lasso and spikes.

How the robot fights without its piece: the same robot starting without it (`spec.flyoffGone`) against the same robot keeping it
(`spec.flyoffKeep`), switch off, the whole field, 4 seeds each: **128 fights each way, same seeds** (`flyoff.js gone <robot> 4`,
`flyoff.js gonereport <files>`).

| | wins keeping it | wins without it | the change |
|---|---|---|---|
| Forklift | 31 of 128 | 28 of 128 | tip-overs 0.34 -> 0.02 a second; flicks 0.57 a second (3.1 damage each); fights end sooner (66 -> 54 s) |
| Mincer | 27 | 8 | grinder 3.5 -> 2.0 damage a second (one grinder, crabwise) |
| Scythe | 36 | 3 | blade 5.1 damage a second -> swats 0.6 damage a second: it shoves robots away but can't finish them |
| Snapjaw | 24 | 17 | crush 4.0 -> 2.4 damage a second (short bites, no dragging) |
| Thumper | 31 | 19 | axe 2.8 damage a second -> stabs 0.6 a second, 1.4 damage a second |
| Wrecker | 30 | 2 | flail 3.4 damage a second -> none; spiked bumpers 0.7 -> 1.1; the lasso throws but hardly hurts |

So in a fight losing the piece costs these six between -5.5 (Scythe) and +3.1 (Forklift: lighter, and its flick works better than it carried)
points against the field. Starting without it (rule 3, if not repaired) is very hard on Scythe and Wrecker (they keep a back-up that shoves
and throws but hardly hurts), hard on Mincer and Thumper, mild on Snapjaw, nothing for Forklift.

The whole field against these six (`flyoff.js field` on the six runs): every other robot moves between -2.3 (Bricklayer) and +2.3
(Buzzkill) points; within their ranges.

### The 15 earlier robots, re-run after batch A

Shorter run: each against all 32 others, **2 seeds each: 64 fights with the switch on and the same 64 off** per robot (960 + 960 fights;
the first two of the eight seeds, so a ±12 range on the rate, ±4 to ±13 points on the difference).

| | piece comes off | difference with the switch on | (step 3, 256 fights) |
|---|---|---|---|
| Buzzkill | 56% | +3.1 ± 10.7 | 45%, +3.1 |
| Popcorn | 64% | +1.6 ± 8.2 | 64%, -1.6 |
| Bricklayer | 45% | -9.4 ± 12.1 | 47%, -16.0 |
| Gyro | 61% | -6.3 ± 10.6 | 61%, -2.7 |
| Railgun | 39% | 0.0 ± 8.7 | 32%, 0.0 |
| Scavenger | 45% | -3.1 ± 8.7 | 45%, -3.5 |
| Grandmaster | 39% | +9.4 ± 9.5 | 42%, +3.5 |
| Whaler | 45% | 0.0 ± 4.4 | 39%, +3.1 |
| Jukebox | 42% | -7.8 ± 7.9 | 33%, +0.4 |
| Pogo | 45% | -7.8 ± 10.1 | 49%, -12.9 |
| Blacksmith | 47% | 0.0 ± 6.2 | 43%, +1.2 |
| Lodestone | 58% | 0.0 ± 7.6 | 48%, -0.4 |
| Hornet | 52% | +10.9 ± 7.7 | 50%, 0.0 |
| Tarantula | 58% | +7.8 ± 12.6 | 62%, -2.0 |
| Hydra | 63% | +6.3 ± 12.3 | 61%, -1.6 |

All fifteen still lose their piece in a third to two thirds of fights. Their code did not change (only Tarantula's, Lodestone's and
Blacksmith's pictures); the numbers move because six more opponents now lose pieces, and because 64 fights give wide ranges. Hornet
(+10.9 ± 7.7) is the only one whose range does not reach its step-3 number: its tip still breaks off in about half the fights; part of the
move may be that six more of its opponents now lose weapon pieces, part chance in 64 fights (I did not measure which). Worth a full
256-fight look if Kev keeps batch A.

### How batch A uses the mechanism

No new abilities were needed (as "What a 16th robot needs" said): six `FLYOFF` entries plus small hooks where the robots fight, each only
set once the piece is off, so fights with the switch off stay bit-identical: `R.foFlick` (Forklift's lifter), `R.foOne` (Mincer's crabwise
approach in `think`), `R.foBat` (Scythe's sweeper), `R.foLeak` (Snapjaw's crusher hold and crush), `R.foJab` (Thumper's hammer),
`R.foChain` and the chain end part `chainend` (Wrecker). Pieces: `spawnLoose` (counterweight, blade, cover, axe head), `detach` (Mincer's
disc, Wrecker's ball: real parts that fly off), `foPart` (Wrecker's chain end on a new rope). `tick`: Mincer's loose disc bites,
Snapjaw's oil, Wrecker's lasso. `dealt`: Mincer, Scythe, Thumper and Wrecker wear their piece with their own hits too. New causes:
fork flick, loose grinder disc, pole swat, broken axe handle, broken chain. Drawing in `src2/view.js` (`drawWeightBlock`, `drawEngine`,
`drawRamCover`, `drawLeakyRam`, `drawSpindle`, `drawChainEnd`, the bare pole, the broken handle, four floor pieces).

Checks, switch off: stock-fight fingerprint 470f6923 unchanged; sync check 89a95280 unchanged; the six robots' own fights (64 each, all 32
opponents, 2 seeds, a hash of every fight's end state) bit-identical to the `nextgen` engine before the change; game-sim check 2 of 2 games
finished, 0 page errors. The game page only got the new files stamp; the switch stays off there.

## Batch B of all robots (T71b, 28 Nov)

Kev: "for the next gen work, implement these changes to all robots go all out". Batch B: Corkscrew, Mauler, Thwacker, Vertigo, Angler,
Pincher. Each loses its own kind of piece in its own way (none the same as another or as the 21 before), shows a new inside, and fights
differently without it. Twenty-seven robots now.

| Robot | Comes off | You see | In the fight |
|---|---|---|---|
| Corkscrew | the screw thread round its drill strips off and lies on the floor as a coil of steel ribbon | a smooth hex bar with a chisel point, hot at the end | it can't screw in and anchor any more: it pins the robot against the wall and rubs it with the bare spinning bar; the part it rubs gets hot (glows, then burns) |
| Mauler | the spiked shell round its flail ball cracks in two | the hollow core of the ball at the arm tip, and a long light whip chain (twice the old chain) with a steel tip | it hangs back at whip range and lashes (CRACK!): quick stinging hits, hardly any knock, instead of closing in to smash. The two spiked half shells lie spikes up: a wheel or track that rolls onto one is punctured (its own too) |
| Thwacker | its whole tail drops off at the root, like a lizard's, and thrashes on the floor for 5 s | the torn tail socket, and a short red stinger with an amber point that sat in the tail root | it stops spinning: it turns its back and reverses into robots, stinger first |
| Vertigo | one of the two forks that hold its disc's axle snaps off | the disc tipped over: from above you see its face (teeth, holes going round) | it throws robots sideways and spins them round (and twists itself the other way) instead of throwing them high: no more air time |
| Angler | the spool of its fishing reel (new on its back, line running to the hook arm) flies off and rolls away | the bare reel: a gold gear turning freely, a broken ratchet pawl, a loose line end | it still gaffs (now any side it can reach, not only the back), but it can't reel in: it drives off, trawling the hooked robot behind it along the floor, scraping it, until the hook tears out (TRAWLED!) |
| Pincher | one of the two timing gears on its nose (new) shatters; half of it lies on the floor | the bare axle with a few broken teeth, sparking; the other gear turns on its own | the arms are out of step: no squeeze, no hold, no dragging to the wall; they slap one after the other (SLAP!), batting the robot from side to side |

Every robot keeps a back-up way to fight that still wins (see "starting without it" below; the weakest, Mauler, keeps 14 of its 41 wins).
Angler's reel and Pincher's gears are new on the robot, like Hydra's side heads: with the switch off they are not there and nothing changes.

Pictures (fight view, just before and 2.5 s after): `/home/claude/out/t71b-<robot>-before.png`, `-after.png`, `-arena.png`, `-portraits.png`;
all 27 robots with and without their piece on one sheet: `/home/claude/out/t71b-portraits-all.png` (`node tools/flyoff-shots.js /home/claude/out t71b`,
`... t71b sheet`).

### Batch B numbers (28 Nov, open floor, wear on)

Same method as before: each robot against all 32 others, 8 seeds each, sides swapped every other seed, **256 fights with the switch on and
the same 256 with it off** (`node tools/damage-lab/flyoff.js <robot> 8`, `flyoff.js report <files>`). "±" is a 95% range.

| | Corkscrew | Mauler | Thwacker | Vertigo | Angler | Pincher |
|---|---|---|---|---|---|---|
| piece comes off | 153 of 256 = 60% (±6) | 144 = 56% (±6) | 121 = 47% (±6) | 118 = 46% (±6) | 103 = 40% (±6) | 109 = 43% (±6) |
| when (median) | 15 s | 53 s | 49 s | 36 s | 23 s | 54 s |
| fights where robots touched the loose piece | 153 of 153 | 144 of 144 | 121 of 121 | 118 of 118 | 103 of 103 | 109 of 109 |
| contacts with the loose piece, a fight | 22.8 (12.9 by the other robot) | 24.7 (12.0) | 46.4 (10.0) | 11.2 (5.2) | 9.7 (1.1) | 31.9 (10.0) |
| the effect, in the fights where it came off | rubs 3.5 s a fight | 4.4 whip cracks; 2.2 punctures (0.6 the other robot, 1.6 itself) | the tail thrashes 4.7 s | 2.0 sideswipes | 1.4 trawls (2.8 s of dragging) | 12 slaps |
| win rate vs the field, switch off | 36.7% | 34.0% | 46.9% | 38.7% | 59.8% | 47.3% |
| win rate vs the field, switch on | 33.6% | 36.3% | 48.0% | 43.0% | 62.9% | 49.6% |
| difference (same fights) | -3.1 ± 3.9 | +2.3 ± 5.1 | +1.2 ± 4.3 | +4.3 ± 4.2 | +3.1 ± 3.9 | +2.3 ± 4.2 |

What happened in those fights after the piece came off: Corkscrew's drill 7.0 -> 1.4 damage a second (no anchoring, no coring); Mauler's flail
4.8 damage a second -> whip 1.5 hits a second, 2.9 damage a second; Thwacker's tail 8.3 a hit, 3.3 damage a second -> stinger 3.7 a hit,
1.6 damage a second; Vertigo's landings (robots thrown into the air) 2.5 -> 0.3 damage a second, disc hits 5.6 -> 1.6; Angler's drum 4.9 -> 2.5
damage a second (it spends time trawling); Pincher's squeeze (57 tiny hits a second, 4.8 damage a second) -> 1.5 slaps a second, 2.8 damage a second.

How the robot fights without its piece: the same robot starting without it (`spec.flyoffGone`) against the same robot keeping it
(`spec.flyoffKeep`), switch off, the whole field, 4 seeds each: **128 fights each way, same seeds** (`flyoff.js gone <robot> 4`,
`flyoff.js gonereport <files>`).

| | wins keeping it | wins without it | the change |
|---|---|---|---|
| Corkscrew | 51 of 128 | 21 of 128 | drill 5.0 -> 2.6 damage a second (rubbing and heat instead of anchoring and coring) |
| Mauler | 41 | 14 | flail 3.9 damage a second -> whip 0.73 hits a second, 2.4 each (1.75 a second); spiked bumpers 0.7 -> 0.9 |
| Thwacker | 60 | 54 | tail 0.38 hits a second, 8.6 each -> stinger 0.40, 4.4 each; slams into walls 0.06 -> 0.9 damage a second (it shoves robots backwards) |
| Vertigo | 51 | 23 | landings 2.2 -> 0.1 damage a second (no air time); disc hits 4.5 -> 4.4 damage a second |
| Angler | 73 | 70 | drum 5.5 -> 4.4 damage a second; fights last 67 s instead of 59 (trawling takes time) |
| Pincher | 65 | 63 | squeeze 4.1 damage a second -> slaps 2.5 a second, 1.8 each (4.4 a second); fights end sooner (82 s instead of 87) |

So in a fight losing the piece moves these six between -3.1 (Corkscrew) and +4.3 (Vertigo) points against the field, all within or at the
edge of their ranges. Starting without it (rule 3, if not repaired) is hard on Mauler, Corkscrew and Vertigo (each keeps about a third to a half
of its wins), mild on Thwacker, nothing for Angler and Pincher. Mauler and Thwacker with the switch off: unchanged (checked, below).

The whole field against these six (`flyoff.js field` on the six runs): every other robot moves between -3.9 ± 2.2 (Pogo) and +2.7 ± 1.9
(Grandmaster) points.

### The 21 earlier robots, re-run after batch B

Hornet in full (its batch-A short re-run showed +10.9 ± 7.7): **256 fights on and the same 256 off**: tip off in 128 of 256 = 50% (±6), stuck
in the other robot in 106 of 128, win rate 16.4% off, 16.8% on, **+0.4 ± 4.3**. The +10.9 does not hold: it was chance in 64 fights (step 3
had 0.0 ± 4.2).

The other 20: each against all 32 others, **2 seeds each: 64 fights with the switch on and the same 64 off** (the first two of the eight seeds;
±12 on the rate, ±4 to ±13 points on the difference).

| | piece comes off | difference with the switch on | (batch A re-run, 64 fights) |
|---|---|---|---|
| Buzzkill | 58% | +4.7 ± 11.1 | 56%, +3.1 |
| Popcorn | 64% | +3.1 ± 8.7 | 64%, +1.6 |
| Bricklayer | 44% | -6.3 ± 12.3 | 45%, -9.4 |
| Gyro | 61% | -3.1 ± 9.7 | 61%, -6.3 |
| Railgun | 39% | 0.0 ± 9.8 | 39%, 0.0 |
| Scavenger | 48% | -4.7 ± 9.2 | 45%, -3.1 |
| Grandmaster | 42% | +7.8 ± 9.1 | 39%, +9.4 |
| Whaler | 45% | 0.0 ± 4.4 | 45%, 0.0 |
| Jukebox | 42% | -9.4 ± 8.4 | 42%, -7.8 |
| Pogo | 47% | -7.8 ± 10.1 | 45%, -7.8 |
| Blacksmith | 47% | 0.0 ± 6.2 | 47%, 0.0 |
| Lodestone | 58% | +1.6 ± 8.2 | 58%, 0.0 |
| Tarantula | 56% | +9.4 ± 12.1 | 58%, +7.8 |
| Hydra | 63% | +9.4 ± 12.9 | 63%, +6.3 |
| Forklift | 39% | 0.0 ± 4.4 | (256 fights: 45%, +3.1) |
| Mincer | 64% | -7.8 ± 9.1 | (66%, -1.2) |
| Scythe | 63% | -1.6 ± 8.2 | (55%, -5.5) |
| Snapjaw | 59% | +4.7 ± 8.1 | (66%, +0.8) |
| Thumper | 56% | 0.0 ± 6.2 | (57%, -0.4) |
| Wrecker | 52% | -1.6 ± 5.3 | (52%, -3.1) |

All twenty still lose their piece in a third to two thirds of fights; their code did not change. Every difference is within its range of the
earlier number. Jukebox (-9.4 ± 8.4) is the only one whose range does not reach 0: its 256-fight number in step 2 was -2.3 ± 3.9, so this is
most likely chance in 64 fights (worth a full run if Kev keeps it).

### How batch B uses the mechanism

No new abilities: six `FLYOFF` entries plus small hooks where the robots fight, each only set once the piece is off, so fights with the switch
off stay bit-identical: `R.foSmooth` (Corkscrew's drill: no anchor, heat, pin in `think`), `R.foWhip` (Mauler's whip range in `think`; the whip
tip is a new part `whip` on a 0.85 m rope, `foPart`), `R.foSting` (Thwacker: the stinger is a new part on the hull, key `tail`; reverse drive in
`think`), `R.foThrow` (Vertigo's sideways throw in `vertKick`), `R.foTrawl` (Angler: gaff any side, no pull, scrape, drive off), `R.foSlap`
(Pincher's clapper: arms in turn). `touch`: Mauler's half shells puncture tyres and tracks. `tick`: Mauler's whip crack, Thwacker's thrashing
tail. `dealt`: all six wear their piece with their own hits too. New causes: whip chain, spiked half shell. Drawing in `src2/view.js`
(`drawSmoothBar`, `drawWhip`, `drawStinger`, `drawDiscForks`, `drawReel`, `drawTimingGears`, the cracking ball shell, six floor pieces).

Checks, switch off: stock-fight fingerprint 470f6923 unchanged; sync check 89a95280 unchanged; the six robots' own fights (64 each, all 32
opponents, 2 seeds, a hash of every fight's end state) bit-identical to the `nextgen` engine before the change (bf4ad24); game-sim check 2 of 2
games finished, 0 page errors. The game page only got the new files stamp (7a4c783d); the switch stays off there.

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

Batch A (T71a):

22. **Forklift** gets a little *better* without its counterweight (+3 points; it flicks instead of carrying). Keep, or make the flick weaker?
23. **Mincer's loose disc** bites rarely (0.15 s a fight, mostly Mincer itself). Should it bite harder or spin longer on the floor?
24. **Scythe without its blade** only swats (3 wins of 128 when it starts without it). Let the bare pole jab too, or is that the price?
25. **Snapjaw's oil**: small puddles when it bites (1.4 a fight). More oil, or none?
26. **Thumper's stabs** (10 damage, through armour, about three for one axe blow): right feel?
27. **Wrecker without its ball** has almost no weapon (2 wins of 128 when it starts without it; the lasso throws but hardly hurts). Keep, or
    let the chain end hit harder?
28. **Bolder pictures** for Tarantula, Lodestone and Blacksmith without their pieces: clear enough now (`t71a-portraits-all.png`)?

Batch B (T71b):

29. **Corkscrew** can't anchor without its thread and rubs robots hot instead (21 of 51 wins when it starts without it). Hotter, or fine?
30. **Mauler's whip** keeps it at range but hits soft (14 of 41 wins without the shell). Longer whip, harder crack, or fine?
31. **Thwacker's lizard tail**: should the dropped tail thrash longer than 5 s, or bite whoever it hits?
32. **Vertigo's tipped disc** throws sideways; it comes out a little better in a fight (+4.3 ± 4.2), but starting without the fork it keeps 23 of 51 wins. Fine?
33. **Angler's reel and Pincher's timing gears are new looks** (not on the robots before, only with the switch on). Keep them, or pick a piece they already show?
34. **Angler's trawl** drags a robot for up to 2.6 s and scrapes it (about 9 damage). Longer, harder, or into the wall on purpose?
35. **Pincher's slaps** do about as well as its squeeze (63 of 65 wins). Weaker slaps, or is that fine for a test?

Safest choices made where Kev has not decided: pieces barely hurt (like all junk); rates between a third and two thirds;
Bricklayer's laid blocks stay on the floor but can't be picked up again; the game page is untouched (switch off). Step 2: the rates
are 32% to 62% of fights; Scavenger can't eat its own spilled junk again; Jukebox's records can be fetched (the stated exception);
Grandmaster's blind pick happens at the same moments it would have re-chosen (every 6 s); Railgun's spread is up to 0.3 rad;
Whaler's winch half speed; the look follows the voting-page sketches (`tools/flyoff-page/gen.py` on main). Step 3: rates 43% to 62%;
every touch effect mild (bounce 0.3 s, tangle 1.2 s, burn 5 a second, zap 2 damage and 0.15 s, stuck tip 1.2 a second); pieces can't be put
back; Pogo, Hornet and Tarantula lose what the voting page said (jump, point, legs) even where that costs them a lot. Batch A: rates 45% to
66%; every effect on the other robot mild (flick 60, swat 70 with a spin, 0.8 s lasso then a fling of 40, oil puddles 0.25 m for 5 s, the
loose disc 9 damage a second while it spins, stabs 10); the six pieces and what is left are my choice (no voting-page sketches for these);
every robot keeps a back-up way to fight. Batch B: rates 40% to 60%; every effect on the other robot mild (punctures 3, whip crack 14 at most
every 0.3 s, sideways throw as strong as the old upward one but no air time, trawl scrape 5 a second for up to 2.6 s, slaps 4 and a shove of 55,
the dropped tail only knocks like loose junk); the six pieces and the new reel and gears are my choice; back-ups tuned so each keeps at least
about a third of its wins (stinger and slaps were stronger than the piece at first and were cut down).
