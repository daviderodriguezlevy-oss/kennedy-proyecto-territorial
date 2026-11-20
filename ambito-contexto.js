export async function setupScope({THREE,scene,camera,controls,groups,home}){
 const d=await fetch('data/organizacion/ambito-modelo.json').then(r=>r.json());
 const ring=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(d.ring.map(([x,z])=>new THREE.Vector3(x,.065,z))),new THREE.LineBasicMaterial({color:0xc2efb3,depthTest:false,transparent:true,opacity:1}));ring.renderOrder=100;scene.add(ring);
 const shape=new THREE.Shape(d.ring.map(([x,z])=>new THREE.Vector2(x,-z)));const geo=new THREE.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);const fill=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xa5d9b0,side:THREE.DoubleSide,transparent:true,opacity:.10,depthWrite:false}));fill.position.y=.035;scene.add(fill);
 const center=new THREE.Vector3(d.center[0],.08,d.center[1]);
 function focus(top=false){controls.target.copy(center);camera.position.copy(center).add(top?new THREE.Vector3(0,3.5,.001):new THREE.Vector3(1.8,2.7,2.2));controls.update()}
 const bar=document.createElement('div');bar.className='scope-controls';bar.innerHTML='<strong>ÁMBITO · 800 m</strong><button id="scope-near">Acercar al ámbito</button><button id="scope-top">Planta</button><button id="scope-wide">Contexto completo</button><label><input id="scope-net" type="checkbox" checked> Red</label><label><input id="scope-build" type="checkbox" checked> Edificios</label>';document.body.append(bar);
 document.getElementById('scope-near').onclick=()=>focus();document.getElementById('scope-top').onclick=()=>focus(true);document.getElementById('scope-wide').onclick=()=>home();document.getElementById('scope-net').onchange=e=>groups.network.visible=e.target.checked;document.getElementById('scope-build').onchange=e=>groups.Buildings.visible=e.target.checked;
 focus();document.body.dataset.scopeReady='true';
}
