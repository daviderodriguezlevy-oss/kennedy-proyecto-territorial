import assert from 'node:assert/strict';import {simulate,baseline} from './lote-engine.mjs';
for(const demand of [0,24,60])for(const floors of [1,2,6])for(const vertical of [0,6,30]){const r=simulate({...baseline,demand,floors,vertical});assert.equal(r.arrived,demand*6);for(const h of r.history)assert.equal(h.done+h.external+h.internal+h.unloading+h.vertical,Math.floor(h.minute*demand/60+1e-8));assert(r.free>=0);}
for(const key of ['cargo','parking','roads']){const r=simulate({...baseline,[key]:0});assert(Number.isFinite(r.wait));}
console.log('30 escenarios comprobados: conservación de cargas, demanda y casos de capacidad cero.');console.log(JSON.stringify([simulate(baseline),simulate({...baseline,floors:2,footprint:25,habitat:25,cargo:20,parking:15})].map(({history,...r})=>r)));
