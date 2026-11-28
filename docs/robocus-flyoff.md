# ROBOCUS next gen: parts that fly off (T67, step 1)

Kev, 28 Nov 2026: "a new damage model that has more unique parts flying off from the robots depending on how the robot
looks, the shell can come off from gyro which is nice, we need more like this, some tops that come off easily and expose a
unique robot design". And: "keep in mind this is a test phase for next gen, not for current gen".

He voted "Build it" on 15 robots and Yes on three rules: (1) what comes off stays on the floor as a real object for the rest
of the fight; (2) every lost piece changes how the robot fights, never only looks; (3) it shows on the robot card afterwards
until repaired. Step 1 (this) does rules 1 and 2 for three robots. Rule 3 is a later step.

**Not in the game.** One switch, off by default. With it off, every fight is exactly as before (checked: stock-fight
fingerprint 470f6923 and sync check 89a95280 unchanged, the game page plays 2 of 2 test games with 0 errors).

## Try it

`prototypes/flyoff-lab.html` (double-click; needs internet for planck.js). Pick Buzzkill, Popcorn or Bricklayer and an
opponent, tick or untick "Parts fly off", then "Watch the fight" (same seed = same fight) or "Run 40 seeds" for quick
numbers. The two pictures show the robot as it comes and without its piece.

## The three robots

| Robot | What comes off | What is left | How it fights after |
|---|---|---|---|
| Buzzkill | half of the spinning bar: first it bends at the hub, then it snaps | a short half bar | spins 1.5x faster, reaches half as far: quicker, smaller hits |
| Popcorn | the yellow teeth plate | a thin bare steel flipper | flips 38% weaker, and every flip bends the bare flipper a bit more (each bend takes about 6% off the next flip, down to about a third of a full flip) |
| Bricklayer | the brick stack topples | an empty crane | the iron blocks on its back break into small bricks that lie around for everyone; the crane drops and lifts nothing any more; it shoves with its dozer blade |

The piece on the floor is a real object: robots bump into it, push it and get pushed onto it. Like all loose junk it barely
hurts anyone. Pictures: `/home/claude/out/t67-*.png` (before / after in the fight view, the arena, the two portraits).

## The numbers (28 Nov, open floor, wear on as in the game)

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

## How it works (engine, `tools/damage-lab/engine.js`, section "PARTS THAT FLY OFF")

- Switch: `ARC.flyoff` (default `false`) or the fight option `flyoff: true / false`. Read once when the fight is built
  (`S.fo`), so it travels with the fight's options and every screen plays the same fight. Seeded RNG only.
- `FLYOFF` is a table by robot name. Each entry has a damage pool. Every hit on one of the robot's parts drains it by the
  damage times `feed(R, part, h, d)` (which parts count, and how much). At `warn` (share of the pool gone) `bend()` shows the
  piece going. At 0, or when the part it sits on would break (`watch`), `pop()` runs: it makes the floor pieces (real bodies,
  never cleaned up during the fight) and changes the robot. The pool is multiplied by the robot's power dial.
- Pieces count their touches (own robot / other robots). The robot counts its hits before and after (`R.fo.dealt`).
- `spec.flyoffGone: true`: the robot starts without its piece (changed behaviour, nothing on the floor). Works with the switch
  off too; it is what the robot card and garage would use for rule 3. Nothing in the game sets it.
- Drawing: `src2/view.js` (`drawFoPiece`, bare flipper, leaning stack). The half bar is drawn from its new shape.

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

## The other 12 robots: what the mechanism still needs

| Robot | Piece | What is missing |
|---|---|---|
| Gyro | the shell | nothing for the shell itself (it already comes off as a body); the bare flywheel that is left is a new spinning part: needs a "swap in a new part on a joint" helper |
| Pogo | casing in two halves, spring uncoils | two floor pieces is fine; a spring on the floor that bounces whoever drives over it needs an on-touch hook for floor pieces |
| Blacksmith | hood | burning on touch (on-touch hook on the robot's own parts) and overheat pauses (a per-step hook) |
| Whaler | hull splits | slower winch: fine; the rope that can be cut exists for some weapons, needs checking for the harpoon |
| Lodestone | copper coil | weaker pull: fine; loose wire that tangles tracks needs the on-touch hook plus a "tangled" wheel effect |
| Hornet | spear tip | the tip sticks in the other robot and keeps hurting it: needs a piece that welds to another robot |
| Railgun | the two rails | firing wide: a spread number in its weapon; fine |
| Jukebox | the record crate tips | the records are already floor objects; needs mapping its own state (one record left) |
| Scavenger | hopper cracks | its junk is already floor objects; pour it out at once: fine |
| Tarantula | legs, one at a time | several pieces in turn: the table has one piece per robot; needs a list of pieces |
| Hydra | heads, one by one | several pieces (as Tarantula) and a stump that zaps on touch (on-touch hook) |
| Grandmaster | the hat | picking a tool at random: a flag in its tool choice; fine |

So the next step needs four small additions: several pieces per robot, an on-touch hook, a per-step hook, and swapping in a
new part. Gyro, Railgun, Scavenger, Grandmaster, Whaler and Jukebox can go first without them.

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

Safest choices made where Kev has not decided: pieces barely hurt (like all junk); rates between a third and two thirds;
Bricklayer's laid blocks stay on the floor but can't be picked up again; the game page is untouched (switch off).
