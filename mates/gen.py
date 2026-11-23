import html
def bars(rows, maxv, unit='', hi=None, note=None, w_label='7.5em', target=None):
    # rows: (label, value, text) ; hi = set of labels drawn in the accent colour
    out=['<div class="chart" role="img" aria-label="%s">'%html.escape(note or '')]
    for lab,val,txt in rows:
        pct=max(1.5,100*val/maxv)
        cls='bar hi' if hi and lab in hi else 'bar'
        out.append(f'<div class="row" title="{html.escape(lab)}: {html.escape(txt)}"><span class="lab" style="width:{w_label}">{lab}</span><span class="track">'
                   +(f'<i class="tgt" style="left:{100*target/maxv:.1f}%"></i>' if target else '')
                   +f'<span class="{cls}" style="width:{pct:.1f}%"></span></span><span class="val">{txt}</span></div>')
    out.append('</div>')
    return '\n'.join(out)
def dumb(rows):
    out=['<div class="chart" role="img" aria-label="Win rate without and with the part">']
    for name,combo,a,b in rows:
        out.append(f'<div class="drow" title="{html.escape(name)}: {a}% without, {b}% with"><div class="dname"><b>{name}</b><span>{combo}</span></div><div class="dtrack"><span class="dline" style="left:{a}%;width:{b-a}%"></span><span class="dot a" style="left:{a}%"></span><span class="dot b" style="left:{b}%"></span></div><div class="dval">{a}% → <b>{b}%</b></div></div>')
    out.append('</div>'); return '\n'.join(out)
def fig(src,alt,cap):
    return f'<figure><img src="img/{src}.jpg" alt="{html.escape(alt)}" loading="lazy"><figcaption>{cap}</figcaption></figure>'

work=bars([('Mon 16',33,'33'),('Tue 17',98,'98'),('Wed 18',0,'0'),('Thu 19',0,'0'),('Fri 20',48,'48'),('Sat 21',132,'132'),('Sun 22',133,'133')],140,note='Saved changes to the game per day, 16 to 22 November',hi={'Sat 21','Sun 22'},w_label='4.2em')
bookie=bars([('16 Nov',10,'9 to 11'),('21 Nov',31,'26 to 37'),('22 Nov',93,'74 to 112')],120,note='Test fights the bookie finished for a four-robot fight on the host PC',hi={'22 Nov'},w_label='4.2em',target=40)
gyro=bars([('Bookie said',55,'55%'),('Really was',40,'40%'),('Bookie now',42,'42%')],100,note="Gyro's chance against Scavenger: what the bookie said, the truth, and after the fix",hi={'Really was'},w_label='6.2em')
ladder=bars([('Level 1 beats a starter',74,'74%'),('Level 2 beats level 1',70,'70%'),('Level 3 beats level 2',69,'69%'),('Level 4 beats level 3',63,'63%')],100,note='How often a robot beats a robot one level lower',w_label='11em',target=66)
parts=[('Prototype core',22),('Quantum shield',22),('Field hospital',17),('Overdrive',16),('Bodyguard drone',15),('Weapon overhaul',15),('Energy shield',15),('Jammer drone',13),('Reinforced hull',12),('Tow cable',11),('Spotter drone',10),('Booster drone',10),('Pester chip',10),('Laser drone',10),('Wall Bait chip',9),('Sensor scrambler',9),('Medic drone',9),('Armour kit',9),('Waller drone',8),('Pop-up flipper',8),('Gun drone',8),('Matador chip',7),('Mine layer',7),('EMP burst',7),('Power kit',7),('Repair kit',6),('Blocker drone',5)]
partc=bars([(n,v,f'+{v}') for n,v in parts],24,note='Win points each part adds on an average robot against robots a level up',hi={'Prototype core','Quantum shield','Field hospital'},w_label='8.6em')
epics=dumb([('Phantom Hook','Angler + Quantum shield',22,75),('Sea Wall','Whaler + Waller drone',30,70),('Second Wind','Vertigo + Field hospital',48,86),('Heckler','Wrecker + Pester chip',27,65),('Laser Tag','Mauler + Laser drone',16,53),('Bad Dog','Mauler + Pester chip',16,50),('Overclock','Vertigo + Power kit',48,80),('Thwack-a-mole','Thwacker + Mine layer',38,69),('Whiplash','Thwacker + Tow cable',38,69)])
rar=bars([('Standard',62,'62%'),('Tuned',24,'24%'),('Race-spec',10,'10%'),('Works',3,'3%'),('Masterwork',1,'1%')],70,note='Chance of each rarity tier when a part card comes off the deck',hi={'Masterwork'},w_label='6.4em')
rarb=bars([('Tuned',4,'+4'),('Race-spec',8,'+8'),('Works',12,'+12'),('Masterwork',17,'+17')],20,note='Extra win points of a rarer copy over a standard copy of the same part',hi={'Masterwork'},w_label='6.4em')
hostc=bars([('21 Nov game',60,'9 of 15'),('22 Nov, first',42,'5 of 12'),('22 Nov, second',45,'5 of 11')],100,note='Share of rounds Kev hosted in his solo test games against the AI teams',w_label='7.6em')

CSS='''
:root{ /* layout: one narrow column, scrapyard paper, ink rules, steel + rust marks */
 --paper:#F3EEE2; --card:#FBF8F1; --ink:#2B2118; --mute:#5E5446; --rule:#CFC4AE; --steel:#2F6DA8; --rust:#C4521E; --gold:#E3C13F;
 --display:"Big Shoulders Display","Arial Narrow",Impact,sans-serif; --body:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif; --mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
 color-scheme:light }
*{box-sizing:border-box} html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.55 var(--body)}
main{max-width:720px;margin:0 auto;padding:0 18px 56px}
header.top{border-bottom:4px solid var(--ink);padding:28px 0 20px;margin-bottom:8px}
.kick{font:600 13px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--mute)}
h1{font:800 clamp(44px,13vw,84px)/.92 var(--display);letter-spacing:.01em;margin:10px 0 12px;text-wrap:balance}
h1 em{font-style:normal;color:var(--rust)}
.lede{font-size:19px;line-height:1.5;margin:0;max-width:34em}
h2{font:800 clamp(30px,8vw,44px)/1 var(--display);margin:44px 0 6px;padding-top:14px;border-top:4px solid var(--ink);text-wrap:balance}
h3{font:700 19px/1.25 var(--body);margin:26px 0 6px;text-wrap:balance}
p{margin:0 0 14px} ul{margin:0 0 14px;padding-left:1.15em} li{margin:0 0 7px}
a{color:var(--steel)} a:focus-visible,summary:focus-visible{outline:3px solid var(--steel);outline-offset:2px}
.sub{color:var(--mute);margin-bottom:14px}
.tiles{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:22px 0 4px}
.tile{background:var(--card);border:2px solid var(--ink);border-radius:6px;padding:12px 12px 10px}
.tile b{display:block;font:800 clamp(34px,10vw,48px)/1 var(--display);font-variant-numeric:tabular-nums}
.tile span{font-size:14px;line-height:1.3;color:var(--mute);display:block;margin-top:4px}
@media(min-width:620px){.tiles{grid-template-columns:repeat(4,1fr)}}
.said{display:grid;gap:10px;margin:14px 0}
.said>div{background:var(--card);border:2px solid var(--ink);border-radius:6px;padding:12px 14px}
.said q{display:block;font:700 18px/1.3 var(--body);quotes:"“" "”"}
.said p{margin:6px 0 0;font-size:16px}
.said .tag{font:600 12px/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--rust);display:block;margin-bottom:6px}
figure{margin:16px -6px;background:var(--card);border:2px solid var(--ink);border-radius:6px;overflow:hidden}
figure img{display:block;max-width:100%;width:100%;height:auto}
figcaption{font-size:14px;line-height:1.4;color:var(--mute);padding:8px 12px 10px;border-top:2px solid var(--ink)}
.box{background:var(--card);border:2px solid var(--ink);border-radius:6px;padding:14px 14px 12px;margin:14px 0}
.box h3{margin-top:0}
.cap{font-size:14px;line-height:1.4;color:var(--mute);margin:8px 0 0}
.chart{display:grid;gap:7px;margin-top:10px}
.row{display:flex;align-items:center;gap:8px;min-width:0}
.lab{flex:none;font-size:13.5px;line-height:1.2;color:var(--ink)}
.track{position:relative;flex:1;min-width:0;height:18px;border-left:2px solid var(--ink)}
.bar{position:absolute;left:0;top:2px;bottom:2px;background:var(--steel);border-radius:0 4px 4px 0}
.bar.hi{background:var(--rust)}
.tgt{position:absolute;top:-4px;bottom:-4px;width:0;border-left:2px dashed var(--ink);opacity:.75}
.val{flex:none;width:4.6em;font:600 13.5px/1 var(--mono);font-variant-numeric:tabular-nums;text-align:right}
.drow{display:grid;grid-template-columns:1fr;gap:3px;padding:8px 0;border-top:1px solid var(--rule)}
.drow:first-child{border-top:0}
.dname{display:flex;justify-content:space-between;gap:10px;align-items:baseline;flex-wrap:wrap}
.dname b{font:700 16px/1.2 var(--body)} .dname span{font-size:13.5px;color:var(--mute)}
.dtrack{position:relative;height:16px;background:linear-gradient(var(--rule),var(--rule)) center/100% 2px no-repeat}
.dline{position:absolute;top:6px;height:4px;background:var(--ink)}
.dot{position:absolute;top:2px;width:12px;height:12px;border-radius:50%;margin-left:-6px;border:2px solid var(--card)}
.dot.a{background:var(--steel)} .dot.b{background:var(--rust)}
.dval{font:500 13.5px/1 var(--mono);font-variant-numeric:tabular-nums}
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:13.5px;color:var(--mute);margin-top:6px}
.legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:-1px}
.wrong{counter-reset:w;list-style:none;padding:0;margin:14px 0}
.wrong li{counter-increment:w;background:var(--card);border:2px solid var(--ink);border-radius:6px;padding:12px 14px 12px 52px;position:relative;margin-bottom:10px}
.wrong li::before{content:counter(w);position:absolute;left:14px;top:10px;font:800 30px/1 var(--display);color:var(--rust)}
.wrong b{display:block;margin-bottom:3px}
.steps{padding-left:1.3em} .steps li{margin-bottom:9px}
code,.mono{font:500 .92em var(--mono);background:#E9E1CF;padding:1px 5px;border-radius:3px;overflow-wrap:anywhere}
details{background:var(--card);border:2px solid var(--ink);border-radius:6px;padding:10px 14px;margin:14px 0}
summary{cursor:pointer;font-weight:700}
.play{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;margin:20px 0 4px}
.btn{display:inline-flex;align-items:center;gap:10px;min-height:52px;padding:0 22px;background:var(--rust);color:#fff;border:3px solid var(--ink);border-radius:8px;font:800 26px/1 var(--display);letter-spacing:.03em;text-decoration:none;box-shadow:4px 4px 0 var(--ink)}
.btn:hover{background:#A94416}.btn:active{transform:translate(2px,2px);box-shadow:2px 2px 0 var(--ink)}
.btn:focus-visible{outline:3px solid var(--steel);outline-offset:3px}
.btn svg{flex:none}
.play small{font-size:14px;line-height:1.35;color:var(--mute);flex:1 1 12em}
footer{margin-top:44px;padding-top:14px;border-top:4px solid var(--ink);font-size:14px;color:var(--mute)}
@media(prefers-reduced-motion:no-preference){.bar{transition:none}}
'''
H=f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ROBOCUS since Friday the 13th</title>
<meta property="og:type" content="article">
<meta property="og:title" content="ROBOCUS: since Friday the 13th">
<meta property="og:description" content="What changed in the game since our first night, what broke on the way, and what's new: trading floor, garage, rare drops, 9 epic combos.">
<meta property="og:image" content="https://bruyninckx.github.io/ROBOCUP/mates/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://bruyninckx.github.io/ROBOCUP/mates/">
<meta name="twitter:card" content="summary_large_image">
<meta name="description" content="What changed in ROBOCUS since the first playtest, what broke on the way, and what's new.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;600;700&display=swap">
<style>{CSS}</style>
</head>
<body>
<main>
<header class="top">
<div class="kick">ROBOCUS 2.0 · playtest notes · updated 23 Nov 2026</div>
<h1>Since <em>Friday the 13th</em></h1>
<p class="lede">You played the first version on Friday 13 November and told Kev what annoyed you. This is what happened to the game in the ten days after, what broke on the way, and what you will find when we play again.</p>
<div class="play"><a class="btn" href="https://bruyninckx.github.io/ROBOCUP/prototypes/tabletop-2.html"><svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true"><path d="M1 1l16 9-16 9z" fill="#fff"/></svg>PLAY ROBOCUS</a><small>Opens the game. Needs a laptop or desktop with Chrome or Edge; it does not fit a phone.</small></div>
<div class="tiles">
<div class="tile"><b>444</b><span>saved changes to the game, 16 to 22 Nov</span></div>
<div class="tile"><b>66</b><span>jobs on the task board, from one-line fixes to whole new screens</span></div>
<div class="tile"><b>325,000</b><span>test fights run to check balance, most of them on Kev's PC</span></div>
<div class="tile"><b>33</b><span>robots in five levels, all re-tuned</span></div>
</div>
</header>

<div class="box" style="border-width:3px">
<div class="kick" style="color:var(--rust)">Update · Monday 23 Nov, evening</div>
<h3 style="margin-top:8px">Kev played it on two PCs tonight</h3>
<p>Half a game, 29 minutes, four rounds, one PC hosting and one joined, two AI teams filling the table. He saw nothing off, and the logs from both PCs agree:</p>
<ul>
<li><b>All four fights ended the same on both screens.</b> The joined PC checks every fight against the host's.</li>
<li><b>Trading between two people worked</b>, including an offer, a counter-offer and a Yes.</li>
<li><b>The garage worked on both PCs.</b> A part pulled off a broken zone came off broken, as it should.</li>
<li><b>The bookie ran 76 to 177 test fights</b> before each duel.</li>
<li><b>One live card arrived late</b> on the joined PC. It replayed the fight from that moment and still got the same result.</li>
</ul>
<p class="cap">Not tried yet between two PCs: the host reloading mid-game, a player dropping out and coming back, and a 2v2 round.</p>
</div>

<h2>What you said, what changed</h2>
<p class="sub">Your remarks from the first night and the online game after it, as Kev passed them on.</p>
<div class="said">
<div><span class="tag">Friday 13 Nov</span><q>It wasn't clear when I had to click.</q><p>One yellow box top right now says what the game wants from you. Yellow means your move, green means locked in, grey means nothing to do. Under it, a list shows who everyone is waiting for.</p></div>
<div><span class="tag">Friday 13 Nov</span><q>Too much clicking.</q><p>The Market is one step now: you bid and trade at the same time. A part you win goes straight onto a robot. Questions that used to pop up over the board sit in the yellow box.</p></div>
<div><span class="tag">Friday 13 Nov</span><q>The odds weren't right.</q><p>The bookie no longer guesses from a formula. Before each fight the host's PC plays that exact fight up to 200 times and sets the odds from the results. It tells you how many it managed.</p></div>
<div><span class="tag">Online game, 17 to 20 Nov</span><q>Too much waiting.</q><p>Every question that holds up the table counts down: 20 seconds for a simple one, 30 for a list, 45 for a trade. No answer means the safe choice is made for you.</p></div>
<div><span class="tag">Online game, 17 Nov</span><q>The screen flipped when someone else picked a sponsor.</q><p>Sponsors are bid for now, everyone at once, and your screen stays yours.</p></div>
</div>

<h2>What is new</h2>

<h3>The screen</h3>
<ul>
<li><b>Phases slide.</b> The board slides left to right from one phase to the next, so you see the game move on.</li>
<li><b>Your cards are always open</b> under the board.</li>
<li><b>Tips for first-timers.</b> A small box points at something the first time it matters (where the odds are, what the diamonds on a part mean). Click it once and it never comes back.</li>
<li><b>A headline for odd rounds.</b> A 2v2, a free-for-all or the House Robot is announced in yellow before anyone picks a fighter.</li>
</ul>
{fig('tip','A tip box pointing at the bookie line under the bet cards','A first-time tip, here on the bookie. The line under the bet cards says how many test fights the odds rest on.')}

<h3>The Market and the trading floor</h3>
<ul>
<li><b>Trade offers are tickets</b> in a panel under the board. Answer them in any order with Yes, Counter or No while you keep bidding. You see other teams' deals as they happen.</li>
<li><b>Every robot shows its value</b> in credits on a gold chip. Hostile Buyout now costs that value, so stealing a big robot is expensive. Fire Sale pays value plus one.</li>
<li><b>Everyone starts with 10 credits.</b></li>
</ul>
{fig('floor','The trading floor panel under the pit with offer tickets','The trading floor: two offers to you, one of your own waiting, one deal between two other teams.')}

<h3>The garage</h3>
<ul>
<li><b>Move parts between your robots</b> in Upkeep: 1 credit to take a part off, 1 to put it on, double for a legendary. A bill shows the total before you lock it in.</li>
<li><b>A scrapped robot gives its parts back.</b> Parts from a broken zone come back broken and need a repair.</li>
<li><b>Upkeep waits for you.</b> It ends when you press Done, never by itself.</li>
</ul>
{fig('garage','The garage screen in Upkeep with three robots and a bill','The garage. Thwacker with a Mine layer carries the new epic tag Thwack-a-mole; the Armour kit next to it is a poor fit.')}

<h3>The fights</h3>
<ul>
<li><b>Robots wear.</b> Blades bend, shells crack, saws cut grooves, pieces break off. A bend stays on the robot until someone repairs it.</li>
<li><b>Arenas change who wins.</b> Spikes, saws, ice and the cage now favour different robots.</li>
<li><b>The host picks the stand-in.</b> When an invited team drops out, the host chooses who steps in. It used to be whoever sat next at the table.</li>
<li><b>One accident stayed in.</b> A spinning shell that gets knocked off can jam against its own robot and tear it apart in two seconds. It happens about once in 200 fights. Kev saw it, lost a fight to it, and kept it.</li>
</ul>
{fig('robots','All 33 robots drawn from above','All 33 robots, starters top left to the level 4 machines at the bottom. Forklift and Trebuchet only got their forks back in their pictures on 22 Nov.')}

<div class="box">
<h3>How much is a level worth?</h3>
<p class="sub">How often a robot beats one a level lower, as they come, with wear on. The dashed line is the 66% Kev aimed for.</p>
{ladder}
<p class="cap">Measured on 21 Nov, after the re-tune for wear. The low steps are a bit steep; whether to soften them is still open.</p>
</div>

<h3>The bookie and the power map</h3>
<ul>
<li><b>Odds as bands</b> (Favourite, Even, Underdog), never percentages.</li>
<li><b>Click the odds on a Market lot</b> to see what that part or robot would do to every matchup in the game, for each team that could win it.</li>
<li><b>The power map</b> (press M) shows every robot by level and strength. Click one of the robots in the game and every other robot shows its odds against it.</li>
</ul>
{fig('map','The power map with one robot selected and odds labels on the others','The power map with Gyro clicked: every other robot in the game shows its band against it, toughest first in the side panel.')}

<h3>Cards with a story</h3>
<p>Nineteen cards got a real-world name and a drawing, in the same scrapyard ink as the robots. The game's own name stays small underneath. Among them: the <b>IBM 5100</b>, the <b>RTX 5090</b>, the <b>Paperclip Maximizer</b>, the <b>Akashic Record</b>, the <b>Antikythera Core</b> and <b>Riemann, Compiled</b>.</p>


<h2>Rare drops</h2>
<p>Every time a part card comes off the deck, into the Market or out of a crate, it rolls a rarity. Most copies are standard. A few are better versions of the same part, and they are marked with diamonds on the card and a glow that gets stronger with each tier.</p>
<div class="box">
<h3>How often each tier drops</h3>
{rar}
<p class="cap">A Masterwork is one card in a hundred. In a game of about twelve rounds you will see a handful of Tuned and Race-spec copies and maybe one Works.</p>
</div>
<div class="box">
<h3>What a rarer copy is worth</h3>
<p class="sub">Extra win points over a standard copy of the same part, on the same robot.</p>
{rarb}
<p class="cap">Averages from the combo hunt. The game shows it in levels: Tuned adds a quarter level, Race-spec a half, Works three quarters, Masterwork a full level.</p>
</div>
<ul>
<li><b>It makes the part do more of what it does:</b> a drone hits or heals harder, a shield holds more, a stun lasts longer.</li>
<li><b>It matters a lot on some pairs.</b> Mauler with a standard Laser drone wins 48% against robots a level up; with a Masterwork one, 88%. Scythe with a Sensor scrambler goes from 46% to 87%.</li>
<li><b>And not at all on others.</b> Vertigo with a Power kit wins about 83% whatever the tier.</li>
<li><b>The tier stays with the card</b> when it moves between robots or sits in your Stash. A card nobody buys goes back in the deck and rolls again next time.</li>
<li><b>Legendary parts roll too.</b> Tuning chips do not.</li>
<li><b>Click the diamonds</b> on any part to open the rarity ladder: what this copy adds, next to a standard one.</li>
</ul>

<h2>The combo hunt</h2>
<p>On Sunday Kev's PC spent three hours trying every part on every robot, then pairs and full builds, 278,626 fights in all. Anything it called special had to hold up twice on fresh dice.</p>

<div class="box">
<h3>One to look for: Thwack-a-mole</h3>
<figure style="margin:10px 0"><img src="img/epic.jpg" alt="Thwacker's robot card with the tag Epic: Thwack-a-mole"><figcaption>Thwacker's card in the game with a Mine layer fitted. The gold tag is the epic; the red one says the Armour kit next to it is a poor fit.</figcaption></figure>
<p><b>Thwacker</b> is a level 1 robot with a thwack tail. Give it a <b>Mine layer</b> and its win rate against robots a level up goes from 38% to 69%. On most robots a Mine layer adds about 7 points; here it adds 31.</p>
<p>The game tells you when you are close: a Market lot that would complete an epic on one of your robots carries a ribbon, and the robot's card gets the tag once the part is on.</p>
</div>

<div class="box">
<h3>The nine epic combos</h3>
<p class="sub">Win rate against robots a level up, without the part and with it.</p>
<div class="legend"><span><i style="background:var(--steel)"></i>without the part</span><span><i style="background:var(--rust)"></i>with it</span></div>
{epics}
<p class="cap">Six are new and Kev named them. Phantom Hook, Overclock and Whiplash survived from the old list; Iron Bolas dropped to a "great fit".</p>
</div>

<div class="box">
<h3>What a part is worth on an average robot</h3>
<p class="sub">Win points gained against robots a level up.</p>
{partc}
<p class="cap">The three legendaries lead. The Repair kit is near the bottom: wear made it weaker, and what extra to give it is not decided yet.</p>
</div>

<details><summary>Combos that look too strong (left in on purpose for now)</summary>
<ul style="margin-top:10px">
<li>Thwacker with a Race-spec or better Tow cable wins 93 to 98% against robots a level up.</li>
<li>Thwacker with Booster drone, Mine layer and Prototype core wins 98% a level up, and still 56% against fully kitted robots two levels up.</li>
<li>Full builds of Vertigo (99%), Mauler (97%) and Bricklayer (96%) against bare robots a level up.</li>
</ul>
<p>Kev wants to see whether you find them before he touches them.</p></details>

<h2>What went wrong on the way</h2>
<p class="sub">Most of the work was done by AI assistants that Kev steers: one that plans and checks, and workers that each build one thing. It did not go smoothly.</p>
<ol class="wrong">
<li><b>Old and new versions got mixed.</b>Several assistants worked at once, some could not save their work to the shared copy, and one game dealt a robot that had already been removed. Since 16 Nov only one of them may publish, and the game shows a stamp bottom left. If your stamp differs from Kev's, or a red bar shows, you are on old files.</li>
<li><b>The workers kept stopping.</b>The computer they run on restarts every hour or two and takes them down with it. Kev asked more than once why nothing was moving. The fix was dull: save after every step, and check on them every 25 minutes.</li>
<li><b>The bookie was fooling itself.</b>Its helpers ran the test fights without the part tuning, so every drone and module fought at the wrong strength. Kev noticed when his stacked Gyro kept losing to a Scavenger it was meant to beat.
<div class="box" style="margin:10px 0 2px">{gyro}<p class="cap">Gyro's chance in that fight. After the fix the helpers gave the same winner as the real fight on all 126 test dice.</p></div></li>
<li><b>Big fights got no odds at all.</b>A four-robot fight takes so long that the bookie finished too few test fights to trust them and fell back to the formula.
<div class="box" style="margin:10px 0 2px">{bookie}<p class="cap">Test fights finished for a four-robot fight on Kev's PC. The dashed line is the 40 it needs. It now uses 14 helpers and takes 8 seconds for big fights.</p></div></li>
<li><b>A reload by the host killed the game for everyone.</b>Found the day before this was written. The host's page now asks before closing, and offers "Resume the last game" afterwards. It goes back to the start of the round.</li>
<li><b>The start-up file broke itself.</b>The file Kev double-clicks to get the newest game updated itself halfway through running and fell over. It now runs from a copy.</li>
<li><b>The AI teams were pushovers, then too keen.</b>In Kev's first solo test he hosted 9 of 15 rounds. Taught to fight for the host seat, the AI teams now pay 13 or 14 credits for it.
<div class="box" style="margin:10px 0 2px">{hostc}<p class="cap">Rounds Kev hosted in three solo games against the AI teams.</p></div></li>
</ol>

<div class="box">
<h3>When the work happened</h3>
<p class="sub">Saved changes to the game per day.</p>
{work}
<p class="cap">Two quiet days midweek, then the weekend. Sunday alone brought the trading floor, the combo hunt, the bookie fix and the tips.</p>
</div>

<h2>Before we play</h2>
<p>For game night, use the invite link Kev sends: it puts you straight in his room. The button opens the game on its own, where you can try a round against the AI teams first.</p>
<div class="play"><a class="btn" href="https://bruyninckx.github.io/ROBOCUP/prototypes/tabletop-2.html"><svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true"><path d="M1 1l16 9-16 9z" fill="#fff"/></svg>PLAY ROBOCUS</a><small>Opens the game. Needs a laptop or desktop with Chrome or Edge; it does not fit a phone.</small></div>
<ol class="steps">
<li><b>Use a laptop or desktop</b> with Chrome or Edge. The game needs a screen at least 1280 wide; it does not work on a phone. This page does.</li>
<li><b>Open the link Kev sends</b>, type a name, click Join, then "I'm ready".</li>
<li><b>Check the stamp</b> bottom left matches Kev's. Today it reads <span class="mono">files 41c0103e</span>. A red bar at the top means old files: press Ctrl+F5.</li>
<li><b>If you drop out</b>, open the link again with the same name. You get your seat back.</li>
<li><b>If something looks wrong</b>, click the report button in the log and type one line. It marks the moment for Kev.</li>
</ol>

<h3>Still rough</h3>
<ul>
<li>Kev has played half a game between two PCs. Four people on four networks is still new: you are that test.</li>
<li>Kev's PC is the game. If it goes down, everyone waits about ten seconds, then he resumes from the start of the round.</li>
<li>On a small screen, long questions in the yellow box are cut off at the bottom. The buttons still work.</li>
<li>If you join before Kev has opened the room, the message you get is misleading. Wait a few seconds and try again.</li>
</ul>

<footer>Game build 2026-11-22l · files 41c0103e · numbers from the project's own test runs and Kev's playtest logs of 21 and 22 Nov.</footer>
</main>
</body>
</html>
'''
open('index.html','w',encoding='utf-8').write(H)
print(len(H))
