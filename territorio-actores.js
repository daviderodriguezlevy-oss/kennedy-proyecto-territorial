const $=s=>document.querySelector(s),NS='http://www.w3.org/2000/svg';
const data=await fetch('data/programa/actores-territorio.json?v=53').then(r=>{if(!r.ok)throw Error('Datos de actores');return r.json()});
if(!window.territorialMap)await new Promise(resolve=>window.addEventListener('territorial-map-ready',resolve,{once:true}));
const map=window.territorialMap,svg=$('#map'),actors=new Map(data.actors.map(a=>[a.id,a])),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const meta={
67:{p:[-910,370],area:'María Paz · vivienda y cuidados',color:'#b6c6d0',type:'cotidiana',why:'Acercar la interlocución residencial a hogares, recorridos cotidianos y espacios accesibles de reunión.',spaces:['E10','E11','E12','E16']},
63:{p:[-670,710],area:'Borde comercial Corabastos–María Paz',color:'#cdb696',type:'cotidiana',why:'Articular comercio de proximidad, acceso de compradores y reparto separado de la circulación peatonal.',spaces:['E19','E22','E12']},
66:{p:[-930,1160],area:'Accesos de abastecimiento',color:'#9fb9c7',type:'logistica',why:'Vincular la coordinación de transportadores con los accesos, la espera y la capacidad de carga y descarga.',spaces:['E07','E14','E19']},
65:{p:[-1160,1400],area:'Áreas de trabajo y apoyo a carga',color:'#cabba7',type:'logistica',why:'Situar la participación laboral junto a las operaciones y a los espacios de descanso, servicios y seguridad.',spaces:['E01','E04','E07']},
75:{p:[-1310,1070],area:'Corabastos · operación logística',color:'#a9c4cb',type:'logistica',why:'Relacionar recepción, conservación y despacho con decisiones sobre capacidad y distribución de operaciones.',spaces:['E01','E04','E07','E19']},
24:{p:[-1030,870],area:'Interfaz de recuperación de alimentos',color:'#c7c5a0',type:'logistica',why:'Conectar donantes, selección, conservación y receptores mediante un circuito de alimentos aptos para consumo.',spaces:['E05','E04']},
31:{p:[-1450,700],area:'Área operativa de materiales',color:'#b6acc6',type:'ecologica',why:'Vincular separación, almacenamiento y retiro con accesos técnicos y condiciones sanitarias.',spaces:['E06','E23','E07']},
35:{p:[-1840,1270],area:'La Vaca · mantenimiento hídrico',color:'#8ebfbb',type:'ecologica',why:'Articular el cuidado del agua con acceso técnico condicionado y seguimiento de la capacidad hídrica.',spaces:['E08','E13','E15']},
37:{p:[-1650,560],area:'Borde vegetal y conexiones de hábitat',color:'#a8c5a1',type:'ecologica',why:'Relacionar vegetación, mantenimiento y recursos de hábitat en bordes compatibles con su funcionamiento.',spaces:['E09','E12','E13']},
36:{p:[-1690,1530],area:'La Vaca · seguimiento de fauna',color:'#b1c6ab',type:'ecologica',why:'Vincular observación y vocería técnica con refugio, agua, alimento y control de perturbaciones.',spaces:['E08','E09','E13']}
};
const actual=[{id:25,members:[26,30,31],title:'OPERACIÓN DE CORABASTOS',ref:75},{id:35,members:[41],title:'MANTENIMIENTO HÍDRICO',ref:35},{id:37,members:[40,4],title:'CUIDADO DEL ARBOLADO',ref:37},{id:36,members:[38],title:'MANEJO DE FAUNA',ref:36},{id:43,members:[44,15],title:'ASEO Y COMERCIO',ref:63},{id:24,members:[13,23],title:'RECUPERACIÓN DE ALIMENTOS',ref:24}].map(h=>({...h,...meta[h.ref]}));
const proposed=data.hubs.map(h=>({...h,...meta[h.id]}));
const extra=[{a:13,b:19,label:'coordina preparación y manejo de alimentos',type:'logistica'},{a:19,b:20,label:'coordina entrega y descarga',type:'logistica'},{a:14,b:18,label:'entrega alimentos al comprador',type:'cotidiana'},{a:15,b:16,label:'coordina abastecimiento de proximidad',type:'cotidiana'},{a:22,b:33,label:'entrega materiales separados para clasificación',type:'ecologica'},{a:11,b:12,label:'comparte observaciones de hábitat',type:'gestion'},{a:40,b:41,label:'coordina riego y mantenimiento hídrico',type:'ecologica'},{a:3,b:5,label:'acuerda necesidades de acceso y cuidados',type:'cotidiana'}].map(e=>({...e,status:'propuesta',detail:'Relación directa incorporada al escenario territorial; acción propuesta para evaluación.'}));
let mode='actual',expanded=new Set(),selected=null,filter='all',showProgram=false;
function make(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs||{}))e.setAttribute(k,v);parent?.append(e);return e}
const root=make('g',{id:'territorial-actors'},svg),areas=make('g',{id:'actor-areas'},root),lines=make('g',{id:'actor-links'},root),nodes=make('g',{id:'actor-points'},root);
const currentHubs=()=>mode==='actual'?actual:proposed;
const currentEdges=()=>mode==='actual'?data.links.filter(l=>l.status==='documentada'):[...data.links,...extra];
function ownerMap(){return new Map(currentHubs().flatMap(h=>[h.id,...h.members].map(id=>[id,h.id])))}
function pos(h,id){if(id===h.id)return h.p;if(id===72)return [-2520,450];if(id===73)return [-2520,1060];const index=h.members.indexOf(id),n=h.members.length,angle=-Math.PI/2+index*Math.PI*2/n;return [h.p[0]+Math.cos(angle)*135,h.p[1]+Math.sin(angle)*125]}
function institution(id){return data.extraInstitutions[id]||({25:'Corabastos · gerencia',26:'Corabastos · Junta',30:'Interventoría de aseo',31:'Operación de recolección',35:'Secretaría Distrital de Ambiente · humedal',36:'Secretaría Distrital de Ambiente · fauna',37:'Jardín Botánico de Bogotá · arbolado',38:'IDPYBA · bienestar animal',41:'EAAB y mantenimiento hídrico',43:'Coordinación de aseo en el ámbito',44:'Servicios públicos',24:'Recuperación de alimentos'})[id]||'Participante o perfil de la red del proyecto'}
function render(){
 areas.replaceChildren();lines.replaceChildren();nodes.replaceChildren();const hubs=currentHubs(),owners=ownerMap(),edges=currentEdges();
 const visible=new Map();for(const h of hubs){visible.set(h.id,{h,p:h.p,rep:true});if(expanded.has(h.id))for(const id of h.members)visible.set(id,{h,p:pos(h,id),rep:false})}
 const reduced=new Map();for(const e of edges){const a=visible.has(e.a)?e.a:owners.get(e.a),b=visible.has(e.b)?e.b:owners.get(e.b);if(!a||!b||a===b||!visible.has(a)||!visible.has(b))continue;const kind=e.type||(owners.get(e.a)!==owners.get(e.b)?'gestion':visible.get(a).h.type);if(filter!=='all'&&filter!==kind)continue;const key=`${a}-${b}-${kind}`;if(!reduced.has(key))reduced.set(key,{a,b,kind,list:[]});reduced.get(key).list.push(e)}
 for(const h of hubs){if(expanded.has(h.id)){make('ellipse',{cx:h.p[0],cy:h.p[1],rx:170,ry:160,fill:h.color,opacity:.055,stroke:h.color,'stroke-dasharray':'6 8'},areas)}}
 for(const e of reduced.values()){
 const [x,y]=visible.get(e.a).p,[xx,yy]=visible.get(e.b).p,dx=xx-x,dy=yy-y,len=Math.hypot(dx,dy)||1;
 const d=`M ${x} ${y} Q ${(x+xx)/2-dy/len*26} ${(y+yy)/2+dx/len*26} ${xx-dx/len*27} ${yy-dy/len*27}`;
 const external=[e.a,e.b].some(id=>id===72||id===73),physical=e.list.some(l=>extra.includes(l)&&l.label.startsWith('entrega'));
 const path=make('path',{d,class:'territory-link '+(physical?'physical':'decision'),stroke:visible.get(e.a).h.color,'marker-end':'url(#arrow)',tabindex:0,role:'button','aria-label':`${actors.get(e.a).name} a ${actors.get(e.b).name}: ${e.list.length} relaciones`},lines);
 make('title',{},path).textContent=e.list.map(l=>actors.get(l.a).name+' → '+actors.get(l.b).name+': '+l.label).join('\n');
 path.onclick=()=>edgeDetail(e);path.onkeydown=ev=>{if(ev.key==='Enter'){edgeDetail(e)}};
 if(external)path.classList.add('external-link');
 if(physical){const c=make('circle',{r:3,fill:visible.get(e.a).h.color,class:'flow'},lines);c.style.offsetPath=`path('${d}')`}
 }
 for(const[id,v]of visible){
 const {h,p,rep}=v,degree=edges.filter(e=>e.b===id).length,r=rep?24+Math.min(10,Math.sqrt(degree)*2):13+Math.min(6,Math.sqrt(degree));
 const g=make('g',{transform:`translate(${p})`,class:'node territorial-node '+(rep?'representative':'member')+(id===selected?' selected':''),tabindex:0,role:'button','aria-label':actors.get(id).name+(rep?' · desplegar actores':''),'data-territorial-actor':id},nodes);
 if(rep)g.setAttribute('aria-expanded',String(expanded.has(id)));
 make('circle',{r:r+12,fill:h.color,opacity:rep?.12:.06,class:'node-halo'},g);make('circle',{r,fill:'#10212b',stroke:h.color},g);
 const symbol=make('text',{'text-anchor':'middle',y:5,class:'actor-symbol'},g);symbol.textContent=rep?(expanded.has(id)?'−':'+'):(id>=46&&id<=55?'●':'·');
 const label=make('text',{'text-anchor':'middle',y:r+24,class:'name'},g),words=actors.get(id).name.split(' '),half=Math.ceil(words.length/2);
 [words.slice(0,half).join(' '),words.slice(half).join(' ')].filter(Boolean).forEach((t,i)=>make('tspan',{x:0,dy:i?21:0},label).textContent=t);
 g.onclick=()=>choose(id);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(id)}};
 }
 $('#nodes').style.display=showProgram?'':'none';$('#edges').style.display=showProgram?'':'none';
 $('.map-badge span').textContent=mode==='actual'?'RELACIONES DOCUMENTADAS · ÁMBITOS DE ACTUACIÓN':'PROPUESTA · LOCALIZACIÓN CONCEPTUAL';
 $('.map-badge b').textContent=`${hubs.length} representantes · ${visible.size} actores visibles`;
 $('#territory-summary').textContent=(mode==='actual'?'Situación actual: perfiles y relaciones reconstruidos de fuentes 2023–2026.':'Propuesta: diez representantes articulan operación, vida cotidiana y hábitats.')+' Selecciona un representante para desplegar o cerrar sus actores.';
 $('.mapnote').innerHTML='Puntos: ámbitos de actuación, no sedes verificadas.<br>Despliegue radial: relaciones de actores; no posiciones individuales exactas.';
 $('.legend').innerHTML='<span style="--c:#b7cbd0">Representante · + despliega</span><span style="--c:#9ebcb3">Actor relacionado</span><span style="--c:#c9bba0">Discontinua: decisión / cooperación</span><span style="--c:#b9d4ca">Continua: intercambio conceptual</span>';
 $('#territory-catalog').innerHTML='<h3>Representantes y ámbitos</h3>'+hubs.map(h=>`<button class="territory-rep" data-rep="${h.id}" aria-expanded="${expanded.has(h.id)}"><b>${esc(actors.get(h.id).name)}</b><small>${esc(h.area)} · ${h.members.length} actores relacionados</small></button>`).join('');
 $('#territory-catalog').querySelectorAll('[data-rep]').forEach(b=>b.onclick=()=>choose(+b.dataset.rep));
 svg.dataset.visibleActors=visible.size;svg.dataset.territoryMode=mode;svg.dataset.representatives=hubs.length;
}
function sourceHTML(edges){const ids=[...new Set(edges.map(e=>e.source).filter(Boolean))];return ids.length?'<h3>Fuentes de la relación</h3>'+ids.map(id=>`<p><a href="${esc(data.sources[id][1])}" target="_blank" rel="noopener">${id} · ${esc(data.sources[id][0])}</a><br>${esc(data.sources[id][2])}</p>`).join(''):''}
function detail(id){const owner=ownerMap().get(id),h=currentHubs().find(h=>h.id===owner),a=actors.get(id),links=currentEdges().filter(e=>e.a===id||e.b===id);const species=id>=46&&id<=55;
 $('#detail').innerHTML=`<small>${mode==='actual'?'RELACIONES DOCUMENTADAS':'ESCENARIO PROPUESTO'} · ${esc(h.title)}</small><h2>${esc(a.name)}</h2><p>${esc(institution(id))}</p><h3>Ámbito de actuación</h3><p>${id===72||id===73?'Vínculo externo esquemático: destino fuera del polígono, sin localización predial.':esc(h.area)}</p><p>El anclaje identifica el ámbito de intervención o relación. La expansión radial organiza la lectura de los actores asociados.</p><h3>${mode==='actual'?'Relación territorial':'Criterio de localización propuesto'}</h3><p>${mode==='actual'?'Ámbito de referencia para las funciones documentadas de estos perfiles. Las fuentes de cada relación se consultan al final de la ficha.':esc(h.why)}</p>${mode==='propuesta'?`<h3>Decisión y condiciones</h3><p>${esc(h.decision||'Participación en acuerdos del ámbito.')}</p><p>${esc(h.resources||'Recursos y capacidades de los participantes.')}</p>`:''}${species?`<h3>Vocería humana</h3><p>${esc(actors.get(data.reps[id])?.name)}. La posición indica un ámbito de hábitat de referencia, no una observación puntual.</p>`:''}<h3>Espacios relacionados del programa</h3><p>${h.spaces.map(e=>`<a href="programa.html#programa-${e}">${e}</a>`).join(' · ')}</p><h3>Acciones y relaciones</h3>${links.map(e=>`<p><b>${esc(actors.get(e.a).name)} → ${esc(actors.get(e.b).name)}</b><br>${esc(e.label)} <small>· ${esc(e.status)}</small></p>`).join('')}${sourceHTML(links)}<p><a href="actores.html#actor-${id}">Ver actor en la red completa →</a></p>`;
}
function choose(id,force=false){selected=id;const h=currentHubs().find(h=>h.id===id);if(h){if(expanded.has(id)&&!force)expanded.delete(id);else expanded.add(id)}else{const owner=ownerMap().get(id);if(owner)expanded.add(owner)}if(id===72||id===73)map.setView([-2900,100,2700,1850]);render();detail(id)}
function edgeDetail(e){$('#detail').innerHTML='<small>RELACIONES ENTRE ACTORES</small><h2>'+esc(actors.get(e.a).name)+' → '+esc(actors.get(e.b).name)+'</h2><p>La línea resume '+e.list.length+' relaciones. Al desplegar los representantes aparecen sus actores de origen y destino.</p>'+e.list.map(l=>'<p><b>'+esc(actors.get(l.a).name)+' → '+esc(actors.get(l.b).name)+'</b><br>'+esc(l.label)+'<br><small>'+esc(l.status)+'</small></p>').join('')+sourceHTML(e.list)}
function intro(){ $('#detail').innerHTML='<small>ACTORES EN EL TERRITORIO</small><h2>Selecciona un representante</h2><p>Abre sus actores relacionados y sigue las líneas para conocer qué acciones los conectan. Puedes mantener varios representantes desplegados y consultar relaciones entre sus actores.</p><h3>Dos lecturas comparables</h3><p>Actual: relaciones documentadas de la red existente, con sus fuentes y fechas. Propuesta: ámbitos de actuación, vínculos de cooperación y espacios del programa planteados por el proyecto.</p><p>El tamaño depende de las conexiones entrantes de cada actor en esta vista. Los nodos representan perfiles y ámbitos de actuación, no oficinas ni presencia permanente.</p><h3>Asamblea territorial</h3><p>Sus participantes se reúnen en espacios accesibles de gestión. La asamblea es un procedimiento de acuerdos por consentimiento; sus participantes mantienen las conexiones directas entre ámbitos.</p><a href="asamblea.html">Consultar asamblea y decisiones →</a>'}
function options(){const ids=new Set(currentHubs().flatMap(h=>[h.id,...h.members]));const q=$('#territory-search').value.toLocaleLowerCase('es');$('#territory-find').innerHTML='<option value="">Seleccionar actor</option>'+[...ids].filter(id=>actors.get(id).name.toLocaleLowerCase('es').includes(q)).sort((a,b)=>actors.get(a).name.localeCompare(actors.get(b).name,'es')).map(id=>`<option value="${id}">${esc(actors.get(id).name)}</option>`).join('')}
for(const b of document.querySelectorAll('[data-territory-mode]'))b.onclick=()=>{mode=b.dataset.territoryMode;expanded.clear();selected=null;for(const x of document.querySelectorAll('[data-territory-mode]'))x.setAttribute('aria-pressed',String(x===b));render();intro();options()};
$('#collapse-actors').onclick=()=>{expanded.clear();selected=null;render();intro()};
$('#show-program').onchange=e=>{showProgram=e.target.checked;render()};
$('#territory-search').oninput=options;$('#territory-find').onchange=e=>{if(e.target.value)choose(+e.target.value,true)};
$('#filter').addEventListener('change',e=>{filter=e.target.value;render()});
document.querySelector('.external').addEventListener('click',e=>{if(e.target.closest('[data-id]')){showProgram=true;$('#show-program').checked=true;render()}});
$('#catalog').addEventListener('click',()=>{showProgram=true;$('#show-program').checked=true;render()});
$('#zone').addEventListener('click',()=>map.setView([-2160,100,1850,1800]));
map.setView([-2160,100,1850,1800]);
render();intro();options();document.body.dataset.territoryReady='true';
