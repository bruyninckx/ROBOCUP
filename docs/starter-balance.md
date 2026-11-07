# Starter balance (7 Nov 2026)

Measured with the current `src/sim.js` (same method as the game's fights): 200 duels per pair of `s1.` starters, sides swapped, real 1/60 s steps, 1 Chief Engineer, full health. The game's `SMATRIX` (AI picks, the "Starter Deck Avg Win Rate" on the draft cards) now uses this table; the old one was on average 6 points off (25 at most) after the sim changes of 6 Nov.

## Findings

- **On average the starters are fairly even**, 39–60% (Grinder lowest, Scrapper highest). Five of nine sit at 46–53%.
- **They hard-counter each other.** 36% of matchups are 80/20 or worse, 22% are 90/10 or worse (Rattler 99% vs Sparky, Top 100% vs Grinder, Zippo 0% vs Sparky).
- **So the old draft (one team at a time, seeing what is on the table) rewarded picking last:** a team that knows a rival's starter can pick a counter that wins 92% of that matchup on average. The AI picked last and did exactly that.
- **Against the Market robot cards** every starter is weak (1–28%): starters are meant to be replaced; Top holds up best (28%), Zippo worst (1%).

| vs → | Scrapper | Top | Plinker | Rattler | Tin Can | Zippo | Sparky | Lobster | Grinder | Avg | vs Market robots |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Scrapper** | – | 88 | 70 | 47 | 54 | 35 | 23 | 77 | 92 | **60%** | 5% |
| **Top** | 12 | – | 85 | 91 | 86 | 35 | 6 | 53 | 100 | **58%** | 28% |
| **Plinker** | 30 | 15 | – | 51 | 53 | 75 | 96 | 55 | 53 | **53%** | 8% |
| **Rattler** | 53 | 10 | 50 | – | 19 | 28 | 99 | 93 | 50 | **50%** | 17% |
| **Tin Can** | 47 | 14 | 48 | 82 | – | 50 | 80 | 42 | 34 | **49%** | 5% |
| **Zippo** | 66 | 66 | 25 | 72 | 50 | – | 0 | 43 | 67 | **48%** | 1% |
| **Sparky** | 77 | 95 | 4 | 1 | 20 | 100 | – | 66 | 17 | **48%** | 14% |
| **Lobster** | 24 | 48 | 45 | 7 | 59 | 57 | 34 | – | 76 | **44%** | 5% |
| **Grinder** | 8 | 0 | 48 | 51 | 66 | 33 | 83 | 24 | – | **39%** | 4% |

(Row robot's win % against the column robot.)

## Done: draft option A (Kev, 7 Nov)

Every team is dealt 2 starters at the same time and keeps 1 in secret; all picks are revealed together; the AI keeps the one with the better average. With 9 starters and 4 teams, 8 are dealt. Nobody can counter-pick any more. Half of the 36 possible pairs differ by more than 8 points on average, so the pick is often easy, but you still choose against an unknown table.

## Proposed stat tweaks (not done: Kev to decide)

One stat point moved (still 11 points, levels up to 3), measured alone with 60 duels per matchup (rough: ±6 points). Applying several at once changes the others' numbers, so they need one more measuring run together.

| Starter | Now | Tweak | After | What changes |
| --- | --- | --- | --- | --- |
| Grinder | 38% | accuracy → turret | 52% | vs Scrapper 3 → 42%, vs Zippo 32 → 87%; still 0% vs Top |
| Lobster | 46% | armour → turret | 53% | vs Top 47 → 75%, vs Zippo 60 → 80% |
| Scrapper | 62% | velocity → armour | 52% | vs Sparky 32 → 13%, vs Zippo 30 → 18% |
| Top | 60% | firepower → health | 56% | vs Scrapper 17 → 5%; still 100% vs Grinder |

The hard counters (Top vs Grinder, Sparky vs Zippo) stay: they come from the weapon types (spinner vs saw turret, laser vs flamethrower), not from the stat points. Softening those is a sim change (weapon counters), with a full watchdog run.
