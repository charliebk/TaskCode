# Peticion de brainstorm — TASK-098, rol arquitectura (ronda 1)

- Tarea: TASK-098 — ROADMAP de tareas generado por taskctl en todos los proyectos, sin pisar los existentes
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
Que todo proyecto tenga tareas/ROADMAP.md al dia sin escribir un script: hitos (campo sprint), orden por dependencias (ninguna tarea antes que sus predecesoras; a igualdad, el hito anterior), complejidad, estado, tareas terminadas y un resumen de lo que esta en marcha y lo que esta listo para empezar, regenerado en el commit de cada transicion. Hoy solo lo tienen ToolsaWeb y OpenDockTrading, con su propio scripts/grafo-tareas.py. Regla numero uno (decision de Carlos): no puede entrar en conflicto con esos dos proyectos; taskctl solo escribe un ROADMAP que lleve su marca o que no exista. La migracion de esos proyectos se permite solo si no rompe nada ni pierde datos, va en tareas aparte en cada repo y la decide la persona.
````

### Criterios de aceptacion

````
Sin tareas/ROADMAP.md, cada transicion (new, plan, approve, start, review, finish) lo crea o regenera con la marca de taskctl dentro de su mismo commit: hitos, orden por dependencias, complejidad, estado y resumen (test de integracion en un repo temporal)
Un tareas/ROADMAP.md sin la marca de taskctl, o declarado en rutas_sincronizacion, queda byte a byte igual tras cada transicion (test con copias de los ROADMAP reales de ToolsaWeb y OpenDockTrading)
La zona manual entre marcas se conserva al regenerar, y una dependencia circular se informa en el ROADMAP sin abortar la transicion (un test por caso)
taskctl roadmap --comparar genera en seco y lista, sin escribir nada, lo que difiere del ROADMAP actual (tareas, hitos, dependencias, estado, zona manual); es la comprobacion previa a migrar un proyecto (test)
skills/task-workflow, README y CHANGELOG explican el ROADMAP, la marca, la zona manual y como migrar un proyecto que ya tiene el suyo
La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test
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
