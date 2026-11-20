// Screen choreography matched to the approved twelve-minute narration.
// No narration, measurement or new research claim is added to the page.
export function installDirector({sections,go,pick,setMode,step,causal,coords,visibleLinks}){
 const params=new URLSearchParams(location.search),speed=params.get('preview')==='12'?12:1;
 const $=s=>document.querySelector(s),origin='http://127.0.0.1:8774';
 const notify=data=>window.opener?.postMessage(data,origin);
 const style=document.createElement('style');style.textContent=`
 html,body,body *{cursor:none!important}html{scroll-behavior:auto!important}
 body>header,body>nav,.route,body>footer{display:none!important}
 body.presenting main{padding-top:10px}body.presenting main>section.current{min-height:95vh}
 .tour-emphasis{outline:1px solid #aac4c2;outline-offset:7px;animation:tourGlow 4s ease-in-out infinite}
 @keyframes tourGlow{50%{outline-color:#647f88;filter:brightness(1.1)}}
 body.touring .fullscreen-network{overflow:hidden}
 body.touring .fullscreen-network .controls,body.touring .fullscreen-network #mode-caption{display:none}
 body.touring .fullscreen-network .network-stage{height:85vh}
 body.touring .fullscreen-network .network-detail{max-height:82vh}
 .tour-preview-label{position:fixed;right:18px;bottom:18px;padding:8px;background:#15252b;z-index:100;font:13px system-ui;color:#d0e3df}
 `;document.head.append(style);document.body.classList.add('presenting','touring');
 ['3:00','1:00','1:30','1:30','1:15','1:45','1:15','0:45'].forEach((t,i)=>sections[i].dataset.time=t);
 const explanation=document.createElement('div');explanation.id='tour-macro';
 explanation.innerHTML=`<svg viewBox="0 0 1100 510" role="img" aria-label="De las prioridades de ciudad a los efectos cotidianos" style="width:100%;max-height:62vh;background:#101c23;border:1px solid #425962;border-radius:12px">
 <defs><marker id="macro-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="#a9c5c8"/></marker></defs>
 <g fill="none" stroke="#91aeb5" stroke-width="2" stroke-dasharray="8 7" marker-end="url(#macro-arrow)"><path d="M290 105L430 105M700 105L835 105M280 305L430 305M700 305L835 305M965 160L965 250M560 360L560 430M835 305Q770 440 700 450"/><animate attributeName="stroke-dashoffset" from="0" to="-30" dur="3s" repeatCount="indefinite"/></g>
 <g font-family="system-ui" font-size="21" text-anchor="middle" fill="#d7e5e7">
 <g data-macro="0"><rect x="25" y="50" width="265" height="110" rx="10" fill="#243731"/><text x="157" y="95">Proximidad</text><text x="157" y="125">y reverdecimiento</text></g>
 <g data-macro="1"><rect x="430" y="50" width="270" height="110" rx="10" fill="#20333d"/><text x="565" y="95">Prioridades</text><text x="565" y="125">de planeación</text></g>
 <g data-macro="2"><rect x="835" y="50" width="240" height="110" rx="10" fill="#26343b"/><text x="955" y="95">Territorio</text><text x="955" y="125">ya construido</text></g>
 <g data-macro="3"><rect x="25" y="250" width="265" height="110" rx="10" fill="#39332b"/><text x="157" y="295">Ventajas económicas</text><text x="157" y="325">de la concentración</text></g>
 <g data-macro="4"><rect x="430" y="250" width="270" height="110" rx="10" fill="#39332b"/><text x="565" y="295">Corabastos</text><text x="565" y="325">Comercio · carga · trabajo</text></g>
 <g data-macro="5"><rect x="835" y="250" width="240" height="110" rx="10" fill="#303b40"/><text x="955" y="295">Espacio y recursos</text><text x="955" y="325">Mantenimiento</text></g>
 <g data-macro="6"><rect x="360" y="430" width="340" height="60" rx="10" fill="#20333d"/><text x="530" y="468">Decisiones → efectos cotidianos</text></g></g></svg><p class="caption">Relaciones conceptuales del argumento · lectura del proyecto.</p>`;
 $('#problema .lead').after(explanation);
 function macro(ids){focus('#tour-macro');explanation.querySelectorAll('[data-macro]').forEach(g=>{const on=ids.includes(+g.dataset.macro);g.style.opacity=on?'1':'.4';g.style.transition='opacity 1.2s';g.querySelector('rect').setAttribute('stroke',on?'#c9dddc':'none');});}
 let activeSection=-1,emphasis=null,scrollFlight=null,boxFlight=null,started=false,index=0,start=0,lastSecond=-1;
 const mapActive=active=>$('#territory-frame').contentWindow?.postMessage({type:'kennedy-record-orbit',active},location.origin);
 function section(i){if(i===activeSection)return;activeSection=i;$('#network-shell').classList.remove('fullscreen-network');mapActive(i===1);go(i,false);window.scrollTo(0,0);scrollFlight=null;boxFlight=null;pick(0);}
 function focus(selector){const el=$(selector);if(!el)throw Error('Falta el encuadre '+selector);emphasis?.classList.remove('tour-emphasis');emphasis=el;el.classList.add('tour-emphasis');const r=el.getBoundingClientRect(),max=Math.max(0,document.documentElement.scrollHeight-innerHeight);const target=Math.min(max,Math.max(0,scrollY+r.top-(r.height<innerHeight*.8?(innerHeight-r.height)*.4:35)));scrollFlight={from:scrollY,to:target,start:performance.now(),duration:2400/speed};}
 function graphBox(target){const el=$('#actor-network');boxFlight={from:el.getAttribute('viewBox').split(/\s+/).map(Number),to:target,start:performance.now(),duration:5500/speed};}
 function actor(id){pick(id);const ids=new Set([id]);visibleLinks().filter(l=>l.a===id||l.b===id).forEach(l=>{ids.add(l.a);ids.add(l.b)});const pts=[...ids].map(i=>coords[i-1]);const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);let w=Math.max(750,Math.max(...xs)-Math.min(...xs)+300),h=Math.max(530,Math.max(...ys)-Math.min(...ys)+220);const aspect=1850/1250;if(w/h>aspect)h=w/aspect;else w=h*aspect;w=Math.min(1850,w);h=Math.min(1250,h);graphBox([Math.max(0,Math.min(1850-w,(Math.min(...xs)+Math.max(...xs)-w)/2)),Math.max(0,Math.min(1250-h,(Math.min(...ys)+Math.max(...ys)-h)/2)),w,h]);}
 function network(){section(3);$('#network-shell').classList.add('fullscreen-network');focus('#actor-network');}
 function causalNode(i){focus('#causal-network');const nodes=$('#causal-network').querySelectorAll('.causal-node');nodes.forEach((n,j)=>{n.style.opacity=j===i?'1':'.55';n.style.filter=j===i?'drop-shadow(0 0 5px #b6dad8)':'';});}
 const cues=[];
 const f=(t,i,s)=>cues.push([t,()=>{section(i);focus(s);}]);
 const a=(t,fn)=>cues.push([t,fn]);
 // Macro -> economic concentration -> operational demands -> everyday effects.
 f(0,0,'#problema h1');f(4,0,'#problema .lead');a(14,()=>macro([0,1]));
 a(25,()=>macro([1,2]));a(38,()=>macro([0,1]));a(49,()=>macro([2,4]));
 a(61,()=>macro([3,4]));a(73,()=>macro([4,5]));a(85,()=>macro([3,4,5]));
 a(98,()=>macro([0,2,5]));a(110,()=>macro([5,6]));
 f(121,0,'#problema .cards article:nth-child(1)');f(133,0,'#problema .cards article:nth-child(2)');
 f(145,0,'#problema .cards article:nth-child(3)');f(157,0,'#problema h2 + p');f(169,0,'#problema .cards');
 f(180,1,'#territory-frame');f(192,1,'#territorio .cards article:nth-child(1)');
 f(203,1,'#territorio .cards article:nth-child(2)');f(214,1,'#territorio .cards article:nth-child(3)');
 f(225,1,'#territory-frame');f(234,1,'#territorio .caption');
 f(240,2,'#actual h2');f(246,2,'#actual .cards article:nth-child(1)');
 f(259,2,'#actual .cards article:nth-child(2)');f(271,2,'#actual .cards article:nth-child(3)');
 f(282,2,'#actual .cols article:first-child');f(294,2,'#actual .timeline article:nth-of-type(1)');
 f(304,2,'#actual .timeline article:nth-of-type(2)');f(314,2,'#actual .timeline article:nth-of-type(3)');
 f(323,2,'#actual .cols article:last-child');
 a(330,()=>{network();setMode(0,false);graphBox([0,0,1850,1250]);});
 a(335,()=>actor(25));a(342,()=>actor(30));
 a(349,()=>{pick(0);graphBox([0,0,1850,1250]);if(speed>1)setMode(2,false);else $('#animate').click();});
 a(360,()=>actor(10));a(370,()=>actor(28));a(380,()=>actor(31));
 a(389,()=>actor(10));a(398,()=>actor(36));a(406,()=>actor(47));a(413,()=>actor(37));
 f(420,4,'#politica h2');a(426,()=>{step(0);focus('#decision-detail');});
 a(438,()=>{step(1);focus('#decision-detail');});a(449,()=>{step(2);focus('#decision-detail');});
 a(460,()=>{step(3);focus('#decision-detail');});a(470,()=>{step(4);focus('#decision-detail');});
 a(479,()=>{step(5);focus('#decision-detail');});f(488,4,'#politica .cards');
 a(495,()=>{section(5);causal(0);focus('#causal-network');});
 a(501,()=>causalNode(0));a(509,()=>causalNode(1));a(517,()=>causalNode(3));
 a(524,()=>causalNode(5));f(533,5,'#equation');
 a(542,()=>{causal(1);causalNode(0);});a(550,()=>causalNode(1));a(558,()=>causalNode(2));
 a(566,()=>{causal(2);causalNode(0);});a(574,()=>causalNode(2));a(582,()=>causalNode(5));f(591,5,'#equation');
 f(600,6,'#evaluacion h2');f(607,6,'#evaluacion .metric article:nth-child(3)');
 f(619,6,'#evaluacion .metric article:nth-child(4)');f(631,6,'#evaluacion .cols article:last-child');
 f(643,6,'#evaluacion .metric article:first-child');f(654,6,'#evaluacion .metric article:nth-child(2)');
 f(665,6,'#evaluacion .cols article:first-child');
 f(675,7,'#sintesis h2');f(682,7,'#sintesis .lead');
 f(692,7,'#sintesis .cards article:first-child');f(700,7,'#sintesis .cards article:nth-child(2)');
 f(708,7,'#sintesis .caption');f(716,7,'#sintesis h2');
 cues.sort((x,y)=>x[0]-y[0]);
 document.body.dataset.tourCues=String(cues.length);
 document.body.dataset.tourMaxGap=String(Math.max(...cues.slice(1).map((c,i)=>c[0]-cues[i][0])));
 const preview=speed>1?document.createElement('div'):null;if(preview){preview.className='tour-preview-label';document.body.append(preview);}
 function begin(){if(started)return;started=true;start=performance.now();document.body.dataset.tour='recording';tick();}
 function tick(){const now=performance.now(),sec=Math.min(720,(now-start)*speed/1000);
  try{while(index<cues.length&&cues[index][0]<=sec)cues[index++][1]();}catch(e){document.body.dataset.tour='error';document.body.dataset.tourError=e.message;notify({type:'kennedy-tour-error',message:e.message});return;}
  const ease=t=>t*t*(3-2*t);
  if(scrollFlight){const q=Math.min(1,(now-scrollFlight.start)/scrollFlight.duration);window.scrollTo(0,scrollFlight.from+(scrollFlight.to-scrollFlight.from)*ease(q));if(q===1)scrollFlight=null;}
  if(boxFlight){const q=Math.min(1,(now-boxFlight.start)/boxFlight.duration);$('#actor-network').setAttribute('viewBox',boxFlight.from.map((v,i)=>v+(boxFlight.to[i]-v)*ease(q)).join(' '));if(q===1)boxFlight=null;}
  const second=Math.floor(sec);document.body.dataset.tourSecond=String(second);document.body.dataset.tourCue=String(index);
  if(second!==lastSecond){lastSecond=second;notify({type:'kennedy-tour-progress',second,scene:sections[activeSection]?.id});if(preview)preview.textContent=`Vista rápida ×12 · ${Math.floor(second/60)}:${String(second%60).padStart(2,'0')}`;}
  if(sec<720)setTimeout(tick,33);else{document.body.dataset.tour='finished';mapActive(false);emphasis?.classList.remove('tour-emphasis');}
 }
 window.addEventListener('message',e=>{if(e.origin===origin&&e.source===window.opener&&e.data?.type==='kennedy-record-start')begin();});
 section(0);document.body.dataset.tour='ready';notify({type:'kennedy-tour-ready'});
 if(speed>1)setTimeout(begin,700);
}
