# Informe de revision — TASK-079 (ronda 1)

- Commit revisado: b554c67ac6ab1504ebe5cfa74248c52872846910
- Revisor: code-quality-reviewer (agente revisor independiente, general-purpose, sonnet), con revision del contenido tecnico Rust/WASM de rust-wasm-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-079 aprobada | aprobada-con-correcciones | cambios-solicitados)

Veredicto propuesto por el revisor: aprobada (sin CRITICO ni IMPORTANTE; los 7 criterios se cumplen;
6 MENOR). Quien orquesta lo registra como cambios-solicitados para corregir MEN-2 y MEN-3 (la skill se
instala en otros proyectos y guia a sus revisores con esas afirmaciones), MEN-4 y MEN-6; acepta MEN-1
(lo exige el criterio 1) y MEN-5 (riesgo ya aceptado en el plan).

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | aceptado | skills/rust-wasm-reviewer/SKILL.md (`**/build.rs` redundante con `**/*.rs`) | especificacion |
| MEN-2 | MENOR | abierto | skills/rust-wasm-reviewer/SKILL.md (`Instant` en wasm32 compila y falla en ejecucion; la skill dice que no compila) | implementacion |
| MEN-3 | MENOR | abierto | skills/rust-wasm-reviewer/SKILL.md (un panic no deja el modulo inservible; faltan `console_error_panic_hook` y `JsError`) | implementacion |
| MEN-4 | MENOR | abierto | skills/rust-wasm-reviewer/SKILL.md (`.rustfmt.toml` y `.clippy.toml` con punto, hueco sin documentar) | plan |
| MEN-5 | MENOR | aceptado | scripts/catalogo-skills.yml (sin test que compare sus patrones con los del SKILL.md) | plan |
| MEN-6 | MENOR | abierto | CLAUDE.md, scripts/catalogo-skills.yml (recuentos de skills desfasados) | implementacion |

No hay hallazgos CRITICOS ni IMPORTANTES.

## Reproduccion y evidencia

Clon temporal en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-079-r1` (borrado), `npm install` y `npm run build`; `dist/` sincronizado con `src/`. Suite acotada (`revisores`, `catalogo-skills`, `skills/*`, `empaquetado/*`): 159/159. Suite completa no repetida (1861/1864 de quien orquesta, los 3 rojos conocidos de Windows).

**Mutantes** (cada uno sobre copia limpia):

| Mutante | Resultado |
|---|---|
| M1 quitar `build.rs` del SKILL | verde, equivalente (MEN-1) |
| M2 anadir `**/*.toml` | rojo en 6d NEGATIVA (`deny.toml`, `pyproject.toml`) |
| M3 `total_skills: 5` | rojo en catalogo-skills |
| M4 sin bloque `skill_6_*` y `total_skills: 5` | rojo en «parsea el catalogo real» |
| M5 quitar `.cargo/config.toml` / M8 `Cargo.lock` / M9 romper `rustfmt.toml` | rojo en 6c POSITIVA |
| M6 quitar `*.rs` | tres rojos (los dos tests nuevos y 6c) |
| M7 divergencia solo en el yml | verde (MEN-5) |
| M10 borrar la carpeta de la skill | el test se colgo; parado sin analizar, no atribuido a este diff |

**Entrada real** (`node bin/taskctl review` en repos Git temporales, borrados): `.rs` + `.vue` dan 2 peticiones (rust-wasm y angular-vue); `.rs`, `Cargo.toml`, `.vue` y `.worker.ts` dan 3 (rust, angular y generico para el `.ts`); `.rs`, `.vue`, `.java` y `.cs` dan 1 sola, al generico, con los cuatro ficheros.

**Solape** con `clasificarPorDominio` sobre las skills reales: las rutas Rust van solo a rust-wasm; las de otros dominios no se desvian. Solape teorico irrelevante: `src/main/java/x/wasm.rs` casa con Java y Rust y cae al generico.

### MEN-1 — `**/build.rs` redundante (especificacion)
`**/*.rs` ya casa `build.rs`; quitarlo deja 159/159 en verde. Lo exige el criterio 1 de la tarea.

### MEN-2 — `Instant` en wasm32 (implementacion)
El paso 2 de «Reproducir» dice que `std::time::Instant` «alli no existe» y que el error sale al compilar a `wasm32`. En `wasm32-unknown-unknown` compila y hace panic en `Instant::now()`: un build limpio no lo detecta. La seccion del limite JS-WASM lo dice bien; la skill se contradice.

### MEN-3 — Efecto de un panic (implementacion)
«modulo inservible hasta que se recarga» exagera: la instancia sigue invocable, con estado posiblemente inconsistente. No se mencionan `console_error_panic_hook` (da contexto al `RuntimeError: unreachable`) ni `JsError` / `Result<_, JsValue>` para lanzar. El resto del contenido tecnico es correcto (copias de `Vec<f64>`/`&[f64]`, `free()`, `Float64Array::view` tras crecer la memoria, `partial_cmp().unwrap()` y `f64::max` con NaN, saturacion de `as`, `--locked`, version de la herramienta `wasm-bindgen`, `[build] target` y `rustflags`).

### MEN-4 — `.rustfmt.toml` y `.clippy.toml` (plan)
rustfmt y clippy tambien leen los nombres con punto; caen al generico y la lista de «quedan fuera» no los nombra.

### MEN-5 — Patrones duplicados sin test (plan)
Quitar `**/Cargo.lock` solo del yml deja 88/88 en verde. Riesgo aceptado en el plan.

### MEN-6 — Recuentos desfasados (implementacion)
`CLAUDE.md` dice «cinco skills (`task-workflow` y los cuatro revisores por dominio)»; el comentario de `catalogo-skills.yml` habla de «las cinco entradas de abajo». No afecta al comportamiento.

## Revisado sin hallazgos
Criterios 1 a 7 de la tarea; version 0.10.0 coherente en plugin.json, marketplace.json, package.json, package-lock.json, src/cli.ts, dist/src/cli.js y README; decisiones del plan aplicadas (Cargo.lock y tomls dentro, `deny.toml`, `.cargo/config` y `rust-toolchain` fuera, lado TS obligatorio en `## Alcance`, nota de umbral de code-quality-reviewer, listas cerradas ampliadas); SKILL.md sin BOM, sin marcas del repo, solo ASCII salvo el guion largo.
