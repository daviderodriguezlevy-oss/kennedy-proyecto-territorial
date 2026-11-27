// Visor del modelo estático de la propuesta: botón "Ver propuesta", fichas numeradas y recorte
// de lo existente dentro de las áreas intervenidas. No modifica la simulación (la pausa mientras se ve).
import * as T from 'three';
import { createProposal, OPC } from './propuesta.js?v=3';

export function setupProposalView({ scene, groups, camera, controls, ground, flyTo, dynamics, invalidate }) {
  let prop = null, on = false, hiddenObjs = [], treeBackup = [], sel = -1, claveOpc = '', sueloCache = null;
  // La propuesta se vuelve a construir si cambian sus variables (pisos, humedal, vegetación, nodos).
  const vigente = () => prop && claveOpc === JSON.stringify(OPC);
  // Máscara en textura: todas las áreas intervenidas pintadas en blanco sobre el sector (≈0,8 m por píxel).
  const B = { x0: -2.0, z0: 0.2, x1: -0.3, z1: 1.85 }, RES = 2048;
  const lienzo = document.createElement('canvas'); lienzo.width = lienzo.height = RES;
  const maskTex = new T.CanvasTexture(lienzo); maskTex.flipY = false; maskTex.magFilter = maskTex.minFilter = T.NearestFilter; maskTex.generateMipmaps = false;
  const uni = { on: { value: 0 }, tex: { value: maskTex }, b: { value: new T.Vector4(B.x0, B.z0, B.x1, B.z1) } };
  function pintarMascara(polys) {
    const g = lienzo.getContext('2d'); g.clearRect(0, 0, RES, RES); g.fillStyle = '#fff';
    const px = x => (x - B.x0) / (B.x1 - B.x0) * RES, pz = z => (z - B.z0) / (B.z1 - B.z0) * RES;
    for (const pol of polys) { g.beginPath(); pol.forEach(([x, z], i) => i ? g.lineTo(px(x), pz(z)) : g.moveTo(px(x), pz(z))); g.closePath(); g.fill(); }
    maskTex.needsUpdate = true;
  }

  // Recorte en el sombreador: lo existente dentro de las áreas intervenidas no se dibuja mientras se ve la propuesta.
  function enmascarar(material) {
    if (material.userData.masked) return; material.userData.masked = true;
    material.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, { uMaskOn: uni.on, uMaskTex: uni.tex, uMaskB: uni.b });
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vWxz;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvWxz = (modelMatrix * vec4(transformed, 1.0)).xz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vWxz; uniform float uMaskOn; uniform sampler2D uMaskTex; uniform vec4 uMaskB;')
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
if (uMaskOn > 0.5) { vec2 mUv = (vWxz - uMaskB.xy) / (uMaskB.zw - uMaskB.xy);
  if (mUv.x > 0.0 && mUv.x < 1.0 && mUv.y > 0.0 && mUv.y < 1.0 && texture2D(uMaskTex, mUv).r > 0.5) discard; }`);
    };
    material.customProgramCacheKey = () => 'mascara-propuesta-2';
    material.needsUpdate = true;
  }
  for (const key of ['Buildings', 'roads', 'sidewalks', 'parks']) groups[key]?.traverse(o => { if (o.material) [].concat(o.material).forEach(enmascarar); });
  // ---- Interfaz ----
  const btn = document.createElement('button'); btn.id = 'proposal-toggle'; btn.textContent = '🏗 Ver propuesta'; btn.title = 'Modelo estático de la propuesta (no es simulación)'; document.body.append(btn);
  const card = document.createElement('section'); card.id = 'proposal-card'; card.hidden = true; document.body.append(card);
  const pinsLayer = document.createElement('div'); pinsLayer.id = 'proposal-pins'; pinsLayer.hidden = true; document.body.append(pinsLayer);
  let pinEls = [];

  // Altura exacta del suelo: se rasteriza la malla del terreno que se dibuja (no la grilla de 12 m),
  // con interpolación dentro de cada triángulo, en celdas de 2 m sobre el sector de la propuesta.
  function sueloExacto() {
    const C = .002, nx = Math.ceil((B.x1 - B.x0) / C) + 1, nz = Math.ceil((B.z1 - B.z0) / C) + 1, h = new Float32Array(nx * nz).fill(NaN);
    groups.terrain.traverse(o => {
      if (!o.isMesh) return; const pos = o.geometry.attributes.position.array, idx = o.geometry.index?.array, n = idx ? idx.length / 3 : pos.length / 9;
      for (let t = 0; t < n; t++) {
        const ia = idx ? idx[t * 3] : t * 3, ib = idx ? idx[t * 3 + 1] : t * 3 + 1, ic = idx ? idx[t * 3 + 2] : t * 3 + 2;
        const ax = pos[ia * 3], ay = pos[ia * 3 + 1], az = pos[ia * 3 + 2], bx = pos[ib * 3], by = pos[ib * 3 + 1], bz = pos[ib * 3 + 2], cx = pos[ic * 3], cy = pos[ic * 3 + 1], cz = pos[ic * 3 + 2];
        const x0 = Math.min(ax, bx, cx), x1 = Math.max(ax, bx, cx), z0 = Math.min(az, bz, cz), z1 = Math.max(az, bz, cz);
        if (x1 < B.x0 || x0 > B.x1 || z1 < B.z0 || z0 > B.z1) continue;
        const det = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz); if (Math.abs(det) < 1e-14) continue;
        for (let i = Math.max(0, Math.floor((x0 - B.x0) / C)); i <= Math.min(nx - 1, Math.ceil((x1 - B.x0) / C)); i++)
          for (let j = Math.max(0, Math.floor((z0 - B.z0) / C)); j <= Math.min(nz - 1, Math.ceil((z1 - B.z0) / C)); j++) {
            const x = B.x0 + i * C, z = B.z0 + j * C, l1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / det, l2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / det, l3 = 1 - l1 - l2;
            if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
            h[j * nx + i] = l1 * ay + l2 * by + l3 * cy;
          }
      }
    });
    return (x, z) => {
      const fx = (x - B.x0) / C, fz = (z - B.z0) / C, i = Math.floor(fx), j = Math.floor(fz);
      if (i < 0 || j < 0 || i >= nx - 1 || j >= nz - 1) return ground(x, z);
      const tx = fx - i, tz = fz - j, a = h[j * nx + i], b = h[j * nx + i + 1], c = h[(j + 1) * nx + i], d = h[(j + 1) * nx + i + 1];
      if ([a, b, c, d].some(Number.isNaN)) return ground(x, z);
      return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
    };
  }

  function construir() {
    if (prop) { scene.remove(prop.group); prop.group.traverse(o => o.geometry?.dispose?.()); pinEls.forEach(e => e.remove()); pinEls = []; }
    sueloCache ||= sueloExacto();
    claveOpc = JSON.stringify(OPC);
    prop = createProposal({ scene, ground: sueloCache, opc: { ...OPC } });
    pintarMascara(prop.masks);
    card.innerHTML = `<header><b>Propuesta · modelo estático</b><button id="proposal-close" title="Volver al estado actual">×</button></header>
      <p class="help">Solo para ver y corregir: no es la simulación. Se ubica sobre suelo que hoy no tiene vivienda.</p>
      <ol>${prop.pins.map((p, i) => `<li><button data-pin="${i}"><span>${i + 1}</span>${p.titulo}</button></li>`).join('')}</ol>
      <div id="proposal-text" class="control-note">Elige una pieza para ver qué es y por qué está ahí.</div>
      <p class="help">Áreas aproximadas: predio de Corabastos ${ha(prop.areas.predio)} ha · humedal nuevo ${ha(prop.areas.humedal)} ha · parque lineal ${ha(prop.areas.parque)} ha.</p>
      <div class="proposal-views"><button data-cam="todo">Vista general</button><button data-cam="humedal">Humedal</button><button data-cam="mercado">Mercado</button><button data-cam="vivienda">María Paz</button></div>`;
    card.querySelector('#proposal-close').onclick = () => activar(false);
    card.querySelectorAll('[data-pin]').forEach(b => b.onclick = () => elegir(+b.dataset.pin));
    card.querySelectorAll('[data-cam]').forEach(b => b.onclick = () => vista(b.dataset.cam));
    pinEls = prop.pins.map((p, i) => { const d = document.createElement('button'); d.className = 'prop-pin'; d.textContent = i + 1; d.title = p.titulo; d.onclick = () => elegir(i); pinsLayer.append(d); return d; });
  }
  const ha = m2 => (m2 / 10000).toFixed(1).replace('.', ',');

  function elegir(i) {
    salirRecorrido(); sel = i; const p = prop.pins[i];
    card.querySelector('#proposal-text').innerHTML = `<b>${i + 1}. ${p.titulo}</b><br>${p.texto}`;
    card.querySelectorAll('[data-pin]').forEach(b => b.classList.toggle('active', +b.dataset.pin === i));
    pinEls.forEach((e, k) => e.classList.toggle('active', k === i));
    const t = new T.Vector3(p.x, p.y * .5, p.z), dir = camera.position.clone().sub(controls.target).normalize();
    flyTo(t.clone().add(dir.multiplyScalar(.28)).setY(Math.max(t.y + .12, .14)), t);
  }
  const salirRecorrido = () => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' }));
  function vista(id) {
    salirRecorrido();
    const v = { todo: [[-1.10, 1.00], [-.35, 1.15, 1.85]], humedal: [[-1.55, 1.15], [-1.25, .32, 1.45]], mercado: [[-1.05, 1.18], [-.80, .22, 1.40]], vivienda: [[-0.93, 0.66], [-0.76, .26, 0.98]] }[id];
    const [tx, tz] = v[0], [px, py, pz] = v[1];
    flyTo(new T.Vector3(px, py, pz), new T.Vector3(tx, ground(tx, tz), tz));
  }

  function activar(estado) {
    on = estado; if (on && !vigente()) construir();
    prop.group.visible = on; uni.on.value = on ? 1 : 0;
    btn.classList.toggle('active', on); btn.textContent = on ? '🏗 Ver estado actual' : '🏗 Ver propuesta';
    card.hidden = !on; pinsLayer.hidden = !on; document.body.classList.toggle('proposal-mode', on);
    // Lo que se mueve (agentes, fauna, lluvia, estados) se oculta y la simulación se pausa: es un modelo estático.
    const base = new Set([...Object.values(groups), prop.group]);
    if (on) { hiddenObjs = scene.children.filter(o => !base.has(o) && !o.isLight && o.visible); hiddenObjs.forEach(o => o.visible = false); dynamics?.setPaused(true); }
    else { hiddenObjs.forEach(o => o.visible = true); hiddenObjs = []; dynamics?.setPaused(false); }
    arbolesDentro(on);
    if (on) vista('todo');
    invalidate();
  }
  btn.onclick = () => activar(!on);

  // Árboles registrados dentro de las áreas intervenidas: se ocultan en la vista de propuesta.
  function arbolesDentro(ocultar, polys = prop.masks) {
    const inst = groups.trees.children.filter(o => o.isInstancedMesh);
    if (ocultar) {
      treeBackup = []; const m = new T.Matrix4(), p = new T.Vector3(), zero = new T.Matrix4().makeScale(0, 0, 0);
      for (const mesh of inst) for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, m); p.setFromMatrixPosition(m);
        if (polys.some(pol => dentroPol(pol, p.x, p.z))) { treeBackup.push([mesh, i, m.clone()]); mesh.setMatrixAt(i, zero); }
      }
    } else for (const [mesh, i, m] of treeBackup) mesh.setMatrixAt(i, m);
    inst.forEach(x => x.instanceMatrix.needsUpdate = true);
  }

  // Fichas numeradas sobre la escena.
  const v3 = new T.Vector3();
  function update() {
    if (!on || !prop) return;
    prop.pins.forEach((p, i) => { v3.set(p.x, p.y, p.z).project(camera); const e = pinEls[i]; e.hidden = v3.z > 1 || v3.z < 0 || Math.abs(v3.x) > 1.05 || Math.abs(v3.y) > 1.05; e.style.left = (v3.x * .5 + .5) * innerWidth + 'px'; e.style.top = (-v3.y * .5 + .5) * innerHeight + 'px'; });
  }
  // Acceso para la animación de obra (máscara y árboles por fases).
  const paraObra = {
    preparar() { if (!vigente()) construir(); return prop; },
    mascara(polys) { pintarMascara(polys); uni.on.value = polys.length ? 1 : 0; invalidate(); },
    arboles(polys) { arbolesDentro(false); if (polys.length) arbolesDentro(true, polys); invalidate(); },
    apagar() { uni.on.value = 0; arbolesDentro(false); treeBackup = []; if (prop) pintarMascara(prop.masks); }
  };
  return { update, paraObra, get on() { return on; } };
}

function dentroPol(pol, x, z) { let c = false; for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) { const [ax, az] = pol[i], [bx, bz] = pol[j]; if ((az > z) !== (bz > z) && x < (bx - ax) * (z - az) / (bz - az) + ax) c = !c; } return c; }
