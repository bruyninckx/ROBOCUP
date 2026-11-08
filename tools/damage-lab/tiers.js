// ROBOCUS 2.0 tier analysis. node tiers.js scan out.json  : round robin + power-slope runs, open floor
// power p: dmgK x p and every part's HP x p (spec.hpK)
const M = require('./market.js'), L = require('./engine.js'), fs = require('fs');
const STARTERS = ['Buzzkill', 'Rumbler', 'Popcorn', 'Thumper', 'Snapjaw', 'Blowtorch', 'Haymaker', 'Jouster', 'Wrecker', 'Doorstop', 'Grindstone'];
const MARKET = ['Juggernaut', 'Hornet', 'Whirlwind', 'Brawler', 'Mauler', 'Sawblast', 'Whaler', 'Rocketeer', 'Gyro', 'Scythe', 'Mincer', 'Pincher', 'Thwacker', 'Forklift', 'Ramrod', 'Vertigo'];
const POOL = STARTERS.concat(MARKET);
const build = (n, p = 1, extra = {}) => Object.assign({ preset: n, dmgK: (L.PRESETS[n].dmgK || 1) * p, hpK: p }, extra);
// Bradley-Terry fit: strength s_i, P(i beats j) = 1 / (1 + exp(s_j - s_i))
function bt(n, games, iters = 400) {
  const s = new Array(n).fill(0);
  for (let it = 0; it < iters; it++) {
    const g = new Array(n).fill(0);
    for (const [i, j, w, t] of games) { const pr = 1 / (1 + Math.exp(s[j] - s[i])); g[i] += w - pr * t; g[j] -= w - pr * t; }
    for (let i = 0; i < n; i++) s[i] += 0.02 * g[i] / Math.max(1, games.filter(q => q[0] === i || q[1] === i).length);
    const m = s.reduce((a, b) => a + b, 0) / n; for (let i = 0; i < n; i++) s[i] -= m;
  }
  return s;
}
module.exports = { STARTERS, MARKET, POOL, build, bt };
if (require.main === module) (async () => {
  const [cmd, out] = process.argv.slice(2);
  if (cmd === 'scan') {
    const seeds = Array.from({ length: +process.env.NS || 8 }, (_, k) => 5001 + k);
    const builds = POOL.map(n => build(n)), pairs = [];
    for (let i = 0; i < POOL.length; i++) for (let j = i + 1; j < POOL.length; j++) pairs.push([i, j]);
    // power variants vs a fixed panel
    const panel = ['Juggernaut', 'Whirlwind', 'Mauler', 'Thumper', 'Wrecker', 'Vertigo'].map(n => POOL.indexOf(n)), meta = [];
    for (let i = 0; i < POOL.length; i++) for (const p of [0.6, 1.6]) { const k = builds.length; builds.push(build(POOL[i], p)); meta.push([k, i, p]); for (const j of panel) if (j !== i) pairs.push([k, j]); }
    const t0 = Date.now(), s = await M.evaluate(builds, { seeds, arenas: ['open'], pairs });
    fs.writeFileSync(out, JSON.stringify({ pool: POOL, meta, seeds, res: s.res.map(r => [r.i, r.j, r.iWon ? 1 : 0, Math.round(r.t)]) }));
    console.log('done', s.res.length, 'fights in', Math.round((Date.now() - t0) / 1000), 's');
  }
})();
// ---- tier calibration ----
// node tiers.js verify tiers.json out.json : round robin of every robot at its power p (tiers.json: {name: {tier, p}})
if (require.main === module && process.argv[2] === 'verify') (async () => {
  const cfg = JSON.parse(fs.readFileSync(process.argv[3])), out = process.argv[4], names = Object.keys(cfg);
  const builds = names.map(n => build(n, cfg[n].p)), pairs = [];
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) pairs.push([i, j]);
  const seeds = Array.from({ length: +process.env.NS || 8 }, (_, k) => (+process.env.SEED0 || 7101) + k), t0 = Date.now();
  const s = await M.evaluate(builds, { seeds, arenas: ['open'], pairs });
  fs.writeFileSync(out, JSON.stringify({ names, cfg, res: s.res.map(r => [r.i, r.j, r.iWon ? 1 : 0, Math.round(r.t)]) }));
  console.log('done', s.res.length, 'fights in', Math.round((Date.now() - t0) / 1000), 's');
})();
