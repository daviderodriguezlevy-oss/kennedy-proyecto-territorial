// Recuerda los controles que movió la persona (sliders, casillas y listas) durante la sesión del
// navegador. Si la página se recarga por accidente, se restauran en vez de volver a los valores base.
// "Reiniciar escenario" sigue reiniciando la simulación; "Restaurar valores base" borra lo recordado.
const CLAVE = 'kennedy-sim-controles-v1';

export function setupMemory(rootIds = ['dynamics', 'experiment-panel']) {
  const roots = rootIds.map(id => document.getElementById(id)).filter(Boolean);
  // Los controles "derivados" (p. ej. poblaciones que dependen de la hora) no se recuerdan ni restauran.
  const campos = () => roots.flatMap(r => [...r.querySelectorAll('input[id],select[id]')]).filter(el => !el.dataset.derived);
  let guardado = {};
  try { guardado = JSON.parse(sessionStorage.getItem(CLAVE) || '{}'); } catch { guardado = {}; }

  // Restaurar: primero los valores, después un único evento por campo para que la dinámica se sincronice.
  const tocados = [];
  for (const el of campos()) {
    if (!(el.id in guardado)) continue;
    const v = guardado[el.id];
    if (el.type === 'checkbox') { if (el.checked !== v) { el.checked = v; tocados.push(el); } }
    else if (el.value !== v) { el.value = v; tocados.push(el); }
  }
  for (const el of tocados) el.dispatchEvent(new Event(el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input', { bubbles: true }));
  for (const el of tocados) if (el.type === 'checkbox') el.dispatchEvent(new Event('input', { bubbles: true }));

  const guardar = e => {
    const el = e.target; if (!el.id || el.dataset.derived || !roots.some(r => r.contains(el))) return;
    // La hora y el día avanzan solos con el reloj: no se recuerdan para no congelar la simulación.
    if (['hour', 'day'].includes(el.id)) return;
    guardado[el.id] = el.type === 'checkbox' ? el.checked : el.value;
    try { sessionStorage.setItem(CLAVE, JSON.stringify(guardado)); } catch { /* sin almacenamiento: no pasa nada */ }
  };
  document.addEventListener('input', guardar, true);
  document.addEventListener('change', guardar, true);

  return {
    restaurados: tocados.length,
    olvidar() { guardado = {}; try { sessionStorage.removeItem(CLAVE); } catch {} }
  };
}
