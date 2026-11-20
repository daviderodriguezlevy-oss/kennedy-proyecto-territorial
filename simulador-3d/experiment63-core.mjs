export const defaults={seed:42,horizon:240,demand:100,rain:8,foodLimit:65,habitatLimit:45,persistence:12,proposedCapacity:100,localRate:7,refugeSlots:100,wasteRemoval:4};
export const spaces=[
{id:'C',name:'Corabastos · recepción y conservación',x:-1.27,z:1.05,color:'#e5b77d'},
{id:'N',name:'Distribución de proximidad norte',x:-.88,z:.38,color:'#8cb8ce'},
{id:'M',name:'Distribución de proximidad María Paz',x:-.76,z:.77,color:'#8cb8ce'},
{id:'P',name:'Producción complementaria',x:-1.25,z:.52,color:'#a9c68e'},
{id:'R',name:'Recuperación de alimentos y materiales',x:-1.42,z:.89,color:'#c1a3c9'},
{id:'H',name:'Recursos de refugio · La Vaca',x:-1.7,z:1.26,color:'#79c7b5'}];
export function createRun(scenario,config={}){
 const c={...defaults,...config};const proposed=scenario==='propuesta';
 const nodes=(proposed?[{id:'C',share:.55,capacity:56,storage:700},{id:'N',share:.225,capacity:25,storage:300},{id:'M',share:.225,capacity:25,storage:300}]:[{id:'C',share:1,capacity:85,storage:1300}]).map(n=>({...n,capacity:n.capacity*(proposed?c.proposedCapacity/100:1),external:200*n.share,local:0,queue:0,processed:0,delivered:0}));
 return {scenario,c,t:0,seed:c.seed>>>0,nodes,history:[],events:[],criticalFood:0,criticalHabitat:0,done:false,reason:null,firstFailure:null,waste:0,habitat:proposed?c.refugeSlots:75,externalIn:200,localIn:0,delivered:0,externalDelivered:0,localDelivered:0,lost:0,processedWaste:0,totalDemand:0};
}
export function step(s){
 if(s.done)return s.history.at(-1);const c=s.c,proposed=s.scenario==='propuesta';s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;const noise=s.seed/4294967296;
 const phase=s.t%48;const pulse=phase<12?1.45:phase<30?.85:1.1;const rain=c.rain*(.55+.45*Math.sin(s.t/13)**2);const demand=c.demand*(.85+.3*noise);const incoming=c.demand*1.04*pulse;const local=proposed?c.demand*c.localRate/100:0;
 s.externalIn+=incoming;s.localIn+=local;s.totalDemand+=demand;let delivered=0,externalDelivered=0,processed=0;
 for(const n of s.nodes){n.queue+=incoming*n.share;const capacity=n.capacity*(1-rain/100);const unload=Math.min(n.queue,capacity,Math.max(0,n.storage-n.external-n.local));n.queue-=unload;n.external+=unload;n.local+=local*n.share;n.processed+=unload;processed+=unload;
 const handlingLoss=unload*.03;n.external-=handlingLoss;s.lost+=handlingLoss;s.waste+=handlingLoss;
 const request=demand*n.share;const give=Math.min(request,n.external+n.local);const fromLocal=Math.min(n.local,give);n.local-=fromLocal;n.external-=give-fromLocal;n.delivered=give;delivered+=give;externalDelivered+=give-fromLocal;
 const spoil=n.external*.004+n.local*.002;s.lost+=spoil;s.waste+=spoil;n.external*=.996;n.local*=.998;
 }
 s.delivered+=delivered;s.externalDelivered+=externalDelivered;s.localDelivered+=delivered-externalDelivered;
 const removal=Math.min(s.waste,proposed?c.wasteRemoval:1);s.waste-=removal;s.processedWaste+=removal;
 const queue=s.nodes.reduce((a,n)=>a+n.queue,0);const pressure=s.nodes[0].queue/1000+s.waste/150;
 const support=proposed?c.refugeSlots:75;s.habitat=Math.max(0,Math.min(support,s.habitat+(support-s.habitat)*.035-pressure*.25-rain*.004));
 const previous=s.history.slice(-11);const food=(delivered+previous.reduce((a,h)=>a+h.deliveredStep,0))/(demand+previous.reduce((a,h)=>a+h.demandStep,0))*100;
 const habitat=Math.min(100,s.habitat/80*100);s.criticalFood=food<c.foodLimit?s.criticalFood+1:0;s.criticalHabitat=habitat<c.habitatLimit?s.criticalHabitat+1:0;s.t++;
 const totalProcessed=s.nodes.reduce((a,n)=>a+n.processed,0);const row={tick:s.t,food,habitat,queue,waste:s.waste,concentration:totalProcessed?Math.max(...s.nodes.map(n=>n.processed))/totalProcessed*100:0,dependence:s.delivered?s.externalDelivered/s.delivered*100:0,deliveredStep:delivered,demandStep:demand,processedStep:processed,rain,criticalFood:s.criticalFood,criticalHabitat:s.criticalHabitat};s.history.push(row);
 for(const n of s.nodes){const overloaded=n.queue>n.capacity*4;if(overloaded&&!n.overloaded)s.events.push({tick:s.t,type:'Falla localizada',node:n.id,detail:'Carga en espera supera cuatro capacidades de atención por paso.'});n.overloaded=overloaded;}
 if(s.criticalFood>=c.persistence||s.criticalHabitat>=c.persistence){s.done=true;s.firstFailure=s.t;s.reason=s.criticalFood>=c.persistence?'Pérdida persistente de abastecimiento':'Pérdida persistente de acceso a refugio';s.events.push({tick:s.t,type:'Game over',detail:s.reason});}
 else if(s.t>=c.horizon){s.done=true;s.reason='No alcanzado hasta horizonte simulado';}
 return row;
}
export function runPair(config){return ['actual','propuesta'].map(k=>{const s=createRun(k,config);while(!s.done)step(s);return s;});}
export function balance(s){const stored=s.nodes.reduce((a,n)=>a+n.external+n.local+n.queue,0);return s.externalIn+s.localIn-stored-s.delivered-s.lost;}
