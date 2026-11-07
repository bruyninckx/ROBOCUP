// hull shape experiment: every market robot in every hull shape vs the (unchanged) roster. node shapes.js [seedFrom seedTo]
const M = require('./market.js'), L = require('./engine.js');
const [s0 = 1001, s1 = 1025] = process.argv.slice(2).map(Number), seeds = []; for (let s = s0; s <= s1; s++) seeds.push(s);
const names = Object.keys(L.PRESETS).filter(k => L.PRESETS[k].market), shapes = Object.keys(L.SHAPES);
(async () => {
  const builds = names.map(n => ({ preset: n })), pairs = [], meta = [];
  for (let i = 0; i < names.length; i++) for (const sh of shapes) { const idx = builds.length; builds.push({ preset: names[i], shape: sh }); meta.push({ idx, i, sh }); for (let j = 0; j < names.length; j++) if (j !== i) pairs.push([idx, j]); }
  const s = await M.evaluate(builds, { seeds, arenas: ['open', 'pit'], pairs });
  for (let i = 0; i < names.length; i++) {
    const row = meta.filter(m => m.i === i).map(m => { const v = s.wr[m.idx].filter(x => x != null); return `${m.sh} ${Math.round(v.reduce((a, b) => a + b, 0) / v.length * 100)}%`; });
    console.log(names[i].padEnd(11), '(now ' + L.PRESETS[names[i]].shape + ')', row.join('  '));
  }
})();
