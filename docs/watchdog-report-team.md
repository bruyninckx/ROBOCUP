# ROBOCUS watchdog report: 4 vs 4 team battles

Generated 2026-11-01 21:01 UTC by `node tools/watchdog.js --mode team` (seed 1, sim 877cc95b, 420 battles of 4v4 with random robots, 6 runs each, 92 s).
A robot's win rate = how often the team it was in won. Same loadout rule as the duel report.

## Health check

| Check | Result | Target |
|---|---|---|
| Battles 90/10 or worse | 42% | under 35% |
| Battles between 35/65 and 65/35 | 13% | the more the better |
| Upset rate (favourite team loses) | 18% | 25–35% |

**Flags**

- 42% of team battles are 90/10 or worse (target under 35%).
- Upset rate is 18% (target 25–35%).
- Dead option? Weapon = spinner blade shows up only 0.2× as often in winning robots (win rate 38%).
- Too strong? Gun calibre (gun builds only) = medium shows up 1.9× as often in winning robots (win rate 66%).
- Too strong? Module = Energy Shield shows up 1.6× as often in winning robots (win rate 58%).

## Strongest robots in team battles

- 97% (5 battles): heavy gun, mid range, HP1 AR2 SP2 TU3 FP4 AC0 BU2, module Flipper, helpers Waller
- 92% (6 battles): medium gun, long range, HP1 AR3 SP3 TU1 FP4 AC0 BU2, module Repair Drone, helpers Bodyguard
- 86% (11 battles): medium gun, long range, HP2 AR1 SP0 TU3 FP4 AC2 BU2, module Self-Destruct, helpers Miner
- 85% (14 battles): mortar, mid range, HP2 AR1 SP1 TU1 FP4 AC2 BU3, module Repair Drone, helpers Miner
- 82% (13 battles): mortar, mid range, HP4 AR2 SP0 TU1 FP2 AC2 BU3, module Decoy Hologram, helpers Bomber
- 81% (13 battles): medium gun, long range, HP3 AR0 SP3 TU2 FP3 AC1 BU2, module Decoy Hologram, helpers Bomber

## Option strength (team win rate of robots that have it; in brackets how often it shows up among the best 40%)

**Weapon:** gun 57% (1.4×) · laser 50% (1.0×) · mortar 52% (1.1×) · saw blades 59% (1.5×) · spinner blade 38% (0.2×) · flamethrower 45% (0.6×)

**Gun calibre (gun builds only):** rapid 53% (1.1×) · medium 66% (1.9×) · heavy 55% (1.3×)

**Preferred range:** short 46% (0.8×) · mid 52% (1.1×) · long 53% (1.1×)

**Module:** Energy Shield 58% (1.6×) · Flipper 51% (0.9×) · Decoy Hologram 47% (0.7×) · Mine Layer 47% (0.9×) · Repair Drone 55% (1.3×) · EMP Burst 51% (1.1×) · Self-Destruct 52% (1.0×) · Smoke Screen 47% (0.7×)

**Helper:** Medic 51% (1.0×) · Waller 53% (1.2×) · Bodyguard 51% (0.8×) · Spotter 52% (1.2×) · Jammer 46% (0.8×) · Gun Drone 51% (1.1×) · Bomber 50% (1.1×) · Miner 48% (0.8×)

**Stat: hp level:** 0 47% (0.6×) · 1 51% (1.1×) · 2 51% (1.0×) · 3 53% (1.3×) · 4 49% (0.8×)

**Stat: armor level:** 0 50% (1.2×) · 1 52% (1.1×) · 2 50% (0.9×) · 3 50% (0.9×) · 4 49% (1.0×)

**Stat: speed level:** 0 55% (1.1×) · 1 52% (1.2×) · 2 48% (0.7×) · 3 52% (1.1×) · 4 47% (0.8×)

**Stat: turret level:** 0 51% (0.8×) · 1 54% (1.2×) · 2 49% (0.9×) · 3 49% (1.0×) · 4 48% (0.9×)

**Stat: fp level:** 0 45% (0.5×) · 1 47% (0.9×) · 2 50% (0.9×) · 3 54% (1.2×) · 4 56% (1.3×)

**Stat: acc level:** 0 52% (1.1×) · 1 49% (1.0×) · 2 51% (1.0×) · 3 50% (1.0×) · 4 50% (0.9×)

**Stat: bullet level:** 0 48% (0.8×) · 1 52% (1.1×) · 2 52% (1.1×) · 3 48% (0.8×) · 4 50% (1.1×)
