# Peticion de brainstorm — TASK-091, rol riesgos (ronda 1)

- Tarea: TASK-091 — Verificacion selectiva por impacto en las rondas y completa obligatoria antes de integrar
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-09
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
Urgente (pedido por Carlos el 2026-11-09, desde ToolsaWeb). La verificacion completa de un proyecto crece con cada tarea (en ToolsaWeb, `scripts\verificar.bat` ya tarda unos 40 minutos) y hoy se repite en cada ronda de revision aunque la tarea no haya tocado la capa de datos ni el frontend. TaskCode tiene que separar dos verificaciones: una **selectiva por impacto**, rapida, para la implementacion y las rondas de revision, y la **completa**, obligatoria antes de integrar, para que ninguna rama pase a otra sin comprobarlo todo. Todas las aplicaciones que usan el plugin la adoptan y sustituyen su verificador por este encaje.

Encaje propuesto (sobre TASK-070 y TASK-088):
- `comando_verificacion` sigue siendo la completa y la puerta de `finish` y del guardian de merges.
- Nueva clave opcional `comando_verificacion_selectiva`, que recibe la rama base (`develop`) para que el proyecto decida que corre segun lo cambiado. La usan el hook `Stop` y las rondas de `review`. El mapa de capas es de cada proyecto; TaskCode solo orquesta.
- Sin la clave nueva, todo se comporta como hoy.
````

### Criterios de aceptacion

````
Nueva clave opcional `comando_verificacion_selectiva` en `resolverConfig` (con su timeout), con fallo cerrado ante valor invalido y defecto null; sin ella, el comportamiento de todos los comandos es identico al actual y los tests existentes pasan sin tocarlos
Con la clave, el hook `Stop` y `taskctl review` ejecutan la selectiva (pasandole la rama base) y la peticion de revision dice que verificacion se corrio, con su salida y si fue selectiva o completa
`taskctl finish` exige la completa (`comando_verificacion`) en verde sobre el commit que va a integrar, aunque las rondas usaran la selectiva; si falla o no se ha corrido, no integra y dice como correrla
`taskctl doctor` avisa cuando un proyecto tiene `comando_verificacion` pero no `comando_verificacion_selectiva`, con el arreglo en la misma linea
Tests contra repos Git temporales reales (sin mocks): selectiva en review, completa obligatoria en finish, sin clave igual que antes
Guia de migracion para los proyectos que usan el plugin (como escribir el clasificador por impacto, que cambios fuerzan la completa y como declarar las dos claves), y tabla de claves de config, README, CHANGELOG y ROADMAP al dia
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
