const M=require('./market.js');const c=JSON.parse(require('fs').readFileSync(process.argv[2]));const n=Object.keys(c.robots),b=n.map(k=>c.robots[k]);
(async()=>{const s=await M.evaluate(b,{tune:c.tune,seeds:c.seeds.slice(0,+process.argv[3]||20),arenas:c.arenas});const t={},m={};
for(const r of s.res){const k=n[r.i]+'-'+n[r.j];t[k]=t[k]||[0,0,[]];t[k][1]++;if(r.how!=='KO')t[k][0]++;t[k][2].push(r.t)}
console.log(Object.entries(t).sort((a,b)=>b[1][0]-a[1][0]).map(([k,v])=>k+' timeouts '+v[0]+'/'+v[1]+' median '+v[2].sort((a,b)=>a-b)[v[2].length>>1].toFixed(0)).join('\n'))})()
