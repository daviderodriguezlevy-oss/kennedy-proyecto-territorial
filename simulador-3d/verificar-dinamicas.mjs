import assert from 'node:assert/strict';import {modes,effects} from './dynamics-rules.mjs';
let n=0;for(const type of Object.keys(modes))for(let hour=0;hour<24;hour+=.25)for(const rain of [0,50,100])for(const temp of [5,19,35])for(const wind of [0,70]){const e=effects(type,hour,rain,temp,wind);assert(Object.values(e).every(x=>Number.isFinite(x)&&x>=0));assert(e.hourFactor*e.weatherFactor<=2);n++;}
for(const type of ['bike','moto','person'])assert(effects(type,8,100,19,5).weatherFactor<effects(type,8,0,19,5).weatherFactor);
assert(effects('car',8,100,19,5).weatherFactor>effects('car',8,0,19,5).weatherFactor);
console.log(n+' combinaciones de hora y clima comprobadas.');
