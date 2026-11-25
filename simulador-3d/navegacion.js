// Navegación estilo SketchUp para la vista aérea:
//   presionar la rueda y arrastrar = orbitar alrededor del punto central
//   clic derecho y arrastrar      = mover (panear) sobre el suelo
//   clic izquierdo y arrastrar     = mirar alrededor girando sobre el propio eje (la cámara no se mueve)
//   girar la rueda / pellizco      = acercar hacia donde apunta el cursor
//   doble clic                     = centrar ese punto
//   Touchpad sin rueda: Shift + arrastrar = orbitar · Ctrl + arrastrar = mover
//   Teclado: flechas = mover · + / − = acercar o alejar
// No toca la vista peatonal (W A S D), que sigue en app.js.
import * as T from 'three';

const LIMITE = { x: 2.575, z: 2.233 };   // rectángulo del modelo
const NADA = -1;                          // OrbitControls ignora botones con acción -1

export function setupNavigation({ camera, controls, renderer, groups, invalidate, isWalking, flyTo, enterWalk }) {
  const el = renderer.domElement;

  controls.mouseButtons = { LEFT: NADA, MIDDLE: T.MOUSE.ROTATE, RIGHT: T.MOUSE.PAN };
  controls.touches = { ONE: T.TOUCH.PAN, TWO: T.TOUCH.DOLLY_ROTATE };
  controls.screenSpacePanning = false;   // panear sobre el plano del suelo
  controls.zoomToCursor = true;          // acercar hacia el cursor
  controls.zoomSpeed = 1.15;
  controls.rotateSpeed = .55;
  controls.panSpeed = 1;
  controls.dampingFactor = .12;
  controls.keyPanSpeed = 0;

  // ---- Clic izquierdo: mirar alrededor (o Shift/Ctrl para orbitar/panear en touchpad) ----
  let look = null;
  el.addEventListener('pointerdown', e => {
    if (isWalking() || e.button !== 0) return;
    if (e.shiftKey) { controls.mouseButtons.LEFT = T.MOUSE.ROTATE; return; }
    if (e.ctrlKey || e.metaKey) { controls.mouseButtons.LEFT = T.MOUSE.PAN; return; }
    controls.mouseButtons.LEFT = NADA;
    look = { x: e.clientX, y: e.clientY, moved: false };
    el.setPointerCapture(e.pointerId);
  }, { capture: true });

  el.addEventListener('pointermove', e => {
    if (!look) return;
    const dx = e.clientX - look.x, dy = e.clientY - look.y;
    look.x = e.clientX; look.y = e.clientY;
    if (!dx && !dy) return;
    look.moved = true;
    // Gira la dirección de mirada alrededor de la posición de la cámara.
    const off = new T.Vector3().subVectors(controls.target, camera.position);
    const s = new T.Spherical().setFromVector3(off);
    s.theta -= dx * .0035;
    s.phi = Math.max(.12, Math.min(Math.PI - .12, s.phi + dy * .0035));
    off.setFromSpherical(s);
    controls.target.copy(camera.position).add(off);
    camera.lookAt(controls.target);
    controls.update(); invalidate();
  });

  const endLook = e => {
    if (!look) return;
    const moved = look.moved; look = null;
    try { el.releasePointerCapture(e.pointerId); } catch {}
    if (!moved) return;
    // El nuevo centro de órbita es el punto del suelo que queda en el centro de la vista.
    const dir = new T.Vector3().subVectors(controls.target, camera.position).normalize();
    if (dir.y < -.02) {
      const t = -camera.position.y / dir.y;
      if (t > 0 && t < 8) controls.target.copy(camera.position).addScaledVector(dir, t);
    }
    controls.update(); invalidate();
  };
  el.addEventListener('pointerup', endLook);
  el.addEventListener('pointercancel', endLook);
  el.addEventListener('contextmenu', e => e.preventDefault());
  // La rueda presionada no debe activar el autodesplazamiento del navegador.
  el.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); });

  // Que la cámara no se salga del territorio.
  controls.addEventListener('change', () => {
    const t = controls.target, cx = Math.max(-LIMITE.x, Math.min(LIMITE.x, t.x)), cz = Math.max(-LIMITE.z, Math.min(LIMITE.z, t.z));
    if (cx !== t.x || cz !== t.z) { camera.position.x += cx - t.x; camera.position.z += cz - t.z; t.x = cx; t.z = cz; }
    if (t.y < 0) t.y = 0;
  });

  // Doble clic: baja a ese punto a la altura de una persona para recorrerlo (también salta a otro punto mientras se camina).
  const ray = new T.Raycaster(), m = new T.Vector2();
  el.addEventListener('dblclick', e => {
    const r = el.getBoundingClientRect();
    m.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(m, camera);
    const hit = ray.intersectObjects([groups.terrain, groups.roads, groups.sidewalks, groups.parks].filter(g => g.visible), true)[0];
    if (hit) enterWalk(hit.point);
  });

  // Teclado (solo en vista aérea y si no se está escribiendo en un control).
  document.addEventListener('keydown', e => {
    if (isWalking() || e.target.closest?.('input,select,textarea')) return;
    const dist = camera.position.distanceTo(controls.target), step = dist * .08;
    const fwd = new T.Vector3().subVectors(controls.target, camera.position).setY(0).normalize(), right = new T.Vector3(-fwd.z, 0, fwd.x);
    let move = null;
    if (e.key === 'ArrowUp') move = fwd.multiplyScalar(step);
    else if (e.key === 'ArrowDown') move = fwd.multiplyScalar(-step);
    else if (e.key === 'ArrowLeft') move = right.multiplyScalar(-step);
    else if (e.key === 'ArrowRight') move = right.multiplyScalar(step);
    if (move) { e.preventDefault(); camera.position.add(move); controls.target.add(move); controls.update(); invalidate(); return; }
    if (e.key === '+' || e.key === '=' || e.key === '-') {
      e.preventDefault();
      const k = e.key === '-' ? 1.25 : .8, off = camera.position.clone().sub(controls.target).multiplyScalar(k);
      if (off.length() >= controls.minDistance && off.length() <= controls.maxDistance) camera.position.copy(controls.target).add(off);
      controls.update(); invalidate();
    }
  });

  // Gestos del touchpad o Ctrl+rueda no deben navegar "atrás" ni hacer zoom a la página.
  el.style.touchAction = 'none';
  el.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });

  // Pestaña "Controles": explica cómo moverse; se abre y cierra con un clic (o la tecla H).
  const tab = document.createElement('div');
  tab.id = 'controls-help';
  tab.innerHTML = `<button id="controls-toggle" aria-expanded="false" title="Ver controles (H)">⌨ Controles</button>
  <div id="controls-card" hidden>
    <h4>Vista aérea</h4>
    <dl>
      <dt>Presionar la rueda + arrastrar</dt><dd>Orbitar alrededor del centro</dd>
      <dt>Clic derecho + arrastrar</dt><dd>Mover el mapa</dd>
      <dt>Clic izquierdo + arrastrar</dt><dd>Mirar alrededor sin moverte</dd>
      <dt>Girar la rueda</dt><dd>Acercar hacia el cursor</dd>
      <dt>Flechas · + / −</dt><dd>Mover · acercar o alejar</dd>
      <dt>Touchpad</dt><dd>Shift + arrastrar orbita · Ctrl + arrastrar mueve</dd>
    </dl>
    <h4>Recorrido (como Enscape)</h4>
    <dl>
      <dt>Doble clic en una zona</dt><dd>Bajar ahí a la altura de una persona</dd>
      <dt>Flechas o W A S D</dt><dd>Caminar</dd>
      <dt>Arrastrar con el mouse</dt><dd>Mirar alrededor</dd>
      <dt>Espacio</dt><dd>Cambiar entre caminar y volar</dd>
      <dt>Q / E</dt><dd>Bajar / subir (volando)</dd>
      <dt>Shift</dt><dd>Ir más rápido</dd>
      <dt>Doble clic (caminando)</dt><dd>Saltar a otro punto</dd>
      <dt>Presionar la rueda</dt><dd>Sale del recorrido y orbita desde donde estás</dd>
      <dt>Esc</dt><dd>Volver a la vista aérea</dd>
    </dl>
    <p>En la planta: clic lleva el 3D a ese punto · rueda acerca · arrastrar mueve.</p>
  </div>`;
  document.body.append(tab);
  const btn = tab.querySelector('#controls-toggle'), card = tab.querySelector('#controls-card');
  const toggle = open => { card.hidden = !(open ?? card.hidden); btn.setAttribute('aria-expanded', String(!card.hidden)); btn.classList.toggle('active', !card.hidden); };
  btn.onclick = () => toggle();
  document.addEventListener('keydown', e => { if (e.key?.toLowerCase() === 'h' && !e.target.closest?.('input,select,textarea')) toggle(); });
}
