const L=require('./engine.js');const n=Object.keys(L.PRESETS);const arena=process.argv[2]||'open';
const agg={};const hits={};
for(const a of n)for(const b of n){if(a>=b)continue;const S=L.create({a:{preset:a,name:a},b:{preset:b,name:b},seed:3,arena,countdown:0});
 const orig=S.hitQ;
 while(!S.over&&S.t<160){L.step(S);S.fx.length=0;}
 for(const R of S.robots){for(const [k,v] of Object.entries(R.stats.dealtBy)){agg[R.name+':'+k]=(agg[R.name+':'+k]||0)+v/S.t;}}
}
const rows=Object.entries(agg).sort((a,b)=>b[1]-a[1]);console.log(rows.map(([k,v])=>k+' '+(v/12).toFixed(2)+'/s').join('\n'))
