// T44 (Kev, 21 Nov): a robot's value in credits ("◉ 6 Cr") on every robot card and where a robot changes hands. Solo, one screen,
// at 1600x900 and 1280x720, in the Market of round 1: your robots (one with parts, Fan tokens and damage), the rival tickets, the
// robot lot, the hover breakdown, the trade panel with a robot on the table, an AI robot offer on the trading floor (T55: a ticket), Hostile Buyout in the note.
// Checks: every robot card has a chip and it is inside the screen; the breakdown adds up; the value matches robotValue; the offer
// and Hostile Buyout questions are in the note (not the box) and say "worth N Cr"; BAL.showValue=false hides every chip.
//   node tools/mp-scenario/robot-value.js [screenshotFolder]
const path = require('path'), fs = require('fs');
(async () => {
  const shots = process.argv[2]; if (shots) fs.mkdirSync(shots, { recursive: true });
  const b = await require('./launch.js')(require('playwright'));
  const PLK = require('../planck-local.js'), PL = PLK.find();
  const bad = [], errs = [];
  const shot = (p, n) => shots ? p.screenshot({ path: path.join(shots, n) }) : null;
  const noteShot = (p, n) => shots ? p.locator('#promptBar').screenshot({ path: path.join(shots, n) }) : null;
  const until = async (p, f, ms = 20000, arg) => { for (let t = 0; t < ms; t += 100) { if (await p.evaluate(f, arg)) return true; await p.waitForTimeout(100); } return false; };
  async function open(w, h, q = '') {
    const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', e => errs.push(w + 'x' + h + ': ' + e.message));
    await PLK.route(p, PL);
    await p.goto(require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href + '?seed=13' + q); await p.waitForTimeout(800);
    await p.evaluate(() => { window.__noSlide = true; window.__noAuto = true; });
    await p.click('#pAct2'); await p.waitForTimeout(1500); await p.mouse.move(5, 5);
    await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams.forEach(t => { t.hand = []; t.stash = []; t.credits = 10; t.debt = 0; }); D.updateHud(); D.act('upkeepDone'); });
    await until(p, () => { const G = window.ROBOCUS_DEBUG.G; return G.phase === 'intrigue' && G.intrigueTurn === 0 || G.phase === 'market'; });
    await p.evaluate(() => { const D = window.ROBOCUS_DEBUG; if (D.G.phase === 'intrigue') D.act('endTurn'); });
    if (!await until(p, () => window.ROBOCUS_DEBUG.mktOpen())) bad.push(w + 'x' + h + ': the Market did not open');
    for (let k = 0; k < 10; k++) { if (!await p.evaluate(() => !!(window.ROBOCUS_DEBUG.RX.q && !window.ROBOCUS_DEBUG.RX.q.over))) break; await p.waitForTimeout(900); await p.evaluate(() => { const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]')].find(x => /Refuse/.test(x.textContent)); if (bt) bt.click(); }); await p.waitForTimeout(400); }
    return p;
  }
  // your robots: your starter, a rival starter copy with 2 parts (one rare), a legendary, 2 Fan tokens and a broken Weapon + a damaged Drive;
  // rivals: the first robot of each gets a part
  const setup = p => p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[0], L = D.LOTS;
    const parts = Object.keys(L).filter(id => /^p_[^~]+$/.test(id) && !L[id].legend && L[id].kind !== 'chip').map(id => L[id].part), leg = Object.keys(L).filter(id => /^p_[^~]+$/.test(id) && L[id].legend).map(id => L[id].part);
    const r = JSON.parse(JSON.stringify(G.teams[1].robots[0])); r.id = 'T44a'; r.uid = 'T44u'; r.parts = [parts[0], parts[3]]; r.rar = { [parts[3]]: 2 }; r.leg = leg[0]; r.wins = 2; r.level = r.level || 0;
    r.wear = {}; const Z = D.zonesOf(r); r.wear = { parts: { [Z.drive.labels[0]]: 0.5 }, ints: {}, lost: [Z.weapon.labels[0]] };
    t.robots = [t.robots[0], r];
    [1, 2, 3].forEach(i => { const x = G.teams[i].robots[0]; x.parts = [parts[i + 4]]; });
    D.updateHud(); return t.robots.map(x => x.name + ' ' + D.robotValue(x)); });
  const chips = p => p.evaluate(() => { const D = window.ROBOCUS_DEBUG, W = window.innerWidth, H = window.innerHeight;
    return D.helpRegions.filter(h => /^◉ /.test(h.title)).map(h => { const a = D.worldToScreen(h.x, h.y), z = D.worldToScreen(h.x + h.w, h.y + h.h); return { t: h.title, x: Math.round(a.x), y: Math.round(a.y), x2: Math.round(z.x), y2: Math.round(z.y), body: h.body, out: a.x < 0 || a.y < 0 || z.x > W || z.y > H }; }); });
  const robotsOnTable = p => p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; return G.teams.reduce((a, t) => a + t.robots.length, 0) + (G.market || []).filter(id => window.ROBOCUS_DEBUG.LOTS[id] && window.ROBOCUS_DEBUG.LOTS[id].bot).length; });
  const noteTxt = p => p.evaluate(() => { const el = document.getElementById('promptBar'); return { q: el.classList.contains('qmode'), text: el.innerText.replace(/\s+/g, ' ').trim(), box: !(document.getElementById('ivModal') || { hidden: true }).hidden }; });

  for (const [w, h] of [[1600, 900], [1280, 720]]) {
    const tag = w + 'x' + h, p = await open(w, h);
    console.log(tag + ' robots: ' + (await setup(p)).join(', ')); await p.waitForTimeout(400);
    // 1. every robot card (yours, rivals, the robot lot) shows a chip, inside the screen
    const C = await chips(p), n = await robotsOnTable(p);
    console.log(tag + ' chips: ' + C.length + ' for ' + n + ' robots: ' + C.map(c => c.t.replace(/^◉ /, '') + (c.out ? ' (OUT)' : '')).join(' | '));
    if (C.length < n) bad.push(tag + ': ' + C.length + ' chips for ' + n + ' robots');
    if (C.some(c => c.out)) bad.push(tag + ': a chip is outside the screen');
    // the breakdown adds up to the number on the chip, and matches robotValue
    const sum = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, r = D.G.teams[0].robots[1], o = D.robotValueOf(r); return { v: o.v, sum: o.lines.reduce((a, l) => a + (l[1] || 0), 0), lines: o.lines }; });
    console.log(tag + ' breakdown: ' + sum.lines.map(l => l[0] + ' ' + l[1]).join(', ') + ' = ' + sum.v);
    if (Math.max(1, sum.sum) !== sum.v) bad.push(tag + ': breakdown does not add up');
    await shot(p, tag + '-1-cards-market.png');
    // 2. the hover on your damaged robot's chip
    const mine = C.slice().sort((a, b) => +(b.t.match(/worth (\d+)/) || [0, 0])[1] - +(a.t.match(/worth (\d+)/) || [0, 0])[1])[0];   // the robot with parts, Fan tokens and damage
    if (mine) { await p.mouse.move((mine.x + mine.x2) / 2, (mine.y + mine.y2) / 2); await p.waitForTimeout(800);
      const tip = await p.evaluate(() => { const t = document.getElementById('helpTip'); return t && !t.hidden ? t.innerText : ''; });
      if (!/worth/.test(tip)) bad.push(tag + ': no hover breakdown'); await shot(p, tag + '-2-hover.png'); await p.mouse.move(5, 5); await p.waitForTimeout(300); }
    else bad.push(tag + ': no chip for your robot with Fan tokens');
    // 3. the trade panel, with their robot and yours on the table
    await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; const x = G.teams[1].robots[0], y = JSON.parse(JSON.stringify(x)); y.id = 'T44b'; y.level = 2; G.teams[1].robots.push(y); D.humanTrade(G.teams[1], 0); });
    await p.waitForTimeout(500);
    await p.evaluate(() => { const el = document.getElementById('dealModal'); [...el.querySelectorAll('.dl-chip.dl-asset')].filter(c => c.dataset.zone === 'stash' && /^R:/.test(c.dataset.id)).slice(0, 1).forEach(c => c.click()); });
    await p.waitForTimeout(200);
    await p.evaluate(() => { const el = document.getElementById('dealModal'); const c = [...el.querySelectorAll('.dl-chip.dl-asset')].find(c => c.dataset.zone === 'stash' && c.dataset.side === 'want' && /^R:/.test(c.dataset.id)); if (c) c.click(); });
    await p.waitForTimeout(300);
    const dl = await p.evaluate(() => [...document.querySelectorAll('#dealModal .dl-chip.dl-asset')].map(c => c.textContent.trim()).filter(t => /^🤖/.test(t)));
    console.log(tag + ' trade panel robots: ' + dl.join(' | '));
    if (!dl.length || !dl.every(t => /◉ \d+/.test(t))) bad.push(tag + ': trade panel robot without a value');
    await shot(p, tag + '-3-trade-panel.png');
    await p.evaluate(() => { const el = document.getElementById('dealModal'); if (el && el._finish) el._finish(); }); await p.waitForTimeout(600);
    // 4. an AI robot offer (you have one robot, Rust Rivets three)
    await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; const t = G.teams[0]; t.robots = [t.robots[1]];
      [1, 2, 3].forEach(i => { const T = G.teams[i], r0 = T.robots[0]; T.robots = [r0]; for (let k = 1; k < (i === 1 ? 3 : 2); k++) { const r = JSON.parse(JSON.stringify(r0)); r.id = 'T44o' + i + k; T.robots.push(r); } });
      G.teams[1].credits = 3; D.updateHud(); D.openMarketAI(); });
    // T55: an offer to a person is a ticket on the trading floor (no longer a question in the note): read the ticket
    const tk = () => p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G, o = (G.offers || []).find(x => x.to === 0 && x.from === 1); if (!o) return null;
      const el = document.querySelector('#tradeFloor .tf-t[data-oid="' + o.id + '"]'); return { id: o.id, el: !!el, text: el ? el.innerText.replace(/\s+/g, ' ').trim() : '' }; });
    if (!await until(p, () => (window.ROBOCUS_DEBUG.G.offers || []).some(x => x.to === 0 && x.from === 1), 8000)) bad.push(tag + ': no AI robot offer');
    await p.waitForTimeout(1000);
    const t4 = await tk(); console.log(tag + ' offer ticket: ' + (t4 ? t4.text : 'NONE'));
    if (!t4 || !t4.el || !/You get 🤖 \S.* \(worth \d+ Cr\).*You give \d+ Cr/.test(t4.text)) bad.push(tag + ': the robot offer ticket does not show the robot with its worth: ' + (t4 ? t4.text : 'none'));
    const nt4 = await noteTxt(p); if (nt4.box) bad.push(tag + ': the robot offer opened the old box');
    await shot(p, tag + '-4-ai-offer.png');
    await p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; (G.offers || []).filter(o => o.to === 0).forEach(o => { const b = document.querySelector('#tradeFloor [data-fn="' + o.id + '"]'); if (b) b.click(); }); }); await p.waitForTimeout(800);
    for (let k = 0; k < 6; k++) { if (!await p.evaluate(() => !!(window.ROBOCUS_DEBUG.RX.q && !window.ROBOCUS_DEBUG.RX.q.over))) break; await p.evaluate(() => window.ROBOCUS_DEBUG.RX.q.cancel()); await p.waitForTimeout(600); }
    // 5. Hostile Buyout on you (2 robots)
    await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[0]; const r = JSON.parse(JSON.stringify(t.robots[0])); r.id = 'T44c'; r.parts = []; r.leg = null; r.wins = 0; r.wear = null; r.level = 1; t.robots.push(r); t.secBots = 0; t.exSec = 0; t.hand = [];
      G.teams[1].hand = ['hostile_buyout']; G.teams[1].credits = 10; G.teams[1].robots = G.teams[1].robots.slice(0, 1); D.updateHud(); D.playScheme(G.teams[1], 'hostile_buyout', t); });
    if (!await until(p, () => !!(window.ROBOCUS_DEBUG.RX.q && !window.ROBOCUS_DEBUG.RX.q.over), 8000)) bad.push(tag + ': no Hostile Buyout question');
    await p.waitForTimeout(1000);
    const nt = await noteTxt(p); console.log(tag + ' buyout: ' + nt.text);
    if (!nt.q || nt.box || !/wants to buy your .*\(worth (\d+) Cr\) for (\d+) Cr/.test(nt.text)) bad.push(tag + ': Hostile Buyout is not in the note with its worth: ' + nt.text);
    else { const m = /worth (\d+) Cr\) for (\d+) Cr/.exec(nt.text); if (+m[2] !== Math.max(4, +m[1])) bad.push(tag + ': Hostile Buyout price ' + m[2] + ' is not its value ' + m[1] + ' (at least 4)'); }   // T45
    await shot(p, tag + '-5-hostile-buyout.png'); await noteShot(p, tag + '-5-hostile-buyout-note.png');
    await p.evaluate(() => { const R = window.ROBOCUS_DEBUG.RX; if (R.q && !R.q.over) R.q.cancel(); });
    await p.close();
    // 6. the switch: BAL.showValue false hides every chip
    const q = await open(w, h, '&bal=' + encodeURIComponent(JSON.stringify({ showValue: false })));
    await setup(q); await q.waitForTimeout(400);
    const C2 = await chips(q); if (C2.length) bad.push(tag + ': BAL.showValue false still shows ' + C2.length + ' chips');
    await q.close();
  }
  await b.close();
  if (errs.length) bad.push('page errors: ' + errs.slice(0, 5).join(' / '));
  console.log(bad.length ? 'FAIL\n' + bad.join('\n') : 'OK');
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
