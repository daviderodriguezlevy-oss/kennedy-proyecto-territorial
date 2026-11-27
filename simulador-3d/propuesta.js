// MODELO ESTÁTICO DE LA PROPUESTA (para ver, corregir y luego llevar a la simulación).
// Solo representa: no cambia agentes, reglas ni indicadores.
//
// Ubicaciones elegidas sobre suelo que hoy NO tiene vivienda (análisis de ocupación con la geometría
// del modelo: edificios, calzadas, andenes, agua y parques):
//  · Predio de Corabastos: ~380.000 m², con ~94.000 m² de bodegas y ~286.000 m² de patios y parqueaderos.
//    Al concentrar el mercado en altura se libera la mayor parte de ese suelo.
//  · Lote libre al oriente de María Paz (cerca del punto M del proyecto) para el mercado de proximidad.
// Sistema de ejes local: U a lo largo de las bodegas (rumbo 32°), V perpendicular; en metros.
import * as T from 'three';
import { edificio, muros, plano, poligono, mat, arboles, juncos, pasarela, puntosEn, dentro, area, organico, paneles, edificioPoligono, desplazar, tramos } from './arquitectura.js?v=3';

const ANG = 32 * Math.PI / 180, CS = Math.cos(ANG), SN = Math.sin(ANG);
const km = ([u, v]) => [u * 1000, v * 1000];
// Contorno del predio de Corabastos (u,v en km, del análisis de ocupación).
const PREDIO = [[-1.013, 1.622], [-1.024, 1.582], [-0.886, 1.439], [-0.718, 1.278], [-0.53, 1.307], [-0.178, 1.365], [-0.151, 1.372], [-0.124, 1.393], [-0.286, 1.819], [-0.392, 1.952], [-0.685, 1.951], [-0.733, 1.919]].map(km);
// Ampliación del humedal: franja occidental del predio, contigua al agua actual de La Vaca.
const HUMEDAL = [[-1.013, 1.622], [-0.886, 1.439], [-0.80, 1.405], [-0.735, 1.47], [-0.705, 1.62], [-0.672, 1.80], [-0.64, 1.95], [-0.733, 1.919], [-0.86, 1.80], [-0.95, 1.70]].map(km);

// VARIABLES DE LA PROPUESTA (se eligen en «Condiciones de partida»; anos.js las copia aquí antes de construir).
//  pisosViv: pisos de las manzanas renovadas de María Paz (prevista: 6, alternando 6 y 5)
//  nivelesMercado: niveles de nave del mercado vertical sobre el zócalo de 2 (prevista: 4 → 6 pisos)
//  humedalEsc: tamaño de la ampliación del humedal (1 = prevista; se escala desde el borde del agua actual)
//  vegCant: cantidad de árboles nuevos (1 = prevista) · vegTipo: 'nativa' | 'mixta' | 'ornamental'
//  nodos: 4 (N, M, R, P) | 2 (solo distribución N y M) | 0 (todo en el mercado vertical)
export const OPC = { pisosViv: 6, nivelesMercado: 4, humedalEsc: 1, vegCant: 1, vegTipo: 'nativa', nodos: 4 };

export function createProposal({ scene, ground, opc = OPC }) {
  const vc = opc.vegCant, nm = opc.nivelesMercado, pv = opc.pisosViv;
  // Humedal escalado desde el borde occidental (donde está el agua actual de La Vaca) y recortado al predio.
  const A0 = [-960, 1620], escH = ([u, v]) => [A0[0] + (u - A0[0]) * opc.humedalEsc, A0[1] + (v - A0[1]) * opc.humedalEsc];
  const HUM = recorteConvexo(HUMEDAL.map(escH), PREDIO);
  // Árboles nuevos según el tipo: nativos (copa ancha) u ornamentales de rápido crecimiento (altos y esbeltos).
  const ORN = { alto: [14, 24], tono: .24, esbelto: true };
  const bosque = (pts, base = {}) => {
    if (opc.vegTipo === 'ornamental') return arboles(pts, ORN);
    if (opc.vegTipo !== 'mixta') return arboles(pts, base);
    const g = new T.Group(), a = arboles(pts.filter((_, i) => i % 2), base), b = arboles(pts.filter((_, i) => !(i % 2)), ORN); g.add(...a.children, ...b.children); return g;
  };
  const toWorld = (U, V) => [(U * CS - V * SN) / 1000, (U * SN + V * CS) / 1000];
  const gy = (U, V) => { const [x, z] = toWorld(U, V); return ground(x, z) * 1000; };

  // Superficie que sigue el terreno (el predio tiene ~8 m de pendiente): malla de 10 m recortada al polígono.
  const terreno = (pol, escala, off = .15, paso = 8) => {
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [u, v] of pol) { u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    const nu = Math.ceil((u1 - u0) / paso), nv = Math.ceil((v1 - v0) / paso), pos = [], uv = [], idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const U = u0 + i * paso, V = v0 + j * paso; pos.push(U, gy(U, V) + off, V); uv.push(U / escala, V / escala); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1, cu = u0 + (i + .5) * paso, cv = v0 + (j + .5) * paso;
      if (dentro(pol, cu, cv)) idx.push(a, c, b, b, c, d);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  };
  const maxSuelo = pol => { let m = -1e9; for (const [U, V] of puntosEn(pol, 120)) m = Math.max(m, gy(U, V)); return m; };
  const minSuelo = pol => { let m = 1e9; for (const [U, V] of [...pol, ...puntosEn(pol, 120)]) m = Math.min(m, gy(U, V)); return m; };

  const raiz = new T.Group(); raiz.visible = false; raiz.name = 'propuesta'; scene.add(raiz);
  const sitio = new T.Group(); sitio.scale.setScalar(.001); sitio.rotation.y = -ANG; raiz.add(sitio);
  const y0 = gy(-500, 1600);                  // nivel del predio (prácticamente plano)
  const add = (obj, U, V, y = y0, rot = 0) => { obj.position.set(U, y, V); obj.rotation.y = rot; sitio.add(obj); return obj; };
  const pins = [];
  const pin = (titulo, texto, U, V, h) => { const [x, z] = toWorld(U, V); pins.push({ titulo, texto, x, z, y: (gy(U, V) + h) / 1000 }); };
  // Registro de piezas para la animación de obra: qué objetos la forman, su polígono (escena) y su altura.
  const piezas = [], uvMundo = pol => pol.map(([U, V]) => toWorld(U, V));
  const reg = (id, nombre, tipo, poly, objs, H = 0, extra = {}) => piezas.push({ id, nombre, tipo, poly, objs, H, ...extra });

  // ---- Suelo base del predio: pasto, con plazas y caminos encima ----
  reg('predio-suelo', 'Suelo verde del predio', 'suelo', uvMundo(PREDIO), [add(new T.Mesh(terreno(PREDIO, 6, .12), mat('pasto')), 0, 0, 0)]);
  // Arborización perimetral del predio (alameda de borde), hacia adentro del límite.
  {
    const cu = PREDIO.reduce((s, p) => s + p[0], 0) / PREDIO.length, cv = PREDIO.reduce((s, p) => s + p[1], 0) / PREDIO.length, pts = [];
    for (let i = 0; i < PREDIO.length; i++) {
      const [a, b] = [PREDIO[i], PREDIO[(i + 1) % PREDIO.length]], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      for (let s = 6; s < L - 6; s += 13 / vc ** .7) { const t = s / L, U = a[0] + (b[0] - a[0]) * t, V = a[1] + (b[1] - a[1]) * t, k = 9 / Math.hypot(cu - U, cv - V); const UU = U + (cu - U) * k, VV = V + (cv - V) * k; if (!dentro(HUM, UU, VV)) pts.push([UU, VV, gy(UU, VV)]); }
    }
    const alameda = bosque(pts, { alto: [8, 14], tono: .3 }); sitio.add(alameda); reg('alameda', 'Alameda perimetral', 'veg', uvMundo(PREDIO), [alameda]);
  }

  // ---- 1. Mercado vertical de Corabastos (recepción, conservación y venta) ----
  const MU = -370, MV = 1650;
  const mercado = new T.Group();
  // Zócalo logístico: 2 niveles de 5 m con muelles de carga en la cara oriental.
  const zW = 270, zD = 180, zH = 10;
  const zocalo = new T.Mesh(muros(zW, zD, zH, 6, 5), mat('celosia')); mercado.add(zocalo);
  const muelles = new T.Mesh(new T.PlaneGeometry(zW * .8, zH * .8), mat('muelle')); muelles.material = muelles.material.clone(); muelles.material.map = muelles.material.map.clone(); muelles.material.map.repeat.set(14, 1); muelles.material.map.needsUpdate = true;
  muelles.position.set(0, zH * .4, zD / 2 + .05); mercado.add(muelles);   // muelles en la cara sur, hacia el patio
  const techoZ = new T.Mesh(plano(zW, zD, 8), mat('techoVerde')); techoZ.position.y = zH + .02; mercado.add(techoZ);
  // Tres naves de mercado sobre el zócalo, 4 niveles de 5 m (6 pisos en total), con cubierta en diente de sierra y lucernarios.
  const NH = nm * 5;
  for (const dv of [-62, 0, 62]) {
    const nave = new T.Mesh(muros(250, 44, NH, 5, 5), mat('vidrio', { roughness: .25, metalness: .3 })); nave.position.set(0, zH, dv); mercado.add(nave);
    for (let i = 1; i <= nm; i++) { const l = new T.Mesh(new T.BoxGeometry(251, .35, 45), mat('#e8e2d6')); l.position.set(0, zH + i * 5 - .17, dv); mercado.add(l); }
    const sierra = new T.Shape([new T.Vector2(-22, 0), new T.Vector2(22, 0), new T.Vector2(22, 1.5), new T.Vector2(-22, 7)].map(p => p));
    const diente = new T.ExtrudeGeometry(sierra, { depth: 12, bevelEnabled: false });
    for (let k = -120; k < 120; k += 13) {
      const d = new T.Mesh(diente, mat('#d9d4c9')); d.rotation.y = Math.PI / 2; d.position.set(k, zH + NH, dv); mercado.add(d);
      // Lucernario vertical del diente (luz norte para la nave).
      const vid = new T.Mesh(new T.PlaneGeometry(12, 5.5), mat('#9fc3cf', { roughness: .1, metalness: .2, transparent: true, opacity: .85, side: T.DoubleSide }));
      vid.position.set(k + 6, zH + NH + 2.75 + .7, dv + 22); mercado.add(vid);
    }
  }
  // Patios interiores con árboles sobre el zócalo, entre naves.
  mercado.add(arboles([...Array(18)].map((_, i) => [-110 + i * 13, (i % 2 ? 31 : -31), zH])));
  // Núcleos de circulación vertical (escaleras y montacargas), más altos que las naves.
  for (const [cu, cv] of [[-130, -92], [130, -92], [-130, 92], [130, 92], [0, 92]]) {
    const n = edificio({ w: 14, d: 14, pisos: Math.ceil((zH + NH) / 4.4) + 1, piso: 4.4, vano: 3.5, fachada: 'celosia', cubierta: 'plana' }); n.position.set(cu, 0, cv); mercado.add(n);
  }
  // Rampa de camiones al nivel superior del zócalo (cara sur).
  const rampa = new T.Mesh(new T.BoxGeometry(70, .6, 12), mat('asfalto')); rampa.position.set(70, zH / 2, zD / 2 + 8); rampa.rotation.z = Math.atan2(zH, 70); mercado.add(rampa);
  // Paneles solares sobre las cubiertas de los núcleos y el borde del zócalo.
  mercado.add(paneles(240, 14, zH + .4).translateZ(-zD / 2 + 9));
  // Base: el edificio se apoya en el punto más alto de su huella y un zócalo de piedra cubre la pendiente.
  const yM = minSuelo([[MU - 135, MV - 90], [MU + 135, MV - 90], [MU + 135, MV + 90], [MU - 135, MV + 90]]);
  const base = new T.Mesh(new T.BoxGeometry(zW + 1, 10, zD + 1), mat('#b9b1a3')); base.position.y = -5; mercado.add(base);
  add(mercado, MU, MV, yM);
  reg('mercado', 'Mercado vertical de Corabastos', 'edificio', uvMundo([[MU - 140, MV - 95], [MU + 140, MV - 95], [MU + 140, MV + 95], [MU - 140, MV + 95]]), [mercado], zH + NH + 6);
  pin('Mercado vertical de Corabastos', `${nm + 2} pisos: un zócalo logístico de 2 niveles (muelles, cuartos fríos, acopio) y encima tres naves de mercado de ${nm} niveles (recepción, conservación y venta), unos ${zH + NH} m de altura y núcleos de circulación más altos. Ocupa ~49.000 m² de suelo frente a los ~380.000 m² del predio actual. Va al oriente porque ahí están la glorieta y las avenidas: los camiones entran y salen sin cruzar barrios ni el humedal.`, MU, MV, zH + NH + 15);

  // ---- 2. Patio de camiones y muelles (P05) ----
  // Dentro del predio, al sur del mercado (frente a sus muelles) y siguiendo el borde del predio: no toca la vía.
  const PATIO = [[-495, 1752], [-276, 1752], [-292, 1812], [-346, 1882], [-495, 1882]], nPatio = sitio.children.length;
  add(new T.Mesh(terreno(PATIO, 14, .15, 6), mat('asfalto')), 0, 0, 0);
  const patio = new T.Group();
  for (let U = -470; U <= -310; U += 32) {          // marquesinas frente a los muelles
    const y = gy(U, 1770), cub = new T.Mesh(new T.BoxGeometry(26, .4, 18), mat('#c8c2b6')); cub.position.set(U, y + 7, 1772); patio.add(cub);
    for (const [a, b] of [[-11, -7], [11, -7], [-11, 7], [11, 7]]) { const c = new T.Mesh(new T.CylinderGeometry(.25, .25, 7, 6), mat('#6d6a64')); c.position.set(U + a, y + 3.5, 1772 + b); patio.add(c); }
  }
  const camion = (U, V, rot) => { const t = new T.Group(); const caja = new T.Mesh(new T.BoxGeometry(12, 3.6, 2.5), mat('#e8e4da')); caja.position.y = 2.3; t.add(caja); const cab = new T.Mesh(new T.BoxGeometry(2.6, 3, 2.4), mat('#b4473a')); cab.position.set(7.4, 2, 0); t.add(cab); t.position.set(U, gy(U, V), V); t.rotation.y = rot; return t; };
  for (let U = -480; U <= -320; U += 8) patio.add(camion(U, 1772, Math.PI / 2));                 // en los muelles
  for (let U = -470; U <= -370; U += 6.5) patio.add(camion(U, 1840, Math.PI / 2));               // esperando adentro, no en la calle
  sitio.add(patio); reg('patio', 'Patio de camiones', 'suelo', uvMundo(PATIO), sitio.children.slice(nPatio));
  pin('Patio de camiones y muelles', 'Dentro del predio, al sur del mercado y frente a sus muelles. La espera de camiones ocurre adentro, no en las calles ni en la avenida. Entrada y salida por la avenida sur.', -400, 1810, 10);
  // ---- 3. Ampliación del humedal La Vaca ----
  const hum = new T.Group(), nHum = sitio.children.length;
  const orilla = recorteConvexo(organico(HUM, 10, 7), PREDIO);   // la orilla ondulada nunca sale del predio
  hum.add(new T.Mesh(terreno(orilla, 6, .26, 3), mat('#58703c', { roughness: 1 })));     // pradera húmeda
  // Espejos de agua escalonados (no todo es agua: hay zonas de pantano y orillas suaves). Se escalan con el humedal.
  const lag1 = recorteConvexo(organico([[-930, 1660], [-860, 1520], [-780, 1500], [-760, 1600], [-800, 1700], [-880, 1720]].map(escH), 9, 8), PREDIO);
  const lag2 = recorteConvexo(organico([[-760, 1700], [-715, 1680], [-690, 1800], [-680, 1900], [-730, 1880], [-770, 1790]].map(escH), 7, 8), PREDIO);
  const agua = mat('#2f6a6c', { roughness: .08, metalness: .35, transparent: true, opacity: .92 });
  for (const l of [lag1, lag2]) { const m = new T.Mesh(terreno(l, 10, .4, 2.5), agua); hum.add(m); }
  // Juncos en las orillas de las lagunas y bosque de borde en el perímetro.
  const enOrilla = l => puntosEn(organico(l, 16, 6), 900).filter(([x, z]) => !dentro(l, x, z));
  hum.add(juncos([...enOrilla(lag1), ...enOrilla(lag2)].map(([x, z]) => [x, z, gy(x, z) + .2])));
  const areaHum = Math.max(.2, Math.abs(area(HUM)) / Math.abs(area(HUMEDAL)));
  hum.add(bosque(puntosEn(orilla, Math.round(260 * vc * areaHum)).filter(([x, z]) => !dentro(lag1, x, z) && !dentro(lag2, x, z) && Math.min(...[lag1, lag2].map(l => dist(l, x, z))) > 18).map(([x, z]) => [x, z, gy(x, z)]), { alto: [6, 15], tono: .28 }));
  // Islas con árboles (refugio de aves) y pasarela elevada con mirador.
  hum.add(arboles([[-860, 1600], [-850, 1610], [-845, 1595], [-735, 1790], [-728, 1802]].map(escH).filter(([x, z]) => dentro(orilla, x, z)).map(([x, z]) => [x, z, gy(x, z)]), { alto: [8, 12] }));
  hum.add(pasarela([[-760, 1450], [-790, 1530], [-770, 1620], [-745, 1700], [-720, 1780], [-700, 1880]].map(escH).filter(([x, z]) => dentro(PREDIO, x, z)), (x, z) => gy(x, z) + 1.2, 3));
  const mirador = new T.Group(); const fuste = new T.Mesh(new T.BoxGeometry(6, 12, 6), mat('madera')); fuste.position.y = 6; mirador.add(fuste);
  const top = new T.Mesh(new T.BoxGeometry(9, .4, 9), mat('#6b543e')); top.position.y = 12; mirador.add(top);
  const tech = new T.Mesh(new T.ConeGeometry(7, 3, 4), mat('#4a3a2b')); tech.position.y = 15; tech.rotation.y = Math.PI / 4; mirador.add(tech);
  const [mU, mV] = escH([-770, 1620]); mirador.position.set(mU, gy(mU, mV), mV); hum.add(mirador);
  add(hum, 0, 0, 0); reg('humedal', 'Ampliación del humedal La Vaca', 'veg', uvMundo(HUM), sitio.children.slice(nHum));
  pin('Ampliación del humedal La Vaca', `Unos ${Math.round(Math.abs(area(HUM)) / 10000)} ha nuevas contiguas al agua actual, sobre patios y bodegas que se desmontan. Lagunas poco profundas, pantano con juncos, islas-refugio para aves y bosque de borde. Una pasarela elevada y un mirador permiten recorrerlo sin entrar a las zonas de refugio.`, -800, 1620, 16);

  // ---- 4. Parque de Corabastos: une el barrio con el humedal ----
  // Ocupa todo el borde norte del predio (frente a María Paz) y la franja entre el mercado y el humedal.
  const parque = [[-718, 1292], [-530, 1320], [-178, 1378], [-205, 1540], [-560, 1545], [-700, 1700], [-725, 1500]], nParque = sitio.children.length;
  add(new T.Mesh(terreno(parque, 6, .2), mat('pasto')), 0, 0, 0);
  const camino = []; for (let U = -700; U <= -210; U += 10) camino.push([U, 1440 + Math.sin(U / 45) * 22]);
  for (let i = 1; i < camino.length; i++) { const [a, b] = [camino[i - 1], camino[i]], L = Math.hypot(b[0] - a[0], b[1] - a[1]); const s = new T.Mesh(new T.BoxGeometry(L + .5, .1, 4.5), mat('adoquin')); s.position.set((a[0] + b[0]) / 2, gy((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) + .3, (a[1] + b[1]) / 2); s.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); sitio.add(s); }
  const plaza = new T.Mesh(new T.CylinderGeometry(30, 30, .3, 40), mat('adoquin')); plaza.position.set(-450, gy(-450, 1440) + .25, 1440); sitio.add(plaza);
  const fuente = new T.Mesh(new T.CylinderGeometry(7, 7, .5, 32), agua); fuente.position.set(-450, gy(-450, 1440) + .5, 1440); sitio.add(fuente);
  sitio.add(bosque(puntosEn(parque, Math.round(260 * vc)).filter(([U, V]) => Math.abs(V - (1440 + Math.sin(U / 45) * 22)) > 6 && Math.hypot(U + 450, V - 1440) > 34).map(([U, V]) => [U, V, gy(U, V)]), { alto: [7, 16], tono: .29 }));
  const juego = new T.Group(); for (let i = 0; i < 4; i++) { const p = new T.Mesh(new T.BoxGeometry(3, 2.5 + i, 3), mat(['#d9483b', '#f2b134', '#3d8bd9', '#58b368'][i])); p.position.set(i * 4, 1.25 + i / 2, 0); juego.add(p); }
  juego.position.set(-300, gy(-300, 1420), 1420); sitio.add(juego); reg('parque', 'Parque de Corabastos', 'veg', uvMundo(parque), sitio.children.slice(nParque));
  pin('Parque de Corabastos', `Unos ${(area(parque) / 10000).toFixed(1).replace('.', ',')} ha de parque sobre el suelo liberado: plaza con fuente, juegos y un camino que va del barrio María Paz al humedal. Abre el borde del mercado al barrio en vez de cerrarlo con muros.`, -450, 1440, 6);

  // ======== Piezas repartidas por el territorio (ejes del mundo, en metros) ========
  const mundo = new T.Group(); mundo.scale.setScalar(.001); raiz.add(mundo);
  const gw = (x, z) => ground(x / 1000, z / 1000) * 1000;
  const M = pol => pol.map(([x, z]) => [x * 1000, z * 1000]);
  // Suelo que sigue el terreno, en ejes del mundo.
  const suelo = (pol, material, off = .15, escala = 6) => {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pol) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    const paso = 5, nx = Math.ceil((x1 - x0) / paso), nz = Math.ceil((z1 - z0) / paso), pos = [], uv = [], idx = [];
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const x = x0 + i * paso, z = z0 + j * paso; pos.push(x, gw(x, z) + off, z); uv.push(x / escala, z / escala); }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; if (dentro(pol, x0 + (i + .5) * paso, z0 + (j + .5) * paso)) idx.push(a, c, b, b, c, d); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new T.Mesh(g, material); mundo.add(m); return m;
  };
  const centro = pol => [pol.reduce((s, p) => s + p[0], 0) / pol.length, pol.reduce((s, p) => s + p[1], 0) / pol.length];
  const pinMundo = (titulo, texto, pol, h) => { const [x, z] = centro(pol); pins.push({ titulo, texto, x: x / 1000, z: z / 1000, y: (gw(x, z) + h) / 1000 }); };
  // Edificio que sigue la forma del lote: se apoya en el punto más alto de su huella y se divide en tramos con pasajes.
  const construir = (pol, o, retiro = 3, dividir = true) => {
    const P = desplazar(pol, retiro) || pol;
    for (const tramo of dividir ? tramos(P, o.largo || 46, o.pasaje || 9) : [P]) {
      let y = 1e9; for (const [x, z] of tramo) y = Math.min(y, gw(x, z)); const [cx, cz] = centro(tramo); y = Math.min(y, gw(cx, cz));
      const e = edificioPoligono(tramo, o); e.position.y = y; mundo.add(e);
    }
    suelo(pol, mat('adoquin'), .1, 4);   // andén y plazoleta alrededor
  };
  const masks = [];

  // ---- 5. Manzanas de María Paz que se renuevan (máximo 6 pisos) ----
  // Solo algunas manzanas, repartidas: se reemplazan casas de 2–3 pisos por edificios de hasta 6 pisos que
  // siguen la forma de la manzana, con comercio cotidiano en primer piso, pasajes y patios.
  let k = 0;
  for (const [id, pol] of Object.entries(MARIA_PAZ.vivienda)) {
    const P = M(pol); masks.push(pol); const m0 = mundo.children.length, pisos = k % 3 === 0 ? pv : pv - 1;
    construir(P, { pisos, piso: 2.9, fachada: k % 2 ? 'ladrillo' : 'balcon', cubierta: k % 2 ? 'pv' : 'verde', patio: 11, largo: 42 + (k % 3) * 6 });
    reg('mp-' + id, 'Manzana ' + id + ' · vivienda', 'edificio', pol, mundo.children.slice(m0), pisos * 2.9 + 4.2, { grupo: 'mp', ola: k % 2 });
    k++;
  }
  {
    const [x, z] = centro(M(MARIA_PAZ.vivienda[718]));
    pins.push({ titulo: 'Renovación de manzanas en María Paz', texto: `Ocho manzanas repartidas en el barrio (no todo el barrio) cambian casas de 2–3 pisos por edificios de máximo ${pv} pisos con la forma exacta de cada manzana: comercio cotidiano en el primer piso, pasajes peatonales cada ~45 m y patios interiores. Con más viviendas en menos huella, otras manzanas quedan libres para parques.`, x: x / 1000, z: z / 1000, y: (gw(x, z) + pv * 2.9 + 7) / 1000 });
  }
  // ---- 6. Manzanas que se vuelven parque ----
  for (const [id, pol] of Object.entries(MARIA_PAZ.parque)) {
    const P = M(pol); masks.push(pol); const m0 = mundo.children.length;
    const plazaTri = P.length <= 4 || Math.abs(area(P)) < 2000;   // triángulos y cuñas: plazoleta dura con árboles
    suelo(P, plazaTri ? mat('adoquin') : mat('pasto'), .15, plazaTri ? 4 : 6);
    const dentroP = puntosEn(desplazar(P, 3) || P, Math.max(3, Math.round(Math.abs(area(P)) / 140 * vc)));
    mundo.add(bosque(dentroP.map(([x, z]) => [x, z, gw(x, z)]), { alto: [6, 13], tono: .3 }));
    if (!plazaTri) {   // sendero a lo largo de la manzana y juegos
      const c = centro(P); const j = new T.Group(); for (let i = 0; i < 3; i++) { const b = new T.Mesh(new T.BoxGeometry(2.5, 2 + i, 2.5), mat(['#d9483b', '#f2b134', '#3d8bd9'][i])); b.position.set(i * 3.2, 1 + i / 2, 0); j.add(b); }
      j.position.set(c[0], gw(c[0], c[1]), c[1]); mundo.add(j);
    }
    reg('pq-' + id, 'Manzana ' + id + ' · parque', 'veg', pol, mundo.children.slice(m0), 0, { grupo: 'mp', ola: +id % 2 });
  }
  pinMundo('Parques en manzanas liberadas', 'Cinco manzanas se vuelven espacio público: la 557 amplía el parque que ya existe en María Paz; las triangulares y en cuña (836, 792, 680) se vuelven plazoletas arborizadas en los cruces; la 826 es un parque largo en el centro del sector. Las casas que se demuelen se reponen en las manzanas renovadas.', M(MARIA_PAZ.parque[557]), 10);

  // ---- 7. Corabastos repartido: nodos de distribución, recuperación y producción en lotes libres ----
  for (const [clave, d] of Object.entries(NODOS).filter(([c]) => opc.nodos >= 4 || (opc.nodos >= 2 && 'NM'.includes(c)))) {
    const P = M(d.lote); masks.push(d.lote); const m0 = mundo.children.length;
    construir(P, { ...d.edificio, piso: d.edificio.piso || 4.2, primerPiso: 5, patio: 0, largo: d.edificio.largo || 60, pasaje: d.edificio.pasaje || 10 }, 4, d.dividir ?? true);
    if (d.extra) d.extra({ P, mundo, gw, centro, suelo });
    pinMundo(d.titulo, d.texto, P, d.edificio.pisos * 4.2 + 8);
    reg('nodo-' + clave, d.titulo, 'edificio', d.lote, mundo.children.slice(m0), d.edificio.pisos * 4.2 + 5, { grupo: 'nodo' });
  }

  // Áreas a "desmontar" en la vista de propuesta: predio de Corabastos, manzanas renovadas o liberadas y lotes de nodos.
  const predioMundo = PREDIO.map(([U, V]) => toWorld(U, V));
  return { group: raiz, pins, piezas, predio: predioMundo, mercadoZona: uvMundo(recorteConvexo([[MU - 150, MV - 100], [MU + 150, MV - 100], [MU + 150, MV + 100], [-276, 1752], [-292, 1812], [-346, 1882], [-495, 1882], [MU - 150, MV + 100]], PREDIO)), masks: [predioMundo, ...masks], areas: { predio: area(PREDIO), humedal: Math.abs(area(HUM)), parque: area(parque) } };
}

// ---------- Datos de lotes (coordenadas de escena, del análisis de ocupación de la cartografía) ----------
const MARIA_PAZ = {
  vivienda: {
    400: [[-0.777, 0.469], [-0.779, 0.477], [-0.775, 0.491], [-0.771, 0.493], [-0.659, 0.465], [-0.659, 0.441], [-0.663, 0.441]],
    465: [[-0.871, 0.493], [-0.845, 0.593], [-0.843, 0.597], [-0.833, 0.597], [-0.831, 0.593], [-0.821, 0.591], [-0.821, 0.587], [-0.849, 0.487]],
    503: [[-1.181, 0.537], [-1.159, 0.555], [-1.129, 0.549], [-1.059, 0.531], [-1.065, 0.509], [-1.069, 0.509]],
    675: [[-0.809, 0.601], [-0.809, 0.605], [-0.787, 0.687], [-0.767, 0.687], [-0.763, 0.685], [-0.763, 0.681], [-0.785, 0.599], [-0.793, 0.597]],
    718: [[-1.035, 0.657], [-1.015, 0.675], [-1.009, 0.675], [-0.879, 0.643], [-0.877, 0.637], [-0.881, 0.621], [-0.887, 0.619]],
    746: [[-1.185, 0.765], [-1.169, 0.781], [-1.163, 0.783], [-1.157, 0.777], [-1.059, 0.661], [-1.057, 0.655], [-1.071, 0.643], [-1.075, 0.643]],
    770: [[-0.755, 0.691], [-0.747, 0.721], [-0.743, 0.725], [-0.745, 0.729], [-0.729, 0.789], [-0.727, 0.795], [-0.723, 0.795], [-0.703, 0.789], [-0.729, 0.693], [-0.731, 0.689], [-0.739, 0.689]],
    785: [[-0.945, 0.731], [-0.923, 0.749], [-0.857, 0.733], [-0.853, 0.731], [-0.853, 0.727], [-0.857, 0.711], [-0.861, 0.709]]
  },
  parque: {
    557: [[-0.945, 0.543], [-0.945, 0.551], [-0.929, 0.615], [-0.923, 0.617], [-0.907, 0.613], [-0.905, 0.609], [-0.923, 0.539], [-0.931, 0.539]],
    680: [[-1.093, 0.611], [-1.071, 0.629], [-1.049, 0.625], [-1.035, 0.621], [-1.041, 0.599], [-1.049, 0.599]],
    792: [[-0.695, 0.785], [-0.693, 0.721], [-0.715, 0.721]],
    826: [[-1.045, 0.885], [-1.033, 0.895], [-1.025, 0.899], [-0.919, 0.773], [-0.935, 0.757]],
    836: [[-0.887, 0.779], [-0.849, 0.811], [-0.837, 0.827], [-0.833, 0.827], [-0.827, 0.823], [-0.841, 0.773], [-0.843, 0.769], [-0.847, 0.769]]
  }
};
const NODOS = {
  N: { titulo: 'Nodo de distribución norte (N)', lote: [[-1.357, 0.627], [-1.299, 0.679], [-1.273, 0.667], [-1.265, 0.640], [-1.247, 0.623], [-1.301, 0.575]],
    edificio: { pisos: 2, fachada: 'ladrillo', cubierta: 'verde' }, dividir: false,
    texto: 'Lote sin construcción (~4.400 m²) junto a la avenida, al noroccidente de María Paz. Recibe parte de la carga que hoy llega toda a Corabastos y la reparte en el norte del sector. El edificio sigue la forma irregular del lote. Verificar en campo su uso actual.' },
  M: { titulo: 'Mercado de proximidad (nodo M)', lote: [[-0.855, 0.919], [-0.791, 0.977], [-0.763, 0.969], [-0.791, 0.901], [-0.821, 0.925], [-0.855, 0.895]],
    edificio: { pisos: 2, fachada: 'balcon', cubierta: 'verde' }, dividir: false,
    texto: 'Lote sin construcción (~3.600 m²) al oriente de María Paz, el más cercano al punto M del proyecto que no tiene vivienda. Mercado de barrio de 3 pisos con la forma del lote. Verificar en campo su uso actual.' },
  R: { titulo: 'Recuperación de alimentos y materiales (R)', lote: [[-0.927, 1.495], [-0.861, 1.495], [-0.861, 1.581], [-0.993, 1.625], [-0.999, 1.559], [-0.969, 1.527]],
    edificio: { pisos: 2, fachada: 'celosia', cubierta: 'pv' }, dividir: true,
    texto: 'Lote abierto (~11.800 m²) al sur de Corabastos, al otro lado de la avenida. Recibe excedentes y residuos orgánicos del mercado y de los nodos, rescata alimento apto para donación y produce compost. Va fuera del predio y lejos del humedal para no arriesgar lixiviados. Verificar en campo qué hay hoy (el lote tiene construcciones pequeñas dispersas).' },
  P: { titulo: 'Producción complementaria y huertas (P)', lote: [[-1.441, 1.507], [-1.453, 1.529], [-1.413, 1.649], [-1.291, 1.649], [-1.347, 1.485], [-1.381, 1.485]],
    edificio: { pisos: 1, fachada: 'vidrio', cubierta: 'verde', largo: 30, pasaje: 30 }, dividir: true,
    texto: 'Lote abierto (~19.000 m²) al sur, cerca del borde verde de La Vaca. Huertas e invernaderos que usan el compost de la recuperación: reducen una parte de la dependencia externa, no la reemplazan. Verificar en campo su uso actual.',
    extra: ({ P, mundo, gw, centro, suelo }) => { suelo(desplazar(P, 10) || P, mat('huerta'), .2, 8); } }
};
function dist(pol, x, z) { let d = 1e9; for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) { const [ax, az] = pol[j], [bx, bz] = pol[i], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1; let t = ((x - ax) * dx + (z - az) * dz) / L2; t = Math.max(0, Math.min(1, t)); d = Math.min(d, Math.hypot(x - ax - t * dx, z - az - t * dz)); } return d; }

// Recorta un polígono a otro convexo (Sutherland–Hodgman): la orilla ondulada del humedal no sale del predio.
function recorteConvexo(P, C) {
  let out = P; const s = Math.sign(C.reduce((a, p, i) => { const q = C[(i + 1) % C.length]; return a + (p[0] * q[1] - q[0] * p[1]); }, 0));
  for (let i = 0; i < C.length && out.length; i++) {
    const a = C[i], b = C[(i + 1) % C.length], f = p => s * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])), inp = out; out = [];
    for (let k = 0; k < inp.length; k++) { const p = inp[k], q = inp[(k + 1) % inp.length], fp = f(p), fq = f(q); if (fp >= 0) out.push(p); if ((fp >= 0) !== (fq >= 0)) { const u = fp / (fp - fq); out.push([p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]); } }
  }
  return out;
}
