# Informe de revision — TASK-123 (ronda 1)

- Commit revisado: a0068d0bb68998b83f145ec900f544b8286f7b65
- Revisor: code-quality-reviewer (agente revisor independiente, general-purpose, modelo sonnet; modo rapido)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-123 aprobada | aprobada-con-correcciones | cambios-solicitados)

Veredicto propuesto por el revisor: aprobada-con-correcciones. Con dos IMPORTANTES abiertos se escribe cambios-solicitados.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | src/hooks/guardia-merge.ts (`motivoDeCierre`, ~l.593) | implementacion |
| IMP-2 | IMPORTANTE | abierto | src/commands/finish-verificacion.ts (`baseAntesDeIntegrar` / `puertaReintento`, ~l.270-307) | implementacion |
| MEN-1 | MENOR | abierto | src/core/comando-merge.ts (`cierresDeMerge`, ~l.458) | implementacion |
| MEN-2 | MENOR | abierto | src/hooks/guardia-merge.ts (`decidirCierreDeMerge`) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Resultado de la puerta y de la reproduccion

Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-123-r1`, rama de la tarea, `npm install` + `npm run build` en verde. Modo rapido, sin suite completa:

- `npm run test:rapido`: 748 pasan, 0 fallan.
- Tests afectados (`finish-reintento`, `finish-verificacion`, `verificacion-selectiva`, `test/hooks/*`, `verificar-impacto`): 142 pasan, 0 fallan.
- `RAMA_BASE=develop node scripts/verificar-impacto.mjs` desde Git Bash: 853 pasan, 0 fallan, salida 0.
- SKILL.md: 15359 bytes (limite 15360).

Puntos de atencion:

1. Caso A (`git merge --no-ff` a mano con la verificacion en rojo): `finish` ya no cierra, vuelve a la rama de partida y dice el remedio. Caso B: el guardian bloquea el commit de resolucion en develop; si se cierra igual, el reintento verifica y aborta en rojo. Fast-forward y dos merges seguidos: el reintento aborta en rojo. Con `MERGE_HEAD` en develop el hook bloquea `git commit`, `git commit -am`, `git commit -C HEAD`, `git -c core.editor=true commit`, `git -C . commit`, `cd . && git commit`, `sh -c "git commit ..."`, `echo x | git commit -F -` y `git merge --continue`. Huecos: MEN-1 y MEN-2; cherry-pick no cierra `MERGE_HEAD` y ya era hueco previo.
2. Un `git commit` normal no se bloquea (sin `MERGE_HEAD`, o con `MERGE_HEAD` en una rama de tarea), salvo IMP-1.
3. Base de la proporcional: correcta (primer commit de primeros padres que no desciende de la rama; null en fast-forward), pero sin test que la discrimine: IMP-2.
4. `--sin-verificacion`: cierra sin ejecutar y anota en `## Verificacion omitida`.
5. Textos: remedio correcto; `finish.ts` usa `base = main` para un hotfix; SKILL.md en el limite; los textos instalables pasan su suite.
6. `verificar-impacto.mjs`: `delete env.RAMA_BASE` correcto; el mutante que lo quita pone en rojo su test.

Mutantes sobre `dist`: M1 quitar `delete env.RAMA_BASE`, M2 guardian que ignora el cierre de merge, M3 no anotar la omision, M4 bloquear sin `MERGE_HEAD`, M5 bloquear ramas de tarea, M6 no volver a la rama de partida tras rojo: detectados. M7 `base = null` siempre en el reintento: sobrevive (IMP-2).

## Detalle y reproduccion

### IMP-1 — El guardian bloquea el commit de un merge conflictivo de `origin/<develop>` hacia develop, y el remedio no encaja

`motivoDeCierre` solo exime si `MERGE_HEAD` es ancestro de `HEAD`; el guardian original (`motivoDeBloqueo`) tambien exime lo que ya es ancestro de la principal o de `origin/<destino>`. Asi el `git merge origin/develop` (o `git pull`) con conflicto en develop pasa, pero el `git commit` que lo cierra se bloquea. Reproduccion: repo con `comando_verificacion` y remoto; commit local en develop sobre `comun.txt` y otro distinto empujado a `origin/develop` desde otro clon; `git fetch && git merge origin/develop` choca; `decidirPreToolUse` sobre `git merge origin/develop` da 0, sobre `git commit --no-edit` o `git merge --continue` da 2 con el remedio de tarea, que aqui no aplica. Caso real: CLAUDE.md permite commitear documentacion suelta en develop y sincronizar puede chocar. Arreglo: aplicar en `motivoDeCierre` la misma exencion (ancestro de la principal o de `origin/<rama>`), o un texto que cubra el caso.

### IMP-2 — La decision proporcional del reintento (`baseAntesDeIntegrar`) no tiene ningun test que la discrimine

CHANGELOG, README y el docblock prometen la misma decision proporcional (documentacion, selectiva o completa sobre lo que entro con la tarea), pero forzar `base = null` (siempre completa) deja en verde `finish-reintento`, `finish-verificacion` y `verificacion-selectiva`. Ningun test comprueba que el reintento elige la selectiva o la de documentacion ni la base con merge unico, varios merges o fast-forward. El fallback es conservador; el riesgo es perder la proporcionalidad en silencio. Arreglo: un test con cambio de solo documentacion o de rutas parciales, con merge a mano, que compruebe que corre el comando de documentacion o el selectivo; y otro con varios merges posteriores.

### MEN-1 — `cd <otro-repo> && git commit` esquiva el guardian

`cierresDeMerge` solo respeta `-C <dir>`. Con el cwd del hook en otro repo, `cd ../work && git commit --no-edit`, `cd ../work; git commit ...`, `git --git-dir=../work/.git commit` y `git --git-dir=... --work-tree=... commit` dan 0; `-C /c/...` estilo POSIX de Git Bash se resuelve mal con `path.resolve` en Windows. Mismo hueco que el guardian de merges previo con `cd`; si es consciente, anotarlo en el README.

### MEN-2 — Alias de git fuera del analisis

`git ci --no-edit` (alias de `commit`) da 0 con `MERGE_HEAD` en develop. Hueco inherente al analisis sintactico; basta dejarlo escrito junto a lo que el guardian no cubre.

## Lecturas fuera del contexto permitido

- `src/hooks/guardia-merge.ts` completo (`decidirPreToolUse`, `integraciones`, `motivoDeBloqueo`): para comparar las exenciones del guardian original con las de `motivoDeCierre` (IMP-1).
- `src/commands/finish.ts` lineas 520-560 y `src/core/transiciones.ts` (`anotarVerificacionOmitida`): camino de `--sin-verificacion`.
- `test/helpers/finish-fixtures.ts` y `src/core/config.ts`: para montar los casos y los mutantes.
