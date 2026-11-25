// Estados en el mapa (modo Análisis/Planta). Todo sale de datos que la dinámica ya calcula:
// velocidad de cada vehículo, cola y descargas en Corabastos y residuos acumulados.
// No crea agentes ni modifica reglas: solo representa.
import * as T from 'three';

// Umbrales de lectura (km/h). Mismos que el código de color del proyecto.
export const VEL_FLUYE = 20, VEL_DETENIDO = 8;
const COL = { ok: new T.Color('#3dff7a'), warn: new T.Color('#ff9f1c'), bad: new T.Color('#ff2b2b'), none: new T.Color('#6b5428') };
const CELDA = .03;          // 30 m: tamaño de la celda donde se promedia la velocidad
const PASO = .012;          // 12 m: largo de cada tramo pintado
const ANCHO = .0042;        // 4,2 m: ancho de la franja de estado
const VEHICULOS = ['car', 'taxi', 'moto', 'truck'];

export function setupStates({ scene, ground, camera, dynamics, views, invalidate }) {
  const st0 = dynamics.state();

  // ---- Franjas de estado sobre la red vial (rutas cartográficas del simulador) ----
  const cellId = new Map(); let nCells = 0;
  const idOf = (x, z) => { const k = Math.floor(x / CELDA) + ',' + Math.floor(z / CELDA); if (!cellId.has(k)) cellId.set(k, nCells++); return cellId.get(k); };
  const pos = [], segCell = [], seen = new Set();
  for (const r of [...st0.roadRoutes, ...st0.cargoRoutes]) {
    const n = Math.max(1, Math.floor(r.length / PASO));
    let prev = at(r, 0);
    for (let i = 1; i <= n; i++) {
      const p = at(r, r.length * i / n);
      const mx = (prev.x + p.x) / 2, mz = (prev.z + p.z) / 2;
      // Evita dibujar dos veces el mismo tramo cuando varias rutas comparten calle.
      const key = Math.round(mx / .006) + ',' + Math.round(mz / .006);
      if (!seen.has(key)) {
        seen.add(key);
        const dx = p.x - prev.x, dz = p.z - prev.z, L = Math.hypot(dx, dz) || 1, ox = -dz / L * ANCHO / 2, oz = dx / L * ANCHO / 2;
        const y0 = ground(prev.x, prev.z) + .0013, y1 = ground(p.x, p.z) + .0013;
        pos.push(prev.x + ox, y0, prev.z + oz, prev.x - ox, y0, prev.z - oz, p.x + ox, y1, p.z + oz,
                 p.x + ox, y1, p.z + oz, prev.x - ox, y0, prev.z - oz, p.x - ox, y1, p.z - oz);
        segCell.push(idOf(mx, mz));
      }
      prev = p;
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  // RGBA: los tramos sin vehículos quedan transparentes y se ve la vía dorada de base.
  const colors = new Float32Array(pos.length / 3 * 4); geo.setAttribute('color', new T.BufferAttribute(colors, 4));
  const roadMat = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: T.DoubleSide });
  const ribbons = new T.Mesh(geo, roadMat); ribbons.frustumCulled = false; ribbons.renderOrder = 2; ribbons.visible = false; scene.add(ribbons);

  const sum = new Float32Array(nCells), cnt = new Uint16Array(nCells), ema = new Float32Array(nCells).fill(-1);

  // ---- Barras 3D en Corabastos: cola, descargando y residuos ----
  const [cx, cz] = st0.center;
  const box = new T.BoxGeometry(1, 1, 1); box.translate(0, .5, 0);
  const bar = (dx, color) => {
    const m = new T.Mesh(box, new T.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: .55, transparent: true, opacity: 0 }));
    m.position.set(cx + dx, ground(cx + dx, cz), cz); m.scale.set(.011, .002, .011); m.visible = false; scene.add(m); return m;
  };
  const bars = { cola: bar(-.016, '#ff2b2b'), servicio: bar(0, '#f5c46b'), residuos: bar(.016, '#ff9f1c') };
  const label = document.createElement('div'); label.className = 'map-label state-label'; label.hidden = true;
  document.getElementById('labels-overlay').append(label);

  // ---- Puntos de especies: círculos discretos en Análisis (en Realista quedan como estaban) ----
  const circle = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.beginPath(); g.arc(32, 32, 26, 0, 7); g.fillStyle = '#fff'; g.fill(); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; })();
  const sprites = []; scene.traverse(o => { if (o.isSprite && o.userData.marker) sprites.push({ o, map: o.material.map, op: o.material.opacity }); });

  let acc = 1, lastK = -1, lastLabel = '';
  function update(now, dt) {
    const k = views.amount, on = k > .01;
    ribbons.visible = on; roadMat.opacity = .92 * k;
    for (const b of Object.values(bars)) { b.visible = on; b.material.opacity = .95 * k; }
    if (Math.abs(k - lastK) > .001) {
      for (const s of sprites) { s.o.material.map = k > .5 ? circle : s.map; s.o.material.opacity = s.op * (1 - .45 * k); s.o.material.needsUpdate = true; }
      lastK = k; invalidate();
    }
    label.hidden = !on;
    if (!on) return;

    const st = dynamics.state();
    acc += dt;
    if (acc > .4) {   // recalcula el estado de las calles 2–3 veces por segundo
      acc = 0; sum.fill(0); cnt.fill(0);
      for (const kind of VEHICULOS) {
        const on = document.getElementById('on-' + kind)?.checked; if (!on) continue;
        for (const a of st.sets[kind].agents) {
          if (!a.position || a.state === 'cola' || a.state === 'descargando') continue;
          const id = cellId.get(Math.floor(a.position.x / CELDA) + ',' + Math.floor(a.position.z / CELDA));
          if (id === undefined) continue; sum[id] += a.speed; cnt[id]++;
        }
      }
      for (let i = 0; i < nCells; i++) {
        if (cnt[i]) ema[i] = ema[i] < 0 ? sum[i] / cnt[i] : ema[i] * .55 + sum[i] / cnt[i] * .45;
        else if (ema[i] >= 0) ema[i] = ema[i] * .9 + 25 * .1;  // sin vehículos, la calle vuelve a "fluye"
      }
      for (let s = 0; s < segCell.length; s++) {
        const v = ema[segCell[s]], c = v < 0 ? COL.none : v < VEL_DETENIDO ? COL.bad : v < VEL_FLUYE ? COL.warn : COL.ok, a = v < 0 ? 0 : 1;
        for (let j = 0; j < 6; j++) colors.set([c.r, c.g, c.b, a], (s * 6 + j) * 4);
      }
      geo.attributes.color.needsUpdate = true;

      // Barras: alturas proporcionales a los datos del panel de operación.
      const bays = +document.getElementById('bays').value, q = st.cargo.queue.length, srv = st.cargo.service.length;
      bars.cola.scale.y = .002 + Math.min(.16, q * .0045);
      bars.cola.material.color.set(q <= bays ? '#3dff7a' : q <= 4 * bays ? '#ff9f1c' : '#ff2b2b'); bars.cola.material.emissive.copy(bars.cola.material.color);
      bars.servicio.scale.y = .002 + Math.min(.16, srv * .0045);
      bars.residuos.scale.y = .002 + Math.min(.16, st.waste * .00005);
      const estado = q > 4 * bays ? 'falla localizada' : q > bays ? 'cola creciendo' : 'fluye';
      const txt = `<b>Corabastos</b><small>cola ${q} · descargando ${srv}/${bays} · residuos ${Math.round(st.waste)} kg · ${estado}</small>`;
      if (txt !== lastLabel) { label.innerHTML = txt; lastLabel = txt; }
      invalidate();
    }
    // Etiqueta sobre las barras
    const top = bars.cola.position.clone(); top.y += Math.max(bars.cola.scale.y, bars.residuos.scale.y) + .01;
    const p = top.project(camera);
    label.style.left = (p.x * .5 + .5) * innerWidth + 'px'; label.style.top = (-p.y * .5 + .5) * innerHeight + 'px';
    label.hidden = p.z > 1 || p.z < 0;
  }
  return { update };
}

function at(route, d) {
  let lo = 1, hi = route.cumulative.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (route.cumulative[mid] < d) lo = mid + 1; else hi = mid; }
  const a = route.points[lo - 1], b = route.points[lo], f = (d - route.cumulative[lo - 1]) / (route.cumulative[lo] - route.cumulative[lo - 1] || 1);
  return { x: a[0] + (b[0] - a[0]) * f, z: a[1] + (b[1] - a[1]) * f };
}
