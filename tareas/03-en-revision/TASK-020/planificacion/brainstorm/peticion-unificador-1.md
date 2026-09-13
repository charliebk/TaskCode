# Peticion al unificador — TASK-020 (ronda 1)

- Tarea: TASK-020 — Comando taskctl codex-review (segunda opinión independiente)
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-09-12
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (1 puntos): **trivial**
- Senales encontradas:
  - dependencias: 1 dependencias (TASK-013) (+1)

Los dos niveles NO coinciden. Se lanzan 2 roles, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

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
`revision_codex: true` en `tarea.md` ya está soportado por la máquina de
estados (`src/core/state-machine.ts`, caso `'codex-review'`: exige estado
`en-revision`, `revision_codex: true` y revisión primaria ya aprobada) y por
`taskctl finish` (`INFORME_CODEX_RE`, `informesDeLaRonda` ya reutilizada
desde TASK-018: exige que el informe de Codex también apruebe si
`revision_codex` está activo). Lo que falta es el propio comando: `cli.ts`
no enruta ningún subcomando `codex-review`, y no existe ningún
`src/commands/codex-review.ts` que invoque el CLI de Codex y escriba
`informe-codex-N.md`.

El CLI de Codex (`codex-cli`, de OpenAI) SÍ está instalado en esta máquina
(`codex --version` → `codex-cli 0.144.1`) y trae un subcomando hecho
justo para esto: `codex review --base <rama> [--commit <sha>]
[--title <texto>] [prompt]`, no interactivo, que revisa el diff contra una
rama base y admite instrucciones propias. Un `codex` ausente del PATH debe
degradar con un aviso, sin romper el flujo (criterio de aceptación 3) —
`taskctl` ya tiene precedente de esto con los scripts de Git-Flow
(`detect_origin_available` en `git.ts`, o el propio patrón de "avisa y
continúa en local" cuando no hay `origin`).
````

### Criterios de aceptacion

````
Solo se ejecuta si la revisión primaria ya está aprobada y la tarea tiene `revision_codex: true`.
Envuelve el CLI de Codex y guarda su salida en la carpeta de la tarea, sin mezclarla con la de la revisión primaria.
Si Codex no está instalado, avisa y degrada con elegancia en vez de romper el flujo.
Tests que cubren la precondición de estado y la ausencia del CLI.
````
