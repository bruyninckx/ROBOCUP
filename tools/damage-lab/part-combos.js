const L=require('./engine.js'),LU=require('./lineup.js');LU.usePK();
const [file,mode,shard,nsh,out]=process.argv.slice(2);const C=JSON.parse(require('fs').readFileSync(file));
const all=Object.assign({},LU.ROBOTS,LU.ROBOTS4),names=Object.keys(all),lv=n=>all[n][0];const res=[];let job=0;
const fight=(A,B,seed,sw)=>{const S=L.create({a:sw?B:A,b:sw?A:B,seed,arena:'open'});while(!S.over&&S.t<200){L.step(S);S.fx.length=0;}const w=S.result.winner;return w==null?0.5:((w===0)!==!!sw?1:0);};
for(const c of C){const opp=mode==='slayer'?names.filter(m=>lv(m)>=3):names.filter(m=>m!==c.n&&lv(m)===Math.min(4,lv(c.n)+1));
 for(const o of opp)for(let f=0;f<(+process.env.K||4);f++){if((job++%+nsh)!==+shard)continue;const seed=(+process.env.SEED0||53000)+f*131+names.indexOf(o);
  res.push({id:c.id,n:c.n,o,with:fight(LU.build(c.n,c.parts),LU.build(o),seed,f%2),without:fight(LU.build(c.n),LU.build(o),seed,f%2),...(mode==='slayer'?{kitted:fight(LU.build(c.n,c.parts),LU.build(o,['weapon','hull','core']),seed,f%2)}:{})});}}
require('fs').writeFileSync(out,JSON.stringify(res));
