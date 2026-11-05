# ROBOCUS watchdog report

Generated 2026-11-05 23:48 UTC by `node tools/watchdog.js` (seed 1, sim 8d355722, 300 random builds, 193 s).
Every robot: 14 random stat points, random weapon / calibre / range / targeting order / drive / processor, 1 engineer, 1 random module, 1 random helper(s). Duels only.

## Health check

| Check | Result | Target |
|---|---|---|
| Strongest build vs other competitive builds | 98% | under 80% |
| Best counter to it | 50% (0 builds beat it 60%+) | at least 60% |
| Matchups 90/10 or worse (competitive builds) | 42% | under 35% |
| Matchups between 35/65 and 65/35 | 12% | the more the better |
| Upset rate (favourite loses, competitive builds) | 17% | 25–35% |

"Competitive builds" = the best 40% of 300 random robots (players don't build junk).

**Flags**

- A single build wins 98% against the other competitive builds (limit 80%).
- No build found that reliably beats the strongest build (best counter only 50%).
- 42% of matchups are 90/10 or worse (target under 35%).
- Upset rate is 17% (target 25–35%): fights are too predictable.
- Dead option? Weapon = spinner shows up only 0.2× as often among competitive builds (win rate 32%).
- Too strong? Weapon = railgun shows up 2.0× as often among competitive builds (win rate 70%).
- Too strong? Gun calibre (gun builds only) = medium shows up 2.0× as often among competitive builds (win rate 67%).
- Too strong? Module = Flipper shows up 1.6× as often among competitive builds (win rate 61%).

## Strongest builds (re-tested against 112 other competitive robots, 4 fights each)

- 98%: railgun, long range, HP3 AR0 SP1 TU1 FP4 AC4 BU1, module Decoy Hologram, helpers Spotter, Overboost Thrusters
- 94%: railgun, long range, HP3 AR1 SP2 TU0 FP3 AC3 BU2, module Energy Shield, helpers Bomber, Tank Tracks
- 81%: railgun, long range, HP1 AR4 SP0 TU1 FP3 AC3 BU2, module Oil Slick, helpers Miner
- 81%: railgun, long range, HP4 AR1 SP3 TU0 FP3 AC2 BU1, module Energy Shield, helpers Waller, Overboost Thrusters, Kiter Chip
- 79%: railgun, short range, HP2 AR2 SP3 TU1 FP2 AC3 BU1, module EMP Burst, helpers Spotter, Tank Tracks, Kiter Chip
- 74%: railgun, long range, HP2 AR2 SP1 TU2 FP2 AC3 BU2, module EMP Burst, helpers Bomber, Omni-Drive, Zigzag Chip
- 73%: railgun, long range, HP3 AR1 SP2 TU1 FP3 AC1 BU3, module Repair Drone, helpers Jammer, Tank Tracks, Zigzag Chip
- 67%: saw, long range, HP0 AR1 SP2 TU2 FP3 AC3 BU3, module Smoke Screen, helpers Bodyguard, Zigzag Chip

Best counter to the strongest (50% against it): heavy gun, long range, HP1 AR2 SP3 TU1 FP4 AC1 BU2, module Quantum Shield, helpers Bodyguard, Tank Tracks, Rammer Chip

## Option strength

Per option: average win rate of random builds that have it, and in brackets how often it shows up among competitive builds compared to normal (1.0 = normal, 2.0 = twice as often, 0.3 = rarely good).

**Weapon:** gun 53% (1.1×) · laser 58% (1.2×) · mortar 39% (0.6×) · saw 56% (1.3×) · spinner 32% (0.2×) · flame 46% (0.8×) · railgun 70% (2.0×)

**Gun calibre (gun builds only):** rapid 40% (0.5×) · medium 67% (2.0×) · heavy 50% (0.6×) · burst 58% (1.4×, few samples)

**Preferred range:** short 48% (0.9×) · mid 49% (0.9×) · long 53% (1.2×)

**Module:** Energy Shield 51% (0.9×) · Flipper 61% (1.6×) · Decoy Hologram 41% (0.6×) · Mine Layer 57% (1.3×) · Repair Drone 63% (1.5×) · EMP Burst 45% (0.7×) · Self-Destruct 46% (1.0×) · Smoke Screen 43% (0.9×) · Reflective Plating 49% (1.3×) · Grappling Hook 48% (0.8×) · Jump Jets 43% (0.5×) · Quantum Shield 52% (1.0×) · Oil Slick 56% (1.1×)

**Helper:** Medic 50% (1.0×) · Waller 45% (0.8×) · Bodyguard 52% (1.1×) · Spotter 48% (0.9×) · Jammer 45% (0.8×) · Gun Drone 55% (1.2×) · Bomber 50% (0.9×) · Miner 53% (1.2×)

**Armour card:** (none) 49% (1.0×) · heat 48% (1.0×) · ablative 56% (1.1×) · spikes 52% (1.1×) · mesh 49% (0.9×)

**Targeting order:** main 53% (1.1×) · medics 50% (0.9×) · helpers 47% (1.0×)

**Drive:** Standard Wheels 46% (0.8×) · Tank Tracks 53% (1.2×) · Omni-Drive 49% (1.1×) · Overboost Thrusters 52% (1.0×)

**Processor:** Stock Controller 57% (1.3×) · Zigzag Chip 53% (1.1×) · Kiter Chip 45% (0.8×) · Rammer Chip 45% (0.8×)

**Stat: hp level:** 0 42% (0.7×) · 1 46% (0.7×) · 2 52% (1.1×) · 3 54% (1.1×) · 4 54% (1.3×)

**Stat: armor level:** 0 57% (1.5×) · 1 54% (1.1×) · 2 50% (1.0×) · 3 46% (0.9×) · 4 43% (0.6×)

**Stat: speed level:** 0 53% (1.1×) · 1 49% (0.8×) · 2 54% (1.2×) · 3 47% (0.9×) · 4 47% (0.9×)

**Stat: turret level:** 0 48% (0.7×) · 1 58% (1.3×) · 2 50% (1.1×) · 3 47% (0.8×) · 4 43% (0.7×)

**Stat: fp level:** 0 40% (0.5×) · 1 42% (0.7×) · 2 51% (1.0×) · 3 58% (1.4×) · 4 59% (1.3×)

**Stat: acc level:** 0 50% (1.0×) · 1 51% (1.0×) · 2 51% (1.1×) · 3 53% (1.2×) · 4 42% (0.6×)

**Stat: bullet level:** 0 52% (1.2×) · 1 47% (0.9×) · 2 53% (1.2×) · 3 49% (0.8×) · 4 50% (0.8×)

## Synergies (combos that do better together than apart)

Lift = how much better the pair does than you would expect from each part on its own. These are the surprise combos worth showing off; check them if one gets out of hand.

- Rammer Chip + spinner blade: 48% win rate, lift +21 (9 builds)
- Standard Wheels + Jammer: 54% win rate, lift +13 (8 builds)
- Kiter Chip + mortar: 46% win rate, lift +12 (16 builds)
- Overboost Thrusters + Decoy Hologram: 55% win rate, lift +12 (7 builds)
- Waller + long range: 59% win rate, lift +11 (10 builds)
- Miner + Zigzag Chip: 67% win rate, lift +11 (6 builds)
- Overboost Thrusters + Grappling Hook: 61% win rate, lift +11 (6 builds)
- Bodyguard + short range: 61% win rate, lift +10 (12 builds)
- Mine Layer + saw blades: 73% win rate, lift +10 (6 builds)
- Jammer + mid range: 54% win rate, lift +10 (14 builds)

Worst pairings (anti-synergy):

- Omni-Drive + Self-Destruct: 29%, lift -16 (9 builds)
- Bodyguard + gun: 43%, lift -13 (9 builds)
- Standard Wheels + Energy Shield: 35%, lift -12 (10 builds)
- Spotter + saw blades: 43%, lift -11 (6 builds)
- Spotter + laser: 45%, lift -11 (6 builds)
