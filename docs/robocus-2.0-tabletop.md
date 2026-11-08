# ROBOCUS 2.0 tabletop prototype (work in progress, 8 Nov 2026)

Kev (8 Nov): build 2.0 into the browser game as a separate option, "Tabletop prototype 2.0". The old game stays as the reference. Broken parts stay broken between fights and are repaired by crew (option 2). Plan: `claude/robocus-2.0-browser-plan.md` in the project.

## Two separate games

| | 1.0 (reference, frozen) | 2.0 |
|---|---|---|
| Page | `prototypes/tabletop-prototype.html` | `prototypes/tabletop-2.html` |
| Fights | `src/sim.js` | `src2/engine.js` (the Damage Lab physics, planck.js) |
| Robots and parts | in the page | `src2/lineup.js` (25 robots in levels 0-3, 25 part cards) |
| Fight screen | in the page | `src2/view.js` (full-screen fight with damage panels) |
| Game | in the page | `src2/game2.js` |
| Online | `src/net.js` | not yet (its own copy later; the host will stream fights) |

`src2/engine.js` and `src2/lineup.js` are copies made by `python3 tools/damage-lab/build.py`: edit them in `tools/damage-lab/` (where the test tools live) and rebuild. No 1.0 file was changed.

## What works now (first playable slice)

- Four teams (you are Steel, three AI teams). Each team has a starter and a level 1 robot, 3 Mechanics and a Chief Engineer, 8 credits. First to 5 fame wins.
- Every round:
  - **Upkeep / repairs.** Crew is ready again. The ledger pays +1 Cr per Mechanic and −1 per robot. Chassis, battery and radio come back to at least half for free. Then you repair.
  - **Arena.** You fight one rival (rotating) with the robot you pick. The other two rivals fight off-screen. Winner +1 fame, both fighters +2 Cr.
- **Fight screen** (`src2/view.js`): goes full screen.
  - The arena is in the middle with one panel per robot on the sides; on a phone the arena is on top and the panels below it.
  - Each panel shows: team colour, level stars, health and hype bars, status tags, and a top-down damage diagram (every part coloured by health, lost parts dashed red, the lid outline, the internals as dots).
  - Below the diagram is a list of the insides: chassis, top plate, battery, radio, weapon motor, chip, module, drive motors (x of 4 work), wheels, armour plates, weapon and drones. Underneath: what was lost in this fight.
  - Controls: 1×, 2×, 4×, Pause and Skip to result, plus a feed of the big moments.
- **Damage stays:**
  - `wearOf(robot)` after a fight records part HP, lost parts, dead internals, the lid, drones and dents.
  - A robot with `spec.wear` starts its next fight in that state: lost parts simply aren't there, a dead motor stays dead, a fried chip stays fried, and the dents stay as battle scars.
  - Without `wear`, fights are identical to before (42-fight check: 0 different).

## Repair rules (first numbers, to tune)

- Crew gives repair actions each Upkeep: **Mechanic 1, Chief Engineer 2, Repair Tech 3.** Using any of a crew member's actions makes it busy for the round, which will matter once Intrigue cards that count ready crew come over.
- **One action** repairs one item fully or puts a lost item back. A **broken weapon** or a **shot-down drone** takes **2**.
- Items:
  - chassis;
  - each wheel with its motor;
  - each armour plate;
  - the weapon (all its parts plus the weapon motor, turret or arm);
  - the top plate;
  - battery, radio, chip, module, thruster;
  - each drone.
- Anything above 95% counts as fine.
- Out of crew: **2 Cr per action.**
- **For free in every Upkeep:** chassis, battery and radio come back to at least 50%.
- AI teams repair broken things first, then the most damage per action, and spend credits on broken items while they keep 4 Cr in reserve.

## What damage costs (`tools/damage-lab/wearcost.js`)

Each lineup robot with one kind of carried-over damage against robots of its own level; 12 fights per robot, about 300 fights per row.

| Damage carried into the fight | Wins |
|---|---|
| none | 51% |
| one wheel lost | **24%** |
| one drive motor dead | **27%** |
| side armour plate lost | 48% |
| top plate off | 48% |
| chassis at 50% | 50% |
| weapon motor dead | **13%** |
| weapon lost | **6%** |
| everything at 60% | 27% |

So wheels, drive motors and the weapon are what count. Armour, the lid and chassis HP barely matter for the next fight. They matter for how long a robot lasts, and they are cheap to leave. Possible tweak: armour and lid repairs at half an action (two per action), so crew time goes to the parts that decide fights.

## Next steps

1. Fork the 1.0 game loop into 2.0: starter draft, Market auctions with robot levels in waves, part cards (2 parts + 1 legendary), Intrigue, bets, hosting, crates. Use the 1.0 rules as the reference, with 2.0 wording where cards mention stats.
2. Strength table for the bookie and the AI (robot strengths, part values, condition).
3. Live cards on the new engine (the current Auction deck plus Call the Hammer, Floor Launcher, Supply Drop, Chip Hack, Loose Bolts, Hype Surge, Electromagnet, Smoke Bomb).
4. Online play: the host streams fights.
5. Decide how the levels are spread over the auctions.
