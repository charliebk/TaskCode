# Brainstorm — TASK-079, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: brainstorm-arquitectura (subagente de Claude Code)

## Enfoque propuesto, con rutas y nombres concretos

- Tarea solo de datos y documentación: no hay que tocar `src/`. `cargarCatalogoRevisores()` (`src/core/revisores.ts:132`) recorre `skills/*` sin caché y da de alta como revisor de dominio toda carpeta cuyo SKILL.md traiga un bloque yaml con `rol: revisor` y `patrones_archivo` no vacío; `clasificarPorDominio` reparte con `path.matchesGlob`. Basta con crear la carpeta.
- Pieza nueva: `skills/rust-wasm-reviewer/SKILL.md`, calcada de `skills/csharp-autocad-ifc-reviewer/SKILL.md` (mismo dilema de amplitud: `**/*.cs` no distingue AutoCAD de una API web, `**/*.rs` no distingue Rust a WASM de Rust de servidor). Frontmatter con solo `name` y `description`; enlace a `../task-workflow/revision.md`; bloque yaml con el criterio de amplitud reutilizado; puerta `cargo build`, `cargo clippy -D warnings`, `cargo fmt --check`, `cargo test`; reproducir; qué se revisa; CRÍTICO/IMPORTANTE/MENOR; informe con `Revisor: rust-wasm-reviewer`; lo que no hace.
- Patrones: `["**/*.rs", "**/Cargo.toml", "**/Cargo.lock", "**/build.rs", "**/.cargo/config.toml", "**/rust-toolchain.toml", "**/rustfmt.toml", "**/clippy.toml"]`. Ninguno coincide con los de las otras tres revisoras (contrastado con `catalogo-skills.yml:138,149,160`).
- `scripts/catalogo-skills.yml`: bloque `skill_6_*` con `prioridad: 10`, `etiquetas: [rust, wasm, webassembly, wasm-bindgen, cargo]`, los mismos patrones; `total_skills: 6`; el comentario PRIORIDAD pasa a «los cuatro revisores de dominio».
- Entradas externas de drewcrawford-skills: no entran. `catalogo-skills.ts:259` exige `id` `plugin:skill` y `marketplace`, no se ha verificado el nombre real, y el yml (l. 86-94) prohíbe inventar entradas externas; además son de ejecución, otro eje.

## Que se extiende y que se crea

- Se crea: `skills/rust-wasm-reviewer/SKILL.md`.
- Se extiende: `scripts/catalogo-skills.yml`.
- Listas cerradas en tests que se ponen rojas al aparecer la carpeta: `test/core/revisores.test.ts:48-52` (deepEqual de nombres de dominio; rust-wasm-reviewer el último por orden alfabético); `test/skills/doctor-deploy.test.ts:82-96` (lista exacta de `skills/`); `test/core/catalogo-skills.test.ts:138-148` (`length === 5` y lista de ids); `test/skills/revisores.test.ts:68-72` (`REVISORES_DE_DOMINIO`, y filas de Rust en `RUTAS_LEGITIMAS`); `test/skills/task-workflow.test.ts:570-576` (`DISPARADORES`).
- Solo comentarios: cabeceras de `src/core/revisores.ts:6` y `test/skills/revisores.test.ts:2` («cuatro skills revisoras»).
- Documentación: el README del plugin no nombra a ninguna revisora; añadir una lista corta en la sección de `taskctl review`. `docs/contexto` solo las nombra en histórico.
- No se toca: `src/commands/review.ts`, `src/fs/rondas.ts`, `umbral_dominios` (sigue en 3).

## Limites que cruza

- Contrato SKILL.md ↔ `cargarCatalogoRevisores`: fail-closed; un yaml mal formado aborta `taskctl` entero.
- Contrato yml ↔ `parsearCatalogoSkills`: `total_skills` cuadra con los bloques.
- Doble fuente de patrones (SKILL.md y yml) sin test que las compare: se señala, no se arregla aquí.
- Portabilidad: nada de `taskcode`, `tareas/`, `docs/contexto`, documentos internos en mayúsculas bajo `docs/`, `src/core/`, rutas de máquina. `taskctl` sí.
- Versión: `finish.ts:218` escribe bajo `## Sin publicar` del CHANGELOG raíz; `package.json` y `.claude-plugin/plugin.json` están en `0.8.0` con diez features acumuladas sin subir. La convención que se deduce es no subir en la tarea, lo que choca con el criterio; si se sube, los dos ficheros a la vez.

## La decision de diseño que mas te preocupa (UNA sola)

Que `Cargo.lock` y la configuración de toolchain queden fuera: si la ronda se fragmenta, cada fichero sin dominio crea un grupo más para el genérico, y añadir una dependencia (`.rs` + `Cargo.toml` + `Cargo.lock`) lanzaría dos revisores, el genérico solo con el lock. Posición: Rust los reclama; la skill dice que del lock solo mira versiones de crates del límite (`wasm-bindgen`, `js-sys`).
