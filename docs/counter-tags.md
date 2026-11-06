# Counter tags

Measured in the Sim by `node tools/counter-tags.js` (2026-11-06, 6 random 13-point builds per weapon (points spent the way a player would for that weapon), 40 paired samples per part and opposing weapon). The game shows these as ▲ strong vs / ▼ weak vs tags on part cards and robots. Rerun the tool after Sim changes: it rewrites the `COUNTERS` block in `src/sim.js` and this page.

## Weapons (win % vs each weapon)

| Weapon | ▲ strong vs (60%+) | ▼ weak vs (40% or less) |
|---|---|---|
| Gun | Heavy gun 81%, Spinner 79%, Rapid gun 63% | Railgun 33%, Saw blades 34%, Laser 37% |
| Rapid gun | Heavy gun 74% | Flamethrower 17%, Railgun 18%, Saw blades 26% |
| Heavy gun | Spinner 72%, Flamethrower 64% | Railgun 17%, Gun 19%, Laser 22% |
| Burst gun | Heavy gun 71%, Spinner 61% | Railgun 28%, Saw blades 38% |
| Laser | Spinner 86%, Heavy gun 78%, Flamethrower 75% | Railgun 7%, Saw blades 36% |
| Mortar | Heavy gun 69%, Spinner 61% | Railgun 31% |
| Saw blades | Rapid gun 74%, Heavy gun 69%, Spinner 67% | – |
| Spinner | Rapid gun 67% | Railgun 13%, Laser 14%, Gun 21% |
| Flamethrower | Rapid gun 83%, Spinner 71% | Railgun 19%, Laser 25%, Heavy gun 36% |
| Railgun | Laser 93%, Spinner 88%, Heavy gun 83% | – |

Full table, row beats column (%):

| | Gun | Rapid gun | Heavy gun | Burst gun | Laser | Mortar | Saw blades | Spinner | Flamethrower | Railgun |
|---|---|---|---|---|---|---|---|---|---|---|
| Gun | – | 63 | 81 | 49 | 37 | 40 | 34 | 79 | 63 | 33 |
| Rapid gun | 38 | – | 74 | 56 | 36 | 56 | 26 | 33 | 17 | 18 |
| Heavy gun | 19 | 26 | – | 29 | 22 | 31 | 31 | 72 | 64 | 17 |
| Burst gun | 51 | 44 | 71 | – | 51 | 54 | 38 | 61 | 57 | 28 |
| Laser | 63 | 64 | 78 | 49 | – | 40 | 36 | 86 | 75 | 7 |
| Mortar | 60 | 44 | 69 | 46 | 60 | – | 54 | 61 | 60 | 31 |
| Saw blades | 66 | 74 | 69 | 63 | 64 | 46 | – | 67 | 50 | 42 |
| Spinner | 21 | 67 | 28 | 39 | 14 | 39 | 33 | – | 29 | 13 |
| Flamethrower | 38 | 83 | 36 | 43 | 25 | 40 | 50 | 71 | – | 19 |
| Railgun | 67 | 82 | 83 | 72 | 93 | 69 | 58 | 88 | 81 | – |

## Armour, modules and drones (change in win points vs each weapon)

| Part | Overall | ▲ helps vs (+10) | ▼ hurts vs (−10) |
|---|---|---|---|
| Heat Shield | +1 | Flamethrower +33, Laser +24 | Gun -19, Spinner -10 |
| Ablative Plating | +14 | Railgun +24, Mortar +21, Burst gun +18 | – |
| Reactive Spikes | -1 | Spinner +24 | Saw blades -11 |
| Composite Mesh | +4 | Rapid gun +17, Burst gun +10 | – |
| Energy Shield | +10 | Railgun +25, Saw blades +16, Gun +15 | – |
| Flipper | +8 | Rapid gun +19, Spinner +19, Laser +13 | – |
| Decoy Hologram | +8 | Saw blades +18, Gun +14, Flamethrower +11 | – |
| Mine Layer | +6 | Spinner +25, Flamethrower +15, Mortar +11 | – |
| Repair Drone | +11 | Mortar +21, Gun +20, Burst gun +18 | – |
| EMP Burst | +2 | Flamethrower +19, Mortar +11 | Gun -14 |
| Self-Destruct | +2 | Flamethrower +12, Railgun +11 | Spinner -17, Saw blades -12 |
| Smoke Screen | +4 | – | – |
| Reflective Plating | +6 | Laser +49 | – |
| Grappling Hook | -1 | – | – |
| Jump Jets | +0 | Mortar +13 | – |
| Quantum Shield | +11 | Saw blades +20, Railgun +20, Heavy gun +14 | – |
| Oil Slick | +1 | – | – |
| Medic drone | +16 | Laser +29, Rapid gun +25, Gun +23 | – |
| Waller drone | +8 | Saw blades +37, Gun +15, Laser +15 | – |
| Spotter drone | +2 | Saw blades +11 | Heavy gun -12 |
| Gun Drone | +9 | Burst gun +18, Gun +15, Heavy gun +14 | – |
| Bodyguard drone | +7 | Gun +23, Rapid gun +21, Saw blades +21 | – |
| Jammer drone | +7 | Gun +16, Flamethrower +14, Saw blades +11 | – |
