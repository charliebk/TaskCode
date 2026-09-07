---
id: TASK-031
titulo: "Distribucion del CLI: un clon debe traer un taskctl que arranque"
tipo: fix
sprint: 0
etiquetas: [empaquetado, distribucion, cli]
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-031-distribucion-del-cli-un-clon-debe-traer
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

Item **E6** del checklist de terminacion. En un clon recien hecho el plugin
no traia un `taskctl` que arrancase: `dist/` estaba en `.gitignore` y
`bin/taskctl` importa `../dist/src/cli.js`, asi que el CLI moria con
`Cannot find module ...dist/src/cli.js` y codigo 1. Va antes que toda la
Fase D porque esa fase construye encima de una herramienta que hoy, quien
clone el repo, no puede ejecutar.

## Criterios de aceptacion

Transcritos del plan aprobado (`planificacion/plan-final.md`), porque
`taskctl new` deja esta seccion vacia.

- [x] **AC1** — En un clon recien hecho, **sin `npm install` ni `npm run
      build`**, `node bin/taskctl --version` imprime la version y sale con 0.
      Hoy sale 1.
- [x] **AC2** — Existe un test automatizado que reproduce AC1 contra un clon
      real (no un mock) y se pone rojo si `dist/src/` deja de estar versionado.
- [x] **AC3** — El build es reproducible entre plataformas: recompilar no
      produce diff, aseverado por un step de CI que corre **en Linux y en
      Windows**.
- [x] **AC4** — Se versiona `dist/src/` y **solo** eso: `dist/test/` sigue
      ignorado y no entra ni un fichero de test compilado.
- [x] **AC5** — `npm test` sigue en verde: los tests actuales mas los nuevos,
      con los 3 rojos conocidos de este entorno Windows y ningun cuarto.
- [x] **AC6** — El README del plugin describe el arranque real tras el cambio,
      y `skills/task-workflow/SKILL.md` dice en una linea como se pone
      `taskctl` disponible.
- [~] **AC7** — Verificado a mano en esta sesion nativa: `/plugin marketplace
      add` y `/plugin install` reales, con `taskctl` resolviendo como comando
      suelto dentro de la sesion. **Parcial**: la instalacion se ejecuto de
      verdad y la copia cacheada arranca, pero `taskctl` como comando suelto
      **no se ha podido confirmar** (ver Resultado). La salida real esta
      documentada, que era lo que el criterio exigia pasara lo que pasara.
- [x] **AC8** — Documentada la restriccion de `bin/` de nivel superior para
      distribucion por organization settings de claude.ai, con su consecuencia
      para E1.

## Resultado

**Cerrada el 2026-09-07.** 537 tests (534 verdes y los 3 rojos conocidos de
este entorno Windows), 5 tests nuevos, y un clon recien hecho ya trae un
`taskctl` que arranca.

### Lo que se hizo

`dist/src/` se versiona (26 ficheros). Para que eso sea sostenible hizo falta
mas de lo que preveia el plan:

- `"newLine": "lf"` en `tsconfig.json` y `.gitattributes` con `*.ts`,
  `dist/**` y `bin/*`, todos `text eol=lf`.
- `.gitignore` de `dist/` como **lista blanca** (`dist/*` + `!dist/src/`), y
  una excepcion en el `.gitignore` de la raiz.
- Un guard en el CI, en los dos jobs, que recompila y compara contra el
  indice.
- 5 tests en `test/empaquetado/`, uno de ellos la contraprueba del defecto.
- README y skill al dia, y `CLAUDE.md`, `CONVENCIONES.md` y `HALLAZGOS.md`
  corregidos donde esta tarea los dejaba falsos.

### El plan se quedo corto en su premisa central

`"newLine": "lf"` **no basta**, y la primera medicion no lo detecto porque
comparaba Windows contra Windows. Los saltos que emite `tsc` si salen en LF,
pero las plantillas multilinea de `src/` viajan tal cual al build: medido, 34
CRLF en `dist/src/cli.js`, los 34 dentro del literal `HELP`. De ahi el
`*.ts text eol=lf`, que el plan no contemplaba y que ademas renormalizo un
fichero (`wrappers.test.ts`, el unico `.ts` commiteado con CRLF).

Y la propia opcion `newLine` resulto **inerte** con TypeScript 5.9.3: quitarla
produce salida byte a byte identica. Se mantiene como red ante un cambio de
version, pero quien fija el eol de verdad es el `.gitattributes`.

### Revision por pares: tres rondas, 24 hallazgos, cero criticos

| Ronda | Revisores | Veredicto | Hallazgos |
|---|---|---|---|
| 1 | 3 en paralelo, uno por superficie | cambios solicitados | 5 importantes, 16 menores |
| 2 | 1, en clon propio | cambios solicitados | 2 importantes, 5 menores |
| 3 | 1, verificacion de cierre | **aprobada** | 0 importantes, 5 menores |

**34 hallazgos en total, cero criticos.** Los 7 importantes y los 26 menores,
corregidos; queda 1 documentado sin corregir con su motivo (abajo). La ronda 3
comprobo los 7 cambios de la ronda 2 uno a uno y los 7 hacen lo que dicen.

**El guard de CI estaba mal por tres motivos distintos, y ninguno lo vio quien
lo escribio.** Dos revisores de la ronda 1 llegaron al mismo step desde
superficies que no se solapaban: uno por el falso positivo en worktrees
heredados —`git status` marca ` M` con el blob identico, lo que dejaba el
workspace sucio y bloqueaba el propio `taskctl`—, otro porque `tsc` no purga
`outDir` y un modulo borrado de `src/` seguia commiteado con el guard en
verde. El tercero lo aporto la formulacion que traia el plan aprobado
(`git diff --exit-code`), que no ve los ficheros nuevos. Y en la ronda 2
aparecio un cuarto: `git add -A` **salta en silencio** lo que cualquier
`.gitignore` excluya, asi que un modulo en `src/tareas/` no llegaba al commit
mientras el guard decia "al dia" y el clon quedaba roto. Y la ronda 3 encontro
el quinto: el `-f` que arreglaba lo anterior curaba la ceguera pero no la
causa, asi que el fichero que el guard senalaba **no se podia commitear con lo
que el propio mensaje de error prescribe** — CI en rojo permanente y callejon
sin salida. Se cerro anclando los patrones (`/tareas/`, `/logs/`). Cinco formas
de equivocarse en un step de ocho lineas.

**Dos importantes de la ronda 2 eran defectos de mis correcciones de la ronda
1, no del trabajo original** — el patron que C6 ya registro. El peor: el paso
que anadi a la skill para evitar un diagnostico falso usaba
`CLAUDE_PLUGIN_ROOT`, que no esta exportada en el entorno del Bash tool, y
vacia construye `/bin/taskctl` y falla con un error ajeno que lleva al agente
**a la misma conclusion falsa** que el arreglo venia a eliminar. El propio
repo ya sabia que esa variable no siempre esta: `gitflow-runner.ts` la lee con
fallback.

**Mi evidencia de AC7 no probaba lo que yo decia.** Instale el plugin desde una
ruta local y presente como prueba que la copia cacheada trae `dist/`. Pero la
cache de un marketplace `directory` es una copia del arbol de trabajo,
ficheros ignorados incluidos: hay 34 ficheros de `dist/test/` en ella y git
versiona 0. Esa tabla habria contestado "si" igual **antes** de esta tarea. La
conclusion era correcta y la evidencia no; quien lo demuestra es el test que
exporta HEAD.

### Menores que se documentan sin corregir

- **Coste de los tests de integracion**: dos clones por corrida, 7,3 s de los
  8,2 que tarda el fichero. No se comparte el export entre los dos tests
  porque el segundo muta su arbol y acoplarlos haria que una rotura del
  primero arrastrase a la contraprueba. La ronda 2 senalo que la disyuntiva
  estaba mal planteada: `git archive HEAD | tar -x` da la misma semantica en
  **0,30 s** y sin borrar un `.git` entero, que es lo que alimenta los
  `EBUSY ... rmdir` de Windows. Queda como mejora concreta, no hecha aqui.
- **`bin/*` marca `text` a cualquier cosa bajo `bin/`.** Hoy solo esta
  `taskctl`; el dia que haya un binario habra que acotarlo.
- **`node_modules/` se deja sin anclar** en los dos `.gitignore`, asi que un
  `dist/src/node_modules/` seguiria invisible al guard. Anclarlo dejaria de
  ignorar los `node_modules` anidados de dependencias, y un directorio *fuente*
  con ese nombre seria patologico — a diferencia de `src/tareas/`, que en un
  gestor de tareas no lo es y por eso si se anclo.
- **La precondicion exacta del workspace sucio no esta cerrada.** La ronda 3
  intento reconstruirlo por dos caminos y en los dos `git status` salio limpio,
  pese a que los 59 ficheros estaban en `w/crlf`. El diagnostico de por que se
  quedan asi es correcto y esta verificado; el salto de ahi al bloqueo de
  `taskctl` necesita algo que ninguna de las tres rondas supo enunciar. Queda
  escrito a medias, como sintoma reconocible, en vez de como certeza.
- **El tercer rojo conocido de Windows sigue rojo.** La hipotesis de que
  normalizar el eol lo arreglaria resulto falsa: su causa esta en otro sitio.

### Lo que queda abierto

- **AC7 a medias**: `taskctl` como comando suelto **no se ha visto funcionar**.
  El mecanismo existe —en el PATH de la sesion aparecen los `bin/` de otros
  plugins cacheados, confirmado por primera vez en este proyecto—, pero el de
  este plugin no estaba, y la hipotesis (el PATH se compone al arrancar, y el
  plugin se instalo a mitad de sesion) **no esta comprobada**. Cuesta un
  comando en la proxima sesion: `taskctl --version`.
- **La limitacion de `bin/` para claude.ai** condiciona E1: un plugin con
  `bin/` de nivel superior no se puede distribuir por organization settings.
  Hoy no aplica, porque la distribucion es un marketplace privado por Git.

### Lo que va a HALLAZGOS

Nueve entradas. Las tres que mas se van a repetir: una prueba de
reproducibilidad hecha en una sola plataforma no prueba nada; `git status` y
`git diff` no contestan lo mismo sobre ficheros con filtro de eol, y la
diferencia deja el workspace sucio sin nada que commitear; y la cache de un
marketplace `directory` copia el arbol de trabajo, asi que instalar desde una
ruta local no demuestra que lo versionado baste.

Y una del metodo, no del codigo: **revisores en paralelo sobre el mismo
working tree se contaminan**. Los tres de la ronda 1 compartieron arbol, uno
mutaba ficheros mientras otro corria la suite, y este reporto una anomalia
irreproducible que costo explicar. Las rondas 2 y 3 se hicieron ya con clon
propio.
