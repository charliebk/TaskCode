# Brainstorm — TASK-050, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura

## Enfoque propuesto, con rutas y nombres concretos

- **Helper nuevo, el primero compartido de la suite:** `test/helpers/repo-plantilla.ts`
  (hoy no hay ninguna funcion exportada en `test/`, comprobado con grep de
  `^export function`). Firma propuesta:
  `plantillaRepo(prefijo, preparar: (dir) => Promise<void>): (fn: (repoRoot) => Promise<void>) => Promise<void>`.
  - `preparar` es la receta de cada fichero; se ejecuta una sola vez y se
    guarda como promesa en la closure.
  - En cada test: `mkdtemp` + `cp(plantilla, destino, { recursive: true })`, y
    `rm` al final. La plantilla se borra en un `after()` que registra el helper.
  - «Una vez por fichero» sale gratis: `node --test` ejecuta cada fichero en su
    propio proceso, basta un estado de modulo.
- **El helper no unifica la receta.** `start`, `review` y `finish` crean `main`,
  `.gitignore` con `logs/`, README, commit `inicial` y `develop`
  (`start.test.ts:86-106`, `review.test.ts:69-84`); `wrappers.test.ts:96-109`
  no tiene `develop` ni `.gitignore`; `sincronizacion.test.ts:110-144` anade
  `core.autocrlf false`, una tarea, `scripts/sync.mjs`, config y un `node`.
- **Candidatos** (auditoria B3/B5 y numero de tests que montan repo):
  `start` (40), `finish` (20), `review` (19), `sincronizacion` (16),
  `wrappers` (20).
- **`test:rapido`:** `npm run build && node --test "dist/test/core/**/*.test.js" "dist/test/cli/**/*.test.js"`,
  con comillas como `test`.
- **En `core/` y `cli/` lanzan procesos solo tres ficheros:**
  `core/config.test.ts` (`spawnSync('git')` l. 33, 170, 187; repo l. 41),
  `cli/main.test.ts` (repo l. 36), `cli/flags-desconocidos.test.ts` (repo l. 83).
  Propuesta: moverlos a un `test/integracion/` a la misma profundidad, para que
  el glob de `npm test` los siga cogiendo.
- **Cobertura:** medir `npm test` contra `node --test "dist/test/**/*.test.js"`
  sin cobertura; si compensa, `test` pierde el flag y nace `test:cov`.

## Que se extiende y que se crea

- Se crea `test/helpers/repo-plantilla.ts`. El patron `withTempRepo` esta
  copiado en 31 ficheros.
- Se extienden las `withTempRepo`/`withRepoSincronizado` de los 5 ficheros:
  su cuerpo pasa a ser una receta y su firma no cambia.
- Se extiende `package.json` con `test:rapido` (y `test:cov` si compensa).
- Se crea `test/integracion/` (o se parten los ficheros): `node --test` no
  excluye por ruta (`--test-skip-pattern` filtra por nombre; sin verificar).
- Los otros 26 ficheros con el patron no se tocan en esta tarea.

## Limites que cruza

- Contrato de `npm test`: `.github/workflows/ci.yml` (l. 24 y 160) lo invoca.
  Quitarle la cobertura cambia lo que el CI informa.
- Documentacion que nombra el comando: `CLAUDE.md`, `docs/contexto/`, cifras
  de la auditoria.
- Empaquetado: el helper compila a `dist/test/helpers/`, fuera del repo
  (`test/empaquetado/distribucion.test.ts:20-22`); el glob `*.test.js` no lo
  recoge.
- No se toca `src/` ni `scripts/gitflow/`.

## La decision de diseño que mas te preocupa (UNA sola)

Que el helper imponga un repo base comun en vez de aceptar una receta por
fichero. `wrappers` y `sincronizacion` no son iguales a `start`/`review`/
`finish`: forzarlos cambiaria en silencio lo que prueban. Receta como
parametro y cache por fichero. Descartada una plantilla global para toda la
suite: obliga a coordinar procesos y ahorra solo ~6 spawns por fichero.

Sin verificar: que «gitflow» en B5 sea `wrappers.test.ts` y no `test/gitflow/*`
(hay que medir por fichero), y que `fs.cp` de un `.git` no arrastre rutas
absolutas.
