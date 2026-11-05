# Starter deck (decided 2026-11-05)

What every team starts the game with, and what upgrade cards build on.

## Rules (Kev's decisions)
- **Draft:** each player is shown 3 random starters and keeps 1, then does it again (2 robots per team).
  - Suggested details (not decided yet): one shared deck of the 9; starters that weren't kept go back and the deck is reshuffled for the next player; AI teams keep the starter with the best average win rate against what is already on the table.
- **Weapon mix:** 4 gun starters + 5 special-weapon starters, so every playstyle is available from round 1. Weapon retrofit cards are for changing direction later.
- **Power:** 11 stat points (sandbox robots have 14), no stat above level 3. That leaves room for 3 stat cards; raising speed, turret or firepower to level 4 adds overdrive strain, so upgrades are where engineers start to matter.
- **Stock parts:** Standard Wheels, Stock Controller, no module, no helpers, 1 engineer. Everything else comes from the market and crates.
- No points in stats the weapon can't use (no turret on the spinner, no bullet speed or accuracy on the flamethrower, no bullet speed on the laser).

## The 9 starters
Stats: HP / AR / SP / TU / FP / AC / BU levels. Strain = weapon (+ heavy calibre); none have overdrive.

| Starter | Weapon | HP | AR | SP | TU | FP | AC | BU | Strain | Identity |
|---|---|---|---|---|---|---|---|---|---|---|
| Scrapper | medium gun, short range | 3 | 1 | 3 | 0 | 3 | 0 | 1 | 1 | tough and quick, up close |
| Rattler | rapid gun, mid | 1 | 0 | 2 | 0 | 3 | 3 | 2 | 1 | accurate bullet hose |
| Plinker | medium gun, long | 0 | 2 | 1 | 0 | 3 | 2 | 3 | 1 | armoured sniper |
| Tin Can | medium gun, mid | 1 | 3 | 1 | 0 | 3 | 1 | 2 | 1 | armour-3 brick |
| Sparky | laser, mid | 2 | 1 | 3 | 1 | 3 | 1 | 0 | 2 | fast laser |
| Lobster | mortar, long | 1 | 1 | 3 | 0 | 3 | 0 | 3 | 2 | quick lobber |
| Grinder | saw blades, mid | 1 | 2 | 0 | 0 | 3 | 3 | 2 | 2 | slow, precise saw turret |
| Zippo | flamethrower, short | 0 | 3 | 3 | 2 | 3 | 0 | 0 | 2 | armoured fast torch |
| Top | spinner, short | 2 | 3 | 3 | 0 | 3 | 0 | 0 | 3 | armoured spinner |

## Matchups (200 duels each, row beats column, %)
| | Scrapper | Rattler | Plinker | Tin Can | Sparky | Lobster | Grinder | Zippo | Top | avg |
|---|---|---|---|---|---|---|---|---|---|---|
| **Scrapper** | – | 56 | 66 | 48 | 27 | 74 | 67 | 38 | 89 | 58 |
| **Rattler** | 45 | – | 54 | 18 | 100 | 89 | 55 | 31 | 25 | 52 |
| **Plinker** | 34 | 47 | – | 52 | 98 | 43 | 41 | 66 | 14 | 49 |
| **Tin Can** | 52 | 82 | 48 | – | 75 | 43 | 26 | 44 | 20 | 49 |
| **Sparky** | 74 | 0 | 2 | 25 | – | 52 | 16 | 100 | 98 | 46 |
| **Lobster** | 27 | 11 | 58 | 57 | 48 | – | 78 | 59 | 67 | 50 |
| **Grinder** | 34 | 45 | 59 | 74 | 85 | 23 | – | 47 | 2 | 46 |
| **Zippo** | 62 | 70 | 34 | 57 | 0 | 42 | 54 | – | 80 | 50 |
| **Top** | 12 | 76 | 86 | 81 | 2 | 33 | 98 | 21 | – | 51 |

Every starter averages 46–58% against the others and beats at least two of them. Only 5 of the 36 pairings are 90/10 or worse (14%; the full game with random upgrades has 44–54%), so starting fights are soft counters, not decided at build time. The hardest counters left: Sparky vs Rattler and Plinker (lasers lose to guns), Sparky beats Zippo and Top, Top beats Grinder.

How they were made: stat points tuned by simulation (random allocations within each starter's identity, picking the one closest to 50% with the fewest hard counters, 2 rounds), then checked with 200 fights per pairing. In the sandbox: preset dropdown, "Starter deck" group, plus the starter table under the main matchup table.

## Open
- Both `prototypes/tabletop-prototype.html` and `prototypes/scrapyard-dominus.html` now implement the 3-step Opening Setup (Sponsor Contract → Starter Deck Draft Pick 1 of 3 → Starter Deck Draft Pick 2 of 3) using the shared 9-card `STARTERS` deck and `SMATRIX` AI counter-drafting, and `New Robot` / `Mystery Chassis` market lots deal a stock `s1.` starter from the remaining starter deck.
- Prices: starters are free at game start; `Mystery Chassis` / `New Robot` market lots deal a random stock starter.
