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

## First numbers (72 fights, 18 pairs from all 33 robots, open floor)

Per fight with all four on: about 10 hull-on-hull bumps, 3.3 slides (0.7 spin-outs, 0.4 T-bones), 1.9 get-unders, 0.8 crushes, 6 gut hits. Tip-overs are rare (about 1 in 25 fights).
Fights 56 s → 52 s, knockouts 92% → 93%, a different winner in 21% of fights (same seeds). Per-robot win rates are not measured yet (too few fights).

## Not done / ideas

- Per-robot balance with the switches on (needs a full matrix run on Kev's PC).
- The AI does not know the new rules yet: it does not aim for sides, walls or open plates on purpose.
- Next candidates: dents that change handling (bent frame pulls to one side), plates hanging by a bolt, debris that jams wheels.
