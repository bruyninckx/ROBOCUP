// T52 (21 Nov 2026): how fast the fight bookie's helpers run test fights, per helper, for a duel and for a fight with 4 robots,
// and what a helper costs in memory. Serves the game from tools/serve.js (helpers need a web address), pretends the PC has
// --cores logical processors (so the pool gets cores minus 2 helpers, at most BAL.bookie.cap), plays one AI game until it has a
// duel and a 4-robot fight from round --from on (robots with wear by then), then runs simOdds on each with 1..k helpers.
//   node tools/bookie-speed.js --seed=3 --cores=16 --use=1,2 --ms=30000 --from=5
// Output: per fight and helper count: test fights, seconds, fights per second per helper; memory: RSS of the browser before and
// after the helpers started (all chrome processes), per helper. Numbers on a shared 2-core box say little about a fast PC.
'use strict';
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const SEED = +arg('seed', 3), CORES = +arg('cores', 16), USE = arg('use', '1,2').split(',').map(Number), MS = +arg('ms', 30000), FROM = +arg('from', 5), PORT = +arg('port', 8875), OUT = arg('out', '');
const rss = () => { try { return cp.execSync("ps -eo rss,comm | grep -i chrome | awk '{s+=$1} END {print s}'").toString().trim() * 1024; } catch (e) { return 0; } };
function startServer() {
  return new Promise((res, rej) => {
    const s = cp.spawn(process.execPath, [path.join(__dirname, 'serve.js'), '--port=' + PORT], { env: Object.assign({}, process.env, { ROBOCUS_NO_BROWSER: '1' }) });
    let out = ''; s.stdout.on('data', d => { out += d; const m = out.match(/http:\/\/127\.0\.0\.1:(\d+)\//); if (m) res({ s, base: 'http://127.0.0.1:' + m[1] + '/' }); });
    s.on('exit', c => rej(new Error('server ended ' + c + ': ' + out)));
  });
}
(async () => {
  const vend = path.join(ROOT, 'vendor/planck-1.4.3.min.js'), nm = path.join(ROOT, 'node_modules/planck/dist/planck.min.js');
  if (!fs.existsSync(vend) && fs.existsSync(nm)) { fs.mkdirSync(path.dirname(vend), { recursive: true }); fs.copyFileSync(nm, vend); }
  const srv = await startServer(), b = await chromium.launch(), res = { seed: SEED, cores: CORES, at: new Date().toISOString(), load: require('os').loadavg(), fights: [] };
  try {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.route(/cdn\.jsdelivr\.net|unpkg\.com/, r => r.abort());
    await ctx.addInitScript(c => { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => c }); window.__noRender = true; }, CORES);
    const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(srv.base + 'prototypes/tabletop-2.html?seed=' + SEED); await p.waitForTimeout(1500);
    const m0 = rss(); await p.waitForTimeout(9000);
    const pool = await p.evaluate(() => { const B = window.ROBOCUS_DEBUG.BOOKIE; return B.pool ? { n: B.pool.length, ready: B.pool.filter(o => o.ready).length } : null; });
    const m1 = rss(); res.mem = { before: m0, after: m1, workers: pool, perWorkerMB: pool && pool.n ? +((m1 - m0) / pool.n / 1048576).toFixed(1) : null };
    console.log('helpers', JSON.stringify(pool), 'browser RSS', (m0 / 1048576).toFixed(0), '->', (m1 / 1048576).toFixed(0), 'MB: about', res.mem.perWorkerMB, 'MB a helper');
    await p.click('#pAct2'); await p.evaluate(() => { window.__noBookie = true; window.ROBOCUS_DEBUG.autopilot(true); window.__F = {}; });
    for (let i = 0; i < 40000; i++) {
      const st = await p.evaluate(from => { const D = window.ROBOCUS_DEBUG, G = D.G, F = G.fight;
        if (F && F.robots && F.robots.length && F.robots.every(Boolean) && G.round >= from) { const bots = D.buildFight(F, 1, false).botEnt.length;
          if (bots === 2 && !window.__F.duel) window.__F.duel = { F: JSON.parse(JSON.stringify(F, (k, v) => k === 'S' || k === 'B' ? undefined : v)), bots, fmt: F.format, round: G.round };
          if (bots >= 4 && !window.__F.multi) window.__F.multi = { F: JSON.parse(JSON.stringify(F, (k, v) => k === 'S' || k === 'B' ? undefined : v)), bots, fmt: F.format, round: G.round }; }
        if ((window.__F.duel && window.__F.multi) || G.over || G.round > 15) return null;
        const btn = document.getElementById('pAct2') || document.getElementById('pAct1'); if (btn && !btn.disabled) btn.click(); const m = document.querySelector('#ivModal:not([hidden]) button'); if (m) m.click(); return 1; }, FROM);
      if (!st) break; await p.waitForTimeout(5);
    }
    await p.evaluate(() => { window.ROBOCUS_DEBUG.autopilot(false); window.__noBookie = false; });
    for (const k of ['duel', 'multi']) for (const u of USE) {
      const x = await p.evaluate(async ([k, u, ms]) => { const c = window.__F[k]; if (!c) return null; const B = window.ROBOCUS_DEBUG.BOOKIE, live = B.pool.filter(o => o.ready);
        live.forEach((o, i) => { o.dead = i >= u; });
        const s = await window.ROBOCUS_DEBUG.simOdds(c.F, { ms, n: 100000, stopN: 0 }); live.forEach(o => { o.dead = false; });
        return s && { kind: k, bots: c.bots, fmt: c.fmt, round: c.round, use: u, n: s.n, ms: s.ms, how: s.how, perWorker: +(s.n / (s.ms / 1000) / u).toFixed(2) }; }, [k, u, MS]);
      if (x) { res.fights.push(x); console.log(JSON.stringify(x)); } else console.log(k + ': no such fight');
      await p.waitForTimeout(3000);   // let the cut-off fights of the last run finish
    }
    res.errs = errs; if (errs.length) console.log('page errors', errs.slice(0, 3));
  } finally { await b.close(); srv.s.kill(); }
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
})().catch(e => { console.log('bookie-speed failed: ' + (e && e.stack || e)); process.exit(2); });
