// Vista doble: el 3D conserva sus colores territoriales y, al mismo tiempo, un panel muestra la
// PLANTA con la paleta de análisis (fondo oscuro, red vial luminosa y estados verde/ámbar/rojo).
// Se usa el mismo renderizador y la misma escena: antes de dibujar la planta se cambian los colores
// de los materiales y se restauran después. No modifica geometría, agentes ni cálculos.
import * as T from 'three';

const ANALISIS = {
  terrain:    { color: '#0a0c0c' },
  Buildings:  { color: '#2b3032' },
  roads:      { color: '#1e1609', emissive: '#d9a24a', intensity: .32 },
  sidewalks:  { color: '#151818' },
  parks:      { color: '#0e2a14', emissive: '#2f9e4f', intensity: .22 },
  hydrology:  { color: '#0b302b', emissive: '#1f7a6c', intensity: .38 },
  boundary:   { color: '#f5c46b' }
};
const FONDO = new T.Color('#050606');
const MODELO = { x: 2.576, z: 2.234 };
const CENTRO = { x: -1.0, z: .95 };   // Corabastos, María Paz y La Vaca
const LUGARES = [['Corabastos', -1.29, 1.16], ['María Paz', -.88, .57], ['La Vaca', -1.604, 1.185], ['El Burro', .1597, .5031], ['Techo', 1.159, .244]];
const TAMANOS = { s: 26, m: 36, l: 48 };   // ancho del panel en % de la ventana

export function setupPlanView({ scene, renderer, groups, hemisphere, sun, camera, controls, invalidate, flyTo, ground }) {
  // Materiales de la escena base con su color original y el de análisis.
  const mats = [];
  for (const [key, group] of Object.entries(groups)) {
    if (key === 'trees') continue;          // los árboles no se dibujan en planta
    group.traverse(o => {
      const list = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of list) {
        if (!m.color || mats.some(x => x.m === m)) continue;
        const a = ANALISIS[key] || { color: '#1a1d1e' };
        mats.push({ m, base: m.color.clone(), baseEm: m.emissive?.clone(), baseEmI: m.emissiveIntensity ?? 0,
          dark: new T.Color(a.color), em: new T.Color(a.emissive || '#000'), emI: a.intensity || 0 });
      }
    });
  }
  const paint = on => {
    for (const x of mats) {
      x.m.color.copy(on ? (x.m.userData.tinte ? x.m.userData.tinte.clone().multiplyScalar(.6) : x.dark) : (x.m.userData.tinte || x.base));
      if (x.m.emissive) { x.m.emissive.copy(on ? x.em : x.baseEm); x.m.emissiveIntensity = on ? (x.m.userData.tinte ? 0 : x.emI) : x.baseEmI; }
    }
  };

  // ---- Panel ----
  const panel = document.createElement('section');
  panel.id = 'plan-view';
  panel.innerHTML = `<header><b>Planta</b><span class="plan-legend"><i class="lg-ok"></i>fluye <i class="lg-warn"></i>lento <i class="lg-bad"></i>detenido</span>
    <span class="plan-tools"><button data-size="s" title="Planta pequeña">−</button><button data-size="m" title="Planta mediana">▢</button><button data-size="l" title="Planta grande">+</button><button data-act="fit" title="Ver todo el polígono">⤢</button><button data-act="hide" title="Ocultar planta">×</button></span></header>
    <div id="plan-area" title="Clic: llevar el 3D a ese punto · Rueda: acercar · Arrastrar: mover"></div>`;
  document.body.append(panel);
  const area = panel.querySelector('#plan-area');
  const reopen = document.createElement('button'); reopen.id = 'plan-open'; reopen.textContent = 'Mostrar planta'; reopen.hidden = true; document.body.append(reopen);
  const labels = LUGARES.map(([name, x, z]) => { const d = document.createElement('div'); d.className = 'plan-label'; d.textContent = name; area.append(d); return { d, x, z }; });

  let size = 'm', hidden = false;
  const setSize = s => { size = s; panel.style.setProperty('--plan-w', TAMANOS[s] + 'vw'); panel.querySelectorAll('[data-size]').forEach(b => b.classList.toggle('active', b.dataset.size === s)); invalidate(); };
  panel.querySelectorAll('[data-size]').forEach(b => b.onclick = () => setSize(b.dataset.size));
  panel.querySelector('[data-act=hide]').onclick = () => { hidden = true; panel.hidden = true; reopen.hidden = false; invalidate(); };
  reopen.onclick = () => { hidden = false; panel.hidden = false; reopen.hidden = true; invalidate(); };
  const encuadre = () => { cam.position.x = CENTRO.x; cam.position.z = CENTRO.z; zoom = 1; invalidate(); };
  panel.querySelector('[data-act=fit]').onclick = encuadre;
  setSize('m');

  // ---- Cámara cenital ----
  // Teleobjetivo (8°) en vez de ortográfica: el renderizador usa profundidad logarítmica, que no
  // funciona con cámaras ortográficas. A esta distancia la deformación de perspectiva es mínima.
  const FOV = 8, TAN = Math.tan(FOV / 2 * Math.PI / 180);
  const cam = new T.PerspectiveCamera(FOV, 1, .5, 150);
  cam.up.set(0, 0, -1); cam.position.set(CENTRO.x, 40, CENTRO.z); cam.lookAt(CENTRO.x, 0, CENTRO.z);
  let zoom = 1, halfH = MODELO.z, extras = null;
  const ground0 = new T.Plane(new T.Vector3(0, 1, 0), 0), rc = new T.Raycaster(), hp = new T.Vector3();

  // Huella de lo que ve el 3D, dibujada solo en la planta.
  const foot = new T.Line(new T.BufferGeometry().setFromPoints(Array.from({ length: 5 }, () => new T.Vector3())),
    new T.LineBasicMaterial({ color: '#ffffff', depthTest: false, transparent: true, opacity: .9, toneMapped: false }));
  foot.renderOrder = 10; foot.visible = false; foot.frustumCulled = false; scene.add(foot);
  const ndc = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]], ray = new T.Raycaster(), plane = new T.Plane(new T.Vector3(0, 1, 0), 0), hit = new T.Vector3();
  function footprint() {
    const p = foot.geometry.attributes.position;
    ndc.forEach(([x, y], i) => {
      // Con dos vistas, el 3D ocupa solo su recuadro: las esquinas se toman de ese recuadro.
      const g = window.vista3D?.region; if (g) { x = ((x < 0 ? g.x0 : g.x1) / innerWidth) * 2 - 1; y = 1 - ((y < 0 ? g.y1 : g.y0) / innerHeight) * 2; }
      ray.setFromCamera(new T.Vector2(x, y * .98), camera);
      let q = ray.ray.intersectPlane(plane, hit);
      if (!q || q.distanceTo(camera.position) > 8) { // rayo al horizonte: se limita a 8 unidades
        const d = ray.ray.direction.clone(); d.y = Math.min(d.y, -.05); q = camera.position.clone().addScaledVector(d.normalize(), 8); q.y = 0;
      }
      p.setXYZ(i, q.x, .02, q.z);
    });
    p.needsUpdate = true;
  }

  // ---- Interacción en la planta ----
  let drag = null;
  const toWorld = e => {
    const r = area.getBoundingClientRect();
    rc.setFromCamera(new T.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), cam);
    const p = rc.ray.intersectPlane(ground0, hp) || cam.position;
    return { x: p.x, z: p.z };
  };
  const place = () => { cam.position.y = halfH / (TAN * zoom); cam.lookAt(cam.position.x, 0, cam.position.z); cam.updateMatrixWorld(); };
  area.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, moved: false }; area.setPointerCapture(e.pointerId); });
  area.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 3) drag.moved = true;
    if (!drag.moved) return;
    const r = area.getBoundingClientRect(), wpp = 2 * halfH / zoom / r.height;
    cam.position.x -= dx * wpp; cam.position.z -= dy * wpp; drag.x = e.clientX; drag.y = e.clientY; invalidate();
  });
  area.addEventListener('pointerup', e => {
    if (drag && !drag.moved) {
      const w = toWorld(e), y = ground(w.x, w.z);
      const off = camera.position.clone().sub(controls.target);
      flyTo(new T.Vector3(w.x, y, w.z).add(off), new T.Vector3(w.x, y, w.z));
    }
    drag = null;
  });
  area.addEventListener('wheel', e => {
    e.preventDefault();
    const before = toWorld(e);
    zoom = Math.max(.35, Math.min(14, zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); place();
    const after = toWorld(e);
    cam.position.x += before.x - after.x; cam.position.z += before.z - after.z; invalidate();
  }, { passive: false });
  area.addEventListener('contextmenu', e => e.preventDefault());

  // ---- Todo lo que se mueve en el 3D, también en planta ----
  // Vehículos, personas, camiones de obra y fauna son InstancedMesh: en planta medirían menos de un píxel,
  // así que se dibujan como puntos de tamaño fijo con el color de cada tipo, en la misma posición y al mismo tiempo.
  const MAXP = 20000, pPos = new Float32Array(MAXP * 3), pCol = new Float32Array(MAXP * 3);
  const pGeo = new T.BufferGeometry(); pGeo.setAttribute('position', new T.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new T.BufferAttribute(pCol, 3));
  const puntos = new T.Points(pGeo, new T.PointsMaterial({ size: 4, sizeAttenuation: false, vertexColors: true, depthTest: false, transparent: true, toneMapped: false }));
  puntos.frustumCulled = false; puntos.renderOrder = 12; puntos.visible = false; scene.add(puntos);
  const vistos = new Map(); let ultimoBarrido = 0, moviles = [];
  const brillo = c => { const k = new T.Color(c); const hsl = {}; k.getHSL(hsl); return k.setHSL(hsl.h, Math.min(1, hsl.s * 1.2 + .1), Math.max(.55, hsl.l)); };
  function barrer(now) {
    // Cada 1,5 s se revisa qué instancias cambiaron (se mueven); lo estático (árboles, mobiliario) no se dibuja.
    if (now - ultimoBarrido < 1500 && moviles.length) return;
    ultimoBarrido = now; const lista = [];
    scene.traverse(o => {
      if (!o.isInstancedMesh || o === puntos) return;
      const v = o.instanceMatrix.version, prev = vistos.get(o);
      if (prev && (v !== prev.v || now - prev.t < 4000)) lista.push(o);
      if (!prev || v !== prev.v) vistos.set(o, { v, t: prev && v !== prev.v ? now : (prev?.t ?? -1e9) });
    });
    moviles = lista;
  }
  const mw = new T.Matrix4(), mi = new T.Matrix4(), pv = new T.Vector3();
  function llenarPuntos(now) {
    barrer(now); let n = 0;
    for (const o of moviles) {
      if (!o.visible || !o.count) continue;
      let vis = true; o.traverseAncestors(a => { if (!a.visible) vis = false; }); if (!vis) continue;
      o.updateWorldMatrix(true, false); const col = brillo(o.material.color || '#ffffff');
      for (let i = 0; i < o.count && n < MAXP; i++) {
        o.getMatrixAt(i, mi); pv.setFromMatrixPosition(mi).applyMatrix4(o.matrixWorld);
        pPos[n * 3] = pv.x; pPos[n * 3 + 1] = pv.y + .01; pPos[n * 3 + 2] = pv.z;
        pCol[n * 3] = col.r; pCol[n * 3 + 1] = col.g; pCol[n * 3 + 2] = col.b; n++;
      }
    }
    window.simPerf && (window.simPerf.puntosPlanta = n, window.simPerf.movilesPlanta = moviles.length);
    pGeo.setDrawRange(0, n); pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
  }

  // ---- Dibujo ----
  // La planta se dibuja en una textura aparte unas 8 veces por segundo (o al instante si se interactúa),
  // y en cada cuadro solo se copia esa textura al panel: el 3D no paga el costo de dibujar la escena dos veces.
  const rt = new T.WebGLRenderTarget(4, 4, { samples: 4 });
  const quadScene = new T.Scene(), quadCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  quadScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), new T.MeshBasicMaterial({ map: rt.texture, depthTest: false, depthWrite: false })));
  let lastPlan = 0, force = true;
  const urgent = () => { force = true; };
  area.addEventListener('pointermove', urgent); area.addEventListener('wheel', urgent);
  panel.addEventListener('click', urgent);

  function drawPlan(states, r) {
    const pr = renderer.getPixelRatio(), w = Math.max(4, Math.round(r.width * pr)), h = Math.max(4, Math.round(r.height * pr));
    if (rt.width !== w || rt.height !== h) rt.setSize(w, h);
    const aspect = r.width / r.height; halfH = (aspect < 1 ? MODELO.z * .62 : Math.max(MODELO.z, MODELO.x / aspect)) * 1.02;   // vista alta: se llena el alto y se centra en el área del proyecto
    cam.aspect = aspect; cam.updateProjectionMatrix(); place();

    const bg = scene.background.clone(), hemi = hemisphere.intensity, sunI = sun.intensity, treesVis = groups.trees.visible;
    scene.background.copy(FONDO); hemisphere.intensity = 1.05; sun.intensity = .55; groups.trees.visible = false;
    // En planta no se dibujan los puntos de especies ni la lluvia (tapan la lectura de las vías).
    if (states && !extras) { extras = []; scene.traverse(o => { if (o.isSprite || (o.isPoints && o !== puntos && !o.geometry.attributes.color && o.material.size <= 1.5)) extras.push(o); }); }
    const extrasVis = (extras || []).map(o => o.visible); (extras || []).forEach(o => o.visible = false);
    paint(true); states?.show(true); footprint(); foot.visible = true; llenarPuntos(performance.now()); puntos.visible = true;

    window.simTerritorio?.planta(true);
    renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.setRenderTarget(null);
    window.simTerritorio?.planta(false);

    paint(false); states?.show(false); foot.visible = false; puntos.visible = false; (extras || []).forEach((o, i) => o.visible = extrasVis[i]);
    scene.background.copy(bg); hemisphere.intensity = hemi; sun.intensity = sunI; groups.trees.visible = treesVis;
  }

  // Se llama justo después de dibujar el 3D en cada cuadro.
  function render(states, now = performance.now()) {
    if (hidden || panel.hidden) return;
    const r = area.getBoundingClientRect(), c = renderer.domElement.getBoundingClientRect();
    if (r.width < 20 || r.height < 20) return;
    if (force || now - lastPlan > 33) { drawPlan(states, r); lastPlan = now; force = false; }

    const x = r.left - c.left, y = c.bottom - r.bottom;
    renderer.setScissorTest(true); renderer.setScissor(x, y, r.width, r.height); renderer.setViewport(x, y, r.width, r.height);
    renderer.render(quadScene, quadCam);
    renderer.setScissorTest(false); renderer.setViewport(0, 0, c.width, c.height);

    // Etiquetas de lugares y de Corabastos dentro del panel
    const placeLabel = (el, x3, z3, dy = 0) => {
      const p = new T.Vector3(x3, 0, z3).project(cam);
      const inside = Math.abs(p.x) < 1 && Math.abs(p.y) < 1;
      el.hidden = !inside; if (!inside) return;
      el.style.left = (p.x * .5 + .5) * r.width + 'px'; el.style.top = ((-p.y * .5 + .5) * r.height + dy) + 'px';
    };
    for (const l of labels) placeLabel(l.d, l.x, l.z);
    if (states) { const s = states.labelElement(area); placeLabel(s.el, s.x, s.z, -14); }
  }

  return { render, get visible() { return !hidden; } };
}