// T38 (Kev, 21 Nov): the garage in Upkeep, on one screen (solo), at 1600x900 and 1280x720. Clicks on the canvas like a person
// (a part, then a socket or the rack) and the note's buttons:
//   1. robot → robot (2 Cr), legendary robot → robot (4 Cr), Stash → robot (1 Cr), robot → Stash (1 Cr): bill lines, total, credits after
//   2. Undo a line, Reset; 3. not enough credits: no Lock, Done disabled; 4. Lock in applies all (state before / after, log lines)
//   5. Done without Lock: Done locks the bill first, then Upkeep is over; 6. a broken Stash part: refused on a robot, repaired with 1
//   action, then it fits; 7. a scrapped robot (host scrap): its parts land in the Stash, the one from the broken zone broken;
//   8. a Stash with 9 parts: the Stash card scrolls inside and the page does not scroll; 9. a player with no parts: no garage bill,
//   Upkeep goes on by itself (0.6 s); a player with parts who touches nothing: goes on by itself after BAL.garage.idleMs; a late Lock is refused.
//   node tools/mp-scenario/garage.js [screenshotFolder]
const path = require('path'), fs = require('fs');
(async () => {
  const shots = process.argv[2]; if (shots) fs.mkdirSync(shots, { recursive: true });
  const b = await require('./launch.js')(require('playwright'));
  const PLK = require('../planck-local.js'), PL = PLK.find();
  const bad = [], errs = [];
  const shot = (p, n) => shots ? p.screenshot({ path: path.join(shots, n) }) : null;
  async function open(w, h, q = '') {
    const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', e => errs.push(w + 'x' + h + ': ' + e.message));
    await PLK.route(p, PL);
    await p.goto(require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href + '?seed=13' + q); await p.waitForTimeout(800);
    await p.evaluate(() => { window.__noSlide = true; window.__noAuto = true; });
    await p.click('#pAct2'); await p.waitForTimeout(1500);
    return p;
  }
  // three robots: Mincer (Tuned... Tow cable, Gun drone), Wrecker (Overdrive + Quantum shield), Thumper (empty); Stash: Weapon overhaul,
  // a broken Medic drone, Reinforced hull; 9 Cr
  const setup = (p, o = {}) => p.evaluate(o => { const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[0];
    const src = [t.robots[0], G.teams[1].robots[0], G.teams[2].robots[0]].slice(0, o.n || 3);
    t.robots = src.map((s, k) => { const r = JSON.parse(JSON.stringify(s)); if (k) { r.id = 'G' + k; r.uid = 'Gu' + k; } delete r.wear; delete r.leg; delete r.rar; r.parts = []; return r; });
    if (!o.bare) { t.robots[0].parts = ['tow', 'gunner']; t.robots[0].rar = { tow: 2 }; if (t.robots[1]) { t.robots[1].parts = ['overdrive']; t.robots[1].leg = 'quantum'; } if (t.robots[2]) t.robots[2].parts = []; }
    t.stash = o.stash || (o.bare ? [] : ['p_weapon~1', 'p_medic~b', 'p_hull']);
    t.credits = o.cr != null ? o.cr : 9; t.rep = { used: {}, free: o.free || 0 }; t.exMechs = 0;
    D.gdSync(); D.GD.place = {}; D.GD.sel = null; D.GD.msg = ''; D.GD.touched = false; D.GD.t0 = Date.now(); D.GD.autoSent = false; D.updateHud();
    return t.robots.map(r => String(r.id)); }, o);
  const clickHit = async (p, pred) => { const pt = await p.evaluate(src => { const D = window.ROBOCUS_DEBUG, f = eval(src), h = D.hitRegions.slice().reverse().find(f); return h ? D.worldToScreen(h.x + h.w / 2, h.y + h.h / 2) : null; }, pred);
    if (!pt) return false; await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(120); return true; };
  const tok = (p, pred) => clickHit(p, "h => h.kind === 'gx_tok' && " + pred);
  const sock = (p, rid, leg) => clickHit(p, "h => h.kind === 'gx_sock' && h.rid === '" + rid + "' && " + (leg ? 'h.leg' : '!h.leg'));
  const rack = p => clickHit(p, "h => h.kind === 'gx_rack'");
  const plan = p => p.evaluate(() => { const D = window.ROBOCUS_DEBUG, P = D.gdPlan(); return { lines: P.lines.map(l => l.k + ':' + l.from + '>' + l.to + ':' + l.fee), cost: P.cost, err: P.err, msg: D.GD.msg }; });
  const state = p => p.evaluate(() => { const t = window.ROBOCUS_DEBUG.G.teams[0]; return { cr: t.credits, stash: t.stash.slice(), robots: t.robots.map(r => (r.parts || []).join('+') + (r.leg ? '|' + r.leg : '')), phase: window.ROBOCUS_DEBUG.G.phase }; });
  const note = p => p.evaluate(() => { const pb = document.getElementById('promptBar'), d = document.getElementById('pAct1'), l = document.getElementById('gLock'); return { text: pb.innerText.replace(/\s+/g, ' '), done: d ? d.textContent : null, doneOff: d ? d.disabled : null, lock: l ? !l.disabled : null }; });
  const hits = p => p.evaluate(() => window.ROBOCUS_DEBUG.hitRegions.filter(h => /^gx_/.test(h.kind)).map(h => h.kind));
  const log = (p, n) => p.evaluate(n => window.ROBOCUS_DEBUG.PT.game.events.filter(e => e.k === 'msg').slice(-n).map(e => e.text.replace(/<[^>]+>/g, '')), n);
  const want = (c, m) => { if (!c) bad.push(m); };

  for (const [w, h] of [[1600, 900], [1280, 720]]) {
    const p = await open(w, h), tag = w + 'x' + h;
    want((await state(p)).phase === 'upkeep', tag + ': not in Upkeep');
    // 1. the four kinds of move
    let ids = await setup(p); await p.waitForTimeout(250); await shot(p, tag + '-1-garage-3-robots.png');
    const [A, B, C] = ids;
    await tok(p, "h.tok === 'r:" + A + ":0'"); await sock(p, C, false);               // Tow cable Mincer → Thumper: 2
    await tok(p, "h.tok === 'r:" + B + ":1'"); await sock(p, A, true);                // Quantum shield Wrecker → Mincer: 4
    await tok(p, "h.tok === 's:0'"); await sock(p, B, false);                         // Weapon overhaul Stash → Wrecker: 1
    await tok(p, "h.tok === 'r:" + A + ":1'"); await rack(p);                         // Gun drone Mincer → Stash: 1
    let P = await plan(p); console.log(tag + ' bill: ' + JSON.stringify(P));
    want(JSON.stringify(P.lines) === JSON.stringify(['tow:' + A + '>' + C + ':2', 'quantum:' + B + '>' + A + ':4', 'weapon:S>' + B + ':1', 'gunner:' + A + '>S:1']) && P.cost === 8, tag + ': bill lines ' + JSON.stringify(P));
    let n = await note(p); console.log(tag + ' note: ' + n.text.slice(0, 160) + ' | done: ' + n.done);
    want(/Bill 8 Cr/.test(n.text) && /after: 1 Cr/.test(n.text) && /Pay 8 Cr/.test(n.done), tag + ': note bill/credits after: ' + n.text.slice(0, 200));
    await shot(p, tag + '-2-draft-bill.png');
    // 2. Undo a line (the ✕ of the legendary line), Reset
    await clickHit(p, "h => h.kind === 'gx_undo' && h.tok === 'r:" + B + ":1'"); P = await plan(p);
    want(P.cost === 4 && P.lines.length === 3, tag + ': undo line → ' + JSON.stringify(P));
    await clickHit(p, "h => h.kind === 'gx_reset'"); P = await plan(p); want(P.cost === 0 && !P.lines.length, tag + ': reset → ' + JSON.stringify(P));
    // 3. not enough credits
    await setup(p, { cr: 1 }); await p.waitForTimeout(150);
    await tok(p, "h.tok === 'r:" + A + ":0'"); await sock(p, C, false); await p.waitForTimeout(150);
    n = await note(p); const hs = await hits(p); console.log(tag + ' short: ' + n.text.slice(0, 120) + ' | done off ' + n.doneOff + ' | lock ' + n.lock);
    want(n.doneOff === true && n.lock === false && !hs.includes('gx_lock') && /you have 1 Cr/.test(n.text), tag + ': not enough credits not blocked');
    await shot(p, tag + '-3-short.png');
    // 4. Lock applies all
    await setup(p); await p.waitForTimeout(150);
    await tok(p, "h.tok === 'r:" + A + ":0'"); await sock(p, C, false);
    await tok(p, "h.tok === 'r:" + B + ":1'"); await sock(p, A, true);
    await tok(p, "h.tok === 's:0'"); await sock(p, B, false);
    let s0 = await state(p); await clickHit(p, "h => h.kind === 'gx_lock'"); await p.waitForTimeout(300); let s1 = await state(p);
    console.log(tag + ' lock: ' + JSON.stringify(s0) + ' → ' + JSON.stringify(s1));
    want(s1.cr === s0.cr - 7 && s1.robots[0] === 'gunner|quantum' && s1.robots[1] === 'overdrive+weapon' && s1.robots[2] === 'tow' && s1.stash.join() === 'p_medic~b,p_hull', tag + ': lock did not apply all');
    const lg = await log(p, 8); want(lg.some(x => /moves (Race-spec )?Tow cable from Mincer to Thumper \(2 Cr\)/.test(x)), tag + ': no log line for the move: ' + lg.join(' / '));
    want(s1.phase === 'upkeep', tag + ': Lock ended Upkeep');
    // 6. broken Stash part: refused, repaired with 1 action, then fits
    await setup(p, { free: 1 }); await p.waitForTimeout(150);
    await tok(p, "h.tok === 's:1'"); await sock(p, C, false); P = await plan(p);
    want(!P.lines.length && /broken/.test(P.msg), tag + ': a broken part was not refused: ' + JSON.stringify(P));
    const fit0 = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, t = D.G.teams[0]; D.act('fitStash', 1, t.stash[1], t.robots[2].id); return t.stash.slice(); });
    want(fit0.includes('p_medic~b'), tag + ': fitStash took a broken part');
    await shot(p, tag + '-4-broken-in-rack.png');
    const pr = await p.evaluate(() => { const b = document.querySelector('#promptBar [data-prep]'); if (!b) return null; b.click(); return b.textContent; }); await p.waitForTimeout(400);
    s1 = await state(p); console.log(tag + ' repair part: button "' + pr + '" → ' + s1.stash.join());
    want(pr && s1.stash[1] === 'p_medic', tag + ': broken part not repaired from the note');
    await p.evaluate(() => { window.ROBOCUS_DEBUG.gdSync(); window.ROBOCUS_DEBUG.GD.sel = null; }); await p.waitForTimeout(150); await tok(p, "h.tok === 's:1'"); await sock(p, C, false); P = await plan(p);
    want(P.lines.length === 1 && P.cost === 1, tag + ': repaired part does not fit: ' + JSON.stringify(P));
    // 8. 9 Stash parts: the card scrolls, the page does not
    await setup(p, { stash: ['p_weapon', 'p_hull', 'p_tow', 'p_gunner~1', 'p_medic~b', 'p_overdrive', 'p_powerkit', 'p_core', 'p_emp~3'] }); await p.waitForTimeout(400);
    const fitS = await p.evaluate(() => { const el = document.getElementById('stashCard'), l = el.querySelector('.st-list'), r = el.getBoundingClientRect(); return { bottom: Math.round(r.bottom), vh: innerHeight, scroll: l ? l.scrollHeight > l.clientHeight : false, rows: el.querySelectorAll('.st-row').length, page: document.scrollingElement.scrollHeight <= innerHeight + 1 }; });
    console.log(tag + ' stash 9: ' + JSON.stringify(fitS)); await shot(p, tag + '-5-stash-9.png');
    want(fitS.rows === 9 && fitS.bottom <= fitS.vh && fitS.page, tag + ': 9-part Stash does not fit');
    // 7. host scrap: parts back, the broken zone's part broken (Body broken: Gun drone broken; Overdrive is Weapon: whole)
    await setup(p); await p.waitForTimeout(150);
    const sc = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[0], r = t.robots[0];
      r.parts = ['overdrive', 'gunner']; r.rar = {}; r.wear = { parts: {}, ints: {}, lost: [], lid: 0 };
      const ph = G.phase, fz = G.fight, host = G.host; G.host = 1; G.fight = { loser: { team: 0, robot: r }, fateOffers: { spare: [], scrap: [] } };
      D.resolveFate(true, null, null); G.fight = fz; G.host = host; G.phase = ph; D.updateHud(); return { stash: t.stash.slice(), robots: t.robots.map(x => x.name) }; });
    console.log(tag + ' host scrap: ' + JSON.stringify(sc));
    want(sc.stash.includes('p_overdrive') && sc.stash.includes('p_gunner~b') && sc.robots.length === 2, tag + ': scrapped parts not back as expected');
    await p.waitForTimeout(300); await shot(p, tag + '-6-scrapped-parts-in-rack.png');
    // 5. Done without Lock: Done locks first, then Upkeep is over
    await setup(p); await p.waitForTimeout(150);
    await tok(p, "h.tok === 's:0'"); await sock(p, C, false); s0 = await state(p);
    await p.evaluate(() => document.getElementById('pAct1').click()); await p.waitForTimeout(800); s1 = await state(p);
    console.log(tag + ' Done with a bill: ' + JSON.stringify(s0) + ' → ' + JSON.stringify(s1));
    want(s1.cr === s0.cr - 1 && s1.robots[2] === 'weapon' && s1.phase !== 'upkeep', tag + ': Done did not lock the bill and go on');
    // a late Lock (Upkeep over) is refused
    const late = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, t = D.G.teams[0], c0 = t.credits; D.act('garageLock', { sig: D.garageSig(t), moves: [['r:' + t.robots[0].id + ':0', 'S']] }); return { c0, c1: t.credits }; });
    const ll = await log(p, 3); want(late.c0 === late.c1 && ll.some(x => /too late/.test(x)), tag + ': late Lock not refused: ' + ll.join(' / '));
    await p.close();
  }
  // 9. seamless: a player with no parts goes on by itself (0.6 s, no garage bill); with parts and no touch: after idleMs
  { const p = await open(1600, 900);
    await setup(p, { n: 1, bare: true }); await p.waitForTimeout(200);
    const hs = await hits(p); want(!hs.includes('gx_lock') && !hs.includes('gx_reset') && !hs.includes('gx_rack'), 'no parts: the garage shows a bill / rack: ' + hs.join());
    await shot(p, '1600x900-7-no-parts.png');
    await p.evaluate(() => { window.__noAuto = false; }); const t0 = Date.now();
    let ok = false; for (let k = 0; k < 20 && !ok; k++) { await p.waitForTimeout(200); ok = (await state(p)).phase !== 'upkeep'; }
    console.log('no parts: Upkeep over by itself after ' + (Date.now() - t0) + ' ms'); want(ok, 'no parts: Upkeep did not go on by itself');
    await p.close(); }
  { const p = await open(1600, 900, '&bal=' + encodeURIComponent(JSON.stringify({ garage: { idleMs: 3000 } })));
    await setup(p, { n: 2, stash: [] }); await p.evaluate(() => { window.__noAuto = false; }); const t0 = Date.now();
    let ph = 'upkeep', seen = null; for (let k = 0; k < 40 && ph === 'upkeep'; k++) { await p.waitForTimeout(200); ph = (await state(p)).phase; if (!seen) { const n = await note(p); if (/by itself in/.test(n.text)) seen = n.text.match(/by itself in \d+ s/)[0]; } }
    const ms = Date.now() - t0; console.log('parts, untouched: ' + (seen || 'no count shown') + '; Upkeep over after ' + ms + ' ms');
    want(ph !== 'upkeep' && ms >= 2000 && seen, 'parts, untouched: did not go on after idleMs');
    // touched: no auto
    await p.close(); }
  { const p = await open(1600, 900, '&bal=' + encodeURIComponent(JSON.stringify({ garage: { idleMs: 2000 } })));
    const ids = await setup(p, { n: 2, stash: [] }); await tok(p, "h.tok === 'r:" + ids[0] + ":0'"); await p.evaluate(() => { window.__noAuto = false; });
    await p.waitForTimeout(3500); const ph = (await state(p)).phase; console.log('parts, touched: still ' + ph + ' after 3.5 s');
    want(ph === 'upkeep', 'parts, touched: went on by itself'); await p.close(); }
  if (errs.length) bad.push(errs.length + ' page errors: ' + errs.slice(0, 3).join(' | '));
  console.log(bad.length ? 'FAIL: ' + bad.join('; ') : 'OK');
  await b.close(); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
