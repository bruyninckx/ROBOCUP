# ROBOCUS rulebook (v1.0, first published game)

v1.1, 7 Nov 2026 · Kev with Claude (v1.1: Intrigue trim and the live-card auction). These are the rules of the game as published on GitHub Pages: `prototypes/tabletop-prototype.html` (play it at https://bruyninckx.github.io/ROBOCUP/). Where the game and this text disagree, the game wins; tell Claude. Living version: https://claude.ai/artifact/FXXP1hQx6jc67uGHtmzGiv

## 1. The game in one page

Four robotics teams scheme, bid and fight until one reaches **12 fame**. ROBOCUS is *Spartacus: A Game of Blood & Treachery* rebuilt as a digital robot-fight game: 1–4 people online (voice on Discord), the AI plays every empty seat, about 2 hours.

Each round, teams play Intrigue cards against each other, bid blind on robots and parts, and bid to host the fight. The host picks who fights, everyone bets, and the robots auto-battle while everyone watches. The bookie's odds come from simulating the robots everyone can see, so hidden sabotage makes them wrong.

| You own | What it does |
| --- | --- |
| **Fame** | Your score (1–12), and the key to Intrigue cards: each card needs a minimum fame (its gate) |
| **Credits** | Pay for bids, repairs, bets, scouting and sparring |
| **Robots** (1–3) | Each robot is a full build; Market robot cards also have one quirk. Robots cost upkeep and fight in the arena |
| **Parts** | Weapon upgrades, calibres, armour, modules, helper drones and stat upgrades fitted to robots, or kept in your Stash |
| **Crew** | Named cards: Mechanics earn credits, Chief Engineers keep robots reliable, specialists give powers |
| **Intrigue hand** | Schemes, reactions, Arena cards and Security Bots (live fight cards are won at auction for one fight) |

Everything on a robot is open information. Surprise comes only from face-down Intrigue cards.

## 2. Setup

Each team starts with **4 fame** (the host can pick 7, 4, 2 or 1 before the game: 7 is quick, 1 is long), **8 credits**, 3 Mechanics, 1 Chief Engineer and 1 Security Bot installed in its garage.

| Component | Contents |
| --- | --- |
| Intrigue deck | 60 different cards, 135 copies (18 of them Security Bots), in 7 families: Contracts 9, Publicity 14, Smear 8, Sabotage 10, Corporate 3, Match-fixing 7, Security 9 |
| Auction deck | 16 cards: Remote Trigger 2, Pilot Waypoint 3, Target Overclock 2, Field Engineer 3, Oil Canister 2, EMP Grenade 2, Swap the Entry 2 |
| Lot deck (Market) | 49 cards: 7 stat upgrades, 6 weapon upgrades, 3 gun calibres, 4 armour, 12 modules, 7 helper drones, 5 New Robot, 5 New Crew |
| Robot deck | 11 Market robot cards, each with a quirk |
| Legendaries | Railgunner (robot), Twin Turret, Quantum Shield: one copy each |
| Starter deck | 9 stock `s1.` robots (11 stat points, levels up to 3, stock parts, 1 Chief Engineer) |
| Crew deck | 10 crew cards: 2 Mechanics, 2 Chief Engineers, Accountant, Hacker, Market Analyst, Fixer, Security Chief, Repair Tech |
| Sponsors | 6 sponsor cards, one rule each |
| Scrap Crate | 7 salvage items for the losers of a fight |

**Setup steps**

1. **Sponsor:** each team is dealt 2 sponsors and keeps 1. People pick on their own screen; AI teams are dealt 2 of the rest and keep 1.
2. **Starter draft:** every team is dealt 2 `s1.` starters at the same time and keeps 1 in secret; all picks are revealed together, so nobody can pick a counter to what the others took (the AI keeps the one with the better average). The other goes back into the starter deck. The starter goes into bay 1 with its Chief Engineer. Starter matchups: `docs/starter-balance.md`.

| Sponsor | Rule |
| --- | --- |
| Aegis Heavy | Repairs 25 damage on each robot for free every Upkeep |
| Blackwire Syndicate | Draws 1 extra Intrigue card in Upkeep; Intrigue schemes need 2 less fame |
| Sovereign Foundry | Starts with 4 Mechanics; wins every Market lot tie outright (not the host bid) |
| Apex Media | +2 credits when it hosts; Fan Favourite at 2 wins (not 3) |
| Lucky Seven | Bets up to 5 credits; a winning bet pays one band better (Even pays like Underdog); a losing bet refunds 1 credit |
| Vulture Salvage | +2 credits whenever any robot is scrapped; keeps 2 Scrap Crate items |

## 3. A round

A round has 7 steps (the bar at the top of the screen). A game runs about 8–12 rounds.

1. **Upkeep:** robots and crew ready again, the ledger pays out, everyone draws 3 Intrigue cards, repairs and tunes robots.
2. **Intrigue:** one turn each, last round's host first, then clockwise.
3. **Market:** open market (trades), then sealed bids on 4 lots, then the separate host bid.
4. **Host:** Arena cards that change the fight, then the host invites the fighters.
5. **Bets:** the bookie sets the odds; everyone bets in public and bids in secret on 2 fight cards.
6. **Fight:** the robots auto-battle; live combat cards can be played.
7. **Fate:** the host spares or scraps each losing robot; losers open a Scrap Crate.

The game checks for a winner after the Intrigue phase, after the Market and after the Fate step (section 9).

## 4. Upkeep

All teams do Upkeep at the same time; the game does the bookkeeping. Upkeep ends when every person has pressed **Done**.

1. **Ready:** every robot, crew card and Security Bot is ready again, unless a card keeps it out (Rogue Firmware: the robot sits out its next fight).
2. **Ledger:** +1 credit per Mechanic, −1 credit per robot, −1 credit per 2 helper drones (the Accountant: only your first robot costs 1). The ledger is in the log.
3. **Can't pay:** scrap one robot of your choice for each credit you can't pay. A team left without robots gets a free Scrap Bot.
4. **Draw:** 3 Intrigue cards (Blackwire +1; a Tinker that sat out last round +1).
5. **Repairs:** click a damaged robot to repair it to full health. Cost: 0.7 credits per 20 damage, times its battle wear (section 8), rounded up, plus each broken part (weapon 2, weapon upgrade 2, Twin Turret 3, drone 2, other parts 1). The Repair Tech halves the damage cost; Aegis repairs 25 damage per robot for free first.
6. **Tune:** set each robot's Chief Engineers (0–3), range (short, mid, long) and target focus (main robot, medic drones, helper drones). Fit parts from your Stash.
7. **Scout (1 credit, any time but a fight):** exact win % for every matchup until the end of the round, instead of the fuzzy bands.
8. **Sparring match (2 credits, once a round):** one of your ready robots fights any rival robot in a test fight. Everyone watches; nothing carries over (no damage, no fame, no breaks, no cards).

## 5. Intrigue phase

Starting with last round's host and going clockwise (round 1: the first team), each team takes one Intrigue turn. There are no timers.

**Your turn.** In any order, you may:

- **Play schemes**, one at a time: drag the card onto a garage (a rival's, or your own for cards that help you).
- **Install Security Bots** from your hand in your garage.
- **Cash in** cards: switch on cash-in mode and click cards to discard them for the credits on their coin.

**Hand limit:** 4 cards at fame 1–4, 5 at fame 5–8, 6 at fame 9–12. At the end of your turn you cash in down to the limit (the cheapest cards are ticked for you).

**Playing a scheme.** Your fame must be at least the card's gate (▲ = only against a team with more fame than you, ▼ = less). If nothing blocks it, the effect happens at once and the card is discarded.

**Backing.** Short on fame? Ask other teams to back you, one at a time. Each backer adds its fame to yours for that one card; you don't have to say which card it is. You may offer credits and Stash parts; backers are paid only if the backing is enough and the card is really played. The Fixer counts +2 fame.

**Defence.** When a harmful scheme targets you, your Security Bots roll first: each bot (installed or in hand) is spent and rolls a die, 4–6 blocks it (3–6 with a Security Chief), one roll per bot until one blocks. Then a **reaction window** opens for every team holding a blocking reaction (Paid Off, Fall Guy, Firewall, PR Spin, Not My Robot, Sponsor's Lawyers, Under the Radar, Overreach). A blocked scheme has no effect and is discarded.

**Face-down cards** (Sugar in the Tank, Smudged Lens, Secret Upgrade, Overclock) go onto a robot without being shown (🂠). They stay hidden, also from the bookie, until that robot's next fight starts.

**Ready and exhausted.** Some cards exhaust robots, crew or Security Bots. An exhausted robot can't fight this round; exhausted crew can't be used for card conditions. Everything readies in the next Upkeep.

**Not played here:** Arena cards wait for the Host or Bets step, Botched Install for the Market. All of them can be cashed in on your turn instead.

## 6. Market phase

Three steps. Robots, crew and Security Bots change hands only here.

**1. Open market.** No turn order. With the deal panel you trade credits, Stash parts, robots (with their fitted parts; Chief Engineers stay home), crew cards and installed Security Bots with any team; the other side accepts or refuses, nothing moves until then. A team always keeps at least one robot and has 3 bays. You can also sell Stash parts to the bank at half value. AI teams make offers too. The step ends when every person has pressed **Start the auction**.

**Stash.** Up to 4 spare parts per team, open for everyone to see: lots no robot could take, parts kept aside, swapped-out modules and armour. Fit a Stash part in Upkeep or the Market, trade it, or sell it to the bank (half value, minimum 1: drones and weapon upgrades are worth 3, legendaries 5, other parts 2). A full Stash sells the next part to the bank.

**2. Auction: 4 lots.** Four lots are laid out. A New Robot lot is a real robot, face up (stats, weapon, quirk, the bookie's band). In rounds 1–5 at least one lot is a robot. From round 2, every other round announces a legendary for the next round, where it takes the last lot.

1. Every team bids on all 4 lots at once, in secret, with at most the credits it has.
2. Lots are resolved in order: the highest bid pays the bank and takes the lot; everyone else keeps their credits.
3. **Tie:** only the tied teams rebid in secret, adding to their first bid (only with credits not already bid on later lots). **Sovereign Foundry** wins any lot tie it is in, without a rebid (not the host bid). If a rebid ties again with nobody adding, the team with less fame wins.
4. No bids: the lot goes back (an unsold robot to its deck, a legendary comes back later).
5. **Botched Install:** before anything is fitted, a team holding Botched Install may wreck a rival's won part (normal defence applies; it can also demand a payoff instead). A botched part is scrapped; the winner gets half its bid back and the saboteur 1 credit.
6. **Installs:** fit each won part on one of your robots that can take it, or keep it in your Stash. A swapped-out module or armour goes to the Stash. New crew joins your team.

**3. Host bid.** A separate sealed bid with the credits you have left; ties are rebid the same way. The winner pays, becomes host and gains **+1 fame** at once, unless it is the sole fame leader (Apex Media +2 credits). No bids: a random team hosts. With the host bid you also name a **robot count**: 1 or 2 robots per side. Only the winning host's count is used, and only for a normal duel. Calling 2 costs the host 1 credit; each invited team sends up to 2 ready robots; if the fight ends up uneven (2 vs 1) the host loses its +1 host fame.

## 7. Arena phase

One fight per round. Most fights are duels; Arena cards turn them into events.

**1. Host step.** Starting with the host and going clockwise, teams may play Arena cards: the host may play **Mirror** (each robot fights as 2 copies; afterwards it keeps the damage of its healthiest copy) or **Unleash the House Robot** (a neutral heavy-gun robot drops in and attacks whoever is closest); any team may play **Grand Melee** (a free-for-all for every team with a ready robot; host +1 fame when it happens). Events set up on Intrigue turns also apply: **Tag Team Licence** (2v2, you pick your ally; refusing costs the ally 1 fame) and **Grand Final** (gate 10: the two fame leaders vs the other two, double fame).

**2. Invitations.** In a duel the host invites 2 teams (it may invite itself); other teams may offer the host a deal to be invited or left out, paid only if the host does it. Each invited person sends one of their ready robots. In a duel an invited team may decline for −1 fame and a team with a ready robot steps in. A team with no ready robot declines automatically (−1 fame); in an event it sits out. Events can't be declined. With fewer than 2 sides there is no fight this round.

**3. Appearance money.** Each invited team gets 2 credits, plus 2 per Fan token on its robot (6 for a Fan Favourite), once per team.

**4. Bets.** The bookie runs 20–40 simulated fights of the visible builds (face-down cards stay hidden) and shows each side in a band. Each team may bet 1–3 credits on one side (Lucky Seven: 5), but not against its own robot. **Bets are public** and update live as anyone clicks; when a team changes its bet, everyone who already locked is un-locked so they can react (no timer). Bookie's Friend shows every face-down card in the fight. The Hacker and a Sniper's Scope each show one face-down card on a rival robot.

**Fight-card auction.** At the same time, 2 cards from the Auction deck are turned up. Every team may make a **sealed bid** on each (a 🔥 shows a card is wanted: 3+ credits bid on it in total, or 2+ teams bidding). Everyone locks bet and bids together. The bets are paid first, then each card goes to its highest bid, which pays its bid (minimum 1 credit); a team wins at most **1 card per fight**, and a tie goes to the team with less fame (equal fame: nobody). A won card is for **this fight only** (no fame gate); unused or unclaimed cards are discarded. The bookie's odds ignore the cards. **Swap the Entry** is used right after the auction and changes which robot a team sends (bets and odds stay).

| Band | Win chance | A winning bet returns |
| --- | --- | --- |
| Heavy favourite | 75% and up | 1.33× the stake (1:3) |
| Favourite | 58–75% | 1.5× (1:2) |
| Even | 42–58% | 2× (1:1) |
| Underdog | 25–42% | 3× (2:1) |
| Heavy underdog | under 25% | 4× (3:1) |

A losing bet goes to the bank (Lucky Seven gets 1 credit back; its winning bets pay one band better). A draw or a House Robot win refunds every bet. An Underdog or Heavy underdog win is an **UPSET!**

**5. The fight.** Face-down cards and garage sabotage are revealed, the robots roll in, a 3-second countdown, then the auto-battle. Drag the **live fight card** you won at auction into the fight: Remote Trigger, Pilot Waypoint, Target Overclock, Field Engineer, Oil Canister or EMP Grenade. After 60 seconds (+30 s per robot beyond two) sudden death starts: over 20 seconds the walls close in to a small box, then the floor overheats and every robot loses health faster and faster (armour doesn't help) until one side falls.

**6. Results.** Every team on the winning side gains **1 fame** (2 in a Grand Final), once per team, and no prize money. Each winning robot gets a Fan token; its 3rd (Apex: 2nd) makes it a **Fan Favourite**: +1 fame. A House Robot win or a draw gives nobody fame. Each fighter adds its seconds in the arena to its battle time (section 8). A spared loser keeps at most half its health as damage.

**7. Fate: spare or scrap.** The host judges every losing robot, one at a time, first knocked out first. The losing team may offer the host a deal to spare it, rivals to scrap it; the host takes the offers of the side it picks. The host's own robot and Fan Favourites are always safe. A scrapped robot is gone with its parts (its card goes back to its deck); Vulture Salvage gets 2 credits; a team left without robots gets a free Scrap Bot.

**8. Scrap Crate.** Then each losing team draws 3 of the 7 Scrap Crate items and keeps 1 (Vulture Salvage keeps 2): Salvaged Plate, Hull, Servo, Gear or Sights (+1 armour, health, speed, turret or accuracy level, ⚡1, gone for good when it breaks; it goes on the losing robot, else another robot, else the Stash), Scrap Patch Kit (repair 30 damage) or Black-Box Tape (draw 1 Intrigue card, +1 credit).

## 8. Robots and parts

A robot has 7 stats from 0 to 4 (health, armour, speed, turret turn, firepower, accuracy, bullet speed) and these slots:

| Slot | Limit | Notes |
| --- | --- | --- |
| Weapon | 1, for life | Gun (medium, heavy, rapid or burst calibre), laser, mortar, saw blades, spinner, flamethrower, railgun. Twin Turret adds a second weapon at 60% firepower |
| Weapon upgrade | 1 | Only for its weapon: Match-grade Barrel, Focusing Lens, Serrated Blade, Ricochet Rig, Napalm Mix, Cluster Shells |
| Armour | 1 | Heat Shield, Ablative Plating, Reactive Spikes, Composite Mesh |
| Module | 1 | 12 modules (shield, decoy, EMP, hook, flipper, mines, repair, self-destruct, smoke, reflective, jump jets, oil slick) plus the legendary Quantum Shield |
| Helper drones | up to 3 | Medic, Waller, Spotter, Gun, Bodyguard, Jammer. Fortress: 4 |
| Stat upgrades | max level 4 per stat | Tuned Engine, Turret Motor, Targeting Chip, Reinforced Hull |

- **No weapon swaps:** a robot keeps its weapon; a part only fits robots it suits. A gun may change calibre (the game warns which stats stop or start mattering). Want another weapon: get another robot, or fit the Twin Turret.
- **Market robot cards** come pre-built with a drive and a processor (fixed) and a quirk: Juggernaut (Showstopper), Wasp (Hotshot), Sniper (Scope), Ricochet (Trick Shot), Brawler (Grudge), Artillery (Underrated), Hookshot (Sticky Fire), Turncoat (Treacherous), Slick (Fireproof), Fortress (Bastion), Tinker (Cunning); legendary Railgunner (Headline Act). A module swap keeps the quirk.
- **Strain (⚡) and reliability.** Every part shows its strain. In a fight a robot can **malfunction** (8% per ⚡, ×0.6 per Chief Engineer on it, at most 90%) and each part can **break** (3.5% per ⚡ of that part, more when the robot carries over 4 ⚡, halved per Chief Engineer). A broken part stops working for the rest of the fight and stays broken until repaired in Upkeep; a broken salvaged item is gone for good. Each Chief Engineer works on one robot (max 3 per robot).
- **Damage and battle wear.** Damage stays on a robot between fights. Every second a robot has ever fought adds to its battle time, and its repairs cost ×(1 + battle time / 60 s), for good: after about 60 seconds of fights its repairs cost double.
- **Size.** A robot's frame grows with its strain: Light (0–2 ⚡), Medium (3–4), Heavy (5–6), Titan (7+). Bigger is easier to hit.
- **How strong is my robot?** Every robot shows the bookie's band vs the field (its average chance against every robot of the other teams). Market lots show how a part would move that band. Counter tags show ▲ strong vs / ▼ weak vs weapon types, measured in the fight simulator. Scout and sparring: section 4.

## 9. Winning

The first team at **12 fame** when the game checks (after the Intrigue phase, after the Market and after the Fate step) wins. If more than one team is there, the one with the most fame wins; still tied, the one with the most credits. The host can start a rematch.

## 10. Online play

- **Start:** the host clicks 🌐 Online → Host a game and sends the invite link. Players open it, type a name, pick a colour and press Ready. Seats nobody takes are played by the AI. A person's team carries their name.
- **The host's browser runs the game.** Everyone else sees the same table from their own seat: own hand, own bids, own questions. Hidden from others: hand cards, deck order, sealed bids, face-down cards.
- **Same time:** Upkeep, open market, bids, host bid, bets, robot picks and the next-round button wait until every person is done ("Waiting for …"). Intrigue turns and the starter draft go one person at a time.
- **No timers.** If someone keeps the table waiting, the host gets 🔔 Nudge and ⏭ Skip buttons (Skip takes the default answer for that step).
- **Drop-outs:** the game pauses until the player is back (same link, same name). The host can let the AI take the seat instead.
- **Save:** the game saves at the start of every round; the host downloads it from the 🌐 badge (💾 Save game) and can load it in the lobby of a new room (same names get the same seats).
- **Fights** run on every screen in sync; live combat cards land at the same moment for everyone.

## 11. Not in the game yet (from draft v0.1)

These were in the 5 Nov draft but the published game does not do them. Kev to decide: build them, or drop them from the rules.

- **Close call and Scrapped bets** (2:1): only bets on a side exist.
- **Fame cost for scrapping:** the draft charged the host 1 fame per Fan token on a scrapped robot, and losing a Fan Favourite cost its owner 1 fame. In the game a Fan Favourite simply can't be scrapped, and nothing else costs fame.
- **Parts back after a scrap:** in the game a scrapped robot's parts are lost with it.
- **Tie-break fights** at 12 fame: the game uses most fame, then most credits.
- **Invitations one team at a time** (and the 2v2 invite pairing): the host picks both teams at once.
- **Fitting parts only in the open market** (Kev, 5 Nov): the game also lets you fit Stash parts in Upkeep.
- **Selling robots and crew to the bank:** only Stash parts can be sold to the bank.
- **Soft timers and voting to move on:** replaced by no timers plus the host's Nudge and Skip.
- **Robot-count wager of 3** and the Mirror with 3 copies: the game uses 1–2 robots per side and 2 copies.
- **Breaks only on legendaries and parts worth 4–5:** in the game every part can break, at a rate set by its strain.

The Spartacus rules come from the [Universal Head rules summary v4.1](https://www.orderofgamers.com/downloads/Spartacus_v4.1.pdf).
