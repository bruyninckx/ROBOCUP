# Robot arena: balance findings (auto-battle sandbox)

Sandbox: https://claude.ai/artifact/11WxDiQY4F8WCBBdEFQLda (v2: stat budget, presets, matchup table). Plain white arena, black square robots, 60 Hz deterministic sim (seeded), fights ~10–15 s.

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

## Extra cannon test
- Laser (ignores armour, 280 px range, continuous beam needing tracking, 60% of firepower): most diverse equilibrium (~4 builds incl. fast brawler, sniper, armoured rapid, laser).
- Mortar (lobbed, splash, slow flight, min range 110): ~3 builds, mortar-heavy.
- Shotgun: no change.

## Named builds and head-to-head (200 fights each, row beats column)
Bulwark (armour tank) / Marksman (long sniper) / Hornet (rapid) / Dasher (fast short) / Burner (laser) / Lobber (mortar).
Every build beats at least one and loses to at least one. Examples: Bulwark beats Hornet 100% but loses to Marksman, Burner, Lobber; Hornet beats Marksman 95%; Burner beats Bulwark 97%, loses to Marksman/Hornet 0–100.

## Known issues / next
- Firepower is always maxed (a tax). Solve by making weapons parts with their own firepower/cost.
- Counters are very hard (often 0/100). Want ~65/35 so luck and banter stay; soften via accuracy variance, mixed loadouts, or 2 weapons.
- One AI behaviour for all robots; orders (charge/kite/flank) would add another layer.
