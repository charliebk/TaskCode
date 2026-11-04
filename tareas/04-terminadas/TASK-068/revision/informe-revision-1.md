# Informe de revision — TASK-068 (ronda 1)

- Commit revisado: 9c414f3f12d58cf05e77755aaf299f41160c9bdb
- Revisor: general-purpose (sonnet) con la skill code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | scripts/doctor-deploy.yml:114 (aplicacion_2_contiene) y :132-139 (cli/libreria) | plan |
| IMP-2 | IMPORTANTE | abierto | scripts/doctor-deploy.yml:100 (tipo_14_marcadores) frente a src/fs/sondas-deploy-config.ts (esDockerfile/esCompose) | implementacion |
| IMP-3 | IMPORTANTE | abierto | src/core/doctor-deploy-reglas.ts:61 (PATRONES_REGLAS_SIN_HUELLA) y :585-615 (detectarPullRequestTarget) | implementacion |
| MEN-1 | MENOR | abierto | src/core/doctor-deploy-reglas.ts:470 (CLAVE_SECRETA) | implementacion |
| MEN-2 | MENOR | abierto | src/core/doctor-deploy-reglas.ts:568 (RE_EVENTO_PR_TARGET) | implementacion |
| MEN-3 | MENOR | abierto | src/core/doctor-deploy-reglas.ts:595 (solo se mira `ref:`) | implementacion |
| MEN-4 | MENOR | abierto | CHANGELOG.md (Doctor-deploy C, «Silencios por hallazgo») | implementacion |
| MEN-5 | MENOR | abierto | src/core/doctor-deploy-reglas.ts:471 (`_file$`) y src/fs/sondas-deploy-config.ts (limite de tamano) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Reproducido en un clon en `%LOCALAPPDATA%\pruebas-claude\TaskCode\task-068-r1` (borrado), con repos Git temporales y `taskctl doctor-deploy --json`.

### IMP-1 — Una API real con `bin` / `[project.scripts]` y un framework fuera de la lista sale como CLI y pierde 10 puntos
- `package.json` con `{"bin":{"x":"s.js"},"dependencies":{"apollo-server":"3"}}` → `aplicaciones=[cli]`; https-obligatorio, cookies-seguras, rate-limits, security-headers, cors-restringido, proteccion-csrf, backups-y-migraciones, health-check, proteccion-de-bots y limitar-respuestas-api salen `no-aplica`. Igual con `@trpc/server`, con `pyproject.toml` (`aiohttp` + `[project.scripts]`), con `Cargo.toml` (`[[bin]]` + `rocket`) y con `next` + `bin` sin `next.config.*`.
- Con `express` o `@hapi/hapi` sale `api`+`cli` y los puntos aplican (correcto).
- Esperado: la decision (1) de la persona es «ante la duda aplican»; la deteccion de web/api es una lista cerrada y cualquier API fuera de ella con script de consola cae en `cli`. El marcador sale en el motivo, pero el hueco es de cobertura.
- Arreglo propuesto: ampliar `aplicacion_2_contiene` (apollo, trpc, graphql-yoga, restify, aiohttp, tornado, sanic, starlette, bottle, litestar, quart, rocket, warp, tide; next/nuxt/@sveltejs/kit como web); senales de servicio independientes del framework (`EXPOSE`, `ports:`, `openapi*`); o que `cli` solo gane sin ninguna senal de servidor. Test «CLI con servidor fuera de lista».

### IMP-2 — Las sondas 40 y 43 leen ficheros que el tipo `docker` nunca detecta
- Solo `compose.prod.yaml` con `POSTGRES_PASSWORD: hunter2hunter2` → `compose-con-contrasenas` = `no-aplica` («solo aplica a docker; detectado: ningun tipo»). Con `compose.yaml`, FALLA.
- `package.json` + `Dockerfile.prod` sin USER → `dockerfile-sin-user` = `no-aplica`. Igual con `Containerfile` solo, o con un Dockerfile a profundidad 4.
- Causa: `tipo_14_marcadores` solo tiene nombres exactos y los puntos 40 y 43 llevan `tipos: [docker]`; parte de los filtros de la sonda es codigo muerto.
- Arreglo: poner `punto_40_tipos` y `punto_43_tipos` en `[todos]` (la sonda ya da NO APLICA con motivo sin ficheros) o ampliar el marcador. Tests con `Dockerfile.prod` y `compose.prod.yaml`.

### IMP-3 — Un silencio de `pr-target-checkout` tapa los pasos peligrosos que se anadan despues
1. Flujo con `on: pull_request_target` y `ref: ${{ github.event.pull_request.head.sha }}` → FALLA.
2. Silencio `pr-target-checkout` + fichero, sin huella → OK.
3. Se anade `- run: gh pr checkout ${{ github.event.number }}` → sigue OK.
- Esperado: un silencio por hallazgo (comentario D3 del catalogo). El fichero puede tener varios hallazgos, pero se registra `huella: null`.
- Arreglo: huella estable por hallazgo (linea normalizada + job); quitarlo de `PATRONES_REGLAS_SIN_HUELLA`; test «silencio + paso nuevo → vuelve a FALLAR».

### MEN-1 — `SECRET_KEY` en compose no se detecta aunque el texto dice «*KEY»
`SECRET_KEY: djangosecretkeyvalue123456` no se reporta; `CLAVE_SECRETA` solo acepta api_key, access_key y private_key. Anadir secret_key, signing_key, encryption_key, auth_key, o bajar la promesa del texto.

### MEN-2 — Falso positivo con `pull_request_target` solo en una expresion
`on: pull_request` + `if: github.event_name != 'pull_request_target'` + `ref: head.sha` → FALLA. Leer la clave `on:` en vez de la palabra en todo el fichero.

### MEN-3 — Falsos negativos de `ci-pull-request-target` sin test que los fije
`repository: ${{ github.event.pull_request.head.repo.full_name }}` sin `ref`, y `ref: |` multilinea, no se detectan. Mirar `repository:` con `head.repo` o dejar tests de «escape conocido».

### MEN-4 — El CHANGELOG dice «Silencios por hallazgo» y para `pr-target-checkout` y `dockerfile-sin-user` es por fichero. El README lo dice bien.

### MEN-5 — Dos bordes sin red
Mutante `st.size > max` → `>=` en `sondaPorFicheros` sobrevive (el limite exacto no tiene test). `CLAVE_NO_SECRETA` con `_file$` es una exclusion muerta (mutante equivalente).

## Resultado de la suite
`npm test` en el clon, commit 9c414f3: 1705 tests, 1700 pasan, 5 fallan: los conocidos de Windows (approve stat/symlink, plan escritura/chmod, plan rama base/CRLF) y las dos contrapruebas de descubrimiento (TASK-075). `dist/` coincide con el fuente recompilado.

## Mutantes (226 tests de doctor-deploy)
Muertos: sin tipo → NO APLICA; `some` → `every` en el eje; ignorar fichero sin leer; silencio `cubiertoPor`; valor sin enmascarar en tokens; modo de prueba por fecha de Firebase; RLS drop/disable/esquemas; herencia de USER y `nonroot`; acciones propias; `--checksum`; `urlSegura`. Supervivientes: los dos de MEN-5.

## Comprobado y correcto
Deteccion de clase (CLI y libreria apagan los 10 puntos con motivo; express+bin da api; sin senales aplica; RN a profundidad 3; ejes equivocados abortan tambien en la capa del proyecto); JSON v3; NO APLICA sin ficheros y NO VERIFICADO con fichero grande o binario; Firebase, RLS, tokens de gestor (incluido el doble FALLA de `.npmrc`), compose, acciones sin SHA y Dockerfile con sus variantes; enmascarado en stdout, `--json`, `--escribir` y `--crear-tareas`; rechazo de veredictos del agente para puntos deterministas; referencias OWASP Top 10 2025 / ASVS 5.0 coherentes por significado (no re-consultadas en red); sin riesgo de ReDoS visible con 1 MiB; README y CHANGELOG veraces salvo MEN-4.
