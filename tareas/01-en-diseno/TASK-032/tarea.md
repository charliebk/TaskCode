---
id: TASK-032
titulo: "Roles de brainstorm, heuristica de complejidad y skills revisoras (items D7 y D6)"
tipo: feature
sprint: 3
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: true
rama: feature/task-032-roles-de-brainstorm-heuristica-de-comple
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-07
actualizado: 2026-09-07
dependencias: []
---
## Objetivo

Dar cuerpo a los dos artefactos que la metodologia da por existentes y hoy no
existen, y sin los cuales la Fase D no puede construirse encima:

- **D7** — `agents/` con los roles de brainstorm y
  `scripts/heuristica-complejidad.yml` con los pesos de la seccion 16.1. Los
  consume TASK-016 (brainstorm paralelo) y TASK-017 (catalogo de skills), asi
  que hacerlos despues obligaria a rehacer trabajo.
- **D6** — las cuatro skills revisoras del catalogo de la seccion 9
  (`java-spring`, `angular-vue`, `csharp-autocad-ifc`, `code-quality`), que
  son las que dan sentido al enrutado por dominio de TASK-018.

Es trabajo de redaccion, no de codigo: no hay ningun comando nuevo. El riesgo
no esta en la mecanica sino en el contenido — un agente se cree lo que lee, y
un rol mal acotado o un peso inventado es una fuente de errores *con
autoridad* (leccion de C5 / TASK-028).

Los dos items van en la misma rama porque ninguno depende del otro y el
limite de WIP es 1; mismo precedente que TASK-030 (items C2 y C4).

## Criterios de aceptacion

**D7 — heuristica de complejidad**

- [ ] Existe `scripts/heuristica-complejidad.yml` dentro del plugin con los
      seis pesos de la seccion 16.1 tal cual (decision #15: se aceptan como
      defaults, sin inventar validacion que no hay datos para hacer) y el
      mapeo puntuacion -> nivel (0-1 trivial, 2-3 simple, 4-5 media, 6-7
      compleja, 8+ critica).
- [ ] Declara la lista por defecto de palabras de alto riesgo, **generica**:
      cero vocabulario especifico de un proyecto (la seccion 16.1 lo prohibe
      expresamente y deja ese vocabulario a `.taskcode/config.yml`).
- [ ] Declara la tabla complejidad -> numero de agentes de brainstorm de la
      decision #2 (0 en `trivial`, hasta 3 en `compleja`, 4 en `critica`),
      que es un lookup determinista y hoy no vive en ningun sitio.
- [ ] El fichero es **legible por lo que ya existe en el repo** (parser de
      YAML hecho a mano, cero dependencias de runtime): o encaja en lo que el
      parser soporta hoy, o queda escrito exactamente que le falta para
      leerlo — medido ejecutandolo, no supuesto.

**D7 — roles de brainstorm**

- [ ] Existe `agents/` con los cuatro roles de la seccion 2 (arquitectura,
      riesgos/edge-cases, testing/mantenibilidad, especialista de dominio),
      en el formato de agentes que Claude Code carga desde un plugin,
      verificado ejecutando el validador.
- [ ] Cada rol declara **que contexto necesita y cual no** (seccion 16.2: el
      de riesgos no recibe el mismo paquete que el de dominio) y tiene la
      salida acotada en forma y longitud (seccion 16.4, punto 4).

**D6 — las cuatro skills revisoras**

- [ ] Existen `skills/java-spring-reviewer/SKILL.md`,
      `skills/angular-vue-reviewer/SKILL.md`,
      `skills/csharp-autocad-ifc-reviewer/SKILL.md` y
      `skills/code-quality-reviewer/SKILL.md`, las cuatro con frontmatter
      valido.
- [ ] Cada una describe que revisa en su dominio, exige **reproducir
      empiricamente** en vez de leer el diff y opinar, y clasifica sus
      hallazgos CRITICO / IMPORTANTE / MENOR.
- [ ] Cada una emite un veredicto en una de las lineas literales que
      `taskctl finish` acepta hoy — extraidas del codigo del parser de
      veredictos, no de la documentacion.
- [ ] Cada una declara los patrones de fichero de su dominio, para que
      TASK-018 pueda enrutar por diff real sin volver a inventarlos.

**Comunes**

- [ ] Ningun artefacto menciona TaskCode, sus rutas, sus tareas ni sus
      helpers internos: los seis ficheros viajan a proyectos que no son este
      (criterio que ya se aplico en C5 y se verifico buscando marcas del
      repo).
- [ ] La validacion del plugin se comprueba con **contraprueba**: romper el
      frontmatter de una copia y ver que el validador la nombra, porque
      `claude plugin validate` solo nombra lo que falla (hallazgo de C5: una
      prueba que solo puede pasar cuando algo esta roto no es una prueba).
- [ ] `npm test` sigue en verde (los 3 rojos conocidos de Windows no cuentan)
      y se anade cobertura de lo que sea codigo, si acaba habiendolo.
