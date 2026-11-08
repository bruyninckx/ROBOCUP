// drama check: first hit time, parts lost, fight length per arena
const L=require('./engine.js');const n=Object.keys(L.PRESETS).filter(k=>L.PRESETS[k].market);
for (const ar of ['open','pit','killbox','saws']){let first=[],lost=[],len=[],to=0,N=0;
for(let i=0;i<n.length;i++)for(let j=i+1;j<n.length;j+=3){const S=L.create({a:{preset:n[i]},b:{preset:n[j]},seed:i*7+j,arena:ar,countdown:0});let fh=null;
while(!S.over&&S.t<130){L.step(S);S.fx.length=0;if(fh==null&&S.robots.some(R=>R.stats.dealt>5))fh=S.t;}
N++;first.push(fh||130);lost.push(S.robots[0].stats.lost.length+S.robots[1].stats.lost.length);len.push(S.t);if(S.result.how!=='KO')to++;}
const med=a=>a.sort((x,y)=>x-y)[a.length>>1];console.log(ar,'fights',N,'first hit',med(first).toFixed(1),'parts lost',med(lost),'length',med(len).toFixed(0),'judges',to);}
