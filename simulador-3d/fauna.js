// FAUNA ANIMADA: aves que vuelan aleteando, se posan y vuelven a su hábitat; abejas y mariposas en los parques.
// Reemplaza los cuadrados de "puntos de especies". Cuántos individuos hay depende de las variables:
//   - Simulación en el tiempo (si está corriendo): aves, refugio, agua, espejo del humedal, plagas, abejas, aire.
//   - Momento: hora del día (de noche se posan), lluvia y viento (vuelan menos), temperatura (insectos).
// Tamaño visual: nunca menor a unos píxeles en pantalla (a escala real una garza mide 1 m y no se vería desde arriba).
import * as T from 'three';

const ESPECIES = [
  // id, nombre, color, envergadura real (km), hábitat, altura de vuelo [min,max] km, velocidad km/s (visual), base, aleteo Hz
  { id: 'garza', n: 'Garzas', c: '#f4f4ee', env: .0014, hab: 'agua', alt: [.012, .03], vel: .028, base: 26, hz: 2.2 },
  { id: 'golondrina', n: 'Golondrinas', c: '#2c3550', env: .0003, hab: 'agua', alt: [.025, .06], vel: .05, base: 40, hz: 7, circula: true },
  { id: 'copeton', n: 'Copetones', c: '#8a6a4a', env: .00025, hab: 'verde', alt: [.006, .018], vel: .03, base: 70, hz: 9 },
  { id: 'paloma', n: 'Palomas', c: '#8d95a3', env: .0007, hab: 'mercado', alt: [.015, .04], vel: .04, base: 60, hz: 5, bandada: true },
  { id: 'colibri', n: 'Colibríes', c: '#2fae6a', env: .00012, hab: 'verde', alt: [.003, .01], vel: .03, base: 14, hz: 30 }
];
const INSECTOS = [
  { id: 'abeja', n: 'Abejas', c: '#f2c230', tam: .00002, base: 140 },
  { id: 'mariposa', n: 'Mariposas', c: '#f08a2c', tam: .00006, base: 40 }
];
const MAX_AVES = 1000, MAX_INS = 600;   // margen para que, si el modelo dice que llegan más aves o abejas, se vean más (hasta ~3×)
const LIM = { x: 2.5, z: 2.15 };

export function setupFauna({ scene, ground, camera, controls, groups, dynamics, years, territorio, invalidate }) {
  // ---------- Hábitats: puntos muestreados de la geometría ----------
  const muestrear = (grupo, cada) => {
    const pts = [], v = new T.Vector3();
    grupo?.traverse(o => {
      const p = o.geometry?.attributes?.position; if (!p || o.isInstancedMesh) return;
      o.updateWorldMatrix(true, false);
      for (let i = 0; i < p.count; i += cada) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); if (Math.abs(v.x) < LIM.x && Math.abs(v.z) < LIM.z) pts.push([v.x, v.z]); }
    });
    return pts;
  };
  const HAB = { agua: muestrear(groups.hydrology, 7), verde: muestrear(groups.parks, 9), mercado: [] };
  for (let i = 0; i < 200; i++) { const a = i * 2.39996, r = .03 + (i % 20) / 20 * .28; HAB.mercado.push([-1.29 + Math.cos(a) * r, 1.16 + Math.sin(a) * r * .8, 'mercado']); }
  if (!HAB.agua.length) HAB.agua.push([-1.604, 1.185], [.16, .5]);
  if (!HAB.verde.length) HAB.verde.push(...HAB.agua);
  let semilla = 7; const rnd = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
  // Desplazamiento: se prefieren los lugares tranquilos y frescos (territorio.habitable). Si el ruido o el calor
  // ocupan un hábitat, las especies lo dejan y se concentran en otros; si no queda ninguno, se van del mapa.
  const vivible = p => !territorio || p[2] === 'mercado' || rnd() < .08 + .92 * territorio.habitable(p[0], p[1]);
  const punto = (hab, cerca, radio = .35) => {
    const L = HAB[hab], tolera = hab === 'mercado';
    for (let k = 0; k < 24; k++) { const p = L[Math.floor(rnd() * L.length)]; if ((!cerca || Math.hypot(p[0] - cerca.x, p[1] - cerca.z) < radio) && (tolera || vivible(p))) return p; }
    for (let k = 0; k < 24; k++) { const p = L[Math.floor(rnd() * L.length)]; if (tolera || vivible(p)) return p; }
    return L[Math.floor(rnd() * L.length)];
  };

  // ---------- Geometrías ----------
  const cuerpoGeo = new T.BoxGeometry(.1, .08, .46);
  const ala = sx => { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute([0, 0, .13, 0, 0, -.12, sx * .52, 0, -.03], 3)); g.computeVertexNormals(); return g; };
  const matAve = new T.MeshLambertMaterial({ color: '#ffffff', side: T.DoubleSide });
  const mk = (geo, n, mat) => { const m = new T.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.count = n; m.instanceMatrix.setUsage(T.DynamicDrawUsage); scene.add(m); return m; };
  const cuerpo = mk(cuerpoGeo, MAX_AVES, matAve), alaD = mk(ala(1), MAX_AVES, matAve), alaI = mk(ala(-1), MAX_AVES, matAve);
  const insGeo = new T.BufferGeometry(); insGeo.setAttribute('position', new T.Float32BufferAttribute([0, 0, .5, -.5, 0, 0, 0, 0, -.5, .5, 0, 0, 0, .25, 0], 3)); insGeo.setIndex([0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4, 0, 3, 2, 0, 2, 1]); insGeo.computeVertexNormals();
  const insectos = mk(insGeo, MAX_INS, new T.MeshBasicMaterial({ color: '#ffffff', side: T.DoubleSide }));

  // ---------- Individuos ----------
  const aves = [], ins = [];
  const reparto = (lista, max, campo) => { const tot = lista.reduce((a, e) => a + e.base * 1.8, 0); return lista.map(e => Math.round(e.base * 1.8 / tot * max)); };
  const cupoA = reparto(ESPECIES, MAX_AVES), cupoI = reparto(INSECTOS, MAX_INS);
  const col = new T.Color();
  ESPECIES.forEach((e, k) => { for (let i = 0; i < cupoA[k]; i++) {
    const [x, z] = punto(e.hab), j = aves.length;
    aves.push({ e, pos: new T.Vector3(x, ground(x, z) + .001, z), dest: new T.Vector3(), vel: new T.Vector3(), estado: 'posado', espera: rnd() * 12, fase: rnd() * 6.28, activo: false, visible: false, grupo: Math.floor(i / 8), ang: rnd() * 6.28, centro: null });
    col.set(e.c).offsetHSL(0, 0, (rnd() - .5) * .08); cuerpo.setColorAt(j, col); alaD.setColorAt(j, col); alaI.setColorAt(j, col);
  } });
  INSECTOS.forEach((e, k) => { for (let i = 0; i < cupoI[k]; i++) {
    const [x, z] = punto('verde'), j = ins.length;
    ins.push({ e, base: new T.Vector3(x, 0, z), pos: new T.Vector3(x, ground(x, z) + .0015, z), fase: rnd() * 100, activo: false });
    col.set(e.id === 'mariposa' && rnd() < .4 ? '#f2f0e6' : e.c); insectos.setColorAt(j, col);
  } });
  [cuerpo, alaD, alaI, insectos].forEach(m => { m.instanceColor.needsUpdate = true; });

  // ---------- Cuántos hay: según el modelo y el momento ----------
  const val = (id, d) => { const el = document.getElementById(id); return el ? +el.value : d; };
  let conteo = {}, factores = {};
  function objetivos() {
    const e = years?.estado || null;
    // Exagerado a propósito: cada 5 % real de cambio se ve como ~17 % más o menos individuos.
    const fx = (k, d) => e && territorio ? territorio.factor(k) : d;
    const aves = fx('aves', 1), H = fx('H', 1), Q = fx('Q', 1), R = e ? e.R / 58 : 1;
    const plagas = fx('plagas', 1), abejas = fx('abejas', 1) * fx('V', 1) ** .5, pm = fx('pm', 1);
    const hora = val('hour', 8) % 24, lluvia = val('rain', 0), viento = val('wind', 10), temp = val('temp', 16);
    const dia = hora >= 6 && hora < 18.5, crep = (hora >= 5 && hora < 6) || (hora >= 18.5 && hora < 19.5);
    const clima = Math.max(.15, 1 - lluvia / 25 - Math.max(0, viento - 20) / 50);   // fracción que vuela
    factores = { e, aves, H, Q, R, plagas, abejas, pm, dia, crep, clima, lluvia, temp };
    return {
      garza: 26 * aves * H ** .8 * Q ** .5, golondrina: 40 * aves * (1 / pm) ** .5 * Q ** .3, copeton: 70 * R * aves,
      paloma: 60 * plagas ** .8, colibri: 14 * abejas * R,
      abeja: dia && temp > 11 && lluvia < 6 ? 140 * abejas * Math.min(1, (temp - 11) / 7) : 0,
      mariposa: dia && temp > 13 && lluvia < 4 ? 40 * abejas * R : 0
    };
  }
  function activar() {
    const obj = objetivos(); conteo = {};
    for (const e of ESPECIES) { const lista = aves.filter(a => a.e === e), n = Math.min(lista.length, Math.round(obj[e.id])); lista.forEach((a, i) => a.activo = i < n); conteo[e.id] = n; }
    for (const e of INSECTOS) { const lista = ins.filter(a => a.e === e), n = Math.min(lista.length, Math.round(obj[e.id])); lista.forEach((a, i) => a.activo = i < n); conteo[e.id] = n; }
    pintarConteo();
  }

  // ---------- Movimiento ----------
  const M = new T.Matrix4(), W = new T.Matrix4(), Rz = new T.Matrix4(), q = new T.Quaternion(), eul = new T.Euler(0, 0, 0, 'YXZ'), sv = new T.Vector3(), CERO = new T.Matrix4().makeScale(0, 0, 0), tmp = new T.Vector3();
  function nuevoDestino(a) {
    const e = a.e, F = factores;
    // Las que sobran se van del mapa y desaparecen al llegar.
    if (!a.activo) { const ang = rnd() * 6.28; a.dest.set(Math.cos(ang) * 3.2, 0, Math.sin(ang) * 2.8); a.dest.y = .05; a.saliendo = true; return; }
    a.saliendo = false;
    const lejos = rnd() < .18, [x, z] = punto(e.hab, lejos ? null : a.pos, .4);
    a.dest.set(x, ground(x, z) + (e.id === 'garza' ? .0004 : .0012), z);
    if (e.circula) a.centro = new T.Vector3(x, 0, z);
    if (e.bandada) { const lider = aves.find(b => b.e === e && b.grupo === a.grupo && b !== a && b.estado === 'vuela'); if (lider && rnd() < .8) a.dest.copy(lider.dest).add(tmp.set((rnd() - .5) * .02, 0, (rnd() - .5) * .02)); }
    a.crucero = e.alt[0] + rnd() * (e.alt[1] - e.alt[0]);
  }
  function update(now, dt) {
    if (!dt || dynamics?.state?.().paused) return;
    dt = Math.min(dt, .1);
    if (!update.t || now - update.t > 1000) { update.t = now; activar(); }
    const F = factores, d = camera.position.distanceTo(controls.target) + camera.position.y * .5;
    const tamMin = .0055 * d;            // ≈ 6 px de envergadura en pantalla
    for (let j = 0; j < aves.length; j++) {
      const a = aves[j], e = a.e;
      if (!a.activo && !a.visible && a.estado === 'posado') { cuerpo.setMatrixAt(j, CERO); alaD.setMatrixAt(j, CERO); alaI.setMatrixAt(j, CERO); continue; }
      if (a.activo && !a.visible) { const [x, z] = punto(e.hab); a.pos.set(x, ground(x, z) + .001, z); a.visible = true; a.estado = 'posado'; a.espera = rnd() * 4; }
      const s = Math.max(e.env, tamMin * (e.env / .0014) ** .35);
      let flap = 0, yaw = a.ang, pitch = 0;
      if (a.estado === 'posado') {
        a.espera -= dt;
        // Si su sitio se volvió ruidoso o caliente, se va a otro (desplazamiento).
        if (a.activo && territorio && e.hab !== 'mercado' && rnd() < dt * .4 && territorio.habitable(a.pos.x, a.pos.z) < .35) a.espera = 0;
        // De noche, con lluvia o viento fuerte se quedan posadas más tiempo.
        const vuela = (F.dia || (F.crep && rnd() < .5)) && rnd() < F.clima;
        if ((a.espera <= 0 && vuela) || !a.activo) { nuevoDestino(a); a.estado = 'vuela'; }
        flap = .15 * Math.sin(now / 900 + a.fase);
        if (a.espera <= 0 && !vuela) a.espera = 3 + rnd() * 6;
      } else {
        // Vuelo: subir a crucero, avanzar al destino, bajar al final. Las golondrinas giran en círculos.
        let objetivo = a.dest;
        if (e.circula && a.centro && a.activo) { a.ang += dt * .9; objetivo = tmp.set(a.centro.x + Math.cos(a.ang) * .06, a.dest.y, a.centro.z + Math.sin(a.ang) * .06); if (rnd() < dt * .05) { a.estado = 'posado'; a.espera = 4 + rnd() * 8; } }
        const dx = objetivo.x - a.pos.x, dz = objetivo.z - a.pos.z, dist = Math.hypot(dx, dz);
        const suelo = ground(a.pos.x, a.pos.z), alto = dist > .03 ? suelo + a.crucero : objetivo.y;
        const paso = e.vel * dt;
        if (dist < paso && !e.circula) {
          a.pos.copy(objetivo); a.estado = 'posado'; a.espera = 3 + rnd() * 12;
          if (a.saliendo) { a.visible = false; a.saliendo = false; }
        } else {
          a.pos.x += dx / dist * paso; a.pos.z += dz / dist * paso;
          const vy = (alto - a.pos.y); a.pos.y += vy * Math.min(1, dt * 1.6);
          a.pos.y = Math.max(a.pos.y, suelo + .0006);
          yaw = Math.atan2(dx, dz); a.ang = e.circula ? a.ang : yaw; pitch = -Math.max(-.4, Math.min(.4, vy * 30));
          a.fase += dt * e.hz * 6.28;
          flap = (e.id === 'garza' ? .55 : .8) * Math.sin(a.fase) + .1;
        }
        if (Math.abs(a.pos.x) > 3.4 || Math.abs(a.pos.z) > 3) { a.visible = false; a.estado = 'posado'; }
      }
      eul.set(pitch, yaw, 0); q.setFromEuler(eul); sv.setScalar(s);
      M.compose(a.pos, q, sv); cuerpo.setMatrixAt(j, M);
      Rz.makeRotationZ(flap); W.multiplyMatrices(M, Rz); alaD.setMatrixAt(j, W);
      Rz.makeRotationZ(-flap); W.multiplyMatrices(M, Rz); alaI.setMatrixAt(j, W);
    }
    // Insectos: vuelo errático cerca de su flor; las mariposas aletean (escala x).
    const tamI = .0022 * d;
    for (let j = 0; j < ins.length; j++) {
      const b = ins[j];
      if (!b.activo) { insectos.setMatrixAt(j, CERO); continue; }
      b.fase += dt;
      const r = b.e.id === 'abeja' ? .012 : .02, f = b.fase;
      b.pos.set(b.base.x + Math.sin(f * .7 + j) * r + Math.sin(f * 2.3) * r * .3, 0, b.base.z + Math.cos(f * .5 + j * 1.3) * r + Math.cos(f * 2.9) * r * .3);
      b.pos.y = ground(b.pos.x, b.pos.z) + .0012 + Math.abs(Math.sin(f * 1.7)) * .002;
      const s = Math.max(b.e.tam, tamI * (b.e.id === 'abeja' ? .7 : 1.1));
      eul.set(0, f * .7 + j, 0); q.setFromEuler(eul); sv.set(s * (b.e.id === 'mariposa' ? .35 + .65 * Math.abs(Math.sin(f * 14)) : 1), s, s);
      M.compose(b.pos, q, sv); insectos.setMatrixAt(j, M);
    }
    for (const m of [cuerpo, alaD, alaI, insectos]) m.instanceMatrix.needsUpdate = true;
    invalidate();
  }

  // ---------- Panel: conteos en la sección de especies ----------
  let caja = null;
  function pintarConteo() {
    if (!caja) {
      const sec = document.getElementById('bio-bird')?.closest('section'); if (!sec) return;
      caja = document.createElement('div'); caja.id = 'fauna-conteo'; sec.prepend(caja);
      sec.querySelector('h3')?.after(caja);
    }
    const F = factores, nota = [];
    if (!F.dia) nota.push(F.crep ? 'atardecer: empiezan a posarse' : 'de noche: casi todas posadas');
    if (F.lluvia > 6) nota.push('llueve: vuelan menos');
    if (F.e) nota.push(`según la simulación (${Math.round(F.e.aves)} especies de aves, agua ${Math.round(F.e.Q)}/100, plagas ${Math.round(F.e.plagas)} %)`);
    caja.innerHTML = `<div class="fc-grid">${[...ESPECIES, ...INSECTOS].map(e => `<span><i style="background:${e.c}"></i>${e.n}<b>${conteo[e.id] ?? 0}</b></span>`).join('')}</div>
      <p class="help">${nota.join(' · ') || 'Estado actual. Al simular los años, la cantidad sigue al humedal, el agua, el refugio, las plagas y las abejas.'}</p>`;
  }

  // Los cuadrados de "puntos de especies" y las aves/insectos diminutos anteriores se apagan.
  const apagar = id => { const el = document.getElementById(id); if (el && el.checked) { el.checked = false; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } };
  apagar('species-dots'); apagar('bio-bird'); apagar('bio-insect');
  setTimeout(() => { apagar('species-dots'); apagar('bio-bird'); apagar('bio-insect'); activar(); }, 1500);
  return { update, get conteo() { return conteo; } };
}
