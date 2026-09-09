---
id: TASK-017
titulo: "Catálogo de skills determinista con selección en dos pasos"
tipo: feature
sprint: 3
etiquetas: []
complejidad: alta
modelo_sugerido: opus
estado: en-revision
plan_aprobado: true
rama: feature/task-017-catalogo-de-skills-determinista-con-sele
asignado_a: charlie.bk@gmail.com
agente_revisor: typescript-reviewer
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-09
dependencias: [TASK-010]
---
## Objetivo

Implementar la seleccion de skills descrita en la seccion 6.6 de
`docs/PROPUESTA_METODOLOGIA.md`: un catalogo propio y versionado en
`scripts/catalogo-skills.yml` que declare, por cada skill (propio del
plugin o externo de un marketplace), sus campos `id`, `origen`, `rol`
(revisor | ejecucion), `prioridad`, `etiquetas`, `patrones_archivo` y
`descripcion`.

La seleccion es de dos pasos y determinista primero: `taskctl plan`
cruza las `etiquetas` de la tarea contra el catalogo y calcula, sin
LLM, un top-N de candidatos por solape. El desempate entre candidatos
que empatan en solape usa primero la `prioridad` declarada en el
catalogo (seccion 16.4.1); solo si tambien empatan en prioridad se
recurre a un juicio barato con Haiku sobre ese top-N (2-3 candidatos,
nunca sobre el catalogo entero) para decidir cual encaja mejor con el
objetivo real de la tarea.

El resultado de la seleccion (que skill se eligio y por que regla —
solape, prioridad o desempate por LLM) queda registrado para poder
auditarlo despues. Si el candidato elegido es `origen: externo` y no
esta instalado, se anota como sugerencia de instalacion manual
(`/plugin install X@Y`); nunca se instala nada automaticamente.

Queda fuera de alcance a proposito el enrutado del agente revisor por
el diff real usando `patrones_archivo` (seccion 16.5) — eso es
TASK-018. Aqui el catalogo declara ese campo, pero todavia no lo
consume nadie; la seleccion de `agente_revisor` sigue basandose en
`etiquetas`.

## Criterios de aceptacion
- [x] Crea `scripts/catalogo-skills.yml` con los skills propios y externos que el equipo ya usa.
- [x] La selección es determinista primero (heurística por etiquetas, tipo y ficheros tocados) y solo recurre a un LLM para desempatar.
- [x] Registra en la tarea qué skills se seleccionaron y por qué regla, para poder auditarlo después.
- [x] Tests de la heurística con casos de empate y de no coincidencia.

## Resultado

Implementado el catalogo determinista de dos pasos completo: `scripts/catalogo-skills.yml`
(parser fail-closed en `src/core/catalogo-skills.ts`), el algoritmo de seleccion en
`src/core/plan-desempate-skill.ts` (solape -> prioridad -> desempate por LLM con
`leerGanadorDesempate` fail-closed), la comprobacion de instalacion de skills externos en
`src/core/plugin-instalado.ts` (solo lectura via subproceso, nunca instala nada), y el
cableado completo en `src/commands/plan.ts`, que deja `skills_recomendados` y
`regla_seleccion_skill` registrados en el frontmatter de la tarea para poder auditar la
decision despues.

| Fichero | Rol |
|---|---|
| `scripts/catalogo-skills.yml` | catalogo real de skills propios y externos |
| `src/core/catalogo-skills.ts` | parser YAML a mano, fail-closed |
| `src/core/plan-desempate-skill.ts` | plantillas de peticion/salida y lectura del ganador del desempate por LLM |
| `src/core/plugin-instalado.ts` | comprobacion de solo lectura de si un skill externo esta instalado |
| `src/commands/plan.ts` | cableado del algoritmo de dos pasos en `taskctl plan` |

### Decisiones de diseno que no venian dadas

- El desempate por LLM se resuelve con un fichero de peticion y uno de salida en
  `planificacion/`, siguiendo el mismo patron que el brainstorm por roles (TASK-016): la
  persona responde en un fichero, `taskctl plan` se vuelve a invocar y lee el ganador. No se
  invoca un LLM desde dentro del proceso.
- `leerGanadorDesempate` es fail-closed a proposito: si la primera linea no vacia del fichero
  de salida no coincide EXACTAMENTE con el `id` de un candidato vigente, no elige nada al azar
  y deja la tarea sin `skills_recomendados`, repitiendo el aviso de desempate pendiente.
- `comprobarSkillInstalado` distingue tres estados (`instalado` / `no-instalado` /
  `no-verificable`) en vez de dos: cualquier fallo o forma inesperada del subproceso colapsa a
  `no-verificable`, nunca a `no-instalado` (arriesgaria sugerir instalar algo que ya esta) ni a
  `instalado` (esconderia un candidato real que falta).

### Revision por pares: 2 rondas (la 2 en dos pasadas independientes), 22 hallazgos, cero criticos

| Ronda | Veredicto | Hallazgos |
|---|---|---|
| 1 | cambios-solicitados | 0 criticos, 4 importantes, 7 menores |
| 2 (1a pasada) | cambios-solicitados | 0 criticos, 1 importante, 4 menores |
| 2 (2a pasada) | cambios-solicitados | 0 criticos, 2 importantes, 4 menores |

El agente revisor (`typescript-reviewer`, `informe-revision-1.md`) reprodujo empiricamente
sobre un worktree aislado, incluida la suite completa y sondas propias contra el binario real
`claude plugin list --json`.

**IMPORTANTE — corregidos los 4:**

- **IMP-1**: `comprobarSkillInstalado` no podia devolver nunca `'instalado'` porque el formato
  real de `claude plugin list --json` usa `id` con forma `"plugin@marketplace"`, no un campo
  `marketplace` suelto (verificado con salida real del binario). Ademas el fallo cerrado no se
  disparaba: la comprobacion de forma se detenia en `Array.isArray`, sin mirar los elementos,
  asi que cualquier array no vacio se leia como `no-instalado` en vez de `no-verificable`.
  Corregido: si ningun elemento tiene forma reconocible (objeto con `id` string) el resultado es
  `no-verificable`. La comparacion de esta ronda todavia miraba solo el tramo del `marketplace`
  del `id` en vez del `id` completo — eso se corrigio despues, en IMP-5 (ronda 2), que dejo el
  codigo actual en `interpretarResultadoPluginList` (`plugin-instalado.ts`).
- **IMP-2**: el aviso de desempate y `peticionDesempateSkill` imprimian rutas de la carpeta de
  ORIGEN de la tarea, calculadas antes de `moveTareaFile`; tras el primer `taskctl plan` esas
  rutas ya no existian en disco. Corregido recalculando las rutas contra la carpeta de destino
  despues del move, igual que ya se hacia para el paquete de brainstorm.
- **IMP-3**: `cargarCatalogoSkills()` se invocaba despues del `mkdir`/`writeFile` del scaffold
  de `plan-final.md`, asi que un catalogo mal formado abortaba dejando el workspace sucio, y el
  guard de §8.3 bloqueaba el reintento con un mensaje sin relacion con la causa real. Corregido
  moviendo la carga del catalogo junto a la de la heuristica, antes de cualquier escritura.
- **IMP-4**: `leerGanadorDesempate` solo miraba la primera linea no vacia del fichero de
  salida, pero el propio scaffold que `taskctl plan` genera empieza con un encabezado Markdown
  (`# Salida del desempate de skill — TASK-XXX`), asi que responder debajo del encabezado (el
  patron natural, igual que en el brainstorm) se descartaba en silencio con el mismo aviso
  repetido. Corregido: la funcion salta lineas que empiezan por `#` antes de buscar el id.

**MENOR — 2 corregidos, 5 aceptados sin corregir:**

- **MEN-2** (corregido): el aviso de skill no instalado afirmaba `"-- no esta instalado"`
  incluso cuando el estado real era `no-verificable` (el subproceso fallo o no se pudo
  interpretar), aseverando algo que el codigo acababa de declararse incapaz de comprobar.
  Corregido: la redaccion distingue `"no se ha podido comprobar si esta instalado"` de `"no
  esta instalado"` segun el estado real, pero en ambos casos se sigue sugiriendo el mismo
  `/plugin install X@Y` (decision que el propio informe comparte).
- **MEN-3** (corregido): `total_skills` no tenia cota superior; un valor como `5000000`
  colgaba el comando ~20s y terminaba en un `RangeError: Set maximum size exceeded` crudo que
  `cli.ts` no reconoce. Corregido con `MAX_TOTAL_SKILLS = 1000` y un `CatalogoSkillsError`
  accionable si se supera.
- **MEN-1** (aceptado sin corregir): `TIMEOUT_MS = 5000` para el subproceso de
  `claude plugin list --json` tiene un margen fino frente a los ~3.5-4.5s medidos en la
  maquina del revisor; bajo carga real puede colapsar a `no-verificable` de forma
  intermitente. Se acepta porque el fallo cerrado ante timeout ya es el correcto
  (`no-verificable`, nunca `instalado` ni `no-instalado` por defecto) — el peor caso es un
  falso "no verificable" ocasional, no una decision incorrecta. Ajustar el timeout sin datos
  de produccion seria adivinar un numero.
- **MEN-4** (aceptado sin corregir): si las etiquetas de una tarea cambian y el empate que
  motivo un desempate por LLM desaparece, los ficheros `peticion-desempate-skill-1.md` y
  `salida-desempate-skill-1.md` quedan en `planificacion/` con candidatos que ya no aplican.
  Se acepta porque es el mismo patron que ya existe para los ficheros de brainstorm de TASK-016
  (los artefactos de una ronda de planificacion no se autolimpian si la tarea cambia de forma),
  y limpiarlo automaticamente añadiria logica de borrado condicionado que ninguna otra parte
  del flujo de planificacion tiene todavia.
- **MEN-5** (aceptado sin corregir): la excepcion del test de arquitectura que impide invocar
  subprocesos fuera de `plugin-instalado.ts` esta acotada por fichero, no por uso exacto del
  argv; un futuro `spawnSync('claude', [...])` distinto en ese mismo fichero cruzaria el guard
  sin aviso. Se acepta porque añadir la asercion positiva que sugiere el informe (que el unico
  argv con `'claude'` en el fichero sea `['plugin', 'list', '--json']`) es deuda de test
  aislada, sin riesgo de comportamiento incorrecto en produccion; queda anotada para quien
  toque ese fichero a continuacion.
- **MEN-6** (aceptado sin corregir): `total_skills: 0` se acepta en silencio y deja a toda
  tarea sin candidato. Se acepta porque es coherente con la doctrina explicita del proyecto de
  que "cero candidatos tras cruzar etiquetas es un resultado valido, no un fallo" — un catalogo
  vacio es una instancia legitima de ese mismo caso, aunque indistinguible de un fichero
  truncado sin mirar el `git diff`.
- **MEN-7** (aceptado sin corregir): cuando un `skills_recomendados` puesto a mano pasa a `[]`
  por ser un campo derivado, el aviso generico ("ningun skill comparte etiquetas") no menciona
  que habia un valor previo que se ha borrado. Se acepta porque `skills_recomendados` esta
  documentado como derivado desde su introduccion (no es un campo que la persona deba editar a
  mano), y detectar "habia un valor antes" añadiria estado que el comando no necesita para
  nada mas.

Tras aplicar las 4 correcciones IMPORTANTE y las 2 MENOR, la suite completa paso de
812/815 a 817/820 (5 tests netos añadidos entre IMP-1, IMP-4 y MEN-3), con los 3 fallos
restantes siendo los conocidos de Windows nativo documentados en `CLAUDE.md` (symlink EPERM,
chmod-on-dir NTFS no-op, CRLF), verificados uno a uno en el log y sin ninguna regresion nueva.

### El patron que se repitio entre IMP-2 e IMP-4

Los dos hallazgos mas caros de esta ronda (IMP-2 e IMP-4) comparten una misma causa: el
scaffold que un comando genera para que la persona lo edite a mano (rutas del aviso, o el
fichero de salida del desempate) no coincidia con lo que el propio comando esperaba leer
despues. En ambos casos la correccion fue alinear "lo que el comando escribe" con "lo que el
comando lee", en vez de documentar la discrepancia. Vale la pena revisar el resto de scaffolds
interactivos del proyecto (brainstorm incluido) con esa misma pregunta.

### Ronda 2 de revision por pares

Segunda ronda independiente (`informe-revision-2.md`), tambien con veredicto
cambios-solicitados: confirmo empiricamente las 6 correcciones de la ronda 1 (las 4 IMPORTANTE
y las 2 MENOR arriba) sin regresiones, y encontro un hallazgo IMPORTANTE nuevo y 4 MENOR.

**IMPORTANTE — corregido:**

- **IMP-5**: `comprobarSkillInstalado`/`interpretarResultadoPluginList` comparaban solo el
  tramo del `marketplace` (tras el `@`) del `id`, no el `id` completo. Eso reportaba
  `'instalado'` un plugin externo que en realidad no existe si CUALQUIER OTRO plugin del mismo
  marketplace si estaba instalado — exactamente el "candidato real que falta" escondido que
  este modulo existe para evitar (ver docblock de `plugin-instalado.ts`). Corregido comparando
  el `id` COMPLETO (`"plugin@marketplace"`); test de regresion nuevo
  (`plugin-instalado.test.ts`, caso "IMP-5: otro plugin del mismo marketplace instalado, pero
  no el buscado, es no-instalado"). Commit `5e6a5ba`.

**MENOR — 2 corregidos, 2 aceptados sin corregir:**

- **MEN-11** (corregido junto con IMP-5, misma causa raiz): el aviso de instalacion componia
  `/plugin install ${entradaGanadora.id}@${entradaGanadora.marketplace}` con un `id` de
  CATALOGO (forma `"plugin:skill"`, p. ej. `"figma:figma-generate-design"`), produciendo un
  comando `/plugin install` no ejecutable. Corregido extrayendo el nombre del plugin real
  (`id.split(':')[0]`) antes de componer `pluginId`. Commit `5e6a5ba`.
- **MEN-8** (corregido con test): el orden "cargar el catalogo antes de escribir el scaffold"
  ya estaba corregido desde IMP-3 (ronda 1), pero ningun test lo fijaba como regresion. Nuevo
  test en `plan.test.ts`: con un catalogo mal formado, `runPlanCommand` rechaza, la tarea no se
  mueve de `00-planificadas` y `planificacion/` nunca se llega a crear. Commit `c284203`.
- **MEN-10** (corregido en este mismo documento): la cifra "816/820 a 817/820" de la ronda 1
  era incorrecta; la base real era 812/815, ya corregida arriba.
- **MEN-9** (aceptado sin corregir): ningun test distingue explicitamente las dos redacciones
  del aviso ("no esta instalado" vs "no se ha podido comprobar si esta instalado") segun el
  estado real (`no-instalado` vs `no-verificable`). Se acepta porque forzar de forma
  deterministica el estado `no-verificable` en un test de integracion de `plan.ts` sin mocks
  exigiria mockear el subproceso `claude plugin list` (prohibido: tests contra recursos reales,
  nunca mocks) o extraer una funcion pura solo para poder probar el string, una refactorizacion
  no pedida para un hallazgo de redaccion de bajo riesgo. La logica que elige la redaccion es
  un ternario de 3 lineas en `plan.ts`, y ambos estados ya estan probados exhaustivamente en
  `plugin-instalado.test.ts` contra `interpretarResultadoPluginList`.

Tras corregir IMP-5, MEN-11 y MEN-8, la suite completa paso de 817/820 a 819/822 (2 tests
nuevos: el de IMP-5 y el de MEN-8), con los mismos 3 fallos conocidos de Windows nativo y
ninguna regresion nueva.

Una segunda pasada independiente sobre ese mismo cierre (tambien `informe-revision-2.md`,
veredicto cambios-solicitados) reprodujo empiricamente con una limitacion de metodo que el
propio informe documenta: su Bash estaba roto, asi que no pudo ejecutar la suite ni usar su
propio worktree aislado (MEN-18, corregido: el informe SI confirmo con precision, citando los
tres ficheros de Git que leyo, que ese worktree apuntaba a una rama distinta de la de la tarea
-- lo que no pudo fue trabajar desde el, asi que reviso el arbol principal). Aun asi encontro 2
IMPORTANTE nuevos (IMP-6, IMP-7) y 4 MENOR (MEN-12 a MEN-15):

**IMPORTANTE — corregidos los 2:**

- **IMP-6**: el comentario de `scripts/catalogo-skills.yml` describia `skill_N_id` de una
  entrada externa como `"marketplace:skill"`, al reves de la convencion real ya usada tanto
  por el codigo (`plan.ts`, tramo antes de `:` como nombre del PLUGIN, ver MEN-11 arriba) como
  por el ejemplo `"figma:figma-generate-design"` de la seccion 6.6. Corregido el comentario
  para que diga `"plugin:skill"`; anadido en `plan.test.ts` un test end-to-end con un
  `skill_N_id` con `:` que fija el `/plugin install` esperado.
- **IMP-7**: `leerGanadorDesempate` saltaba lineas en blanco y encabezados Markdown, pero no el
  marcador de relleno `"(pendiente de completar)"` que el propio `salidaDesempateSkillTemplate`
  escribe en el scaffold — asi que responder debajo del marcador sin borrarlo (el patron que el
  docblock de la funcion promete soportar) se descartaba en silencio, el mismo defecto que
  IMP-4 (ronda 1) pretendia cerrar para el encabezado. Corregido con la constante compartida
  `PLACEHOLDER_SALIDA_DESEMPATE`, usada tanto al escribir el scaffold como al leerlo; el test
  `plan-desempate-skill.test.ts` que ejercitaba este escenario se corrigio para dejar el
  marcador intacto de verdad (antes usaba `.replace()` para borrarlo antes de leer, sin probar
  nada del comportamiento que su nombre prometia).

**MENOR — 1 corregido, 1 documentado, 2 corregidos en este mismo documento:**

- **MEN-13** (corregido en el mismo cambio que IMP-7): el texto de
  `peticionDesempateSkillTemplate` describia solo dos de los tres tipos de linea que
  `leerGanadorDesempate` salta; actualizado para mencionar tambien el marcador de relleno.
- **MEN-14** (documentado, sin cambio de comportamiento): un plugin con `id` coincidente pero
  `enabled: false` en el JSON real se reporta como `'instalado'`, igual que uno habilitado.
  Se acepta y se documenta explicitamente en el docblock de `plugin-instalado.ts`: el estado
  solo distingue si el plugin ya esta descargado y registrado (que es lo que hace innecesario
  el `/plugin install` que sugiere `plan.ts`), no si esta activo; un cuarto estado para
  "instalado pero deshabilitado" exigiria ademas un aviso distinto (`/plugin enable`) que nadie
  ha pedido todavia.
- **MEN-12** (corregido en este mismo documento): la descripcion de la correccion de IMP-1
  (arriba) citaba `id.split('@').at(-1)`, codigo que ya no existe — quedo reemplazado por la
  comparacion de `id` completo que trajo IMP-5. Corregida la redaccion para no describir codigo
  desactualizado.
- **MEN-15** (corregido en este mismo documento): esta seccion no cubria la segunda pasada de
  ronda 2 con el contenido real de `informe-revision-2.md`. Anadida con los hallazgos reales
  (0 criticos, 2 IMPORTANTE, 4 MENOR, veredicto cambios-solicitados, y la limitacion de metodo
  del Bash roto documentada por el propio revisor).

Tras corregir IMP-6, IMP-7, MEN-12, MEN-13 y MEN-14 se anadieron 2 tests (el que fija el
`/plugin install` con `skill_N_id` de la forma `"plugin:skill"` en `plan.test.ts`, y el que
aisla el salto del marcador de relleno en `plan-desempate-skill.test.ts`). Ni quien
implemento ni el revisor de la ronda 2 pudieron confirmar por ejecucion la cifra resultante
de la suite en ese punto (Bash roto en ambos casos) — es la cifra que MEN-17 (mas abajo)
senala como ausente, y que solo se ha podido medir por primera vez en la ronda de
correcciones de la ronda 3, ver esa seccion.

### Ronda 3 de revision por pares (`informe-revision-3.md`)

Commit revisado: `2b4319742ac72484ad9bcc981ab16febbfe5c05e` (el del cierre de ronda 2, arriba).
Veredicto: cambios-solicitados. 0 CRITICO, 2 IMPORTANTE, 4 MENOR. Misma limitacion de metodo
que la ronda 2 (Bash roto en el agente revisor: no pudo ejecutar la suite) y misma incidencia
de proceso repetida por segunda ronda consecutiva: el *worktree* aislado del agente revisor
volvio a apuntar a una rama distinta de la de la tarea (`ce5947d`, el cierre de TASK-016,
anterior a todo el trabajo de esta tarea), por lo que la revision se hizo leyendo el arbol de
trabajo principal y el informe tuvo que trasladarse a mano — pendiente de anotar en
`docs/contexto/HALLAZGOS.md` como problema de proceso recurrente, independientemente de esta
tarea.

**IMPORTANTE — corregidos los 2:**

- **IMP-8**: el comentario de `scripts/catalogo-skills.yml` que IMP-6 corrigio remite como
  autoridad a la seccion 6.6 de `docs/PROPUESTA_METODOLOGIA.md`, pero ese documento no se
  habia tocado: su ejemplo canonico (`id: figma:figma-generate-design`) declaraba
  `marketplace: figma`, el mismo `"figma"` que el comentario corregido acaba de decir que NO
  es el marketplace — comprobado ademas contra el plugin real instalado en esta maquina
  (`figma@claude-plugins-official`, no `figma@figma`). Corregido el ejemplo a
  `marketplace: claude-plugins-official`, con un comentario que senala que `"figma"` (antes
  de `:`) es el PLUGIN.
- **IMP-9**: `construirEntrada` (`catalogo-skills.ts`) no validaba la forma del `skill_N_id`
  para `origen: externo` — un id sin `:` parseaba igual, y `plan.ts` componia un
  `/plugin install` con el nombre de un *skill* donde debia ir el de un *plugin*, sin abortar
  ni avisar, justo lo contrario de la doctrina fail-closed que la cabecera del propio fichero
  declara para el resto del parseo. Corregida con una validacion que exige exactamente un
  `:` con ambos tramos no vacios, mensaje `CatalogoSkillsError` con la forma esperada. Ajustado
  el *fixture* que ya violaba la convencion (`plan.test.ts`, el test que fijaba el
  `/plugin install` con un `id` sin `:`) para usar `"plugin-de-prueba:skill-de-prueba"`, y
  anadidos 5 tests nuevos en `catalogo-skills.test.ts` que cubren los casos invalidos (sin
  `:`, dos `:`, tramo del plugin vacio, tramo del skill vacio) y la precondicion de que la
  exigencia es solo para `origen: externo` (las 5 entradas reales del catalogo, todas
  `taskcode-plugin`, no llevan `:` y siguen siendo validas).

**MENOR — los 4 corregidos:**

- **MEN-16**: en `plan.ts`, tras escribir el scaffold de desempate cuando no existia, se volvia
  a comprobar `ficheroConContenido` para decidir si leer el ganador — comprobacion siempre
  verdadera (si no lo era, se acababa de escribir un scaffold no vacio) y por tanto una rama
  `: null` inalcanzable. Colapsado a la llamada directa a `leerGanadorDesempate`.
- **MEN-17** (corregido en este mismo documento): la cifra de suite citada mas arriba
  (817/820 a 819/822) es la del cierre de ronda 1 (commit `c284203`) y sigue siendo correcta
  para ese punto; lo que faltaba era una cifra de cierre para las correcciones de IMP-6/IMP-7
  (arriba). Esta ronda de correcciones (IMP-8, IMP-9, MEN-16, MEN-19) es la primera vez que se
  ha podido ejecutar la suite completa por ejecucion real en este entorno (Windows nativo, PowerShell):
  **830 tests, 731 pass, 99 fail**. De esos 99, tres son los ya documentados en `CLAUDE.md`
  como no-regresion de este entorno (symlink `EPERM` en `taskctl approve`, `chmod` sobre
  directorio no-op en NTFS en `taskctl plan`, y diferencia de fin de linea CRLF en otro test de
  `taskctl plan`, los tres verificados leyendo el mensaje de error real de cada uno); el resto
  son en su practica totalidad tests de `taskctl start/finish/review/approve` y de los scripts
  `.sh` de Git-Flow (`abort-merge.sh`, `merge-hotfix-to-main.sh`, `merge-release-to-main.sh`,
  `create-develop.sh`, `recover-branch.sh`, `resume-work.sh`, `diagnose-repo.sh`), todos
  dependientes de `spawnSync('bash', ...)` — consistente con el Bash roto de este entorno.
  Verificado que ninguno de los 99 fallos toca `catalogo-skills.test.ts` (sin resultados al
  buscar ese nombre en la salida completa de la suite).
- **MEN-18** (corregido en este mismo documento, ver el parrafo de la 2ª pasada de ronda 2
  arriba): la redaccion decia que el informe de ronda 2 no pudo "confirmar a que rama
  apuntaba su propio worktree aislado", cuando en realidad si lo confirmo con precision
  (citando los tres ficheros de Git que leyo); lo que no pudo fue trabajar desde ese worktree.
- **MEN-19**: anadido en `plan-desempate-skill.test.ts` un test que ancla el texto de "Como
  entregas" de `peticionDesempateSkillTemplate` a las tres reglas de salto reales
  (linea vacia, encabezado Markdown, marcador `"(pendiente de completar)"`), que hasta ahora
  no probaba nada del texto.
