// T45 (Kev, 21 Nov): Hostile Buyout costs the target's weakest robot's value (the gold chip), at least 4 Cr; Fire Sale pays
// value + 1 for each robot, crew member and Stash part. Solo, one screen (1600x900), scripted plays:
//   1. buyout of a cheap robot (worth under 4): the note says "for 4 Cr (the 4 Cr minimum)"; Sell: you +4, the buyer −4;
//   2. buyout of a robot worth more than 4: the note says its value; Sell: you get its value, the buyer pays it;
//   3. buyer short of credits: you can't play it, the message names the price (and the AI's precheck refuses it too);
//   4. the target refuses: −1 fame, no credits move, the robot stays;
//   5. an AI target: it sells when the price + 1 fame covers what the robot is worth to it (aiSellsBuyout), and the result matches;
//   6. Fire Sale (you): tick everything: your strongest robot stays, the rest pays value + 1 each; "Sell nothing": nothing moves;
//   7. Fire Sale (an AI team with 3 robots and Stash parts): it sells its spare things at value + 1.
//   node tools/mp-scenario/buyout-price.js [screenshotFolder]
const path = require('path'), fs = require('fs');
(async () => {
  const shots = process.argv[2]; if (shots) fs.mkdirSync(shots, { recursive: true });
  const b = await require('./launch.js')(require('playwright'));
  const PLK = require('../planck-local.js'), PL = PLK.find();
  const bad = [], errs = [];
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await PLK.route(p, PL);
  await p.goto(require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href + '?seed=11'); await p.waitForTimeout(800);
  await p.evaluate(() => { window.__noSlide = true; window.__noAuto = true; });
  await p.click('#pAct2'); await p.waitForTimeout(1500); await p.mouse.move(5, 5);
  const shot = n => shots ? p.screenshot({ path: path.join(shots, n) }) : null;
  const until = async (f, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await p.evaluate(f)) return true; await p.waitForTimeout(100); } return false; };
  const waitRes = async (ms = 10000) => { for (let t = 0; t < ms; t += 100) { const v = await p.evaluate(() => window.__res); if (v !== undefined) return v; await p.waitForTimeout(100); } return 'TIMEOUT'; };
  const noteQ = () => until(() => { const R = window.ROBOCUS_DEBUG.RX; return !!(R.q && !R.q.over) && !document.querySelector('#promptBar.qmode [data-rk].arming') && document.querySelectorAll('#promptBar.qmode [data-rk]').length > 0; });
  const noteText = () => p.evaluate(() => ((document.getElementById('promptBar') || {}).innerText || '').replace(/\s+/g, ' '));
  const clickNote = re => p.evaluate(src => { const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]')].find(x => new RegExp(src).test(x.textContent)); if (!bt) return false; bt.click(); return true; }, re.source);
  const lastLog = (n = 3) => p.evaluate(n => window.ROBOCUS_DEBUG.PT.game.events.filter(e => e.k === 'msg').slice(-n).map(e => e.text), n);
  // the table: 12 Cr and 8 fame each, empty hands, no Security Bots, no Stash; you get 2 copies of a rival starter at `lv` with `parts`
  // (both the same, so the weakest one is either; robot 0 a little stronger: one more part) and team 1 keeps 1 robot (a free bay)
  const prep = (lv, nParts, o = {}) => p.evaluate(([lv, nParts, o]) => { const D = window.ROBOCUS_DEBUG, G = D.G, L = D.LOTS;
    const parts = Object.keys(L).filter(id => /^p_[^~]+$/.test(id) && !L[id].legend && L[id].kind !== 'chip').map(id => L[id].part);
    G.teams.forEach(t => { t.credits = 12; t.fame = 8; t.hand = []; t.secBots = 0; t.exSec = 0; t.debt = 0; t.stash = []; t.robots.forEach(r => { r.exhausted = false; }); });
    if (!window.__src) window.__src = JSON.stringify(G.teams[2].robots[0]);
    const mk = (id, n) => { const r = JSON.parse(window.__src); r.id = id; r.uid = 'u' + id; r.level = lv; r.parts = parts.slice(0, n); r.rar = {}; r.leg = null; r.wins = 0; r.wear = null; r.exhausted = false; return r; };
    const me = G.teams[0]; me.robots = [mk(950, Math.min(2, nParts + 1)), mk(951, nParts)];
    if (o.crew) me.crew = o.crew.map((k, j) => ({ uid: 9000 + j, kind: k }));
    if (o.stash) me.stash = o.stash.slice();
    G.teams[1].robots = G.teams[1].robots.slice(0, 1);
    G.nextEvent = null; window.__res = undefined; D.updateHud();
    const T = me, w = D.buyBot(T); return { weakest: w.name + '#' + w.id, value: D.robotValue(w), price: D.buyPrice(T) }; }, [lv, nParts, o]);
  const hbOnMe = () => p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, F = G.teams[1], me = G.teams[0]; F.hand = ['hostile_buyout'];
    const c0 = me.credits, f0 = me.fame, n0 = me.robots.length, b0 = F.credits;
    D.playScheme(F, 'hostile_buyout', me).then(() => { window.__res = { cr: me.credits - c0, fame: me.fame - f0, robots: me.robots.length - n0, buyer: F.credits - b0 }; }); });
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // ---- 1. a cheap robot (starter, no parts): price 4
  { const s = await prep(0, 0); console.log('1. cheap robot:', JSON.stringify(s));
    if (!(s.value < 4 && s.price === 4)) bad.push('1: the setup is not a robot worth under 4: ' + JSON.stringify(s));
    await hbOnMe(); if (!await noteQ()) bad.push('1: no question in the note');
    const t = await noteText(); console.log('   note: ' + t.slice(0, 220));
    if (!/for 4 Cr \(the 4 Cr minimum\)/.test(t)) bad.push('1: the note does not say "for 4 Cr (the 4 Cr minimum)": ' + t);
    if (!/Sell it \(?\+4 Cr/.test(t)) bad.push('1: the Sell button does not say +4 Cr');
    await shot('1-buyout-cheap.png');
    await clickNote(/^Sell it/); const r = await waitRes(); console.log('   → Sell it: ' + JSON.stringify(r) + ' · ' + (await lastLog(1))[0]);
    if (!eq(r, { cr: 4, fame: 0, robots: -1, buyer: -4 })) bad.push('1: ' + JSON.stringify(r) + ', want +4 Cr, −1 robot, buyer −4'); }

  // ---- 2. a robot worth more than 4 (level 3 with 2 parts): price = its value
  { const s = await prep(3, 2); console.log('2. valuable robot:', JSON.stringify(s));
    if (!(s.value > 4 && s.price === s.value)) bad.push('2: the setup is not a robot worth more than 4: ' + JSON.stringify(s));
    await hbOnMe(); if (!await noteQ()) bad.push('2: no question in the note');
    const t = await noteText(); console.log('   note: ' + t.slice(0, 220));
    if (!new RegExp('worth ' + s.value + ' Cr\\) for ' + s.price + ' Cr\\.').test(t)) bad.push('2: the note does not say worth ' + s.value + ' for ' + s.price + ': ' + t);
    await shot('2-buyout-value.png');
    await clickNote(/^Sell it/); const r = await waitRes(); const log = (await lastLog(4)).reverse().find(x => /buys/.test(x)) || ''; console.log('   → Sell it: ' + JSON.stringify(r) + ' · ' + log);
    if (!eq(r, { cr: s.price, fame: 0, robots: -1, buyer: -s.price })) bad.push('2: ' + JSON.stringify(r) + ', want +' + s.price);
    if (!new RegExp('for ' + s.price + ' Cr \\(its value\\)').test(log)) bad.push('2: the log does not say the price: ' + log); }

  // ---- 3. you are the buyer and short of credits: you can't play it, the message says the price
  { const s = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, L = D.LOTS, me = G.teams[0], T = G.teams[1];
      const parts = Object.keys(L).filter(id => /^p_[^~]+$/.test(id) && !L[id].legend && L[id].kind !== 'chip').map(id => L[id].part);
      const src = JSON.parse(window.__src), mk = id => { const r = JSON.parse(JSON.stringify(src)); r.id = id; r.uid = 'u' + id; r.level = 3; r.parts = parts.slice(0, 2); r.rar = {}; r.leg = null; r.wins = 0; r.wear = null; return r; };
      T.robots = [mk(960), mk(961)]; me.robots = me.robots.slice(0, 1); me.hand = ['hostile_buyout']; me.fame = 10; T.fame = 2; me.credits = 3;
      const price = D.buyPrice(T), pre = D.precheck(me, D.CARDS.hostile_buyout, T);
      const ph = G.phase, it = G.intrigueTurn; G.phase = 'intrigue'; G.intrigueTurn = 0;
      return D.humanPlay('hostile_buyout', 1, 0).then(ok => { G.phase = ph; G.intrigueTurn = it; me.credits = price; const pre2 = D.precheck(me, D.CARDS.hostile_buyout, T); me.credits = 3;
        return { price, pre, ok, pre2, hand: me.hand.slice(), robots: T.robots.length }; }); });
    const log = (await lastLog(2)).join(' | '); console.log('3. buyer short (3 Cr): ' + JSON.stringify(s) + ' · ' + log);
    if (s.ok !== false || !s.hand.includes('hostile_buyout') || s.robots !== 2) bad.push('3: the card was played without the credits: ' + JSON.stringify(s));
    if (!new RegExp('costs ' + s.price + ' Cr').test(s.pre || '') || !new RegExp('costs ' + s.price + ' Cr').test(log)) bad.push('3: the message does not say the price ' + s.price + ': ' + s.pre + ' / ' + log);
    if (s.pre2) bad.push('3: with exactly the price it is still refused: ' + s.pre2); }

  // ---- 4. the target (you) refuses: −1 fame, nothing else moves
  { const s = await prep(2, 1); console.log('4. refuse:', JSON.stringify(s));
    await hbOnMe(); if (!await noteQ()) bad.push('4: no question in the note');
    await clickNote(/^Refuse/); const r = await waitRes(); console.log('   → Refuse: ' + JSON.stringify(r) + ' · ' + (await lastLog(1))[0]);
    if (!eq(r, { cr: 0, fame: -1, robots: 0, buyer: 0 })) bad.push('4: ' + JSON.stringify(r) + ', want −1 fame only'); }

  // ---- 5. an AI target: sells when price + 1 fame covers the robot's worth to it; cheap robot and a valuable one
  for (const [lv, np] of [[0, 0], [3, 2], [4, 2]]) {
    const s = await p.evaluate(([lv, np]) => { const D = window.ROBOCUS_DEBUG, G = D.G, L = D.LOTS, me = G.teams[0], T = G.teams[2];
      const parts = Object.keys(L).filter(id => /^p_[^~]+$/.test(id) && !L[id].legend && L[id].kind !== 'chip').map(id => L[id].part);
      const src = JSON.parse(window.__src), mk = (id, n) => { const r = JSON.parse(JSON.stringify(src)); r.id = id; r.uid = 'u' + id; r.level = lv; r.parts = parts.slice(0, n); r.rar = {}; r.leg = null; r.wins = 0; r.wear = null; r.exhausted = false; return r; };
      G.teams.forEach(t => { t.credits = 12; t.fame = 8; t.hand = []; t.secBots = 0; });
      me.robots = me.robots.slice(0, 1); T.robots = [mk(970, Math.min(2, np + 1)), mk(971, np)]; me.hand = ['hostile_buyout']; me.credits = 15;
      const r = D.buyBot(T), price = D.buyPrice(T), want = D.aiSellsBuyout(T, r, price), c0 = T.credits, f0 = T.fame, b0 = me.credits;
      window.__res = undefined;
      D.playScheme(me, 'hostile_buyout', T).then(() => { window.__res = { want, price, value: D.robotValue(r), cr: T.credits - c0, fame: T.fame - f0, buyer: me.credits - b0, robots: T.robots.length }; });
      return true; }, [lv, np]);
    const r = await waitRes(); console.log('5. AI target, level ' + lv + ': ' + JSON.stringify(r) + ' · ' + (await lastLog(1))[0]);
    const ok = r.want ? r.cr === r.price && r.buyer === -r.price && r.fame === 0 && r.robots === 1 : r.cr === 0 && r.buyer === 0 && r.fame === -1 && r.robots === 2;
    if (!ok) bad.push('5: the AI target did not do what aiSellsBuyout said: ' + JSON.stringify(r));
  }

  // ---- 6. Fire Sale, you: tick everything (2 robots, 2 crew, 2 Stash parts); then once "Sell nothing"
  const parts2 = await p.evaluate(() => { const L = window.ROBOCUS_DEBUG.LOTS; return Object.keys(L).filter(id => /^p_[^~]+$/.test(id) && !L[id].legend && L[id].kind !== 'chip').slice(0, 2); });
  for (const mode of ['all', 'none']) {
    await prep(2, 1, { crew: ['mechanic', 'hacker'], stash: parts2 });
    const s = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, me = G.teams[0]; me.hand = ['fire_sale'];
      const items = D.fireItems(me).map(x => ({ kind: x.kind, name: x.name, value: x.value, price: x.price, id: x.r ? x.r.id : null })), strong = me.robots.slice().sort((a, b) => window.ROBOCUS_DEBUG.str2(b) - window.ROBOCUS_DEBUG.str2(a))[0].id;
      const c0 = me.credits, n0 = me.robots.length, k0 = me.crew.length, s0 = me.stash.length;
      window.__res = undefined;
      D.playScheme(me, 'fire_sale', me).then(() => { window.__res = { cr: me.credits - c0, robots: me.robots.length - n0, crew: me.crew.length - k0, stash: me.stash.length - s0, left: me.robots.map(r => r.id) }; });
      return { items }; });
    if (!await until(() => { const el = document.getElementById('ivModal'); return el && !el.hidden && el.querySelectorAll('input[data-fs]').length > 0; })) { bad.push('6: no Fire Sale question'); continue; }
    if (mode === 'all') { await p.waitForTimeout(900); await shot('6-fire-sale.png'); }
    const txt = await p.evaluate(() => document.getElementById('ivModal').innerText.replace(/\s+/g, ' '));
    await p.waitForTimeout(900);
    await p.evaluate(mode => { const el = document.getElementById('ivModal'); if (mode === 'all') el.querySelectorAll('input[data-fs]').forEach(x => { x.checked = true; });
      [...el.querySelectorAll('button[data-k]')].find(x => (mode === 'all' ? /Sell the ticked/ : /Sell nothing/).test(x.textContent)).click(); }, mode);
    const r = await waitRes(); const log = (await lastLog(2)).join(' | ');
    console.log('6. Fire Sale (you, ' + mode + '): items ' + s.items.map(x => x.kind + ' ' + x.name + ' ' + x.value + '→' + x.price).join(', ') + ' · ' + JSON.stringify(r) + ' · ' + log);
    if (mode === 'all') {
      const robotPrices = s.items.filter(x => x.kind === 'robot'), sold = s.items.filter(x => x.kind !== 'robot').reduce((a, x) => a + x.price, 0);
      const okR = robotPrices.some(x => r.cr === sold + x.price && r.left.length === 1 && r.left[0] !== x.id);
      if (!s.items.every(x => x.price === x.value + 1)) bad.push('6: a price is not value + 1: ' + JSON.stringify(s.items));
      if (!okR || r.crew !== -2 || r.stash !== -2 || r.robots !== -1) bad.push('6: ticking everything gave ' + JSON.stringify(r) + ' (want one robot kept, the rest at value + 1)');
      if (!/each pays its value \+ 1/i.test(txt)) bad.push('6: the question does not say value + 1: ' + txt);
    } else if (!eq([r.cr, r.robots, r.crew, r.stash], [0, 0, 0, 0])) bad.push('6: "Sell nothing" moved something: ' + JSON.stringify(r));
  }

  // ---- 7. Fire Sale, an AI team with 3 robots and 2 Stash parts
  { const r = await p.evaluate(parts2 => { const D = window.ROBOCUS_DEBUG, G = D.G, T = G.teams[3]; T.hand = ['fire_sale']; T.stash = parts2.slice();
      const src = JSON.parse(window.__src); while (T.robots.length < 3) { const x = JSON.parse(JSON.stringify(src)); x.id = 980 + T.robots.length; x.uid = 'u' + x.id; x.level = 0; x.parts = []; x.leg = null; x.wins = 0; x.wear = null; T.robots.push(x); }
      const picks = (D.aiFirePicks ? D.aiFirePicks(T) : []).map(x => x.kind + ':' + x.price), want = D.fireItems(T).filter(x => x.kind === 'part').reduce((a, x) => a + x.price, 0), c0 = T.credits;
      window.__res = undefined;
      return D.playScheme(T, 'fire_sale', T).then(() => ({ cr: T.credits - c0, partsAtLeast: want, stash: T.stash.length, robots: T.robots.length, picks })); }, parts2);
    console.log('7. Fire Sale (AI): ' + JSON.stringify(r) + ' · ' + (await lastLog(1))[0]);
    if (r.stash !== 0 || r.cr < r.partsAtLeast) bad.push('7: the AI did not sell its Stash parts at value + 1: ' + JSON.stringify(r)); }

  if (errs.length) bad.push('page errors: ' + errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(bad.length ? 'FAIL\n  ' + bad.join('\n  ') : 'OK');
  process.exit(bad.length ? 1 : 0);
})();
