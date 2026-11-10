# Peticion al unificador — TASK-098 (ronda 1)

- Tarea: TASK-098 — ROADMAP de tareas generado por taskctl en todos los proyectos, sin pisar los existentes
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-10
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (4 puntos): **media**
- Senales encontradas:
  - etiquetas_adicionales: 2 etiquetas (1 mas alla de la primera) (+1)
  - palabra_alto_riesgo: migracion (+2)
  - criterios_aceptacion: 6 criterios (umbral: 5) (+1)

Los dos niveles coinciden. Se lanzan 2 roles.

## Como consolidas

1. Lee las salidas de arriba. **Si alguna falta o esta sin rellenar, sigue adelante con las que haya y escribe en el plan cual falto**: un plan con un punto de vista menos, dicho, vale mas que un plan que finge estar completo.
2. **No promedies.** Donde dos roles discrepen, el plan dice quien propone que, cual gana y por que. Un desacuerdo resuelto con una frase intermedia que no defiende nadie es la peor salida posible de este paso.
3. **Si no discrepan en nada, eso es la alarma, no la nota de calidad**: significa que los roles recibieron el mismo contexto o que alguno no hizo su trabajo. Dilo en el plan.
4. Cada afirmacion del plan que venga de un rol se atribuye a ese rol.

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Los desacuerdos entre roles y como se resuelve cada uno.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

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
