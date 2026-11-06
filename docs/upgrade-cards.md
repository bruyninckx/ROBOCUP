# Upgrade cards (Market deck, 5 Nov lineup + 6 Nov sim pass)

Source of truth for the card list: the card table (https://claude.ai/artifact/K9LYoL1ny8V4jQhBXd37nh) and `docs/rulebook.md`. Sim keys refer to `src/sim.js`. Machine-readable copy: `docs/upgrade-cards.json`. Replaces the 4 Nov catalog (40 cards, hidden modules).

## Rules in short

- Market deck: **50 different cards**: 12 robots, 8 crew, 9 weapon upgrades, 4 armour, 6 modules, 6 helpers, 4 stat upgrades, 2 legendary. Robot cards: `docs/robot-cards.md`.
- Slots per robot: 1 weapon, 1 armour, 1 module, up to 3 helpers (Fortress 4), stat upgrades up to level 4. All parts are **open** information.
- Robot cards come pre-built. Weapons are never swapped (6 Nov): each weapon type has its own upgrade instead. A bought **module** may replace the signature module and the quirk stays. Drive and processor are fixed; the railgun stays on the Railgunner. A removed part stays in the garage as a spare.
- Parts are fitted only in the open market. Price = expected winning bid; **bank value** = what the bank pays (printed on the card).
- Strain (⚡): each part adds strain; more strain, more malfunctions and broken parts (sim formula in `src/sim.js` `riskOf`; rulebook first guess 5% per ⚡ per fight, halved by a Chief Engineer). Broken parts stay broken until repaired for half their bank value (min 1).

## Crew (8)

| Card | Sim key | ⚡ | Price | Bank value | Effect | Status |
|---|---|---|---|---|---|---|
| **Chief Engineer** | — | – | 2–4 | 1 | Assign to a robot (max 3): fewer malfunctions, half the part breaks. | in a prototype |
| **Mechanic** | — | – | 3–4 | 2 | +1 credit every Upkeep. Also a starter card. | in a prototype |
| **Accountant** | — | – | 3–4 | 2 | Upkeep −1 for each robot after the first. | designed |
| **Hacker** | — | – | 2–4 | 1 | Once per round: peek at 1 face-down card on a rival robot. | designed |
| **Market Analyst** | — | – | 2–3 | 1 | See next round’s Market lots before you bid. | designed |
| **Fixer** | — | – | 3–5 | 2 | When you back a scheme, count +2 fame toward its gate. | designed |
| **Security Chief** | — | – | 2–3 | 1 | Your Security Bots block on 3–6 instead of 4–6. | designed |
| **Repair Tech** | — | – | 2–4 | 1 | Repairs cost half: 1 credit per 40 damage, rounded up. | designed |

## Weapon upgrades (9) — no weapon swaps (Kev, 6 Nov)

A robot keeps its weapon for life. These only fit robots with that weapon (`Sim.WUPS`, build key `wup`, one slot, +1 ⚡). Effect measured on the `s1.` starters vs the other 8 (16 fights per pairing).

| Card | Sim key | Fits | ⚡ | Effect | s1. starter |
|---|---|---|---|---|---|
| **Match-grade Barrel** | `wup: barrel` | guns | 1 | Bullets 15% faster, +4 accuracy. | Scrapper 56→58, Rattler 45→54, Plinker 52→55, Tin Can 43→53 |
| **Focusing Lens** | `wup: lens` | lasers | 1 | Beam 5% hotter (lasers react strongly to damage). | Sparky 42→48 |
| **Serrated Blade** | `wup: serrated` | spinners | 1 | Blade 20% harder. | Top 49→56 |
| **Ricochet Rig** | `wup: ricochet` | saw blades | 1 | One extra hit per blade, 12% harder. | Grinder 50→57 |
| **Napalm Mix** | `wup: napalm` | flamethrowers | 1 | Burn up to 2 s longer (cap 6 s). | Zippo 44→52 |
| **Cluster Shells** | `wup: cluster` | mortars | 1 | Shells 15% harder. | Lobster 45→51 |
| **Rapid-Fire Kit** | `calibre: rapid` | guns | 0 | 4 shots/s and a quick turret. Shreds light robots, weak vs armour. | |
| **Heavy Cannon Kit** | `calibre: heavy` | guns | 1 | 0.5 shots/s, huge slow shells that punch through armour. | |
| **Burst Gun** | `calibre: burst` | guns | 1 | 3 quick shots, then a 0.8 s pause. | |

The old weapon retrofits (Laser, Mortar, Saw Blade Launcher, Flamethrower, Spinner Blade) are gone from the Market: those weapons come only with their robots. Why: a swap averaged −18 win points on the starters but moved 30 of 72 swaps by 2+ bookie bands (Sparky + Spinner 55→80%), so it was a gamble that erased the robot's identity.

## Armour (4)

| Card | Sim key | ⚡ | Price | Bank value | Effect | Status |
|---|---|---|---|---|---|---|
| **Heat Shield** | `arm: heat` | 1 | 3–5 | 2 | Takes 40% off flame, laser and burning damage. −4% speed. | in a prototype |
| **Ablative Plating** | `arm: ablative` | 0 | 4–6 | 3 | Soaks the first 30 damage each fight, then falls off. −9% speed until then. | in a prototype |
| **Reactive Spikes** | `arm: spikes` | 1 | 2–4 | 1 | Rammers and spinners touching it take 12 damage; knockback and stun on it −50%. | in a prototype |
| **Composite Mesh** | `arm: mesh` | 1 | 3–5 | 2 | +1 Armour (max 4) with no speed penalty. | in a prototype |

## Modules (6 + 6 in the tabletop Market)

| Card | Sim key | ⚡ | Price | Bank value | Effect | Status |
|---|---|---|---|---|---|---|
| **Energy Shield** | `mod: shield` | 1 | 4–6 | 3 | 25 HP bubble, recharges 10 HP/s after 3 s unhit. | in a prototype |
| **Decoy Hologram** | `mod: decoy` | 1 | 4–6 | 3 | At 60% HP a hologram pulls enemy fire for 2.5 s. | in a prototype |
| **EMP Burst** | `mod: emp` | 2 | 3–5 | 2 | Stuns enemies within 150 px for 1.8 s. | in a prototype |
| **Grappling Hook** | `mod: grapple` | 2 | 3–5 | 2 | Yanks an enemy 140 px toward you. | in a prototype |
| **Jump Jets** | `mod: jets` | 2 | 3–5 | 2 | Leaps 160 px away when an enemy gets close. | in a prototype |
| **Oil Slick** | `mod: oil` | 1 | 2–3 | 1 | Leaves oil puddles that make robots slide and spin. | in a prototype |

Kev, 6 Nov: every module comes from the Market in the tabletop (the free module cycle button in the garage is gone), so these six Sim modules joined the lot deck too (prices and bank values still to set; bank value 2 for now):

| Card | Sim key | ⚡ | Effect |
|---|---|---|---|
| **Flipper** | `mod: flipper` | 2 | On contact: 14 damage, throws the enemy back, 1.3 s stun; every 3 s. |
| **Mine Layer** | `mod: mines` | 1 | Drops a mine every 1.6 s while driving (max 5), 22 damage. |
| **Repair Drone** | `mod: repair` | 1 | Heals 6 HP/s after 1.2 s without being hit. |
| **Self-Destruct** | `mod: boom` | 1 | Below 30% rams the nearest enemy; explodes for up to 45 within 90 px. |
| **Smoke Screen** | `mod: smoke` | 0 | At 50% health, a 4 s smoke cloud that spreads shots. |
| **Reflective Plating** | `mod: reflect` | 0 | Bounces half of every laser hit back; flames set it alight half as fast. |

One module per robot: fitting a new one sends the old card to the Stash.

## Helpers (6)

| Card | Sim key | ⚡ | Price | Bank value | Effect | Status |
|---|---|---|---|---|---|---|
| **Medic Drone** | `helper: medic` | 1 | 3–5 | 2 | Stays behind and heals its robot 4 HP/s. | in a prototype |
| **Waller Drone** | `helper: waller` | 1 | 3–5 | 2 | Raises energy walls that stop bullets and lasers. | in a prototype |
| **Bodyguard Drone** | `helper: bodyguard` | 1 | 3–4 | 2 | Armoured drone that body-blocks bullets and saws. | in a prototype |
| **Gun Drone** | `helper: gunner` | 1 | 3–5 | 2 | Orbits its robot and fires 2 small shots/s. | in a prototype |
| **Spotter Drone** | `helper: spotter` | 1 | 2–4 | 1 | +15% accuracy, sees through smoke. | in a prototype |
| **Jammer Drone** | `helper: jammer` | 1 | 2–4 | 1 | Nearby enemy turrets turn at 45% speed. | in a prototype |

## Stat upgrades (4)

| Card | Sim key | ⚡ | Price | Bank value | Effect | Status |
|---|---|---|---|---|---|---|
| **Reinforced Hull** | `stat: hp` | 0 | 2–3 | 1 | +1 Health level. Each level costs 4% speed. | in a prototype |
| **Tuned Engine** | `stat: speed` | 0+ | 2–3 | 1 | +1 Speed. Level 4 adds 1 strain. | in a prototype |
| **Turret Motor** | `stat: turret` | 0+ | 1–3 | 1 | +1 Turret turn. Level 4 adds 1 strain. | in a prototype |
| **Targeting Chip** | `stat: acc` | 0 | 2–3 | 1 | +1 Accuracy. | in a prototype |

## Legendary (2)

| Card | Sim key | ⚡ | Price | Bank value | Effect | Status |
|---|---|---|---|---|---|---|
| **Twin Turret** | `twin: { weapon, cal }` | 3 | 6–9 | 5 | A second weapon on its own turret at 60% firepower: pick it when you fit it (medium/rapid/heavy/burst gun, laser, flamethrower, mortar, saw blades; not the robot's own weapon type). Frame +20%, −5% speed. Measured on the s1. starters: +0 (flame) to +13 (saw) win points. | in the tabletop (6 Nov) |
| **Quantum Shield** | `mod: quantum` | 2 | 5–8 | 4 | Module. Once per fight below 40% HP: 3 s of no damage, burning pauses. | in the tabletop Market as a legendary (6 Nov) |

## Not in the Market (cut 5 Nov)

- **Signature parts, robot cards only:** Heavy Tank Tracks, Omni-Drive, Overboost Thrusters, Zigzag Evasion Chip, Kiter Logic Chip, Rammer Aggression Chip, Hydraulic Flipper, Reflective Plating, Mine Layer, Repair Drone. They stay in the Sim.
- **Cut:** Smoke Screen, Self-Destruct Core, Miner Drone, Bomber Drone, High-Output Core (firepower is already 4 on robot cards), Armour Plate, Long Barrel, Titan Plating, Prototype Railgun card (the railgun is the Railgunner), Pen Tester (crew). Still selectable in the sandbox for testing.
- **Starters** (outside the deck): stock autocannon, Standard Wheels, Stock Controller; robots per `docs/starter-deck.md` (Kev still to pick: 2 Scrap Bots or the 9-robot draft).
