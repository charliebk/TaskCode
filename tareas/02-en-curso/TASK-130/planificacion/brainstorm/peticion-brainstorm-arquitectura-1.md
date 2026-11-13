# Peticion de brainstorm — TASK-130, rol arquitectura (ronda 1)

- Tarea: TASK-130 — Poda periodica de tests redundantes: fusionar o borrar sin perder cobertura
- Tipo: feature · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-11-13
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
Medido en ToolsaWeb (taskctl metricas, 2026-11-12): la verificacion completa tarda unos 45 min y el cierre de TASK-306, con un solo test cambiado, espero 44 min 52 s. Cada tarea y cada ronda suman tests, y ninguno se retira aunque otro posterior ya cubra lo mismo. Se busca una tarea de mantenimiento periodica, propuesta por el plugin cuando la suite crece, que fusione o borre los tests redundantes sin bajar la cobertura de las lineas que ya cubrian, y una primera pasada sobre la suite de TaskCode (docs/auditoria/PERFIL-TESTS-2026-11-12.md tiene su perfil por fichero). Usa el aviso de crecimiento de TASK-129: va despues de ella. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
taskctl doctor propone abrir una tarea de poda (con el comando taskctl new ya escrito) cuando salta el aviso de crecimiento de la suite o han pasado mas de N tareas cerradas desde la ultima poda, con N configurable y 30 por defecto (test con repo temporal)
La skill task-workflow describe el procedimiento de poda: como localizar duplicados, que se fusiona y que se borra, y que la cobertura de las lineas que cubrian no baja (comprobado con la cobertura sobre lineas de TASK-074)
Primera pasada en TaskCode: la suite rapida y la completa pierden al menos un 10 % de duracion o de numero de tests sin bajar la cobertura total, con el antes y el despues anotados en el plan (comprobado con scripts/perfil-tests.mjs)
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
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
