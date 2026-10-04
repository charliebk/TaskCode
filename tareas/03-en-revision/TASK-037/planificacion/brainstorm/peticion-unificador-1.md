# Peticion al unificador — TASK-037 (ronda 1)

- Tarea: TASK-037 — F2-T1 Logging de los scripts de Git-Flow sin lanzar procesos
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
Que el logging de los scripts de Git-Flow deje de lanzar procesos: hoy cada
linea abre un subshell `$(_do_log ...)` y un `date` (~0,15 s por linea medido
en Windows; `initialize_gitflow_log` y `log_summary` lanzan mas `date`). Es la
mayor parte de los 11 s que `update-feature.sh` se lleva dentro de `taskctl
review` (auditoria del 2026-10-03, B1), y lo paga cada `start`, `review`,
`finish`, `diagnose` y un tercio de la suite.

Con bash >= 4.2 la hora sale de `printf -v ... '%(...)T'`; con bash mas
antiguo (el `/bin/bash` 3.2 de macOS) se conserva `date` como caida. Fuera de
alcance: la deteccion de origin (TASK-038).
````

### Criterios de aceptacion

````
`_gitflow-common.sh` usa `printf -v` en lugar de `$(date)` y `$(_do_log)`
Tiempo de `update-feature.sh` en un repo temporal medido antes y despues y anotado en el Resultado
Salida y fichero de log identicos (salvo la hora) en un caso de prueba
Tests de `test/gitflow/` en verde
````
