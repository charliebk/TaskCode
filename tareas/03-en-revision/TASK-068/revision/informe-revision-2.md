# Informe de revision — TASK-068 (ronda 2)

- Commit revisado: 6aa388b7f7ddcf6dd536496eac6b888f76021cfa
- Revisor: general-purpose (sonnet) con la skill code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-068 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | scripts/doctor-deploy.yml (aplicacion_2_marcadores / aplicacion_2_contiene) | plan |
| IMP-2 | IMPORTANTE | corregido | scripts/doctor-deploy.yml (punto_40_tipos, punto_43_tipos) | implementacion |
| IMP-3 | IMPORTANTE | corregido | src/core/doctor-deploy-reglas.ts (PATRONES_REGLAS_SIN_HUELLA, detectarPullRequestTarget) | implementacion |
| MEN-1 | MENOR | corregido | src/core/doctor-deploy-reglas.ts (CLAVE_SECRETA) | implementacion |
| MEN-2 | MENOR | corregido | src/core/doctor-deploy-reglas.ts (usaPullRequestTarget) | implementacion |
| MEN-3 | MENOR | abierto | src/core/doctor-deploy-reglas.ts (detectarPullRequestTarget: solo `ref:`) | implementacion |
| MEN-4 | MENOR | corregido | CHANGELOG.md | implementacion |
| MEN-5 | MENOR | abierto | src/fs/sondas-deploy-config.ts:80 (limite exacto sin test; `_file$` ya quitado) | implementacion |
| MEN-6 | MENOR | abierto | scripts/doctor-deploy.yml (`ports:`, `tide`, `expose `, `web:` por subcadena) | plan |
| MEN-7 | MENOR | abierto | test/commands/doctor-deploy-config.test.ts (estabilidad de la huella de IMP-3 sin test) | implementacion |
| MEN-8 | MENOR | abierto | src/core/doctor-deploy-reglas.ts:636 (misma linea en dos jobs, misma huella) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin CRITICO ni IMPORTANTE abiertos. Reproducido en un clon en `%LOCALAPPDATA%\pruebas-claude\TaskCode\task-068-r2` (borrado), con repos Git temporales y `node bin/taskctl doctor-deploy --json`.

## Verificacion de la ronda 1

- **IMP-1, corregido.** `bin` + apollo-server, @trpc/server, next o rocket (Cargo) da `api`+`cli` y los puntos de servicio aplican; `EXPOSE`, `ports:` y Procfile `web:` funcionan; una CLI pura sigue apagando los puntos. Falso positivo por subcadena: existe (MEN-6) pero no vacia la funcionalidad: de 645 `package.json` de `node_modules` de la maquina, 50 (7,7 %) dan alguna senal api, casi todos por `"next"`, `"express"` o `"hono"`; de 33 con `bin`, 2. Mutantes sobre las senales, los marcadores y `apollo-server`: muertos.
- **IMP-2, corregido.** `compose.prod.yaml`, `Dockerfile.prod` y `Containerfile` se revisan y dan FALLA; sin ficheros Docker, NO APLICA con motivo; `contenedor-sin-root-ni-secretos` sigue acotado a docker. Mutante (volver a `[docker]`): muerto.
- **IMP-3, corregido.** Huella `ba8b226bc040`; con silencio pasa a OK; espacios de mas o reindentar mantienen OK; un `gh pr checkout` nuevo vuelve a FALLA. El silencio sin huella aborta con un mensaje que dice que hacer; no rompe a nadie: el patron nace en esta tarea (no esta en develop ni en v0.8.0). Mutante (huella a null): muerto.
- **MEN-1, corregido.** `SECRET_KEY` y `JWT_SIGNING_KEY` dan FALLA enmascarada; `DB_PASSWORD_FILE` no.
- **MEN-2, corregido.** `on: pull_request` con el evento solo en un `if:` ya no da FALLA; `pull_request_target` real con `if:`, en lista o en un paso `- if:` sigue dando FALLA.
- **MEN-3, abierto.** `repository: ${{ github.event.pull_request.head.repo.full_name }}` sin `ref` sigue dando OK; aceptable si se documenta.
- **MEN-4, corregido.** README y CHANGELOG coherentes con el codigo.
- **MEN-5, mitad.** `_file$` quitado; el mutante `st.size > max` → `>=` sobrevive.

## Hallazgos nuevos

- **MEN-6.** `Supports: linux and mac` (subcadena `ports:`) o el autor `Tidelift` (subcadena `tide`) dan `api`+`cli`. Direccion segura (los puntos aplican); anclar con limites de palabra o documentarlo.
- **MEN-7.** El mutante «huella sin `trim` ni colapso de espacios» sobrevive: la estabilidad comprobada a mano no tiene test.
- **MEN-8.** El mismo `ref: head.sha` en dos jobs da dos evidencias con la misma huella: silenciar una tapa la otra y un tercer job identico. Borde del diseno «huella por linea normalizada»; documentarlo.

## Resultado de la suite
`npm test` en el clon, commit 6aa388b: 1710 tests, 1705 pasan, 5 fallan (los conocidos de Windows: approve/symlink, plan/chmod, plan/CRLF, y las dos contrapruebas de descubrimiento de TASK-075).

## Mutantes (231 tests de doctor-deploy)
Muertos: huella pr-target a null; sin filtro `if:`; sin `secret_key`; puntos 40 y 43 a `[docker]`; sin `expose `/`ports:`/`web:`; sin Dockerfile/compose/Procfile en los marcadores api; sin `apollo-server`. Supervivientes: huella sin normalizar (MEN-7) y `st.size >= max` (MEN-5).
