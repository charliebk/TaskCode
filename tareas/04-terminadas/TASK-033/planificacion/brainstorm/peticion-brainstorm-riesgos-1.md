# Peticion de brainstorm — TASK-033, rol riesgos (ronda 1)

- Tarea: TASK-033 — Comando de sincronización tras cada transición y guía de criterios post-cierre (v0.1.1)
- Tipo: fix · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-03
- Rol: `brainstorm-riesgos` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-riesgos-1.md`

## Tu pregunta

> ¿Por donde se rompe esto?

## Que miras

- Bordes y estados intermedios: que queda a medias si el proceso muere a mitad.
- Fallos parciales y concurrencia: dos ejecuciones, un recurso ocupado, un permiso denegado.
- Compatibilidad hacia atras con los datos y ficheros que YA existen.
- La vuelta atras: si esto sale mal, como se deshace y que queda inservible.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Que aserciones escribir (es del rol de testing).
- Las reglas de negocio (son del rol de dominio).

## Enunciado de la tarea

### Objetivo

````
Corregir dos huecos que ha destapado el primer proyecto externo que usa el
plugin (OpenGisViewer, TASK-003), y publicarlos como versión de corrección
**0.1.1**.
````

### Criterios de aceptacion

````
Con las claves nuevas configuradas, `approve`, `start`, `review` y `finish` ejecutan el comando de sincronización y las rutas declaradas entran en **su mismo** commit automático. Test contra un repo Git real con un script que reescribe un fichero a partir de `tareas/`.
Después de cada una de esas transiciones, `git status --porcelain` sale vacío: no queda el `MM` del hook de pre-commit y el siguiente comando no aborta en el guard de la §8.3. Test que encadena `approve → start → review` sin commits manuales en medio.
Sin las claves, el comportamiento es idéntico al de hoy: la suite existente pasa sin tocar sus expectativas.
Un comando de sincronización que falla (exit ≠ 0) o que toca rutas no declaradas no se traga en silencio. La semántica exacta sale del plan y tiene test de contraprueba.
Una clave mal escrita o con un valor inválido aborta con la lista de claves válidas, igual que las tres que ya existen (fallo cerrado).
`SKILL.md` documenta las dos claves nuevas y la guía de criterios post-cierre. Los tests de «no mencionar el proyecto» siguen en verde.
Versión 0.1.1 en `package.json` y `plugin.json` (y en el marketplace si la declara). Entrada en `CHANGELOG.md`.
Verificación de extremo a extremo en OpenGisViewer (o en un clon desechable suyo): con las claves configuradas, una transición deja `pnpm check:plan` en verde sin commit manual.
````

## Como entregas

Escribe en `salida-brainstorm-riesgos-1.md`, con estas secciones y en este orden:

- Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno
- Estados intermedios y fallos parciales
- Compatibilidad hacia atras
- Vuelta atras
- El riesgo que mas te preocupa (UNO solo)

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
