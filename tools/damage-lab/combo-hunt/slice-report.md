# ROBOCUS combo hunt: report

7678 fights, 6 robots (Buzzkill, Thwacker, Vertigo, Angler, Gaucho, Pogo), every part card, wear on, open floor. Depth 0 of 8 (3 h asked). Speed 5.2 fights a second on 2 workers (2 logical processors). Engine d60cb367.

How to read it: "gain" is points of win % against robots a level up (level 4: its own level), with and without the part on the same seeds; the range in brackets is 95%. "Over avg" is the gain minus what the part gives an average robot (the old epic rule). Everything listed as found held on two separate sets of fresh seeds (sorting and verify); the numbers shown are the verify fights only, so they are not inflated by the picking.

## 1. What each part gives an average robot (screen, vs robots a level up)

Prototype core +32 · Quantum shield +30 · Weapon overhaul +23 · Reinforced hull +23 · Bodyguard drone +22 · Jammer drone +22 · Overdrive +22 · Wall Bait chip +22 · Field hospital +20 · Pester chip +20 · Medic drone +19 · Energy shield +17 · Laser drone +16 · Spotter drone +14 · Booster drone +13 · Tow cable +13 · Sensor scrambler +13 · Pop-up flipper +12 · Matador chip +12 · Repair kit +11 · Blocker drone +10 · Waller drone +8 · Mine layer +8 · Gun drone +7 · Power kit +7 · EMP burst +6 · Armour kit +4

## 2. Epic combos (gain 30+ and 20+ over the part's average, on both seed sets)

| Robot + part | Verify: without → with | Gain (95%) | Over avg | All fights: without → with (fights) |
|---|---|---|---|---|
| Angler + Field hospital | 17% → 58% | +42 (+16 to +68) | +22 | 23% → 69% (48) **new** |
| Thwacker + Mine layer | 40% → 75% | +35 (+9 to +61) | +27 | 35% → 73% (40) **new** |

New: Angler + hospital, Thwacker + mines.

### The game's epics today

| Epic | In the game | Now (verify) | Verdict |
|---|---|---|---|
| Whiplash (Thwacker + tow) | 30% → 78% | 40% → 70%, gain +30 (+5 to +55) | only a great fit now |
| Phantom Hook (Angler + quantum) | 28% → 83% | 17% → 71%, gain +54 (+34 to +75) | only a great fit now |
| Overclock (Vertigo + powerkit) | 50% → 80% | 55% → 75%, gain +20 (-7 to +47) | gone |
| Iron Bolas (Gaucho + overdrive) | 12% → 58% | 19% → 66%, gain +47 (+27 to +67) | borderline (passed once) |

## 3. Great and poor fits

### Great fits (15+ over the part's average)

| Robot + part | Verify: without → with | Gain (95%) | Over avg | All fights: without → with (fights) |
|---|---|---|---|---|
| Angler + Energy shield | 17% → 67% | +50 (+26 to +74) | +33 | 23% → 65% (48) **new** |
| Thwacker + Mine layer | 40% → 75% | +35 (+9 to +61) | +27 | 35% → 73% (40) |
| Angler + Quantum shield | 17% → 71% | +54 (+34 to +75) | +24 | 23% → 73% (48) |
| Angler + Field hospital | 17% → 58% | +42 (+16 to +68) | +22 | 23% → 69% (48) **new** |
| Thwacker + Tow cable | 40% → 70% | +30 (+5 to +55) | +18 | 35% → 68% (40) |

### Poor fits (15+ below the part's average)

| Robot + part | Verify: without → with | Gain (95%) | Over avg | All fights: without → with (fights) |
|---|---|---|---|---|
| Vertigo + Overdrive | 55% → 40% | -15 (-44 to +14) | -37 | 60% → 50% (40) |
| Pogo + Prototype core | 57% → 68% | +11 (-10 to +32) | -22 | 63% → 70% (56) **new** |
| Vertigo + Mine layer | 55% → 45% | -10 (-44 to +25) | -18 | 60% → 45% (40) **new** |

### The game's fits today that did not hold

- Vertigo + Power kit (great fit, +30 in the game; now gain +20 (-7 to +47), +13 over avg)
- Gaucho + Overdrive (great fit, +46 in the game; now gain +47 (+27 to +67), +25 over avg, borderline)
- Thwacker + Pester chip (great fit, +36 in the game; now gain +25 (+1 to +49), +5 over avg)

### Borderline (passed the rule on one seed set, not the other)

- Angler + overdrive: sorting poor, verify average (verify gain +13 (-12 to +37), -9 over avg)
- Gaucho + overdrive: sorting average, verify epic (verify gain +47 (+27 to +67), +25 over avg)
- Pogo + gunner: sorting poor, verify average (verify gain +7 (-10 to +24), 0 over avg)
- Pogo + hospital: sorting poor, verify average (verify gain +11 (-5 to +26), -9 over avg)
- Pogo + medic: sorting poor, verify average (verify gain +14 (-5 to +34), -4 over avg)
- Pogo + mines: sorting poor, verify average (verify gain +4 (-22 to +29), -5 over avg)

## 4. Synergy: two parts together vs each alone

Synergy = gain of the pair minus the two single gains (points; the 95% range is per fight, pair, each half and bare on the same seeds). Win % adds up badly near 0 and 100, so the logit column says the same thing on a scale where independent parts add up (0 = no synergy).

| Robot | Pair | Bare | Part A alone | Part B alone | Pair | Synergy (95%) | Logit | Verdict |
|---|---|---|---|---|---|---|---|---|
| Angler | Matador chip + Overdrive | 38% | 13% | 33% | 29% | +21 (-3 to +44) | +1.14 | noise |
| Vertigo | Medic drone + Overdrive | 25% | 65% | 45% | 90% | +5 (-28 to +38) | +0.57 | noise |
| Thwacker | Wall Bait chip + Mine layer | 30% | 45% | 50% | 70% | +5 (-28 to +38) | +0.19 | noise |
| Angler | Overdrive + Waller drone | 38% | 33% | 33% | 33% | +4 (-23 to +32) | +0.17 | noise |

## 5. The best full build per robot (2 parts + a legendary)

Picked by successive halving against robots a level and two levels up, then fought again on fresh seeds. "Kitted" = the opponent carries its own best build from this run (robots outside this run: Weapon overhaul + Reinforced hull + Prototype core, the old test kit).

| Lv | Robot | Best build | Builds tried | vs a level up: as it comes → built (kitted rival) | vs two levels up: as it comes → built (kitted) | vs level 3-4 (level 0-2 only) |
|---|---|---|---|---|---|---|
| 0 | Buzzkill | Mine layer + Overdrive + Prototype core | 6 | 30% → **60%** (60%) [10] | 30% → **100%** (10%) [10] | 25% → **50%** (14%) [28] |
| 1 | Thwacker | Bodyguard drone + Pester chip + Quantum shield | 6 | 40% → **90%** (40%) [10] | 25% → **100%** (83%) [12] | 14% → **82%** (54%) [28] |
| 1 | Vertigo | Bodyguard drone + EMP burst + Prototype core | 9 | 40% → **80%** (50%) [10] | 17% → **75%** (8%) [12] | 14% → **50%** (4%) [28] |
| 2 | Angler | Overdrive + Waller drone + Field hospital | 9 | 17% → **83%** (17%) [12] | 13% → **75%** (19%) [16] | 14% → **79%** (18%) [28] |
| 3 | Gaucho | Overdrive + Waller drone + Prototype core | 6 | 25% → **94%** (44%) [16] | - | - |
| 4 | Pogo | Bodyguard drone + Power kit + Field hospital | 6 | 64% → **93%** (57%) [14] | - | - |

### Giant slayers (level 0-2 robots whose best build beats level 3-4 robots: the game's rule is 80%+ against bare ones)

- Thwacker + Bodyguard drone + Pester chip + Quantum shield: 14% → 82% vs bare level 3-4 (68-97%), 54% vs kitted ones, 28 fights each **giant-slayer**
- Angler + Overdrive + Waller drone + Field hospital: 14% → 79% vs bare level 3-4 (63-94%), 18% vs kitted ones, 28 fights each
- Buzzkill + Mine layer + Overdrive + Prototype core: 25% → 50% vs bare level 3-4 (31-69%), 14% vs kitted ones, 28 fights each
- Vertigo + Bodyguard drone + EMP burst + Prototype core: 14% → 50% vs bare level 3-4 (31-69%), 4% vs kitted ones, 28 fights each

Builds that beat **kitted** robots two levels up: 
- Thwacker + Bodyguard drone + Pester chip + Quantum shield beats robots two levels up even when they are kitted: 83% (12 fights)

## 6. Rarity tiers on the promising combos

Extra win points of a better copy over a standard copy, on the same seeds. Average over these combos: Race-spec: +12. Stand-outs are 15+ points away from that average.

| Robot + part | Standard: gain | Race-spec: win, extra over standard |
|---|---|---|
| Angler + Field hospital | 58% (+8) | 58%, +0 (-24 to +24) |
| Angler + Quantum shield | 92% (+42) | 100%, +8 (-8 to +25) |
| Angler + Energy shield | 67% (+17) | 92%, +25 (-1 to +51) |
| Buzzkill + Prototype core | 60% (+40) | 70%, +10 (-25 to +45) |
| Gaucho + Overdrive | 56% (+38) | 69%, +13 (-12 to +37) |
| Pogo + Quantum shield | 71% (-7) | 79%, +7 (-7 to +21) |
| Thwacker + Prototype core | 50% (+10) | 70%, +20 (-6 to +46) |
| Thwacker + Mine layer | 60% (+20) | 50%, -10 (-30 to +10) **flat** |
| Thwacker + Tow cable | 50% (+10) | 100%, +50 (+17 to +83) **stand-out** |
| Vertigo + Field hospital | 100% (+70) | 100%, +0 (-15 to +16) |

## 7. Anything that looks broken (95%+ against robots a level up)

- Angler + Race-spec Quantum shield: 100% (12 fights)
- Thwacker + Race-spec Tow cable: 100% (10 fights)
- Vertigo + Race-spec Field hospital: 100% (10 fights)

## 8. Do the old rules still fit?

- Screen: 162 robot + part combos; 24 went on to the sorting stage (7 of them because the game lists them today), 0 were dropped there early as clearly average.
- Found: 2 epic, 3 great (not epic), 3 poor; 6 borderline. In the game today: 4 epics, 18 fits.
- The part averages spread 28 points (best Prototype core +32, weakest Armour kit +4). The epic rule asks for 30+ points of gain: on a robot that already wins 70%+ that is impossible, so strong robots can only get great fits. That was true before too; the rule is kept as it was so old and new compare.
