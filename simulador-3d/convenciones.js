// TABLA DE CONVENCIONES: qué significa cada color de las vistas (planta, 3D y señales).
// Vive en la barra lateral izquierda, debajo del reloj; se puede plegar. Tres pestañas para que sea corta.
const SW = (c, t) => `<li><i style="background:${c}"></i><span>${t}</span></li>`;
const GRAD = (cs, t) => `<li><i style="background:linear-gradient(90deg,${cs.join(',')})"></i><span>${t}</span></li>`;

const PESTANAS = {
  planta: {
    n: 'Planta',
    html: `<h6>Siempre</h6><ul>
      ${SW('#3dff7a', 'Vía que fluye')}${SW('#ff9f1c', 'Vía lenta')}${SW('#ff2b2b', 'Vía detenida (trancón)')}${SW('#f5c46b', 'Vía aún sin datos · borde del polígono')}
      ${SW('#2b3032', 'Edificios')}${SW('#2f9e4f', 'Parques y zonas verdes')}${SW('#1f7a6c', 'Humedales y sistema hídrico')}
      <li><i class="puntos"></i><span>Puntos: personas, vehículos y animales en movimiento</span></li>
      <li><i class="marco"></i><span>Recuadro blanco: lo que se ve en la vista 3D</span></li></ul>
      <h6>Mientras se simulan los años</h6><ul>
      ${GRAD(['#0d1f73', '#f2d91a', '#ff5a05', '#d90505'], 'Edificios: isla de calor (azul fresco → rojo muy caliente)')}
      ${SW('#8a2be2', 'Mancha y muros morados: ruido sobre 55 dB (más alto el muro, más ruido)')}
      ${GRAD(['#e68c0d', '#ff4d05', '#cc0505'], 'Vías naranja → rojo: se pierde movilidad')}</ul>`
  },
  tres: {
    n: '3D',
    html: `<h6>Agua del humedal</h6><ul>
      ${GRAD(['#1f7a6c', '#4f6b12', '#4a2e10', '#0a0a08'], 'Limpia → algas → sucia → sin oxígeno')}
      ${SW('#c9bfa8', 'Puntos claros: basura flotando')}${SW('#8a6a3c', 'Barro en la orilla: el humedal se seca')}
      ${SW('#2a8a78', 'Agua sobre la ronda: el humedal se llena')}${SW('#2f5f7a', 'Agua azul gris en las calles: inundación')}</ul>
      <h6>Verde y aire</h6><ul>
      ${SW('#8a6a20', 'Pasto ocre, árboles amarillos o cafés: la vegetación se seca')}${SW('#3fa83a', 'Verde más intenso: reverdece')}
      ${GRAD(['#d9407f', '#f2cc30'], 'Puntos rosados y amarillos: flores (hay abejas)')}${SW('#8a7659', 'Neblina café: aire contaminado')}</ul>
      <h6>Ciudad</h6><ul>
      ${SW('#6e5c49', 'Montones grises y cafés: basura sin recoger')}${SW('#1b1a16', 'Nube de puntos negros: moscas (plagas)')}
      ${SW('#b5654a', 'Casas terracota en la ronda: invasión')}${SW('#5a5650', 'Humo gris y suelo negro: incendio')}
      ${GRAD(['#ff9f1c', '#ff2b2b'], 'Franjas ámbar / rojas en las avenidas: tráfico lento / detenido')}</ul>
      <h6>Fauna</h6><ul class="fauna">
      ${SW('#f4f4ee', 'Garzas')}${SW('#2c3550', 'Golondrinas')}${SW('#8a6a4a', 'Copetones')}${SW('#8d95a3', 'Palomas')}${SW('#2fae6a', 'Colibríes')}${SW('#f2c230', 'Abejas')}${SW('#f08a2c', 'Mariposas')}</ul>`
  },
  senales: {
    n: 'Señales',
    html: `<h6>Anillos y etiquetas en el mapa</h6><ul>
      ${SW('#3dff7a', '▲ Mejora un indicador')}${SW('#ff3b2f', '▼ Empeora un indicador')}${SW('#ffc23d', 'Evento (paro, incendio, vertimiento…)')}</ul>
      <h6>Indicadores del panel</h6><ul>
      ${SW('#3dff7a', 'Bien')}${SW('#ffb347', 'Alerta temprana: cruzó el umbral naranja')}${SW('#ff7a59', 'Falla localizada: cruzó el límite ☠ (cuenta meses)')}${SW('#ff3b3b', 'Condición crítica: game over')}</ul>
      <h6>Gráficas</h6><ul>
      ${SW('#9aa7b4', 'Sin intervenir (A)')}${SW('#f5c46b', 'Con propuesta (B)')}
      <li><i class="linea" style="border-color:#ff9f1c"></i><span>Umbral de alerta</span></li><li><i class="linea" style="border-color:#ff2b2b"></i><span>Límite de falla (game over)</span></li></ul>
      <h6>Corabastos (barras)</h6><ul>
      ${GRAD(['#3dff7a', '#ff9f1c', '#ff2b2b'], 'Cola de camiones: corta → larga')}${SW('#f5c46b', 'Camiones descargando')}${SW('#ff9f1c', 'Residuos')}</ul>
      <p>Los lentes (Calor, Ruido, Vida, Agua, Movilidad, Aire) dejan en gris todo lo demás y muestran solo ese indicador.</p>`
  }
};

export function setupConvenciones() {
  const el = document.createElement('details'); el.id = 'convenciones'; el.open = true;
  el.innerHTML = `<summary>Convenciones <small>qué significa cada color</small></summary>
    <div class="cv-tabs">${Object.entries(PESTANAS).map(([k, p], i) => `<button data-cv="${k}" class="${i ? '' : 'active'}">${p.n}</button>`).join('')}</div>
    <div class="cv-body">${PESTANAS.planta.html}</div>`;
  el.querySelectorAll('[data-cv]').forEach(b => b.onclick = () => {
    el.querySelectorAll('[data-cv]').forEach(x => x.classList.toggle('active', x === b));
    el.querySelector('.cv-body').innerHTML = PESTANAS[b.dataset.cv].html;
  });
  // Debajo del reloj en la barra izquierda (o al final si la barra todavía no existe).
  const poner = () => {
    const barra = document.getElementById('sidebar-left'), hud = document.getElementById('sim-hud');
    if (!barra) return false;
    if (hud && hud.parentElement === barra) hud.after(el); else barra.append(el);
    return true;
  };
  if (!poner()) setTimeout(poner, 1500);
  return el;
}
