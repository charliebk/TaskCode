# Informe de revision — TASK-087 (ronda 2)

- Commit revisado: 1eefd549b205f3f22ddb40d3ef069a6a0c1fadf1
- Revisor: agente general-purpose (sonnet) con skill code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-087 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/fs/sonda-version-plugin.ts | implementacion |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/fs/sonda-version-plugin.ts | plan |

(MEN-3 de la ronda 1 sigue aceptado; no se reabre.)

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Reproduccion

Sin hallazgos nuevos.

**MEN-1 (corregido).** `CLAUDE_CONFIG_DIR=<tmp> node bin/taskctl doctor --json` con `source: "./p"`, `p/.claude-plugin/plugin.json` ilegible (`{ roto`) y catálogo con `version: 7` da ahora:
`no se pudo comprobar: la copia local del marketplace mkt no declara version (...\mkt\.claude-plugin\marketplace.json; ...\mkt\p\.claude-plugin\plugin.json ilegible: Expected property name or '}'...)`.
Nombra el `plugin.json` roto y su causa. Con versión válida en el catálogo sigue haciendo fallback y comparando (segundo caso del test nuevo).

**MEN-2 (corregido).** `installed_plugins.json` con `taskcode-plugin@otro` (sin copia local) antes de `@mkt` (válido, catálogo 0.13.0) da `plugin instalado 0.8.0, disponible 0.13.0 en la copia local del marketplace mkt`: ya no gana el primero. Si ninguno es comparable (`@otro` sin copia y `@t` con versión `abc`) el motivo junta los dos: `no existe la copia local del marketplace otro (...); la version instalada desde t no es semver (abc)`. Ambos por la entrada real del CLI, sin lanzar.

La corrección no abre otro fallo: con una sola entrada y con ninguna aplicable (`motivos.length === 0`) el mensaje sigue siendo «no esta instalado ... para este proyecto». El texto cambiado («instalada desde X no es semver») está actualizado en el test y su aserción sigue discriminando.

## Verificado

- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-087-r2`, checkout del commit, `npm install` y `npm run build` sin errores.
- `node --test` sobre sonda-version-plugin, doctor-version-plugin y doctor-hooks-subagente: 28/28 en verde. Suite completa no repetida.
- Mutantes: volver a «gana el primero» (murió, 1 rojo); quitar el motivo del plugin.json ilegible (murió, 1); solo el primer motivo (murió, 1); quitar el marketplace del mensaje no semver (murió, 2); quitar solo la causa (`: ${l.motivo}`) del mensaje del plugin.json (sobrevivió; irrelevante: el test exige que se nombre el fichero).
- Una prueba inicial por CLI falló por el montaje del revisor (faltaba `installPath`, que `entradaQueAplica` exige), no por el código; repetida con el montaje correcto.
- Carpeta de pruebas y temporales borrados; repo original sin tocar.
