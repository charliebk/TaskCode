# Informe de revision — TASK-032 (ronda 3, cierre)

- Commit revisado: 10a686d187e18837739183cf3efa8214751834d9
- Revisor: dos agentes independientes en paralelo, ninguno de las rondas 1 ni 2
- Veredicto: aprobada con doce menores documentados y corregidos

Ronda de cierre. A los dos revisores se les dio el mismo encargo que en la
ronda 2 —atacar las correcciones, no repetir la revision— mas una lectura de
los artefactos como producto terminado, y la instruccion explicita de que
**pedir cambios por algo que no los merece cuesta tanto como aprobar algo
roto**.

**Los dos frentes aprobados. Cero criticos, cero importantes, doce menores**,
y el veredicto del segundo revisor resume donde estabamos: *"lo que queda son
menores, todos en la red de regresion y ninguno en el producto: el YML dice
lo correcto, los cuatro roles dicen lo correcto, y la suite esta en su verde
conocido"*.

Aun asi se aplicaron los doce, porque dos de ellos dejaban sin proteccion
justo lo que la ronda anterior acababa de arreglar.

Que se ejecuto: la suite completa cuatro veces (629 tests, 626 verdes, los 3
rojos conocidos de Windows, sin cuarto rojo), 20 mutaciones verificadas por
md5 antes de leer el resultado, una bateria propia de 72 rutas enrutadas con
`path.matchesGlob` en las dos direcciones, y el validador oficial con su
contraprueba.

## El patron de la tarea, por tercera vez

Las tres rondas encontraron la misma forma de fallar: **la correccion de un
hallazgo llega sin la red que impide deshacerla.**

- Ronda 2: los patrones de Angular se midieron con `matchesGlob`, pero la
  medicion no quedo en la suite — se podia revertir el arreglo entero
  dejandolo todo verde.
- Ronda 3: la nota del rol de testing se podia revertir literalmente a su
  redaccion rota, y el TOPE del hotfix se podia negar en su sitio.

## Hallazgos

### Aserciones incapaces de fallar

**[MENOR] 1. El test que exige reproducir empiricamente no podia ponerse rojo**
- Donde: `test/skills/revisores.test.ts`, `assert.ok(texto.includes('reproduc'))`
  sobre el fichero entero en minusculas.
- Que pasa: lo satisface la etiqueta `- Reproduccion:` del esqueleto del
  informe, que **otro test exige que este presente**. Estructuralmente
  incapacitado para fallar.
- Reproduccion: borrados los 2399 bytes de la seccion `## Reproducir antes de
  reportar` de `angular-vue-reviewer` (los seis pasos, las tecnicas por area),
  con md5 antes y despues para probar que el fichero cambio: **21/21 verde**.
- Impacto: la exigencia de reproducir empiricamente es el nucleo metodologico
  de estas skills —lo que las separa de "leer el diff y opinar"— y era lo
  unico sin red.
- **Corregido**: anclado a un encabezado `##` fuera del bloque cercado y con
  minimo de pasos numerados, mas contraprueba. Las cuatro skills se ponen
  rojas al quitarles la seccion; y tambien si se deja el encabezado y se
  borran solo los pasos.

**[MENOR] 2. El TOPE del hotfix se podia negar en su sitio, y era su unica red**
- Donde: `test/core/heuristica-complejidad.test.ts`.
- Que pasa: el anclaje por bloque de la ronda 2 cerraba la reubicacion, pero
  no la negacion: `NO es un TOPE` sigue conteniendo la subcadena del `match`.
  Y la otra mitad de la correccion (`agentes_brainstorm_trivial === 0`) no
  calculaba ninguna interaccion — era el mismo aserto por separado que la
  ronda 2 ya habia senalado como insuficiente.
- Reproduccion: reescrito el bloque diciendo literalmente el defecto que la
  ronda 2 corrigio (`el MAYOR entre`, `trivial SUBE a 1`): **13/13 verde**.
- **Corregido**: `doesNotMatch` con alternancia y, sobre todo, la aritmetica
  real — `Math.min(trivial, hotfix) === 0` —, que fija el tope sin depender
  de la prosa.

**[MENOR] 3. El guard de la regla de conteo era sensible a mayusculas**
- Se calco de la sonda de la ronda 2, que estaba escrita en mayusculas.
  `No se cuenta una vez por entrada distinta, sino por ocurrencia` pasaba en
  verde. **Corregido** con `/i` y alternancia (`no|nunca|jamas`).

**[MENOR] 4. La asercion de la nota del rol de testing se satisfacia con una enumeracion decorativa**
- La nota abre listando los cinco niveles, y esa lista sola cumplia el
  "nombra los cinco valores del enum". Reproduccion: cambiar el tramo de
  degradacion de `media`/`alta` a `trivial`/`simple` dejaba **58/58 verde**,
  con la nota afirmando que el rol se degrada justo donde el YML da 0 y 1
  agentes — contradiccion frontal con la tabla, invisible para la suite.
- **Corregido**: el tramo se **deriva de la tabla del YML** (degradacion son
  los niveles con 1 < agentes < 4; conservacion el que tiene 4) y se
  contrasta contra lo que la nota declara.

**[MENOR] 5. La cesion de rendimiento se satisfacia con una mencion incidental**
- `sinCeder` solo exigia que la palabra apareciese en `## Que NO miras`, en
  cualquier sentido: una vinneta que dijera "tu rendimiento no se mide en
  cuantas vinnetas escribes" dejaba **58/58 verde** con el rol sin ceder nada.
- **Corregido**: se exige una frase que nombre el rendimiento **y** al rol que
  lo reclama, derivando el nombre del dueno en vez de escribirlo a mano.
- **Efecto lateral medido**: `brainstorm-dominio.md` NO cedia asi —nombraba el
  rendimiento sin nombrar a arquitectura—, al contrario de lo que afirmaba el
  encargo. Se corrigio el rol, no la asercion: relajarla habria sido aflojar
  justo lo que el hallazgo pedia endurecer.

**[MENOR] 6. Un quinto rol de brainstorm dejaba las dos suites verdes**
- El test comprobaba que no *faltaran* ficheros, no que no *sobraran*, y el
  tope de 4 del otro test era un literal. Anadir `brainstorm-seguridad.md`
  dejaba **71/71 verde** con el YML afirmando "los cuatro roles" y
  `critica: 4`, ya falsos. **Corregido** aseverando el conjunto exacto.

**[MENOR] 7. `direccion_de_riesgo` era una asercion vacua** — la clave no ha
existido nunca y el `deepEqual` ya prohibe cualquier clave no listada: no
podia fallar sin que otras dos fallasen antes. **Corregida** a lo que queria
decir (ninguna clave empieza por `direccion_`).

### Afirmaciones que no eran ciertas

**[MENOR] 8. La skill de Angular afirmaba algo falso sobre sus propios patrones**
- Donde: `skills/angular-vue-reviewer/SKILL.md`.
- Que pasa: justificaba los tres cortes de `src/app/` diciendo que son "los
  que **ningun ecosistema vecino produce**". Esa medicion se hizo solo contra
  Next.js. Cinco rutas la desmienten, verificadas: `src/app/templates/base.html`
  y `src/app/templates/index.html` (Flask y FastAPI con src-layout),
  `src/app/static/index.html`, `src/app/views/mail.html` (Express con
  plantillas) y `src/app/index.html` (Electron). Y once lineas mas abajo la
  propia skill descarta `src/lib/**/*.html` con el motivo exacto que aqui no
  aplicaba: el mismo descalificador, dos resultados opuestos.
- **Corregido sin tocar el patron**: renunciar a el reabriria el agujero de
  Angular >= 20, que es peor. Se corrige lo que el documento afirma (que
  discrimina frente a Next.js, y que a cambio se aceptan plantillas de backend
  servidas desde `src/app/`), y las cinco capturas quedan **congeladas en el
  test como tercer estado** — ni legitimas ni ajenas: aceptadas a sabiendas.
  Si alguien acota el patron, el test obliga a volver a la skill.

**[MENOR] 9. El "criterio unificado" daba respuestas opuestas para el mismo caso**
- `angular-vue` decia que sin discriminante "no se amplia, se documenta el
  hueco"; `csharp`, que "se conserva la cobertura y se documenta en el
  informe". Aplicada la de `csharp` al caso de `highlight.ts` saldria
  conservar `src/app/**/*.ts`, lo contrario de lo que `angular-vue` hace. Y
  `csharp` afirmaba que "en Angular ese discriminante existe" cuando la otra
  skill documenta que para la mitad de Angular >= 20 no existe.
- **Corregido**: una sola frase identica en ambas que nombra la variable que
  de verdad decide — si renunciar deja el dominio sin revisor. Con ella los
  dos casos salen bien y dejan de parecer opuestos.

**[MENOR] 10. La frase de cabecera del hotfix afirmaba en absoluto lo que la siguiente corrige**
- "Un hotfix se planifica con UN SOLO agente" leida sola es la lectura de
  sustitucion, y bajo el tope es falsa: un hotfix trivial se planifica con
  cero. **Corregido**: "COMO MUCHO".

**[MENOR] 11. La tabla da cuantos agentes, no cuales, y solo un nivel lo declaraba**
- En `trivial` y `critica` no hay que elegir; en `media` la nota lo declara
  abierto; pero en `simple` y en un hotfix topado en 1 hay que elegir uno de
  cuatro roles y no lo decia nadie, mientras la seccion se anunciaba como "un
  lookup, nadie tiene que decidirlo en caliente". **Corregido**, y ajustada
  esa frase de apertura, que contradecia al parrafo nuevo.

**[MENOR] 12. `**/src/app/app.config.ts` captura la carpeta de aplicacion de un NestJS en Nx**
- El mas bajo de los doce. Ningun generador de `@nx/nest` crea ese fichero, y
  un diff de Nest que lo tocase tocaria ademas `*.module.ts` o `*.service.ts`,
  que no casan. **Documentado como hueco aceptado, sin tocar el patron.**
  Queda declarado que la afirmacion sobre los generadores de Nx no se pudo
  reproducir: exigiria ejecutar el generador.

## Lo verificado sin hallazgo

- **Los tres patrones repuestos de Angular son portantes uno a uno**: quitar
  cualquiera de los tres pone la suite roja. El descarte de `.css` y `.scss`
  esta bien medido: reponer `src/app/**/*.css` pone rojo por
  `src/app/globals.css` de Next.js.
- **La tabla de enrutado no es decorativa**: bloquea los ocho candidatos que
  la skill dice haber descartado, y 21 de los 35 patrones son portantes.
- **La lista blanca de herramientas es solida**: `mcp__fs__write_file`,
  `bash` en minusculas, `Bash(git status:*, ls:*)` y `Read-Write` caen todos.
- **La nota del rol de testing cuadra exactamente con la tabla del YML** en
  los cuatro tramos.
- **Las dos decisiones de dejar algo sin red son defendibles**, y el hallazgo
  5 lo respalda: la unica asercion de esa clase que si se escribio es la que
  el revisor consiguio satisfacer con una mencion incidental.
- **Portabilidad**: cero marcas de este repo en los nueve artefactos, con
  listas propias de los revisores mas amplias que las de los tests.
- **Enrutado tras las correcciones, sin regresion**: 32/32 rutas legitimas
  llegan a su revisor, 37/37 ajenas no casan con ninguno, y 6 capturas
  aceptadas y congeladas.

## Estado final

**630 tests, 627 verdes.** Los 3 rojos son los conocidos de Windows nativo
(dos por `chmod` sin efecto en NTFS, uno por finales de linea), verificados
uno a uno en las tres rondas y sin cuarto rojo en ninguna.
