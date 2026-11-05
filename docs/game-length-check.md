# ROBOCUS game-length check (economy sim, 2026-11-05)

Code: `tools/economy-sim.py` with data `tools/economy-cards.json` (card table export). Run `python tools/economy-sim.py 1500`.
1,500 bot games per variant, rules = `docs/rulebook.md` (draft v0.1, all 5 Nov decisions). Fights are abstract: win chance from robot strength (logit of the sandbox duel win %, Scrap Bot = 25%); parts add strength, damage lowers it. Bots: greedy publicity, smear the leader, block a leader's fame schemes with reactions, bid by value, hosts scrap the leader's fanless losers half the time.

Time model per round (guesses): "lean" (quick online players) ≈ 11 min; "chatty" (banter, deals) ≈ 18 min.

| Start fame | Rounds (median, 80% range) | Lean | Chatty | Events per fight |
|---|---|---|---|---|
| 4 (draft) | 6 (4–8) | 68 min | 111 min | 0.38 |
| 3 | 7 (5–9) | 78 min | 126 min | 0.34 |
| 2 | 8 (6–10) | 87 min | 141 min | 0.31 |
| 1 | 9 (7–11) | 97 min | 157 min | 0.28 |

Findings at start fame 4:
- Shorter than planned: about 6 rounds, not about 10. Hits 2 h only at a chatty pace.
- Fame per game, all teams together: publicity cards +7.3, fight wins +7.0, host +6.5, Fan Favourite +1.0, smears −1.7, declines −0.8. Host + fight hand out about 2 fame every round.
- Events land about 1 in 3 fights (target 1 in 4); longer games bring it down.
- Leader after round 5 wins about 62%; tie-break fights in about 5% of games.
- Credits hover at 5–7 per team; ~2.8 robots per team by round 6; ~5 robot cards sold per game; ~1.8 rebids per round (small bids tie a lot).
- More gang-up (backing deals 25% → 50%) barely changes the length.

Open: Kev to pick the starting fame (suggestion: 2 for ~2 h, keep 4 as the quick game). Confirm with a timed playtest.
