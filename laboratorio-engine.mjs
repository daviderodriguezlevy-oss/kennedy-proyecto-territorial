// Exploratory, synthetic parameters. Model time is independent of render frames.
export const defaults={scenario:0,arrivals:12,service:6,divert:60,remove:40,birds:18,refuge:0,seed:42};
export class Model{
 constructor(config={}){this.c={...defaults,...config};this.t=0;this.seed=this.c.seed>>>0;this.credit=0;this.nextId=1;this.trucks=[];this.events=[];this.history=[];this.wait=0;this.started=0;this.stations=['A','B','C'].map(id=>({id,queue:[],busy:null,waste:0,removed:0,completed:0}));this.patches=[{x:-1.7,z:1.24,food:30},{x:-1.58,z:1.07,food:30},{x:-1.83,z:1.29,food:30}];this.birds=Array.from({length:this.c.birds},(_,i)=>({id:'ave-'+(i+1),x:-1.8+this.rand()*.35,z:1.05+this.rand()*.3,reserve:25+this.rand()*10,state:'buscar',target:i%3,retreatMinutes:0}));this.seed=this.c.seed>>>0;this.exposure=0;this.depleted=0;this.grown=0;this.eaten=0;this.initialFood=90;this.sample();}
 rand(){let a=this.seed+=0x6D2B79F5;a=Math.imul(a^a>>>15,a|1);a^=a+Math.imul(a^a>>>7,a|61);return((a^a>>>14)>>>0)/4294967296;}
 log(type,actor,detail){this.events.push({minute:this.t,type,actor,detail});}
 step(){if(this.t>=360)return;this.t++;
  // Exogenous demand is equal between scenarios. Destination choice uses one draw per arrival.
  this.credit+=this.c.arrivals/60;
  while(this.credit>=1-1e-9){this.credit-=1;const draw=this.rand();let dest=this.c.scenario===0?0:draw<this.c.divert/100?(draw<this.c.divert/200?1:2):0;
   if(this.c.scenario===2&&this.t>=180&&dest===1){dest=2;this.log('desvío','ruta','Nuevas llegadas previstas para B se asignan a C.');}
   const tr={id:this.nextId++,dest,state:'viaje',born:this.t,arrival:this.t+[5,10,12][dest],start:null,end:null};this.trucks.push(tr);this.log('llegada',tr.id,['A','B','C'][dest]);}
  for(const tr of this.trucks)if(tr.state==='viaje'&&tr.arrival<=this.t){tr.state='espera';this.stations[tr.dest].queue.push(tr);}
  this.stations.forEach((s,i)=>{
   const active=!(this.c.scenario===2&&i===1&&this.t>=180);
   if(s.busy&&active){s.busy.remaining--;if(s.busy.remaining<=0){const tr=s.busy.tr;tr.state='salida';tr.end=this.t;s.completed++;s.waste+=20;this.log('descarga',tr.id,'980 kg de producto distribuido + 20 kg de residuo');s.busy=null;}}
   if(this.t%15===0){const removed=Math.min(s.waste,this.c.remove);s.waste-=removed;s.removed+=removed;if(removed)this.log('retiro',s.id,removed+' kg');}
   if(active&&!s.busy&&s.queue.length&&s.waste<120){const tr=s.queue.shift();tr.state='servicio';tr.start=this.t;this.wait+=tr.start-tr.arrival;this.started++;s.busy={tr,remaining:this.c.service};}
  });
  if(this.c.scenario===2&&this.t===180)this.log('interrupción','B','B deja de atender; conserva su cola y su servicio en curso.');
  // Synthetic ecological resource account: one currency (resource units), finite patches.
  for(const p of this.patches){const g=Math.min(.5,40-p.food);p.food+=g;this.grown+=g;}
  const local=this.stations[0].queue.length+this.trucks.filter(t=>t.dest===0&&t.state==='viaje').length;
  for(let k=0;k<this.birds.length;k++){const b=this.birds[(k+this.t)%this.birds.length];if(b.reserve<=0){b.state='reserva agotada';continue;}b.reserve=Math.max(0,b.reserve-.12);
   const p=this.patches[b.target],nearRoad=Math.hypot(b.x+1.28,b.z-.88)<.55;
   const disturbed=nearRoad&&local>(this.c.refuge?12:4);
   if(disturbed){b.state='retirarse';b.retreatMinutes++;this.exposure++;b.x=Math.max(-2.05,b.x-.018);b.z=Math.min(1.6,b.z+.01);continue;}
   const dx=p.x-b.x,dz=p.z-b.z,d=Math.hypot(dx,dz);
   if(d>.04){b.state='buscar';b.x+=dx/d*Math.min(.025,d);b.z+=dz/d*Math.min(.025,d);}
   else if(p.food>=.4){p.food-=.4;this.eaten+=.4;b.reserve=Math.min(40,b.reserve+.32);b.state='alimentarse';}
   else{b.state='buscar';b.target=(b.target+1)%3;}
  }
  this.depleted=this.birds.filter(b=>b.reserve<=0).length;this.sample();
 }
 sample(){const done=this.stations.reduce((n,s)=>n+s.completed,0),waste=this.stations.reduce((n,s)=>n+s.waste,0),removed=this.stations.reduce((n,s)=>n+s.removed,0);const row={minute:this.t,arrived:this.trucks.length,completed:done,queueA:this.stations[0].queue.length,queueB:this.stations[1].queue.length,queueC:this.stations[2].queue.length,wasteKg:waste,removedKg:removed,waitMean:this.started?this.wait/this.started:0,retreatAgentMinutes:this.exposure,exhausted:this.depleted,food:this.patches.reduce((n,p)=>n+p.food,0)};this.history.push(row);return row;}
 get result(){return this.history.at(-1);}
 balances(){const r=this.result;return{cargoError:this.trucks.length*1000-(this.trucks.length-r.completed)*1000-r.completed*980-r.wasteKg-r.removedKg,wasteError:r.completed*20-r.wasteKg-r.removedKg,foodError:this.initialFood+this.grown-this.eaten-r.food};}
 run(){while(this.t<360)this.step();return this.result;}
 export(){return{version:'kennedy-abm-43',status:'exploratory-synthetic',config:this.c,timeUnit:'minute',duration:360,history:this.history,events:this.events,balances:this.balances()};}
}
