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
import { mostrarResultados } from './resultados.js?v=8';
import { OPC } from './propuesta.js?v=3';   // variables de la propuesta que también cambian el modelo 3D

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
  horario: 'diurno',      // 'diurno' | 'extendido'
  // Variables de la propuesta (agrandar o achicar lo que ya está; también cambian el modelo 3D)
  pisosViv: 6,            // pisos de las manzanas renovadas de María Paz
  nivelesMercado: 4,      // niveles de nave del mercado vertical (más el zócalo logístico de 2)
  humedalEsc: 1,          // tamaño de la ampliación del humedal (1 = prevista)
  vegCant: 1,             // cantidad de árboles nuevos (1 = prevista)
  vegTipo: 'nativa',      // 'nativa' | 'mixta' | 'ornamental'
  nodos: 4                // nodos repartidos: 4 (N, M, R, P) | 2 (N y M) | 0
};
const S = SUPUESTOS;
// Cómo se comporta cada tipo de vegetación nueva (supuestos de ensayo):
//  agua: cuánta agua toma del suelo y del humedal (las ornamentales de rápido crecimiento, como el eucalipto, mucho más)
//  hab: refugio y alimento para la fauna nativa · flor: flores para las abejas nativas
const VEG = { nativa: { agua: 1, hab: 1, flor: 1 }, mixta: { agua: 1.6, hab: .75, flor: .75 }, ornamental: { agua: 2.6, hab: .4, flor: .45 } };

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
  { g: 'Variables de la propuesta · agrandar o achicar lo que ya está (se ve en 3D)' },
  { id: 'c-pisos', t: 'Pisos de las manzanas renovadas de María Paz', k: 'pisosViv', min: 4, max: 14, step: 1, u: 'pisos', esc: 1,
    ayuda: 'Prevista: 6. Más pisos = más viviendas en la misma huella (menos presión para invadir la ronda), pero más gente, más viajes, más aguas servidas y edificios altos que estorban el vuelo de las aves. Menos pisos = falta vivienda y crece la presión sobre la ronda.' },
  { id: 'c-niveles', t: 'Niveles del mercado vertical', k: 'nivelesMercado', min: 2, max: 8, step: 1, u: 'niveles de nave', esc: 1,
    ayuda: 'Prevista: 4 (más el zócalo logístico de 2 = 6 pisos). Más niveles atienden más comida, pero concentran más camiones en un solo punto y la fachada de vidrio más alta es un riesgo de choque para las aves.' },
  { id: 'c-humedal-esc', t: 'Tamaño de la ampliación del humedal', k: 'humedalEsc', sel: [['La mitad (50 %)', .5], ['Reducida (75 %)', .75], ['Prevista', 1], ['Más grande (125 %)', 1.25]],
    ayuda: 'Más humedal: más espejo de agua, más refugio, más especies y más dilución. Ocupa suelo del predio que hoy es patio de Corabastos.' },
  { id: 'c-veg-cant', t: 'Árboles y vegetación nueva', k: 'vegCant', sel: [['Poca (la mitad)', .5], ['Prevista', 1], ['Mucha (+70 %)', 1.7], ['Muy densa (×2,5)', 2.5]],
    ayuda: 'Más vegetación enfría, conecta el corredor y da refugio, pero también toma agua: en los meses secos le quita agua al humedal.' },
  { id: 'c-veg-tipo', t: 'Tipo de vegetación nueva', k: 'vegTipo', sel: [['Nativa de humedal y bosque andino', 'nativa'], ['Mixta', 'mixta'], ['Ornamental de rápido crecimiento (eucalipto, pino)', 'ornamental']],
    ayuda: 'La ornamental crece rápido y da sombra pronto, pero consume mucha más agua, da poco alimento a las aves y abejas nativas y puede secar el humedal. En 3D se ve alta y esbelta.' },
  { id: 'c-nodos', t: 'Nodos repartidos por el territorio', k: 'nodos', sel: [['Los 4 (distribución N y M, recuperación R, producción P)', 4], ['Solo distribución (N y M)', 2], ['Ninguno: todo en el mercado vertical', 0]],
    ayuda: 'Los nodos reparten la carga y los camiones. Sin recuperación (R) se aprovechan menos residuos; sin producción (P) no hay comida local.' },
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

// PARES DE ESCENARIOS (entrega Corte III). Cada par responde una pregunta «¿qué pasaría si…?» y compara
// A · sin intervenir con B · con propuesta bajo las MISMAS condiciones, la MISMA semilla y la misma regla de
// game over. En B la propuesta entra siempre en el mismo mes (PAR_ENTRA). Lo que un par no nombra queda con el
// valor de ensayo por defecto. Se abren desde «Condiciones de partida» o con un enlace: ?par=P1&esc=B
// Los pares se eligieron con corridas del modelo para que lleguen a desenlaces distintos (tipo de game over y
// tiempo), sin cambiar ninguna ecuación: lo que cambia son condiciones del territorio y variables de la propuesta.
// Las variables de la propuesta (pisos, niveles, humedal, vegetación, nodos, aprovechamiento) solo actúan en B.
export const PARES = {
  P1: { t: 'Todo sigue como va', pregunta: '¿Qué pasa si las tendencias actuales continúan y se construye la propuesta prevista?', cond: {} },
  P2: { t: 'Pico y placa más estricto', pregunta: '¿Qué pasa si además se frena el crecimiento de carros y motos con un pico y placa más estricto?', cond: { transporte: 'pico' } },
  P3: { t: 'Más demanda de comida', pregunta: '¿Qué pasa si la demanda de comida de Bogotá crece al 3 % al año (casi el doble)?', cond: { transporte: 'pico', demanda: .03 } },
  P4: { t: 'Menos recolección, sin aprovechamiento', pregunta: '¿Qué pasa si la recolección baja a 50 t/mes y la propuesta no logra aprovechar residuos?', cond: { transporte: 'pico', retiroActual: 50, aprovechamiento: 0 } },
  P5: { t: 'Más población y torres de 12 pisos', pregunta: '¿Qué pasa si la población de Kennedy crece al 3 % al año y la propuesta responde con manzanas de 12 pisos?', cond: { transporte: 'pico', poblacion: .03, pisosViv: 12 } },
  P6: { t: 'Propuesta recortada y ornamental', pregunta: '¿Qué pasa si la propuesta se recorta (humedal a la mitad, poca vegetación y ornamental) y las manzanas suben a 12 pisos?', cond: { transporte: 'pico', humedalEsc: .5, vegCant: .5, vegTipo: 'ornamental', pisosViv: 12 } }
};
export const PAR_SEMILLA = 2026, PAR_ENTRA = 12;   // semilla común y mes en que entra la propuesta (12 = enero de 2027)

// Ritmo de obra (fracción por mes) según las condiciones; la lluvia lo baja.
const BASE_RITMO = 1 / 54;
function ritmo(llueve) {
  const e = { planta: 1, lejos: .8, humedal: 1.15 }[S.escombros], fi = { publica: .7, mixta: 1, app: 1.15 }[S.financiacion];
  const co = { baja: .72, media: .9, alta: 1.05 }[S.concertacion], ho = S.horario === 'extendido' ? 1.25 : 1;
  // Más pisos, más niveles o más humedal = más obra (más lenta); lo contrario, más rápida.
  const tam = (6 / S.pisosViv) ** .3 * (4 / S.nivelesMercado) ** .25 * (1 / S.humedalEsc) ** .15 * ((S.nodos + 2) / 6) ** -.1;
  return BASE_RITMO * e * fi * co * ho * tam * (S.frentes / 2) ** .6 * (llueve ? .6 : 1);
}

// Reglas de game over: condición sostenida durante `meses` seguidos.
// Dos grupos: «más que humanos» (lo que necesitan las especies para vivir) y «humanos» (lo que necesita la ciudad).
export const GRUPOS = { mth: 'Más que humanos', hum: 'Humanos' };
const GAME_OVER = [
  { id: 'agua', g: 'mth', k: 'Q', menor: 15, meses: 3, titulo: 'Agua inhabitable',
    porque: 'Residuos, aguas servidas, calor o escombros dejaron el agua sin oxígeno: peces, anfibios, larvas y plantas acuáticas ya no pueden vivir en el humedal.' },
  { id: 'humedal', g: 'mth', k: 'H', menor: 35, meses: 1, titulo: 'El humedal se secó o fue rellenado',
    porque: 'Quedó menos de un tercio del espejo de agua de 2026 por rellenos, invasiones de la ronda, calor y años secos.' },
  { id: 'aves', g: 'mth', k: 'aves', menor: 18, meses: 3, titulo: 'Las aves se fueron',
    porque: 'Sin refugio, sin agua limpia, con ruido y sin corredores, quedan menos de 18 especies de aves.' },
  { id: 'abejas', g: 'mth', k: 'abejas', menor: 30, meses: 6, titulo: 'Sin polinizadores',
    porque: 'Las abejas caen por debajo del 30 % de 2026: falta vegetación con flor, hace calor y el aire está muy contaminado.' },
  { id: 'ensordecido', g: 'mth', k: 'Nh', mayor: 55, meses: 6, titulo: 'Humedal ensordecido',
    porque: 'El ruido sobre el humedal supera 55 dB durante seis meses: las aves no se oyen entre ellas, no pueden cantar para defender territorio ni anidar, y el humedal deja de ser refugio.' },
  { id: 'corredor', g: 'mth', k: 'K', menor: 30, meses: 6, titulo: 'Corredor ecológico roto',
    porque: 'La conexión verde entre La Vaca y los demás parques cae por debajo del 30 %: abejas y aves pequeñas ya no pueden moverse entre parches a distancia de vuelo, y las poblaciones quedan aisladas.' },
  { id: 'plagas', g: 'hum', k: 'plagas', mayor: 300, meses: 3, titulo: 'Emergencia sanitaria por plagas',
    porque: 'Ratas, moscas y palomas triplican lo de 2026 por la basura acumulada, el calor y el agua sucia, y no hay depredadores que las controlen.' },
  { id: 'residuos', g: 'hum', k: 'W', mayor: 4500, meses: 1, titulo: 'Emergencia de residuos',
    porque: 'Se acumulan más de 4.500 t de basura sin retirar alrededor de Corabastos.' },
  { id: 'vias', g: 'hum', k: 'vel', menor: 5, meses: 6, titulo: 'Colapso vial: no caben todos los vehículos',
    porque: 'La velocidad en hora pico cae por debajo de 5 km/h durante seis meses: hay más carros y camiones que capacidad en las vías (incluidas las cerradas por obra).' },
  { id: 'comida', g: 'hum', k: 'atencion', menor: 60, meses: 6, titulo: 'Desabastecimiento',
    porque: 'Corabastos atiende menos del 60 % de la comida que se necesita durante seis meses seguidos.' }
];

// Eventos: algunos llegan al azar (según la semilla) y otros emergen de cómo están las cosas.
// lugar: [x, z] en el modelo, o null (lo elige el territorio, p. ej. un punto de una avenida).
export const EVENTOS = {
  paro: { t: 'Paro camionero', d: 'Corabastos queda casi sin abastecimiento este mes.', lugar: [-1.29, 1.16], malo: true },
  accidente: { t: 'Accidente en una avenida', d: 'El tráfico se detiene durante horas.', lugar: null, malo: true },
  vertimiento: { t: 'Vertimiento ilegal en el humedal', d: 'Una mancha oscura se extiende en el agua.', lugar: [-1.62, 1.2], malo: true },
  incendio: { t: 'Incendio en la ronda del humedal', d: 'La época seca y el pasto seco lo propagan; queda una cicatriz.', lugar: [-1.58, 1.16], malo: true },
  calor: { t: 'Ola de calor', d: 'Las abejas salen menos, el humedal se evapora y la comida se daña.', lugar: [-.9, .7], malo: true },
  migratorias: { t: 'Llegan las aves migratorias', d: 'Aves del norte buscan el humedal para pasar la temporada.', lugar: [-1.604, 1.185], malo: false },
  migrPocas: { t: 'Las migratorias pasan de largo', d: 'El humedal no tiene agua ni refugio suficientes para que se queden.', lugar: [-1.604, 1.185], malo: true },
  inundacion: { t: 'Inundación', d: 'Llueve fuerte, el humedal no alcanza a recibir el agua y los sumideros están tapados de basura.', lugar: [-1.42, 1.05], malo: true },
  invasion: { t: 'Nueva invasión en la ronda', d: 'Aparecen construcciones en el borde del humedal.', lugar: [-1.55, 1.24], malo: true }
};

export function setupYears({ dynamics, obra, groups, invalidate }) {
  let corriendo = false, pausado = false, m = 0, vel = 1, ultimoMes = -1;
  let prop = { aplicada: false, inicio: 0, dur: 0, anos: 0 };
  let A = [], B = [], estadoA = null, estadoB = null, indicador = 'atencion';
  let goA = null, goB = null, cuentaA = {}, cuentaB = {}, ignorar = false, bitacora = [], cuentaEv = {};
  let fijo = null, ponerValores = null;
  let avisos = [], nivelVisto = {};   // cambios de nivel (alerta / falla localizada / crítica) del escenario que se ve   // par de escenarios cargado ({par, esc, t, pregunta, mod}) o null si es libre
  // CLIMA: TODOS los años llueve. Bogotá tiene dos temporadas de lluvias (abril–mayo y octubre–noviembre)
  // y dos secas (diciembre–febrero y julio–agosto). Lo que cambia con «Clima del periodo» es cuántos años
  // son de La Niña (más lluvia) o de El Niño (menos), nunca que deje de llover. Semilla fija: A y B ven el mismo clima.
  const MM = [40, 55, 85, 115, 105, 55, 45, 50, 65, 125, 105, 60];        // lluvia media mensual (mm), referencia Bogotá
  const TEMP = [13.6, 14, 14.3, 14.5, 14.4, 14, 13.7, 13.8, 13.9, 14, 14, 13.8];
  const VIENTO = [8, 8, 7, 6, 6, 9, 14, 15, 11, 7, 6, 7];
  // Semilla: cada «Simular» usa una distinta (al azar) para que nunca pase lo mismo; se muestra para poder repetir una corrida.
  // A y B comparten la semilla: el mismo clima y los mismos eventos al azar, para comparar de forma justa.
  function genClima(semilla = 42) {
    let s = Math.max(1, Math.floor(semilla) % 2147483646); const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 5; i++) r();
    const pNina = S.anoLluvioso >= .5 ? .45 : S.anoLluvioso <= .2 ? .1 : .2, pNino = S.anoLluvioso >= .5 ? .1 : S.anoLluvioso <= .2 ? .45 : .2;
    const tipo = Array.from({ length: 31 }, () => { const u = r(); return u < pNina ? 'nina' : u < pNina + pNino ? 'nino' : 'normal'; });
    const ruido = Array.from({ length: 31 * 12 }, () => .7 + r() * .6);
    // Eventos al azar por mes (más probables cuando el clima los favorece).
    const ev = Array.from({ length: 31 * 12 }, (_, mes) => {
      const mm = MM[mes % 12], t = tipo[Math.floor(mes / 12) % 31], seco = mm < 60, e = {};
      if (r() < .012) e.paro = 1;
      if (r() < .035) e.accidente = 1;
      if (r() < .016) e.vertimiento = 1;
      if (r() < (seco ? (t === 'nino' ? .12 : .03) : 0)) e.incendio = 1;
      if (r() < (seco ? (t === 'nino' ? .28 : .04) : .005)) e.calor = 1;
      if (mes % 12 === 8) e.migr = .6 + r() * .8;            // septiembre: llegan (o no) las migratorias
      e.uInv = r(); e.lugar = r();
      return e;
    });
    return { tipo, ruido, ev, semilla };
  }
  let clima = genClima();
  const nuevaSemilla = () => { const v = document.getElementById('c-semilla')?.value.trim(); return v && +v > 0 ? Math.floor(+v) : 1 + Math.floor(Math.random() * 99998); };
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
  function inicial() { return { W: S.residuos0, R: S.refugio0, Q: 55, H: 100, aves: 52, abejas: 100, V: 100, C: 2.5, inv: 0, f: -1 }; }
  function paso(mes, est, conProp) {
    const t = mes / 12, ano = Math.floor(t);
    const pico = S.transporte === 'pico', noche = S.transporte === 'nocturna';
    const D = 100 * (1 + S.demanda) ** t; let P = (1 + S.poblacion) ** t;
    let F = (1 + Math.max(0, S.flota - (pico ? .01 : 0))) ** t * (pico ? .94 : 1);
    const lluviaMM = mmMes(mes), llueve = lluviaMM > 95, seco = lluviaMM < 45;
    const ev = clima.ev[mes % clima.ev.length] || {}, eventos = [];
    const C0 = est.C ?? 2.5, V0 = est.V ?? 100, calor = Math.max(0, C0 - 3);   // calor del mes anterior (cadenas)
    // Avance de la obra: acumulado, a ritmo variable.
    let f = -1, rit = 0;
    if (conProp && prop.aplicada && mes >= prop.inicio) { rit = ritmo(llueve); f = Math.min(1, Math.max(0, est.f) + rit); }
    const obraActiva = f >= 0 && f < 1, demoliendo = obraActiva && f < .74;
    // VARIABLES DE LA PROPUESTA: cada una cuenta solo cuando su pieza existe.
    const vg = VEG[S.vegTipo] || VEG.nativa, vc = S.vegCant, hs = S.humedalEsc;
    const ov = f >= .84 ? 1 : f >= .44 ? .5 : 0;          // manzanas de María Paz renovadas (dos olas de obra)
    const mk = f >= .62 ? 1 : 0;                           // mercado vertical funcionando
    const dp = S.pisosViv - 6, dn = S.nivelesMercado - 4;  // pisos y niveles por encima (o debajo) de lo previsto
    const sembrado = f >= .76;                             // árboles nuevos plantados (parque, humedal, alameda)
    const sed = vc * vg.agua;                              // agua que toma la vegetación nueva (1 = la prevista, nativa)
    P *= 1 + .02 * dp * ov;                                // más pisos: más habitantes (viajes, residuos, aguas servidas)
    F *= 1 + .015 * dp * ov;
    const vivienda = Math.max(.3, 1 - .12 * dp * ov);      // presión para invadir la ronda: baja con más vivienda, sube con menos
    const altura = Math.max(.5, 1 - .025 * Math.max(0, dp) * ov - .035 * Math.max(0, dn) * mk);   // choques y vuelo bloqueado de aves
    // Abastecimiento
    let cap = S.capActual;
    if (f >= 0) cap = (f < .62 ? S.capActual * (f < .02 ? 1 : S.capObraBodegas) : S.capMercadoNuevo * (S.nivelesMercado / 4) ** .7) + (f >= .30 && S.nodos >= 2 ? S.capNodo : 0) + (f >= .33 && S.nodos >= 2 ? S.capNodo : 0);
    const local = f >= .39 && S.nodos >= 4 ? D * Math.min(.12, .07 + .05 * Math.max(0, f - .39) * 2) : 0;
    let atencion = Math.min(100, (cap * (llueve ? .88 : 1) + local) / D * 100);
    if (ev.paro) { atencion *= .55; eventos.push('paro'); }
    // Inundación (emerge): lluvia fuerte + humedal reducido o sumideros tapados de basura.
    const inunda = lluviaMM > 150 && (est.H < 85 || est.W > 1900);
    if (inunda) eventos.push('inundacion');
    // Movilidad
    const zonas = obraActiva ? obra.resumen().zonas * (S.frentes / 2) : 0;
    const cierre = 1 + .035 * zonas, camion = (f >= .62 ? .96 * (S.nivelesMercado / 4) ** .3 * (1 + .015 * (4 - S.nodos)) : 1) * (noche ? .95 : 1);
    const obraCam = obraActiva ? (S.escombros === 'lejos' ? 1.06 : 1.02) : 1;
    let vel = 26 / (1 + 1.1 * (F * cierre * camion * obraCam) ** 3) * (llueve ? .9 : 1);
    if (ev.accidente) { vel *= .8; eventos.push('accidente'); }
    if (inunda) vel *= .75;
    // Incendio (al azar, en meses secos; más en años de El Niño) y ola de calor
    const incendio = !!ev.incendio && est.H > 20; if (incendio) eventos.push('incendio');
    const ola = !!ev.calor; if (ola) eventos.push('calor');
    // Aire PM2,5 (el polvo de los meses secos y el humo de los incendios también cuentan)
    const pm = 22 * F ** .7 * (11 / Math.max(2, vel)) ** .35 + (demoliendo ? 1.2 * S.frentes + (S.horario === 'extendido' ? .5 : 0) : 0) - (f >= .98 ? 1 : 0) + (seco ? 1.5 : 0) + (incendio ? 9 : 0);
    // RUIDO (dB, día). En las avenidas: tráfico, camiones, trancones (frenar, acelerar, pitar) y obra.
    // En el humedal: lo que llega de las avenidas menos lo que atenúan la ronda con vegetación y el espejo de agua.
    const N = 66 + 10 * Math.log10(F * cierre * camion * obraCam) + Math.max(0, 12 - vel) * .35 + (demoliendo ? 2.5 : 0) + (obraActiva && S.horario === 'extendido' ? 1.5 : 0) + (ev.accidente ? 1 : 0);
    // Residuos sin retirar (el calor daña la comida: más desperdicio)
    const genMercado = S.generacion * Math.min(D, cap + local) * (f >= .36 ? 1 - S.aprovechamiento * (S.nodos >= 4 ? 1 : .3) : 1) * (1 + calor * .03 + (ola ? .05 : 0));
    const gen = genMercado + S.generacionBarrio * P ** 1.3;   // el barrio genera más a medida que crece y se densifica
    const ret = (f >= .36 ? S.retiroPropuesta : S.retiroActual) * (llueve ? .85 : 1);
    const W = Math.max(0, est.W + gen - ret - (inunda ? 40 : 0));   // la inundación arrastra basura… al agua
    const tirando = obraActiva && S.escombros === 'humedal';
    // Calidad del agua del humedal (0 negra – 100 limpia)
    // Lixiviados de basura, aguas servidas de la población, menos espejo (menos dilución), calor (algas); la lluvia diluye.
    let objQ = 74 - W / 70 - (P - 1) * 90 - Math.max(0, 100 - est.H) / 5 - (tirando ? 45 : 0) + (llueve ? 4 : 0) + (f >= .98 ? 26 * (.5 + .5 * hs) : f >= .66 ? 8 : 0) - calor * 2.5;
    let Q = Math.max(0, Math.min(100, est.Q + (objQ - est.Q) * .08));
    if (ev.vertimiento) { Q = Math.max(0, Q - 9); eventos.push('vertimiento'); }
    if (inunda) Q = Math.max(0, Q - 3);
    // Espejo de agua (% del de 2026)
    // Rellenos e invasiones crecen con la población; los meses secos evaporan (más con calor), la lluvia recarga un poco.
    let H = est.H - S.perdidaRonda * 1.9 * P / 12 - (tirando ? .45 : 0) - (seco ? .32 + calor * .06 : 0) + (llueve ? .05 : 0) - (incendio ? .6 : 0) - (seco && sembrado ? .05 * Math.max(0, sed - 1) : 0);   // la vegetación nueva sedienta seca el humedal
    // Invasión de la ronda (emerge): más probable con más población y sin control; la propuesta protege la ronda.
    let inv = est.inv || 0;
    if (ev.uInv < .02 * S.perdidaRonda * P ** 2 * (f >= .98 ? .15 : 1) * vivienda && H > 30) { H -= .6; inv++; eventos.push('invasion'); }
    // Humedal ampliado: crece hasta un máximo que depende de su tamaño y de cuánta agua toma la vegetación nueva.
    if (f >= .98) { const Hmax = (100 + 60 * hs) * Math.max(.5, 1 - .1 * (sed - 1)); if (H < Hmax) H = Math.min(Hmax, H + 1.2); }
    H = Math.max(0, H);
    // Refugio (%)
    let objR = 62 - S.perdidaRonda * t - W / 450 - Math.max(0, 55 - Q) / 6 - inv * .4;
    if (f >= .66 && f < .98) objR -= 6;
    if (f >= .98) objR += 28 * hs ** .5 * (.6 + .4 * vc) * vg.hab;
    let R = Math.max(0, Math.min(100, est.R + (objR - est.R) * .05));
    if (incendio) R = Math.max(0, R - 3);
    const Nh = N - (8 + 10 * (R / 58) ** .4 * (Math.max(1, H) / 100) ** .15 + (f >= .98 ? 5 * (.7 + .3 * vc) * (.5 + .5 * vg.hab) : f >= .66 ? 2 : 0)) + (noche ? 1 : 0) + (obraActiva && S.horario === 'extendido' ? 2 : 0);
    // VEGETACIÓN (% de 2026): depende de los polinizadores, del agua del humedal, del calor y de la ronda; la propuesta siembra.
    let objV = 100 * (Math.max(1, est.abejas) / 100) ** .15 * (Math.max(1, est.H) / 100) ** .1 * (1 - calor * .025) - S.perdidaRonda * t * .5 - inv * .3 + (f >= .98 ? 32 * vc * (S.vegTipo === 'ornamental' ? 1.1 : 1) : f >= .5 ? 8 : 0) - Math.max(0, -dp) * 2 * ov;   // con menos pisos se necesita más huella: menos suelo verde
    let V = Math.min(170, Math.max(0, V0 + (objV - V0) * .04 - (incendio ? 4 : 0) - (seco ? .1 : 0)));
    // ISLA DE CALOR (°C por encima del humedal y los parques): menos vegetación, más asfalto y tráfico, menos agua.
    const C = 2.5 + (100 - Math.min(130, V)) / 40 + (F - 1) * 1.0 + Math.max(0, 100 - H) / 80 + (ola ? 2 : 0) + (clima.tipo[ano % 31] === 'nino' ? .5 : 0) - (f >= .98 ? .6 + .4 * vc : f >= .5 ? .3 : 0) + .05 * Math.max(0, dp) * ov;
    // CORREDOR ECOLÓGICO (% de conexión de 2026): vegetación, refugio y humedal; las avenidas ruidosas lo cortan.
    const K = Math.min(140, 100 * (V / 100) ** .8 * (R / 58) ** .7 * (Math.max(1, H) / 100) ** .2 * Math.max(.4, Math.min(1, 1 - Math.max(0, N - 69) * .03)) + (f >= .98 ? 25 * (.6 + .4 * vc) * vg.hab * (.5 + .5 * hs) : f >= .5 ? 6 : 0) - 2.2 * Math.max(0, dp) * ov - 2 * Math.max(0, dn) * mk);
    // Aves (especies), abejas (% de 2026) y plagas (% de 2026)
    let migr = 0;
    if (ev.migr) { if (H > 60 && Q > 35 && Nh < 55) { migr = ev.migr; eventos.push('migratorias'); } else eventos.push('migrPocas'); }
    const estacion = [1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1][mes % 12] && H > 60 && Q > 35 ? 1.04 : 1;   // temporada de migratorias (sep–abr)
    const objAves = 52 * (R / 58) ** 1.0 * (Math.max(1, Q) / 55) ** .6 * (Math.max(1, H) / 100) ** .5 * Math.max(.3, Math.min(1.15, 1 - (Nh - 50) * .035)) * (Math.max(1, K) / 100) ** .15 * estacion * altura;
    const topeAves = 52 + 23 * (f >= .98 ? hs * (.5 + .5 * vg.hab) : 1);   // especies que el humedal (ampliado) podría sostener
    const aves = est.aves + (Math.min(topeAves, objAves) - est.aves) * .06 + migr * 1.5;
    const verde = f >= .98 ? 1 + .15 * vc ** .5 * vg.flor : f >= .5 ? 1.05 : 1;
    const objAbejas = 100 * (R / 58) ** .8 * (22 / pm) ** 1.6 * verde * (Math.max(1, V) / 100) ** .35 * (1 - calor * .04) * (Math.max(1, K) / 100) ** .15;
    const abejas = (est.abejas + (objAbejas - est.abejas) * .06) * (ola ? .93 : 1);
    const plagas = 100 * ((W + 300) / 1500) ** 1.3 * (1 + Math.max(0, 40 - Q) / 80) * (52 / Math.max(8, aves)) ** .15 * (1 + calor * .08);   // sobre todo por basura
    // Trabajo
    const extraConflicto = S.concertacion === 'baja' ? 10 : S.concertacion === 'alta' ? -5 : 0;
    const empleo = f < 0 ? 0 : f >= 1 ? 4 : f < .02 ? 0 : f < .62 ? 15 + extraConflicto : f < .64 ? 30 + extraConflicto : 8;
    return { mes, ano: INICIO + ano, D, F, P, cap, atencion, vel, pm, W, R, Q, H, aves, abejas, plagas, empleo, V, C, N, Nh, K, inv, inunda, eventos, lugarEv: ev.lugar, dependencia: 100 - local / D * 100, f, rit, llueve, lluviaMM, dias: diasLluvia(mes, clima), tipoAno: clima.tipo[ano % 31] };
  }

  // Corrida rápida sin interfaz (para calibrar y comparar condiciones): window.simModelo.correr({ flota: .01, ... }).
  window.simModelo = {
    // entra: mes en que entra la propuesta (escenario B); sin entra corre el escenario A.
    // par: 'P1'…'P6' carga las condiciones y la semilla de ese par.
    // limites: { agua: 18, … } cambia el límite de una regla solo en esta corrida (para probar la sensibilidad de los umbrales).
    correr(cambios = {}) {
      const pp = PARES[cambios.par], { semilla = pp ? PAR_SEMILLA : 42, entra = null, par, limites = {}, ...resto } = cambios;
      const guardado = { ...S }, climaG = clima, propG = prop; Object.assign(S, pp ? { ...DEFECTO, ...pp.cond } : {}, resto); clima = genClima(semilla);
      if (entra != null) prop = { aplicada: true, inicio: entra, dur: 0, anos: 0 };
      let x = inicial(), ini = null; const cuenta = {}, primeros = {}; let primero = null;
      for (let mes = 0; mes < MESES; mes++) {
        x = paso(mes, x, entra != null); if (!ini) ini = x;
        for (const g of GAME_OVER) { const v = x[g.k], L = limites[g.id] ?? (g.menor ?? g.mayor), cae = g.menor != null ? v < L : v > L; cuenta[g.id] = cae ? (cuenta[g.id] || 0) + 1 : 0; if (cuenta[g.id] >= g.meses && primeros[g.id] == null) primeros[g.id] = INICIO + mes / 12; }
      }
      for (const [id, a] of Object.entries(primeros)) if (!primero || a < primero[1]) primero = [id, a];
      Object.assign(S, guardado); clima = climaG; prop = propG;
      const r = v => Math.round(v * 10) / 10;
      return { ini, primero: primero ? `${primero[0]} ${r(primero[1])}` : 'ninguno', todos: Object.fromEntries(Object.entries(primeros).map(([k, v]) => [k, r(v)])), fin2056: { vel: r(x.vel), Q: r(x.Q), H: r(x.H), aves: r(x.aves), abejas: r(x.abejas), plagas: r(x.plagas), W: Math.round(x.W), atencion: r(x.atencion), V: r(x.V), C: r(x.C), N: r(x.N), Nh: r(x.Nh), K: r(x.K), inv: x.inv } };
    }
  };

  // Revisión de game over; devuelve la regla que cae o null.
  // Regla del sistema integrado (ciudad + ecosistema): cae con la PRIMERA de las reglas de GAME_OVER que se cumpla;
  // es la misma en A y en B. Nivel de cada regla en un momento: 0 bien · 1 alerta temprana (cruzó el umbral naranja del indicador)
  // · 2 falla localizada (cruzó el límite ☠, aún no se sostiene los meses de la regla) · 3 condición crítica (game over).
  function nivel(g, x, cuenta) {
    const n = cuenta[g.id] || 0; if (n >= g.meses) return 3; if (n > 0) return 2;
    const um = IND.find(i => i[1] === g.k)?.[3], v = x[g.k]; if (!um) return 0;
    return (g.menor != null ? v < um[0] : v > um[0]) ? 1 : 0;
  }
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
  const REFERENCIA = { escombros: 'planta', financiacion: 'mixta', frentes: 2, concertacion: 'media', horario: 'diurno', pisosViv: 6, nivelesMercado: 4, humedalEsc: 1, nodos: 4 };
  const NOMBRE = {
    pisosViv: new Proxy({}, { get: (_, v) => `Manzanas de ${v} pisos (en vez de 6)` }),
    nivelesMercado: new Proxy({}, { get: (_, v) => `Mercado de ${v} niveles (en vez de 4)` }),
    humedalEsc: new Proxy({}, { get: (_, v) => `Humedal al ${Math.round(v * 100)} % de lo previsto` }),
    nodos: { 0: 'Sin nodos repartidos', 2: 'Solo 2 nodos de distribución' },
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
  // Exagerado a propósito: cada 5 % real de cambio se ve como un escalón de ~17 % (si no, el ojo no lo nota).
  const exa = (v, v0 = 1, gan = 3.5) => Math.max(.2, 1 + gan * Math.trunc((v - v0) / v0 / .05) * .05);
  const pintarAgua = () => {};   // el color del agua ahora lo maneja territorio.js (agua, espejo, manchas)
  // Clima visible en 3D durante la simulación: sigue el calendario (días con y sin lluvia, nubes, temperatura, viento).
  // Se vuelve a sortear cada ~0,4 s (≈ 12 días simulados) con la probabilidad de lluvia de ese mes.
  const CLIMA_IDS = ['rain', 'cloud', 'temp', 'wind'];
  function clima3D(x, mes) {
    if (!x) return;
    const llueveHoy = Math.random() < x.dias / 30, t = x.tipoAno;
    const lluvia = llueveHoy ? Math.min(25, Math.round((1 + x.lluviaMM / 18 * (.5 + Math.random())) * 2) / 2) : 0;
    fijar('rain', lluvia);
    fijar('cloud', Math.round(llueveHoy ? 70 + Math.random() * 25 : Math.min(65, 15 + x.lluviaMM / 3 + Math.random() * 15)));
    fijar('temp', Math.round((TEMP[mes % 12] + 5 + (t === 'nino' ? .9 : t === 'nina' ? -.5 : 0) - (llueveHoy ? 1.5 : 0) + ((x.C ?? 2.5) - 2.5)) * 2) / 2);
    fijar('wind', Math.round(VIENTO[mes % 12] + Math.random() * 5));
  }
  const bloquearClima = on => CLIMA_IDS.forEach(id => { const el = document.getElementById(id); if (el) { el.disabled = on; el.closest('label')?.classList.toggle('por-calendario', on); } });
  function visual(x) {
    fijar('n-car', Math.min(7500, Math.round(BASE.car * exa(x.F) / 50) * 50));
    fijar('n-moto', Math.min(800, Math.round(BASE.moto * exa(x.F) / 10) * 10));
    fijar('n-taxi', Math.min(350, Math.round(BASE.taxi * exa(x.F) / 5) * 5));
    fijar('n-truck', Math.min(90, Math.round(BASE.truck * exa(x.D / 100) * (x.f >= .62 ? .6 : 1) * (S.transporte === 'nocturna' ? .7 : 1) * (x.eventos?.includes('paro') ? .15 : 1))));
    fijar('n-person', Math.min(1400, Math.round(BASE.person * exa(x.P, 1, 2.5) / 10) * 10));
    fijar('bays', x.f >= .62 ? 8 : 3);
    fijar('remove', x.f >= .36 ? 300 : 120);
    pintarAgua(x);
  }

  // ---------- Panel ----------
  const panel = document.createElement('section'); panel.id = 'anos-panel'; panel.hidden = true; document.body.append(panel);
  panel.innerHTML = `<header><b id="an-titulo">Simulación en el tiempo</b><span class="sp"></span>
      <button id="an-pausa" title="Pausar los años (la ciudad sigue)">⏸</button>
      <small class="dim" id="an-vel">1 mes por segundo</small></header>
    <div class="an-fecha"><span id="an-ano">2026</span><span id="an-mes"></span><span id="an-lluvia"></span></div>
    <div class="obra-barra an-barra"><span id="an-obra" hidden></span><i id="an-prog"></i></div>
    <div class="an-ejes"><span>2026</span><span>2036</span><span>2046</span><span>2056</span></div>
    <div id="an-go" hidden></div>
    <div id="an-aplicar"><small id="an-dur"></small></div>
    <div id="an-obra-info" class="obra-nota" hidden></div>
    <div id="an-eventos"><b>Lo que está pasando</b><ul></ul></div>
    <p class="an-regla" title="Regla del sistema integrado (ciudad + ecosistema)"><b>Regla del sistema:</b> la simulación cae con la <b>primera</b> de las ${GAME_OVER.length} reglas que se cumpla (${GAME_OVER.filter(g => g.g === 'mth').length} más que humanos y ${GAME_OVER.filter(g => g.g === 'hum').length} humanos). Cada indicador pasa por tres niveles: <span class="nv1">alerta temprana</span> (cruza el umbral naranja), <span class="nv2">falla localizada</span> (cruza el límite ☠, cuenta los meses) y <span class="nv3">condición crítica</span> (se sostiene los meses de la regla: game over).</p>
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
    ['Trabajo', 'empleo', '% perdido', [20, 30], false, 0],
    ['Vegetación', 'V', '% de 2026', [80, 55], true, 0], ['Isla de calor', 'C', '°C más', [4, 6], false, 1],
    ['Ruido en avenidas', 'N', 'dB', [70, 75], false, 0], ['Ruido en el humedal', 'Nh', 'dB', [52, 55], false, 0],
    ['Corredor ecológico', 'K', '% conexión', [60, 30], true, 0]
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
    $('#an-titulo').innerHTML = (fijo ? `<span class="an-par">${fijo.par}${fijo.esc}</span> ` : '') + (prop.aplicada ? `Con propuesta · desde ${anoDe(prop.inicio)}` : 'Sin intervenir · estado actual') + ` <small class="dim" title="Cada corrida usa una semilla de azar distinta. Escríbela en «Condiciones de partida» para repetir exactamente esta corrida.">· semilla ${clima.semilla}</small>`;
    const lista = [...bitacora.map(e => ({ mes: e.mes, html: `<li class="${EVENTOS[e.id].malo ? 'malo' : 'bueno'}"><small>${fecha(e.mes)}</small> ${EVENTOS[e.id].t}${e.n > 1 ? ` <small>(${e.n}.ª vez)</small>` : ''}</li>` })),
      ...avisos.map(a => ({ mes: a.mes, html: `<li class="aviso nv${a.nv}"><small>${fecha(a.mes)}</small> ${a.t}</li>` }))].sort((a, b) => a.mes - b.mes);
    $('#an-eventos ul').innerHTML = lista.slice(-8).reverse().map(e => e.html).join('') || '<li class="dim">Nada fuera de lo normal todavía.</li>';
    $('#an-aplicar').hidden = prop.aplicada || !!goVisto() || !!fijo; boton(); rotulo();
    $('#an-dur').textContent = `Si aplicas la propuesta ahora, con estas condiciones la obra duraría ≈ ${num(duracion(mes) / 12, 1)} años`;
    const ob = $('#an-obra'); ob.hidden = !prop.aplicada; if (prop.aplicada) { ob.style.left = (prop.inicio / MESES * 100) + '%'; ob.style.width = (prop.dur / MESES * 100) + '%'; }
    const info = $('#an-obra-info');
    if (prop.aplicada && log && x.f >= 0) { info.hidden = false; info.innerHTML = informe(x, mes); }
    else info.hidden = true;
    $('#an-ind').innerHTML = IND.map(([n, k, u, um, mas, dec]) => {
      const vB = x[k], vA = estadoA[k], c = color(vB, um, mas), dif = prop.aplicada ? vB - vA : 0;
      const go = GAME_OVER.find(g => g.k === k), r = go ? Math.max(0, Math.min(1, mas ? (um[0] - vB) / (um[0] - um[1]) : (vB - um[0]) / (um[1] - um[0]))) : null;
      const nv = go ? nivel(go, x, prop.aplicada ? cuentaB : cuentaA) : 0;
      const nvTxt = nv === 3 ? 'condición crítica · game over' : nv === 2 ? `falla localizada · ${(prop.aplicada ? cuentaB : cuentaA)[go.id]} de ${go.meses} ${go.meses === 1 ? 'mes' : 'meses'}` : nv === 1 ? 'alerta temprana' : '';
      return `<div class="an-k ${c}${nv ? ' nv' + nv : ''}">${nvTxt ? `<small class="an-nv">${nvTxt}</small>` : ''}${go ? `<i class="an-riesgo" title="Qué tan cerca está del game over (límite: ${go.menor != null ? '<' + go.menor : '>' + go.mayor})"><s style="width:${(r * 100).toFixed(0)}%"></s></i>` : ''}<span>${n}${go ? ' <small class="lim">☠ ' + (go.menor != null ? '<' + num(go.menor) : '>' + num(go.mayor)) + '</small>' : ''}</span><b>${num(vB, dec)}<small> ${u}</small></b>${prop.aplicada && Math.abs(dif) > .05 ? `<em class="${(dif > 0) === mas ? 'mejor' : 'peor'}">${dif > 0 ? '+' : ''}${num(dif, dec || (Math.abs(dif) < 10 ? 1 : 0))} vs sin intervenir</em>` : ''}</div>`;
    }).join('');
    $('#an-leyB').hidden = !prop.aplicada;
    // Game over
    const go = goVisto(), box = $('#an-go');
    if (go) {
      const otro = prop.aplicada ? (goA ? `Sin intervenir cae en ${anoDe(goA.mes)}: ${goA.titulo.toLowerCase()}.` : 'Sin intervenir no cae en ese momento.') : '';
      box.hidden = false;
      const regla = `${GRUPOS[go.g] || ''} · ${IND.find(i => i[1] === go.k)?.[0] || go.k} ${go.menor != null ? '<' : '>'} ${num(go.menor ?? go.mayor)} durante ${go.meses} ${go.meses === 1 ? 'mes' : 'meses seguidos'}`;
      const desde = prop.aplicada ? ` · ${durTexto(Math.max(0, go.mes - prop.inicio))} después de aplicar la propuesta` : '';
      box.innerHTML = `<b>GAME OVER · ${fecha(go.mes)}</b><small class="an-go-t">${durTexto(go.mes + 1)} desde enero de ${INICIO}${desde}</small><h4>${go.titulo}</h4><p>${go.porque}</p><p class="an-go-regla">Regla cumplida: ${regla}. Es la primera de las ${GAME_OVER.length} reglas del sistema que se cumplió.</p>
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
    A = []; B = []; estadoA = null; estadoB = null; log = null; goA = goB = null; cuentaA = {}; cuentaB = {}; clima = genClima(nuevaSemilla()); bitacora = []; cuentaEv = {}; avisos = []; nivelVisto = {}; bloquear();
    document.dispatchEvent(new CustomEvent('sim-inicio', { detail: { semilla: clima.semilla } }));
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
        INICIO, MESES, A: A.slice(0, ultimoMes + 1), B: B.slice(0, ultimoMes + 1), prop: { ...prop }, log: log && { ...log }, goA, goB, IND, GAME_OVER, GRUPOS, EVENTOS,
        semilla: clima.semilla, bitacora: bitacora.slice(), par: fijo && { codigo: fijo.par + fijo.esc, t: fijo.t, pregunta: fijo.pregunta, mod: fijo.mod, esc: fijo.esc }, capturas: window.simTerritorio?.capturas?.(),
        clima: (() => { const anos = Math.floor(ultimoMes / 12) + 1, t = clima.tipo.slice(0, anos), A0 = A.slice(0, ultimoMes + 1); return { nina: t.filter(x => x === 'nina').length, nino: t.filter(x => x === 'nino').length, normal: t.filter(x => x === 'normal').length, mesesLluvia: A0.filter(x => x.llueve).length, dias: A0.reduce((a, x) => a + x.dias, 0), mm: A0.reduce((a, x) => a + x.lluviaMM, 0) }; })(),
        condiciones: CONDICIONES.filter(c => c.k).map(c => [c.t, fmtC(c)]),
        informeHTML: prop.aplicada && log ? informe(estadoB, ultimoMes) : ''
      });
    }
    corriendo = false; panel.hidden = true; document.body.classList.remove('anos-mode', 'game-over');
    if (obra.activo) obra.detener();
    fijar('n-car', 3000); fijar('n-moto', 260); fijar('n-taxi', 100); fijar('n-truck', 24); fijar('n-person', 450); fijar('bays', 3); fijar('remove', 120);
    fijar('rain', 0); fijar('cloud', 20); fijar('temp', 19); fijar('wind', 5); bloquearClima(false); dynamics.setLento?.(1);
    pintarAgua(null); document.dispatchEvent(new CustomEvent('sim-fin'));
    boton(); bloquear(); invalidate();
  }

  let ultimoTexto = 0;
  function update(now, dt) {
    if (!corriendo) return;
    if (!pausado && !dynamics.state().paused && m < MESES - 1) m = Math.min(MESES - 1, m + dt * vel);
    const antes = ultimoMes;
    // Par guardado, escenario B: la propuesta entra sola y siempre en el mismo mes (comparable y reproducible).
    if (fijo?.esc === 'B' && !prop.aplicada && m >= PAR_ENTRA && (!goVisto() || ignorar)) { m = PAR_ENTRA; avanzarHasta(PAR_ENTRA); aplicar(); }
    avanzarHasta(Math.floor(m));
    if (ultimoMes !== antes) {
      // Eventos de los meses que acaban de pasar en el escenario que se ve: a la bitácora y al territorio (pulsos en el lugar).
      const serie = prop.aplicada ? B : A;
      for (let mes = antes + 1; mes <= ultimoMes; mes++) for (const id of serie[mes]?.eventos || []) {
        cuentaEv[id] = (cuentaEv[id] || 0) + 1; bitacora.push({ id, mes, n: cuentaEv[id] });
        document.dispatchEvent(new CustomEvent('sim-evento', { detail: { id, mes, ...EVENTOS[id], azar: serie[mes].lugarEv } }));
      }
      // Niveles de cada regla en el escenario que se ve: se anota cuando sube (alerta → falla localizada → crítica).
      const xv = mostrado(), cv = prop.aplicada ? cuentaB : cuentaA;
      if (xv) for (const g of GAME_OVER) {
        const n = nivel(g, xv, cv), p = nivelVisto[g.id] || 0;
        if (n > p) avisos.push({ mes: ultimoMes, nv: n, t: `${['', 'Alerta temprana', 'Falla localizada', 'Condición crítica'][n]}: ${IND.find(i => i[1] === g.k)?.[0] || g.k}${n === 2 ? ` (cruzó ${g.menor != null ? '<' : '>'} ${num(g.menor ?? g.mayor)}; game over si sigue ${g.meses} ${g.meses === 1 ? 'mes' : 'meses'})` : ''}` });
        nivelVisto[g.id] = Math.max(p, n);   // cada nivel se anota solo la primera vez (si oscila con las lluvias no se repite)
      }
      visual(mostrado()); dibujar(); textos();
    }
    if (prop.aplicada && estadoB?.f >= 0) obra.fijar(Math.min(1, estadoB.f + (estadoB.f < 1 ? (m % 1) * estadoB.rit : 0)));   // la obra avanza suave entre meses
    if (now - ultimoTexto > 300) { ultimoTexto = now; textos(); }
    if (!pausado && (!update.clima || now - update.clima > 400)) { update.clima = now; clima3D(mostrado(), Math.floor(m)); }
    // Saturación vial visible: el 3D va tan lento como dice el modelo (pleno en hora pico, atenuado fuera de ella).
    const xv = mostrado(); if (xv && dynamics.setLento) {
      const h = +(document.getElementById('hour')?.value ?? 8) % 24, pico = (h >= 6 && h < 9.5) || (h >= 16 && h < 19.5);
      const r = Math.min(1.15, xv.vel / 12.4); dynamics.setLento(pico ? r : r ** .4);
    }
    invalidate();
  }

  // ---------- Botón Simular y condiciones de partida (panel derecho) ----------
  const boton = () => {
    const b = document.querySelector('[data-scen=actual]'); if (!b) return;
    b.textContent = corriendo ? '■ Terminar y ver resultados' : '▶ Simular'; b.title = corriendo ? 'Terminar la simulación: muestra gráficas y conclusiones de todo lo que pasó' : 'Correr los años desde 2026, un mes por segundo'; b.classList.toggle('corriendo', corriendo);
    const ap = document.getElementById('btn-aplicar'); if (ap) { ap.hidden = !corriendo || prop.aplicada || !!goVisto() || !!fijo; ap.onclick = () => aplicar(); }
    // Acelerar: 1 año cada 2 segundos (6 meses/s); se vuelve a la velocidad normal (1 mes/s) con el mismo botón.
    let ac = document.getElementById('btn-acelerar');
    if (!ac && b.parentElement) { ac = document.createElement('button'); ac.id = 'btn-acelerar'; b.parentElement.insertBefore(ac, document.getElementById('sim-fecha')); ac.onclick = () => { vel = vel > 1 ? 1 : 6; boton(); }; }
    if (ac) { ac.hidden = !corriendo; ac.classList.toggle('activo', vel > 1); ac.textContent = vel > 1 ? '▶ Velocidad normal · 1 mes por segundo' : '⏩ Acelerar · 1 año cada 2 segundos'; }
    const lv = panel.querySelector('#an-vel'); if (lv) lv.textContent = vel > 1 ? '⏩ 1 año cada 2 s' : '1 mes por segundo';
    if (!corriendo) { const sf = document.getElementById('sim-fecha'); if (sf) sf.hidden = true; }
  };
  const fmt = (c, v) => c.sel ? '' : (v * c.esc).toFixed(c.step < 1 && c.esc === 100 ? 1 : 0).replace('.', ',');
  function condiciones() {
    const b = document.querySelector('[data-scen=actual]'); if (!b || document.getElementById('condiciones')) return;
    const d = document.createElement('details'); d.id = 'condiciones'; d.className = 'condiciones';
    d.innerHTML = `<summary>Condiciones de partida <small>(se fijan al pulsar Simular)</small></summary>
      <p class="help">Cómo evoluciona el territorio en los próximos 30 años y cómo se haría la obra. Los valores por defecto son de ensayo, por calibrar con fuentes.</p>
      <label class="cond cond-par">Escenario guardado (pares de la entrega)<select id="c-par"><option value="">Libre · condiciones a mano</option>${Object.entries(PARES).map(([k, p]) => `<optgroup label="${k} · ${p.t}"><option value="${k}-A">${k}A · sin intervenir</option><option value="${k}-B">${k}B · con propuesta</option></optgroup>`).join('')}</select><small id="c-par-ayuda">Carga las condiciones, la semilla (${PAR_SEMILLA}) y el mes en que entra la propuesta (${fecha(PAR_ENTRA).toLowerCase()}). También se abre con un enlace: <code>?par=P1&amp;esc=B</code></small></label>
      ${CONDICIONES.map(c => c.g ? `<h5 class="cond-g">${c.g}</h5>` : c.sel
        ? `<label class="cond">${c.t}<select id="${c.id}">${c.sel.map(([n, v]) => `<option value="${v}" ${v === S[c.k] ? 'selected' : ''}>${n}</option>`).join('')}</select><small>${c.ayuda}</small></label>`
        : `<label class="cond"><span>${c.t}<output id="${c.id}-v">${fmt(c, S[c.k])} ${c.u}</output></span><input type="range" id="${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${+(S[c.k] * c.esc).toFixed(2)}"><small>${c.ayuda}</small></label>`).join('')}
      <p class="cond-dur" id="cond-dur"></p>
      <label class="cond">Semilla de azar<input type="number" id="c-semilla" min="1" max="99999" placeholder="vacío = distinta cada vez"><small>Cada corrida sortea clima y eventos (paros, incendios, vertimientos, olas de calor…) con una semilla distinta, para que nunca pase lo mismo. Escribe la semilla de una corrida anterior para repetirla exactamente.</small></label>
      <button type="button" id="cond-reset">Restablecer valores de ensayo</button>`;
    (document.getElementById('scen-help') || b).after(d);
    // Botones de escenarios listos: cargan las variables del par y empiezan a simular al ritmo normal (1 mes por segundo).
    // Después se puede elegir «Libre» y mover las variables a mano.
    const listos = document.createElement('div'); listos.id = 'escenarios-listos';
    listos.innerHTML = `<h5>Escenarios listos <small>cargan sus variables y empiezan a simular; también puedes moverlas tú en «Condiciones de partida»</small></h5>` +
      Object.entries(PARES).map(([k, p]) => `<div class="esc-par" title="${p.pregunta}"><span><b>${k}</b>${p.t}</span><button data-par="${k}-A" title="Sin intervenir">A</button><button data-par="${k}-B" title="Con propuesta (entra en ${fecha(PAR_ENTRA).toLowerCase()})">B</button></div>`).join('') +
      `<p class="esc-ley"><b>A</b> sin intervenir · <b>B</b> con propuesta (entra en ${fecha(PAR_ENTRA).toLowerCase()}) · semilla ${PAR_SEMILLA}</p>` +
      `<button type="button" class="esc-libre" id="esc-libre">Modo libre · mover variables y aplicar la propuesta cuando quieras</button>`;
    d.before(listos);
    listos.querySelectorAll('[data-par]').forEach(x => x.onclick = () => { if (corriendo) detener(); elegirPar(x.dataset.par); iniciar(); });
    listos.querySelector('#esc-libre').onclick = () => { if (corriendo) detener(); elegirPar(''); const c = document.getElementById('condiciones'); c?.setAttribute('open', ''); };
    const durTxt = () => { const meses = duracion(0, genClima()); document.getElementById('cond-dur').innerHTML = `Duración estimada de la obra: <b>≈ ${num(meses / 12, 1)} años</b> <small>(si empieza en 2026; depende también de la lluvia de esos años)</small>`; };
    const leer = c => { const el = document.getElementById(c.id), v = el.value; S[c.k] = c.sel ? (isNaN(+v) ? v : +v) : +v / c.esc; if (c.k in OPC) OPC[c.k] = S[c.k]; if (!c.sel) document.getElementById(c.id + '-v').textContent = `${fmt(c, S[c.k])} ${c.u}`; durTxt(); };
    for (const c of CONDICIONES) { if (!c.k) continue; const el = document.getElementById(c.id); el.addEventListener('input', () => leer(c)); el.addEventListener('change', () => leer(c)); leer(c); }
    ponerValores = vals => { for (const c of CONDICIONES) { if (!c.k) continue; const el = document.getElementById(c.id); el.value = c.sel ? String(vals[c.k]) : +(vals[c.k] * c.esc).toFixed(2); leer(c); } };
    d.querySelector('#cond-reset').onclick = () => { elegirPar(''); ponerValores(DEFECTO); };
    d.querySelector('#c-par').onchange = e => elegirPar(e.target.value);
    // Si se toca una condición o la semilla con un par cargado, se pasa a modo libre: vuelve el botón «Aplicar propuesta».
    d.addEventListener('input', e => { if (fijo && e.isTrusted && e.target.id !== 'c-par') elegirPar(''); });
    bloquear();
  }
  function elegirPar(v) {
    const [par, esc] = String(v || '').split('-');
    fijo = PARES[par] && (esc === 'A' || esc === 'B') ? { par, esc, ...PARES[par], mod: false } : null;
    if (fijo) { ponerValores?.({ ...DEFECTO, ...PARES[par].cond }); const se = document.getElementById('c-semilla'); if (se) se.value = PAR_SEMILLA; }
    const sel = document.getElementById('c-par'); if (sel) sel.value = fijo ? `${par}-${esc}` : '';
    document.querySelectorAll('#escenarios-listos [data-par]').forEach(x => x.classList.toggle('active', !!fijo && x.dataset.par === `${par}-${esc}`));
    document.getElementById('esc-libre')?.classList.toggle('active', !fijo);
    if (!fijo) { const ay = document.getElementById('c-par-ayuda'); if (ay) ay.innerHTML = 'Modo libre: mueves las variables y pulsas «Aplicar propuesta» cuando quieras.'; }    const ay = document.getElementById('c-par-ayuda');
    if (ay && fijo) ay.innerHTML = `<b>${fijo.pregunta}</b> ${esc === 'B' ? `La propuesta entra sola en ${fecha(PAR_ENTRA).toLowerCase()}.` : 'No se aplica la propuesta.'} Semilla ${PAR_SEMILLA}. Enlace: <code>?par=${par}&amp;esc=${esc}</code>`;
    rotulo(); boton();
  }
  // Rótulo siempre visible para grabar: código del par, tipo de escenario, pregunta y semilla.
  const rot = document.createElement('div'); rot.id = 'sim-rotulo'; rot.hidden = true; document.body.append(rot);
  function rotulo() {
    rot.hidden = !fijo; if (!fijo) return;
    const B_ = fijo.esc === 'B', sem = corriendo ? clima.semilla : PAR_SEMILLA;
    const html = `<b class="${B_ ? 'b' : 'a'}">${fijo.par}${fijo.esc}</b><div><span>${B_ ? 'Con propuesta' : 'Sin intervenir'} · ${fijo.t}</span><small>${fijo.pregunta}</small><small>Semilla ${sem}${B_ ? ` · la propuesta entra en ${fecha(PAR_ENTRA).toLowerCase()}` : ''}</small>${fijo.mod ? '<small class="mod">⚠ Condiciones modificadas: ya no es el par guardado</small>' : ''}</div>`;
    if (rot.innerHTML !== html) rot.innerHTML = html;
  }
  function bloquear() {
    const d = document.getElementById('condiciones'); if (!d) return;
    d.querySelectorAll('input,select,button').forEach(el => el.disabled = corriendo);
    d.classList.toggle('bloqueado', corriendo);
    d.querySelector('summary small').textContent = corriendo ? '(fijas mientras corre la simulación)' : '(se fijan al pulsar Simular)';
  }
  let urlLeida = false;
  const conectar = () => {
    condiciones();
    if (!urlLeida && document.getElementById('condiciones')) {   // ?par=P1&esc=B abre ese escenario listo para Simular
      urlLeida = true; const q = new URLSearchParams(location.search), p = (q.get('par') || '').toUpperCase();
      if (PARES[p]) elegirPar(`${p}-${(q.get('esc') || 'A').toUpperCase() === 'B' ? 'B' : 'A'}`);
    }
    const b = document.querySelector('[data-scen=actual]'); if (b) { b.disabled = false; b.onclick = () => corriendo ? detener(true) : iniciar(); boton(); } };
  conectar(); setTimeout(conectar, 1600);
  // Si se recarga o cierra la página en plena simulación se pierde todo: el navegador pide confirmar antes.
  addEventListener('beforeunload', e => { if (corriendo) { e.preventDefault(); e.returnValue = ''; } });
  obra.onPedido = () => aplicar();
  return { update, get corriendo() { return corriendo; }, get estado() { return corriendo ? mostrado() : null; }, get base() { return corriendo ? A[0] : null; }, get mes() { return m; } };
}
