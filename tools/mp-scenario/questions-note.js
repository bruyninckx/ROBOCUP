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
    const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', e => errs.push(w + 'x' + h + ': ' + e.message));
    await PLK.route(p, PL);
    await p.goto(require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href + '?seed=11'); await p.waitForTimeout(800);
    await p.evaluate(() => { window.__noSlide = true; window.__noAuto = true; });
    await p.click('#pAct2'); await p.waitForTimeout(1500);
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
      wait: (document.querySelector('#waitRail .wr-row.move small') || {}).textContent || '' }; });
  const waitQ = async (p, pop) => { for (let t = 0; t < 8000; t += 100) { const n = await note(p); if (pop ? n.pop : n.q && !n.pop && n.bs.length && !n.sent) return n; await p.waitForTimeout(100); } return null; };
  // re: a RegExp on the button's text, or a number: the k-th answer (robots can share a name)
  const click = (p, re) => p.evaluate(src => { const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]')].find(x => typeof src === 'number' ? +x.dataset.rk === src : new RegExp(src).test(x.textContent)); if (!bt) return false; bt.click(); const d = document.querySelector('#promptBar [data-rk].done'); return d && /^✓/.test(d.textContent.trim()) ? 'tick' : 'clicked'; }, typeof re === 'number' ? re : re.source);
  const waitRes = async p => { for (let t = 0; t < 8000; t += 100) { const v = await p.evaluate(() => window.__res); if (v !== undefined) return v; await p.waitForTimeout(100); } return 'TIMEOUT'; };
  const cancel = p => p.evaluate(() => { const R = window.ROBOCUS_DEBUG.RX; if (R.q && !R.q.over) R.q.cancel(); });
  // one question: run `start` (it sets window.__res when the game step is over), check the note, answer with `ans` (a RegExp,
  // or 'cancel'), return { n: the note before the click, after: the note right after the click, res }
  async function ask(p, tag, name, start, ans, o = {}) {
    await p.evaluate(start);
    const n = await waitQ(p, o.pop);
    if (!n) { bad.push(tag + ' ' + name + ': no question in the note'); await cancel(p); return { n: null, res: await waitRes(p) }; }
    await p.waitForTimeout(150); const n2 = await note(p);
    if (o.shot) { await shot(p, tag + '-' + o.shot + '.png'); await noteShot(p, tag + '-' + o.shot + '-note.png'); }
    if (!o.pop) {
      if (!n2.move || !n2.flash) bad.push(tag + ' ' + name + ': the note is not a flashing YOUR MOVE (' + JSON.stringify({ move: n2.move, flash: n2.flash }) + ')');
      if (n2.box) bad.push(tag + ' ' + name + ': the box over the pit is open too');
      if (n2.bs.some(x => x.cut)) bad.push(tag + ' ' + name + ': buttons cut off: ' + n2.bs.filter(x => x.cut).map(x => x.t).join(' | '));
    }
    let after = null;
    if (ans === 'cancel') await cancel(p);
    else if (o.pop) await p.evaluate(src => { const bt = [...document.querySelectorAll('#ivModal button[data-k]')].find(x => new RegExp(src).test(x.textContent)); if (bt) bt.click(); }, ans.source);
    else { const c = await click(p, ans); if (!c) bad.push(tag + ' ' + name + ': no button ' + ans); else if (c !== 'tick') bad.push(tag + ' ' + name + ': no ✓ on the clicked button'); }   // ✓ checked right after the click, in the same moment
    const res = await waitRes(p);
    console.log(tag + ' ' + name + ' → ' + (ans === 'cancel' ? '(closed)' : typeof ans === 'number' ? 'answer #' + ans : ans.source) + ': ' + JSON.stringify(res) + (n2 ? ' · note ' + n2.h + ' px' + (n2.tight ? ' tight' : '') + ', buttons ' + n2.bs.map(x => x.t).join(' | ') : ''));
    return { n: n2, after, res };
  }

  for (const [w, h] of [[1600, 900], [1280, 720]]) {
    const p = await open(w, h), tag = w + 'x' + h;
    // ---- 1. second robot: you have 4 robots (3 to pick from); F: you vs team 1
    const second = () => { const D = window.ROBOCUS_DEBUG, G = D.G, me = G.teams[0]; const F = { teams: [0, 1], robots: [me.robots[0], G.teams[1].robots[0]], sides: [0, 1] };
      D.addSeconds(F).then(() => { window.__res = { n: F.robots.length, second: F.teams[2] === 0 ? F.robots[2].id : null, side: F.sides[2] }; }); };
    for (const [ans, want] of [[/Thumper/, 'robot'], [/^Just one$/, null], ['cancel', null]]) {
      await prep(p, 3);
      const r = await ask(p, tag, 'second robot', second, ans, { shot: ans === 'cancel' || want === null ? null : 'second-robot' });
      if (r.n && !(r.n.bs.length === 4 && /Second robot/.test(r.n.title))) bad.push(tag + ' second robot: the note shows ' + JSON.stringify(r.n.bs.map(x => x.t)) + ' / ' + r.n.title);
      if (want === 'robot' ? !(r.res.n === 3 && r.res.second === 902 && r.res.side === 0) : r.res.n !== 2) bad.push(tag + ' second robot (' + ans + '): ' + JSON.stringify(r.res));
      if (r.n && r.n.wait && !/Second robot/.test(r.n.wait)) bad.push(tag + ' second robot: the waiting list says "' + r.n.wait + '"');
    }
    // ---- 2. Joint Venture: you play it on team 1 (its answer is the AI's own coin)
    const jv = () => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams[0].hand = ['joint_venture']; const c0 = G.teams[0].credits, c1 = G.teams[1].credits;
      D.playScheme(G.teams[0], 'joint_venture', G.teams[1]).then(() => { window.__res = { me: G.teams[0].credits - c0, ai: G.teams[1].credits - c1 }; }); };
    for (const [ans, ok] of [[/^Commit$/, [5, -2]], [/^Defect$/, [2, 0]], ['cancel', [5, -2]]]) {
      await prep(p);
      const r = await ask(p, tag, 'Joint Venture', jv, ans, { shot: ans === 'cancel' ? null : ans.source === '^Commit$' ? 'joint-venture' : null });
      if (!ok.includes(r.res.me)) bad.push(tag + ' Joint Venture (' + ans + '): your credits moved ' + r.res.me + ', want one of ' + ok.join(' / '));
    }
    // ---- 3. Hostile Buyout: team 1 plays it on you (you have 2 robots)
    const hb = () => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams[1].hand = ['hostile_buyout']; const me = G.teams[0], c0 = me.credits, f0 = me.fame, n0 = me.robots.length;
      D.playScheme(G.teams[1], 'hostile_buyout', me).then(() => { window.__res = { cr: me.credits - c0, fame: me.fame - f0, robots: me.robots.length - n0 }; }); };
    for (const [ans, want] of [[/^Sell it/, { cr: 4, fame: 0, robots: -1 }], [/^Refuse/, { cr: 0, fame: -1, robots: 0 }], ['cancel', { cr: 0, fame: -1, robots: 0 }]]) {
      await prep(p, 1);
      const r = await ask(p, tag, 'Hostile Buyout', hb, ans, { shot: ans === 'cancel' ? null : /Sell/.test(ans.source) ? 'hostile-buyout' : null });
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
    const fit = () => { const D = window.ROBOCUS_DEBUG, G = D.G, me = G.teams[0]; G.phase = 'upkeep';
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
      const r = await ask(p, tag, 'upkeep debt (7 robots)', debt, /Thumper/, { pop: true, shot: 'popup-pointer' });
      if (r.n && !(r.n.pop && r.n.box && r.n.move && r.n.flash && /in the middle/.test(r.n.text) && /upkeep/.test(r.n.title))) bad.push(tag + ' debt with 7 robots: the note does not point at the box: ' + JSON.stringify(r.n));
      if (JSON.stringify(r.res.gone) !== '[902]') bad.push(tag + ' debt (7): ' + JSON.stringify(r.res) + ', want robot 902 scrapped');
      const n = await note(p); if (n.pop) bad.push(tag + ' debt (7): the note still points at a closed box'); }
    // ---- 8. Bookie's Friend: one hidden card → an info line with OK in the note; four → a list to read, the box stays, the note points
    const bf = rows => () => { const D = window.ROBOCUS_DEBUG, G = D.G, me = G.teams[0]; me.hand = ['bookie_s_friend'];
      const r0 = G.teams[1].robots[0], r1 = G.teams[2].robots[0];
      G.fight = { teams: [1, 2], robots: [r0, r1], sides: [0, 1] }; r0.faceDown = []; r1.faceDown = [];
      for (let k = 0; k < rows; k++) (k % 2 ? r1 : r0).faceDown.push({ id: 'hostile_buyout', from: 3 });
      D.humanBookiesFriend(0);
      const iv = setInterval(() => { const R = D.RX, box = document.getElementById('ivModal'); if (!(R.q && !R.q.over) && !(box && !box.hidden)) { clearInterval(iv); r0.faceDown = []; r1.faceDown = []; G.fight = null; window.__res = { hand: me.hand.length }; } }, 100); };
    { await prep(p); const r = await ask(p, tag, 'Bookie\'s Friend (1 card)', bf(1), /^OK$/, { shot: 'bookies-friend' });
      if (r.n && !(r.n.bs.length === 1 && /Hidden cards/.test(r.n.text))) bad.push(tag + ' Bookie\'s Friend (1): ' + JSON.stringify(r.n)); }
    { await prep(p); const r = await ask(p, tag, 'Bookie\'s Friend (4 cards)', bf(4), /^OK$/, { pop: true });
      if (r.n && !(r.n.pop && r.n.box && r.n.flash)) bad.push(tag + ' Bookie\'s Friend (4): the note does not point at the box: ' + JSON.stringify(r.n)); }
    // ---- 9. layout: 6 answers and a long text (the most the note takes): every button inside the note, the text scrolls;
    //      each answer gives that button's value, closing it gives the default
    const long = 'The host called a 2v2. ' + 'Your robot may go left or right, or stay, or call for help from the crowd. '.repeat(3);
    const six = k => () => { const D = window.ROBOCUS_DEBUG; D.askBox('🧪 Six answers', long, ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Not now'].map((l, i) => ({ label: l, secondary: i === 5, value: () => 'v' + i })), 0, 'dflt').then(v => { window.__res = v; }); };
    for (const [ans, want] of [[/^Echo$/, 'v4'], [/^Not now$/, 'v5'], ['cancel', 'dflt']]) {
      await prep(p);
      const r = await ask(p, tag, 'six answers', six(), ans, { shot: ans === 'cancel' ? null : /Echo/.test(ans.source) ? 'six-answers' : null });
      if (r.n && r.n.bs.length !== 6) bad.push(tag + ' six answers: ' + r.n.bs.length + ' buttons in the note');
      if (r.res !== want) bad.push(tag + ' six answers (' + ans + '): ' + JSON.stringify(r.res) + ', want ' + want);
    }
    if (await p.evaluate(t => window.ROBOCUS_DEBUG.noteFits(t + t + t, [{}, {}]), long)) bad.push(tag + ' a very long text should stay in the box');
    await p.close();
  }
  console.log(errs.length ? 'PAGE ERRORS:\n' + errs.join('\n') : 'no page errors');
  console.log(bad.length ? 'FAIL\n' + bad.join('\n') : 'OK');
  await b.close();
  process.exit(bad.length || errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
