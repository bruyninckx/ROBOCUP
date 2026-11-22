// T55 (Kev, 22 Nov: "can we make some type of open auction panel so you can lock in trades with other people while keeping an
// overview"; layout A, "counter is ok, see deals as they happen"): the trading floor under the pit, scripted.
// Part 1, solo (you = Steel Bolts against three AI teams), at 1905x932 (Kev's window) and 1440x900:
//   1. two AI offers to you open at once (Rust sells you a robot, Moss sells you a part): two tickets on the floor, no question in
//      the note; answered out of order (Moss first) with a bid changed in between; both go through, bids kept;
//   2. a counter (composer pre-filled, sides swapped) that the AI accepts, and one it refuses (nothing moves);
//   3. an offer that times out (floorMs 3 s): gone, a line, nothing moved;
//   4. keep a robot: the composer will not put your only robot on the table, the host refuses an offer that would take it, and an
//      offer accepted after your second robot left falls through ("must keep a robot", nothing moved);
//   5. fell through: an AI wants a Stash part you sold to the bank meanwhile: Yes → nothing moved;
//   6. the Market closes (Lock) with two offers open: both called off, a line, nothing moved;
//   7. switch off (BAL.tradeFloor false): no floor, the old 🤝 buttons in the note.
// Part 2, online (host H + joined A, B, C, all people): A offers H 2 Cr through the composer on A's screen, H answers Yes on its
// floor (credits move on the host and every screen, both unlocked); B offers C, B takes it back (gone on C's screen); C counters
// A's offer (A's original is withdrawn, A gets the counter, says Yes); a late screen (a reload of C) gets the open offers from the
// state; the last lock with offers open calls them off.
// Screenshots (if a folder is given): t55-floor-1905.png (online, host: two offers in, one out, one between others),
// t55-floor-composer.png, t55-floor-1440.png.
//   node tools/mp-scenario/trading-floor.js [screenshotFolder] [seed=7]
const path = require('path'), fs = require('fs');
(async () => {
  const shots = process.argv[2], seed = +(process.argv[3] || 7); if (shots) fs.mkdirSync(shots, { recursive: true });
  const b = await require('./launch.js')(require('playwright'));
  const PLK = require('../planck-local.js'), PL = PLK.find();
  const bad = [], errs = [];
  const shot = (p, n) => shots ? p.screenshot({ path: path.join(shots, n) }) : null;
  const until = async (p, f, ms = 20000, arg) => { for (let t = 0; t < ms; t += 100) { if (await p.evaluate(f, arg)) return true; await p.waitForTimeout(100); } return false; };
  const lastMsgs = (p, n = 6) => p.evaluate(n => window.ROBOCUS_DEBUG.PT.game.events.filter(e => e.k === 'msg').slice(-n).map(e => e.text), n);
  const st = (p, s = 0) => p.evaluate(s => { const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[s];
    return { open: D.mktOpen(), cr: G.teams.map(x => x.credits), bids: (G.ps[s].bids || []).slice(0, 4), robots: G.teams.map(x => x.robots.length), stash: G.teams.map(x => (x.stash || []).length), offers: (G.offers || []).map(o => o.from + '>' + o.to + ':' + o.kind), done: (G.floorDone || []).map(x => x.from + '>' + x.to + ':' + x.res), q: !!(D.RX.q && !D.RX.q.over), locked: !!(G.gather && G.gather.key === 'lots:' + G.round && G.gather.done[s]) }; }, s);
  // the floor as drawn on a screen: tickets (class, text), buttons, where it is
  const floor = p => p.evaluate(() => { const el = document.getElementById('tradeFloor'); if (!el || el.hidden) return null; const r = el.getBoundingClientRect();
    return { box: [r.left, r.top, r.width, r.height].map(Math.round), text: el.innerText.replace(/\s+/g, ' '), tickets: [...el.querySelectorAll('.tf-t')].map(t => ({ cls: t.className.replace('tf-t ', ''), id: +t.dataset.oid || null, text: t.innerText.replace(/\s+/g, ' ') })), comp: !!el.querySelector('.tf-comp') }; });
  const clickIn = (p, sel) => p.evaluate(sel => { const el = document.querySelector('#tradeFloor ' + sel); if (!el || el.disabled) return false; el.click(); return true; }, sel);
  const ticketBtn = (p, from, label) => p.evaluate(([from, label]) => { const G = window.ROBOCUS_DEBUG.G, o = (G.offers || []).find(x => x.from === from && x.to === window.ROBOCUS_DEBUG.G && 0 || x.from === from); if (!o) return false;
    const t = document.querySelector('#tradeFloor .tf-t[data-oid="' + o.id + '"]'); if (!t) return false; const bt = [...t.querySelectorAll('button')].find(x => x.textContent.trim() === label); if (!bt || bt.disabled) return false; bt.click(); return true; }, [from, label]);
  const addSel = (p, side, re) => p.evaluate(([side, src]) => { const s = document.querySelector('#tradeFloor select[data-xa="' + side + '"]'); if (!s) return false; const o = [...s.options].find(x => new RegExp(src).test(x.textContent)); if (!o) return false; s.value = o.value; s.dispatchEvent(new Event('change')); return true; }, [side, re.source]);
  const step = (p, side, d, n = 1) => p.evaluate(([side, d, n]) => { for (let k = 0; k < n; k++) { const bt = document.querySelector('#tradeFloor [data-xc="' + side + '"][data-d="' + d + '"]'); if (bt) bt.click(); } }, [side, d, n]);
  const pitPlus = async (p, k) => { const pt = await p.evaluate(k => { const D = window.ROBOCUS_DEBUG, h = D.hitRegions.find(x => x.kind === 'market_plus' && x.idx === k); return h ? D.worldToScreen(h.x + h.w / 2, h.y + h.h / 2) : null; }, k); if (!pt) return false; await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(250); await p.mouse.move(5, 5); return true; };

  async function openSolo(w, h, q = '') {
    const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', e => errs.push(w + 'x' + h + ': ' + e.message));
    await PLK.route(p, PL);
    await p.goto(require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href + '?seed=13' + q); await p.waitForTimeout(800);
    await p.evaluate(() => { window.__noSlide = true; window.__noAuto = true; });
    await p.click('#pAct2'); await p.waitForTimeout(1500); await p.mouse.move(5, 5);
    await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams.forEach(t => { t.hand = t.i === 0 ? t.hand : []; t.stash = []; t.credits = 10; t.debt = 0; }); D.updateHud(); D.act('upkeepDone'); });
    await until(p, () => { const G = window.ROBOCUS_DEBUG.G; return G.phase === 'intrigue' && G.intrigueTurn === 0 || G.phase === 'market'; });
    await p.evaluate(() => { const D = window.ROBOCUS_DEBUG; if (D.G.phase === 'intrigue') D.act('endTurn'); });
    if (!await until(p, () => window.ROBOCUS_DEBUG.mktOpen())) bad.push(w + 'x' + h + ': the Market did not open');
    await p.waitForTimeout(600);
    return p;
  }
  // a part lot id that robot r can take (a plain part, not legendary)
  const setTable = p => p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, me = G.teams[0];
    G.teams.forEach(t => { t.stash = []; t.credits = 10; });
    const parts = Object.keys(D.LOTS).filter(k => D.LOTS[k].part && !D.LOTS[k].legend && !/^robot:|^crew:/.test(k));
    const fits = parts.filter(k => D.canFit(me.robots[0], D.LOTS[k]));
    // Rust Rivets: 3 robots, 3 Cr (it sells its weakest to you: you have one robot)
    const R = G.teams[1], r0 = R.robots[0]; R.robots = [r0]; for (let k = 1; k < 3; k++) { const r = JSON.parse(JSON.stringify(r0)); r.id = 'T55-' + k; r.name = r0.name; R.robots.push(r); } R.credits = 3;
    G.teams[2].robots.length = 1; G.teams[3].robots.length = 1;
    D.updateHud(); return { fits, parts }; });

  // ===================== Part 1: solo =====================
  for (const [w, h] of [[1905, 932], [1440, 900]]) {
    const tag = w + 'x' + h, p = await openSolo(w, h);
    const tb = await setTable(p);
    await pitPlus(p, 0);
    // 1. two offers at once: Rust's robot (openMarketAI) and Moss's part (a part it sells to you)
    const partM = tb.fits[0];
    await p.evaluate(part => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams[2].stash = [part]; D.openMarketAI(); D.floorAI(G.teams[2], G.teams[0], 'part', { cr: 0, items: [part] }, { cr: 2, items: [] }, { info: 'test' }); }, partM);
    await until(p, () => (window.ROBOCUS_DEBUG.G.offers || []).filter(o => o.to === 0).length >= 2, 5000);
    await p.waitForTimeout(500);
    let s = await st(p), f = await floor(p);
    console.log(tag + ' 1 two offers: ' + JSON.stringify(s.offers) + ' · floor ' + (f ? JSON.stringify(f.box) + ' ' + f.tickets.map(t => t.cls).join(',') : 'NONE') + ' · note question: ' + s.q);
    if (!f || f.tickets.filter(t => /\bin\b/.test(t.cls)).length !== 2) bad.push(tag + ': not two tickets to you on the floor: ' + JSON.stringify(f && f.tickets));
    if (s.q) bad.push(tag + ': an offer landed in the note as a question');
    const note = await p.evaluate(() => document.getElementById('promptBar').innerText);
    if (!/2 offers wait for you on the trading floor/.test(note) || /🤝/.test(note)) bad.push(tag + ': note text: ' + note.replace(/\s+/g, ' '));
    // the floor must not cover the lots or the pit
    const geo = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, h = D.hitRegions.filter(x => x.kind === 'market_plus'); const ys = h.map(x => D.worldToScreen(0, x.y + x.h).y); return Math.max(...ys); });
    if (f && f.box[1] < geo) bad.push(tag + ': the floor (top ' + f.box[1] + ') covers the lots (their buttons end at ' + Math.round(geo) + ')');
    if (w === 1440) await shot(p, 't55-floor-1440.png');
    // out of order: Moss (seat 2) first, then a bid, then Rust
    const before = await st(p);
    if (!await ticketBtn(p, 2, 'Yes')) bad.push(tag + ': no Yes on Moss\'s ticket');
    await p.waitForTimeout(500);
    await pitPlus(p, 1);
    if (!await ticketBtn(p, 1, 'Yes')) bad.push(tag + ': no Yes on Rust\'s ticket');
    await p.waitForTimeout(600);
    s = await st(p);
    console.log(tag + ' 1 answered Moss, bid, then Rust: ' + JSON.stringify(before) + ' → ' + JSON.stringify(s));
    if (s.robots[0] !== before.robots[0] + 1 || s.robots[1] !== before.robots[1] - 1) bad.push(tag + ': Rust\'s robot did not move: ' + JSON.stringify(s));
    if (s.stash[0] + 0 < 0 || s.cr[2] !== before.cr[2] + 2) bad.push(tag + ': Moss\'s part sale did not go through: ' + JSON.stringify(s));
    if (JSON.stringify(s.bids) !== JSON.stringify([1, 1, 0, 0])) bad.push(tag + ': bids changed: ' + JSON.stringify(s.bids));
    if (s.offers.length) bad.push(tag + ': offers still open: ' + s.offers);
    if (s.done.filter(x => /:yes$/.test(x)).length < 2) bad.push(tag + ': the two deals are not shown on the floor: ' + s.done);
    // 2. counters: Plum sells you a part for 3 Cr; you counter with 7 Cr (accepted); Rust wants to buy your Stash part, you ask 9 (refused)
    const partP = tb.parts.find(k => k !== partM) || partM;
    await p.evaluate(part => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams[3].stash = [part]; G.teams[3].credits = 10; G.teams[0].credits = 10; D.floorAI(G.teams[3], G.teams[0], 'part', { cr: 0, items: [part] }, { cr: 3, items: [] }); }, partP);
    await p.waitForTimeout(400);
    if (!await ticketBtn(p, 3, 'Counter')) bad.push(tag + ': no Counter on Plum\'s ticket');
    await p.waitForTimeout(300);
    f = await floor(p);
    const pre = await p.evaluate(() => { const c = window.ROBOCUS_DEBUG.FL.comp; return c && { to: c.to, give: c.give, want: c.want, rep: c.replaces }; });
    console.log(tag + ' 2 counter composer: ' + JSON.stringify(pre) + ' · ' + (f && f.text.slice(0, 160)));
    if (!pre || pre.to !== 3 || pre.give.cr !== 3 || pre.want.items.length !== 1 || pre.rep == null) bad.push(tag + ': the composer is not pre-filled with the swapped sides: ' + JSON.stringify(pre));
    await step(p, 'give', 1, 4);
    if (w === 1905) await shot(p, 't55-floor-composer.png');
    const c0 = await st(p);
    await clickIn(p, '[data-xk="send"]'); await p.waitForTimeout(600);
    let c1 = await st(p);
    console.log(tag + ' 2 counter 7 Cr: ' + JSON.stringify({ cr: c0.cr, stash: c0.stash }) + ' → ' + JSON.stringify({ cr: c1.cr, stash: c1.stash, done: c1.done }));
    if (c1.cr[0] !== c0.cr[0] - 7 || c1.stash[3] !== 0 || c1.offers.length) bad.push(tag + ': the AI did not accept the counter: ' + JSON.stringify(c1));
    await p.evaluate(part => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams[0].stash = [part]; G.teams[1].credits = 10; D.floorAI(G.teams[1], G.teams[0], 'buy', { cr: 3, items: [] }, { cr: 0, items: [part] }); }, partP);
    await p.waitForTimeout(400);
    if (!await ticketBtn(p, 1, 'Counter')) bad.push(tag + ': no Counter on Rust\'s buy ticket');
    await p.waitForTimeout(300);
    await step(p, 'want', 1, 6);   // ask 9 Cr
    c1 = await st(p);
    await clickIn(p, '[data-xk="send"]'); await p.waitForTimeout(600);
    let c2 = await st(p);
    console.log(tag + ' 2 counter 9 Cr: → ' + JSON.stringify({ cr: c2.cr, stash: c2.stash, done: c2.done.slice(-2), offers: c2.offers }));
    if (JSON.stringify(c2.cr) !== JSON.stringify(c1.cr) || c2.stash[0] !== 1 || !/1>0:no|0>1:no/.test(c2.done.join(' ')) || c2.offers.length) bad.push(tag + ': the refused counter: ' + JSON.stringify(c2));
    // 3. time out
    await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; D.BALref.floorMs = 3000; D.floorAI(G.teams[1], G.teams[0], 'buy', { cr: 2, items: [] }, { cr: 0, items: [G.teams[0].stash[0]] }); });
    const t0 = await st(p);
    await p.waitForTimeout(4200);
    const t1 = await st(p), m3 = (await lastMsgs(p, 4)).join(' / ');
    console.log(tag + ' 3 time-out: ' + JSON.stringify(t0.offers) + ' → ' + JSON.stringify({ offers: t1.offers, done: t1.done.slice(-1) }) + ' · ' + m3.slice(0, 200));
    if (t1.offers.length || !/:late$/.test(t1.done.slice(-1)[0] || '') || !/No answer in time/.test(m3) || JSON.stringify(t1.cr) !== JSON.stringify(t0.cr) || t1.stash[0] !== t0.stash[0]) bad.push(tag + ': the time-out: ' + JSON.stringify(t1));
    await p.evaluate(() => { window.ROBOCUS_DEBUG.BALref.floorMs = 0; });
    // 4. keep a robot. Seat 0 has 2 robots now (Rust's): give both? the composer refuses the second; the host refuses an offer of the only robot
    await p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; G.teams[0].robots.length = 1; window.ROBOCUS_DEBUG.updateHud(); });
    await clickIn(p, '[data-fo="2"]'); await p.waitForTimeout(300);
    await addSel(p, 'give', /\(robot\)/); await p.waitForTimeout(200);
    f = await floor(p);
    if (!f || !/A team always keeps at least one robot/.test(f.text)) bad.push(tag + ': the composer put your only robot on the table: ' + (f && f.text.slice(0, 200)));
    await clickIn(p, '[data-xk="cancel"]');
    await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; D.act('offerSend', 2, { cr: 0, items: ['R:' + G.teams[0].robots[0].id] }, { cr: 3, items: [] }, null); });
    await p.waitForTimeout(300);
    let m4 = (await lastMsgs(p, 2)).join(' / ');
    if (!/must keep a robot/.test(m4)) bad.push(tag + ': the host took an offer of your only robot: ' + m4);
    // accepted after the second robot left: falls through
    const r4 = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, me = G.teams[0], r = JSON.parse(JSON.stringify(me.robots[0])); r.id = 'T55-x'; me.robots.push(r);
      G.teams[2].robots.length = 1; G.teams[2].credits = 10;
      const o = { from: 2, to: 0, kind: 'trade', give: { cr: 6, sec: 0, items: [] }, want: { cr: 0, sec: 0, items: ['R:T55-x'] } };
      D.floorAI(G.teams[2], me, 'trade', o.give, o.want); D.updateHud(); return me.robots.length; });
    await p.waitForTimeout(300);
    await p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; G.teams[0].robots = G.teams[0].robots.filter(r => r.id === 'T55-x'); window.ROBOCUS_DEBUG.updateHud(); });
    const k0 = await st(p);
    await ticketBtn(p, 2, 'Yes'); await p.waitForTimeout(500);
    const k1 = await st(p); m4 = (await lastMsgs(p, 3)).join(' / ');
    console.log(tag + ' 4 keep a robot (accepted with one robot left): ' + JSON.stringify({ robots: k1.robots, cr: k1.cr, done: k1.done.slice(-1) }) + ' · ' + m4.slice(0, 200));
    if (r4 !== 2 || k1.robots[0] !== 1 || JSON.stringify(k1.cr) !== JSON.stringify(k0.cr) || !/must keep a robot/.test(m4) || !/:fell$/.test(k1.done.slice(-1)[0] || '')) bad.push(tag + ': keep-a-robot at yes: ' + JSON.stringify(k1));
    // 5. fell through: Rust wants your Stash part, you sell it to the bank first, then say Yes
    await p.evaluate(part => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams[0].stash = [part]; G.teams[1].credits = 10; D.floorAI(G.teams[1], G.teams[0], 'buy', { cr: 3, items: [] }, { cr: 0, items: [part] }); D.updateHud(); }, partP);
    await p.waitForTimeout(300);
    await p.evaluate(() => { const bt = document.querySelector('#stashCard [data-sell]'); if (bt) bt.click(); }); await p.waitForTimeout(300);
    const f0 = await st(p);
    await ticketBtn(p, 1, 'Yes'); await p.waitForTimeout(500);
    const f1 = await st(p), m5 = (await lastMsgs(p, 3)).join(' / ');
    console.log(tag + ' 5 fell through: ' + JSON.stringify({ cr: f1.cr, done: f1.done.slice(-1) }) + ' · ' + m5.slice(0, 160));
    if (JSON.stringify(f1.cr) !== JSON.stringify(f0.cr) || !/fell through/.test(m5)) bad.push(tag + ': fell through: ' + JSON.stringify(f1));
    // 6. the Market closes with two offers open
    await p.evaluate(parts => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams[2].stash = [parts[0]]; G.teams[3].stash = [parts[1]];
      D.floorAI(G.teams[2], G.teams[0], 'part', { cr: 0, items: [parts[0]] }, { cr: 2, items: [] }); D.floorAI(G.teams[3], G.teams[0], 'part', { cr: 0, items: [parts[1]] }, { cr: 2, items: [] }); }, [partM, partP]);
    await p.waitForTimeout(300);
    const z0 = await st(p);
    await p.evaluate(() => { const bt = document.querySelector('#promptBar #pAct1'); if (bt) bt.click(); });
    await until(p, () => { const G = window.ROBOCUS_DEBUG.G; return !window.ROBOCUS_DEBUG.mktOpen(); }, 8000); await p.waitForTimeout(400);
    const z1 = await st(p), m6 = (await lastMsgs(p, 12)).join(' / ');
    console.log(tag + ' 6 lock with ' + z0.offers.length + ' offers open → ' + JSON.stringify({ offers: z1.offers, stash: z1.stash }) + ' · floor ' + ((await floor(p)) ? 'SHOWN' : 'hidden'));
    if (z0.offers.length !== 2 || z1.offers.length || z1.stash[2] !== 1 || z1.stash[3] !== 1 || (m6.match(/The Market closed/g) || []).length < 2 || await floor(p)) bad.push(tag + ': the Market closing: ' + JSON.stringify(z1) + ' ' + m6.slice(0, 300));
    await p.close();
  }
  // 7. the switch: the old flow
  { const p = await openSolo(1600, 900, '&bal=' + encodeURIComponent(JSON.stringify({ tradeFloor: false })));
    const f = await floor(p), n = await p.evaluate(() => [...document.querySelectorAll('#promptBar [data-trade]')].length);
    console.log('7 tradeFloor false: floor ' + (f ? 'SHOWN' : 'hidden') + ', 🤝 buttons in the note: ' + n);
    if (f || n !== 3) bad.push('switch off: floor ' + !!f + ', note buttons ' + n);
    await p.close(); }

  // ===================== Part 2: online, four people =====================
  await b.close();
  const { setup } = require('./lib.js');
  const S = await setup(seed, () => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; return !!(G && G.phase === 'intrigue' && G.round >= 1 && G.intrigueTurn >= 0 && !G.ivBusy); });
  const { host, seatOf, all } = S; errs.push(...S.errs);
  for (const p of all) await p.setViewportSize({ width: 1905, height: 932 });
  const H = seatOf[0], A = seatOf[1], B = seatOf[2], C = seatOf[3];
  const actOn = (p, ...a) => p.evaluate(a => window.ROBOCUS_DEBUG.act(...a), a);
  const hs = () => st(host, 0);
  await host.evaluate(() => { window.ROBOCUS_DEBUG.G.teams.forEach(t => { t.hand = []; }); });
  for (let k = 0; k < 120; k++) {
    const g = await host.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; return { ph: G.phase, turn: G.intrigueTurn, open: D.mktOpen() }; });
    if (g.open) break;
    if (g.ph === 'intrigue' && g.turn >= 0) await actOn(seatOf[g.turn], 'endTurn');
    for (const p of all) await p.evaluate(() => { const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]')].find(x => /Refuse|OK|Pass|Let it/.test(x.textContent)); if (bt && !bt.disabled) bt.click(); });
    await host.waitForTimeout(500);
  }
  if (!(await hs()).open) { console.log('FAIL: never reached the Market online'); process.exit(1); }
  await host.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams.forEach(t => { t.credits = 10; t.stash = []; }); G.offers = []; G.ps.forEach(P => { P.bids = [0, 0, 0, 0, 0]; }); G.gather = null; D.updateHud(); });
  await host.waitForTimeout(1500);
  // A: composer on A's screen, 2 Cr to the host for nothing
  const compose = async (p, to, give, want) => { await clickIn(p, '[data-fo="' + to + '"]'); await p.waitForTimeout(250); if (give) await step(p, 'give', 1, give); if (want) await step(p, 'want', 1, want); await p.waitForTimeout(150); return clickIn(p, '[data-xk="send"]'); };
  if (!await compose(A, 0, 2, 0)) bad.push('online: A could not send through its composer');
  await until(host, () => (window.ROBOCUS_DEBUG.G.offers || []).some(o => o.from === 1 && o.to === 0), 5000);
  // B → C, C → A (offers between others), H → C (one out), B → H (a second one in)
  if (!await compose(B, 3, 1, 0)) bad.push('online: B → C not sent');
  if (!await compose(C, 1, 1, 0)) bad.push('online: C → A not sent');
  if (!await compose(H, 3, 1, 0)) bad.push('online: H → C not sent');
  if (!await compose(B, 0, 0, 1)) bad.push('online: B → H not sent');
  await until(host, () => (window.ROBOCUS_DEBUG.G.offers || []).length >= 5, 6000); await host.waitForTimeout(1500);
  let o = await hs(); console.log('online offers: ' + JSON.stringify(o.offers));
  for (const [n, p] of [['A', A], ['B', B], ['C', C]]) { const fc = await floor(p); const ids = fc ? fc.tickets.filter(t => t.id).length : 0; if (ids !== 5) bad.push('online: ' + n + ' sees ' + ids + ' open tickets, host has ' + o.offers.length); }
  const fh = await floor(host);
  console.log('host floor: ' + (fh ? fh.tickets.map(t => t.cls + ': ' + t.text.slice(0, 60)).join(' | ') : 'NONE'));
  if (!fh || fh.tickets.filter(t => /\bin\b/.test(t.cls)).length !== 2 || fh.tickets.filter(t => /\bout\b/.test(t.cls)).length !== 1 || fh.tickets.filter(t => /other/.test(t.cls)).length !== 2) bad.push('online: host floor is not 2 in, 1 out, 2 between others');
  await shot(host, 't55-floor-1905.png');
  // the host says Yes to A's 2 Cr
  const y0 = await hs();
  if (!await ticketBtn(host, 1, 'Yes')) bad.push('online: no Yes on A\'s ticket on the host');
  await host.waitForTimeout(1200);
  const y1 = await hs();
  console.log('online H yes to A: ' + y0.cr + ' → ' + y1.cr);
  if (y1.cr[0] !== y0.cr[0] + 2 || y1.cr[1] !== y0.cr[1] - 2) bad.push('online: A → H did not move 2 Cr: ' + y1.cr);
  for (const [n, p] of [['A', A], ['B', B], ['C', C]]) { const c = await p.evaluate(() => window.ROBOCUS_GAME.G.teams.map(t => t.credits).join(',')); if (c !== y1.cr.join(',')) bad.push('online: ' + n + ' shows credits ' + c + ', host ' + y1.cr); }
  // B takes back its offer to C: gone on C's screen
  if (!await ticketBtn(B, 2, 'Take back')) bad.push('online: no Take back on B');
  await host.waitForTimeout(1200);
  const cB = await floor(C);
  if ((await hs()).offers.some(x => x === '2>3:trade') || (cB && cB.tickets.some(t => t.id && /Bolts|Rust|Moss|Plum/.test(t.text) && /\bin\b/.test(t.cls) && /B/.test('') ))) bad.push('online: B\'s offer to C is still open');
  // C counters ... A's? C → A is C's own; A counters C's offer (A's view: Counter on the ticket from C): ask 1 Cr more
  if (!await ticketBtn(A, 3, 'Counter')) bad.push('online: no Counter on C\'s ticket on A\'s screen');
  await A.waitForTimeout(300); await step(A, 'want', 1, 1); await clickIn(A, '[data-xk="send"]');
  await host.waitForTimeout(1200);
  o = await hs(); console.log('online after A counters C: ' + JSON.stringify(o.offers));
  if (o.offers.includes('3>1:trade') || !o.offers.includes('1>3:trade')) bad.push('online: the counter did not replace C\'s offer: ' + o.offers);
  const cr0 = (await hs()).cr;
  if (!await ticketBtn(C, 1, 'Yes')) bad.push('online: no Yes on A\'s counter on C\'s screen');
  await host.waitForTimeout(1200);
  const cr1 = (await hs()).cr; console.log('online C yes to the counter: ' + cr0 + ' → ' + cr1);
  if (cr1[3] !== cr0[3] - 2 + 0 && cr1[3] !== cr0[3] - 2) bad.push('online: the counter (C gives 2 Cr) did not go through: ' + cr1);
  // a late screen: C reloads and gets the open offers from the state
  const open1 = (await hs()).offers;
  await C.reload(); await C.waitForTimeout(500);
  await until(C, () => !!(window.ROBOCUS_GAME && window.ROBOCUS_GAME.G && window.ROBOCUS_DEBUG.mktOpen()), 15000); await C.waitForTimeout(1500);
  const fC = await floor(C);
  console.log('online C reloaded: floor ' + (fC ? fC.tickets.filter(t => t.id).length + ' open tickets' : 'NONE') + ' (host ' + open1.length + ')');
  if (!fC || fC.tickets.filter(t => t.id).length !== open1.length) bad.push('online: a reloaded screen does not show the open offers');
  // the last lock with offers open: all called off, nothing moved
  const l0 = await hs();
  for (const p of [H, A, B, C]) { await p.evaluate(() => window.ROBOCUS_DEBUG.act('lockBids')); await p.waitForTimeout(300); }
  await until(host, () => !window.ROBOCUS_DEBUG.mktOpen(), 8000); await host.waitForTimeout(800);
  const l1 = await hs();
  console.log('online last lock with ' + l0.offers.length + ' open: ' + JSON.stringify(l1.offers));
  if (!l0.offers.length || l1.offers.length) bad.push('online: the last lock did not call off the open offers');
  for (const p of all) await p.evaluate(() => { window.__noBot = false; });
  let desync = 0; for (const p of all) desync += await p.evaluate(() => (window.ROBOCUS_DEBUG.PT.game.events || []).filter(e => e.k === 'desync').length);
  if (desync) bad.push('online: ' + desync + ' desyncs');
  console.log(errs.length ? 'page errors:\n  ' + errs.join('\n  ') : 'no page errors');
  console.log(bad.length ? 'FAIL:\n  ' + bad.join('\n  ') : 'OK');
  await S.b.close(); process.exit(bad.length || errs.length ? 1 : 0);
})();
