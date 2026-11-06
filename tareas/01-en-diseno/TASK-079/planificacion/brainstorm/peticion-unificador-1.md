# Peticion al unificador — TASK-079 (ronda 1)

- Tarea: TASK-079 — Revisor por pares de dominio para Rust y WASM
- Tipo: feature · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-11-06
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **simple**
- Heuristica (4 puntos): **media**
- Senales encontradas:
  - etiquetas_adicionales: 4 etiquetas (3 mas alla de la primera) (+3)
  - criterios_aceptacion: 7 criterios (umbral: 5) (+1)

Los dos niveles NO coinciden. Se lanzan 2 roles, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

## Como consolidas

1. Lee las salidas de arriba. **Si alguna falta o esta sin rellenar, sigue adelante con las que haya y escribe en el plan cual falto**: un plan con un punto de vista menos, dicho, vale mas que un plan que finge estar completo.
2. **No promedies.** Donde dos roles discrepen, el plan dice quien propone que, cual gana y por que. Un desacuerdo resuelto con una frase intermedia que no defiende nadie es la peor salida posible de este paso.
3. **Si no discrepan en nada, eso es la alarma, no la nota de calidad**: significa que los roles recibieron el mismo contexto o que alguno no hizo su trabajo. Dilo en el plan.
4. Cada afirmacion del plan que venga de un rol se atribuye a ese rol.

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Los desacuerdos entre roles y como se resuelve cada uno.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

## Enunciado de la tarea

### Objetivo

````
Hoy ninguna skill revisora reclama ficheros Rust, asi que taskctl review manda todo el Rust y el WASM al generico code-quality-reviewer, que no revisa ownership, errores, el limite JS-WASM ni la numerica en f64. Los proyectos que instalan el plugin con nucleo Rust compilado a WASM necesitan un revisor de dominio propio, empaquetado en skills/ del plugin, que es lo unico que lee resolverRutaSkills.
````

### Criterios de aceptacion

````
Existe skills/rust-wasm-reviewer/SKILL.md con frontmatter name/description, enlace a ../task-workflow/revision.md y bloque yaml con rol: revisor y patrones_archivo que incluyen **/*.rs, **/Cargo.toml, **/build.rs y **/.cargo/config.toml, con el criterio de amplitud justificado
cargarCatalogoRevisores() devuelve rust-wasm-reviewer entre los revisores de dominio, comprobado por un test en test/core/revisores.test.ts
clasificarPorDominio parte un diff con un .rs y un .vue en dos grupos, rust-wasm-reviewer y angular-vue-reviewer, comprobado por un test
scripts/catalogo-skills.yml registra rust-wasm-reviewer con rol revisor, prioridad 10 y etiquetas de Rust y WASM, total_skills sube en consecuencia y test/core/catalogo-skills.test.ts pasa
Los patrones de rust-wasm-reviewer no se solapan con los de ningun otro revisor (test de solape de test/skills/revisores.test.ts en verde)
README del plugin, CHANGELOG y la documentacion que lista los revisores nombran rust-wasm-reviewer y la version del plugin sube segun la convencion
npm test en verde (salvo los tres rojos conocidos de Windows) en la rama de la tarea
````
