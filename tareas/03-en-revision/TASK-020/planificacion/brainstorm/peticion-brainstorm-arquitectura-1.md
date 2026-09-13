# Peticion de brainstorm — TASK-020, rol arquitectura (ronda 1)

- Tarea: TASK-020 — Comando taskctl codex-review (segunda opinión independiente)
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-09-12
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
