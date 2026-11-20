import {writeFileSync} from 'node:fs';
import {Model,defaults} from './laboratorio-engine.mjs';
const runs=[];
for(const demand of [12,30])for(const seed of [11,22,33,42,55])for(const scenario of [0,1,2]){const m=new Model({...defaults,arrivals:demand,seed,scenario});m.run();runs.push({demand,seed,scenario,config:m.c,result:m.result,maxQueue:Math.max(...m.history.map(r=>r.queueA+r.queueB+r.queueC)),balance:m.balances()});if(seed===42)writeFileSync(`data/entrega-1104/ejecucion-${demand}-S${scenario}.json`,JSON.stringify(m.export()));}
const summaries=[];for(const demand of [12,30])for(const scenario of [0,1,2]){const subset=runs.filter(r=>r.demand===demand&&r.scenario===scenario);const stats=fn=>{const x=subset.map(fn);return{mean:x.reduce((a,b)=>a+b,0)/x.length,min:Math.min(...x),max:Math.max(...x)}};summaries.push({demand,scenario,completed:stats(r=>r.result.completed),queue:stats(r=>r.result.queueA+r.result.queueB+r.result.queueC),wait:stats(r=>r.result.waitMean),waste:stats(r=>r.result.wasteKg),retreat:stats(r=>r.result.retreatAgentMinutes)});}
writeFileSync('data/entrega-1104/pruebas-comparativas.json',JSON.stringify({date:'2026-11-04',status:'Resultados sintéticos del prototipo; no mediciones territoriales',seeds:[11,22,33,42,55],duration:360,summaries,runs},null,2));
console.log(JSON.stringify(summaries,null,2));
