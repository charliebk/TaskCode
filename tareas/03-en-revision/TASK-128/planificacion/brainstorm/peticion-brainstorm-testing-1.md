# Peticion de brainstorm — TASK-128, rol testing (ronda 1)

- Tarea: TASK-128 — Metricas de verificacion por puerta: tiempo y ejecuciones de freno, review y finish, y rondas solo por menores
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-13
- Rol: `brainstorm-testing` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-testing-1.md`

## Tu pregunta

> ¿Como se demuestra que esto funciona, y como envejece?

## Que miras

- Que es observable desde fuera, y contra que recurso real se comprueba.
- Para cada prueba propuesta, LA MUTACION DEL CODIGO FUENTE QUE LA PONDRIA ROJA. Si no sabes decirla, esa prueba no vale.
- Que pruebas ya existentes cambian de expectativa y cuales siguen valiendo de red de regresion.
- Como envejece: que se rompe dentro de seis meses cuando alguien extienda esto.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Por donde se rompe en produccion (es del rol de riesgos).
- Las reglas de negocio (son del rol de dominio).

## Enunciado de la tarea

### Objetivo

````
Medido en ToolsaWeb (taskctl metricas, 2026-11-12): la verificacion completa tarda unos 45 min, el freno Stop hasta 26 min por turno en tareas del nucleo y la revision ya es el 59-65 % del tiempo de cada tarea, pero metricas no ve cuanto se va en cada puerta: solo hay memos de la ultima ejecucion. TASK-111 registra el freno y TASK-120 la sincronizacion; falta registrar las verificaciones de review y de finish con el mismo formato, sumarlas por tarea y contar las rondas abiertas solo por MENORES (en los tres proyectos, 71 rondas asi con 2 CRITICO/IMPORTANTE nuevos y 70,2 M tokens, docs/auditoria/PASOS-PLUGIN-2026-11-12.md). Usa el registro de TASK-111: va despues de ella y de TASK-125 (presupuesto del freno). Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
Cada verificacion de ronda de review y cada verificacion de finish (completa, selectiva, documentacion, pesada) anade una linea con puerta, tarea, instante, modo, duracion y resultado al mismo registro bajo .git/taskcode/ que el freno de TASK-111 (test con repo temporal)
taskctl metricas muestra por tarea, para cada puerta (freno, review, finish), el numero de ejecuciones y el tiempo total, y una fila de totales; sin registro muestra — (test)
taskctl metricas cuenta por tarea las rondas abiertas tras una ronda sin CRITICO ni IMPORTANTE, leyendo los informes de revision que ya existen (test con informes de ejemplo)
Con tareas cerradas antes de este cambio, sin registro, metricas y metricas --por-version siguen dando la misma salida en las columnas que ya existian (test de regresion sobre un repo con datos de la 0.14)
README y CHANGELOG describen las columnas nuevas
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
````

## Como entregas

Escribe en `salida-brainstorm-testing-1.md`, con estas secciones y en este orden:

- Que es observable sin llamar a ningun agente
- Plan de pruebas, cada una con su mutacion
- Aserciones trampa que hay que evitar en esta tarea concreta
- Que pruebas existentes cambian de expectativa
- Como envejece

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**, **riesgos**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
