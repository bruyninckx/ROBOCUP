# Intrigue trim + live-card auction: first AI results (7 Nov 2026)

What changed (Kev's plan, `claude/robocus-live-card-auction-plan.md` in the project): Intrigue deck 188 → 135 copies (schemes and blockers only), the 6 live cards + Swap the Entry are a 16-card Auction deck (2 per fight, sealed bids during the public Bets step), Hedge Bet cut. Rules: `docs/rulebook.md` v1.1, cards: `docs/intrigue-deck.md`.

Kev's choices (7 Nov): a tie goes to the team with less fame (equal fame: nobody); Swap the Entry goes to the auction, Bookie's Friend stays in Intrigue; no timer, a changed public bet un-locks the others; a won card is for this fight only. Also: the highest bid pays its bid (min 1); 1 card per team per fight; 🔥 at 3+ Cr in total or 2+ bidders; the odds ignore the cards; the AI bids only when it fights or bets.

All-AI games (`tools/game-sim.js`, AI v2, the same seeds before and after). "Before" = main after AI v2 (`01b1890`), so 6.4 rounds, not the 5.4 of the older 133-game baseline (old AI).

| | before, start 4 | **after, start 4** | before, start 1 | **after, start 1** | before, start 4, win 16 | **after, start 4, win 16** |
|---|---|---|---|---|---|---|
| games | 80 | 80 | 80 | 80 | 60 | 60 |
| rounds: mean (median) | 6.4 (6) | **6.4 (6)** | 8.9 (9) | **9.5 (10)** | 9.9 (10) | **10.5 (10)** |
| Intrigue deck | 188 | 135 | 188 | 135 | 188 | 135 |
| Intrigue cards drawn / game | 83 | 83 | 116 | 123 | 128 | 138 |
| share of the deck seen | 44% | **61%** | 62% | **91%** | 68% | **102%** (reshuffles) |
| cashed in / game | 8.6 | 5.7 | 24.9 | 21.4 | 16.1 | 13.6 |
| attacks / game (land) | 14.6 (46%) | 19.3 (**52%**) | 19.1 (46%) | 27.2 (50%) | 23.5 (48%) | 33.0 (55%) |
| live cards played / fight | 0.5 | **0.9** | 0.4 | 0.8 | 0.5 | 0.8 |
| auction cards won / fight (price) | – | 1.2 of 2 (1.2 Cr) | – | 1.2 (1.2 Cr) | – | 1.2 (1.2 Cr) |
| credits held per team | 8.2 | 7.3 | 7.8 | 6.6 | 7.6 | 6.3 |
| Market spend / game | 50 | 46 | 68 | 66 | 73 | 68 |
| fame from cards / game (+ / −) | +10.3 / −1.8 | +11.7 / −2.6 | +13.9 / −2.4 | +16.0 / −3.2 | +16.1 / −3.7 | +18.8 / −5.3 |
| page errors, stalls | 0 | 0 | 0 | 0 | 0 | 0 |

What it says:

- **Game length is unchanged at start 4** (6.4 rounds); start 1 and win 16 get about half a round longer.
- **Start fame 1 instead of 4: about +2.5 rounds** (9.5 vs 6.4). **Win at 16 instead of 12: about +4 rounds** (10.5).
- The trimmed deck is used much more: 61% seen per game (was 44%), fewer cash-ins, more attacks, and attacks land more often (fewer Security Bots: 52% vs 46%).
- Live cards are played almost twice as often (every won card is played), and the auction is cheap for the AI (about 1 Cr a card; it bids only when it fights or bets). People may bid more; watch it in the playtest.
- At start 1 or win 16 the 135 deck runs out and reshuffles in a long game (91–102% seen). If those settings stay, the 3-copy staples should stay at 3 (don't do the optional cut to ~120).
- Credits are a bit tighter (auction spend), the Market a little less busy.

Multiplayer: `tools/mp-test.js` with 3 bot players, drop-outs, a skip, a leave and save/load passed on seeds 5, 21, 22, 23 (0 desyncs). Under heavy CPU load two runs failed in the test's own timing (a rejoin and the load button), passed when rerun.

Run it yourself: `tools\run-sims.cmd 200` (README).
