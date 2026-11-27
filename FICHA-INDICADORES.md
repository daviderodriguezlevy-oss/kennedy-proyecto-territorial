# Ficha de indicadores y criterios de game over

Simulador Kennedy 3D · entrega Corte III. Este documento cubre lo que pide la guía en el punto 3: qué mide cada indicador, cómo se calcula, su unidad, su ámbito espacial y su frecuencia, de dónde salen el valor inicial y el umbral, la regla de activación y la sensibilidad de los umbrales. Las fórmulas están en `simulador-3d/anos.js`, en la función `paso`.

> **Advertencia de honestidad.** Todos los coeficientes, valores iniciales y umbrales del modelo son **supuestos de ensayo**: no están calibrados con mediciones del territorio, y el código lo dice en su encabezado. Donde un umbral coincide con una norma, se indica como referencia para verificar, no como calibración. Los resultados sirven para comparar escenarios entre sí (A contra B con la misma semilla), no como predicciones.

## Condiciones comunes a todos los indicadores

| Aspecto | Valor |
|---|---|
| **Ámbito espacial** | Un valor **agregado** para el área de estudio: el sector de Kennedy alrededor de Corabastos, el humedal La Vaca y María Paz (unos 5 × 4,3 km del modelo). No hay valores por celda. El 3D reparte visualmente el efecto en el lugar que le corresponde (el agua en el humedal, la basura en Corabastos, las aves en el humedal y los parques). |
| **Frecuencia de registro** | Mensual. 1 paso = 1 mes. |
| **Horizonte** | Enero de 2026 a diciembre de 2056 (360 meses). |
| **Azar** | Clima (años de La Niña o El Niño, lluvia mensual) y eventos (paro, accidente, vertimiento, incendio, ola de calor, migratorias) salen de la **semilla**. Con la misma semilla, A y B ven el mismo clima y los mismos eventos. |
| **Dinámica** | La mayoría de los indicadores no salta de golpe: se acerca cada mes a un valor objetivo (por ejemplo, un 6 % de la distancia por mes). Así hay retardos y cadenas: un mes con mala agua afecta a las aves de los meses siguientes. |
| **Propuesta** | En los pares guardados entra en **enero de 2027** (mes 12). Sus efectos aparecen a medida que avanza la obra (fracción `f` de 0 a 1) y del todo cuando termina (`f ≥ 0,98`). |

## Regla del sistema integrado

- La ciudad y el ecosistema simulados caen con la **primera** de las 10 reglas de game over que se cumpla: 6 de **más que humanos** y 4 de **humanos**.
- La misma regla se usa en A y en B.
- Cada regla pasa por tres niveles:
  1. **Alerta temprana:** el indicador cruza su umbral naranja.
  2. **Falla localizada:** el indicador cruza el límite ☠. Desde ese mes se cuentan los meses seguidos; si vuelve a la zona segura, la cuenta vuelve a cero.
  3. **Condición crítica:** se cumplen los meses seguidos que pide la regla y se declara game over.

En las reglas de 1 mes (humedal, residuos), la falla localizada y la condición crítica ocurren el mismo mes. Si no hay game over, el resultado se reporta como «Game over no alcanzado hasta diciembre de 2056».

## Indicadores con regla de game over

### Más que humanos

| Indicador | Qué mide | Cómo se calcula (resumen) | Unidad | Valor inicial | Alerta | Límite ☠ y permanencia |
|---|---|---|---|---|---|---|
| **Agua** (`Q`) | Calidad del agua del humedal: si peces, anfibios, larvas y plantas acuáticas pueden vivir en ella | Se acerca 8 %/mes a: 74 − residuos/70 − (población − 1) × 90 − (100 − espejo)/5 − escombros al humedal 45 + lluvia 4 + propuesta terminada 26 × (0,5 + 0,5 × tamaño del humedal) − calor × 2,5. Un vertimiento resta 9 y una inundación 3. | Índice 0–100 (0 negra, 100 limpia) | 55 (supuesto: agua ya degradada) | < 40 | **< 15 durante 3 meses** |
| **Humedal** (`H`) | Espejo de agua comparado con 2026 | Cada mes: − pérdida de ronda × 1,9 × población/12 − escombros − evaporación en meses secos (0,32 + calor × 0,06) + lluvia 0,05 − incendio 0,6 − invasión 0,6 − agua que toma la vegetación nueva. Con la propuesta terminada crece 1,2/mes hasta (100 + 60 × tamaño) × (1 − 0,1 × (sed de la vegetación − 1)). | % del espejo de 2026 | 100 (por definición) | < 70 | **< 35 durante 1 mes** |
| **Aves** (`aves`) | Especies de aves que el humedal sostiene | Se acerca 6 %/mes a: 52 × (refugio/58) × (agua/55)^0,6 × (espejo/100)^0,5 × factor de ruido (baja 3,5 % por cada dB sobre 50 en el humedal) × (corredor/100)^0,15 × temporada migratoria × factor de altura (edificios altos). Tope: 75 especies (o según el tamaño del humedal ampliado). Las migratorias de septiembre suman si hay agua, espejo y silencio. | Especies | 52 (supuesto) | < 35 | **< 18 durante 3 meses** |
| **Abejas** (`abejas`) | Polinizadores comparados con 2026 | Se acerca 6 %/mes a: 100 × (refugio/58)^0,8 × (22/PM2,5)^1,6 × vegetación con flor × (vegetación/100)^0,35 × (1 − calor × 0,04) × (corredor/100)^0,15. Una ola de calor las baja 7 %. | % de 2026 | 100 (por definición) | < 60 | **< 30 durante 6 meses** |
| **Ruido en el humedal** (`Nh`) | Ruido que llega al humedal desde las avenidas | Ruido de avenidas − atenuación (8 + 10 × (refugio/58)^0,4 × (espejo/100)^0,15 + barrera de vegetación de la propuesta) + carga nocturna 1 + obra de noche 2. | dB (día) | 48 | > 52 | **> 55 durante 6 meses** |
| **Corredor ecológico** (`K`) | Conexión verde entre La Vaca y los demás parques | 100 × (vegetación/100)^0,8 × (refugio/58)^0,7 × (espejo/100)^0,2 × corte por ruido (−3 % por dB sobre 69 en avenidas, mínimo 0,4) + propuesta (25 × vegetación × hábitat × tamaño del humedal) − pisos y niveles altos. Tope 140. | % de la conexión de 2026 | 100 (por definición) | < 60 | **< 30 durante 6 meses** |

### Humanos

| Indicador | Qué mide | Cómo se calcula (resumen) | Unidad | Valor inicial | Alerta | Límite ☠ y permanencia |
|---|---|---|---|---|---|---|
| **Comida** (`atencion`) | Parte de la comida demandada que Corabastos (y los nodos) logra atender | (capacidad × 0,88 si llueve + producción local) / demanda × 100, con tope 100. La demanda crece al % anual elegido. Capacidad hoy: 85. Durante la demolición de bodegas: 85 × 0,82. Con la propuesta: mercado vertical 56 × (niveles/4)^0,7 + 2 nodos de 25 + producción local hasta 12 %. Un paro la multiplica por 0,55. | % de la demanda | 85 (supuesto «capacidad actual») | < 75 | **< 60 durante 6 meses** |
| **Plagas** (`plagas`) | Ratas, moscas y palomas comparadas con 2026 | 100 × ((residuos + 300)/1500)^1,3 × (1 + falta de calidad del agua bajo 40/80) × (52/aves)^0,15 × (1 + calor × 0,08). Menos aves, menos depredadores. | % de 2026 | 100 (por definición) | > 160 | **> 300 durante 3 meses** |
| **Residuos** (`W`) | Basura acumulada sin retirar alrededor de Corabastos | Cada mes: + generado − retirado − arrastre por inundación. Generado: 0,62 × comida atendida × (1 − aprovechamiento) × calor + 18 × población^1,3. Retiro: 70 t/mes hoy, 95 con la propuesta, × 0,85 si llueve. | t | 1.200 (supuesto) | > 2.500 | **> 4.500 durante 1 mes** |
| **Movilidad** (`vel`) | Velocidad media en hora pico | 26 / (1 + 1,1 × (flota × calles cerradas × camiones × obra)³) × 0,9 si llueve × 0,8 si hay accidente × 0,75 si hay inundación. La flota crece al % anual elegido, y el pico y placa le resta 1 punto. | km/h | 12,4 | < 12 | **< 5 durante 6 meses** (5 km/h ≈ paso de un peatón) |

## Indicadores sin regla de game over (alimentan a los demás)

| Indicador | Qué mide | Cómo se calcula (resumen) | Unidad | Inicial | Alerta / mal | A qué afecta |
|---|---|---|---|---|---|---|
| **Aire** (`pm`) | Material particulado fino | 22 × flota^0,7 × (11/velocidad)^0,35 + obra (1,2 × frentes) + meses secos 1,5 + incendio 9 − propuesta terminada 1. | µg/m³ PM2,5 | 21,1 | 25 / 37 | Abejas. Los umbrales coinciden con la norma colombiana de PM2,5: 25 anual y 37 en 24 h según la Res. 2254 de 2017 (**verificar** antes de citarlo). |
| **Vegetación** (`V`) | Vegetación comparada con 2026 | Se acerca 4 %/mes a: 100 × abejas^0,15 × espejo^0,1 × (1 − calor × 0,025) − pérdida de ronda − invasiones + propuesta (32 × cantidad de vegetación nueva) − menos suelo verde si hay menos pisos. Un incendio resta 4. | % de 2026 | 100 | 80 / 55 | Calor, corredor, abejas |
| **Isla de calor** (`C`) | Grados por encima del humedal y los parques | 2,5 + (100 − vegetación)/40 + (flota − 1) + (100 − espejo)/80 + ola de calor 2 + año de El Niño 0,5 − propuesta (0,6 + 0,4 × vegetación nueva) + pisos altos. | °C | 2,5 | 4 / 6 | Agua, humedal, abejas, plagas, residuos |
| **Ruido en avenidas** (`N`) | Ruido diurno del tráfico | 66 + 10 × log₁₀(flota × cierres × camiones × obra) + trancón 0,35 × (12 − velocidad) + demolición 2,5 + obra de noche 1,5 + accidente 1. | dB | 66 | 70 / 75 | Ruido en el humedal, corredor |
| **Trabajo** (`empleo`) | Puestos de trabajo afectados por la obra | Por fases de obra: 15 % durante la construcción (+10 con concertación baja), 30 % en el traslado, 8 % después y 4 % al terminar. | % perdido | 0 | 20 / 30 | Solo se informa |

**Refugio** (`R`, %) es una variable interna, no un indicador. Se acerca 5 %/mes a: 62 − pérdida de ronda − residuos/450 − falta de calidad del agua − invasiones + propuesta. Alimenta a aves, abejas, ruido en el humedal y corredor.

## Por qué esos umbrales (y qué se pierde al cruzarlos)

Todos son **supuestos de modelación** salvo el aire, que se compara con la norma.

| Regla | Qué deja de funcionar al cruzar el límite |
|---|---|
| Agua < 15 | Sin oxígeno disuelto suficiente: la vida acuática del humedal no se sostiene. Tres meses evitan que un vertimiento aislado declare la falla. |
| Humedal < 35 | Con menos de un tercio del espejo, el humedal deja de funcionar como tal (rellenos, invasión o sequía). Es un mes porque el espejo no se recupera rápido. |
| Aves < 18 | Queda menos de un tercio de la riqueza inicial: el humedal deja de ser refugio regional. |
| Abejas < 30 | Sin polinización suficiente para la vegetación nativa. Seis meses filtran las olas de calor. |
| Ruido en el humedal > 55 | El canto de las aves queda enmascarado y no pueden defender territorio ni anidar (hipótesis del proyecto). |
| Corredor < 30 | Las aves pequeñas y las abejas ya no alcanzan los otros parches a distancia de vuelo: las poblaciones quedan aisladas. |
| Comida < 60 | La ciudad deja de depender de Corabastos como su central: desabastecimiento. |
| Plagas > 300 | Emergencia sanitaria: el triple de 2026. |
| Residuos > 4.500 | Emergencia de residuos: la basura acumulada supera la capacidad de reacción. |
| Movilidad < 5 km/h | Las vías no admiten más vehículos: circular en carro es más lento que caminar. |

## Sensibilidad de los umbrales (±20 %)

Se corrieron los 12 escenarios (P1A…P6B, semilla 2026, propuesta en enero de 2027) cambiando **un umbral a la vez**: 20 % más estricto (falla antes) y 20 % más permisivo. Para el ruido en el humedal se usaron ±3 dB (52 y 58). Se puede repetir en la consola del navegador con `simModelo.correr({ par: 'P1', entra: 12, limites: { comida: 72 } })`.

| Regla | Estricto / permisivo | Qué cambia |
|---|---|---|
| **Comida** | 72 % / 48 % | **Es el umbral decisivo.** Con 72 %, **todos los escenarios B caen por desabastecimiento en 2027**, durante la obra: al demoler las bodegas la capacidad baja a 85 × 0,82 ≈ 70 % antes de que abran los nodos y mientras se levanta el mercado nuevo. En A, P1, P2, P3 y P6 pasan a caer por desabastecimiento entre 2032 y 2036. Con 48 %, P3B pasa de «desabastecimiento 2053» a «no alcanzado hasta 2056». |
| **Aves** | 21,6 / 14,4 | En A adelanta o atrasa la falla alrededor de 1 año. Con el umbral permisivo, la primera falla de P1A, P2A y P6A pasa a ser el agua en 2039. |
| **Plagas** | 240 / 360 | P4 sigue cayendo por plagas, pero se mueve: P4B de 2050 a 2048 (estricto) o 2052 (permisivo). |
| **Movilidad** | 6 / 4 km/h | P1B pasa de 2046 a 2043 (estricto) o 2050 (permisivo). |
| **Abejas** | 36 / 24 | P6B se mueve de 2052 a 2051 o 2056. |
| **Agua** | 18 / 12 | Cambia menos de 1 año en P5. |
| **Ruido en el humedal** | 52 / 58 dB | Solo P1A cambia: con 52 dB cae por humedal ensordecido en 2036. |
| **Humedal, corredor, residuos** | ±20 % | Ningún escenario cambia. |

**Cómo leer esto:**
- Salvo comida, los desenlaces son robustos: con otro umbral plausible cambia la fecha (1 a 3 años), pero casi nunca el tipo de falla ni la diferencia entre A y B.
- El umbral de comida decide si la propuesta sobrevive a su propia obra. Si el umbral real estuviera por encima del 70 %, la propuesta tendría que mantener la capacidad durante la demolición (por ejemplo, demoler por fases o abrir antes los nodos N y M). Esto es un hallazgo para el video y para las mejoras a futuro.

## Qué está en el código y qué sigue siendo hipótesis

**En el código:**
- Las ecuaciones de los 15 indicadores y del refugio.
- Las cadenas entre ellos, por ejemplo calor → agua → aves → plagas.
- El clima y los eventos por semilla.
- La obra por fases, con su duración según escombros, financiación, frentes, concertación, horario, lluvia y tamaño de la propuesta.
- Las variables de la propuesta: pisos, niveles del mercado, tamaño del humedal, cantidad y tipo de vegetación, y nodos.
- Las 10 reglas de game over con sus tres niveles.

**Hipótesis del proyecto que no están en el código, o solo de forma indirecta:**
- La **organización política** (quién decide, quién ejecuta, relevos). Solo aparece como «concertación», que cambia la velocidad de la obra y el empleo afectado.
- La **heterogeneidad espacial.** El modelo es agregado; el 3D muestra dónde ocurre algo, pero el cálculo no distingue un barrio de otro.
- **Especies concretas.** Las aves se cuentan como riqueza de especies, sin especies bandera, porque no hay registros de La Vaca.
- El **control de la flota.** El pico y placa es una condición externa: la propuesta no reduce por sí sola el crecimiento de carros y motos. Por eso, sin pico y placa, casi todos los B terminan en colapso vial.
- La **calibración.** Ningún valor está ajustado con datos medidos. Para calibrar convendría usar, por ejemplo, mediciones de calidad del aire y del agua y conteos de aves del humedal.

## Reproducir

1. Iniciar un servidor estático en la carpeta del repositorio y abrir `simulador-3d/?par=P1&esc=A` o `?par=P1&esc=B`, o usar los botones **Escenarios listos**.
2. Pulsar **▶ Simular**. Al terminar, **■ Terminar y ver resultados**: allí están el game over, la tabla de niveles, las gráficas y el CSV.
3. La semilla y la fecha de entrada de la propuesta aparecen en el rótulo superior.
