# Team Sponsors & Identities (`docs/sponsors.md`)

In **Scrapyard Dominus**, each of the 4 robotics teams is backed by a corporate **Sponsor**. At the start of a new game, you pick 1 of the 6 sponsors for your garage, and the 3 AI teams draft from the remaining sponsors.

Each sponsor has **one clear rule** that nudges how you play the strategy layer (repairs, intrigue, market auctions, hosting, betting, or salvage) without changing the deterministic arena simulator (`Sim`).

---

## Sponsor Roster

| ID | Sponsor Name | Tagline | One Rule | Playstyle |
|---|---|---|---|---|
| `aegis` | **Aegis Heavy Industries** | *Built to Last* | **Free Maintenance:** In Upkeep, each of your robots automatically repairs **25 damage for free** before you pay for repairs. | Attrition & tanking; can field heavy robots back-to-back without going broke on repairs. |
| `blackwire` | **Blackwire Syndicate** | *Dirty Tricks* | **Black Ops:** Draw **+1 extra Intrigue card** in Upkeep (hand limit **5** instead of 4), and schemes cost **2 less Fame** to play. | Early sabotage & secret upgrades; controls the hidden layer before anyone else has the Fame. |
| `sovereign` | **Sovereign Foundry** | *Deep Pockets* | **Industrial Clout:** Start the game with **4 Mechanics** (instead of 3) and **win deadlocked Market rebid ties** (when a Spartacus tie-break rebid ties again with nobody adding extra credits). | Economic powerhouse; has extra income to outlast rivals in Spartacus tie-break rebids and wins any deadlocked 0-add rebid tie. |
| `apex` | **Apex Media Network** | *Bread & Circuses* | **Prime Time:** Gain **+2 Credits** whenever you **Host** a fight, and your robots become a **Fan Favourite (+1 Fame)** on their **2nd win** (instead of 3rd). | Fame rush; bids aggressively on Hosting rights and snowballs arena streaks. |
| `lucky` | **Lucky Seven Bookmakers** | *House Edge* | **High Roller:** Your max bet is **5 Credits** (instead of 3), and if your bet **loses**, you get **1 Credit back** as insurance. | Combines secret sabotage with 5-credit bets on underdogs for huge credit swings. |
| `vulture` | **Vulture Salvage Co.** | *Nothing Goes to Waste* | **Scrap Bounty:** Gain **+2 Credits** whenever **any** robot is scrapped in the Aftermath, and receive **2 Scrap Crates** (instead of 1) when your robot loses a fight. | Comeback & carnage specialist; profits from thumbs-down executions and bounces back fast from defeats. |

---

## AI Sponsor Behaviour Hooks

So AI teams feel like they actually play their sponsor identity in `prototypes/scrapyard-dominus.html`:
- **Sovereign Foundry / Aegis**: Bid slightly higher on permanent robot upgrades.
- **Blackwire Syndicate**: Plays schemes more often (`85%` chance per round instead of `75%`).
- **Apex Media Network**: Bids `+1` extra credit on **Host the Fight**.
- **Lucky Seven Bookmakers**: Bets up to `5 credits` when confident.
- **Vulture Salvage Co.**: As Host, is `+25%` more likely to give the **Thumbs Down (Scrap)** to collect its `+2 credit` salvage bounty.
