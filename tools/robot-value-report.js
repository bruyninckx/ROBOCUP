// T44: a robot's value (robotValue, display only) against what robots really changed hands for in AI games.
// Run game-sim on the 2.0 page first (it records rv: values at each Market, trades, Hostile Buyouts, trade-ins, Fire Sales), then:
//   node tools/robot-value-report.js [tagPrefix, default t44v] [--halfParts]   (reads sims/<prefix>*.json)
// --halfParts: runs recorded while parts counted at their full Market value (the first T44 runs): recount each part line at its
// bank price (half, at least 1), as robotValue does now
const fs=require('fs'),path=require('path');const dir=path.join(process.cwd(),'sims'),pre=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:'t44v';
const files=fs.readdirSync(dir).filter(f=>f.startsWith(pre)&&f.endsWith('.json')),HALF=process.argv.includes('--halfParts');
let games=0,rows=[],lots=[],unsold=[];
for(const f of files){const d=JSON.parse(fs.readFileSync(path.join(dir,f)));for(const r of d.res){if(!r.v2||r.crash)continue;games++;
 const rv=r.v2.rv||[];const offers=rv.filter(x=>x.k==='offer');
 for(const l of r.v2.lots.filter(l=>l.kind==='robot')){const o=offers.find(x=>x.r===l.r);const m=o&&o.lots.find(y=>y.id===l.id);const v=m?m.v:1+2*(l.level||0);
   if(l.winner!=null&&l.winner>=0)lots.push({k:'lot',r:l.r,lv:l.level,v,price:l.price});else unsold.push({lv:l.level});}
 for(const x of rv.filter(x=>x.k!=='offer'))rows.push(x);}}
const st=a=>{const n=a.length;if(!n)return null;const m=a.reduce((s,x)=>s+x,0)/n;const sd=Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/Math.max(1,n-1));return {n,m:+m.toFixed(2),sd:+sd.toFixed(2),se:+(sd/Math.sqrt(n)).toFixed(2)}};
const f=(lab,arr)=>{const p=st(arr.map(x=>x.price)),v=st(arr.map(x=>x.v)),d=st(arr.map(x=>x.price-x.v)),ad=st(arr.map(x=>Math.abs(x.price-x.v)));if(!p)return;console.log(lab.padEnd(28),'n',String(p.n).padStart(4),' value',v.m,' paid',p.m,'±',p.se,'(sd',p.sd+')',' paid-value',d.m,'±',d.se,' |diff|',ad.m);};
console.log('games',games,'files',files.join(','));
f('Market robot lots, all',lots);
for(const lv of [1,2,3,4])f(' lots level '+lv,lots.filter(x=>x.lv===lv));
for(const [a,b] of [[1,2],[3,4],[5,6],[7,9],[10,40]])f(' lots rounds '+a+'-'+b,lots.filter(x=>x.r>=a&&x.r<=b));
console.log('unsold robot lots',unsold.length,'by level',JSON.stringify(unsold.reduce((o,x)=>(o[x.lv]=(o[x.lv]||0)+1,o),{})));
if(HALF)for(const x of rows)if(x.b){x.b=x.b.map(l=>l[1]!=null&&/^(🔩|🌟)/.test(l[0])?[l[0],Math.max(1,Math.floor(l[1]/2))]:l);x.v=Math.max(1,x.b.reduce((a,l)=>a+(l[1]||0),0));}
// trade-in and Fire Sale: the parts stay with the old owner (Stash), so compare with the value without its parts
const noParts=x=>x.b?Math.max(1,x.b.filter(l=>l[1]!=null&&!/^(🔩|🌟)/.test(l[0])).reduce((a,l)=>a+l[1],0)):x.v;
for(const x of rows)if(x.k==='tradein'||x.k==='fire')x.v=noParts(x);
for(const k of ['trade','buyout','tradein','fire']){const a=rows.filter(x=>x.k===k&&x.v!=null);f(k+', all',a);for(const lv of [0,1,2,3,4])f(' '+k+' level '+lv,a.filter(x=>x.lv===lv));}
const tr=rows.filter(x=>x.k==='trade');console.log('trades with parts',tr.filter(x=>x.parts).length,'with damage',tr.filter(x=>x.dmg).length,'with fan tokens',tr.filter(x=>x.wins).length);
