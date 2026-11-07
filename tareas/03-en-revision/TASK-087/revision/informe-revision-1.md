# Informe de revision — TASK-087 (ronda 1)

- Commit revisado: a68f7812ac2e3d0bfbda69eeb38dcb26c7b7f708
- Revisor: agente general-purpose (sonnet) con skill code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-087 aprobada | aprobada-con-correcciones | cambios-solicitados)

> El revisor propuso `aprobada`. Quien orquesta (modo automatico) pide
> `cambios-solicitados` para corregir MEN-1 y MEN-2 antes del merge: en
> automatico lo mergeado tiene que ser lo revisado. MEN-3 se acepta.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/fs/sonda-version-plugin.ts | implementacion |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/fs/sonda-version-plugin.ts | plan |
| MEN-3 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/test/fs/sonda-version-plugin.test.ts | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Reproduccion

**MEN-1 — mensaje que apunta al fichero equivocado cuando plugin.json está roto.**
Con `source: "./p"`, `p/.claude-plugin/plugin.json` ilegible (`{ roto`) y sin `version` en el catálogo, `CLAUDE_CONFIG_DIR=<tmp> node bin/taskctl doctor --json` da:
`omitida | no se pudo comprobar: la copia local del marketplace no declara version (...\marketplaces\mkt\.claude-plugin\marketplace.json)`
El código ignora en silencio el plugin.json roto (`l.estado !== 'ok'`) y culpa a marketplace.json. Sigue siendo `omitida` y sale con 0: solo es un mensaje poco útil. Un plugin.json roto con versión en el catálogo hace fallback al catálogo (0.13.0 → aviso), lo cual es razonable.

**MEN-2 — varios marketplaces con el plugin: gana el primero y no se prueba el resto.**
`installed_plugins.json` con `taskcode-plugin@otro` (sin copia local) antes de `taskcode-plugin@mkt` da `omitida | no existe la copia local del marketplace otro`; el `@mkt` válido ni se mira. Los dos están instalados y aplican: la elección es arbitraria y queda oculta. Caso poco frecuente. Tampoco se distingue entre una entrada de usuario antigua y una de proyecto en la misma clave (`find` devuelve la primera).

**MEN-3 — dos ramas defensivas sin test que las mate.**
El `catch` de `comprobarVersionPlugin` en doctor.ts: sustituirlo por `throw e` deja 12/12 tests en verde. El `try/catch` de `sondearVersionPlugin` tampoco tiene test. Ambas son prácticamente inalcanzables (`leerJson` ya captura todo). Sin consecuencias hoy.

Dos mutantes no se aplicaron (el patrón de sed no casó: «x» y «x2», BOM y condición de `projectPath`); no cuentan como verificados. La rama de `projectPath` sí la cubrió el mutante «sin-projectPath», que murió.

Notas sin severidad:
- Versiones con metadata de build (`0.9.0+abc`) se tratan como no semver → `omitida`. Coherente con `esVersionSemver` y el README.
- Un `source` con `..` solo lee un `plugin.json` fuera de la copia; sin escritura ni salida de contenido, sin riesgo.

## Verificado

- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-087-r1`, checkout del commit, `npm install` y `npm run build` sin errores.
- Tests relevantes (`sonda-version-plugin`, `doctor-version-plugin`, `doctor-hooks-subagente`, `versiones-metricas`): 30/30 en verde. Suite completa no repetida (constaba con solo los 3 rojos conocidos de Windows).
- Mutantes: `d > 0` invertida (murió, 4 rojos); argumentos de `compararVersiones` invertidos (murió, 4); sin validación semver de la disponible (murió, 1); de la instalada (murió, 1); ignorar el plugin.json de fuente relativa (murió, 1); sin filtro `projectPath` en `entradaQueAplica` (murió, 1); sin el `catch` de doctor.ts (sobrevivió, MEN-3).
- CLI real `node bin/taskctl doctor --json` con `CLAUDE_CONFIG_DIR` temporal: BOM + pre-release (`0.12.0-dev` frente a `0.12.0`) → aviso correcto; plugin.json roto con versión en catálogo → fallback, aviso; catálogo con `plugins` objeto → `omitida`; `source` con `..` → `omitida`; `+build` → `omitida`. Ningún caso lanza ni llega a error.
- Carpeta de pruebas borrada; repo original sin tocar.
