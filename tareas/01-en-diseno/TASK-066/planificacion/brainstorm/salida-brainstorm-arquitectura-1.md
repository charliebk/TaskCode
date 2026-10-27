# Brainstorm — TASK-066, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: a85e0b79f3f823466

## Enfoque
Comando nuevo `taskctl doctor-deploy`, separado de `doctor`, en tres capas: (1) `core/doctor-deploy-catalogo.ts` lee y valida el catálogo `scripts/doctor-deploy.yml` y la capa del proyecto; (2) sondas deterministas que el catálogo nombra por id (`punto_N_sonda: secretos-historial`); (3) núcleo puro con los 4 estados, formato texto/JSON, código de salida y certificado. Los puntos `juicio` salen NO VERIFICADO sin pasar por código.

## Piezas y límites
- `scripts/doctor-deploy.yml` (nuevo) — aplanado como `catalogo-skills.yml`: `punto_N_{id,severidad,tipos,metodo,sonda,arreglo,descripcion}` y `total_puntos`. También los tipos de aplicación como datos (`tipo_N_{id,marcadores}`), para que añadir un tipo no toque código. Lo lee el parser único `parseBloqueClaveValor` con `permitirComentariosDeLinea: true` (`src/core/frontmatter.ts:48-69`, `heuristica.ts:250`).
- `src/core/doctor-deploy-catalogo.ts` (nuevo) — doctrina de `heuristica.ts`/`catalogo-skills.ts`: falla en cerrado, `resolverRuta…` con `CLAUDE_PLUGIN_ROOT`, `cargar…(ruta?)` / `parsear…(contenido, ruta)`. Superpone `.taskcode/doctor-deploy.yml`: `desactivar_N_{id,motivo}` exige motivo; `punto_N_*` añade puntos, que solo pueden ser `juicio` o reutilizar una sonda registrada (el proyecto no inyecta código).
- `src/core/doctor-deploy.ts` (nuevo) — `EstadoPunto = 'ok'|'falla'|'no-verificado'|'no-aplica'`, `ResultadoPunto {id, estado, motivo, evidencias[], arreglo}`, `codigoSalida`, `formatearTexto`, `formatearJson`, `formatearCertificado`. No reutiliza `Comprobacion` de `core/doctor.ts` (sus niveles `aviso`/`omitida` significan otra cosa).
- `src/fs/deteccion-app.ts` (nuevo) — `detectarTipos(cwd, catalogo)`: un solo `git ls-files`, compartido con las sondas, cruzado con los marcadores del catálogo.
- `src/fs/sondas-deploy.ts` (nuevo) — `SONDAS: Record<string, (ctx: ContextoDeploy) => ResultadoPunto>`. `ContextoDeploy` se construye una vez (listado del árbol, tipos, índice de hallazgos del historial, herramientas presentes). `Evidencia` no tiene campo para el valor crudo, solo `muestraEnmascarada`: se enmascara en origen.
- `src/commands/doctor-deploy.ts` + `cli.ts` — orquesta como `commands/doctor.ts`: `rechazarFlagsDesconocidos`, un `envolver` que convierte una excepción en NO VERIFICADO de ese punto, lanzamientos con timeout. `--escribir` escribe sin commitear, como `metricas`/`board --escribir`. Reutilizar `ocultarCredenciales` y extraer el `git()` local a `fs/git.ts`.

## Orden de construcción
1. Catálogo YAML (~34 puntos), su parser y la capa del proyecto.
2. Núcleo puro, detección de tipos y comando con `--json` (contrato que consumirá TASK-067).
3. Sondas sobre el árbol: ficheros de secretos versionados, `.gitignore` con `.env`, lockfile versionado, patrones de claves.
4. Sonda del historial y de herramientas externas (tabla `{tipo → comando, interpretación}`; ausente → NO VERIFICADO).
5. `--escribir` con `docs/doctor-deploy/<fecha>.md`.

## La decisión de diseño que más preocupa
El recorrido del historial: `rev-list --all --objects` + `cat-file --batch` sobre blobs únicos (saltando binarios y blobs grandes vía `--batch-check`) y luego `log --find-object` solo para los hallazgos. Crece con el contenido distinto, no con commits × diffs.

## Alternativas descartadas
- `doctor --deploy` reutilizando `Comprobacion`: otra semántica de niveles y catálogo en código.
- Catálogo en JSON: el criterio pide `.yml`, sin comentarios, y abriría un segundo formato frente al parser único.
- `git log --all -p` con regex: reescanea el mismo contenido y `spawnSync` lo guarda entero en memoria.

## Desacuerdos previstos
- Con riesgos: NO VERIFICADO no da código 1; un modo estricto sería un flag futuro.
- Con riesgos: el enmascarado va en origen (el tipo no puede llevar el valor); el del formateador es segunda red.
- Con dominio: los tipos y marcadores viven en el catálogo como datos.

## Suposiciones no verificadas
- `catalogo-skills.ts` itera `1..total_skills` y exige bloque completo (`src/core/catalogo-skills.ts:131`).
- Añadir `doctor-deploy` a `cli.ts` toca un solo sitio.
- `metricas --escribir` no commitea (`commands/metricas.ts:18-21`); confirmar que el certificado tampoco.
- `ContextoDeploy` y el JSON son el contrato que extenderá TASK-067.
