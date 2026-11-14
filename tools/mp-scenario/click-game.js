// A whole online game played with REAL MOUSE CLICKS on every screen (14 Nov, after the Friday playtest).
// One host + 3 joined tabs (local transport). The test bots only get everyone through the lobby; after that each seat is
// played by clicking what is on its own screen: the buttons, the canvas hit regions, dragging cards from the hand, the
// questions and deal panels. The host tells what the game is waiting for from each seat (seatBusyWith); when a seat can't
// get past a step by clicking, that step is reported as STUCK (with a screenshot) and the seat is skipped so the game goes on.
//   node tools/mp-scenario/click-game.js [seed=5] [maxMinutes=12] [shots=playtests/click-shots]
// Output: per step, how often clicks got each kind of seat (host / joined) past it, every stuck step, page errors,
// fight mismatches, and whether every screen ends on the host's fame.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const seed = +(process.argv[2] || 5), maxMin = +(process.argv[3] || 12), shotDir = process.argv[4] || 'playtests/click-shots';
const rnd = () => Math.random(), pick = a => a[Math.floor(rnd() * a.length)];
// what can be clicked on this screen right now
const collect = () => {
  const D = window.ROBOCUS_DEBUG, out = { modal: null, items: [], cards: [], drops: [] };
  const at = el => { const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return null; const x = r.left + r.width / 2, y = r.top + r.height / 2; if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return null; const top = document.elementFromPoint(x, y); return top && (top === el || el.contains(top) || top.contains(el)) ? { x, y } : null; };
  const lab = el => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28);
  for (const id of ['ivModal', 'dealModal']) {   // a question opens on top of a deal panel
    const m = document.getElementById(id);
    if (m && !m.hidden) {
      out.modal = id; out.title = lab(m.querySelector('h3') || m);
      m.querySelectorAll('button, input[type=checkbox], .dl-chip').forEach(b => { const p = b.disabled ? null : at(b); if (p) out.items.push(Object.assign({ type: b.tagName === 'BUTTON' ? 'btn' : 'in', label: lab(b) || b.type, primary: b.classList.contains('primary'), k: b.dataset.k || '' }, p)); });
      return out;
    }
  }
  const skip = '#netLobby, #netWait, #netPause, #fightView, #logPanel, #topBar, .hand-bar, #awards, .aw-btns';
  document.querySelectorAll('button').forEach(b => { if (b.disabled || b.hidden || b.closest(skip)) return; const p = at(b); if (p) out.items.push(Object.assign({ type: 'btn', label: lab(b), id: b.id || '', bar: !!b.closest('#promptBar') }, p)); });
  const cv = document.getElementById('worldCv');
  for (const r of D.hitRegions) {
    const s = D.worldToScreen(r.x + r.w / 2, r.y + r.h / 2);
    if (s.x < 2 || s.y < 2 || s.x > innerWidth - 2 || s.y > innerHeight - 2 || document.elementFromPoint(s.x, s.y) !== cv) continue;
    const it = { type: 'hit', kind: r.kind, label: r.kind + (r.idx != null ? ' ' + r.idx : '') + (r.team != null ? ' team ' + r.team : '') + (r.zone ? ' ' + r.zone : ''), x: s.x, y: s.y, team: r.team };
    if (r.kind === 'garage' || r.kind === 'bay' || r.kind === 'arena') out.drops.push(it);
    if (r.kind !== 'arena' && r.kind !== 'odds') out.items.push(it);
  }
  document.querySelectorAll('#handStage .hs-card').forEach(c => { const r = c.getBoundingClientRect(); if (r.width > 4) out.cards.push({ x: r.left + r.width / 2, y: r.top + Math.min(40, r.height / 2), label: lab(c.querySelector('.hs-title') || c) }); });
  return out;
};
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
  if (fs.existsSync('vendor/planck-1.4.3.min.js')) await ctx.route(/^https?:/, r => r.abort());
  const errs = [];
  const base = 'file://' + process.cwd().replace(/\\/g, '/') + '/prototypes/tabletop-2.html?net=local&room=C' + seed + '&bot=1';
  const open = async (q, tag) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 3).map(x => x.trim().replace(/\(file:.*?html[^:]*:/, '(:')).join(' < '))); await p.goto(base + q); return p; };
  const host = await open('&host=1&name=Host&autostart=3&seed=' + seed, 'host');
  const pages = [host]; for (let k = 1; k <= 3; k++) pages.push(await open('&name=P' + k, 'P' + k));
  await host.waitForFunction(() => window.ROBOCUS_GAME && window.ROBOCUS_GAME.role === 'host' && window.ROBOCUS_GAME.G, null, { timeout: 30000 });
  await host.waitForTimeout(800);
  for (const p of pages) await p.evaluate(() => { window.__noBot = true; const pin = document.getElementById('handPin'); if (pin && !/✓|on/i.test(pin.className)) pin.click(); });
  const seatOf = {}; for (const p of pages) seatOf[await p.evaluate(() => window.ROBOCUS_GAME.HS)] = p;
  const kind = s => s === 0 ? 'host' : 'joined';
  const stat = {}, stuck = [], tries = {}, t0 = Date.now(); let lastKey = {}, since = {}, shots = 0, firstErr = null;
  const bump = (label, s, what) => { const k = label + ' | ' + kind(s); stat[k] = stat[k] || { ok: 0, stuck: 0 }; stat[k][what]++; };
  const click = async (p, it) => { if (!it) return; await p.mouse.move(it.x, it.y); await p.mouse.down(); await p.mouse.up(); };
  const drag = async (p, a, z) => { if (!a || !z) return; await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move((a.x + z.x) / 2, (a.y + z.y) / 2, { steps: 3 }); await p.mouse.move(z.x, z.y, { steps: 3 }); await p.mouse.up(); };
  for (;;) {
    const st = await host.evaluate(() => { const GM = window.ROBOCUS_GAME, G = GM.G; if (G.over) return null; return { round: G.round, phase: G.phase, stage: G.marketStage || '', busy: [0, 1, 2, 3].map(s => GM.seatBusyWith(s)) }; });
    if (!st) break;
    if (errs.length && !firstErr) {   // the moment of the first page error: what the host's game looked like
      firstErr = await host.evaluate(() => { const G = window.ROBOCUS_GAME.G, F = G.fight, ev = window.ROBOCUS_DEBUG.PT.game.events;
        return { round: G.round, phase: G.phase, fight: F ? { format: F.format, teams: F.teams, sides: F.sides, robots: (F.robots || []).map(r => r ? r.name : null), event: F.event && F.event.kind } : null, log: ev.filter(e => e.k === 'msg' || e.k === 'act').slice(-14).map(e => e.k === 'act' ? 'act seat ' + e.seat + ' ' + e.name : e.text.slice(0, 110)) }; });
      console.log('FIRST PAGE ERROR: ' + errs[0] + '\n' + JSON.stringify(firstErr.fight) + ' round ' + firstErr.round + ' ' + firstErr.phase + '\n  ' + firstErr.log.join('\n  '));
    }
    if (Date.now() - t0 > maxMin * 60000) { console.log('TIME UP in round', st.round, st.phase); break; }
    for (let s = 0; s < 4; s++) {
      const p = seatOf[s], C = await p.evaluate(collect);
      const label = C.modal ? (C.modal === 'dealModal' ? 'deal panel' : 'question') + ': ' + C.title.replace(/[^A-Za-z ?]/g, '').trim().split(' ').slice(0, 4).join(' ') : st.busy[s];
      const key = label ? label + '@' + st.round + st.phase + st.stage : null;
      if (key !== lastKey[s]) { if (lastKey[s] && !lastKey[s].startsWith('!')) bump(lastKey[s].split('@')[0], s, 'ok'); lastKey[s] = key; since[s] = Date.now(); tries[s] = 0; }
      if (!label) continue;
      if (lastKey[s].startsWith('!')) continue;
      tries[s]++;
      if (tries[s] > 60 || Date.now() - since[s] > 30000) {   // clicking doesn't get this seat past the step
        const file = path.join(shotDir, 'stuck-' + (++shots) + '-' + kind(s) + '-' + label.replace(/[^a-z0-9]+/gi, '_').slice(0, 40) + '.png');
        try { fs.mkdirSync(shotDir, { recursive: true }); await p.screenshot({ path: file }); } catch (e) {}
        stuck.push({ seat: s, kind: kind(s), label, round: st.round, phase: st.phase + (st.stage ? '/' + st.stage : ''), canClick: [...new Set(C.items.map(i => i.label))].slice(0, 14), cards: C.cards.length, shot: file });
        bump(label, s, 'stuck'); console.log('STUCK', kind(s), 'seat', s, '·', label, '· round', st.round, st.phase, st.stage);
        lastKey[s] = '!' + key;
        // let the game go on: close its questions, play the step with the test bot's own actions, then skip the seat
        await p.evaluate(() => { for (const id of ['dealModal', 'ivModal']) { const m = document.getElementById(id); if (m && !m.hidden && m._finish) m._finish(); } window.__noBot = false; });
        await p.waitForTimeout(1200); await p.evaluate(() => { window.__noBot = true; });
        await host.evaluate(s => window.ROBOCUS_GAME.skipSeat(s), s);
        continue;
      }
      // choose something to click
      const press = re => C.items.find(i => i.type === 'btn' && re.test(i.label));
      if (C.modal === 'dealModal') { const plus = C.items.filter(i => i.label === '+'); if (plus.length && rnd() < 0.4) await click(p, pick(plus)); else await click(p, C.items.find(i => i.k === (rnd() < 0.7 ? 'lock' : 'no')) || pick(C.items)); continue; }
      if (C.modal) { const bs = C.items.filter(i => i.type === 'btn'), ins = C.items.filter(i => i.type === 'in'); if (ins.length && rnd() < 0.3) await click(p, pick(ins)); else if (bs.length) await click(p, rnd() < 0.7 ? (bs.find(i => i.primary) || pick(bs)) : pick(bs)); continue; }
      if (label === 'intrigue turn') {
        const end = press(/End turn/);
        if (C.cards.length && C.drops.length && tries[s] <= 4 && rnd() < 0.7) { await drag(p, pick(C.cards), pick(C.drops)); continue; }
        if (tries[s] <= 2 && rnd() < 0.3) { const cash = press(/Cash-in/); if (cash && C.cards.length) { await click(p, cash); await p.waitForTimeout(150); const C2 = await p.evaluate(collect); if (C2.cards.length) await click(p, pick(C2.cards)); const done = (await p.evaluate(collect)).items.find(i => /Done cashing/.test(i.label)); if (done) await click(p, done); continue; } }
        if (end) await click(p, end);
        continue;
      }
      const bar = C.items.filter(i => i.bar), hits = C.items.filter(i => i.type === 'hit' && !/garage|bay$/.test(i.kind)), bays = C.items.filter(i => /garage|bay/.test(i.kind || '')), other = C.items.filter(i => i.type === 'btn' && !i.bar);
      const pool = [];
      if (bar.length && rnd() < 0.2 + 0.12 * tries[s]) pool.push(pick(bar));
      else { if (hits.length) pool.push(pick(hits), pick(hits)); if (bays.length) pool.push(pick(bays)); if (other.length) pool.push(pick(other)); if (!pool.length && bar.length) pool.push(pick(bar)); }
      if (pool.length) await click(p, pick(pool));
    }
    // the host's fight screen: skip it, then close it
    if (st.phase === 'fight') await host.evaluate(() => { const v = document.getElementById('fightView'); if (v && !v.hidden) { const sk = v.querySelector('.fv-skip:not([hidden])'); if (sk) sk.click(); const d = v.querySelector('.fv-done:not([hidden])'); if (d) d.click(); } });
    await host.waitForTimeout(60);
  }
  await host.waitForTimeout(1500);
  const H = await host.evaluate(() => { const G = window.ROBOCUS_GAME.G, ev = window.ROBOCUS_DEBUG.PT.game.events, acts = {}; for (const e of ev) if (e.k === 'act' && e.remote) acts[e.name] = (acts[e.name] || 0) + 1; return { over: !!G.over, round: G.round, fame: G.teams.map(t => t.fame), acts, clientTrouble: ev.filter(e => /^client_(desync|error)/.test(e.k)).map(e => e.k + ' seat ' + e.seat + ' ' + (e.msg || e.fid || '')), errs: ev.filter(e => e.k === 'error').map(e => e.msg) }; });
  const cl = []; for (let s = 1; s < 4; s++) cl.push(await seatOf[s].evaluate(() => ({ seat: window.ROBOCUS_GAME.HS, fame: window.ROBOCUS_GAME.G.teams.map(t => t.fame), desyncs: window.ROBOCUS_GAME.desyncs })));
  console.log('\n=== click game, seed ' + seed + ': ' + (H.over ? 'finished' : 'not finished') + ' in round ' + H.round + ', ' + ((Date.now() - t0) / 60000).toFixed(1) + ' min ===');
  console.log('step | seat kind                         clicks got past it   stuck');
  for (const k of Object.keys(stat).sort()) console.log('  ' + k.padEnd(52) + String(stat[k].ok).padStart(4) + String(stat[k].stuck).padStart(10));
  console.log('actions joined players sent by clicking: ' + Object.keys(H.acts).sort().map(k => k + ' ' + H.acts[k]).join(', '));
  if (stuck.length) { console.log('\nSTUCK steps:'); const seen = {}; for (const x of stuck) { const k = x.kind + x.label; seen[k] = (seen[k] || 0) + 1; if (seen[k] > 1) continue; console.log('  ' + x.kind + ' · ' + x.label + ' · round ' + x.round + ' ' + x.phase + ' · could click: ' + (x.canClick.join(', ') || 'nothing') + ' · cards in hand ' + x.cards + ' · ' + x.shot); } }
  const bad = [];
  if (stuck.length) bad.push(stuck.length + ' stuck steps');
  if (errs.length || H.errs.length) bad.push((errs.length + H.errs.length) + ' page errors');
  if (H.clientTrouble.length) bad.push('joined screens reported: ' + [...new Set(H.clientTrouble)].slice(0, 5).join('; '));
  cl.forEach(c => { if (JSON.stringify(c.fame) !== JSON.stringify(H.fame)) bad.push('seat ' + c.seat + ' shows other fame than the host'); if (c.desyncs) bad.push('seat ' + c.seat + ': ' + c.desyncs + ' fights ended differently'); });
  [...new Set(errs.concat(H.errs))].slice(0, 10).forEach(e => console.log('ERROR ' + e));
  console.log(bad.length ? 'FAIL: ' + bad.join('; ') : 'OK');
  await b.close(); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
