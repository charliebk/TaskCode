---
id: TASK-032
titulo: "Roles de brainstorm, heuristica de complejidad y skills revisoras (items D7 y D6)"
tipo: feature
sprint: 3
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
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

- [x] Existe `scripts/heuristica-complejidad.yml` dentro del plugin con los
      seis pesos de la seccion 16.1 tal cual (decision #15: se aceptan como
      defaults, sin inventar validacion que no hay datos para hacer) y el
      mapeo puntuacion -> nivel (0-1 trivial, 2-3 simple, 4-5 media, 6-7
      compleja, 8+ critica).
- [x] Declara la lista por defecto de palabras de alto riesgo, **generica**:
      cero vocabulario especifico de un proyecto (la seccion 16.1 lo prohibe
      expresamente y deja ese vocabulario a `.taskcode/config.yml`).
- [x] Declara la tabla complejidad -> numero de agentes de brainstorm de la
      decision #2 (0 en `trivial`, hasta 3 en `compleja`, 4 en `critica`),
      que es un lookup determinista y hoy no vive en ningun sitio.
- [x] El fichero es **legible por lo que ya existe en el repo** (parser de
      YAML hecho a mano, cero dependencias de runtime): o encaja en lo que el
      parser soporta hoy, o queda escrito exactamente que le falta para
      leerlo — medido ejecutandolo, no supuesto.

**D7 — roles de brainstorm**

- [x] Existe `agents/` con los cuatro roles de la seccion 2 (arquitectura,
      riesgos/edge-cases, testing/mantenibilidad, especialista de dominio),
      en el formato de agentes que Claude Code carga desde un plugin,
      verificado ejecutando el validador.
- [x] Cada rol declara **que contexto necesita y cual no** (seccion 16.2: el
      de riesgos no recibe el mismo paquete que el de dominio) y tiene la
      salida acotada en forma y longitud (seccion 16.4, punto 4).

**D6 — las cuatro skills revisoras**

- [x] Existen `skills/java-spring-reviewer/SKILL.md`,
      `skills/angular-vue-reviewer/SKILL.md`,
      `skills/csharp-autocad-ifc-reviewer/SKILL.md` y
      `skills/code-quality-reviewer/SKILL.md`, las cuatro con frontmatter
      valido.
- [x] Cada una describe que revisa en su dominio, exige **reproducir
      empiricamente** en vez de leer el diff y opinar, y clasifica sus
      hallazgos CRITICO / IMPORTANTE / MENOR.
- [x] Cada una emite un veredicto en una de las lineas literales que
      `taskctl finish` acepta hoy — extraidas del codigo del parser de
      veredictos, no de la documentacion.
- [x] Cada una declara los patrones de fichero de su dominio, para que
      TASK-018 pueda enrutar por diff real sin volver a inventarlos.

**Comunes**

- [x] Ningun artefacto menciona TaskCode, sus rutas, sus tareas ni sus
      helpers internos: los seis ficheros viajan a proyectos que no son este
      (criterio que ya se aplico en C5 y se verifico buscando marcas del
      repo).
- [x] La validacion del plugin se comprueba con **contraprueba**: romper el
      frontmatter de una copia y ver que el validador la nombra, porque
      `claude plugin validate` solo nombra lo que falla (hallazgo de C5: una
      prueba que solo puede pasar cuando algo esta roto no es una prueba).
- [x] `npm test` sigue en verde (los 3 rojos conocidos de Windows no cuentan)
      y se anade cobertura de lo que sea codigo, si acaba habiendolo.

## Resultado

**Los trece criterios cumplidos.** Nueve artefactos de contenido y cero
lineas en `src/`: el plugin pasa de exponer una skill a exponer **cinco
skills y cuatro agentes**. La suite va de 537 a **630 tests** (627 verdes;
los 3 rojos son los conocidos de Windows nativo).

| Fichero | Item |
|---|---|
| `scripts/heuristica-complejidad.yml` | D7 |
| `agents/brainstorm-{arquitectura,riesgos,testing,dominio}.md` | D7 |
| `skills/{java-spring,angular-vue,csharp-autocad-ifc,code-quality}-reviewer/SKILL.md` | D6 |

**Cuatro agentes en paralelo dentro de la misma rama** para implementar (la
norma del proyecto), tres revisores independientes por ronda, y tres rondas
de revision por pares. Integracion y correcciones en serie.

### Decisiones de diseno que no venian dadas

**El formato del YML es plano porque el lector manda.** El unico parser del
repo (`parseBloqueClaveValor`) lee pares `clave: valor` y listas en linea, y
**falla en seco** ante una lista en bloque — medido, con su error literal. La
alternativa era ampliar el parser, que es codigo nuevo en una tarea de
redaccion y rompe la regla de cero dependencias por comodidad de formato. El
dato se acomoda al lector.

**El fichero dice `alta` donde la metodologia dice `compleja`.** El enum del
plugin (`src/core/task.ts`) es `trivial | simple | media | alta | critica` y
`validateTask` **rechaza** `compleja`. La §16.1 y la decision #2 dicen
`compleja`, y esos documentos divergen del codigo sin que nadie lo hubiera
registrado: 3 de las 32 tareas del repo declaran `alta`, y son justo
TASK-016, 017 y 018. Aqui manda el codigo, porque es lo unico que se puede
leer de una tarea real. **Divergencia documentada dentro del propio fichero**,
sin numeros de seccion: el plugin no distribuye la metodologia, asi que una
referencia a "§16.1" quedaria colgando en un proyecto instalado.

**D4 no forma parte de esta tarea y se descarta**, decidido con Carlos antes
de empezar: la decision #17 lo dejo aplicando solo a `trivial`, y no existe
ni una tarea `trivial` cerrada en todo el historial.

### Revision por pares: tres rondas, 31 hallazgos, cero criticos

| Ronda | Veredictos | Hallazgos |
|---|---|---|
| 1 | los tres frentes piden cambios | 7 importantes, 12 menores |
| 2 | heuristica y roles aprueban; skills piden cambios | 2 importantes, 14 menores |
| 3 | los dos frentes aprueban | 12 menores |

**Todos aplicados**, incluidos los menores. Ninguno se dejo sin corregir.

### El patron que se repitio tres veces

**La correccion de un hallazgo llega sin la red que impide deshacerla.**

- Los patrones de fichero de la skill de Angular se corrigieron midiendo con
  `path.matchesGlob`, pero **la medicion no quedo en la suite**: se podia
  revertir el arreglo entero, o reducir la lista a un solo patron, y todo
  seguia en 17/17 verde.
- La nota del rol de testing se podia revertir **literalmente** a la
  redaccion rota que un IMPORTANTE de la ronda 1 habia corregido: 58/58 verde.
- El TOPE del hotfix se podia **negar en su sitio** (`NO es un TOPE` contiene
  la subcadena que el `match` buscaba), y el revisor reescribio el bloque
  diciendo el defecto corregido con 13/13 verde.

De ahi salieron **siete aserciones que no podian fallar**, encontradas por
sondas de vacuidad — mutaciones que *deberian* poner el test rojo y no lo
hacian. La peor: el test que exige "reproducir empiricamente, no leer el diff
y opinar" se satisfacia con la etiqueta `- Reproduccion:` del esqueleto del
informe, que **otro test obliga a que este presente**. Borrar la seccion
entera de metodo de una skill —2399 bytes— dejaba la suite verde.

### Defectos introducidos por las propias correcciones

Dos de los tres hallazgos de mas peso de la ronda 2 no eran del trabajo
original, sino de los arreglos de la ronda 1:

1. **El recorte de patrones dejo ciega a la skill de Angular.** Al quitar los
   patrones que capturaban NestJS y Next.js se perdio la cobertura de Angular
   >= 20, cuya guia de estilo oficial elimino el sufijo de tipo del nombre de
   fichero (`user-profile.ts`, no `user-profile.component.ts`): **0 de 9**
   rutas capturadas. Y el parrafo describia la perdida como tres casos de
   borde cuando era total. Repuesto a 4 de 9 sin reabrir la fuga (37/37 rutas
   ajenas siguen sin casar), descartando **midiendo** dos de los tres
   candidatos evidentes: `src/app/**/*.scss` y `*.css` fugan a Next.js, que
   deja `globals.css` justo ahi.
2. **La excepcion de hotfix subia agentes en vez de bajarlos.** Escrita como
   sustitucion incondicional, un hotfix que puntua `trivial` pasaba de 0
   agentes a 1: la clave que existe para *abreviar* el brainstorm anadia uno
   donde la tabla no pedia ninguno. Ahora es un tope, con la aritmetica
   aseverada (`min(trivial, hotfix) === 0`) en vez de la prosa.

### Lo que se midio y contradijo lo que alguien daba por hecho

- **El validador oficial comprueba mucho menos de lo que su nombre sugiere**:
  con el frontmatter ausente avisa y sale con **codigo 0**, y **no comprueba
  que existan `name` ni `description`** — borrar la linea `name:` no produce
  ni un aviso. Recorre `agents/` y `skills/` por autodescubrimiento, sin que
  `plugin.json` las declare. Las aserciones estructurales propias son la unica
  red real.
- **Cuatro agentes cazaron un falso verde en su propio metodo de
  verificacion**: tres por mutar con `\n` ficheros que estan en CRLF (la
  mutacion no se aplicaba y el verde no probaba nada) y uno por anclar mal un
  `replace`, que pillaba la ocurrencia de un comentario en vez de la del dato.
- **Una afirmacion de la skill de Angular era falsa**: decia que sus cortes de
  `src/app/` son "los que ningun ecosistema vecino produce", pero eso se midio
  solo contra Next.js. Cinco rutas de Flask, FastAPI, Express y Electron la
  desmienten. El patron se queda —quitarlo reabre el agujero— y lo que se
  corrige es la frase, con las cinco capturas congeladas en el test como un
  tercer estado: ni legitimas ni ajenas, **aceptadas a sabiendas**.
- **`brainstorm-dominio.md` no cedia el rendimiento** como afirmaba el
  encargo que le di al agente que aplicaba el hallazgo. Lo midio, lo dijo, y
  corrigio el rol en vez de relajar la asercion.

### Lo que queda sin red, a proposito

Dos reglas de reparto entre roles (la linea de arbitraje entre riesgos y
dominio, y la vinneta del enfoque en testing) se quedan sin asercion: toda
formulacion probada ataba la **redaccion** del parrafo en vez de la regla, que
es semantica. La ronda 3 juzgo la decision defendible y aporto el argumento:
la unica asercion de esa clase que si se escribio —la del rendimiento— es la
que un revisor consiguio satisfacer con una mencion incidental.

Tambien queda pendiente extraer a un modulo compartido la lista de marcas del
repo, hoy duplicada entre los dos ficheros de test: hacerlo obligaba a que un
agente tocase el fichero de otro.
