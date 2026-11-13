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
- Jukebox (records that fly, 8 Nov) was built on a branch from main that was never pushed (`Claude outputs/robocus-l4-jukebox.bundle`). Under the new rule it would be a candidate at grade 1 (it used grade 1.18 and damage knob 1.9 there); not moved to 2.0.1 yet.
- The eight level 4 robots and the lineup still use grades and knobs from before the new rule.
- The AI doesn't use the 2.0.1 rules on purpose (aim for open plates, walls).
