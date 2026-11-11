const fs=require('fs');for(const tag of process.argv.slice(2)){const D=JSON.parse(fs.readFileSync('sims/'+tag+'.json'));const G=D.res.filter(g=>g.over);
const m=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const w=[0,0,0,0];G.forEach(g=>w[g.winner]++);
const FX=G.flatMap(g=>(g.v2&&g.v2.fightsX||[]).filter(f=>f.host!=null));const host0=FX.length?FX.filter(f=>f.host===0).length/FX.length:NaN;
const self0=FX.filter(f=>f.host===0),inOwn=self0.filter(f=>f.x2.some(e=>e&&e.team===0)),wonOwn=inOwn.filter(f=>{const e=f.x2.find(e=>e.team===0);return f.win===e.side});
const price0=inOwn.length/Math.max(1,self0.length),priceR=wonOwn.length/Math.max(1,inOwn.length);
const fame0=m(G.map(g=>g.fame[0])),fameR=m(G.flatMap(g=>g.fame.slice(1)));
console.log(tag.padEnd(10),'games',G.length,'| seat-0 wins',Math.round(100*w[0]/G.length)+'%','(others '+w.slice(1).map(x=>Math.round(100*x/G.length)+'%').join(' ')+')','| seat 0 hosts',Math.round(100*host0)+'% of rounds, fights in its own show',Math.round(100*price0)+'%, wins those',Math.round(100*priceR)+'%','| fame',fame0.toFixed(1),'vs',fameR.toFixed(1),'| rounds',m(G.map(g=>g.round)).toFixed(1));}
