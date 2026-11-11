# ROBOCUS 2.0: Contact Lab (experiment, 11 Nov 2026)

Kev: weapons have clear, fun outcomes, but a plain bump only shoves or lifts a little, and it is hard to see why one robot overpowers another.
Goal: make what a bump does depend on where and how it lands, and make it visible.

- Play: `prototypes/contact-lab.html` (the Lineup Arena with the four switches on). The Damage Lab and the Lineup Arena have the same four boxes, off.
- Engine: `ARC.cx = { slide, under, crush, gut }`, all **off by default**. With every switch off, fights are bit-identical to before (checked on 12 fights), so the tabletop game, the matchup table and the bookie odds do not change.
- Knobs: `CXK` in `engine.js`. Counts: `node contact.js [fights per pair] [switches]` (`EVERY=30` takes every 30th pair).

## The four mechanisms

| Switch | What happens | Who is good at it | Counter |
|---|---|---|---|
| **Slide & spin-out** | A hit that kicks the hull sideways (0.45 m/s) or round faster than the tyres hold breaks their grip for 0.35-1.3 s: side grip 25%, drive grip 50%, tyre smoke. Side hits call T-BONED!, more than about 110 degrees of spin calls SPUN OUT!. | Rammers, heavy robots, anything that hits a side or a rear corner. | Tracks (1.6x grip), legs (1.3x), weight, facing the enemy. Omni wheels already slide. |
| **Get under** | A low nose driving into a higher edge props it up: the wheels on that side leave the floor (UNDER!), the robot underneath pushes 30% harder, for up to 2.2 s. Held under a side for 0.6 s, a narrow or top-heavy robot can roll over (TIPPED OVER!). | Nose height: wedge or flipper 0, wedge hull 1, chamfered or round hull 2, box 3. | Edge height: the front is the robot's own nose; a side or rear with its plate on is 2, bare is 3. Keep your plates, face the wedge, or bring a lower nose. |
| **Pin & crush** | A robot squeezed from two opposite sides (a pusher and a wall, or two robots) with more than 260 N for 0.3 s takes damage every 0.25 s on both squeezed parts (CRUSHED! / SANDWICHED!), red ring. | Pushers: tracks, wedges, heavy frames; teams in 2v2 and free-for-all. | Stay off the walls, spring or rubber bumpers, speed. |
| **Gut shots** | A hit on a hull side whose plate was torn off sends 1.8x as much damage to the internals (GUT SHOT!), and the wound keeps sparking and smoking for the rest of the fight. | Anything that can reach the open side: flankers, fast robots. | Turn the open side away, repairs between fights. |

## How it looks (11 Nov, Kev: show it, don't only label it)

- **Get under** (redone 11 Nov: Kev disliked the skewed robot): the robot is never skewed or squashed. Lift shows as in 2D games: the robot rises slightly up the screen away from its shadow, the shadow spills out under the raised edge, the hull's side wall comes into view along the raised edge with that side's tyres spinning in the air, and the top gets a light change (raised edge lit, slope in shade). It is drawn over the robot whose nose is under it. Dust and a small shake when it drops back. Drawing only (`ui.js`, `tilt*`).
- **Readability pass** (Kev: too subtle): the robot is only ~80 px wide at full-arena view and a lift lasts ~0.6 s, so the cues were made cartoon-sized (side wall up to 0.36 m, measured past the armour so plates don't hide it; bigger rise and shadow), the tilt is held 0.35 s after the lift ends, sparks and dust scrape where the nose is under, the drama cam leans in (zoom ~1.9, slow-mo) on a get-under or tip-over, and the UNDER! text is gone because it sat on top of the very thing it named.
- **Tipped over:** a short hop up the screen with a twist, the shadow staying on the floor, instead of the old coin-flip squash.
- A prop lasts about 0.6 s of fight time (up to 2.2 s while the robot underneath keeps pushing), so it is easiest to see at ½× or ¼×.

## First numbers (72 fights, 18 pairs from all 33 robots, open floor)

Per fight with all four on: about 10 hull-on-hull bumps, 3.3 slides (0.7 spin-outs, 0.4 T-bones), 1.9 get-unders, 0.8 crushes, 6 gut hits. Tip-overs are rare (about 1 in 25 fights).
Fights 56 s → 52 s, knockouts 92% → 93%, a different winner in 21% of fights (same seeds). Per-robot win rates are not measured yet (too few fights).

## Wear: cracks, fragments, bends, saw grooves (11 Nov, second pass)

Four more switches in `ARC.cx` (`crack`, `frag`, `bend`, `grindout`), also off by default and bit-identical when off. Knobs: `WEAR` in `engine.js`. All marks live in the part's own frame, so they move with the robot and stay on pieces that fly off.

| Switch | What happens | Effect on the fight |
|---|---|---|
| **Cracks** | Piercing hits (spear, harpoon, fangs, crusher, spikes, axe and hammer, big hits of any kind) start a crack at the hit point. On the chassis it runs inwards the way the blow went, as a star of 1-3 cracks for a hard stab, and can fork; it shows through the top plate. On a plate or blade it runs along it both ways. Every later hit near a crack tip makes it longer; any hard hit makes the worst crack creep. | A cracked part takes up to 1.8x damage. A hit near a chassis crack goes 1.7x deeper into the internals. A chassis crack that reaches a motor, battery or radio damages it ("the crack runs into the drum motor"). A plate (or spear) whose crack runs most of its length splits: a strip falls off (SPLIT!). |
| **Fragments** | A destroyed plate or front weapon breaks into 2-3 pieces, along its worst crack if it has one, instead of flying off whole. A cracked shell's top plate breaks in two when it comes off. | Mostly visual: more debris on the floor. |
| **Bending** | Blunt hits (hammer, ram, walls, landings, crushes, spinners, drums...) bend a plate in for good: the plate visibly kinks with fold lines. A blow to the side of a spear bends it. | A side plate bent into a wheel drags on it (less drive, sparks, WHEEL RUB!) until the plate is gone. A bent wedge lip can't get under any more. A bent spear points off to the side, so it misses or hits off-centre. |
| **Saw grooves** | Saws, grinders, buzzsaws, augers cut a notch where they stay on a part: bright cut metal, glowing while the saw is in it. | Hits on the groove do more damage. Deep enough and a plate is sawn through (SAWN THROUGH!, the smaller piece falls off; on a spear the tip falls off), or the chassis is opened up (SAWN OPEN!, a smoking wound). |

**Weapons bend like beams** (part of the Bending switch; Kev: realistically). Spear, spinner bar, flipper, lifter forks, sweeper axe, tail, fangs, clapper arms, crusher jaws. Each is a beam held at its root (the end nearest the robot, or a spinner's hub). Bending moment = the blow (before the part's toughness) x its distance from the root, so tip hits bend far more than hits near the mount; below a yield moment it springs back. The kink forms at the weakest spot between root and hit: an earlier kink, else a crack or saw groove, else just out from the root. The part beyond it swings the way it was pushed (at most 8° per hit, 34° total). The real shape changes (physics uses its outline), with a fold drawn across the beam. A bent spinner bar is out of balance and shakes the robot; a bent spear or fork points off to the side. Bent hard where it was cracked or sawn (24°), or bent all the way, it snaps and the outer piece flies off. Over 119 fights: about one weapon in three ends a fight visibly bent (10° or more), typically 5-15°. Fix (Kev): a weapon on its own body is held at its joint pin, so a spinner bar is two beams from the hub; each arm kinks on its own, about a third of the way out (before, the root was taken from the robot's middle, so the whole bar swung round one end). Second fix (Kev: still no bending on Whirlwind): a spinner bar is so tough that most of its impacts never became damage hits, so the bend model never saw them. Weapon bars now bend from every hard contact (impulse above 20) straight from the contact, pushed the way the other thing moves relative to the arm (a spinner's arm is knocked back against its spin), and spinner bars bend 2.2x more readily. Whirlwind now ends most fights with one or both arms bent 10-30° (16 test fights: 12 visibly bent). While it spins, a bent bar shows: each arm's own reach streak, a swept disc thrown off centre, and a dashed amber ring for the shorter (bent) arm's track. Discs, drums and saws don't bend (yet): a warped disc would be the next step.

**All weapons audited (Kev, 11 Nov).** Three ways a weapon gives, by its shape; how often each robot's weapon was visibly bent (10°+ or equivalent) at some point in 3-4 test fights:

| How it gives | Weapons (robots) | Seen bent |
|---|---|---|
| Kinks like a beam (held at its mount or pin; end-on blows buckle it further the way it already bends) | spear (Jouster, Hornet), spinner bar (Buzzkill, Whirlwind; each arm separately), sweeper axe (Scythe), clapper arms (Pincher), fangs (Tarantula), lifter forks (Forklift, Trebuchet), tail (Thwacker), arm segments (Hydra, Angler), drill (Corkscrew), vertical disc seen edge-on (Vertigo, two halves from its axle) | most in 1-4 of 3-4 fights; Hydra and Trebuchet only reach 8-9° |
| Bows along its length (wide plates and drums) | drum (Rumbler, Juggernaut, Angler, Lodestone), flipper (Popcorn), crusher jaws (Snapjaw), wedge | 2-4 of 3-4 |
| Warps ("taco": the half hit hardest folds, so from above it looks shorter; out of balance, shakes its robot while spinning, saws cut less) | orbit blades (Orbiter), twin grinders (Mincer), buzzsaw (Sawblast), Grandmaster's saw, shell (Gyro, knocked out of round) | Orbiter 2/3, Mincer 3/3, Gyro 3/3, Sawblast and Grandmaster 1/3 |
| Handle (not a physics part, so the bend is a number) | Thumper's axe: off-centre blows on metal wrench the handle; the head lands off to the side | 2/4 |
| Don't bend (solid lumps or not metal blades) | boxing glove (Haymaker, Brawler), flail ball (Wrecker, Mauler), ram head (Ramrod), Grandmaster's axe head, flame/guns/rockets/harpoon | - |

First numbers (54 fights, 18 pairs, wear switches only): per fight 3.3 cracks (0.65 run into a part inside), 4.1 bends (0.9 wheel rubs), 2.7 fragment breaks, 0.4 saw cut-throughs. Splits along a crack are rare. Knockouts 93% → 98%. The winner changed in 37% of fights, but part of that is chaos: any change sends a fight down a different path, so this overstates the real balance shift. Per-robot balance not measured.

## Not done / ideas

- Per-robot balance with the switches on (needs a full matrix run on Kev's PC).
- The AI does not know the new rules yet: it does not aim for sides, walls or open plates on purpose.
- Next candidates: dents that change handling (bent frame pulls to one side), plates hanging by a bolt, debris that jams wheels.
