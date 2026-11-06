# Plan — TASK-079: Revisor por pares de dominio para Rust y WASM

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos.
Los desacuerdos entre roles se senalan, no se promedian.)

## Enfoque propuesto
- Solo datos, documentación y tests; `src/` no se toca (arquitectura: `cargarCatalogoRevisores` lee `skills/*` sin caché). Se crea `skills/rust-wasm-reviewer/SKILL.md` a partir del borrador del orquestador, calcado de `csharp-autocad-ifc-reviewer`, sin tildes y sin nombrar TaskCode.
- Se extienden: `scripts/catalogo-skills.yml` (`skill_6_*`, prioridad 10, etiquetas `[rust, wasm, webassembly, wasm-bindgen, cargo]`, patrones copiados literal, `total_skills: 6`), las 5 listas cerradas de tests que cita arquitectura, `code-quality-reviewer/SKILL.md` y los comentarios «tres/cuatro revisores».
- Orden: SKILL.md → yml → tests → README del plugin, CHANGELOG y versión en los 7 ficheros que lista el orquestador → `npm run build` (`dist/` está versionado) → `npm test`.

## Desacuerdos entre roles, y como se resuelven
- `Cargo.lock` — arquitectura: patrón propio para que el lock no abra un grupo para el genérico / riesgos: `**/*.lock` ya lo excluye por defecto (`config.ts:210`), el patrón solo actúa si el proyecto redefine `excluir_de_revision` — gana arquitectura (entra) — no solapa con nadie y en el único caso en que actúa evita un grupo genérico de un solo fichero; en el borrador se cambia la justificación: se dice que está excluido por defecto y que del lock solo se miran las versiones de crates del límite (`wasm-bindgen`, `js-sys`), como pide arquitectura.
- `rust-toolchain.toml`, `rustfmt.toml`, `clippy.toml` — arquitectura: dentro / riesgos: «huecos aceptados», documentarlos sin ampliar con `**/*.toml` — gana arquitectura — son nombres fijos que discriminan según el criterio de amplitud y riesgos solo argumenta contra `**/*.toml`, que nadie propone; siguen fuera y documentados `deny.toml`, `.cargo/config` sin extensión y `rust-toolchain` sin extensión (añadir los dos primeros al borrador, que no los nombra).
- Promesa del límite JS-WASM — riesgos: la skill obliga a pedir el lado TS cuando cambia una firma `#[wasm_bindgen]` / arquitectura: no lo trata; el borrador lo deja opcional («se pide aqui como contexto adicional») y acota su opinión al lado Rust — gana riesgos — acotar la promesa contradice el objetivo, que dice revisar el límite; en el borrador: obligatorio pedir el llamador TS/JS y el `.d.ts` si cambia una firma o un tipo exportado, y constarlo en `## Alcance`.
- `code-quality-reviewer` y más de 3 dominios — riesgos: actualizar `code-quality-reviewer/SKILL.md:51-58`, que dice que el camino «no puede darse» / arquitectura: no lo incluye en lo que se toca — gana riesgos — con 4 dominios un diff Rust+Vue+Java+C# supera `umbral_dominios: 3` y la skill negaría un caso real; el umbral sigue en 3 (los dos coinciden).
- Convención de versión — arquitectura: se deduce no subir (0.8.0 con diez features acumuladas, `finish.ts:218` escribe en `## Sin publicar`) / orquestador (verificado): las tareas suben, TASK-076 sube a 0.9.0 en 7 ficheros — gana el orquestador — es un dato comprobado sobre una tarea real frente a una deducción; el número va a la decisión humana.
- Entradas externas de drewcrawford-skills — arquitectura: no entran (exigen `plugin:skill` + `marketplace`, nombre sin verificar, son de ejecución) / riesgos: no propone ninguna — gana arquitectura — el orquestador verificó el marketplace pero confirma que son de ejecución y no están instaladas aquí; ningún criterio las pide.

## Riesgos aceptados y que los contiene
- Si `rust-wasm-reviewer` no entra en `REVISORES_DE_DOMINIO` (`test/skills/revisores.test.ts:68-76`) la suite da verde sin guardas sobre él — riesgos — se añade, con rutas en `RUTAS_DE_DOMINIO` y fila en `DISPARADORES` de `task-workflow.test.ts:572`.
- Diffs que hoy reciben una petición pasarán a recibir dos o tres (rust, angular, genérico) — riesgos — se acepta; lo acota el umbral de 3 dominios.
- Patrones duplicados en SKILL.md y yml sin test que los compare — arquitectura y riesgos — copia literal en estilo flow; no se arregla aquí.
- `pkg/` de wasm-pack cae al genérico — riesgos — no se añade `**/pkg/**`; la skill recomienda excluirlo de la revisión.
- Fail-closed: un yaml mal formado o `total_skills` sin subir aborta `taskctl` entero — arquitectura y riesgos — tests de catálogo y de revisores.
- Una versión publicada no se retira y el número queda gastado — riesgos — vuelta atrás con `git revert` y otra versión.

## Plan de pruebas
- `cargarCatalogoRevisores()` devuelve los 4 de dominio, rust-wasm-reviewer el último — `test/core/revisores.test.ts:48-52` — enunciado y arquitectura.
- Diff `.rs` + `.vue` da dos grupos; diff Rust+Vue+Java+C# cae al genérico por umbral — `clasificarPorDominio` en el mismo fichero — enunciado y riesgos.
- `skill_6`, `total_skills: 6`, `length === 6` — `test/core/catalogo-skills.test.ts:138-148` — enunciado y arquitectura.
- Guardas, veredicto y solape comprobado con `matchesGlob` sobre las tablas de rutas, no solo texto idéntico — `test/skills/revisores.test.ts` — riesgos.
- Lista de `skills/` y disparadores — `test/skills/doctor-deploy.test.ts:82-96`, `test/skills/task-workflow.test.ts:570-576` — arquitectura.
- `npm run build` sin diff pendiente en `dist/` y `npm test` verde salvo los 3 rojos de Windows — rama de la tarea — orquestador y enunciado.

## Sin cubrir
- «La documentación que lista los revisores»: ningún rol encontró un documento vivo que los liste (arquitectura: el README no nombra ninguno, `docs/contexto` solo en histórico) — quien implemente busca los tres nombres actuales y añade el cuarto donde aparezcan juntos; si no hay, solo README.
- El contenido técnico de la skill (ownership, errores, f64, wasm32) no lo contrastó ningún rol — queda el borrador del orquestador tal cual, con los cambios de arriba; los SKILL.md van sin tildes, así que «señala» y «añadan» del borrador pasan a «senala» y «anadan» (regla del orquestador).
- La discrepancia de complejidad (declarada simple, heurística media) no la trató ningún rol — 5 listas cerradas y versión en 7 ficheros apuntan a media.

## Salidas que faltaron
- ninguna — pero solo se lanzaron arquitectura y riesgos (heurística media: 2 roles); no hubo rol de dominio Rust/WASM ni de pruebas, y nadie revisó el contenido del revisor.

## Suposiciones no verificadas
- La copia instalada se indexa por versión y sin subirla el cambio no llega — riesgos — mirar cómo resuelve Claude Code la caché del plugin.
- `finish` acepta una ronda N con el genérico y la N+1 fragmentada — riesgos — leer la reunión de veredictos en `finish.ts`.
- `**/*.lock` está en `CONFIG_DEFAULTS.excluir_de_revision` — riesgos (cita `config.ts:208-213`, no comprobado aquí) — leer esas líneas.
- No hace falta tocar `src/` — arquitectura — lo confirma que el test de `cargarCatalogoRevisores` pase sin cambios en `src/`.

## Lo que necesita decision de una persona
- Versión: 0.10.0 (propuesta del orquestador, porque 0.9.0 la toma TASK-076 sin mergear) o 0.9.0 y reajustar si 076 entra antes — depende del orden de merge, que no decide este rol.
- Aprobar el plan entero con `taskctl approve`, incluidas las elecciones de arriba (Cargo.lock y tomls dentro, lado TS obligatorio, sin entradas externas, tocar `code-quality-reviewer`) — sin esa aprobación no se implementa.
