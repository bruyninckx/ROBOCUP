const L=require('./engine.js');const [a,b,seed,arena,T]=process.argv.slice(2);
const S=L.create({a:{preset:a,name:a},b:{preset:b,name:b},seed:+seed||1,arena:arena||'open',countdown:0});
let next=0;
while(!S.over&&S.t<(+T||40)){L.step(S);S.fx.length=0;if(S.t>=next){next+=1.5;
console.log(S.t.toFixed(1),S.robots.map(R=>{const p=R.body.getPosition(),v=R.body.getLinearVelocity();return `${R.name[0]} p(${p.x.toFixed(1)},${p.y.toFixed(1)}) a${(R.body.getAngle()%6.28).toFixed(1)} v${Math.hypot(v.x,v.y).toFixed(1)} ctl${R.ctl.L.toFixed(1)}/${R.ctl.R.toFixed(1)} bw${(R.bladeW||0).toFixed(0)} hp${R.chassis.hp.toFixed(0)} mh${R.slots.map(s=>s.motor.heat.toFixed(0)).join(',')} m${R.body.getMass().toFixed(0)}`}).join(' | '))}}
console.log(S.log.map(l=>l.t.toFixed(1)+' '+l.text).join('\n'))
