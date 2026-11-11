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

- **Get under:** the propped robot tilts. It is drawn shorter across the lifted axis (hinged on the edge still on the floor), a touch wider at the raised edge, with the slope shaded and the raised edge lit, a dark lip where the underside shows, and its shadow stretched out under the raised edge. It is drawn over the robot whose nose is under it, so the wedge visibly disappears beneath it. The wheels in the air spin freely; when it drops back there is a puff of dust and a small shake. Drawing only (`ui.js`, `tilt*`); the sim is unchanged.
- **Tipped over:** a short roll animation over the lifted axis instead of a jump cut.
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

First numbers (54 fights, 18 pairs, wear switches only): per fight 3.3 cracks (0.65 run into a part inside), 4.1 bends (0.9 wheel rubs), 2.7 fragment breaks, 0.4 saw cut-throughs. Splits along a crack are rare. Knockouts 93% → 98%. The winner changed in 37% of fights, but part of that is chaos: any change sends a fight down a different path, so this overstates the real balance shift. Per-robot balance not measured.

## Not done / ideas

- Per-robot balance with the switches on (needs a full matrix run on Kev's PC).
- The AI does not know the new rules yet: it does not aim for sides, walls or open plates on purpose.
- Next candidates: dents that change handling (bent frame pulls to one side), plates hanging by a bolt, debris that jams wheels.
