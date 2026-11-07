# Plan — TASK-087: taskctl doctor avisa si el plugin instalado esta desactualizado

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta.
Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,
el plan senala lo que ese rol no cubrio.)

## Enfoque propuesto

Una comprobación nueva de doctor, `version-plugin`, hecha igual que `hooks-subagente` (TASK-076), el precedente más cercano: también lee el directorio de configuración de Claude Code y también es «de terceros, como mucho aviso». Tres capas:

1. **Sonda de disco nueva: `src/fs/sonda-version-plugin.ts`**, con `sondearVersionPlugin(configDir: string, repoCwd: string): SondeoVersionPlugin`. Nunca lanza. Devuelve una unión discriminada: `{ estado: 'comparable', instalada, disponible, marketplace, clavePlugin, rutaDisponible, marketplaceActualizadoEn }` o `{ estado: 'no-comprobable', motivo }`. Lee solo:
   - `<config>/plugins/installed_plugins.json`: la clave `taskcode-plugin@<marketplace>` en `plugins`. Filtra la entrada que aplica igual que la sonda de hooks (la de usuario, o la que tenga `projectPath` igual a `repoCwd`). Toma su `version`.
   - `<config>/plugins/known_marketplaces.json`: `<marketplace>.installLocation` (y `lastUpdated`). Si falta, `<config>/plugins/marketplaces/<marketplace>`.
   - `<installLocation>/.claude-plugin/marketplace.json`: la entrada `plugins[]` con `name === 'taskcode-plugin'`. Si su `source` es ruta relativa, manda el `version` de `<installLocation>/<source>/.claude-plugin/plugin.json`. Si es remoto (objeto github/url), solo vale el `version` de la entrada.
   - Comprobado en esta máquina: `installed_plugins.json` es `{version:2, plugins:{ "taskcode-plugin@taskcode-marketplace": [{scope:"user", installPath, version:"0.11.0", ...}] }}`; `known_marketplaces.json` trae `installLocation` y `lastUpdated`; el clon tiene `marketplace.json` en 0.11.0 con `source: "./taskcode-marketplace/plugins/taskcode-plugin"` y su `plugin.json` en 0.11.0. Hay versiones no semver en otros plugins (un SHA como `"0412be76f50a"`).
2. **Comparación pura reutilizada.** `compararVersiones` ya existe en `src/core/versiones-metricas.ts:80` y ordena por semver (0.9.0 < 0.10.0). Se mueve a `src/core/version.ts`, junto a `VERSION_TASKCTL`, y se reexporta desde `versiones-metricas.ts` (no cambia ningún import). Guarda nueva `esVersionSemver`: si alguna versión no cumple `VERSION_PARTES_RE`, «no comprobable» (si no, `compararVersiones` manda las no-versiones al final y daría un aviso falso).
3. **La comprobación en `src/commands/doctor.ts`**: `export function comprobarVersionPlugin(deps: DoctorCommandDeps): Comprobacion`, con `deps.configClaudeDir ?? directorioConfigClaude()`. Se registra en `runDoctorCommand` junto a `hooks-subagente`, con `envolver('version-plugin', ...)`. Clasificación:
   - disponible > instalada → `aviso`: «plugin instalado X, disponible Y en la copia local del marketplace <m> (actualizada el <lastUpdated>)». El arreglo da los comandos de actualización (ver decisiones).
   - iguales → `ok`.
   - instalada > disponible → `ok`, con nota de que la copia local es más vieja que lo instalado.
   - plugin no instalado por Claude Code, marketplace ausente, JSON ilegible o versión no semver → `omitida`, «no se pudo comprobar: <motivo>» (precedente de `comprobarVerificacion`).
   - **Nunca `error`.** `codigoSalida` (`src/core/doctor.ts:45`) solo cuenta `error`, así que el código de salida no cambia. **Ojo:** `envolver` convierte una excepción en `error`; por eso la sonda no lanza nunca (todas las lecturas por un `leerJson` que devuelve ausente/ok/ilegible) y `comprobarVersionPlugin` lleva además su propio try/catch que degrada a `omitida`.
4. **Sin red, por diseño.** Solo el clon local del marketplace; nada de `git fetch` ni HTTP. «Sin red no falla» se cumple porque no hay red que pueda fallar. El precio: «disponible» es lo último que Claude Code descargó al clon (ver riesgos).
5. **Helpers compartidos.** `leerJson`, `esObjeto` y `mismaRuta` son privados en `src/fs/sondas-hooks-claude.ts`; se sacan a `src/fs/json-claude.ts` y las dos sondas los importan.
6. **Nombre del plugin.** Constante `NOMBRE_PLUGIN = 'taskcode-plugin'` en `src/core/version.ts`. El nombre del marketplace no se fija: sale del sufijo de la clave `taskcode-plugin@*`. `src/` no es contenido expuesto a Claude Code; confirmarlo con el test que vigila esa regla.

**Orden de construcción** (cada paso deja la suite en verde):
1. Mover `compararVersiones` a `core/version.ts` (con reexport) y añadir `esVersionSemver`. Sin cambio de comportamiento.
2. Extraer `fs/json-claude.ts` y que `sondas-hooks-claude.ts` lo use. Los tests de hooks siguen pasando tal cual.
3. Crear `fs/sonda-version-plugin.ts` con sus tests sobre directorios temporales.
4. Añadir `comprobarVersionPlugin` y registrarla en `runDoctorCommand`. Tests de doctor.
5. Documentación: la línea de doctor en la ayuda de `src/cli.ts` y la lista de comprobaciones de doctor en el README del plugin.

**Alternativas descartadas:**
- Comparar `VERSION_TASKCTL` (el binario que corre) con el marketplace: cuando taskctl corre desde el repo en desarrollo, su versión no es la que tiene instalada Claude Code, y el aviso tiene que encajar con `claude plugin update`, que actúa sobre la instalación.
- Consultar el remoto (fetch o API de GitHub): mete red, timeout y un nivel «no verificable», y contradice que doctor solo salga a la red para la sesión de plataforma (decisión de TASK-062).

## Lo que el rol no cubrio

Planificación con un solo rol (arquitectura). Sin revisar:
- **Riesgos y modos de fallo:** ficheros corruptos o parciales, rutas con mayúsculas en Windows, varias entradas para el mismo plugin, `installed_plugins.json` con `version` distinto de 2. Se tratan genéricamente como «no comprobable».
- **Pruebas:** el plan de abajo es el mínimo de arquitectura, no una estrategia de cobertura.
- **Dominio:** redacción exacta del mensaje.
- Contraste con los criterios:
  - Criterio 1 (aviso con las dos versiones y los comandos): cubierto; comandos verificados por quien orquesta (ver decisiones).
  - Criterio 2 (sin marketplace o sin red): `omitida`; sin red no hay nada que falle.
  - Criterio 3 (no cambia el código de salida, con tests): por diseño, con la condición de que la sonda no lance.
  - Criterio 4 (suite en verde): no se ha ejecutado nada en esta fase.

## Riesgos aceptados y que los contiene

- **La copia local puede estar desfasada** respecto al remoto: doctor diría `ok` sin serlo. Se acepta (precio de no usar red). Lo contiene que el mensaje diga siempre de qué copia se trata y su fecha `lastUpdated`, y que el arreglo empiece por actualizar el marketplace.
- **El formato de los ficheros de Claude Code es interno y puede cambiar.** Cualquier forma no reconocida acaba en `omitida` con motivo, nunca en `error` (misma política que `sondas-hooks-claude.ts`).
- **Una excepción dentro de `envolver` subiría el código de salida a 1.** Lo contienen la sonda sin throw, el try/catch propio y un test con JSON roto que comprueba `codigo === 0`.
- **El test de contenido expuesto** (no mencionar TaskCode) podría aplicarse a `src/`. Verificarlo al implementar; si salta, la constante se lee del `plugin.json` propio.
- **Tests de doctor existentes** ya pasan `configClaudeDir: SIN_CONFIG_CLAUDE` (`test/commands/doctor.test.ts:48`, `doctor-correcciones.test.ts`, `doctor-hooks-subagente.test.ts`): la comprobación nueva sale `omitida` en ellos y no lee el `~/.claude` real. Ningún test fija la lista ni el número de comprobaciones.

## Plan de pruebas

`test/fs/sonda-version-plugin.test.ts` para la sonda y `test/commands/doctor-version-plugin.test.ts` para la comprobación. Cada caso monta un `configClaudeDir` temporal con `installed_plugins.json`, `known_marketplaces.json` y un clon de marketplace con `marketplace.json` y `plugin.json` reales. Sin mocks.
- Instalada 0.8.0, disponible 0.10.0 → `aviso`; el mensaje contiene las dos versiones y el arreglo los comandos. Orden semver, no por texto.
- Iguales → `ok`. Instalada mayor que disponible → `ok` con nota.
- Sin `installed_plugins.json`, sin la clave del plugin, sin el clon, con JSON roto o con versión no semver (un SHA) → `omitida` con «no se pudo comprobar».
- `plugin.json` del source relativo distinto de la entrada de `marketplace.json` → manda `plugin.json`.
- Entrada de proyecto con otro `projectPath` → se ignora.
- `runDoctorCommand(...).codigo` igual con y sin la comprobación (0 con el repo sano), incluidos el caso del aviso y el del JSON roto. Un caso por proceso real (`spawnSync` con `CLAUDE_CONFIG_DIR`, como `doctor-hooks-subagente.test.ts:237`) que comprueba código de salida y `--json`.
- Regresión: tests de hooks sin tocar tras extraer `json-claude.ts`.
- `npm test` completo, aceptando solo los tres rojos conocidos de Windows.

## Lo que necesita decision de una persona

1. **¿Basta el marketplace local?** Propuesta: sí, sin red, con la fecha de la copia en el mensaje.
2. **Nivel cuando no se puede comprobar:** propuesta `omitida`; instalada > disponible → `ok` con nota.
3. **Comandos del arreglo** — verificados contra Claude Code 2.1.319 (`claude plugin --help`): `claude plugin marketplace update <marketplace>`, luego `claude plugin update taskcode-plugin@<marketplace>`, y reiniciar Claude Code («restart required to apply»). Dentro de una sesión, los equivalentes `/plugin marketplace update` y `/plugin update`.
4. **Extraer `leerJson`/`esObjeto`/`mismaRuta` a `fs/json-claude.ts`** (toca código de TASK-076) frente a copiarlos. Propuesta: extraer.
5. **Mover `compararVersiones` a `core/version.ts`** con reexport. Propuesta: mover.

Este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

### Decisiones de la persona (2026-11-07)

1. Solo el clon local del marketplace, sin red.
2. `omitida` cuando no se puede comprobar; instalada > disponible → `ok` con nota.
3. Comandos del arreglo: los verificados arriba.
4. y 5. Sí: extraer `fs/json-claude.ts` y mover `compararVersiones` a `core/version.ts` con reexport.
