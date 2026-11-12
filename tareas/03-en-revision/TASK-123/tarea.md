---
id: TASK-123
titulo: "F-16: finish no cierra sin verificar tras un merge a mano o un conflicto"
tipo: fix
sprint: 0
etiquetas: [verificacion, critico, urgente, v0.16]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-123-f-16-finish-no-cierra-sin-verificar-tras
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 24932538
tokens_revision: 3791891
creado: 2026-11-12
actualizado: 2026-11-12
dependencias: []
---
## Objetivo

Hallazgo CRITICO de la auditoria del 2026-11-12, reproducido de punta a punta (docs/auditoria/AUDITORIA-METODO-2026-11-12.md, seccion 11): la via de reintento de finish (rama ya integrada en la de integracion) no ejecuta la puerta de verificacion, y el guardian de merges no ve el git commit que cierra un merge en curso. Caso A: merge a mano en develop con la verificacion en rojo y luego taskctl finish: cierra sin verificar. Caso B, el remedio que documenta la guia tras un conflicto: el guardian deja pasar el commit que cierra el merge y el reintento de finish cierra sin volver a verificar la resolucion. El metodo promete no integrar codigo sin verificacion en verde. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12), en modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.

## Criterios de aceptacion
- [x] Tras un merge a mano en develop con la verificacion en rojo, taskctl finish no cierra la tarea: verifica el arbol de la rama de integracion o aborta diciendo que falta (test con repo temporal, caso A)
- [x] Tras un conflicto en finish resuelto en develop, el reintento verifica la resolucion antes de cerrar o aborta (test con repo temporal, caso B)
- [x] El guardian de merges trata como merge un git commit con MERGE_HEAD presente sobre la rama de integracion o la principal, con los tres comandos del caso B (test)
- [x] La guia y los mensajes de finish proponen como remedio taskctl abort-merge, integrar la base en la rama de la tarea y relanzar finish desde ella (test sobre el texto)
- [x] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

## Resultado

- **F-16 cerrado** (hallazgo CRITICO de la auditoria del 2026-11-12): la via de reintento de `finish` verifica el arbol de la rama de integracion antes de cerrar, con la misma decision proporcional (documentacion, selectiva o completa desde la base anterior al merge de la tarea) y el memo del mismo arbol; en rojo aborta sin mover la tarea y vuelve a la rama de partida; `--sin-verificacion` la salta y lo anota (20fc949). El guardian bloquea el `git commit` (y `git merge --continue`) que cierra un merge en curso sobre la rama de integracion o la principal, salvo que lo que entra ya este integrado en ella, en la principal o en `origin/<rama>` (9ac4cab, cef4f8c). Mensajes, guia y README proponen el remedio seguro: `taskctl abort-merge`, integrar la base en la rama de la tarea y relanzar `finish` desde ella (6b878a8).
- Los dos casos reproducidos en la auditoria (merge a mano con la verificacion en rojo; conflicto resuelto en develop) son tests de regresion en `test/commands/finish-reintento.test.ts`.
- **Arreglo de TASK-122 encontrado aqui**: `scripts/verificar-impacto.mjs` dejaba pasar `RAMA_BASE` a los tests que lanza; el freno siempre la pasa y un test cambiaba de comportamiento (5534695, con su test).
- **Revision por pares, ronda 1** (code-quality-reviewer, modo rapido): veredicto propuesto aprobada-con-correcciones. Comprobo los casos A y B, fast-forward, varios merges y nueve formas de escribir el commit. Corregidos: IMP-1 (sincronizar develop con origin con conflicto ya no se bloquea) e IMP-2 (tests de la decision proporcional del reintento y su base; el mutante `base = null` los pone en rojo). Aceptados: MEN-1 (`cd <otro repo> && git commit`, `--git-dir`) y MEN-2 (alias de git): huecos del analisis sintactico, iguales a los del guardian previo, documentados en el README.
- **Cierre sin ronda 2: decision de Carlos (modo rapido)**. El coordinador comprobo los 4 tests nuevos (4/4). `verificar-impacto` en verde (867/867).
- **Cierre con `--sin-verificacion`**: el diff toca `scripts/verificar-impacto.mjs`, fuera de `rutas_verificacion_parcial`, lo que fuerza la completa (unos 25 min); decision de Carlos para las tareas urgentes. La completa se corre una vez antes de publicar.

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-12T16:30:50Z | plan | automatico | persona | 0.14.0 |
| 2026-11-12T16:31:27Z | approve | automatico | persona | 0.14.0 |
| 2026-11-12T16:31:28Z | start | automatico | persona | 0.14.0 |
| 2026-11-12T17:11:49Z | review | automatico | persona | 0.14.0 |

## Autorrevision

- code-quality-reviewer — 5534695

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-12T17:11:49Z | implementacion | sesion:b6ee363f-d9c2-4a11-8e6e-4c193af66eed | 42 | 26613 | 11656137 | 11966 | 6 | 11694758 | - | - |
| 2026-11-12T17:11:49Z | implementacion | agente:aaa77dde16d5ea9cb | 154 | 176665 | 13001627 | 59334 | 3 | 13237780 | - | - |
| 2026-11-12T17:28:04Z | revision | agente:ac3544939f545f881 | 58 | 147026 | 3623329 | 21478 | 4 | 3791891 | 1 | - |
