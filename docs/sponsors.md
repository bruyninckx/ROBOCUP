# Team Sponsors & Identities (`docs/sponsors.md`)

In **Scrapyard Dominus**, each of the 4 robotics teams is backed by a corporate **Sponsor**. At the start of a new game, you pick 1 of the 6 sponsors for your garage, and the 3 AI teams draft from the remaining sponsors.

Each sponsor has **one clear rule** that nudges how you play the strategy layer (repairs, intrigue, market auctions, hosting, betting, or salvage) without changing the deterministic arena simulator (`Sim`).

---

## Sponsor Roster

| ID | Sponsor Name | Tagline | One Rule | Playstyle |
|---|---|---|---|---|
| `aegis` | **Aegis Heavy Industries** | *Built to Last* | **Free Maintenance:** In Upkeep, each of your robots automatically repairs **25 damage for free** before you pay for repairs. | Attrition & tanking; can field heavy robots back-to-back without going broke on repairs. |
| `blackwire` | **Blackwire Syndicate** | *Dirty Tricks* | **Black Ops:** Draw **+1 extra Intrigue card** in Upkeep (hand limit **5** instead of 4), and schemes cost **2 less Fame** to play. | Early sabotage & secret upgrades; controls the hidden layer before anyone else has the Fame. |
| `sovereign` | **Sovereign Foundry** | *Deep Pockets* | **Industrial Clout:** Start the game with **4 Mechanics** (instead of 3) and **win every market tie you are in outright**, without a rebid (decided 5 Nov). | Economic powerhouse; never loses a tied bid. |
| `apex` | **Apex Media Network** | *Bread & Circuses* | **Prime Time:** Gain **+2 Credits** whenever you **Host** a fight, and your robots become a **Fan Favourite (+1 Fame)** on their **2nd win** (instead of 3rd). | Fame rush; bids aggressively on Hosting rights and snowballs arena streaks. |
| `lucky` | **Lucky Seven Bookmakers** | *House Edge* | **High Roller:** Your max bet is **5 Credits** (instead of 3), and if your bet **loses**, you get **1 Credit back** as insurance. | Combines secret sabotage with 5-credit bets on underdogs for huge credit swings. |
| `vulture` | **Vulture Salvage Co.** | *Nothing Goes to Waste* | **Scrap Bounty:** Gain **+2 Credits** whenever **any** robot is scrapped in the Aftermath, and draw **2 Scrap Crate items** (instead of 1) when your robot loses a fight. | Comeback & carnage specialist; profits from thumbs-down executions and bounces back fast from defeats. |

---

## AI Sponsor Behaviour Hooks

So AI teams feel like they actually play their sponsor identity in `prototypes/scrapyard-dominus.html`:
- **Sovereign Foundry / Aegis**: Bid slightly higher on permanent robot upgrades.
- **Blackwire Syndicate**: Plays schemes more often (`85%` chance per round instead of `75%`).
- **Apex Media Network**: Bids `+1` extra credit on **Host the Fight**.
- **Lucky Seven Bookmakers**: Bets up to `5 credits` when confident.
- **Vulture Salvage Co.**: As Host, is `+25%` more likely to give the **Thumbs Down (Scrap)** to collect its `+2 credit` salvage bounty.

**Dealing (5 Nov – 17 Nov, replaced by the auction below):** each team is dealt 2 sponsors and keeps 1 secretly; all reveal together. (Tabletop: you are dealt 2 and click one; AI teams are dealt 2 of the rest in turn; the free sponsor switch in Upkeep is gone. Vulture Salvage keeps 2 Scrap Crate items on a loss.) The Winner's Crate is cut, so Scrap Crates only go to the loser.

## Sponsor auction (17 Nov 2026, T21; tabletop 2.0)

Kev (17 Nov, online with friends): "when game starts and sponsor needs to be chosen, when another player picked another sponsor suddenly the screen flipped for the player, which is strange, let people bet on sponsors instead, with rebid, if rebid still undecided, do random".

**Rule.** All 6 sponsors face up. Every team makes sealed bids in credits on the sponsors it wants, at the same time, at most its credits in total (0 on everything is fine); bids can change after locking until everyone has locked (as Market bids, T16). Resolution:
1. Of the free sponsors, the one with the highest bid from a team without a sponsor goes first (equal highest bids: in table order: Aegis, Blackwire, Sovereign, Apex, Lucky, Vulture).
2. One highest bidder: it pays its bid to the bank and signs it; its other bids are dropped (one sponsor per team).
3. A tie: only the tied teams rebid in secret, adding on top of their bid (up to their credits). One highest total: it pays the total. Still tied: a random draw among them (the game's seeded dice, on the host), logged.
4. Repeat until no team without a sponsor has a bid on a free sponsor; then each team without one gets one of the rest at random, free.
Sovereign Foundry's "wins every Market lot tie" does not apply (nobody has a sponsor yet). Online: bids, locks, rebids and the draw run on the host; bids stay sealed (others see who is still bidding, never how much); the host's Skip = bid nothing (and add nothing to a rebid).

**AI teams** value the sponsors by the 11 Nov 2.0 check (Sovereign 35%, Blackwire 33%, Aegis 24%, Lucky 23%, Apex 19%, Vulture 17% of games won): worth 2 / 2 / 1 / 1 / 1 / 0 Cr, each ±1 at random (30% each way). They bid their worth on their first choice and 1 less on their second, never more than 3 Cr on one sponsor or 3 Cr in all; in a rebid they add 1 Cr half the time (while the bid is at most 3). So a person who bids 4 on a sponsor always gets it, and 3 wins it or ties.

**Quick-Start** (solo) bids for you as an AI team would.

**Economy check (17 Nov, T21; 80 bot games before = origin/main 072ac9c, after = this branch, same seeds 1-80, AI v2, start 0, win 12; 80/80 finished each after re-running 6 / 7 round-1 stalls of the loaded box one by one; all four teams bid as the AI, Quick-Start bids for seat 0).**

| | Before (dealt 2, keep 1) | After (auction) |
|---|---|---|
| Paid for a sponsor, per team | 0 | 1.60 ± 0.08 Cr (0 Cr: 117 of 320; 1: 29, 2: 63, 3: 87, 4: 24) |
| Credits going into round 1 | 8.0 | 6.4 |
| Round-1 Market: Cr spent (all teams) | 8.22 ± 0.25 | 6.89 ± 0.22 |
| Round-1 Market: lots sold of 4 | 1.65 ± 0.06 | 1.36 ± 0.05 |
| Game length (rounds) | 11.40 ± 0.20 | 11.51 ± 0.19 (paired by seed: +0.11 ± 0.29) |

- Mean price by sponsor: Blackwire 2.9, Sovereign 2.5, Aegis 1.4, Lucky 0.4, Apex 0.3, Vulture 0.0 Cr. The sponsors are no longer dealt evenly: of 320 seats Blackwire 77, Sovereign 72, Aegis 56, Apex 47, Lucky 39, Vulture 29 (before about 53 each).
- Wins by sponsor (fair 25%, ± about 6 points): before Sovereign 35%, Blackwire 34%, Aegis 32%, Apex 22%, Vulture 15%, Lucky 13%; after Blackwire 32%, Sovereign 28%, Vulture 24% (29 seats, ±8), Apex 23%, Aegis 23%, Lucky 10%. The strong sponsors now cost about 3 Cr and win a little less; nothing moved more than the noise except that pattern. Teams that paid won 29% (203 seats), teams that got a free sponsor 19% (117).
- The first Market is about 1.3 Cr (16%) quieter: the money paid for sponsors is missing there.

**Start with 10 Cr (17 Nov, T29; Kev: "10").** `BAL.startCredits` 8 → 10. Checked with 80 bot games at 10 Cr against the same seeds 1-80 at 8 Cr (both with the sponsor auction, AI v2, start 0, win 12). The 8 Cr side is the T21 "after" run: re-run on this branch with `--bal={"startCredits":8}`, the 76 seeds that finished (4 stalled on the loaded box) gave exactly the same games (same rounds and winners, 76 of 76), so the T21 numbers stand for 8 Cr. 10 Cr: 80/80 finished, 0 page errors.

| | 8 Cr (before the auction) | 8 Cr (auction) | 10 Cr (auction) |
|---|---|---|---|
| Paid for a sponsor, per team | 0 | 1.60 ± 0.08 | 1.60 ± 0.08 (the same bids, seed by seed) |
| Credits going into round 1 | 8.0 | 6.4 | 8.4 |
| Round-1 Market: Cr spent (all teams) | 8.22 ± 0.25 | 6.89 ± 0.22 | 9.61 ± 0.25 (paired with 8 Cr: +2.73 ± 0.23) |
| Round-1 Market: lots sold of 4 | 1.65 ± 0.06 | 1.36 ± 0.05 | 2.15 ± 0.06 (paired: +0.79 ± 0.06) |
| Round-2 Market: Cr spent | | 7.29 | 9.50 |
| Game length (rounds) | 11.40 ± 0.20 | 11.51 ± 0.19 | 11.41 ± 0.19 (paired with 8 Cr: −0.10 ± 0.26) |

- The AI pays the same for sponsors: it bids at most 3 Cr on one sponsor and 3 Cr in all, whatever it holds, so the 2 extra Cr all go to the Market. A person can now bid up to 10 (4 still always wins a sponsor against the AI).
- 10 Cr **overshoots** the first Market: 9.6 Cr spent and 2.15 lots sold, against 8.2 Cr and 1.65 lots before sponsors were bid for (about 17% more money and 30% more lots). Lots sell a little cheaper each (4.5 Cr against 5.1), because more of them sell. The extra money carries into round 2 (9.5 Cr spent against 7.3). Game length does not move.
- Wins by sponsor at 10 Cr (fair 25%, ± about 6): Sovereign 33%, Apex 28%, Blackwire 26%, Vulture 21% (28 seats, ±8), Lucky 18%, Aegis 18%. Teams that paid won 26% (203 seats), free ones 23% (117) (8 Cr: 29% / 19%). All within the noise of 80 games.

Scripts (outside the repo): t29-scripts/econ3.js (the economy numbers, start credits as the first argument), paired.js (paired game length).

Scripts (outside the repo): t21-scripts/econ2.js (numbers), solo.js, mp.js, skip.js, flip.js, shots2.js.
