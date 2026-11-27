// Piezas de arquitectura para el modelo estático de la propuesta. Todo se construye en METROS
// (el grupo que las contiene se escala a la escena: 1 m = 0,001 unidades).
// Fachadas con textura por piso y vano (ladrillo, vidrio, concreto), losas, balcones, cubiertas,
// vegetación, agua y pasarelas: la intención es que se lea como proyecto, no como esquema de cajas.
import * as T from 'three';

// ---------- Texturas dibujadas en canvas (una celda = un vano por un piso) ----------
const cache = new Map();
function tex(key, draw, w = 256, h = 256) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  cache.set(key, t); return t;
}
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);

function ventana(g, x, y, w, h, marco, vidrio) {
  g.fillStyle = marco; g.fillRect(x - 4, y - 4, w + 8, h + 8);
  const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, vidrio[0]); gr.addColorStop(1, vidrio[1]);
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  g.fillStyle = marco; g.fillRect(x + w / 2 - 2, y, 4, h); g.fillRect(x, y + h * .62, w, 3);
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x + 4, y + 4, w * .35, h * .5);
}

export const FACHADAS = {
  // Ladrillo a la vista con ventanas en franja y alfajía: lenguaje de vivienda bogotana.
  ladrillo: () => tex('ladrillo', (g, W, H) => {
    g.fillStyle = '#9a4a2e'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 10) for (let x = (y / 10 % 2) * 14; x < W; x += 28) {
      const v = rnd() * 30 - 15; g.fillStyle = `rgb(${160 + v},${78 + v * .6},${50 + v * .4})`; g.fillRect(x + 1, y + 1, 26, 8);
    }
    g.fillStyle = '#d9cfc2'; g.fillRect(0, H - 18, W, 18);              // losa / alfajía
    ventana(g, 46, 54, 164, 130, '#2b2b2b', ['#5d7a8c', '#a9c1cc']);
    g.fillStyle = '#e6ddd0'; g.fillRect(40, 186, 176, 8);                // alfajía
  }),
  // Balcón: mismo ladrillo con puerta-ventana y baranda metálica.
  balcon: () => tex('balcon', (g, W, H) => {
    g.fillStyle = '#8f4429'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 10) for (let x = (y / 10 % 2) * 14; x < W; x += 28) { const v = rnd() * 30 - 15; g.fillStyle = `rgb(${150 + v},${72 + v * .6},${46 + v * .4})`; g.fillRect(x + 1, y + 1, 26, 8); }
    g.fillStyle = '#d9cfc2'; g.fillRect(0, H - 22, W, 22);
    ventana(g, 40, 30, 176, 196, '#262626', ['#4f6b7c', '#9fb7c3']);
    g.strokeStyle = '#1c1c1c'; g.lineWidth = 4; g.beginPath(); g.moveTo(20, 150); g.lineTo(236, 150); g.stroke();
    for (let x = 24; x < 236; x += 14) { g.beginPath(); g.moveTo(x, 150); g.lineTo(x, 232); g.stroke(); }
  }),
  // Muro cortina para el mercado: vidrio con montantes y antepecho opaco.
  vidrio: () => tex('vidrio', (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#6f8f9a'); gr.addColorStop(.5, '#b9d0d6'); gr.addColorStop(1, '#5c7a86');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#3a4448'; g.fillRect(0, H - 40, W, 40);              // antepecho
    g.fillStyle = '#d7dcdc'; for (const x of [0, W / 2 - 3, W - 6]) g.fillRect(x, 0, 6, H);
    g.fillRect(0, H - 44, W, 5); g.fillRect(0, 0, W, 4);
    g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(14, 10, 60, H - 70);
  }),
  // Concreto claro con celosía vertical (protección solar) para el zócalo logístico.
  celosia: () => tex('celosia', (g, W, H) => {
    g.fillStyle = '#cfc8bb'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#39413f'; g.fillRect(20, 30, W - 40, H - 70);
    g.fillStyle = '#d8d2c6'; for (let x = 20; x < W - 20; x += 22) g.fillRect(x, 30, 9, H - 70);
    g.fillStyle = '#b9b1a3'; g.fillRect(0, H - 22, W, 22);
  }),
  // Muelle de carga: portón seccional y bolardos.
  muelle: () => tex('muelle', (g, W, H) => {
    g.fillStyle = '#c9c2b5'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#e2a33b'; g.fillRect(30, 40, W - 60, H - 40);
    g.fillStyle = '#b9862e'; for (let y = 52; y < H; y += 18) g.fillRect(30, y, W - 60, 3);
    g.fillStyle = '#2a2a2a'; g.fillRect(24, 34, W - 48, 8);
    g.fillStyle = '#ffd23f'; g.fillRect(10, H - 60, 12, 60); g.fillRect(W - 22, H - 60, 12, 60);
  }),
  // Cubierta verde, pasto, huertas, adoquín, agua, madera y juncos.
  techoVerde: () => tex('techoVerde', (g, W, H) => { g.fillStyle = '#5d7d3c'; g.fillRect(0, 0, W, H); for (let i = 0; i < 1400; i++) { const v = rnd(); g.fillStyle = `rgba(${60 + v * 70},${100 + v * 60},${40 + v * 30},.7)`; g.fillRect(rnd() * W, rnd() * H, 3 + rnd() * 6, 3 + rnd() * 6); } }),
  pasto: () => tex('pasto', (g, W, H) => { g.fillStyle = '#6f8f45'; g.fillRect(0, 0, W, H); for (let i = 0; i < 3000; i++) { const v = rnd(); g.fillStyle = `rgba(${80 + v * 60},${120 + v * 50},${50 + v * 30},.55)`; g.fillRect(rnd() * W, rnd() * H, 2, 4); } }),
  huerta: () => tex('huerta', (g, W, H) => { for (let y = 0; y < H; y += 32) { g.fillStyle = '#6b4c32'; g.fillRect(0, y, W, 32); g.fillStyle = '#5f8f3a'; for (let x = 0; x < W; x += 10) g.fillRect(x + rnd() * 3, y + 6, 7, 18); } }),
  adoquin: () => tex('adoquin', (g, W, H) => { g.fillStyle = '#b8ada0'; g.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 16) for (let x = (y / 16 % 2) * 16; x < W; x += 32) { const v = rnd() * 20; g.fillStyle = `rgb(${190 - v},${180 - v},${165 - v})`; g.fillRect(x + 1, y + 1, 30, 14); } }),
  madera: () => tex('madera', (g, W, H) => { for (let x = 0; x < W; x += 16) { const v = rnd() * 25; g.fillStyle = `rgb(${140 - v},${100 - v},${62 - v})`; g.fillRect(x, 0, 15, H); } }),
  asfalto: () => tex('asfalto', (g, W, H) => { g.fillStyle = '#4b4e50'; g.fillRect(0, 0, W, H); for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * .06})`; g.fillRect(rnd() * W, rnd() * H, 2, 2); } g.fillStyle = '#e9e4d6'; for (let x = 0; x < W; x += 64) g.fillRect(x + 28, 0, 6, H * .45); }),
  pv: () => tex('pv', (g, W, H) => { g.fillStyle = '#1d2a3d'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8ea0b5'; g.lineWidth = 2; for (let x = 0; x < W; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 21) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } })
};

const matCache = new Map();
export function mat(name, opts = {}) {
  const key = name + JSON.stringify(opts);
  if (matCache.has(key)) return matCache.get(key);
  let m;
  const base = { roughness: .85, metalness: 0 };
  if (FACHADAS[name]) m = new T.MeshStandardMaterial({ ...base, map: FACHADAS[name](), ...opts });
  else m = new T.MeshStandardMaterial({ ...base, color: name, ...opts });
  matCache.set(key, m); return m;
}

// ---------- Geometrías con UV en "vanos × pisos" ----------
// Muros de un prisma rectangular w×d de altura h; la textura se repite cada `vano` m y cada `piso` m.
export function muros(w, d, h, vano, piso) {
  const p = [], uv = [], idx = [];
  const caras = [[[-w / 2, -d / 2], [w / 2, -d / 2]], [[w / 2, -d / 2], [w / 2, d / 2]], [[w / 2, d / 2], [-w / 2, d / 2]], [[-w / 2, d / 2], [-w / 2, -d / 2]]];
  for (const [[ax, az], [bx, bz]] of caras) {
    const L = Math.hypot(bx - ax, bz - az), i = p.length / 3;
    p.push(ax, 0, az, bx, 0, bz, bx, h, bz, ax, h, az);
    uv.push(0, 0, L / vano, 0, L / vano, h / piso, 0, h / piso);
    idx.push(i, i + 2, i + 1, i, i + 3, i + 2);
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// Plano horizontal con UV en metros/escala (para pisos, pasto, cubiertas).
export function plano(w, d, escala = 10) {
  const g = new T.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / escala, uv.getY(i) * d / escala); return g;
}
// Polígono horizontal (lista [x,z] en metros) con UV en metros/escala.
export function poligono(pts, escala = 10, y = 0) {
  const s = new T.Shape(pts.map(([x, z]) => new T.Vector2(x, -z)));
  const g = new T.ShapeGeometry(s, 4); g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) { pos.setY(i, y); uv[i * 2] = pos.getX(i) / escala; uv[i * 2 + 1] = pos.getZ(i) / escala; }
  g.setAttribute('uv', new T.BufferAttribute(uv, 2)); g.computeVertexNormals(); return g;
}

// ---------- Edificio con fachada, losas, cubierta y equipos ----------
// o: {w, d, pisos, piso=3, vano=3.6, fachada, zocalo:{pisos,fachada}, cubierta:'verde'|'pv'|'plana', balcones, retroceso}
export function edificio(o) {
  const g = new T.Group(), piso = o.piso || 3, vano = o.vano || 3.6;
  let y = 0;
  const cuerpo = (w, d, pisos, fachada, pisoH = piso) => {
    const h = pisos * pisoH;
    const m = new T.Mesh(muros(w, d, h, vano, pisoH), mat(fachada)); m.position.y = y; m.castShadow = true; g.add(m);
    // Losas que sobresalen: marcan los pisos y dan sombra real.
    const losa = mat('#e7e0d4');
    for (let i = 1; i <= pisos; i++) { const s = new T.Mesh(new T.BoxGeometry(w + .5, .28, d + .5), losa); s.position.y = y + i * pisoH - .14; g.add(s); }
    y += h; return h;
  };
  if (o.zocalo) cuerpo(o.w + (o.zocalo.extra || 0), o.d + (o.zocalo.extra || 0), o.zocalo.pisos, o.zocalo.fachada, o.zocalo.piso || 4.5);
  const r = o.retroceso || 0;
  cuerpo(o.w - r, o.d - r, o.pisos, o.fachada);
  if (o.balcones) {   // franjas de balcones en fachada larga
    const bm = mat('#d8cfc2'), rail = mat('#1f1f1f', { metalness: .6, roughness: .4 });
    const base = o.zocalo ? o.zocalo.pisos * (o.zocalo.piso || 4.5) : 0;
    for (let i = 1; i < o.pisos; i++) for (let k = -1; k <= 1; k += 2) {
      for (let b = -o.w / 2 + 4; b < o.w / 2 - 4; b += 8.4) {
        const sl = new T.Mesh(new T.BoxGeometry(4.2, .22, 1.4), bm); sl.position.set(b + 2.1, base + i * piso, k * ((o.d - r) / 2 + .7)); g.add(sl);
        const rl = new T.Mesh(new T.BoxGeometry(4.2, 1.05, .06), rail); rl.position.set(b + 2.1, base + i * piso + .55, k * ((o.d - r) / 2 + 1.38)); g.add(rl);
      }
    }
  }
  // Cubierta: antepecho, equipos y verde o paneles solares.
  const w = o.w - r, d = o.d - r;
  const tapa = new T.Mesh(plano(w, d, 8), o.cubierta === 'verde' ? mat('techoVerde') : mat('#8f8a80')); tapa.position.y = y + .02; g.add(tapa);
  const par = mat('#d7cfc3');
  for (const [px, pz, sw, sd] of [[0, -d / 2, w, .3], [0, d / 2, w, .3], [-w / 2, 0, .3, d], [w / 2, 0, .3, d]]) { const p = new T.Mesh(new T.BoxGeometry(sw, 1.1, sd), par); p.position.set(px, y + .55, pz); g.add(p); }
  const eq = mat('#a9a59c'); const nEq = Math.max(1, Math.floor(w * d / 600));
  for (let i = 0; i < nEq; i++) { const e = new T.Mesh(new T.BoxGeometry(4 + rnd() * 3, 2.4, 3 + rnd() * 2), eq); e.position.set((rnd() - .5) * w * .6, y + 1.2, (rnd() - .5) * d * .6); g.add(e); }
  if (o.cubierta === 'pv') g.add(paneles(w * .8, d * .7, y + .6));
  g.userData.altura = y;
  return g;
}

// Paneles solares inclinados (instanciados).
export function paneles(w, d, y) {
  const filas = Math.max(1, Math.floor(d / 4)), cols = Math.max(1, Math.floor(w / 2.2));
  const geo = new T.BoxGeometry(2, .05, 3.2), m = new T.InstancedMesh(geo, mat('pv', { roughness: .3, metalness: .4 }), filas * cols);
  const o = new T.Object3D(); let i = 0;
  for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) { o.position.set(-w / 2 + c * 2.2 + 1, y, -d / 2 + f * 4 + 2); o.rotation.set(-.32, 0, 0); o.updateMatrix(); m.setMatrixAt(i++, o.matrix); }
  return m;
}

// Árboles con copa irregular y tronco (instanciados), alturas variadas.
// esbelto: copa alta y angosta (eucalipto, pino, ciprés: especies ornamentales de rápido crecimiento).
export function arboles(puntos, { alto = [7, 14], tono = .3, esbelto = false } = {}) {
  const n = puntos.length, g = new T.Group(); if (!n) return g;
  const copa = new T.InstancedMesh(new T.IcosahedronGeometry(1, 1), new T.MeshStandardMaterial({ roughness: .9, color: '#ffffff' }), n * 2);
  const tronco = new T.InstancedMesh(new T.CylinderGeometry(.18, .28, 1, 6), mat('#5b4634'), n);
  const o = new T.Object3D(), c = new T.Color();
  puntos.forEach(([x, z, y0 = 0], i) => {
    const h = alto[0] + rnd() * (alto[1] - alto[0]), r = h * (esbelto ? .12 + rnd() * .04 : .28 + rnd() * .1);
    o.position.set(x, y0 + h * .35, z); o.scale.set(1, h * .7, 1); o.rotation.set(0, 0, 0); o.updateMatrix(); tronco.setMatrixAt(i, o.matrix);
    for (let k = 0; k < 2; k++) {
      o.position.set(x + (rnd() - .5) * r * .5, y0 + h * (esbelto ? .55 + k * .22 : .68 + k * .16), z + (rnd() - .5) * r * .5);
      if (esbelto) o.scale.set(r * (1 - k * .3), h * (.32 - k * .08), r * (1 - k * .3)); else o.scale.set(r * (1 - k * .25), r * (.8 - k * .15), r * (1 - k * .25));
      const rx = rnd(), ry = rnd(), rz = rnd(); if (esbelto) o.rotation.set(0, ry * 6.28, 0); else o.rotation.set(rx, ry, rz); o.updateMatrix();
      copa.setMatrixAt(i * 2 + k, o.matrix); copa.setColorAt(i * 2 + k, c.setHSL(tono - .05 + rnd() * .08, .38 + rnd() * .15, .26 + rnd() * .1));
    }
  });
  g.add(tronco, copa); return g;
}

// Juncos y vegetación de borde de humedal (instanciados).
export function juncos(puntos) {
  const n = puntos.length, m = new T.InstancedMesh(new T.ConeGeometry(.35, 1, 5), new T.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }), n);
  const o = new T.Object3D(), c = new T.Color();
  puntos.forEach(([x, z, y0 = 0], i) => { const h = .8 + rnd() * 1.6; o.position.set(x, y0 + h / 2, z); o.scale.set(1 + rnd(), h, 1 + rnd()); o.rotation.set((rnd() - .5) * .2, rnd() * 6, (rnd() - .5) * .2); o.updateMatrix(); m.setMatrixAt(i, o.matrix); m.setColorAt(i, c.setHSL(.2 + rnd() * .07, .35 + rnd() * .2, .3 + rnd() * .12)); });
  return m;
}

// Pasarela de madera elevada sobre una polilínea [[x,z],...]
export function pasarela(pts, alturaEn, ancho = 3) {
  const g = new T.Group(), deck = mat('madera'), poste = mat('#4a3a2b'), baranda = mat('#6b543e');
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az), a = Math.atan2(bz - az, bx - ax);
    const y = typeof alturaEn === 'function' ? alturaEn((ax + bx) / 2, (az + bz) / 2) : alturaEn;
    const t = new T.Mesh(new T.BoxGeometry(L, .2, ancho), deck); t.position.set((ax + bx) / 2, y, (az + bz) / 2); t.rotation.y = -a; g.add(t);
    for (const s of [-1, 1]) { const r = new T.Mesh(new T.BoxGeometry(L, .08, .08), baranda); r.position.set((ax + bx) / 2 - Math.sin(a) * s * ancho / 2, y + 1, (az + bz) / 2 + Math.cos(a) * s * ancho / 2); r.rotation.y = -a; g.add(r); }
    for (let k = 0; k <= L; k += 6) { const px = ax + Math.cos(a) * k, pz = az + Math.sin(a) * k; const p = new T.Mesh(new T.CylinderGeometry(.12, .12, 1.6, 5), poste); p.position.set(px, y - .3, pz); g.add(p); }
  }
  return g;
}

// ================= Edificios que siguen la forma del lote =================
const areaS = P => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += (P[j][0] + P[i][0]) * (P[j][1] - P[i][1]); return a / 2; };
// Desplaza un polígono hacia adentro d metros (inglete limitado para no generar puntas en esquinas agudas).
export function desplazar(P, d) {
  const s = Math.sign(areaS(P)) || 1, n = P.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n];
    const n1 = norm(-(b[1] - a[1]), b[0] - a[0]), n2 = norm(-(c[1] - b[1]), c[0] - b[0]);
    // normal hacia el interior según la orientación
    const k = -s, m = norm(n1[0] + n2[0], n1[1] + n2[1]), cos = Math.max(.35, m[0] * n1[0] + m[1] * n1[1]);
    out.push([b[0] + k * m[0] * d / cos, b[1] + k * m[1] * d / cos]);
  }
  return Math.sign(areaS(out)) === s && Math.abs(areaS(out)) > 20 ? out : null;
}
const norm = (x, z) => { const L = Math.hypot(x, z) || 1; return [x / L, z / L]; };
// Recorta un polígono al semiplano (p - o)·n >= 0 (Sutherland–Hodgman).
function recortar(P, o, nrm) {
  const out = [], f = p => (p[0] - o[0]) * nrm[0] + (p[1] - o[1]) * nrm[1];
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], fa = f(a), fb = f(b);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
// Eje principal (dirección más larga) del polígono.
function eje(P) {
  let cx = 0, cz = 0; for (const p of P) { cx += p[0]; cz += p[1]; } cx /= P.length; cz /= P.length;
  let a = 0, b = 0, c = 0; for (const [x, z] of P) { a += (x - cx) ** 2; b += (z - cz) ** 2; c += (x - cx) * (z - cz); }
  const t = .5 * Math.atan2(2 * c, a - b); return { c: [cx, cz], u: [Math.cos(t), Math.sin(t)] };
}
// Divide un lote largo en tramos de `largo` m separados por pasajes de `pasaje` m; cada tramo conserva los bordes del lote.
export function tramos(P, largo = 46, pasaje = 9) {
  const { c, u } = eje(P); let t0 = 1e9, t1 = -1e9;
  for (const p of P) { const t = (p[0] - c[0]) * u[0] + (p[1] - c[1]) * u[1]; t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
  const L = t1 - t0, n = Math.max(1, Math.round((L + pasaje) / (largo + pasaje))), seg = (L - pasaje * (n - 1)) / n, out = [];
  for (let i = 0; i < n; i++) {
    const a = t0 + i * (seg + pasaje), b = a + seg;
    let Q = recortar(P, [c[0] + u[0] * a, c[1] + u[1] * a], u); Q = recortar(Q, [c[0] + u[0] * b, c[1] + u[1] * b], [-u[0], -u[1]]);
    if (Q.length >= 3 && Math.abs(areaS(Q)) > 60) out.push(Q);
  }
  return out;
}
// Muros de un polígono con UV en vanos × pisos (cara a cara).
export function murosPoligono(P, h, vano, piso, y = 0) {
  const p = [], uv = [], idx = [];
  for (let i = 0; i < P.length; i++) {
    const [ax, az] = P[i], [bx, bz] = P[(i + 1) % P.length], L = Math.hypot(bx - ax, bz - az), k = p.length / 3;
    p.push(ax, y, az, bx, y, bz, bx, y + h, bz, ax, y + h, az); uv.push(0, 0, L / vano, 0, L / vano, h / piso, 0, h / piso); idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function forma(P, hueco) {
  const s = new T.Shape(P.map(([x, z]) => new T.Vector2(x, -z)));
  if (hueco) s.holes.push(new T.Path(hueco.map(([x, z]) => new T.Vector2(x, -z))));
  return s;
}
// Losa o cubierta horizontal con la forma del lote (y hueco opcional).
export function losa(P, y, grosor, material, hueco, escala = 6) {
  const g = new T.ExtrudeGeometry(forma(P, hueco), { depth: grosor, bevelEnabled: false }); g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / escala, pos.getZ(i) / escala);
  const m = new T.Mesh(g, material); m.position.y = y; return m;
}
// Edificio con la forma exacta del tramo: primer piso comercial, pisos de vivienda, losas, patio y cubierta.
export function edificioPoligono(P, o) {
  const g = new T.Group(), piso = o.piso || 2.9, vano = o.vano || 3.6, pb = o.primerPiso ?? 4.2;
  const A = Math.abs(areaS(P)), hueco = o.patio && A > 1400 ? desplazar(P, o.patio) : null;
  const ds = { side: T.DoubleSide };
  let y = 0;
  if (pb) {   // comercio cotidiano en primer piso, un poco retrocedido
    const pr = desplazar(P, 1.2) || P;
    g.add(new T.Mesh(murosPoligono(pr, pb, 4.5, pb), mat('vidrio', ds)));
    if (hueco) g.add(new T.Mesh(murosPoligono(hueco, pb, 4.5, pb), mat('vidrio', ds)));
    y = pb; g.add(losa(P, y - .3, .3, mat('#e7e0d4'), hueco));
  }
  const h = o.pisos * piso;
  g.add(new T.Mesh(murosPoligono(P, h, vano, piso, y), mat(o.fachada, ds)));
  if (hueco) g.add(new T.Mesh(murosPoligono(hueco, h, vano, piso, y), mat(o.fachada === 'balcon' ? 'ladrillo' : 'balcon', ds)));
  const sal = desplazar(P, -.35) || P;   // losas que sobresalen y marcan cada piso
  for (let i = 1; i < o.pisos; i++) g.add(losa(sal, y + i * piso - .14, .26, mat('#e7e0d4'), hueco));
  y += h;
  g.add(losa(P, y, .25, o.cubierta === 'verde' ? mat('techoVerde') : mat('#8f8a80'), hueco));
  g.add(new T.Mesh(murosPoligono(P, 1.1, 4, 1.1, y), mat('#d7cfc3', ds)));      // antepecho
  if (o.cubierta === 'pv') { const c = eje(P).c, pv = paneles(Math.min(20, Math.sqrt(A) * .5), 8, y + .6); pv.position.set(c[0], 0, c[1]); g.add(pv); }
  if (hueco) {    // patio interior arborizado
    const cP = eje(hueco).c; g.add(losa(hueco, .02, .1, mat('pasto')));
    g.add(arboles([[cP[0], cP[1], .1], [cP[0] + 4, cP[1] + 3, .1], [cP[0] - 4, cP[1] - 3, .1]], { alto: [5, 8] }));
  }
  g.userData.altura = y; return g;
}

// Puntos aleatorios dentro de un polígono [[x,z]...]
export function puntosEn(pol, n, margen = 0) {
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pol) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  const out = []; let guard = 0;
  while (out.length < n && guard++ < n * 40) { const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0); if (dentro(pol, x, z) && distBorde(pol, x, z) >= margen) out.push([x, z]); }
  return out;
}
export function dentro(pol, x, z) { let ins = false; for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) { const [ax, az] = pol[i], [bx, bz] = pol[j]; if ((az > z) !== (bz > z) && x < (bx - ax) * (z - az) / (bz - az) + ax) ins = !ins; } return ins; }
export function distBorde(pol, x, z) { let d = 1e9; for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) { const [ax, az] = pol[j], [bx, bz] = pol[i], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1; let t = ((x - ax) * dx + (z - az) * dz) / L2; t = Math.max(0, Math.min(1, t)); d = Math.min(d, Math.hypot(x - ax - t * dx, z - az - t * dz)); } return d; }
export function area(pol) { let a = 0; for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) a += (pol[j][0] + pol[i][0]) * (pol[j][1] - pol[i][1]); return Math.abs(a / 2); }
// Contorno orgánico: subdivide y desplaza suavemente un polígono (para orillas de agua).
export function organico(pol, amp = 8, pasos = 6) {
  const out = [];
  for (let i = 0; i < pol.length; i++) {
    const [ax, az] = pol[i], [bx, bz] = pol[(i + 1) % pol.length], L = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / (L || 1), nz = (bx - ax) / (L || 1);
    for (let k = 0; k < pasos; k++) { const t = k / pasos, s = Math.sin(t * Math.PI) * (Math.sin(i * 3.1 + k * 1.7) * amp); out.push([ax + (bx - ax) * t + nx * s, az + (bz - az) * t + nz * s]); }
  }
  return out;
}
