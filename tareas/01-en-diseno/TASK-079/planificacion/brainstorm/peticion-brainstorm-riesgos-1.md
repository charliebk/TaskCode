# Peticion de brainstorm — TASK-079, rol riesgos (ronda 1)

- Tarea: TASK-079 — Revisor por pares de dominio para Rust y WASM
- Tipo: feature · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-11-06
- Rol: `brainstorm-riesgos` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-riesgos-1.md`

## Tu pregunta

> ¿Por donde se rompe esto?

## Que miras

- Bordes y estados intermedios: que queda a medias si el proceso muere a mitad.
- Fallos parciales y concurrencia: dos ejecuciones, un recurso ocupado, un permiso denegado.
- Compatibilidad hacia atras con los datos y ficheros que YA existen.
- La vuelta atras: si esto sale mal, como se deshace y que queda inservible.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Que aserciones escribir (es del rol de testing).
- Las reglas de negocio (son del rol de dominio).

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

## Como entregas

Escribe en `salida-brainstorm-riesgos-1.md`, con estas secciones y en este orden:

- Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno
- Estados intermedios y fallos parciales
- Compatibilidad hacia atras
- Vuelta atras
- El riesgo que mas te preocupa (UNO solo)

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
