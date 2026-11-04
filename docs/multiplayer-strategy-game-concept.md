# Multiplayer strategy game: concept draft (v0.3)

Status: Kev + Claude designing. 4 players, online with friends, ~2 h per game, strategy + luck + banter. 2D, light on graphics.
Working title of the rough prototype: "Scrapyard Dominus" (https://claude.ai/artifact/MGzNsr5cQLmALQfq63qnBg). Arena sandbox: https://claude.ai/artifact/11WxDiQY4F8WCBBdEFQLda.

## Decision log
- v0.1: "Scheme then brawl" hybrid: strategy map + intrigue, fights in an arena.
- v0.2: grid + card arena REJECTED. Free-flowing top-down vector arena, AUTO-BATTLE, rare real-time moments, stats matter, RPS between weapons and defences, robots mostly open with a hidden layer.
- v0.3 (Kev): base the whole game on Spartacus: A Game of Blood & Treachery, as a digital Robot Wars variant, using digital freedom where it makes sense. Territory map DROPPED (the arena is the map). Hidden garage still liked, low priority.
- Working rule: show rough playable sketches early and often (small steps, ugly is fine) so Kev can steer.

## Spartacus mapping (v0.3)
| Spartacus | Robot game |
|---|---|
| Dominus / house | Robotics team with a garage |
| Influence (score + gate for schemes, 12 wins) | Fame (same role) |
| Slaves earn gold | Mechanics earn credits (later: engineer, hacker, scout roles) |
| Gladiators cost upkeep | Robots, 1 credit upkeep each, 2–3 per team |
| Injury dice | Persistent damage, repaired for credits |
| Schemes / reactions / guards, support with influence | Sabotage cards (hidden effects until the fight), Guard Dog; support/backing still to add |
| Blind fist auction + host auction | Sealed bids on parts/robots/mechanics + host right |
| Host picks combatants, decline costs influence | Same; host also could pick format/arena rules later |
| Bets on victory / injury / death | Bookmaker odds from simulating the VISIBLE builds; hidden sabotage makes odds wrong |
| Thumbs up/down | Spare or scrap the loser |
| Favor tokens → champion | Wins → fan favourite at 3 wins (+fame, costly to scrap) |

## Prototype v1 rules (Scrapyard Dominus)
- You vs 3 AI teams. Start: pick 1 of 6 **Team Sponsors** (each with one house rule, see `docs/sponsors.md`), 4 fame, 8 credits, 3 mechanics (4 for Sovereign Foundry), 2 random robots from the sandbox presets.
- Upkeep: +1 credit per mechanic, −1 per robot, draw 2 intrigue cards (hand max 4; 3 drawn / max 5 for Blackwire Syndicate), repairs 1 credit per 20 damage (Aegis Heavy repairs 25 damage per robot for free).
- Intrigue: play 1 scheme. Loose Bolts / Sugar in the Tank / Stripped Gears / Smudged Lens (−2 to a stat next fight, secret), Secret Upgrade (+1 FP +1 AR, secret), Pickpocket, Night Shift, Bribe the Press, Smear Campaign, Guard Dog (50% block).
- Market: 3 lots (stat parts, weapon retrofits, calibre kits, new robot, mechanic) + host right, all sealed bids; ties go to lower fame (unless Sovereign Foundry is tied).
- Arena: host +1 fame (+2 credits for Apex Media), invites 2 teams (can include itself), 2 credits appearance money, decline = −1 fame. Bets up to 3 (up to 5 for Lucky Seven, with 1-credit loss refund) at simulated odds (pays ~0.92/p). Winner +1 fame +3 credits (fan favourite at 3 wins, or 2 wins for Apex Media). Host spares or scraps the loser (+2 credits salvage bounty for Vulture Salvage when any robot is scrapped).
- Aftermath Crates: Winner picks **1 of 3** rewards from the **Winner's Crate** (parts, retrofits, or a mechanic); Loser receives a consolation **Scrap Crate** (2 Scrap Crates for Vulture Salvage) containing field repairs, salvaged stat parts, or intrigue/credits.
- First to 12 fame. A scripted run ended in round 9.

## Ideas parked
- Kev's "challenge" idea: a card like "my robot can beat 5 of yours"; others bet on it and it's tested in a dream/simulation arena. To be designed (see chat notes): proposition bets / challenges simulated instantly, possibly with handicaps chosen by opponents.
- Real-time moments: overdrive button per fight; spectator crowd actions.
- 2v2 / free-for-all fights chosen by the host; arena rules chosen by the host.
- Online play: deterministic sim, only inputs shared.

## Tech notes
- Deterministic seeded sim (sim.js) shared by sandbox and game; supports 2–4 robots, teams, friendly fire.
- Voice over Discord.
