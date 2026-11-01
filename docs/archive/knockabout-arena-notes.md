# Knockabout arena prototype: notes (v1)

> Archived: this grid + card arena direction was replaced by the free-flowing auto-battle arena (see `../multiplayer-strategy-game-concept.md`, decision log v0.2). Kept for reference; some specials/traits may be reusable as cards.

Playable build: https://claude.ai/artifact/7oBRVnKWHiiLPzzJz4bh1P (single HTML; read it with the Artifact tool to continue). Source split during dev into engine.js (pure rules), bot.js (Monte Carlo planner), app.js (UI) + shell.html.
This is the arena mini-game for the bigger 4-player strategy game (see multiplayer-strategy-game-concept.md). Theme: neutral for now.

## Flow
Menu (vs bot easy/normal/hard, or hot-seat with pass-the-device curtain) → each player picks 1 of 3 traits → draft: two packs of 7 specials, pick 1 and pass, 5 picks each, 4 discarded; decks are public → fight.

## Fight rules
- 7x7 board, spawns (1,3) and (5,3). 8 HP (Vampire 7). 6 volleys of 3 steps.
- Each volley both players secretly lock 3 cards (+ direction for aimed cards). Within a step, lower speed first; tie goes to the initiative holder, which swaps every step.
- Basics are always in hand: Step 3, Strike 5 (2 dmg), Shove 6 (push 2), Guard 1 (blocks attack damage, pushes cut to 1).
- Specials: once per fight each.
- Tiles: pit/void (fall: 3 dmg, out for rest of the volley, respawn at end), spikes (2 on entry), pillar (1 when slammed), cracked (becomes pit after you step off), slick (slide 1 more).
- Shrinking: warn after volley 2, outer ring collapses after volley 3; warn after 4, ring 2 collapses after 5. Volley 6 is on 3x3.
- Win: KO, else more HP after volley 6, else closer to centre, else sudden-death volleys (max 8).

## 27 specials
Move: Dash (2), Leap (3), Rewind (9).
Attack: Hook (4), Haymaker (8, 4 dmg), Spear (5), Whirlwind (6), Launch (5, hurl 3 through air), Shockwave (6, push 2 radius 2), Wild Swing (5, d6 roll), Leech Bite (4).
Trick: Swap (4), Net (2, no moving rest of volley), Counter (1, deal 3 back), Mimic (copy opponent's card), Iron Skin (1), Dizzy Dust (2, reverse their directions), Taunt (2, their moves come at you), Phase (1), Overclock (1, next card twice), Second Wind (7, heal 3), Quickdraw (1, next card at speed 0).
Terrain: Bomb (7, blows end of volley), Wall (3), Trapdoor (4, tile 2 ahead becomes pit), Grease (3, 3 slick tiles), Earthquake (8, cracked collapse + random shove).

## Traits (pick 1 of 3)
Heavyweight, Brawler, Spiky, Sprinter, Lucky, Vampire, Mind Reader (see opponent's first card; they plan first), Bulwark, Hoarder (+1 random special).

## Maps
Sinkhole, Spike Garden, Colonnade, Broken Bridge, Ice Rink (all 180° symmetric).

## Headless test results (bot vs bot, normal)
~45% KO, rest on time; ~5.5 volleys avg; ~1.4 falls per fight; hard beats easy ~70%. No seat bias found.

## Ideas / next
Online play (room code), crowd cards + betting for the 2 non-fighters, theme pass, more maps, balance after real play sessions, tie into the strategy map.
