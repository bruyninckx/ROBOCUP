# ROBOCUS rulebook (draft v0.1)

Draft v0.1, 5 Nov 2026 · Kev with Claude. Living version: https://claude.ai/artifact/FXXP1hQx6jc67uGHtmzGiv

## 1. The game in one page

Four robotics teams scheme, bid and fight until one reaches **12 fame**. ROBOCUS is *Spartacus: A Game of Blood & Treachery* rebuilt as a digital robot-fight game: online with friends, voice on Discord, about 2 hours.

Each round, teams play Intrigue cards against each other, bid blind for robots and parts, and then the host runs one fight. The fight is an auto-battle everyone watches and bets on. The bookie's odds come from simulating the robots everyone can see, so hidden sabotage makes them wrong.

| You own | What it does |
| --- | --- |
| **Fame** | Your score, and the key to Intrigue cards: each card needs a minimum fame (its gate) |
| **Credits** | Pay for bids, upkeep, repairs and bets |
| **Robots** (2–3) | Each robot card is a full build with one quirk. Robots cost upkeep and fight in the arena |
| **Parts** | Weapons, armour, modules, helper drones and stat upgrades fitted to robots |
| **Crew** | Off-arena staff: Mechanics earn credits, others give powers |
| **Intrigue hand** | Schemes, reactions and Security Bots |

Everything on a robot is open information. Surprise comes only from face-down Intrigue cards.

## 2. Components and setup

Each team starts with 4 fame, 8 credits, 2 Scrap Bots, 3 Mechanics, 1 Security Bot and one sponsor.

| Component | Contents |
| --- | --- |
| Intrigue deck | 74 different cards, 185 copies, in 8 families (Contracts, Publicity, Smear, Sabotage, Corporate, Match-fixing, Security, Leverage) |
| Market deck | 50 cards: 12 robots, 8 crew, 8 weapons, 4 armour, 6 modules, 6 helpers, 4 stat upgrades, 2 legendary |
| Starter kit (per team) | 2 Scrap Bots (no quirk, stock autocannon, empty module slot), 3 Mechanics, 1 Security Bot (installed in the garage) |
| Sponsors | 6 sponsor cards, one rule each |
| Scrap Crate | 7 salvage items for the loser of a fight |
| Host token | Marks the host: hosts the fight and goes first in Intrigue |

**Setup**

1. Shuffle the Intrigue and Market decks.
2. Each team takes its starter kit, 8 credits and 4 fame.
3. Deal each team 2 sponsors; each keeps 1 secretly, then all reveal together.
4. Pick the first host at random; the host token only sets turn order until the first host bid.

Fame always stays between 1 and 12. For a shorter or longer game, start at 7 fame (quick, under 2 hours) or 1 fame (long, 3+ hours), as in Spartacus.

## 3. A round

Every round has the same four phases. A game runs about 10 rounds.

1. **Upkeep:** ready your cards, collect income, pay upkeep and repairs.
2. **Intrigue:** draw 3 Intrigue cards; in turn order, play schemes, cash in cards and use abilities.
3. **Market:** trade freely, then bid blind on one lot per player, then bid for the host token.
4. **Arena:** the host sets up one fight, everyone bets, the robots fight, the host spares or scraps the loser.

At the end of the Intrigue, Market and Arena phases, check for a winner (section 9).

## 4. Upkeep

All teams do Upkeep at the same time. The game does the bookkeeping.

1. **Ready:** every exhausted robot, crew card and Security Bot asset turns ready again, unless a card keeps it out (for example Rogue Firmware: sits out the next fight).
2. **Repairs:** pay 1 credit per 20 damage you want to repair, and half the bank value (minimum 1) per broken part. Damage you don't repair stays on the robot and it starts its next fight with less health. Repair Tech halves the cost; Aegis repairs 25 damage per robot for free.
3. **Ledger:** gain 1 credit per ready Mechanic. Pay 1 credit per ready robot and 1 credit per 2 helper drones. The Accountant takes 1 off the bill for each robot after the first.
4. **Can't pay:** scrap one robot of your choice for each credit you can't pay (Spartacus discards a gladiator).

## 5. Intrigue phase

Every team draws 3 Intrigue cards. Then, starting with the host and going clockwise, each team takes one Intrigue turn. These rules copy Spartacus one to one.

**Your turn.** In any order, you may:

- **Cash in** any number of cards: discard them and take the credits printed on the coin.
- **Use abilities** of your crew, sponsor and robot quirks that work in this phase.
- **Play schemes**, one at a time.

Your hand limit is 4 cards at fame 1–4, 5 at fame 5–8 and 6 at fame 9–12. You may go over it while drawing, but you must end your turn at or under it. Each turn has a soft 60-second timer: when it runs out, the other players can vote to end your turn.

**Playing a scheme.** Your fame must be at least the card's gate (▲ = more fame than the target, ▼ = less). Name a target; it can be your own team. If nothing blocks it, the effect happens at once, you pay any cost, and the card is discarded.

**Face-down cards** (Sabotage and Match-fixing cards marked face-down) go onto a robot without being shown. They stay hidden until they trigger in that robot's next fight. The bookie can't see them. The targeted team does see that a card was placed, and may spend Security Bots on it right away, blind.

**Backing.** If your fame is too low, ask other teams to back you. Each backer adds its fame to yours for that one card. Backers can't pull out once they agree, and you don't have to tell them what the card does or tell the truth about it. Backing earns nothing by rule; teams make their own deals. The Fixer adds +2 toward the gate; Board Seat forces a team to back you with all its fame.

**Reactions** have their own gate, can't be backed, and can be played at any time, also outside your turn and outside this phase. A blocking reaction can stop any scheme, not just one aimed at you. Reactions can't be blocked unless a card says so (Firewall). A blocked scheme has no effect and no cost, and is discarded.

**Security Bots** only protect your own team. When a scheme targets you, discard a Security Bot and roll a die: 4–6 blocks it (3–6 with a Security Chief). You get one roll per Security Bot, and the bot is gone even if the roll fails. After a failed roll you may still block with a reaction. Bots in hand and bots installed as garage assets both count. Against a face-down card you roll blind, at the moment it is placed.

**Trading.** Intrigue cards never change hands. Credits may change hands at any time, and any promise can be made, but no deal is binding.

**Ready and exhausted.** Some cards tell you to exhaust a robot or crew card. An exhausted card can't fight, earn income, count toward card conditions, be sold or traded, or be discarded. It readies again in the next Upkeep.

**Live combat cards** (Match-fixing, marked Live) stay in your hand until a fight. You can play at most one per fight, after bets close.

## 6. Market phase

The Market has three steps: open market, auction, host bid. Robots, crew, parts and Security Bot assets change hands only in this phase.

**1. Open market.** No turn order. Teams buy, sell and trade robots, crew, parts and installed Security Bots with each other for credits or swaps, and may sell any of them to the bank for the card's printed value. Intrigue cards can't be traded or sold here. The step has a soft 90-second timer: it ends when nobody wants to trade any more, or when the others vote to move on after the timer. This is also when you fit or swap parts on your robots (section 8).

**2. Auction.** Lay out one Market card per player. Auction them one at a time:

1. Every team bids credits in secret; bids are shown together.
2. The highest bid pays the bank and takes the card. Everyone else keeps their credits.
3. **Tie:** only the tied teams bid again in secret. Their first bids stay on the table and the second bid adds to it. Repeat until one total is highest.
4. **Tie again with nobody adding:** the team with less fame wins. The game shows this as a warning before the rebid, so everyone knows what a standstill means.
5. **All bids 0:** the auction fails and the card is discarded.

Sovereign Foundry wins any tie it's in, without a rebid. Legendary cards (Railgunner, Twin Turret, Quantum Shield) are announced one round before they come up, so teams can save. The Market Analyst sees the next round's lots early.

**3. Host bid.** Same rules as an auction; the winner takes the host token, hosts this round's fight and goes first in the next Intrigue phase. If every host bid is 0, a random bidder gets the token.

**Robot-count wager.** With your host bid you also secretly name a robot count: 1, 2 or 3 robots per side. Only the winning host's count is used. 1 is a normal duel; 2 or 3 turns the fight into an event, and a side may send fewer robots than the count if it chooses, so uneven fights (3 vs 1) can happen.

## 7. Arena phase

One fight per round, run by the host. Most fights are duels; about 1 in 4 should be an event.

**1. Honour to the host.** The host gains 1 fame.

**2. Format.** The fight is a duel (one robot per side) unless something makes it an event. Events stack with no cap: a robot-count wager and any number of format cards can all apply to the same fight. When two of them set the same thing, such as how many robots each side sends, the one played last wins.

| Event | What changes |
| --- | --- |
| Robot-count wager of 2 or 3 | Each side may send up to that many robots |
| Tag Team Licence | 2v2; the player picks an ally, who may refuse for −1 fame |
| Grand Final (fame 10+) | 2v2: the two fame leaders against the other two; double fame for the winners |
| Grand Melee | The host must run a free-for-all or team fight; host +1 fame if it happens |
| Mirror (host only) | Each side picks one robot; it fights as 2–3 copies; afterwards the real robot keeps the damage of its healthiest surviving copy |
| Unleash the House Robot (host only) | A neutral robot joins and attacks whoever is closest |

**3. Invitations.** The host invites one team at a time until both sides are filled; the host may invite itself. A team that accepts picks the robot it sends. A team that declines loses 1 fame, and the host invites the next one. If every other team has been asked and a side is still open, the host must fill it. If only one team accepts, there's no fight this round. In a 2v2, the host invites four times (no team more than twice, no team asked again after declining) and pairs the teams.

**4. Appearance money.** Each invited team gets 2 credits, plus 2 per Fan token on its robot (6 for a Fan Favourite).

**5. Bets.** The bookie simulates the visible builds and shows each side in one of 5 bands: heavy underdog (under 25% to win), underdog (25–42%), even (42–58%), favourite (58–75%), heavy favourite (over 75%). Every team may place bets of 1–3 credits each (Lucky Seven: up to 5). You can't bet against your own robot unless you play Hedge Bet.

| Bet | Pays |
| --- | --- |
| Win, heavy underdog | 3:1 |
| Win, underdog | 2:1 |
| Win, even | 1:1 |
| Win, favourite | 1:2 |
| Win, heavy favourite | 1:3 |
| Close call: the winner ends below 25% health | 2:1 |
| Scrapped: the host scraps the loser | 2:1 |

Winning bets get their stake back plus the payout; losing bets go to the bank.

**6. The fight.** Bets close, face-down cards stay hidden until they trigger, and the auto-battle runs. Each player may play one live combat card during it. The fight ends when one side has no working robots left. After 60 seconds, sudden death starts: the arena walls close in step by step, and any robot outside the safe zone takes damage, until one side falls.

**7. Results.** The winning team gains 1 fame and no prize money (as in Spartacus: credits come from bets and appearance money); in a team fight, every team with a winning robot gains 1 fame (once). The winning robot gets a Fan token; its third token makes it a Fan Favourite (+1 fame to its owner; losing a Fan Favourite costs 1 fame). Apex Media gets Fan Favourite on the second win.

**8. Spare or scrap.** The host decides the loser's fate. **Spare:** the robot goes home with damage equal to half its health. **Scrap:** the robot goes to the Market discard and its bought parts go back to the owner's garage. Scrapping costs the host 1 fame per Fan token on the robot, and a Fan Favourite can't be scrapped. Teams may bribe the host. Vulture Salvage gets 2 credits whenever a robot is scrapped.

**9. Scrap Crate.** The losing team draws one Scrap Crate item.

## 8. Robots and parts

A robot has 7 stats from 0 to 4 (health, armour, speed, turret turn, firepower, accuracy, bullet speed) and these slots:

| Slot | Limit | Notes |
| --- | --- | --- |
| Weapon | 1 | Twin Turret adds a second weapon slot at 60% firepower |
| Armour | 1 |  |
| Module | 1 |  |
| Helper drones | up to 3 | Fortress: 4. Helpers shut down when their robot dies |
| Stat upgrades | any, max level 4 per stat | Each one adds strain |

**Robot cards come pre-built.** Each robot card has its signature weapon, drive, processor and module, plus one quirk.

- **Weapon swap:** a bought weapon can replace the signature weapon, but the robot loses its quirk for good, even if the old weapon goes back on. The game warns you before you confirm.
- **Module swap:** allowed, and the quirk stays.
- **Drive and processor:** fixed. The Railgunner's railgun can't move to another robot.
- **Spares:** a part you take off stays in your garage. Refit it later or sell it to the bank.
- **Scrap Bots** have no quirk, so any part can go on them freely.

**Strain and breaking.** Every part and upgrade shows its strain (⚡). Before a fight, each breakable part may break, more likely the more strain the robot carries: 5% per ⚡, halved by an assigned Chief Engineer. Only legendaries, parts with value 4–5 and salvaged Scrap Crate items can break. A broken part stops working and stays broken until you repair it in Upkeep for half its bank value (minimum 1 credit); a broken salvaged item is gone for good.

**Damage and repair.** Damage stays on a robot between fights, so it starts its next fight with less health. Repair in Upkeep for 1 credit per 20 damage.

**Size.** A robot's frame and hitbox grow 5% per ⚡ it carries, and Twin Turret adds +20% on top, which is easier to hit and easier to tell apart.

## 9. Winning

If exactly one team has 12 fame at the end of an Intrigue, Market or Arena phase, it wins. If more than one does, fight it out (Spartacus tie-break):

- **2 teams at 12:** each sends one robot; the winner of the duel wins the game.
- **3 teams at 12:** total the bank value of each team's robots and parts. The two lowest fight; the winner fights the third.
- **4 teams at 12:** the two lowest totals fight and the two highest fight; the two winners fight for the game.

No reactions or live combat cards in a tie-break fight. This also settles a Grand Final that puts both leaders at 12 in one fight.

## 10. Gaps this draft found

Writing the rules out turned up 12 open points, all settled on 5 Nov. The answers raised 3 smaller ones, settled the same day. Items marked *proposal* are filled in above with a first guess.

- [x] **Hand limit:** 4 cards at fame 1–4, 5 at 5–8, 6 at 9–12
- [x] **Starting Security Bots:** 1 per team, installed in the garage
- [x] **Appearance money:** 2 credits per invited team, plus 2 per Fan token (6 for a Fan Favourite)
- [x] **Winner's credits:** none; the winner gets 1 fame, like Spartacus
- [x] **Bet payouts:** 3:1 for a heavy underdog down to 1:3 for a heavy favourite; Close call and Scrapped pay 2:1
- [x] **Loser's damage:** a spared loser keeps damage equal to half its health
- [x] **When parts can be fitted:** only in the open market
- [x] **Broken parts:** stay broken until repaired
- [x] **Stacking events:** allowed, no cap
- [x] **Fight timeout:** sudden death after 60 seconds
- [x] **Security Bots against face-down cards:** roll blind when the card is placed
- [x] **Online timing:** soft timers (60 s per Intrigue turn, 90 s for the open market); the others can vote to move on
- [x] **How sudden death works:** the arena shrinks step by step; robots outside the safe zone take damage
- [x] **Stacked events that clash:** the event played last sets the disputed rule (e.g. robots per side)
- [x] **Broken-part repair cost:** half the part's bank value, minimum 1 credit

Still needs the sim: how fast the arena shrinks and how much damage the zone does.

The Spartacus rules here come from the [Universal Head rules summary v4.1](https://www.orderofgamers.com/downloads/Spartacus_v4.1.pdf); the ROBOCUS rules come from the 5 Nov decisions in the to-do doc.
