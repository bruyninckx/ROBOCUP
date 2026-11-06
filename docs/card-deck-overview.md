# Card deck overview (5 Nov lineup, 6 Nov sim numbers)

Detail docs: `docs/upgrade-cards.md` (+ `.json`), `docs/robot-cards.md`, `docs/intrigue-deck.md`, `docs/sponsors.md`, `docs/starter-deck.md`, rules in `docs/rulebook.md`. Visual card table: https://claude.ai/artifact/K9LYoL1ny8V4jQhBXd37nh

## Market deck: 50 different cards
| Type | Slots | Cards |
|---|---|---|
| Robots | 12 | Juggernaut, Wasp, Railgunner (legendary), Sniper, Ricochet, Brawler, Artillery, Hookshot, Turncoat, Slick, Fortress, Tinker |
| Crew | 8 | Chief Engineer, Mechanic, Accountant, Hacker, Market Analyst, Fixer, Security Chief, Repair Tech |
| Weapon upgrades | 9 | No weapon swaps (Kev, 6 Nov). One upgrade per weapon type: Match-grade Barrel, Focusing Lens, Serrated Blade, Ricochet Rig, Napalm Mix, Cluster Shells; plus gun calibres Rapid-Fire Kit, Heavy Cannon Kit, Burst Gun |
| Armour | 4 | Heat Shield, Ablative Plating, Reactive Spikes, Composite Mesh |
| Modules | 6 | Energy Shield, Decoy Hologram, EMP Burst, Grappling Hook, Jump Jets, Oil Slick |
| Helpers | 6 | Medic, Waller, Bodyguard, Gun Drone, Spotter, Jammer |
| Stat upgrades | 4 | Reinforced Hull, Tuned Engine, Turret Motor, Targeting Chip |
| Legendary | 2 | Twin Turret (not in the Sim yet), Quantum Shield |

## Outside the decks
- Starters: 2 Scrap Bots + 3 Mechanics + 1 Security Bot per team (or the 9-robot `s1.` draft; Kev to decide). Stock gun, wheels, controller.
- Sponsors (6): deal 2, keep 1.
- Scrap Crate: loser only; salvaged +1 stat items add ⚡1 and break for good. Winner's Crate cut.
- Signature parts that only live on robot cards: the 6 drives/processors, Flipper, Reflective Plating, Mine Layer, Repair Drone.
- Squadron leaders: out for now.

## Intrigue deck: 74 different, 185 copies
8 Spartacus families. 5 Nov additions in Match-fixing: 6 live combat cards, Mirror, Grand Final, Tag Team Licence (event cards). Grand Melee is the 5th format card; the robot-count wager is part of the host bid.

## System numbers
- Strain: rulebook 5% break chance per ⚡ per fight, halved by a Chief Engineer (the Sim uses its own formula in `riskOf`, roughly 3.5% per ⚡).
- Robot size: +5% frame per ⚡ (in the Sim since 6 Nov, `Sim.frameOf`; reach stays the stock frame's), Twin Turret +20% (not in the Sim yet). Labels: Light 0–2 ⚡, Medium 3–4, Heavy 5–6, Titan 7+.
- Bookie bands: heavy underdog <25%, underdog 25–42%, even 42–58%, favourite 58–75%, heavy favourite >75%.
- Form of the day: removed 6 Nov (Kev didn't like it).
- Reading strength (6 Nov): bookie band vs the field on every robot and lot, counter tags (`docs/counter-tags.md`), scout 1 Cr (exact % this round), sparring match 2 Cr in Upkeep.
