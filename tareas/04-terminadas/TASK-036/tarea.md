---
id: TASK-036
titulo: "F1-T3 Veredicto con un comando e informe estructurado"
tipo: feature
sprint: 2
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-036-f1-t3-veredicto-con-un-comando-e-informe
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

Quitar la friccion del veredicto y dejar el informe de revision legible por
una maquina (auditoria del 2026-10-03, A5 y A6). Hoy el revisor escribe la
linea `- Veredicto:` a mano, en su propio vocabulario (`**APROBADO CON
CAMBIOS**`, `**cambios-solicitados**`), y eso obliga a commits de
normalizacion; TASK-017 llego a cerrarse con un veredicto que el propio gate
rechaza. El comando `taskctl veredicto` escribe la linea canonica y la
commitea; el parser de `finish` tolera el enfasis de markdown sin aflojar la
regla («no aprobada» sigue fallando); y el scaffold del informe trae la tabla
de hallazgos que usara la ronda incremental (TASK-040).

Fuera de alcance: leer la tabla para generar la ronda 2 (TASK-040).

## Criterios de aceptacion
- [x] `taskctl veredicto TASK-NNN aprobada|aprobada-con-correcciones|cambios-solicitados` sustituye la linea del informe de mayor N
- [x] El scaffold de `informe-revision-N.md` trae la tabla `| ID | Severidad | Estado | Fichero |`
- [x] El parser de `finish` acepta `**aprobada**`; `no aprobada` sigue fallando, con test
- [x] Test del comando contra un repo real

## Resultado

**Implementado.** `taskctl veredicto TASK-NNN <aprobada|aprobada-con-correcciones|cambios-solicitados> [--informe <nombre>] [--push]`
(`src/commands/veredicto.ts`): sustituye todas las lineas `- Veredicto:` del
informe de la ultima ronda por una canonica en la posicion de la primera,
conserva CRLF y commitea `chore(TASK-NNN): veredicto ronda N (<valor>)`; en
una ronda fragmentada exige `--informe`. Accion `veredicto` en la maquina de
estados, solo en `en-revision`. `veredictoAprobado` recorta `*`, `_` y comillas
invertidas antes de `^aprobada`. El scaffold del informe trae la tabla
`| ID | Severidad | Estado | Fichero |` y remite al comando. Un unico helper,
`informesDeUltimaRonda` en `fs/rondas.ts`, junto con `INFORME_REVISION_RE`: se
borran las copias de `finish.ts` y `codex-review.ts`.

**Desviaciones del plan, menores:** la regex vive en `fs/rondas.ts` y no en
`review.ts`, para no crear un ciclo de imports entre `finish` y `review`; y
`codexInformeTemplate` no se toca, porque `veredicto` no cubre los informes de
Codex (decidido sin `--codex`) y remitir alli al comando seria falso.

**Pruebas.** 7 tests nuevos (`test/commands/veredicto.test.ts`); con los de
`finish`, `codex-review`, la maquina de estados y `main`, 76/76. Contraprueba
con 3 mutantes, los 3 en rojo: sin el recorte del enfasis, dejando las lineas
duplicadas y sin la guarda de estado. La skill documenta el comando y el gate.

**Revision ronda 1: aprobada con correcciones** (0 criticos, 0 importantes, 3
menores; suite completa 905 tests, solo los 3 rojos conocidos de Windows; 4 de
5 mutantes en rojo; test diferencial de `informesDeUltimaRonda` contra la
implementacion anterior sobre 300 directorios aleatorios, 0 diferencias). El
revisor escribio su veredicto con el propio `taskctl veredicto`: funciono a la
primera (`52463f5`). Por A3, sin ronda 2. Corregidos en el cierre:
- MEN-1: `valor in VEREDICTOS` aceptaba claves heredadas (`toString`,
  `__proto__`) y commiteaba una linea absurda; ahora `Object.hasOwn`, con test.
- MEN-3: la guarda de `--informe` con un nombre que no es de la ronda (o con
  `..`) no tenia test; ahora si.
Sin corregir, documentado: MEN-2, `sustituirVeredicto` quita tambien lineas
`- Veredicto:` citadas dentro de un bloque de codigo. Es coherente con el gate
de `finish`, que tambien las cuenta: respetar los bloques en un sitio y no en
el otro abriria la divergencia que esta tarea cierra.
