# Verificacion selectiva por impacto

Cuando la verificacion completa del proyecto tarda mucho (decenas de minutos),
repetirla en cada fin de turno y en cada ronda de revision no compensa si la
tarea no ha tocado esa parte. El proyecto puede declarar dos verificaciones:

| Clave | Que corre | Quien la usa |
|---|---|---|
| `comando_verificacion` | **todo**, siempre | `finish` y el guardian de merges: la puerta de integracion |
| `comando_verificacion_selectiva` | solo lo afectado por los cambios | el hook `Stop` (fin de turno) y `taskctl review` |

La selectiva solo acelera las rondas. **Antes de integrar se exige siempre la
completa** en verde sobre el commit que entra, aunque las rondas pasaran con la
selectiva. Por eso la selectiva sin la completa es un error de configuracion.

## Declarar las dos claves

```yaml
# .taskcode/config.yml
comando_verificacion: "npm test"                                  # la completa
comando_verificacion_selectiva: "node scripts/verificar-selectiva.js"
timeout_verificacion_selectiva: 600                               # opcional, segundos
```

Sin `comando_verificacion_selectiva`, todo funciona como siempre: el `Stop`
corre la completa y `review` no verifica nada.

## Lo que recibe el comando

- Se ejecuta en la raiz del repo, con el shell del sistema, tal cual.
- La **rama base** de la tarea llega en la variable de entorno `RAMA_BASE`
  (la de integracion, o la principal en un hotfix). No se anade nada al
  comando.
- Verde es salir con codigo 0. Cualquier otro codigo, o pasarse del timeout,
  es rojo.

## Como escribir el clasificador

El mapa de capas es del proyecto: que carpetas son la capa de datos, cuales el
frontend, que tests cubren cada una. El script hace tres cosas:

1. **Listar lo cambiado respecto a la base, incluido el arbol de trabajo.**
   `git diff --name-only $RAMA_BASE...HEAD` no ve lo que aun no se ha
   commiteado, y el fin de turno corre con el arbol sucio. Suma
   `git diff --name-only HEAD` y `git ls-files --others --exclude-standard`.
2. **Traducir cada fichero a lo que hay que correr**, con una tabla propia
   (por ejemplo `src/datos/**` -> tests de datos; `web/**` -> tests del
   frontend).
3. **Correr solo eso**, y salir con su codigo.

## Que cambios fuerzan la completa (corre todo)

El clasificador falla cerrado: ante la duda, corre todo. Como minimo:

- no se puede calcular el diff (`RAMA_BASE` vacia, la base no existe en local,
  clon superficial): corre todo, nunca salgas con 0 sin haber corrido nada;
- un fichero que no cae en ninguna capa de la tabla;
- dependencias y build: lockfiles, `package.json`, `Cargo.toml`, `pom.xml`,
  ficheros de proyecto, configuracion de compilacion o de tests;
- codigo compartido por varias capas, migraciones y esquemas;
- el propio clasificador o su tabla.

## Lo que no puede hacer

- **La completa no se convierte en el clasificador.** `comando_verificacion`
  no depende de argumentos ni de `RAMA_BASE`: corre todo, siempre. Si
  reescribes tu verificador para que decida por impacto, que sea un comando
  aparte.
- **No escribir ficheros en el arbol** (informes, artefactos): ignoralos en
  `.gitignore`. `review` aborta si la verificacion deja el arbol sucio.
- **No regenerar el informe de cobertura** que mide la completa: en las
  rondas con selectiva, la peticion de revision no muestra cobertura porque
  el informe podria ser parcial.

## Que pasa en cada sitio

- **Fin de turno (`Stop`)**: con tarea en curso en la rama, corre la
  selectiva; en rojo devuelve el turno con su salida. Guarda el resultado
  aparte del de la completa: un verde de la selectiva nunca abre un merge.
  Con `rutas_documentacion`, un turno de solo documentacion corre antes la
  comprobacion de documentacion (o nada): ver la seccion siguiente.
- **`taskctl review`**: corre la selectiva antes de escribir la ronda (en la
  primera ronda, despues de integrar la base en la rama; las rondas
  incrementales no la integran). En rojo aborta: no abre ronda y la tarea sigue
  en curso; el mensaje dice si la base quedo integrada. En verde, la peticion de
  revision lleva una seccion con el tipo (selectiva o comprobacion de
  documentacion), el comando, el resultado y su salida. Sin la selectiva,
  `review` no verifica nada.
- **`taskctl finish`**: corre la completa; en rojo no integra y dice como
  correrla.
- **`taskctl doctor`**: avisa si hay completa y falta la selectiva.

## Tareas de solo documentacion: `rutas_documentacion`

Una tarea que solo cambia documentacion no necesita la suite de tests. El
proyecto declara que rutas son documentacion y, si todo lo que cambia la
tarea frente a la base cae en ellas, `finish` no corre `comando_verificacion`:

```yaml
# .taskcode/config.yml
comando_verificacion: "npm test"
rutas_documentacion: [docs/**, README.md, "*.md"]        # patrones git :(glob)
comando_verificacion_documentacion: "node scripts/comprobar-docs.js"   # opcional
```

- **Las rutas se leen de la rama base**, no de la rama de la tarea: una tarea
  no puede ampliarlas para eximirse. Si la tarea cambia `.taskcode/config.yml`,
  corre la completa.
- **Sin anclar**: `*.md` es solo la raiz del repo; `docs/**` es esa carpeta.
  Las mayusculas cuentan siempre, tambien con `core.ignorecase`: un cambio en
  `Docs/` no casa con `docs/**` y esa tarea corre la completa (el lado seguro).
- **La carpeta `tareas/` cuenta siempre** como documentacion: la cambia toda
  tarea. Sus tests held-out los sigue corriendo su propia puerta.
- **Ante la duda, la completa**: si no se puede calcular el diff, si sale
  vacio, si mezcla documentacion y codigo, o si mueve un fichero de codigo a
  una ruta de documentacion (cuentan las dos rutas del renombre).
- Con `comando_verificacion_documentacion`, se ejecuta ese (con
  `timeout_verificacion`) y su rojo bloquea igual que el de la completa. Su
  verde se guarda aparte: nunca abre la puerta de la completa.
- `finish` dice en su salida que corrio y por que, y lo anota en `tarea.md`
  (seccion `## Verificacion de documentacion`).
- Un `release` corre siempre la completa: lleva a la principal todo lo
  acumulado, aunque su diff propio sea solo el CHANGELOG.
- Lo aplican `finish` y el **guardian de merges**, con la misma decision: un
  merge a mano de una tarea de solo documentacion pasa sin el verde de la
  completa (con comprobacion de documentacion, con su verde guardado). El
  guardian lee las rutas de la config de la rama destino y no aplica la
  exencion si el comando hace algo mas que UN merge (o script de cierre),
  cambiar de carpeta o de rama y consultar (`git status|log|diff|show`): un
  `git commit`, otro merge, una redireccion (`>`), `$(...)` o un script antes
  del merge podrian cambiar lo que entra. Haz el commit en otro comando. Tampoco
  en un release, ni si cambian los tests held-out (`tareas/.../aceptacion/`),
  que alli cuentan como codigo.
- **Fin de turno y `review`** usan la misma decision (una sola funcion),
  sobre todo lo que cambia la tarea frente a la base, nunca sobre el ultimo
  turno ni sobre lo que cambio desde la ronda anterior: una ronda 2 que solo
  corrige documentacion sigue corriendo la selectiva si la tarea toco codigo.
  - El fin de turno cuenta tambien lo no commiteado: un fichero de codigo
    modificado, preparado o sin seguimiento saca el turno de «solo
    documentacion». Sin selectiva corre la completa; en un turno de solo
    documentacion, la comprobacion de documentacion, o nada si no se declara.
    Con el arbol sucio no guarda el resultado de esa comprobacion.
  - `review` solo verifica si el proyecto declara la selectiva. Con ella, una
    ronda de solo documentacion corre la comprobacion de documentacion en su
    lugar, o nada si no se declara, y la peticion lo dice (asi el revisor no
    lee ese verde como tests pasados) y no muestra la cobertura. Sin la
    selectiva no corre nada, tampoco la de documentacion: donde antes no se
    corria nada, no aparece ninguna ejecucion.
  - Con la selectiva declarada, los dos deciden igual para el mismo diff, y
    `review` reutiliza el resultado del fin de turno si el arbol no cambio. Sin
    ella difieren a proposito: el fin de turno corre algo y `review` nada.
  - Un hotfix no se exime en ninguno de los dos (resolver su base puede ir a la
    red). Una config de la base invalida no bloquea: la verificacion de
    siempre con un aviso. Los held-out de `tareas/.../aceptacion/` cuentan como
    documentacion, igual que en `finish`, que los corre con su propia puerta.
  - **Cambio de comportamiento** si ya declarabas `rutas_documentacion`: los
    turnos y rondas de solo documentacion dejan de correr la completa o la
    selectiva.

### Que `.md` NO son documentacion

No declares `**/*.md`. Hay ficheros Markdown que son instrucciones que se
ejecutan, y romperlos rompe el comportamiento del agente:

- skills (`skills/**/SKILL.md` y sus guias) y agentes (`agents/*.md`);
- `CLAUDE.md`, `AGENTS.md` y similares;
- comandos (`.claude/commands/*.md`) y plantillas que lee el codigo;
- cualquier `.md` que un test lea o valide.

Declara carpetas concretas de documentacion para personas (`docs/**`,
`README.md`, `CHANGELOG.md`).
