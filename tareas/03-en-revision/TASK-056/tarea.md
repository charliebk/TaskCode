---
id: TASK-056
titulo: "Flujo B: nucleo determinista del siguiente paso y registro de transiciones"
tipo: feature
sprint: 7
etiquetas: []
complejidad: null
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-056-flujo-b-nucleo-determinista-del-siguient
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-04
dependencias: []
---
## Objetivo

Parte de TASK-055 (su plan-final es el diseno de referencia). El CLI decide que fase toca y si hay que preguntar; el agente solo ejecuta. Sin esta pieza las fases guiadas no tienen de que leer.

## Criterios de aceptacion
- [x] Clave `modo_flujo` en `.taskcode/config.yml` (`manual`, `semiautomatico`, `automatico`): sin clave vale `manual` y un valor invalido aborta listando los tres validos
- [x] `taskctl siguiente TASK-NNN --json` devuelve fase, comando y si preguntar, sin commitear; tabla literal en `test/core/siguiente.test.ts` por estado, plan_aprobado, modo y veredicto
- [x] `taskctl siguiente` sale con codigo distinto de 0 ante tarea inexistente o config roto, y deduce la fase solo de Git y disco
- [x] Al cerrar `plan` el modo se congela en `tarea.md`; cambiar el config despues no cambia el modo de esa tarea
- [x] Cada transicion anade una fila `fecha | fase | modo | decidido_por` en `## Transiciones` de `tarea.md`, en el mismo commit que la transicion
- [x] `taskctl pausa TASK-NNN` registra una fila «pausada por la persona» con su commit, para el «no» del modo semiautomatico
- [x] `approve --decidido-por automatico` se rechaza si el modo congelado de la tarea no es `automatico`
- [x] En `siguiente`, hotfix y release en modo automatico devuelven preguntar antes de `finish`, y ningun camino automatico pasa `--push`

## Resultado

Implementado segun el plan (diseno de referencia: plan-final de TASK-055).

- `config.ts`: `modo_flujo` (`manual` por defecto), validador de enumerado
  con fallo cerrado, lista de validos y sugerencia del parecido.
- `core/transiciones.ts` (puro): seccion `## Transiciones` con
  `| fecha | fase | modo | decidido_por |`. El modo se congela en el propio
  registro (ultima fila `plan`), sin campo nuevo en el frontmatter, asi que
  registro y modo no pueden discrepar. Las filas mal formadas se ignoran al
  leer y nunca se reescriben.
- `plan`, `approve`, `start`, `review` (cada ronda) y `finish` anaden su fila
  al cuerpo que pasan a `moveTareaFile`: entra en el mismo autoCommit. Una
  segunda aprobacion de un plan ya aprobado no deja fila (sigue siendo
  idempotente: lo cazo el test de auto-commit que ya existia).
- `approve --decidido-por persona|automatico`: `automatico` se rechaza si el
  modo congelado no es `automatico`; sin valor, o con uno desconocido, falla.
- `taskctl pausa`: fila `pausa` con su commit, sin cambiar el estado; si la
  copia al dia de la tarea esta en su rama y no se esta en ella, aborta
  diciendo a que rama cambiar.
- `core/flujo.ts` (puro) y `taskctl siguiente [--json]`: fase, comando y
  accion (`detener`, `preguntar`, `continuar`). Manual nunca encadena;
  semiautomatico pregunta antes de approve, start, review y finish;
  automatico continua salvo hotfix/release antes de finish. Ningun comando
  propuesto lleva `--push`. Lee del working tree o, si la tarea vive en su
  rama sin integrar, de la rama con `git show`. `planRedactado` y
  `planEsPlantilla` se extrajeron de approve para no duplicar la comprobacion.

Tests: `test/core/siguiente.test.ts` (tabla literal de 16 casos x 3 modos, y
cruce con `assertTransitionAllowed`: ninguna fase propuesta es ilegal),
`test/core/transiciones.test.ts` (6), `config.test.ts` (+3 y aserción literal
de `manual`), y `test/commands/siguiente.test.ts` (8, CLI real por spawn en
repos temporales: ciclo semiautomatico completo con `siguiente` en cada paso y
una fila por transicion en su commit, lectura desde develop, errores, modo
congelado frente a config cambiado, pausa, hotfix en automatico). Lo escribio
un agente en paralelo; no encontro bugs.
Mutantes (7, todos muertos): hotfix sin preguntar, semiautomatico sin
preguntar, automatico preguntando, aprobacion automatica sin mirar el modo
congelado, modo sin congelar, siguiente sin leer la rama, start sin fila.
Suite: 1004 tests, 1001 en verde (los 3 rojos conocidos de Windows).
Smoke con `bin/taskctl` en semiautomatico: `siguiente` legible y `--json`,
`pausa` con su commit y `approve --decidido-por automatico` rechazado.

Divergencia menor: el criterio 2 habla de «si preguntar»; la salida usa
`accion` con tres valores, porque manual necesita distinguir «detener» de
«continuar sin preguntar».

### Revision por pares (ronda 1)

Revisor independiente: **cambios-solicitados** (3 IMPORTANTE, 8 MENOR).

- IMP-1 (corregido): con `revision_codex: true`, `siguiente` pedia
  `codex-review` sin fin (un booleano no distinguia sin informe, pendiente y
  cambios). Ahora el contexto lleva el veredicto de la ultima ronda de Codex:
  sin informe → `codex-review`; pendiente o sin linea → fase nueva
  `veredicto-codex`, sin comando y `preguntar` (no hay comando que lo escriba,
  y que lo escriba el agente que encadena es el veredicto autoescrito);
  cambios → `codex-review` con `preguntar` (corregir antes); aprobada →
  `finish`.
- IMP-2 (corregido): el registro se busca fuera de los bloques de codigo y se
  toma la ultima aparicion; las filas dentro de bloques se ignoran. Un ejemplo
  del registro en el enunciado ya no se confunde con el registro.
- IMP-3 (corregido): el criterio de «ultima ronda» se extrajo a
  `nombresDeUltimaRonda` (fs/rondas.ts), que usan el lector de disco y el de
  la rama: ya no hay dos copias. Test nuevo desde develop con la ronda
  fragmentada (pendiente, cambios, aprobada) y con Codex.
- MEN-1 y MEN-2 (corregidos): tabla en la seccion siguiente del test, y test
  de `--decidido-por=automatico`.
- MEN-3 (aceptado): re-planificar tras cambiar el config vuelve a congelar el
  modo, y `approve --decidido-por automatico` firma el plan-final que hubiera.
  Es lo especificado («la ultima fila plan congela») y re-planificar es un
  acto explicito: en un flujo guiado `siguiente` nunca propone `plan` con el
  plan ya redactado. Queda para decidir si re-planificar debe invalidar el
  plan-final.
- MEN-4 (corregido): sin modo congelado, `siguiente` propone `approve` con
  `preguntar` aunque el config sea automatico (la aprobacion automatica esta
  vetada). Fila nueva en la tabla.
- MEN-5 (corregido): `pausa` aborta si la carpeta de la tarea tiene cambios
  sin commitear. Test nuevo.
- MEN-6 (corregido): un veredicto desconocido dice «no se reconoce», no
  «falta el revisor».
- MEN-7 (aceptado): desde main, un hotfix ya cerrado aparece en revision: el
  commit de cierre de `finish` vive en la rama de integracion (comportamiento
  anterior a esta tarea). `siguiente` se consulta desde la rama base o la de
  la tarea.
- Mutantes: los 5 que sobrevivian en la ronda 1 y 4 nuevos de las
  correcciones, todos muertos. Suite: 1009 tests, 1006 en verde (los 3
  rojos conocidos de Windows).
- MEN-8 (aceptado): fuera de `approve`, `decidido_por` es `persona`. Las
  entregas D y E decidiran si start, review y finish encadenados por el agente
  se registran como `automatico`.

### Revision por pares (ronda 2)

Revisor independiente: **cambios-solicitados**. Confirmo cerrados IMP-1,
IMP-3 y los MENOR de la ronda 1 (con el CLI real y un `codex` falso: tras
cada `codex-review` el flujo se para en una persona; la guarda de `pausa` en
los cuatro estados). Hallazgos nuevos:

- IMP-4 (corregido): `dentroDeBloque` cerraba un bloque con cualquier valla
  del mismo caracter, asi que un ```` que envuelve un ejemplo con ``` se
  cerraba en el interior y volvia IMP-2; y una valla sin cerrar se tragaba la
  seccion real (sin modo congelado y seccion duplicada en cada transicion:
  regresion de la correccion de IMP-2). Ahora sigue CommonMark: cierra el
  mismo caracter, longitud igual o mayor, sin texto detras, 0-3 espacios de
  sangria. Una valla sin cerrar NO abre bloque (CommonMark la extenderia al
  final del documento, pero aqui se tragaria el registro). Reproducidos los
  dos casos con el CLI real tras la correccion: modo correcto y una sola
  seccion real.
- MEN-9 (corregido): tests para el ultimo encabezado, el fin de seccion con
  un `## X` dentro de un bloque, la fila nueva fuera del bloque, `~~~`, el
  cierre mas corto o con texto, la sangria de 4 espacios y la valla sin
  cerrar. Los 7 mutantes, muertos.
- MEN-10 (corregido): docstrings de `SiguientePaso.comando` y `accionPara`,
  y el motivo de `veredicto-codex` con un veredicto desconocido.

Suite: 1015 tests, 1012 en verde (los 3 rojos conocidos de Windows).

### Revision por pares (ronda 3)

Revisor independiente: **aprobada-con-correcciones**. IMP-4 cerrado con el
CLI real en siete escenarios de vallas (anidadas, sin cerrar, con info,
`~~~`, sangradas) y contra los 59 `tarea.md` del repo (0 vallas sin cerrar).

- MEN-11 (corregido): tres reglas de vallas sin test (cierre sangrado 4
  espacios, ``` en mitad del texto, seguir buscando tras una valla sin
  cerrar). Tres tests nuevos; sus cuatro mutantes mueren.
- MEN-12 (aceptado, documentado en `dentroDeBloque`): si la valla sin cerrar
  es justo la que envuelve un ejemplo del registro, el ejemplo cuenta como
  registro. Ninguna regla salva a la vez ese caso y el del ``` olvidado; se
  protege el registro real.

Suite final: 1018 tests, 1015 en verde (los 3 rojos conocidos de Windows).
