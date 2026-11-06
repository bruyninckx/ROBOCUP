# Upgrade cards (Market deck, 5 Nov lineup + 6 Nov sim pass)

Source of truth for the card list: the card table (https://claude.ai/artifact/K9LYoL1ny8V4jQhBXd37nh) and `docs/rulebook.md`. Sim keys refer to `src/sim.js`. Machine-readable copy: `docs/upgrade-cards.json`. Replaces the 4 Nov catalog (40 cards, hidden modules).

## Rules in short

- Market deck: **50 different cards**: 12 robots, 8 crew, 8 weapons, 4 armour, 6 modules, 6 helpers, 4 stat upgrades, 2 legendary. Robot cards: `docs/robot-cards.md`.
- Slots per robot: 1 weapon, 1 armour, 1 module, up to 3 helpers (Fortress 4), stat upgrades up to level 4. All parts are **open** information.
- Robot cards come pre-built. A bought **weapon** may replace the signature weapon, but the robot loses its quirk for good (warning first). A bought **module** may replace the signature module and the quirk stays. Drive and processor are fixed; the railgun stays on the Railgunner. A removed part stays in the garage as a spare.
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

## Weapons (8)

| Card | Sim key | ⚡ | Price | Bank value | Effect | Status |
|---|---|---|---|---|---|---|
| **Laser Retrofit** | `weapon: laser` | 2 | 3–5 | 2 | Beam, 280 px range. Ignores armour and pierces every robot in line. | in a prototype |
| **Mortar Retrofit** | `weapon: mortar` | 2 | 3–5 | 2 | Lobbed shell with splash. Lobs over walls; long range. | in a prototype |
| **Saw Blade Launcher** | `weapon: saw` | 2 | 4–6 | 3 | Ricocheting discs bounce off walls and robots, up to 3 hits. | in a prototype |
| **Flamethrower** | `weapon: flame` | 2 | 3–5 | 2 | Short fire cone that ignores armour. Burning robots spread fire. | in a prototype |
| **Spinner Blade** | `weapon: spinner` | 3 | 4–6 | 3 | The whole robot spins: rams, hurls enemies, deflects 25% of bullets. | in a prototype |
| **Rapid-Fire Kit** | `calibre: rapid` | 0 | 2–3 | 1 | 4 shots/s and a quick turret. Shreds light robots, weak vs armour. | in a prototype |
| **Heavy Cannon Kit** | `calibre: heavy` | 1 | 2–4 | 1 | 0.5 shots/s, huge slow shells that punch through armour. | in a prototype |
| **Burst Gun** | `calibre: burst` | 1 | 2–4 | 1 | 3 quick shots, then a 0.8 s pause. About the damage/s of a medium gun. | in a prototype |

## Armour (4)

| Card | Sim key | ⚡ | Price | Bank value | Effect | Status |
|---|---|---|---|---|---|---|
| **Heat Shield** | `arm: heat` | 1 | 3–5 | 2 | Takes 40% off flame, laser and burning damage. −4% speed. | in a prototype |
| **Ablative Plating** | `arm: ablative` | 0 | 4–6 | 3 | Soaks the first 30 damage each fight, then falls off. −9% speed until then. | in a prototype |
| **Reactive Spikes** | `arm: spikes` | 1 | 2–4 | 1 | Rammers and spinners touching it take 12 damage; knockback and stun on it −50%. | in a prototype |
| **Composite Mesh** | `arm: mesh` | 1 | 3–5 | 2 | +1 Armour (max 4) with no speed penalty. | in a prototype |

## Modules (6)

| Card | Sim key | ⚡ | Price | Bank value | Effect | Status |
|---|---|---|---|---|---|---|
| **Energy Shield** | `mod: shield` | 1 | 4–6 | 3 | 25 HP bubble, recharges 10 HP/s after 3 s unhit. | in a prototype |
| **Decoy Hologram** | `mod: decoy` | 1 | 4–6 | 3 | At 60% HP a hologram pulls enemy fire for 2.5 s. | in a prototype |
| **EMP Burst** | `mod: emp` | 2 | 3–5 | 2 | Stuns enemies within 150 px for 1.8 s. | in a prototype |
| **Grappling Hook** | `mod: grapple` | 2 | 3–5 | 2 | Yanks an enemy 140 px toward you. | in a prototype |
| **Jump Jets** | `mod: jets` | 2 | 3–5 | 2 | Leaps 160 px away when an enemy gets close. | in a prototype |
| **Oil Slick** | `mod: oil` | 1 | 2–3 | 1 | Leaves oil puddles that make robots slide and spin. | in a prototype |

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
| **Twin Turret** | not in sim yet | 3 | 6–9 | 5 | A second weapon slot: fit any weapon card at 60% firepower. Frame +20%, −5% speed. | designed |
| **Quantum Shield** | `mod: quantum` | 2 | 5–8 | 4 | Module. Once per fight below 40% HP: 3 s of no damage, burning pauses. | in a prototype |

## Not in the Market (cut 5 Nov)

- **Signature parts, robot cards only:** Heavy Tank Tracks, Omni-Drive, Overboost Thrusters, Zigzag Evasion Chip, Kiter Logic Chip, Rammer Aggression Chip, Hydraulic Flipper, Reflective Plating, Mine Layer, Repair Drone. They stay in the Sim.
- **Cut:** Smoke Screen, Self-Destruct Core, Miner Drone, Bomber Drone, High-Output Core (firepower is already 4 on robot cards), Armour Plate, Long Barrel, Titan Plating, Prototype Railgun card (the railgun is the Railgunner), Pen Tester (crew). Still selectable in the sandbox for testing.
- **Starters** (outside the deck): stock autocannon, Standard Wheels, Stock Controller; robots per `docs/starter-deck.md` (Kev still to pick: 2 Scrap Bots or the 9-robot draft).
