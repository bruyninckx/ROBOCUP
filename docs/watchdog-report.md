# ROBOCUS watchdog report

Generated 2026-11-04 19:17 UTC by `node tools/watchdog.js` (seed 1, sim 76ad04eb, 300 random builds, 239 s).
Every robot: 14 random stat points, random weapon / calibre / range / targeting order / drive / processor, 1 engineer, 1 random module, 1 random helper(s). Duels only.

## Health check

| Check | Result | Target |
|---|---|---|
| Strongest build vs other competitive builds | 93% | under 80% |
| Best counter to it | 100% (8 builds beat it 60%+) | at least 60% |
| Matchups 90/10 or worse (competitive builds) | 54% | under 35% |
| Matchups between 35/65 and 65/35 | 8% | the more the better |
| Upset rate (favourite loses, competitive builds) | 13% | 25–35% |

"Competitive builds" = the best 40% of 300 random robots (players don't build junk).

**Flags**

- A single build wins 93% against the other competitive builds (limit 80%).
- 54% of matchups are 90/10 or worse (target under 35%).
- Upset rate is 13% (target 25–35%): fights are too predictable.
- Dead option? Weapon = mortar shows up only 0.3× as often among competitive builds (win rate 38%).
- Too strong? Weapon = saw shows up 1.6× as often among competitive builds (win rate 63%).
- Dead option? Weapon = spinner shows up only 0.4× as often among competitive builds (win rate 32%).
- Too strong? Weapon = railgun shows up 1.7× as often among competitive builds (win rate 67%).

## Strongest builds (re-tested against 112 other competitive robots, 4 fights each)

- 93%: spinner, long range, HP1 AR1 SP3 TU1 FP4 AC3 BU1, module Flipper, helpers Jammer, Overboost Thrusters, Rammer Chip
- 85%: railgun, long range, HP2 AR1 SP4 TU1 FP2 AC3 BU1, module Grappling Hook, helpers Miner, Kiter Chip
- 85%: railgun, short range, HP3 AR1 SP3 TU1 FP2 AC4 BU0, module Decoy Hologram, helpers Jammer, Tank Tracks, Kiter Chip
- 84%: railgun, mid range, HP3 AR1 SP0 TU4 FP3 AC2 BU1, module Decoy Hologram, helpers Bomber, Overboost Thrusters, Kiter Chip
- 80%: railgun, short range, HP4 AR2 SP1 TU2 FP2 AC3 BU0, module Flipper, helpers Waller, Tank Tracks, Zigzag Chip
- 78%: railgun, mid range, HP0 AR3 SP4 TU1 FP2 AC3 BU1, module Energy Shield, helpers Bodyguard, Tank Tracks, Kiter Chip
- 74%: railgun, long range, HP2 AR0 SP2 TU1 FP3 AC2 BU4, module Decoy Hologram, helpers Waller, Kiter Chip
- 73%: medium gun, mid range, HP1 AR1 SP3 TU3 FP4 AC0 BU2, module EMP Burst, helpers Medic, Omni-Drive, Zigzag Chip

Best counter to the strongest (100% against it): flame, long range, HP3 AR3 SP4 TU1 FP3 AC0 BU0, module Flipper, helpers Waller, Kiter Chip

## Option strength

Per option: average win rate of random builds that have it, and in brackets how often it shows up among competitive builds compared to normal (1.0 = normal, 2.0 = twice as often, 0.3 = rarely good).

**Weapon:** gun 55% (1.3×) · laser 53% (0.9×) · mortar 38% (0.3×) · saw 63% (1.6×) · spinner 32% (0.4×) · flame 42% (0.6×) · railgun 67% (1.7×)

**Gun calibre (gun builds only):** rapid 52% (1.0×) · medium 59% (1.6×) · heavy 54% (1.4×)

**Preferred range:** short 52% (1.0×) · mid 49% (0.9×) · long 50% (1.1×)

**Module:** Energy Shield 54% (1.1×) · Flipper 64% (1.3×) · Decoy Hologram 49% (0.9×) · Mine Layer 49% (0.9×) · Repair Drone 60% (1.5×) · EMP Burst 55% (1.4×) · Self-Destruct 38% (0.5×) · Smoke Screen 43% (0.8×) · Reflective Plating 53% (1.1×) · Grappling Hook 48% (0.8×) · Jump Jets 44% (0.7×) · Oil Slick 36% (0.6×)

**Helper:** Medic 54% (1.1×) · Waller 48% (0.9×) · Bodyguard 45% (0.9×) · Spotter 48% (1.0×) · Jammer 49% (0.9×) · Gun Drone 57% (1.4×) · Bomber 52% (1.0×) · Miner 52% (1.0×)

**Targeting order:** main 52% (1.1×) · medics 52% (1.0×) · helpers 47% (0.9×)

**Drive:** Standard Wheels 51% (0.9×) · Tank Tracks 49% (1.0×) · Omni-Drive 50% (1.0×) · Overboost Thrusters 53% (1.2×)

**Processor:** Stock Controller 57% (1.2×) · Zigzag Chip 51% (1.0×) · Kiter Chip 50% (1.0×) · Rammer Chip 44% (0.7×)

**Stat: hp level:** 0 43% (0.7×) · 1 50% (1.0×) · 2 51% (1.0×) · 3 55% (1.2×) · 4 51% (1.1×)

**Stat: armor level:** 0 49% (1.0×) · 1 51% (1.0×) · 2 57% (1.4×) · 3 43% (0.6×) · 4 48% (0.8×)

**Stat: speed level:** 0 61% (1.4×) · 1 49% (0.8×) · 2 49% (1.0×) · 3 49% (1.0×) · 4 53% (1.2×)

**Stat: turret level:** 0 47% (0.9×) · 1 55% (1.4×) · 2 50% (0.9×) · 3 50% (0.9×) · 4 46% (0.9×)

**Stat: fp level:** 0 40% (0.3×) · 1 47% (0.9×) · 2 50% (1.1×) · 3 54% (1.2×) · 4 57% (1.3×)

**Stat: acc level:** 0 49% (0.9×) · 1 51% (1.0×) · 2 52% (1.0×) · 3 51% (1.0×) · 4 48% (1.0×)

**Stat: bullet level:** 0 55% (1.1×) · 1 54% (1.3×) · 2 50% (0.9×) · 3 46% (0.7×) · 4 46% (0.9×)

## Synergies (combos that do better together than apart)

Lift = how much better the pair does than you would expect from each part on its own. These are the surprise combos worth showing off; check them if one gets out of hand.

- Overboost Thrusters + spinner blade: 49% win rate, lift +14 (8 builds)
- Miner + Energy Shield: 68% win rate, lift +13 (6 builds)
- Waller + Rammer Chip: 54% win rate, lift +13 (6 builds)
- Stock Controller + flamethrower: 61% win rate, lift +13 (10 builds)
- Zigzag Chip + mortar: 50% win rate, lift +12 (6 builds)
- Smoke Screen + Rammer Chip: 49% win rate, lift +12 (7 builds)
- Tank Tracks + Repair Drone: 69% win rate, lift +11 (6 builds)
- Standard Wheels + spinner blade: 44% win rate, lift +11 (9 builds)
- Spotter + mortar: 46% win rate, lift +11 (7 builds)
- Zigzag Chip + gun: 66% win rate, lift +10 (8 builds)

Worst pairings (anti-synergy):

- Omni-Drive + Waller: 29%, lift -18 (10 builds)
- Kiter Chip + spinner blade: 17%, lift -15 (13 builds)
- Standard Wheels + Repair Drone: 45%, lift -15 (6 builds)
- Decoy Hologram + gun: 39%, lift -15 (7 builds)
- EMP Burst + Rammer Chip: 34%, lift -14 (7 builds)
