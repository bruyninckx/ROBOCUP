# ROBOCUS: tuned lineup and full bookie-tag recheck (15 Nov 2026)

Kev (14 Nov): "lets tune the lineup, but lets go for 66% win rate for next level, once you tuned them all, do a complete recheck of all the tags that can be put on the bots".

Branch `claude/robots-2.0.1`. Lineup: the 33 robots from the casting board (see `robocus-lineup-by-cool.md`, section 6).

## 1. The tuning

- **One dial per robot:** a power number `p` that scales its damage and its health together (dmgK = hpK = p). The old per-robot damage multipliers are gone.
- **Target:** each level beats the level below 66% of the time (about 115 rating points a level). Robots inside a level are tuned to the same strength.
- **How:** 4 rounds of everyone-vs-everyone with fresh seeds, then a check with the game's real part strengths switched on (repair kit, gun drone, etc.). That check showed the top steps were off (63% and 61%), so a 5th correction round was done.
- **Result (12 fights per pair, 6,336 duels, game part strengths):**

| Step | Wins |
|---|---|
| Level 1 vs starters | 66% |
| Level 2 vs level 1 | 60% |
| Level 3 vs level 2 | 66% |
| Level 4 vs level 3 | 64% |
| Two levels apart | 83% |
| Three levels apart | 85% |
| Four levels apart | 93% |

- A single robot's rating is good to about +-35 here.
- Still a bit off (next nudge, if Kev wants it):
  - Too weak: Mauler -59, Lodestone -46, Mincer -44, Rotisserie -41, Pincher -37, Gaucho -35.
  - Too strong: Corkscrew +38.
  - A 3-5% power change fixes each one.
  - Level 2 vs level 1 is the softest step (60%). Raising Pincher and Whaler a little would bring it to about 64%.
- The tuned numbers are in `tools/damage-lab/lineup-tuned.json` and in the table below (the `p` column).

## 2. How the tags were measured

Every number below comes from the tuned lineup, with the game's part strengths. Scripts: `tag-sim2.js` (fights), then `tag-tuned-report.py`, `tag-tuned-cand.py` and `tag-tuned-final.py` (analysis). Raw data is in `tools/damage-lab/tag-tuned/`.

| Test | Fights | Tags it gives |
|---|---|---|
| Duels, everyone vs everyone, 12 a pair | 6,336 | Giant killer, Coin-flip brawler, Quick finisher, Grinder, Hard hitter, counter-pick candidates |
| Counter-pick candidates re-fought, fresh seeds | 2,272 | Counter pick / Bad matchup (only if both runs agree) |
| 4-robot free-for-alls | 1,500 | Brawl master / Lost in a melee |
| 2v2 | 1,500 | Lone wolf / Team player |
| Each robot in 4 arenas vs open floor, 32 a robot per arena | 5,280 | arena tags |
| Armour stripped vs 4 same-level robots, paired seeds | 4,224 | Needs its armour / Shrugs it off |
| Every part (27) on every robot vs 4 robots a level up | 14,784 | Great/Poor fit candidates |
| 58 fit candidates re-tested vs every robot a level up | 5,248 | Great fit, Poor fit, Epic combo |
| Top-3 builds for every level 0-2 robot vs every level 3-4 robot | 2,128 | Giant-slayer build |

Rules: the same as in `tabletop-2.html`, with three changes. Each is marked.

- **Giant killer** is now judged against what a robot of its level usually does against higher levels: at least 1.25x that, and 6+ points above it. The old rule used the bookie's odds.
- **Hard hitter** is 5+ points (was 6+). With damage and health tuned together the spread got narrower; at 6+ nobody qualifies.
- **Armour tags (changed):** "Needs its armour" is 1.0+ logit cost (was 1.2). "Shrugs it off" is a cost of 0 or less (was 0.4 or less). The reason: armour matters less in the tuned lineup (average cost 0.4). Under the old cutoff 22 of 33 robots would "shrug it off", and the tag would mean nothing.

## 3. The full tag table

The p column is the tuned power. "Off" is the rating gap from its level's target.

| Lv | Robot | p | Off | Tags | Counter pick vs | Bad matchup vs |
|---|---|---|---|---|---|---|
| 4 | **Orbiter** | 2.31 | +17 | 🧱 Grinder<br>🌀 Brawl master<br>🩹 Shrugs it off | Trebuchet, Grandmaster, Pogo, Slingshot, Hydra | Mauler, Lodestone |
| 4 | **Pogo** | 1.02 | +8 | ⏱️ Quick finisher<br>🌀 Lost in a melee<br>🩹 Shrugs it off | Rotisserie, Trebuchet, Grandmaster, Tarantula, Hydra | Gyro, Buzzkill, Orbiter, Railgun |
| 4 | **Bricklayer** | 2.80 | +2 | - | Trebuchet | Blacksmith |
| 4 | **Jukebox** | 1.79 | +0 | 🌀 Brawl master<br>🧩 Great fit: Power kit (+25) | Scavenger | - |
| 4 | **Railgun** | 1.38 | -3 | 🎲 Coin-flip brawler | Lodestone, Scavenger, Pogo | Slingshot, Hydra, Tarantula |
| 4 | **Trebuchet** | 1.66 | -27 | 🌀 Lost in a melee | Rotisserie, Grandmaster | Pogo, Orbiter, Bricklayer |
| 4 | **Rotisserie** | 0.99 | -41 | 🎲 Coin-flip brawler<br>🌀 Lost in a melee<br>🧩 Poor fit: Overdrive (-12) | Lodestone, Gaucho, Slingshot | Hydra, Pogo, Thumper, Trebuchet |
| 4 | **Lodestone** | 1.31 | -46 | 🎲 Coin-flip brawler | Orbiter | Rotisserie, Corkscrew, Railgun, Scavenger, Slingshot |
| 3 | **Scavenger** | 1.72 | +11 | 🎲 Coin-flip brawler | Lodestone, Angler, Gyro | Slingshot, Hydra, Jukebox, Railgun |
| 3 | **Hydra** | 1.50 | -6 | 🗡️ Giant killer | Rotisserie, Scavenger, Railgun, Whaler, Tarantula | Mincer, Corkscrew, Gyro, Buzzkill, Vertigo, Pogo, Orbiter |
| 3 | **Slingshot** | 2.38 | -10 | 🗡️ Giant killer<br>🌀 Brawl master | Scavenger, Railgun, Lodestone, Angler, Grandmaster | Gyro, Whaler, Rotisserie, Orbiter, Forklift |
| 3 | **Tarantula** | 1.37 | -13 | - | Whaler, Gaucho, Railgun, Yoyo | Blacksmith, Gyro, Hornet, Pogo, Hydra |
| 3 | **Grandmaster** | 1.63 | -17 | 🧱 Grinder<br>🩹 Shrugs it off | Pincher | Pogo, Orbiter, Trebuchet, Scythe, Slingshot, Gaucho |
| 3 | **Gaucho** | 1.95 | -35 | 🧱 Grinder<br>🔨 Hard hitter | Yoyo, Grandmaster | Rotisserie, Tarantula |
| 2 | **Angler** | 1.04 | +9 | 👑 Giant-slayer: Energy shield + Prototype core + Quantum shield (5→84% vs L3/L4) | Gyro, Blacksmith, Thwacker | Corkscrew, Scavenger, Slingshot |
| 2 | **Yoyo** | 1.34 | +0 | 🩹 Needs its armour<br>👑 Giant-slayer: Prototype core + Weapon overhaul + Overdrive (30→93% vs L3/L4) | Gyro, Corkscrew | Gaucho, Tarantula |
| 2 | **Gyro** | 1.08 | -9 | 🗡️ Giant killer<br>🌀 Brawl master | Pogo, Slingshot, Hydra, Tarantula, Mauler | Forklift, Blacksmith, Whaler, Pincher, Angler, Yoyo, Popcorn, Scavenger |
| 2 | **Whaler** | 1.45 | -29 | 🧱 Grinder<br>🪚 Saw specialist<br>🩹 Needs its armour | Pincher, Gyro, Slingshot, Thwacker | Mauler, Blacksmith, Tarantula, Hydra, Hornet |
| 2 | **Pincher** | 1.75 | -37 | 🧱 Grinder<br>👑 Giant-slayer: Quantum shield + Gun drone + Tow cable (12→86% vs L3/L4) | Gyro, Corkscrew | Whaler, Grandmaster |
| 1 | **Corkscrew** | 0.75 | +38 | 🌀 Lost in a melee<br>🩹 Shrugs it off<br>⚡ Epic with Field hospital (22→68%) | Hydra, Blacksmith, Angler, Lodestone, Snapjaw, Forklift, Popcorn | Scythe, Vertigo, Yoyo, Pincher |
| 1 | **Vertigo** | 0.91 | +16 | - | Scythe, Mincer, Hydra, Corkscrew, Blacksmith | Thumper |
| 1 | **Blacksmith** | 0.94 | +13 | 🗡️ Giant killer<br>🩹 Shrugs it off | Tarantula, Whaler, Gyro, Bricklayer, Mauler, Mincer, Forklift, Thwacker | Corkscrew, Vertigo, Snapjaw, Angler |
| 1 | **Thwacker** | 2.90 | -23 | 🧱 Grinder<br>🌀 Brawl master<br>🩹 Shrugs it off<br>⚡ Epic with Mine layer (28→68%)<br>⚡ Epic with Tow cable (28→82%)<br>⚡ Epic with Pester chip (28→75%)<br>🧩 Poor fit: Field hospital (-8)<br>🧩 Poor fit: Energy shield (-5)<br>🧩 Great fit: Wall Bait chip (+25) | Wrecker, Scythe, Popcorn | Forklift, Whaler, Blacksmith, Angler |
| 1 | **Mauler** | 1.11 | -59 | 🧱 Grinder<br>🩹 Needs its armour<br>⚡ Epic with Pop-up flipper (28→60%) | Whaler, Popcorn, Thumper, Wrecker, Forklift, Orbiter | Mincer, Blacksmith, Gyro |
| 0 | **Scythe** | 0.95 | +13 | 🩹 Needs its armour<br>🧩 Great fit: Power kit (+28) | Corkscrew, Grandmaster | Popcorn, Vertigo, Thwacker |
| 0 | **Thumper** | 0.88 | +13 | 🩹 Needs its armour<br>⚡ Epic with Pop-up flipper (32→75%) | Rotisserie, Mincer, Vertigo | Mauler, Buzzkill |
| 0 | **Wrecker** | 1.15 | +11 | 🧱 Grinder<br>🩹 Needs its armour | Buzzkill, Popcorn, Hornet | Mauler, Thwacker |
| 0 | **Hornet** | 0.97 | +11 | 🩹 Needs its armour | Tarantula, Whaler | Wrecker |
| 0 | **Forklift** | 1.04 | +8 | 🧩 Poor fit: Pester chip (-15) | Gyro, Thwacker, Slingshot, Snapjaw | Corkscrew, Blacksmith, Mauler |
| 0 | **Snapjaw** | 0.95 | -2 | 🎲 Coin-flip brawler<br>🩹 Shrugs it off | Blacksmith | Corkscrew, Forklift |
| 0 | **Popcorn** | 0.97 | -2 | 🧩 Great fit: EMP burst (+30) | Scythe, Gyro | Mauler, Corkscrew, Wrecker, Thwacker |
| 0 | **Buzzkill** | 0.99 | -8 | 🧱 Grinder<br>🔨 Hard hitter<br>🩹 Shrugs it off<br>⚡ Epic with Tow cable (22→60%)<br>⚡ Epic with Gun drone (22→70%) | Hydra, Pogo, Thumper | Wrecker, Mincer |
| 0 | **Mincer** | 1.13 | -44 | 🧱 Grinder<br>🩹 Shrugs it off | Hydra, Mauler, Buzzkill | Thumper, Blacksmith, Vertigo |

## 4. What changed and what it means for the game

1. **Plenty of style tags.**
   - Giant killer ×4: Hydra, Slingshot, Gyro, Blacksmith.
   - Coin-flip brawler ×5: Railgun, Rotisserie, Lodestone, Scavenger, Snapjaw.
   - Grinder ×10.
   - Quick finisher ×1: Pogo.
   - Hard hitter ×2: Gaucho, Buzzkill.
   - Gyro is the most interesting robot. It beats the bigger robots (Pogo 92%, Slingshot 100%, Hydra 100%) but loses to almost everyone at its own level. Its bookie line will swing hard by matchup.
2. **Counter picks: 109 confirmed matchups** (25+ points off what the level gap says, on both seed sets).
   - About 3 per robot, so counter-picking in the bet phase becomes a real decision.
   - Biggest: Gyro beats Pogo 92% where 17% is normal; Mincer beats Hydra 83% where 15% is normal; Mauler beats Orbiter about 57% where 15% is normal.
   - Multiplayer: more counters mean more upsets. Good for the bookie and the tension, but a table full of counters can make the level badge feel less true. Worth watching in the playtest.
3. **Free-for-all tags: 5 Brawl masters, 4 Lost in a melee.**
   - Brawl masters: Orbiter, Jukebox, Slingshot, Gyro, Thwacker.
   - Lost in a melee: Pogo, Rotisserie, Trebuchet, Corkscrew.
   - Pogo and Rotisserie being bad in melees is a nice brake on the two flashiest top robots.
4. **2v2: no Lone wolf or Team player any more.** 2v2 follows duel strength. The biggest misses are Hornet and Trebuchet at -9, just under the line. The tag can stay in the code with an empty table.
5. **Arena tags almost gone: only Whaler (Saw specialist).**
   - With 32 fights per arena no other robot moves more than the noise.
   - The arenas still look different, but they hardly change who wins.
   - If Kev wants arena choice to matter for betting, the hazards need to be stronger or more selective (for example saws that only bite wheels, ice that hurts spinners).
   - **17 Nov update (T4): superseded by docs/robocus-arenas.md.** 32 fights was too few: with 128-256 fights a robot the arenas already moved many robots, and the hazards are now stronger (Killbox spikes on every wall, Cage 4.75 m, ice slipperier for wheels, saws and spikes grow with level). 15-19 robots now move 8+ points on Saws, Cage and Ice, 9 on the Killbox; `ARENA_FIT` and the arena tags in the game come from there.
6. **Part fits and epic combos (all re-tested on fresh seeds):**
   - Average gain from a part vs robots a level up: Prototype core +22, Quantum shield +20, Weapon overhaul +19, Tow cable +17 … Repair kit +3.
   - **Epic (gains 30+ points and 20+ above the part's average):**
     - Thwacker + Tow cable (28→82%, the old "Whiplash" holds), + Pester chip (75%), + Mine layer (68%).
     - Buzzkill + Gun drone (22→70%), + Tow cable (60%).
     - Thumper + Pop-up flipper (32→75%).
     - Corkscrew + Field hospital (22→68%).
     - Mauler + Pop-up flipper (28→60%).
   - Suggested names (they need new ones): Whiplash, Thwack-a-mole (mines), Nag (pester), Air Support (Buzzkill gun drone), Tug of War (Buzzkill tow), Launch Pad (Thumper flipper), Drill & Drip (Corkscrew hospital), Flip & Maul.
   - Thwacker with three epics is a lot for one robot. Suggestion: keep Whiplash as epic and show the other two as great fits.
   - **Great fits:** Jukebox + Power kit, Scythe + Power kit, Popcorn + EMP, Thwacker + Wall Bait. **Poor fits:** Rotisserie + Overdrive, Forklift + Pester, Thwacker + Field hospital / Energy shield.
   - **Old epics that no longer hold:** Killer Whale, Matador Moon, Popcorn Blast, Grim Rush, Blackout Lure, Pinball. Freight Train, Rocket Ram, Heavyweight, Cornerman and Stun Ram belonged to dropped robots.
7. **Giant-slayer builds:** level 0-2 robots with their 3 best parts vs every level 3-4 robot (bare). Tagged at 80%+:
   - Yo-yo + Prototype core + Weapon overhaul + Overdrive: 30→93%.
   - Pincher + Quantum shield + Gun drone + Tow cable: 12→86%.
   - Angler + Energy shield + Prototype core + Quantum shield: 5→84%.
   - Not yet tested against kitted level 3-4 robots, which the old table also reported. Two of these need two legendaries.
8. **Chip-tuned holds:** chips add +14 points on level 0-1 robots and +4 on level 2+.
9. **Body cost numbers for the repair rules** (logit cost of losing all armour) are in `tag-tuned/final.json` (`bodyCost`).
   - Highest: Whaler, Mauler, Scythe 1.2; Yo-yo, Wrecker 1.1.
   - Zero: Pogo, Orbiter, Gyro, Corkscrew, Blacksmith, Thwacker, Buzzkill, Snapjaw, Mincer, Grandmaster.

### All 58 fit candidates on fresh seeds (vs every robot a level up)

| Robot + part | Wins without | With | Gain | Part's average gain |
|---|---|---|---|---|
| Thwacker + pester | 28% | 75% | +47 | +7 |
| Thwacker + tow | 28% | 82% | +54 | +17 |
| Thumper + popper | 32% | 75% | +43 | +10 |
| Buzzkill + gunner | 22% | 70% | +48 | +15 |
| Corkscrew + hospital | 22% | 68% | +46 | +14 |
| Pincher + powerkit | 8% | 46% | +38 | +8 |
| Thwacker + mines | 28% | 68% | +40 | +11 |
| Buzzkill + waller | 22% | 58% | +36 | +10 |
| Mauler + popper | 28% | 60% | +32 | +10 |
| Buzzkill + tow | 22% | 60% | +38 | +17 |
| Scythe + powerkit | 35% | 62% | +27 | +8 |
| Popcorn + emp | 25% | 55% | +30 | +13 |
| Jukebox + powerkit | 43% | 68% | +25 | +8 |
| Thwacker + bait | 28% | 52% | +24 | +8 |
| Gyro + waller | 56% | 81% | +25 | +10 |
| Angler + mines | 21% | 46% | +25 | +11 |
| Angler + shield | 21% | 46% | +25 | +12 |
| Grandmaster + popper | 19% | 42% | +23 | +10 |
| Buzzkill + blocker | 22% | 40% | +18 | +6 |
| Mincer + blocker | 32% | 50% | +18 | +6 |
| Gyro + bodyguard | 56% | 73% | +17 | +6 |
| Popcorn + quantum | 25% | 55% | +30 | +20 |
| Wrecker + jam | 32% | 55% | +23 | +13 |
| Scavenger + pester | 41% | 56% | +15 | +7 |
| Grandmaster + armourkit | 19% | 36% | +17 | +10 |
| Mincer + repair | 32% | 42% | +10 | +3 |
| Vertigo + overdrive | 22% | 42% | +20 | +13 |
| Wrecker + pester | 32% | 45% | +13 | +7 |
| Wrecker + waller | 32% | 48% | +16 | +10 |
| Thwacker + jammer | 28% | 40% | +12 | +7 |
| Mauler + jammer | 28% | 40% | +12 | +7 |
| Yoyo + core | 35% | 60% | +25 | +22 |
| Blacksmith + hospital | 58% | 75% | +17 | +14 |
| Popcorn + popper | 25% | 38% | +13 | +10 |
| Pincher + pester | 8% | 17% | +9 | +7 |
| Railgun + popper | 55% | 66% | +11 | +10 |
| Mauler + hull | 28% | 40% | +12 | +11 |
| Scythe + overdrive | 35% | 48% | +13 | +13 |
| Thumper + pester | 32% | 38% | +6 | +7 |
| Blacksmith + gunner | 58% | 72% | +14 | +15 |
| Wrecker + jammer | 32% | 38% | +6 | +7 |
| Gaucho + jam | 28% | 39% | +11 | +13 |
| Scythe + jam | 35% | 45% | +10 | +13 |
| Corkscrew + pester | 22% | 25% | +3 | +7 |
| Popcorn + mines | 25% | 32% | +7 | +11 |
| Snapjaw + bait | 42% | 45% | +3 | +8 |
| Scythe + core | 35% | 52% | +17 | +22 |
| Hornet + booster | 42% | 45% | +3 | +10 |
| Slingshot + bait | 52% | 52% | +0 | +8 |
| Slingshot + jam | 52% | 53% | +1 | +13 |
| Pogo + waller | 61% | 59% | -2 | +10 |
| Hydra + bait | 48% | 44% | -4 | +8 |
| Pogo + gunner | 61% | 62% | +1 | +15 |
| Snapjaw + gunner | 42% | 42% | +0 | +15 |
| Thwacker + shield | 28% | 22% | -6 | +12 |
| Thwacker + hospital | 28% | 20% | -8 | +14 |
| Forklift + pester | 30% | 15% | -15 | +7 |
| Rotisserie + overdrive | 48% | 36% | -12 | +13 |

### Giant-slayer build test (vs every level 3-4 robot, bare)

| Robot | Parts | As it comes | Kitted |
|---|---|---|---|
| Yoyo | core + weapon + overdrive | 30% | 93% |
| Pincher | quantum + gunner + tow | 12% | 86% |
| Angler | shield + core + quantum | 5% | 84% |
| Thwacker | tow + mines + pester | 16% | 77% |
| Gyro | waller + booster + popper | 43% | 75% |
| Buzzkill | tow + gunner + core | 20% | 70% |
| Whaler | quantum + core + hospital | 23% | 70% |
| Wrecker | jam + pester + waller | 12% | 68% |
| Hornet | quantum + gunner + hospital | 4% | 62% |
| Vertigo | booster + core + matador | 9% | 62% |
| Scythe | jam + powerkit + hospital | 25% | 57% |
| Corkscrew | hospital + gunner + booster | 21% | 55% |
| Blacksmith | gunner + hospital + weapon | 29% | 52% |
| Thumper | core + popper + gunner | 14% | 50% |
| Mauler | popper + jammer + laser | 21% | 43% |
| Snapjaw | bait + core + emp | 7% | 34% |
| Popcorn | emp + mines + bait | 2% | 27% |
| Forklift | jam + core + matador | 11% | 20% |
| Mincer | blocker + jam + bait | 12% | 20% |

## 5. Next steps

- Kev decides on the small power nudges (section 1) and the arena question (section 4.5).
- Put the tuned lineup into the game: `lineup.js` grades plus the tables STYLE, HITTER, FFA_FIT, TEAM_FIT, ARENA_FIT, PART_FIT, EPIC, TRIPLE, BODY_COST and the matchup matrix. This replaces almost every number the bookie uses, so the odds calibration and the AI's bidding values need a re-check after it.
- Giant-slayer builds against kitted level 3-4 robots.
