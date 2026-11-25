// Modos de vista sobre la misma escena 3D: Realista (colores territoriales),
// Análisis (fondo oscuro, red vial luminosa) y Planta (Análisis con cámara cenital).
// Solo cambia la representación: no modifica geometría, agentes ni cálculos.
import * as T from 'three';

// Colores del modo Análisis por capa. emissive = brillo propio, independiente de la luz del día.
const ANALISIS = {
  terrain:    { color: '#0a0c0c' },
  Buildings:  { color: '#2b3032' },
  roads:      { color: '#1e1609', emissive: '#d9a24a', intensity: .32 },
  sidewalks:  { color: '#151818' },
  parks:      { color: '#0e2a14', emissive: '#2f9e4f', intensity: .22 },
  hydrology:  { color: '#0b302b', emissive: '#1f7a6c', intensity: .38 },
  trees:      { color: '#2f6a3e' },
  boundary:   { color: '#f5c46b' }
};
const FONDO_ANALISIS = new T.Color('#050606');
const MODOS = [
  ['realista', 'Realista', 'Colores del territorio con luz de día y noche'],
  ['analisis', 'Análisis', 'Fondo oscuro y red vial luminosa para leer lo que pasa'],
  ['planta', 'Planta', 'Análisis visto desde arriba, como un plano']
];

export function setupViews({ scene, groups, hemisphere, sun, invalidate, flyTo, planView }) {
  // Guarda los colores originales de cada material para poder volver a Realista.
  const mats = [];
  for (const [key, group] of Object.entries(groups)) {
    group.traverse(o => {
      const list = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of list) {
        if (!m.color || mats.some(x => x.m === m)) continue;
        const a = ANALISIS[key] || { color: '#1a1d1e' };
        mats.push({
          m,
          base: m.color.clone(),
          baseEm: m.emissive ? m.emissive.clone() : null,
          baseEmI: m.emissiveIntensity ?? 0,
          dark: new T.Color(key === 'trees' && o.isInstancedMesh && o.geometry.type === 'CylinderGeometry' ? '#2a241c' : a.color),
          em: new T.Color(a.emissive || '#000000'),
          emI: a.intensity || 0
        });
      }
    });
  }

  let mode = 'realista', t = 0, target = 0, last = performance.now();
  const bg = new T.Color(), tmp = new T.Color();
  let day = null, out = null;

  // Selector visible sobre la escena
  const bar = document.createElement('nav');
  bar.id = 'view-modes';
  bar.setAttribute('aria-label', 'Modo de vista');
  bar.innerHTML = MODOS.map(([id, name, tip]) => `<button data-mode="${id}" title="${tip}">${name}</button>`).join('') +
    `<span id="view-legend" hidden title="Velocidad media de los vehículos en cada tramo"><i class="lg-ok"></i>fluye &gt;20 km/h <i class="lg-warn"></i>lento 8–20 <i class="lg-bad"></i>detenido &lt;8</span>`;
  document.body.append(bar);
  bar.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => set(b.dataset.mode));

  function set(next) {
    mode = next;
    target = next === 'realista' ? 0 : 1;
    document.body.dataset.viewMode = next;
    bar.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === next));
    bar.querySelector('#view-legend').hidden = next === 'realista';
    if (next === 'planta') planView();
    invalidate();
  }

  function apply(k) {
    for (const x of mats) {
      x.m.color.copy(x.base).lerp(x.dark, k);
      if (x.m.emissive) {
        tmp.copy(x.baseEm || tmp.set(0)).lerp(x.em, k);
        x.m.emissive.copy(tmp);
        x.m.emissiveIntensity = x.baseEmI + (x.emI - x.baseEmI) * k;
      }
    }
  }

  // Se llama en cada cuadro DESPUÉS de la dinámica, que fija la luz del día y el fondo.
  function update(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (t !== target) {
      t = target > t ? Math.min(target, t + dt / .8) : Math.max(target, t - dt / .8);
      const k = t * t * (3 - 2 * t);
      apply(k);
      invalidate();
    }
    // El ciclo día/noche reescribe fondo y luces cada cuadro, salvo en pausa.
    // Si no los reescribió, se parte de los últimos valores de día guardados.
    if (!out || !scene.background.equals(out.bg) || hemisphere.intensity !== out.hemi || sun.intensity !== out.sun)
      day = { bg: scene.background.clone(), hemi: hemisphere.intensity, sun: sun.intensity };
    if (t > 0) {
      const k = t * t * (3 - 2 * t);
      bg.copy(day.bg).lerp(FONDO_ANALISIS, k);
      scene.background.copy(bg);
      // Luz suficiente para leer volúmenes oscuros y agentes sin perder el contraste.
      hemisphere.intensity = day.hemi + (1.05 - day.hemi) * k;
      sun.intensity = day.sun + (.55 - day.sun) * k;
      out = { bg: scene.background.clone(), hemi: hemisphere.intensity, sun: sun.intensity };
    } else if (out) {
      scene.background.copy(day.bg); hemisphere.intensity = day.hemi; sun.intensity = day.sun;
      out = null; invalidate();
    }
  }

  // ?vista=analisis | planta abre directamente en ese modo (útil para compartir o presentar).
  const pedido = new URLSearchParams(location.search).get('vista');
  set(MODOS.some(([id]) => id === pedido) ? pedido : 'realista');
  return { update, set, get mode() { return mode; }, get amount() { return t * t * (3 - 2 * t); } };
}
