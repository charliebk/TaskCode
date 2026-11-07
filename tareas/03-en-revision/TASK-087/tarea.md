---
id: TASK-087
titulo: "taskctl doctor avisa si el plugin instalado esta desactualizado"
tipo: feature
sprint: 0
etiquetas: [doctor, distribucion]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-087-taskctl-doctor-avisa-si-el-plugin-instal
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 531150
tokens_implementacion: null
tokens_revision: 1690057
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

Un equipo estuvo en 0.8.0 mientras el repo iba por 0.10.0 sin saberlo. doctor compara la version instalada con la del marketplace local y avisa.

## Criterios de aceptacion
- [x] taskctl doctor da un AVISO con la version instalada, la disponible y los comandos de actualizacion cuando la del marketplace es mayor
- [x] Sin marketplace local o sin red no falla: informa de que no pudo comprobarlo
- [x] No cambia el codigo de salida de doctor; lo cubren tests con ficheros de plugins temporales
- [x] npm test en verde (salvo los tres rojos conocidos de Windows)

## Resultado

Comprobacion nueva `version-plugin` en `taskctl doctor`: compara la version del plugin que Claude Code tiene instalada (`installed_plugins.json`, la entrada de usuario o la de este proyecto) con la de la copia local de su marketplace (`known_marketplaces.json` -> `marketplace.json`, y el `plugin.json` si la fuente es relativa). Disponible mayor -> AVISO con las dos versiones, la fecha de la copia y los comandos (`claude plugin marketplace update <m>`, `claude plugin update taskcode-plugin@<m>`, reiniciar), verificados contra Claude Code 2.1.319. Iguales o instalada mayor -> ok. Lo que no se puede comprobar -> `omitida` con el motivo. Nunca error: el codigo de salida no cambia (sonda sin throw y try/catch propio, porque `envolver` convierte una excepcion en error).

Ficheros: `src/fs/sonda-version-plugin.ts` (nuevo), `src/fs/json-claude.ts` (nuevo: `leerJson`, `esObjeto`, `mismaRuta`, `entradaQueAplica`, extraidos de la sonda de hooks), `compararVersiones` movida a `src/core/version.ts` con `esVersionSemver` y `NOMBRE_PLUGIN` (reexport en `versiones-metricas.ts`), `comprobarVersionPlugin` en `src/commands/doctor.ts`, ayuda de `cli.ts` y README. Tests: `test/fs/sonda-version-plugin.test.ts` y `test/commands/doctor-version-plugin.test.ts` (directorios de plugins temporales reales, uno por proceso con `CLAUDE_CONFIG_DIR`). Probado contra la instalacion real: `ok`, 0.11.0 al dia.

**Decisiones de la persona (en plan)**: solo la copia local del marketplace, sin red; `omitida` cuando no se puede comprobar; extraer `json-claude.ts` y mover `compararVersiones`.

**Suite**: 2024 tests en la ronda 1 con solo los tres rojos conocidos de Windows. Tras la correccion, 2026 con esos tres mas dos intermitentes por carga (`git --version` ETIMEDOUT en doctor-version-plugin, y doctor-deploy-config), que pasan aislados dos veces seguidas.

**Revision**

- Ronda 1 (code-quality-reviewer, sonnet): aprobada por el revisor, sin CRITICO ni IMPORTANTE; 7 mutantes, 6 muertos. MEN-1: con `plugin.json` roto y catalogo sin version, el motivo culpaba a `marketplace.json`. MEN-2: con el plugin instalado desde varios marketplaces ganaba el primero aunque no se pudiera comparar. MEN-3 (aceptado): los dos try/catch defensivos no tienen test que los mate; son inalcanzables hoy porque `leerJson` ya captura todo. Se pidio `cambios-solicitados` para MEN-1 y MEN-2 (en automatico lo mergeado tiene que ser lo revisado).
- Correccion 1eefd54: vale el primer marketplace comparable y, si ninguno, se juntan todos los motivos; el `plugin.json` ilegible se nombra. Ronda 2 (sonnet, acotada): aprobada, sin hallazgos nuevos; 5 mutantes, 4 muertos (el superviviente quita solo la causa del mensaje, irrelevante).

**A vigilar**: sin red, si Claude Code no ha refrescado la copia local doctor dice `ok` sin serlo (el mensaje lleva la fecha de la copia). Las versiones con metadata de build (`0.9.0+abc`) no son semver para `esVersionSemver` y dan `omitida`.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T16:26:24Z | plan | automatico | persona |
| 2026-11-07T16:48:32Z | approve | automatico | persona |
| 2026-11-07T16:48:47Z | start | automatico | persona |
| 2026-11-07T17:11:35Z | review | automatico | persona |
| 2026-11-07T17:37:44Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-07T16:32:39Z | diseno | agente:ac40879d5137660c8 | 24 | 62094 | 457695 | 11337 | 22 | 531150 |
| 2026-11-07T17:18:07Z | revision | agente:aeaea94fe71251e2b | 12 | 111995 | 507942 | 5808 | 1 | 625757 |
| 2026-11-07T17:42:21Z | revision | agente:abaaaf40e75fe993c | 22 | 102097 | 956062 | 6119 | 2 | 1064300 |
