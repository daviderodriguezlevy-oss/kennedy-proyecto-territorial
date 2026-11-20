import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
const host=document.getElementById('density-view'),status=document.getElementById('density-status');
let activeYear=window.historyYear||1998,data=null,mesh=null,heightScale=1;
window.addEventListener('history-year',e=>{activeYear=e.detail;if(data)build();});
try{
data=await fetch('data/history/analysis/landcover.json').then(r=>{if(!r.ok)throw Error('Datos del indicador no disponibles');return r.json();});
const scene=new THREE.Scene();scene.background=new THREE.Color('#0e1517');
const camera=new THREE.PerspectiveCamera(38,1,.01,100);const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;host.prepend(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2-.03;controls.minDistance=2;controls.maxDistance=24;
scene.add(new THREE.HemisphereLight('#f3fff3','#374247',2.1));const light=new THREE.DirectionalLight('#f4e2d7',2.4);light.position.set(-3,8,5);scene.add(light);
const g=data.grid,nx=g.width,ny=g.height,b=g.bbox3857;const factor=Math.cos(4.645*Math.PI/180)/1000,sx=(b[2]-b[0])*factor,sz=(b[3]-b[1])*factor;
const distance=new Float32Array(nx*ny);for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=j*nx+i;distance[k]=g.inside[k]?Math.min(i+1,j+1,nx-i,ny-j,10000):0;}for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=j*nx+i;if(i)distance[k]=Math.min(distance[k],distance[k-1]+1);if(j)distance[k]=Math.min(distance[k],distance[k-nx]+1);if(i&&j)distance[k]=Math.min(distance[k],distance[k-nx-1]+Math.SQRT2);}for(let j=ny-1;j>=0;j--)for(let i=nx-1;i>=0;i--){const k=j*nx+i;if(i<nx-1)distance[k]=Math.min(distance[k],distance[k+1]+1);if(j<ny-1)distance[k]=Math.min(distance[k],distance[k+nx]+1);if(i<nx-1&&j<ny-1)distance[k]=Math.min(distance[k],distance[k+nx+1]+Math.SQRT2);}const apron=new Float32Array(nx*ny);for(let k=0;k<apron.length;k++){const t=Math.max(0,Math.min(1,(distance[k]-1)/18));apron[k]=t*t*(3-2*t);}
const group=new THREE.Group();scene.add(group);const col0=new THREE.Color('#cbd5c9'),col1=new THREE.Color('#c8a59a'),col2=new THREE.Color('#aa4b4b');
function tint(v){return v<.5?col0.clone().lerp(col1,v*2):col1.clone().lerp(col2,(v-.5)*2);}
function view(top=false){controls.target.set(0,.6,0);camera.position.set(top?0:5,top?10:6.5,top?.001:6.5);controls.update();renderer.render(scene,camera);}
build=function(){
 const frame=data.frames.find(f=>f.year===activeYear);if(!frame)return;
 if(mesh){group.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();}
 const positions=[],colors=[],indices=[],ids=new Int32Array(nx*ny).fill(-1),values=[];
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=j*nx+i;if(!g.inside[k])continue;ids[k]=values.length;const v=frame.density[k]/100;positions.push(((i+.5)/nx-.5)*sx,.04+v*1.8*apron[k],((j+.5)/ny-.5)*sz);const c=tint(v);colors.push(c.r,c.g,c.b);values.push(v);}
 for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){const a=ids[j*nx+i],bb=ids[j*nx+i+1],c=ids[(j+1)*nx+i],d=ids[(j+1)*nx+i+1];if(Math.min(a,bb,c,d)<0)continue;indices.push(a,c,bb,bb,c,d);}
 const edges=new Map();for(let i=0;i<indices.length;i+=3)for(let t=0;t<3;t++){let a=indices[i+t],b=indices[i+(t+1)%3],key=Math.min(a,b)+','+Math.max(a,b);if(edges.has(key))edges.delete(key);else edges.set(key,[a,b]);}
 const n=values.length,topIndices=indices.slice();for(let i=0;i<n;i++){positions.push(positions[i*3],0,positions[i*3+2]);colors.push(.13,.18,.18);}
 for(let i=0;i<topIndices.length;i+=3)indices.push(topIndices[i]+n,topIndices[i+2]+n,topIndices[i+1]+n);
 for(const [a,b] of edges.values())indices.push(a,b,b+n,a,b+n,a+n);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78,metalness:.03,side:THREE.DoubleSide}));mesh.scale.y=heightScale;group.add(mesh);
 document.getElementById('density-year').textContent=activeYear+' · misma escala 0–100 %';status.textContent='Superficie urbana · '+activeYear;document.getElementById('landcover-stats').innerHTML='<strong>'+frame.mean.toFixed(1)+' %</strong>del recorte clasificado como infraestructura urbana. Estimación a 30 m; no equivale a huella de edificios.';document.getElementById('density-tip').hidden=true;document.body.dataset.densityReady='true';renderer.render(scene,camera);
};
document.getElementById('density-home').onclick=()=>view();document.getElementById('density-top').onclick=()=>view(true);document.getElementById('height-scale').oninput=e=>{heightScale=Number(e.target.value);if(mesh)mesh.scale.y=heightScale;};
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hits=mesh?ray.intersectObject(mesh):[];const tip=document.getElementById('density-tip');if(!hits.length){tip.hidden=true;return;}const p=hits[0].point;let i=Math.floor((p.x/sx+.5)*nx),j=Math.floor((p.z/sz+.5)*ny);i=Math.max(0,Math.min(nx-1,i));j=Math.max(0,Math.min(ny-1,j));const f=data.frames.find(f=>f.year===activeYear);tip.textContent=activeYear+' · '+f.density[j*nx+i].toFixed(1)+' % de concentración urbana local';tip.hidden=false;});renderer.domElement.addEventListener('pointerleave',()=>document.getElementById('density-tip').hidden=true);
new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera);}).observe(host);
let visible=false;new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;}).observe(host);
view();build();renderer.setAnimationLoop(()=>{if(visible){controls.update();renderer.render(scene,camera);}});
}catch(e){status.textContent=e.message;console.error(e);}
function build(){}
