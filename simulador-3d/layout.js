// Distribución tipo Rhino con dos vistas: PLANTA (izquierda) | 3D (derecha).
// Nada flota encima de las vistas: el resto de la interfaz vive en dos barras laterales.
//   Barra izquierda: título, reloj, propuesta, simulación en el tiempo (indicadores, game over), obra, especies, controles.
//   Barra derecha: el panel de siempre (Territorio / Simular / Comparar A/B).
// Un solo lienzo WebGL cubre la pantalla; el 3D se dibuja solo en su recuadro (scissor) y la cámara
// se descentra (setViewOffset) para que el centro de la vista 3D quede en el centro de su recuadro.
// Así los clics, el doble clic y las etiquetas siguen usando coordenadas de la pantalla completa.
const IZQ = ['header', '#proposal-toggle', '#sim-hud', '#anos-panel', '#obra-panel', '#proposal-card', '#ex-dashboard', '#species-card', '#controls-help'];

export function setupLayout({ camera, renderer, invalidate }) {
  document.body.classList.add('dos-vistas');
  let barra = document.getElementById('sidebar-left');
  if (!barra) { barra = document.createElement('div'); barra.id = 'sidebar-left'; document.body.append(barra); }
  for (const s of IZQ) { const el = document.querySelector(s); if (el && el.parentElement !== barra) barra.append(el); }
  // Los controles se muestran abiertos en la barra (ya no tapan nada).
  const etiqueta3D = document.createElement('div'); etiqueta3D.id = 'vista3d-tag'; etiqueta3D.textContent = '3D'; document.body.append(etiqueta3D);

  let reg = { x0: 0, x1: innerWidth, y0: 0, y1: innerHeight };
  function medir() {
    const p = document.getElementById('plan-view')?.getBoundingClientRect(), a = document.querySelector('body > aside')?.getBoundingClientRect(), f = document.querySelector('footer')?.getBoundingClientRect();
    reg = { x0: p && p.width ? p.right : (barra.getBoundingClientRect().right || 0), x1: a && a.width ? a.left : innerWidth, y0: 0, y1: f && f.height ? f.top : innerHeight };
    etiqueta3D.style.left = reg.x0 + 10 + 'px';
  }
  function proyeccion() {
    medir();
    const W = innerWidth, H = innerHeight, cx = (reg.x0 + reg.x1) / 2, cy = (reg.y0 + reg.y1) / 2;
    const Wv = 2 * Math.max(cx, W - cx), Hv = 2 * Math.max(cy, H - cy);
    camera.aspect = Wv / Hv;
    camera.setViewOffset(Wv, Hv, Wv / 2 - cx, Hv / 2 - cy, W, H);
    camera.updateProjectionMatrix(); invalidate();
  }
  const antes = () => { renderer.setScissorTest(true); renderer.setScissor(reg.x0, innerHeight - reg.y1, reg.x1 - reg.x0, reg.y1 - reg.y0); };
  const despues = () => renderer.setScissorTest(false);
  const dentro = (x, y = reg.y0 + 1) => x >= reg.x0 && x <= reg.x1 && y >= reg.y0 && y <= reg.y1;

  new ResizeObserver(proyeccion).observe(document.body);
  for (const s of ['#plan-view', 'body > aside']) { const el = document.querySelector(s); if (el) new ResizeObserver(proyeccion).observe(el); }
  proyeccion();
  const api = { proyeccion, antes, despues, dentro, get region() { return reg; } };
  window.vista3D = api;
  return api;
}
