// Estados en la planta. Todo sale de datos que la dinámica ya calcula:
// velocidad de cada vehículo, cola y descargas en Corabastos y residuos acumulados.
// No crea agentes ni modifica reglas: solo representa. Se muestra únicamente al dibujar la planta.
import * as T from 'three';

// Umbrales de lectura (km/h). Mismos que el código de color del proyecto.
export const VEL_FLUYE = 20, VEL_DETENIDO = 8;
const GOLD = new T.Color('#f5c46b');
const COL = { ok: new T.Color('#3dff7a'), warn: new T.Color('#ff9f1c'), bad: new T.Color('#ff2b2b') };
const CELDA = .03;          // 30 m: celda donde se promedia la velocidad
const PASO = .012;          // 12 m: largo de cada tramo pintado
const ANCHO = .009;         // 9 m: ancho de la franja (se ve desde la planta completa)
const VEHICULOS = ['car', 'taxi', 'moto', 'truck'];

export function setupStates({ scene, ground, dynamics, invalidate }) {
  const st0 = dynamics.state();

  // ---- Franjas de estado sobre las rutas viales del simulador ----
  const cellId = new Map(); let nCells = 0;
  const idOf = (x, z) => { const k = Math.floor(x / CELDA) + ',' + Math.floor(z / CELDA); if (!cellId.has(k)) cellId.set(k, nCells++); return cellId.get(k); };
  const pos = [], segCell = [], seen = new Set();
  for (const r of [...st0.roadRoutes, ...st0.cargoRoutes]) {
    const n = Math.max(1, Math.floor(r.length / PASO));
    let prev = at(r, 0);
    for (let i = 1; i <= n; i++) {
      const p = at(r, r.length * i / n), mx = (prev.x + p.x) / 2, mz = (prev.z + p.z) / 2;
      const key = Math.round(mx / .006) + ',' + Math.round(mz / .006);   // un solo tramo por calle compartida
      if (!seen.has(key)) {
        seen.add(key);
        // Segmento de línea: en planta mide siempre al menos 1 píxel, a cualquier zoom.
        pos.push(prev.x, ground(prev.x, prev.z) + .002, prev.z, p.x, ground(p.x, p.z) + .002, p.z);
        segCell.push(idOf(mx, mz));
      }
      prev = p;
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  // RGBA: tramos sin vehículos quedan transparentes y se ve la vía dorada de base.
  const colors = new Float32Array(pos.length / 3 * 4); geo.setAttribute('color', new T.BufferAttribute(colors, 4));
  for (let i = 0; i < colors.length; i += 4) colors.set([GOLD.r, GOLD.g, GOLD.b, .7], i);   // red vial dorada mientras no hay datos
  const ribbons = new T.LineSegments(geo, new T.LineBasicMaterial({ vertexColors: true, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, blending: T.AdditiveBlending }));
  ribbons.frustumCulled = false; ribbons.renderOrder = 2; ribbons.visible = false; scene.add(ribbons);
  const sum = new Float32Array(nCells), cnt = new Uint16Array(nCells), ema = new Float32Array(nCells).fill(-1);

  // ---- Trancones también en 3D: franjas anchas sobre la calzada, solo donde el tráfico va lento o detenido ----
  // (verde = transparente, para no tapar la ciudad; ámbar = lento; rojo = detenido).
  const nSeg = pos.length / 6, ANCHO3D = .0075;
  const p3 = new Float32Array(nSeg * 4 * 3), c3 = new Float32Array(nSeg * 4 * 4), idx = new Uint32Array(nSeg * 6);
  for (let s = 0; s < nSeg; s++) {
    const x1 = pos[s * 6], y1 = pos[s * 6 + 1] + .001, z1 = pos[s * 6 + 2], x2 = pos[s * 6 + 3], y2 = pos[s * 6 + 4] + .001, z2 = pos[s * 6 + 5];
    const dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz) || 1, nx = -dz / L * ANCHO3D / 2, nz = dx / L * ANCHO3D / 2;
    p3.set([x1 + nx, y1, z1 + nz, x1 - nx, y1, z1 - nz, x2 + nx, y2, z2 + nz, x2 - nx, y2, z2 - nz], s * 12);
    idx.set([s * 4, s * 4 + 1, s * 4 + 2, s * 4 + 1, s * 4 + 3, s * 4 + 2], s * 6);
  }
  const geo3 = new T.BufferGeometry(); geo3.setAttribute('position', new T.BufferAttribute(p3, 3)); geo3.setAttribute('color', new T.BufferAttribute(c3, 4)); geo3.setIndex(new T.BufferAttribute(idx, 1));
  const franjas = new T.Mesh(geo3, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: T.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4 }));
  franjas.frustumCulled = false; franjas.renderOrder = 3; scene.add(franjas);
  let ver3D = true;

  // ---- Barras en Corabastos: cola, descargando y residuos ----
  const [cx, cz] = st0.center;
  const box = new T.BoxGeometry(1, 1, 1); box.translate(0, .5, 0);
  const bar = (dx, color) => {
    const m = new T.Mesh(box, new T.MeshBasicMaterial({ color, toneMapped: false }));
    m.position.set(cx + dx, ground(cx + dx, cz), cz); m.scale.set(.03, .002, .03); m.visible = false; scene.add(m); return m;
  };
  const bars = { cola: bar(-.034, '#ff2b2b'), servicio: bar(0, '#f5c46b'), residuos: bar(.034, '#ff9f1c') };
  const label = document.createElement('div'); label.className = 'plan-label state-label';

  let acc = 1, lastLabel = '';
  function update(now, dt) {
    acc += dt; if (acc < .4) return;   // 2–3 veces por segundo
    acc = 0;
    const st = dynamics.state();
    sum.fill(0); cnt.fill(0);
    for (const kind of VEHICULOS) {
      if (!document.getElementById('on-' + kind)?.checked) continue;
      for (const a of st.sets[kind].agents) {
        if (!a.position || a.state === 'cola' || a.state === 'descargando') continue;
        const id = cellId.get(Math.floor(a.position.x / CELDA) + ',' + Math.floor(a.position.z / CELDA));
        if (id === undefined) continue; sum[id] += a.speed; cnt[id]++;
      }
    }
    for (let i = 0; i < nCells; i++) {
      if (cnt[i]) ema[i] = ema[i] < 0 ? sum[i] / cnt[i] : ema[i] * .55 + sum[i] / cnt[i] * .45;
      else if (ema[i] >= 0) ema[i] = ema[i] * .9 + 25 * .1;   // sin vehículos, la calle vuelve a "fluye"
    }
    for (let s = 0; s < segCell.length; s++) {
      const v = ema[segCell[s]], c = v < 0 ? GOLD : v < VEL_DETENIDO ? COL.bad : v < VEL_FLUYE ? COL.warn : COL.ok, a = v < 0 ? .7 : 1;
      const o = s * 8; colors[o] = colors[o + 4] = c.r; colors[o + 1] = colors[o + 5] = c.g; colors[o + 2] = colors[o + 6] = c.b; colors[o + 3] = colors[o + 7] = a;   // sin crear arreglos temporales
      const a3 = v < 0 ? 0 : v < VEL_DETENIDO ? .85 : v < VEL_FLUYE ? .5 : 0, o3 = s * 16;
      for (let k = 0; k < 4; k++) { c3[o3 + k * 4] = c.r; c3[o3 + k * 4 + 1] = c.g; c3[o3 + k * 4 + 2] = c.b; c3[o3 + k * 4 + 3] = a3; }
    }
    geo.attributes.color.needsUpdate = true; geo3.attributes.color.needsUpdate = true;

    const bays = +document.getElementById('bays').value, q = st.cargo.queue.length, srv = st.cargo.service.length;
    bars.cola.scale.y = .002 + Math.min(.16, q * .0045);
    bars.cola.material.color.set(q <= bays ? '#3dff7a' : q <= 4 * bays ? '#ff9f1c' : '#ff2b2b');
    bars.servicio.scale.y = .002 + Math.min(.16, srv * .0045);
    bars.residuos.scale.y = .002 + Math.min(.16, st.waste * .00005);
    const estado = q > 4 * bays ? 'falla localizada' : q > bays ? 'cola creciendo' : 'fluye';
    const txt = `<b>Corabastos · ${estado}</b><small>cola ${q} · descargando ${srv}/${bays} · residuos ${Math.round(st.waste)} kg</small>`;
    if (txt !== lastLabel) { label.innerHTML = txt; lastLabel = txt; label.dataset.state = q > 4 * bays ? 'bad' : q > bays ? 'warn' : 'ok'; }
    invalidate();
  }

  return {
    update,
    show(on) { ribbons.visible = on; franjas.visible = !on && ver3D; for (const b of Object.values(bars)) b.visible = on; },
    set ver3D(v) { ver3D = v; franjas.visible = v; invalidate(); },
    labelElement(parent) { if (label.parentElement !== parent) parent.append(label); return { el: label, x: cx, z: cz + .05 }; }
  };
}

function at(route, d) {
  let lo = 1, hi = route.cumulative.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (route.cumulative[mid] < d) lo = mid + 1; else hi = mid; }
  const a = route.points[lo - 1], b = route.points[lo], f = (d - route.cumulative[lo - 1]) / (route.cumulative[lo] - route.cumulative[lo - 1] || 1);
  return { x: a[0] + (b[0] - a[0]) * f, z: a[1] + (b[1] - a[1]) * f };
}
