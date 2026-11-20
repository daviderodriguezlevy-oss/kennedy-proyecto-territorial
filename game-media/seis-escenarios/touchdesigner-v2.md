# Kennedy · Tercera persona / versión 2

Seis escenas 3D retro, cámaras peatonales y misiones. Los WebM tercera-persona-1 a 6 corresponden a esta versión. Los archivos escena-1 a 6 y el CSV antiguo son de la versión 1.

## Datos
Exportar eventos y trayectorias en la página genera un JSON con la sesión actual. El archivo kennedy-tercera-persona.json contiene una ejecución automática de referencia de 40 segundos de modelo, grabada en 20 segundos de video (velocidad 2×).
- events: id, time, scene, action, resource; eventos de lote incluyen lot, relation y causedBy.
- trajectories: tiempo, escena, identidad, clase, x/y/z locales, etapa y tipo de control.
- relations: origen, destino, recursos, clase, tiempo de origen y tiempo de destino.
No hay coordenadas geográficas ni tiempos de viaje reales. Las trayectorias se muestrean aproximadamente a 5 Hz de simulación.

## TouchDesigner
1. Cargar los seis WebM en Movie File In TOP y sincronizar su reloj. Layout TOP: seis columnas.
2. Cargar el JSON exportado con Text DAT. El script touchdesigner-events.py convierte los eventos en una tabla DAT. Ejecutar fill_events(op('json_text'), op('events_table')).
3. Filtrar eventos por tiempo de reproducción. Para los videos de referencia, multiplicar el tiempo de video por 2 para obtener tiempo de simulación.
4. Conectar eventos que comparten lot AL-01. El despacho crea una llegada después de 6 s de simulación; la venta requiere llegada. Usar causedBy para los vínculos explícitos.
5. Representar flow con línea continua, effect con guiones y parallel con puntos. Las comparaciones parallel no implican causalidad; revisar sus tiempos antes de llamarlas simultáneas.
6. Para superponer x/y/z sobre video es necesaria la cámara de cada escena: las coordenadas de mundo no son píxeles. La web ya realiza esa proyección. No superponer x/z directamente a un video en perspectiva.

Los IDs son del modelo, no detección automática. No se entrega un .toe ni una conexión activa con TouchDesigner. Las visitas florales no demuestran polinización; no se miden contaminantes.
