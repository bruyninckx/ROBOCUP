# Robot cards v2 (Market deck)

12 robot cards, one quirk each (like Spartacus gladiators). A card is a complete robot: stats, signature weapon, drive, processor and module, plus a quirk. Builds are the data in `src/sim.js` (`Sim.ROBOT_CARDS`) and the sandbox's "Robot cards" preset group. Value = bank value. Win % = average duel win rate vs the other 11 cards and the Scrap Bot (6 Nov, 80 fights per pairing, form of the day removed, frames grow 5% per ⚡; the sim-pass numbers with form on were 26–74%). Rerun: `node tools/robot-cards.js`.

| Robot | HP AR SP TU FP AC BU | Weapon | Kit | Quirk | Works in | Value | Win % |
|---|---|---|---|---|---|---|---|
| **Juggernaut** | 2 3 4 1 4 0 0 | Spinner Blade | Overboost · Rammer chip · Flipper | **Showstopper**: When it wins, you take the host’s +1 fame for that fight. | Fame | 5 | 78 |
| **Wasp** | 4 0 2 1 3 3 1 | Rapid-Fire gun | Omni-Drive · Zigzag chip · Energy Shield | **Hotshot**: +1 credit each time it wins. | Credits | 5 | 73 |
| **Railgunner** (legendary, 1 copy) | 3 1 2 2 3 3 0 | Prototype Railgun | Tank Tracks · Reflective Plating | **Headline Act**: Legendary: 1 copy, announced a round ahead. When it fights, the host gains +1 extra fame. | Fame | 5 | 80 |
| **Sniper** | 3 0 1 1 4 3 2 | Gun (medium, long range) | Kiter chip · Jump Jets | **Scope**: Before bets close, look at one face-down card on a robot in its fight. | Bets | 4 | 62 |
| **Ricochet** | 3 1 2 2 4 1 1 | Saw Blade Launcher | Kiter chip · Mine Layer | **Trick Shot**: Its saw blades bounce one extra time. | Arena | 4 | 55 |
| **Brawler** | 4 3 3 0 4 0 0 | Gun (medium, short range) | Tank Tracks · Rammer chip · EMP Burst | **Grudge**: After it loses to a team, +1 firepower in its next fight against that team. | Arena | 3 | 56 |
| **Artillery** | 1 0 3 0 4 2 4 | Mortar | Overboost · Zigzag chip · Jump Jets | **Underrated**: The bookie lists it one band lower than the sim says, so bets on it pay more. | Bets | 2 | 36 |
| **Hookshot** | 4 1 2 3 4 0 0 | Flamethrower | Tank Tracks · Grappling Hook | **Sticky Fire**: Robots it sets alight burn 2 s longer. | Arena | 2 | 28 |
| **Turncoat** | 4 1 2 1 4 2 0 | Laser Retrofit | No drive, processor or module yet | **Treacherous**: In a fight with 3+ robots, before bets close you may move it to another side. | Arena | 2 | 50 |
| **Slick** | 4 1 3 2 4 0 0 | Flamethrower | Oil Slick | **Fireproof**: Its own fire and oil can’t hurt or slow it. | Arena | 2 | 32 |
| **Fortress** | 4 4 0 0 4 1 1 | Heavy Cannon | Tank Tracks · Repair Drone | **Bastion**: Carries 4 helper drones instead of 3, and its helpers add no strain. | Garage | 1 | 28 |
| **Tinker** | 2 0 3 2 3 2 2 | Gun (medium) | Spotter Drone | **Cunning**: If it didn’t fight last round, draw 1 extra Intrigue card in Upkeep. | Intrigue | 2 | 57 |

**Starter:** Scrap Bot, HP2 AR0 SP2 TU2 FP4 AC1 BU0 (11 points), stock gun, no quirk, empty module slot, value 1, about 17% vs the cards. Alternative: the 9-robot `s1.` starter draft in `docs/starter-deck.md` (Kev to decide).

**Rules:** weapon swap = quirk lost for good (warning first); module swap keeps the quirk; drive/processor fixed; the Railgunner is the deck's only railgun. Fight quirks in the Sim: Trick Shot, Sticky Fire, Fireproof, Bastion; the others (Showstopper, Hotshot, Headline Act, Scope, Grudge, Underrated, Treacherous, Cunning) work in the strategy layer.

**6 Nov sim pass changes:** Juggernaut HP3→2 AR2→3, Railgunner FP4→3 SP1→2, Wasp FP4→3 HP3→4, Fortress TU1→0 BU0→1, Scrap Bot AR1→0 FP3→4 (one point each, chosen with `tools/card-tune.js`). Details in `docs/robot-arena-balance-findings.md`.

**6 Nov (later), Kev:** form of the day is gone, and frames now grow 5% per ⚡ (rulebook Size rule) with weapon reach kept at the stock frame. Without form the hard counters come back: 47% of card pairings are 90/10 or worse (30% with form, 38% without form before frames). Frame per ⚡ in the table: Juggernaut Titan, Artillery Titan, Sniper/Ricochet/Brawler/Hookshot Heavy, the rest Medium, Tinker and Scrap Bot Light.
