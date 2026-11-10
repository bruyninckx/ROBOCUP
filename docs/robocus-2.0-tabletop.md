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
- Fights: duel, 2v2 (Grand Final, Tag Team, 2 per side), free-for-all (Grand Melee), Mirror (2 copies each), House Robot (Big Mallet, see "The House Robot" below; only when there is room, 4 robots max). Shown in the full-screen view; AI-only, bot and skipped fights run headless.
- Repairs in Upkeep: body parts heal to half for free, then each zone (⚙ Drive, ⚔ Weapon, ⛨ Body) costs one repair action: every crew member gives 1 (Kev, 8 Nov; was Mechanic 1, Chief Engineer 2, Repair Tech 3), and is exhausted for the round; else 2 Cr. Free actions: Aegis Heavy 1 per Upkeep; the losing team 1 next Upkeep (Vulture Salvage 2), replacing the Scrap Crate.
- Intrigue robot cards in 2.0 terms (Secret Upgrade, Overclock, Sugar in the Tank, Smudged Lens, EMP the Garage, Loose Bolts, Rogue Firmware).
- Live combat cards: on (see below). Not yet: online play.

## Team-up Intrigue cards (Kev, 8 Nov: "heavy hitters that need co-op, and a card that blocks any block")

| Card | Family | Type | Gate | Cash-in | Copies | Effect |
|---|---|---|---|---|---|---|
| Public Disgrace | Smear | Scheme | 15 | 2 | 1 | Target −3 fame. |
| Corporate Raid | Corporate | Scheme | 14 | 2 | 1 | Target loses up to 8 Cr, split evenly between the player and every team that backed it (the rest to the player). |
| Override | Leverage | Reaction | 2 | 2 | 2 | Right after any block (Security Bot roll, Firewall, PR Spin, Paid Off, Fall Guy, Under the Radar, Overreach, Sponsor's Lawyers): cancel the block, the scheme goes through. Any team but the target. Only Firewall stops an Override (then the block stands). |

- The gates are above anyone's fame (the game ends at 12), so both schemes always need backing.
- Override is the "block the block" half of Spartacus's Jupiter's Cock (our Firewall is the other half).
- AI: asks for backing on these two even when it is up to 12 fame short; a backer counts its share of a raid as payment; plays Override for its own scheme when the scheme is worth it, and for another team's scheme against a sole fame leader or a team 2 fame from winning. People get an "Override?" prompt in the block window when they hold one (and a "Firewall?" prompt when someone overrides).

## Live combat cards in 2.0 (Kev, 8 Nov)

The 1.0 auction is back in the Bets step: 2 cards turned up per fight, sealed bids while you bet, one card per team per fight, a tie goes to the team with less fame, unclaimed cards are discarded. The bookie ignores the cards. Won cards are for that fight only.

Auction deck (32 cards):

| Card | Copies | Target | What it does (engine `DamageLab.command`) |
|---|---|---|---|
| Swap the Entry | 2 | (Bets step) | after bets: change which robot an invited team sends |
| Floor Spikes | 2 | a spot | red ring for 0.8 s, then spikes for 4 s (0.7 m): 9 chassis damage and 14 to each tyre per second; robots steer clear (replaced Remote Trigger, Kev 9 Nov: it almost never sold) |
| Pilot Waypoint | 3 | your robot, then a spot | drives there for 3 s |
| Target Overclock | 2 | your robot | nitro 3.5 s |
| Field Engineer | 3 | your robot | clears jams, stalls and fire; +18 HP to the chassis and the worst part |
| Oil Canister | 2 | a spot | oil spill |
| EMP Grenade | 2 | a spot | 0.9 s stun, 5 damage, drones off |
| Call the Hammer | 2 | a spot | ceiling hammer after a 1.1 s red warning |
| Floor Launcher | 2 | a spot | launch pad |
| Supply Drop | 2 | a spot | crate: repair (default), shield, nitro or overcharge |
| Chip Hack | 2 | a rival robot | glitch; worse with its lid off |
| Rattle Loose | 2 | a rival robot | top plate loose (30%) |
| Hype Surge | 2 | your robot | rage 6 s |
| Electromagnet | 2 | a spot | pulls robots and scrap there for 2 s |
| Smoke Bomb | 2 | a spot | robots inside are hidden |

- Playing: the fight screen shows your cards in a tray under the arena. Tap a card, then a robot (valid robots glow) or a spot. Esc or tapping the card again cancels. Works with taps on a phone. A team that is not fighting plays "your robot" cards on the side it bet on.
- AI: checks its cards every 0.25 s of fight time, at most one card every 3 s, with simple rules (Field Engineer when jammed, burning or hurt; Overclock and Hype Surge when close; hammer, oil, EMP and magnet on a rival that is not next to its own robot; smoke and waypoint when losing; anything late in the fight). Headless fights (AI-only, fast, skipped) run the same rules step by step, so cards land at the same moment.
- AI bids: the measured swing (`tools/damage-lab/livevalue-results.json`, win % with the card vs 48% without, played blind at 15 s; at least +2) × what the fight is worth to it.
- Online play: on (9 Nov), see "Online fights" below.

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
- To make repairs a choice, crew should be scarcer than that. **Decided (Kev, 8 Nov): every crew member gives 1 action** (Chief Engineer and Repair Tech too). Starting crew = 4 actions, each one a crew member that can't count for Intrigue cards that round.
- **No free Scrapbot (Kev, 8 Nov):** a team that loses its last robot (scrapped by the host, or sold to pay its upkeep) gets no free robot, because a fresh one was sometimes better than repairing the old one. It sits out until it wins a New Robot lot; the Market always offers one while a team has no robots.
- Odds chips on the garage bays can be clicked: the robot's chance against each rival robot on its own (like 1.0's scout panel).

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

## What the robot Intrigue cards are worth in a fight (`tools/damage-lab/cardvalue.js`, 8 Nov)

Same-level robot pairs (every lineup robot as A, sides alternate), each fought twice on the same seed: with and without the card on robot A. The spec changes are the ones the game makes (`fightSpec`, `resolveScheme0`, the Overclock wear at fight end, `Repair2.bodyHeal`). 220 pairs per row; EMP: 200 pairs of robots with a module or one drone/module part (a part robot fights a stock robot one level up). ± is one standard error of the paired swing. Levels = logit change / 0.62. Results: `tools/damage-lab/cardvalue-results.json`.

| Card (what is measured) | Win % without → with | Swing | Levels |
|---|---|---|---|
| Secret Upgrade (+20% dmg, +20% HP) | 51 → 73% | **+21.8** ±3.7 | +1.53 |
| Smudged Lens (−15% dmg) | 51 → 43% | −8.2 ±3.4 | −0.53 |
| Overclock, its fight (hot-wound motors) | 51 → 51% | **0** ±3.6 | 0 |
| Overclock, a later fight (drive motors left at 40%) | 51 → 41% | −10.9 ±3.5 | −0.71 |
| Sugar in the Tank (drive motors at 60%) | 51 → 51% | **0** ±2.9 | 0 |
| Loose Bolts, this round (top plate 30%) | 51 → 51% | −0.9 ±2.4 | −0.06 |
| Loose Bolts after the free Upkeep heal (50%) | 51 → 51% | −0.5 ±2.0 | −0.03 |
| Rogue Firmware chassis (40%) | 51 → 47% | −4.5 ±2.3 | −0.29 |
| Rogue Firmware chassis after the free heal (50%) | 51 → 48% | −3.2 ±2.1 | −0.21 |
| EMP the Garage (one module or drone offline) | 52 → 38% | −14.0 ±4.5 | −0.92 |
| Coolant Leak | no fight effect (exhausts robots) | | |

Why some are zero: drive motors only lose power below 35% HP (then 55% force) or when dead, so 60% motors drive as well as new ones and just have less to lose. Hot-wound motors give +35% force but heat up 1.9× and overheated motors drop to 40% force, which cancels out (5 of the 25 lineup robots are already hot-wound, so Overclock does nothing at all on them). Loose Bolts and chassis damage are Body damage, which barely matters for one fight (as in the damage table above). Rogue Firmware's robot can't fight before the free heal, so its chassis part is the 50% row; the real cost of that card is the sit-out.

**AI card values now follow these numbers** (`aiRobotCardValue` in `prototypes/tabletop-2.html`): credits = |swing| × chance its robot fights (face-down cards stay until the robot fights: 0.85; EMP and Loose Bolts' 30% only this round: 0.5; damage still there at a later fight: 0.5) × the fight's stake (1 fame at the AI's fame rate, weighted by the rival's threat, + 3 Cr for scrap risk and bets). The target robot is the one the card lands on (strongest ready robot), so EMP is worth 0 against a team whose best robot has no module or drones, Overclock is worth less than nothing (its drive damage costs more than the fight gains), and a card already on the robot is worth 0. Rogue Firmware keeps its sit-out value (3 × threat, 1.5 if the team has no ready robot) plus the chassis part. The AI also counts its own Secret Upgrade when it picks which robot to send. Effect in 6 AI games: Secret Upgrade played 14 of 15 times drawn, Rogue Firmware 5 of 7; Smudged Lens, Sugar, Overclock, Loose Bolts and EMP now stay in hand and are cashed in (worth under 1 Cr).

**Proposals for Kev (not changed in the game):**
- **Sugar in the Tank: 60% → 40%** (−10.9 points, the same spec as the Overclock after-damage row). 30% is too strong (−21.8, the motors start weak).
- **Overclock** does nothing in its own fight. Options: no extra motor heat with it, or a different boost (e.g. +20% weapon damage then Weapon damaged); or drop the after-damage. Not measured.
- **Loose Bolts** is almost nothing (top plate off entirely: −2.7). Make it Drive damage instead: **one wheel at 30%** measured −11.8 (lasting until a Drive repair; the free heal doesn't fix it).
- **Smudged Lens** is weak but measurable (−8.2); **−25%** gives −15.9 if it should match Secret Upgrade.
- **Secret Upgrade** is at the top end (+21.8); **+15% / +15%** gives +15.9.
- EMP (−14 per module or drone) is fine where it applies; it is a dead card against teams without modules or drones.

### Round 3: the proposals as BAL options, re-measured (8 Nov, later)

All five proposals are now `BAL.cards` settings (defaults unchanged): `upDmg` / `upHp`, `lens`, `sugar`, `boltsMode: 'lid' | 'wheel'`
(+ `boltsWheel`), `ocMode: 'heat' | 'noheat'` (`noheat` = the engine's new `oc` motor: hot-wound force, normal heat, no extra mass). Card texts
follow the settings. `cardvalue.js` now takes `--cards='{...}'` (the page's numbers), `--conds=` and `--out=`; the proposal run:
`node tools/damage-lab/cardvalue.js 220 0 2 --only=main --cards='{"upDmg":1.15,"upHp":1.15,"lens":0.75,"sugar":0.4,"boltsMode":"wheel","ocMode":"noheat"}' --conds='Secret Upgrade,Smudged Lens,Overclock,Sugar in the Tank,Loose Bolts' --out=cardvalue-new.json`
(same 220 pairs and seeds; base 49.5% on today's engine, was 51%).

| Card | now (default) | proposal | proposal swing |
|---|---|---|---|
| Secret Upgrade | +20% / +20%: +21.8 ±3.7 | +15% / +15% | **+19.1** ±3.8 |
| Smudged Lens | −15%: −8.2 ±3.4 | −25% | **−15.5** ±3.3 |
| Overclock, its fight | hot-wound: 0 ±3.6 | no extra heat (`noheat`) | **+6.4** ±4.1 |
| Sugar in the Tank | 60%: 0 ±2.9 | 40% | **−7.3** ±3.4 |
| Loose Bolts | top plate 30%: −0.9 ±2.4 | one wheel at 30% (`wheel`, lasts until a Drive repair) | **−7.3** ±3.2 |

The AI's card values (`CARD_SWING`) now follow the settings: measured swings per setting (`SWING_AT` for the numbers, interpolated
between measured points; `SWING_MODE` for `ocMode` and `boltsMode`). With Overclock `noheat` the AI also counts it on robots that are
already hot-wound (they lose their extra heat). Variant `tools/bal3/cards_new.json` has all five.

## Level 4 in the tabletop (Kev, 8 Nov: "we need level 4 in the game")

The eight level 4 robots (`docs/robocus-2.0-level4.md`) are in `prototypes/tabletop-2.html`, on by default (`BAL.level4`).

- **Deck and lots.** Each game deals `perGame` (4) of the 8 into their own robot deck (`G.robotDecks[4]`, dealt after every other shuffle, so with level 4 off a seed plays exactly as before). From round `fromRound` (7) the Market gets one level 4 robot lot every `lotEvery` (1) rounds while the deck lasts; it takes a part lot's slot (else a crew lot's, else a lower robot's). Next round's level 4 robot is named a round ahead, like the legendary parts (log + notice, purple). A `robotLevels` scheme may name level 4 too, but only from `fromRound`; a dry level 3 deck still falls back to level 2, never up to 4.
- **Price.** Lowest winning bid `minBid` (5 Cr); a lower top bid leaves the lot unsold (back to the bottom of its deck, so it can come again). The + button jumps straight to the minimum. The tile has a purple ★★★★ LEVEL 4 tag. `upkeep` (default 0, option 1) adds Cr per level 4 robot every Upkeep (the Accountant does not cover it).
- **Robot card and help.** Four stars on the card and on the lid, weapon label, portrait, the lot description, and a one-line lamp tell in the help (`L4_TELL`, e.g. "Strobing lamps = it is about to throw"). LEVEL_HELP mentions level 4 from round 7.
- **Lineup data.** `ROBOTS4` stays apart from `ROBOTS` in `src2/lineup.js`; the tabletop reads both through `ROB()` (levels, decks, power grade). Starters are still only level 0. The Lineup Arena and the tier tools see what they saw before.
- **Fight view.** `src2/view.js` now has the level 4 drawing code from `tools/damage-lab/ui.js` (arms and their chase lights, auger, trebuchet arm, hook and winch line, magnet field and clamp arc, orbit booms and discs, carousel and its tool lamps, legs, lamps). Keep the two copies in step.
- **Repairs.** `Repair2.zoneOfPart`: legs → Drive; arm segments, booms, discs, the carousel tools, coil, auger, winch, throwing arm, turret ring, boom rams → Weapon; the huge chassis → Body. Checked: a Hydra that loses its arm middle and strike head in fight 1 starts fight 2 without them; repairing Weapon brings them back.
- **Strength.** `Repair2.strength` counts level 4 as 4 levels minus `L4_OFF` (0.35), i.e. level 3 + 0.27 logits (the measured 59% vs level 3; level 4 is no stronger than level 3 against levels 0-1). The AI values a level 4 lot like a legendary (base 6) plus its level and odds, and bids at least the minimum or nothing.

### Sim: level 4 on vs off (40 games each, seeds 1-40, start 0, win 12, AI v2)

| | L4 on | L4 off |
|---|---|---|
| rounds: mean (median) | 11.5 (12) | 10.7 (11) |
| close finish: runner-up within 1 / 2 fame | 63% / 90% | 50% / 78% |
| win share by seat 1-4 | 18 / 28 / 28 / 28% | 8 / 35 / 30 / 28% |
| Market spend / game | 128 Cr | 106 Cr |
| robot price L1 / L2 / L3 / L4 | 4.7 / 5.4 / 4.4 / 6.9 | 4.7 / 5.2 / 5.2 / - |
| bookie favourite wins (all fights) | 62% | 68% |
| page errors | 0 | 0 |

- **Lots:** 5.0 level 4 lots a game, 75% sold (round 7: 39 of 40, round 10: 24 of 37, round 11: 14 of 25), 6.9 Cr on average (5-9). Every game reached round 7. Robots that get scrapped go back to the deck, so more than 4 lots a game is normal.
- **Buyers** (fame rank when the lots sold, ties count as the higher rank): leader 38%, 2nd 19%, 3rd 21%, last 22%.
- **Fights:** 3.2 a game have a level 4 robot (Hydra 35 fights, the others 18-24). A side with a level 4 robot wins 56% (167 sides, all formats); duels are few (L4 vs L1 75% of 8, vs L3 44% of 9). 26 of 40 winners own a level 4 robot at the end.
- **Bookie, fights with level 4:** level 4 sides rated 53%, won 56%; favourite wins 62%. Close enough, so `L4_OFF` stays 0.35. The bookie's high bands (70-90%) win less than rated in these fights, as in all fights.

Round 2 variants for the PC run are in `tools/bal2/` (`tools/run-sims3.cmd`).

## Robots no longer land on their side (Kev, 8 Nov, later)
It looked wrong in the top-down view. A hard landing now ends right side up or upside down (same build-based odds as the old side landing's settle), in the engine, the fight view (`src2/view.js`: no edge-on drawing, no "ON ITS SIDE" chip) and the Damage Lab. No card or help text in the tabletop mentioned it. Balance check: `docs/damage-lab.md`, "On its side removed".

## The House Robot: Big Mallet (Kev, 8 Nov, later)
"Unleash the House Robot" (Intrigue, host only) now reads: *A huge house robot with a giant hammer joins in. It rarely lands a hit, but when it does it hurts. Robots keep away from it.* (prefixed "Host only:").
- The robot is the engine preset `Big Mallet` (`HOUSE_NAME`, house colours from the preset; engine details and measurements in `docs/damage-lab.md`, "The House Robot"): huge, slow, patrols the middle, winds up for 2 s with a red ring and strobes, lands about 1 swing in 10, about 95 damage and usually the lid when it does. Other robots keep away from it.
- Rules: neutral, as before, but the fight now ends when one team is left (it doesn't have to be beaten) and the judges only score teams. If it outlasts every team: nobody gets fame, bets refunded.
- Bookie: the House Robot no longer takes a share of the odds (it almost never wins); with it in, the sides' strength gaps are shrunk (`HOUSE_ODDS` 0.8), because the favourite wins 4-6 points less often with it in.
- Help: the banner's 🏠 help explains it; the fight panel shows it as "House · neutral".
- AI: `aiCardValue` gives it 3 when its own best ready robot is weaker than the other teams' average best (the House Robot shakes the odds up), else 1.5; in the Host step it plays it 80% of the time when that value is high, else 25% (was a flat 50%; the card used to be cashed in, 0.0 plays a game).

## Damage bet: tried and dropped (8 Nov)
A side bet on how much a fighter loses (no parts / 1–2 / 3+ or KO'd) was tried on 8 Nov and dropped (Kev: too complex): with fixed payouts and no odds it can be farmed using the public odds (the loser almost always ends 3+ or KO'd, a strong favourite often loses nothing).[^dbet]

[^dbet]: Real bands of every fighter (20 AI games, 222 fights, 644 fighters, all formats): no parts lost 12%, 1–2 lost 18%, 3+ or KO'd 69%. Duel 15 / 23 / 62, 2v2 11 / 16 / 74, double 11 / 17 / 72; winners 24 / 34 / 41, losers 0 / 2 / 97; bookie p < 0.3: 4 / 9 / 87, 0.3–0.45: 8 / 13 / 79, 0.45–0.55: 5 / 19 / 76, 0.55–0.7: 12 / 22 / 66, > 0.7: 29 / 30 / 41. 150 open-floor lineup duels: 19 / 20 / 61 (favourites 29 / 23 / 48, underdogs 10 / 12 / 79). A flat 2× let the AI net +33 Cr a game on "3+ or KO'd"; fixed 7.5× / 5× / 1.25× (a blind bet returns 0.87–0.92) still netted +27.5 Cr a game, from "no parts lost" on favourites.

## Round 3 (Kev, 8 Nov, later): new defaults, trade-in, seat fix

**New defaults** (`BAL_DEFAULT` in `prototypes/tabletop-2.html`; every key in `docs/robocus-2.0-sim.md`): round 2's `combo`, the best of the
PC run (`tools/bal2/combo.json`: 52% of damage fixed, 30% of fighters carry body damage, close finish 56%, fights 58 s):
- Market lot deck: 7 New Crew lots (was 4); fewer drones and modules (Medic drone 1, Energy shield 1, Laser drone, Waller, Blocker and
  Spotter 0 copies).
- Robot levels `gradual`: round 1 level 1; round 2 level 1 or 2 (2:1); round 3 1 or 2 (1:2); round 4 2 or 3 (2:1); round 5 2 or 3 (1:2); round 6+ level 3.
- Repairs: a broken zone costs 2 actions; only engineers (Mechanic, Chief Engineer, Repair Tech) repair.
- Start crew: 2 Mechanics, an Accountant and a Market Analyst (was 3 Mechanics and a Chief Engineer).
- Crew deck: 3 Mechanics, 3 Chief Engineers, 2 Repair Techs, Accountant, Hacker, Analyst, Fixer, Security Chief.
- Level 4: from round 6 (was 7), all 8 level 4 robots in the pool (was 4 of 8), still one lot a round, lowest winning bid 5 Cr.
- The robot lot help now reads the level scheme from `BAL` ("Robot levels by round: level 1 in round 1, level 1–2 in rounds 2–3, ...").

**Trade-in on a full garage** (`BAL.tradeIn: { on: true, base: 1, perLevel: 1 }`). You may bid on a robot lot with 3 robots. If you win it,
you scrap one of your existing robots (not the new one): you get 1 Cr + its level, its fitted parts go to your Stash, and a Fan Favourite
takes its fame with it (`robotLeaves`, reason `trade-in`). Vulture Salvage gets its +2 Cr, as for any scrap. A Stash over 4 parts: you
pick what to sell to the bank at half value (AI: it keeps the most useful). The scrapped robot goes back to its robot deck.
- People: after the Market resolves, the prompt says "Your garage is full: pick a robot to scrap for <new robot>", one button per robot
  with its level, scrap money, parts, damage and a Fan Favourite tag; then (if needed) "Stash full: sell N to the bank". The robot lot tile
  says "♻️ Full garage: you'll scrap one robot" (help: the scrap money per robot). The state is in `G.ps[seat].tradeIn` / `stashTrim`
  (saves and online snapshots carry it; Continue waits for it; the host's skip and the AI takeover pick the weakest).
- AI: values the lot as the new robot's value − half the value of the robot it would scrap (its weakest by `Repair2.strength` with its
  damage and without its parts, which it keeps; a Fan Favourite only if it is more than a level weaker than the next) + the scrap money.
- Log: "♻️ Team trades in X for N Cr (its parts go to the Stash) and takes Y."; events `scrap` (reason `trade-in`) and `trade_in`.
- Before: a full garage got 2 Cr and the robot went back; the AI valued such a lot at 1 Cr.

**AI robot values** (`robotWant`): from `Repair2.strength` instead of the bookie's odds vs the field: `robotVal(s) = 3.64 + 2.2 s`
(about L1 5, L2 6.4, L3 7.7, L4 8.3 + 0.6 level 4 bonus), + 1.2 per logit it would be stronger than the team's best (− 0.6 per logit
weaker, capped), + 3 with no robot, + 1 with one robot, + a little for its odds vs the field; full garage: the trade-in value above.

**Seat fix** (`BAL.seats.fairTies`, default on; off = the old order). Kev's PC run had seat 1 winning 20.5% and seat 4 30.5% of 600 AI
games. Cause (an AI and tie-break artefact, not the board): every tie between teams went to the lower seat index (stable sorts and
`a.i − b.i`), so on equal fame the lower seat was "the fame leader": it was smeared more (fame lost to cards by seat in 260 earlier games:
−0.88 / −0.88 / −0.81 / −0.63), the AI host gave it the hardest matchup, other teams blocked its publicity cards, Grand Final and market
stalemates broke ties against or for it by index; the AI also reacted in seat order (first to block, back, Override, Pile-On), and round 1's
Intrigue always started at seat 1. Now ties follow `G.tieOrder`, a seat order shuffled every round from the game seed (no game dice, so
deals are unchanged), the AI reacts in that order (people still first), round 1's Intrigue starts at a random seat, and the open market
loops in that order.
- Check (60 games each, seeds 1–60, same seeds): new defaults with the fix (`o3_base60`) 23 / 25 / 15 / 37%, final fame 9.5 / 9.6 / 8.9 / 9.9;
  the same with the old order (`o3_seatsold60`) 27 / 27 / 32 / 15%, final fame 9.4 / 9.8 / 10.3 / 9.7. The standard error is ±5.6 points
  per seat, so 60 games can't show a 10-point spread either way (the old order didn't reproduce it in 60 games). Kev's PC run of
  `tools/bal3/base` vs `seats_old` (100+ games each, better 300) is the real test. Not found as a cause: the starter draft (dealt and
  picked at the same time), sponsors (random), fight sides (side 1 wins as the bookie says), the fight-card auction (no seat tie-break).
- Still seat-shaped, not explained: in the older games seats 1–2 won more round-1 lots (0.98 / 0.89 / 0.60 / 0.56 a game) and won fewer
  2-per-side fights than the bookie said (seat 1 −8 points in doubles); both may be noise.

## AI spending (8 Nov, later; Kev's playtest: an AI held 61 Cr by round 10)

The AI's lot values were fixed amounts (robot 5–9, part about 2) however much it held, so a rich AI never spent more than about 8 Cr a
round. Now (`aiReserve`, `aiSurplus`, `aiSpendMult` in `prototypes/tabletop-2.html`; params in `AI_PARAMS`):
- **Reserve** = `reserve` (2) + `spendRes` (3, bets and reactions) + next Upkeep's shortfall (robots, level 4 upkeep and drones minus
  Mechanic income) + debt + the larger of: repair credits its two likeliest fighters need beyond its crew and free actions (damaged
  drive / weapon), or a **war chest** when it is within `spendLate` (3) fame of the win (the richest rival's credits + 1: the host bid at
  match point is worth all its credits, and that is what hoarded credits win). **Surplus** = credits − reserve.
- **Willingness to pay** = value × min(1 + `spendCap`, 1 + `spendK` × surplus / 10) (defaults 0.3 and 0.4: at most +40%, reached at
  13 Cr surplus). Spending only adds to the old bids: the sealed lot bids are first made exactly as before (old reserve and budget); then,
  in a second pass, each lot it bid on and values at 1+ gets up to bid × (factor − 1) extra, at most `spendShare` (half) of the surplus per
  lot, highest value first, paid only from what is left above the full reserve after the base bids. Rebids go up to the same raised value.
  Host bid and fight cards (when it fights or bets): raised the same way, but only from the surplus above `spendMkt` (8 Cr), so they don't
  take next round's Market money.
- **Repairs**: with a surplus above `spendMkt` it also pays `BAL.repair.credits` per action once crew and free actions are used up for
  damaged (not only broken) weapon and drive zones of its two likeliest fighters, and for body zones once that surplus is `spendBody` (6)+.
  (Repairs come at Upkeep, before the Market: without the `spendMkt` keep they starved the Market.)
- War chest: at most `spendWar` (12 Cr).
- Surplus 0 (or `spendK` 0) = the old AI exactly; no random numbers are drawn, so `spendK: 0` replays the same games.
- Benchmark switches: `off: ['spend']` (all), `spendLots`, `spendHost`, `spendCards`, `spendRep`.
- Measured (`docs/robocus-2.0-sim.md`, "Credits"): the Market gets 9 Cr a game more and sells as many lots as before (23% unsold; parts and
  crew 14.1 / 6.0 a game vs 14.7 / 5.8); robot prices within 0.5 Cr; credits held at round 12: 11.0 a team (before 12.9); the richest team
  late holds 22 Cr instead of 27 (max 39 vs 68). One spending AI vs three old ones wins 20% (same AI: 23%; within noise). The first version (v1)
  added the extras inside the bid loop and paid credit repairs from any surplus: 40% of lots went unsold.
- Every credit change is now logged (`cr` events: team, amount, source) for the sim and for playtest logs.

## Bug fix: parts won together with a robot were lost (Kev's playtest, 8 Nov)
Round 2: a team with no robot won Whirlwind + Laser drone + Power kit in one auction. The results said "▼ Click a Robot Bay below" for
both parts, but they could not be fitted and were gone. Cause: `resolveMarket` built the person's install list before any lot was
applied; with no robot, nothing "could take" the parts, so they were left out of the list, and a moment later (Whirlwind now in the
garage) they were marked "Click a Robot Bay" instead of going to the Stash. Fix (`applyMarketWins`): robots, crew and other lots first,
then the parts: fitted (AI), queued for a bay click (people), or into the Stash. Continuing with parts still waiting puts them in the Stash
(log line "keeps … in its Stash (not fitted)"; over 4: the stash-trim prompt); leaving the Market by any other path does the same
(least useful parts to the bank if over 4). Also fixed: a botched part was still installed or queued. Test: `node tools/market-install-test.js`
(seat 0 as a person with real bay clicks: fit both, continue without fitting, continue with a full Stash; plus the AI path).

## Next steps

1. Fork the 1.0 game loop into 2.0: starter draft, Market auctions with robot levels in waves, part cards (2 parts + 1 legendary), Intrigue, bets, hosting, crates. Use the 1.0 rules as the reference, with 2.0 wording where cards mention stats.
2. Strength table for the bookie and the AI (robot strengths, part values, condition).
3. ~~Live cards on the new engine~~ (done 8 Nov). Tune the card values once more fights are measured.
4. Online play: the host streams fights.
5. Decide how the levels are spread over the auctions.

## Balance overhaul: notes to take along (Kev, 8 Nov)

- **Too many modules and drones in the Market?** Checked: the lot deck is 30 cards: 10 drones, 6 modules, 6 stat parts, 4 robots, 4 crew. With 4 lots a round that is about 2 drone/module lots every round, so they stop feeling special. Kev wants fewer.
- **More special engineers in the lots.** Crew are 4 of 30 lot cards (about 1 every 2 rounds), and the crew deck has 2 Mechanics, 2 Chief Engineers, 1 Repair Tech and 5 non-repair crew.
- **Repairs should hurt more** so engineers matter. Sim baseline: 4 crew per team vs 1.5 damaged zones, 89% of damage fixed, almost no damage reaches the next fight, credits pay for repairs about 0 times.
- **Robot-stat Intrigue cards** (Kev, 8 Nov: fold into the overhaul; measured swings in the card-value section): candidates are Sugar in the Tank 60% → 40% (−11), Loose Bolts → one wheel at 30% until repaired (−12), Smudged Lens −15% → −25% (−16), Secret Upgrade +20% → +15% (+16), Overclock needs a real boost in its own fight (not measured). Until then the AI cashes in Sugar, Lens, Overclock, Loose Bolts and EMP (no modules/drones) instead of playing them.
- Other sim reads: fight cards sell cheap (1.1 Cr, 45% sold), robot prices barely rise with level (4.8 / 5.2 / 5.5 Cr), Intrigue cards out-earn fight wins as a fame source.

## Online fights: same fight on every screen (9 Nov)

Plan: every browser runs the fight itself from the seed, like 1.0 (the host sends the seed, the builds and the live cards with
their step). That needs no fight stream, but only works if the physics comes out bit for bit the same everywhere.

- **Found:** it did not. Chrome 153 and node 22 (an older V8) already round `Math.sin`, `cos`, `atan2`, `exp`, `pow`, `log`, `tan`
  differently in the last bit, so even two Chrome versions would drift apart within seconds of a fight.
- **Fix:** `tools/damage-lab/dmath.js` (copied to `src2/dmath.js`): deterministic versions of those functions (fdlibm kernels,
  only + − × ÷ and `sqrt`, which IEEE 754 makes exact everywhere), about 1 ulp from the native ones. It replaces the `Math`
  functions page-wide and must load before planck.js (planck keeps its own `Math.sin` / `cos` / `atan2` from load time). The
  pages load it first; in node `engine.js` installs it before requiring planck. The engine warns in the console if it is missing.
- **Result:** node 22 and Chrome 153 now give the same code on all 23 test fights. Every fight plays differently than before
  9 Nov (once); the game balance is unchanged (same physics, different last digits).
- **Check:** `prototypes/sync-check.html` runs 23 fixed fights (duels, level 4, 2v2, free-for-all, House Robot, live cards) and
  shows one code; reference `5185270f` (maths code `2cd6141c`). Open it in Firefox, Edge, Safari and on phones: the same code
  means that browser plays fights the same. Node: `node tools/sync-check.js`.

### Online play in 2.0 (9 Nov)

- `src2/net.js`: a copy of 1.0's `src/net.js` (lobby, rooms, snapshots, actions, pause/rejoin, save/load) with its own room
  names (`robocus-v2-`, so 1.0 and 2.0 rooms never meet) and a version fingerprint over the 2.0 engine. Loaded at the end of
  `tabletop-2.html`; the 🌐 badge in the top bar opens it, as in 1.0.
- **Fights:** the host keeps the engine's create options in `F.bb` (seed + every robot's build) and every live card in
  `F.cmdLog` with the step it lands on (`LIVE_LEAD` = 30 steps, 0.25 s after it is played). A client builds the same fight
  from `F.bb` (`fightFromBB`), queues the cards, and its fight view follows the host's step (`clientPace`): the host sends its
  step 4× a second, the client measures the host's speed from them (slow motion, 2×, pause) and estimates where the host is now,
  6 steps behind. The client's view runs on its own clock and eases towards that: 0.6× to 1.5× speed, a quick catch-up when
  more than 2 s behind (Kev, 9 Nov: the first version held whenever it got 0.2 s ahead, so it stuttered 4× a second; measured
  after the fix: no jumps, 3–9 steps behind the host). The countdown runs on its own clock. No speed, pause or skip buttons
  on a client. A card that arrives after its step replays the fight from the start with every card (`resims`).
- A person's live card on a client goes to the host (`act('combatCard', …)`); the host checks it and plays it for everyone.
  The AI's cards are decided on the host only.
- **Check:** the fight's fingerprint (`fightHash`) is taken at the step the fight ends (`S.endHash`; the view runs on a few
  seconds after a KO). Every client compares its own with the host's; a difference counts as a desync in its playtest log.
  A fight a client never saw running (skipped, or a test bot) is run there in one go and compared too.
- A host in a background tab: the browser stops the fight view's frames, so the game's own timer steps the fight there.
- **Tests:** `PAGE=tabletop-2.html node tools/mp-test.js 3 5 10` (host + 3 bot players, fights headless) and with `WATCH=1`
  (fights shown in real time on every screen, the test bots play their own live cards from their screens). 9 Nov:
  - full games: no desyncs in any fight (6 headless; 11 and 5 shown live), no resims;
  - chaos run (drop-out + rejoin, host skips a player, a player leaves for good and the AI takes over, save loaded into a new
    room): all passed.
- Fixed on the way (also in solo play): the fight view had two functions called `fire`, so burning robots "played a card"
  instead of showing flames (and cancelled a card you were aiming); two `wrapLines` on the board (card texts weren't cut to
  5 lines); a second call into the host's spare-or-scrap step could crash after a slow player; a test bot in a room no
  longer plays a solo game before it connects.
- Not tested here: real PeerJS/WebRTC between PCs (the cloud sandbox has no internet), as with 1.0.

## We Have Your Number: the bounty card (Kev, 9 Nov)

- Intrigue scheme, Sabotage family (harmful: a Security Bot can block it), fame gate 2, 3 copies, cash-in 1 Cr.
- Effect: the target team's best ready robot (else its first robot) gets a bounty (`r.bounty = { by, round }`). A robot carries
  one bounty at most. It stays on the robot when it is traded; it goes with the robot when the robot is scrapped.
- Payout: when a marked robot is on the losing side of a fight, every winning team (not its owner) gets +`BAL.fame.bounty` (1)
  fame (source `bounty`), then the mark is gone. The House Robot winning pays nobody and the mark stays.
- Board: a red "🎯 BOUNTY +1 FAME" strip across the top of the robot's picture (hover help says who placed it).
- AI: values it at the bounty fame × its fame weight × (0.6 + the target's threat); an AI host adds +0.08 to its odds against a
  team with a marked robot when it decides whether to fight it itself. A team that is invited still chooses which robot to send,
  so a marked robot can be kept out of fights (at the cost of not using it).
- First AI games (6): drawn 3.2, played 2.2, landed 1.2 per game; bounties paid 0.7 fame a game.

## Level gap test (Kev, 9 Nov)

`BAL.levelBoost` (default 0): every level's power grade (weapon damage and HP) × (1 + levelBoost) ^ level, so every step
between neighbouring levels gets the same boost (`src2/lineup.js` `grade`; the strength model adds 2.85 × ln(1 + boost) logits per
level, so the bookie and the AI see it). Duels of every robot against every robot one level below, both starting sides
(`gap.js` in the session notes; 100–216 fights a row, ±3–4 points):

| boost | L1 vs L0 | L2 vs L1 | L3 vs L2 | L4 vs L3 |
|---|---|---|---|---|
| none | 65% | 61% | 65% | 62% |
| flat 1 + 0.1 × level | 75% | 66% | 68% | 60% |
| flat 1 + 0.2 × level | 76% | 78% | 81% | 69% |
| compounding 8% per step (`gap8`) | 72% | 67% | 67% | 68% |
| compounding 15% per step (`gap15`) | 75% | 77% | 78% | 69% |
The flat version widened the low gaps most, so the setting compounds. Game test: `tools/bal4/gap8.json` and `gap15.json`.

## End credits (Kev, 9 Nov)

When a team wins, every screen shows **the end credits**: a panel of awards with a bit of banter. The host keeps a tally during the
game (`G.stats`: wins per robot, the biggest upset and the biggest flop by bookie odds, attacks landed / blocked / received,
bounties, credits by source, credits each team handed each other team (deals, backing fees, host deals), schemes backed, fights
lost to each team, live cards, robots the host scrapped) and turns it into `G.awards` at the win (plain data: the same on every
screen; the line for each award is picked from a few, seeded by the game). Awards (only the ones that happened):
Robot of the Game, Biggest Upset, Missed the Big Shot (lost as the biggest favourite), Kingmaker (who helped the champion most:
credits + 2 x backed schemes + 2 x fights lost to it), Bounty Hunter, Backstabber, Most Wanted, Talked to the Wall (blocked
attacks), Big Spender, Lucky Punter, Donated to the Bookie, Left It All on the Table (credits + unused cards at the end, not the
champion), Played Like GPT-2 (last place, with what went wrong), Card Shark, Scrapheap Regular. `ROBOCUS_DEBUG.makeAwards()`.

## Arena layouts (Kev, 9 Nov)

The host picks the arena when it invites (a menu next to "Invite Fighters"; an AI host picks one that helps its own robot when
it fights, else now and then one for the show). Open floor is free; the others cost the host `BAL.arenas.cost` (1 Cr). The invited
teams see the arena before they choose a robot; the bookie counts it. The Cage falls back to open floor with more than 2 robots or
the House Robot (the host gets its credits back). Engine `ARENAS` (`tools/damage-lab/engine.js`): open, saws (4 floor saws),
killbox (spiked walls + 2 saws), and new: **cage** (walls start 1 m in: 6 x 6 m, spawns moved in) and **ice** (grip x 0.4 for
wheels and tracks; legs keep their grip). Open floor fights are unchanged (`l4-regress.js` identical).

How the arenas change the order (`tools/damage-lab/arenafit.js`: each lineup robot against every robot of its own level, both
sides, 2 seeds; 16-32 fights a robot an arena, so ±12 points). Average fight: open 58 s, saws 66 s, killbox 57 s, cage 56 s, ice 57 s.
Examples (win % vs its own level): Whaler 19 open / 69 saws; Rocketeer 35 / 80 saws; Pincher 81 / 38 saws; Forklift 81 / 44 saws;
Juggernaut 69 / 38 saws and cage; Brawler 38 / 75 saws and ice; Gyro 25 / 56 killbox. The tabletop's `ARENA_FIT` keeps every
robot's change in logits x 0.5 (shrunk for the noise); the bookie and the AI host use it.

## Tuning chips (Kev, 9 Nov)

Three new part cards (`kind: 'chip'`, 1 copy each in the lot deck, a part slot, one chip per robot). Routines worked out for light
robots; on heavier frames they can overload: every 4 s a chance of a 1 s glitch by level (0 / 0 / 15 / 30 / 45%), "not made
for this frame". The robot drives as it always does; the chip takes over for its move and pays off when the move works:

| chip | move | pay-off (`CHIP_K`) |
|---|---|---|
| Matador | a charge from the front: sidestep at the last moment ("OLÉ!"), then hit its side | x3 damage in the 0.9 s counter |
| Wall Bait | drifts in front of a wall or hazard when the enemy is far; sidesteps a charge there ("BAITED!") | the enemy ending up against the wall or a hazard is dazed 2 s ("CRASH!"), then x2.4 in the counter |
| Pester | after a hit, fade out sideways; never drives into the front of a front weapon or spinner | x2.4 on side and back hits ("PESTERED!") |

Measured (`tools/damage-lab/chipfit.js`: every level 1 robot with the chip vs every level 3 robot, both sides, 2 seeds, 120 fights;
`chipdiag.js` counts the moves): level 1 vs level 3 without a chip 22.5%; Matador 37.5%, Pester 43%, Wall Bait 27.5% on open floor
(32% on Floor Saws, 33% in the Cage, 24% vs 17% in the Killbox). On level 3 vs level 3 a chip is about neutral (50-51% vs 47.5%;
3.5-3.9 overloads a fight). The first versions took over the steering and made robots worse (9-13%); movement alone did not close
two levels, so each chip got a pay-off for its move. The strength model counts a chip as +0.8 logits on level 0-1, +0.4 on level 2,
0 on level 3, -0.2 on level 4 (`src2/repair.js` `CHIP`). Wall Bait is the weakest and the most arena-dependent: first to tune.


### Chip slot and chip release round (Kev, 9 Nov, round 6)

Two settings: `BAL.chips.slot` (true = a chip has its own slot: 2 parts + 1 chip + 1 legendary per robot; the robot card
shows "Parts n/2 · 💾 chip") and `BAL.chips.fromRound` (chip lots go to the bottom of the lot deck before that round).
Defaults unchanged (part slot, round 1) until Kev decides. Sim variants: `tools/bal6/` (`tools/run-sims6.cmd`); results in
the sim doc (round 6, 100 + 40 games each): an own slot from round 1 gives clearly fewer close finishes (39% within 1 fame vs
52%); releasing chips from round 4 recovers most of that but puts chips on heavier robots (average level 0.8 → 1.2). The bookie
overrates chip robots by 4-8 points while chips sit on light robots.

## Fight speed (Kev, 9 Nov)

Fights play at 2x by default (`src2/view.js` `V.speed`; 1x and 4x stay on the host's buttons). Online, only the host has
the speed, pause and skip buttons; the host sends its speed with every fight tick (`fightTick().sp`) and every other screen
plays at it, so live cards land at the same moment for everyone (tested: the client stays within about 15 steps, 0.1 s).

## Lineup Arena: matchup overview (Kev, 9 Nov)

`prototypes/lineup-arena.html` has the three tuning chips in the part picker (one per robot, with the glitch warning on
level 2+) and a matchup overview: every robot against every robot, 20 fights a pair (half on each side), as win %, the
winner's health or knockouts; open floor for all 33 robots, the other four arenas within each level. Data:
`tools/damage-lab/matrix.js` (per fight: winner, winner's health, KO, seconds, loser's health) and `matrix-merge.js` into
`matrix-data.json`, inlined by `build.py`. Health = all parts of the robot (torn off = 0): the chassis alone stays near 100%
for most winners, because most knockouts are lost wheels, a crippled drive or a flip.

Below the grid: the even matchups (8-12 of 20) sorted by the winner's health ("even on paper, one-sided in the pit") and the
even ones where the winner is badly hurt too (nail-biters). See "Matchup overview results" below.

### Matchup overview results (9 Nov; 10,560 open-floor fights + 1,980 per other arena)

- Fights are mostly one-sided: on the open floor the winner keeps 79% health on the median, the loser 36%; 94% end in a
  knockout. Even matchups (8-12 of 20) are no closer: their winners keep 72% on average.
- Higher level wins 63% (one level up), 71% (two), 77% (three), 86% (four).
- The swingiest robots (winner's health in fights they are in, share of blowouts with 85%+ left): Snapjaw 85 / 61%,
  Thwacker 83 / 53%, Popcorn 81 / 42%, Angler 81 / 50%. Snapjaw is in 6 of the 12 most one-sided even pairings
  (Popcorn vs Snapjaw 10-10 with the winner on 86%, 15 blowouts of 20): flips and the crusher end fights fast.
- The slugging robots: Sawblast (winner 67%, 7% blowouts, 30% close fights), Mincer, Buzzkill, Forklift, Vertigo,
  Whirlwind. Nail-biters: Juggernaut vs Sawblast, Buzzkill vs Wrecker, Pincher vs Sawblast (the winner on about 60%).
- Arenas barely change it: same-level winners keep 71% (saws, the closest) to 75% (cage, ice); Popcorn vs Snapjaw is
  the most one-sided even pairing on four of the five arenas.

## Crew = Mechanics only (Kev, 9 Nov, round 7)

Kev: too many crew cards, too much fiddling for too little fun. New defaults (variant `mech_few` in `tools/bal7/`): start with 2
Mechanics, the crew deck is 4 Mechanics (4 crew lots in the lot deck, was 7), and only your first robot pays upkeep
(`robotUpkeep: 'first'`, the old Accountant rule for everyone: every team started with an Accountant). The other crew kinds stay
in the code (`CREW`) but are no longer dealt. Round 7 (Kev's PC, 100 games each): runner-up within 1 / 2 fame 48 / 75% (was
50 / 71%), fame gap 5.8 (5.0), credits held 8.5 (8.8), damage fixed at Upkeep 43% (52%), lots unsold 30% (24%), 11.1 rounds
(11.7). Intrigue cards that pay per crew member (Overtime Shift, Consulting Gig) pay less now (card income about −20 Cr a game).

## Bookie notes on robot cards (Kev, 9 Nov)

Up to 2 small tags next to the weapon on a robot card, only where something stands out (hover for the numbers):
arena tags for this fight's arena (🪚 Saw specialist / Hates saws, ☠️, 🔒, 🧊; when `ARENA_FIT` is ±0.45 or more), 💾 Chip-tuned
(a chip on a level 0-1 robot) and one fight-style tag from the Lineup Arena matchup data (`STYLE`): 🗡️ Giant killer (Thwacker,
Whirlwind, Vertigo, Ramrod: 1.25x the expected wins against higher levels), 🎲 Coin-flip brawler (Snapjaw: 61% blowouts),
⏱️ Quick finisher (Rocketeer, 35 s), 🧱 Grinder (Pincher, Wrecker, Gyro: 70 s+). The bounty already has its own badge.
The bookie's chip boost is lowered (`src2/repair.js` `CHIP` 0.55 / 0.55 / 0.25 / 0 / −0.2, was 0.8 / 0.8 / 0.4).

## Layout B: the Workshop Bench (Kev, 9 Nov)

Kev picked layout B of the four layout boards, and the card-type sheet. The tabletop now uses it in full; the robots are drawn as before.

**Seven fixed zones.** Only the pit and the sticky note change with the phase, so you always know where to look.

1. **Top bar.** Round and seat, the 8 steps (0 Draft … 7 Fate), one dot per team (green: done; pulsing: we wait for them; ringed: their turn), the close-to-winning pill, the seat picker and the Online badge.
2. **Rival tickets.** One per rival, in seat order after you. Each shows the fame bar, credits as coins, sponsor, cards in hand, Security Bots, Stash and crew. It also shows the three robots: picture, level, Fan tokens, weapon, one bookie note, damage and the odds chip. A ticket is a drop target for cards and a pick target for the host.
3. **The pit.** A dark frame, a title strip (phase and a short note), and a concrete floor with hazard tape. The phase stage fills the whole floor: draft, fame race, Intrigue ring, market lots, bookie, recap.
4. **Sticky note.** Under the pit: what to do now and the button that moves on. It reads "YOUR MOVE", or "AT THE TABLE" when there is nothing to click.
5. **Your rail.** Team header (fame, coins, crew, Security Bots, sponsor), your robots as work orders, then the Stash.
6. **Hand drawer.** Under the rail. The cards spread to the rail's width.
7. **Log.** A side panel on the left, the full height of the bench (Kev, 9 Nov: he liked the log on the left better; the pit is a little smaller for it).

**No wasted space** (Kev, 9 Nov). The bench is as wide as the screen's shape allows, from 1400 to 2000 world px. On a wide screen the tickets and the pit get wider; the rail keeps its width. The stage stretches to the floor, and the panels in it are centred.

**Phones.** The sticky note, the Stash (only when it has parts) and the log (collapsed) stack under the top bar. The camera follows the stage, one of your robots, or the tickets with the rail, as before.

**Card types** (hand, the card shown when played, the fight card auction). The type is the big signal: its colour, shape and a corner tag for when you play it. The family (what the card does) is the small chip under it.

| Type | Look | Corner tag |
|---|---|---|
| Scheme | blue, square | INTRIGUE |
| Reaction | orange, cut corner | ANY TIME |
| Face-down | purple, dark and hatched | ON A ROBOT |
| Security | steel, rounded corners | BLOCK |
| Fight card | hazard stripes, dark face | LIVE |
| Arena | olive, square corners | HOST STEP / BETS STEP |

**Market lots** are framed by kind:

| Lot | Look |
|---|---|
| Robot | green |
| Level 4 robot | purple |
| Part | teal |
| Tuning chip | cyan with a circuit grid, round icon |
| Legendary | gold with a double frame |
| Crew | brown, rounded bottom |
| Hosting | ink |

**Fight screen** (src2/view.js; only the tabletop uses it). Light bench colours and paper fighter cards with a team-coloured top. The arena sits in the dark pit frame with the moments under it. The fight cards are on hazard stripes. A side card (`opts.info`) lists the bets, the bookie's odds and what comes next (7 Fate).

**Fonts.** Saira Stencil One (names, titles), IBM Plex Sans (text) and IBM Plex Mono (numbers), from Google Fonts. Without internet the page falls back to the system fonts.

**Checks** (9 Nov):
- Screenshots of every phase at 1440×900, 1280×720, 1920×1080 and 390×844 (phone).
- game-sim: 4 games, 0 page errors, no stalls.
- mp-test: 4 seats, 0 desyncs, 0 errors.
- sync-check: unchanged (the engine was not touched).

## Bookie bands only, doubt marks, hard hitters, damage chart, money lines (Kev, 9 Nov)

- **No bookie percentages.** The board shows only the bands: Heavy fav, Favourite, Even, Underdog, Heavy dog.
  - A part's effect reads as a band change ("Even → Fav"), or ▲ / ▼ inside one band.
  - The awards say "as a heavy underdog" instead of a number.
- **??? = the bookie isn't sure.** The odds chip and the bets get "???" when the robot:
  - has a tuning chip and is level 0-1 (the bookie reads chips badly),
  - is a coin-flip brawler (Snapjaw), or
  - carries face-down cards.
  The hover help says why.
- **🔨 Hard hitter.** A bookie note for robots that leave the winner badly damaged even when they lose. It comes from the Lineup Arena matrix: equal-level duels on the open floor, the winner's health loss when this robot loses, 6+ points over its level's average.

  | Robot | Winner loses | Level average |
  |---|---|---|
  | Wrecker | 32% | 24% |
  | Buzzkill | 31% | 24% |
  | Whirlwind | 37% | 28% |
  | Sawblast | 42% | 30% |
  | Angler | 31% | 25% |
- **Damage chart in the recap.** It plots each robot's damage over the fight time: 100 minus the fight screen's health bar, sampled every half second. Grey bars show all damage done per 5 s; ticks mark cards played.
- **Money in the log.** Every credit change (addCr / payCr, the upkeep ledger) is gathered per action and written as one 🪙 line: team, amount, what for. It is written on the host or in solo play; not in AI-only test games.
- **We Have Your Number.** It only goes on a rival robot with 3+ Fan tokens and no bounty yet; otherwise the card can't be played. Drop it on that robot to choose it; else it marks the robot with the most tokens. The AI follows the same rule.
- **Secret Upgrade and Overclock.** Drop the card on one of your robots to choose it. Elsewhere on your rail, it goes on your best ready robot as before.
- **Part texts.** Each part kind now says plainly what it is (drone, module, upgrade, tuning chip, legendary) and which slot it takes. A module replaces the module a robot came with, and the help names yours. The old "drones max 3" line is gone: with 2 part slots and a legendary slot it never mattered.
- **Starter check.** All 9 starters' weapons, power grades and descriptions were checked against the engine. Rumbler's text was wrong (it said "thick side plates"); it now reads "drum spinner on a heavy chassis, steel bumpers".

## Playtest fixes (Kev, 9 Nov, later)

- A rival's played card is clamped inside the pit floor, so the leftmost ticket's card no longer hides under the log.
- Damage chart: the fight HUD counts a knocked-out robot as 0 health, which drew a jump to 100% at the end. The chart now keeps the robot's real damage and marks the knock-out with a KO badge (and "· KO" in the legend). A red ⚔ badge sits on a robot's line where it lost a weapon part or its weapon motor died (hover: which part, when, by whom).
- Rival tickets: fitted parts always show. With a bookie tag on the robot they replace the weapon name line (the weapon stays in the hover help); a blue +N badge on the picture counts them.
- Robot-targeted sabotage (Sugar in the Tank, Smudged Lens, Loose Bolts, Rogue Firmware) goes on the rival robot you drop it on; ready rival robots light up while dragging. Dropped on the team's ticket elsewhere, it picks their best ready robot as before. The AI still aims at the best ready robot.
- Loose Bolts now marks the robot: a red 🔩 LOOSE strip on its picture (rival tickets and your rail) until the loose part is repaired; hover says which part and who did it. The +N parts badge moved to the picture's right edge so the strips don't cover it.

## Chips, recap, KO meters, repair cost (Kev, 9 Nov, later)

- **Tuning chips make light robots nimble.** Test: every level 0/1 robot with one part vs every level 2/3 robot (300 fights each, open arena). No part 25% wins. Modules: EMP 40, shield 39, mines 35, pop-up flipper 32, repair 28. Chips before: pester 35, matador 29, wall bait 27. With `ARC.chipNim` (+25% drive push, +20% top speed, turns 50% sharper; only on level 0-1 frames): matador 42, wall bait 38, pester 38. A bigger boost (+40% / +30% / x1.8) did no better; speed alone took matador to 36, turning alone to 33. Script: scratch `chipt.js` (same idea as tools/damage-lab/chipfit.js).
- **Fight recap: one card.** Left: headline, the damage chart, and the 3 most important moments (the rest is in the log). Right: the bets. The chart lost its grey 5 s bars; each line stops at its KO badge; the legend sits under it.
- **KO meters on the fight screen.** Under the health bar: ⚙ Drive (wheels and their motors), 🔋 Power (battery and radio), ⛨ Chassis; the weakest one is outlined when under 50%. A red pulsing bar counts down a count-out: "CAN'T DRIVE · COUNT-OUT 4 s" (6 s rule) or "CRIPPLED, NOT MOVING · REFS COUNT n s" (12 s rule).
- **Repair cost in red.** When your free repair actions are used up, a zone button says "FIX 4 CR" and its help box opens with a red line: what the repair costs and why.
- Parts: about half the 24 part cards protect or heal. Kev did not like swapping in the engine's unused modules (grapple, jets, oil, smoke, self-destruct); still open.

## The conveyor: next round's Market face up (Kev, 10 Nov)

Every Market is dealt a round ahead. Three of next round's lots lie face up (strip under the lots, a log line, the prompt bar); the fourth is a mystery crate. A Market always has a robot in rounds 1-5 and two part lots of different groups (drone / module / upgrade-or-chip). Legendaries and level 4 robots take the mystery slot and are announced. The bookie marks conveyor lots that make an epic combo (⚡) or are a great fit for your robots (🧩). Numbers and the before/after test: docs/robocus-2.0-balance-check.md sections 12-13.
- **Bargain bin (Kev, 10 Nov):** the first part nobody buys in a round comes back next round in the mystery slot, shown on the conveyor, 1 Cr off the winning bid. Level 4 lots now come every 2nd round from round 6.
