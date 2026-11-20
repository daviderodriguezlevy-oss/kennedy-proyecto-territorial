# Kennedy · Seis escenarios en TouchDesigner

Los videos WebM y el CSV son salidas de una simulación conceptual, no datos observados. Cada video muestra 10 s iniciales y los mismos 10 s con intervención. El CSV contiene los 20 s completos de ambos escenarios, a 10 Hz. El laboratorio web permite recorrer esos 20 s.

## Montaje
1. Crear seis Movie File In TOP, uno por escena. Ajustar reproducción al mismo índice o reloj común. Cada archivo tiene el mismo formato vertical y duración.
2. Usar Layout TOP para una fila de seis columnas. Conservar la proporción 1:2 y dejar separaciones.
3. Importar kennedy-seis-escenarios.csv en Table DAT (primera fila como nombres de columnas).
4. Crear un Text DAT con el contenido de touchdesigner-frame.py. Llamar frame_rows desde un Script DAT o un callback con la tabla importada, escena (1–6), escenario y tiempo del clip.
5. Usar x_normalized e y_normalized para las posiciones del overlay. El origen en nuestros datos es arriba a la izquierda; invertir y al usar coordenadas cartesianas. Una posición normalizada no equivale a metros.
6. Instanciar rectángulos y Text TOP para los IDs; guardar posiciones anteriores por actor_id para dibujar estelas. Emitir líneas de interacción únicamente cuando target_x,target_y tienen valor.
7. Para reproducción de los WebM: segundos 0–10 = initial y tiempo fuente 0–10; segundos 10–20 = intervention y tiempo fuente 0–10.

## Clasificación y límites
Las clases e identidades vienen del modelo. Blob Track TOP puede comparar movimiento visible, pero no clasifica especies. No rotular este proceso como reconocimiento automático de fauna.
Estados: caminar, esperar, comprar, circular, descargar, transportar, entregar, cruzar, retenido, arrastrado, expuesto, desplazarse, visitar_flor, volar.
Las visitas no son evidencia de polinización. Las cercanías no son ventas. No inferir PM2.5, ruido real ni contaminación química de los colores.

## Extensión en directo
Para OSC, un puente local podría enviar /kennedy/actor con escena, escenario, tiempo, id, clase, x, y y estado a OSC In DAT. Esta entrega usa CSV reproducible: no instala ni configura un servidor OSC ni un proyecto .toe.

Fuentes técnicas: https://derivative.ca/UserGuide/Blob_Track_TOP y https://derivative.ca/UserGuide/OSC_In_DAT
