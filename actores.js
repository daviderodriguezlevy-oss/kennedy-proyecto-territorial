import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {DATA as D} from './actor-data.js?v=compare1';
const $=x=>document.querySelector(x),esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search),embedded=params.has('embed');
let network=params.get('network')==='everyday'?'everyday':'institutional';
if(embedded)document.body.classList.add('embedded');
const descriptions={
institutional:'Quién representa, coordina, decide y ejecuta. Elaboración propia con funciones institucionales y relaciones propuestas; no es una red extraída del POT.',
everyday:'Cómo se coordinan trabajo, comercio, cuidados y uso del espacio. Modelo de relaciones posibles que debemos contrastar en Kennedy.',
compare:'Compara los mismos actores por su papel en cada lectura. Ambas usan las mismas posiciones, colores y tamaños para no confundir cambios de dibujo con cambios de poder.'
};
function setNetwork(v){
 network=v;selected=null;$('#search').value='';$('#group').value='all';
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));
 $('#view-explanation').textContent=descriptions[v];$('#comparison').hidden=v!=='compare';$('main').hidden=v==='compare';
 if(v==='compare'){document.querySelectorAll('iframe[data-src]').forEach(f=>{if(!f.src)f.src=f.dataset.src;});}
 else refresh();
 $('#detail').innerHTML='<h2>Selecciona un actor</h2><p>Las flechas indican acciones concretas. Abre una ficha para leer la relación y su evidencia.</p>';
}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setNetwork(b.dataset.view));
window.addEventListener('message',ev=>{
 if(ev.origin!==location.origin)return;
 if(ev.data?.type==='actor-pick'&&!embedded)document.querySelectorAll('iframe').forEach(f=>f.contentWindow.postMessage({type:'actor-sync',id:ev.data.id},location.origin));
 if(ev.data?.type==='actor-sync'&&embedded){
  $('#search').value='';$('#group').value='all';
  const n=D.nodes.find(n=>n.id===ev.data.id);
  if(n?.views.includes(network))select(n.id,false);
  else{selected=null;refresh();$('#detail').innerHTML='<h2>Actor no incluido en esta lectura</h2><p>Esto no demuestra ausencia de participación o de relaciones reales.</p>';}
 }
});
let selected=null,moving=true,names=true,focus=null;
const byId=new Map(D.nodes.map(n=>[n.id,n]));
D.groups.forEach((g,i)=>$('#group').insertAdjacentHTML('beforeend',`<option value="${i}">${g.name}</option>`));
const host=$('#viewer'),scene=new THREE.Scene();scene.background=new THREE.Color('#090f14');
const camera=new THREE.PerspectiveCamera(48,1,.1,400);camera.position.set(0,13,56);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true});}catch(e){$('#status').textContent='El visor 3D no está disponible. Explora los actores y relaciones desde la lista.';}
const meshes=[],lines=[],labels=[],pos=new Map(),loader=new THREE.TextureLoader();
let controls;
if(renderer){renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;host.prepend(renderer.domElement);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=5;controls.maxDistance=100;scene.add(new THREE.HemisphereLight(0xdbe7e8,0x101923,3));
 const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(8,15,15);scene.add(light);
 const grid=new THREE.GridHelper(60,30,0x253740,0x14212a);grid.position.y=-12;scene.add(grid);
}
D.groups.forEach((g,gi)=>{const group=D.nodes.filter(n=>n.group===gi),a=gi/6*Math.PI*2;group.forEach((n,j)=>{const t=j/group.length*Math.PI*2;pos.set(n.id,new THREE.Vector3(Math.cos(a)*15+Math.cos(t)*5,Math.sin(a)*10+Math.sin(t)*4,Math.sin(t*2+gi)*3));});});
D.nodes.forEach(n=>{
 const p=pos.get(n.id),button=document.createElement('button');button.textContent=n.name;button.onclick=()=>select(n.id);button.title=n.role;$('#labels').append(button);labels.push({n,button});
 if(!renderer)return;
 const sphere=new THREE.Mesh(new THREE.SphereGeometry(.85,24,16),new THREE.MeshStandardMaterial({color:D.groups[n.group].color,emissive:D.groups[n.group].color,emissiveIntensity:.25,roughness:.4}));sphere.position.copy(p);scene.add(sphere);
 const material=new THREE.SpriteMaterial({transparent:true,depthWrite:false,depthTest:false,opacity:1});const sprite=new THREE.Sprite(material);sprite.position.copy(p);sprite.position.z+=.25;sprite.scale.set(1.65,1.65,1);sprite.renderOrder=2;sprite.userData.id=n.id;scene.add(sprite);
 loader.load(n.image,t=>{t.colorSpace=THREE.SRGBColorSpace;material.map=t;material.needsUpdate=true},undefined,()=>{material.color.set(D.groups[n.group].color)});
 meshes.push({n,sphere,sprite});
});
if(renderer)D.edges.forEach((e,i)=>{const a=pos.get(e.source),b=pos.get(e.target),documented=e.evidence!=='por verificar';const mat=documented?new THREE.LineBasicMaterial({color:e.kind==='organizacion'?0x91bcb1:0x839eae,transparent:true,opacity:.25}):new THREE.LineDashedMaterial({color:e.kind==='organizacion'?0x91bcb1:0x839eae,transparent:true,opacity:.2,dashSize:.25,gapSize:.24});const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),mat);line.computeLineDistances();scene.add(line);const dot=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:e.kind==='organizacion'?0xb4dbcf:0xa9c6dc}));scene.add(dot);const dir=b.clone().sub(a).normalize();const arrow=new THREE.ArrowHelper(dir,a.clone().lerp(b,.7),.8,e.kind==='organizacion'?0x91bcb1:0x839eae,.35,.16);scene.add(arrow);lines.push({e,line,dot,arrow,a,b,i});});
function eligible(e){return e.views.includes(network)&&($('#mode').value==='all'||e.kind===$('#mode').value)&&(!$('#documented').checked||e.evidence!=='por verificar');}
function baseNode(n){return n.views.includes(network)&&($('#group').value==='all'||n.group===+$('#group').value)&&n.name.toLocaleLowerCase('es').includes($('#search').value.toLocaleLowerCase('es'));}
function refresh(){const base=new Set(D.nodes.filter(n=>baseNode(n)&&(!$('#documented').checked||D.edges.some(e=>eligible(e)&&(e.source===n.id||e.target===n.id)))).map(n=>n.id));const valid=D.edges.filter(e=>eligible(e)&&base.has(e.source)&&base.has(e.target));const neighborhood=new Set(selected?[selected,...valid.filter(e=>e.source===selected||e.target===selected).flatMap(e=>[e.source,e.target])]:[...base]);meshes.forEach(({n,sphere,sprite})=>{const on=base.has(n.id)&&neighborhood.has(n.id);sphere.visible=sprite.visible=on;sphere.material.emissiveIntensity=n.id===selected?.8:.25;});
 labels.forEach(({n,button})=>button.classList.toggle('hidden',!names||!base.has(n.id)||!neighborhood.has(n.id)));
 lines.forEach(o=>{const on=valid.includes(o.e)&&(!selected||o.e.source===selected||o.e.target===selected);o.line.visible=o.dot.visible=o.arrow.visible=on;o.line.material.opacity=selected?.8:.25;});
 $('#list').innerHTML=D.nodes.filter(n=>base.has(n.id)).map(n=>`<button style="--c:${D.groups[n.group].color}" data-id="${n.id}">${esc(n.name)}</button>`).join('');$('#list').querySelectorAll('button').forEach(b=>b.onclick=()=>select(+b.dataset.id));
 $('#stats').textContent=`${base.size} actores · ${valid.length} relaciones en esta lectura`;
 if(selected)detail(byId.get(selected));
}
function detail(n){const es=D.edges.filter(e=>eligible(e)&&(e.source===n.id||e.target===n.id));$('#detail').innerHTML=`<div class="head"><img src="${n.image}" alt="Imagen representativa de ${esc(n.name)}"><div><span class="kicker">${esc(D.groups[n.group].name)}</span><h2>${esc(n.name)}</h2><p>${esc(n.role)}</p></div></div><small>${esc(n.imageType)} ${n.image.startsWith('images/')?'<a href="credits.html" target="_blank">Créditos ↗</a>':''}</small><p><b>Cómo se organiza y se relaciona:</b> sigue las conexiones de abajo. Las categorías de habitantes no equivalen a organizaciones únicas y sus integrantes pueden tener intereses distintos.</p><ul>${es.map(e=>`<li><button data-neighbor="${e.source}">${esc(byId.get(e.source).name)}</button> → <b>${esc(e.label)}</b> → <button data-neighbor="${e.target}">${esc(byId.get(e.target).name)}</button><br><span class="tag ${e.ref?'doc':''}">${e.kind==='organizacion'?'Organización e interlocución':'Decisión / actuación territorial'} · ${esc(e.evidence)}</span>${e.ref?` · <a href="${e.ref}" target="_blank" rel="noopener">Fuente ↗</a>`:'<small>Relación analítica propuesta: comprobar quién interviene, en qué decisión y con qué resultado.</small>'}</li>`).join('')}</ul>${es.length?'':'<p class="empty">No hay relaciones en el filtro actual. Esto no demuestra ausencia de vínculos reales.</p>'}`;
 $('#detail').querySelectorAll('[data-neighbor]').forEach(b=>b.onclick=()=>{const id=+b.dataset.neighbor;if(!baseNode(byId.get(id))){$('#group').value='all';$('#search').value='';}select(id);});
}
function select(id,broadcast=true){selected=id;if(embedded&&broadcast)parent.postMessage({type:'actor-pick',id},location.origin);if(renderer){const ids=new Set([id,...D.edges.filter(e=>eligible(e)&&(e.source===id||e.target===id)).flatMap(e=>[e.source,e.target])]);const box=new THREE.Box3().setFromPoints([...ids].map(i=>pos.get(i)));const p=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());const distance=Math.max(22,size.y*1.5,size.x/camera.aspect*1.5)+6;focus={target:p.clone(),position:p.clone().add(new THREE.Vector3(0,2,distance))};}refresh();}
for(const id of ['mode','group','search','documented'])$('#'+id).addEventListener(id==='search'?'input':'change',()=>{selected=null;focus=null;refresh();$('#detail').innerHTML='<h2>Selecciona un actor</h2><p>La vista se ha filtrado. Selecciona una imagen o un nombre para leer sus relaciones.</p>';});
$('#reset').onclick=()=>{selected=null;$('#mode').value='all';$('#group').value='all';$('#search').value='';$('#documented').checked=false;focus={target:new THREE.Vector3(),position:new THREE.Vector3(0,13,56)};refresh();$('#detail').innerHTML='<h2>Toda la red</h2><p>Selecciona una imagen para ver cómo se organiza ese actor y con quién se relaciona.</p>';};
$('#motion').onclick=()=>{moving=!moving;$('#motion').textContent=moving?'Pausar pulsos':'Activar pulsos';};
$('#names').onclick=()=>{names=!names;$('#names').textContent=names?'Ocultar nombres':'Mostrar nombres';refresh();};
setNetwork(network);
if(renderer){const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let start;renderer.domElement.addEventListener('pointerdown',e=>start=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>5)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(meshes.filter(n=>n.sprite.visible).map(n=>n.sprite))[0];if(hit)select(hit.object.userData.id);});controls.addEventListener('start',()=>focus=null);
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(host);resize();let t=0,last=performance.now();$('#status').textContent='Arrastra para girar · Rueda para acercar · Clic para seguir relaciones';
 renderer.setAnimationLoop(now=>{const dt=Math.min((now-last)/1000,.1);last=now;if(moving)t+=dt;if(focus){controls.target.lerp(focus.target,.07);camera.position.lerp(focus.position,.07);if(camera.position.distanceTo(focus.position)<.05)focus=null;}controls.update();lines.forEach(o=>{if(o.dot.visible)o.dot.position.copy(o.a).lerp(o.b,(t*.11+o.i*.137)%1);});labels.forEach(({n,button})=>{const p=pos.get(n.id).clone().project(camera);button.style.left=(p.x*.5+.5)*host.clientWidth+'px';button.style.top=(-p.y*.5+.5)*host.clientHeight+'px';button.style.visibility=p.z>1||p.z< -1?'hidden':'visible';});renderer.render(scene,camera);});
}


