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

