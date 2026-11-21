# Is a Fan Favourite a money runaway? (20-21 Nov 2026, T35)

Kev (20 Nov, after a solo game against 3 AI teams): "I can runaway in money by making a robot fan favourite and after that
getting into battles by whatever means, they cannot scrap it and I get payed a lot. Can you check by doing AI battles if this
can be countered or should we balance it".

This is a measurement. Nothing changes for players: every switch below is off by default, and with the defaults bot games
play out exactly as on main (10 of 10 seeds identical, section 1).

**Base:** main 27604e5 (T26 one-step Market, T29 start credits **10**, T31 timers, T33/T34 in; the Repair kit is in the
deck). An earlier partial run on 47c1f5c (start credits 10, old Market) gave the same picture; its numbers are not used.

## Answer in plain words

- **Can it be countered by play? Yes.** A Fan Favourite earns its 6 Cr only when it is invited; a table that won't invite it,
  outbids it for the host seat and aims sabotage and Smear cards at it takes most of that away. The AI doesn't do this (an AI
  host even invites the fame leader on purpose), which is why it felt unstoppable against 3 AI teams.
- **Is it a runaway in bot games? No.** In 100 normal games a Fan Favourite fights every third round and is worth about 1 Cr a
  round; a team with one does no better than a team with the same fame without one (+7 ±8 pts wins, +0.3 ±1.5 Cr). Played as
  hard as the rules allow by a test AI (Apex Media, host and invite itself, pay to be invited), the line earns **16 Cr more a
  game** but wins **as often as the normal AI** (-2 ±20 pts, 40 games); with hoarding on top it wins **less** (-13 ±12, 100 games).
- **Should we balance it?** Not needed by these numbers. If Kev wants a brake for tables of people: **a Fan Favourite that loses
  drops a Fan token** (one line, changes nothing measurable in a normal game), or **a Fan Favourite earns 4 Cr, not 6**.
- **Kev's lead was mostly hoarding**: he spent 48 Cr in 7 rounds where an AI team spends about 60 (104 in an 11.5-round game), made no repairs, and AI teams paid him
  21 Cr in deals and backing (they pay a person, never each other). Hoarding is not stronger for the AI (+0 ±12 without
  surplus spending, -13 ±16 skipping the Market to host), but a person's pile of credits buys the host seat at will (an AI bids at
  most the richest rival + 1). That is a separate question for Kev (section 8).


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

## 3. Part B: does Kev's line beat the AI?

The line as a test AI in seat 0 (`rw`, `tools/game-sim.js --aip0='{"rw":1,...}'`), against three normal AI teams, the same
seeds as the normal AI in seat 0:
- **Apex Media** at any price in the sponsor auction (Fan Favourite at 2 wins);
- **hosts**: +4 Cr on what hosting is worth to it, and as host it always invites itself (its best matchup);
- **sends its Fan Favourite** to every fight it is in (else its robot with the most wins and 45%+ odds);
- **pays an AI host 2 Cr to be invited** when it has a ready Fan Favourite (the host takes it, as it would from a person);
- **hoards**: no Market bids but a 2nd robot and Mechanics; `spendK 0` (no surplus spending); repairs broken zones as the AI does;
- **backs any scheme for pay**;
- `rwTips`: when it hosts, the other AI teams offer it the invite deals they offer a person who hosts (AI hosts get none otherwise).

"Kev line" = all of that. Paired change = seat 0 win rate minus the normal AI's in seat 0 on the same seed.

| Seat 0 plays | Games | Seat 0 wins | Paired change | Hosts a game | Fan Favourite (games, median round made) | Appearance Cr a game | Market Cr | Repairs Cr | Credits at Upkeep 7 / 9 |
|---|---|---|---|---|---|---|---|---|---|
| normal AI | 100 | 29% ±9 | - | 2.9 | 46%, r7 | 22.5 | -30 | -8 | 6.5 / 7.4 |
| **Kev line** | 100 | **16% ±7** | **-13 ±12 pts** | 4.0 | 71%, r4 | **38.5** | -6 | -26 | 7.5 / 8.3 |
| Kev line without rwTips / spendK 0 | 100 | 18% ±8 | -11 ±11 | 4.2 | 71%, r4 | 41.4 | -8 | -28 | 7.0 / 7.6 |
| Kev line, no Apex Media | 60 | 28% ±11 | -10 ±17 | 4.9 | 45%, r7 | 40.4 | -9 | -20 | 8.7 / 10.0 |

(The other three teams win 24% each against the normal AI, 28% against the Kev line. Game length 11.5 rounds in all.)

**The line earns what Kev saw, and still loses.** It brings in about **16 Cr more appearance money a game** (38.5 against 22.5)
and gets its Fan Favourite 3 rounds earlier, but it pays for that: about 24 Cr less goes into the Market, so its robots stay
plain; they fight every round they can, so they need about 18 Cr more in repairs; and it pays 11 Cr more for host bids. Its
credits at Upkeep stay at 7-10, like everyone's: the money comes in and goes out again. Fame from fight wins drops (2.8 a game
against 3.5) because plain, battered robots lose more. It wins 13 points less than the normal AI in the same seat.

Without Apex Media it gets a Fan Favourite less often (45% of games, as the normal AI) and still earns 40 Cr appearance money
(it fights every round); it does a little better (-10 ±17, within noise of the Apex line).

Which part carries what: the appearance money comes from being in every fight (host and invite itself, pay to be invited), not
from the Fan Favourite as such (without Apex it gets almost as much). What makes the line lose is the hoarding (no Market).
The runs with the other parts switched off one at a time (no hoarding, no self-invite) are in section 6.

### Why Kev's game looked different

His ledger (build 2026-11-17g, rounds 1-7): Mechanics +20, appearance +18, cards cashed +12, backing +12, host deals +9,
sponsor +8; spent: host bids -23, Market -18, upkeep -7, **no repairs**. Three things a person gets that the AI line doesn't:
1. **AI teams pay a person.** AI teams offer a person who hosts credits to be invited or left out, and pay to back a person's
   scheme; they never do that among themselves. That was 21 Cr in his game. `rwTips` gives the test AI the invite part of
   this; it changes little (section 3 table, first two rows), because a host that keeps hosting while it leads gets no
   such offers (rule of 11 Nov).
2. **He didn't repair** (his Fan Favourite fought with its Body broken). The AI pays credits to fix broken zones.
3. **AI hosts invite the fame leader.** An AI host that stays out puts the team with the most fame against its best counter
   (80%). As the leader Kev was invited even when he did not host, so his Fan Favourite fought most rounds.

His lead at round 7 was 45 Cr but only 7 fame against 6: the credits had not turned into fame yet. Credits turn into fame mainly
through the host seat (an AI bids at most the richest rival's credits + 1, so a rich team wins every host bid it wants). That
is the real lever behind his observation, and it is about hoarding, not the Fan Favourite (section 5).

## 4. Part C: can the other teams counter it by play?

The three other seats get counters the rules already have (`--aipR='{"ctr":[...]}'`): **noInvite** (an AI host never invites
a rival's ready Fan Favourite and turns down its 2 Cr), **cards** (harmful cards aimed at a team with a Fan Favourite: threat
+1, which also puts We Have Your Number, Rogue Firmware, Coolant Leak and sabotage on it), **host** (+4 Cr on the host bid when
a rival has a ready Fan Favourite), **smear** (Smear cards aimed at a sole fame leader: threat +1). Against the Kev line in seat 0:

| Against the Kev line | Games | Seat 0 wins | Paired change | Its appearance Cr a game | Fame it loses to cards a game | Hosts a game |
|---|---|---|---|---|---|---|
| normal AI teams | 100 | 16% ±7 | - | 38.5 | -1.1 | 4.0 |
| all four counters | 60 | 15% ±9 | -2 ±13 pts | 33.2 | -1.8 | 4.7 |

The counters take about **5 Cr a game** of its appearance money away and cost it 0.7 fame a game more in cards. They cost the
countering teams nothing visible: they still win 28% each, and earn and spend the same (103 / 105 Cr a game against 101 / 102).
Since the line was already below par, the win rate can't show more. (The four counters one at a time were planned; they were
not run, see section 7.)

**Can a table of people stop it by play alone? Yes.** Everything the line needs is given by the other teams: a host has to
invite it (only its own host seat is guaranteed), and the host seat is bid for. A table that refuses to invite a rival's Fan
Favourite, refuses its deals, outbids it for the host seat when it matters, and aims We Have Your Number, Rogue Firmware,
Coolant Leak and Smear cards at it, takes most of its 6 Cr a round away. People do that naturally; the AI does not (no AI host
avoids a Fan Favourite, and an AI host that stays out invites the fame leader on purpose).

## 5. The hoarding question: is "hoard credits, win every host bid" the stronger line?

| Seat 0 plays | Games | Seat 0 wins | Paired change vs normal AI | Hosts a game | Market Cr | Credits at Upkeep 7 / 9 |
|---|---|---|---|---|---|---|
| normal AI | 100 | 29% ±9 | - | 2.9 | -30 | 6.5 / 7.4 |
| no surplus spending (`spendK 0`) | 60 | 38% ±12 | +0 ±12 pts | 3.2 | -26 | 7.4 / 9.2 |
| hoard + host (no Market, `spendK 0`, +4 Cr on host value) | 60 | 25% ±11 | -13 ±16 pts | 4.8 | -9 | 8.9 / 9.9 |

(The normal AI's 38% in the `spendK 0` row is its own seeds 1-60; the paired change is the number to read.)

**Not for the AI.** An AI that stops spending its surplus does as well as one that spends it (+0 ±12); one that skips the
Market to win more host bids hosts 4.8 times a game instead of 2.9 and wins less (-13 ±16): plain robots lose the fights that
hosting sets up. None of them piles up credits the way Kev did (the AI repairs broken zones and bids what hosting is worth;
credits at Upkeep stay under 10).

What the AI does show: it **ends every round with 6-8 Cr** whatever it is told, because it spends what it gets. A person who
saves (no repairs, few Market buys, AI teams paying them) ends up with 3-6 times that, as Kev did. Whether a big pile of credits
then wins the game depends on the host bids: an AI bids at most what hosting is worth to it (about 6-11 Cr) and never more than
the richest rival + 1, so a person with 45 Cr can take the host seat every round they want, for +1 fame and the pick of the
fight each time. That is a credit-sink and AI-saving question, separate from the Fan Favourite; it is for Kev (section 8).

## 6. Part D: balance options

Each option is a `BAL` switch, off by default (`--bal='{"fan":{...}}'`):

| Option (one line for players) | Switch |
|---|---|
| A Fan Favourite earns 4 Cr appearance money, not 6 | `fan.favMoney: 4` |
| A Fan Favourite that loses drops a Fan token (it can lose the status, its fame and its immunity) | `fan.favLoseToken: true` |
| The loser keeps half its appearance money | `fan.loserShare: 0.5` |
| A Fan Favourite can be scrapped after its 2nd loss in a row | `fan.favScrap: 'two'` |
| Apex Media: Fan Favourite at 3 wins, like everyone | `fame.favTokensApex: 3` |
| (also: count at most N Fan tokens for money) | `fan.tokenCap` |

In normal AI games (seeds 1-60, 60 games each):

| | today | Fan Favourite 4 Cr | loses a token when it loses |
|---|---|---|---|
| Game length (rounds) | 11.5 ±0.4 | 11.4 ±0.4 | 11.6 ±0.4 |
| Fame per round (all teams) | 3.2 | 3.2 | 3.2 |
| Host scraps a game | 2.8 ±0.3 | 2.8 ±0.3 | 2.7 ±0.3 |
| Fan Favourites a game | 1.8 ±0.2 | 1.6 ±0.2 | 1.7 ±0.2 |
| Appearance Cr a game (all teams) | 92.7 ±4.3 | 88.3 ±4.4 | 94.6 ±5.1 |
| Losing Fan Favourites kept safe a game | 0.8 | 0.8 | 0.2 |
| Seat 0 (normal AI) paired change | - | +0 ±9 pts | -3 ±8 pts |

Neither changes a normal game in any way the numbers can see: same length, same fame per round, same scraps. (Half money for
the loser, scrappable after 2 losses and Apex at 3 were not run on normal games; see section 7.)

Against the Kev line (seeds 1-40):

| Seat 0 plays (seeds 1-40) | Games | Seat 0 wins | Paired change vs Kev line | Paired change vs normal AI | Appearance Cr a game |
|---|---|---|---|---|---|
| normal AI | 40 | 40% ±15 | - | - | 22.9 |
| Kev line, rules as today | 40 | 15% ±11 | - | -25 ±18 pts | 39.0 |
| Kev line, Fan Favourite 4 Cr | 40 | 5% ±7 | -10 ±9 pts | -35 ±17 | 30.9 |
| Kev line, a losing Fan Favourite drops a token | 40 | 20% ±13 | +5 ±16 | -20 ±17 | 32.0 |
| **Fan Favourite line without hoarding** (buys in the Market like the normal AI) | 40 | 38% ±15 | +23 ±19 | **-2 ±20** | 39.2 |

The last row is the one that matters for "which part carries it": the same line (Apex Media, host and invite itself, its Fan
Favourite in every fight, pay to be invited, back for pay) but with the normal AI's Market buying. It earns the same +16 Cr
appearance money a game, gets a Fan Favourite in 95% of games, and wins **exactly as often as the normal AI** (-2 ±20). So the
Fan Favourite line is a fair line, not a broken one; the hoarding is what sank the Kev line in AI hands.

Fan Favourite 4 Cr takes 8 Cr a game off the line; a token lost on a loss takes 7 Cr and about half of its Fan Favourite fame
(0.4 instead of 1.0 a game). Both work as brakes; neither is needed by these numbers.

## 7. What was not run (time; restarts)

- 100 more normal games (seeds 101-200) for part A: A has 100 games.
- The four counters one at a time (only all four together, 60 games).
- On normal games and on the Kev line: half appearance money for the loser, scrappable after 2 losses in a row, Apex Media at
  3 wins (the switches are in and work; 1-game smoke tests only).
- The Kev line with the other parts off one at a time beyond "no hoarding" and "no Apex" (no self-invite, no deals).

## 8. Questions for Kev

1. Do you want a brake on the Fan Favourite anyway, for tables of people? The cheapest one to explain: "a Fan Favourite that
   loses a fight drops a Fan token" (it can lose the status, its +1 fame and the scrap immunity, and win it back). It changed
   nothing measurable in normal games. Second choice: "a Fan Favourite earns 4 Cr, not 6".
2. AI teams pay a person who hosts (invite deals) and back a person's schemes for pay, but never do that among themselves, and
   an AI host that stays out invites the fame leader on purpose. Should AI hosts stop inviting a rival's Fan Favourite (or the
   leader) as often, as people would? That is an AI change, not a rule change.
3. Hoarding: the AI spends almost everything every round (6-8 Cr left), so a saving person ends up with 3-6 times the AI's
   credits, and an AI never bids more than the richest rival + 1 for the host seat. Do you want a credit sink, an AI that saves
   up for host bids, or a cap on host bids? Separate from the Fan Favourite.



