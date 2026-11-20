import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {indicators} from './indicator-content.js?v=supply1';
const $=s=>document.querySelector(s),host=$('#canvas-host'),status=$('#model-status');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true});}catch(error){status.textContent='No se pudo iniciar el visor 3D. Activa la aceleración gráfica y recarga.';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setClearColor(0x080c10);host.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.01,100),controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.minDistance=.2;controls.maxDistance=25;controls.maxPolarAngle=Math.PI*.485;
scene.add(new THREE.HemisphereLight(0xffffff,0x3a444c,2));const sunlight=new THREE.DirectionalLight(0xffffff,1.4);sunlight.position.set(-4,10,5);scene.add(sunlight);
const meshCache=new Map(),terrain=new THREE.Group();scene.add(terrain);let current='P1',activeMesh=null,seq=0,flight=null;
const buildings=new THREE.Group(),contours=new THREE.Group();scene.add(buildings,contours);
let contextPromise;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
controls.addEventListener('start',()=>flight=null);
new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}).observe(host);
function moveCamera(target,position){flight={start:performance.now(),from:camera.position.clone(),fromTarget:controls.target.clone(),target,position};}
function overview(animate=true,top=false){const target=new THREE.Vector3(0,.3,0),position=target.clone().add(top?new THREE.Vector3(0,8.9,.001):new THREE.Vector3(5.4,5.6,6.6)).sub(target).multiplyScalar(Math.max(1,1.25/camera.aspect)).add(target);if(animate)moveCamera(target,position);else{controls.target.copy(target);camera.position.copy(position);controls.update();}}
function focus(){if(!activeMesh)return;const box=new THREE.Box3().setFromObject(activeMesh),target=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());const distance=Math.max(size.x,size.z,size.y,1.3)*1.7*Math.max(1,1.25/camera.aspect);moveCamera(target,target.clone().add(new THREE.Vector3(.6,.68,.8).normalize().multiplyScalar(distance)));}
overview(false);$('#overview').onclick=()=>overview();$('#focus-result').onclick=focus;$('#plan').onclick=()=>overview(true,true);$('#terrain').onchange=e=>terrain.visible=e.target.checked;
function render(t){requestAnimationFrame(render);if(flight){const f=flight,k=Math.min(1,(t-f.start)/(reduced?1:850)),u=1-(1-k)**3;camera.position.lerpVectors(f.from,f.position,u);controls.target.lerpVectors(f.fromTarget,f.target,u);if(k===1)flight=null;}controls.update();renderer.render(scene,camera);}requestAnimationFrame(render);
async function readJSON(url){const r=await fetch(url);if(!r.ok)throw new Error(url);return r.json();}
async function binary(url){const r=await fetch(url);if(!r.ok)throw new Error(url);return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();}
const manifestPromise=readJSON('./data/indicators/geometry.json?v=solid1');
async function getSurface(key){if(meshCache.has(key))return meshCache.get(key);const manifest=await manifestPromise,meta=manifest.meshes[key==='P2structural'?'P2mountains':key],raw=await binary('./data/indicators/'+meta.file);if(raw.byteLength!==meta.bytes)throw new Error('Superficie incompleta');const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(raw,0,meta.vertices*3),3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(raw,meta.vertices*12,meta.indices),1));const rgb=new Uint8Array(raw,meta.vertices*12+meta.indices*4,meta.vertices*3),colors=new Float32Array(rgb.length),color=new THREE.Color();for(let i=0;i<rgb.length;i+=3){color.setRGB(rgb[i]/255,rgb[i+1]/255,rgb[i+2]/255,THREE.SRGBColorSpace);colors[i]=color.r;colors[i+1]=color.g;colors[i+2]=color.b;}g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.computeVertexNormals();const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.78,metalness:0}));mesh.visible=false;mesh.name=meta.layer;scene.add(mesh);meshCache.set(key,mesh);return mesh;}
async function loadTerrain(){const model=await readJSON('./data/model.json');for(const part of model.layers.Mesh_Terrain.parts){const raw=await binary('./data/'+part.file);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(raw,0,part.vertices*3),3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(raw,part.vertices*12,part.indices),1));g.computeVertexNormals();terrain.add(new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:0x24313a,side:THREE.DoubleSide})));}document.body.dataset.terrainReady='true';}
async function loadUrbanContext(){
 if(contextPromise)return contextPromise;
 contextPromise=(async()=>{const model=await readJSON('./data/model.json');let loaded=0;const total=model.layers.Buildings.parts.length+model.layers.CNiv.parts.length;
 for(const key of ['Buildings','CNiv'])for(const part of model.layers[key].parts){
 const raw=await binary('./data/'+part.file);if(raw.byteLength!==part.bytes)throw Error('Modelo urbano incompleto');
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(raw,0,part.vertices*3),3));let obj;
 if(key==='CNiv'){obj=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x70848c,transparent:true,opacity:.19}));obj.position.y=.001;contours.add(obj);}
 else{g.setIndex(new THREE.BufferAttribute(new Uint32Array(raw,part.vertices*12,part.indices),1));g.computeVertexNormals();obj=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:0x40515b,side:THREE.DoubleSide}));buildings.add(obj);}
 loaded++;$('#p1-context-status').textContent='Cargando mapa urbano · '+Math.round(loaded/total*100)+' %';await new Promise(requestAnimationFrame);
 }
 $('#p1-context-status').textContent='Base urbana cargada · edificios, curvas y terreno del modelo original';document.body.dataset.urbanContextReady='true';
 })().catch(e=>{$('#p1-context-status').textContent='La base urbana no terminó de cargar. Recarga para reintentar.';console.error(e)});return contextPromise;
}
const contextControls=document.createElement('div');contextControls.id='p1-context-controls';contextControls.innerHTML='<label><input id="p1-buildings" type="checkbox" checked> Edificios</label><label><input id="p1-contours" type="checkbox" checked> Curvas de nivel</label><span id="p1-context-status" role="status">Preparando base urbana…</span>';
$('#indicator-viewport').append(contextControls);
$('#p1-buildings').onchange=e=>buildings.visible=current==='P1'&&e.target.checked;
$('#p1-contours').onchange=e=>contours.visible=current==='P1'&&e.target.checked;
function legend(map){if(map.pending)return '<p class="missing-data">Sin serie espacial verificable para el polígono.</p>';return map.continuous?`<div class="ramp" style="${map.gradient?`background:${map.gradient}`:''}"></div><div class="range"><span>${escape(map.rangeLabels?.[0]||'0 · menor')}</span><span>${escape(map.rangeLabels?.[1]||'1 · mayor')}</span></div><p>${escape(map.unit)}</p><p>${escape(map.maskNote||'Negro fuera de la máscara: sin estimación. Dentro: valor nulo o muy bajo.')}</p>`:`<div class="categories">${map.legend.map(([c,label])=>`<span><i class="swatch" style="background:${c}"></i>${escape(label)}</span>`).join('')}</div>`;}
function openMap(index){const map=indicators[current].maps[index];$('#dialog-title').textContent=map.title;$('#dialog-image').src='./data/indicators/'+map.file+'.png';$('#dialog-image').alt=map.title+' · mapa de entrada original';$('#dialog-legend').className='legend';$('#dialog-legend').innerHTML=legend(map);$('#dialog-note').textContent=map.note;$('#original-map').href=$('#dialog-image').src;$('#map-dialog').showModal();}
$('#close-map').onclick=()=>$('#map-dialog').close();$('#map-dialog').onclick=e=>{if(e.target===$('#map-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}};
async function selectIndicator(key){if(!indicators[key])throw new Error('Indicador no válido');const request=++seq;current=key;buildings.visible=key==='P1'&&$('#p1-buildings').checked;contours.visible=key==='P1'&&$('#p1-contours').checked;if(key==='P1'){
 if(activeMesh)activeMesh.visible=false;
 document.body.dataset.indicator=key;document.body.dataset.indicatorReady='false';history.replaceState(null,'','#P1');
 document.querySelectorAll('button[data-indicator]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.indicator===key)));
 $('#r-viewport-slot').append($('#indicator-viewport'));loadUrbanContext();
 const hour=$('#r-hour')?.value||'1100';
 $('#surface-origin').textContent='ICR · RESULTADO COMBINADO EN 3D';$('#support').textContent='24/02/2026 · '+hour.slice(0,2)+':00 · 6 aforos · montañas gráficas sólidas';
 status.textContent='Cargando relieve del indicador…';
 try{const mesh=await getSurface('P1mountain'+hour);if(request!==seq)return;activeMesh=mesh;mesh.visible=true;status.textContent='';document.body.dataset.indicatorReady='true';focus();return {indicator:key,layer:mesh.name};}
 catch(error){if(request===seq)status.textContent='No se pudo cargar el relieve. Cambia de hora para reintentar.';throw error;}
 }
 $('#p4-options').after($('#indicator-viewport'));
 $('#p4-options').hidden=key!=='P4';const d=indicators[key];$('#supply-time').hidden=key!=='P1';$('#supply-context').hidden=key!=='P1';if(key==='P1'){const hour=$('#supply-hour').value;d.surfaceKey='P1supply'+hour;for(const m of d.maps)if(m.timePrefix)m.file=m.timePrefix+hour;updateSupplyContext().catch(console.error);}$('#structural-status').hidden=!d.status;if(d.status){$('#structural-method-link').href=d.methodDownload||'./data/indicators/estructurales_metodologia.json';$('#structural-sources-link').href=d.sourcesDownload||'./data/indicators/estructurales_fuentes.zip';$('#structural-state').textContent=d.status;$('#structural-reading').textContent=d.reading;$('#structural-coverage').textContent=d.support;$('#structural-pending').innerHTML=d.pending.map(x=>`<li>${escape(x)}</li>`).join('');}$('#surface-origin').textContent=key==='P1'?'COINCIDENCIA LOCAL · '+$('#supply-hour').selectedOptions[0].textContent:d.status?'SUPERFICIE 3D · DIAGNÓSTICO PARCIAL':'SUPERFICIE 3D · MODELO TERRITORIAL';document.body.dataset.indicator=key;document.body.dataset.indicatorReady='false';history.replaceState(null,'','#'+key);document.querySelectorAll('button[data-indicator]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.indicator===key)));$('#problem-title').textContent=d.title;$('#problem-text').textContent=d.problem;$('#period').textContent=d.period;$('#support').textContent=key==='P4'?$('#p4-mode').selectedOptions[0].textContent:d.support;$('#formula').textContent=d.formula;$('#formula-explanation').textContent=d.explanation;$('#variables').innerHTML=d.variables.map(x=>`<li>${escape(x)}</li>`).join('');$('#limits').textContent=d.limits;$('#methodology').textContent=d.method+(key==='P2'?' Presentación 3D: suavizado visual de 1,25 celdas y descenso a la base en las tres celdas del borde; malla cerrada con fondo. Las pendientes y alturas suavizadas son gráficas, no nuevos valores de D₂. Los mapas y la ecuación originales se conservan.':'');$('#input-maps').innerHTML=d.maps.map((m,i)=>m.pending?`<article class="input-card pending-card"><div class="pending-body"><h3><span class="variable">${m.variable}</span>${escape(m.title)}</h3><p class="map-role">${escape(m.role)}</p>${legend(m)}<p>${escape(m.note)}</p></div><a class="source-link" href="${m.source}" target="_blank" rel="noopener">Fuente a completar: ${escape(m.sourceLabel)} ↗</a></article>`:`<article class="input-card"><div class="card-body"><button class="map-preview" data-map="${i}" aria-label="Ampliar ${escape(m.title)}"><img src="./data/indicators/${m.file}.png" alt="${escape(m.title)} · mapa original a color"><span>Ampliar ↗</span></button><div><h3><span class="variable">${m.variable}</span>${escape(m.title)}</h3>${m.role?`<p class="map-role">${escape(m.role)}</p>`:''}<div class="legend">${legend(m)}</div><p>${escape(m.note)}</p></div></div><a class="source-link" href="${m.source}" target="_blank" rel="noopener">Fuente: ${escape(m.sourceLabel)} ↗</a></article>`).join('');document.querySelectorAll('[data-map]').forEach(b=>b.onclick=()=>openMap(Number(b.dataset.map)));if(activeMesh)activeMesh.visible=false;status.textContent='Cargando superficie…';try{const meshKey=key==='P4'?$('#p4-mode').value:(d.surfaceKey||key);const mesh=await getSurface(meshKey);if(request!==seq)return;activeMesh=mesh;mesh.visible=true;status.textContent='';document.body.dataset.indicatorReady='true';if(d.status)focus();else overview();return {indicator:key,title:d.title,formula:d.formula,layer:mesh.name};}catch(error){if(request===seq)status.textContent='No se pudo cargar la superficie. Selecciona el indicador para reintentar.';throw error;}}
document.querySelectorAll('button[data-indicator]').forEach(b=>b.onclick=()=>selectIndicator(b.dataset.indicator).catch(console.error));
const modeNotes={P4traffic:'V2: X(0,5C + 0,5Z), con congestión promedio de las ZAT. Cobertura 96,12 % del área; huecos sin datos. Septiembre 2026, días hábiles, horas 07 y 08.',P4:'Solo 0,5XZ: componente de calzada sin sumar congestión. Permite comparar el efecto del término C dentro del escenario, no un cambio real observado.'};
function updateModeNote(){$('#p4-mode-note').textContent=modeNotes[$('#p4-mode').value];}
$('#p4-mode').onchange=()=>{updateModeNote();selectIndicator('P4').catch(console.error);};updateModeNote();
loadTerrain().catch(error=>{const label=$('#terrain').closest('label');$('#terrain').checked=false;$('#terrain').disabled=true;label.title='No se pudo cargar el terreno de contexto. Recarga para reintentar.';label.append(' · no disponible');console.error(error);});
if(document.modelContext?.registerTool){document.modelContext.registerTool({name:'select_kennedy_indicator',title:'Explorar indicador territorial',description:'Muestra una superficie 3D, mapas de entrada, contexto, datos pendientes y su ecuación.',inputSchema:{type:'object',properties:{indicator:{type:'string',enum:['P1','P2','P3','P4']}},required:['indicator'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:({indicator})=>selectIndicator(indicator)}).catch(console.error);}

const supplyDataPromise=readJSON('./data/indicators/P1_supply_data.json');
async function updateSupplyContext(){
 const data=await supplyDataPromise;if(current!=='P1')return;
 const stats=data.stats,fmt=new Intl.NumberFormat('es-CO',{maximumFractionDigits:2}),pct=v=>fmt.format(v*100)+' %';
 $('#supply-stats').innerHTML=[
  [pct(stats.share_monitored_markets),'Cuota entre cuatro mercados monitoreados','Q = '+fmt.format(stats.corabastos_tonnes)+' / '+fmt.format(stats.four_markets_tonnes)+' toneladas. No es la cuota de todo el abastecimiento de Bogotá.'],
  [pct(stats.recorded_outside_bogota_fraction),'Procedencia registrada fuera de Bogotá','Incluye otras regiones colombianas y el extranjero. El despacho desde Bogotá no prueba producción dentro de la ciudad.'],
  [pct(stats.foreign_origin_fraction),'Procedencia extranjera registrada','Fracción de las toneladas que ingresaron a Corabastos en el período; no del consumo de Bogotá.']
 ].map(([value,label,note])=>`<article><strong>${value}</strong><h3>${label}</h3><p>${note}</p></article>`).join('');
 const months={'2026-01':'Enero','2026-02':'Febrero','2026-03':'Marzo','2026-04':'Abril'};
 $('#supply-months').innerHTML=stats.monthly_share.map(r=>`<div class="supply-month"><span>${months[r.month]}</span><meter min="0" max="1" value="${r.share}" aria-label="Participación ${months[r.month]}"></meter><b>${pct(r.share)}</b></div>`).join('');
 const period=data.periods.find(p=>p.id===$('#supply-hour').value);
 $('#supply-counts').innerHTML=period.rows.map((r,i)=>`<tr><td>${i+1}. ${escape(r.address.replaceAll('_',' '))}</td><td>${fmt.format(r.trucks)}</td><td>${fmt.format(r.pedestrians)}</td><td>${fmt.format(r.index)}</td></tr>`).join('');
}
$('#supply-hour').onchange=()=>selectIndicator('P1').catch(console.error);

window.addEventListener('p1-hour-change',()=>{if(current==='P1')selectIndicator('P1').catch(console.error)});
const first=location.hash.slice(1);selectIndicator(indicators[first]?first:'P1').catch(console.error);
