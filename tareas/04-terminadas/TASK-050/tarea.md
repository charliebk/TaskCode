---
id: TASK-050
titulo: "F6-T1 Suite rapida y repo plantilla en los tests"
tipo: feature
sprint: 7
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-050-f6-t1-suite-rapida-y-repo-plantilla-en-l
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-05
dependencias: []
---
## Objetivo

La suite completa tarda unos 11 minutos y no hay forma de iterar mas rapido
(auditoria B3, B4, B7). Se anade `npm run test:rapido` con los tests de core
y cli que no lanzan procesos, se crea un helper que monta el repo Git base
una vez por fichero y lo copia con `fs.cp` en vez de repetir los `git init`
y commits de cada test, y se mide cuanto cuesta la cobertura para decidir si
va en un `test:cov` aparte.

## Criterios de aceptacion
- [x] `npm run test:rapido` (core y cli, sin procesos) en menos de 1 min; `npm test` sigue siendo la suite completa
- [x] Helper que crea el repo base una vez por fichero y lo copia con `fs.cp`, adoptado en los 5 ficheros mas lentos
- [x] Medicion con y sin `--experimental-test-coverage` anotada; si compensa, `test:cov` aparte

## Resultado

**Implementado.**
- `test/helpers/repo-plantilla.ts`: `plantillaRepo(prefijo, receta)` monta el
  repo base una vez por proceso (un fichero de test = un proceso) y cada test
  recibe una copia con `fs.cp` que se borra al terminar. La receta la pone cada
  fichero, copiada literalmente del setup anterior. La plantilla se borra al
  salir del proceso (`process.once('exit')`), no en un `after()`: un `after()`
  llamado dentro de un test se ata a ese test, y `automatico` (una plantilla
  por config, creada bajo demanda) perdia la plantilla tras el primer test
  (9 rojos con ENOENT; lo destapo la medicion y lo fija un test del helper).
- Adoptado en los 5 ficheros mas lentos **medidos** (no en los que se
  suponian): `automatico`, `start`, `review`, `plan-brainstorm`, `finish`.
- `npm run test:rapido`: `core/` y `cli/`. Lo que lanzaba procesos de esas
  carpetas pasa a `test/integracion/` (misma profundidad, imports intactos):
  `core/config`, `cli/main`, `cli/flags-desconocidos` y el test de
  `comprobarSkillInstalado` (lanza `claude`).
- `npm run limpiar:test` (borra `dist/test`, nunca `dist/src`) corre antes de
  `test` y `test:rapido`: `tsc` no borra los `.js` de un test movido o
  borrado, que seguian ejecutandose desde `dist`.
- Documentado en `CLAUDE.md`, `README.md` y `CONVENCIONES.md`: `test:rapido`
  es para iterar, no vale para cerrar una tarea.

**Mediciones (Windows nativo, 12 nucleos, 2026-10-05).**
- `npm test` de partida: 513 s, 1083 tests, 3 rojos conocidos.
- `test:rapido`: 357 tests en 11 s con limpieza y `tsc` (revisor: 12,9 s).
- Cobertura, suite completa en serie y sin otra carga: **sin** cobertura
  523 s, **con** cobertura 436 s (1088 tests, mismos 3 rojos). La diferencia
  es ruido, en contra del flag incluso: no supera el umbral del 10 % del plan,
  asi que **no se crea `test:cov`** y `npm test` conserva la cobertura.
- Los 5 ficheros, cada uno solo, develop contra rama (medicion del revisor;
  la mia da lo mismo dentro del ruido): start 126→128 s, finish 71→64,
  review 83→69, plan-brainstorm 79→60, automatico 136→135; total 495→456 s
  (~8 %). La plantilla ahorra poco: el coste de esos tests son los procesos
  `taskctl`/Git-Flow, no el montaje del repo base. La ganancia de verdad de
  la tarea es `test:rapido`; el camino critico de `npm test` es TASK-051.

**Revision (ronda 1, `cambios-solicitados`).**
- IMP-1 (criterio 3 sin anotar): **corregido** con esta seccion. Las
  mediciones existian pero no constaban en ningun fichero.
- MENOR-1 (ganancia pequena sin documentar): **corregido**, anotado arriba.
- MENOR-2 (imports sin uso en `plan-brainstorm` y `automatico`): **corregido**.
- MENOR-3 (la limpieza de la plantilla al salir y el `rm` tras una receta
  fallida no tienen test que se ponga rojo): **aceptado sin corregir**. Es
  limpieza de temporales; tras la suite completa no quedaba ningun
  `taskctl-*` en `%TEMP%`, y probarlo exige lanzar un proceso hijo solo para
  mirar un directorio borrado.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-05 | plan | manual | persona |
| 2026-10-05 | approve | manual | persona |
| 2026-10-05 | start | manual | persona |
| 2026-10-05 | review | manual | persona |
| 2026-10-05 | review | manual | persona |
| 2026-10-05 | finish | manual | persona |
