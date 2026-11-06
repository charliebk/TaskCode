# Peticion de brainstorm — TASK-080, rol riesgos (ronda 1)

- Tarea: TASK-080 — Accesibilidad en angular-vue-reviewer y roles de arquitectura y rendimiento en plan
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-06
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
Tres refuerzos pedidos por la persona. Primero, la accesibilidad WCAG 2.2 dentro de angular-vue-reviewer y no como revisor aparte: un revisor propio sobre .vue solaparia patrones y clasificarPorDominio mandaria esos ficheros al generico. Segundo, criterios de arquitectura mas exigentes en el rol brainstorm-arquitectura de la fase plan. Tercero, un rol nuevo, brainstorm-rendimiento, para las tareas con WASM, Web Workers, 3D o carga pesada.
````

### Criterios de aceptacion

````
skills/angular-vue-reviewer/SKILL.md revisa contraste, orden y visibilidad del foco, trampas de teclado, etiquetas y aria en controles, nombre accesible de iconos y botones y dialogos modales, citando WCAG 2.2; test/skills/revisores.test.ts sigue en verde y sus patrones_archivo no cambian
agents/brainstorm-arquitectura.md incluye limites entre modulos, direccion de las dependencias, acoplamiento y coherencia con los ADR del proyecto, y test/agents/brainstorm-roles.test.ts lo comprueba
Existe agents/brainstorm-rendimiento.md con el mismo formato que los demas roles brainstorm-*: coste algoritmico, asignaciones en bucles calientes, copias JS-WASM, Web Workers, mallas y teselas grandes, y medir con datos reales antes de optimizar
taskctl plan lanza brainstorm-rendimiento cuando la tarea tiene etiquetas de rendimiento, wasm, workers o 3d, y no lo lanza sin ellas; lo cubren tests en test/commands/plan-brainstorm.test.ts
brainstorm-unificador integra la salida de rendimiento; README del plugin, documentacion de roles y CHANGELOG lo recogen, y catalogo-skills.yml queda con total_skills cuadrado si cambia
npm test en verde (salvo los tres rojos conocidos de Windows) en la rama de la tarea
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
- Trabajan en paralelo contigo, sin verte: **arquitectura**, **testing**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
