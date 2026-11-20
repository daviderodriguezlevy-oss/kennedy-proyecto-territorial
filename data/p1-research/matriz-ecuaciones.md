# Estructura de Problemas · P1 · Matriz y ecuaciones v1

Fecha de elaboración: 14 de octubre de 2026.

**Sistema declarado:** circuito de abastecimiento alimentario vinculado a Corabastos, sus relaciones con territorios proveedores y sus manifestaciones dentro del polígono de Kennedy; situación actual con corte de estudio 2026. No se presume cobertura de todo el año.

Se conserva el enunciado del ciclo 2 de 3; no se inicia una nueva reformulación. El sostenimiento mutuo sigue siendo hipótesis. Esta entrega operacionaliza los bucles R1, R2, R3, B1, B2 y B3; no calibra ni valida una simulación. Quedan abiertas transformaciones en relaciones de suministro, condiciones de acceso y distribución espacial/temporal de operaciones, sin priorizarlas.

## Hallazgo de la revisión de datos

La metodología guardada contiene 42 registros (6 puntos × 7 franjas de una hora), todos del 24 de febrero de 2026: 06–07, 07–08, 11–12, 12–13, 13–14, 17–18 y 18–19. Son pasos, no personas o camiones únicos. No identifican destino, propósito, pertenencia a Corabastos, cola ni descargue. No unir los huecos horarios como si hubiera observación continua. No sumar puntos como viajes únicos.

SIPSA aporta cantidades y procedencias de ingreso a los mercados cubiertos. No equivale a ventas, consumo total de Bogotá ni producción del municipio registrado. El archivo local es una copia de trabajo; actualizar y comprobar meses antes de comparar. En el indicador anterior, 250 m es una extensión gráfica, no un radio de impacto comprobado. La coexistencia en una franja de una hora no demuestra contacto simultáneo entre un peatón y un vehículo.

Fuentes revisadas: `visor-web/dist/data/indicators/P1_supply_methodology.json`, `P1_supply_data.json` y existencia del archivo `Conectografía/outputs/P1_abastecimiento/SIPSA_2026.xlsx`. No se auditó nuevamente cada registro bruto ni se recalcularon todas sus transformaciones.

## Matriz de operacionalización

Disponible parcial = hay una observación utilizable para la definición indicada, pero no representa todo el sistema. Fuente identificada = se conoce dónde buscar, no que el dato ya haya sido extraído. Faltante nunca equivale a cero.

| ID | Variable | Definición | Unidad | Escala / frecuencia | Fuente / instrumento | Estado | Bucles |
|---|---|---|---|---|---|---|---|
| V01 | Pasos de camiones | Cruces de una sección de aforo; no vehículos únicos ni llegadas a descargue | pasos/h | Punto; franjas observadas | Aforos guardados; 24-02-2026 | Disponible parcial | B1; contexto |
| V02 | Pasos peatonales | Cruces de la sección; no compradores identificados | pasos/h | Mismo punto y franja | Aforos guardados; 24-02-2026 | Disponible parcial | B1; no sustituye R1 |
| V03 | Llegadas a espera A | Vehículos que ingresan al sistema de espera delimitado, incluidos los atendidos inmediatamente | vehículos/intervalo | Acceso; intervalos piloto de 15 min | Observación con ID anónimo y hora | Faltante | B1, B2 |
| V04 | Vehículos en cola Q | Vehículos esperando inicio de servicio en un instante | vehículos | Acceso; inicio/final de intervalo | Observación directa | Faltante | B1, B2 |
| V05 | Inicios de descargue S | Vehículos que abandonan la espera e inician servicio | vehículos/intervalo | Puesto/área de servicio | Registro de inicio | Faltante | B1, B2 |
| V06 | Finalizaciones D | Vehículos que completan descargue en el intervalo | vehículos/intervalo | Mismo sistema de servicio | Registro de finalización | Faltante | B1, B2 |
| V07 | Abandonos de cola L | Vehículos que salen de la espera sin iniciar servicio | vehículos/intervalo | Mismo acceso | Registro de abandono | Faltante | B1, B2 |
| V08 | Vehículos en servicio U | Vehículos descargando simultáneamente | vehículos | Área de servicio; instante | Observación directa | Faltante | B1, B2 |
| V09 | Espera Wq | Hora de inicio de servicio menos hora de llegada para cada vehículo | min/vehículo | Evento individual | Tres marcas: llegada, inicio, fin; abandonos aparte | Faltante | B1, B2 |
| V10 | Duración de descargue Ts | Hora de finalización menos inicio de servicio | min/vehículo | Evento individual; desagregar tipo de carga | Observación directa | Faltante | B1, B2 |
| V11 | Ocupación del paso O | Unión de superficies de descargue dentro de la superficie de circulación peatonal definida | m²·min; fracción 0–1 | Tramo georreferenciado; intervalo | Polígonos horarios y superficie de referencia | Faltante | B1 |
| V12 | Reprogramaciones efectivas G | Llegadas movidas de una franja de origen a una de destino y realmente observadas | vehículos por par de franjas | Acceso/día; cubrir origen y destino | Agenda y llegada real enlazadas | Faltante | B2 |
| V13 | Cantidad alimentaria ingresada Fin | Masa registrada al ingreso por producto, procedencia y mercado | t/día o t/mes | Mercados cubiertos por SIPSA | SIPSA 2026; archivo local disponible | Disponible parcial; verificar periodo/producto | Contexto; no equivale a ventas R1 |
| V14 | Volumen comercializado V | Masa vendida; deduplicar según eslabón y transacciones definidas | t/producto/periodo | Operador/nodo; ciclos comparables | Registros de transacciones; conciliación de inventarios | Faltante | R1, R2 |
| V15 | Compradores B | Personas u organizaciones compradoras distintas según unidad declarada; visitas separadas | compradores únicos/día; visitas/día | Nodo; muestra repetida | Encuesta y conteo enlazado; no inferir de peatones | Faltante | R1 |
| V16 | Variedad/oferta A | Referencias alimentarias disponibles con catálogo fijo y disponibilidad horaria | referencias por nodo/franja | Nodo/ciclo | Inventario comercial comparable | Faltante | R1 |
| V17 | Ventas esperadas E | Expectativa declarada antes del ciclo, separada de venta realizada | t o COP por ciclo; elegir una | Operador/producto | Panel de comerciantes | Faltante | R1 |
| V18 | Elección del nodo p | Fracción de operaciones del panel que eligen un nodo dentro de alternativas factibles declaradas | fracción; 0–1 | Mismo panel y conjunto de alternativas | Encuesta de elección y registros | Faltante | R1, R2, B1, B3 |
| V19 | Inversión específica I | Valor contable/económico de activos ligados al nodo; separar recuperable y no recuperable | COP con fecha de precios | Operador; seguimiento mensual | Inventario de activos y contratos | Faltante | R2 |
| V20 | Costo de cambiar K | Desembolso de traslado, adecuación, penalidades aplicables y margen perdido durante transición, neto de recuperaciones pertinentes | COP por traslado y alternativa | Operador; horizonte definido | Cotizaciones y contratos contrastados | Faltante | R2, B3 |
| V21 | Costo recurrente C | Costo comparable de operar una unidad y periodo: transporte, pagos y tiempo valorado sin doble conteo | COP/operación comparable | Mismo producto/lote/servicio | Comprobantes; valoración del tiempo con sensibilidad | Faltante | B1, B3 |
| V22 | Margen esperado pi | Ingresos esperados menos costos recurrentes de la misma actividad | COP/periodo | Actual y alternativa; mismo horizonte | Panel y escenarios; incertidumbre declarada | Faltante | R2, B3 |
| V23 | Operadores activos M y entradas/salidas | Operadores identificados con unidad de control común documentada; entradas y salidas por periodo | operadores; operadores/mes | Mercado/producto delimitado | Registro y verificación de actividad y control común | Faltante | R3 |
| V24 | Participaciones comerciales s | Venta por operador dividida por ventas totales del mercado/producto delimitado | fracción; 0–1 | Mismo mercado y periodo | Transacciones por operador; cobertura completa o sesgo declarado | Faltante | R3; no participaciones accionariales |
| V25 | Derechos de decisión Ddec | Actor autorizado por materia: admisión, arriendo, tarifa, inversión; voto, veto, competencia y decisión efectivamente ejercida | matriz actor × decisión; fechas | Organización; reglas vigentes y decisiones 2026 | Estatutos, contratos, actas; verificar versiones | Fuente documental identificada; contenido por auditar | R3 |
| V26 | Condiciones de entrada R | Requisitos, pagos, plazos, solicitudes completas, admisiones y rechazos motivados; no sumar a índice arbitrario | COP; días; conteos y categorías | Trámite/cohorte | Reglamentos, trámites y expedientes anonimizados | Fuente pública identificada; resultados faltantes | R3 |
| V27 | Capacidad alternativa factible Cap | Volumen adicional que una ruta/nodo puede atender para el mismo producto dentro del plazo y restricciones | t/periodo | Red externa e interna al polígono | Operadores, rutas y capacidad verificadas | Faltante | B3; dependencia |
| V28 | Demanda y suministro por producto | Cantidad requerida y entregada al mismo destino sin duplicar transbordos | t/periodo | Destino final definido; producto | Balance por destino, proveedor y ruta | Demanda faltante; ingresos de mercados no la sustituyen | Dependencia |

## Ecuaciones y condiciones

### E1. Balance de la cola — identidad contable

Q(t+Δt) = Q(t) + A(t) − S(t) − L(t).

Todos los términos son vehículos: Q es un stock en un instante; A, S y L son conteos ocurridos durante el intervalo. S son **inicios** de servicio, no finalizaciones. Si se usan tasas por hora, multiplicarlas por Δt en horas. Q no puede ser negativa; un balance negativo exige revisar registros o fronteras, no ocultarlo con un máximo arbitrario.

### E2. Balance de vehículos descargando — identidad contable

U(t+Δt) = U(t) + S(t) − D(t).

Mismo límite espacial que E1. Supone ausencia de interrupciones o abandonos durante servicio; si existen, añadir su flujo de salida explícito. Si hay puestos discretos, U no supera los puestos operativos comparables. No asumir puestos equivalentes sin verificar carga, maniobras y duración.

### E3. Tiempos — definiciones observables

Wq_j = t_inicio,j − t_llegada,j; Ts_j = t_fin,j − t_inicio,j.

Mediana y percentil 90, además del número de observaciones. Vehículos ya esperando al empezar o aún esperando al terminar: registros censurados, no espera cero ni exclusión silenciosa. Reportar abandonos por separado. Un promedio de atendidos puede subestimar la espera si se omiten quienes abandonan.

### E4. Ocupación temporal del paso — definición espacial

O_i = [∫ área(D_i(t) ∩ P_i) dt] / [área(P_i) · T].

P_i es la superficie fija de circulación peatonal del tramo; D_i(t), la unión de áreas de descargue en el instante, para no duplicar solapamientos. Numerador: m²·min; denominador: m²·min; O_i entre 0 y 1. Solo con área(P_i)>0 y T>0, observación suficiente y mismo periodo. No mide daño, atropellos, exposición personal ni control institucional. Acompañar de pasos peatonales, desvíos observados y ancho libre; no multiplicar automáticamente todo en un índice.

### E5. Reprogramación temporal — identidad de un escenario, no efecto estimado

A'_h = A_h − Σ(k≠h) G_hk + Σ(k≠h) G_kh.

G_hk: vehículos trasladados de la franja h a la k. Requiere 0≤Σ G_hk≤A_h y franjas de igual duración. En un horizonte cerrado, Σ A'_h=Σ A_h. Si los movimientos salen del horizonte, contabilizarlos como entradas/salidas de frontera. Reprogramar no implica reducir demanda diaria ni garantiza reducir espera: debe volver a evaluarse la capacidad de atención y la congestión de la franja receptora. No sustituir A por aforos de paso.

### E6. Costo recurrente de una operación comparable — contabilidad propuesta

C_op = C_transporte + C_pagos + c_tiempo · W + C_otros.

COP/operación; c_tiempo en COP/h y W en h/operación. Si transporte ya incluye salarios o espera, no contarlos otra vez. Definir el contenido de otros y separar categorías; no agregar costos privados y externalidades sin una contabilidad propia. Comparar mismo producto, tamaño de lote, servicio y fecha de precios. El valor del tiempo requiere fuente o rango de sensibilidad, no un coeficiente elegido para lograr un resultado.

### E7. Comparación de permanencia/cambio — criterio de escenario, no ley de conducta

ΔΠ_H = Σ(h=1..H) [(π_alternativa,h − π_actual,h)/(1+r)^h] − K_cambio.

π son márgenes recurrentes en COP/periodo, H el horizonte y r la tasa correspondiente a ese periodo. K es costo de transición neto, documentado. Una inversión pasada hundida no se suma otra vez como costo de cambiar: distinguir desembolsos futuros, valor recuperable, penalidades y pérdidas de transición. ΔΠ_H positivo significa ventaja económica bajo esos supuestos; no predice que el operador cambie, pues hay riesgo, restricciones contractuales y alternativas no factibles. No calcular un VAN de ejemplo con datos inventados.

### E8. Stock de operadores — identidad

M(t+Δt) = M(t) + Entradas(t) − Salidas(t).

Unidad estable: operador comercial, no local ni permiso. Establecer tratamiento de grupos bajo control común. Diferenciar solicitud, autorización, apertura efectiva y permanencia. Tener más operadores no demuestra automáticamente menor concentración comercial.

### E9. Participación y concentración comercial — descripción

s_o = ventas_o / Σ ventas_j; HHI = Σ s_o².

Mismo producto, mercado y periodo; denominador positivo; participaciones de todo el universo delimitado suman 1. No calcular con ingresos de centrales agregados como si fueran ventas por empresa. El valor no mide concentración de votos, captura institucional ni privatización. No fijar aquí un umbral normativo. Los derechos de decisión se describen en una matriz separada por materia; participación accionaria y poder ejercido requieren evidencia específica.

### E10. Dependencia como respuesta a una interrupción — escenario de red

Brecha_p,s = max(0, Demanda_p − Entrega_factible_p,s) / Demanda_p.

Demanda positiva; mismo producto, destino y horizonte. Comparar también el escenario base: ΔBrecha_p,s = Brecha_p,s − Brecha_p,base. La entrega factible se obtiene de una red proveedor–ruta–nodo–destino con capacidades, tiempos y restricciones documentadas, conservando flujos y evitando contar el mismo alimento en cada transbordo. No sumar capacidades alternativas que comparten la misma ruta limitada. Cambiar un supuesto por vez y explorar sensibilidad. Una fracción externa alta no basta para calcular esta brecha; SIPSA no aporta por sí solo demanda ni capacidades de sustitución.

## Cómo contrastar los seis bucles sin imponer sus signos

| Bucle | Diseño mínimo | Controles y demoras | Evidencia que lo debilitaría |
|---|---|---|---|
| R1 atracción | Panel nodo-producto-ciclo de compradores, oferta, expectativas y ventas | Día, producto, precio, demanda, estacionalidad; expectativas antes de ventas | No aparece la secuencia temporal o los cambios se explican por factores comunes |
| R2 permanencia | Panel de operadores con inversiones transferibles/no transferibles y opciones factibles | Horizonte comparable, tenencia, contratos y actividad | Operadores cambian sin costos relevantes; las inversiones no condicionan opciones |
| R3 acceso/decisión | Vincular decisiones documentadas, condiciones, solicitudes, entradas y participación | Cambios de regla, cohortes comparables, quién puede decidir y quién efectivamente decide | Derechos formales no explican restricciones o participación comercial no confiere decisión |
| B1 fricción | Registrar cola, tiempos, costos y decisiones de lugar/horario conjuntamente | Capacidad, tipo de carga, volumen, precio y alternativas | Aumentan tiempos sin modificar elección, o cambia elección sin la fricción propuesta |
| B2 horarios | Registrar agenda y llegadas efectivas; comparación de franjas y días comparables | No confundir menor demanda con reprogramación; medir franja receptora | La actividad desplazada no llega a la nueva franja o solo traslada la espera |
| B3 alternativas | Panel de costo diferencial, demanda alternativa, oferta factible y cambios realizados | Suelo, permisos, inversión, titularidad y retrasos de entrada | Mayor diferencia de costo no genera alternativas factibles o comparten restricciones originales |

Una asociación no identifica por sí sola causalidad. Para estimar una función entre nodos hacen falta un diseño temporal/comparativo, variables de confusión y supuestos de identificación explícitos. No fijar coeficientes ni signos mediante normalizaciones gráficas. La existencia del bucle completo exige sostener todas sus relaciones; una sola flecha refutada obliga a revisarlo.

## Protocolo inicial de recolección

Piloto propuesto, no muestra representativa ya establecida:
- Reconocer los seis puntos existentes y verificar coordenadas, accesos reales, relación con descargue y límite del KML. Elegir pares comparables con y sin actividad logística observada. No asumir todos los camiones vinculados a Corabastos.
- Registrar continuamente llegada, inicio, fin y abandono, con ID temporal anónimo. Intervalos de resumen de 15 minutos; conservar hora exacta. Cubrir antes y después de cada pico para observar arrastre de colas.
- Cubrir varios días de diferente actividad y horarios, incluyendo madrugada si el reconocimiento confirma operación. Definir el tamaño final después del piloto y de revisar variabilidad; no afirmar representatividad por elegir un número arbitrario de días.
- Levantar superficies de paso y descargue con hora; distinguir comerciante, comprador, trabajador y peatón de paso solo cuando exista información, no por apariencia.
- Panel de operadores: registrar opciones reales, costos recurrentes y de cambio, contratos, inversiones recuperables, expectativas y decisiones realizadas. Seudonimizar entrevistas y datos comerciales.
- Archivo institucional: documento, fecha, vigencia, materia, competencia, decisión, aplicación y resultado. No usar el texto de una regla como prueba suficiente de su cumplimiento.

Plantilla de evento: sitio_id | evento_id | llegada | inicio_descargue | fin_descargue | salida_sin_servicio | clase_carga | relación_con_Corabastos_verificada | método_verificación | calidad | observaciones.
Plantilla espacial: tramo_id | fecha_hora | geometría_paso | geometría_descargue | ancho_libre | pasos_peatonales | desvíos_observados | duración_observada.
Plantilla institucional: documento_id | versión_fecha | regla | actor_competente | decisión | fecha_aplicación | expediente_resultado | fuente | calidad.

## Decisiones y límites de esta entrega

Se puede reutilizar la coincidencia relativa de pasos para orientar un reconocimiento, sin llamarla cola, daño o dependencia. El mayor valor del índice anterior está en el nodo 990, 11–12 h (0,8302), con 335 pasos de camiones y 1.523 pasos peatonales. Es un punto candidato a verificación; no se confirma como lugar de mayor conflicto. No se recalcula aquí un nuevo indicador ni se cambia la web.

Las ecuaciones E1–E3 y E8 son balances/definiciones; E4 y E9 son descriptores; E5 es una reasignación hipotética; E6 es una estructura contable; E7 y E10 son escenarios bajo supuestos. Ninguna acredita por sí sola privatización, captura o dependencia sin alternativas. No hay parámetros calibrados ni estimaciones numéricas de los bucles.

## Fuentes y trazabilidad

- DANE, ficha metodológica SIPSA-A: https://www.dane.gov.co/files/operaciones/SIPSA/fmet-SIPSAbastecimiento.pdf
- DANE, documentación y definición de procedencia: https://microdatos.dane.gov.co/index.php/catalog/697/study-description
- DANE, publicaciones y microdatos: https://www.dane.gov.co/index.php/estadisticas-por-tema/agropecuario/sistema-de-informacion-de-precios-sipsa/componente-abastecimientos-1
- Corabastos, asamblea y estatutos (identificados, no auditados artículo por artículo): https://corabastos.com.co/asamblea-y-estatutos/
- Corabastos, trámites inmobiliarios (fuente identificada, no prueba de restricción efectiva): https://corabastos.com.co/tramites-inmobiliarios/

Las fuentes oficiales delimitan qué se observa. Las ecuaciones y el protocolo son propuestas analíticas de esta investigación, no fórmulas atribuidas a esas instituciones.
