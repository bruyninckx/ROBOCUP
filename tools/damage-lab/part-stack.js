const L=require('./engine.js'),LU=require('./lineup.js');LU.usePK();
const [shard,nsh]=[+process.argv[2],+process.argv[3]];
const all=Object.assign({},LU.ROBOTS,LU.ROBOTS4),names=Object.keys(all),lv=n=>all[n][0];
const P=Object.keys(LU.PARTS).filter(k=>!['legendary','chip'].includes(LU.PARTS[k].kind));
let seed=4242;const rng=()=>(seed=(seed*16807)%2147483647)/2147483647;
const res=[];let job=0;
for(const n of names.filter(n=>lv(n)<=2)){const opp=names.filter(m=>lv(m)===lv(n)+2);
 for(let c=0;c<8;c++){let a,b;do{a=P[Math.floor(rng()*P.length)];b=P[Math.floor(rng()*P.length)];}while(a===b||(LU.PARTS[a].kind==='module'&&LU.PARTS[b].kind==='module'));
  const o4=[];const pool=opp.slice();for(let i=0;i<4&&pool.length;i++)o4.push(pool.splice(Math.floor(rng()*pool.length),1)[0]);
  for(const o of o4)for(let f=0;f<2;f++){if((job++%nsh)!==shard)continue;
   for(const parts of [[],[a],[b],[a,b]]){const A=LU.build(n,parts),O=LU.build(o);const sw=f%2;const S=L.create({a:sw?O:A,b:sw?A:O,seed:31000+c*10+f,arena:'open'});while(!S.over&&S.t<200){L.step(S);S.fx.length=0;}
    const w=S.result.winner;res.push({n,o,parts,win:w==null?0.5:((w===0)!==!!sw?1:0)});}}}}
require('fs').writeFileSync(`part-stack-${shard}.json`,JSON.stringify(res));console.log('done',res.length);
