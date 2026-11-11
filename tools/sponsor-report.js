const fs=require('fs');const tags=process.argv.slice(2);const A={},N={};let st=0,gh=0,gn=0,att=0;
for(const t of tags){const G=JSON.parse(fs.readFileSync('sims/'+t+'.json')).res.filter(g=>g.over&&g.sponsors);const normal=/normal/.test(t);
 for(const g of G){gn++;st+=g.stabs||0;gh+=g.grudgeHits||0;att+=(g.attacksBy||[]).reduce((a,b)=>a+b,0);
  g.sponsors.forEach((s,i)=>{if(i===0&&!normal)return;const o=A[s]=A[s]||{n:0,w:0,f:0};o.n++;o.w+=g.winner===i?1:0;o.f+=g.fame[i];});}}
console.log(gn+' games | attacks a game '+(att/gn).toFixed(1)+', on a grudge target '+(gh/gn).toFixed(1)+', backstabs '+(st/gn).toFixed(2));
console.log('sponsor      seats  wins   fame   (normal AIs only; a fair share is 25%)');
for(const s of Object.keys(A).sort((a,b)=>A[b].w/A[b].n-A[a].w/A[a].n)){const o=A[s];console.log(s.padEnd(12),String(o.n).padEnd(6),(Math.round(100*o.w/o.n)+'%').padEnd(6),(o.f/o.n).toFixed(1),' ±'+Math.round(100*Math.sqrt(.25*.75/o.n)))}
