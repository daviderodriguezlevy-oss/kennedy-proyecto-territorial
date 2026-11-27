// INDICADORES EN EL TERRITORIO, A GRAN ESCALA.
// Cada indicador se adueña de un elemento grande del paisaje, para que el cambio se vea a simple vista,
// en el 3D y en la planta al mismo tiempo:
//   Cielo / neblina ........ Aire            Superficie del humedal ... Agua y Humedal (color, espejo que se encoge)
//   Zonas verdes y árboles . Vegetación y abejas (ocre, flores)          Techos y edificios ....... Isla de calor
//   Avenidas ............... Movilidad       Muros sobre las avenidas . Ruido (y su mancha en el suelo)
//   Montaña en Corabastos .. Residuos y plagas                           Bordes del humedal ....... Invasiones
// Regla: cada 5 % de cambio real frente a 2026 mueve el elemento un escalón entero (exagerado a propósito).
// Además: pulsos con texto corto en el lugar donde cambia algo, eventos (incendio, vertimiento, inundación…)
// y LENTES para ver el territorio entero a través de un solo indicador.
import * as T from 'three';

const LIM = { x0: -2.575863, z0: -2.23373, w: 5.151726, h: 4.46746 };
const RW = 768, RH = Math.round(RW * LIM.h / LIM.w);
const LUG = { vaca: [-1.604, 1.185], cora: [-1.29, 1.16], centro: [-.95, .75] };

// Indicador → cómo se mide el escalón de 5 % (sobre el valor de 2026, o sobre un rango) y qué tanto pesa cada escalón.
const IND = {
  Q: { n: 'Agua', lugar: 'vaca', paso: .1, mas: true },
  H: { n: 'Espejo del humedal', lugar: 'vaca', paso: .08, mas: true },
  V: { n: 'Vegetación', lugar: 'parque', paso: .12, mas: true },
  abejas: { n: 'Abejas', lugar: 'parque', paso: .1, mas: true },
  aves: { n: 'Aves', lugar: 'vaca', paso: .1, mas: true },
  C: { n: 'Calor', lugar: 'centro', paso: .08, mas: false, rango: 5 },
  vel: { n: 'Movilidad', lugar: 'via', paso: .09, mas: true },
  N: { n: 'Ruido en avenidas', lugar: 'via', paso: .12, mas: false, rango: 20 },
  Nh: { n: 'Ruido en el humedal', lugar: 'vaca', paso: .12, mas: false, rango: 20 },
  pm: { n: 'Aire', lugar: 'centro', paso: .1, mas: false },
  W: { n: 'Residuos', lugar: 'cora', paso: .1, mas: false, rango: 3300 },
  plagas: { n: 'Plagas', lugar: 'cora', paso: .08, mas: false, rango: 200 },
  K: { n: 'Corredor ecológico', lugar: 'parque', paso: .1, mas: true },
  atencion: { n: 'Comida', lugar: 'cora', paso: .1, mas: true }
};
const LENTES = [['todo', 'Todo'], ['calor', 'Calor'], ['ruido', 'Ruido'], ['vida', 'Vida'], ['agua', 'Agua'], ['movilidad', 'Movilidad'], ['aire', 'Aire']];
const LENTE_ID = { todo: 0, calor: 1, ruido: 2, vida: 3, agua: 4, movilidad: 5, aire: 6 };

export function setupTerritorio({ scene, groups, dynamics, years, canopy, ground, camera, invalidate }) {
  // ---------- 1. Campos del territorio (una sola vez): agua, verde y avenidas ----------
  const cv = document.createElement('canvas'); cv.width = RW; cv.height = RH;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const px = x => (x - LIM.x0) / LIM.w * RW, pz = z => (z - LIM.z0) / LIM.h * RH;
  const v = new T.Vector3(), tri = [[0, 0], [0, 0], [0, 0]];
  function rasterizar(meshes) {
    ctx.clearRect(0, 0, RW, RH); ctx.fillStyle = '#fff'; ctx.beginPath();
    for (const o of meshes) {
      const p = o.geometry.attributes.position, ix = o.geometry.index; o.updateWorldMatrix(true, false);
      const n = ix ? ix.count : p.count;
      for (let i = 0; i + 2 < n; i += 3) {
        for (let k = 0; k < 3; k++) { v.fromBufferAttribute(p, ix ? ix.getX(i + k) : i + k).applyMatrix4(o.matrixWorld); tri[k][0] = px(v.x); tri[k][1] = pz(v.z); }
        // Mismo sentido de giro para todos: así la unión no deja huecos.
        const area = (tri[1][0] - tri[0][0]) * (tri[2][1] - tri[0][1]) - (tri[2][0] - tri[0][0]) * (tri[1][1] - tri[0][1]);
        const [a, b, c] = area >= 0 ? tri : [tri[0], tri[2], tri[1]];
        ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath();
      }
    }
    ctx.fill();
    const d = ctx.getImageData(0, 0, RW, RH).data, m = new Uint8Array(RW * RH);
    for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 100 ? 1 : 0;
    return m;
  }
  const mallas = g => { const l = []; g?.traverse(o => { if (o.isMesh && !o.isInstancedMesh && o.geometry?.attributes?.position) l.push(o); }); return l; };
  const esRibera = o => o.material?.color?.getHexString?.() === '718771';
  const aguaMeshes = mallas(groups.hydrology).filter(o => !esRibera(o)), riberas = mallas(groups.hydrology).filter(esRibera);
  const mAgua = rasterizar(aguaMeshes);
  const mVerde = rasterizar([...mallas(groups.parks), ...riberas]);
  // Distancias (en píxeles de ~6,7 m) dentro y fuera del agua: chaflán 3-4 en dos pasadas.
  function distancia(mask, dentro) {
    const D = new Float32Array(RW * RH), INF = 1e6;
    for (let i = 0; i < D.length; i++) D[i] = (mask[i] === 1) === dentro ? INF : 0;
    for (let j = 0; j < RH; j++) for (let i = 0; i < RW; i++) { const k = j * RW + i; if (!D[k]) continue; let d = D[k];
      if (i > 0) d = Math.min(d, D[k - 1] + 3); if (j > 0) { d = Math.min(d, D[k - RW] + 3); if (i > 0) d = Math.min(d, D[k - RW - 1] + 4); if (i < RW - 1) d = Math.min(d, D[k - RW + 1] + 4); } D[k] = d; }
    for (let j = RH - 1; j >= 0; j--) for (let i = RW - 1; i >= 0; i--) { const k = j * RW + i; if (!D[k]) continue; let d = D[k];
      if (i < RW - 1) d = Math.min(d, D[k + 1] + 3); if (j < RH - 1) { d = Math.min(d, D[k + RW] + 3); if (i < RW - 1) d = Math.min(d, D[k + RW + 1] + 4); if (i > 0) d = Math.min(d, D[k + RW - 1] + 4); } D[k] = d; }
    for (let i = 0; i < D.length; i++) D[i] /= 3;
    return D;
  }
  const dIn = distancia(mAgua, true), dOut = distancia(mAgua, false);
  // Verde (parques, riberas y árboles) y avenidas (rutas del tráfico simulado), difuminados: «cuánto verde / cuánta vía hay cerca».
  function difuminar(dibujar, radio) {
    ctx.clearRect(0, 0, RW, RH); ctx.filter = 'none'; dibujar();
    const tmp = document.createElement('canvas'); tmp.width = RW; tmp.height = RH; const t2 = tmp.getContext('2d', { willReadFrequently: true });
    t2.filter = `blur(${radio}px)`; t2.drawImage(cv, 0, 0);
    const d = t2.getImageData(0, 0, RW, RH).data, out = new Float32Array(RW * RH);
    for (let i = 0; i < out.length; i++) out[i] = d[i * 4 + 3] / 255;
    return out;
  }
  const arboles = [];
  if (canopy) { const M = new T.Matrix4(), p = new T.Vector3(); for (let i = 0; i < canopy.count; i += 2) { canopy.getMatrixAt(i, M); p.setFromMatrixPosition(M); arboles.push(px(p.x), pz(p.z)); } }
  const verde = difuminar(() => {
    const img = ctx.createImageData(RW, RH); for (let i = 0; i < mVerde.length; i++) if (mVerde[i]) img.data[i * 4 + 3] = 255; ctx.putImageData(img, 0, 0);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < arboles.length; i += 2) ctx.fillRect(arboles[i] - 1, arboles[i + 1] - 1, 2, 2);
  }, 6);
  const rutas = dynamics.state().roadRoutes || [];
  const vias = difuminar(() => {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath();
    for (const r of rutas) { r.points.forEach(([x, z], i) => i ? ctx.lineTo(px(x), pz(z)) : ctx.moveTo(px(x), pz(z))); }
    ctx.stroke();
  }, 9);
  let maxV = 0; for (const a of vias) maxV = Math.max(maxV, a); for (let i = 0; i < vias.length; i++) vias[i] = Math.min(1, vias[i] / (maxV * .6 || 1));
  const datos = new Uint8Array(RW * RH * 4);
  for (let i = 0; i < RW * RH; i++) { datos[i * 4] = Math.min(255, dIn[i] * 6); datos[i * 4 + 1] = Math.min(255, dOut[i] * 4); datos[i * 4 + 2] = Math.min(255, verde[i] * 255 * 1.4); datos[i * 4 + 3] = vias[i] * 255; }
  const campos = new T.DataTexture(datos, RW, RH, T.RGBAFormat); campos.magFilter = campos.minFilter = T.LinearFilter; campos.needsUpdate = true;
  const celda = (x, z) => { const i = Math.max(0, Math.min(RW - 1, Math.floor(px(x)))), j = Math.max(0, Math.min(RH - 1, Math.floor(pz(z)))); return j * RW + i; };

  // Puntos útiles para pulsos: avenidas, parques y bordes del humedal cerca de La Vaca.
  const puntosVia = [], puntosParque = [], bordeVaca = [];
  for (const r of rutas) for (let i = 0; i < r.points.length; i += 6) puntosVia.push(r.points[i]);
  for (let j = 2; j < RH - 2; j += 3) for (let i = 2; i < RW - 2; i += 3) {
    const k = j * RW + i, x = LIM.x0 + (i + .5) / RW * LIM.w, z = LIM.z0 + (j + .5) / RH * LIM.h;
    if (mVerde[k]) puntosParque.push([x, z]);
    if (!mAgua[k] && dOut[k] > 1 && dOut[k] < 4 && Math.hypot(x - LUG.vaca[0], z - LUG.vaca[1]) < .3) bordeVaca.push([x, z]);
  }
  if (!puntosVia.length) puntosVia.push(LUG.cora); if (!puntosParque.length) puntosParque.push(LUG.centro); if (!bordeVaca.length) bordeVaca.push(LUG.vaca);

  // ---------- 2. Uniformes compartidos y sombreadores ----------
  const U = {
    uCampos: { value: campos }, uLim: { value: new T.Vector4(LIM.x0, LIM.z0, LIM.w, LIM.h) }, uTiempo: { value: 0 },
    uActivo: { value: 0 }, uPlanta: { value: 0 }, uLente: { value: 0 },
    uAguaSuc: { value: 0 }, uSeco: { value: 0 }, uPluma: { value: new T.Vector3(0, 0, .001) }, uPlumaK: { value: 0 },
    uVeg: { value: 0 }, uFlores: { value: .3 }, uCalor: { value: 0 }, uMov: { value: 0 },
    uRuidoDB: { value: 66 }, uRuidoVis: { value: 0 }, uInunda: { value: 0 }, uLleno: { value: 0 }, uQuema: { value: new T.Vector3(0, 0, .001) }, uQuemaK: { value: 0 }
  };
  const GLSL_COMUN = `
    varying vec3 vMundo;
    uniform sampler2D uCampos; uniform vec4 uLim; uniform float uTiempo, uActivo, uPlanta, uLente;
    uniform float uAguaSuc, uSeco, uPlumaK, uVeg, uFlores, uCalor, uMov, uRuidoDB, uRuidoVis, uInunda, uQuemaK, uLleno;
    uniform vec3 uPluma, uQuema;
    float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(h2(i), h2(i + vec2(1., 0.)), f.x), mix(h2(i + vec2(0., 1.)), h2(i + 1.), f.x), f.y); }
    vec4 campo(vec2 xz) { return texture2D(uCampos, (xz - uLim.xy) / uLim.zw); }
    float lum(vec3 c) { return dot(c, vec3(.3, .59, .11)); }
    vec3 termica(float t) { t = clamp(t, 0., 1.);
      return t < .33 ? mix(vec3(.05, .12, .45), vec3(.95, .85, .1), t / .33) : t < .66 ? mix(vec3(.95, .85, .1), vec3(1., .35, .02), (t - .33) / .33) : mix(vec3(1., .35, .02), vec3(.85, .02, .02), (t - .66) / .34); }
    float exposicion(vec4 c) { float cercaAgua = 1. - smoothstep(0., 22., c.g * 255. / 4.); return clamp(1. - c.b * 3.2 - cercaAgua * .9, 0., 1.); }
    float ruidoLocal(vec4 c) { return uRuidoDB - 28. * (1. - sqrt(c.a)); }
    // Agua que sale de la orilla: inundación (de golpe) o humedal más lleno (crece despacio sobre la ronda).
    float aguaFuera(vec4 c) { float fuera = c.g * 255. / 4., r = uInunda * 22. + uLleno * 16.;
      return r > .05 ? (1. - smoothstep(0., r + vn(vMundo.xz * 90.) * 5., fuera)) * step(.01, fuera) : 0.; }
    vec3 colorAguaFuera() { return uInunda > uLleno ? vec3(.12, .3, .42) : vec3(.05, .3, .27); }
  `;
  // Capas que se pintan sobre todo lo que es suelo (terreno, andenes, vías, parques): ruido, inundación, cicatriz, lentes.
  const GLSL_SUELO = `
    {
      vec4 cs = campo(vMundo.xz);
      float halo = smoothstep(55., 61., ruidoLocal(cs)) * uActivo;
      float vis = uLente == 2. ? .85 : uRuidoVis * uPlanta;   // en 3D el ruido solo se pinta con el lente Ruido
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.42, .06, .62) * (uPlanta > .5 ? 1.6 : 1.), halo * vis);
      float agua = aguaFuera(cs) * uActivo;
      diffuseColor.rgb = mix(diffuseColor.rgb, colorAguaFuera() * (uPlanta > .5 ? 1.8 : 1.), agua * .88);
      float q = uQuemaK * (1. - smoothstep(uQuema.z * .5, uQuema.z, distance(vMundo.xz, uQuema.xy))) * (.6 + .4 * vn(vMundo.xz * 200.));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.03, .025, .02), q);
      if (uLente == 1.) diffuseColor.rgb = termica(uCalor * (.35 + .65 * exposicion(cs)) * .9 + .1) * (uPlanta > .5 ? .8 : .55);
    }
  `;
  const gris = foco => `if (uLente > .5 && ${foco}) diffuseColor.rgb = vec3(lum(diffuseColor.rgb)) * .75;`;
  const COLOR = {
    agua: `
      vec4 ca = campo(vMundo.xz);
      float din = ca.r * 255. / 6.;
      float borde = uSeco * 30. + vn(vMundo.xz * 160.) * 4. * uSeco;   // el agua se retira desde la orilla y queda barro
      float lodo = uSeco > .001 ? 1. - smoothstep(borde - 1.5, borde, din) : 0.;
      float s = clamp(uAguaSuc, 0., 1.);
      vec3 limpio = vec3(.05, .30, .26), algas = vec3(.12, .26, .03), cafe = vec3(.12, .07, .02), negra = vec3(.008, .008, .006);
      vec3 ag = s < .33 ? mix(limpio, algas, s / .33) : s < .66 ? mix(algas, cafe, (s - .33) / .33) : mix(cafe, negra, (s - .66) / .34);
      if (uAguaSuc < 0.) ag = mix(limpio, vec3(.06, .42, .48), -uAguaSuc);
      ag = mix(ag, negra, uPlumaK * (1. - smoothstep(uPluma.z * .35, uPluma.z, distance(vMundo.xz, uPluma.xy))));
      float basura = step(.4, s) * step(1. - .05 * (s - .4), h2(floor(vMundo.xz * 700.)));
      ag = mix(ag, vec3(.75, .7, .6), basura);
      vec3 barro = mix(vec3(.36, .27, .15), vec3(.2, .15, .08), step(.62, vn(vMundo.xz * 700.)));
      vec3 nuevo = mix(ag * (uPlanta > .5 ? 2.2 : 1.), barro * (uPlanta > .5 ? 1.3 : 1.), lodo);
      diffuseColor.rgb = mix(diffuseColor.rgb, nuevo, uActivo);
      ${gris('uLente != 4.')}`,
    verde: `
      float nv = vn(vMundo.xz * 28.) * .7 + vn(vMundo.xz * 110.) * .3;
      float seca = uVeg > 0. ? smoothstep(nv - .06, nv + .06, uVeg * 1.05) : 0.;
      vec3 b = diffuseColor.rgb;
      vec3 ocre = mix(vec3(.42, .3, .08), vec3(.22, .14, .06), smoothstep(.55, 1., uVeg));
      b = mix(b, ocre * (uPlanta > .5 ? .9 : 1.), seca);
      if (uVeg < 0.) b = mix(b, b * vec3(.75, 1.45, .55) + vec3(0., .02, 0.), -uVeg);
      float fh = h2(floor(vMundo.xz * 600.));
      float flor = step(1. - .09 * uFlores * (1. - seca), fh);
      b = mix(b, h2(floor(vMundo.xz * 600.) + 7.) > .5 ? vec3(.85, .25, .5) : vec3(.95, .8, .12), flor);
      b = mix(b, colorAguaFuera() * (uPlanta > .5 ? 1.8 : 1.), aguaFuera(campo(vMundo.xz)) * .88);   // la ronda se inunda si el humedal se llena
      diffuseColor.rgb = mix(diffuseColor.rgb, b, uActivo);
      ${gris('uLente != 3.')}`,
    edificio: `
      vec4 ce = campo(vMundo.xz);
      float calor = uCalor * (.35 + .65 * exposicion(ce));
      vec3 tc = termica(calor);
      // En 3D el calor es solo un tinte cálido leve (se ve fuerte en la planta y con el lente Calor).
      float kc = uPlanta > .5 ? .8 : .22;
      if (uCalor > 0.) diffuseColor.rgb = mix(diffuseColor.rgb, uPlanta > .5 ? tc : diffuseColor.rgb * vec3(1.25, .95, .8), clamp(calor, 0., 1.) * kc * uActivo);
      else diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.45, .55, .7), -uCalor * .35 * uActivo);
      if (uLente == 1.) diffuseColor.rgb = termica(calor * .9 + .1);
      ${gris('uLente != 1.')}`,
    via: `
      vec4 cv = campo(vMundo.xz);
      float w = .35 + .65 * smoothstep(.15, .7, cv.a);
      float mv = clamp(uMov, 0., 1.) * w * uActivo * (uPlanta > .5 || uLente == 5. ? 1. : .3);   // en 3D el trancón se ve en los carros, no en la pintura
      vec3 rv = mv < .5 ? mix(vec3(.9, .55, .05), vec3(1., .3, .02), mv * 2.) : mix(vec3(1., .3, .02), vec3(.8, .02, .02), (mv - .5) * 2.);
      diffuseColor.rgb = mix(diffuseColor.rgb, rv * (uPlanta > .5 ? .8 : .7), smoothstep(0., .25, mv) * .9);
      ${GLSL_SUELO}
      ${gris('uLente != 5.')}`,
    suelo: `
      if (uPlanta < .5 && uVeg > 0.) { float ns = vn(vMundo.xz * 20.); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.42, .33, .17), smoothstep(ns - .1, ns + .1, uVeg * .8) * .55 * uActivo); }
      ${GLSL_SUELO}
      ${gris('uLente != 1. && uLente != 2.')}`
  };
  const EMISIVO = {
    agua: `totalEmissiveRadiance *= 1. - uActivo * (.6 + .4 * lodo);`,
    verde: `totalEmissiveRadiance *= 1. - seca * uActivo;`,
    edificio: `totalEmissiveRadiance += tc * clamp(calor, 0., 1.) * (uPlanta > .5 ? .55 : 0.) * uActivo + (uLente == 1. ? termica(calor * .9 + .1) * .4 : vec3(0.));`,
    via: `totalEmissiveRadiance = mix(totalEmissiveRadiance, rv * .7, smoothstep(0., .25, mv) * uPlanta);`,
    suelo: ``
  };
  function inyectar(mat, tipo) {
    if (!mat || mat.userData.territorio) return;
    mat.userData.territorio = tipo;
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMundo;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvMundo = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + GLSL_COMUN)
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + COLOR[tipo])
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + EMISIVO[tipo]);
    };
    mat.customProgramCacheKey = () => 'territorio-' + tipo;
    mat.needsUpdate = true;
  }
  const mats = (g, f) => g?.traverse(o => { if (o.isMesh && !o.isInstancedMesh) [].concat(o.material).forEach(m => f(m, o)); });
  mats(groups.hydrology, (m, o) => inyectar(m, esRibera(o) ? 'verde' : 'agua'));
  mats(groups.parks, m => inyectar(m, 'verde'));
  mats(groups.Buildings, m => inyectar(m, 'edificio'));
  mats(groups.roads, m => inyectar(m, 'via'));
  mats(groups.terrain, m => inyectar(m, 'suelo'));
  mats(groups.sidewalks, m => inyectar(m, 'suelo'));

  // ---------- 3. Objetos que aparecen ----------
  const ruta = (r, d) => { let lo = 1, hi = r.cumulative.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (r.cumulative[mid] < d) lo = mid + 1; else hi = mid; } const a = r.points[lo - 1], b = r.points[lo], f = (d - r.cumulative[lo - 1]) / (r.cumulative[lo] - r.cumulative[lo - 1] || 1); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; };
  // Muros de ruido sobre las avenidas: su altura es el ruido.
  const mp = [], ma = [], mw = [], vistos = new Map();
  for (const r of rutas) {
    if (!r.cumulative) continue; const n = Math.max(1, Math.floor(r.length / .025)); let prev = ruta(r, 0);
    for (let i = 1; i <= n; i++) {
      const p = ruta(r, r.length * i / n), key = Math.round((prev[0] + p[0]) / .03) + ',' + Math.round((prev[1] + p[1]) / .03);
      if (vistos.has(key)) { vistos.get(key).c++; prev = p; continue; }
      const reg = { c: 1, i: mw.length }; vistos.set(key, reg);
      const y1 = ground(prev[0], prev[1]), y2 = ground(p[0], p[1]);
      mp.push(prev[0], y1, prev[1], p[0], y2, p[1], prev[0], y1, prev[1], p[0], y2, p[1]); ma.push(0, 0, 1, 1); mw.push(reg, reg, reg, reg);
      prev = p;
    }
  }
  const muroGeo = new T.BufferGeometry(), nMuro = mp.length / 12, idxM = [];
  for (let s = 0; s < nMuro; s++) idxM.push(s * 4, s * 4 + 1, s * 4 + 2, s * 4 + 1, s * 4 + 3, s * 4 + 2);
  muroGeo.setAttribute('position', new T.Float32BufferAttribute(mp, 3)); muroGeo.setAttribute('alto', new T.Float32BufferAttribute(ma, 1));
  muroGeo.setAttribute('peso', new T.Float32BufferAttribute(mw.map(r => Math.min(1.8, .55 + .25 * r.c)), 1)); muroGeo.setIndex(idxM);
  const muroU = { uAlto: { value: 0 }, uOp: { value: 0 } };
  const muros = new T.Mesh(muroGeo, new T.ShaderMaterial({
    uniforms: muroU, transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
    vertexShader: `#include <common>\n#include <logdepthbuf_pars_vertex>\nattribute float alto, peso; uniform float uAlto; varying float vA;
      void main() { vA = alto; vec3 p = position; p.y += alto * uAlto * peso; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); \n#include <logdepthbuf_vertex>\n}`,
    fragmentShader: `#include <common>\n#include <logdepthbuf_pars_fragment>\nuniform float uOp; varying float vA;
      void main() { \n#include <logdepthbuf_fragment>\n gl_FragColor = vec4(vec3(.62, .18, 1.) * uOp * (1. - vA) * (.55 + .45 * step(.5, fract(vA * 6.))), 1.); }`
  }));
  muros.frustumCulled = false; muros.renderOrder = 4; muros.visible = false; scene.add(muros);

  // Neblina (aire): un domo sobre todo el territorio.
  const domo = new T.Mesh(new T.BoxGeometry(LIM.w, .45, LIM.h), new T.MeshBasicMaterial({ color: '#6f5f45', transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide }));
  domo.position.set(LIM.x0 + LIM.w / 2, .225, LIM.z0 + LIM.h / 2); domo.renderOrder = 6; domo.visible = false; scene.add(domo);

  // Basura: montaña junto a Corabastos y montones que se riegan por el barrio.
  const st0 = dynamics.state(), [cx, cz] = st0.center || LUG.cora;
  const montGeo = new T.ConeGeometry(1, 1, 28, 6, false); montGeo.translate(0, .5, 0);
  { const p = montGeo.attributes.position, c = []; for (let i = 0; i < p.count; i++) { const y = p.getY(i), r = 1 + (Math.sin(i * 12.9898) * 43758.5453 % 1) * .25 * (y < .98 ? 1 : 0); p.setX(i, p.getX(i) * r); p.setZ(i, p.getZ(i) * r); const g = .25 + Math.abs(Math.sin(i * 7.31)) * .2; c.push(g * 1.1, g * .95, g * .7); } montGeo.setAttribute('color', new T.Float32BufferAttribute(c, 3)); montGeo.computeVertexNormals(); }
  const matBasura = new T.MeshLambertMaterial({ vertexColors: true });
  const montana = new T.Mesh(montGeo, matBasura); montana.position.set(cx + .09, ground(cx + .09, cz + .07), cz + .07); montana.visible = false; scene.add(montana);
  const MAXM = 160, montones = new T.InstancedMesh(montGeo, matBasura, MAXM); montones.count = 0; montones.frustumCulled = false; scene.add(montones);
  const sitiosBasura = []; for (let i = 0; i < MAXM; i++) { const a = i * 2.39996, r = .1 + Math.sqrt(i / MAXM) * .75; const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r * .85; sitiosBasura.push([x, z, .009 + (i % 5) * .003]); }
  { const M = new T.Matrix4(); sitiosBasura.forEach(([x, z, s], i) => { M.compose(new T.Vector3(x, ground(x, z), z), new T.Quaternion(), new T.Vector3(s, s * .55, s)); montones.setMatrixAt(i, M); }); }
  // Moscas y palomas: una nube oscura sobre la basura.
  const MAXF = 2500, fPos = new Float32Array(MAXF * 3), fSem = new Float32Array(MAXF * 3);
  for (let i = 0; i < MAXF; i++) { const s = sitiosBasura[i % MAXM]; fSem[i * 3] = i < MAXF * .3 ? cx + .09 : s[0]; fSem[i * 3 + 1] = i < MAXF * .3 ? cz + .07 : s[1]; fSem[i * 3 + 2] = Math.random() * 100; }
  const moscasGeo = new T.BufferGeometry(); moscasGeo.setAttribute('position', new T.BufferAttribute(fPos, 3));
  const moscas = new T.Points(moscasGeo, new T.PointsMaterial({ color: '#1b1a16', size: 2.5, sizeAttenuation: false, transparent: true, opacity: .85, depthWrite: false }));
  moscas.frustumCulled = false; moscas.visible = false; scene.add(moscas);
  // Invasiones de la ronda: casas que aparecen en el borde del humedal.
  const MAXC = 120, casas = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1).translate(0, .5, 0), new T.MeshLambertMaterial({ color: '#b5654a' }), MAXC);
  casas.count = 0; casas.frustumCulled = false; scene.add(casas);
  { const M = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(); for (let i = 0; i < MAXC; i++) { const [x, z] = bordeVaca[Math.floor((i * 7919) % bordeVaca.length)]; e.set(0, (i * 1.7) % 3.14, 0); q.setFromEuler(e); M.compose(new T.Vector3(x, ground(x, z), z), q, new T.Vector3(.012, .007 + (i % 3) * .003, .009)); casas.setMatrixAt(i, M); } }
  // Humo de incendio.
  const humoGeo = new T.BufferGeometry(), HN = 600, hPos = new Float32Array(HN * 3); humoGeo.setAttribute('position', new T.BufferAttribute(hPos, 3));
  const humo = new T.Points(humoGeo, new T.PointsMaterial({ color: '#5a5650', size: 7, sizeAttenuation: false, transparent: true, opacity: .5, depthWrite: false }));
  humo.frustumCulled = false; humo.visible = false; scene.add(humo);

  // Árboles: amarillean y se secan por tandas (cada árbol tiene su turno), o reverdecen.
  let colArboles = null;
  if (canopy?.instanceColor) colArboles = Float32Array.from(canopy.instanceColor.array);
  let vegArboles = 0;
  function pintarArboles(k) {
    if (!colArboles || Math.abs(k - vegArboles) < .02) return; vegArboles = k;
    const a = canopy.instanceColor.array, n = canopy.count;
    for (let i = 0; i < n; i++) {
      const r = ((i * 2654435761) % 1000) / 1000, o = i * 3; let R = colArboles[o], G = colArboles[o + 1], B = colArboles[o + 2];
      if (k > 0) { const t = Math.max(0, Math.min(1, (k * 1.1 - r) * 4)); const t2 = Math.max(0, Math.min(1, (k * 1.1 - r - .35) * 3));
        R += (.36 - R) * t; G += (.27 - G) * t; B += (.04 - B) * t; R += (.18 - R) * t2; G += (.12 - G) * t2; B += (.07 - B) * t2; }
      else { const t = -k; G += G * .45 * t; R *= 1 - .25 * t; B *= 1 - .3 * t; }
      a[o] = R; a[o + 1] = G; a[o + 2] = B;
    }
    canopy.instanceColor.needsUpdate = true;
  }

  // ---------- 4. Pulsos: anillo en el lugar + texto corto ----------
  const capa = document.createElement('div'); capa.id = 'pulsos'; document.body.append(capa);
  const anillos = [], anilloGeo = new T.RingGeometry(.82, 1, 48).rotateX(-Math.PI / 2);
  const pulsos = [];
  let enPlanta = false, murosPlanta = false;
  // En 3D el anillo es pequeño y tenue (no tapa el territorio); en la planta conserva su tamaño.
  const escalaPulso = p => { p.a.scale.setScalar(enPlanta ? p.sp : p.s3); p.a.material.opacity = enPlanta ? p.op : p.op * .4; };
  function pulso(x, z, texto, tono) {
    const col = { malo: '#ff3b2f', bueno: '#3dff7a', evento: '#ffc23d' }[tono] || '#ffc23d';
    let a = anillos.find(r => !r.visible);
    if (!a) { a = new T.Mesh(anilloGeo, new T.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false, side: T.DoubleSide })); a.renderOrder = 15; a.frustumCulled = false; scene.add(a); anillos.push(a); }
    a.material.color.set(col); a.position.set(x, ground(x, z) + .004, z); a.visible = true;
    const el = document.createElement('div'); el.className = 'pulso ' + tono; el.textContent = texto; capa.append(el);
    pulsos.push({ a, el, t0: performance.now(), x, z });
    if (pulsos.length > 14) quitar(pulsos[0]);
  }
  function quitar(p) { p.a.visible = false; p.el.remove(); pulsos.splice(pulsos.indexOf(p), 1); }
  const v3 = new T.Vector3();
  function animarPulsos(now) {
    for (const p of [...pulsos]) {
      const t = (now - p.t0) / 3800; if (t >= 1) { quitar(p); continue; }
      p.sp = .03 + .2 * Math.sqrt(t); p.s3 = .01 + .035 * Math.sqrt(t); p.op = (1 - t) * .9; escalaPulso(p);
      v3.set(p.x, ground(p.x, p.z) + .01, p.z).project(camera);
      const X = (v3.x * .5 + .5) * innerWidth, Y = (-v3.y * .5 + .5) * innerHeight, g = window.vista3D?.region;
      const dentro = v3.z < 1 && (!g || (X > g.x0 && X < g.x1 && Y > g.y0 && Y < g.y1));
      p.el.style.display = dentro ? '' : 'none'; p.el.style.transform = `translate(${X}px, ${Y - 18 - t * 26}px) translate(-50%, -100%)`; p.el.style.opacity = t < .1 ? t * 10 : 1 - Math.max(0, t - .7) / .3;
    }
  }
  const lugarDe = (clave, azar = Math.random()) => clave === 'via' ? puntosVia[Math.floor(azar * puntosVia.length)] : clave === 'parque' ? puntosParque[Math.floor(azar * puntosParque.length)] : LUG[clave] || LUG.centro;

  // Eventos de la simulación → efectos en el lugar.
  let pluma = 0, quema = 0, inunda = 0, humoT = 0;
  document.addEventListener('sim-evento', e => {
    const d = e.detail, l = d.lugar || lugarDe('via', d.azar);
    pulso(l[0], l[1], d.t, d.malo ? 'malo' : 'bueno');
    if (d.id === 'vertimiento') { U.uPluma.value.set(l[0], l[1], .02); pluma = 1; }
    if (d.id === 'incendio') { U.uQuema.value.set(l[0], l[1], .07); quema = 1; humoT = 1; }
    if (d.id === 'inundacion') inunda = 1;
  });
  document.addEventListener('sim-inicio', () => { pluma = quema = inunda = humoT = 0; ultimos = {}; base = null; });

  // ---------- 5. Lentes ----------
  let lente = 'todo';
  const barra = document.createElement('div'); barra.id = 'lentes';
  barra.innerHTML = `<span>Ver el territorio por</span>${LENTES.map(([id, n]) => `<button data-lente="${id}" class="${id === 'todo' ? 'active' : ''}">${n}</button>`).join('')}`;
  const ponerLente = id => { lente = id; U.uLente.value = LENTE_ID[id]; barra.querySelectorAll('[data-lente]').forEach(b => b.classList.toggle('active', b.dataset.lente === id)); invalidate(); };
  barra.querySelectorAll('[data-lente]').forEach(b => b.onclick = () => ponerLente(b.dataset.lente));
  const anos = document.getElementById('anos-panel'); anos ? anos.querySelector('header')?.after(barra) : document.body.append(barra);

  // ---------- 6. Cada cuadro ----------
  let base = null, ultimos = {}, objetivo = {}, actual = {};
  const pasos = (k, x) => {
    const d = IND[k], v0 = base[k], v = x[k]; if (v == null || v0 == null) return 0;
    return Math.trunc((v - v0) / (d.rango || Math.max(1e-6, Math.abs(v0))) / .05);
  };
  // «malo»: positivo cuando el indicador empeora; escalones exagerados.
  const malo = (k, x) => (IND[k].mas ? -1 : 1) * pasos(k, x) * IND[k].paso;
  const lim = (v, a = -.6, b = 1.1) => Math.max(a, Math.min(b, v));
  const bgSet = new T.Color(), bgBase = new T.Color(), NEBLINA = new T.Color('#8a7659');
  let tAnterior = 0;
  function update(now) {
    const dt = Math.min(.1, (now - (tAnterior || now)) / 1000); tAnterior = now; U.uTiempo.value = now / 1000;
    const x = years?.estado;
    if (x && !base) base = years.base || x;
    if (!x) {
      for (const k in actual) actual[k] *= .9;
      U.uActivo.value = Math.max(0, U.uActivo.value - dt * 2);
      if (U.uActivo.value <= 0) { murosPlanta = false; muros.visible = domo.visible = montana.visible = moscas.visible = humo.visible = false; montones.count = casas.count = 0; pintarArboles(0); }
    } else {
      U.uActivo.value = Math.min(1, U.uActivo.value + dt * 2);
      objetivo = {
        agua: lim(malo('Q', x)), seco: lim(malo('H', x), 0, 1), lleno: lim(-malo('H', x), 0, 1.2), veg: lim(malo('V', x)), flores: lim(.3 - malo('abejas', x) * .3, 0, 1),
        calor: lim(malo('C', x)), mov: lim(malo('vel', x), 0, 1), ruido: lim(malo('N', x), -.3, 1.2), aire: lim(malo('pm', x), 0, 1),
        basura: lim(malo('W', x), 0, 1.4), plagas: lim(malo('plagas', x), 0, 1.4)
      };
      for (const k in objetivo) actual[k] = (actual[k] ?? 0) + (objetivo[k] - (actual[k] ?? 0)) * Math.min(1, dt * 1.5);
      const A = actual;
      U.uAguaSuc.value = A.agua; U.uSeco.value = A.seco; U.uLleno.value = A.lleno; U.uVeg.value = A.veg; U.uFlores.value = A.flores; U.uCalor.value = A.calor; U.uMov.value = A.mov;
      U.uRuidoDB.value = 59 + Math.max(-.3, A.ruido) * 18; U.uRuidoVis.value = .4;
      // Ruido: muros que crecen (un escalón ≈ 15 m más de altura).
      // En 3D solo con el lente Ruido (el ruido no se ve a simple vista); en la planta, también con «Todo».
      murosPlanta = lente === 'todo' || lente === 'ruido'; muros.visible = enPlanta ? murosPlanta : lente === 'ruido'; muroU.uAlto.value = .025 + Math.max(0, A.ruido) * .12; muroU.uOp.value = (.35 + Math.max(0, A.ruido) * .4) * (lente === 'ruido' ? 1.4 : 1);
      // Aire: domo de neblina y cielo.
      domo.visible = A.aire > .02 && (lente === 'todo' || lente === 'aire'); domo.material.opacity = Math.min(.55, A.aire * .5) * (lente === 'aire' ? 1.3 : 1);
      // Basura y plagas.
      const B = Math.max(0, A.basura), Pl = Math.max(0, A.plagas);
      montana.visible = lente === 'todo' || lente === 'vida'; const r = .025 + B * .09; montana.scale.set(r, r * .55, r);
      montones.count = lente === 'todo' ? Math.round(Math.min(MAXM, B * 120)) : 0;
      const nM = Math.round(Math.min(MAXF, Pl * 1800)); moscasGeo.setDrawRange(0, nM); moscas.visible = nM > 0 && lente === 'todo';
      // Invasiones (cada una se ve como 3 casas).
      casas.count = Math.min(MAXC, (x.inv || 0) * 3);
      pintarArboles(lente === 'todo' || lente === 'vida' ? A.veg : 0);
      // Pulsos cuando un indicador cruza un escalón de 5 %.
      // Con histéresis: si el valor oscila justo en el borde de un escalón no se repiten pulsos de ida y vuelta.
      for (const k in IND) {
        const d = IND[k], s = (x[k] - base[k]) / (d.rango || Math.max(1e-6, Math.abs(base[k]))) / .05;
        if (!Number.isFinite(s)) continue;
        if (ultimos[k] === undefined) { ultimos[k] = Math.round(s); continue; }
        if (Math.abs(s - ultimos[k]) >= 1.3 && (!ultimos['t' + k] || now - ultimos['t' + k] > 1800)) {
          const nuevo = Math.round(s), sube = nuevo > ultimos[k], mejor = sube === d.mas, l = lugarDe(d.lugar);
          pulso(l[0], l[1], `${sube ? '▲' : '▼'} ${d.n} ${nuevo >= 0 ? '+' : '−'}${Math.abs(nuevo * 5)} %`, mejor ? 'bueno' : 'malo');
          ultimos[k] = nuevo; ultimos['t' + k] = now;
        }
      }
    }
    // Neblina en el cielo (el reloj del día escribe el cielo; aquí se le suma la neblina).
    const bg = scene.background; if (bg?.isColor) { if (!bg.equals(bgSet)) bgBase.copy(bg); bg.copy(bgBase).lerp(NEBLINA, Math.min(.6, (actual.aire || 0) * .55) * U.uActivo.value); bgSet.copy(bg); }
    // Efectos de eventos que se desvanecen.
    pluma = Math.max(0, pluma - dt / 14); U.uPlumaK.value = pluma; U.uPluma.value.z = .02 + (1 - pluma) * .12;
    quema = Math.max(0, quema - dt / 40); U.uQuemaK.value = quema * .9;
    inunda = Math.max(0, inunda - dt / 10); U.uInunda.value = inunda;
    humoT = Math.max(0, humoT - dt / 12); humo.visible = humoT > 0;
    if (humo.visible) { const q = U.uQuema.value; for (let i = 0; i < HN; i++) { const f = ((now / 1000 * .25 + i / HN) % 1); hPos[i * 3] = q.x + Math.sin(i * 3.1 + now / 900) * .015 * (1 + f * 3) + f * .05; hPos[i * 3 + 1] = ground(q.x, q.y) + f * .3; hPos[i * 3 + 2] = q.y + Math.cos(i * 1.7 + now / 1100) * .015 * (1 + f * 3); } humoGeo.attributes.position.needsUpdate = true; humo.material.opacity = .55 * humoT; }
    if (moscas.visible) { const tt = now / 1000; const n = moscasGeo.drawRange.count; for (let i = 0; i < n; i++) { const s = fSem[i * 3 + 2], rr = .012 + (s % 1) * .03; fPos[i * 3] = fSem[i * 3] + Math.sin(tt * 1.3 + s) * rr; fPos[i * 3 + 2] = fSem[i * 3 + 1] + Math.cos(tt * 1.1 + s * 1.7) * rr; fPos[i * 3 + 1] = ground(fSem[i * 3], fSem[i * 3 + 1]) + .01 + Math.abs(Math.sin(tt * 2 + s)) * .02; } moscasGeo.attributes.position.needsUpdate = true; }
    animarPulsos(now);
    if (pulsos.length || U.uActivo.value > 0) invalidate();
  }

  // ---------- 7. Para la fauna: ¿se puede vivir aquí? (ruido y calor) y factores exagerados ----------
  function habitable(x, z) {
    if (!years?.estado) return 1;
    const k = celda(x, z), dB = U.uRuidoDB.value + 5 - 28 * (1 - Math.sqrt(vias[k])), expo = Math.max(0, Math.min(1, 1 - verde[k] * 3.2 - (dOut[k] < 22 ? 1 - dOut[k] / 22 : 0) * .9));
    const pr = 1 - Math.max(0, Math.min(1, (dB - 54) / 8)), pc = 1 - Math.max(0, actual.calor || 0) * expo * .7;
    return Math.max(0, pr * pc);
  }
  // Factor visual de cantidad (1 = como en 2026): cada escalón de 5 % real cambia ~17 % lo que se ve.
  const factor = (k, gan = 1) => { const x = years?.estado; if (!x || !base) return 1; return Math.max(.03, Math.min(3, 1 + gan * pasos(k, x) * .175)); };

  const api = { update, habitable, factor, planta(on) {
    U.uPlanta.value = on ? 1 : 0; domo.material.opacity *= on ? .6 : 1 / .6;
    enPlanta = on; pulsos.forEach(p => p.sp != null && escalaPulso(p));
    if (U.uActivo.value > 0) muros.visible = on ? murosPlanta : lente === 'ruido';
  }, get lente() { return lente; }, ponerLente };
  window.simTerritorio = api;
  return api;
}
