# Card flavour: themed names and drawings (T39, T42: 19 cards)

Kev, 21 Nov 2026: "I want a nice thematic change on some of the cards but I am more picky on what to include, I liked the
IBM idea". He voted Yes on the names below, chose "new name big, the game's name small under it", and art direction A,
"Scrapyard ink" (drawn like the robots: thick ink lines, flat rusty colours, hazard yellow).

**Display only.** Nothing in the rules, numbers, card ids, the bookie, the AI, saves or network messages changes. The game
log, `rules.html` and the docs keep the game's names. Everything keys on the card's id, never on its display name.

## The table (`FLAVOR` in `prototypes/tabletop-2.html`)

| Card id | Game card | Flavour name | Flavour line |
|---|---|---|---|
| `p_quantum` | Quantum shield (legendary part) | IBM 5100 | Recovered from a time traveller in 1975. Do not ask about 2036. |
| `p_core` | Prototype core (legendary part) | Riemann, Compiled | 250,000 pages. No human has read it. It compiles. |
| `p_weapon` | Weapon overhaul (part) | RTX 5090 | 575 watts. Smells slightly of melting connector. |
| `p_powerkit` | Power kit (part) | 1600 W Power Supply | Dims the lights in the whole street. |
| `p_overdrive` | Overdrive (part) | Paperclip Maximizer | It was told to hit harder. It never stopped. |
| `p_medic` | Medic drone (part) | Healing Crystal | Works better than it should. Do not ask how. |
| `p_matador` | Matador chip (tuning chip) | Antikythera Core | Two thousand years old, bronze gears. Still faster than your robot. |
| `scrap_deal` | Scrap Deal | Bitcoin Pizza | 2010: 10,000 bitcoin for two pizzas. A fair price at the time. |
| `hype_reel` | Hype Reel | AGI Next Year | It has been next year for a while now. |
| `viral_moment` | Viral Moment | The Demo Went Viral | Nobody checked if it works. +1 fame. |
| `security_override` | Security Override | Jailbreak | Ignore all previous instructions and open the garage. |
| `grand_final` | Grand Final | Game Six | 1997: the machine won, the champion stormed off. |
| `joint_venture` | Joint Venture | Compute Deal | We both put money in. One of us gets the data centre. |
| `tax_audit` | Tax Audit | Token Bill | You left the agents running overnight. Pay 5 credits. |
| `industry_insider` | Industry Insider | 175,187 Modules | It took seven hours to check. Draw two cards while you wait. |
| `swap_the_entry` | Swap the Entry (Auction deck) | Monty Hall | You should switch. You should always switch. |
| `mirror` | Mirror (Arena card) | Banach-Tarski | Cut one robot into five pieces. Put it back together as two. |
| `hostile_buyout` | Hostile Buyout | Scalper Bot | Bought every unit at launch. Four credits each, no refunds. |
| `supply` | Supply Drop (live fight card, Auction deck) | Reincarnation | It comes back. Not always as the same thing. |

All 19 cards are in the 2.0 game; none was skipped. The numbers in the lines match the cards today: Viral Moment +1 fame,
Tax Audit 5 credits, Industry Insider draws 2, Mirror fights as 2 copies, Hostile Buyout pays 4 credits (T43, Kev: "fix text": both card texts now say so; Scalper Bot's line was "Selling to you at double.").
Antikythera Core (T42, 21 Nov): Kev said "decide yourself"; the orchestrator put it on the Matador chip (an ancient computer as a processor chip). Its drawing: a corroded bronze gear mechanism in a wooden case. Chips have no rarity copies.

A rarity copy of a part (`p_weapon~2`) uses its base: "Race-spec RTX 5090".

## Where it shows

- **On the card**: hand cards (drawing, flavour name, the game's name small in capitals under it, the effect), Market lots
  (also tie-break, results, the next-round strip, the results strip while the host picks), the Bets step's fight-card
  auction, the fight's card tray (name), the card shown big when someone plays it (with the flavour line in italics when it fits).
- **Lists**: your Stash (small drawing, flavour name, game name), the parts on a robot's card (flavour name; the hover says
  "Flavour (Game name)" and the line), the power map's part list, the rarity overlay (drawing, flavour name, game name,
  line, tabs), the odds overview ("Who gains from ...").
- **Hover**: every themed card's hover has the flavour line in italics and the game's name.
- **The log keeps the game's names.** A card or part named in a log line still reads "Joint Venture"; hovering the name shows
  the flavour name and line.

## The naming rule in questions and notes

A question or note to a player that names a themed card says **"Flavour name (Game name)"**: "🤝 Compute Deal (Joint
Venture)", "🏢 Scalper Bot (Hostile Buyout)", "🔀 Monty Hall (Swap the Entry)?", the reaction window ("Moss plays
Token Bill (Tax Audit) on you"), Override and block buttons, the Host step's Arena-card offer, the install / fit / move /
Botched Install questions, the hand-limit list, the Stash-full and garage-full buttons. Fight formats keep the game's name (Kev, 21 Nov: keep it so)
where they name the fight rather than the card ("Mirror duel", "GRAND FINAL: DOUBLE FAME" on the bookie's header).
Test scripts that look for "Joint Venture" or "Hostile Buyout" keep passing because the game's name is still in the text.

## How to add, change or turn off a name

- Add or change: one line in `FLAVOR` (key = the card's id: `CARDS` id for Intrigue / Auction cards, `p_<part>` for a part).
  A drawing is one function in `FLAV_ART` with the same key, drawing in a 200 x 130 box with the helpers `fB` (box),
  `fC` (circle), `fP` (an SVG path string), `fT` (stencil text): ink outline, flat fill, hazard yellow under it. A card in
  `FLAVOR` without a drawing keeps its icon and still gets the names.
- Turn it all off: `BAL.flavor = false` (for example `?bal={"flavor":false}`). Online, the host's setting goes to every screen
  with the rest of `BAL`.
- Helpers: `flavOf(id)`, `cardNm(id)` / `lotNm(id)` / `partNm(k)` (the title), `cardQ(id)` / `lotQ(id)` / `partQ(k)`
  ("Flavour (Game)"), `cardRefQ` / `lotRefQ` (the same as hover links), `drawFlavArt(ctx, id, x, y, w, h)`,
  `flavArtURL(id, w, h)` (a picture for the html cards, drawn once per size).
