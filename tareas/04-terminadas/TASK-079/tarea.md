---
id: TASK-079
titulo: "Revisor por pares de dominio para Rust y WASM"
tipo: feature
sprint: 0
etiquetas: [skills, revisores, rust, wasm]
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-079-revisor-por-pares-de-dominio-para-rust-y
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 2267798
tokens_implementacion: null
tokens_revision: 5099671
creado: 2026-11-06
actualizado: 2026-11-06
dependencias: []
---
## Objetivo

Hoy ninguna skill revisora reclama ficheros Rust, asi que taskctl review manda todo el Rust y el WASM al generico code-quality-reviewer, que no revisa ownership, errores, el limite JS-WASM ni la numerica en f64. Los proyectos que instalan el plugin con nucleo Rust compilado a WASM necesitan un revisor de dominio propio, empaquetado en skills/ del plugin, que es lo unico que lee resolverRutaSkills.

## Criterios de aceptacion
- [x] Existe skills/rust-wasm-reviewer/SKILL.md con frontmatter name/description, enlace a ../task-workflow/revision.md y bloque yaml con rol: revisor y patrones_archivo que incluyen **/*.rs, **/Cargo.toml, **/build.rs y **/.cargo/config.toml, con el criterio de amplitud justificado
- [x] cargarCatalogoRevisores() devuelve rust-wasm-reviewer entre los revisores de dominio, comprobado por un test en test/core/revisores.test.ts
- [x] clasificarPorDominio parte un diff con un .rs y un .vue en dos grupos, rust-wasm-reviewer y angular-vue-reviewer, comprobado por un test
- [x] scripts/catalogo-skills.yml registra rust-wasm-reviewer con rol revisor, prioridad 10 y etiquetas de Rust y WASM, total_skills sube en consecuencia y test/core/catalogo-skills.test.ts pasa
- [x] Los patrones de rust-wasm-reviewer no se solapan con los de ningun otro revisor (test de solape de test/skills/revisores.test.ts en verde)
- [x] README del plugin, CHANGELOG y la documentacion que lista los revisores nombran rust-wasm-reviewer y la version del plugin sube segun la convencion
- [x] npm test en verde (salvo los tres rojos conocidos de Windows) en la rama de la tarea

## Resultado

Revisor por pares de dominio para Rust y WebAssembly: `skills/rust-wasm-reviewer/SKILL.md`. Antes todo el
Rust iba al generico `code-quality-reviewer`.

- Piezas: la skill (calcada de `csharp-autocad-ifc-reviewer`, sin tildes ni marcas del repo), la entrada
  `skill_6_*` de `scripts/catalogo-skills.yml` (prioridad 10, etiquetas `rust, wasm, webassembly,
  wasm-bindgen, cargo`, `total_skills: 6`), tabla de revisores en el README, nota de umbral de
  `code-quality-reviewer` reescrita (con cuatro dominios, mas de tres ya puede darse), CHANGELOG y
  version **0.10.0** (decidida por Carlos). Sin cambios de logica en `src/`: `cargarCatalogoRevisores`
  la recoge sola.
- Patrones: `**/*.rs`, `**/Cargo.toml`, `**/Cargo.lock`, `**/build.rs`, `**/.cargo/config.toml`,
  `**/rust-toolchain.toml`, `**/clippy.toml`, `**/rustfmt.toml`. Fuera y documentados: `pkg/` de
  wasm-pack, el llamador TS/JS, `rust-toolchain` y `.cargo/config` sin extension, `deny.toml`,
  `.rustfmt.toml` y `.clippy.toml` con punto.
- Decisiones del plan aplicadas: `Cargo.lock` y los tomls dentro (el lock ya lo excluye por defecto
  `**/*.lock`, comprobado en `config.ts`); pedir el llamador TS/JS y el `.d.ts` es OBLIGATORIO si cambia una
  firma o un tipo exportado, y consta en `## Alcance`; sin entradas externas de drewcrawford-skills.
- Borrador: lo redacto la sesion que diseno la tarea y no estaba en el repo; se recupero de su
  transcripcion y se le aplicaron los cambios del plan.
- Tests: las cinco listas cerradas (`REVISORES_DE_DOMINIO`, `DISPARADORES`, skills de `doctor-deploy`,
  catalogo e ids de `cargarCatalogoRevisores`), 12 rutas Rust en la tabla positiva y 8 ajenas en la negativa
  (comprobado con `matchesGlob`), y dos tests con el catalogo real: `.rs` + `.vue` dan dos grupos; Rust,
  Vue, Java y C# superan el umbral y van al generico.
- Suite completa: 1861/1864 en las dos rondas (los 3 rojos conocidos de Windows: symlink EPERM, chmod de
  directorio, CRLF).
- No publicada: sale junto con TASK-076 y TASK-080 (merge local, sin push).

Revision por pares, 2 rondas (code-quality-reviewer, sonnet), con entrada real (`taskctl review` en repos
temporales: `.rs` + `.vue` dan 2 peticiones; con un `.worker.ts`, 3; con Java y C#, 1 al generico):
- Ronda 1 (revisor: `aprobada`; registrada `cambios-solicitados` para corregir en automatico): MEN-2
  (`Instant` en wasm32 compila y falla al ejecutar), MEN-3 (efecto real de un panic,
  `console_error_panic_hook`, `Result<_, JsError>`), MEN-4 (`.rustfmt.toml`/`.clippy.toml`), MEN-6
  (recuentos en `CLAUDE.md` y en el yml). Corregidos. Aceptados: MEN-1 (`**/build.rs` redundante con
  `**/*.rs`, lo exige el criterio 1) y MEN-5 (sin test que compare los patrones del SKILL.md con los del
  yml, riesgo aceptado en el plan).
- Ronda 2 (`aprobada`): las cuatro correcciones confirmadas, sin hallazgos nuevos.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-06T18:45:22Z | plan | automatico | persona |
| 2026-11-06T18:57:43Z | approve | automatico | persona |
| 2026-11-06T19:39:24Z | start | automatico | persona |
| 2026-11-06T20:01:34Z | review | automatico | persona |
| 2026-11-06T20:21:12Z | review | automatico | persona |
| 2026-11-06T20:35:55Z | finish | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-06T18:57:11Z | diseno | agente:a0945abf517696826,aacf0a92d54aa51b9,a539e553c5c399498 | 80 | 213536 | 2017152 | 37030 | 54 | 2267798 |
| 2026-11-06T20:18:03Z | revision | agente:a33724f6940d3d651 | 64 | 157685 | 3848856 | 19473 | 4 | 4026078 |
| 2026-11-06T20:31:36Z | revision | agente:a0117a97f0682ea13 | 22 | 62730 | 1005103 | 5738 | 4 | 1073593 |
