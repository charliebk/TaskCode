---
id: TASK-028
titulo: "Primera skill del plugin: task-workflow/SKILL.md"
tipo: feature
sprint: 2
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-028-primera-skill-del-plugin-task-workflow-s
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

Item C5 del checklist de terminacion. El plugin no expone **ninguna** skill a
Claude Code: todo el discurso de la metodologia sobre "el agente sabe que
hacer" no esta respaldado por ningun artefacto. Escribir la primera,
`skills/task-workflow/SKILL.md`, que explique el ciclo de vida de una tarea,
los comandos reales de `taskctl` y las reglas de proceso.

## Criterios de aceptacion

> `taskctl new` crea la seccion de criterios **vacia** (a diferencia de
> `import`, que los extrae del fichero de origen). Los criterios reales de
> esta tarea vivieron en el `plan-final.md` aprobado; se trasladan aqui tal
> como estaban alli, sin anadir ninguno a posteriori.

- [x] La skill existe en `skills/task-workflow/SKILL.md`, en la raiz del
      plugin, y Claude Code **la descubre** — verificado ejecutando su propio
      inventario de componentes, no suponiendolo.
- [x] Frontmatter valido a la vez para Claude Code y para el spec portable:
      solo `name` y `description`, sin `version`.
- [x] `name` coincide con el nombre de la carpeta, de forma que el comando de
      invocacion es el que la carpeta anuncia.
- [x] Toda afirmacion factual sobre el CLI es cierta **contra el codigo**, no
      contra el README ni la metodologia congelada.
- [x] La skill no menciona comandos que no existen, y avisa de los casos en
      los que la documentacion promete algo que el CLI no cumple.
- [x] Nada especifico de este repo viaja en la skill: se distribuye a otros
      proyectos.
- [x] Cuerpo por debajo de 500 lineas.
- [x] Tests reales nuevos y suite verde.
- [x] Smoke test manual en un clon.
- [x] Revision por pares con agente independiente, hallazgos aplicados.

## Resultado

Cerrada el 2026-09-07. El plugin ya expone una skill:
`taskcode-plugin:task-workflow`, 272 lineas. Antes no exponia ninguna.

**El fichero es corto; el riesgo estaba entero en el contenido.** Un agente se
cree lo que lee en una skill, asi que un flag inventado o un estado mal
ordenado no es un error tipografico: es una fuente de errores *con autoridad*.
Por eso la superficie del CLI se extrajo del **codigo** —`cli.ts`,
`state-machine.ts`, `wip.ts`, `git.ts`— y no del README ni de la metodologia,
que en tres puntos ya no la describen.

**Las tres divergencias que la skill no ha heredado:**

1. **`taskctl codex-review` no existe.** Esta modelado en la maquina de
   estados, aparece en la tabla de la seccion 8 de la metodologia, y `finish`
   ya sabe leer un `informe-codex-N.md`. Pero `cli.ts` no lo despacha y
   **ningun comando genera ese informe**. Consecuencia, reproducida de punta a
   punta por el revisor: poner `revision_codex: true` deja la tarea
   **imposible de cerrar** — `finish` la rechaza y remite a un comando
   inexistente. La skill lo avisa.
2. **El guard de la seccion 8.3 solo lo aplican 4 de los 8 comandos**
   (`new`, `import`, `plan`, `approve`). `start`, `review` y `finish` solo
   comprueban workspace limpio. Y con el workspace limpio **cambia de rama en
   silencio**, en vez de dar el error que muestra la metodologia.
3. **`plan` no es multi-agente**: ni brainstorm en paralelo, ni gatekeeper, ni
   seleccion de skills. Mueve la tarea y escribe un scaffold vacio.

**Decisiones de formato.** Frontmatter con solo `name` y `description`: es la
interseccion entre lo que acepta Claude Code y lo que admite el spec portable,
que rechaza con **error duro** cualquier otra clave. Sin `version`, aunque los
plugins de Anthropic lo usen — la documentacion dice que ese campo no existe y
rompe el empaquetado portable. `name` igual que la carpeta, porque en una
skill de plugin es `name` quien fija el comando de invocacion.

**Que viaja y que no.** La skill se distribuye a proyectos que no son este, asi
que se quedo fuera todo lo de TaskCode: el checklist, `docs/contexto/`, "cero
dependencias de runtime", los nombres de helpers internos. Viaja la regla, no
la instancia. El revisor lo comprobo buscando 20 marcas del repo: cero
coincidencias.

**15 tests nuevos (444 en total, 441 verdes).** Los 3 rojos son los conocidos
de este entorno Windows: uno del symlink (`EPERM`), uno del `chmod` que no
bloquea en NTFS, y uno de CRLF.

### El test que casi nace invertido

El criterio de aceptacion no era "el fichero existe" sino "Claude Code lo
descubre", y ahi hubo que corregir el rumbo a mitad.

La especificacion inicial —escrita por mi— decia: comprobar que
`claude plugin validate` imprime `Validating skill:`. **Es un test
invertido**: el validador solo nombra las skills que *fallan*, asi que ese
test habria pasado unicamente con la skill rota y fallado justo cuando todo
estaba bien. Se detecto porque el validador paso limpio sin mencionar la
skill, y en vez de darlo por bueno se comprobo con dos plugins sinteticos.

La prueba correcta es una **contraprueba**: romper el frontmatter de una
*copia* y comprobar que entonces si la nombra. Discrimina de verdad — el mismo
frontmatter roto en `SKILL.markdown` sale 0 y en silencio, luego la asercion
cambia de veredicto **solo por la ruta**, que es exactamente lo que se queria
medir.

**Distincion que conviene no volver a perder**: `claude plugin validate` **no
es evidencia de descubrimiento**. Mira solo el manifiesto y habria salido 0
sin ninguna skill. La via que si lo prueba es
`claude --plugin-dir <ruta> plugin details <plugin>`, que imprime el
inventario de componentes. El smoke test manual la uso y obtuvo
`Skills (1) task-workflow`, con tres contrapruebas (renombrar a `.markdown`,
mover la carpeta dentro de `.claude-plugin/`, y preguntar sin `--plugin-dir`),
todas dando `Skills (0)`. En una sesion real la skill aparece como
`taskcode-plugin:task-workflow`.

Esa comprobacion **no** se metio en la suite: tarda unos 10 segundos y la
contraprueba ya discrimina. Queda documentada aqui como el metodo del smoke
test manual.

### Revision por pares: dos rondas

**Ronda 1 — cambios solicitados.** 0 criticos, 1 importante, 5 menores.
Ninguno tocaba la veracidad del contenido de la skill, que era el riesgo
principal: el revisor contrasto **toda** afirmacion factual contra `src/` y
ejecutando el CLI, verifico las 7 filas de la tabla del veredicto contra el
parser real, y mato 19 mutantes propios sobre los 15 tests.

1. **IMPORTANTE — `CLAUDE.md` decia 429 tests y en esta rama son 444.** La
   cifra se midio en `develop`, antes de que existieran los 15 tests de esta
   misma tarea. Mergearlo asi habria **reproducido el defecto que la
   correccion venia a arreglar**: un numero desfasado en el fichero que un
   agente lee primero.
2. **MENOR — la skill callaba que la rama base es literalmente `develop`.**
   `git.ts:344` la devuelve hardcodeada para `feature`/`fix`/`release`;
   `hotfix` va contra la principal. La decision D5 del plan afirmaba que era
   configurable, y **eso era falso contra el codigo**: en un repo sin
   `develop` falla el primer comando que escriba en `tareas/`. La skill lo
   dice ahora como prerrequisito.
3. Menores corregidos: la sinopsis de `board` sugeria combinar `--escribir`
   con los filtros y el CLI lo rechaza; "`asignado_a` se rellena solo" no
   decia que solo lo hacen `plan` y `start`; "si aparece un cuarto rojo, es
   tuyo" era demasiado absoluto (hay rojos intermitentes de `EBUSY` en el
   *teardown*); y `CLAUDE.md` clasificaba mal los 3 rojos de Windows — error
   mio, que el smoke test cazo.

**Ronda 2 — aprobada.** Los 6 verificados en un clon limpio, sin regresiones.

### Hallazgo nuevo, documentado sin corregir

**El plugin no se distribuye con un CLI que funcione.** En un clon recien
hecho, `bin/taskctl` falla con `Cannot find module '...\dist\src\cli.js'` y
exit 1: `dist/` esta en `.gitignore`, `.claude-plugin/plugin.json` no declara
`bin` y `package.json` tampoco. No se corrige aqui porque es un problema de
**empaquetado**, preexistente y fuera del alcance de C5 — la skill ya
condiciona su aplicabilidad a que `taskctl` este disponible, asi que no
afirma nada falso. Registrado como item propio.

### Lo que este item deja aprendido

**Una prueba que solo puede pasar cuando algo esta roto no es una prueba.** El
error no fue de implementacion sino de *especificacion*: la escribi yo, sonaba
razonable —"comprueba que el validador nombra la skill"— y era exactamente al
reves. Lo que la salvo fue no aceptar un resultado verde sin entenderlo: el
validador paso sin mencionar la skill, y esa ausencia, en lugar de ignorarse,
se convirtio en la pregunta. Anotado en `docs/contexto/HALLAZGOS.md`.
