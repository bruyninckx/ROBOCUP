# Card analysis (6 Nov 2026, evening)

Kev asked for an analysis of all the cards: do some need balance changes, other ideas, or more impact?

**Method.** 80 all-AI games of the tabletop (`tools/pace.js`, which records `G.cstat`).

For each Intrigue card it records:
- how often it is drawn, played, cashed in or blocked
- what a landed card changed: fame and credits for the player and for the others
- the share of its plays made by the eventual winner (25% = neutral)

It also records sponsor win rates and how Market lots sold.

**Caveat.** These are AI games, and the AI never plays some cards (marked "AI never plays"). For those cards the data says nothing about their design. Fight effects (face-down and live cards, damage, exhausting) don't show in the fame and credit numbers.

The Intrigue deck has 188 cards: 78 different ones, plus 28 Security Bots.

## Bugs found

- **Overclock never existed.** The face-down card and the live Target Overclock both got the id `overclock`. So all 4 copies played as Target Overclock. Fixed: the face-down one is now `overclock_fd`.

## Intrigue cards

| Family | What the numbers say |
|---|---|
| **Publicity** (fame) | The main fame engine: Press Tour, Celebrity Endorsement, Fan Meet and Team-Building Day are played almost every time they are drawn, for +1 fame (Team-Building +1.7). Weak or hard-to-use ones: Underdog Story (played 24% of draws, needs a sole last place), Roadshow (needs 3 ready robots, 25%), Launch Party (pays 6 Cr for +1 fame; its players won 13%), Public Demo (3 Cr for +1). **Blaze of Glory: AI never plays.** |
| **Contracts** (credits) | Consulting Gig is the best credit card (+7.4 Cr per play, about 2 per crew member). Scrap Deal +5, Crunch Week +5.2 (but only played 45%, cashed 33%), Overtime +3.9, Scrapyard Salvage +3. Joint Venture is weak (+2.5 each, played 42%). **Fire Sale: AI never plays.** |
| **Smear** (−fame) | They work, but blockers eat them. Smear Campaign is blocked 71%, Rigged Ratings 88%, Bribe Scandal and Paparazzi about half. The condition cards almost never fire: Leaked Footage (played 14%), Bankrupt! (6%), Skeleton Crew (21%). **Pile-On and Robot Rights Protest: AI never plays.** |
| **Sabotage** | Played 85–98% of draws, but about half are blocked. Security Override is blocked 75% (it is meant to strip Security Bots, and they block it). Botched Install is played 34% (it needs a rival to win a part). |
| **Corporate** | Shill Bidder blocked 63%, Asset Strip 78%, Hostile Buyout 50%. The three were played 34–50% of draws. |
| **Match-fixing / Arena** | Live cards (Target Overclock, Field Engineer, Oil Canister, Remote Trigger, EMP Grenade) get played. Format cards are rare: Grand Final 23%, Mirror 18% (cashed 67%), Unleash the House Robot 7%. **Hedge Bet, Bookie's Friend and Pilot Waypoint: AI never plays.** |
| **Security** | 28 Security Bots are 15% of the deck: 11 drawn per game, 10.5 used, blocking about half the time. Together with 13 other blockers, harmful cards land only about half the time. Under the Radar and Overreach are played about 30% (they need a fame gap). **Backup Restore and Board Seat: AI never plays.** |

## Sponsors (win %, 25% is fair)

| Sponsor | Win % | Games |
|---|---|---|
| Apex Media | 52% | 46 |
| Sovereign Foundry | 36% | 64 |
| Blackwire Syndicate | 21% | 53 |
| Aegis Heavy | 20% | 54 |
| Vulture Salvage | 17% | 48 |
| Lucky Seven | **5%** | 55 |

- **Apex** (+2 Cr when hosting, Fan Favourite at 2 wins) is far too strong.
- **Lucky Seven** (bet up to 5, 1 Cr refund on a loss) does almost nothing. Bets are small and they pay by band.

## Market lots

Robot lots and generic parts sell 96–100% of the time at 2.5–3 Cr. Legendaries sell at about 4.7 Cr, cheap for a legendary.

Weapon upgrades for one weapon type often go unsold: Ricochet Saws 56%, Serrated 63%, Focusing Lens 64%, Napalm 67%, Cluster 84%. Only teams with that weapon can use them.

Crew lots sell 93–100%. A Mechanic goes for 4.1 Cr, the most of any crew.
