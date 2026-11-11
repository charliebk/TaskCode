# Peticion de brainstorm — TASK-106, rol arquitectura (ronda 1)

- Tarea: TASK-106 — Verificacion proporcional B3: finish verifica solo lo afectado con codigo parcial
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-11
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
Tercera parte de TASK-096. Con la decision selectiva de TASK-105, puertaSoloDocumentacion pasa a puertaProporcional: si la decision es selectiva, finish corre comando_verificacion_selectiva (con RAMA_BASE y timeout_verificacion_selectiva, reutilizando el memo del Stop o de review si casa la huella) en vez de la completa, y lo dice en su salida con el motivo; lo anota en tarea.md en una seccion idempotente. Decisiones de Carlos: la puerta de cobertura queda omitida en el nivel 2 (se mide en la completa del release); release y hotfix siempre a la completa; el verde selectivo nunca escribe el memo de la completa. Se retira el texto aunque las rondas usaran la selectiva cuando aplica la clave. Plan de partida: tareas/01-en-diseno/TASK-096/planificacion/plan-final.md (particion, decisiones de Carlos del 2026-11-11).
````

### Criterios de aceptacion

````
En un repo temporal cuya tarea cambia codigo dentro de rutas_verificacion_parcial, finish ejecuta solo la selectiva (contadores: selectiva 1, completa 0), integra y lo dice en su salida; con codigo fuera de esas rutas ejecuta la completa (contadores al reves) y dice por que (un test por caso)
Con la selectiva en rojo no integra: develop no se mueve y la tarea sigue en revision (test)
El verde de la selectiva no escribe freno-verificacion.json; la puerta de cobertura queda omitida en el nivel 2; release y hotfix ejecutan la completa (un test por caso)
Una rama que cambia a la vez codigo y su propio clasificador (fuera de las rutas declaradas) va a la completa (test)
Un proyecto que ya declara comando_verificacion_selectiva pero no la clave nueva se comporta como en la 0.14.0: finish corre la completa (los tests TASK-091 siguen igual)
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
