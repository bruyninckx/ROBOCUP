# ROBOCUS 2.0: how many starters beat one stacked robot? (gang test, 11 Nov 2026)

Kev's question (11 Nov): how many starter robots does it take to beat one best stacked robot? Make an exotic battleground to check it.

**Short answer: the whole set.** The best stacked robot (Hydra + Weapon overhaul + Reinforced hull + Quantum shield) still beats a gang of all **9 starters** about half the time on open floor (51%), and **65% on the new Crucible**. Without its parts the same Hydra loses to **3** starters 7 times in 10 (29% wins). Three parts are worth about six extra starters.

## What was built

- **Gang mode** in the engine (`mode: 'gang'`): robot 0 is the boss (team 1), robots 1-9 are the gang (team 0). The boss starts on the right, the gang in a line on the left (two lines from 6 up). Up to 10 robots; the other modes keep their limit of 4. Friendly fire 35% as in 2v2. Judges after 3 minutes score each side's total (almost never needed: 1-2% of fights).
- **The Crucible** (`arena: 'crucible'`), an exotic arena: a **turntable** in the middle (2.5 m across) that reverses every 10 s, **conveyor belts** along the top and bottom walls (a clockwise loop), **floor saws** where the belts end, and two **spring pylons** that throw robots back (they count as a wall slam). Lab only: the tabletop's arena list does not include it.
- **Lineup Arena** (`prototypes/lineup-arena.html`): a **Gang** button next to 1v1 / 2v2 / FFA. Card 1 is the boss (robot and parts), card 2 the gang (how many, which level, a shuffled mix or all the same robot). **Test** runs that many gang fights. The Crucible is in the arena list (Damage Lab too).
- Scripts in `tools/damage-lab/`: `stack-search.js` and `stack-search2.js` (which stacked robot is best), `gang.js` (the gang runs).

Effect on the game and multiplayer: **none**. `src2/engine.js` changes with the rebuild, but every existing mode and arena gives the exact same fights (checked: 1v1, FFA and 2v2 on four arenas, same results to the millisecond). The tabletop never asks for gang mode or the Crucible.

## Step 1: the best stacked robot

Every level 4 robot (7) with two of six strong parts (Gun drone, Laser drone, Booster, Weapon overhaul, Reinforced hull, Power kit) and one legendary: 315 builds against the other level 4 robots kitted with Weapon overhaul + Hull + Prototype core (12 fights each). Then the 10 best against every other level 3-4 robot with the same kit (48 fights each).

| Build | Round 1 | Round 2 |
|---|---|---|
| **Hydra + Weapon overhaul + Reinforced hull + Quantum shield** | 75% | **65%** |
| Angler + Weapon overhaul + Power kit + Quantum shield | 75% | 63% |
| Hydra + Weapon overhaul + Power kit + Prototype core | 75% | 58% |
| Orbiter + Weapon overhaul + Power kit + Quantum shield | 75% | 56% |
| Hydra + Gun drone + Weapon overhaul + Quantum shield | 67% | 50% |

Hydra is the best robot to stack (its builds average 49% in round 1, the next robot 39%). Weapon overhaul is in all five top builds, Quantum shield in four.

## Step 2: the gang fights

The boss against N starters, a shuffled mix of the 9 (no repeats until all 9 are in), no parts. Boss win %; 72 fights a row from 5 up (about ±6 points; 96 for 9 starters and for 3 starters against the bare Hydra), 24 for the rest (about ±10).

| Starters | Stacked Hydra, open floor | Stacked Hydra, Crucible | Hydra with no parts, open | no parts, Crucible |
|---|---|---|---|---|
| 1 | 96% | 92% | 92% | 88% |
| 2 | 92% | 92% | 63% | 63% |
| 3 | 92% | 96% | **29%** | 50% |
| 4 | 79% | 79% | 17% | 17% |
| 5 | 71% | 69% | 4% | 4% |
| 6 | 61% | 71% | | |
| 7 | 71% | 67% | | |
| 8 | 54% | 60% | | |
| 9 | **51%** | **65%** | | |

- **Open floor: 8-9 starters for an even fight.** The boss wins most fights by knockout; when the gang wins, usually 2-3 starters are still standing.
- **The Crucible helps the boss** (65% against 9; the bare Hydra 50% against 3 instead of 29%). The gang spends about 30% of its time on the turntable, which turns it off line, and it can't swarm as one block. In 10 Crucible fights against all 9 starters, 88 starters went out: 67 to Hydra (battery, radio, crippled), 21 with no one to blame (counted out after friendly fire, saws or pylons).
- **Each part counts** (4 starters, open floor, 24 fights): no parts 17%, Quantum shield 33%, Weapon overhaul 33%, Reinforced hull 42%, Weapon + Hull 58%, all three 79%. About +20 points a part, as in the triple-stack test.
- **Duel strength is not gang strength.** Angler with its best kit (63% in duels, near Hydra) loses to 6 starters 79% of the time on open floor and to 8 starters 92%. Hydra's overhead strike arm takes a starter's radio or battery in one or two blows; Angler's hook and drum deal with one robot at a time.

## What it means for the game

- The planned **forced asymmetric fights** (2-3 bots vs 1, the robot-count wager idea) work best against unkitted robots: there, 2-3 starters are a real threat (the bare Hydra wins about 60% against 2, 29% against 3). Against a fully kitted Hydra a 2v1 or 3v1 with starters does nothing (92%+).
- A fully kitted Hydra is close to a "raid boss": a PvE or Battle Royale mode could use it as the boss against a gang of players' robots.
- Open: no part or rule change suggested from this. Things to try next: a gang of level 1-2 robots (the gang card has a level picker), and the Crucible for 1v1 duels.

Engine version: the runs were made before the 11 Nov weld fix (a weapon stuck in a plate that was ripped off). Re-check on the fixed engine with new seeds: 9 starters 58% open / 67% Crucible (24 fights each), the bare Hydra against 3 starters 33% (72 fights); these are pooled into the table rows for 9 and for 3.

Data: the JSON lines from `gang.js` and `stack-search*.js` (fresh seeds 47000+, 52000+, 63000+, 152000+, 252000+, 352000+).
