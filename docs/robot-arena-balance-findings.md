# Robot arena: balance findings (auto-battle sandbox)

Sandbox: https://claude.ai/artifact/11WxDiQY4F8WCBBdEFQLda (repo copy: `prototypes/arena-sandbox.html`). Plain white arena, square robots in team colours, 60 Hz deterministic sim (seeded), duels ~13 s, 4v4 ~25 s.

## Method
- Every robot spends 14 points over 7 stats (levels 0–4), plus free choices: calibre, preferred range, weapon.
- Headless Node sim: random build sampling + hill climbing, then a "counter search" (double oracle): repeatedly find the build that best beats the current best mix, add it, re-solve the equilibrium. Healthy meta = several different builds in the equilibrium with counters between them.

## Result 1: original sandbox stats (HP, speed, turret, fire rate, damage, accuracy, bullet speed)
Not interesting. Fire rate × damage multiply, so "max both" wins; the equilibrium was 2–3 near-identical builds. Speed and turret turn were rarely worth buying. Adding a mortar, laser or shotgun alone did not fix it.

## Result 2: three rule changes create real counters
1. Firepower is one stat (damage/s) + a calibre choice at equal firepower:
   rapid (4 shots/s, faster bullets, turret ×1.25, loose aim), medium, heavy (0.5 shots/s, shells ×0.6 speed, turret ×0.55, needs 3° aim).
2. Armour: flat reduction per hit (0/1.5/3/4.5/6), min 15% of the hit. Great vs rapid, useless vs heavy.
3. Weight: each armour level −9% speed, each health level −4%.
(+ robots switch strafe direction more often, so speed dodges more.)
Counter search then finds rock-paper-scissors triangles with hard counters.

## Weapons
- Gun (rapid / medium / heavy calibre), see above.
- Laser (ignores armour, 280 px range, continuous beam needing tracking, 60% of firepower; pierces every robot in its path; stopped by enemy energy walls): most diverse equilibrium.
- Mortar (lobbed, splash, slow flight, min range 110): strong, tends to take over the equilibrium.
- Shotgun: tested, no change, not in the sandbox.
- Saw blades (added 2026-11-01, Kev's idea): 1.1 blades/s at 95% of bullet speed; each blade ricochets off the arena edge, enemy energy walls and robots, hits up to 3 times, lives 4 s, never hits its own squad. Damage per hit = firepower / 1.1 × 0.9; armour applies. Buzzsaw preset (HP3 AR1 SP2 TU2 FP4 AC1 BU1, mid): duel average ~47%, 4-robot free-for-all 27% (fair share 25%), so it is a crowd weapon. First version (slower, weaker blades) won almost nothing.

- Spinner blade (added 2026-11-01, Kev's idea): the whole robot spins; charges in when ready, on contact a hit of 0.75 × firepower every 0.5 s with knockback + 0.35 s stun, recoils itself; 25% of bullets and saw blades glance off (and fly back as the spinner's). Turret and accuracy don't matter. Spinners get +15% speed while charging. Whirlwind preset (HP3 AR2 SP4 TU1 FP4) is the strongest preset (~65% average: Bulwark 100%, Hornet 100%, Marksman 86%) but has clear counters (Dasher wins 92%, Buzzsaw 75%); random spinner builds without speed are weak (watchdog 0.2–0.4×), so it is a build to discover, not a default.
- Flamethrower (added 2026-11-01, Kev's idea): 140 px cone (±22°), direct damage 0.5 × firepower/s ignoring armour, sets targets on fire (up to 4 s, 5 dmg/s, ignores armour); burning robots set fire to any robot they touch, teammates included; enemy energy walls block it. Torch preset (HP4 AR1 SP3 TU2 FP4): beats armour (Bulwark 88%), loses to snipers (Marksman 3%).

## Balance pass 2026-11-01 (after the first watchdog report)
Kev's stance: balance mostly comes from the economy, and some really strong builds are fine to discover. So only the extremes were pulled back:
- Saw blades lose 25% damage per bounce (wall or robot); hit area slightly smaller; damage factor 0.8 (was 0.9). Still the most forgiving weapon for random builds (1.5×): price it higher in the economy.
- Rapid calibre +8% firepower; armour now keeps at least 25% of each hit (was 15%) so it counters rapid fire without erasing it.
- Flipper: 14 dmg, 1.3 s stun, 3 s cooldown. Bomber: 24 dmg (was 30). Medic heals 4/s (was 5).
- Luck for upsets and banter: 10% critical hits (double damage) on bullets, saw blades and mortar shells; 40% of robots suffer one malfunction per fight (engine stall or jammed turret, 2.5 s, shown on screen).
  - 2026-11-04: the flat 40% malfunction is replaced by strain and engineers (see `robot-card-ideas.md`): simple builds glitch less (~10%), loaded builds more, and parts can now break for the rest of the fight. Duel watchdog (full run, everyone 1 engineer) before → after: 90/10+ matchups 44% → 44%, upset rate 16% → 17%, spinner 0.4× → 0.5×; strongest build is now a flamethrower + flipper + bodyguard robot (90% vs competitive builds, 4 builds beat it 60%+). So strain is not a balance lever yet at 1 engineer each; it becomes one once engineers cost something in the economy.
Duel watchdog before → after (before spinner/flamethrower): 90/10+ matchups 49% → 39%, upset rate 15% → 18–20%, rapid calibre 0.3× → 0.5–0.6×, 5 builds now beat the strongest build. Team battles stay more lopsided (snowball: losing one robot makes it 3v4).
After adding spinner + flamethrower (watchdog, full runs): duels 44% of matchups 90/10+, upset 16%, strongest build beaten 60%+ by 15 other builds; 4v4: 42% lopsided, upset 18%. Flamethrower healthy in duels (1.0×) but weaker in 4v4 (0.6×, fire spreads to its own teammates). Energy Shield and medium guns are the safest picks in 4v4. Reports: `docs/watchdog-report.md`, `docs/watchdog-report-team.md`.

## Phase 2: drives, processors, new modules, railgun (2026-11-04)
Built from Antigravity's `docs/processors-and-drives.md` and `docs/upgrade-cards.md`. Builds without the new parts fight exactly as before.

Each upgrade added to every named build, against the 9 plain named builds (8 fights per pairing, % = average win rate; plain builds average ~52%):
| Upgrade | Effect on win rate | Notes |
|---|---|---|
| Tank Tracks | 59% (Bulwark 25 → 42, Whirlwind 63 → 85, Torch 42 → 64) | strain 0: must be priced |
| Overboost Thrusters | 59% | |
| Omni-Drive | ~61% (quick test) | |
| Zigzag Chip | 45% | helps Hornet and Bulwark (+9–11), wrecks brawlers (Whirlwind 19%, Torch 21%) |
| Kiter Chip | 52% | ranged builds +6–25 (Dasher 54 → 79), brawlers collapse (Whirlwind 1%, Torch 11%) |
| Rammer Chip | 36% | only for spinners: Whirlwind 94%; flamethrowers catch their own fire (Torch 17%) |
| Reflective Plating / Grappling Hook | 60% / 66% (quick test) | |
| Jump Jets / Oil Slick | 50% / 49% | situational |
| Railgun (long range) | 51% on named-build stats | in random builds 67% win rate, 1.7× in competitive builds |

Full watchdog (random drive + processor for every robot): strongest build spinner + flipper + Overboost + Rammer (93%, 8 builds beat it 60%+); railgun 1.7×, saw blades 1.6×; mortar 0.3× and spinner 0.4× (the right processor matters a lot for them). 90/10+ matchups 44% → 54% and upset rate 17% → 13%: random drive/processor picks create many bad combos (Kiter + spinner 16%), so these numbers are partly the method.

Deviations from the spec (sim is the source of truth):
- Wheels keep the original movement exactly (spec: 0.15 sideways drift and acceleration smoothing). No drive has acceleration/braking smoothing, so drives compare fairly. Boost's 0.1 sideways drift is left out.
- Railgun: 0.55× damage per slug, 120 px/s push, spread 18° × (1 − accuracy), no lead aim (first version without the cut won 97% against the named builds). "25 knockback" read as a push.
- Rammer blunt impact is skipped on spinners (the blade already hits); Jump Jets don't jump away from enemies on brawlers (spinner, flamethrower, rammer, flipper), only from mortar shells.
- Grappling Hook pulls with a 840 px/s knockback impulse (about 140 px). Reflective Plating halves how fast flames ignite but not the flame's direct damage. Oil Slick: the owner doesn't slide; burning oil hurts everyone, owner included.
- Existing values in `upgrade-cards.md` that differ from the sim (unchanged here): smoke radius 75 (sim 90), repair cap 35% per fight (sim no cap), flipper throw 380 (sim 480), gun drone bullets 380 px/s (sim 500), miner orbit 48 px (sim 85), wheels drift 0.25 vs 0.15 in the drives doc.

## Archetype presets (2026-11-04)
Ten presets in the sandbox that use drives, processors and the newer modules (200 duels per pairing, row beats column, %):

| | Juggernaut | Sniper | Railgunner | Wasp | Hookshot | Slick | Artillery | Fortress | Ricochet | Brawler | avg vs all 18 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Juggernaut** | – | 94 | 36 | 100 | 96 | 84 | 98 | 96 | 27 | 100 | 89 |
| **Sniper** | 6 | – | 15 | 0 | 99 | 88 | 88 | 100 | 71 | 48 | 64 |
| **Railgunner** | 64 | 85 | – | 60 | 90 | 92 | 91 | 100 | 98 | 39 | 79 |
| **Wasp** | 0 | 100 | 40 | – | 90 | 100 | 100 | 100 | 100 | 4 | 81 |
| **Hookshot** | 4 | 1 | 10 | 10 | – | 84 | 44 | 68 | 17 | 46 | 43 |
| **Slick** | 16 | 12 | 8 | 0 | 16 | – | 43 | 47 | 10 | 40 | 32 |
| **Artillery** | 2 | 12 | 9 | 0 | 56 | 57 | – | 92 | 48 | 4 | 45 |
| **Fortress** | 4 | 0 | 0 | 0 | 32 | 53 | 8 | – | 0 | 96 | 17 |
| **Ricochet** | 73 | 29 | 2 | 0 | 83 | 90 | 52 | 100 | – | 93 | 60 |
| **Brawler** | 0 | 52 | 61 | 96 | 54 | 60 | 96 | 4 | 7 | – | 59 |

Builds: Juggernaut = spinner, Overboost, Rammer, Flipper · Sniper = long medium gun, Kiter, Jump Jets · Railgunner = railgun, Tracks, Reflective Plating · Wasp = rapid gun, Omni-Drive, Zigzag, Shield · Hookshot = flamethrower, Tracks, Grappling Hook · Slick = flamethrower, Oil Slick · Artillery = mortar, Overboost, Zigzag, Jump Jets · Fortress = heavy gun, armour 4, Tracks, Repair Drone · Ricochet = saw blades, Kiter, Mines · Brawler = short gun, armour 3, Tracks, Rammer, EMP.

What makes good gameplay here: the loop Wasp → Sniper → Ricochet → Brawler → Wasp (each beats the next 71–100%), Fortress as the hard answer to the Brawler, and close fights Brawler vs Sniper (52/48), Brawler vs Hookshot (54/46), Ricochet vs Artillery (52/48). Problems: counters are still too hard (often 90–100), Juggernaut and Railgunner are too strong (counters: Railgunner vs Juggernaut 64%, Ricochet vs Juggernaut 73%; Brawler vs Railgunner 61%), Slick and Fortress are too weak.
Rammer fix: on a spinner the Rammer Chip now only adds wounded-target hunting; with full pursuit, a boosted spinner never broke contact and won 100% of its fights against these presets.

## Named builds and head-to-head (200 fights each, row beats column, %; 2026-11-04, with crits, strain and engineers at 1 each)
| | Bulwark | Marksman | Hornet | Dasher | Burner | Lobber | Buzzsaw | Whirlwind | Torch |
|---|---|---|---|---|---|---|---|---|---|
| **Bulwark** | – | 8 | 80 | 12 | 11 | 1 | 40 | 4 | 4 |
| **Marksman** | 92 | – | 2 | 64 | 100 | 22 | 84 | 8 | 99 |
| **Hornet** | 20 | 98 | – | 54 | 100 | 68 | 97 | 0 | 47 |
| **Dasher** | 88 | 36 | 46 | – | 33 | 64 | 62 | 91 | 33 |
| **Burner** | 89 | 0 | 0 | 67 | – | 13 | 90 | 56 | 66 |
| **Lobber** | 99 | 78 | 32 | 36 | 87 | – | 66 | 21 | 66 |
| **Buzzsaw** | 60 | 16 | 3 | 38 | 10 | 34 | – | 74 | 82 |
| **Whirlwind** | 96 | 92 | 100 | 9 | 44 | 79 | 26 | – | 74 |
| **Torch** | 96 | 1 | 53 | 67 | 34 | 34 | 18 | 26 | – |

Every build beats at least one and loses to at least one.

## Sim pass 2026-11-06 (robot cards, new parts, softer counters)
Everything now runs on the shared `src/sim.js`. Tools: `node tools/robot-cards.js [--n 80] [--parts] [--form fp,speed,acc]` (robot card table) and `node tools/card-tune.js <card> <target>` (tries every one-point stat move on a card).

New in the Sim (5 Nov cards, first-pass numbers):
- **Burst Gun** = gun calibre `burst`: 3 shots 0.1 s apart, then ~0.8 s pause; shots 2–3 get +3° spread; each shot ×1.15 (small hits lose more to armour). Strain 1.
- **Armour cards** (build field `arm`): Heat Shield (×0.6 flame, laser, burning and oil-fire damage; −4% speed), Ablative Plating (soaks the first 30 damage after armour, then falls off; −9% speed until then), Reactive Spikes (rammers/spinners touching it take 12, once per 0.5 s; knockback and contact stun on it halved; −4% speed), Composite Mesh (+1 armour level, no weight; at armour 4: +9% speed). A broken armour card stops working ("PLATING CRACKED").
- **Quantum Shield** = module `quantum` (legendary): once per fight below 40% health, 3 s of no damage and burning pauses. Strain 2.
- **Fight quirks** (build field `quirk`): Trick Shot (saws 4 hits), Sticky Fire (burn cap 6 s instead of 4), Fireproof (own fire and oil can't hurt it), Bastion (4 helpers, helpers add no strain).
- **Robot cards** as data: `Sim.ROBOT_CARDS` (12 cards + Scrap Bot). The sandbox lists them under "Robot cards" and has Burst and Armour pickers.
- **Not in the Sim yet: Twin Turret** (second weapon slot needs a second weapon system per robot).

Softer counters: **form of the day** (`Sim.FORM`): before each fight every robot rolls a hidden condition: firepower ±25%, speed ±15%, accuracy ±10 points. Robot card pairings at 90/10 or worse: 55% → 30% (±35/20/14 gives 29%/45%, ±50/25/18 gives 24% but starts to feel like dice). Random builds (watchdog): 56% → 42% lopsided, upset rate 12% → 17%.

One stat point moved on five cards (chosen by `card-tune.js`, closest to target with fewest lopsided matchups): Juggernaut HP3→2 AR2→3 (83% → 74%), Railgunner FP4→3 SP1→2 (74% → 72%), Wasp FP4→3 HP3→4 (74% → 70%), Fortress TU1→0 BU0→1 (20% → 26%), Scrap Bot AR1→0 FP3→4 (8% → 17%).

New parts on the 12 cards (average win % vs the 13 stock cards, without → with): Heat Shield 49 → 55, Ablative Plating 49 → 60 (strongest: price it up), Reactive Spikes 49 → 50 (a niche counter to Juggernaut and Brawler), Composite Mesh 49 → 53, Quantum Shield 49 → 53 (replaces a signature module), Burst Gun 49 → 51 (on the 5 gun robots).

12 cards: 30% of pairings 90/10 or worse, 45% 80/20 or worse

Average win % vs the other 12 (cards + Scrap Bot):
  Juggernaut   74%
  Railgunner   72%
  Wasp         70%
  Sniper       62%
  Ricochet     60%
  Tinker       56%
  Brawler      51%
  Turncoat     44%
  Slick        42%
  Artillery    40%
  Hookshot     38%
  Fortress     26%
  Scrap Bot    17%

Row beats column (%):
            Jugge Railg  Wasp Snipe Ricoc Tinke Brawl Turnc Slick Artil Hooks Fortr Scrap
Juggernaut      -    29   100    79    23    61   100    90    56    95    76    91    94
Railgunner     71     -    55    69    83    79    20   100    69    78    59    79   100
Wasp            0    45     -   100   100   100     1    70    78   100    49   100   100
Sniper         21    31     0     -    71    32    48    99    88    85    93    94    78
Ricochet       78    18     0    29     -    51    90    40    89    63    85    80    95
Tinker         39    21     0    68    49     -    36    38    91    56    89    88    95
Brawler         0    80    99    53    10    64     -    65    26    90    57     0    69
Turncoat       10     0    30     1    60    63    35     -    60    28    55    93    98
Slick          44    31    22    13    11     9    74    40     -    57    57    71    69
Artillery       5    22     0    15    38    44    10    73    43     -    56    81    89
Hookshot       24    41    51     7    15    11    43    45    43    44     -    78    52
Fortress        9    21     0     6    20    13   100     7    29    19    22     -    65
Scrap Bot       6     0     0    22     5     5    31     3    31    11    48    35     -

Still open: Wasp keeps 8 of 12 matchups lopsided (rapid fire + shield + zigzag; only armour beats it); Juggernaut and Railgunner are still the top 2 (priced 5); Scrap Bot 17% (target 20–30%); railgun dominates random builds (one legendary copy, so acceptable); spinners without speed stay a "build to discover".

## Known issues / next
- Firepower is always maxed (a tax). Solve by making weapons parts with their own firepower/cost.
- Counters are very hard (often 0/100). Want ~65/35 so luck and banter stay; soften via accuracy variance, mixed loadouts, or 2 weapons.
- One AI behaviour for all robots; orders (charge/kite/flank) would add another layer.
- Helpers and modules are free power in the sandbox; price them in the economy.

## Weapon-swap check 2026-11-06 (`tools/weapon-swap.js`, 24 fights per pairing)

Every robot card got every Market weapon (quirk removed, as the rulebook says; guns at mid range) and fought the 12 unmodified cards. Stats stay as they are on a swap, so a chassis built for one weapon usually gets worse with another: 104 of 117 swaps lose win rate.

| Card | Signature | Base win % | Best swap | Swap win % |
|---|---|---|---|---|
| Juggernaut | spinner | 77 | heavy gun | **92** (medium 91, saw 89, rapid 88, burst 85) |
| Fortress | heavy gun | 28 | rapid gun | 40 (burst 39) |
| Scrap Bot | medium gun | 12 | burst gun | 19 |
| Railgunner | railgun | 77 | laser | 49 (every swap is far worse) |
| all others | | | | +0 to +4 |

The danger is one chassis: Juggernaut (speed 4, firepower 4, armour 3). The spinner is what holds it back; any gun on that body beats the whole field. Options: lock Juggernaut's spinner like the Railgunner's railgun, or move Juggernaut's stat points so a gun suits it less (for example firepower into health). Fortress gaining from a rapid gun mostly says Fortress is weak (28%), not that the swap is too strong.

Prototype (tabletop): fitting a weapon of another type now asks first and says which stats the new weapon needs (flame and spinner ignore accuracy and velocity, laser and railgun ignore velocity), the calibre turret factor (heavy ×0.55, rapid ×1.25), and that the quirk is lost. The garage shows unused stats greyed out and the turret factor next to TURRET.
