# ROBOCUS: the Repair kit gets something extra (T49, 22 Nov 2026)

Kev (voting page, 21 Nov): "Give it something extra, for example protecting the battery". He also chose 2 copies in the deck (done)
and to leave Mauler's built-in repair module as it is.

**Status: a study.** Four extras are in the engine, each behind its own setting. **All are off**, so the game plays exactly as on
main. Kev picks one, and then it gets switched on in one place (`PK` in `tools/damage-lab/lineup.js`).

## In short

- **With wear on, the kit is weaker than we thought.** It is worth **+0.40 of a level** (± 0.16), not the +0.64 measured on 16 Nov
  before wear. A normal part is worth about 0.75.
- **Why healing does not win fights:** the kit turns a torn-apart chassis into a loss on points. With the kit, chassis KOs drop from
  11% to 4% of fights, but losses at time-out go up from 9% to 16%. Broken drives (23%) and blown batteries (9-11%) stay where
  they were.
- **Protecting the battery (Kev's example) hardly helps: +0.04.** Even a battery that cannot break saves almost no fights. In 9 of
  12 battery KOs we looked at, the kit had already been smashed by then. With the battery made unbreakable, robots that would have
  lost their battery lose their chassis or their drive a bit later instead. They were already beaten.
- **Recommended: (c) "it hammers out the dents".** The kit also straightens bends, kinks and warps and closes cracks and saw cuts.
  At setting 0.5 the kit is worth **+0.74** overall and **+0.77 / +0.77 / +0.71** on level 0-1 / 2-3 / 4, which is right on target
  and even across levels. It goes with the new wear system, and you can see it working: the marks fade during the fight.

## 1. How the test works

- `tools/damage-lab/kitextra.js` puts every robot (33), with or without the part, against every robot a level up (level 4 robots
  fight their own level). That is 204 pairings, on the same seeds as `parttest.js` and the 16 Nov test. Wear is on, the open floor,
  the game's robots and part strengths.
- Each variant is compared with "no part" on exactly the same fights. Each extra is also compared with "kit as today", and that
  comparison is much more precise, because the two fights stay the same until the extra makes a difference.
- Levels are worked out as in `parttest-report.py`: one level = the gap between winning 64% and 50%. **± is a 95% range.**
- **Fights per variant:** 2,448 (12 per pairing) for no part, kit as today, the 3 extras that can reach the target, and the strong
  battery setting. 816 (4 per pairing) for the 4 reference parts and the first tries at each setting. In all, 31,008 fights,
  at about 3.4 fights a second on the 2 cores here.
- Results: `tools/damage-lab/kit-extra/*.jsonl`, one line per fight. To make the tables:
  `python3 tools/damage-lab/kitextra-report.py tools/damage-lab/kit-extra/*.jsonl [--vs kit] [--robots VARIANT]`.

## 2. Where the kit stands today (wear on)

| Part | Fights | Wins vs a level up (none 37-38%) | Levels: all | L0-1 | L2-3 | L4 |
|---|---|---|---|---|---|---|
| **Repair kit (today)** | 2,448 | 43% | **+0.40 ± 0.16** | +0.22 ± 0.30 | +0.55 ± 0.27 | +0.45 ± 0.31 |
| Medic drone | 816 | 46% | +0.60 ± 0.27 | +0.58 | +0.85 | +0.31 |
| Reinforced hull | 816 | 48% | +0.74 ± 0.26 | +0.84 | +0.97 | +0.37 |
| Tow cable | 816 | 49% | +0.81 ± 0.28 | +0.16 | +1.46 | +0.76 |
| Energy shield | 816 | 54% | +1.14 ± 0.28 | +0.86 | +1.59 | +0.95 |

The group numbers for the reference parts are good to about ± 0.5. The four reference parts average **+0.82**, so with wear on
"a normal part" is still about three quarters of a level (the shield looks strong: worth a look of its own, not part of this task).
The kit is about half that.

**How fights end** (share of all fights, from the side of the robot with the part):

| | Lost: battery | Lost: chassis | Lost: drive | Lost: radio | Lost on points | Won on points | Won by KO | Time-outs | Fight length |
|---|---|---|---|---|---|---|---|---|---|
| No part | 11% | 11% | 24% | 7% | 9% | 7% | 30% | 16% | 68 s |
| Kit today | 9% | **4%** | 23% | 5% | **16%** | 9% | 33% | **25%** | 76 s |

("Drive" means immobilised or crippled and counted out; it is the biggest single cause.) The kit keeps the chassis whole, so more
fights go the distance, but the judges score damage dealt and parts knocked off, and healing scores nothing.

## 3. The four extras

Each one only affects the **part card**. Mauler's built-in module is untouched, and Mauler with the card gets the extra like any
other robot. All settings are 0 (off) in `PK`.

| | Setting | What it does (card line) | How it works in the engine |
|---|---|---|---|
| (a) | `repairBatt` (+ `repairBattAny`) | "...and shields the battery: it takes half (or no) damage while the kit works." | Battery damage x (1 - setting) while the kit module works; with `repairBattAny` 1 it holds even after the kit is smashed |
| (b) | `repairFix` | "...and gets burnt-out motors running again and clears jams." | A dead drive motor (wheel still on) or weapon motor builds up HP at setting x the kit's internal rate and starts again at 25% HP ("FIXED!"); jams clear faster |
| (c) | `repairWear` | "...and hammers out bends and cracks as it goes." | Twice a second every bend, kink, warp, crack and saw cut shrinks by setting x 0.5 (under fire x 0.3); the shape, wheel rub and weak spots follow |
| (d) | `repairScore` | "...and the judges count what it repairs." | On a time-out the judges add setting x the chassis HP the kit repaired |

## 4. What each extra adds

"Over today" = the same fights, kit with the extra compared with the kit as it is (precise). "Total" = compared with no part.

| Extra | Setting | Fights | Over today | **Total** | L0-1 | L2-3 | L4 | Time-outs | Fight length |
|---|---|---|---|---|---|---|---|---|---|
| none (kit today) | - | 2,448 | - | **+0.40 ± 0.16** | +0.22 | +0.55 | +0.45 | 25% | 76.1 s |
| (a) battery | 0.75 | 816 | +0.04 ± 0.11 | | | | | 25% | 75.7 s |
| (a) battery | 1 | 816 | +0.07 ± 0.11 | | | | | 26% | 76.1 s |
| (a) battery, even after the kit is smashed | 1 + any | 2,448 | +0.04 ± 0.09 | **+0.42 ± 0.21** | +0.18 | +0.60 | +0.53 | 27% | 78.3 s |
| (a)+(b) battery and motors | 1 + fix 1 | 816 | +0.19 ± 0.17 | | | | | 28% | 76.1 s |
| (b) motors | 0.5 | 816 | +0.20 ± 0.17 | | | | | 27% | 75.8 s |
| (b) motors | **1.5** | 2,448 | +0.26 ± 0.10 | **+0.66 ± 0.16** | +0.51 | +0.84 | +0.66 | **28%** | 77.6 s |
| (b) motors | 3 | 816 | +0.26 ± 0.18 | | | | | 28% | 77.6 s |
| (c) dents | 0.1 | 816 | +0.34 ± 0.23 | | | | | 25% | 76.5 s |
| (c) dents | 0.3 | 2,448 | +0.29 ± 0.14 | +0.70 ± 0.17 | +0.67 | +0.73 | +0.73 | 26% | 77.7 s |
| (c) dents | **0.5** | 2,448 | +0.33 ± 0.13 | **+0.74 ± 0.16** | **+0.77** | **+0.77** | **+0.71** | 25% | 77.0 s |
| (c) dents | 1 | 2,448 | +0.41 ± 0.14 | +0.82 ± 0.16 | +0.86 | +0.86 | +0.77 | 25% | 77.4 s |
| (d) judges | 1 | 816 | +0.20 ± 0.08 | | | | | 25% | 74.6 s |
| (d) judges | **2** | 2,448 | +0.34 ± 0.06 | **+0.74 ± 0.17** | +0.72 | +0.88 | +0.64 | 25% | 76.1 s |
| (d) judges | 3 | 816 | +0.67 ± 0.14 | | | | | 25% | 74.6 s |

The group numbers in the "total" columns are good to about ± 0.3.

What it says:
- **(a) battery: does not reach the target at any setting** (+0.04 to +0.08). With `repairBattAny` 1 the battery KOs go from 8.5%
  to 0%, but chassis KOs go from 4% to 9% and drive KOs stay at 24%. The robots it saves were losing anyway.
- **(b) motors: tops out at about +0.26** over today (1.5 and 3 give the same). Drive KOs go from 23% to 19%, but more fights end
  on points (time-outs 25% → 28%): a robot running on a fixed motor still loses on points.
- **(c) dents: +0.29 to +0.41, and it grows only slowly with the setting**, so it is safe to tune. At 0.5 every level group gets
  about the same. Drive KOs go 23% → 20% (plates bent into wheels get pushed back out) and wins by KO go up (opponents counted out
  15% → 18%). Time-outs and fight length stay the same as today. Marks left on the robot at the end of a fight: 4.7 → 1.2 at 0.3
  (36 test fights), so the robot also comes out of the fight with fewer marks for the Upkeep card.
- **(d) judges: does exactly what it says and is very predictable** (± 0.06), but it only matters at time-out, it changes nothing in
  the fight itself, and it is the hardest to explain as "a repair kit". Setting 3 jumps (+0.67): too steep to tune finely.
- **Nobody becomes unkillable, and fights don't drag on.** The best single robot with any extra wins 70-76% against a level up
  (Pogo, Railgun; without a part, the best is 65%). The shield's best is 92%. Time-outs go up by 3 points at most ((b)).
- **Level 0-1 robots still don't beat level 2 as a rule:** with (c) 0.5 level 0-1 robots win 38% against a level up (today's kit
  35%, no part 32%).
- **Mauler with the card** (60 fights each way, noisy): 28% → 32% with today's kit, 38% with (c) 0.5, 37% with (d) 2, 33% with (b)
  1.5. Its built-in module (Mauler without the card) is never touched by any extra.
- **Who gains most from (c) 0.5** (against today's kit, 60-96 fights each): Corkscrew 17 → 40%, Hornet 33 → 55%, Bricklayer 56 →
  73%, Gaucho 29 → 45%. Least: Buzzkill 43 → 37% (60 fights: within noise).

## 5. Recommendation: (c) at 0.5

- **Card text:** "Repairs the robot all the time, fast when it is not being hit, and hammers out bends and cracks; grows with the
  robot's level (replaces the module)." (Name unchanged.)
- **Switch on:** `repairWear: 0.5` in `PK` (`tools/damage-lab/lineup.js`), then `build.py`.
- **`PART_LV.repair`** in tabletop-2: today [0.64, 0.92, 0.74, 0.25] (measured before wear). Measured now: kit as it is
  **[0.40, 0.22, 0.55, 0.45]**; with (c) 0.5 **[0.74, 0.77, 0.77, 0.71]**. Either way the old numbers should go: the card badge
  shows them.
- **Bookie:** it counts every part as 0.42 (about 0.72 of a level), which fits the kit with (c) at +0.74. No change needed. (Today's
  kit at +0.40 is overrated by the bookie by about a third of a level.)
- **Multiplayer:** this is an engine and lineup change, so the files stamp changes and everyone must be on the new version (the red
  bar shows anyone who isn't). Fights stay deterministic (no new randomness). The sync-check reference 89a95280 only changes if one of
  its fights uses the kit card.
- **Balance:** a level 0-1 robot with the kit wins 38% against a level up (a normal part gives 36-45%), so it does not beat level 2.
  The kit stays a defensive part: whole games may get a little longer when it is bought (fight length +1 s, time-outs unchanged).
- **Second choice, if Kev wants the battery (his example):** (a) can't carry the card alone. "(a)+(b)" (battery and motors, "looks
  after the insides") is about +0.6 (816 fights, ± 0.17 over today). (d) at 2 hits the target too, but it does not show in the
  fight.

## 6. Settings, checks, files

- Engine (`tools/damage-lab/engine.js`): `kitExtra()` next to the `repair` branch of `modules()`, the battery line in `hit()`, the
  judges in `judge()`. Settings `ARC.pk.repairBatt / repairBattAny / repairFix / repairWear / repairScore`, all 0 in `PK`
  (`lineup.js`) = today's kit.
- With all of them off, fights are identical bit for bit: the stock-fight fingerprint (`l4-regress.js`) is 470f6923 as on main, the
  sync-check reference is 89a95280 as on main, and kit fights come out identical to main's engine (checked on sample fights).
- The files stamp changes (3e38ef63 → new) because the text of engine.js and lineup.js changed, even with everything off.
- No change to BUILD or CHANGES: players see nothing yet.

## 7. A bigger run on Kev's PC (optional)

The build box managed 2,448 fights for each main variant. Kev's PC can do 16 per pairing (3,264 fights a variant, 10 variants,
reference parts included) in about 15-30 minutes:
- Double-click **`tools\kit-extra.cmd`** (it clones `claude/repair-kit-extra` into `%USERPROFILE%\robocus-kit`, so your ROBOCUS folder is
  not touched, and runs `node tools\damage-lab\kitextra-pc.js 15 16`). You can close it and start it again; it picks up where it stopped.
- Send back `%USERPROFILE%\robocus-kit\tools\damage-lab\kit-extra-pc\report.md`.
- What it adds: the reference parts and (a)/(b) at the same precision as (c) and (d) (about ± 0.13 instead of ± 0.27), and per-robot
  numbers on 48-64 fights instead of 20-32.

## Questions for Kev

1. Which extra? Recommended **(c) "hammers out bends and cracks", setting 0.5**. Your example, the battery (a), barely helps on its
   own: keep it as part of a combo with (b), or drop it?
2. Should `PART_LV.repair` (the card badge) move to the measured numbers now, even before an extra is picked? Today's badge says +¾,
   but the measured value is +0.40.
3. The Energy shield measured +1.14 with wear on (816 fights, ± 0.28), above the 0.75 target. Re-tune it in a separate task?
