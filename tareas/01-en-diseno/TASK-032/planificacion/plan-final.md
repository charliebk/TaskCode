# Plan — TASK-032: Roles de brainstorm, heuristica de complejidad y skills revisoras (items D7 y D6)

## Enfoque propuesto

Nueve artefactos de contenido, **cero lineas en `src/`**. Ningun comando
nuevo, ninguna firma cambiada: lo que se entrega son ficheros que otros
consumiran (TASK-016, 017 y 018) y que Claude Code carga.

| # | Fichero | Item |
|---|---|---|
| 1 | `scripts/heuristica-complejidad.yml` | D7 |
| 2 | `agents/brainstorm-arquitectura.md` | D7 |
| 3 | `agents/brainstorm-riesgos.md` | D7 |
| 4 | `agents/brainstorm-testing.md` | D7 |
| 5 | `agents/brainstorm-dominio.md` | D7 |
| 6 | `skills/java-spring-reviewer/SKILL.md` | D6 |
| 7 | `skills/angular-vue-reviewer/SKILL.md` | D6 |
| 8 | `skills/csharp-autocad-ifc-reviewer/SKILL.md` | D6 |
| 9 | `skills/code-quality-reviewer/SKILL.md` | D6 |

Mas los tests que los aseveran, en `test/skills/` y `test/agents/`.

### Cuatro cosas medidas antes de escribir el plan, no supuestas

1. **El parser YAML del repo lee pares `clave: valor` planos y nada mas.**
   `parseBloqueClaveValor` (`src/core/frontmatter.ts:114-135`) parte por el
   primer `:`, y `parseScalar` (`:197`) resuelve `null`/`~`, `true`/`false`,
   enteros, cadenas entrecomilladas y **listas en linea `[a, b, c]`**. No hay
   anidamiento: un mapa dentro de una clave no se parsea, se toma como texto.
   Consecuencia de diseno: `heuristica-complejidad.yml` se escribe **plano**,
   para que D1/D2 lo lean con el parser que ya existe y no haya que anadir
   uno nuevo — la regla de "cero dependencias" se respeta escribiendo el dato
   a la medida del lector, no ampliando el lector.
2. **El veredicto que acepta `taskctl finish`** sale de `veredictoAprobado`
   (`src/commands/finish.ts:82-93`), no de la documentacion: una linea que
   empiece por `- Veredicto:` cuyo valor **empiece** por `aprobada`, sin
   `pendiente` ni `cambios-solicitados`, y **todas** las lineas de veredicto
   del informe deben aprobar. Las cuatro skills citan esa forma literal.
3. **El formato de un agente de plugin** es un `.md` con frontmatter
   `name` / `description` (+ `tools`, `model` opcionales) y el prompt en el
   cuerpo — verificado sobre los agentes ya instalados en la maquina.
4. **`claude plugin validate` pasa hoy en verde** sobre este plugin
   (ejecutado: OK, "Validation passed"), asi que cualquier rojo posterior
   sera de lo que anada esta tarea.

### Contenido de `heuristica-complejidad.yml`

Los seis pesos de la seccion 16.1 tal cual (decision #15), el mapeo
puntuacion -> nivel, la lista **generica** de palabras de alto riesgo, y la
tabla complejidad -> numero de agentes de brainstorm de la decision #2 (0 en
`trivial`, hasta 3 en `compleja`, 4 en `critica`) — que hoy no vive en ningun
sitio y que TASK-016 necesita como lookup.

Todo en claves planas, del estilo `peso_etiqueta_extra: 1`,
`nivel_media_max: 5`, `agentes_critica: 4`,
`palabras_riesgo: [migracion, ...]`.

### Los cuatro roles de brainstorm

Los de la seccion 2 (arquitectura, riesgos/edge-cases, testing/mantenibilidad,
dominio). Cada uno declara **que contexto necesita y cual no** (seccion 16.2:
darles a todos el paquete completo es justo el gasto que la seccion evita) y
tiene la **salida acotada** en forma y longitud (16.4.4).

Anotacion honesta, no un cambio: la seccion 16.4.2 propone que el rol de
testing podria ser una checklist del unificador en vez de un agente. La
decision #2 fijo cuatro roles y cuatro se escriben; que el unificador lo
degrade a checklist es cosa de TASK-016, y aqui se deja el rol disponible.

### Las cuatro skills revisoras

Cada una: que revisa en su dominio, la exigencia de **reproducir
empiricamente** (clonar, ejecutar, construir el caso que rompe antes de
reportarlo), la clasificacion CRITICO / IMPORTANTE / MENOR, la linea de
veredicto literal, y los **patrones de fichero** de su dominio para que
TASK-018 enrute por diff real sin volver a inventarlos.

### Como se ejecuta

Cuatro agentes en paralelo **dentro de la misma rama** (norma del proyecto),
con reparto sin solape de ficheros: (1) el YAML, (2) los cuatro roles, (3)
java-spring + angular-vue, (4) csharp-autocad-ifc + code-quality. La
integracion, los tests comunes y el checklist, en serie despues.

## Alternativas consideradas

- **Ampliar el parser para leer YAML anidado** y escribir el fichero con la
  forma "bonita" de la seccion 16.1. Descartado: mete codigo nuevo en una
  tarea de redaccion y rompe el principio de cero dependencias por
  comodidad de formato. El dato se acomoda al lector.
- **Una rama por item (D6 y D7 separados).** Descartado por Carlos el
  2026-09-07: ninguno depende del otro, el limite de WIP es 1, y separarlos
  duplica la ceremonia sin anadir control. Precedente: TASK-030 (C2+C4).
- **Escribir solo tres roles de brainstorm** (16.4.2, testing como checklist).
  Descartado: contradice la decision #2, que es explicita en cuatro.
- **Redactar tambien `scripts/catalogo-skills.yml`.** Es TASK-017 (D2), no
  esta tarea. Aqui solo se dejan los `patrones_archivo` dentro de cada skill
  para que ese catalogo los pueda recoger sin reinventarlos.

## Riesgos o preguntas abiertas

1. **El riesgo esta entero en el contenido, no en la mecanica.** Un agente se
   cree lo que lee: un peso inventado o un rol mal acotado es una fuente de
   errores *con autoridad*. Mitigacion: todo lo que se afirme sobre el CLI
   sale del codigo (`finish.ts`, `frontmatter.ts`), como en C5.
2. **Los nueve ficheros viajan a proyectos que no son este.** Ninguno puede
   mencionar TaskCode, sus rutas ni sus helpers. Se verifica buscando marcas
   del repo, como hizo la revision de C5.
3. **El validador solo nombra lo que falla**, asi que "paso limpio" no prueba
   que mirase los ficheros nuevos. Cada artefacto se asevera con
   **contraprueba**: romper el frontmatter de una copia y comprobar que el
   validador la nombra. Patron ya escrito en
   `test/skills/task-workflow.test.ts`.
4. **`agents/` no lo habia validado nunca este plugin.** Que `plugin
   validate` pase hoy no dice que valide agentes; si resulta que no los mira,
   se documenta medido en vez de afirmar que "estan validados".
5. **Sin dato para los pesos.** La decision #15 ya lo asume: no hay ninguna
   tarea `trivial`, `compleja` ni `critica` en el historial, asi que tres de
   los cinco niveles no tienen con que contrastarse. Se escriben como
   defaults declarados, no como resultado medido.
