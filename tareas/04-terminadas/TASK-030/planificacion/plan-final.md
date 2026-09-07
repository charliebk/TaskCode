# Plan — TASK-030: Auto-commit de taskctl y `.taskcode/config.yml` (items C2 y C4)

Dos items en una tarea, con el precedente de B4/B5 (rama
`feature/b4-b5-artefactos-de-cierre-y-board`). No es una decision estetica:
**el limite de WIP es 1 y lo aplica `taskctl start`**, asi que dos tareas
simultaneas harian abortar la segunda — la herramienta que construyo este
proyecto, funcionando como se diseno. Y los dos items tocan los mismos
ficheros, asi que separarlos en dos ramas solo trasladaria el conflicto al
merge.

Estimacion: **~6h** (C2 ~3h + C4 ~3h).

## Enfoque propuesto

La clave del reparto: **los dos agentes construyen mecanismos aislados en
ficheros nuevos**, y el cableado en la capa de comandos —que es donde
chocarian— se hace despues y en serie.

### C4 — `.taskcode/config.yml` *(agente A)*

Decision #9, resuelta el 2026-09-07: **tres claves, todas opcionales**.

| Clave | Default (= comportamiento de hoy) | Donde esta hoy |
|---|---|---|
| `rama_base` | `develop` | `git.ts:352`, literal |
| `agente_revisor_por_defecto` | `general-purpose` | duplicado en `new.ts` e `import.ts` |
| `limite_wip` | `1` | `wip.ts` |

Lo acordado no es el fichero, es **la forma del mecanismo**, porque es lo que
decide si anadir la cuarta clave dentro de un ano cuesta una linea o una
arqueologia:

1. **Sin fichero, comportamiento identico al de hoy.** El cambio es
   no-breaking y los 472 tests existentes siguen valiendo como red de
   regresion sin tocar ninguno.
2. **Fallo cerrado.** `limite_wip: dos`, o una clave desconocida como
   `limite_wp`, **abortan** con un mensaje que dice que esta mal y cuales son
   las claves validas. Nunca caida al default en silencio: con default
   silencioso el repo dice 2, el plugin usa 1, y no se entera nadie. Misma
   doctrina que el `wx` de `plan.ts` y el parser de veredictos.
   La estrictez con claves desconocidas es segura aqui porque la §7.3
   garantiza que todo el equipo corre la misma version del plugin.
3. **Un solo parser.** El de frontmatter ya soporta este subconjunto exacto
   (escalares, comillas, listas flow, comentarios de linea). Su bucle
   `clave: valor` son ~20 lineas extraibles a `parseBloqueClaveValor()`, que
   pasan a compartir `frontmatter.ts` y el nuevo `config.ts`. Escribir un
   segundo parser YAML a mano es firmar que discrepen dentro de seis meses.
4. **Un solo punto de resolucion.** `resolverConfig(cwd)` devuelve el objeto
   ya con defaults aplicados; ningun comando lee el fichero por su cuenta.
5. **Ninguna clave que nadie lea.** La metodologia menciona `remoto:` y las
   palabras clave de la heuristica de complejidad: pertenecen a trabajo
   bloqueado o sin empezar y **no se declaran**. Una clave escribible que no
   hace nada es peor que no tenerla — este proyecto ya se quemo con
   `codex-review`, documentado en la maquina de estados y inexistente.

### C2 — auto-commit *(agente B)*

Decision #14, resuelta el 2026-09-07: **commitea si, sube solo con
`--push`**. La pregunta eran dos con riesgos distintos: commitear es local y
se deshace con `git reset`, y solo toca `tareas/` y `docs/`; subir publica al
equipo.

Evidencia del coste: TASK-029 costo 9 commits y **4 existian solo porque
`taskctl` no commitea lo que el mismo escribe**.

Reglas de diseno, en orden de importancia:

1. **Se commitean SOLO las rutas que `taskctl` acaba de escribir**, pasadas
   una a una a `git add`. **Nunca `git add -A`.** El guard de §8.3 exige
   workspace limpio, pero solo lo aplican 4 de los 8 comandos: en `start`,
   `review` y `finish` puede haber trabajo de la persona en el arbol, y
   barrerlo dentro de un commit de `taskctl` seria justo la clase de dano que
   esta herramienta existe para evitar.
2. **Nada que commitear, ningun commit.** No se crean commits vacios.
3. **Si el commit falla, se falla ruidosamente.** Un hook o una firma GPG que
   rechacen no se tragan: el usuario tiene que saber que su tarea esta
   escrita pero no registrada.
4. **`--push` empuja la rama actual**, y sin remoto avisa y sigue — misma
   doctrina que C6. El flag ya existe con ese significado en `taskctl pause`,
   asi que no se inventa vocabulario.
5. **Mensajes deterministas**, en el estilo del repo y **sin tildes** (los
   scripts de Git-Flow los procesan): `chore(TASK-NNN): ...`.

### Reparto de ficheros (propiedad exclusiva)

**Agente A (C4)** — `src/core/config.ts` (nuevo), `src/core/frontmatter.ts`
(extraccion), `src/fs/git.ts` (solo `rama_base`), `src/core/wip.ts`,
`src/commands/new.ts`, `src/commands/import.ts`, y sus tests.

**Agente B (C2)** — `src/fs/git-commit.ts` (nuevo), `src/commands/plan.ts`,
`approve.ts`, `review.ts`, `finish.ts`, `start.ts`, `src/cli.ts`, y sus
tests.

**Colision que queda, y como se resuelve**: `new.ts` e `import.ts` necesitan
las dos cosas (el default del revisor de C4 y el commit de C2). Los dos
ficheros son de A; **el cableado del commit en esos dos lo hago yo en la
integracion**, que son dos llamadas. La integracion y la suite completa van
en serie, no las ejecutan los agentes: cuatro `tsc` concurrentes sobre el
mismo `dist/` se pisan.

## Alternativas consideradas

**Dos tareas en paralelo, una por item.** Descartada por el limite de WIP,
que es 1 y lo aplica `start`. Saltarselo para esta tarea seria desactivar en
nuestro propio repo la regla que el plugin impone a los demas.

**Que los agentes cableen tambien `new.ts`/`import.ts`.** Descartada: es
exactamente el fichero donde chocan, y el coste de que lo haga el integrador
son dos llamadas.

**Auto-commit con `git add -A`.** Descartada por lo dicho en la regla 1. Es
mas simple de escribir y puede llevarse por delante trabajo ajeno.

(Version minima de "taskctl plan", TASK-010: sin brainstorm multi-agente
todavia. Un solo agente redacta este plan. TASK-016 anadira brainstorm
en paralelo con roles distintos y un agente unificador para tareas de
complejidad media o mayor.)

## Riesgos o preguntas abiertas

- **C2 diverge de la §8.3 y hay que documentarlo**, no callarlo: el paso 5
  pide tambien subir, con el argumento de que si no, el equipo no ve la tarea
  nueva hasta que alguien la suba a mano. Se acepta esa perdida a cambio de
  que publicar siga siendo un acto consciente.
- **El auto-commit cambia el comportamiento de los 8 comandos a la vez.** Es
  el cambio con mas superficie de todo lo que llevamos. La red es que los 472
  tests existentes aseveran sobre el estado del repo despues de cada comando:
  si alguno commitea de mas, deberian caerse. Que **no** se caiga ninguno
  seria en si mismo una senal a investigar, no un aprobado.
- **`finish` commitea sobre `develop`**, porque ya ha mergeado cuando escribe
  sus artefactos. Es lo que se viene haciendo a mano, pero conviene fijarlo
  con un test para que nadie lo "arregle" mas adelante.
- Los 3 rojos conocidos de Windows siguen ahi y no son regresiones.
