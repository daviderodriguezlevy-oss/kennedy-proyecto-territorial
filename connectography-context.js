import * as THREE from 'three';

export function createContext(scene){
 const group=new THREE.Group();group.visible=false;scene.add(group);
 let bounds=null;
 function polygons(g){return g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:g.type==='GeometryCollection'?g.geometries.flatMap(polygons):[];}
 function surface(geometries,y,color){
  const vertices=[];
  for(const g of geometries)for(const rings of polygons(g)){
   const shape=new THREE.Shape(rings[0].map(p=>new THREE.Vector2(...p)));
   for(const ring of rings.slice(1))shape.holes.push(new THREE.Path(ring.map(p=>new THREE.Vector2(...p))));
   const geo=new THREE.ShapeGeometry(shape),flat=geo.index?geo.toNonIndexed():geo,a=flat.attributes.position;
   for(let i=0;i<a.count;i++)vertices.push(a.getX(i),y,a.getY(i));
   if(flat!==geo)flat.dispose();geo.dispose();
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  group.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.42,depthWrite:false})));
 }
 function lines(geometries,y,color){
  const vertices=[];
  function visit(g){if(g.type==='GeometryCollection'){g.geometries.forEach(visit);return;}
   const paths=g.type==='LineString'?[g.coordinates]:g.type==='MultiLineString'?g.coordinates:polygons(g).flat();
   for(const path of paths)for(let i=1;i<path.length;i++)vertices.push(path[i-1][0],y,path[i-1][1],path[i][0],y,path[i][1]);
  }geometries.forEach(visit);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  group.add(new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color,transparent:true,opacity:y>.1?.85:.32,depthWrite:false})));
 }
 return {group,get bounds(){return bounds;},async load(){
  const response=await fetch('./data/connectography/context.json');if(!response.ok)throw Error('No se pudo cargar el contexto territorial');
  const d=await response.json();bounds=d.extent;
  surface([d.external],.012,0x59676e);surface(d.layers.blocks,.014,0x727e84);
  surface(d.layers.water,.018,0x536f7b);lines(d.layers.roads,.021,0x8c9ba3);
  lines([d.polygon],.16,0xd7cda6);document.body.dataset.contextReady='true';
 }};
}
