import {writeFileSync} from 'node:fs';
writeFileSync('lote-engine.mjs',`export const baseline={floors:1,footprint:50,habitat:10,cargo:15,parking:10,roads:15,vertical:6,demand:24};
export function simulate(c){const sum=c.footprint+c.habitat+c.cargo+c.parking+c.roads;if(sum>100.0001)throw Error('El reparto supera 100%');
const bays=Math.floor(c.cargo/5),slots=Math.floor(c.parking/2),entryPerHour=Math.floor(c.roads/3)*6;
const verticalShare=1-1/c.floors,verticalRate=c.vertical;let external=[],internal=[],busy=[],vertical=[],done=0,id=0,credit=0,gate=0,move=0,wait=0,started=0;const history=[];
for(let t=1;t<=360;t++){credit+=c.demand/60;while(credit>=1-1e-9){credit--;external.push({id:++id,born:t});}gate=Math.min(1,gate+entryPerHour/60);
while(gate>=1&&external.length&&internal.length<slots){internal.push(external.shift());gate--;}
const finishing=busy.filter(x=>x.end<=t);busy=busy.filter(x=>x.end>t);for(const x of finishing){if(verticalShare>0)vertical.push({remaining:verticalShare});else done++;}
move=vertical.length?Math.min(1,move+verticalRate/60):0;while(vertical.length&&move>0){const d=Math.min(move,vertical[0].remaining);vertical[0].remaining-=d;move-=d;if(vertical[0].remaining<1e-9){vertical.shift();done++;}}
// Limited receiving buffer: each occupied transfer place blocks one loading bay.
while(internal.length&&busy.length+vertical.length<bays){const x=internal.shift();wait+=t-x.born;started++;busy.push({...x,end:t+6});}
history.push({minute:t,external:external.length,internal:internal.length,unloading:busy.length,vertical:vertical.length,done});}
return {config:c,bays,slots,entryPerHour,useful:c.footprint*c.floors,free:100-sum,wait:started?wait/started:0,arrived:id,...history.at(-1),history};}
`);
