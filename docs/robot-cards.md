# Robot cards v2 (Market deck)

12 robot cards, one quirk each (like Spartacus gladiators). A card is a complete robot: stats, signature weapon, drive, processor and module, plus a quirk. Builds are the data in `src/sim.js` (`Sim.ROBOT_CARDS`) and the sandbox's "Robot cards" preset group. Value = bank value. Win % = average duel win rate vs the other 11 cards and the Scrap Bot (6 Nov, 80 fights per pairing, form of the day removed, frames grow 5% per ⚡; the sim-pass numbers with form on were 26–74%). Rerun: `node tools/robot-cards.js`.

| Robot | HP AR SP TU FP AC BU | Weapon | Kit | Quirk | Works in | Value | Win % |
|---|---|---|---|---|---|---|---|
| **Juggernaut** | 1 4 4 1 4 0 0 | Spinner Blade | Overboost · Rammer chip · Flipper | **Showstopper**: When it wins, you take the host’s +1 fame for that fight. | Fame | 5 | 50 |
| **Wasp** | 4 0 4 0 3 3 0 | Rapid-Fire gun | Omni-Drive · Zigzag chip · Energy Shield | **Hotshot**: +1 credit each time it wins. | Credits | 5 | 50 |
| **Railgunner** (legendary, 1 copy) | 1 2 2 2 4 3 0 | Prototype Railgun | Tank Tracks · Reflective Plating | **Headline Act**: Legendary: 1 copy, announced a round ahead. When it fights, the host gains +1 extra fame. | Fame | 5 | 73 |
| **Sniper** | 2 1 1 1 4 3 2 | Gun (medium, long range) | Kiter chip · Jump Jets | **Scope**: Before bets close, look at one face-down card on a robot in its fight. | Bets | 4 | 46 |
| **Ricochet** | 3 1 2 1 4 1 2 | Saw Blade Launcher | Kiter chip · Mine Layer | **Trick Shot**: Its saw blades bounce one extra time. | Arena | 4 | 54 |
| **Brawler** | 3 4 2 0 4 0 1 | Gun (medium, short range) | Tank Tracks · Rammer chip · EMP Burst | **Grudge**: After it loses to a team, +1 firepower in its next fight against that team. | Arena | 3 | 48 |
| **Artillery** | 3 0 1 0 4 2 4 | Mortar | Overboost · Zigzag chip · Jump Jets | **Underrated**: The bookie lists it one band lower than the sim says, so bets on it pay more. | Bets | 2 | 44 |
| **Hookshot** | 3 1 3 3 4 0 0 | Flamethrower | Tank Tracks · Grappling Hook | **Sticky Fire**: Robots it sets alight burn 2 s longer. | Arena | 2 | 49 |
| **Turncoat** | 3 1 3 2 3 2 0 | Laser Retrofit | No drive, processor or module yet | **Treacherous**: In a fight with 3+ robots, before bets close you may move it to another side. | Arena | 2 | 45 |
| **Slick** | 3 1 4 2 4 0 0 | Flamethrower | Oil Slick | **Fireproof**: Its own fire and oil can’t hurt or slow it. | Arena | 2 | 50 |
| **Fortress** | 4 4 0 0 4 0 2 | Heavy Cannon | Tank Tracks · Repair Drone · Gun Drone | **Bastion**: Carries 4 helper drones instead of 3, and its helpers add no strain. | Garage | 1 | 43 |
| **Tinker** | 2 0 3 2 3 2 2 | Gun (medium) | Spotter Drone | **Cunning**: If it didn’t fight last round, draw 1 extra Intrigue card in Upkeep. | Intrigue | 2 | 47 |

**Starter:** Scrap Bot, HP2 AR0 SP2 TU2 FP4 AC1 BU0 (11 points), stock gun, no quirk, empty module slot, value 1, about 17% vs the cards. Alternative: the 9-robot `s1.` starter draft in `docs/starter-deck.md` (Kev to decide).

**In the tabletop (Kev, 6 Nov):** New Robot lots (5 in the lot deck) deal these cards first, then `s1.` starters; scrapped or unsold cards go back into the robot deck. The Railgunner comes as an announced legendary. All 12 quirks work: Showstopper, Hotshot, Headline Act, Scope (a modal shows one rival face-down card), Grudge (+25% firepower vs the team that beat it, once), Underrated (its side listed one band lower), Treacherous (2v2: may switch sides before the odds), Cunning (+1 Intrigue card after a round off) in the strategy layer; Trick Shot, Sticky Fire, Fireproof, Bastion in the Sim.

**Rules:** no weapon swaps (6 Nov): a robot keeps its weapon for life and takes its weapon type's upgrade instead; module swap keeps the quirk; drive/processor fixed; the Railgunner is the deck's only railgun. Fight quirks in the Sim: Trick Shot, Sticky Fire, Fireproof, Bastion; the others (Showstopper, Hotshot, Headline Act, Scope, Grudge, Underrated, Treacherous, Cunning) work in the strategy layer.

**6 Nov sim pass changes:** Juggernaut HP3→2 AR2→3, Railgunner FP4→3 SP1→2, Wasp FP4→3 HP3→4, Fortress TU1→0 BU0→1, Scrap Bot AR1→0 FP3→4 (one point each, chosen with `tools/card-tune.js`). Details in `docs/robot-arena-balance-findings.md`.

**6 Nov (later), Kev:** form of the day is gone, and frames now grow 5% per ⚡ (rulebook Size rule) with weapon reach kept at the stock frame. Without form the hard counters come back: 47% of card pairings are 90/10 or worse (30% with form, 38% without form before frames). Frame per ⚡ in the table: Juggernaut Titan, Artillery Titan, Sniper/Ricochet/Brawler/Hookshot Heavy, the rest Medium, Tinker and Scrap Bot Light.

**6 Nov (evening) full balance pass, Kev:** all 12 cards against each other (150 fights per pair, 1 engineer each) and against the 9 starters. Before: card win % vs the other cards ran from 24% (Fortress) to 79% (Railgunner), Brawler 74% at value 3, Fortress 24% / Hookshot 28% / Artillery 30% / Slick 30%, and 28 of 66 card pairs were 90/10 or worse. A search moved at most 2 stat points per card (cost stays 14), checked with fresh fights: now every non-legendary card is 43–54% (Railgunner, legendary, 73%), the spread is 30 points instead of 55 and 15 pairs are 90/10 or worse. Changes (HP AR SP TU FP AC BU): Juggernaut HP 2→1 AR 3→4; Wasp SP 2→4 TU 1→0 BU 1→0; Railgunner HP 3→1 AR 1→2 FP 3→4; Sniper HP 3→2 AR 0→1; Ricochet TU 2→1 BU 1→2; Brawler HP 4→3 AR 3→4 SP 3→2 BU 0→1; Artillery HP 1→3 SP 3→1; Hookshot HP 4→3 SP 2→3; Turncoat HP 4→3 SP 2→3 TU 1→2 FP 4→3; Slick HP 4→3 SP 3→4; Fortress AC 1→0 BU 1→2 and a Gun Drone in its kit (stats alone couldn't lift it past ~29%; with the drone 43%, fits Bastion). Tinker unchanged. The Wasp stays the most rock-paper-scissors card (9 of its 11 matchups are 90/10 one way or the other). Every card still beats the starters 81–100%. Check again with `node tools/card-matrix.js` (see the file).
