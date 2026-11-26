// Reorganiza el panel "Simular" del estado actual:
//  - Escenarios en el tiempo (botones; se activarán cuando se defina la propuesta).
//  - Sliders solo para lo que manda: TIEMPO (día, hora, ritmo) y CLIMA.
//  - Lo que depende de ellos (carros, peatones, camiones, cola, residuos…) se muestra como DATO, no como slider.
//  - Supuestos del estado actual y visualización quedan plegados, por si se necesitan.
// Mueve los elementos existentes (no los recrea), así conservan su conexión con la simulación.
import { modes } from './behavior56.mjs?v=61';

const $ = id => document.getElementById(id);
const fila = id => $(id)?.closest('label');           // cada slider vive dentro de su <label>

export function setupPanel() {
  const root = $('dynamics'); if (!root || root.dataset.organized) return;
  root.dataset.organized = '1';
  const sec = (title, cls = '') => { const s = document.createElement('section'); s.className = 'sim-sec ' + cls; if (title) s.innerHTML = `<h3>${title}</h3>`; return s; };
  const plegable = (title, note) => { const d = document.createElement('details'); d.className = 'sim-sec'; d.innerHTML = `<summary>${title}</summary>${note ? `<p class="help">${note}</p>` : ''}`; return d; };

  // 1 · Simular los años: un solo botón. Antes de pulsarlo, todo es el estado actual y se exploran las variables.
  const esc = sec('Simular los años', 'sim-scenarios');
  esc.innerHTML += `<p class="help" id="scen-help">Ahora ves el <b>estado actual</b>: mueve el tiempo, el clima y las demás variables para explorarlo. Antes de simular ajusta las condiciones de partida (también las de la obra, que deciden cuánto dura). Al pulsar <b>Simular</b> los años corren solos, un mes por segundo, de 2026 a 2056; en cualquier momento puedes pulsar <b>Aplicar propuesta</b> y verás la obra durar lo que le corresponda según esas condiciones. Si algo colapsa, hay game over.</p>`;
  // Barra superior del panel derecho: reemplaza las pestañas (Territorio y Comparar A/B se retiran).
  const barra = document.createElement('div'); barra.id = 'sim-barra';
  barra.innerHTML = `<button class="scen-main" data-scen="actual" disabled>▶ Simular</button><button id="btn-aplicar" hidden>🏗 Aplicar propuesta</button><div id="sim-fecha" hidden></div>`;
  const aside = root.closest('aside'); aside?.querySelector('.panel-tabs')?.remove(); aside?.prepend(barra);
  // Se ocultan (no se borran): otros módulos aún leen controles de ahí (capas, nombres, recorrido).
  document.body.classList.add('sin-pestanas');

  // 2 · Tiempo
  const tiempo = sec('Tiempo');
  for (const id of ['day', 'holiday', 'hour', 'day-auto', 'pace']) { const l = fila(id); if (l) tiempo.append(l); }
  const momentos = root.querySelector('[data-scenario]')?.closest('.scenario-buttons');
  if (momentos) { const h = document.createElement('p'); h.className = 'help'; h.textContent = 'Momentos del día'; tiempo.append(h, momentos); }

  // 3 · Clima
  const clima = sec('Clima');
  for (const id of ['rain', 'cloud', 'temp', 'wind']) { const l = fila(id); if (l) clima.append(l); }
  if ($('weather-note')) clima.append($('weather-note'));

  // 4 · Lo que resulta (datos, sin sliders)
  const datos = sec('Lo que pasa ahora · según la hora, el día y el clima', 'sim-data');
  if ($('traffic-status')) datos.append($('traffic-status'));
  if ($('cargo-status')) datos.append($('cargo-status'));
  const lista = document.createElement('div'); lista.className = 'derived-list';
  for (const [k, m] of Object.entries(modes)) {
    const card = $('on-' + k)?.closest('.agent-control'); if (!card) continue;
    const slider = fila('n-' + k); if (slider) { slider.hidden = true; $('n-' + k).dataset.derived = '1'; }
    const ref = document.createElement('small'); ref.className = 'derived-ref'; ref.textContent = `referencia ${m.base.toLocaleString('es')} · varía con la hora, el día y el clima`;
    card.append(ref); lista.append(card);
  }
  datos.append(lista);

  // 5 · Especies y actores (se conservan tal cual, debajo)
  const especies = sec('Especies y vegetación');
  for (const k of ['bird', 'insect', 'ground', 'plant', 'fungus']) { const l = $('bio-' + k)?.closest('label'); if (l) especies.append(l); }
  for (const id of ['species-pick']) { const l = $(id)?.closest('label'); if (l) especies.append(l); }
  if ($('species-detail')) especies.append($('species-detail'));
  const actores = sec('Actores y acciones');
  for (const id of ['actor-pick', 'actor-info']) if ($(id)) actores.append($(id));

  // 6 · Plegables: supuestos del estado actual y visualización
  const sup = plegable('Supuestos del estado actual (avanzado)', 'Valores de referencia con los que funciona hoy el territorio. Normalmente no se cambian: sirven para ensayar sensibilidad.');
  for (const id of ['capacity', 'bays', 'service', 'remove', 'waste-rate', 'drain', 'bio-density', 'flight-height']) { const l = fila(id); if (l) sup.append(l); }
  const vis = plegable('Visualización');
  for (const id of ['species-dots', 'route-show']) { const l = $(id)?.closest('label'); if (l) vis.append(l); }
  const size = fila('size'); if (size) vis.append(size);

  // Reensamblar en orden. Lo que no se movió (títulos y textos viejos) queda al final, dentro de "Reglas".
  const titulo = root.querySelector('h2'), pausa = $('pause-top'), foco = root.querySelector('#focus-market')?.closest('.scenario-buttons');
  const acciones = document.createElement('div'); acciones.className = 'sim-actions';
  for (const id of ['motion-pause', 'reset-cargo']) if ($(id)) acciones.append($(id));
  const reglas = root.querySelector('details');
  const resto = [...root.children].filter(n => ![titulo, pausa, foco, reglas].includes(n));
  // Las notas explicativas viejas se conservan dentro de "Reglas, fuentes y unidades"; los títulos sueltos se quitan.
  for (const n of resto) { if (reglas && n.matches?.('p.help')) reglas.insertBefore(n, reglas.querySelector('summary').nextSibling); else n.remove(); }
  root.append(...[titulo, pausa, esc, tiempo, clima, foco, datos, especies, actores, sup, vis, acciones, reglas].filter(Boolean));
}
