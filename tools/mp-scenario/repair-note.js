// T22 (Kev, 17 Nov: "also add repair options in red box"): the repairs in the YOUR MOVE note in Upkeep, on one screen (solo).
//   1. Kev's case: one broken Body: one button, a click repairs it with the same cost as the card's zone click (state before/after);
//   2. three repairs; 3. six to nine across three robots (two per row, the list scrolls, Done stays visible);
//   4. a repair that costs credits (no actions left); 5. one that can't be paid: shown disabled, a click (and act()) is refused;
//   6. nothing to repair: no buttons, the short text.
// Each at 1600x900 and 1280x720. The joined-client side is in repair-note-online.js.
//   node tools/mp-scenario/repair-note.js [screenshotFolder]
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
    await p.goto(require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href + '?seed=13'); await p.waitForTimeout(800);   // T21: seed 13 (was 11; the sponsor auction uses the dice differently): Wrecker, as before
    await p.evaluate(() => { window.__noSlide = true; window.__noAuto = true; });
    await p.click('#pAct2'); await p.waitForTimeout(1500);
    return p;
  }
  // set my robots (copies of my starter and two rivals' starters) and their damage; dmg: per robot { drive, weapon, body } = 'broken' | a health 0..1
  const setup = (p, dmg, o = {}) => p.evaluate(([dmg, o]) => { const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[0];
    const src = [t.robots[0], G.teams[1].robots[0], G.teams[2].robots[0]];
    t.robots = dmg.map((d, k) => { const r = JSON.parse(JSON.stringify(src[k])); if (k) { r.id = 'T22-' + k; r.uid = 'T22u' + k; } r.wear = {}; return r; });
    t.robots.forEach((r, k) => { const d = dmg[k], Z = D.zonesOf(r), w = { parts: {}, ints: {}, lost: [] };
      for (const zk of ['drive', 'weapon', 'body']) { const v = d[zk]; if (v == null) continue;
        if (zk === 'body') { w.lid = v === 'broken' ? 0 : v; continue; }
        const lab = Z[zk].labels[0]; if (v === 'broken') w.lost.push(lab); else w.parts[lab] = v; }
      r.wear = w; });
    t.rep = { used: {}, free: o.free || 0 }; t.exMechs = 0; t.credits = o.cr != null ? o.cr : 14; t.stash = [];
    if (o.crew != null) { const k0 = t.crew[0]; t.crew = []; for (let k = 0; k < o.crew; k++) t.crew.push(Object.assign({}, k0, { uid: 'c' + k, kind: 'mechanic' })); }
    D.updateHud(); return t.robots.map(r => D.zonesOf(r)).map(Z => Object.values(Z).map(q => q.key + ':' + (q.broken ? 'B' : q.damaged ? 'D' : 'ok')).join(' ')); }, [dmg, o]);
  const note = p => p.evaluate(() => { const el = document.getElementById('promptBar'), r = el.getBoundingClientRect(), rb = el.querySelector('.rep-btns');
    const vis = x => { const q = x.getBoundingClientRect(), c = rb ? rb.getBoundingClientRect() : r; return q.top >= c.top - 1 && q.bottom <= c.bottom + 1; };
    const bs = [...el.querySelectorAll('[data-rep],[data-sfit]')].map(x => ({ v: x.dataset.rep || x.dataset.sfit, t: x.textContent.trim(), off: x.disabled, vis: vis(x), wrapRight: x.getBoundingClientRect().right > r.right + 1 }));
    const done = el.querySelector('#pAct1'), dq = done && done.getBoundingClientRect();
    return { rep: el.classList.contains('repmode'), tight: el.classList.contains('tight'), many: el.classList.contains('many'), text: (el.querySelector('span') || {}).textContent, h: Math.round(r.height),
      bs, scroll: rb ? rb.scrollHeight > rb.clientHeight + 2 : false, doneVis: !!dq && dq.bottom <= r.bottom + 1 && dq.top >= r.top && !done.disabled, doneTxt: done && done.textContent }; });
  const state = (p, ri, zk) => p.evaluate(([ri, zk]) => { const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[0], r = t.robots[ri];
    return { zone: (q => q.broken ? 'broken' : q.damaged ? 'damaged' : 'ok')(D.zonesOf(r)[zk]), acts: D.repairActs(t), cr: t.credits, ex: t.exMechs || 0, free: t.rep.free }; }, [ri, zk]);
  const clickNote = (p, v) => p.evaluate(v => { const bt = document.querySelector('#promptBar [data-rep="' + v + '"]'); if (bt && !bt.disabled) { bt.click(); return true; } return false; }, v);
  // the card's zone click: the hit region the canvas click handler uses
  const clickCard = (p, ri, zk) => p.evaluate(([ri, zk]) => { const D = window.ROBOCUS_DEBUG, r = D.G.teams[0].robots[ri]; const h = D.hitRegions.find(x => x.kind === 'zone_fix' && x.robot.id === r.id && x.zone === zk); if (!h) return null;
    const s = D.worldToScreen(h.x + h.w / 2, h.y + h.h / 2); return s; }, [ri, zk]);
  const idOf = (p, ri) => p.evaluate(ri => window.ROBOCUS_DEBUG.G.teams[0].robots[ri].id, ri);
  const same = (a, b) => a.zone === b.zone && a.acts === b.acts && a.cr === b.cr && a.ex === b.ex;

  for (const [w, h] of [[1600, 900], [1280, 720]]) {
    const p = await open(w, h), tag = w + 'x' + h;
    const ph = await p.evaluate(() => window.ROBOCUS_DEBUG.G.phase); if (ph !== 'upkeep') bad.push(tag + ': not in Upkeep (' + ph + ')');
    // 1. Kev's case: one broken Body
    await setup(p, [{ body: 'broken' }]); await p.waitForTimeout(300);
    let n = await note(p); await shot(p, tag + '-1-kev-broken-body.png'); await noteShot(p, tag + '-1-note.png');
    console.log(tag + ' 1 repair: ' + JSON.stringify({ text: n.text, btns: n.bs.map(x => x.t), done: n.doneVis }));
    if (n.bs.length !== 1 || !/Body \(broken\)/.test(n.bs[0].t) || !/2 actions/.test(n.bs[0].t)) bad.push(tag + ': Kev\'s case: buttons ' + n.bs.map(x => x.t).join(' | '));
    if (!n.doneVis) bad.push(tag + ': Done not visible (1)');
    const id0 = await idOf(p, 0);
    let s0 = await state(p, 0, 'body'); await clickNote(p, id0 + ':body'); await p.waitForTimeout(400); let s1 = await state(p, 0, 'body');
    n = await note(p); await noteShot(p, tag + '-1-after-click.png');
    console.log(tag + ' note click: ' + JSON.stringify(s0) + ' → ' + JSON.stringify(s1) + ' · note: ' + n.text);
    // the same on the card, from the same start
    await setup(p, [{ body: 'broken' }]); await p.waitForTimeout(300);
    const pt = await clickCard(p, 0, 'body'); let c0 = await state(p, 0, 'body'); if (pt) await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(400); let c1 = await state(p, 0, 'body');
    console.log(tag + ' card click: ' + JSON.stringify(c0) + ' → ' + JSON.stringify(c1));
    if (!pt) bad.push(tag + ': no zone hit region on the card');
    if (s1.zone !== 'ok' || !same(s0, c0) || !same(s1, c1)) bad.push(tag + ': note click and card click differ');
    if (!/✓/.test(n.text || '')) bad.push(tag + ': no ✓ line after the repair');
    // 2. three repairs on one robot
    await setup(p, [{ drive: 0.4, weapon: 'broken', body: 0.5 }]); await p.waitForTimeout(300);
    n = await note(p); await shot(p, tag + '-2-three.png'); await noteShot(p, tag + '-2-note.png');
    console.log(tag + ' 3 repairs: ' + JSON.stringify({ tight: n.tight, many: n.many, h: n.h, btns: n.bs.map(x => x.t + (x.vis ? '' : ' (HIDDEN)')) }));
    if (n.bs.length !== 3 || !/Weapon \(broken\)/.test(n.bs[0].t)) bad.push(tag + ': three repairs: ' + n.bs.map(x => x.t).join(' | '));
    if (n.bs.some(x => !x.vis) || !n.doneVis) bad.push(tag + ': three repairs do not all fit');
    // 3. six and nine across three robots
    for (const [k, dm] of [[6, [{ weapon: 'broken', body: 0.5 }, { drive: 'broken', weapon: 0.4 }, { body: 'broken', drive: 0.3 }]], [9, [{ drive: 0.4, weapon: 'broken', body: 0.5 }, { drive: 'broken', weapon: 0.4, body: 'broken' }, { drive: 0.3, weapon: 0.5, body: 'broken' }]]]) {
      await setup(p, dm); await p.waitForTimeout(300);
      n = await note(p); await shot(p, tag + '-3-' + k + '.png'); await noteShot(p, tag + '-3-' + k + '-note.png');
      console.log(tag + ' ' + k + ' repairs: ' + JSON.stringify({ tight: n.tight, many: n.many, scroll: n.scroll, h: n.h, done: n.doneVis, btns: n.bs.map(x => x.t + (x.vis ? '' : ' (scroll)') + (x.off ? ' (off)' : '')) }));
      if (n.bs.length !== k) bad.push(tag + ': ' + k + ' repairs: ' + n.bs.length + ' buttons');
      if (!n.doneVis) bad.push(tag + ': ' + k + ' repairs: Done not visible');
      if (!n.many) bad.push(tag + ': ' + k + ' repairs: not two per row');
      if (n.bs.some(x => x.wrapRight)) bad.push(tag + ': a button sticks out on the right');
      const fb = n.bs.findIndex(x => !/broken/.test(x.t)); if (fb >= 0 && n.bs.slice(fb).some(x => /broken/.test(x.t))) bad.push(tag + ': broken not first');
      if (k === 9) { await p.evaluate(() => { const rb = document.querySelector('#promptBar .rep-btns'); if (rb) rb.scrollTop = 9999; }); await p.waitForTimeout(100); await noteShot(p, tag + '-3-9-scrolled.png'); }
    }
    // 4. costs credits: no crew, no free actions, 14 Cr
    await setup(p, [{ weapon: 'broken', drive: 0.4 }], { crew: 0, cr: 14 }); await p.waitForTimeout(300);
    n = await note(p); await shot(p, tag + '-4-credits.png'); await noteShot(p, tag + '-4-note.png');
    console.log(tag + ' credits: ' + JSON.stringify({ text: n.text, btns: n.bs.map(x => x.t) }));
    if (!n.bs.every(x => /Cr/.test(x.t))) bad.push(tag + ': credit cost not shown');
    const id0b = await idOf(p, 0);
    s0 = await state(p, 0, 'weapon'); await clickNote(p, id0b + ':weapon'); await p.waitForTimeout(400); s1 = await state(p, 0, 'weapon');
    await setup(p, [{ weapon: 'broken', drive: 0.4 }], { crew: 0, cr: 14 }); await p.waitForTimeout(300);
    { const q = await clickCard(p, 0, 'weapon'); c0 = await state(p, 0, 'weapon'); if (q) await p.mouse.click(q.x, q.y); await p.waitForTimeout(400); c1 = await state(p, 0, 'weapon'); }
    console.log(tag + ' paid in credits: note ' + JSON.stringify(s0) + ' → ' + JSON.stringify(s1) + '; card ' + JSON.stringify(c0) + ' → ' + JSON.stringify(c1));
    if (s1.zone !== 'ok' || s0.cr - s1.cr !== 4 || !same(s1, c1)) bad.push(tag + ': credit repair differs from the card');
    // one that exhausts a crew member (2 mechanics, no free action)
    await setup(p, [{ drive: 0.4 }], { crew: 2 }); await p.waitForTimeout(300);
    n = await note(p); console.log(tag + ' crew: ' + n.bs.map(x => x.t).join(' | '));
    if (!/exhausts Mechanic/.test(n.bs[0] && n.bs[0].t)) bad.push(tag + ': the crew that would be exhausted is not named');
    { const id = await idOf(p, 0); s0 = await state(p, 0, 'drive'); await clickNote(p, id + ':drive'); await p.waitForTimeout(400); s1 = await state(p, 0, 'drive');
      console.log(tag + ' crew repair: ' + JSON.stringify(s0) + ' → ' + JSON.stringify(s1)); if (s1.ex !== 1 || s1.zone !== 'ok' || s1.cr !== s0.cr) bad.push(tag + ': crew repair wrong'); }
    // 5. can't pay: no crew, 1 Cr
    await setup(p, [{ weapon: 'broken', drive: 0.4 }], { crew: 0, cr: 1 }); await p.waitForTimeout(300);
    n = await note(p); await shot(p, tag + '-5-disabled.png'); await noteShot(p, tag + '-5-note.png');
    console.log(tag + ' can\'t pay: ' + JSON.stringify(n.bs.map(x => x.t + (x.off ? ' (off)' : ''))));
    if (n.bs.length !== 2 || !n.bs.every(x => x.off && /can't pay/.test(x.t))) bad.push(tag + ': unpaid repairs not shown disabled');
    { const id = await idOf(p, 0); s0 = await state(p, 0, 'weapon');
      const clicked = await clickNote(p, id + ':weapon');
      await p.evaluate(id => window.ROBOCUS_DEBUG.act('repairZone', id, 'weapon'), id); await p.waitForTimeout(400); s1 = await state(p, 0, 'weapon');
      console.log(tag + ' refused: clickable ' + clicked + ', ' + JSON.stringify(s0) + ' → ' + JSON.stringify(s1)); if (clicked || !same(s0, s1)) bad.push(tag + ': an unpaid repair went through'); }
    // 7. a Stash part that fits (Upkeep lets you fit it, as the Stash card's Fit): a button; a click fits it
    await setup(p, [{ body: 0.5 }]);
    const lot = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, t = D.G.teams[0], r = t.robots[0]; const id = Object.keys(D.LOTS).find(k => D.LOTS[k].part && D.canFit(r, D.LOTS[k])); if (id) { t.stash = [id]; D.updateHud(); } return id; });
    await p.waitForTimeout(300); n = await note(p); await noteShot(p, tag + '-7-stash-note.png');
    console.log(tag + ' stash part ' + lot + ': ' + n.bs.map(x => x.t).join(' | '));
    if (!lot || !n.bs.some(x => /^🔩/.test(x.t))) bad.push(tag + ': no Stash fit button');
    else { await p.evaluate(() => { const bt = document.querySelector('#promptBar [data-sfit]'); if (bt) bt.click(); }); await p.waitForTimeout(500);
      // T38 (garage): the button puts the part on the garage bill (+1 Cr); Lock in fits it
      await p.evaluate(() => { const bt = document.getElementById('gLock'); if (bt) bt.click(); }); await p.waitForTimeout(500);
      const st = await p.evaluate(() => ({ stash: window.ROBOCUS_DEBUG.G.teams[0].stash.length, btn: !!document.querySelector('#promptBar [data-sfit]') }));
      console.log(tag + ' after fit: ' + JSON.stringify(st)); if (st.stash !== 0 || st.btn) bad.push(tag + ': the Stash fit from the note did not fit it'); }
    // 6. nothing to repair
    await setup(p, [{}]); await p.waitForTimeout(300);
    n = await note(p); await noteShot(p, tag + '-6-nothing-note.png');
    console.log(tag + ' nothing: ' + JSON.stringify({ rep: n.rep, btns: n.bs.length, text: n.text }));
    if (n.rep || n.bs.length || !n.doneVis) bad.push(tag + ': nothing to repair: not the short note');
    await p.close();
  }
  await b.close();
  if (errs.length) bad.push('page errors: ' + errs.join(' | '));
  console.log(bad.length ? 'FAIL\n' + bad.join('\n') : 'OK');
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
