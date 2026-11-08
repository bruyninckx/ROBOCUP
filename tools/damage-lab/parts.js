// ROBOCUS 2.0 parts test: each part on a sample of robots vs a fixed panel, same seeds as the stock robot.
// node parts.js out.json [NS]   (env PARTS=a,b to limit, ROBOTS=a,b)
const M = require('./market.js'), L = require('./engine.js'), T = require('./tiers.js'), fs = require('fs');
const plate = (sp, k, n = 1) => { const a = Object.assign({}, sp.armour); a[k] = Math.min(3, a[k] + n); return { armour: a }; };
const allPlates = sp => { const a = Object.assign({}, sp.armour); for (const k of ['side', 'rear', 'top']) a[k] = Math.min(3, a[k] + 1); if (!L.frontTool(sp.weapon)) a.front = Math.min(3, a.front + 1); return { armour: a }; };
const PARTS = {};
for (const h of Object.keys(L.HELPERS)) PARTS['drone:' + h] = sp => ({ helpers: (sp.helpers || []).concat([h]).slice(0, 3) });
for (const m of Object.keys(L.MODULES)) if (m !== 'none') PARTS['mod:' + m] = sp => ({ mod: m });
Object.assign(PARTS, {
  'stat:hotmotor': sp => ({ motor: 'hot' }), 'stat:bigbattery': sp => ({ battery: 'big' }),
  'armour:side': sp => plate(sp, 'side'), 'armour:rear': sp => plate(sp, 'rear'), 'armour:top': sp => plate(sp, 'top'), 'armour:all': allPlates,
  'bumper:rubber': sp => ({ bumper: 'rubber' }), 'bumper:spring': sp => ({ bumper: 'spring' }), 'bumper:spiked': sp => ({ bumper: 'spiked' }),
  'chip:flanker': sp => ({ proc: 'flanker' }), 'chip:rammer': sp => ({ proc: 'rammer' }), 'chip:kiter': sp => ({ proc: 'kiter' }), 'chip:zigzag': sp => ({ proc: 'zigzag' }),
  'kit:power': sp => ({ motor: 'hot', battery: 'big' }),
});
module.exports = { PARTS };
if (require.main === module) (async () => {
  const [out, NS = 6] = process.argv.slice(2);
  const robots = process.env.ROBOTS ? process.env.ROBOTS.split(',') : ['Buzzkill', 'Rumbler', 'Thumper', 'Haymaker', 'Wrecker', 'Grindstone', 'Juggernaut', 'Hornet', 'Whirlwind', 'Whaler', 'Gyro', 'Vertigo'];
  const panel = ['Snapjaw', 'Popcorn', 'Mauler', 'Brawler', 'Sawblast'];
  const parts = process.env.PARTS ? process.env.PARTS.split(',') : Object.keys(PARTS);
  const builds = panel.map(n => T.build(n)), pairs = [], meta = [];
  for (const r of robots) for (const pk of [null, ...parts]) {
    const sp = L.normSpec({ preset: r }), base = T.build(r), extra = pk ? PARTS[pk](sp) : {};
    const k = builds.length; builds.push(Object.assign({}, base, extra)); meta.push([k, r, pk || 'stock']);
    for (let j = 0; j < panel.length; j++) if (panel[j] !== r) pairs.push([k, j]);
  }
  const seeds = Array.from({ length: +NS }, (_, k) => 6001 + k), t0 = Date.now();
  console.error(builds.length, 'builds', pairs.length * seeds.length, 'fights');
  const s = await M.evaluate(builds, { seeds, arenas: ['open'], pairs });
  fs.writeFileSync(out, JSON.stringify({ robots, panel, parts, meta, res: s.res.map(r => [r.i, r.j, r.iWon ? 1 : 0]) }));
  console.error('done in', Math.round((Date.now() - t0) / 1000), 's');
})();
