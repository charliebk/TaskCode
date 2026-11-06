---
id: TASK-079
titulo: "Revisor por pares de dominio para Rust y WASM"
tipo: feature
sprint: 0
etiquetas: [skills, revisores, rust, wasm]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
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
tokens_revision: 4026078
creado: 2026-11-06
actualizado: 2026-11-06
dependencias: []
---
## Objetivo

Hoy ninguna skill revisora reclama ficheros Rust, asi que taskctl review manda todo el Rust y el WASM al generico code-quality-reviewer, que no revisa ownership, errores, el limite JS-WASM ni la numerica en f64. Los proyectos que instalan el plugin con nucleo Rust compilado a WASM necesitan un revisor de dominio propio, empaquetado en skills/ del plugin, que es lo unico que lee resolverRutaSkills.

## Criterios de aceptacion
- [ ] Existe skills/rust-wasm-reviewer/SKILL.md con frontmatter name/description, enlace a ../task-workflow/revision.md y bloque yaml con rol: revisor y patrones_archivo que incluyen **/*.rs, **/Cargo.toml, **/build.rs y **/.cargo/config.toml, con el criterio de amplitud justificado
- [ ] cargarCatalogoRevisores() devuelve rust-wasm-reviewer entre los revisores de dominio, comprobado por un test en test/core/revisores.test.ts
- [ ] clasificarPorDominio parte un diff con un .rs y un .vue en dos grupos, rust-wasm-reviewer y angular-vue-reviewer, comprobado por un test
- [ ] scripts/catalogo-skills.yml registra rust-wasm-reviewer con rol revisor, prioridad 10 y etiquetas de Rust y WASM, total_skills sube en consecuencia y test/core/catalogo-skills.test.ts pasa
- [ ] Los patrones de rust-wasm-reviewer no se solapan con los de ningun otro revisor (test de solape de test/skills/revisores.test.ts en verde)
- [ ] README del plugin, CHANGELOG y la documentacion que lista los revisores nombran rust-wasm-reviewer y la version del plugin sube segun la convencion
- [ ] npm test en verde (salvo los tres rojos conocidos de Windows) en la rama de la tarea

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-06T18:45:22Z | plan | automatico | persona |
| 2026-11-06T18:57:43Z | approve | automatico | persona |
| 2026-11-06T19:39:24Z | start | automatico | persona |
| 2026-11-06T20:01:34Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-06T18:57:11Z | diseno | agente:a0945abf517696826,aacf0a92d54aa51b9,a539e553c5c399498 | 80 | 213536 | 2017152 | 37030 | 54 | 2267798 |
| 2026-11-06T20:18:03Z | revision | agente:a33724f6940d3d651 | 64 | 157685 | 3848856 | 19473 | 4 | 4026078 |
