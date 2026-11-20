import * as T from 'three';
export function addTerrestrial({data,group,picks,fly,detail,network,controls}){
 const pulses=[],purple=new T.MeshBasicMaterial({color:0xd6a2ff}),footprints=new T.LineBasicMaterial({color:0xffc28c,transparent:true,opacity:.78});
 const list=document.querySelector('#terrestrial-list');
 const makeLine=(points,material)=>new T.Line(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),material);
 for(const s of data.species){
  const anchor=new T.Vector3(...s.position),body=new T.Group();body.position.copy(anchor);group.add(body);
  // Diagrammatic glyphs on the terrain: sizes are exaggerated for legibility.
  const core=new T.Mesh(new T.SphereGeometry(.013,14,10),purple);core.scale.set(1.2,.55,.8);core.position.y=.009;body.add(core);
  if(s.id==='T2076'){const shell=new T.Mesh(new T.TorusGeometry(.012,.005,8,20),purple);shell.position.set(0,.017,0);body.add(shell);}
  else if(s.id==='T1911'){const head=new T.Mesh(new T.SphereGeometry(.008,12,8),purple);head.position.set(.017,.01,0);body.add(head);body.add(makeLine([[-.014,.007,0],[-.031,.006,.006],[-.04,.006,.019]],new T.LineBasicMaterial({color:0xd6a2ff})));}
  else {for(let i=0;i<4;i++)for(const side of [-1,1])body.add(makeLine([[.012-i*.008,.009,0],[.021-i*.012,.006,side*.021]],new T.LineBasicMaterial({color:0xd6a2ff})));}
  const ring=new T.Mesh(new T.RingGeometry(.026,.029,40),new T.MeshBasicMaterial({color:0xd6a2ff,transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.copy(anchor);group.add(ring);pulses.push(ring);
  const inspection=new T.Group();inspection.visible=false;group.add(inspection);
  for(const outline of s.road_outlines)inspection.add(makeLine(outline,footprints));
  inspection.add(makeLine(s.ring,new T.LineDashedMaterial({color:0xaf89c9,dashSize:.009,gapSize:.007,transparent:true,opacity:.55})));inspection.children.at(-1).computeLineDistances();
  const distance=makeLine([s.position,s.nearest_road],new T.LineDashedMaterial({color:0xffc28c,dashSize:.008,gapSize:.006}));distance.computeLineDistances();inspection.add(distance);
  const hit=new T.Mesh(new T.TorusGeometry(.012,.003,6,20),new T.MeshBasicMaterial({color:0xffc28c}));hit.rotation.x=-Math.PI/2;hit.position.set(...s.nearest_road);inspection.add(hit);
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=80;const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(15,12,25,.88)';ctx.fillRect(0,0,512,80);ctx.strokeStyle='#c393f3';ctx.strokeRect(2,2,508,76);ctx.fillStyle='#f0dcff';ctx.font='26px Segoe UI';ctx.textAlign='center';ctx.fillText(s.common,256,33);ctx.fillStyle='#c4adc9';ctx.font='20px Segoe UI';ctx.fillText(s.label,256,61);const label=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(canvas),transparent:true,depthTest:false}));label.position.copy(anchor).add(new T.Vector3(0,.085,0));label.scale.set(.36,.056,1);group.add(label);
  const select=()=>{group.visible=true;document.querySelector('#terrestrial-layer').checked=true;for(const item of group.children)if(item.userData.inspection)item.visible=false;inspection.visible=true;fly(anchor.clone(),.65);detail(s.common+' · '+s.label,[s.distance_m.toFixed(1)+' m a la calzada cartografiada más cercana. '+s.road_area_pct_100m.toFixed(2)+' % de calzada en el círculo de inspección de 100 m.',(s.zone?s.zone+' · '+(s.congestion===null?'sin datos de congestión':s.congestion.toFixed(2)+' % de congestión promedio'):'Sin zona de congestión disponible')+'. DIM: septiembre 2026, hábiles, horas 07 y 08.',...s.relations.map(r=>'Relación RIBB: '+r.source+' — '+r.relation+' → '+r.target+'.'),...(s.relations.length?[]:['Sin aristas de interacción documentadas para este taxón en la red adjunta.']),'Línea discontinua: distancia a la calzada, no ruta de desplazamiento. Círculo: radio de inspección, no hábitat ni alcance de la especie.','Referencia RIBB, fila '+s.reference.excel_row+'. No confirma individuos actuales. Proximidad y congestión permiten plantear una barrera potencial; no prueban desconexión, mortalidad ni causalidad.']);};
  inspection.userData.inspection=true;core.userData.select=select;label.userData.select=select;picks.push(core,label);
  const button=document.createElement('button');button.type='button';button.textContent=s.common+' · '+s.distance_m.toFixed(1)+' m';button.addEventListener('click',select);list.append(button);
 }
 return time=>{for(let i=0;i<pulses.length;i++){const pulse=.8+.25*Math.sin(time*1.8+i);pulses[i].scale.setScalar(pulse);}};
}
