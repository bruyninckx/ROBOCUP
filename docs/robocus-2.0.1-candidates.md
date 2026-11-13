# ROBOCUS 2.0.1: candidate robots (13 Nov 2026)

Kev (13 Nov): "my dream really is to have robots that don't need little knob tweaking to balance but that the physics dominate the balancing completely. We will keep adding mechanisms until we have 200 robots, and then go through a thorough selection procedure to filter on fun and counter-type gameplay with an edge for every player." And: "higher level robots should look fierce, with big weapons that show their strength immediately."

So from now on a new robot is a **candidate**:
- It runs at **power grade 1 with no damage knob** (`dmgK` 1). Nothing is scaled to hit a target.
- Its **level is measured, not tuned**: the level whose robots it beats about 55-65%, written down as it came out.
- It lives in `Lineup.CANDIDATES` (`tools/damage-lab/lineup.js`), not in `ROBOTS` / `ROBOTS4`, so the tabletop game, its waves and the tier tools don't see it. The Lineup Arena and the Contact Lab show candidates in their own group ("Candidates (grade 1, measured level, not in the game)").
- Its mechanism has **design values** (how long the beak holds, how hot the flame is, how often the hammer beats). They were set once by looking at the fights, not swept per matchup. They are listed in `RW` in `engine.js` so the selection can see them.

All three are on branch `robocus-2.0.1` (from it: `claude/robots-2.0.1`), built for the 2.0.1 contact and wear physics (`docs/contact-lab.md`).

## The first three (after Robot Wars designs)

| Candidate | Inspired by | Mechanism | Measured level |
|---|---|---|---|
| **Talon** | Razer | A hooked beak drops from above (0.16 s), reaches over a front weapon to the body behind it, pierces with a crack star, then holds on (2 s), squeezing through the hole and lifting the victim off its wheels (TROPHY!) while it drags it to a wall. A low lower-beak gets under (nose height 0). Off-centre blows on hard metal bend the beak sideways, so it strikes off to the side. Self-rights with the beak. | **2** |
| **Blacksmith** | Mr Psycho | Tongs clamp the enemy to an anvil nose (2.4 s); while it is held the forge hammer comes down on its lid every 0.8 s (CLANG!) and the robot drags it to a wall (with Pin & crush on, that squeezes it too). Too heavy to clamp: it just hammers. The anvil face glows as the beats add up. Self-rights with the hammer. | **3** |
| **Rotisserie** | Sgt Bash | Big serrated pincers grab (3 s), the flamethrower roasts what they hold at double heat (motors cut out, parts cook, batteries catch fire), and the pincers turn the victim on the spit so its weapon swings away and the flames reach its flank. Bent pincers can't close any more. Twin fuel tanks on its back, heat gauge lamps (how hot the victim's insides are). | **4** |

### Measured (fresh seeds 60001+, 10 fights per opponent, open floor)

| | vs L1 | vs L2 | vs L3 | with all eight 2.0.1 switches on: vs L2 / vs L3 |
|---|---|---|---|---|
| Talon | 63% | 46% | 20% | 50% / 36% |
| Blacksmith | 72% | 62% | 40% | 64% / 42% |
| Rotisserie | 90% | 76-82% | 58-62% | 82% / 58% |

(A level beats the level below about 60%.) The contact and wear physics help Talon most (+16 vs level 3: its pierce starts cracks that later hits open up), which is the kind of thing the 2.0.1 physics should do.

Per robot: median fights 42-57 s, 22-29 big moments a minute, 3-5 enemy parts torn off per fight.

### Counters (what beats them)
- **Ramrod beats all three** (0-20%): it rams and bounces off, so nothing that needs a grab or a held strike gets hold of it. The eight level 4 robots have the same problem; it is the clearest "counter-type" in the roster.
- **Brawler** (rubber bumper, glove punches it away): Talon 0-10%, Blacksmith 20%.
- **Sawblast** (rockets on the approach): Talon 0-20%, Blacksmith 0-40%.
- **Vertigo** flips Blacksmith (0-30%).
- Rotisserie's next weakest matchup after Ramrod: Sawblast (50-70%).

## Jukebox and Gaucho (13 Nov, later)

- **Jukebox** (the disc jockey from 8 Nov, Kev: very novel) moved onto 2.0.1 as a candidate. Without its old knobs (grade 1.18, damage x1.9) it measured **level 0**: 58-61% vs level 0, 25-27% vs level 1. Changes on the way, all physical: bigger records (10 kg, 0.21 m, 130 rad/s), a stronger turntable motor, and the bite's damage now comes from the energy the rim loses in the cut (0.08 damage per joule) instead of a fixed number. Records warp and cut grooves under the 2.0.1 wear rules. Its limit is the rate of fire: about 6 throws a fight, 0.84 hits per throw, about 47 damage per hit. Heavier records also mean Lodestone (pulls loose junk up to 6 kg) no longer catches them.
- **Gaucho** (new, projectiles): throws bolas, two steel balls on a cord, spun about their middle. Whatever they hit they wrap: round a wheel or a flank they tie that side's wheels (drive force x0.1, tracks x0.45) for 3 s, round the front they jam the weapon. Spinning weapons cut the cord. A nose saw finishes. The next bola only flies once the last one is off (the first version tied robots up for good: no fun). Measured **level 0 or below** (33% vs level 0, 47% on another seed set; with the 2.0.1 switches on 20%). The bola is a strong control effect with almost no damage of its own, so it fits the "add a weapon to a robot" track better than a robot of its own.

Under the 2.0.1 switches (all eight on): Jukebox 61% vs level 0, 25% vs level 1, 7% vs level 2.

## Scavenger, Bricklayer and Pendulum (13 Nov, later): arena-physics designs

Kev asked for really new designs in the spirit of the Jukebox. What makes the Jukebox new is that its weapon has a life cycle in the arena: it is loaded, thrown, lands, and gets picked up again. These three each have one. There is no damage knob in any of them: a hit does the energy it carries times the same joules-to-damage rate as the Jukebox's records (`JUKE.eK`, 0.08 per joule).

| Candidate | Mechanism | The life cycle | Measured level |
|---|---|---|---|
| **Scavenger** | No ammo of its own. A vacuum mouth pulls in the loose junk in a cone in front (wheels, plates, records, blades, its own bits too, up to 9 kg), and an air cannon fires it back. Every shot gets the same energy (520 J): a light bolt flies fast, a heavy plate slow. The recoil shoves the Scavenger back by the shot's momentum. Works either way up. | Junk is sucked up, fired, lands, and gets sucked up again. It can fire an enemy's own wheel back at it ("RETURN TO SENDER!") and it eats loose Jukebox records. | **below 0** (11% vs level 0) |
| **Bricklayer** | A slewing crane on top and three 25 kg iron blocks on its back. It swings a block out over where the enemy will be and lets go: the fall (mass x g x 1.3 m) is the hit. The crane turns all the way round, so it never has to face the enemy's weapon. | Hit or miss, the block stays on the floor as a heavy obstacle (cover, a wall to pin against). The crane lifts blocks back on. It gets lighter, so faster, as it lays them. Landing upside down spills the stack. | **below 0** (12% vs level 0) |
| **Pendulum** | Fires an anchor into the arena wall while it runs, and the cable swings the run round into a circle. It winches in as it goes, and like a skater pulling her arms in it speeds up (angular momentum). Then it lets go and flies at the enemy, spiked prow first. The winch has limited power, the anchor rips out under too much pull, and spinning weapons cut the cable. It rolls on omni wheels: on normal wheels the tyres' side grip fights the cable and it never speeds up (measured). | Anchor, swing, reel, let go, re-anchor. Needs a wall within reach: in the middle of the arena it just rams. | **about 0** (41% vs level 0) |

### Measured (fresh seeds 60001+, 10 fights per opponent, open floor, grade 1)

| | vs L0 | vs L1 | vs L2 | with all eight 2.0.1 switches on: vs L0 / vs L1 |
|---|---|---|---|---|
| Scavenger | 11% | 8% | 4% | 9% / 12% |
| Bricklayer | 12% | 17% | 10% | 17% / 23% |
| Pendulum | 41% | 18% | 20% | 44% / 15% |

In a four-robot free-for-all against level 0 and 1 robots (fair share 25%): Scavenger 4%, Bricklayer 8%, Pendulum 4%, Jukebox 29%.

### Why they come out low (the physics, as measured)
- **Scavenger**: its shots work (almost every shot hits, about 33 damage each), but there is no junk until the fight has torn parts off, so in a 1v1 it fights the first 30-40 s with just a scoop, and gets about 7 shots a fight. The physical lever is the shot energy (a bigger air tank).
- **Bricklayer**: about half its drops land, for about 25 damage each, and most of it goes into the lid and top armour, which is where a falling block lands. The crane only reaches 1.3 m (a longer one with a 25 kg block would tip a 100 kg robot over), so it fights at touching distance. The physical levers are a taller crane (more drop height) or heavier blocks with a counterweight.
- **Pendulum**: a heavy robot only reaches about 2.3 m/s on the open floor; on the cable it gets to 3-4 m/s, not the 6-8 the idea needs, because the arena is only 8 m and the enemy is rarely close to a wall. It beats slow robots that stay near walls (Haymaker 100%, Jouster 80%) and loses to anything that stays in the middle or flips it.

None of them got any tuning towards a target. They stay in the catalogue at their measured level for the selection; the obvious physical levers are listed above if Kev wants to try a Mk II.

Not built yet from the same list: Fire hose (a water jet that pushes without damage and puts fires out), Hamster (a rolling cage), Constrictor, Mothership, Pogo.

## Looks (Kev: higher levels look fierce, the weapon shows its strength at once)
- Rotisserie (level 4): long hooked pincers with serrated teeth (bigger in the physics too: 0.53 m, re-measured afterwards, still level 4), a big nozzle, twin red fuel tanks, a fat flame.
- Blacksmith: a big hammer block held high over the robot (drawn bigger while raised) that comes down onto the victim's lid; a glowing anvil.
- Talon: a hooked beak over the nose, red eye lamps when it holds on, a red ring where it pierced.
- Drawing code is in both `tools/damage-lab/ui.js` and `src2/view.js` (keep them in step). Repair zones: the beak ram, flame nozzle and hammer arm are Weapon.

## Toward 200 candidates and a selection procedure (suggestion)
- **One catalogue**: every candidate in `CANDIDATES` with its measured level, at grade 1.
- **An automatic screen** per candidate, run on Kev's PC: measured level (vs each level), fun (big moments a minute, parts torn off, fight length, how often the signature move happens), counterplay (it has at least one matchup it wins 75%+ and one it loses 75%+, and its counters are spread over different robots), and the 2.0.1 switches on vs off.
- **Then the selection**: keep the ones that are fun to watch and that give every level a rock-paper-scissors spread, so every player can find an edge.
- `node l4.js` already does the level and fun part (`VS=1,2,3`, `CX=all` for the 2.0.1 switches); the counterplay part needs a candidate-vs-candidate matrix.

## Not done
- The eight level 4 robots and the lineup still use grades and knobs from before the new rule.
- The AI doesn't use the 2.0.1 rules on purpose (aim for open plates, walls).
