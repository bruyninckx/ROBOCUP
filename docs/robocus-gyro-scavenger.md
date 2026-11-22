# Gyro against Scavenger: was it bad luck? (T60, 22 Nov 2026)

Kev (playtest 22 Nov, build 2026-11-22e): "for some reason, scavenger really slapped my stacked gyro although it was not an
indication in the power map??" and "can you check with these specific matchup if it was odd chance".

## Short answer

1. **Round 9 (Killbox): mostly bad luck.** Rebuilt as the game builds it, Gyro wins **65%** of 300 fights (95% range 59-70%),
   the same as the bookie's 65% (154 test fights). The live cards played in that fight change nothing (65% of 300 with them).
   But the *way* it ended is very rare: a KO of Gyro inside 15 s happened in **5 of 600** fights (about 1 in 120), and
   "chassis torn apart (debris)" inside 15 s in **0 of 600** Killbox fights (1 of 277 on open floor). A 1-in-200-or-rarer ending.
2. **Round 11 (open floor): not bad luck: the bookie was too kind to Gyro.** With the bookie's own seeds, Gyro wins
   **40%** of 140 (95% range 32-48%; 37% of 137 with other seeds), where the bookie said 55% (126 test fights). Scavenger
   winning was the likely result. Why the bookie's test fights gave 55% we could not reproduce (see "Open points").
3. **Why Scavenger is dangerous for Gyro:** its fired junk shoots off Gyro's **Shell motor** first in nearly every fight
   (in 86% of the Killbox fights and 94% of the open-floor fights Gyro loses it, half the time within 7-9 s; 254 of 257 times
   to junk). A Gyro without its spinning shell has no weapon. Scavenger's two parts make that happen: bare Gyro vs Scavenger
   with Overdrive + Weapon overhaul wins only **5%** (148 fights); bare against bare, **20%** (102 fights; the table says 3 of 20).
4. **Of Kev's three parts only the Quantum shield works here.** It alone takes Gyro from 7% to about 39% (200 fights each).
   The Booster drone adds 3 points (within the noise), the Jammer drone nothing (Gyro does 6 points *better* without it, also
   within the noise). On Scavenger's side the **Overdrive** does the damage: take it off and Gyro wins 63%; take the Weapon
   overhaul off and Gyro wins 46%.
5. **A bug that looks like Kev's round 9 ending:** when Gyro's spinning shell is knocked off, the loose ring can stay jammed
   against Gyro's chassis; if Scavenger then pushes on it, every physics step counts as a "debris" hit and the whole chassis
   (229 HP) goes in about 2 seconds. Reported, not changed (engine). Details below.

## How the fights were rebuilt

`tools/gyro-scavenger.js` builds each robot as the game does (`spec2`: `Lineup.build(name, parts, tiers)` + level, the engine's
`create({a, b, seed, arena, wear: true})`, countdown 0 as the bookie). Checked against the page: the same 12 seeds give the
same winners and times in the page (`ROBOCUS_DEBUG.spec2` + `DamageLab.create`) and in node. One line per fight in
`tools/t60-out/<config>.jsonl`; `node tools/gyro-scavenger.js --report` sums them up.

From Kev's log (`kev-log-22nov-b.json`), and what had to be assumed:

- Gyro: level 2, **Race-spec Booster drone** (`p_booster~2`), **Race-spec Jammer drone** (`p_jammer~2`), Quantum shield
  (Standard). Scavenger: level 3, Overdrive and Weapon overhaul, both Standard (lot ids without a tier).
- Round 9, Scavenger "Body 54%, saw cuts": the exact wear is not in the log. It came from its round 8 KO of Gaucho (a saw robot),
  then the Upkeep body heal and a crew repair of its Weapon zone. We made 6 look-alikes by re-running that fight and keeping
  Scavenger wins that read Body 50-53%, saw cuts, Drive and Weapon fine after the same Upkeep; each test fight uses one of them.
- Gyro in round 9 is taken as new: its card said "no damage", but a card hides zones above 70% and wear marks (it fought Whaler
  in round 7; only the Weapon zone was repaired since). Round 11: Gyro had all three zones repaired in round 10, so as new.
- Round 11, Scavenger "no damage": taken as new; a second run gives it the wear it may have carried from round 9 (see Open points).
- The fight seed is not in the log, so no exact replay of Kev's two fights. The bookie's seeds can be rebuilt (`simOdds`:
  round and teams), and were used for round 11 (`--bookie=11:0-1`).

## Round 9: Killbox, Scavenger (Body 54%) vs Gyro

| | fights | Gyro wins | 95% range |
|---|---|---|---|
| Bookie on Kev's PC | 154 | 65.6% | |
| Rebuilt (no cards) | 300 | 65.0% | 59-70% |
| Rebuilt with the two live cards (Chip Hack on Gyro at 5 s by team 3, Field Engineer on Scavenger at 9.3 s) | 300 | 65.3% | 60-71% |

- How Gyro loses (105 losses): median 57 s (quarters 39 / 57 / 81 s). Over inside 15 s: 2 of 300 (with the cards 3 of 300).
  Endings: immobilised 31, crippled 22, radio receiver 15, battery 12, chassis torn apart 11; debris KOs 0 (3 of 300 with the cards).
- The Killbox's spikes and saws took a Gyro part in 18 of the 105 losses (10 of 104 with the cards): they are not what beats Gyro.
- Scavenger loses no part at all in 17 of 300 fights (6%), as in Kev's fight. In Gyro's wins Scavenger is mostly crippled (123)
  or immobilised (43): the shell spinner and the Killbox wear down its damaged body.
- The Chip Hack on Gyro (5 s) and Field Engineer on Scavenger did not change the odds.

So round 9 was a 65/35 fight that went to the 35, and it went in an unusually fast way (see the bug below).

## Round 11: open floor, Gyro vs Scavenger (both "no damage")

| | fights | Gyro wins | 95% range |
|---|---|---|---|
| Bookie on Kev's PC | 126 | 54.8% | 46-63% |
| Rebuilt, the bookie's seeds | 140 | 40.0% | 32-48% |
| Rebuilt, seeds 1-137 | 137 | 37.2% | 30-46% |
| + Gyro's face-down Smudged Lens (−25% weapon damage), bookie seeds | 140 | 29.3% | 22-37% |
| + Lens + the live cards (Kev's EMP Grenade at 1.1 s, Rust Rivets' Supply Drop "overcharge" at 8 s), bookie seeds | 140 | 31.4% | 24-40% |

The face-down Smudged Lens on Gyro (which the bookie can't see) cost Gyro about 10 points; the live cards changed little.
With all of it Gyro had about a 30% chance: Scavenger winning was the expected result.

- How Gyro loses (84 losses, bookie seeds): median 81 s; KO 109 of 140, judges 31. Endings: immobilised 26 (Kev's fight:
  "immobilised, no working wheels" at 58 s, a typical one), crippled 14, battery 14, judges 14. Scavenger loses nothing in
  39 of 140 fights (28%), in about half of its wins.
- The shell motor goes to junk in 133 of 140 fights, median at 13.6 s.

## Why: bare robots and each part (open floor)

Same seeds (1-200) for every row, Scavenger and Gyro as new, open floor.

| Gyro | Scavenger | fights | Gyro wins | 95% range |
|---|---|---|---|---|
| bare | bare | 200 | 18.5% | 14-25% (the table: 3 of 20) |
| bare | Overdrive + Weapon overhaul | 200 | 7.0% | 4-11% |
| **Booster + Jammer + Quantum** | **Overdrive + Weapon overhaul** | 200 | **38.5%** | 32-45% |
| without Booster (Jammer + Quantum) | Overdrive + Weapon overhaul | 200 | 35.5% | 29-42% |
| without Jammer (Booster + Quantum) | Overdrive + Weapon overhaul | 200 | 44.5% | 38-51% |
| without Quantum (Booster + Jammer) | Overdrive + Weapon overhaul | 200 | 7.5% | 5-12% |
| Booster + Jammer + Quantum | without Overdrive (Weapon overhaul) | 200 | 63.0% | 56-69% |
| Booster + Jammer + Quantum | without Weapon overhaul (Overdrive) | 200 | 45.5% | 39-52% |
| Booster + Jammer + Quantum | bare | 200 | 69.5% | 63-76% |

What it says:
- Scavenger fires junk; with Overdrive (damage x1.52) and the Weapon overhaul (x1.29) a few hits take Gyro's **Shell motor**
  (bare Gyro against that Scavenger: the shell motor is the first part lost in 181 of its 186 losses, which come after a median
  42 s). Bare against bare it is the first part lost in only 11 of Gyro's 163 losses.
- The **Quantum shield** cancels the first real hit after it recharges (every 8 s) and phases Gyro out: Gyro phases 3-4 times a
  fight, which buys the time its shell needs. It is the whole difference.
- The **Booster** and **Jammer** drones do nothing measurable against Scavenger. The Jammer slows the enemy weapon and blocks
  its module; Scavenger has no module and its junk gun seems not to care.
- The power map and the bookie's formula count each part as about a level for any rival ("Fights like ★7"), so they read this
  Gyro as far above a ★3 Scavenger with parts. Against Scavenger two of the three parts are worth nothing.
- Bigger runs (400 fights for the rows above, 1,000 for rounds 9 and 11) are still filling in `tools/t60-out/`.

## A bug: a knocked-off shell grinds its own Gyro's chassis

Seed **1583827593**, round 11 build (open floor, `a` = Gyro with Race-spec Booster and Jammer and Quantum, `b` = Scavenger with
Overdrive + Weapon overhaul, countdown 0, wear on): Shell motor lost at 6.7 s, Spinning shell knocked off at 8.3 s. The loose
shell ring stays 0.39 m from Gyro's centre, touching Gyro's chassis at four points while it hardly turns (0.3-5 rad/s), and
Scavenger pushes on it. From 9.1 s the chassis loses 0.5-2 HP **every physics step** (contact impulse about 37-40 each step,
counted as a "debris" hit, capped at 45 so 2-3 HP a step), 229 → 0 by 11.1 s: "Gyro chassis torn apart (debris)", the same
ending as Kev's round 9. A steady push on a loose part is counted as a new impact 120 times a second. 7 of about 1,100 fights
end like this (chassis by debris right after the shell came off). Replay: `node -e "const m=require('./tools/gyro-scavenger.js'); console.log(m.fight(m.CFG.r11, 1583827593))"`. Not changed here (engine work: tools/damage-lab).

## Open points

- The round 11 gap (bookie 55%, rebuilt 40% with the bookie's own seeds: 51 Gyro wins in the first 126 seeds, the bookie
  counted 69). The round 9 rebuild matches its bookie exactly, so the
  builds are right; something in Kev's round 11 robots was not as the log shows. Most likely Scavenger's hidden wear from round 9
  (a card shows only zones below 70%). A run with look-alikes of that wear (Scavenger after a round 9 win, Upkeep, Body repaired, Drive and Weapon above 70%):
  Gyro 41% of 115, no change. With wear switched off (BAL.wear false): 32% of 126, no closer. To settle it the `bookie` event
  could log the exact fight it ran (the two specs with their wear); question for Kev / the orchestrator.
