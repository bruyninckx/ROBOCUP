// Check for tools/serve.js and play-latest (T32, 20 Nov 2026): the game opened as a file and from the local server, side by
// side. Per address: page errors, the files stamp (and no red "old files" bar), and the fight bookie on one duel and one fight
// with 4+ robots taken from an AI game (how many test fights in BAL.bookie.ms = 4 s, and how: "page" or "N workers").
//   node tools/serve-check.js                 both addresses, seed 3
//   node tools/serve-check.js --seed=5 --only=http --reps=2 --ms=4000   (--ms: the bookie's time budget)
// Needs playwright (npm install --no-package-lock). Without internet the page falls back to vendor/planck-1.4.3.min.js:
// this script copies node_modules/planck there if it is missing (vendor/ is not in git). The CDNs are blocked in the test
// browser, so the result does not depend on the network: the page and the helpers both use the local copy.
'use strict';
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const SEED = +arg('seed', 3), ONLY = arg('only', ''), PORT = +arg('port', 8865), REPS = +arg('reps', 1), MS = +arg('ms', 4000);

const vend = path.join(ROOT, 'vendor/planck-1.4.3.min.js'), nm = path.join(ROOT, 'node_modules/planck/dist/planck.min.js');
if (!fs.existsSync(vend)) { if (!fs.existsSync(nm)) { console.log('no planck: run npm install --no-package-lock'); process.exit(2); } fs.mkdirSync(path.dirname(vend), { recursive: true }); fs.copyFileSync(nm, vend); console.log('copied planck to vendor/ (not in git)'); }

function startServer() {
  return new Promise((res, rej) => {
    const s = cp.spawn(process.execPath, [path.join(__dirname, 'serve.js'), '--port=' + PORT], { env: Object.assign({}, process.env, { ROBOCUS_NO_BROWSER: '1' }) });
    let out = ''; s.stdout.on('data', d => { out += d; const m = out.match(/http:\/\/127\.0\.0\.1:(\d+)\//); if (m) res({ s, base: 'http://127.0.0.1:' + m[1] + '/' }); });
    s.on('exit', c => rej(new Error('server ended ' + c + ': ' + out)));
  });
}

async function run(b, url, label) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.route(/cdn\.jsdelivr\.net|unpkg\.com/, r => r.abort());
  const p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.addInitScript(() => { window.__noRender = true; });
  await p.goto(url + '?seed=' + SEED);
  await p.waitForTimeout(6000);   // the bookie warms its helpers 5 s after load
  const info = await p.evaluate(() => ({ stamp: (document.getElementById('robocusStamp') || {}).textContent || null,
    redBar: [...document.body.children].some(e => e.tagName === 'DIV' && /Old game files are loaded/.test(e.textContent || '')), planck: !!window.planck, cores: navigator.hardwareConcurrency, proto: location.protocol }));
  // an AI game until it has shown one duel and one fight with 4+ robots (or round 14)
  await p.click('#pAct2'); await p.evaluate(() => { window.__noBookie = true; window.ROBOCUS_DEBUG.autopilot(true); window.__F = {}; });
  for (let i = 0; i < 30000; i++) {
    const st = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, F = G.fight;
      if (F && F.robots && F.robots.length) { const bots = F.robots.filter(Boolean).length * (F.format === 'mirror' ? 2 : 1) + (F.house ? 1 : 0);
        if (bots === 2 && !window.__F.duel) window.__F.duel = { F, bots, fmt: F.format, round: G.round };
        if (bots >= 4 && !window.__F.multi) window.__F.multi = { F, bots, fmt: F.format, round: G.round }; }
      if ((window.__F.duel && window.__F.multi) || G.over || G.round > 14) return null;
      const btn = document.getElementById('pAct2') || document.getElementById('pAct1'); if (btn && !btn.disabled) btn.click(); const m = document.querySelector('#ivModal:not([hidden]) button'); if (m) m.click(); return 1; });
    if (!st) break; await p.waitForTimeout(5);
  }
  await p.evaluate(() => { window.ROBOCUS_DEBUG.autopilot(false); window.__noBookie = false; });
  const fights = [];
  for (const k of ['duel', 'multi']) for (let r = 0; r < REPS; r++) {
    const x = await p.evaluate(async ([k, ms]) => { const c = window.__F[k]; if (!c) return null; let last = performance.now(), gap = 0; const tk = setInterval(() => { const t = performance.now(); gap = Math.max(gap, t - last); last = t; }, 20);
      const s = await window.ROBOCUS_DEBUG.simOdds(c.F, { ms }); clearInterval(tk); gap = Math.max(gap, performance.now() - last);
      return s && { kind: k, bots: c.bots, fmt: c.fmt, round: c.round, n: s.n, ms: s.ms, how: s.how, stall: Math.round(gap) }; }, [k, MS]);
    if (x) fights.push(x); else if (!r) fights.push({ kind: k, none: 'no such fight in the AI game' });
  }
  await ctx.close();
  return { label, info, fights, errs };
}

(async () => {
  let srv = null;
  if (ONLY !== 'file') srv = await startServer();
  const b = await chromium.launch(); const out = [];
  try {
    if (ONLY !== 'http') out.push(await run(b, 'file://' + path.resolve(ROOT, 'prototypes/tabletop-2.html'), 'file'));
    if (srv) out.push(await run(b, srv.base + 'prototypes/tabletop-2.html', 'http'));
  } finally { await b.close(); if (srv) srv.s.kill(); }
  for (const r of out) {
    console.log(r.label + ': ' + r.info.proto + ' stamp "' + r.info.stamp + '" redBar ' + r.info.redBar + ' planck ' + r.info.planck + ' cores ' + r.info.cores + ' errors ' + r.errs.length);
    for (const e of r.errs.slice(0, 5)) console.log('   ' + e);
    for (const f of r.fights) console.log('   ' + (f.none ? f.kind + ': ' + f.none : f.kind + ' (' + f.bots + ' robots, ' + f.fmt + ', round ' + f.round + '): ' + f.n + ' test fights in ' + f.ms + ' ms, how: ' + f.how + ', longest screen freeze ' + f.stall + ' ms'));
  }
  const bad = out.some(r => r.errs.length || r.info.redBar || !r.info.stamp);
  console.log(bad ? 'PROBLEMS' : 'OK');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('serve-check failed: ' + (e && e.stack || e)); process.exit(2); });
