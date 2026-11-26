// SIMULACIÓN EN EL TIEMPO (2026 → 2056), mes a mes.
// Calcula en paralelo dos escenarios con la misma semilla:
//   A · Sin intervenir: crecen demanda, flota y población; la capacidad de Corabastos no cambia.
//   B · Con propuesta: igual que A hasta que se aplica; luego la OBRA avanza a un ritmo que
//       depende de las condiciones de obra (destino de escombros, financiación, frentes,
//       concertación, horario y lluvia). La duración es un RESULTADO, no un dato de entrada.
// Cada mes se revisan las reglas de GAME OVER en los dos escenarios; si el escenario que se está
// viendo cae, los años se detienen y se explica por qué. Puede pasar incluso antes de terminar la obra.
// TODOS LOS COEFICIENTES SON SUPUESTOS DE ENSAYO (por calibrar con fuentes).
import * as T from 'three';
import { mostrarResultados } from './resultados.js?v=5';

const INICIO = 2026, MESES = 30 * 12;
export const SUPUESTOS = {
  demanda: .018,          // crecimiento anual de la demanda de alimento
  flota: .025,            // crecimiento anual de la flota motorizada
  poblacion: .012,        // crecimiento anual de la población
  capActual: 85,          // capacidad de atención de Corabastos hoy (u/día de 100 demandadas en 2026)
  capObraBodegas: .82,    // fracción de capacidad mientras se demuele parte de las bodegas
  capMercadoNuevo: 56, capNodo: 25,
  anoLluvioso: .3,        // probabilidad de año lluvioso (La Niña)
  generacion: .62,        // t de residuos por unidad de demanda atendida al mes (mercado)
  generacionBarrio: 18,   // t/mes del entorno, crece con la población
  retiroActual: 70, retiroPropuesta: 95, aprovechamiento: .2,
  residuos0: 1200, refugio0: 58,
  transporte: 'ninguna',  // 'ninguna' | 'pico' | 'nocturna'
  perdidaRonda: 1.0,      // pérdida anual de refugio por rellenos e invasiones (con control: 0,3)
  // Obra de la propuesta (condicionan cuánto dura)
  escombros: 'planta',    // 'planta' (aprovechamiento en el predio) | 'lejos' (escombrera autorizada) | 'humedal' (relleno informal)
  financiacion: 'mixta',  // 'publica' | 'mixta' | 'app'
  frentes: 2,             // frentes de obra simultáneos
  concertacion: 'media',  // 'baja' | 'media' | 'alta'
  horario: 'diurno'       // 'diurno' | 'extendido'
};
const S = SUPUESTOS;

// Condiciones de partida que se mueven antes de simular.
const CONDICIONES = [
  { g: 'Territorio' },
  { id: 'c-demanda', t: 'Crecimiento de la demanda de comida', k: 'demanda', min: 0, max: 4, step: .1, u: '% al año', esc: 100,
    ayuda: 'Cuánta más comida necesita Bogotá cada año. Presiona la capacidad de Corabastos.' },
  { id: 'c-flota', t: 'Crecimiento de carros y motos', k: 'flota', min: 0, max: 6, step: .1, u: '% al año', esc: 100,
    ayuda: 'Lo que más pesa en la movilidad y el aire. Se ve en la cantidad de vehículos en 3D.' },
  { id: 'c-poblacion', t: 'Crecimiento de la población de Kennedy', k: 'poblacion', min: 0, max: 3, step: .1, u: '% al año', esc: 100,
    ayuda: 'Más peatones, viajes, residuos y aguas servidas.' },
  { id: 'c-clima', t: 'Clima del periodo', k: 'anoLluvioso', sel: [['Seco (más años de El Niño)', .15], ['Normal', .3], ['Húmedo (más años de La Niña)', .55]],
    ayuda: 'Llueve todos los años: temporadas de abril–mayo y octubre–noviembre, secas en diciembre–febrero y julio–agosto. Esto cambia cuántos años son de La Niña (más lluvia: inundaciones, obra más lenta) o de El Niño (sequía: el humedal pierde agua).' },
  { id: 'c-retiro', t: 'Recolección de residuos', k: 'retiroActual', min: 40, max: 100, step: 5, u: 't/mes', esc: 1,
    ayuda: 'Lo que se retira hoy. Si es menor que lo que se genera, se acumula, llegan las plagas y se ensucia el agua.' },
  { id: 'c-aprov', t: 'Aprovechamiento con la propuesta', k: 'aprovechamiento', min: 0, max: 50, step: 5, u: '%', esc: 100,
    ayuda: 'Residuos que la propuesta convierte en compost o materia prima.' },
  { id: 'c-cap', t: 'Capacidad actual de Corabastos', k: 'capActual', min: 60, max: 100, step: 1, u: '% de la demanda 2026', esc: 1,
    ayuda: 'Para ensayar si el mercado está mejor o peor de lo que creemos.' },
  { id: 'c-transporte', t: 'Política de transporte', k: 'transporte', sel: [['Ninguna', 'ninguna'], ['Pico y placa más estricto', 'pico'], ['Carga de noche', 'nocturna']],
    ayuda: 'Pico y placa frena el crecimiento de la flota; la carga nocturna saca camiones de la hora pico.' },
  { id: 'c-humedal', t: 'Protección del humedal', k: 'perdidaRonda', sel: [['Sin control', 1.0], ['Con control de rellenos e invasiones', .3]],
    ayuda: 'Qué tan rápido se pierde la ronda de La Vaca.' },
  { g: 'Obra de la propuesta · de esto depende cuánto dura' },
  { id: 'c-escombros', t: 'A dónde van los escombros y residuos de obra', k: 'escombros', sel: [['Planta de aprovechamiento en el predio', 'planta'], ['Escombrera autorizada lejana', 'lejos'], ['Relleno informal junto al humedal', 'humedal']],
    ayuda: 'En el predio: ritmo normal y casi sin viajes. Lejos: más lento y más camiones en las vías. Junto al humedal: más rápido, pero el agua se ensucia y el humedal se rellena.' },
  { id: 'c-financiacion', t: 'Financiación', k: 'financiacion', sel: [['Pública por vigencias', 'publica'], ['Mixta', 'mixta'], ['Alianza público-privada', 'app']],
    ayuda: 'La pública depende del presupuesto de cada año y avanza más lento.' },
  { id: 'c-frentes', t: 'Frentes de obra al mismo tiempo', k: 'frentes', min: 1, max: 4, step: 1, u: 'frentes', esc: 1,
    ayuda: 'Más frentes terminan antes, pero cierran más calles a la vez y empeoran la movilidad y el aire.' },
  { id: 'c-concertacion', t: 'Concertación con comerciantes y vecinos', k: 'concertacion', sel: [['Baja (paros y bloqueos)', 'baja'], ['Media', 'media'], ['Alta (acuerdos previos)', 'alta']],
    ayuda: 'Sin acuerdos la obra se frena y se pierden más puestos de trabajo durante el traslado.' },
  { id: 'c-horario', t: 'Horario de obra', k: 'horario', sel: [['Solo de día', 'diurno'], ['Día y noche', 'extendido']],
    ayuda: 'De noche avanza más, pero el ruido y la luz espantan a las aves.' }
];
const DEFECTO = Object.fromEntries(CONDICIONES.filter(c => c.k).map(c => [c.k, SUPUESTOS[c.k]]));

// Ritmo de obra (fracción por mes) según las condiciones; la lluvia lo baja.
const BASE_RITMO = 1 / 54;
function ritmo(llueve) {
  const e = { planta: 1, lejos: .8, humedal: 1.15 }[S.escombros], fi = { publica: .7, mixta: 1, app: 1.15 }[S.financiacion];
  const co = { baja: .72, media: .9, alta: 1.05 }[S.concertacion], ho = S.horario === 'extendido' ? 1.25 : 1;
  return BASE_RITMO * e * fi * co * ho * (S.frentes / 2) ** .6 * (llueve ? .6 : 1);
}

// Reglas de game over: condición sostenida durante `meses` seguidos.
const GAME_OVER = [
  { id: 'agua', k: 'Q', menor: 15, meses: 3, titulo: 'El agua del humedal se puso negra',
    porque: 'Residuos, aguas servidas o escombros llegaron al humedal más rápido de lo que se limpia. Sin oxígeno, mueren peces, anfibios y plantas acuáticas.' },
  { id: 'humedal', k: 'H', menor: 35, meses: 1, titulo: 'El humedal se secó o fue rellenado',
    porque: 'Quedó menos de un tercio del espejo de agua de 2026 por rellenos, invasiones de la ronda y años secos.' },
  { id: 'aves', k: 'aves', menor: 18, meses: 3, titulo: 'Las aves se fueron',
    porque: 'Sin refugio, sin agua limpia y con ruido, quedan menos de 18 especies de aves.' },
  { id: 'abejas', k: 'abejas', menor: 30, meses: 6, titulo: 'Sin polinizadores',
    porque: 'Las abejas caen por debajo del 30 % de 2026: falta vegetación con flor y el aire está muy contaminado.' },
  { id: 'plagas', k: 'plagas', mayor: 300, meses: 3, titulo: 'Emergencia sanitaria por plagas',
    porque: 'Ratas, moscas y palomas triplican lo de 2026 por la basura acumulada y el agua sucia, y no hay depredadores que las controlen.' },
  { id: 'residuos', k: 'W', mayor: 4500, meses: 1, titulo: 'Emergencia de residuos',
    porque: 'Se acumulan más de 4.500 t de basura sin retirar alrededor de Corabastos.' },
  { id: 'vias', k: 'vel', menor: 5, meses: 6, titulo: 'Colapso vial: no caben todos los vehículos',
    porque: 'La velocidad en hora pico cae por debajo de 5 km/h durante seis meses: hay más carros y camiones que capacidad en las vías (incluidas las cerradas por obra).' },
  { id: 'comida', k: 'atencion', menor: 60, meses: 6, titulo: 'Desabastecimiento',
    porque: 'Corabastos atiende menos del 60 % de la comida que se necesita durante seis meses seguidos.' }
];

export function setupYears({ dynamics, obra, groups, invalidate }) {
  let corriendo = false, pausado = false, m = 0, vel = 1, ultimoMes = -1;
  let prop = { aplicada: false, inicio: 0, dur: 0, anos: 0 };
  let A = [], B = [], estadoA = null, estadoB = null, indicador = 'atencion';
  let goA = null, goB = null, cuentaA = {}, cuentaB = {}, ignorar = false;
  // CLIMA: TODOS los años llueve. Bogotá tiene dos temporadas de lluvias (abril–mayo y octubre–noviembre)
  // y dos secas (diciembre–febrero y julio–agosto). Lo que cambia con «Clima del periodo» es cuántos años
  // son de La Niña (más lluvia) o de El Niño (menos), nunca que deje de llover. Semilla fija: A y B ven el mismo clima.
  const MM = [40, 55, 85, 115, 105, 55, 45, 50, 65, 125, 105, 60];        // lluvia media mensual (mm), referencia Bogotá
  const TEMP = [13.6, 14, 14.3, 14.5, 14.4, 14, 13.7, 13.8, 13.9, 14, 14, 13.8];
  const VIENTO = [8, 8, 7, 6, 6, 9, 14, 15, 11, 7, 6, 7];
  function genClima() {
    let s = 42; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const pNina = S.anoLluvioso >= .5 ? .45 : S.anoLluvioso <= .2 ? .1 : .2, pNino = S.anoLluvioso >= .5 ? .1 : S.anoLluvioso <= .2 ? .45 : .2;
    const tipo = Array.from({ length: 31 }, () => { const u = r(); return u < pNina ? 'nina' : u < pNina + pNino ? 'nino' : 'normal'; });
    const ruido = Array.from({ length: 31 * 12 }, () => .7 + r() * .6);
    return { tipo, ruido };
  }
  let clima = genClima();
  const FACTOR = { nina: 1.45, normal: 1, nino: .6 };
  const mmMes = (mes, c = clima) => MM[mes % 12] * FACTOR[c.tipo[Math.floor(mes / 12) % 31]] * c.ruido[mes % c.ruido.length];
  const diasLluvia = (mes, c) => Math.max(2, Math.min(27, Math.round(mmMes(mes, c) / 6)));   // nunca un mes sin ningún día de lluvia
  const llueveMes = (mes, c = clima) => mmMes(mes, c) > 95;                                // temporada de lluvias fuerte
  const tipoAno = mes => clima.tipo[Math.floor(mes / 12) % 31];

  // Duración estimada de la obra si empieza en `desde` (meses). `sinLluvia` sirve para medir cuánto la frena la lluvia.
  function duracion(desde = 0, c = clima, sinLluvia = false) {
    let f = 0, mes = desde;
    while (f < 1 && mes - desde < 600) { f += ritmo(!sinLluvia && llueveMes(mes, c)); mes++; }
    return mes - desde;
  }

  // ---------- Paso mensual del modelo agregado ----------
  function inicial() { return { W: S.residuos0, R: S.refugio0, Q: 55, H: 100, aves: 52, abejas: 100, f: -1 }; }
  function paso(mes, est, conProp) {
    const t = mes / 12, ano = Math.floor(t);
    const pico = S.transporte === 'pico', noche = S.transporte === 'nocturna';
    const D = 100 * (1 + S.demanda) ** t, P = (1 + S.poblacion) ** t;
    const F = (1 + Math.max(0, S.flota - (pico ? .01 : 0))) ** t * (pico ? .94 : 1);
    const lluviaMM = mmMes(mes), llueve = lluviaMM > 95, seco = lluviaMM < 45;
    // Avance de la obra: acumulado, a ritmo variable.
    let f = -1, rit = 0;
    if (conProp && prop.aplicada && mes >= prop.inicio) { rit = ritmo(llueve); f = Math.min(1, Math.max(0, est.f) + rit); }
    const obraActiva = f >= 0 && f < 1, demoliendo = obraActiva && f < .74;
    // Abastecimiento
    let cap = S.capActual;
    if (f >= 0) cap = (f < .62 ? S.capActual * (f < .02 ? 1 : S.capObraBodegas) : S.capMercadoNuevo) + (f >= .30 ? S.capNodo : 0) + (f >= .33 ? S.capNodo : 0);
    const local = f >= .39 ? D * Math.min(.12, .07 + .05 * Math.max(0, f - .39) * 2) : 0;
    const atencion = Math.min(100, (cap * (llueve ? .88 : 1) + local) / D * 100);
    // Movilidad
    const zonas = obraActiva ? obra.resumen().zonas * (S.frentes / 2) : 0;
    const cierre = 1 + .035 * zonas, camion = (f >= .62 ? .96 : 1) * (noche ? .95 : 1);
    const obraCam = obraActiva ? (S.escombros === 'lejos' ? 1.06 : 1.02) : 1;
    const vel = 25 / (1 + 1.27 * (F * cierre * camion * obraCam) ** 3) * (llueve ? .9 : 1);
    // Aire PM2,5
    const pm = 22 * F ** .7 * (11 / Math.max(2, vel)) ** .35 + (demoliendo ? 1.2 * S.frentes + (S.horario === 'extendido' ? .5 : 0) : 0) - (f >= .98 ? 1 : 0);
    // Residuos sin retirar
    const genMercado = S.generacion * Math.min(D, cap + local) * (f >= .36 ? 1 - S.aprovechamiento : 1);
    const gen = genMercado + S.generacionBarrio * P;
    const ret = (f >= .36 ? S.retiroPropuesta : S.retiroActual) * (llueve ? .85 : 1);
    const W = Math.max(0, est.W + gen - ret);
    const tirando = obraActiva && S.escombros === 'humedal';
    // Calidad del agua del humedal (0 negra – 100 limpia)
    let objQ = 70 - W / 80 - (P - 1) * 40 - (tirando ? 45 : 0) + (llueve ? 4 : 0) + (f >= .98 ? 24 : f >= .66 ? 8 : 0);
    const Q = Math.max(0, Math.min(100, est.Q + (objQ - est.Q) * .08));
    // Espejo de agua (% del de 2026)
    let H = est.H - S.perdidaRonda * 1.5 / 12 - (tirando ? .45 : 0) - (seco ? .1 : 0) + (llueve ? .06 : 0);
    if (f >= .98) H = Math.min(160, H + 1.2);         // humedal ampliado
    H = Math.max(0, H);
    // Refugio (%)
    let objR = 62 - S.perdidaRonda * t - W / 400 - Math.max(0, 55 - Q) / 4;
    if (f >= .66 && f < .98) objR -= 6;
    if (f >= .98) objR += 28;
    const R = Math.max(0, Math.min(100, est.R + (objR - est.R) * .05));
    // Aves (especies), abejas (% de 2026) y plagas (% de 2026)
    const ruido = obraActiva && S.horario === 'extendido' ? .85 : 1;
    const objAves = 52 * (R / 58) ** .9 * (Math.max(1, Q) / 55) ** .4 * (Math.max(1, H) / 100) ** .3 * ruido;
    const aves = est.aves + (Math.min(75, objAves) - est.aves) * .06;   // tope: especies que el humedal ampliado podría sostener
    const verde = f >= .98 ? 1.35 : f >= .5 ? 1.1 : 1;
    const objAbejas = 100 * (R / 58) ** .6 * (22 / pm) ** 1.2 * verde;
    const abejas = est.abejas + (objAbejas - est.abejas) * .06;
    const plagas = 100 * ((W + 300) / 1500) ** .9 * (1 + Math.max(0, 55 - Q) / 60) * (52 / Math.max(5, aves)) ** .25;
    // Trabajo
    const extraConflicto = S.concertacion === 'baja' ? 10 : S.concertacion === 'alta' ? -5 : 0;
    const empleo = f < 0 ? 0 : f >= 1 ? 4 : f < .02 ? 0 : f < .62 ? 15 + extraConflicto : f < .64 ? 30 + extraConflicto : 8;
    return { mes, ano: INICIO + ano, D, F, P, cap, atencion, vel, pm, W, R, Q, H, aves, abejas, plagas, empleo, dependencia: 100 - local / D * 100, f, rit, llueve, lluviaMM, dias: diasLluvia(mes, clima), tipoAno: clima.tipo[ano % 31] };
  }

  // Revisión de game over; devuelve la regla que cae o null.
  function revisar(x, cuenta) {
    for (const g of GAME_OVER) {
      const v = x[g.k], cae = g.menor != null ? v < g.menor : v > g.mayor;
      cuenta[g.id] = cae ? (cuenta[g.id] || 0) + 1 : 0;
      if (cuenta[g.id] >= g.meses) return { ...g, mes: x.mes, valor: v };
    }
    return null;
  }

  // ---------- Bitácora de la obra: lo que pasa mientras se construye ----------
  // Escombros: demolición de bodegas (~120.000 m² a 1,2 t/m²) y de manzanas de María Paz (~40.000 t). Supuesto de ensayo.
  const RCD_TOTAL = 185000, T_VIAJE = 14;
  const DESTINO = {
    planta: { aprovechado: .7, escombrera: .3, humedal: 0, km: 2 },
    lejos: { aprovechado: 0, escombrera: 1, humedal: 0, km: 32 },
    humedal: { aprovechado: 0, escombrera: .65, humedal: .35, km: 3 }
  };
  let log = null;
  function nuevoLog(antes, inicio) {
    return { inicio, fin: null, meses: 0, mesesLluvia: 0, Q0: antes.Q, Qmin: antes.Q, Qfin: antes.Q, H0: antes.H, Hfin: antes.H,
      aves0: antes.aves, avesMin: antes.aves, abejas0: antes.abejas, abejasMin: antes.abejas, plagasMax: antes.plagas ?? 100,
      velMin: antes.vel ?? 99, pmSum: 0, empleoMax: 0, rcd: 0, aprovechado: 0, escombrera: 0, alHumedal: 0, viajes: 0, km: 0, factores: null };
  }
  function registrar(x, previoF) {
    if (!log || log.fin != null || x.f < 0) return;
    log.meses++; if (x.llueve) log.mesesLluvia++;
    log.Qmin = Math.min(log.Qmin, x.Q); log.Qfin = x.Q; log.Hfin = x.H;
    log.avesMin = Math.min(log.avesMin, x.aves); log.abejasMin = Math.min(log.abejasMin, x.abejas); log.plagasMax = Math.max(log.plagasMax, x.plagas);
    log.velMin = Math.min(log.velMin, x.vel); log.pmSum += x.pm; log.empleoMax = Math.max(log.empleoMax, x.empleo);
    const d = RCD_TOTAL * (Math.min(x.f, .74) - Math.min(Math.max(0, previoF), .74)) / .74, de = DESTINO[S.escombros];
    if (d > 0) { log.rcd += d; log.aprovechado += d * de.aprovechado; log.escombrera += d * de.escombrera; log.alHumedal += d * de.humedal; const v = d * (1 - de.aprovechado) / T_VIAJE; log.viajes += v; log.km += v * 2 * de.km; }
    if (x.f >= 1) log.fin = x.mes;
  }
  // Cuánto aporta cada condición a la duración (meses), comparando con su valor de referencia.
  const REFERENCIA = { escombros: 'planta', financiacion: 'mixta', frentes: 2, concertacion: 'media', horario: 'diurno' };
  const NOMBRE = {
    escombros: { planta: 'Escombros aprovechados en el predio', lejos: 'Escombros a una escombrera lejana', humedal: 'Escombros tirados junto al humedal' },
    financiacion: { publica: 'Financiación pública por vigencias', mixta: 'Financiación mixta', app: 'Alianza público-privada' },
    concertacion: { baja: 'Concertación baja (paros)', media: 'Concertación media', alta: 'Concertación alta' },
    horario: { diurno: 'Obra solo de día', extendido: 'Obra de día y de noche' }
  };
  function factores(inicio) {
    const total = duracion(inicio), lista = [];
    for (const [k, ref] of Object.entries(REFERENCIA)) {
      if (S[k] === ref) continue;
      const v = S[k]; S[k] = ref; const sin = duracion(inicio); S[k] = v;
      lista.push({ t: k === 'frentes' ? `${v} frentes de obra (en vez de 2)` : NOMBRE[k][v], d: total - sin });
    }
    const seca = duracion(inicio, clima, true);
    if (total - seca) lista.push({ t: 'Meses de lluvia durante la obra', d: total - seca });
    return { total, lista: lista.filter(f => f.d).sort((a, b) => b.d - a.d) };
  }
  const durTexto = meses => { const a = Math.floor(meses / 12), r = meses % 12; return [a ? `${a} año${a > 1 ? 's' : ''}` : '', r ? `${r} mes${r > 1 ? 'es' : ''}` : ''].filter(Boolean).join(' y ') || '0 meses'; };

  // ---------- Lo visible sigue al año (escenario mostrado) ----------
  const fijar = (id, v) => { const el = document.getElementById(id); if (!el) return; const s = String(v); if (el.value !== s) { el.value = s; el.dataset.derived = '1'; el.dispatchEvent(new Event('input', { bubbles: true })); } };
  const BASE = { car: 3000, moto: 260, taxi: 100, truck: 24, person: 450 };
  // Color del agua en 3D: se oscurece con la calidad y se vuelve tierra seca si se pierde el espejo.
  const aguas = [];
  groups?.hydrology?.traverse(o => { if (o.isMesh) for (const mt of [].concat(o.material)) if (!aguas.some(a => a.m === mt)) aguas.push({ m: mt, base: mt.color.clone() }); });
  const NEGRA = new T.Color('#1c1a14'), SECA = new T.Color('#8f7d58'), tmp = new T.Color();
  function pintarAgua(x) {
    const kN = x ? Math.max(0, Math.min(1, (55 - x.Q) / 45)) : 0, kS = x ? Math.max(0, Math.min(1, (75 - x.H) / 45)) : 0;
    for (const a of aguas) { tmp.copy(a.base).lerp(NEGRA, kN * .9).lerp(SECA, kS * .8); if (kN || kS) { a.m.userData.tinte = tmp.clone(); a.m.color.copy(tmp); } else { delete a.m.userData.tinte; a.m.color.copy(a.base); } }
  }
  // Clima visible en 3D durante la simulación: sigue el calendario (días con y sin lluvia, nubes, temperatura, viento).
  // Se vuelve a sortear cada ~0,4 s (≈ 12 días simulados) con la probabilidad de lluvia de ese mes.
  const CLIMA_IDS = ['rain', 'cloud', 'temp', 'wind'];
  function clima3D(x, mes) {
    if (!x) return;
    const llueveHoy = Math.random() < x.dias / 30, t = x.tipoAno;
    const lluvia = llueveHoy ? Math.min(25, Math.round((1 + x.lluviaMM / 18 * (.5 + Math.random())) * 2) / 2) : 0;
    fijar('rain', lluvia);
    fijar('cloud', Math.round(llueveHoy ? 70 + Math.random() * 25 : Math.min(65, 15 + x.lluviaMM / 3 + Math.random() * 15)));
    fijar('temp', Math.round((TEMP[mes % 12] + 5 + (t === 'nino' ? .9 : t === 'nina' ? -.5 : 0) - (llueveHoy ? 1.5 : 0)) * 2) / 2);
    fijar('wind', Math.round(VIENTO[mes % 12] + Math.random() * 5));
  }
  const bloquearClima = on => CLIMA_IDS.forEach(id => { const el = document.getElementById(id); if (el) { el.disabled = on; el.closest('label')?.classList.toggle('por-calendario', on); } });
  function visual(x) {
    fijar('n-car', Math.min(7500, Math.round(BASE.car * x.F / 50) * 50));
    fijar('n-moto', Math.min(800, Math.round(BASE.moto * x.F / 10) * 10));
    fijar('n-taxi', Math.min(350, Math.round(BASE.taxi * x.F / 5) * 5));
    fijar('n-truck', Math.min(90, Math.round(BASE.truck * x.D / 100 * (x.f >= .62 ? .6 : 1) * (S.transporte === 'nocturna' ? .7 : 1))));
    fijar('n-person', Math.min(1400, Math.round(BASE.person * x.P / 10) * 10));
    fijar('bays', x.f >= .62 ? 8 : 3);
    fijar('remove', x.f >= .36 ? 300 : 120);
    pintarAgua(x);
  }

  // ---------- Panel ----------
  const panel = document.createElement('section'); panel.id = 'anos-panel'; panel.hidden = true; document.body.append(panel);
  panel.innerHTML = `<header><b id="an-titulo">Simulación en el tiempo</b><span class="sp"></span>
      <button id="an-pausa" title="Pausar los años (la ciudad sigue)">⏸</button>
      <small class="dim">1 mes por segundo</small></header>
    <div class="an-fecha"><span id="an-ano">2026</span><span id="an-mes"></span><span id="an-lluvia"></span></div>
    <div class="obra-barra an-barra"><span id="an-obra" hidden></span><i id="an-prog"></i></div>
    <div class="an-ejes"><span>2026</span><span>2036</span><span>2046</span><span>2056</span></div>
    <div id="an-go" hidden></div>
    <div id="an-aplicar"><small id="an-dur"></small></div>
    <div id="an-obra-info" class="obra-nota" hidden></div>
    <div id="an-ind"></div>
    <div id="an-graf"><div class="an-chips"></div><svg id="an-svg" viewBox="0 0 460 120" preserveAspectRatio="none"></svg>
      <div class="legend"><span><i class="sw" style="background:#9aa7b4"></i>sin intervenir</span><span id="an-leyB"><i class="sw" style="background:#f5c46b"></i>con propuesta</span><span><i class="sw" style="background:#ff2b2b"></i>game over</span></div></div>
    <p class="obra-aviso">Coeficientes de ensayo, por calibrar con fuentes.</p>`;
  const $ = s => panel.querySelector(s);
  $('#an-pausa').onclick = () => { pausado = !pausado; $('#an-pausa').textContent = pausado ? '▶' : '⏸'; };

  // Indicadores: nombre, campo, unidad, umbrales [regular, falla], si "más es mejor", decimales.
  const IND = [
    ['Comida', 'atencion', '%', [75, 60], true, 0], ['Movilidad', 'vel', 'km/h', [12, 5], true, 1], ['Aire', 'pm', 'µg/m³', [25, 37], false, 0],
    ['Agua', 'Q', '/100', [40, 15], true, 0], ['Humedal', 'H', '% espejo', [70, 35], true, 0], ['Aves', 'aves', 'especies', [35, 18], true, 0],
    ['Abejas', 'abejas', '%', [60, 30], true, 0], ['Plagas', 'plagas', '%', [160, 300], false, 0], ['Residuos', 'W', 't', [2500, 4500], false, 0],
    ['Trabajo', 'empleo', '% perdido', [20, 30], false, 0]
  ];
  const color = (v, [a, b], mas) => (mas ? v >= a : v <= a) ? 'ok' : (mas ? v > b : v < b) ? 'warn' : 'bad';
  $('.an-chips').innerHTML = IND.map(([n, k]) => `<button data-ind="${k}" class="${k === indicador ? 'active' : ''}">${n}</button>`).join('');
  panel.querySelectorAll('[data-ind]').forEach(b => b.onclick = () => { indicador = b.dataset.ind; panel.querySelectorAll('[data-ind]').forEach(x => x.classList.toggle('active', x === b)); dibujar(); });

  const anoDe = mes => INICIO + Math.floor(mes / 12);
  const MESN = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const TIPO = { nina: '🌧 Año de La Niña', nino: '☀ Año de El Niño', normal: 'Año normal' };
  const fecha = mes => `${MESN[mes % 12]} de ${anoDe(mes)}`;
  const num = (v, d = 0) => v.toFixed(d).replace('.', ',');
  function textos() {
    const x = mostrado(); if (!x) return;
    const mes = Math.floor(m);
    $('#an-ano').textContent = fecha(mes); $('#an-mes').textContent = '';
    const sf = document.getElementById('sim-fecha'); if (sf) { sf.hidden = false; sf.innerHTML = `${fecha(mes)}<small>${prop.aplicada ? (x.f >= 1 ? (log?.fin != null ? `propuesta construida en ${durTexto(log.fin - log.inicio + 1)}` : 'propuesta construida') : `obra ${Math.round(Math.max(0, x.f) * 100)} %`) : 'sin intervenir'}${goVisto() && !ignorar ? ' · GAME OVER' : ''}<br>${TIPO[x.tipoAno]} · ${x.dias} días de lluvia este mes (${Math.round(x.lluviaMM)} mm)</small>`; } $('#an-lluvia').textContent = `  · ${x.dias} días de lluvia`;
    $('#an-prog').style.width = (mes / MESES * 100).toFixed(1) + '%';
    $('#an-titulo').textContent = prop.aplicada ? `Con propuesta · desde ${anoDe(prop.inicio)}` : 'Sin intervenir · estado actual';
    $('#an-aplicar').hidden = prop.aplicada || !!goVisto(); boton();
    $('#an-dur').textContent = `Si aplicas la propuesta ahora, con estas condiciones la obra duraría ≈ ${num(duracion(mes) / 12, 1)} años`;
    const ob = $('#an-obra'); ob.hidden = !prop.aplicada; if (prop.aplicada) { ob.style.left = (prop.inicio / MESES * 100) + '%'; ob.style.width = (prop.dur / MESES * 100) + '%'; }
    const info = $('#an-obra-info');
    if (prop.aplicada && log && x.f >= 0) { info.hidden = false; info.innerHTML = informe(x, mes); }
    else info.hidden = true;
    $('#an-ind').innerHTML = IND.map(([n, k, u, um, mas, dec]) => {
      const vB = x[k], vA = estadoA[k], c = color(vB, um, mas), dif = prop.aplicada ? vB - vA : 0;
      const go = GAME_OVER.find(g => g.k === k), r = go ? Math.max(0, Math.min(1, mas ? (um[0] - vB) / (um[0] - um[1]) : (vB - um[0]) / (um[1] - um[0]))) : null;
      return `<div class="an-k ${c}">${go ? `<i class="an-riesgo" title="Qué tan cerca está del game over (límite: ${go.menor != null ? '<' + go.menor : '>' + go.mayor})"><s style="width:${(r * 100).toFixed(0)}%"></s></i>` : ''}<span>${n}${go ? ' <small class="lim">☠ ' + (go.menor != null ? '<' + num(go.menor) : '>' + num(go.mayor)) + '</small>' : ''}</span><b>${num(vB, dec)}<small> ${u}</small></b>${prop.aplicada && Math.abs(dif) > .05 ? `<em class="${(dif > 0) === mas ? 'mejor' : 'peor'}">${dif > 0 ? '+' : ''}${num(dif, dec || (Math.abs(dif) < 10 ? 1 : 0))} vs sin intervenir</em>` : ''}</div>`;
    }).join('');
    $('#an-leyB').hidden = !prop.aplicada;
    // Game over
    const go = goVisto(), box = $('#an-go');
    if (go) {
      const otro = prop.aplicada ? (goA ? `Sin intervenir cae en ${anoDe(goA.mes)}: ${goA.titulo.toLowerCase()}.` : 'Sin intervenir no cae en ese momento.') : '';
      box.hidden = false;
      box.innerHTML = `<b>GAME OVER · ${anoDe(go.mes)}</b><h4>${go.titulo}</h4><p>${go.porque}</p>
        ${prop.aplicada && go.mes < prop.inicio + prop.dur ? '<p><i>Pasó antes de terminar la obra.</i></p>' : ''}${otro ? `<p class="dim">${otro}</p>` : ''}
        <div class="an-go-act"><button data-go="seguir">Seguir viendo los años</button><button data-go="reiniciar">Reiniciar con otras condiciones</button></div>`;
      box.querySelector('[data-go=seguir]').onclick = () => { ignorar = true; pausado = false; $('#an-pausa').textContent = '⏸'; textos(); };
      box.querySelector('[data-go=reiniciar]').onclick = () => { detener(); document.getElementById('condiciones')?.setAttribute('open', ''); document.getElementById('condiciones')?.scrollIntoView({ behavior: 'smooth' }); };
      box.classList.toggle('visto', ignorar);
    } else { box.hidden = true; }
    panel.classList.toggle('game-over', !!go && !ignorar);
    document.body.classList.toggle('game-over', !!go && !ignorar);
  }
  // Informe de la obra: en curso (datos acumulados) o terminado (duración real y balance).
  function informe(x, mes) {
    const L = log, terminada = L.fin != null, A0 = A[Math.min(mes, A.length - 1)] || estadoA;
    const fila = (t, v, cls = '') => `<div class="inf-f ${cls}"><span>${t}</span><b>${v}</b></div>`;
    const tn = v => Math.round(v).toLocaleString('es');
    const dQ = L.Qfin - L.Q0, perdidaH = L.H0 - L.Hfin;
    let h = terminada
      ? `<div class="inf-t">✔ Propuesta construida en <b>${durTexto(L.fin - L.inicio + 1)}</b></div><div class="inf-sub">De ${fecha(L.inicio)} a ${fecha(L.fin)} · ${L.mesesLluvia} meses con lluvia</div>`
      : `<div class="inf-t">🏗 Obra ${Math.round(x.f * 100)} % · lleva ${durTexto(L.meses)}</div><div class="inf-sub">${obra.resumen().estado} · faltan ≈ ${durTexto(Math.max(0, prop.inicio + prop.dur - mes))}${x.llueve ? ' · <i>la lluvia la frena</i>' : ''}</div>`;
    // Por qué dura lo que dura
    const F = L.factores;
    h += `<div class="inf-h">Por qué dura ${durTexto(terminada ? L.fin - L.inicio + 1 : F.total)}</div><div class="inf-base">Referencia: ≈ ${durTexto(Math.round(1 / BASE_RITMO / .9))} sin lluvia, con financiación mixta, 2 frentes, concertación media y escombros en el predio</div>`;
    h += F.lista.length ? F.lista.map(f => fila(f.t, `${f.d > 0 ? '+' : '−'}${durTexto(Math.abs(f.d))}`, f.d > 0 ? 'peor' : 'mejor')).join('') : '<div class="inf-sub">Ninguna condición la alarga ni la acorta frente a la referencia.</div>';
    // Impactos durante la obra
    h += `<div class="inf-h">${terminada ? 'Lo que dejó la obra' : 'Lo que va dejando la obra'}</div>`;
    h += fila('Calidad del agua del humedal', `${num(L.Q0)} → ${num(L.Qfin)} /100 <small>(mín. ${num(L.Qmin)})</small>`, dQ < -3 ? 'peor' : dQ > 3 ? 'mejor' : '');
    h += fila('Contaminación del agua', dQ < -.5 && L.Q0 > 0 ? `+${num(-dQ / L.Q0 * 100)} % más sucia` : 'no empeoró', dQ < -3 ? 'peor' : 'mejor');
    h += fila('Espejo de agua perdido', perdidaH > .05 ? `${num(perdidaH, 1)} % del de 2026` : 'nada', perdidaH > 2 ? 'peor' : '');
    h += fila('Escombros al humedal', L.alHumedal ? `${tn(L.alHumedal)} t` : 'ninguno', L.alHumedal ? 'peor' : 'mejor');
    h += fila('Escombros generados', `${tn(L.rcd)} t`);
    h += fila('Aprovechados en el predio', `${tn(L.aprovechado)} t`, L.aprovechado ? 'mejor' : '');
    h += fila('A escombrera', `${tn(L.escombrera)} t`);
    h += fila('Viajes de volqueta', `${tn(L.viajes)} · ${tn(L.km)} km`);
    h += fila('CO₂ de esos viajes', `${tn(L.km * .9 / 1000)} t`);
    h += fila('Aves', `${num(L.aves0)} → ${num(x.aves)} especies <small>(mín. ${num(L.avesMin)})</small>`, x.aves < L.aves0 - 1 ? 'peor' : '');
    h += fila('Abejas', `mín. ${num(L.abejasMin)} %`, L.abejasMin < 60 ? 'peor' : '');
    h += fila('Plagas (pico)', `${num(L.plagasMax)} %`, L.plagasMax > 160 ? 'peor' : '');
    h += fila('Velocidad mínima en hora pico', `${num(L.velMin, 1)} km/h`, L.velMin < 8 ? 'peor' : '');
    h += fila('Aire medio durante la obra', L.meses ? `${num(L.pmSum / L.meses)} µg/m³` : '—', L.meses && L.pmSum / L.meses > 25 ? 'peor' : '');
    h += fila('Puestos de trabajo afectados (pico)', `${num(L.empleoMax)} %`, L.empleoMax > 20 ? 'peor' : '');
    if (A0) h += `<div class="inf-sub">Mismo mes sin intervenir: agua ${num(A0.Q)} /100 · espejo ${num(A0.H)} % · aves ${num(A0.aves)}</div>`;
    return h;
  }
  const mostrado = () => prop.aplicada ? estadoB : estadoA;
  const goVisto = () => prop.aplicada ? goB : goA;
  function dibujar() {
    const def = IND.find(i => i[1] === indicador), [, k, , um] = def, svg = $('#an-svg');
    const vals = [...A, ...(prop.aplicada ? B : [])].map(x => x[k]);
    let lo = Math.min(...vals, ...um), hi = Math.max(...vals, ...um); if (hi - lo < 1) hi = lo + 1; const pad = (hi - lo) * .1; lo -= pad; hi += pad;
    const X = i => i / MESES * 460, Y = v => 116 - (v - lo) / (hi - lo) * 112;
    const linea = (arr, col, w) => arr.length ? `<polyline fill="none" stroke="${col}" stroke-width="${w}" points="${arr.map(x => X(x.mes).toFixed(1) + ',' + Y(x[k]).toFixed(1)).join(' ')}"/>` : '';
    const marca = (go, col) => go ? `<line x1="${X(go.mes)}" x2="${X(go.mes)}" y1="0" y2="120" stroke="${col}" stroke-width="2"/><text x="${X(go.mes) + 3}" y="11" fill="${col}" font-size="10">✕ ${anoDe(go.mes)}</text>` : '';
    let s = '';
    if (prop.aplicada) s += `<rect x="${X(prop.inicio)}" y="0" width="${X(prop.dur)}" height="120" fill="#e6e6e6" opacity=".08"/>`;
    s += `<line x1="0" x2="460" y1="${Y(um[1])}" y2="${Y(um[1])}" stroke="#ff2b2b" stroke-dasharray="4 3" stroke-width="1"/><line x1="0" x2="460" y1="${Y(um[0])}" y2="${Y(um[0])}" stroke="#ff9f1c" stroke-dasharray="2 4" stroke-width="1"/>`;
    s += linea(A, '#9aa7b4', 1.6) + (prop.aplicada ? linea(B, '#f5c46b', 2.2) : '');
    s += marca(goA, prop.aplicada ? '#ff6b6b88' : '#ff2b2b') + (prop.aplicada ? marca(goB, '#ff2b2b') : '');
    s += `<line x1="${X(m)}" x2="${X(m)}" y1="0" y2="120" stroke="#fff" stroke-width="1" opacity=".7"/>`;
    svg.innerHTML = s;
  }

  // ---------- Control ----------
  function iniciar() {
    if (obra.activo) obra.detener();
    corriendo = true; pausado = false; m = 0; ultimoMes = -1; vel = 1; ignorar = false;
    prop = { aplicada: false, inicio: 0, dur: 0, anos: 0 };
    A = []; B = []; estadoA = null; estadoB = null; log = null; goA = goB = null; cuentaA = {}; cuentaB = {}; clima = genClima(); bloquear();
    panel.hidden = false; document.body.classList.add('anos-mode'); bloquearClima(true);
    $('#an-pausa').textContent = '⏸';
    dynamics.setPaused(false); avanzarHasta(0); textos(); dibujar(); boton(); invalidate();
  }
  function aplicar() {
    if (!corriendo) iniciar();
    if (prop.aplicada) return;
    const inicio = Math.floor(m), dur = duracion(inicio);
    prop = { aplicada: true, inicio, dur, anos: dur / 12, durReal: dur };
    // Desde ahora B diverge de A: se recalcula B desde el mes de inicio con la propuesta.
    B = B.slice(0, inicio); estadoB = B.at(-1) ? { ...B.at(-1) } : null; goB = null; cuentaB = {};
    log = nuevoLog(estadoB || { ...inicial(), vel: 25, plagas: 100 }, inicio); log.factores = factores(inicio);
    obra.iniciar(Math.max(1, Math.round(dur / 12)), true); obra.fijar(0);
    for (let mes = inicio; mes <= ultimoMes; mes++) { const pf = estadoB?.f ?? -1; estadoB = paso(mes, estadoB || inicial(), true); B.push(estadoB); registrar(estadoB, pf); if (!goB) goB = revisar(estadoB, cuentaB); }
    ignorar = false; textos(); dibujar();
  }
  function avanzarHasta(mes) {
    while (ultimoMes < mes && ultimoMes < MESES - 1) {
      ultimoMes++;
      estadoA = paso(ultimoMes, estadoA || inicial(), false); A.push(estadoA); if (!goA) goA = revisar(estadoA, cuentaA);
      const previo = estadoB?.f ?? -1;
      estadoB = paso(ultimoMes, estadoB || inicial(), true); B.push(estadoB); registrar(estadoB, previo); if (!goB) goB = revisar(estadoB, cuentaB);
      if (prop.aplicada && previo < 1 && estadoB.f >= 1) { prop.durReal = ultimoMes - prop.inicio + 1; prop.dur = prop.durReal; }
      // El escenario que se ve cae: se detienen los años (la ciudad sigue moviéndose).
      if (!ignorar && goVisto() && goVisto().mes === ultimoMes) { pausado = true; m = ultimoMes; $('#an-pausa').textContent = '▶'; break; }
    }
  }
  function detener(conResultados = false) {
    if (conResultados && corriendo && A.length > 1) {
      const fmtC = c => c.sel ? (c.sel.find(([, v]) => String(v) === String(S[c.k]))?.[0] ?? S[c.k]) : `${fmt(c, S[c.k])} ${c.u}`;
      mostrarResultados({
        INICIO, MESES, A: A.slice(0, ultimoMes + 1), B: B.slice(0, ultimoMes + 1), prop: { ...prop }, log: log && { ...log }, goA, goB, IND, GAME_OVER,
        clima: (() => { const anos = Math.floor(ultimoMes / 12) + 1, t = clima.tipo.slice(0, anos), A0 = A.slice(0, ultimoMes + 1); return { nina: t.filter(x => x === 'nina').length, nino: t.filter(x => x === 'nino').length, normal: t.filter(x => x === 'normal').length, mesesLluvia: A0.filter(x => x.llueve).length, dias: A0.reduce((a, x) => a + x.dias, 0), mm: A0.reduce((a, x) => a + x.lluviaMM, 0) }; })(),
        condiciones: CONDICIONES.filter(c => c.k).map(c => [c.t, fmtC(c)]),
        informeHTML: prop.aplicada && log ? informe(estadoB, ultimoMes) : ''
      });
    }
    corriendo = false; panel.hidden = true; document.body.classList.remove('anos-mode', 'game-over');
    if (obra.activo) obra.detener();
    fijar('n-car', 3000); fijar('n-moto', 260); fijar('n-taxi', 100); fijar('n-truck', 24); fijar('n-person', 450); fijar('bays', 3); fijar('remove', 120);
    fijar('rain', 0); fijar('cloud', 20); fijar('temp', 19); fijar('wind', 5); bloquearClima(false);
    pintarAgua(null);
    boton(); bloquear(); invalidate();
  }

  let ultimoTexto = 0;
  function update(now, dt) {
    if (!corriendo) return;
    if (!pausado && !dynamics.state().paused && m < MESES - 1) m = Math.min(MESES - 1, m + dt * vel);
    const antes = ultimoMes; avanzarHasta(Math.floor(m));
    if (ultimoMes !== antes) { visual(mostrado()); dibujar(); textos(); }
    if (prop.aplicada && estadoB?.f >= 0) obra.fijar(Math.min(1, estadoB.f + (estadoB.f < 1 ? (m % 1) * estadoB.rit : 0)));   // la obra avanza suave entre meses
    if (now - ultimoTexto > 300) { ultimoTexto = now; textos(); }
    if (!pausado && (!update.clima || now - update.clima > 400)) { update.clima = now; clima3D(mostrado(), Math.floor(m)); }
    invalidate();
  }

  // ---------- Botón Simular y condiciones de partida (panel derecho) ----------
  const boton = () => {
    const b = document.querySelector('[data-scen=actual]'); if (!b) return;
    b.textContent = corriendo ? '■ Terminar y ver resultados' : '▶ Simular'; b.title = corriendo ? 'Terminar la simulación: muestra gráficas y conclusiones de todo lo que pasó' : 'Correr los años desde 2026, un mes por segundo'; b.classList.toggle('corriendo', corriendo);
    const ap = document.getElementById('btn-aplicar'); if (ap) { ap.hidden = !corriendo || prop.aplicada || !!goVisto(); ap.onclick = () => aplicar(); }
    if (!corriendo) { const sf = document.getElementById('sim-fecha'); if (sf) sf.hidden = true; }
  };
  const fmt = (c, v) => c.sel ? '' : (v * c.esc).toFixed(c.step < 1 && c.esc === 100 ? 1 : 0).replace('.', ',');
  function condiciones() {
    const b = document.querySelector('[data-scen=actual]'); if (!b || document.getElementById('condiciones')) return;
    const d = document.createElement('details'); d.id = 'condiciones'; d.className = 'condiciones';
    d.innerHTML = `<summary>Condiciones de partida <small>(se fijan al pulsar Simular)</small></summary>
      <p class="help">Cómo evoluciona el territorio en los próximos 30 años y cómo se haría la obra. Los valores por defecto son de ensayo, por calibrar con fuentes.</p>
      ${CONDICIONES.map(c => c.g ? `<h5 class="cond-g">${c.g}</h5>` : c.sel
        ? `<label class="cond">${c.t}<select id="${c.id}">${c.sel.map(([n, v]) => `<option value="${v}" ${v === S[c.k] ? 'selected' : ''}>${n}</option>`).join('')}</select><small>${c.ayuda}</small></label>`
        : `<label class="cond"><span>${c.t}<output id="${c.id}-v">${fmt(c, S[c.k])} ${c.u}</output></span><input type="range" id="${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${+(S[c.k] * c.esc).toFixed(2)}"><small>${c.ayuda}</small></label>`).join('')}
      <p class="cond-dur" id="cond-dur"></p>
      <button type="button" id="cond-reset">Restablecer valores de ensayo</button>`;
    (document.getElementById('scen-help') || b).after(d);
    const durTxt = () => { const meses = duracion(0, genClima()); document.getElementById('cond-dur').innerHTML = `Duración estimada de la obra: <b>≈ ${num(meses / 12, 1)} años</b> <small>(si empieza en 2026; depende también de la lluvia de esos años)</small>`; };
    const leer = c => { const el = document.getElementById(c.id), v = el.value; S[c.k] = c.sel ? (isNaN(+v) ? v : +v) : +v / c.esc; if (!c.sel) document.getElementById(c.id + '-v').textContent = `${fmt(c, S[c.k])} ${c.u}`; durTxt(); };
    for (const c of CONDICIONES) { if (!c.k) continue; const el = document.getElementById(c.id); el.addEventListener('input', () => leer(c)); el.addEventListener('change', () => leer(c)); leer(c); }
    d.querySelector('#cond-reset').onclick = () => { for (const c of CONDICIONES) { if (!c.k) continue; const el = document.getElementById(c.id); el.value = c.sel ? String(DEFECTO[c.k]) : +(DEFECTO[c.k] * c.esc).toFixed(2); leer(c); } };
    bloquear();
  }
  function bloquear() {
    const d = document.getElementById('condiciones'); if (!d) return;
    d.querySelectorAll('input,select,button').forEach(el => el.disabled = corriendo);
    d.classList.toggle('bloqueado', corriendo);
    d.querySelector('summary small').textContent = corriendo ? '(fijas mientras corre la simulación)' : '(se fijan al pulsar Simular)';
  }
  const conectar = () => { condiciones(); const b = document.querySelector('[data-scen=actual]'); if (b) { b.disabled = false; b.onclick = () => corriendo ? detener(true) : iniciar(); boton(); } };
  conectar(); setTimeout(conectar, 1600);
  // Si se recarga o cierra la página en plena simulación se pierde todo: el navegador pide confirmar antes.
  addEventListener('beforeunload', e => { if (corriendo) { e.preventDefault(); e.returnValue = ''; } });
  obra.onPedido = () => aplicar();
  return { update, get corriendo() { return corriendo; }, get estado() { return corriendo ? mostrado() : null; } };
}
