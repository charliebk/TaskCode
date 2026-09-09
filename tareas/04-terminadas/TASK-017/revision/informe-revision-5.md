# Informe de revisión — TASK-017 (ronda 5)

- Tarea: TASK-017 — Catálogo de skills determinista con selección en dos pasos
- Rama revisada: `feature/task-017-catalogo-de-skills-determinista-con-sele`
- Commit revisado: 382028edec723a64b8b4f99653040484d6209a0b
- Commit anterior (ronda 4): 4bcecd0a8d4b8592279a92ef4be90630cd0b6500
- Revisor: agente revisor independiente (`code-reviewer`); no es el autor de la implementación
- Fecha: 2026-09-09
- Veredicto: **aprobada (con dos menores nuevos, documentados abajo)**

**Cero críticos, cero importantes. Los cinco hallazgos que la petición pide
confirmar —IMP-10, MEN-20, MEN-21, MEN-22 y MEN-23— están corregidos de
verdad, los cinco**, verificado leyendo el código real (no el diff) y
trazando a mano la lógica nueva. Encuentro **dos MENOR nuevos**, ninguno de
código: uno es la ausencia de un test de regresión para el caso exacto que
motivó MEN-20 (espacios dentro de los tramos del `id`), pese a que el propio
`informe-revision-4.md` sugería explícitamente añadirlo; el otro es que
`tarea.md` no tiene una sección "Ronda 4 de revisión por pares" — a
diferencia de las rondas 2 y 3, que sí la tienen —, así que IMP-10, MEN-20,
MEN-21 y MEN-22 no quedan documentados por su nombre en el `Resultado` de la
tarea, solo MEN-23 aparece (como anotación suelta dentro de la sección de la
ronda 3). Ninguno de los dos bloquea el cierre.

---

## 0. Limitación de método: esta ronda tampoco ha podido ejecutar la suite, y el *worktree* aislado volvió a estar en la rama equivocada (cuarta ronda consecutiva)

Igual que en las rondas 2, 3 y 4, esto va lo primero porque condiciona el
alcance de todo lo demás.

### 0.1 Bash sigue roto, idéntico a las tres rondas anteriores

Cualquier invocación de la herramienta de shell (con o sin
`dangerouslyDisableSandbox`, en modo síncrono o `run_in_background`, con
comandos tan triviales como `true` o `echo`) devuelve exactamente:

```
/usr/bin/bash: -c: line 71: unexpected EOF while looking for matching `''
```

Mismo mensaje, misma línea (71), independientemente del comando enviado —
la traza sitúa el fallo en el preámbulo que la herramienta antepone a mi
comando, no en lo que yo escribo, exactamente el mismo diagnóstico que
documentaron las rondas 2, 3 y 4. Consecuencia: **no se ha podido correr
`npm run build` ni `node --test "dist/test/**/*.test.js"`.** La cifra que la
petición declara —**99 fallos, todos no-regresión**— queda **sin verificar,
no refutada**. No la cuento como hallazgo en ninguna dirección, tal como
exige la petición si mi cifra no difiere (no tengo cifra propia que
comparar).

Todo lo que sigue se verificó **leyendo el código real en disco y trazando a
mano funciones puras y deterministas** (el regex de MEN-20, la aserción de
MEN-21, el mensaje de MEN-22, la prosa de IMP-10), más lectura directa de
los ficheros de Git y del build versionado (`dist/`). Es suficiente para
todo lo que afirmo abajo, pero no lo es para descartar regresiones en
tiempo de ejecución ni para confirmar la cifra 99/todos-no-regresión.

### 0.2 El *worktree* aislado, otra vez en la rama equivocada — cuarta vez seguida

La petición pedía explícitamente confirmarlo al empezar, y avisaba de que
había pasado tres veces seguidas. Lo confirmo: **vuelve a pasar, y es la
cuarta.**

Como `git` tampoco se puede ejecutar (sección 0.1), lo comprobé leyendo los
ficheros de Git directamente, la misma técnica que usaron las rondas 2, 3 y
4:

| Fichero leído | Contenido |
|---|---|
| `.claude/worktrees/agent-ad08a120e050edf1d/.git` | `gitdir: .../.git/worktrees/agent-ad08a120e050edf1d` |
| `.git/worktrees/agent-ad08a120e050edf1d/HEAD` | `ref: refs/heads/worktree-agent-ad08a120e050edf1d` |
| `.git/refs/heads/worktree-agent-ad08a120e050edf1d` | `ce5947d022bfb828979eb587797fc480b329933c` |
| `.git/HEAD` (árbol principal) | `ref: refs/heads/feature/task-017-catalogo-de-skills-determinista-con-sele` |
| `.git/refs/heads/feature/task-017-...` | `382028edec723a64b8b4f99653040484d6209a0b` |
| `.git/refs/heads/develop` | `57f6aa0f5ae563d966f47440f8c9adcf0604f96d` |

- **Esperaba**: rama `feature/task-017-catalogo-de-skills-determinista-con-sele`,
  commit `382028edec723a64b8b4f99653040484d6209a0b` — el HEAD que declara la
  petición, y que **coincide** con el que tiene la rama real en el árbol
  principal.
- **Encontré**: rama `worktree-agent-ad08a120e050edf1d`, commit `ce5947d`,
  que es `chore(TASK-016): tarea terminada y artefactos de cierre` — **el
  mismo commit equivocado, de una tarea anterior sin relación, que les tocó
  a las rondas 3 y 4**.
- **Confirmación cruzada por contenido**: en mi *worktree* aislado el único
  rastro de la tarea es `tareas/00-planificadas/TASK-017/tarea.md` (ni
  siquiera el estado de la ronda 4: en la ronda 4 el *worktree* equivocado
  al menos tenía `01-en-diseno`); no existe `tareas/03-en-revision/TASK-017/`
  ni `revision/`, ni ninguno de los ficheros a revisar. En el árbol principal
  están los 19 ficheros de la tarea, incluidos `peticion-revision-5.md` y
  `diff-ronda5.txt`.

La revisión se ha hecho, por tanto, **leyendo el árbol de trabajo
principal**, que sí está en la punta de la rama (confirmado arriba: HEAD del
árbol principal = commit que declara la petición). Este informe se escribe
primero en la ruta canónica del árbol compartido
(`tareas/03-en-revision/TASK-017/revision/informe-revision-5.md`); la
herramienta de escritura lo rechazó por el aislamiento (mismo comportamiento
documentado en rondas anteriores: *"This agent is isolated in the worktree
[...]. Edit the worktree copy of this file instead of the shared-checkout
path."*), así que este informe se escribe en la ruta canónica dentro del
*worktree* aislado, y su contenido íntegro queda devuelto en la respuesta
final para que se traslade a mano.

**Cuarta ronda consecutiva.** La anotación en `docs/contexto/HALLAZGOS.md`
("El worktree aislado del agente revisor, en la rama equivocada dos rondas
seguidas (TASK-017)") sigue sin actualizarse para reflejar que ya son
cuatro, no dos — la ronda 4 ya lo señaló como pendiente y sigue pendiente.
No lo cuento como hallazgo nuevo de esta ronda (ya está registrado como
recurrente), pero merece que quede dicho explícitamente una vez más: el
aislamiento por *worktree* no ha aportado nada en ninguna de las cinco
rondas de esta tarea, y cuesta un traslado manual cada vez.

---

## 1. Los cinco hallazgos que la petición pide confirmar

| # | Sev. ronda 4 | Punto a confirmar | Resultado |
|---|---|---|---|
| IMP-10 | IMPORTANTE | Prosa del paso 4 de §6.6 deja de contradecir el código | **Confirmado** |
| MEN-20 | MENOR | El regex de `construirEntrada` excluye espacios en cada tramo | **Confirmado en el código; sin test de regresión — ver hallazgo nuevo** |
| MEN-21 | MENOR | El test *end-to-end* de IMP-9 comprueba el mensaje, no solo la clase del error | **Confirmado** |
| MEN-22 | MENOR | El mensaje de error deja de citar la ruta interna | **Confirmado** |
| MEN-23 | MENOR | El cierre de MEN-17 enumera los cuatro patrones de fichero, no solo uno | **Confirmado** |

### 1.1 IMP-10 — corregido, y la corrección es coherente con el resto del documento

`docs/PROPUESTA_METODOLOGIA.md:190` (paso 4 de §6.6) decía antes:

> Si el candidato elegido no está instalado, se anota en `plan-final.md`:
> *"Esta tarea se beneficiaría del skill `X` (marketplace `Y`) — no está
> instalado. Instálalo con `/plugin install X@Y` [...]"*

con `X` = el *skill* completo en ambas apariciones — justo la ambigüedad que
tres informes consecutivos señalaron. Ahora dice (leído en disco, línea a
línea):

> Si el candidato elegido no está instalado, se anota en `plan-final.md`:
> *"Esta tarea se beneficiaría del skill `P:S` (marketplace `Y`) — no está
> instalado. Instálalo con `/plugin install P@Y` antes de arrancar, o
> continúa sin él."* Nótese que lo que se nombra es el skill completo
> (`P:S`, plugin y skill) pero lo que se instala es solo el plugin (`P`, el
> tramo antes de `:`) — la misma distinción del id compuesto que fija el
> ejemplo del paso 1.

**Contrastado contra el código real** (`plan.ts:598-624`, sin cambios en
este commit): `avisoSkillNoInstalada` nombra el skill con
`entradaGanadora.id` (el `"plugin:skill"` completo, es decir `P:S`) y
compone el comando de instalación con `pluginId = `${nombrePlugin}@${...marketplace}`,
donde `nombrePlugin = entradaGanadora.id.split(':')[0]` (es decir, solo
`P`). La prosa nueva describe exactamente esto, con las mismas letras que
introdujo el ejemplo YAML de la misma sección (`figma:figma-generate-design`
→ `P` = `figma`). **Aplicado el paso 4 al ejemplo canónico ya corregido**:
`P:S` = `figma:figma-generate-design`, `Y` = `claude-plugins-official` →
`/plugin install figma@claude-plugins-official`, que es exactamente el
comando real. Ya no hay contradicción entre §6.6 y `plan.ts`.

**Barrido de residuos**: `catalogo-skills.yml:42` (comentario de cabecera,
fichero que sí se distribuye) sigue usando las letras `X`/`Y` para el mismo
patrón (`"/plugin install X@Y" cuando no este instalado (paso 4 de 6.6)`).
No es un hallazgo — el significado sigue siendo correcto (`X`=plugin,
`Y`=marketplace, que es justo lo que emite el código) y son letras de
comentario interno, no una cadena que llegue a ningún usuario final —, pero
apunto la inconsistencia de nomenclatura (`X`/`Y` aquí, `P`/`S`/`Y` en el
documento al que remite) por si alguien homogeneiza los nombres de variable
la próxima vez que toque cualquiera de los dos ficheros.

**IMP-10 cerrado.**

### 1.2 MEN-20 — el regex está bien corregido; falta el test que la propia ronda 4 pidió

`catalogo-skills.ts:258`:

```ts
if (origen === 'externo' && !/^[^:\s]+:[^:\s]+$/.test(id)) {
```

**Trazado a mano contra el contraejemplo exacto que motivó el hallazgo**:
con `id = "mi-plugin : skill"`, el primer tramo (`[^:\s]+` hasta el `:`)
tendría que casar `"mi-plugin "`, que contiene un espacio final — `\s` lo
excluye, así que el tramo no casa y el regex entero falla: **aborta**,
correcto. Antes (`/^[^:]+:[^:]+$/`) el mismo `id` pasaba, con el defecto que
describía MEN-20. La corrección es exactamente la sugerida.

**Lo que no se hizo, y la propia `informe-revision-4.md` lo pedía por
nombre** ("*si se opta por lo primero [endurecer el regex], conviene un
test con `"mi-plugin : skill"`, que hoy pasaría la validación*"): no hay
ningún test nuevo para este caso. Comprobado por lectura completa de los
tests relevantes:

- `catalogo-skills.test.ts` (los cinco tests de IMP-9, líneas ~331-374)
  siguen siendo los mismos cuatro casos inválidos de la ronda 3 (sin `:`,
  dos `:`, tramo del plugin vacío, tramo del skill vacío) más la
  precondición de `origen: taskcode-plugin`. Ninguno usa un `id` con
  espacios internos.
- Búsqueda de `espacio`, `" : "`, `" skill"` y variantes en
  `catalogo-skills.test.ts` y `plan.test.ts`: sin resultados.
- El *build* versionado (`dist/src/core/catalogo-skills.js:196`) lleva el
  regex nuevo, así que el arreglo en sí llega al plugin distribuido — pero
  la ausencia de test significa que si alguien relaja el regex por error en
  el futuro (por ejemplo al tocar la validación por otro motivo), nada en la
  suite lo detectaría.

Lo trato como **hallazgo nuevo, MENOR** (ver sección 2): la corrección de
fondo es correcta y verificada por lectura/trazado manual, pero queda sin
la cobertura de regresión que la propia ronda anterior pidió explícitamente
para este caso concreto, en un repositorio cuya norma es "evidencia, no
suposición" y que para el resto de IMP-9/MEN-20 sí tiene un test por cada
rama del regex.

### 1.3 MEN-21 — corregido, y la aserción es la correcta

`plan.test.ts:919-926`:

```ts
await assert.rejects(
  () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-09', { repoCwd: repoRoot }),
  (error: unknown) => {
    assert.ok(error instanceof CatalogoSkillsError, `esperaba CatalogoSkillsError y llego: ${String(error)}`);
    assert.match(error.message, /"skill_1_id" invalido para "skill_1_origen: externo"/);
    return true;
  }
);
```

**Contrastado el regex de la aserción contra el mensaje real que compone
`catalogo-skills.ts:259-264`**: el mensaje empieza con
`` `[ERROR] ${ruta}:${cId.numeroLinea}: "${prefijo}id" invalido para "${prefijo}origen: externo": "${id}".` ``,
y con `prefijo = "skill_1_"` (la entrada única del catálogo sintético del
*fixture*, líneas 882-902) queda literalmente
`"skill_1_id" invalido para "skill_1_origen: externo"` — coincide con el
regex de la aserción carácter a carácter. **El fixture sigue siendo el
mismo de la ronda 3** (`skill_1_id: skill-externo-mal-formado`, sin `:`),
así que el test ejercita de verdad la rama de IMP-9/MEN-20 y no otra causa
de `CatalogoSkillsError`. Cierra exactamente el defecto que describía
MEN-21: hoy el test fallaría si el catálogo abortase por cualquier otro
motivo (clave ausente, enum inválido...), porque el mensaje no
coincidiría con el patrón. **MEN-21 cerrado.**

### 1.4 MEN-22 — corregido, y es coherente con el mensaje hermano

`catalogo-skills.ts:259-264`, después del cambio:

```ts
throw new CatalogoSkillsError(
  `[ERROR] ${ruta}:${cId.numeroLinea}: "${prefijo}id" invalido para "${prefijo}origen: externo": "${id}".\n` +
    '        Debe tener la forma "plugin:skill" (un unico ":", sin espacios, ni el\n' +
    '        tramo antes ni el de despues vacio) -- el tramo antes de ":" es el\n' +
    '        PLUGIN a instalar, el de despues el skill dentro de ese plugin (seccion\n' +
    '        6.6).'
);
```

Ya no aparece `docs/PROPUESTA_METODOLOGIA.md` en la cadena que ve el
usuario final; termina en `(seccion 6.6)`, sin fichero. **Comparado con el
mensaje "hermano" que la propia ronda 4 citó como ejemplo correcto**
(`catalogo-skills.ts:305-309`, marketplace ausente): ese cita *"paso 4 de la
seccion 6.6"*, también sin ruta. Los dos mensajes del módulo que remiten a
§6.6 son ahora consistentes entre sí. **Barrido completo del módulo**:
única aparición de `invalido para` en `src/`, y las dos apariciones de
`seccion 6.6` en `catalogo-skills.ts` son esta y la del marketplace ausente,
ninguna con ruta. El *build* versionado también lleva el cambio
(`dist/src/core/catalogo-skills.js:197-201`). **MEN-22 cerrado.**

### 1.5 MEN-23 — corregido, y cubre los cuatro patrones que pedía el criterio

`tarea.md:340-347`, dentro de la sección "Ronda 3 de revisión por pares"
(la corrección se anota in situ, sobre la frase que MEN-23 señalaba, igual
que el patrón ya usado para MEN-10, MEN-12, MEN-15 y MEN-18 en rondas
anteriores):

> **MEN-23** (corregido en este mismo documento): la frase anterior de este
> mismo punto afirmaba solo haber comprobado `catalogo-skills.test.ts`,
> cuando el criterio real cubría cuatro patrones (`catalogo-skills.*`,
> `plan.ts`, `plan-desempate-skill.*` y `plugin-instalado.ts`). Repetida la
> búsqueda contra los cuatro: ninguno de los 99 fallos toca
> `catalogo-skills.test.ts`, `plan-desempate-skill.test.ts` ni
> `plugin-instalado.test.ts`. De `plan.test.ts` sí fallan dos, pero son
> exactamente dos de los tres no-regresión ya citados arriba (`chmod`
> no-op en NTFS y CRLF) — ninguno relacionado con IMP-8, IMP-9 ni con el
> resto de correcciones de esta ronda.

Es exactamente lo que pedía el criterio de `peticion-revision-4.md:53-56`
(los cuatro patrones, no solo uno), y la frase ya no afirma haber verificado
más de lo que se verificó: distingue "ninguno toca" (tres patrones) de "dos
sí tocan, y son estos dos, ya documentados" (`plan.test.ts`). **No puedo
verificar la cifra subyacente** (99 fallos, cuáles) por la limitación de la
sección 0.1 — mi revisión de MEN-23 es sobre la **coherencia interna del
texto**, que es lo que el propio hallazgo señalaba, igual que hizo la ronda
4. **MEN-23 cerrado.**

---

## 2. Hallazgos nuevos

### CRÍTICO

Ninguno.

### IMPORTANTE

Ninguno.

### MENOR

- **MEN-24 — La corrección de MEN-20 no trae el test de regresión que la
  propia ronda anterior pidió por nombre.** `informe-revision-4.md`
  proponía explícitamente, para el caso de optar por endurecer el regex (que
  es justo lo que se hizo): *"conviene un test con `"mi-plugin : skill"`,
  que hoy pasaría la validación"*. El regex se endureció bien (`1.2`
  arriba, trazado a mano y correcto), pero no se añadió ningún test — ni en
  `catalogo-skills.test.ts` (donde viven los otros cuatro casos inválidos de
  IMP-9, y donde el patrón para añadirlo ya existe y es trivial de replicar)
  ni en `plan.test.ts`. Es la misma familia de defecto que motivó MEN-21 en
  esta misma tarea (una corrección real sin la prueba automática que la
  ancle), solo que aquí ni siquiera hay un test que pase "por la razón
  equivocada": simplemente no existe ningún test que ejercite el caso con
  espacios. Hoy el comportamiento es correcto porque lo verifiqué leyendo y
  trazando el regex a mano, pero un futuro cambio en `construirEntrada` (por
  ejemplo, si alguien reordena o reescribe la validación al añadir un sexto
  campo) podría relajar sin darse cuenta la exigencia sobre espacios y nada
  en la suite lo detectaría. **Sugerencia**: un sexto test en
  `catalogo-skills.test.ts`, hermano de los cuatro de IMP-9, con
  `skill_2_id: "mi-plugin : skill"` y la misma aserción
  `errorAccionable(/"skill_2_id" invalido para "skill_2_origen: externo"/)`.

- **MEN-25 — `tarea.md` no tiene una sección "Ronda 4 de revisión por
  pares", así que IMP-10, MEN-20, MEN-21 y MEN-22 no quedan documentados
  por su nombre en el registro de auditoría de la tarea (solo MEN-23
  aparece, como anotación suelta dentro de la sección de la ronda 3).**
  `CLAUDE.md` fija como regla de proceso que "sus hallazgos se clasifican
  CRÍTICO / IMPORTANTE / MENOR y se documentan en el `Resultado` de la
  tarea, incluidos los que se deciden no corregir" — es decir, la exigencia
  de documentar no depende de si el hallazgo se corrigió o no. `tarea.md`
  tiene secciones dedicadas "### Ronda 2 de revisión por pares" (línea 187)
  y "### Ronda 3 de revisión por pares" (línea 286), cada una con la lista
  de hallazgos de esa ronda, su severidad y cómo se cerraron. Tras la ronda
  4 (`informe-revision-4.md`: 0 crítico, 1 importante —IMP-10, que en
  realidad venía de un residuo de IMP-8— y 4 menores —MEN-20 a MEN-23—,
  veredicto `cambios-solicitados`) no existe una sección equivalente: el
  fichero completo tiene 356 líneas y termina en el cierre de MEN-19 de la
  ronda 3. Confirmado por búsqueda exhaustiva: ni "Ronda 4", ni
  "informe-revision-4", ni "IMP-10", ni "MEN-20", ni "MEN-21", ni "MEN-22"
  aparecen en ningún punto del documento; el único de los cinco que sí
  aparece es MEN-23, y solo como corrección puntual de una frase de la
  ronda 3, sin contexto de que viene de una ronda 4 independiente ni de
  cuál fue su veredicto. Quien lea `tarea.md` para auditar esta tarea sin
  leer también los ficheros de `revision/` no se enteraría de que existió
  una ronda 4, ni de que se encontró y corrigió una ambigüedad de
  documentación (IMP-10) que llevaba tres informes consecutivos
  repitiéndose, ni de los tres MENOR de acabado que la acompañaron. No
  bloquea el cierre — el código está corregido y verificado por mi cuenta
  en la sección 1 —, pero es una laguna de auditoría real, en un
  repositorio cuya tercera regla es "evidencia, no suposición" y cuya
  segunda regla exige documentar explícitamente incluso los hallazgos que
  se deciden no corregir. **Sugerencia**: antes de cerrar la tarea, añadir
  una sección "### Ronda 4 de revisión por pares" (y, tras esta, "### Ronda
  5") con el mismo formato que las rondas 2 y 3: veredicto, tabla o lista de
  hallazgos con su severidad, y cómo se cerró cada uno.

---

## 3. Áreas revisadas sin hallazgos

- **Superficie de la validación de IMP-9/MEN-20.** `construirEntrada` sigue
  siendo la única vía para construir un `EntradaCatalogoSkill` desde un
  fichero real (`parsearCatalogoSkills` es su único llamador), así que el
  regex endurecido cubre todo catálogo real. Sin cambios respecto de lo que
  la ronda 4 ya estableció.
- **`validarTextoNoVacio` no se tocó en este commit**, y no hacía falta:
  MEN-20 se resolvió en el regex de `construirEntrada`, sin depender de que
  el `trim()` del `id` completo alcance a cada tramo por separado. Repasado
  que esto no reabre ningún otro caso: `"  mi-plugin:skill  "` (espacios
  solo en los extremos del `id` completo) sigue pasando, porque
  `validarTextoNoVacio` lo recorta antes de llegar al regex — comportamiento
  correcto e intencional, distinto del caso que motivó MEN-20 (espacio
  *interior*, alrededor del `:`).
- **`plan.ts` y `plugin-instalado.ts` no cambian en este commit** (la
  petición no los lista entre los ficheros tocados y el `diff-ronda5.txt`
  lo confirma: solo toca `docs/PROPUESTA_METODOLOGIA.md`,
  `catalogo-skills.ts` y `plan.test.ts`). Sin novedad sobre las
  conclusiones de las rondas 2, 3 y 4.
- **El *build* versionado (`dist/src/`) lleva los tres cambios de código de
  esta ronda**: `dist/src/core/catalogo-skills.js:196` (regex endurecido) y
  `:197-201` (mensaje sin ruta). No hay cambios de `plan.ts` en esta ronda,
  así que no aplica para MEN-21 (ese es solo un cambio de test).
- **Barrido de `marketplace: figma` / `figma@figma` en todo el
  repositorio**: las únicas apariciones que quedan están en los informes de
  revisión anteriores y en los párrafos de `tarea.md` que narran el defecto
  y su corrección (histórico, no normativo). Ninguna en un fichero
  normativo ni en código. Sin novedad respecto de lo que confirmó la ronda
  4.
- **`docs/contexto/HALLAZGOS.md`**: no cambia en este commit (fuera del
  alcance de la petición). La entrada sobre el *worktree* aislado sigue
  hablando de "dos rondas seguidas" cuando ya van cuatro (sección 0.2); no
  lo cuento como hallazgo nuevo porque ya está identificado como pendiente
  desde la ronda 4, fuera del alcance de esta tarea.

---

## 4. Conclusión

**Los cinco hallazgos que la petición pedía confirmar están corregidos de
verdad, los cinco.** IMP-10 reescribe el paso 4 de §6.6 distinguiendo
`P:S` (lo que se nombra) de `P@Y` (lo que se instala), coherente con
`plan.ts` y con el ejemplo del paso 1 de la misma sección — cierra una
ambigüedad que llevaba tres informes consecutivos repitiéndose en el mismo
documento. MEN-20 endurece el regex de `construirEntrada` a
`/^[^:\s]+:[^:\s]+$/`, trazado a mano contra el contraejemplo exacto que lo
motivó (`"mi-plugin : skill"`) y correcto. MEN-21 refuerza el test
*end-to-end* de IMP-9 con un `assert.match` sobre el mensaje, no solo la
clase del error, cerrando el mismo defecto de fondo que motivó la propia
observación. MEN-22 quita la ruta interna del mensaje de error nuevo,
dejándolo consistente con su mensaje hermano. MEN-23 corrige la
verificación de MEN-17 para cubrir los cuatro patrones de fichero que pedía
el criterio, no solo uno, y sin sobre-afirmar lo que se comprobó.

**Dos MENOR nuevos, ninguno bloqueante y ninguno de código:**

- **MEN-24**: la corrección de MEN-20 es correcta pero no trae el test de
  regresión que la propia ronda 4 pidió por nombre para el caso de espacios
  internos — el comportamiento correcto depende hoy de lectura manual, no
  de la suite.
- **MEN-25**: `tarea.md` no tiene una sección "Ronda 4 de revisión por
  pares" (a diferencia de las rondas 2 y 3), así que cuatro de los cinco
  hallazgos que esta ronda cierra (todos menos MEN-23) no quedan
  documentados por su nombre en el registro de auditoría de la tarea, en
  contra de la regla explícita de `CLAUDE.md` de documentar todo hallazgo
  clasificado, se corrija o no.

**Cuestión de método, no de código, que hay que repetir por cuarta vez**:
esta ronda tampoco ha podido ejecutar la suite (Bash roto, sección 0.1) ni
partir de un *worktree* aislado en la rama correcta (sección 0.2, cuarta
ronda consecutiva con el mismo commit equivocado, `ce5947d`, el cierre de
TASK-016). Ninguna de las dos cosas invalida el veredicto — la revisión se
hizo íntegramente sobre el árbol de trabajo principal, que sí está en la
punta de la rama, y las cinco correcciones se verificaron leyendo y
trazando el código real, no el diff ni la palabra de la petición —, pero la
cifra "99 fallos, todos no-regresión" sigue sin corroboración independiente
por quinta ronda.

En resumen: **el fondo de la tarea está cerrado.** No encuentro nada que
impida terminar la revisión por pares de TASK-017 en esta ronda. Si se
decide cerrar con este informe, sugiero que el `Resultado` registre también
MEN-24 y MEN-25 (aunque sea como "aceptados sin corregir, ver informe de
ronda 5"), precisamente porque MEN-25 es sobre la propia disciplina de
registrar hallazgos — cerrar la tarea sin corregir esa laguna sería repetir,
un nivel más arriba, el defecto que señala.
