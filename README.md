# Kennedy · Proyecto territorial

Atlas web de investigación y propuesta arquitectónica en Kennedy, Bogotá. Integra macromodelos, problema, evidencia, redes urbanas y de especies, actores, programa arquitectónico, propuesta territorial y simulador 3D.

## Abrir en el computador

Desde esta carpeta, iniciar un servidor estático (por ejemplo `python -m http.server 8000`) y abrir:

- Página principal: http://localhost:8000/macromodelos.html
- Propuesta territorial: http://localhost:8000/programa-mapa.html
- Simulador: http://localhost:8000/simulador.html
- Simulador completo: http://localhost:8000/simulador-3d/

Los módulos y los datos requieren HTTP; abrir los HTML directamente con doble clic puede impedir su carga.

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

