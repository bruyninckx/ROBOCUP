# Is a Fan Favourite a money runaway? (20-21 Nov 2026, T35)

Kev (20 Nov, after a solo game against 3 AI teams): "I can runaway in money by making a robot fan favourite and after that
getting into battles by whatever means, they cannot scrap it and I get payed a lot. Can you check by doing AI battles if this
can be countered or should we balance it".

This is a measurement. Nothing changes for players: every switch below is off by default, and with the defaults bot games
play out exactly as on main (10 of 10 seeds identical, section 1).

**Base:** main 27604e5 (T26 one-step Market, T29 start credits **10**, T31 timers, T33/T34 in; the Repair kit is in the
deck). An earlier partial run on 47c1f5c (start credits 10, old Market) gave the same picture; its numbers are not used.

<!-- ANSWER -->

## The mechanism in plain words

- A robot gets a Fan token for every win. At 3 tokens (Apex Media: 2) it is a **Fan Favourite**: +1 fame while it stays on
  the team, and it **can't be scrapped** at the Fate step.
- **Appearance money** is paid to every invited team, win or lose: 2 Cr, plus 2 per Fan token on its robot, or **6 in all for a
  Fan Favourite**.
- So a Fan Favourite that fights every round brings 6 Cr a round for free and can't be taken away by the host. The question is
  how often it gets into fights, and what else the team gives up for it.

How a Fan Favourite gets into a fight:
- Its own team hosts and invites itself (an AI host invites itself when its best matchup is 55%+).
- An **AI host that stays out puts the fame leader against the rival most likely to beat it** (80% of the time). A team that
  leads in fame is invited by AI hosts a lot, Fan Favourite or not. No AI host avoids a Fan Favourite.
- A person can pay an AI host 2+ Cr to be invited. AI teams never make such offers to an AI host; they do make them to a
  **person who hosts** (to be invited or left out, 55% of the time each, 1-2 Cr), and AI losers offer a host credits to spare
  their robots. This is where part of Kev's credits came from (host deals +9, backing +12 in his game).

## 1. How it was measured

- `tools/game-sim.js` plays whole 4-team AI games headless (start fame 0, win at 12, AI v2). Seeds 1-100 (part A) or 1-60;
  the same seeds in every run, so differences are paired seed by seed. ± is a 95% range (1.96 × standard error).
- Seat 0 is the tested seat. With the normal AI there it wins 29% ±9 of 100 games (par 25%).
- New recording (no change to play): robot Fan tokens at every Upkeep, every losing Fan Favourite the host could not scrap,
  the host of each round; the per-team credit ledger by source was already there (`cr` events).
- Report: `node tools/fan-fav-report.js [--deep] <baseTag> <tag2> ...` (header of the file says what it reads).
- Same seeds, same results: seeds 1-10 with all defaults on main 27604e5 and on this branch: **10 of 10 games identical**
  (rounds, winner, fame, credits, fights, every credit change, host scraps).
- A game that stalled was re-run alone (game-sim stalls now and then on a slow start); every number below is from finished games.

## 2. Part A: what a Fan Favourite is worth in normal AI games (100 games)

| | |
|---|---|
| Team-games with a Fan Favourite | 184 of 400 (46%); Apex Media teams 73% |
| Games where some team has one | 95% |
| Round the first one is made | r2-r5: 33, r6-r8: 72, r9-r12: 79 (median about round 8) |
| Appearance money per team-round | **2.8 Cr with a Fan Favourite**, 1.9 without (669 / 3,919 team-rounds) |
| How often the Fan Favourite fights | 211 fights in 713 team-rounds (**0.3 a round**); it wins 53% |
| Losing Fan Favourites kept safe | 0.8 a game; 69 of 84 belonged to a fame threat to the host |
| ... of which the host would have scrapped | about **0.2 a game** (other losers in the same spot are scrapped 27% of the time) |

Matched comparison (does it help, or was the team already winning?): every team at the Upkeep where its first Fan Favourite
shows, against all teams in other games at the same round with the same fame and no Fan Favourite (181 teams):

| | with its first Fan Favourite | same round and fame, none | difference |
|---|---|---|---|
| Wins the game | 39% | 32% | +7 ±8 pts |
| Credits earned in the next 3 rounds | 24.0 | 23.7 | +0.3 ±1.5 |
| Fame gained in the next 3 rounds (or to the end) | 1.7 | 1.7 | 0.0 ±0.2 |

**In normal AI games a Fan Favourite is no runaway.** It is worth about 1 Cr a round (it fights only every third round) and
the +1 fame it brings, and a team that has one does no better than a team with the same fame without one, beyond noise.

<!-- B -->
