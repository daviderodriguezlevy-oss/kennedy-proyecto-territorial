// ANIMACIÓN DE LA OBRA: cómo se construye la propuesta mientras el territorio sigue funcionando.
// - La simulación cotidiana NO se detiene: carros, peatones y camiones de Corabastos siguen circulando.
// - Calendario por fases (fracción del plazo total). Corabastos opera todo el tiempo:
//     nodos N/M, recuperación y producción primero → mercado nuevo en la zona oriental mientras las bodegas
//     viejas siguen operando → traslado al mercado nuevo → demolición del resto → humedal y parque.
//   María Paz se renueva en dos olas para no desplazar a todo el barrio a la vez.
// - Calles cerradas alrededor de las manzanas en obra: vehículos y peatones dejan de usar esos recorridos.
// - Camiones de obra (volquetas, mixers de concreto y materiales) llegan a cada frente y se van.
// Es una representación del proceso: los plazos son fracciones del total elegido (3, 5 u 8 años), no un cronograma de obra.
import * as T from 'three';
import { routeAt } from './behavior56.mjs?v=61';
import { desplazar, mat, dentro } from './arquitectura.js?v=3';

// Ventanas de cada pieza [inicio demolición, inicio obra, fin obra] como fracción del plazo total.
function calendario(p) {
  if (p.id.startsWith('nodo-')) { const k = 'NMRP'.indexOf(p.id.at(-1)); return [.03 + k * .02, .03 + k * .02, .30 + k * .03]; }
  if (p.id.startsWith('mp-')) return p.ola ? [.44, .50, .84] : [.06, .12, .44];
  if (p.id.startsWith('pq-')) return p.ola ? [.48, .66, .90] : [.10, .28, .50];
  return { mercado: [.02, .10, .62], patio: [.50, .50, .64], 'predio-suelo': [.64, .74, .76], humedal: [.66, .74, .98], parque: [.66, .76, .98], alameda: [.80, .80, 1] }[p.id] || [0, 0, 1];
}
const ESTADO = f => f < .62 ? 'Corabastos opera en las bodegas actuales mientras se levanta el mercado nuevo al oriente del predio.' : f < .64 ? 'Traslado de la operación al mercado nuevo.' : 'Corabastos ya opera en el mercado nuevo; se demuelen las bodegas viejas para el humedal y el parque.';

export function setupConstruction({ scene, dynamics, visor, ground, invalidate }) {
  let prop = null, activo = false, pausado = false, meses = 0, total = 60, vel = 1, f = 0, externo = false;
  let mundoObra = null, piezas = [], claveMascara = '', claveCierre = '', zonasCierre = [];
  const trucks = [], st = { viajes: 0 };

  // ---------- Panel ----------
  const panel = document.createElement('section'); panel.id = 'obra-panel'; panel.hidden = true; document.body.append(panel);
  panel.innerHTML = `<header><b id="obra-titulo">Obra de la propuesta</b><span class="sp"></span>
      <button id="obra-pausa" title="Pausar la obra (la ciudad sigue)">⏸</button>
      <span class="obra-vel"><button data-v=".5">½×</button><button data-v="1" class="active">1×</button><button data-v="2">2×</button><button data-v="4">4×</button></span>
      <button id="obra-fin" title="Ver la propuesta terminada y funcionando">⏭</button><button id="obra-min" title="Minimizar / ampliar el panel">▾</button><button id="obra-salir" title="Volver al estado actual">×</button></header>
    <div class="obra-barra"><i id="obra-prog"></i><span class="m" style="left:62%" title="Traslado al mercado nuevo"></span></div>
    <div id="obra-reloj"></div>
    <div id="obra-estado" class="obra-nota"></div>
    <ul id="obra-frentes"></ul>
    <div id="obra-datos"></div>
    <p class="obra-aviso">1 segundo ≈ 1 mes de obra a velocidad 1×; el día y la noche siguen corriendo para ver el tráfico. Plazos ilustrativos: fracciones del total, no un cronograma.</p>`;
  const $ = s => panel.querySelector(s);
  $('#obra-pausa').onclick = () => { pausado = !pausado; $('#obra-pausa').textContent = pausado ? '▶' : '⏸'; };
  panel.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { vel = +b.dataset.v; panel.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('active', x === b)); });
  $('#obra-fin').onclick = () => { meses = total; };
  $('#obra-salir').onclick = () => detener();
  $('#obra-min').onclick = () => { panel.classList.toggle('min'); $('#obra-min').textContent = panel.classList.contains('min') ? '▸' : '▾'; };

  // Botones de escenario del panel Simular (Obra 3 / 5 / 8 años) pasan a estar activos.
  const conectar = () => document.querySelectorAll('[data-scen^=obra]').forEach(b => { b.disabled = false; b.title = 'Ver cómo se construye la propuesta mientras la ciudad sigue funcionando'; b.onclick = () => { const anos = +b.dataset.scen.replace('obra', ''); api.onPedido ? api.onPedido(anos) : iniciar(anos); }; });
  conectar(); setTimeout(conectar, 1500);

  // ---------- Elementos de obra (en metros, grupo escalado a la escena) ----------
  const valla = () => mat('#2f6b47', { transparent: true, opacity: .92, side: T.DoubleSide });
  const cinta = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 16; const g = c.getContext('2d'); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#ff5a1f'; g.beginPath(); g.moveTo(i * 8, 16); g.lineTo(i * 8 + 8, 16); g.lineTo(i * 8 + 16, 0); g.lineTo(i * 8 + 8, 0); g.fill(); } const t = new T.CanvasTexture(c); t.wrapS = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; return new T.MeshStandardMaterial({ map: t, side: T.DoubleSide, roughness: .8 }); })();
  const malla = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = 'rgba(70,90,80,.55)'; g.fillRect(0, 0, 64, 64); g.strokeStyle = 'rgba(30,40,35,.9)'; g.lineWidth = 2; for (let i = 0; i <= 64; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(64, i); g.stroke(); } const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(20, 8); return new T.MeshStandardMaterial({ map: t, transparent: true, opacity: .8, side: T.DoubleSide, depthWrite: false, roughness: 1 }); })();
  const gm = (x, z) => ground(x / 1000, z / 1000) * 1000;

  function cerco(polKm, retiro, alto, material, tex = 4) {
    const P = (desplazar(polKm.map(([x, z]) => [x * 1000, z * 1000]), retiro) || polKm.map(([x, z]) => [x * 1000, z * 1000]));
    const pos = [], uv = [], idx = [];
    for (let i = 0; i < P.length; i++) {
      const [ax, az] = P[i], [bx, bz] = P[(i + 1) % P.length], L = Math.hypot(bx - ax, bz - az), k = pos.length / 3, ya = gm(ax, az), yb = gm(bx, bz);
      pos.push(ax, ya, az, bx, yb, bz, bx, yb + alto, bz, ax, ya + alto, az); uv.push(0, 0, L / tex, 0, L / tex, 1, 0, 1); idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    return new T.Mesh(g, material);
  }
  function grua(x, z, alto) {
    const g = new T.Group(), am = mat('#f2b134', { roughness: .6 }), y = gm(x, z);
    const mastil = new T.Mesh(new T.BoxGeometry(2, alto, 2), am); mastil.position.y = alto / 2; g.add(mastil);
    const pluma = new T.Group(); pluma.position.y = alto;
    const brazo = new T.Mesh(new T.BoxGeometry(46, 1.2, 1.2), am); brazo.position.x = 14; pluma.add(brazo);
    const contra = new T.Mesh(new T.BoxGeometry(8, 3, 3), mat('#6d6a64')); contra.position.x = -10; pluma.add(contra);
    const cabina = new T.Mesh(new T.BoxGeometry(2.6, 2.4, 2.6), mat('#e8e4da')); cabina.position.set(0, -1.8, 0); pluma.add(cabina);
    const cable = new T.Mesh(new T.CylinderGeometry(.08, .08, alto * .6, 4), mat('#222')); cable.position.set(28, -alto * .3, 0); pluma.add(cable);
    g.add(pluma); g.position.set(x, y, z); g.userData.pluma = pluma; return g;
  }
  function escombros(polKm) {
    const g = new T.Group(), P = polKm.map(([x, z]) => [x * 1000, z * 1000]), n = Math.min(10, Math.max(3, Math.round(Math.sqrt(area(P)) / 12)));
    const c = centro(P);
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.28, r = Math.sqrt(area(P)) * .22 * (.4 + (i % 3) * .25), x = c[0] + Math.cos(a) * r, z = c[1] + Math.sin(a) * r;
      if (!dentro(P, x, z)) continue;
      const m = new T.Mesh(new T.ConeGeometry(4 + (i % 3) * 2, 3 + (i % 2) * 2, 7), mat(i % 2 ? '#8a7f72' : '#6e5c49', { roughness: 1 })); m.position.set(x, gm(x, z) + 1.4, z); g.add(m);
    }
    return g;
  }
  const area = P => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] + P[i][0]) * (P[j][1] - P[i][1]); return Math.abs(a / 2); };
  const centro = P => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];

  // Caja local de un objeto (en su propio marco) para el andamio.
  function cajaLocal(obj) {
    const box = new T.Box3(), inv = new T.Matrix4(), m = new T.Matrix4(); obj.updateMatrixWorld(true); inv.copy(obj.matrixWorld).invert();
    obj.traverse(o => { if (o.isMesh && o.geometry) { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox.clone(); m.multiplyMatrices(inv, o.matrixWorld); box.union(b.applyMatrix4(m)); } });
    return box;
  }

  // ---------- Preparar piezas ----------
  function preparar() {
    const nuevo = visor.paraObra.preparar();
    if (mundoObra && nuevo === prop) return;
    // La propuesta cambió (otras variables): se rehacen andamios, grúas, cercos y escombros.
    if (mundoObra) { scene.remove(mundoObra); mundoObra = null; }
    prop = nuevo;
    mundoObra = new T.Group(); mundoObra.scale.setScalar(.001); scene.add(mundoObra);
    const rutas = [...dynamics.state().roadRoutes, ...dynamics.state().cargoRoutes];
    piezas = prop.piezas.map(p => {
      const [d0, o0, o1] = calendario(p), P = p.poly.map(([x, z]) => [x * 1000, z * 1000]), c = centro(P);
      const q = { ...p, d0, o0, o1, c, edif: [], suelo: [], veg: [], tarde: [], andamios: [] };
      const clasificar = (o, profundidad = 0) => {
        if (o.userData.altura !== undefined || p.id === 'mercado') q.edif.push(o);
        else if (o.isInstancedMesh || o.children?.some(c => c.isInstancedMesh)) q.veg.push(o);
        else if (o.isMesh) q.suelo.push(o);
        else if (o.isGroup && profundidad === 0 && p.tipo === 'veg') o.children.forEach(c => clasificar(c, 1));
        else q.tarde.push(o);
      };
      // El humedal se arma por partes: primero agua y pradera, luego juncos y árboles, al final pasarela y mirador.
      if (p.id === 'humedal') p.objs[0].children.forEach(c => clasificar(c, 1)); else p.objs.forEach(o => clasificar(o));
      // Andamio y grúa para piezas que crecen.
      for (const e of q.edif) {
        const b = cajaLocal(e), s = b.getSize(new T.Vector3()), cc = b.getCenter(new T.Vector3());
        const a = new T.Mesh(new T.BoxGeometry(s.x + 2, s.y + 1, s.z + 2), malla); a.position.copy(cc); a.visible = false; e.add(a); q.andamios.push(a);
      }
      if (q.edif.length) { q.grua = grua(c[0] + 18, c[1] + 18, Math.max(30, p.H + 14)); q.grua.visible = false; mundoObra.add(q.grua); }
      // Cerramiento de obra (malla verde de 2,4 m) y, en María Paz, cierre de la calle alrededor.
      if (p.id !== 'predio-suelo' && p.id !== 'alameda') { q.cerco = cerco(p.id === 'mercado' ? prop.mercadoZona : p.poly, -1.5, 2.4, valla()); q.cerco.visible = false; mundoObra.add(q.cerco); }
      if (p.grupo === 'mp') {
        q.zona = (desplazar(P, -14) || P).map(([x, z]) => [x / 1000, z / 1000]);
        q.cinta = cerco(q.zona, 0, 1.1, cinta, 2); q.cinta.visible = false; mundoObra.add(q.cinta);
      }
      if (p.tipo === 'edificio' && p.id !== 'mercado') { q.escombros = escombros(p.poly); q.escombros.visible = false; mundoObra.add(q.escombros); }
      // Recorridos viales que pasan cerca del frente (para los camiones de obra).
      q.rutas = rutasCerca(rutas, c[0] / 1000, c[1] / 1000, p.id === 'mercado' ? .32 : .16);
      return q;
    });
  }
  function rutasCerca(rutas, x, z, radio) {
    const out = [];
    for (const r of rutas) {
      let best = 1e9, bi = -1; for (let i = 0; i < r.points.length; i += 2) { const d = Math.hypot(r.points[i][0] - x, r.points[i][1] - z); if (d < best) { best = d; bi = i; } }
      if (best < radio) out.push({ r, d: r.cumulative[bi] });
    }
    return out.sort(() => Math.random() - .5).slice(0, 6);
  }

  // ---------- Camiones de obra ----------
  const TIPOS = { volqueta: ['#e2a33b', '#6e5c49'], mixer: ['#f0eee8', '#9aa3a3'], material: ['#3d6fb0', '#c8a46a'] };
  const inst = {};
  for (const [k, [c1, c2]] of Object.entries(TIPOS)) {
    const mk = (geo, col) => { const m = new T.InstancedMesh(geo, new T.MeshLambertMaterial({ color: col }), 80); m.count = 0; m.frustumCulled = false; scene.add(m); return m; };
    inst[k] = { cab: mk(new T.BoxGeometry(.0025, .0026, .0024), '#c94a3a'), cuerpo: mk(k === 'mixer' ? new T.CylinderGeometry(.0013, .0011, .0055, 10).rotateZ(Math.PI / 2) : new T.BoxGeometry(.0065, .0022, .0025), c1), carga: mk(new T.BoxGeometry(.0055, .0012, .0022), c2) };
  }
  const o3 = new T.Object3D();
  function moverCamiones(dt) {
    const sim = dynamics.state(); if (sim.paused) dt = 0;
    const pace = +(document.getElementById('pace')?.value || 5), simdt = dt * pace;
    const activos = piezas.filter(q => f >= q.d0 && f < q.o1 && q.rutas.length);
    // Cuántos camiones quiere cada frente: demolición → volquetas; obra → mixers y materiales.
    const deseo = new Map(); for (const q of activos) deseo.set(q, q.id === 'mercado' ? 10 : q.edif.length ? 4 : 2);
    for (const q of activos) {
      const actuales = trucks.filter(t => t.q === q).length;
      if (actuales < deseo.get(q) && Math.random() < dt * 1.5) {
        const r = q.rutas[Math.floor(Math.random() * q.rutas.length)], demo = f < q.o0;
        trucks.push({ q, r: r.r, d: 0, stop: r.d, estado: 'ida', espera: 0, tipo: demo ? 'volqueta' : Math.random() < .55 ? 'mixer' : 'material' });
      }
    }
    for (const t of trucks) {
      if (t.estado === 'descarga') { t.espera -= dt; if (t.espera <= 0) { t.estado = 'vuelta'; st.viajes++; } continue; }
      t.d += 18 / 3600 * simdt;
      if (t.estado === 'ida' && t.d >= t.stop) { t.d = t.stop; t.estado = 'descarga'; t.espera = 2.5 + Math.random() * 3; }
      if (t.d >= t.r.length) t.fuera = true;
    }
    for (let i = trucks.length - 1; i >= 0; i--) if (trucks[i].fuera || !(f >= trucks[i].q.d0 && f < trucks[i].q.o1 + .02)) trucks.splice(i, 1);
    const cont = { volqueta: 0, mixer: 0, material: 0 };
    for (const t of trucks) {
      const p = routeAt(t.r, t.d), k = t.tipo, n = cont[k]++; if (n >= 80) continue;
      const y = ground(p.x, p.z) + .0006, set = (m, ox, oy) => { o3.position.set(p.x + Math.sin(p.angle) * ox, y + oy, p.z + Math.cos(p.angle) * ox); o3.rotation.set(0, p.angle - Math.PI / 2, 0); if (k === 'mixer' && m === inst[k].cuerpo) o3.rotateX(t.d * 900); o3.updateMatrix(); m.setMatrixAt(n, o3.matrix); };
      set(inst[k].cab, .0042, .0013); set(inst[k].cuerpo, 0, .0019); if (k !== 'mixer') set(inst[k].carga, 0, .0034);
    }
    for (const k of Object.keys(inst)) for (const m of Object.values(inst[k])) { m.count = Math.min(80, cont[k]); m.instanceMatrix.needsUpdate = true; if (k === 'mixer' && m === inst[k].carga) m.count = 0; }
  }

  // ---------- Avance de la obra ----------
  function aplicar() {
    for (const q of piezas) {
      const enObra = f >= q.d0 && f < q.o1, p = Math.max(0, Math.min(1, (f - q.o0) / Math.max(1e-6, q.o1 - q.o0)));
      // Piezas que crecen: escala vertical = avance, con andamio que sube con ellas.
      for (const e of q.edif) { e.visible = f >= q.o0; e.scale.y = Math.max(.02, p); }
      for (const a of q.andamios) a.visible = f >= q.o0 && p < 1;
      for (const s of q.suelo) s.visible = q.tipo === 'edificio' ? p >= 1 : f >= q.o0;
      for (const v of q.veg) v.visible = q.tipo === 'veg' ? p >= .45 : p >= 1;
      for (const t of q.tarde) t.visible = p >= .8;
      if (q.grua) { q.grua.visible = f >= q.o0 && p < 1; }
      if (q.cerco) q.cerco.visible = enObra;
      if (q.cinta) q.cinta.visible = enObra;
      if (q.escombros) q.escombros.visible = f >= q.d0 && f < q.o0 + (q.o1 - q.o0) * .15;
    }
    // Máscara: lo existente desaparece desde la demolición de cada pieza.
    const polys = [];
    for (const q of piezas) if (q.grupo && f >= q.d0) polys.push(q.poly);
    if (f >= .02) polys.push(prop.mercadoZona);
    if (f >= .64) polys.push(prop.predio);
    const clave = polys.length + ':' + (f >= .64);
    if (clave !== claveMascara) { claveMascara = clave; visor.paraObra.mascara(polys); visor.paraObra.arboles(polys); }
    // Calles cerradas alrededor de las manzanas en obra.
    zonasCierre = piezas.filter(q => q.zona && f >= q.d0 && f < q.o1).map(q => q.zona);
    const cc = zonasCierre.length + ':' + piezas.filter(q => q.zona && f >= q.d0 && f < q.o1).map(q => q.id).join(',');
    if (cc !== claveCierre) {
      claveCierre = cc;
      const zs = zonasCierre.map(z => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, w] of z) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, w); z1 = Math.max(z1, w); } return { z, x0, x1, z0, z1 }; });
      dynamics.setClosures(zs.length ? (x, z) => zs.some(b => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1 && dentro(b.z, x, z)) : null);
    }
  }

  function panelTexto() {
    const mes = Math.min(total, Math.floor(meses)), ano = Math.floor(mes / 12) + 1;
    $('#obra-prog').style.width = (f * 100).toFixed(1) + '%';
    $('#obra-reloj').innerHTML = f >= 1 ? '<b>Obra terminada</b> · la propuesta ya funciona con el tráfico y Corabastos en su lugar nuevo' : `<b>Mes ${mes} de ${total}</b> · año ${ano} de ${total / 12}`;
    $('#obra-estado').textContent = ESTADO(f);
    const frentes = piezas.filter(q => f >= q.d0 && f < q.o1 && q.id !== 'alameda' && q.id !== 'predio-suelo');
    $('#obra-frentes').innerHTML = frentes.slice(0, 9).map(q => `<li><span class="${f < q.o0 ? 'demo' : 'cons'}">${f < q.o0 ? 'demolición' : 'construcción ' + Math.round(Math.max(0, (f - q.o0) / (q.o1 - q.o0)) * 100) + ' %'}</span>${q.nombre}</li>`).join('') + (frentes.length > 9 ? `<li class="mas">y ${frentes.length - 9} frentes más</li>` : '') || '<li class="mas">Sin frentes activos</li>';
    const tr = dynamics.state().traffic, lentos = tr.total ? Math.round(tr.slow / tr.total * 100) : 0;
    $('#obra-datos').innerHTML = `<span><b>${zonasCierre.length}</b> zonas con calles cerradas</span><span><b>${trucks.length}</b> camiones de obra en vía</span><span><b>${st.viajes}</b> viajes de obra</span><span><b>${lentos} %</b> vehículos lentos (&lt; 5 km/h)</span>`;
  }

  // ---------- Ciclo ----------
  let ultimoTexto = 0;
  function update(now, dt) {
    if (!activo) return;
    // En modo externo el avance lo fija el reloj de años (fijar); si no, la obra lleva su propio reloj.
    if (!externo && !pausado && !dynamics.state().paused) meses = Math.min(total, meses + dt * vel);
    f = Math.min(1, meses / total);
    aplicar(); moverCamiones(dt);
    for (const q of piezas) if (q.grua?.visible) q.grua.userData.pluma.rotation.y = now / 4000 + q.c[0];
    if (!externo && now - ultimoTexto > 250) { ultimoTexto = now; panelTexto(); }
    invalidate();
  }

  function iniciar(anos, modoExterno = false) {
    externo = modoExterno;
    if (visor.on) document.getElementById('proposal-toggle')?.click();   // sale del modelo estático si estaba abierto
    preparar();
    activo = true; pausado = false; total = anos * 12; meses = 0; f = 0; vel = 1; claveMascara = ''; claveCierre = ''; trucks.length = 0; st.viajes = 0;
    prop.group.visible = true;
    for (const q of piezas) { [...q.edif, ...q.suelo, ...q.veg, ...q.tarde].forEach(o => o.visible = false); }
    mundoObra.visible = true;
    panel.hidden = externo; document.body.classList.add('obra-mode');
    $('#obra-titulo').textContent = `Obra de la propuesta · ${anos} años`;
    $('#obra-pausa').textContent = '⏸'; panel.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('active', x.dataset.v === '1'));
    dynamics.setPaused(false); invalidate();
  }
  function detener() {
    activo = false; panel.hidden = true; document.body.classList.remove('obra-mode');
    if (prop) { prop.group.visible = false; for (const q of piezas) { [...q.edif].forEach(e => { e.scale.y = 1; e.visible = true; }); [...q.suelo, ...q.veg, ...q.tarde].forEach(o => o.visible = true); q.andamios.forEach(a => a.visible = false); } }
    if (mundoObra) mundoObra.visible = false;
    for (const k of Object.keys(inst)) for (const m of Object.values(inst[k])) m.count = 0;
    trucks.length = 0; dynamics.setClosures(null); visor.paraObra.apagar(); invalidate();
  }
  const api = {
    update, iniciar, detener, onPedido: null,
    get activo() { return activo; },
    fijar(fr) { meses = Math.max(0, Math.min(1, fr)) * total; },
    resumen() {
      const fr = piezas.filter(q => f >= q.d0 && f < q.o1 && q.id !== 'alameda' && q.id !== 'predio-suelo').map(q => ({ nombre: q.nombre, fase: f < q.o0 ? 'demolición' : 'construcción', pct: Math.round(Math.max(0, (f - q.o0) / (q.o1 - q.o0)) * 100) }));
      return { f, estado: ESTADO(f), frentes: fr, zonas: zonasCierre.length, camiones: trucks.length, viajes: st.viajes };
    }
  };
  return api;
}
