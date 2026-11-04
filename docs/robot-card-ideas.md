# Robot game: card ideas (brainstorm v3)

Sandbox: https://claude.ai/artifact/11WxDiQY4F8WCBBdEFQLda (repo copy: `prototypes/arena-sandbox.html`; modules + helpers per robot; 2–8 robots, free-for-all up to 4 or teams 2v2 / 3v3 / 4v4 in a bigger 1200×750 arena; "Random squads" button; "Hide modules until they trigger" shows a ? badge like an opponent would see). Weapons: gun (3 calibres), laser, mortar, saw blades (see `robot-arena-balance-findings.md`).

## Squadron leader cards (Kev's idea, built in the sandbox 2026-11-01)
Each side plays a squadron leader card that sets how many robots it fields and how big they are. Fewer robots = more points each and higher stat caps (levels 5–8 continue the normal steps), plus a bigger body.

| Card | Robots | Points each | Stat cap | Size |
|---|---|---|---|---|
| Lone Wolf | 1 | 28 | 8 | 40 |
| Duo | 2 | 18 | 6 | 34 |
| Trio | 3 | 14 | 4 | 30 |
| Swarm | 5 | 9 | 3 | 22 |

Why the budgets look "unfair": in ranged fights numbers count roughly squared, but one robot with high stats is also faster, more accurate and harder-hitting at once, so concentration is very strong. A single robot with the squad's full 42 points won 98%; at ~2× a normal robot (28) a well-built titan beats a Trio about 4 in 10 (random titans almost never), which is the "epic but possible" zone. Titans that win use area weapons (mortar, saw blades), speed and big firepower.
Tuned with `tools/watchdog.js --mode squad` (see `docs/watchdog-report-squad.md`): card averages Lone Wolf 42%, Duo 46%, Trio 55%, Swarm 58% (±10% between seeds). Results are very sensitive: 1 point per robot can swing a matchup 20–30%.
Payoff ideas: bookmaker odds make the outnumbered side a big underdog (big payout; the sandbox's bookie's board shows the Lone Wolf as Underdog vs a Trio), a Giant Slayer fame bonus when the smaller squad wins (the sandbox already shouts "GIANT SLAYER!"), optional leader bonus per card (e.g. faster turrets nearby).
Not yet tested with modules and helpers on top.

## Strain and engineers (Kev's idea, built in the sandbox 2026-11-04)
Powerful parts can break in a fight; engineers keep a robot running. This replaces the flat "40% of robots get one malfunction".

Strain per part:
| Part | Strain |
|---|---|
| Weapon | gun 1, laser 2, mortar 2, saw blades 2, flamethrower 2, spinner blade 3 |
| Calibre | heavy +1 (rapid, medium 0) |
| Module | flipper 2, EMP 2, shield / decoy / mines / repair / self-destruct 1, smoke 0 |
| Helper drone | 1 each |
| Overdrive | +1 for each of speed, turret, firepower at level 4+ (+2 at level 7+, titans) |

Per fight, from total strain S and engineers E (0–3, default 1):
- Malfunction (one short engine stall or jammed turret): 8% × S × 0.6^E (max 90%). Lasts 2.5 s / (1 + 0.4E).
- Each part can break for the rest of the fight: 3.5% × part strain × (1 + 0.15 × strain above 4) × 0.5^E. Weapon damaged (half damage; spinner: blade cracked), barrel warped (−25 accuracy), module fried (gone), drone failure (that helper shuts down), engine blown (−40% speed), turret motor burnt (half turn speed), overheated (−30% damage).
Examples with 1 engineer: Marksman (strain 2) malfunction 10%, some part breaks 3%; Whirlwind (5) 24% / 10%; Bulwark + EMP + medic + waller (6) 29% / 13%. A strain-11 monster (spinner, EMP, 3 helpers, three overdrives): 88% / 57% with 0 engineers, 53% / 33% with 1, 19% / 9% with 3.
Design hooks: engineers come from the team's mechanics in the strategy layer (hire, poach, bribe away); "second weapon" and other very strong future parts get high strain; cards like Overtime (+1 engineer for one fight) or Cut Corners (sabotage: +3 strain on a rival robot, secret).

## 0. Helper robots (Kev's idea, built in the sandbox)
Each team max 3 main robots; each main robot brings 0–3 helper drones. Helpers are OPEN info (visible), modules stay hidden. When the main robot dies its helpers shut down. Own shots pass through own drones; other teams' drones (also allies in team fights) can be hit. Economics (price, slots, upkeep) to be decided later.

| Helper | Behaviour | Duel win % for a preset with it (baseline ~49): +1 / +2 |
|---|---|---|
| Medic (18 hp) | stays behind, heals 5/s with a beam (range 130); medics cap at 8/s total | 76 / 86 |
| Waller (40 hp) | rides in front, energy wall every 5 s (6 s, 40 hp, max 2); stops enemy bullets + lasers, saw blades bounce off, own shots pass, mortars lob over | 67 / 77 |
| Bodyguard (60 hp, armour 2, big) | parks between its robot and the enemy, soaks bullets; lasers pass through | 70 / 76 |
| Gun Drone (30 hp) | orbits, 2 shots/s of 3 dmg at the same target; useless vs armour | 67 / 78 |
| Jammer (25 hp) | flies toward the enemy; enemy robots within 160 px turn turrets at 45% speed | 64 / 70 |
| Bomber (20 hp) | after 2 s dives at the target, 30 dmg within 50 px, one use | 62 / 75 |
| Spotter (25 hp) | +15% accuracy, sees through smoke, reveals hidden modules within 220 px | 56 / 56 (utility) |
| Miner (30 hp) | circles its robot, mine every 1.6 s (max 5), 24 dmg to anyone outside its squad incl. teammates | 54 / 60 |
4v4 test: ~25 s per fight, no timeouts.

Secret targeting order ("Shoots at": main robots / medics first / all helpers first):
Finding: in pure fight terms "main robots first" always wins at least as often. Best design use: helpers are persistent assets that stay destroyed, so "helpers first" = economic sabotage. Card hooks: Turncoat Chip (enemy helper switches sides mid-fight), Salvage (take a destroyed helper), Union Strike (a team's helpers stay home one fight).

## 1. Surprise modules (built in the sandbox)
One module slot per robot. Installed face-down: everyone sees a robot HAS a module, not which, until it triggers.

| Module | Effect | Duel win % (avg over 6 presets, baseline 50) | Best on | 4-robot FFA win % (baseline 34) |
|---|---|---|---|---|
| Energy Shield | 25 soak, regen 10/s after 3 s | 62 | Lobber 84, Dasher 73 | 44 |
| Decoy Hologram | at 60% hp, attackers chase a hologram 2.5 s | 67 | Lobber 80, Marksman 78 | 47 |
| Smoke Screen | at 50% hp, 4 s cloud, shots into it spread wildly | 61 | Lobber 79 | 44 |
| Repair Drone | +6 hp/s after 1.2 s unhit | 55 | Lobber 77 | 43 |
| EMP Burst | enemy within 130 → stun all within 150 for 1.8 s, 12 s cd | 55 | Dasher 71 | 41 |
| Mine Layer | mine every 1.6 s while driving (max 5), 22 dmg, hits teammates | 55 | Lobber 74 | 36 |
| Self-Destruct | <30% hp: kamikaze; death blast 45 within 90 px | 53 | Dasher 82 | 33 |
| Flipper | charges in when ready; 10 dmg + throw + 1 s stun; wall slam +8 | 46 avg | Dasher 90 (Lobber 23!) | 34 |
Takeaway: modules create robot–module synergy puzzles. Decoy/Shield/Smoke are the strongest generics → make them rare / contested.

## 2. More module ideas (not built yet)
Spinner (contact damage + deflects some bullets), Reflective Plating (bounces part of laser back), Tesla Coil (damage chains between robots standing close: great vs team fights and helper swarms), Grappling Hook (yank an enemy, e.g. onto your mines), Jump Jets (hop away when cornered), Oil Slick (enemies slide/spin out), Cloak (untargetable 2 s), Twin Turret (second small gun), Overdrive Core (the rare real-time button: owner chooses the moment).

## 3. Contested cards (worth fighting over)
- Legendary parts: only 1 copy each, announced a round in advance so teams save credits: Prototype Railgun (instant, pierces), Titan Plating, Quantum Shield.
- Champion's Belt (relic): holder gains +1 fame per round, but whoever beats the holder's robot takes the belt.
- Wanted poster / bounty: put credits on a robot's head; anyone who scraps it collects.
- Crowd Favourite: the robot with most wins gets sponsorship; losing it hurts.

## 4. Fame-gated cards (Spartacus influence gates)
- 5+: Sponsor Logo (+2 credits per round).
- 7+: Factory Access (may bid on legendary parts), Rig the Draw (force an invitation).
- 9+: Unleash the House Robot (host only: a neutral arena bruiser hunts anyone near it), Arena Pit (host adds a pit to the arena).
- 10+: Grand Final (next fight is worth double fame).

## 5. Team-up / conspiracy cards (need other players)
- Joint Venture (prisoner's dilemma): two teams secretly commit credits; both commit → both get a prototype part; one defects → defector takes both stakes.
- Syndicate Sabotage: needs backers with combined fame ≥ 12 (Spartacus support); can ban a team from the next fight or scrap a robot outright.
- Rigged Match: host + one fighter conspire; the fighter's robot holds back and they split the bets. Others can expose it with a Whistleblower card.
- Tag Team Licence: next fight is a team fight and you choose your ally, so alliances become public.
- Shared Blueprints: allied robots in a team fight share one shield pool.

## 6. Parked
Boasts / dream arena ("my robot beats 5 of yours"), simulated proposition bets with escalating claims (Liar's Dice style).
Open question from Kev: are bigger battles (3v3 / 4v4) more fun than duels? Could tie into the 4-player game as "everyone sends robots" grand battles.
