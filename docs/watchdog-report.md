# ROBOCUS watchdog report

Generated 2026-11-01 20:17 UTC by `node tools/watchdog.js` (seed 1, sim 82e07525, 300 random builds, 112 s).
Every robot: 14 random stat points, random weapon / calibre / range / targeting order, 1 random module, 1 random helper(s). Duels only.

## Health check

| Check | Result | Target |
|---|---|---|
| Strongest build vs other competitive builds | 97% | under 80% |
| Best counter to it | 67% (1 builds beat it 60%+) | at least 60% |
| Matchups 90/10 or worse (competitive builds) | 49% | under 35% |
| Matchups between 35/65 and 65/35 | 10% | the more the better |
| Upset rate (favourite loses, competitive builds) | 15% | 25–35% |

"Competitive builds" = the best 40% of 300 random robots (players don't build junk).

**Flags**

- A single build wins 97% against the other competitive builds (limit 80%).
- 49% of matchups are 90/10 or worse (target under 35%).
- Upset rate is 15% (target 25–35%): fights are too predictable.
- Too strong? Weapon = saw shows up 1.7× as often among competitive builds (win rate 64%).
- Dead option? Gun calibre (gun builds only) = rapid shows up only 0.3× as often among competitive builds (win rate 28%).

## Strongest builds (re-tested against 112 other competitive robots, 4 fights each)

- 97%: saw, long range, HP3 AR2 SP1 TU0 FP4 AC0 BU4, module Self-Destruct, helpers Medic
- 90%: mortar, mid range, HP1 AR1 SP2 TU1 FP3 AC2 BU4, module Energy Shield, helpers Waller
- 89%: saw, short range, HP1 AR2 SP1 TU3 FP4 AC1 BU2, module Decoy Hologram, helpers Gun Drone
- 84%: saw, mid range, HP2 AR2 SP4 TU1 FP3 AC0 BU2, module Energy Shield, helpers Bodyguard
- 84%: saw, short range, HP2 AR1 SP3 TU1 FP4 AC2 BU1, module Smoke Screen, helpers Waller
- 83%: saw, long range, HP0 AR0 SP3 TU2 FP3 AC2 BU4, module Smoke Screen, helpers Waller
- 78%: saw, mid range, HP2 AR3 SP1 TU1 FP3 AC3 BU1, module Energy Shield, helpers Bomber
- 78%: saw, long range, HP3 AR1 SP0 TU2 FP3 AC3 BU2, module Mine Layer, helpers Gun Drone

Best counter to the strongest (67% against it): saw, mid range, HP2 AR3 SP1 TU1 FP3 AC3 BU1, module Energy Shield, helpers Bomber

## Option strength

Per option: average win rate of random builds that have it, and in brackets how often it shows up among competitive builds compared to normal (1.0 = normal, 2.0 = twice as often, 0.3 = rarely good).

**Weapon:** gun 42% (0.7×) · laser 50% (1.0×) · mortar 42% (0.5×) · saw 64% (1.7×)

**Gun calibre (gun builds only):** rapid 28% (0.3×) · medium 53% (1.3×) · heavy 45% (0.5×)

**Preferred range:** short 45% (0.8×) · mid 54% (1.2×) · long 50% (0.9×)

**Module:** Energy Shield 53% (1.0×) · Flipper 34% (0.4×) · Decoy Hologram 54% (1.2×) · Mine Layer 58% (1.3×) · Repair Drone 53% (1.1×) · EMP Burst 49% (0.9×) · Self-Destruct 44% (0.7×) · Smoke Screen 51% (1.1×)

**Helper:** Medic 59% (1.3×) · Waller 50% (1.0×) · Bodyguard 49% (0.9×) · Spotter 46% (0.9×) · Jammer 41% (0.5×) · Gun Drone 49% (1.0×) · Bomber 49% (1.1×) · Miner 54% (1.3×)

**Targeting order:** main 50% (1.1×) · medics 51% (1.0×) · helpers 48% (0.9×)

**Stat: hp level:** 0 48% (0.9×) · 1 51% (1.1×) · 2 49% (0.9×) · 3 53% (1.1×) · 4 46% (0.9×)

**Stat: armor level:** 0 54% (1.2×) · 1 53% (1.2×) · 2 51% (1.1×) · 3 45% (0.7×) · 4 47% (0.9×)

**Stat: speed level:** 0 55% (1.2×) · 1 51% (1.1×) · 2 51% (1.0×) · 3 51% (1.2×) · 4 41% (0.6×)

**Stat: turret level:** 0 57% (1.4×) · 1 57% (1.3×) · 2 52% (1.1×) · 3 43% (0.6×) · 4 38% (0.6×)

**Stat: fp level:** 0 24% (0.1×) · 1 42% (0.6×) · 2 50% (1.0×) · 3 61% (1.5×) · 4 63% (1.6×)

**Stat: acc level:** 0 49% (1.1×) · 1 49% (0.8×) · 2 51% (1.0×) · 3 52% (1.1×) · 4 45% (0.8×)

**Stat: bullet level:** 0 39% (0.6×) · 1 51% (1.1×) · 2 51% (0.9×) · 3 51% (1.1×) · 4 51% (1.1×)

## Synergies (combos that do better together than apart)

Lift = how much better the pair does than you would expect from each part on its own. These are the surprise combos worth showing off; check them if one gets out of hand.

- Decoy Hologram + mortar: 62% win rate, lift +17 (6 builds)
- rapid calibre + Flipper: 28% win rate, lift +16 (6 builds)
- Bomber + long range: 63% win rate, lift +14 (8 builds)
- Miner + gun: 60% win rate, lift +13 (9 builds)
- rapid calibre + long range: 41% win rate, lift +13 (7 builds)
- Flipper + gun: 37% win rate, lift +11 (11 builds)
- Waller + Flipper: 44% win rate, lift +10 (8 builds)
- Miner + EMP Burst: 63% win rate, lift +10 (6 builds)
- Bomber + Smoke Screen: 60% win rate, lift +10 (6 builds)
- Gun Drone + laser: 58% win rate, lift +9 (8 builds)

Worst pairings (anti-synergy):

- Smoke Screen + mortar: 25%, lift -18 (6 builds)
- Gun Drone + mortar: 27%, lift -15 (7 builds)
- medium calibre + Decoy Hologram: 44%, lift -13 (6 builds)
- Energy Shield + long range: 41%, lift -12 (8 builds)
- Miner + laser: 42%, lift -12 (7 builds)
