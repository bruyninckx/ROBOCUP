// T47 (Kev's choices on the voting page, 21 Nov): eight rules and clicks. Solo, one screen, at 1600x900 and 1280x720:
//   1. Crunch Week: a person ticks crew, Security Bots and robots (crew and bots ticked to start, robots not); ticking a robot
//      exhausts it; no answer in time = the crew and bots it opened with, no robots, with a ⌛ line;
//   2. the Market deck holds 2 Repair kits;
//   3. Bookie's Friend / Hedge Bet after the bets went through: refused with a line, the card stays in the hand;
//   4. a trade panel still open when you lock (the last lock): the panel closes, "The Market closed" line, the lots go out at once;
//   5. invited to fight: the note counts down (30 s, bar and seconds); no answer = the strongest ready robot, with a ⌛ line;
//   6. a won part with 2 robots that can take it: the note asks first (20 s); a pick fits it there; no answer = the best-odds robot,
//      then Undo / Move; one robot with room: on at once with Undo; BAL.autoFit true: the old fit at once;
//   7. (an unlock line for the others: needs two people, online below);
//   8. a trade between two other teams: a banner over the pit (not over the note), about 4 s, two in a row queue; none for your own.
// Online (host + 3 joined, local transport, the bots frozen at round 1's Intrigue), the joined screens pressing the real buttons:
//   8. B gives A 1 Cr through B's deal panel, A accepts: a banner on H and C, none on A and B;
//   7. A locks, then changes a bid: C's and H's logs say "… changed a bid and is deciding again." (no amount);
//   4. B opens a trade with A and locks it in (A's note asks), then B locks its bids last: A's question closes, both get the
//      "Market closed" line, nothing moved, the lots go out at once;
//   5. a joined player invited to fight sees the count in its note; the host lets it run out: its strongest ready robot goes, ⌛ line;
//   3. bets: the joined player locks; Bookie's Friend and Hedge Bet are still in its note; playing them keeps the lock; after the
//      step a Hedge Bet is refused with a line.
//   node tools/mp-scenario/vote-rules.js [screenshotFolder] [solo|online|both]
const path = require('path'), fs = require('fs');
const shots = process.argv[2] && process.argv[2] !== '-' ? process.argv[2] : null, which = process.argv[3] || 'both';
if (shots) fs.mkdirSync(shots, { recursive: true });
const bad = [], errs = [];
const ok = (c, msg) => { if (!c) bad.push(msg); };
const until = async (p, f, ms = 20000, arg) => { for (let t = 0; t < ms; t += 150) { if (await p.evaluate(f, arg)) return true; await p.waitForTimeout(150); } return false; };
const noteTxt = p => p.evaluate(() => document.getElementById('promptBar').innerText.replace(/\s+/g, ' ').trim());
const logHas = (p, re) => p.evaluate(src => { const el = document.getElementById('logPanel'); return !!el && new RegExp(src).test(el.innerText); }, re.source);
const noteCut = p => p.evaluate(() => { const el = document.getElementById('promptBar'), r = el.getBoundingClientRect();
  return [...el.querySelectorAll('button')].filter(x => { const q = x.getBoundingClientRect(); return q.width && (q.bottom > r.bottom + 1 || q.right > r.right + 1); }).map(x => x.textContent.trim()); });

async function solo(b, w, h) {
  const tag = w + 'x' + h, PLK = require('../planck-local.js'), PL = PLK.find();
  const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', e => errs.push(tag + ': ' + e.message));
  await PLK.route(p, PL);
  await p.goto(require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href + '?seed=11'); await p.waitForTimeout(800);
  await p.evaluate(() => { window.__noSlide = true; window.__noAuto = true; });
  await p.click('#pAct2'); await p.waitForTimeout(1500); await p.mouse.move(5, 5);
  const shot = n => shots ? p.screenshot({ path: path.join(shots, tag + '-' + n) }) : null;
  const setTeam = (ti, bots, crew, sec) => p.evaluate(([ti, bots, crew, sec]) => {
    const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[ti], base = JSON.parse(JSON.stringify(G.teams[0].robots[0] || G.teams[ti].robots[0]));
    t.robots = bots.map(([name, level], k) => { const r = JSON.parse(JSON.stringify(base)); r.id = 'T47-' + ti + '-' + k + '-' + Math.random().toString(36).slice(2, 6); r.name = name; r.level = level; r.wins = 0; r.wear = null; r.parts = []; r.exhausted = false; r.sitOut = 0; delete r.exWhy; delete r.exBy; delete r.leg; delete r.rar; return r; });
    t.crew = Array.from({ length: crew }, (_, k) => ({ uid: 9100 + ti * 10 + k, kind: k ? 'chief' : 'mechanic' })); t.exMechs = 0; t.secBots = sec; t.exSec = 0; t.credits = 3; t.fame = 3;
    D.updateHud(); }, [ti, bots, crew, sec]);
  const team = ti => p.evaluate(ti => { const t = window.ROBOCUS_DEBUG.G.teams[ti]; return { cr: t.credits, exMechs: t.exMechs || 0, exSec: t.exSec || 0, robots: t.robots.map(r => ({ name: r.name, ex: !!r.exhausted, parts: (r.parts || []).slice() })), stash: (t.stash || []).slice(), hand: t.hand.slice() }; }, ti);
  const playCard = (fi, card, ti) => p.evaluate(([fi, card, ti]) => { const D = window.ROBOCUS_DEBUG, G = D.G, id = Object.keys(D.CARDS).find(k => D.CARDS[k].name === card);
    window.__done = false; D.resolveScheme(G.teams[fi], id, G.teams[ti]).then(() => { window.__done = true; D.updateHud(); }); }, [fi, card, ti]);
  const clickIn = async (sel, re) => { for (let t = 0; t < 3000; t += 150) { const r = await p.evaluate(([sel, src]) => { const bt = [...document.querySelectorAll(sel)].find(x => new RegExp(src).test(x.textContent.trim()) && x.offsetParent);
      if (!bt) return 'none'; if (bt.disabled || bt.classList.contains('arming')) return 'wait'; bt.click(); return 'ok'; }, [sel, re.source]); if (r === 'ok') return true; await p.waitForTimeout(150); } bad.push(tag + ': no button ' + re + ' in ' + sel); return false; };
  await p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; G.round = 6; G.phase = 'intrigue'; G.intrigueTurn = 1; G.teams.forEach(t => { t.hand = []; }); });

  // 1. Crunch Week: ticks
  await setTeam(0, [['Wrecker', 0], ['Angler', 2]], 2, 1);
  await playCard(0, 'Crunch Week', 0);
  await until(p, () => { const m = document.getElementById('ivModal'); return m && !m.hidden && /Crunch Week/.test(m.innerText); }, 5000);
  const boxes = await p.evaluate(() => [...document.querySelectorAll('#ivModal input[type=checkbox]')].map(x => x.parentElement.innerText.trim() + (x.checked ? ' [x]' : ' [ ]')));
  console.log(tag + ' 1 Crunch Week ticks: ' + boxes.join(' · '));
  ok(boxes.length === 5 && boxes.filter(x => /crew\) \[x\]/.test(x)).length === 2 && boxes.filter(x => /Security Bot \[x\]/.test(x)).length === 1 && boxes.filter(x => /robot\) \[ \]/.test(x)).length === 2, tag + ' 1: ticks ' + boxes);
  await shot('1-crunch-week-ticks.png');
  // untick one crew member, tick Angler
  await p.evaluate(() => { const xs = [...document.querySelectorAll('#ivModal input[type=checkbox]')]; xs[0].checked = false; xs.find(x => /Angler/.test(x.parentElement.innerText)).checked = true; });
  await clickIn('#ivModal button', /Exhaust the ticked/); await until(p, () => window.__done, 6000);
  let s = await team(0); console.log('  ticked (1 crew, 1 bot, Angler): ' + JSON.stringify(s));
  ok(s.cr === 3 + 3 && s.exMechs === 1 && s.exSec === 1 && s.robots[1].ex && !s.robots[0].ex, tag + ' 1: ticked ' + JSON.stringify(s));
  // no answer in time: the ticks it opened with
  await setTeam(0, [['Wrecker', 0], ['Angler', 2]], 2, 1);
  await p.evaluate(() => { window.ROBOCUS_DEBUG.BAL.askBoxMs = 2500; });
  await playCard(0, 'Crunch Week', 0); await until(p, () => window.__done, 12000);
  await p.evaluate(() => { window.ROBOCUS_DEBUG.BAL.askBoxMs = 30000; });
  s = await team(0); const late1 = await logHas(p, /No answer in time<\/b>|No answer in time \(💼 Crunch Week\): your 2 crew and 1 Security Bot went/);
  console.log('  no answer: ' + JSON.stringify(s) + ' ⌛ ' + late1);
  ok(s.cr === 3 + 3 && s.exMechs === 2 && s.exSec === 1 && !s.robots.some(r => r.ex) && late1, tag + ' 1: time-out ' + JSON.stringify(s) + ' line ' + late1);

  // 2. Repair kits in the Market deck
  const rk = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, d = D.lotDeck(); return { repair: d.filter(x => x === 'p_repair').length, n: d.length }; });
  console.log(tag + ' 2 lot deck: ' + JSON.stringify(rk)); ok(rk.repair === 2, tag + ' 2: Repair kits ' + rk.repair);

  // 8. a trade between two AI teams: a banner; your own: none; two in a row
  await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; D.tradeDone(G.teams[1], G.teams[2], '🤝 ' + G.teams[1].name + ' buys Energy shield from ' + G.teams[2].name + ' for 3 Cr.', G.teams[1].col);
    D.tradeDone(G.teams[0], G.teams[3], '🤝 Trade: you and them (should show no banner here).', G.teams[0].col);
    D.tradeDone(G.teams[3], G.teams[1], '🤝 ' + G.teams[3].name + ' sells its robot <b>Pincher</b> to ' + G.teams[1].name + ' for 4 Cr.', G.teams[3].col); D.updateHud(); });
  await p.waitForTimeout(700);
  const ban = () => p.evaluate(() => { const el = document.getElementById('tradeBan'), pb = document.getElementById('promptBar'); if (!el || !el.classList.contains('on')) return null;
    const a = el.getBoundingClientRect(), n = pb.getBoundingClientRect(); return { text: el.innerText.replace(/\s+/g, ' '), overNote: a.right > n.left && a.left < n.right && a.bottom > n.top && a.top < n.bottom }; });
  const b1 = await ban(); console.log(tag + ' 8 banner 1: ' + JSON.stringify(b1)); await shot('8-trade-banner.png');
  ok(b1 && /Rust Rivets.*traded with.*Moss Gears|traded with/.test(b1.text) && /Energy shield/.test(b1.text) && !b1.overNote, tag + ' 8: first banner ' + JSON.stringify(b1));
  await p.waitForTimeout(4400); const b2 = await ban(); console.log('  banner 2: ' + JSON.stringify(b2));
  ok(b2 && /Pincher/.test(b2.text) && !/should show no banner/.test(b2.text), tag + ' 8: second banner ' + JSON.stringify(b2));
  await p.waitForTimeout(4600); ok(!(await ban()), tag + ' 8: a banner stayed (or your own trade showed one)');
  ok(await logHas(p, /buys Energy shield from/), tag + ' 8: the log line is gone');

  // 6. a won part, two robots that can take it: the note asks first
  await setTeam(0, [['Wrecker', 1], ['Angler', 2]], 1, 0);
  const win = () => p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; G.phase = 'market'; G.marketStage = 'lots'; G.marketResolved = true; G.marketAuction = null; G.ps[0].install = []; G.ps[0].fitUndo = [];
    const A = { wins: [{ team: 0, lot: 'p_shield', idx: 0, price: 3 }], results: [{ lot: 'p_shield', winner: 0, price: 3 }] }; G.marketResults = A.results; D.applyMarketWins(A); D.updateHud(); });
  await win(); await p.waitForTimeout(600);
  let n = await noteTxt(p); console.log(tag + ' 6 which robot: ' + n);
  ok(/which robot gets it/.test(n) && /\d+ s/.test(n) && /Keep in Stash/.test(n) && /Wrecker/.test(n) && /Angler/.test(n), tag + ' 6: the note does not ask first: ' + n);
  ok(!(await noteCut(p)).length, tag + ' 6: buttons cut off: ' + (await noteCut(p)));
  await shot('6-which-robot.png');
  await clickIn('#promptBar [data-fit]', /Wrecker/); await p.waitForTimeout(800);
  s = await team(0); console.log('  picked Wrecker: ' + JSON.stringify(s.robots.map(r => [r.name, r.parts])));
  ok(s.robots[0].parts.includes('shield') && !s.robots[1].parts.includes('shield'), tag + ' 6: pick ' + JSON.stringify(s.robots));
  // no answer: the best-odds robot, then Undo / Move
  await setTeam(0, [['Wrecker', 1], ['Angler', 2]], 1, 0); await win(); await p.waitForTimeout(500);
  const best = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG; return D.bestFit(D.G.teams[0], 'p_shield').name; });
  await p.evaluate(() => { const c = window.ROBOCUS_DEBUG.SEATC[0]; if (c) c.t0 -= 18500; });
  await until(p, () => !(window.ROBOCUS_DEBUG.G.ps[0].install || []).length, 5000); await p.waitForTimeout(400);
  s = await team(0); n = await noteTxt(p);
  const late6 = await logHas(p, /No answer in time.*which robot gets/);
  console.log('  no answer: on ' + JSON.stringify(s.robots.map(r => [r.name, r.parts])) + ' (best ' + best + ') · note ' + n + ' · ⌛ ' + late6);
  ok(s.robots.find(r => r.name === best).parts.includes('shield') && /Undo/.test(n) && late6, tag + ' 6: time-out ' + JSON.stringify(s.robots) + ' ' + n);
  // one robot with room: on at once with Undo
  await setTeam(0, [['Wrecker', 1]], 1, 0); await win(); await p.waitForTimeout(500); n = await noteTxt(p); s = await team(0);
  console.log('  one robot: ' + JSON.stringify(s.robots.map(r => r.parts)) + ' · ' + n);
  ok(s.robots[0].parts.includes('shield') && /Undo/.test(n), tag + ' 6: one robot ' + n);
  // BAL.autoFit true: the T12 fit at once
  await p.evaluate(() => { window.ROBOCUS_DEBUG.BAL.autoFit = true; }); await setTeam(0, [['Wrecker', 1], ['Angler', 2]], 1, 0); await win(); await p.waitForTimeout(500);
  n = await noteTxt(p); console.log('  autoFit true: ' + n); ok(/fitted on/.test(n) && /Undo/.test(n), tag + ' 6: autoFit true ' + n);
  await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; D.BAL.autoFit = 'ask'; G.ps[0].fitUndo = []; G.ps[0].install = []; });

  // 5. invited to fight: the count in the note; no answer = the strongest ready robot
  await setTeam(0, [['Wrecker', 0], ['Hydra', 3], ['Angler', 2]], 1, 0);
  await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; G.phase = 'arena'; G.marketResolved = false; G.host = 2; G.fight = null; G.hostStep = null; G.chooseMyBot = false; G.pickTeams = [0, 1]; window.__bookieFull = false;
    G.teams.forEach(t => { t.robots.forEach(r => { r.exhausted = false; }); }); D.runAct(2, 'invite', []); D.updateHud(); });
  await until(p, () => !!window.ROBOCUS_DEBUG.G.ps[0].choose, 5000); await p.waitForTimeout(700);
  n = await noteTxt(p); console.log(tag + ' 5 send: ' + n);
  ok(/Invited to Fight/.test(n) && /(29|30|28) s/.test(n) && !!(await p.$('#promptBar .st-clock .rx-bar')), tag + ' 5: no count in the note: ' + n);
  ok(!(await noteCut(p)).length, tag + ' 5: buttons cut off: ' + (await noteCut(p)));
  await shot('5-send-timer.png');
  const strongest = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, t = D.G.teams[0]; return t.robots.filter(r => !r.exhausted).sort((a, b) => D.str2(b) - D.str2(a))[0].name; }).catch(() => 'Hydra');
  await p.evaluate(() => { const c = window.ROBOCUS_DEBUG.SEATC[0]; if (c) c.t0 -= 29000; });
  await until(p, () => !window.ROBOCUS_DEBUG.G.ps[0].choose, 5000);
  const sent = await p.evaluate(() => { const F = window.ROBOCUS_DEBUG.G.fight; return F ? (F.robots[F.teams.indexOf(0)] || {}).name : null; });
  const late5 = await logHas(p, /No answer in time.*send a robot.*your strongest ready robot/);
  console.log('  no answer: sent ' + sent + ' (strongest ' + strongest + ') ⌛ ' + late5);
  ok(sent === 'Hydra' && late5, tag + ' 5: time-out sent ' + sent + ' line ' + late5);

  // 3. after the bets went through: Bookie's Friend / Hedge Bet refused with a line, the cards stay
  await until(p, () => { const G = window.ROBOCUS_DEBUG.G; return G.phase === 'bets' || G.phase === 'fight'; }, 30000);
  await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams[0].hand = ['hedge_bet', 'bookie_s_friend']; G.teams[0].fame = 6; D.updateHud(); });
  n = await noteTxt(p); console.log(tag + ' 3 bets note: ' + n.slice(0, 200));
  ok(/Hedge Bet/.test(n) && /Bookie/.test(n), tag + ' 3: the card buttons are not in the bets note');
  await p.evaluate(() => { window.ROBOCUS_DEBUG.act('lockBets'); });   // solo: the last lock, the bets go through
  await until(p, () => window.ROBOCUS_DEBUG.G.betsLocked || window.ROBOCUS_DEBUG.G.phase !== 'bets', 8000);
  await p.evaluate(() => { const D = window.ROBOCUS_DEBUG; D.act('hedgeBet'); D.act('bookiesFriend'); });
  await p.waitForTimeout(400); s = await team(0);
  const late3 = (await logHas(p, /Too late: the bets already went through, so Hedge Bet was not played/)) && (await logHas(p, /so Bookie's Friend was not played/));
  console.log('  after the bets: hand ' + s.hand + ' · lines ' + late3);
  ok(s.hand.includes('hedge_bet') && s.hand.includes('bookie_s_friend') && late3, tag + ' 3: late play ' + s.hand + ' ' + late3);
  await p.evaluate(() => { const v = document.getElementById('fightView'); if (v && !v.hidden) { const s = v.querySelector('.fv-skip:not([hidden])'); if (s) s.click(); } });
  await p.waitForTimeout(500);

  // 4. a trade panel open at the last lock: it closes, a line, the lots go out at once
  await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; const v = document.getElementById('fightView'); if (v) v.hidden = true;
    G.fight = null; G.phase = 'market'; G.marketAuction = null; G.marketResolved = false; G.marketResults = null; G.gather = null; G.teams.forEach(t => { t.credits = 10; t.stash = []; });
    G.ps.forEach(P => { P.bids = [0, 0, 0, 0, 0]; P.install = []; P.fitUndo = []; }); G.marketStage = 'lots'; G.mDeals = {}; D.updateHud(); });
  ok(await p.evaluate(() => window.ROBOCUS_DEBUG.mktOpen()), tag + ' 4: the Market is not open');
  await p.evaluate(() => window.ROBOCUS_DEBUG.act('trade', 1));
  ok(await until(p, () => { const d = document.getElementById('dealModal'); return d && !d.hidden; }, 5000), tag + ' 4: no deal panel');
  await p.evaluate(() => { const bt = document.querySelector('#dealModal [data-cr="give"][data-d="1"]'); if (bt) bt.click(); });
  const deals0 = await p.evaluate(() => JSON.stringify(window.ROBOCUS_DEBUG.G.mDeals));
  await p.evaluate(() => window.ROBOCUS_DEBUG.act('lockBids'));
  await until(p, () => !window.ROBOCUS_DEBUG.mktOpen(), 5000); await p.waitForTimeout(600);
  const st4 = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, d = document.getElementById('dealModal'); return { open: D.mktOpen(), panel: !!d && !d.hidden, deals: G.mDeals, mktd: D.MKTD, cr: G.teams.map(t => t.credits), resolved: !!(G.marketResolved || G.marketAuction) }; });
  const shut4 = await logHas(p, /The Market closed.*called off\. No deal, nothing moved/);
  console.log(tag + ' 4 lock with the panel open (deals before ' + deals0 + '): ' + JSON.stringify(st4) + ' line ' + shut4);
  ok(!st4.open && !st4.panel && st4.resolved && !st4.mktd && st4.cr[0] === 10 && st4.cr[1] === 10 && shut4, tag + ' 4: ' + JSON.stringify(st4) + ' ' + shut4);
  await p.close();
}

async function online() {
  const { setup, press } = require('./lib.js');
  const seed = 7;
  const { b, host, errs: e2, seatOf, all } = await setup(seed, () => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; return !!(G && G.phase === 'intrigue' && G.round >= 1 && G.intrigueTurn >= 0 && !G.ivBusy); });
  const H = seatOf[0], A = seatOf[1], B = seatOf[2], C = seatOf[3];
  const actOn = (p, name, ...args) => p.evaluate(([n, a]) => window.ROBOCUS_DEBUG.act(n, ...a), [name, args]);
  const hs = () => host.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; return { phase: G.phase, open: D.mktOpen(), cr: G.teams.map(t => t.credits), locked: G.gather && G.gather.key === 'lots:' + G.round ? Object.keys(G.gather.done).map(Number) : [], deals: Object.assign({}, G.mDeals || {}), mktd: D.MKTD }; });
  const lockOn = async p => { for (let t = 0; t < 4000; t += 200) { if (await p.evaluate(() => { const bt = document.querySelector('#promptBar #pAct1'); if (!bt || bt.disabled || !/Lock Bids/.test(bt.textContent)) return false; bt.click(); return true; })) return true; await p.waitForTimeout(200); } return false; };
  const banOn = p => p.evaluate(() => { const el = document.getElementById('tradeBan'); return el && el.classList.contains('on') ? el.innerText.replace(/\s+/g, ' ') : null; });
  const refuseAll = async () => { for (const p of all) await p.evaluate(() => { const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]')].find(x => /Refuse|OK|Pass|Let it/.test(x.textContent)); if (bt && !bt.disabled) bt.click(); }); };
  await host.evaluate(() => { window.ROBOCUS_DEBUG.G.teams.forEach(t => { t.hand = []; }); });
  for (let k = 0; k < 40 && !(await hs()).open; k++) {
    const g = await host.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; return { ph: G.phase, turn: G.intrigueTurn }; });
    if (g.ph === 'intrigue' && g.turn >= 0) await actOn(seatOf[g.turn], 'endTurn');
    await refuseAll(); await host.waitForTimeout(500);
  }
  if (!(await hs()).open) { bad.push('online: never reached the Market'); await b.close(); return e2; }
  for (let k = 0; k < 6; k++) { await refuseAll(); await host.waitForTimeout(500); }
  await host.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams.forEach(t => { t.credits = 10; t.stash = []; }); G.ps.forEach(P => { P.bids = [0, 0, 0, 0, 0]; }); G.gather = null; G.mDeals = {}; D.updateHud(); });
  await host.waitForTimeout(1200);
  // 8. B gives A 1 Cr, A accepts: a banner on H and C only
  await actOn(A, 'bid', 0, 'plus'); await actOn(B, 'bid', 1, 'plus');
  if (!await lockOn(H)) bad.push('online: no Lock on H'); if (!await lockOn(C)) bad.push('online: no Lock on C');
  await B.evaluate(() => { const bt = document.querySelector('#promptBar [data-trade="1"]'); if (bt) bt.click(); });
  if (!await until(B, () => { const d = document.getElementById('dealModal'); return d && !d.hidden; }, 8000)) bad.push('online 8: no deal panel on B');
  await B.evaluate(() => { const bt = document.querySelector('#dealModal [data-cr="give"][data-d="1"]'); if (bt) bt.click(); });
  await B.evaluate(() => { const bt = document.querySelector('#dealModal [data-k="lock"]'); if (bt) bt.click(); });
  if (!await until(A, () => document.getElementById('promptBar').classList.contains('qmode'), 8000)) bad.push('online 8: A got no offer');
  await press(A, 'ivModal', /Accept/);
  await until(host, () => window.ROBOCUS_DEBUG.G.teams[1].credits === 11, 8000); await host.waitForTimeout(900);
  const bans = await Promise.all([H, A, B, C].map(banOn));
  console.log('online 8 banners H/A/B/C: ' + JSON.stringify(bans));
  ok(bans[0] && bans[3] && /traded with/.test(bans[3]) && /1 Cr/.test(bans[3]) && !bans[1] && !bans[2], 'online 8: banners ' + JSON.stringify(bans));
  if (shots) { await C.setViewportSize({ width: 1600, height: 900 }); await C.waitForTimeout(300); await C.screenshot({ path: path.join(shots, 'online-C-8-trade-banner-1600x900.png') }); }
  // 7. A locks, then changes a bid: C's log says so (no amount)
  await host.waitForTimeout(4500);
  if (!await lockOn(A)) bad.push('online 7: A could not lock'); await host.waitForTimeout(800);
  await actOn(A, 'bid', 0, 'plus'); await host.waitForTimeout(1500);
  const aName = await host.evaluate(() => window.ROBOCUS_DEBUG.G.teams[1].name);
  const re7 = new RegExp(aName + ' changed a bid and is deciding again');
  const l7 = [await logHas(C, re7), await logHas(H, re7), await logHas(A, re7)];
  console.log('online 7 unlock line on C / H / A(self): ' + l7.join(' / '));
  ok(l7[0] && l7[1] && !l7[2], 'online 7: unlock lines ' + l7);
  if (shots) { await C.screenshot({ path: path.join(shots, 'online-C-7-unlock-line-1600x900.png') }); await C.setViewportSize({ width: 1280, height: 720 }); await C.waitForTimeout(400); await C.screenshot({ path: path.join(shots, 'online-C-7-unlock-line-1280x720.png') }); }
  if (!await lockOn(A)) bad.push('online 7: A could not lock again');
  // 4. B opens a trade with A and locks it in; B locks its bids last: A's question closes, lines, the lots go out
  await host.waitForTimeout(800);
  await B.evaluate(() => { const bt = document.querySelector('#promptBar [data-trade="1"]'); if (bt) bt.click(); });
  if (!await until(B, () => { const d = document.getElementById('dealModal'); return d && !d.hidden; }, 8000)) bad.push('online 4: no deal panel on B');
  await B.evaluate(() => { const bt = document.querySelector('#dealModal [data-cr="give"][data-d="1"]'); if (bt) bt.click(); });
  await B.evaluate(() => { const bt = document.querySelector('#dealModal [data-k="lock"]'); if (bt) bt.click(); });
  if (!await until(A, () => document.getElementById('promptBar').classList.contains('qmode'), 8000)) bad.push('online 4: A got no offer');
  const before4 = await hs();
  if (!await lockOn(B)) bad.push('online 4: no Lock on B');
  await until(host, () => !window.ROBOCUS_DEBUG.mktOpen(), 8000); await host.waitForTimeout(1500);
  const after4 = await hs(), qA = await A.evaluate(() => document.getElementById('promptBar').classList.contains('qmode') && /Trade offer/.test(document.getElementById('promptBar').innerText));
  const l4 = [await logHas(A, /The Market closed.*called off/), await logHas(B, /The Market closed.*called off/)];
  console.log('online 4 last lock with A\'s question open: before ' + JSON.stringify(before4) + '\n   after ' + JSON.stringify(after4) + ' · A still asked: ' + qA + ' · lines A/B ' + l4);
  ok(!after4.open && !qA && !after4.mktd && l4[0] && l4[1], 'online 4: ' + JSON.stringify(after4) + ' asked ' + qA + ' lines ' + l4);
  // 5. a joined player invited: the count; the host lets it run out
  for (const p of all) await p.evaluate(() => { window.__noBot = false; });
  const inv = await until(host, () => { const G = window.ROBOCUS_DEBUG.G; return G.phase === 'arena' && G.chooseMyBot && [1, 2, 3].some(s => G.ps[s] && G.ps[s].choose); }, 240000);
  for (const p of all) await p.evaluate(() => { window.__noBot = true; });
  if (!inv) bad.push('online 5: no joined player was invited');
  else {
    const s5 = await host.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; return [1, 2, 3].find(s => G.ps[s].choose); });
    const P5 = seatOf[s5]; await P5.waitForTimeout(1200);
    const n5 = await noteTxt(P5), clk = !!(await P5.$('#promptBar .st-clock .rx-bar'));
    console.log('online 5 seat ' + s5 + ' note: ' + n5.slice(0, 160) + ' · clock ' + clk);
    ok(clk && /\d+ s/.test(n5), 'online 5: no count on the joined screen: ' + n5);
    if (shots) { await P5.setViewportSize({ width: 1280, height: 720 }); await P5.waitForTimeout(400); await P5.screenshot({ path: path.join(shots, 'online-5-send-timer-1280x720.png') }); }
    const want = await host.evaluate(s => { const D = window.ROBOCUS_DEBUG, t = D.G.teams[s]; return t.robots.filter(r => !r.exhausted).map(r => r.name); }, s5);
    await host.evaluate(s => { const c = window.ROBOCUS_DEBUG.SEATC[s]; if (c) c.t0 -= 29000; }, s5);
    await until(host, s => !window.ROBOCUS_DEBUG.G.ps[s].choose, 6000, s5); await host.waitForTimeout(1500);
    const late5 = await logHas(P5, /No answer in time.*send a robot/);
    console.log('   time up: ⌛ on its screen ' + late5 + ' (ready robots ' + want + ')');
    ok(late5, 'online 5: no ⌛ line on the joined screen');
    // 3. bets: that player locks, the cards stay playable, the lock stays
    for (const p of all) await p.evaluate(() => { window.__noBot = false; });
    await host.evaluate(() => { window.__bookieFull = false; });
    const inBets = await until(host, () => window.ROBOCUS_DEBUG.G.phase === 'bets' && !window.ROBOCUS_DEBUG.G.betsLocked, 60000);
    for (const p of all) await p.evaluate(() => { window.__noBot = true; });
    if (!inBets) bad.push('online 3: never reached the bets');
    else {
      await host.waitForTimeout(1500);
      await host.evaluate(s => { const D = window.ROBOCUS_DEBUG, G = D.G; if (G.gather) delete G.gather.done[s]; G.teams[s].hand = ['hedge_bet', 'bookie_s_friend', 'hedge_bet']; G.teams[s].fame = 6; D.updateHud(); }, s5);
      await host.waitForTimeout(1200);
      await actOn(P5, 'lockBets'); await host.waitForTimeout(1500);
      const n3 = await noteTxt(P5); console.log('online 3 locked note: ' + n3.slice(0, 220));
      ok(/Bets locked/.test(n3) && /Hedge Bet/.test(n3) && /Bookie/.test(n3), 'online 3: the locked note has no card buttons: ' + n3);
      await P5.evaluate(() => { const bt = document.getElementById('pHB'); if (bt) bt.click(); }); await host.waitForTimeout(1200);
      await P5.evaluate(() => { const bt = document.getElementById('pBF'); if (bt) bt.click(); }); await host.waitForTimeout(1500);
      const st3 = await host.evaluate(s => { const G = window.ROBOCUS_DEBUG.G; return { locked: !!(G.gather && G.gather.done[s]), hedge: !!G.ps[s].hedge, hand: G.teams[s].hand.slice(), phase: G.phase }; }, s5);
      console.log('   after Hedge Bet + Bookie\'s Friend: ' + JSON.stringify(st3));
      ok(st3.locked && st3.hedge && !st3.hand.includes('bookie_s_friend'), 'online 3: ' + JSON.stringify(st3));
      await refuseAll(); await P5.evaluate(() => { const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]')].find(x => /OK/.test(x.textContent)); if (bt) bt.click(); });
      for (const s of [0, 1, 2, 3]) if (s !== s5) await actOn(seatOf[s], 'lockBets');
      await until(host, () => window.ROBOCUS_DEBUG.G.betsLocked, 10000); await host.waitForTimeout(800);
      await actOn(P5, 'hedgeBet'); await host.waitForTimeout(1500);
      const late3 = await logHas(P5, /Too late: the bets already went through, so Hedge Bet was not played/);
      console.log('   a Hedge Bet after the bets: refused line ' + late3); ok(late3, 'online 3: no "too late" line');
    }
  }
  const desync = await Promise.all([A, B, C].map(p => p.evaluate(() => window.ROBOCUS_GAME.desyncs)));
  console.log('online desyncs on A, B, C: ' + desync.join(', ')); if (desync.some(x => x)) bad.push('online desyncs ' + desync);
  await b.close();
  return e2;
}

(async () => {
  if (which !== 'online') {
    const b = await require('./launch.js')(require('playwright'));
    for (const [w, h] of [[1600, 900], [1280, 720]]) { try { await solo(b, w, h); } catch (e) { bad.push(w + 'x' + h + ': ' + e.message); console.error(e); } }
    await b.close();
  }
  if (which !== 'solo') { try { errs.push(...await online()); } catch (e) { bad.push('online: ' + e.message); console.error(e); } }
  if (errs.length) bad.push(errs.length + ' page errors: ' + errs.slice(0, 3).join(' | '));
  console.log(bad.length ? 'FAIL\n  ' + bad.join('\n  ') : 'OK');
  process.exit(bad.length ? 1 : 0);
})();
