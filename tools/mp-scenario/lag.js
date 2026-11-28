// T70 (28 Nov, Kev: "the non-host pc had noticeably more sluggish response"): where does the wait go between a click on a
// joined screen and that screen showing the result? One host + N joined tabs in one browser over the local transport, the
// test bots play (or, with --click, the first joined screen is played with real mouse clicks), and every action of a
// joined screen is timed in parts:
//   up    : the joined screen sends it -> the host receives it (the link)
//   host  : the host receives it -> the host sends the first snapshot that has it (run + wait for the send + build)
//   down  : that snapshot leaves the host -> the joined screen receives it (the link)
//   apply : the joined screen parses it and redraws (JSON.parse + applySnap + updateHud)
//   paint : the redraw -> the next frame on screen
//   total : click (or send, for bot actions) -> painted
// Also: the host's snapshot build (snapFor + snapMeta, per player, every time it is built) and its size.
// Options:
//   --clients=N (3)  --seed=S (5)  --minutes=M (4)  --lag=MS (0; added to every message, each way)  --click (real clicks)
//   --http (serve the repo with tools/serve.js, like play-latest, so the bookie's helpers run; default: file://)
//   --out=FILE (the samples, JSON)  --tag=TEXT (a label in the summary)
// Actions that change nothing the joined screen sees are counted but left out of the timings (no snapshot answers them).
'use strict';
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..', '..');
process.chdir(ROOT);
const arg = (k, d) => { const a = process.argv.find(x => x === '--' + k || x.startsWith('--' + k + '=')); return a == null ? d : a.includes('=') ? a.slice(a.indexOf('=') + 1) : true; };
const N = +arg('clients', 3), SEED = +arg('seed', 5), MIN = +arg('minutes', 4), LAG = +arg('lag', 0), CLICK = !!arg('click', false), HTTP = !!arg('http', false);
const OUT = arg('out', ''), TAG = arg('tag', ''), HIDDEN = arg('hidden-host', false) ? 1 : 0, OVR = !!arg('ovr', false);

// injected into every page: the timers (absolute ms, comparable between tabs of one browser) and the artificial link delay
const INSTR = `(() => {
  const LAG = ${LAG};
  if (${HIDDEN} && /[?&]host=1/.test(location.search)) {   // --hidden-host: Chrome's timers in a hidden tab (once a second)
    const si = window.setInterval, st = window.setTimeout;
    window.setInterval = (f, d, ...a) => si(f, Math.max(1000, +d || 0), ...a);
    window.setTimeout = (f, d, ...a) => st(f, Math.max(+d || 0, 1000 - (Date.now() % 1000)), ...a);
  }
  const now = () => performance.timeOrigin + performance.now();
  const R = window.__lag = { acts: [], snaps: [], builds: [], pending: [], sent: 0, clicks: [], noChange: 0, lastClick: null };
  document.addEventListener('pointerdown', () => { R.lastClick = now(); }, true);
  const delayIn = (T, orig) => function (from, d) { if (!LAG) return orig.call(this, from, d); const self = this; setTimeout(() => orig.call(self, from, d), LAG); };
  const paintAfter = f => requestAnimationFrame(() => setTimeout(() => f(now()), 0));
  const poll = setInterval(() => {
    const H = window.ROBOCUS_HOST, C = window.ROBOCUS_CLIENT, GM = window.ROBOCUS_GAME;
    if (H && H.T && H.T.onmsg && GM && !R.wired) {
      R.wired = 'host'; clearInterval(poll);
      const seq = {};
      const on = H.T.onmsg;
      H.T.onmsg = delayIn(H.T, function (from, d) {
        if (!d || d.t !== 'act') return on.call(this, from, d);
        const p = H.players.find(x => x.from === from), s = p ? p.seat : -1;
        R.curAct = { from };
        const before = s >= 0 ? GM.snapFor(s) : null;
        const t0 = now(); seq[from] = (seq[from] || 0) + 1;
        const r = on.call(this, from, d);
        const t1 = now();
        const changed = s >= 0 ? GM.snapFor(s) !== before : null;
        const D = window.ROBOCUS_DEBUG, bk = !!(D && D.BOOKIE && D.BOOKIE.onres);
        R.acts.push({ from, n: seq[from], name: d.name, t0, t1, changed, bk });
        R.curAct = null;
        return r;
      });
      const snd = H.T.send;
      H.T.send = function (to, d) {
        if (d && d.t === 'snap' && to) { d._seq = seq[to] || 0; d._ht = now(); R.snaps.push({ to, seq: d._seq, at: d._ht, len: d.g.length, meta: JSON.stringify(d.meta).length }); if (R.snaps.length > 20000) R.snaps.splice(0, 10000); }
        if (d && d.t === 'ack' && to) { d._seq = seq[to] || 0; d._ht = now(); }
        return snd.call(this, to, d);
      };
      const sf = GM.snapFor, sm = GM.snapMeta;
      GM.snapFor = function (s) { const t = performance.now(); const g = sf(s); const ms = performance.now() - t; if (!R.curAct) R.builds.push({ r: GM.G ? GM.G.round : 0, ms, len: g ? g.length : 0 }); if (R.builds.length > 40000) R.builds.splice(0, 20000); return g; };
      GM.snapMeta = function (s) { const t = performance.now(); const m = sm(s); const b = R.builds[R.builds.length - 1]; if (b && !R.curAct) b.meta = performance.now() - t; return m; };
    }
    if (C && C.T && C.T.onmsg && GM && window.ROBOCUS_NET && window.ROBOCUS_NET.sendAct && !R.wired) {
      R.wired = 'client'; clearInterval(poll);
      const NET = window.ROBOCUS_NET, sa = NET.sendAct;
      NET.sendAct = function (name, args) {
        const t = now(), G = GM.G;
        R.sent++;
        const click = R.lastClick && t - R.lastClick < 400 ? R.lastClick : null;
        const D = window.ROBOCUS_DEBUG;
        R.pending.push({ n: R.sent, name, send: t, click, ph: G ? G.phase : '', r: G ? G.round : 0, ovr: !!(D && D.OVR && D.OVR.open) });
        R.lastClick = null;
        return sa.apply(this, arguments);
      };
      const on = C.T.onmsg;
      C.T.onmsg = delayIn(C.T, function (from, d) {
        if (!d || (d.t !== 'snap' && d.t !== 'ack') || d._seq == null) return on.call(this, from, d);
        const t0 = now();
        const r = on.call(this, from, d);
        const t1 = now();
        const done = R.pending.filter(a => a.n <= d._seq && !a.recv);
        if (d.t === 'snap') R.snaps.push({ recv: t0, apply: t1 - t0, len: d.g.length });
        for (const a of done) { a.recv = t0; a.hsent = d._ht; a.applied = t1; a.kind = d.t; a.len = d.g ? d.g.length : 0; }
        if (done.length) paintAfter(t => { for (const a of done) a.paint = t; });
        R.pending = R.pending.filter(a => !a.recv);
        R.acts.push(...done);
        return r;
      });
    }
  }, 20);
})();`;

(async () => {
  const pw = require('playwright');
  const b = await require('./launch.js')(pw);
  const ctx = await b.newContext({ viewport: { width: 1500, height: 900 } });
  const PLK = require('../planck-local.js'), PL = PLK.find(); await PLK.route(ctx, PL);
  await ctx.addInitScript(INSTR);
  let srv = null, baseUrl;
  if (HTTP) {
    const port = 8900 + Math.floor(Math.random() * 90);
    srv = require('child_process').spawn(process.execPath, [path.join('tools', 'serve.js'), '--port=' + port], { stdio: ['ignore', 'pipe', 'pipe'] });
    const got = await new Promise(res => { let s = ''; srv.stdout.on('data', x => { s += x; const m = s.match(/127\.0\.0\.1:(\d+)/); if (m) res(+m[1]); }); setTimeout(() => res(port), 4000); });
    baseUrl = 'http://127.0.0.1:' + got + '/prototypes/tabletop-2.html';
  } else baseUrl = require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href;
  const room = 'LAG' + SEED + 'X' + Math.floor(Math.random() * 1e4);
  const base = baseUrl + '?net=local&room=' + room + '&bot=1';
  const errs = [];
  const open = async (q, tag) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(tag + ': ' + e.message)); await p.goto(base + q); return p; };
  const host = await open('&host=1&name=Host&autostart=' + N + '&seed=' + SEED, 'host');
  if (HTTP) await host.evaluate(() => { window.__bookieFull = true; });
  const cl = []; for (let k = 1; k <= N; k++) cl.push(await open('&name=P' + k, 'P' + k));
  const t0 = Date.now();
  let clicks = 0, lastStep = '', stepClicks = 0;
  const KINDS = ['market_plus', 'card_bid', 'bet_card', 'zone_fix', 'sp_plus'];
  for (;;) {
    const st = await host.evaluate(() => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; return !G || !window.ROBOCUS_GAME.role ? 'lobby' : G.over ? 'over' : G.round + ':' + G.phase; }).catch(() => 'gone');
    if (st === 'over' || st === 'gone' || Date.now() - t0 > MIN * 60000) break;
    if (OVR && st !== 'lobby') await cl[0].evaluate(() => { const D = window.ROBOCUS_DEBUG; const G = window.ROBOCUS_GAME.G; if (D.OVR && !D.OVR.open && G && G.phase === 'market') { const lo = D.hitRegions.find(r => r.kind === 'lot_odds' && r.lot && D.LOTS[r.lot]); if (lo) try { D.openOddsOverview(lo.lot); window.__ovrN = (window.__ovrN || 0) + 1; } catch (e) {} } }).catch(() => {});
    await host.evaluate(() => { const v = document.getElementById('fightView'); if (v && !v.hidden) { const s = v.querySelector('.fv-skip:not([hidden])'); if (s) s.click(); const d = v.querySelector('.fv-done:not([hidden])'); if (d) d.click(); } }).catch(() => {});
    if (CLICK && st !== 'lobby') {
      // the first joined screen: real clicks on the board's + buttons, bets and repairs, and the note's main button; the bot does
      // the rest (questions, picks) one step at a time
      const P = cl[0];
      await P.evaluate(() => { window.__noBot = true; });
      const pick = await P.evaluate(K => {
        const D = window.ROBOCUS_DEBUG, GM = window.ROBOCUS_GAME, G = GM.G; if (!G) return null;
        const pb = document.getElementById('promptBar');
        const modal = ['ivModal', 'dealModal'].some(id => { const e = document.getElementById(id); return e && !e.hidden; }) || (D.RX && ((D.RX.q && !D.RX.q.over) || (D.RX.cur && !D.RX.cur.over)));
        if (modal) return { bot: 1 };
        const fv = document.getElementById('fightView'); if (fv && !fv.hidden) return null;
        const step = G.round + ':' + G.phase + ':' + (G.marketStage || '') + ':' + (GM.seatBusyWith(GM.HS) || '');
        const regs = D.hitRegions.filter(r => K.includes(r.kind)).map(r => ({ kind: r.kind, p: D.worldToScreen(r.x + r.w / 2, r.y + r.h / 2) })).filter(r => r.p.x > 10 && r.p.y > 60 && r.p.x < innerWidth - 10 && r.p.y < innerHeight - 10);
        const btn = pb && [...pb.querySelectorAll('button[id^=pAct]')].find(x => !x.disabled && x.offsetParent && /→/.test(x.textContent));
        const bb = btn && btn.getBoundingClientRect();
        return { step, regs, btn: btn ? { id: btn.id, text: btn.textContent.trim().slice(0, 40), x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 } : null, busy: GM.seatBusyWith(GM.HS) };
      }, KINDS).catch(() => null);
      if (pick && pick.step !== lastStep) { lastStep = pick.step; stepClicks = 0; }
      if (pick && pick.bot) { await P.evaluate(() => { window.__noBot = false; }); await P.waitForTimeout(250); await P.evaluate(() => { window.__noBot = true; }); }
      else if (pick && pick.busy && pick.regs.length && stepClicks < 3) { const r = pick.regs[Math.floor(Math.random() * pick.regs.length)]; await P.mouse.click(r.p.x, r.p.y); clicks++; stepClicks++; await P.waitForTimeout(900); }
      else if (pick && pick.busy && pick.btn) { await P.mouse.click(pick.btn.x, pick.btn.y); clicks++; stepClicks = 0; await P.waitForTimeout(900); }
      else if (pick && pick.busy) { await P.evaluate(() => { window.__noBot = false; }); await P.waitForTimeout(250); await P.evaluate(() => { window.__noBot = true; }); }
    }
    await host.waitForTimeout(150);
  }
  // collect
  const H = await host.evaluate(() => window.__lag).catch(() => ({}));
  const ovrN = OVR ? await cl[0].evaluate(() => window.__ovrN || 0).catch(() => 0) : 0;
  const per = [];
  for (const p of cl) per.push(await p.evaluate(() => window.__lag).catch(() => ({})));
  const rounds = await host.evaluate(() => window.ROBOCUS_GAME.G.round).catch(() => '?');
  await b.close(); if (srv) srv.kill();
  const med = a => { const s = a.filter(x => x != null && isFinite(x)).sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : NaN; };
  const p90 = a => { const s = a.filter(x => x != null && isFinite(x)).sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) * 0.9)] : NaN; };
  const f = x => isFinite(x) ? x.toFixed(x < 10 ? 1 : 0) : '-';
  // join the client's view of an act with the host's (the n-th act this screen sent = the n-th act the host got from it)
  const hostActs = H.acts || [];
  const fromOf = per.map((x, i) => i);   // the host keys acts by transport id; match by order of first act instead
  const byFrom = {}; for (const a of hostActs) (byFrom[a.from] = byFrom[a.from] || []).push(a);
  const froms = Object.keys(byFrom);
  const rows = [];
  per.forEach((c, i) => {
    const acts = (c.acts || []).filter(a => a.paint);
    // which host 'from' is this client: the one whose act names match best
    let best = null, bs = -1;
    for (const fr of froms) { const L = byFrom[fr]; let s = 0; for (const a of acts.slice(0, 50)) { const h = L[a.n - 1]; if (h && h.name === a.name) s++; } if (s > bs) { bs = s; best = fr; } }
    const L = best ? byFrom[best] : [];
    for (const a of acts) { const h = L[a.n - 1]; if (!h || h.name !== a.name) continue; if (h.changed === false && a.kind !== 'ack') { continue; }
      rows.push({ ovr: a.ovr, bk: h.bk, cl: i, name: a.name, ph: a.ph, r: a.r, click: a.click, up: h.t0 - a.send, run: h.t1 - h.t0, host: a.hsent - h.t0, down: a.recv - a.hsent, apply: a.applied - a.recv, paint: a.paint - a.applied, total: a.paint - (a.click || a.send), c2s: a.click ? a.send - a.click : null, len: a.len, kind: a.kind, changed: h.changed }); }
  });
  const unchanged = hostActs.filter(a => a.changed === false).length;
  const out = [];
  const line = (lab, R) => out.push([lab.padEnd(28), String(R.length).padStart(4), ...['c2s', 'up', 'run', 'host', 'down', 'apply', 'paint', 'total'].map(k => f(med(R.map(x => x[k]))).padStart(6)), f(p90(R.map(x => x.total))).padStart(6), (f(med(R.map(x => x.len)) / 1000) + 'k').padStart(6)].join(' '));
  out.push('lag.js ' + (TAG ? '[' + TAG + '] ' : '') + 'lag ' + LAG + ' ms each way, ' + N + ' clients, seed ' + SEED + ', ' + (HTTP ? 'http' : 'file') + (CLICK ? ', real clicks on P1' : '') + (HIDDEN ? ', host tab hidden (timers 1/s)' : '') + (OVR ? ', odds overview open on P1' : '') + ', reached round ' + rounds + ', ' + ((Date.now() - t0) / 60000).toFixed(1) + ' min');
  out.push(['what'.padEnd(28), '   n', '   c2s', '    up', '   run', '  host', '  down', ' apply', ' paint', ' total', '   p90', '  size'].join(' ') + '   (medians, ms)');
  line('all actions', rows);
  const clickRows = rows.filter(x => x.click); if (clickRows.length) line('real clicks', clickRows);
  const groups = {}; for (const x of rows) { const g = /Done|Lock|lock|End|pass|ready/i.test(x.name) ? 'done/lock (' + x.name + ')' : x.name; (groups[g] = groups[g] || []).push(x); }
  for (const g of Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length).slice(0, 14)) line(g, groups[g]);
  const ph = {}; for (const x of rows) (ph['phase ' + x.ph] = ph['phase ' + x.ph] || []).push(x);
  for (const g of Object.keys(ph)) line(g, ph[g]);
  if (rows.some(x => x.bk)) { line('host bookie busy', rows.filter(x => x.bk)); line('host bookie idle', rows.filter(x => !x.bk)); }
  line('rounds 1-2', rows.filter(x => x.r <= 2)); line('rounds 3-5', rows.filter(x => x.r >= 3 && x.r <= 5)); line('rounds 6+', rows.filter(x => x.r >= 6));
  out.push('actions that changed nothing on the host: ' + unchanged + ' of ' + hostActs.length + ' (not timed)');
  const B = (H.builds || []);
  const bl = (lab, L) => out.push('host snapshot build ' + lab + ': ' + L.length + ' builds, median ' + f(med(L.map(x => x.ms + (x.meta || 0)))) + ' ms, p90 ' + f(p90(L.map(x => x.ms + (x.meta || 0)))) + ' ms, median size ' + f(med(L.map(x => x.len)) / 1000) + ' kB');
  bl('rounds 1-2', B.filter(x => x.r <= 2)); bl('rounds 3-5', B.filter(x => x.r >= 3 && x.r <= 5)); bl('rounds 6+', B.filter(x => x.r >= 6));
  const S = (H.snaps || []); out.push('snapshots sent by the host: ' + S.length + ', median ' + f(med(S.map(x => x.len)) / 1000) + ' kB + meta ' + f(med(S.map(x => x.meta)) / 1000) + ' kB');
  const CA = per.flatMap(c => (c.snaps || []).filter(x => x.apply != null)); out.push('joined screens: ' + CA.length + ' snapshots applied, median ' + f(med(CA.map(x => x.apply))) + ' ms, p90 ' + f(p90(CA.map(x => x.apply))) + ' ms');
  if (OVR) { out.push('odds overview opened on P1 ' + ovrN + ' times'); line('P1, overview open', rows.filter(x => x.cl === 0 && x.ovr)); line('P1, overview closed', rows.filter(x => x.cl === 0 && !x.ovr)); }
  out.push('page errors: ' + errs.length + (errs.length ? ' ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(out.join('\n'));
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({ lag: LAG, N, SEED, click: CLICK, http: HTTP, rows, builds: B.length }, null, 0));
})().catch(e => { console.error('lag.js failed:', e); process.exit(1); });
