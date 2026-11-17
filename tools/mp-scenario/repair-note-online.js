// T22: the repair buttons in the YOUR MOVE note on a JOINED screen (host + 3 clients over the local transport, like mp-test).
// The bots play to the first Upkeep and are frozen; the host gives one client seat damage; that client presses the real
// buttons in its note: the repair is made by the host with the same cost as the zone click on the card (also pressed on the
// client), a credit repair costs credits, and a repair that can't be paid is shown disabled.
//   node tools/mp-scenario/repair-note-online.js [seed] [screenshotFolder]
const { setup } = require('./lib.js');
const path = require('path'), fs = require('fs');
(async () => {
  const shots = process.argv[3]; if (shots) fs.mkdirSync(shots, { recursive: true });
  const { b, host, errs, seatOf } = await setup(+process.argv[2] || 7, () => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; if (G && G.phase === 'upkeep') { window.__noAuto = true; return true; } return false; });
  const bad = [];
  const c = await host.evaluate(() => { const G = window.ROBOCUS_DEBUG.G, g = G.gather; return [1, 2, 3].find(s => window.ROBOCUS_GAME.isHuman(s) && !(g && g.done && g.done[s])); });
  if (c == null) { console.log('FAIL: every client seat was already done with Upkeep'); await b.close(); process.exit(1); }
  const cp = seatOf[c]; console.log('client seat ' + c);
  const dmg = (o) => host.evaluate(([c, o]) => { const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[c], r = t.robots[0];
    r.wear = {}; const Z = D.zonesOf(r), w = { parts: {}, ints: {}, lost: [Z.weapon.labels[0]] , lid: 0 }; w.parts[Z.drive.labels[0]] = 0.4; r.wear = w;
    t.rep = { used: {}, free: 0 }; t.exMechs = 0; t.credits = o.cr; const k0 = t.crew[0] || { kind: 'mechanic', uid: 'x' };
    t.crew = []; for (let k = 0; k < o.crew; k++) t.crew.push(Object.assign({}, k0, { uid: 'T22c' + k, kind: 'mechanic' })); D.updateHud(); }, [c, o]);
  const state = zk => host.evaluate(([c, zk]) => { const D = window.ROBOCUS_DEBUG, t = D.G.teams[c], q = D.zonesOf(t.robots[0])[zk];
    return { zone: q.broken ? 'broken' : q.damaged ? 'damaged' : 'ok', acts: D.repairActs(t), cr: t.credits, ex: t.exMechs || 0 }; }, [c, zk]);
  const note = () => cp.evaluate(() => { const el = document.getElementById('promptBar'); return { text: el.innerText.replace(/\s+/g, ' '), bs: [...el.querySelectorAll('[data-rep]')].map(x => ({ v: x.dataset.rep, t: x.textContent.trim(), off: x.disabled })) }; });
  const waitFor = async (f, ms = 8000) => { for (let t = 0; t < ms; t += 200) { if (await f()) return true; await cp.waitForTimeout(200); } return false; };
  const same = (a, b) => a.zone === b.zone && a.acts === b.acts && a.cr === b.cr && a.ex === b.ex;
  const rid = await host.evaluate(c => window.ROBOCUS_DEBUG.G.teams[c].robots[0].id, c);
  // 1. crew repairs: the note button, then the card's zone, from the same start
  await dmg({ crew: 2, cr: 10 }); await waitFor(async () => (await note()).bs.length === 3);
  let n = await note(); console.log('client note: ' + n.bs.map(x => x.t + (x.off ? ' (off)' : '')).join(' | '));
  if (shots) { await cp.screenshot({ path: path.join(shots, 'online-client-1500x900.png') }); await cp.locator('#promptBar').screenshot({ path: path.join(shots, 'online-client-note.png') }); }
  if (n.bs.length !== 3 || !/Body \(broken\)|Weapon \(broken\)/.test(n.bs[0].t)) bad.push('client: buttons ' + n.bs.map(x => x.t).join(' | '));
  let s0 = await state('weapon');
  await cp.evaluate(v => document.querySelector('#promptBar [data-rep="' + v + '"]').click(), rid + ':weapon');
  await cp.waitForTimeout(60); const tick = await note(); if (!/✓/.test(tick.text)) bad.push('client: no ✓ right after the click');
  await waitFor(async () => (await state('weapon')).zone === 'ok'); let s1 = await state('weapon');
  await waitFor(async () => !(await note()).bs.some(x => x.v === rid + ':weapon'));
  n = await note(); console.log('note click: ' + JSON.stringify(s0) + ' → ' + JSON.stringify(s1) + ' · client note now: ' + n.bs.map(x => x.t + (x.off ? ' (off)' : '')).join(' | '));
  if (n.bs.some(x => x.v === rid + ':weapon')) bad.push('client: the repaired zone still has a button');
  if (n.bs.some(x => x.off) && n.bs.every(x => !/can't pay/.test(x.t))) bad.push('client: buttons stay greyed after the host answered');
  if (shots) await cp.locator('#promptBar').screenshot({ path: path.join(shots, 'online-client-after.png') });
  await dmg({ crew: 2, cr: 10 }); await waitFor(async () => (await note()).bs.length === 3); await cp.waitForTimeout(500);
  const pt = await cp.evaluate(([rid, zk]) => { const D = window.ROBOCUS_DEBUG, h = D.hitRegions.find(x => x.kind === 'zone_fix' && String(x.robot.id) === String(rid) && x.zone === zk); return h ? D.worldToScreen(h.x + h.w / 2, h.y + h.h / 2) : null; }, [rid, 'weapon']);
  let c0 = await state('weapon'); if (pt) await cp.mouse.click(pt.x, pt.y); await waitFor(async () => (await state('weapon')).zone === 'ok'); let c1 = await state('weapon');
  console.log('card click: ' + JSON.stringify(c0) + ' → ' + JSON.stringify(c1));
  if (!pt) bad.push('client: no zone on the card to click');
  if (s1.zone !== 'ok' || !same(s0, c0) || !same(s1, c1)) bad.push('client: note and card repairs differ');
  // 2. credits: no crew, 10 Cr
  await dmg({ crew: 0, cr: 10 }); await waitFor(async () => (await note()).bs.length === 3 && (await note()).bs.every(x => /Cr/.test(x.t)));
  n = await note(); console.log('client credits: ' + n.bs.map(x => x.t).join(' | '));
  s0 = await state('drive'); await cp.evaluate(v => document.querySelector('#promptBar [data-rep="' + v + '"]').click(), rid + ':drive');
  await waitFor(async () => (await state('drive')).zone === 'ok'); s1 = await state('drive');
  console.log('credit repair: ' + JSON.stringify(s0) + ' → ' + JSON.stringify(s1));
  if (s1.zone !== 'ok' || s0.cr - s1.cr !== 2) bad.push('client: a credit repair did not cost 2 Cr');
  // 3. can't pay: no crew, 1 Cr
  await dmg({ crew: 0, cr: 1 }); await waitFor(async () => { const m = await note(); return m.bs.length === 3 && m.bs.every(x => x.off); });
  n = await note(); console.log('client can\'t pay: ' + n.bs.map(x => x.t + (x.off ? ' (off)' : '')).join(' | '));
  if (shots) await cp.locator('#promptBar').screenshot({ path: path.join(shots, 'online-client-disabled.png') });
  if (!n.bs.every(x => x.off && /can't pay/.test(x.t))) bad.push('client: unpaid repairs not disabled');
  s0 = await state('body'); await cp.evaluate(rid => window.ROBOCUS_DEBUG.act('repairZone', rid, 'body'), rid); await cp.waitForTimeout(1500); s1 = await state('body');
  if (!same(s0, s1)) bad.push('client: the host made a repair that could not be paid');
  // 4. Done from the note
  await cp.evaluate(() => document.getElementById('pAct1').click());
  const ok = await waitFor(() => host.evaluate(c => { const g = window.ROBOCUS_DEBUG.G.gather; return window.ROBOCUS_DEBUG.G.phase !== 'upkeep' || !!(g && g.done && g.done[c]); }, c));
  if (!ok) bad.push('client: Done → Intrigue did not register');
  if (errs.length) bad.push(errs.length + ' page errors: ' + errs[0]);
  console.log(bad.length ? 'FAIL: ' + bad.join('; ') : 'OK');
  await b.close(); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
