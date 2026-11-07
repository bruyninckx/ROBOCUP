# Sponsor balance (7 Nov 2026)

640 AI-only games of `prototypes/tabletop-prototype.html` (all 4 teams AI, sponsors dealt 2 keep 1, 12 fame, median 6 rounds). A fair sponsor wins **25%** of the games it is in. Each sponsor was in 100–230 games, so the numbers are ±5–7 points. AI only: people will play some sponsors better or worse.

| Sponsor | Rule | Wins (as now) | Wins (AI bids the same for hosting) | Read |
| --- | --- | --- | --- | --- |
| Apex Media | +2 Cr when hosting; Fan Favourite at 2 wins | **47%** | 23% | Strong only because the AI bids harder for host with it; the rule itself is fair |
| Sovereign Foundry | 4 Mechanics; wins every Market tie | **31%** | **41%** | Too strong: the tie rule also wins host-bid ties (host fame 1.9–2.5 a game vs ~1) |
| Blackwire Syndicate | +1 card in Upkeep; schemes need 2 less fame | 27% | 30% | About right, a little strong (most fame from cards: 2.4 a game) |
| Vulture Salvage | +2 Cr per scrapped robot; keeps 2 crate items | 20% | 22% | About right, a little weak |
| Aegis Heavy | Free repair of 25 damage per robot each Upkeep | 17% | 20% | Weak |
| Lucky Seven | Bets up to 5 Cr; a lost bet refunds 1 Cr | **11%** | 14% | Too weak: bets pay fair odds, so a bigger bet adds risk, not value |

A third run (Apex +1 Cr instead of +2) changed nothing (45%): the credits are not what makes Apex win.

**The real finding is hosting.** The team that hosts most wins most: hosting is +1 fame every round plus picking the fights, and it is cheap (bids of 1–3 Cr). Whoever bids hardest for host (the AI with Apex, or Sovereign through ties) gets ahead. People will find this quickly.

## Done (Kev, 7 Nov)

1. **Sovereign Foundry** wins Market lot ties outright, but not host-bid ties.
2. **Lucky Seven**: winning bets pay one band better (Even pays like Underdog, Heavy underdog stays 3:1); lost bets still refund 1.
3. **Hosting**: a sole fame leader gets no host fame (the `CATCHUP.leaderhost` switch, now on by default).
4. **AI**: values hosting the same with every sponsor (the Apex-only bid bonus is gone).

Check after the changes, 320 AI games (same seeds as the first run):

| Sponsor | Before | After |
| --- | --- | --- |
| Aegis Heavy | 17% | 29% |
| Apex Media | 47% | 28% |
| Sovereign Foundry | 31% | 25% |
| Lucky Seven | 11% | 23% |
| Blackwire Syndicate | 27% | 23% |
| Vulture Salvage | 20% | 23% |

All within ±6 points of a fair 25%; host fame per game is now 1.1–1.3 for every sponsor (was 0.6–3.3). Game length unchanged (median 6 rounds, 5–8). Not changed: Aegis (it no longer looks weak once hosting is fair). Effect online: none (rule numbers on the host's side; everyone on the same version).
