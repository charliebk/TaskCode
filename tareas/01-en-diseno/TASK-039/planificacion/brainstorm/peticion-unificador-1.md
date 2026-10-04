# Peticion al unificador — TASK-039 (ronda 1)

- Tarea: TASK-039 — F2-T3 Menos llamadas git en los comandos
- Tipo: feature · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-10-04
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **simple**
- Heuristica (0 puntos): **trivial**
- Senales encontradas:
  (ninguna senal encontrada — el texto de la tarea no aporta ninguna)

Los dos niveles NO coinciden. Se lanzan 1 rol, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

## Como consolidas

**Esta tarea se planifico con un solo rol**, asi que aqui no hay desacuerdos que resolver: no te los inventes ni trates la ausencia de discrepancia como una senal de nada.

1. Lee la salida de arriba. Si falta o esta sin rellenar, dilo en el plan en vez de suplirla en silencio.
2. **Contrasta esa propuesta contra el enunciado de la tarea**, que tienes al final. Lo util que puedes aportar aqui no es mediar entre puntos de vista, es senalar QUE QUEDO SIN CUBRIR: criterios de aceptacion que el rol no toca, riesgos que no mira porque no era su papel, decisiones que da por hechas.
3. Cada afirmacion del plan que venga del rol se atribuye a el; lo que anadas tu, tambien.

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Lo que el rol no cubrio, contrastado contra los criterios de aceptacion.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

## Enunciado de la tarea

### Objetivo

````
Quitar las llamadas `git` sobrantes de los comandos de `taskctl` sin cambiar su
comportamiento (auditoria del 2026-10-03, B6). Medido con `GIT_TRACE2_EVENT`
en un ciclo completo: `review` lanza 27 procesos `git` y `finish` 33. La mayor
parte de los que se repiten no estan duplicados dentro del CLI: los hace una
vez el comando y otra el script de Git-Flow, que es la fuente de verdad y no
se toca aqui. Lo que si sobra esta en `autoCommit`: un `git add` por ruta (5
en `finish`), `rev-parse --short` mas `show --name-only` para lo mismo, y el
`maintenance run --auto` que Git lanza tras cada commit automatico.
````

### Criterios de aceptacion

````
`finish` baja de 35 a 20 o menos procesos `git` y `review` de 26 a 15 o menos, medido con `GIT_TRACE2_EVENT`
Suite en verde sin tocar expectativas
````
