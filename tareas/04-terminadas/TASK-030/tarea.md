---
id: TASK-030
titulo: "Auto-commit de taskctl y .taskcode/config.yml (items C2 y C4)"
tipo: feature
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-030-auto-commit-de-taskctl-y-taskcode-config
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


## Criterios de aceptacion

Transcritos del plan aprobado (`planificacion/plan-final.md`), porque
`taskctl new` deja esta seccion vacia — a diferencia de `import`, que los
extrae del fichero de entrada.

**C4 — `.taskcode/config.yml`**
- [x] Tres claves opcionales: `rama_base`, `agente_revisor_por_defecto`, `limite_wip`. Ninguna otra se declara.
- [x] Sin fichero, el comportamiento es identico al de hoy y los 472 tests existentes pasan **sin tocar ninguno**.
- [x] Cada clave surte efecto de verdad (no solo se lee): `rama_base: integration` cambia la rama que devuelve `resolveBaseBranchForTipo`.
- [x] Valor invalido o clave desconocida **abortan** enumerando las claves validas. Nunca caida al default en silencio.
- [x] Un solo parser: el bucle `clave: valor` de `frontmatter.ts` se extrae y se comparte. No hay un segundo parser YAML.
- [x] Un solo punto de resolucion (`resolverConfig`); ningun comando lee el fichero por su cuenta.
- [x] Desaparece la duplicacion de `DEFAULT_AGENTE_REVISOR` entre `new.ts` e `import.ts`.

**C2 — auto-commit**
- [x] `taskctl` commitea las rutas que escribe, **una a una**. En ningun sitio hay un `git add -A`.
- [x] Un fichero sucio de la persona **no** entra en el commit de `taskctl` y sigue sucio en el arbol despues.
- [x] Sin nada que commitear no se crea commit vacio.
- [x] Un commit que falla (hook, firma) se reporta; no se traga.
- [x] `--push` sube la rama actual; sin remoto avisa y sale 0.
- [x] `taskctl import` se puede ejecutar dos veces seguidas sin commitear en medio.
- [x] Mensajes deterministas, estilo del repo y **sin tildes**.

**Transversal**
- [x] Divergencia con la §8.3 (que pide tambien subir) documentada, no callada.
- [x] Suite en verde: los 3 rojos conocidos de Windows y ninguno mas. Si al cablear el auto-commit **no se cae ningun test existente**, se investiga por que antes de darlo por bueno.
- [x] Revision por pares independiente, con hallazgos clasificados y documentados incluidos los no corregidos.
- [x] Checklist, contadores y estimaciones de C2 y C4 actualizados.

## Resultado

Dos items del checklist en una tarea (precedente: B4/B5), porque el limite de
WIP es 1 y lo aplica `taskctl start`: dos tareas simultaneas habrian hecho
abortar la segunda. Dos agentes en paralelo con ficheros en propiedad
exclusiva, y la integracion en serie.

**C2 — auto-commit.** `taskctl` commitea las rutas que escribe, **una a una**,
y en ningun sitio hay un `git add -A` sin pathspec. `--push` sube la rama
actual y sin remoto avisa y sigue. Quita los 4 commits manuales por tarea que
pague en TASK-029 y cierra la trampa de `import` dos veces seguidas.

**C4 — `.taskcode/config.yml`.** Tres claves opcionales (`rama_base`,
`agente_revisor_por_defecto`, `limite_wip`), fallo cerrado ante valor o clave
invalida, un solo punto de resolucion y **un solo parser**: el bucle
`clave: valor` de `frontmatter.ts` se extrajo en vez de escribir un segundo
parser YAML.

### Lo que resulto falso en el plan, y lo corrigio quien lo toco

1. **«En `start`, `review` y `finish` puede haber trabajo de la persona en el
   arbol porque no aplican `ensureBaseBranchReady`.»** Media verdad: no
   aplican ese guard, pero **si llaman a `isWorkspaceClean`** y abortan con el
   arbol sucio. La regla de no usar `add -A` se sostiene por otra razon, mejor
   que la mia: la **ventana entre esa comprobacion y el commit**, donde corren
   hooks de Git-Flow y —sobre todo— puede haber otro proceso escribiendo. En
   este proyecto eso no es exotico: son varios agentes sobre la misma copia de
   trabajo, exactamente lo que pasaba mientras se implementaba.
2. **«El parser de frontmatter soporta comentarios `#`.»** Soporta comentarios
   *inline*, no de linea entera. Un fichero de configuracion sin comentarios
   de linea es inservible. Se resolvio con una opcion **opt-in**, para no
   cambiar en silencio lo que `tarea.md` acepta.

### La costura entre los dos frentes

Se cayeron **14 tests existentes** al cablear el auto-commit, y eso era la
senal que el plan pedia vigilar (que no cayera ninguno habria significado que
los tests no miran el estado de Git tanto como creemos).

Cuatro cayeron justo en la costura que el plan dejo sin repartir:
`new.test.ts` e `import.test.ts` son de C4, asi que C2 no los toco, y C4 no
cablaba el auto-commit, asi que nunca los vio fallar. Todos hacian
`git add -A && git commit` a mano entre llamadas. **Se les quito el commit
manual en vez de hacerlos tolerantes**: su existencia documentaba justo la
limitacion que este item elimina.

Uno era semantico: `review` calculaba `commitRevisado` como HEAD, y ahora HEAD
avanza despues. Pasa a ser `HEAD~1`, que es lo correcto — el revisor revisa el
codigo de la tarea, no el commit que contiene la peticion de revision de si
misma.

### Revision por pares

**Ronda 1: cambios-solicitados** — 0 criticos, 2 importantes, 5 menores.

- **IMPORTANTE**: `limite_wip` era la unica clave **sin prueba de cableado**.
  Lo verifique a mano con el CLI y no lo fije con un test, asi que deshacer la
  linea de `start.ts` no rompia nada — y esa linea ya se habia caido una vez.
- **IMPORTANTE**: la lista de ficheros del resultado se calculaba **antes** del
  commit. Con un hook de `pre-commit` que hace `git add`, el CLI decia
  "1 fichero" cuando Git habia registrado 2: **en el unico escenario donde la
  regla se rompe, la herramienta afirmaba lo contrario**. El revisor fue
  honesto en la atribucion — que el hook meta ficheros es semantica de Git en
  modo `--only`, reproducible sin taskctl —, pero mentir sobre el resultado si
  era nuestro. Ahora se relee del commit real y se avisa nombrando al intruso.
- **MENOR con reencuentro**: un `.taskcode` que es un fichero caia al default
  **en silencio en Windows**, contradiciendo su propio comentario. `ENOTDIR` en
  POSIX, `ENOENT` en Windows: la misma trampa que costo una ronda entera en
  TASK-027, en otro fichero y con otro autor. El arreglo no fue anadir otro
  errno, fue **preguntarle al sistema de ficheros**.

**Ronda 2: APROBADA** — 0 criticos, 0 importantes, 4 menores. El revisor monto
una copia aislada con linea base identica (529/3) para que las contrapruebas
no tuvieran ruido, y comprobo que cada arreglo deshecho por separado tumba
exactamente un test. Siete vectores contra el aviso de intrusos (renombrados,
`core.autocrlf`, no-ASCII, commit raiz): ninguno dispara en falso.

### No corregido, documentado

- **Un `.taskcode` que es un enlace colgante** sigue cayendo al default en
  silencio (`statSync` da ENOENT). Mismo patron que el corregido, en su
  version exotica. El revisor no pide corregirlo.
- **Sin verificar**: `.taskcode` como symlink a un fichero y `config.yml` como
  symlink colgante — `EPERM` al crearlos en Windows sin modo desarrollador.
- El aviso de `finish --push` sobre `main` y el tag **no tiene test**;
  verificado a mano contra un `origin` bare y el texto dice la verdad.
- El mensaje al commitear **durante un merge** sugiere tres causas que no son
  la real. Cosmetico.
- **`board --escribir` no commitea**, a proposito: es el unico comando sin
  ninguno de los dos guards, asi que seria la unica via por la que `taskctl`
  commitearia en una rama arbitraria y con el arbol en cualquier estado.
- **Divergencia con la §8.3**, deliberada: el paso 5 pide tambien subir. Se
  acepta la perdida (una tarea nueva no llega al equipo sola) a cambio de que
  publicar sea un acto consciente.
- El borrador de la persona dentro de la carpeta de tarea **no es alcanzable
  por el CLI**: los dos guards abortan antes. Cerrado a favor del codigo con
  evidencia nueva de la ronda 2.

### Metricas

532 tests (60 nuevos); 529 verdes y los 3 rojos conocidos de este entorno
Windows. Estimacion: ~6h planificadas (C2 ~3h + C4 ~3h).
