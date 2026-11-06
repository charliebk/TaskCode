# Brainstorm — TASK-079, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: brainstorm-riesgos (subagente de Claude Code)

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

1. **Las guardas de higiene no miran el revisor nuevo si nadie lo añade a la lista fija.** `test/skills/revisores.test.ts:68-76` fija `REVISORES_DE_DOMINIO` con 3 nombres. Sobre esa lista corren los tests 1, 2, 7 y siguientes: marcas del repo, `DOCUMENTO_INTERNO`, rutas de máquina, el 6 de solape y las tablas 6b/6c/6d, y el veredicto que tiene que aceptar `finish.ts`. Escenario: se crea `skills/rust-wasm-reviewer/SKILL.md` sin tocar esa constante y la suite queda verde sin que el revisor nuevo pase por ninguna guarda. Mitigación: añadirlo a la constante y a la tabla de disparadores de `test/skills/task-workflow.test.ts:572`; el guard 6b exige además al menos una ruta suya en `RUTAS_DE_DOMINIO`.
2. **«Sin solape» se comprueba solo por texto idéntico, no por lo que captura cada patrón.** El test 6 (l. 265) compara patrones idénticos. `src/main/java/**` (java-spring) casaría con un `.rs` que viviera debajo, y un fichero reclamado por dos revisores cae a «sin dominio claro» sin avisar (`revisores.ts:277-284`). Mitigación: comprobar el solape con `matchesGlob` sobre las tablas de rutas.
3. **El límite JS-WASM queda partido entre tres revisores.** `review.ts:554-560` da a cada grupo solo sus ficheros. En un proyecto Rust+Vue+TS el `.rs` va al revisor Rust, los `.vue` a angular-vue y el `.ts` del worker y del cliente al genérico: nadie ve los dos lados del contrato. Mitigación: que la skill obligue a pedir el lado TS cuando cambia una firma `#[wasm_bindgen]`.
4. **El salto al genérico por exceso de dominios deja de ser teórico.** Con 4 dominios, un diff Rust+Vue+Java+C# supera `umbral_dominios: 3` (`revisores.ts:288`). `code-quality-reviewer/SKILL.md:51-58` dice que ese camino «no puede darse»; si no se actualiza, instruye al genérico a negar un caso real. El comentario de `catalogo-skills.yml:74-81` dice «los tres revisores de dominio». El test 5 congela el umbral en 3: no se toca.
5. **Diffs que hoy reciben una petición pasan a recibir dos o tres** (rust, angular y genérico): más agentes por ronda y más veredictos que reunir en `finish`.
6. **Patrones duplicados en dos sitios.** `catalogo-skills.yml` copia los `patrones_archivo` de cada SKILL.md y ningún test compara las dos copias. Mitigación: copiar la lista literal.
7. **Ficheros generados del límite WASM.** `pkg/*.js`, `pkg/*.d.ts` y `pkg/*_bg.wasm` de wasm-pack no los excluye `CONFIG_DEFAULTS.excluir_de_revision` (`config.ts:208-213`). No conviene añadir `**/pkg/**` a los patrones Rust.

## Estados intermedios y fallos parciales

- Sin estados a medias en ejecución: el catálogo se relee de `skills/*` en cada `taskctl review`.
- El a medias es de contenido: un SKILL.md sin entrada en el yml enruta pero `plan` no lo propone; un bloque `skill_6_*` sin subir `total_skills` aborta `taskctl plan` entero (fail-closed). El bloque va como `skill_6`, al final.
- Etiquetas genéricas (`backend`, `numerica`) empatarían con java-spring en prioridad 10: solo `rust`, `wasm`, `wasm-bindgen`, `cargo`.
- La ruta del home de Cargo empieza por `~/`, que está en `RUTAS_DE_MAQUINA`: no escribirla.

## Compatibilidad hacia atras

- La copia instalada en caché se indexa por versión (supuesto): si la versión no sube, el cambio no llega.
- Una tarea en revisión durante la actualización: la ronda N con el genérico y la N+1 fragmentada; supuesto que `finish` lo acepta.
- `Cargo.lock`: `**/*.lock` ya lo excluye por defecto (`config.ts:210`), así que un patrón para él no cambia nada salvo en proyectos que redefinan `excluir_de_revision`.
- Entradas `origen: externo`: hoy no hay ninguna; una externa exige `marketplace` (`catalogo-skills.ts:304-320`).
- Huecos aceptados: `.cargo/config` sin extensión, `rust-toolchain.toml`, `rustfmt.toml`, `clippy.toml`, `deny.toml`; documentarlos, no ampliar con `**/*.toml`.

## Vuelta atras

- `git revert` y una versión más; sin datos migrados.
- Una versión publicada no se retira y el número queda gastado.
- Los informes `*-rust-wasm-reviewer.md` de tareas cerradas quedan como historia.

## El riesgo que mas te preocupa (UNO solo)

El primero: si `rust-wasm-reviewer` no se añade a `REVISORES_DE_DOMINIO` en `test/skills/revisores.test.ts`, la suite da verde sobre un revisor que nadie ha comprobado (marcas, enlace a revision.md, veredicto, enrutado positivo y negativo).

## Desacuerdo previsto

Con arquitectura: el objetivo promete revisar «el límite JS-WASM» con patrones que solo capturan el lado Rust. O se acota la promesa o la skill exige pedir el lado TS.
