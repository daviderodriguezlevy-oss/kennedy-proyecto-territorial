# Kennedy · Proyecto territorial

Atlas web de investigación y propuesta arquitectónica en Kennedy, Bogotá. Integra macromodelos, problema, evidencia, redes urbanas y de especies, actores, programa arquitectónico, propuesta territorial y simulador 3D.

## Video del proyecto

[Ver en YouTube: Modelamiento Dinamico y Simulacion Kennedy](https://www.youtube.com/watch?v=x5zrAuT9yGQ)

## Abrir en el computador

Desde esta carpeta, iniciar un servidor estático (por ejemplo `python -m http.server 8000`) y abrir:

- Página principal: http://localhost:8000/macromodelos.html
- Propuesta territorial: http://localhost:8000/programa-mapa.html
- Simulador: http://localhost:8000/simulador.html
- Simulador completo: http://localhost:8000/simulador-3d/

Los módulos y los datos requieren HTTP; abrir los HTML directamente con doble clic puede impedir su carga.

## Pares de escenarios (entrega Corte III)

El simulador trae seis pares guardados. Cada par compara **A · sin intervenir** y **B · con propuesta** con las mismas condiciones, la misma semilla de azar (2026) y la misma regla de game over. En B la propuesta entra sola en enero de 2027. Horizonte: enero de 2026 a diciembre de 2056, un mes por paso.

**Par piloto (P1):**

1. Iniciar el servidor estático en esta carpeta (ver arriba).
2. Abrir http://localhost:8000/simulador-3d/?par=P1&esc=A y pulsar **▶ Simular**. Al terminar, pulsar **■ Terminar y ver resultados**.
3. Abrir http://localhost:8000/simulador-3d/?par=P1&esc=B y repetir.

| Par | Pregunta | Condiciones (lo demás, valores de ensayo) | Resultado A · sin intervenir | Resultado B · con propuesta |
|---|---|---|---|---|
| P1 | ¿Qué pasa si todo sigue como va y se construye la propuesta prevista? | Por defecto | Las aves se van · 2037 | Colapso vial · 2046 |
| P2 | ¿Y si además hay un pico y placa más estricto? | Pico y placa | Las aves se van · 2038 | No alcanzado hasta 2056 |
| P3 | ¿Y si la demanda de comida crece al 3 % anual? | Pico y placa, demanda 3 % | Desabastecimiento · 2038 | Desabastecimiento · 2053 |
| P4 | ¿Y si la recolección baja y la propuesta no aprovecha residuos? | Pico y placa, recolección 50 t/mes, aprovechamiento 0 % | Plagas · 2030 | Plagas · 2050 |
| P5 | ¿Y si la población crece al 3 % y se construyen manzanas de 12 pisos? | Pico y placa, población 3 %, 12 pisos | Agua inhabitable · 2034 | Agua inhabitable · 2043 |
| P6 | ¿Y si la propuesta se recorta (humedal a la mitad, poca vegetación ornamental) con 12 pisos? | Pico y placa, humedal 50 %, vegetación poca y ornamental, 12 pisos | Las aves se van · 2038 | Abejas · 2052 |

**Regla del sistema integrado.** Hay 10 reglas de game over: 6 «más que humanos» (agua inhabitable, humedal seco, aves, polinizadores, humedal ensordecido, corredor roto) y 4 «humanos» (plagas, residuos, colapso vial, desabastecimiento). La ciudad y el ecosistema simulados caen con la **primera** regla que se cumpla, con la misma regla en A y en B. Cada regla pasa por tres niveles, que se anotan en «Lo que está pasando», en cada indicador y en la tabla «Niveles de cada regla» de los resultados:

- **Alerta temprana:** el indicador cruza su umbral naranja.
- **Falla localizada:** cruza el límite de game over; se cuentan los meses.
- **Condición crítica:** se sostiene los meses que pide la regla y hay game over.

Los resultados reportan el tiempo desde enero de 2026 y, en B, desde que se aplicó la propuesta.

La [ficha de indicadores](FICHA-INDICADORES.md) explica cada indicador: qué mide, cómo se calcula, unidad, ámbito espacial, frecuencia, valor inicial, umbrales, sensibilidad de los umbrales (±20 %) y qué está en el código y qué es hipótesis.

Resultados con la semilla 2026; el reloj del simulador manda. Las variables de la propuesta (pisos, niveles del mercado, tamaño del humedal, vegetación, nodos y aprovechamiento) solo actúan en B.

Los pares se abren con los botones **Escenarios listos** (A o B de cada par), que cargan las variables y empiezan a simular al ritmo normal, o en «Condiciones de partida → Escenario guardado». Si se cambia cualquier condición o la semilla, el rótulo avisa que ya no es el par guardado. El reloj del simulador (mes y año) es el tiempo de referencia; acelerar no cambia los resultados.

## Estructura

Las páginas y sus recursos están en la raíz. `simulador-3d/` contiene la versión local actualizada, incluyendo comparación A/B, indicadores, reglas de cierre y agentes en movimiento. La pestaña Simulador utiliza esa copia del mismo repositorio.

## Interpretación

El modelo es exploratorio. Los valores de ensayo, las unidades normalizadas y las limitaciones aparecen en sus paneles. Sus resultados no son mediciones ni predicciones validadas del territorio. Las referencias, créditos de imágenes y procedencia de cartografía se conservan en las páginas y archivos de datos.

## Publicación

Este repositorio conserva el proyecto. Subirlo a GitHub no activa por sí solo una página pública: el alojamiento se configura por separado. Si se habilita un alojamiento estático, no se necesita compilación.

## Derechos

Se conservan las atribuciones de los recursos originales. No se asigna una licencia global que sustituya las licencias de cartografía, fotografías o bibliotecas de terceros.

## Continuar el simulador en equipo

Lee [el contexto completo para la IA](simulador-3d/CONTEXTO-PARA-IA.txt) antes de modificar el simulador. Incluye el territorio, las variables, las reglas A/B, indicadores, especies, actores, archivos y criterios de verificación. Adjunta ese documento al chat de tu IA junto con el acceso al repositorio.

Trabaja en una rama propia, sincroniza antes de editar y presenta los cambios para revisión antes de integrarlos a main. El contexto corresponde al estado revisado el 25 de noviembre de 2026; contrástalo con el código si hay actualizaciones posteriores.

