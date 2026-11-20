(()=>{
const groups=[
 ['Entender el territorio', [['macromodelos.html','Macromodelos'],['index.html?view=urban-diagram','Red urbana'],['index.html?view=urban','Conectografía'],['index.html?view=species-diagram','Red de especies'],['index.html?view=species','Mapa de especies']]],
 ['Explicar el problema', [['problemas.html','Problema'],['evidencia.html','Evidencia e indicadores'],['diagramas.html','Diagramas causales']]],
 ['Presentar la propuesta', [['objetivos.html','Objetivos'],['actores.html','Red de actores'],['asamblea.html','Asamblea y decisiones'],['programa.html','Programa arquitectónico'],['programa-mapa.html','Propuesta territorial']]],
 ['Evaluar y comunicar', [['simulador.html','Simulador'],['videojuego.html','Videojuego'],['presentaciones.html','Presentaciones']]]
];
const path=location.pathname.split('/').pop()||'index.html',params=new URLSearchParams(location.search);
if(params.has('embed')){document.body.classList.add('shell-embed');return;}
const aliases={'organizacion.html':'asamblea.html','laboratorio.html':'simulador.html','coexistence.html':'simulador.html','presentacion.html':'presentaciones.html','escenarios.html':'videojuego.html'};
const flat=groups.flatMap((g,gi)=>g[1].map(([url,title])=>({url,title,gi})));
function currentIndex(){let file=aliases[path]||path;if(['index.html','ambito-contexto.html'].includes(path))file='index.html?view='+(document.body.dataset.network||params.get('view')||'urban-diagram');const i=flat.findIndex(x=>x.url===file);return i<0?0:i;}
let current=currentIndex(),opened=flat[current].gi;
document.body.classList.add('unified-ui');if(['index.html','ambito-contexto.html'].includes(path))document.body.classList.add('shell-map-page');
const shell=document.createElement('div');shell.id='kennedy-shell';shell.innerHTML=`<div class="ks-top"><a class="ks-brand" href="macromodelos.html"><span class="ks-mark">K</span><span><b>KENNEDY</b><small>ATLAS TERRITORIAL · BOGOTÁ</small></span></a><div class="ks-location"><span class="ks-dot"></span><span id="ks-current"></span></div><div class="ks-actions"></div></div><nav class="ks-groups" aria-label="Grupos del proyecto">${groups.map((g,i)=>`<button data-group="${i}" aria-controls="ks-topic-nav"><span>0${i+1}</span> ${g[0]}</button>`).join('')}</nav><div class="ks-navrow"><button class="ks-step" data-step="-1" aria-label="Ver pestañas anteriores">‹</button><nav id="ks-topic-nav" class="ks-nav" aria-label="Pestañas del grupo"></nav><button class="ks-step" data-step="1" aria-label="Ver más pestañas">›</button></div><div class="ks-route" aria-label="Recorrido del proyecto"></div>`;
document.body.prepend(shell);
for(const id of ['panel-toggle','presentation']){const el=document.getElementById(id);if(el)shell.querySelector('.ks-actions').append(el);}
const oldnav=document.querySelector('[data-legacy-nav]');
const locals=oldnav?[...oldnav.querySelectorAll('a[href^="#"]')]:[];
if(locals.length){const sub=document.createElement('div');sub.className='ks-subnav';sub.setAttribute('aria-label','Recorrido de esta sección');for(const a of locals)sub.append(a.cloneNode(true));shell.after(sub);}
function render(){
 shell.querySelectorAll('[data-group]').forEach((b,i)=>{b.setAttribute('aria-expanded',String(i===opened));b.classList.toggle('is-current',i===flat[current].gi);});
 shell.querySelector('.ks-nav').innerHTML=groups[opened][1].map(([url,title])=>`<a href="${url}" ${flat[current].url===url?'aria-current="page"':''}>${title}</a>`).join('');
 shell.querySelector('#ks-current').textContent=flat[current].title;
 shell.querySelector('.ks-route').innerHTML=`${current>0?`<a href="${flat[current-1].url}">← ${flat[current-1].title}</a>`:'<span>Inicio del recorrido</span>'}<span>${current+1} / ${flat.length}</span>${current<flat.length-1?`<a href="${flat[current+1].url}">${flat[current+1].title} →</a>`:'<a href="macromodelos.html">Volver al inicio ↗</a>'}`;
}
shell.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{opened=Number(b.dataset.group);render()});
shell.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>shell.querySelector('.ks-nav').scrollBy({left:Number(b.dataset.step)*300,behavior:'smooth'}));
new MutationObserver(()=>{current=currentIndex();opened=flat[current].gi;render()}).observe(document.body,{attributes:true,attributeFilter:['data-network']});
render();
new ResizeObserver(()=>document.documentElement.style.setProperty('--ks-height',shell.offsetHeight+'px')).observe(shell);
})();
