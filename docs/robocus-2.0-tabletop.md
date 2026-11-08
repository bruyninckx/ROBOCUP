# ROBOCUS 2.0 tabletop prototype (work in progress, 8 Nov 2026)

Kev (8 Nov): build 2.0 into the browser game as a separate option, "Tabletop prototype 2.0". The old game stays as the reference. Broken parts stay broken between fights and are repaired by crew (option 2). Plan: `claude/robocus-2.0-browser-plan.md` in the project.

## Two separate games

| | 1.0 (reference, frozen) | 2.0 |
|---|---|---|
| Page | `prototypes/tabletop-prototype.html` | `prototypes/tabletop-2.html` |
| Fights | `src/sim.js` | `src2/engine.js` (the Damage Lab physics, planck.js) |
| Robots and parts | in the page | `src2/lineup.js` (25 robots in levels 0-3, 25 part cards) |
| Fight screen | in the page | `src2/view.js` (full-screen fight with damage panels) |
| Game | in the page | in the page: a fork of the 1.0 page (same board and phases), plus `src2/repair.js` (zones, strength) |
| Online | `src/net.js` | not yet (its own copy later; the host will stream fights) |

`src2/engine.js` and `src2/lineup.js` are copies made by `python3 tools/damage-lab/build.py`: edit them in `tools/damage-lab/` (where the test tools live) and rebuild. No 1.0 file was changed.

## Update 8 Nov (later): the 1.0 game forked into 2.0

`prototypes/tabletop-2.html` is now a copy of the 1.0 page with the 2.0 robots in it (the first slice and `src2/game2.js` are gone):
- Same board and phases as 1.0: sponsor, starter draft (2 dealt, keep 1, the 9 level-0 robots), Upkeep, Intrigue, Market, Host, Bets, Fight, Fate.
- A robot has a level, 2 part slots and 1 legendary slot, its damage (`wear`) and Fan tokens. No stats, strain or engineers.
- Market: the 22 part cards (with copies) replace the 1.0 upgrades; the 3 legendary parts are announced a round ahead like 1.0's legendaries. Robot lots (placeholder): level 1 in rounds 1-2, level 2 in rounds 3-4, level 3 from round 5.
- Odds and AI use `Repair2.strength` (no scouting, no sparring). Several sides: P ∝ exp(strength).
- Fights: duel, 2v2 (Grand Final, Tag Team, 2 per side), free-for-all (Grand Melee), Mirror (2 copies each), House Robot (a level-2 Juggernaut; only when there is room, 4 robots max). Shown in the full-screen view; AI-only, bot and skipped fights run headless.
- Repairs in Upkeep: body parts heal to half for free, then each zone (⚙ Drive, ⚔ Weapon, ⛨ Body) costs one repair action: Mechanic 1, Chief Engineer 2, Repair Tech 3, other crew 1 (the crew member is exhausted for the round), else 2 Cr. Free actions: Aegis Heavy 1 per Upkeep; the losing team 1 next Upkeep (Vulture Salvage 2), replacing the Scrap Crate.
- Intrigue robot cards in 2.0 terms (Secret Upgrade, Overclock, Sugar in the Tank, Smudged Lens, EMP the Garage, Loose Bolts, Rogue Firmware).
- Not yet: live combat cards (next), online play.

## What worked in the first slice (replaced)

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

## Repairs: three zones (Kev, 8 Nov)

The engine keeps every part's damage, but you repair zones (`src2/repair.js`):

| Zone | Covers |
|---|---|
| ⚙ Drive | wheels, tracks, drive motors, thruster |
| ⚔ Weapon | the weapon, its motor, turret or arm |
| ⛨ Body | chassis, armour, top plate, battery, radio, chip, module, drones |

- A zone is lit when something in it is lost or dead, or below 70%.
- One repair action restores a whole zone, dents included.
- Body parts that are still there heal back to half on their own every Upkeep. Lost body parts (a plate, the lid, a drone) stay lost until Body is repaired.
- The losing team gets one free repair action next Upkeep (this replaces the Scrap Crate).

### Do repairs add to the game? (`tools/robocus2/zonesim.js`)

40 AI games per row: 4 teams, a starter and a level 1 robot each, real fights, first to 5 fame. Each team sends its best robot by strength.

| Repairs | Rounds | Win after a loss / after a win | Fights with a broken zone |
|---|---|---|---|
| everything repaired for free (no carry-over) | 6.2 | 50% / 50% | 0% |
| no repairs (Body heals only) | 5.6 | **39% / 61%** | 58% |
| zones, 1 action a round + loser's free one | 6.2 | 44% / 56% | 54% |
| zones, 2 actions a round + loser's free one | 6.3 | 49% / 51% | 18% |
| zones, 5 actions a round (3 Mechanics + Chief Engineer) | 6.2 | 50% / 50% | 0% |

- Without repairs the game snowballs: a team that lost wins only 39% of its next fight.
- Zones with a little crew remove the snowball, and game length stays the same.
- A team uses about 2 repair actions a round. With the full starting crew (5 actions, plus free ones) every robot is always fully repaired, so the only real cost is crew being busy for Intrigue cards.
- To make repairs a choice, crew should be scarcer than that: for example **every crew member gives 1 action** (Chief Engineer too), or repairs cost a credit on top. To settle in a playtest.

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
