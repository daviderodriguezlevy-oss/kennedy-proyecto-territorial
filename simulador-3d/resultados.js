// RESULTADOS DE LA SIMULACIÓN: al pulsar «Terminar» se muestra, en el espacio de las dos vistas,
// todo lo que arrojó la corrida: gráficas de cada indicador (sin intervenir vs con propuesta),
// el informe de la obra, los game over y conclusiones escritas a partir de los datos.
// Se cierra con «Volver al territorio» y las vistas reaparecen.
const MESN = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const num = (v, d = 0) => (Number.isFinite(v) ? v : 0).toFixed(d).replace('.', ',');
const fecha = (inicio, mes) => `${MESN[mes % 12]} de ${inicio + Math.floor(mes / 12)}`;
const durTexto = meses => { const a = Math.floor(meses / 12), r = meses % 12; return [a ? `${a} año${a > 1 ? 's' : ''}` : '', r ? `${r} mes${r > 1 ? 'es' : ''}` : ''].filter(Boolean).join(' y ') || '0 meses'; };

export function mostrarResultados(d) {
  // d = { INICIO, MESES, A, B, prop, log, goA, goB, IND, condiciones:[[t,v]], informeHTML }
  document.getElementById('resultados')?.remove(); document.getElementById('btn-resultados')?.remove();
  const { INICIO, MESES, A, B, prop, log, goA, goB, IND, GAME_OVER = [], clima, GRUPOS = {}, EVENTOS = {}, bitacora = [], semilla, par = null } = d;
  const ult = A.length - 1, conP = prop.aplicada;
  const finA = A[ult], finB = conP ? B[ult] : null;
  const malo = (v, [a, b], mas) => mas ? v <= b : v >= b;
  const regular = (v, [a, b], mas) => mas ? v < a : v > a;
  const mesesMal = (arr, k, um, mas) => arr.filter(x => malo(x[k], um, mas)).length;

  // ---------- Gráficas ----------
  const W = 320, H = 130;
  function grafica([n, k, u, um, mas, dec]) {
    const vals = [...A, ...(conP ? B : [])].map(x => x[k]);
    let lo = Math.min(...vals, ...um), hi = Math.max(...vals, ...um); if (hi - lo < 1) hi = lo + 1; const pad = (hi - lo) * .12; lo -= pad; hi += pad;
    const span = Math.max(12, A.length), X = i => 30 + i / span * (W - 36), Y = v => H - 18 - (v - lo) / (hi - lo) * (H - 30);   // eje = periodo simulado
    const linea = (arr, col, w) => `<polyline fill="none" stroke="${col}" stroke-width="${w}" points="${arr.map(x => X(x.mes).toFixed(1) + ',' + Y(x[k]).toFixed(1)).join(' ')}"/>`;
    let s = `<svg viewBox="0 0 ${W} ${H}" class="res-svg">`;
    if (conP) s += `<rect x="${X(prop.inicio)}" y="6" width="${X(prop.inicio + prop.dur) - X(prop.inicio)}" height="${H - 24}" fill="#f5c46b" opacity=".08"/><text x="${X(prop.inicio) + 2}" y="15" fill="#f5c46b" font-size="8" opacity=".8">obra</text>`;
    s += `<line x1="30" x2="${W - 6}" y1="${Y(um[1])}" y2="${Y(um[1])}" stroke="#ff2b2b" stroke-dasharray="4 3"/><line x1="30" x2="${W - 6}" y1="${Y(um[0])}" y2="${Y(um[0])}" stroke="#ff9f1c" stroke-dasharray="2 4"/>`;
    for (const v of [lo + pad, hi - pad]) s += `<text x="26" y="${Y(v) + 3}" fill="#8f8877" font-size="8" text-anchor="end">${num(v, dec)}</text>`;
    const paso = span > 180 ? 10 : span > 72 ? 5 : span > 30 ? 2 : 1; for (let a = 0; a * 12 <= span; a += paso) s += `<text x="${X(a * 12)}" y="${H - 5}" fill="#8f8877" font-size="8" text-anchor="middle">${INICIO + a}</text>`;
    s += linea(A, '#9aa7b4', 1.6) + (conP ? linea(B, '#f5c46b', 2.2) : '');
    for (const [go, col] of [[goA, conP ? '#ff6b6b99' : '#ff2b2b'], [conP ? goB : null, '#ff2b2b']]) if (go && go.k === k) s += `<line x1="${X(go.mes)}" x2="${X(go.mes)}" y1="6" y2="${H - 18}" stroke="${col}" stroke-width="2"/><text x="${X(go.mes) + 3}" y="24" fill="${col}" font-size="9">✕ game over</text>`;
    s += '</svg>';
    const vA = finA[k], vB = finB?.[k], dif = conP ? vB - vA : 0, mejor = (dif > 0) === mas;
    const estado = v => malo(v, um, mas) ? 'bad' : regular(v, um, mas) ? 'warn' : 'ok';
    return `<div class="res-graf"><div class="res-gh"><b>${n}</b><span>${u}</span></div>${s}
      <div class="res-fin"><span class="${estado(vA)}">Sin intervenir: <b>${num(vA, dec)}</b></span>${conP ? `<span class="${estado(vB)}">Con propuesta: <b>${num(vB, dec)}</b></span><em class="${Math.abs(dif) < .05 ? '' : mejor ? 'mejor' : 'peor'}">${Math.abs(dif) < .05 ? 'igual' : (dif > 0 ? '+' : '') + num(dif, dec || 1)}</em>` : ''}</div></div>`;
  }

  // ---------- Conclusiones ----------
  const C = [];
  const fin = fecha(INICIO, ult);
  // Duración del territorio
  const goTxt = go => go ? `cae en ${fecha(INICIO, go.mes)} por <b>${go.titulo.toLowerCase()}</b>` : 'no llega a game over';
  if (conP) {
    C.push(`Sin intervenir, el territorio ${goTxt(goA)}; con la propuesta (aplicada en ${fecha(INICIO, prop.inicio)}) ${goTxt(goB)}.`);
    if (goA && (!goB || goB.mes > goA.mes)) C.push(`La propuesta le da al territorio <b>${goB ? durTexto(goB.mes - goA.mes) + ' más' : 'todo el periodo simulado'}</b> antes de colapsar.`);
    else if (goB && (!goA || goB.mes < goA.mes)) C.push(`<b>Ojo:</b> con la propuesta el colapso llega <b>antes</b> que sin intervenir${goB.mes < prop.inicio + prop.dur ? ', y llega durante la obra: la forma de construir pesó más que el proyecto' : ''}.`);
  } else C.push(`Sin intervenir, el territorio ${goTxt(goA)} (simulado hasta ${fin}). No se aplicó la propuesta, así que no hay comparación.`);
  // Indicadores que más cambian
  if (conP) {
    const cambios = IND.map(([n, k, u, um, mas, dec]) => {
      const vA = finA[k], vB = finB[k], base = Math.max(Math.abs(vA), 1), rel = (vB - vA) / base * (mas ? 1 : -1);
      return { n, k, u, dec, vA, vB, rel, mA: mesesMal(A, k, um, mas), mB: mesesMal(B, k, um, mas) };
    });
    const mejoras = cambios.filter(c => c.rel > .05).sort((a, b) => b.rel - a.rel), empeoras = cambios.filter(c => c.rel < -.05).sort((a, b) => a.rel - b.rel);
    if (mejoras.length) C.push(`Lo que más mejora con la propuesta al final del periodo: ${mejoras.slice(0, 4).map(c => `<b>${c.n.toLowerCase()}</b> (${num(c.vA, c.dec)} → ${num(c.vB, c.dec)} ${c.u})`).join(', ')}.`);
    if (empeoras.length) C.push(`Lo que queda peor con la propuesta: ${empeoras.map(c => `<b>${c.n.toLowerCase()}</b> (${num(c.vA, c.dec)} → ${num(c.vB, c.dec)} ${c.u})`).join(', ')}.`);
    const tiempoMal = cambios.filter(c => c.mA !== c.mB).map(c => `${c.n.toLowerCase()}: ${durTexto(c.mA)} en zona roja sin intervenir vs ${durTexto(c.mB)} con propuesta`);
    if (tiempoMal.length) C.push(`Tiempo en zona roja: ${tiempoMal.join(' · ')}.`);
  } else {
    const rojos = IND.filter(([n, k, u, um, mas]) => malo(finA[k], um, mas)).map(i => i[0].toLowerCase());
    if (rojos.length) C.push(`Al final están en rojo: <b>${rojos.join(', ')}</b>.`);
  }
  // Obra
  if (conP && log) {
    const dur = log.fin != null ? log.fin - log.inicio + 1 : null;
    C.push(dur ? `La obra duró <b>${durTexto(dur)}</b> (de ${fecha(INICIO, log.inicio)} a ${fecha(INICIO, log.fin)}), con ${log.mesesLluvia} meses de lluvia.` : `La obra <b>no alcanzó a terminar</b>: llevaba ${durTexto(log.meses)} y estaba al ${Math.round(Math.max(0, B[ult].f) * 100)} %.`);
    const f = log.factores?.lista || [];
    const alarga = f.filter(x => x.d > 0), acorta = f.filter(x => x.d < 0);
    if (alarga.length) C.push(`Lo que más la alargó: ${alarga.slice(0, 3).map(x => `${x.t.toLowerCase()} (+${durTexto(x.d)})`).join(', ')}.`);
    if (acorta.length) C.push(`Lo que la acortó: ${acorta.slice(0, 3).map(x => `${x.t.toLowerCase()} (−${durTexto(-x.d)})`).join(', ')}.`);
    if (log.alHumedal > 0) C.push(`Durante la obra llegaron <b>${Math.round(log.alHumedal).toLocaleString('es')} t de escombros al humedal</b>; el agua pasó de ${num(log.Q0)} a ${num(log.Qmin)} /100 en su peor momento.`);
    else if (log.Q0 - log.Qmin > 3) C.push(`El agua del humedal se ensució durante la obra (de ${num(log.Q0)} a ${num(log.Qmin)} /100) aunque no se tiraron escombros allí: pesaron la basura acumulada y el crecimiento del barrio.`);
    if (log.velMin < 6) C.push(`La movilidad tocó fondo durante la obra (${num(log.velMin, 1)} km/h): los cierres de calles son el punto débil de construir con muchos frentes a la vez.`);
    C.push(`Movimiento de escombros: ${Math.round(log.rcd).toLocaleString('es')} t generadas, ${Math.round(log.aprovechado).toLocaleString('es')} t aprovechadas, ${Math.round(log.viajes).toLocaleString('es')} viajes de volqueta (${Math.round(log.km).toLocaleString('es')} km, ${Math.round(log.km * .9 / 1000).toLocaleString('es')} t de CO₂).`);
  }
  // Qué probar
  const sug = [];
  const go = conP ? goB : goA;
  if (go?.id === 'vias') sug.push('menos frentes de obra simultáneos, pico y placa más estricto o carga de noche');
  if (go?.id === 'agua' || (log && log.alHumedal > 0)) sug.push('llevar los escombros a la planta del predio en vez de junto al humedal y subir la recolección de residuos');
  if (go?.id === 'humedal') sug.push('control de rellenos e invasiones del humedal');
  if (go?.id === 'plagas' || go?.id === 'residuos') sug.push('más recolección y más aprovechamiento de residuos');
  if (go?.id === 'comida') sug.push('aplicar la propuesta antes: los nodos y el mercado nuevo suben la capacidad');
  if (go?.id === 'aves' || go?.id === 'abejas') sug.push('proteger el humedal, obra solo de día y aplicar la propuesta antes (humedal ampliado, huertas y techos verdes)');
  if (go?.id === 'ensordecido') sug.push('carga de noche o pico y placa (menos tráfico), menos frentes de obra y obra solo de día; la ronda con vegetación del humedal ampliado amortigua el ruido');
  if (go?.id === 'corredor') sug.push('control de la ronda del humedal y aplicar la propuesta antes (huertas, techos verdes y parques conectan los parches)');
  if (!conP) sug.push('correr de nuevo y aplicar la propuesta para comparar');
  if (sug.length) C.push(`Para probar en otra corrida: ${[...new Set(sug)].join('; ')}.`);

  // ---------- Cómo quedaron los game over ----------
  // Para cada regla: valor final y peor momento de cada escenario, y qué tan cerca estuvo del límite.
  const IDX = Object.fromEntries(IND.map(i => [i[1], i]));
  function medidor(g) {
    const ind = IDX[g.k]; if (!ind) return '';
    const [n, k, u, um, mas, dec] = ind, lim = g.menor ?? g.mayor;
    const cerca = v => Math.max(0, Math.min(1, mas ? (um[0] - v) / (um[0] - um[1]) : (v - um[0]) / (um[1] - um[0])));
    const fila = (t, arr, go) => {
      const fin = arr[arr.length - 1][k], peor = mas ? Math.min(...arr.map(x => x[k])) : Math.max(...arr.map(x => x[k]));
      const cayo = go && go.id === g.id, r = cerca(peor), rf = cerca(fin);
      const est = cayo ? `<b class="bad">CAYÓ en ${fecha(INICIO, go.mes)}</b>` : r >= .99 ? '<b class="bad">tocó el límite</b>' : r >= .7 ? `<b class="warn">cerca: ${Math.round(r * 100)} % del camino al límite</b>` : r > 0 ? `<b class="ok">lejos (${Math.round(r * 100)} %)</b>` : '<b class="ok">sano</b>';
      return `<div class="gm-f"><span class="gm-t">${t}</span><span class="gm-bar"><s style="width:${(r * 100).toFixed(0)}%" class="peor"></s><s style="width:${(rf * 100).toFixed(0)}%" class="fin"></s></span>
        <span class="gm-v">final <b>${num(fin, dec)}</b> · peor <b>${num(peor, dec)}</b> ${u}</span>${est}</div>`;
    };
    return `<div class="gm"><div class="gm-h"><b>${g.titulo}</b><span>límite: ${g.menor != null ? 'menos de' : 'más de'} ${num(lim)} ${u}${g.meses > 1 ? ` durante ${g.meses} meses` : ''}</span></div>
      ${fila('Sin intervenir', A, goA)}${conP ? fila('Con propuesta', B, goB) : ''}</div>`;
  }
  // ---------- Niveles de cada regla: primer mes de alerta temprana, falla localizada y condición crítica ----------
  function niveles(arr, g) {
    const ind = IDX[g.k]; if (!ind) return [null, null, null];
    const um = ind[3], peor = (v, l) => g.menor != null ? v < l : v > l, lim = g.menor ?? g.mayor;
    let alerta = null, falla = null, critica = null, cuenta = 0;
    for (const x of arr) {
      if (alerta == null && peor(x[g.k], um[0])) alerta = x.mes;
      cuenta = peor(x[g.k], lim) ? cuenta + 1 : 0;
      if (cuenta && falla == null) falla = x.mes;
      if (cuenta >= g.meses) { critica = x.mes; break; }
    }
    return [alerta, falla, critica];
  }
  const celdaNv = (m, cls) => m == null ? '<td class="dim">—</td>' : `<td class="${cls}">${fecha(INICIO, m)}</td>`;
  const filaNv = g => { const a = niveles(A, g), b = conP ? niveles(B, g) : null;
    return `<tr><th>${g.titulo}<small>${IDX[g.k]?.[0] || g.k} ${g.menor != null ? '<' : '>'} ${num(g.menor ?? g.mayor)} · ${g.meses} ${g.meses === 1 ? 'mes' : 'meses'}</small></th>${a.map((m, i) => celdaNv(m, 'nv' + (i + 1))).join('')}${b ? b.map((m, i) => celdaNv(m, 'nv' + (i + 1))).join('') : ''}</tr>`; };
  const tablaNiveles = `<table class="res-nv"><thead><tr><th rowspan="2">Regla</th><th colspan="3">Sin intervenir</th>${conP ? '<th colspan="3">Con propuesta</th>' : ''}</tr>
    <tr>${'<th class="nv1">Alerta temprana</th><th class="nv2">Falla localizada</th><th class="nv3">Condición crítica</th>'.repeat(conP ? 2 : 1)}</tr></thead>
    <tbody>${Object.entries(GRUPOS).map(([gr, n]) => `<tr class="grupo"><td colspan="${conP ? 7 : 4}">${n}</td></tr>` + GAME_OVER.filter(x => x.g === gr).map(filaNv).join('')).join('')}</tbody></table>`;
  const climaTxt = clima ? `Clima del periodo: ${clima.nina} año${clima.nina === 1 ? '' : 's'} de La Niña, ${clima.nino} de El Niño y ${clima.normal} normal${clima.normal === 1 ? '' : 'es'} · ${clima.dias.toLocaleString('es')} días de lluvia en total (${Math.round(clima.mm).toLocaleString('es')} mm) · ${clima.mesesLluvia} meses de temporada fuerte de lluvias.` : '';

  // ---------- Página ----------
  const el = document.createElement('section'); el.id = 'resultados';
  el.innerHTML = `<header class="res-top"><div><small>RESULTADOS DE LA SIMULACIÓN · ${conP ? 'SIN INTERVENIR VS CON PROPUESTA' : 'ESTADO ACTUAL SIN INTERVENIR'}</small>
      ${par ? `<p class="res-par"><b>${par.codigo}</b> ${par.t} · ${par.pregunta}${par.mod ? ' <em>(condiciones modificadas: no es el par guardado)</em>' : ''}</p>` : ''}
      <h1 class="res-tiempo">Pasaron ${durTexto(ult + 1)}</h1>
      <p>De enero de ${INICIO} a ${fin}${conP ? ` · propuesta aplicada en ${fecha(INICIO, prop.inicio)}${log?.fin != null ? ` y construida en ${durTexto(log.fin - log.inicio + 1)}` : ' (obra sin terminar)'}` : ''}</p></div>
      <div class="res-acc"><button id="res-csv">Descargar datos (CSV)</button><button id="res-cerrar">Volver al territorio</button></div></header>
    <div class="res-go">${[['Sin intervenir', goA], ...(conP ? [['Con propuesta', goB]] : [])].map(([t, g]) => `<div class="${g ? 'cae' : 'ok'}"><span>${t}</span><b>${g ? `GAME OVER · ${fecha(INICIO, g.mes)}` : `Game over no alcanzado hasta ${fin}`}</b>${g ? `<em>${g.titulo}${GRUPOS[g.g] ? ` · ${GRUPOS[g.g].toLowerCase()}` : ''}</em><small>${durTexto(g.mes + 1)} desde el inicio${t === 'Con propuesta' && conP ? ` · ${durTexto(Math.max(0, g.mes - prop.inicio))} después de aplicar la propuesta` : ''}</small>` : ''}</div>`).join('')}</div>
    <p class="res-regla"><b>Regla del sistema integrado:</b> la ciudad y el ecosistema simulados caen con la <b>primera</b> de las ${GAME_OVER.length} reglas que se cumpla (${Object.entries(GRUPOS).map(([g, n]) => `${GAME_OVER.filter(x => x.g === g).length} de ${n.toLowerCase()}`).join(' y ')}). La misma regla se usa en los dos escenarios.</p>
    <h3>Niveles de cada regla</h3><p class="res-nota">Primer mes en que cada regla llegó a cada nivel. <b>Alerta temprana</b>: el indicador cruza su umbral naranja. <b>Falla localizada</b>: cruza el límite de game over, pero todavía no se sostiene. <b>Condición crítica</b>: se sostiene los meses que pide la regla (game over). «—» = no llegó.</p>${tablaNiveles}
    <h3>Cómo quedó cada game over al terminar</h3><p class="res-nota">La barra muestra qué tan cerca estuvo del límite (vacía = sano, llena = game over). Clara: peor momento · fuerte: al terminar.</p>${Object.entries(GRUPOS).length ? Object.entries(GRUPOS).map(([g, n]) => `<h4 class="gm-grupo">${n}</h4><div class="gm-grid">${GAME_OVER.filter(x => x.g === g).map(medidor).join('')}</div>`).join('') : `<div class="gm-grid">${GAME_OVER.map(medidor).join('')}</div>`}
    ${climaTxt ? `<p class="res-clima">${climaTxt}${semilla ? ` · Semilla de azar: <b>${semilla}</b> (escríbela en «Condiciones de partida» para repetir esta corrida)` : ''}</p>` : ''}
    ${bitacora.length ? `<h3>Lo que pasó en el territorio</h3><div class="res-ev">${Object.entries(bitacora.reduce((a, e) => (a[e.id] = (a[e.id] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1]).map(([id, n]) => `<span class="${EVENTOS[id]?.malo ? 'malo' : 'bueno'}">${EVENTOS[id]?.t || id}: <b>${n}</b> ${n === 1 ? 'vez' : 'veces'}</span>`).join('')}</div>` : ''}
    <h3>Conclusiones</h3><ul class="res-conc">${C.map(c => `<li>${c}</li>`).join('')}</ul>
    <h3>Indicadores en el tiempo</h3><div class="legend res-ley"><span><i class="sw" style="background:#9aa7b4"></i>sin intervenir</span>${conP ? '<span><i class="sw" style="background:#f5c46b"></i>con propuesta</span><span><i class="sw" style="background:#f5c46b33"></i>periodo de obra</span>' : ''}<span><i class="sw" style="background:#ff9f1c"></i>regular</span><span><i class="sw" style="background:#ff2b2b"></i>falla</span></div>
    <div class="res-grid">${IND.map(grafica).join('')}</div>
    ${d.informeHTML ? `<h3>La obra</h3><div class="res-obra" id="an-obra-info">${d.informeHTML}</div>` : ''}
    <h3>Condiciones de partida de esta corrida</h3><div class="res-cond">${d.condiciones.map(([t, v]) => `<div><span>${t}</span><b>${v}</b></div>`).join('')}</div>
    <p class="obra-aviso">Coeficientes de ensayo, por calibrar con fuentes. Los resultados muestran tendencias y relaciones entre variables, no cifras exactas.</p>`;
  document.body.append(el); document.body.classList.add('con-resultados');
  // «Volver al territorio» oculta los resultados (no los borra): un botón en la barra derecha permite
  // volver a verlos hasta que se inicie una simulación nueva.
  const barra = document.getElementById('sim-barra');
  const volver = document.createElement('button'); volver.id = 'btn-resultados'; volver.textContent = '📊 Volver a los resultados'; volver.hidden = true;
  barra ? barra.append(volver) : document.body.append(volver);
  const ver = on => { el.hidden = !on; volver.hidden = on; document.body.classList.toggle('con-resultados', on); window.vista3D?.proyeccion(); if (on) el.scrollTop = 0; };
  const esc = e => { if (e.key === 'Escape' && !el.hidden) ver(false); };
  document.addEventListener('keydown', esc);
  el.querySelector('#res-cerrar').onclick = () => ver(false);
  volver.onclick = () => ver(true);
  // Una simulación nueva descarta estos resultados.
  const descartar = () => { el.remove(); volver.remove(); document.body.classList.remove('con-resultados'); document.removeEventListener('keydown', esc); window.vista3D?.proyeccion(); };
  document.querySelector('[data-scen=actual]')?.addEventListener('click', descartar, { once: true });
  el.querySelector('#res-csv').onclick = () => {
    const ks = IND.map(i => i[1]), cab = ['mes', 'fecha', ...ks.map(k => k + '_sin'), ...(conP ? ks.map(k => k + '_con') : []), ...(conP ? ['avance_obra'] : [])];
    const filas = A.map((a, i) => [i, fecha(INICIO, i), ...ks.map(k => a[k].toFixed(2)), ...(conP ? ks.map(k => B[i][k].toFixed(2)) : []), ...(conP ? [Math.max(0, B[i].f).toFixed(3)] : [])]);
    const blob = new Blob(['﻿' + [cab, ...filas].map(f => f.join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `simulacion-kennedy-${INICIO}-${INICIO + Math.floor(ult / 12)}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  el.scrollTop = 0;
}
