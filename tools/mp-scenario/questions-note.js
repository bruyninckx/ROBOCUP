// T20 (17 Nov, Kev: "move into note yes"): the game's questions to one player are asked in the yellow note, not in the box over
// the pit. One screen (solo: you against three AI teams), at 1600x900 and 1280x720. For each question: it lands in the note
// (YOUR MOVE, red flash, every button inside the note), each answer has the same effect on the game as before (state before/after),
// a click shows ✓, and closing it from outside gives the question's default answer (as the box did).
//   1. second robot of a double duel (3 robots to pick from): a robot / Just one / closed: no second robot;
//   2. Joint Venture (you play it on an AI team): Commit / Defect / closed: counts as Commit (its default);
//   3. Hostile Buyout (an AI team plays it on you): Sell it / Refuse / closed: counts as Refuse;
//   4. Tag Team offer (an AI team wants you as ally): Team up / Refuse;
//   5. Tag Team Licence (you pick the ally among 3 teams);
//   6. the Stash's Fit button, a part two robots can take: "On which robot?" / Cancel;
//   7. upkeep debt with 2 robots (note) and with 7 robots (7 answers: stays in the box; the note points at it and flashes);
//   8. Bookie's Friend: 1 hidden card (note, OK) and 4 (a list: stays in the box, the note points at it);
//   9. six answers and a long text (debug askBox): nothing cut off, each answer its own value, closed: the default.
//   node tools/mp-scenario/questions-note.js [screenshotFolder]
const path = require('path'), fs = require('fs');
(async () => {
  const shots = process.argv[2]; if (shots) fs.mkdirSync(shots, { recursive: true });
  const b = await require('./launch.js')(require('playwright'));
  const PLK = require('../planck-local.js'), PL = PLK.find();
  const bad = [], errs = [];
  const shot = (p, n) => shots ? p.screenshot({ path: path.join(shots, n) }) : null;
  const noteShot = (p, n) => shots ? p.locator('#promptBar').screenshot({ path: path.join(shots, n) }) : null;
  async function open(w, h) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', e => errs.push(w + 'x' + h + ': ' + e.message + (process.env.STACK ? ' ' + e.stack : '')));
    await PLK.route(p, PL);
    await p.goto(require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href + '?seed=11'); await p.waitForTimeout(800);
    await p.evaluate(() => { window.__noSlide = true; window.__noAuto = true; });
    await p.click('#pAct2'); await p.waitForTimeout(1500); await p.mouse.move(5, 5);   // T20: off the note (a button that opens under the pointer waits for it to leave)
    return p;
  }
  // the table: 12 Cr and 8 fame each, empty hands (nobody can react, so no reaction window in a solo game), no bots;
  // you (seat 0) get `mine` extra robots (copies of the AI starters), the AI teams keep one ready robot each
  const prep = (p, mine = 0, o = {}) => p.evaluate(([mine, o]) => { const D = window.ROBOCUS_DEBUG, G = D.G;
    G.teams.forEach((t, i) => { t.credits = 12; t.fame = (o.fame || [8, 8, 8, 8])[i]; t.hand = []; t.secBots = 0; t.exSec = 0; t.debt = 0; t.stash = []; t.robots.forEach(r => { r.exhausted = false; }); });
    const me = G.teams[0]; if (!window.__r0) window.__r0 = JSON.stringify(me.robots[0]); me.robots = [JSON.parse(window.__r0)];   // always your own starter first (a sold robot comes back)
    for (let k = 0; k < mine; k++) { const src = G.teams[1 + k % 3].robots[0], r = JSON.parse(JSON.stringify(src)); r.id = 900 + k; r.name = src.name; r.wins = 0; me.robots.push(r); }
    G.nextEvent = null; window.__res = undefined; D.updateHud(); }, [mine, o]);
  const note = p => p.evaluate(() => { const el = document.getElementById('promptBar'), r = el.getBoundingClientRect(), iv = document.getElementById('ivModal');
    const bs = [...el.querySelectorAll('[data-rk]')].map(x => { const q = x.getBoundingClientRect(); return { t: x.textContent.trim(), cut: q.bottom > r.bottom - 1 || q.top < r.top || q.right > r.right + 1 || q.left < r.left - 1, done: x.classList.contains('done') }; });
    return { q: el.classList.contains('qmode'), pop: el.classList.contains('qpop'), move: !el.classList.contains('idle'), flash: el.classList.contains('flash'), tight: el.classList.contains('tight'), sent: el.classList.contains('rx-sent'),
      title: (el.querySelector('.q-t') || {}).textContent || '', text: (el.querySelector('.rx-txt') || {}).textContent || '', bs, h: Math.round(r.height), box: !!(iv && !iv.hidden),
      wait: (document.querySelector('#waitRail .wr-row.move small') || {}).textContent || '', head: (document.getElementById('waitRail') || {}).innerText || '',
      sec: (el.querySelector('.rx-sec') || {}).textContent || '', bar: !!el.querySelector('.rx-bar') }; });
  const waitQ = async (p, pop) => { for (let t = 0; t < 8000; t += 100) { const n = await note(p); if (pop ? n.pop : n.q && !n.pop && n.bs.length && !n.sent) return n; await p.waitForTimeout(100); } return null; };
  // re: a RegExp on the button's text, or a number: the k-th answer (robots can share a name)
  // T20: a question's buttons are inactive for 0.8 s after it lands (a click already on its way must not answer it): wait for them
  const click = async (p, re) => { for (let t = 0; t < 3000; t += 100) { if (await p.evaluate(() => !document.querySelector('#promptBar.qmode [data-rk].arming'))) break; await p.waitForTimeout(100); } return click0(p, re); };
  const click0 = (p, re) => p.evaluate(src => { const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]')].find(x => typeof src === 'number' ? +x.dataset.rk === src : new RegExp(src).test(x.textContent)); if (!bt) return false; bt.click(); const d = document.querySelector('#promptBar [data-rk].done'); return d && /^✓/.test(d.textContent.trim()) ? 'tick' : 'clicked'; }, typeof re === 'number' ? re : re.source);
  const waitRes = async (p, max = 8000) => { for (let t = 0; t < max; t += 100) { const v = await p.evaluate(() => window.__res); if (v !== undefined) return v; await p.waitForTimeout(100); } return 'TIMEOUT'; };
  // close whatever question, box or deal panel is still open (each closes with its default answer), and let it settle
  const clearAll = async p => { for (let i = 0; i < 20; i++) { const open = await p.evaluate(() => { const R = window.ROBOCUS_DEBUG.RX; let any = false;
      if (R.q && !R.q.over) { R.q.cancel(); any = true; }
      for (const id of ['ivModal', 'dealModal']) { const el = document.getElementById(id); if (el && !el.hidden && el._finish) { el._finish(); any = true; } }
      return any; }); if (!open) break; await p.waitForTimeout(300); } await p.evaluate(() => { window.__res = undefined; }); };
  const cancel = p => p.evaluate(() => { const R = window.ROBOCUS_DEBUG.RX; if (R.q && !R.q.over) R.q.cancel(); });
  // one question: run `start` (it sets window.__res when the game step is over), check the note, answer with `ans` (a RegExp,
  // or 'cancel'), return { n: the note before the click, after: the note right after the click, res }
  async function ask(p, tag, name, start, ans, o = {}) {
    await clearAll(p);   // a case that failed must not leave its question open for the next one
    await p.evaluate(start);
    const n = await waitQ(p, o.pop);
    if (!n) { bad.push(tag + ' ' + name + ': no question in the note'); await cancel(p); return { n: null, res: await waitRes(p) }; }
    await p.waitForTimeout(150); const n2 = await note(p);
    if (o.shot) { await shot(p, tag + '-' + o.shot + '.png'); await noteShot(p, tag + '-' + o.shot + '-note.png'); }
    if (!o.pop) {
      if (!n2.move || !n2.flash) bad.push(tag + ' ' + name + ': the note is not a flashing YOUR MOVE (' + JSON.stringify({ move: n2.move, flash: n2.flash }) + ')');
      if (n2.box) bad.push(tag + ' ' + name + ': the box over the pit is open too');
      if (!(n2.bar && /^\d+ s$/.test(n2.sec))) bad.push(tag + ' ' + name + ': countdown ' + JSON.stringify({ bar: n2.bar, sec: n2.sec }) + ', want one (T31: every question is timed)');
      if (n2.bs.some(x => x.cut)) bad.push(tag + ' ' + name + ': buttons cut off: ' + n2.bs.filter(x => x.cut).map(x => x.t).join(' | '));
    }
    if (/NOBODY HAS TO CLICK/i.test(n2.head) || !n2.wait) bad.push(tag + ' ' + name + ': the waiting list does not wait for you: ' + n2.head.replace(/\s+/g, ' ').slice(0, 120));
    let after = null;
    if (ans === 'cancel') await cancel(p);
    else if (ans === 'wait') { /* T20: let the countdown run out */ }
    else if (o.pop) { await p.waitForTimeout(900); await p.evaluate(src => { const bt = [...document.querySelectorAll('#ivModal button[data-k]')].find(x => typeof src === 'number' ? +x.dataset.k === src : new RegExp(src).test(x.textContent)); if (bt) bt.click(); }, typeof ans === 'number' ? ans : ans.source); }
    else { const c = await click(p, ans); if (!c) bad.push(tag + ' ' + name + ': no button ' + ans); else if (c !== 'tick') bad.push(tag + ' ' + name + ': no ✓ on the clicked button'); }   // ✓ checked right after the click, in the same moment
    const res = await waitRes(p, ans === 'wait' ? 36000 : 8000);
    console.log(tag + ' ' + name + ' → ' + (ans === 'cancel' ? '(closed)' : ans === 'wait' ? '(no answer, time up)' : typeof ans === 'number' ? 'answer #' + ans : ans.source) + ': ' + JSON.stringify(res) + (n2 ? ' · note ' + n2.h + ' px' + (n2.tight ? ' tight' : '') + ', buttons ' + n2.bs.map(x => x.t).join(' | ') : ''));
    return { n: n2, after, res };
  }

  for (const [w, h] of [[1600, 900], [1280, 720]]) {
    const p = await open(w, h), tag = w + 'x' + h;
    // ---- 1. second robot: you have 4 robots (3 to pick from); F: you vs team 1
    const second = () => { const D = window.ROBOCUS_DEBUG, G = D.G, me = G.teams[0]; const F = { teams: [0, 1], robots: [me.robots[0], G.teams[1].robots[0]], sides: [0, 1] };
      D.addSeconds(F).then(() => { window.__res = { n: F.robots.length, second: F.teams[2] === 0 ? F.robots[2].id : null, side: F.sides[2] }; }); };
    for (const [ans, want] of [[2, 'robot'], [/^Just one$/, null], ['cancel', null]]) {   // answer #2: your third robot (id 902); the names depend on the deal
      await prep(p, 3);
      const r = await ask(p, tag, 'second robot', second, ans, { shot: ans === 'cancel' || want === null ? null : 'second-robot' });
      if (r.n && !(r.n.bs.length === 4 && /Second robot/.test(r.n.title))) bad.push(tag + ' second robot: the note shows ' + JSON.stringify(r.n.bs.map(x => x.t)) + ' / ' + r.n.title);
      if (want === 'robot' ? !(r.res.n === 3 && r.res.second === 902 && r.res.side === 0) : r.res.n !== 2) bad.push(tag + ' second robot (' + ans + '): ' + JSON.stringify(r.res));
      if (r.n && r.n.wait && !/Second robot/.test(r.n.wait)) bad.push(tag + ' second robot: the waiting list says "' + r.n.wait + '"');
    }
    // ---- 2. Joint Venture: you play it on team 1 (its answer is the AI's own coin)
    const jv = () => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams[0].hand = ['joint_venture']; const c0 = G.teams[0].credits, c1 = G.teams[1].credits;
      D.playScheme(G.teams[0], 'joint_venture', G.teams[1]).then(() => { window.__res = { me: G.teams[0].credits - c0, ai: G.teams[1].credits - c1 }; }); };
    for (const [ans, ok] of [[/^Commit$/, [5, -2]], [/^Defect$/, [2, 0]], ['cancel', [2, 0]]].concat(w === 1600 ? [['wait', [2, 0]]] : [])) {   // closed: Defect (T20: never a default that can cost you)
      await prep(p);
      const r = await ask(p, tag, 'Joint Venture', jv, ans, { timed: true, shot: typeof ans === 'string' ? null : ans.source === '^Commit$' ? 'joint-venture' : null });
      if (!ok.includes(r.res.me)) bad.push(tag + ' Joint Venture (' + ans + '): your credits moved ' + r.res.me + ', want one of ' + ok.join(' / '));
    }
    // ---- 3. Hostile Buyout: team 1 plays it on you (you have 2 robots)
    // T45: the price is the weakest robot's value, at least 4 (D.buyPrice); a sale pays that
    const hb = () => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams[1].hand = ['hostile_buyout']; const me = G.teams[0], c0 = me.credits, f0 = me.fame, n0 = me.robots.length;
      D.playScheme(G.teams[1], 'hostile_buyout', me).then(() => { window.__res = { cr: me.credits - c0, fame: me.fame - f0, robots: me.robots.length - n0 }; }); };
    for (const [ans, want0] of [[/^Sell it/, { cr: 'price', fame: 0, robots: -1 }], [/^Refuse/, { cr: 0, fame: -1, robots: 0 }], ['cancel', { cr: 0, fame: -1, robots: 0 }]]) {
      await prep(p, 1);
      const price = await p.evaluate(() => window.ROBOCUS_DEBUG.buyPrice(window.ROBOCUS_DEBUG.G.teams[0])), want = Object.assign({}, want0, want0.cr === 'price' ? { cr: price } : {});
      const r = await ask(p, tag, 'Hostile Buyout', hb, ans, { timed: true, shot: ans === 'cancel' ? null : /Sell/.test(ans.source) ? 'hostile-buyout' : null });
      if (JSON.stringify(r.res) !== JSON.stringify(want)) bad.push(tag + ' Hostile Buyout (' + ans + '): ' + JSON.stringify(r.res) + ', want ' + JSON.stringify(want));
    }
    // ---- 4. Tag Team offer: team 1 plays Tag Team Licence; only you have a ready robot, so it asks you
    const tto = () => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams[1].hand = ['tag_team_licence']; [2, 3].forEach(i => G.teams[i].robots.forEach(r => { r.exhausted = true; })); const f0 = G.teams[0].fame;
      D.playScheme(G.teams[1], 'tag_team_licence', null).then(() => { window.__res = { fame: G.teams[0].fame - f0, tag: G.nextEvent && G.nextEvent.kind === 'tag' ? G.nextEvent.teams.join('+') : null }; }); };
    for (const [ans, want] of [[/^Team up/, { fame: 0, tag: '1+0' }], [/^Refuse/, { fame: -1, tag: null }]]) {
      await prep(p);
      const r = await ask(p, tag, 'Tag Team offer', tto, ans, { shot: /Team/.test(ans.source) ? 'tag-team-offer' : null });
      if (JSON.stringify(r.res) !== JSON.stringify(want)) bad.push(tag + ' Tag Team offer (' + ans + '): ' + JSON.stringify(r.res) + ', want ' + JSON.stringify(want));
    }
    // ---- 5. Tag Team Licence: you pick the ally (team 3 leads, so team 2 says yes)
    const ttl = () => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams[0].hand = ['tag_team_licence'];
      D.playScheme(G.teams[0], 'tag_team_licence', null).then(() => { window.__res = { tag: G.nextEvent && G.nextEvent.kind === 'tag' ? G.nextEvent.teams.join('+') : null }; }); };
    { await prep(p, 0, { fame: [8, 8, 8, 9] });
      const r = await ask(p, tag, 'Tag Team Licence', ttl, new RegExp(await p.evaluate(() => window.ROBOCUS_DEBUG.G.teams[2].name)), { shot: 'tag-team-pick' });
      if (r.n && r.n.bs.length !== 3) bad.push(tag + ' Tag Team Licence: ' + r.n.bs.length + ' buttons, want 3 (the three teams)');
      if (r.res.tag !== '0+2') bad.push(tag + ' Tag Team Licence: ' + JSON.stringify(r.res) + ', want 0+2'); }
    // ---- 6. the Stash's Fit: a part both your robots can take
    // T38: with the garage on, the Stash's Fit in Upkeep goes on the garage bill (tools/mp-scenario/garage.js); the question is still asked
    // in the Market and with BAL.garage.on false: tested here with the garage off
    const fit = () => { const D = window.ROBOCUS_DEBUG, G = D.G, me = G.teams[0]; G.phase = 'upkeep'; D.BAL.garage.on = false;
      const id = Object.keys(D.LOTS).find(k => D.LOTS[k].part && !D.LOTS[k].legendary && me.robots.every(r => D.canFit(r, D.LOTS[k])));
      me.stash = [id]; window.__fitId = id; D.updateHud();
      setTimeout(() => { document.querySelector('#stashCard [data-fit="0"]').click(); }, 50);
      const was = me.robots.map(r => JSON.stringify([r.parts, r.leg]));
      const t0 = Date.now(), iv = setInterval(() => { const on = me.robots.find((r, j) => JSON.stringify([r.parts, r.leg]) !== was[j]);
        if (on || (me.stash.length && Date.now() - t0 > 1500 && !(window.ROBOCUS_DEBUG.RX.q && !window.ROBOCUS_DEBUG.RX.q.over))) { clearInterval(iv); window.__res = { on: on ? on.id : null, stash: me.stash.length }; } }, 100); };
    for (const [ans, want] of [[1, { on: 900, stash: 0 }], [/^Cancel$/, { on: null, stash: 1 }]]) {   // answer #1: your second robot (id 900)
      await prep(p, 1);
      const r = await ask(p, tag, 'Stash fit', fit, ans, { shot: ans === 1 ? 'stash-fit' : null });
      if (r.n && !(/On which robot/.test(r.n.text) && r.n.bs.length === 3)) bad.push(tag + ' Stash fit: the note shows ' + JSON.stringify(r.n.bs.map(x => x.t)));
      if (JSON.stringify(r.res) !== JSON.stringify(want)) bad.push(tag + ' Stash fit (' + ans + '): ' + JSON.stringify(r.res) + ', want ' + JSON.stringify(want));
    }
    await p.evaluate(() => { const D = window.ROBOCUS_DEBUG; D.G.phase = 'upkeep'; D.updateHud(); });
    // ---- 7. upkeep debt: 2 robots → the note; 7 robots → 7 answers, the box stays, the note points at it
    const debt = () => { const D = window.ROBOCUS_DEBUG, G = D.G, me = G.teams[0]; me.debt = 1; const ids = me.robots.map(r => r.id);
      D.settleDebts().then(() => { window.__res = { gone: ids.filter(i => !me.robots.some(r => r.id === i)) }; }); };
    { await prep(p, 1);
      const r = await ask(p, tag, 'upkeep debt (2 robots)', debt, 1, { shot: 'debt-note' });
      if (JSON.stringify(r.res.gone) !== '[900]') bad.push(tag + ' debt: ' + JSON.stringify(r.res) + ', want robot 900 scrapped'); }
    { await prep(p, 6);
      const r = await ask(p, tag, 'upkeep debt (7 robots)', debt, 3, { pop: true, shot: 'popup-pointer' });   // answer #3: robot 902
      if (r.n && !(r.n.pop && r.n.box && r.n.move && r.n.flash && /in the middle/.test(r.n.text) && /upkeep/.test(r.n.title))) bad.push(tag + ' debt with 7 robots: the note does not point at the box: ' + JSON.stringify(r.n));
      if (JSON.stringify(r.res.gone) !== '[902]') bad.push(tag + ' debt (7): ' + JSON.stringify(r.res) + ', want robot 902 scrapped');
      const n = await note(p); if (n.pop) bad.push(tag + ' debt (7): the note still points at a closed box'); }
    // ---- 8. Bookie's Friend: one hidden card → an info line with OK in the note; four → a list to read, the box stays, the note points
    const bf = () => { const rows = window.__rows, D = window.ROBOCUS_DEBUG, G = D.G, me = G.teams[0]; me.hand = ['bookie_s_friend'];
      const r0 = G.teams[1].robots[0], r1 = G.teams[2].robots[0];
      G.fight = { teams: [1, 2], robots: [r0, r1], sides: [0, 1] }; r0.faceDown = []; r1.faceDown = [];
      for (let k = 0; k < rows; k++) (k % 2 ? r1 : r0).faceDown.push({ id: 'hostile_buyout', from: 3 });
      D.humanBookiesFriend(0);
      const iv = setInterval(() => { const R = D.RX, box = document.getElementById('ivModal'); if (!(R.q && !R.q.over) && !(box && !box.hidden)) { clearInterval(iv); r0.faceDown = []; r1.faceDown = []; G.fight = null; window.__res = { hand: me.hand.length }; } }, 100); };
    { await prep(p); const r = await ask(p, tag, 'Bookie\'s Friend (1 card)', (await p.evaluate(() => { window.__rows = 1; }), bf), /^OK$/, { shot: 'bookies-friend' });
      if (r.n && !(r.n.bs.length === 1 && /Hidden cards/.test(r.n.text))) bad.push(tag + ' Bookie\'s Friend (1): ' + JSON.stringify(r.n)); }
    { await prep(p); const r = await ask(p, tag, 'Bookie\'s Friend (4 cards)', (await p.evaluate(() => { window.__rows = 4; }), bf), /^OK$/, { pop: true });
      if (r.n && !(r.n.pop && r.n.box && r.n.flash)) bad.push(tag + ' Bookie\'s Friend (4): the note does not point at the box: ' + JSON.stringify(r.n)); }
    // ---- 9. layout: 6 answers and a long text (the most the note takes): every button inside the note, the text scrolls;
    //      each answer gives that button's value, closing it gives the default
    const long = 'The host called a 2v2. ' + 'Your robot may go left or right, or stay, or call for help from the crowd. '.repeat(3);
    const six = () => { const D = window.ROBOCUS_DEBUG; D.askBox('🧪 Six answers', window.__long, ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Not now'].map((l, i) => ({ label: l, secondary: i === 5, value: () => 'v' + i })), 20000, 'dflt').then(v => { window.__res = v; }); };   // T31: 20 s as askSeat gives it
    for (const [ans, want] of [[/^Echo$/, 'v4'], [/^Not now$/, 'v5'], ['cancel', 'dflt']]) {
      await prep(p); await p.evaluate(t => { window.__long = t; }, long);
      const r = await ask(p, tag, 'six answers', six, ans, { shot: ans === 'cancel' ? null : /Echo/.test(ans.source) ? 'six-answers' : null });
      if (r.n && r.n.bs.length !== 6) bad.push(tag + ' six answers: ' + r.n.bs.length + ' buttons in the note');
      if (r.res !== want) bad.push(tag + ' six answers (' + ans + '): ' + JSON.stringify(r.res) + ', want ' + want);
    }
    if (await p.evaluate(t => window.ROBOCUS_DEBUG.noteFits(t + t + t, [{}, {}]), long)) bad.push(tag + ' a very long text should stay in the box');
    // ---- 10. an AI team's robot offer at the start of the Market (Kev's playtest, 17 Nov: a click meant for End turn landed on
    //      Accept 2.3 s later and Snapjaw was in his garage). You have one robot, Rust Rivets three and little use for them.
    //      a) Decline: nothing changes; b) the pointer is where Accept appears: a click at once, and again 1.5 s later without
    //      moving, do nothing; a click within 0.8 s from the code does nothing; after the pointer left and came back, Accept trades.
    const offer = () => { const D = window.ROBOCUS_DEBUG, G = D.G;
      [1, 2, 3].forEach(i => { const T = G.teams[i], r0 = T.robots[0]; T.robots = [r0]; for (let k = 1; k < (i === 1 ? 3 : 2); k++) { const r = JSON.parse(JSON.stringify(r0)); r.id = 700 + 10 * i + k; T.robots.push(r); } });
      G.teams[1].credits = 3;
      const snap = () => G.teams.map(t => t.credits + '/' + t.robots.map(r => r.id).join(','));
      // T26: the open market runs while the Market's bids are open (mktOpen: phase market, stage lots); for the offer the table is
      // put in that step for a moment (with this round's lots, or the next round's), and back where it was afterwards
      window.__before = snap(); const was = { ph: G.phase, ms: G.marketStage, mk: G.market, ma: G.marketAuction, mr: G.marketResolved };
      G.phase = 'market'; G.marketStage = 'lots'; G.marketAuction = null; G.marketResolved = false; if (!(G.market && G.market.length)) G.market = (G.nextMarket || []).slice(0, 4); D.updateHud();
      D.openMarketAI().then(() => { Object.assign(G, { phase: was.ph, marketStage: was.ms, market: was.mk, marketAuction: was.ma, marketResolved: was.mr }); D.updateHud(); window.__res = { before: window.__before, after: snap() }; }); };
    // (T31: only the new offer: right after the Decline case the note can still show that question's ✓ for a moment)
    const tradeNote = () => p.evaluate(() => { const q = window.ROBOCUS_DEBUG.RX.q; if (!q || q.done || q.over) return null; const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]')].find(x => /Accept/.test(x.textContent)), pb = document.getElementById('promptBar');
      if (!bt) return null; const r = bt.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, arming: bt.classList.contains('arming'), text: (pb.querySelector('.rx-txt') || {}).textContent || '' }; });
    { await prep(p); await p.mouse.move(5, 5);
      const r = await ask(p, tag, 'robot offer (Decline)', offer, /^Refuse$/, { shot: 'trade-offer' });
      if (r.n && !/you get .* in your garage/.test(r.n.text)) bad.push(tag + ' robot offer: the note does not say what you give and get: ' + r.n.text);
      if (JSON.stringify(r.res.before) !== JSON.stringify(r.res.after)) bad.push(tag + ' robot offer Decline changed the game: ' + JSON.stringify(r.res)); }
    { await prep(p); await p.mouse.move(5, 5); await p.evaluate(offer);
      let a = null; for (let t = 0; t < 8000 && !a; t += 100) { a = await tradeNote(); if (!a) await p.waitForTimeout(100); }
      if (!a) bad.push(tag + ' robot offer: no Accept in the note');
      else {
        await p.evaluate(() => window.ROBOCUS_DEBUG.RX.q.arm = null);   // start again with the pointer on Accept, as if it opened under it
        await p.mouse.move(a.x, a.y); await p.evaluate(() => window.ROBOCUS_DEBUG.updateHud());
        const early = await p.evaluate(() => { const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]')].find(x => /Accept/.test(x.textContent)); bt.click(); return window.ROBOCUS_DEBUG.RX.q.done ? 'answered' : 'ignored'; });
        await p.mouse.click(a.x, a.y); await p.waitForTimeout(1500); await p.mouse.click(a.x, a.y); await p.waitForTimeout(200);
        const still = await p.evaluate(() => { const q = window.ROBOCUS_DEBUG.RX.q; return q && !q.done && !q.over; });
        const held = await tradeNote();
        console.log(tag + ' robot offer under the pointer: click from the code at once ' + early + '; mouse clicks at once and 1.5 s later: ' + (still ? 'ignored' : 'ANSWERED') + (held && held.arming ? ' (Accept greyed while the pointer stays on it)' : ''));
        if (early !== 'ignored' || !still || !(held && held.arming)) bad.push(tag + ' robot offer: a click already on its way answered it, or Accept is not greyed under the pointer');
        await p.mouse.move(5, 5); await p.waitForTimeout(150); await p.mouse.move(a.x, a.y); await p.waitForTimeout(150); await p.mouse.click(a.x, a.y);
        const res = await waitRes(p);
        const got = res.after && res.before && res.after[0].split('/')[1].split(',').length === 2 && res.after[1].split('/')[1].split(',').length === 2 && +res.after[0].split('/')[0] < 12;   // you: one robot more, fewer credits; Rust Rivets: one robot less
        console.log(tag + ' robot offer → Accept after the pointer moved: ' + JSON.stringify(res));
        if (!got) bad.push(tag + ' robot offer: Accept did not buy the robot: ' + JSON.stringify(res));
      } }
    // ---- 11. T31 (Kev, 20 Nov: "yes, put them all on a timer"): every question counts down and, left alone, takes its safe
    //      default with a ⌛ line in your log. Short clocks here (BAL.askMs 3 s, askBoxMs 4 s, askDealMs 4 s) so the cases run fast;
    //      the screenshots use the real 20 / 30 / 45 s.
    const lastLog = () => p.evaluate(() => window.ROBOCUS_DEBUG.PT.game.events.filter(e => e.k === 'msg').slice(-25).map(e => e.text));
    const lateLine = async (name, re) => { const L = await lastLog(), l = L.filter(x => /^⌛ No answer in time/.test(x) && (!re || re.test(x))).pop();
      if (!l || (re && !re.test(l))) bad.push(tag + ' ' + name + ': no ⌛ line saying what was decided (' + JSON.stringify(L.slice(-3)) + ')'); else console.log(tag + ' ' + name + ' log: ' + l); };
    const short = (a = 3000, bx = 4000, dl = 4000) => p.evaluate(([a, bx, dl]) => { const B = window.ROBOCUS_DEBUG.BAL; B.askMs = a; B.askBoxMs = bx; B.askDealMs = dl; }, [a, bx, dl]);
    // real lengths, for the screenshots: a threat, a Tag Team offer, a backing request counting down in the note; the last 5 s; a box and a deal panel with the note pointing at them
    await short(20000, 30000, 45000);
    for (const [nm, start] of [['threat', () => { const D = window.ROBOCUS_DEBUG, G = D.G; D.dealAsk('💰 A threat', '<b>Rust Rivets</b> says it will wreck your Tow cable (Botched Install) unless you give <b>2 Cr</b>.', 0).then(v => { window.__res = v; }); }],
        ['backing-request', () => { const D = window.ROBOCUS_DEBUG; D.dealAsk('🤝 Backing request', '<b>Rust Rivets</b> asks you to back a scheme against <b>Plum Ohms</b> and offers <b>2 Cr</b>.<br>Your 8 fame would count for that one card. They don\'t have to tell you what it is.', 0).then(v => { window.__res = v; }); }],
        ['tag-team-offer', tto]]) {
      await prep(p); await clearAll(p); await p.evaluate(start); const n = await waitQ(p);
      if (!n) { bad.push(tag + ' ' + nm + ': no question'); continue; }
      await p.waitForTimeout(1200); const n2 = await note(p);
      if (!(n2.bar && /^\d+ s$/.test(n2.sec) && +n2.sec.split(' ')[0] >= 17)) bad.push(tag + ' ' + nm + ': no 20 s countdown in the note (' + n2.sec + ')');
      await shot(p, tag + '-t31-' + nm + '.png'); await noteShot(p, tag + '-t31-' + nm + '-note.png');
      console.log(tag + ' ' + nm + ': ' + n2.title + ' · ' + n2.sec + ' · ' + n2.bs.map(x => x.t).join(' | '));
      if (nm === 'threat') {   // the last 5 seconds: red seconds, the bar pulses (q-low)
        await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, q = D.RX.q; q.t0 = D.clkNow() - (q.ms - 4600); });   // 4.6 s left
        await p.waitForTimeout(400); const low = await p.evaluate(() => ({ low: document.getElementById('promptBar').classList.contains('q-low'), sec: (document.querySelector('#promptBar .rx-sec') || {}).textContent, col: document.querySelector('#promptBar .rx-sec') ? getComputedStyle(document.querySelector('#promptBar .rx-sec')).color : null }));
        console.log(tag + ' last 5 s: ' + JSON.stringify(low));
        if (!low.low || !/^[1-5] s$/.test(low.sec)) bad.push(tag + ' last 5 s: not marked ' + JSON.stringify(low));
        await shot(p, tag + '-t31-last5.png'); await noteShot(p, tag + '-t31-last5-note.png');
        const r = await waitRes(p, 8000); if (r !== false) bad.push(tag + ' threat left alone: ' + JSON.stringify(r) + ', want false (not paid)'); else await lateLine('threat', /you did not pay/);
      }
    }
    await clearAll(p);
    { await prep(p, 6); await p.evaluate(debt); const n = await waitQ(p, true); await p.waitForTimeout(1200);   // a box (7 robots) with its countdown; the note shows the same seconds
      const bx = await p.evaluate(() => ({ box: (document.querySelector('#ivModal .iv-clock .rx-sec') || {}).textContent, note: (document.querySelector('#promptBar.qpop .rx-sec') || {}).textContent }));
      console.log(tag + ' box countdown: ' + JSON.stringify(bx));
      if (!n || !/^[23]\d s$/.test(bx.box || '') || bx.box !== bx.note) bad.push(tag + ' box countdown: ' + JSON.stringify(bx) + ', want 30 s counting in the box and the same in the note');
      await shot(p, tag + '-t31-box.png'); await clearAll(p); }
    { await prep(p); await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; D.dealPanel({ title: '🤝 Rust Rivets hesitates', intro: 'Rust Rivets would rather not team up. Make it worth their while?', from: G.teams[1], lock: 'Lock in offer' }, 0).then(v => { window.__res = v; }); });
      await p.waitForTimeout(1500); const dl = await p.evaluate(() => ({ box: (document.querySelector('#dealModal .iv-clock .rx-sec') || {}).textContent, note: (document.querySelector('#promptBar.qpop .rx-sec') || {}).textContent }));
      console.log(tag + ' deal panel countdown: ' + JSON.stringify(dl));
      if (!/^4\d s$/.test(dl.box || '') || dl.box !== dl.note) bad.push(tag + ' deal panel countdown: ' + JSON.stringify(dl) + ', want 45 s in the panel and the same in the note');
      await shot(p, tag + '-t31-deal.png'); await clearAll(p); }
    if (w === 1600) {
      await short();
      const snapAll = () => p.evaluate(() => JSON.stringify(window.ROBOCUS_DEBUG.G.teams.map(t => [t.credits, t.fame, t.robots.map(r => r.id + ':' + JSON.stringify(r.parts || [])), t.stash, t.crew.length, t.hand])));
      // left alone, one by one: the default, the state as it was where the default is "no"
      for (const [nm, mine, start, ok, re] of [
        ['second robot', 3, second, r => r.second === null, /just one robot/],   // (an AI side may add its own second robot)
        ['Tag Team offer', 0, tto, r => r.fame === 0 && r.tag === '1+0', /you team up/],
        ['Tag Team Licence', 0, ttl, r => /^0\+[12]$/.test(r.tag || ''), /is asked/],
        ['Stash fit', 1, fit, r => r.on === null && r.stash === 1, /stays in your Stash/],
        ['upkeep debt', 1, debt, r => r.gone.length === 1, /weakest robot/],
        ['Bookie\'s Friend', 0, bf, r => r.hand === 0, /closed by itself/]]) {
        await prep(p, mine, nm === 'Tag Team Licence' ? { fame: [8, 8, 8, 9] } : {}); if (nm === 'Bookie\'s Friend') await p.evaluate(() => { window.__rows = 1; });
        const before = await snapAll(), t0 = Date.now();
        const r = await ask(p, tag, 'T31 ' + nm, start, 'wait', { timed: true });
        const after = await snapAll(), dt = (Date.now() - t0) / 1000;
        console.log('  ' + nm + ' left alone: ' + dt.toFixed(1) + ' s, state ' + (before === after ? 'unchanged' : 'changed'));
        if (!ok(r.res)) bad.push(tag + ' T31 ' + nm + ' left alone: ' + JSON.stringify(r.res));
        if (/second robot|Bookie/.test(nm) && before !== after) bad.push(tag + ' T31 ' + nm + ' left alone changed the game');
        if (dt < 2.5) bad.push(tag + ' T31 ' + nm + ': closed after ' + dt + ' s, before its time');
        await lateLine(nm, re);
      }
      // the robot offer left alone: refused, nothing changes
      { await prep(p); await p.mouse.move(5, 5); const r = await ask(p, tag, 'T31 robot offer', offer, 'wait', { timed: true });
        if (JSON.stringify(r.res.before) !== JSON.stringify(r.res.after)) bad.push(tag + ' T31 robot offer left alone changed the game: ' + JSON.stringify(r.res)); await lateLine('robot offer', /refused/); }
      // Museum Donation (you play it; 2 crew + 1 robot): the AI's choice, a crew member
      { await prep(p); const r = await ask(p, tag, 'T31 Museum Donation', () => { const D = window.ROBOCUS_DEBUG, G = D.G, me = G.teams[0]; me.hand = ['museum_donation']; const c0 = me.crew.length, r0 = me.robots.length, f0 = me.fame;
          D.playScheme(me, 'museum_donation', me).then(() => { window.__res = { crew: me.crew.length - c0, robots: me.robots.length - r0, fame: me.fame - f0 }; }); }, 'wait', { timed: true });
        if (!(r.res.crew === -1 && r.res.robots === 0)) bad.push(tag + ' T31 Museum Donation left alone: ' + JSON.stringify(r.res) + ', want a crew member donated'); await lateLine('Museum Donation', /crew member/); }
      // hand limit (a box with ticks): the pre-ticked (cheapest) cards are cashed in
      { await prep(p); await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, me = D.G.teams[0]; me.fame = 1; me.hand = Object.keys(D.CARDS).filter(k => !D.CARDS[k].auction).slice(0, 9); const h0 = me.hand.length;
          D.humanHandLimit(me).then(v => { window.__res = { v, cashed: h0 - me.hand.length }; }); });
        const t0 = Date.now(); const r = await waitRes(p, 12000); const dt = (Date.now() - t0) / 1000;
        console.log(tag + ' T31 hand limit left alone (' + dt.toFixed(1) + ' s): ' + JSON.stringify(r));
        if (!(r.v === true && r.cashed > 0) || dt < 3.5) bad.push(tag + ' T31 hand limit left alone: ' + JSON.stringify(r) + ' after ' + dt + ' s'); await lateLine('hand limit', /cashed in/); }
      // a deal panel left alone: No deal, nothing moves
      { await prep(p); const before = await snapAll(); await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; D.dealPanel({ title: '💰 Payoff from Rust Rivets', intro: 'test', from: G.teams[1], give: false, want: true, lock: 'Lock in demand' }, 0).then(v => { window.__res = v; }); });
        const r = await waitRes(p, 10000); if (r !== null || before !== await snapAll()) bad.push(tag + ' T31 deal panel left alone: ' + JSON.stringify(r)); else console.log(tag + ' T31 deal panel left alone: no deal'); await lateLine('deal panel', /no deal/); }
      // the host's own steps (you host): picking the fighters (4 s here) → the two teams with the most fame; spare or scrap (3 s) → spare
      { await prep(p, 0, { fame: [8, 9, 7, 10] }); await clearAll(p);
        const t0 = Date.now(); await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; G.phase = 'arena'; G.host = 0; G.fight = null; G.hostStep = null; G.chooseMyBot = false; G.inviteOffers = []; G.pickTeams = []; D.updateHud(); });
        await p.waitForTimeout(1200); const st = await p.evaluate(() => (document.querySelector('#promptBar .st-clock .rx-sec') || {}).textContent || '');
        if (!/^\d s$/.test(st)) bad.push(tag + ' T31 host picks the fighters: no countdown in the note (' + st + ')');
        let r = null; for (let t = 0; t < 10000 && !r; t += 200) { r = await p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; return G.pickTeams == null ? { fight: G.fight ? G.fight.teams.slice().sort() : null } : null; }); if (!r) await p.waitForTimeout(200); }
        const dt = (Date.now() - t0) / 1000; console.log(tag + ' T31 host picks the fighters left alone (' + dt.toFixed(1) + ' s, note showed ' + st + '): ' + JSON.stringify(r));
        if (!(r && r.fight && r.fight.join() === '1,3') || dt < 3.5) bad.push(tag + ' T31 host picks the fighters: ' + JSON.stringify(r) + ' after ' + dt + ' s, want teams 1 and 3 (most fame)');
        await lateLine('host picks the fighters', /invites/);
        await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; (G.ps || []).forEach(x => { if (x) x.choose = false; }); G.chooseMyBot = false; G.fight = null; G.phase = 'upkeep'; D.updateHud(); }); await clearAll(p); }
      { await prep(p); await clearAll(p);
        await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, L = G.teams[1]; G.phase = 'after'; G.host = 0; G.fight = { teams: [0, 1], robots: [G.teams[0].robots[0], L.robots[0]], sides: [0, 1], loser: { team: 1, robot: L.robots[0] }, fateI: 1, fateN: 1, fateOffers: { spare: [], scrap: [] }, crateQueue: [] };
          G.fateBusy = false; G.awaitingJudgment = true; window.__n1 = L.robots.length; D.updateHud(); });
        const t0 = Date.now(); let r = null; for (let t = 0; t < 10000 && !r; t += 200) { r = await p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; return G.awaitingJudgment ? null : { robots: G.teams[1].robots.length - window.__n1 }; }); if (!r) await p.waitForTimeout(200); }
        const dt = (Date.now() - t0) / 1000; console.log(tag + ' T31 spare or scrap left alone (' + dt.toFixed(1) + ' s): ' + JSON.stringify(r));
        if (!(r && r.robots === 0) || dt < 2.5) bad.push(tag + ' T31 spare or scrap: ' + JSON.stringify(r) + ', want spared after 3 s');
        await lateLine('spare or scrap', /is spared/);
        await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; G.fight = null; G.phase = 'upkeep'; D.updateHud(); }); await clearAll(p); }
      // a second question waits behind the first: its clock starts when it shows (it gets its full 3 s)
      { await prep(p); await clearAll(p); await p.mouse.move(5, 5);   // off the note (a button that opens under the pointer waits for it to leave)
        await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, bs = t => [{ label: 'Yes ' + t, value: () => 'y' + t }, { label: 'No', secondary: true, value: () => 'n' + t }]; window.__q = {};
          D.askSeat(0, '🧪 First', 'one', bs(1), 0, 'd1').then(v => { window.__q.a = [v, performance.now()]; });
          D.askSeat(0, '🧪 Second', 'two', bs(2), 0, 'd2').then(v => { window.__q.b = [v, performance.now()]; }); });
        await p.waitForTimeout(2200); await click(p, /^Yes 1/);
        let q = null; for (let t = 0; t < 10000; t += 200) { q = await p.evaluate(() => window.__q); if (q.b) break; await p.waitForTimeout(200); }
        const gap = q.a && q.b ? (q.b[1] - q.a[1]) / 1000 : -1;
        console.log(tag + ' T31 queued question: first ' + JSON.stringify(q.a && q.a[0]) + ', second ' + JSON.stringify(q.b && q.b[0]) + ' ' + gap.toFixed(1) + ' s after the first');
        if (!(q.a && q.a[0] === 'y1' && q.b && q.b[0] === 'd2' && gap >= 2.7)) bad.push(tag + ' T31 queued question did not get its full time: ' + JSON.stringify(q) + ' gap ' + gap); }
      // a paused game stops the clock (online: a player away; here the host's pause call), seconds show ⏸
      { await prep(p); await clearAll(p);
        await p.evaluate(() => { const D = window.ROBOCUS_DEBUG; window.__t0 = performance.now(); D.askSeat(0, '🧪 Paused', 'wait', [{ label: 'Yes', value: () => 'y' }, { label: 'No', secondary: true, value: () => 'n' }], 0, 'dflt').then(v => { window.__res = [v, performance.now() - window.__t0]; }); });
        await p.waitForTimeout(1000); await p.evaluate(() => window.ROBOCUS_GAME.setPaused([{ seat: 1, name: 'Test' }]));
        await p.waitForTimeout(4000); const mid = await p.evaluate(() => ({ res: window.__res, sec: (document.querySelector('#promptBar .rx-sec') || {}).textContent }));
        if (shots) await noteShot(p, tag + '-t31-paused-note.png');
        await p.evaluate(() => window.ROBOCUS_GAME.setPaused([]));
        const r = await waitRes(p, 8000);
        console.log(tag + ' T31 paused: during the pause ' + JSON.stringify(mid) + ', then ' + JSON.stringify(r));
        if (mid.res !== undefined || !/⏸/.test(mid.sec || '') || !(r[0] === 'dflt' && r[1] > 6500)) bad.push(tag + ' T31 pause: ' + JSON.stringify(mid) + ' then ' + JSON.stringify(r)); }
      await short(20000, 30000, 45000);
    }
    await p.close();
  }
  console.log(errs.length ? 'PAGE ERRORS:\n' + errs.join('\n') : 'no page errors');
  console.log(bad.length ? 'FAIL\n' + bad.join('\n') : 'OK');
  await b.close();
  process.exit(bad.length || errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
