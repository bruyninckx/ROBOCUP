// node l4-regress.js > out.txt : fingerprint of existing fights (1v1 market + trials + lineup with parts + a 2v2 + an FFA). Must not change when new robots are added.
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const names = ['Juggernaut','Hornet','Whirlwind','Brawler','Mauler','Sawblast','Whaler','Gyro','Scythe','Mincer','Pincher','Thwacker','Forklift','Ramrod','Vertigo','Wrecker','Haymaker','Popcorn','Rocketeer','Peppershot'];
const out = [];
const fp = S => `${S.t.toFixed(3)} ${S.result ? S.result.text : '-'} ${S.robots.map(R => R.stats.dealt.toFixed(2) + '/' + R.stats.lost.length).join(' ')}`;
for (let i = 0; i < names.length; i++) { const a = names[i], b = names[(i * 7 + 3) % names.length]; out.push(`${a} v ${b}: ` + fp(L.run({ a: { preset: a }, b: { preset: b }, seed: 100 + i, arena: i % 3 ? 'open' : 'killbox' }))); }
out.push('parts: ' + fp(L.run({ a: LU.build('Mauler', ['medic', 'weapon']), b: LU.build('Juggernaut', ['shield']), seed: 5 })));
out.push('quantum: ' + fp(L.run({ a: LU.build('Hornet', ['quantum']), b: LU.build('Ramrod'), seed: 6 })));
out.push('2v2: ' + fp(L.run({ mode: '2v2', robots: [{ preset: 'Brawler' }, { preset: 'Juggernaut' }, { preset: 'Whirlwind' }, { preset: 'Mauler' }], seed: 9 })));
out.push('ffa: ' + fp(L.run({ mode: 'ffa', robots: [{ preset: 'Sawblast' }, { preset: 'Whaler' }, { preset: 'Forklift' }, { preset: 'Gyro' }], seed: 11 })));
console.log(out.join('\n'));
