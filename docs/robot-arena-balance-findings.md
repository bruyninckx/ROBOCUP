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
Duel watchdog before → after (before spinner/flamethrower): 90/10+ matchups 49% → 39%, upset rate 15% → 18–20%, rapid calibre 0.3× → 0.5–0.6×, 5 builds now beat the strongest build. Team battles stay more lopsided (snowball: losing one robot makes it 3v4).
After adding spinner + flamethrower (watchdog, full runs): duels 44% of matchups 90/10+, upset 16%, strongest build beaten 60%+ by 15 other builds; 4v4: 42% lopsided, upset 18%. Flamethrower healthy in duels (1.0×) but weaker in 4v4 (0.6×, fire spreads to its own teammates). Energy Shield and medium guns are the safest picks in 4v4. Reports: `docs/watchdog-report.md`, `docs/watchdog-report-team.md`.

## Named builds and head-to-head (200 fights each, row beats column, %)
| | Bulwark | Marksman | Hornet | Dasher | Burner | Lobber | Buzzsaw |
|---|---|---|---|---|---|---|---|
| **Bulwark** | – | 10 | 100 | 16 | 3 | 2 | 14 |
| **Marksman** | 90 | – | 4 | 66 | 100 | 24 | 67 |
| **Hornet** | 0 | 96 | – | 42 | 100 | 71 | 71 |
| **Dasher** | 84 | 34 | 58 | – | 15 | 58 | 36 |
| **Burner** | 97 | 0 | 0 | 85 | – | 13 | 78 |
| **Lobber** | 98 | 76 | 29 | 42 | 87 | – | 50 |
| **Buzzsaw** | 86 | 33 | 29 | 64 | 22 | 50 | – |

Every build beats at least one and loses to at least one.

## Known issues / next
- Firepower is always maxed (a tax). Solve by making weapons parts with their own firepower/cost.
- Counters are very hard (often 0/100). Want ~65/35 so luck and banter stay; soften via accuracy variance, mixed loadouts, or 2 weapons.
- One AI behaviour for all robots; orders (charge/kite/flank) would add another layer.
- Helpers and modules are free power in the sandbox; price them in the economy.
