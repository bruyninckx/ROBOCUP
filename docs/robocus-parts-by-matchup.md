# What is a part worth in THIS matchup? (T63, 22 Nov 2026)

Kev, about his Gyro (level 2, Race-spec Booster drone, Race-spec Jammer drone, Quantum shield) against Scavenger (level 3,
Overdrive + Weapon overhaul), where leaving one part out showed only the Quantum shield counted (T60: without it 7.5%, without
the Booster 37.3%, without the Jammer 41.5%, full build 39.3%): "why were they worthless exactly and it would be nice indeed to
somehow know this, or was it only worthless in this matchup. In case yes, can you do a design for me to check the feel of a
change like that before we do any big work".

A study: no game change, no engine change, no BUILD. Branch `claude/parts-by-matchup`. Scripts: `tools/t63-drones.js` (Part 1),
`tools/t63-opponents.js` (Part 2), `tools/t63-spread.js` (Part 2, old data); results in `tools/t63-out/`.

## Part 1: why exactly

The round-11 fight (open floor, both robots new, Gyro first), built as the game builds it (the same builds as
`tools/gyro-scavenger.js`: seed 2 gives the same fight as T60, shell motor lost at 5.1 s, KO at 78.5 s), measured step by step
from outside the engine. Seeds 1-200 for every row, the same seeds with and without each part.

**In four lines:**
1. **The drones do not die early.** Neither drone was shot down in any of 800 fights. Scavenger's fired junk passes through
   them (drones hover; only weapons, shots, beams and blasts reach them), and its scoop touched them in about 1 fight in 10, for a
   few HP.
2. **The Jammer works, but it slows the wrong thing.** It sits within 1.7 m of Scavenger 93% of the fight and jams it 87% of the
   time; Scavenger's cannon does reload slower (gaps under 1 s: 42% of shots without the Jammer, 7% with it). But Scavenger is
   short of **junk**, not of reload time. It starts with 3 scrap lumps and fires them at 0.5 s, about 3 s and 4-7 s. Then it has to
   vacuum up new junk (4th shot at 11-22 s). Those first 3-4 shots take Gyro's 40-HP shell motor (lost in 91% of fights, median
   8.5 s with the Jammer, 9.6 s without). The Jammer pushes shots 2 and 3 back by 0.6-3 s, and the motor goes anyway.
3. **What the Booster boosts is mostly already lost.** It is docked 57% of the fight, but docked *while the shell spins* only
   12%. Gyro's shell spins (over 12 rad/s) only 25% of the fight and its weapon is gone after a median 13 s. The +8% damage applies
   to about 128 of Gyro's 416 damage a fight (+10 HP). Push and speed do little for a shell spinner: the spinning shell does the
   damage, not the shove. Gyro deals 7% more with it (416 against 390) and wins 3 points more (± 9).
4. **Half a wiring gap (reported, not fixed):** the Jammer slows every other weapon by its own strength (a reload timer that runs
   at `jk` = 0.12 for this Race-spec Jammer, so about **8 times** slower). Scavenger's cannon has its own timer and gets a flat
   **x1.6**, whatever the Jammer's strength (`SCAV.reload * (c.jk < 1 ? 1.6 : 1)`, tools/damage-lab/engine.js). So Kev's Race-spec
   tier did nothing extra here. As a what-if (the same 200 seeds, a jammed Scavenger reloading like any other jammed weapon,
   0.9 s → 7.5 s): **Gyro wins 86%** instead of 38.5%, its shell motor lasts until a median 53 s (lost in 40% of fights instead of
   91%), and Scavenger fires 7.5 shots instead of 9.6.

So the answer is the second one ("they work, but what they boost is already lost") for the Booster. For the Jammer it is the
second one plus a weakly wired effect: it slows Scavenger's reload by 1.6x, not by its full strength.

### The numbers (200 fights each, seeds 1-200, `node tools/t63-drones.js --report`)

| | Full build | without Jammer | without Booster | What-if: Jammer slows the cannon fully |
|---|---|---|---|---|
| Gyro wins | 38.5% | 44.5% | 35.5% | 86% (first 160 seeds) |
| Paired gain of the part (± 95%) | | Jammer −6 ± 9 | Booster +3 ± 9 | +49 ± 9 against the real Jammer |
| Drones shot down | 0 / 200 | 0 | 0 | 0 |
| Scavenger jammed (share of fight) | 87% | 0% | 88% | 97% |
| Scavenger shots a fight (a minute) | 9.6 (8.8) | 10.6 (9.8) | 9.8 (7.8) | 7.5 (4.3) |
| Time between shots, median | 2.2 s | 1.5 s | 2.4 s | 10 s |
| Shots 2 / 3 / 4 at (median) | 3.0 / 7.0 / 21.6 s | 2.4 / 3.8 / 11.5 s | | |
| Shots fired before the shell motor dies (median) | 3 | 4 | | |
| Shell motor lost (median time) | 91% (8.5 s) | 92% (9.6 s) | 94% (12.3 s) | 40% (53 s) |
| Gyro's weapon works until (median) | 12.8 s | 14.6 s | 17.1 s | 96 s |
| Shell spinning (share of fight) | 25% | 25% | 26% | 60% |
| Booster docked / docked while the shell spins | 57% / 12% | 58% / 13% | | 58% / 31% |
| Gyro damage dealt a fight | 416 | 455 | 390 | 721 |

- "Within 1.7 m" is the Jammer's own range: it flies to 1.15 m from the enemy, so it nearly always is. Jammed share is a little
  below that because the jam is set by the drone's position each step.
- The shell still does damage after its motor dies (a coasting or loose shell is still "shell" damage), which is why Gyro deals
  ~290 shell damage a fight with a working weapon for only 13 s.
- The Jammer's other effects do not apply to Scavenger: it has no turret (turret turn 45%), no module (module blocked) and no
  spinner (spin-up). Its vacuum is not slowed.
- Gyro is slower while the Booster is docked (0.73 against 1.05 m/s): the drone only docks when Gyro goes straight-ish. Over the
  whole fight Gyro is about 17% faster with it (0.87 against 0.74 m/s).
- The without-Jammer row is a little better than the full build (−6 ± 9 for the Jammer; T60 had −2 on 400 fights). Both are
  within the noise: the Jammer is worth about zero here, not clearly negative.
