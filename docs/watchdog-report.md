# ROBOCUS watchdog report

Generated 2026-11-04 18:50 UTC by `node tools/watchdog.js` (seed 1, sim 6f50050d, 300 random builds, 460 s).
Every robot: 14 random stat points, random weapon / calibre / range / targeting order, 1 random module, 1 random helper(s). Duels only.

## Health check

| Check | Result | Target |
|---|---|---|
| Strongest build vs other competitive builds | 90% | under 80% |
| Best counter to it | 100% (4 builds beat it 60%+) | at least 60% |
| Matchups 90/10 or worse (competitive builds) | 44% | under 35% |
| Matchups between 35/65 and 65/35 | 11% | the more the better |
| Upset rate (favourite loses, competitive builds) | 17% | 25–35% |

"Competitive builds" = the best 40% of 300 random robots (players don't build junk).

**Flags**

- A single build wins 90% against the other competitive builds (limit 80%).
- 44% of matchups are 90/10 or worse (target under 35%).
- Upset rate is 17% (target 25–35%): fights are too predictable.
- Too strong? Gun calibre (gun builds only) = medium shows up 2.3× as often among competitive builds (win rate 72%).

## Strongest builds (re-tested against 112 other competitive robots, 4 fights each)

- 90%: flame, mid range, HP4 AR1 SP3 TU2 FP4 AC0 BU0, module Flipper, helpers Bodyguard
- 85%: mortar, mid range, HP2 AR1 SP3 TU0 FP3 AC1 BU4, module Energy Shield, helpers Gun Drone
- 81%: saw, short range, HP2 AR2 SP2 TU2 FP4 AC0 BU2, module Flipper, helpers Waller
- 77%: saw, long range, HP4 AR0 SP1 TU3 FP3 AC1 BU2, module EMP Burst, helpers Bodyguard
- 75%: mortar, long range, HP1 AR0 SP1 TU3 FP3 AC2 BU4, module Decoy Hologram, helpers Spotter
- 71%: saw, mid range, HP3 AR0 SP3 TU4 FP4 AC0 BU0, module Repair Drone, helpers Waller
- 70%: medium gun, short range, HP3 AR2 SP3 TU2 FP3 AC0 BU1, module Self-Destruct, helpers Gun Drone
- 47%: flame, mid range, HP4 AR3 SP2 TU1 FP1 AC1 BU2, module Mine Layer, helpers Miner

Best counter to the strongest (100% against it): medium gun, long range, HP3 AR0 SP3 TU2 FP3 AC1 BU2, module Decoy Hologram, helpers Bomber

## Option strength

Per option: average win rate of random builds that have it, and in brackets how often it shows up among competitive builds compared to normal (1.0 = normal, 2.0 = twice as often, 0.3 = rarely good).

**Weapon:** gun 56% (1.3×) · laser 49% (0.8×) · mortar 47% (0.8×) · saw 60% (1.4×) · spinner 33% (0.5×) · flame 54% (1.0×)

**Gun calibre (gun builds only):** rapid 49% (1.0×) · medium 72% (2.3×) · heavy 52% (0.9×)

**Preferred range:** short 48% (0.8×) · mid 52% (1.2×) · long 51% (1.0×)

**Module:** Energy Shield 55% (1.3×) · Flipper 59% (1.2×) · Decoy Hologram 49% (1.1×) · Mine Layer 55% (1.2×) · Repair Drone 54% (1.2×) · EMP Burst 45% (0.8×) · Self-Destruct 47% (0.7×) · Smoke Screen 40% (0.5×)

**Helper:** Medic 46% (0.7×) · Waller 53% (1.1×) · Bodyguard 49% (1.0×) · Spotter 51% (1.0×) · Jammer 44% (0.8×) · Gun Drone 56% (1.4×) · Bomber 48% (0.9×) · Miner 56% (1.0×)

**Targeting order:** main 49% (0.9×) · medics 53% (1.2×) · helpers 49% (1.0×)

**Stat: hp level:** 0 44% (0.6×) · 1 49% (0.9×) · 2 52% (1.1×) · 3 56% (1.1×) · 4 47% (1.1×)

**Stat: armor level:** 0 61% (1.5×) · 1 56% (1.3×) · 2 48% (0.9×) · 3 43% (0.6×) · 4 46% (0.7×)

**Stat: speed level:** 0 50% (1.2×) · 1 50% (1.0×) · 2 49% (0.9×) · 3 53% (1.1×) · 4 53% (1.0×)

**Stat: turret level:** 0 47% (0.8×) · 1 55% (1.2×) · 2 52% (1.1×) · 3 49% (0.8×) · 4 44% (0.8×)

**Stat: fp level:** 0 33% (0.1×) · 1 42% (0.5×) · 2 51% (1.1×) · 3 61% (1.5×) · 4 59% (1.5×)

**Stat: acc level:** 0 56% (1.3×) · 1 53% (1.0×) · 2 51% (1.1×) · 3 46% (0.9×) · 4 48% (0.7×)

**Stat: bullet level:** 0 49% (0.9×) · 1 52% (1.0×) · 2 50% (0.9×) · 3 51% (1.1×) · 4 50% (1.1×)

## Synergies (combos that do better together than apart)

Lift = how much better the pair does than you would expect from each part on its own. These are the surprise combos worth showing off; check them if one gets out of hand.

- Energy Shield + mortar: 67% win rate, lift +14 (6 builds)
- Jammer + laser: 56% win rate, lift +14 (7 builds)
- Jammer + Decoy Hologram: 56% win rate, lift +14 (7 builds)
- Bomber + Mine Layer: 66% win rate, lift +13 (6 builds)
- Decoy Hologram + flamethrower: 64% win rate, lift +12 (7 builds)
- EMP Burst + laser: 55% win rate, lift +11 (8 builds)
- Waller + Flipper: 71% win rate, lift +10 (12 builds)
- rapid calibre + Bomber: 56% win rate, lift +10 (6 builds)
- Repair Drone + mid range: 65% win rate, lift +9 (6 builds)
- Waller + mid range: 63% win rate, lift +8 (21 builds)

Worst pairings (anti-synergy):

- Spotter + flamethrower: 37%, lift -17 (6 builds)
- Flipper + mortar: 40%, lift -16 (6 builds)
- Waller + long range: 39%, lift -15 (9 builds)
- Miner + saw blades: 51%, lift -14 (6 builds)
- Miner + short range: 41%, lift -13 (9 builds)
