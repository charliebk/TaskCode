---
id: TASK-073
titulo: "Tests held-out por tarea"
tipo: feature
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: opus
estado: terminada
plan_aprobado: true
rama: feature/task-073-tests-held-out-por-tarea
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 831501
tokens_implementacion: null
tokens_revision: 13201379
creado: 2026-11-03
actualizado: 2026-11-05
dependencias: [TASK-070, TASK-072]
---
## Objetivo

Freno 7 de brakes: tests de aceptacion que la persona escribe a partir de los criterios y que el agente implementador no puede leer ni editar.

## Criterios de aceptacion
- [x] Carpeta aceptacion/ dentro de la carpeta de la tarea, y clave comando_heldout opcional en config.yml
- [x] taskctl finish ejecuta los held-out de la tarea (HELDOUT_DIR) y aborta si fallan, mostrando solo comando, codigo y duracion
- [x] taskctl finish aborta si aceptacion/ tiene ficheros y no hay comando_heldout, o si su contenido en la rama no coincide con el de rama_base
- [x] aceptacion/ queda siempre fuera del diff de peticion-revision-N.md
- [x] La skill de flujo explica cuando escribirlos (en develop, en el diseño), que el revisor no los lee y que deben quedar fuera de comando_verificacion
- [x] Tests: finish rojo y verde, huella, exclusion del diff, config (deny efectivo en TASK-078)

## Resultado

Primera parte de los tests held-out (la segunda, el hook que impide leerlos, es TASK-078).

Implementado:
- Clave `comando_heldout` en `core/config.ts` (validada como los otros comandos; `timeout_verificacion`
  vale tambien con ella sola). Opcion `env` en `ejecutarAcotado` y `ejecutarVerificacion`.
- `core/heldout.ts`: `CARPETA_HELDOUT`, `VARIABLE_HELDOUT` (`HELDOUT_DIR`), `EXCLUIR_HELDOUT`,
  `carpetasHeldout` (la carpeta de la tarea en cualquier estado) y `variantesHeldout` (otras mayusculas).
- `commands/finish-heldout.ts`: `puertaHeldout`, encadenada en `finish` tras la verificacion y en sus
  mismos caminos. Base = `rama_base`, o la principal en un hotfix (que aborta si sus held-out estan solo
  en la de integracion). Huella por arbol de Git de `aceptacion/` frente a la base, este donde este la
  carpeta; con el merge-base distingue si cambio la base (pide `git merge <base>`) o la rama (da las
  ordenes para restaurarlos en su ruta, y si ademas cambio la base, pide integrarla primero). Comando y
  timeout de la config de la BASE. Aborta sin `comando_heldout`, con `Aceptacion/` mal escrita, fuera
  de la rama de la tarea, en rojo (solo comando, codigo y duracion: nunca la salida) y si dejan el arbol
  sucio. `--sin-verificacion` no la salta.
- `review.ts`: la peticion excluye siempre `tareas/*/TASK-*/aceptacion/**`.
- Skill: parrafo corto en `task-workflow/SKILL.md` y el detalle en `task-workflow/heldout.md` (para no
  pasar del tope de 15 KB de la skill, que el primer intento rompio). README y CHANGELOG.

Decisiones de Carlos en el plan: partir la tarea (deny a TASK-078); held-out commiteados en develop en
el diseno; el revisor no los lee; deny sobre ficheros y Bash (para TASK-078); `HELDOUT_DIR` + huella;
el bloqueo solo en la rama de la tarea (para TASK-078); en rojo, sin salida. Por el orquestador, tras la
revision: la base de un hotfix es la principal (MEN-1) y comando/timeout se leen de la base (MEN-2).

Riesgos aceptados: los held-out quedan en develop y en el historial para siempre; hasta TASK-078 nada
impide al agente leerlos (la huella si impide editarlos); un held-out que la persona añade en una
carpeta nueva tras `start` puede dar `CONFLICT (file location)` al integrar la base (se resuelve con
`git add`); sin merge-base comun el diagnostico es aproximado (caso exotico).

Verificacion:
- Suite completa 1781/1786: los 5 rojos conocidos de Windows.
- `finish-heldout` 21 tests contra repos temporales reales (verde, rojo sin salida, salto, huella al
  editar/borrar/anadir, carpeta movida como `start`, base cambiada, remedio ejecutado tal cual, arbol
  sucio, rama ajena, hotfix, comando de la base, mayusculas, timeout, skill) y `review-exclusion` con
  `excluir_de_revision: []`.

Revision por pares, 3 rondas:
- Ronda 1 (`cambios-solicitados`): IMP-1 (la huella acusaba a la rama cuando cambio la base, y su
  remedio no salia del bucle con la carpeta movida), IMP-2 (dos guardas sin test), MEN-1 (hotfix), MEN-2
  (la rama podia cambiar `comando_heldout`), MEN-3 (`Aceptacion/`), MEN-4 (timeout): corregidos.
- Ronda 2 (`cambios-solicitados`): IMP-3 (con la base del hotfix en main, sus held-out en develop se
  saltaban sin avisar), MEN-1 (test del hotfix no discriminaba), MEN-5 (base y rama cambiadas: conflicto
  en el merge final), MEN-6 (mensaje de la variante): corregidos. Ronda 3 decidida por Carlos.
- Ronda 3 (`aprobada-con-correcciones`): todo verificado siguiendo los mensajes al pie de la letra;
  mutantes muertos. MEN-7 aceptado sin corregir: ningun test comprueba en negativo que el «Ademas ...
  integra primero» falte cuando solo cambio la rama (impacto bajo: pediria un merge que no hace nada);
  corregirlo pedia una cuarta ronda.

Coste de implementacion sin registrar: la hizo el orquestador sin subagentes.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-04T21:44:53Z | plan | automatico | persona |
| 2026-11-04T22:02:54Z | approve | automatico | persona |
| 2026-11-04T22:02:55Z | start | automatico | persona |
| 2026-11-04T22:45:53Z | review | automatico | persona |
| 2026-11-04T23:32:22Z | review | automatico | persona |
| 2026-11-05T00:38:13Z | review | automatico | persona |
| 2026-11-05T12:24:19Z | finish | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-04T22:02:26Z | diseno | agente:a29945e03ddb57af8,a1b0b31a52a58d137,a31c511c3d2e10ad4,ac1fd97824ff336b7 | 68 | 137845 | 648810 | 44778 | 56 | 831501 |
| 2026-11-04T23:08:42Z | revision | agente:a1b61fd69cf020b48 | 80 | 163559 | 5161757 | 30078 | 11 | 5355474 |
| 2026-11-05T00:17:06Z | revision | agente:a54709d93a64184e7 | 98 | 457668 | 5248351 | 28491 | 7 | 5734608 |
| 2026-11-05T12:18:04Z | revision | agente:a70f0106c1a2c14d8 | 38 | 261076 | 1832038 | 18145 | 1 | 2111297 |
