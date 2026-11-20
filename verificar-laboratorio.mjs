import assert from 'node:assert/strict';
import {Model} from './laboratorio-engine.mjs';
let tested=0;
for(const scenario of [0,1,2])for(const arrivals of [0,12,30])for(const remove of [0,40,100]){
 const m=new Model({scenario,arrivals,remove,seed:42});
 while(m.t<360){m.step();const b=m.balances();for(const value of Object.values(b))assert(Math.abs(value)<1e-6);assert(m.stations.every(s=>s.waste>=0));assert(m.patches.every(p=>p.food>=-1e-9&&p.food<=40));assert(m.trucks.every(t=>t.state!=='salida'||t.end>=t.start));}
 const copy=new Model({scenario,arrivals,remove,seed:42});copy.run();assert.deepEqual(copy.history,m.history);assert.equal(m.trucks.length,arrivals*6);tested++;
}
const a=new Model({scenario:2,arrivals:30});a.run();assert(a.trucks.filter(t=>t.dest===1&&t.state==='salida').every(t=>t.end<180));
const rows=[0,1,2].map(scenario=>{const m=new Model({scenario});return {scenario,...m.run(),balance:m.balances()}});
console.log(JSON.stringify({tested,checks:'balances, reproducibility, demand, stocks, interruption',rows}));
