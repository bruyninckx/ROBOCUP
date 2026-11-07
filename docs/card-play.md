# Card play: AI pass and card balance (8 Nov 2026)

Build: the trimmed 135-card Intrigue deck + live-card auction (`docs/auction-trim-results.md`). All numbers come from all-AI games (start 4, win 12); read them as "how the AI uses the cards", not as proof a card is good or bad for people. Tools: `node tools/card-report.js <tag>` after `tools/game-sim.js`.

## 1. AI: value-based card play (`ivplay`, now on)

Before, the AI played its Intrigue cards in a fixed family order (Smear, Publicity, Sabotage, …), 2 a turn, at the fame leader. Now every playable card gets a value in credits and the best is played first; the values are worked out again after each play:

- fame for itself at its host-fame rate (6 Cr per fame; ×1.6 when it is 2 from winning; a card that wins the game is worth everything);
- harm to a rival × that rival's threat (by fame rank; ×1.5 at 2 from winning, ×2.25 at 1 from winning);
- × the chance to get past the target's Security Bots (each bot blocks half the time) — so it picks the target with the best mix of threat and open defences;
- costs (Bribe Scandal and Paparazzi pay 3 Cr, Launch Party 6, Public Demo 3, Co-Branding and Rival Sponsor hand fame to a rival);
- Security Override is valued as opening the way for another attack in hand. Cards worth under 1 Cr stay in hand.

| Test (1 team new AI vs 3 teams old card play) | Games | New wins (fair 25%) |
| --- | --- | --- |
| default (2 plays a turn, keep cards worth < 1 Cr) | 300 | **29% ±5** |
| 3 plays a turn | 200 | 23% ±6 |
| pickier (keep cards worth < 2.5 Cr) | 200 | 28.5% ±6 |
| 3 plays, keep < 0.5 Cr | 200 | 26.5% ±6 |

A small gain (about +4 points); card choice matters much less than hosting (+20, `docs/ai-v2.md`). With every AI on the new play (200 games): the same game length (6.1 rounds), **attacks drop from 19 to 11 a game but land more (61% vs 51%)**, Security Bot rolls drop from 12 to 5, more cards are kept and cashed (9.4 vs 5.6 a game).

## 2. Where fame comes from (per game, all teams)

| Source | Old card play | New card play |
| --- | --- | --- |
| Intrigue cards (+) | **+11.8** | **+10.5** |
| Winning fights | +6.4 | +6.4 |
| Hosting | +6.0 | +5.8 |
| Intrigue cards (−) | −2.5 | −1.9 |

**Intrigue Publicity is the biggest fame source, almost as much as fights and hosting together.** For a robot-fight game that is probably too much: the fights decide less than the card draw.

## 3. Card by card (new AI, 200 games)

Played/g = played per game (all teams); play% = played / drawn; cash% = cashed in; lands = not blocked.

**Played almost every time it is drawn (strong or simply easy):** Celebrity Endorsement 98%, Press Tour 98%, Team-Building Day 99% (**1.8 fame a play**, gate 1), Fan Meet 84%, Consulting Gig 94% (8 Cr a play), Overtime Shift 88%, Scrap Deal 91%, the auction cards (every won card is played).

**Hardly played (dead or too hard):**

| Card | Played | Cashed | Why |
| --- | --- | --- | --- |
| Asset Strip | 0% | 41% | needs 3 Cr per bot and the bots it buys can block it |
| Bookie's Friend | 0% | 77% | information only; the AI can't use it, people rarely will |
| Unleash the House Robot | 1% | 79% | host only, gate 9 |
| Botched Install | 4% | 41% | only in a Market window, rarely the right moment |
| Bankrupt!, Leaked Footage, Skeleton Crew | 6–13% | 31–40% | the condition (0 Cr / no ready robots / no ready crew) is rare |
| Mirror | 12% | 64% | host only |
| Launch Party, Hostile Buyout | 12–13% | | expensive for +1 fame / a weak robot |
| Shill Bidder | 20% | 39% | |

**Gets blocked a lot:** Security Override lands 11% and Asset Strip 15% (old AI): the Security Bots they are meant to remove roll against them first.

**Gates at or above the winning fame** (playable only with backing): Viral Moment 12, Co-Branding Deal 12, Joint Venture 12, Rival Sponsor 14, Smear Campaign 16 (Prime-Time 11). They still get played 33–75% thanks to backing, so they work as "ask for help" cards; fine if intended.

**Win share of teams that played a card** (25% = no effect; biased and noisy, ±6 points): nothing stands out clearly after the AI fix. Earlier, with the old AI, Rival Sponsor (13%) and Mirror (10%) looked bad for whoever played them.

## 4. Proposals (Kev to decide; not changed yet)

Nerfs:
1. **Team-Building Day: max +1 fame** (now +2 for 4 crew; 1.8 fame a play at gate 1, the best fame card).
2. **Fewer easy +1 fame cards**, so fights matter more: Press Tour 3→2, Celebrity Endorsement 3→2 (about −1 card fame a game). Or raise Celebrity Endorsement's gate 6→8.

Fixes / buffs:
3. **Security Override and Asset Strip can't be blocked by Security Bots** (they are the answer to Security Bots).
4. **Unleash the House Robot: gate 9→5** (it is host-only already).
5. **Merge Bankrupt!, Leaked Footage and Skeleton Crew** into one card, 2 copies: "−1 fame to a team with 0 credits, no ready robots or no ready crew".
6. **Bookie's Friend:** cut, or add "and you may change your bet" so it does something.
7. **Rival Sponsor gate 14→9, Smear Campaign 16→10** (if you want them playable without backing).

Each is a number or text change; after any of them, rerun `tools\run-sims.cmd` and `node tools/card-report.js start4_win12` to see the effect.
