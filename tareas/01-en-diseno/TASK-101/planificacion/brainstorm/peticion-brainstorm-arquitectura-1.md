# Peticion de brainstorm — TASK-101, rol arquitectura (ronda 1)

- Tarea: TASK-101 — Verificacion proporcional A2: el guardian de merges no exige la completa si la tarea solo cambia documentacion
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-10
- Rol: `brainstorm-arquitectura` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-arquitectura-1.md`

## Tu pregunta

> Dado lo que ya existe, ¿donde encaja este cambio y que forma tiene?

## Que miras

- Los modulos y ficheros que ya resuelven algo parecido, para extenderlos en vez de duplicarlos.
- Que se crea nuevo, que se extiende y en que orden se construye.
- Los limites que el cambio cruza: contratos publicos, formatos de fichero, esquemas.
- El precedente interno mas cercano: como se resolvio la ultima vez un problema de esta forma.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Como se prueba (es del rol de testing).
- Por donde se rompe (es del rol de riesgos).
- Las reglas de negocio (son del rol de dominio).

## Enunciado de la tarea

### Objetivo

````
Segunda parte de TASK-100 (troceada por la regla de una hora, decision de Carlos 2026-11-10). Con la decision unica de TASK-100 (decidirVerificacion, rutas_documentacion leidas de la base, memo 'documentacion'), el guardian de merges recalcula el diff con merge-base(destino, fuente), sin depender de la tarea ni del memo de finish: deja pasar un merge de solo documentacion con el verde del memo de documentacion (o sin el si no hay comando de documentacion) y sigue bloqueando uno con codigo sin verde de la completa. Si no puede calcular el diff con el destino ya protegido, bloquea. Un valor invalido de la clave nueva no desactiva el guardian. Plan de partida: tareas/04-terminadas/TASK-100/planificacion/plan-final.md (seccion A2).
````

### Criterios de aceptacion

````
Con rutas_documentacion declaradas, el guardian deja pasar el merge de una tarea de solo documentacion sin verde de la completa y bloquea el de una con codigo (un test por caso, repo temporal)
Lanzado el merge a mano sin pasar por finish, el guardian llega a la misma decision que finish para el mismo par fuente-destino (test)
Si no puede calcular el diff con el destino protegido, o la clave nueva tiene un valor invalido, el guardian bloquea igual que hoy (un test por caso)
Sin la configuracion nueva el guardian se comporta exactamente como en la 0.14.0 (test de regresion)
De la revision de TASK-100 (ronda 2): el mensaje de error de rutas_documentacion deja de decir «casa con cualquier fichero» para `*` y `*/**` (MEN-6), y verificacion-selectiva.md corrige la frase sobre core.ignorecase: el pathspec distingue mayusculas siempre salvo con :(icase) (MEN-7)
verificacion-selectiva.md, README y CHANGELOG explican el comportamiento del guardian
La suite completa pasa en verde (npm test) sin debilitar ningun test
````

## Como entregas

Escribe en `salida-brainstorm-arquitectura-1.md`, con estas secciones y en este orden:

- Enfoque propuesto, con rutas y nombres concretos
- Que se extiende y que se crea
- Limites que cruza
- La decision de diseño que mas te preocupa (UNA sola)

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **riesgos**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
