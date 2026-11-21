// T38: the garage on JOINED screens (host + 3 clients over the local transport, like mp-test). The bots play to the first
// Upkeep and are frozen; the host gives one client seat two robots with parts and a Stash with a broken part. That client:
//   1. drafts a move by clicking on its own canvas (the host's state does not change, another client sees nothing);
//   2. locks the bill in: the host checks and applies it, the credits go, the other screens see the move (their copy of the
//      team and a log line "… moves … from … to … (2 Cr)"); the broken flag of the Stash part is the same on every screen;
//   3. a bill the host must refuse: more than the credits; a bill drafted on an old garage (sig); both leave everything as it was;
//   4. presses Done: Upkeep is over for it; a late Lock is refused with a line in its log;
//   5. reloads its page (rejoin): it gets its garage back (the draft is gone, which is fine).
//   node tools/mp-scenario/garage-online.js [seed] [screenshotFolder]
const { setup } = require('./lib.js');
const path = require('path'), fs = require('fs');
(async () => {
  const shots = process.argv[3]; if (shots) fs.mkdirSync(shots, { recursive: true });
  const { b, host, errs, seatOf } = await setup(+process.argv[2] || 7, () => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; if (G && G.phase === 'upkeep') { window.__noAuto = true; return true; } return false; });
  const bad = [], want = (c, m) => { if (!c) bad.push(m); };
  const c = await host.evaluate(() => { const G = window.ROBOCUS_DEBUG.G, g = G.gather; return [1, 2, 3].find(s => window.ROBOCUS_GAME.isHuman(s) && !(g && g.done && g.done[s])); });
  if (c == null) { console.log('FAIL: every client seat was already done with Upkeep'); await b.close(); process.exit(1); }
  const cp = seatOf[c], other = seatOf[[1, 2, 3].find(s => s !== c)]; console.log('client seat ' + c);
  await cp.evaluate(() => { window.__noAuto = true; });
  const ids = await host.evaluate(c => { const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[c], src = [t.robots[0], G.teams[(c + 1) % 4].robots[0]];
    t.robots = src.map((s, k) => { const r = JSON.parse(JSON.stringify(s)); if (k) { r.id = 'GO' + k; r.uid = 'GOu' + k; } delete r.wear; delete r.leg; delete r.rar; r.parts = []; return r; });
    t.robots[0].parts = ['tow', 'gunner']; t.robots[0].leg = 'quantum'; t.stash = ['p_hull', 'p_medic~b']; t.credits = 7; D.updateHud(); return t.robots.map(r => String(r.id)); }, c);
  const hostState = () => host.evaluate(c => { const t = window.ROBOCUS_DEBUG.G.teams[c]; return { cr: t.credits, stash: t.stash.slice(), robots: t.robots.map(r => (r.parts || []).join('+') + (r.leg ? '|' + r.leg : '')), phase: window.ROBOCUS_DEBUG.G.phase }; }, c);
  const seen = p => p.evaluate(c => { const t = window.ROBOCUS_DEBUG.G.teams[c]; return { cr: t.credits, stash: t.stash.slice(), robots: t.robots.map(r => (r.parts || []).join('+') + (r.leg ? '|' + r.leg : '')) }; }, c);
  const waitFor = async (f, ms = 8000) => { for (let t = 0; t < ms; t += 200) { if (await f()) return true; await cp.waitForTimeout(200); } return false; };
  const clickHit = async (p, pred) => { const pt = await p.evaluate(src => { const D = window.ROBOCUS_DEBUG, f = eval(src), h = D.hitRegions.slice().reverse().find(f); return h ? D.worldToScreen(h.x + h.w / 2, h.y + h.h / 2) : null; }, pred);
    if (!pt) return false; await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(150); return true; };
  const logHas = (p, re) => p.evaluate(src => [...document.querySelectorAll('#logPanel *')].some(x => new RegExp(src).test(x.textContent)), re.source);
  const [A, B] = ids;
  await waitFor(async () => JSON.stringify((await seen(cp)).robots) === JSON.stringify(['tow+gunner|quantum', '']));
  await cp.waitForTimeout(600);
  const h0 = await hostState(); console.log('start (host): ' + JSON.stringify(h0));
  want(JSON.stringify((await seen(cp)).stash) === JSON.stringify(['p_hull', 'p_medic~b']), 'client: broken flag of the Stash part not synced');
  // 1. a draft on the client's own canvas: Tow cable A → B (2 Cr), Quantum shield A → B (4 Cr)
  let ok = await clickHit(cp, "h => h.kind === 'gx_tok' && h.tok === 'r:" + A + ":0'") && await clickHit(cp, "h => h.kind === 'gx_sock' && h.rid === '" + B + "' && !h.leg");
  ok = ok && await clickHit(cp, "h => h.kind === 'gx_tok' && h.tok === 'r:" + A + ":2'") && await clickHit(cp, "h => h.kind === 'gx_sock' && h.rid === '" + B + "' && h.leg");
  const P = await cp.evaluate(() => { const P = window.ROBOCUS_DEBUG.gdPlan(); return { lines: P.lines.length, cost: P.cost }; });
  console.log('client draft: ' + JSON.stringify(P)); want(ok && P.lines === 2 && P.cost === 6, 'client: draft not made by clicks: ' + JSON.stringify(P));
  if (shots) await cp.screenshot({ path: path.join(shots, 'online-client-draft.png') });
  await cp.waitForTimeout(800);
  want(JSON.stringify(await hostState()) === JSON.stringify(h0), 'host: changed by a draft');
  want(JSON.stringify((await seen(other)).robots) === JSON.stringify(h0.robots), 'other client: sees a draft');
  // 2. Lock in
  await cp.evaluate(() => document.getElementById('gLock').click());
  ok = await waitFor(async () => (await hostState()).cr === h0.cr - 6);
  const h1 = await hostState(); console.log('after Lock (host): ' + JSON.stringify(h1));
  want(ok && h1.robots[0] === 'gunner' && h1.robots[1] === 'tow|quantum', 'host: the bill was not applied');
  ok = await waitFor(async () => JSON.stringify((await seen(other)).robots) === JSON.stringify(h1.robots) && await logHas(other, /moves .*Tow cable from .* to .* \(2 Cr\)/));
  want(ok, 'other client: the locked move is not shown (team or log line)');
  if (shots) await other.screenshot({ path: path.join(shots, 'online-rival-sees-move.png') });
  // 3. refused bills: too expensive (credits 1), and drafted on an old garage
  const r3 = await cp.evaluate(([B]) => { const D = window.ROBOCUS_DEBUG, t = D.G.teams[D.G.teams.findIndex((x, i) => i === window.ROBOCUS_GAME.HS)];
    D.act('garageLock', { sig: D.garageSig(t), moves: [['r:' + B + ':1', 'S'], ['r:' + B + ':0', 'S'], ['s:0', B]] });   // 1 + 2 + 1 = 4 Cr, it has 1
    D.act('garageLock', { sig: 'old', moves: [['s:0', B]] }); return true; }, [B]);
  await cp.waitForTimeout(1500); const h2 = await hostState();
  want(r3 && JSON.stringify(h2) === JSON.stringify(h1), 'host: a refused bill changed something: ' + JSON.stringify(h2));
  want(await logHas(cp, /Garage bill refused/), 'client: no refusal line in its log');
  // 4. Done, then a late Lock
  await cp.evaluate(() => document.getElementById('pAct1').click());
  ok = await waitFor(() => host.evaluate(c => { const D = window.ROBOCUS_DEBUG, g = D.G.gather; return D.G.phase !== 'upkeep' || !!(g && g.done && g.done[c]); }, c));
  want(ok, 'client: Done did not register');
  await cp.evaluate(([B]) => { const D = window.ROBOCUS_DEBUG, t = D.G.teams[window.ROBOCUS_GAME.HS]; D.act('garageLock', { sig: D.garageSig(t), moves: [['s:0', B]] }); }, [B]);
  await cp.waitForTimeout(1500);
  want(JSON.stringify(await hostState()).replace(/"phase":"[a-z]+"/, '') === JSON.stringify(h1).replace(/"phase":"[a-z]+"/, ''), 'host: a late Lock changed something');
  want(await logHas(cp, /too late/), 'client: no "too late" line');
  // 5. rejoin: reload the page, the garage comes back (robots as the host has them)
  const url = cp.url(); await cp.goto(url); await cp.waitForTimeout(4000);
  const back = await cp.evaluate(c => { const D = window.ROBOCUS_DEBUG; return D && D.G ? D.G.teams[c].robots.map(r => (r.parts || []).join('+') + (r.leg ? '|' + r.leg : '')) : null; }, c);
  console.log('after rejoin: ' + JSON.stringify(back)); want(JSON.stringify(back) === JSON.stringify(h1.robots), 'rejoin: the garage did not come back');
  if (errs.length) bad.push(errs.length + ' page errors: ' + errs.slice(0, 3).join(' | '));
  console.log(bad.length ? 'FAIL: ' + bad.join('; ') : 'OK');
  await b.close(); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
