// ROBOCUS 2.0: does one part close one level? Robot of tier n + part vs the stock robots of tier n+1 (legendary: vs tier n+2).
// node parts2.js tiers.json out.json [NS]  env PARTS=..., PK='medic:0.5,shield:2', GAP=1|2
const M = require('./market.js'), L = require('./engine.js'), T = require('./tiers.js'), fs = require('fs');
const plate = (sp, keys) => { const a = Object.assign({}, sp.armour); for (const k of keys) if (!(k === 'front' && L.frontTool(sp.weapon))) a[k] = Math.min(3, a[k] + 1); return { armour: a }; };
const P2 = {};
for (const h of Object.keys(L.HELPERS)) P2['drone:' + h] = (sp, b) => ({ helpers: (sp.helpers || []).concat([h]).slice(0, 3) });
for (const m of ['shield', 'popper', 'emp', 'repair', 'grapple', 'mines', 'quantum', 'smoke', 'oil', 'boom']) P2['mod:' + m] = () => ({ mod: m });
Object.assign(P2, {
  'stat:hull': (sp, b) => ({ hpK: b.hpK * 1.45 }),              // reinforced hull: every part +30% HP
  'stat:weapon': (sp, b) => ({ dmgK: b.dmgK * 1.35 }),          // weapon overhaul: +30% weapon damage
  'stat:motors': () => ({ motor: 'hot' }), 'stat:battery': () => ({ battery: 'big' }),
  'stat:armourkit': (sp, b) => Object.assign(plate(sp, ['front', 'side', 'rear', 'top']), { hpK: b.hpK * 1.25 }), 'stat:powerkit': (sp, b) => ({ motor: 'hot', battery: 'big', hpK: b.hpK * 1.2 }),
  'bumper:spiked': () => ({ bumper: 'spiked' }),
  'leg:core': (sp, b) => ({ hpK: b.hpK * 1.3, dmgK: b.dmgK * 1.3 }), // legendary prototype core
  'leg:quantum': () => ({ mod: 'quantum' }),   // run with PK quantum:k
  'leg:hospital': (sp, b) => ({ helpers: (sp.helpers || []).concat(['medic']).slice(0, 3), hpK: b.hpK * 1.1 }),
});
module.exports = { P2 };
if (require.main === module) (async () => {
  const [tf, out, NS = 4] = process.argv.slice(2), cfg = JSON.parse(fs.readFileSync(tf)), gap = +process.env.GAP || 1;
  if (process.env.PK) for (const kv of process.env.PK.split(',')) { const [k, v] = kv.split(':'); L.ARC.pk[k] = +v; }
  const parts = process.env.PARTS ? process.env.PARTS.split(',') : Object.keys(P2).filter(k => !k.startsWith('leg:'));
  const tier = t => Object.keys(cfg).filter(n => cfg[n].tier === t);
  const builds = [], idx = {}, pairs = [], meta = [];
  const add = b => { builds.push(b); return builds.length - 1; };
  for (const n of Object.keys(cfg)) idx[n] = add(T.build(n, cfg[n].p));
  for (let t = 0; t + gap <= 3; t++) for (const r of tier(t)) for (const pk of ['stock', ...parts]) {
    const sp = L.normSpec({ preset: r }), base = T.build(r, cfg[r].p), k = pk === 'stock' ? idx[r] : add(Object.assign({}, base, P2[pk](sp, base)));
    meta.push([k, r, t, pk]); for (const o of tier(t + gap)) pairs.push([k, idx[o]]);
  }
  const seen = new Set(), uniq = pairs.filter(p => { const s = p.join(','); if (seen.has(s)) return false; seen.add(s); return true; });
  const seeds = Array.from({ length: +NS }, (_, k) => (+process.env.SEED0 || 8001) + k), t0 = Date.now();
  console.error(uniq.length * seeds.length, 'fights');
  // workers need the potency knobs too: pass them through env (market.js workers re-require the engine)
  const s = await M.evaluate(builds, { seeds, arenas: ['open'], pairs: uniq, tune: {} });
  fs.writeFileSync(out, JSON.stringify({ cfg, gap, parts, meta, pk: L.ARC.pk, res: s.res.map(r => [r.i, r.j, r.iWon ? 1 : 0]) }));
  console.error('done in', Math.round((Date.now() - t0) / 1000), 's');
})();
