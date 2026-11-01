# ROBOCUS watchdog report

Generated 2026-11-01 20:59 UTC by `node tools/watchdog.js` (seed 1, sim 877cc95b, 300 random builds, 116 s).
Every robot: 14 random stat points, random weapon / calibre / range / targeting order, 1 random module, 1 random helper(s). Duels only.

## Health check

| Check | Result | Target |
|---|---|---|
| Strongest build vs other competitive builds | 84% | under 80% |
| Best counter to it | 100% (15 builds beat it 60%+) | at least 60% |
| Matchups 90/10 or worse (competitive builds) | 44% | under 35% |
| Matchups between 35/65 and 65/35 | 12% | the more the better |
| Upset rate (favourite loses, competitive builds) | 16% | 25–35% |

"Competitive builds" = the best 40% of 300 random robots (players don't build junk).

**Flags**

- A single build wins 84% against the other competitive builds (limit 80%).
- 44% of matchups are 90/10 or worse (target under 35%).
- Upset rate is 16% (target 25–35%): fights are too predictable.
- Dead option? Weapon = spinner shows up only 0.4× as often among competitive builds (win rate 33%).
- Too strong? Gun calibre (gun builds only) = medium shows up 2.1× as often among competitive builds (win rate 72%).

## Strongest builds (re-tested against 112 other competitive robots, 4 fights each)

- 84%: mortar, mid range, HP2 AR1 SP3 TU0 FP3 AC1 BU4, module Energy Shield, helpers Gun Drone
- 81%: saw, long range, HP2 AR2 SP4 TU1 FP3 AC0 BU2, module EMP Burst, helpers Medic
- 78%: saw, long range, HP4 AR0 SP1 TU3 FP3 AC1 BU2, module EMP Burst, helpers Bodyguard
- 72%: saw, mid range, HP3 AR1 SP2 TU0 FP4 AC2 BU2, module Flipper, helpers Waller
- 71%: saw, mid range, HP3 AR0 SP3 TU4 FP4 AC0 BU0, module Repair Drone, helpers Waller
- 65%: saw, long range, HP2 AR0 SP2 TU3 FP3 AC3 BU1, module Repair Drone, helpers Gun Drone
- 64%: saw, long range, HP2 AR4 SP1 TU3 FP4 AC0 BU0, module Flipper, helpers Gun Drone
- 54%: flame, short range, HP4 AR3 SP2 TU2 FP1 AC1 BU1, module Decoy Hologram, helpers Gun Drone

Best counter to the strongest (100% against it): spinner, long range, HP0 AR1 SP4 TU2 FP4 AC2 BU1, module Smoke Screen, helpers Spotter

## Option strength

Per option: average win rate of random builds that have it, and in brackets how often it shows up among competitive builds compared to normal (1.0 = normal, 2.0 = twice as often, 0.3 = rarely good).

**Weapon:** gun 57% (1.4×) · laser 49% (0.8×) · mortar 48% (0.8×) · saw 62% (1.5×) · spinner 33% (0.4×) · flame 54% (1.0×)

**Gun calibre (gun builds only):** rapid 48% (1.1×) · medium 72% (2.1×) · heavy 55% (1.1×)

**Preferred range:** short 48% (0.8×) · mid 53% (1.1×) · long 51% (1.0×)

**Module:** Energy Shield 55% (1.5×) · Flipper 60% (1.2×) · Decoy Hologram 49% (0.9×) · Mine Layer 55% (1.2×) · Repair Drone 55% (1.1×) · EMP Burst 47% (0.8×) · Self-Destruct 47% (0.9×) · Smoke Screen 40% (0.5×)

**Helper:** Medic 46% (0.5×) · Waller 53% (1.1×) · Bodyguard 49% (1.0×) · Spotter 52% (1.1×) · Jammer 44% (0.8×) · Gun Drone 59% (1.5×) · Bomber 49% (1.0×) · Miner 57% (1.2×)

**Targeting order:** main 49% (0.9×) · medics 54% (1.2×) · helpers 49% (0.9×)

**Stat: hp level:** 0 44% (0.6×) · 1 49% (0.9×) · 2 54% (1.1×) · 3 57% (1.2×) · 4 47% (1.1×)

**Stat: armor level:** 0 62% (1.4×) · 1 58% (1.2×) · 2 47% (0.8×) · 3 44% (0.8×) · 4 46% (0.8×)

**Stat: speed level:** 0 50% (0.9×) · 1 49% (1.0×) · 2 50% (1.0×) · 3 53% (1.1×) · 4 55% (0.9×)

**Stat: turret level:** 0 47% (0.8×) · 1 56% (1.3×) · 2 51% (1.0×) · 3 49% (0.8×) · 4 45% (0.7×)

**Stat: fp level:** 0 32% (0.1×) · 1 43% (0.6×) · 2 51% (1.0×) · 3 62% (1.5×) · 4 60% (1.4×)

**Stat: acc level:** 0 56% (1.2×) · 1 53% (1.1×) · 2 52% (1.1×) · 3 46% (0.8×) · 4 48% (0.7×)

**Stat: bullet level:** 0 49% (1.0×) · 1 53% (1.1×) · 2 51% (1.0×) · 3 51% (1.0×) · 4 49% (0.8×)

## Synergies (combos that do better together than apart)

Lift = how much better the pair does than you would expect from each part on its own. These are the surprise combos worth showing off; check them if one gets out of hand.

- Decoy Hologram + flamethrower: 67% win rate, lift +16 (7 builds)
- Energy Shield + mortar: 67% win rate, lift +14 (6 builds)
- Jammer + laser: 55% win rate, lift +13 (7 builds)
- Jammer + Decoy Hologram: 54% win rate, lift +12 (7 builds)
- Bomber + Mine Layer: 65% win rate, lift +12 (6 builds)
- Repair Drone + mid range: 69% win rate, lift +12 (6 builds)
- EMP Burst + laser: 55% win rate, lift +11 (8 builds)
- Waller + Flipper: 73% win rate, lift +11 (12 builds)
- Jammer + Smoke Screen: 42% win rate, lift +9 (11 builds)
- rapid calibre + Bomber: 55% win rate, lift +9 (6 builds)

Worst pairings (anti-synergy):

- Miner + saw blades: 49%, lift -18 (6 builds)
- Spotter + flamethrower: 38%, lift -17 (6 builds)
- Flipper + mortar: 41%, lift -16 (6 builds)
- Waller + long range: 37%, lift -16 (9 builds)
- Waller + mortar: 37%, lift -13 (7 builds)
