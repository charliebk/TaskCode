# Informe de revisión — TASK-017 (ronda 4)

- Tarea: TASK-017 — Catálogo de skills determinista con selección en dos pasos
- Rama revisada: `feature/task-017-catalogo-de-skills-determinista-con-sele`
- Commit revisado: 4bcecd0a8d4b8592279a92ef4be90630cd0b6500
- Commit anterior (ronda 3): 2b4319742ac72484ad9bcc981ab16febbfe5c05e
- Revisor: agente revisor independiente (`code-reviewer`); no es el autor de la implementación
- Fecha: 2026-09-09
- Veredicto: cambios-solicitados

**Cero críticos. 1 importante, 4 menores.**

**Los seis hallazgos de la ronda 3 están corregidos de verdad, los seis.** No es
una corrección a medias como la de la ronda anterior: IMP-9 es la mejor pieza del
commit (validación *fail-closed* real, con cinco tests de caso inválido y uno
*end-to-end*), MEN-16, MEN-17, MEN-18 y MEN-19 están cerrados sin reservas, y he
verificado además que **el build versionado (`dist/src/`) viaja con los dos
cambios de código**, cosa que ningún informe anterior comprobó.

El único IMPORTANTE nuevo es el residuo de IMP-8, y es de la misma familia exacta
que ha mordido en las rondas 2, 3 y ahora 4: **la corrección arregló el ejemplo
YAML de `docs/PROPUESTA_METODOLOGIA.md` §6.6, pero no la prosa del paso 4 de esa
misma sección**, que sigue diciendo `/plugin install X@Y` donde `X` es el *skill*.
Es el documento que el comentario de `catalogo-skills.yml` señala como autoridad
de la convención, y sigue sin ser internamente coherente con `plan.ts`.

Los cuatro MENOR son de acabado: dos sobre el alcance real de la validación y del
test nuevos de IMP-9, uno sobre una ruta interna que se ha colado en un mensaje de
error de cara al usuario, y uno sobre la precisión del cierre de MEN-17 en el
registro de auditoría.

---

## 0. Limitación de método: esta ronda tampoco ha podido ejecutar la suite

Va lo primero, igual que en las rondas 2 y 3, porque condiciona el alcance de todo
lo demás y porque callarlo sería lo contrario de lo que exige `CLAUDE.md`
("evidencia, no suposición").

**La herramienta de shell sigue rota, por tercera ronda consecutiva.** Cualquier
invocación muere antes de ejecutar nada:

```
/usr/bin/bash: -c: line 71: unexpected EOF while looking for matching `''
```

Comprobaciones hechas antes de darlo por perdido, todas con el mismo resultado:

- `echo hola`, `true`, `git -C ... log -1`, y un comando de cuatro líneas → mismo
  error y **mismo número de línea (71)**. El número **no cambia** con la longitud
  ni con el contenido del comando, lo que sitúa el fallo en el preámbulo que la
  herramienta antepone, no en lo que yo escribo: mi comando nunca llega a
  ejecutarse.
- Sonda de comilla colgante (enviar `' ; echo PRUEBA_OK` como comando, por si el
  preámbulo dejaba una comilla simple abierta que yo pudiera cerrar) → idéntico.
  El desequilibrio no se compensa desde el comando.
- Modo *background* (proceso desacoplado, salida a fichero): lancé
  `npm run build` con `run_in_background`. El proceso terminó con código 2 y el
  fichero de salida contiene **exactamente esa misma línea de error y nada más**.
  Verificado leyendo el fichero, no suponiéndolo.
- Descartado que sea el perfil del usuario: no existen ni `~/.bashrc` ni
  `~/.bash_profile` en esta máquina (comprobado con lectura directa; ambos dan
  "file does not exist"). El preámbulo de ~70 líneas lo inyecta el envoltorio de
  la herramienta, no un fichero del usuario que se pudiera arreglar.
- "Usar PowerShell en vez de Bash" **no es una alternativa disponible desde
  aquí**: la única herramienta de ejecución que tengo enruta a `/usr/bin/bash` en
  todos los casos, así que el fallo del preámbulo se produce antes de que importe
  qué sintaxis use. Mismo resultado que documentó la ronda 3.

Consecuencias que hay que asumir al leer este informe:

- **No se ha podido correr `npm run build` ni `node --test "dist/test/**/*.test.js"`.**
  La cifra que la petición declara —**830 tests, 731 pass, 99 fail**— queda **sin
  verificar, no refutada**. No puedo confirmarla ni desmentirla, y por tanto **no
  la cuento como hallazgo en ninguna dirección**.
- Intenté acotarla estáticamente y **el resultado no es concluyente, así que no lo
  convierto en hallazgo**: hay 757 declaraciones `test(` ancladas a principio de
  línea repartidas en 43 ficheros de `test/` (787 apariciones de `test(` en
  cualquier posición). Ni 757, ni 757+43=800, reconcilian exactamente con 830, pero
  el conteo estático no es fiable aquí: varios ficheros declaran tests dentro de
  bucles y el propio contador de `node --test` cuenta ficheros y subtests de forma
  distinta según versión. Es del mismo orden de magnitud y no da base para afirmar
  que la cifra esté mal.
- **No se ha podido medir cobertura** de la rama nueva de `construirEntrada`.
- Todo lo que sigue se verificó **leyendo el código real en disco y trazando a
  mano funciones puras y deterministas**, más lectura directa de los ficheros de
  Git, del árbol de plugins instalados de la máquina y del build versionado
  (`dist/`). Es suficiente para todo lo que afirmo abajo, pero **no lo es para
  descartar regresiones en tiempo de ejecución**.

### 0.1 El *worktree* aislado volvió a no estar en la rama de la tarea (tercera ronda consecutiva)

La petición pedía explícitamente confirmarlo al empezar. Lo confirmo: **vuelve a
pasar, y es la tercera vez seguida.**

Como `git` tampoco se puede ejecutar (sección 0), lo comprobé leyendo los ficheros
de Git directamente, que es la misma técnica que usaron las rondas 2 y 3:

| Fichero leído | Contenido |
|---|---|
| `.claude/worktrees/agent-ab8c48c6e595ec7f1/.git` | `gitdir: .../.git/worktrees/agent-ab8c48c6e595ec7f1` |
| `.git/worktrees/agent-ab8c48c6e595ec7f1/HEAD` | `ref: refs/heads/worktree-agent-ab8c48c6e595ec7f1` |
| `.git/refs/heads/worktree-agent-ab8c48c6e595ec7f1` | `ce5947d022bfb828979eb587797fc480b329933c` |
| `.git/HEAD` (árbol principal) | `ref: refs/heads/feature/task-017-catalogo-de-skills-determinista-con-sele` |
| `.git/refs/heads/feature/task-017-...` | `4bcecd0a8d4b8592279a92ef4be90630cd0b6500` |
| `.git/refs/heads/develop` | `57f6aa0f5ae563d966f47440f8c9adcf0604f96d` |

- **Esperaba**: rama `feature/task-017-catalogo-de-skills-determinista-con-sele`,
  commit `4bcecd0a8d4b8592279a92ef4be90630cd0b6500` — el HEAD que declara la
  petición, y que **coincide** con el que tiene la rama real.
- **Encontré**: rama `worktree-agent-ab8c48c6e595ec7f1`, commit `ce5947d`, que es
  `chore(TASK-016): tarea terminada y artefactos de cierre` — **el cierre de
  TASK-016, anterior a todo el trabajo de TASK-017**. Exactamente el mismo commit
  equivocado que le tocó a la ronda 3.
- **Confirmación cruzada por contenido**, no solo por refs: en el *worktree*
  aislado el único rastro de la tarea es
  `tareas/00-planificadas/TASK-017/tarea.md`; no existe
  `tareas/03-en-revision/TASK-017/`, ni `revision/`, ni ninguno de los ficheros a
  revisar. En el árbol principal están los 17 ficheros de la tarea, incluidos
  `peticion-revision-4.md` y `diff-ronda4.txt`.

La revisión se ha hecho, por tanto, **leyendo el árbol de trabajo principal**, que
sí está en la punta de la rama. Este informe se escribe dentro del *worktree*
aislado, en su ruta canónica relativa, porque el aislamiento **impide** escribir en
el árbol compartido (se intentó y la herramienta lo rechazó explícitamente); hay
que trasladarlo a mano a
`tareas/03-en-revision/TASK-017/revision/informe-revision-4.md` de la rama de la
tarea, junto a `peticion-revision-4.md`.

**Tres rondas consecutivas.** El aislamiento por *worktree* no está aportando nada
—el revisor acaba leyendo el árbol compartido las tres veces— y sí cuesta tiempo y
un traslado manual en cada ronda. La anotación pendiente en
`docs/contexto/HALLAZGOS.md` que pidieron las rondas 2 y 3 sigue sin hacerse; queda
fuera del alcance de esta tarea, pero ya no es una anécdota.

> **Nota añadida al trasladar este informe al árbol principal**: la anotación en
> `docs/contexto/HALLAZGOS.md` **sí se hizo**, en el commit `4bcecd0` que este
> mismo informe está revisando (sección "El worktree aislado del agente revisor,
> en la rama equivocada dos rondas seguidas (TASK-017)"). El agente no la vio
> porque su propio worktree aislado estaba desactualizado — exactamente el mismo
> problema que reporta en esta sección. No es un hallazgo pendiente real.

---

## 1. Los seis hallazgos que la petición pide confirmar

| # | Sev. ronda 3 | Punto a confirmar | Resultado |
|---|---|---|---|
| IMP-8 | IMPORTANTE | §6.6 deja de contradecir la convención `"plugin:skill"` | **Corregido el ejemplo; la prosa del paso 4 no — ver IMP-10** |
| IMP-9 | IMPORTANTE | `construirEntrada` valida la forma del `id` externo | **Confirmado, y bien probado** |
| MEN-16 | MENOR | Rama muerta en `plan.ts` eliminada | **Confirmado** |
| MEN-17 | MENOR | Cifra de suite del `Resultado` puesta al día | **Confirmado, con una reserva de precisión — ver MEN-23** |
| MEN-18 | MENOR | Redacción sobre la limitación del informe de ronda 2 | **Confirmado** |
| MEN-19 | MENOR | Test que ancla el texto de "Cómo entregas" | **Confirmado** |

### 1.1 IMP-9 — cerrado de verdad, y es la mejor pieza del commit

Es la parte mejor resuelta, y conviene decirlo con detalle porque la ronda 3 lo
señaló como *fail-open* en un módulo que declara lo contrario.

**La corrección.** `catalogo-skills.ts:254-262` introduce la validación, colocada
justo después de resolver `origen` y antes de todo lo demás:

```ts
if (origen === 'externo' && !/^[^:]+:[^:]+$/.test(id)) {
  throw new CatalogoSkillsError(
    `[ERROR] ${ruta}:${cId.numeroLinea}: "${prefijo}id" invalido para "${prefijo}origen: externo": "${id}".\n` +
      '        Debe tener la forma "plugin:skill" (un unico ":", ni el tramo antes\n' +
      '        ni el de despues vacio) -- el tramo antes de ":" es el PLUGIN a\n' +
      '        instalar, el de despues el skill dentro de ese plugin (seccion 6.6 de\n' +
      '        docs/PROPUESTA_METODOLOGIA.md).'
  );
}
```

**Trazada a mano la matriz completa del regex**, que es lo que la petición afirma
que hace ("exactamente un `:` con ambos tramos no vacíos"):

| `id` | `^[^:]+:[^:]+$` | Resultado |
|---|---|---|
| `plugin:skill` | `[^:]+`=`plugin`, `:`, `[^:]+`=`skill` | pasa (correcto) |
| `skill-sin-dos-puntos` | no hay `:` | **aborta** (correcto) |
| `plugin:sub:skill` | `[^:]+$` no puede contener `:`, así que `sub:skill` no casa | **aborta** (correcto) |
| `:skill` | el primer `[^:]+` exige ≥1 carácter | **aborta** (correcto) |
| `plugin:` | el segundo `[^:]+` exige ≥1 carácter | **aborta** (correcto) |

La comprobación se hace sobre el `id` **ya normalizado**: `validarTextoNoVacio`
(`catalogo-skills.ts:353-360`) devuelve `valor.trim()`, así que casos como
`"plugin: "` colapsan a `"plugin:"` y abortan bien. (El único resquicio que deja
esta normalización es el espacio *interior*, que anoto abajo como MEN-20.)

**El *fixture* que consagraba el contraejemplo está arreglado.** `plan.test.ts:775`
ya no usa `skill-externo-de-prueba` sino `plugin-de-prueba:skill-de-prueba`, y la
aserción de la línea 804 pasa a exigir
`/plugin install plugin-de-prueba@${marketplaceInventado}` — es decir, el tramo
**antes** de `:`. Con eso desaparece la contradicción que la ronda 3 marcó como
central: **ya no hay dos tests verdes en el mismo fichero afirmando lecturas
incompatibles de `skill_N_id`**. Comprobado leyendo los dos: el de la línea 754 y
el de IMP-6 en la 817 hoy afirman lo mismo.

**Los cinco tests nuevos existen y cubren lo que la petición dice**
(`catalogo-skills.test.ts:331-375`): sin `:` (331), dos `:` (341), tramo del plugin
vacío (351), tramo del skill vacío (361), y la precondición de que la exigencia es
solo para `externo` (371). Este último no es un `assert` decorativo: se apoya en
`CATALOGO` (línea 40), que es el catálogo **real** del repo parseado en tiempo de
carga del módulo, de modo que si la validación se hubiera aplicado también a
`origen: taskcode-plugin`, el fichero de test entero reventaría al importarse.

**Los dos tests preexistentes que la validación podía romper están ajustados con
su motivo escrito**, no silenciados: `catalogo-skills.test.ts:293-302` (marketplace
ausente) y `:311-323` (externo válido) fijan ahora el `id` a
`mi-plugin:code-quality-reviewer` con un comentario que explica que si no, la
validación de formato dispararía antes y el test dejaría de probar lo suyo. Eso es
correcto y honesto: es consecuencia de que la comprobación nueva se ejecuta antes
que la de `marketplace`.

**El test *end-to-end* (`plan.test.ts:874-930`) prueba la propagación real**, no
solo la unidad: monta un `CLAUDE_PLUGIN_ROOT` temporal con un catálogo de una sola
entrada externa con `skill_1_id: skill-externo-mal-formado`, y comprueba que
`runPlanCommand` rechaza y que la tarea **no** se queda con `planificacion/` a
medio crear (líneas 920-923). Ese último par de aserciones es el que importa: es el
criterio de MEN-8, y sin él un abort podría dejar el workspace en un estado que el
guard de §8.3 bloquease después con un mensaje que no explica la causa. (Sobre la
fuerza de la aserción del error, ver MEN-21.)

Sin reservas sobre el fondo: **IMP-9 está cerrado.**

### 1.2 IMP-8 — el ejemplo está corregido, y el dato es correcto

`docs/PROPUESTA_METODOLOGIA.md:176-182` ya no dice `marketplace: figma`:

```yaml
- id: figma:figma-generate-design   # "figma" (antes de ":") es el PLUGIN
  origen: externo
  marketplace: claude-plugins-official
  rol: ejecucion
  prioridad: 5
```

Están las dos cosas que la ronda 3 sugirió: el `marketplace` real y el comentario
*inline* que señala qué tramo es cuál.

**Verificado que el dato nuevo es cierto, y por mi cuenta**, no fiándome de que la
ronda 3 lo dijera: el árbol de plugins de esta máquina contiene

```
~/.claude/plugins/cache/claude-plugins-official/figma/2.2.90/.claude-plugin/plugin.json
```

o sea, plugin `figma` del marketplace `claude-plugins-official`. `/plugin install
figma@claude-plugins-official` es el comando real; el `figma@figma` al que arrastraba
el ejemplo viejo no existía.

**Barrido de residuos**: busqué `marketplace: figma`, `figma@figma` y
`marketplace:figma` en todo el repositorio. Las únicas apariciones que quedan están
en `informe-revision-2.md`, `informe-revision-3.md`, `diff-ronda4.txt` y en los
párrafos de `tarea.md` que **describen** el defecto y su corrección. Ninguna en un
fichero normativo. Correcto.

Lo que **no** cubre esta corrección es la prosa del paso 4 de la misma sección: ver
IMP-10.

### 1.3 MEN-16 — corregido

`plan.ts:575-585` ya no tiene la doble comprobación:

```ts
if (!(await ficheroConContenido(salidaDesempatePath))) {
  await writeFile(salidaDesempatePath, salidaDesempateSkillTemplate(task), { encoding: 'utf8' });
}
// Tras el bloque de arriba el fichero siempre tiene contenido (o ya lo
// tenia, o se acaba de escribir el scaffold, que nunca es vacio): no
// hace falta comprobarlo una segunda vez (MEN-16, revision por pares
// ronda 3, TASK-017).
const ganadorDesempate = leerGanadorDesempate(
  await readFile(salidaDesempatePath, 'utf8'),
  seleccionSkill.candidatosEmpatados
);
```

La rama `: null` inalcanzable ha desaparecido, el `stat` redundante también, y el
invariante que lo justifica queda escrito en el sitio donde alguien podría volver a
dudarlo. El comportamiento observable no cambia (era el mismo resultado por dos
caminos). Correcto.

### 1.4 MEN-17 — corregido (con una reserva de precisión, MEN-23)

`tarea.md:327-341` añade la cifra que faltaba sin reescribir ninguna cita
histórica, que es exactamente lo que la petición afirma: la de la ronda 1
(`tarea.md:227-229`, "817/820 a 819/822") sigue en su sitio y anotada como correcta
"para ese punto". La nueva dice **830 tests, 731 pass, 99 fail** (aritmética
coherente: 731+99=830), atribuye 3 fallos a las limitaciones de Windows de
`CLAUDE.md` y el resto a los tests que dependen de `spawnSync('bash', ...)`,
enumerando los scripts `.sh` implicados. La cifra en sí **no la he podido verificar**
(sección 0). Reserva sobre el alcance de la verificación que declara: MEN-23.

### 1.5 MEN-18 — corregido

`tarea.md:231-237` ya no afirma lo que el informe de ronda 2 desmiente:

> [...] su Bash estaba roto, asi que no pudo ejecutar la suite ni usar su propio
> worktree aislado (MEN-18, corregido: el informe SI confirmo con precision,
> citando los tres ficheros de Git que leyo, que ese worktree apuntaba a una rama
> distinta de la de la tarea -- lo que no pudo fue trabajar desde el, asi que
> reviso el arbol principal).

Distingue ya las dos cosas que la ronda 3 decía que se estaban confundiendo
("confirmar a qué rama apuntaba" frente a "poder trabajar desde ahí"), y lo hace
sin borrar el rastro de la corrección. Correcto.

### 1.6 MEN-19 — corregido, y el test ancla las tres reglas

`plan-desempate-skill.test.ts:95-100`:

```ts
test('peticionDesempateSkillTemplate documenta en "Como entregas" el marcador exacto que leerGanadorDesempate salta (MEN-19, revision por pares ronda 3)', () => {
  const texto = peticionDesempateSkillTemplate(tarea({ id: 'TASK-042' }), CANDIDATOS, '2026-09-09');
  assert.ok(texto.includes('(pendiente de completar)'));
  assert.match(texto, /no este vacia/);
  assert.match(texto, /encabezado Markdown/);
});
```

**Contrastadas las tres aserciones contra el texto real** de
`peticionDesempateSkillTemplate` (`plan-desempate-skill.ts:61-66`), que dice
*"taskctl lee la primera linea que no este vacia, no sea un encabezado Markdown ni
el marcador `"(pendiente de completar)"` del scaffold"*, y contra las tres reglas
que aplica de verdad `leerGanadorDesempate` (`:108`):

```ts
.find((l) => l !== '' && l !== PLACEHOLDER_SALIDA_DESEMPATE && !l.startsWith('#'));
```

Correspondencia exacta, una aserción por regla, sin sobras ni faltas. El detalle que
lo hace útil: el test comprueba el **literal** `'(pendiente de completar)'`, no la
constante `PLACEHOLDER_SALIDA_DESEMPATE`. Si fuera al revés, el test seguiría verde
tras cambiar la constante y no anclaría nada. Como está, cierra el bucle que pedía
la ronda 3: la constante queda sujeta por sus tres usos más este test. Correcto.

### 1.7 Comprobación que ningún informe anterior hizo: el build versionado viaja con los cambios

`dist/src/` está **versionado a propósito** en este repo (es el defecto que cerró
E6/TASK-031, y `distribucion.test.ts:184-199` lo fija como invariante): quien instala
el plugin ejecuta `dist/`, no `src/`. Si alguien edita `src/` y commitea sin
recompilar, el plugin distribuido **no lleva el arreglo** aunque el código fuente sí.
El propio `distribucion.test.ts:25-32` declara que ese desfase queda fuera de su
alcance a propósito.

Como los dos hallazgos de código de esta ronda son precisamente cambios en `src/`,
lo comprobé:

- `dist/src/core/catalogo-skills.js:192` → `if (origen === 'externo' && !/^[^:]+:[^:]+$/.test(id)) {`, con el comentario de IMP-9 en `:184` y el `throw` en `:193`.
- `dist/src/commands/plan.js:425-430` → la versión colapsada de MEN-16, con su comentario.

**Los dos cambios están en el build.** Sin hallazgo, y merece constar como
positivo.

---

## 2. Hallazgos nuevos

### CRÍTICO

Ninguno.

### IMPORTANTE

#### IMP-10 — IMP-8 corrigió el ejemplo de §6.6 pero no la prosa del paso 4 de esa misma sección, que sigue componiendo el `/plugin install` con el *skill* en vez de con el *plugin*

La corrección de IMP-8 tocó el bloque YAML de `docs/PROPUESTA_METODOLOGIA.md`
(líneas 176-182). **Catorce líneas más abajo, en la misma sección 6.6, el paso 4 no
se tocó** (`docs/PROPUESTA_METODOLOGIA.md:190`):

> 4. Si el candidato elegido no está instalado, se anota en `plan-final.md`:
>    *"Esta tarea se beneficiaría del skill `X` (marketplace `Y`) — no está
>    instalado. Instálalo con `/plugin install X@Y` antes de arrancar, o continúa
>    sin él."*

`X` es, según esa misma frase, **el skill**. Y el comando que propone es
`/plugin install X@Y`, es decir, *skill*`@`*marketplace*. Eso es justo lo contrario
de lo que hace el código (`plan.ts:598-624`), que separa las dos cosas:

```ts
const nombrePlugin = entradaGanadora.id.split(':')[0]!;      // el PLUGIN
const pluginId = `${nombrePlugin}@${entradaGanadora.marketplace}`;
...
avisoSkillNoInstalada =
  `Esta tarea se beneficiaria del skill "${entradaGanadora.id}" (marketplace ` +   // el SKILL, id completo
  `"${entradaGanadora.marketplace}") -- ${diagnostico}. Instalalo con "/plugin install ` +
  `${pluginId}" antes de arrancar, o continua sin el.`;                            // el PLUGIN
```

En el código, el skill que se nombra (`entradaGanadora.id`, el `"plugin:skill"`
completo) y lo que se instala (`nombrePlugin`, solo el tramo de antes de `:`) son
**distintos**. En §6.6 son **la misma `X`**.

**Aplicando el paso 4 literalmente al ejemplo canónico que esta misma ronda acaba
de corregir** (`id: figma:figma-generate-design`, `marketplace:
claude-plugins-official`):

```
X = figma:figma-generate-design      (el skill, según el propio texto)
Y = claude-plugins-official
-> /plugin install figma:figma-generate-design@claude-plugins-official
```

Ese comando no existe. El real —y el que emite `plan.ts`— es
`/plugin install figma@claude-plugins-official`.

Por qué esto importa y no es una pega de estilo: **el comentario de
`scripts/catalogo-skills.yml` delega la autoridad de la convención en §6.6**, y lo
hace dos veces. En `:30-36`:

```
#                               Para uno externo, "plugin:skill" (ver el
#                               ejemplo "figma:figma-generate-design" de la
#                               seccion 6.6, donde "figma" es el PLUGIN que
#                               hay que instalar, no el marketplace que lo
#                               aloja -- ese va aparte, en
#                               skill_N_marketplace).
```

y en `:40-45`, donde describe `skill_N_marketplace` como lo que sirve *"para poder
anotar `/plugin install X@Y` cuando no este instalado (paso 4 de 6.6)"* — remitiendo
al paso que sigue siendo incorrecto. Y ahora también lo hace el **mensaje de error
nuevo de IMP-9**, que termina con *"(seccion 6.6 de docs/PROPUESTA_METODOLOGIA.md)"*.
Es decir: el código manda al usuario a leer §6.6 para saber cómo se forma el id, y
§6.6 le da una fórmula de instalación equivocada.

Es exactamente el modo de fallo de IMP-8 —la autoridad citada contradice al
código—, en la misma sección, sin corregir. La afirmación de `tarea.md` de que la
convención queda alineada no es todavía cierta del todo.

**Por qué IMPORTANTE y no CRÍTICO**: mismo razonamiento que usó la ronda 3 para
IMP-8 y la ronda 2 para IMP-6. Hoy no cambia ninguna salida del programa: `plan.ts`
es correcto, las cinco entradas del catálogo distribuido son `origen:
taskcode-plugin` y no llegan a esta rama, y IMP-9 ya impide los ids degenerados.
Muerde cuando alguien lee §6.6 como especificación —para añadir la primera entrada
externa, para verificar el aviso a mano, o para reimplementar el paso 4— y toma el
`X@Y` al pie de la letra.

**Reconozco que está en el límite con MENOR**, y lo digo para que quien decida
tenga el argumento de las dos partes: el código ya hace lo correcto y `X`/`Y` son
letras de plantilla, no un ejemplo copiable como lo era el `marketplace: figma`. Lo
que me hace mantenerlo en IMPORTANTE es que **es el tercer informe consecutivo que
tropieza con la ambigüedad de este mismo campo en este mismo documento**, y que el
`Resultado` va a registrar IMP-8 como cerrado cuando la sección sigue sin ser
coherente.

**Sugerencia (una línea)**: reescribir el paso 4 distinguiendo las dos variables,
por ejemplo *"[...] se beneficiaría del skill `P:S` (marketplace `Y`) [...] Instálalo
con `/plugin install P@Y`"*, o añadir tras la frase una nota de una línea aclarando
que lo que se instala es el **plugin** (el tramo antes de `:`), no el skill. Con eso
los cuatro sitios —§6.6 ejemplo, §6.6 paso 4, `catalogo-skills.yml`, `plan.ts`—
dicen por fin lo mismo.

### MENOR

- **MEN-20 — La validación de IMP-9 acepta espacios dentro de los tramos, y el
  `/plugin install` resultante vuelve a salir roto en silencio.** El regex
  `/^[^:]+:[^:]+$/` exige que los tramos no estén *vacíos*, pero `[^:]` incluye el
  espacio. `validarTextoNoVacio` (`catalogo-skills.ts:353-360`) hace `trim()` del
  `id` **completo**, no de cada tramo, así que un catálogo con

  ```yaml
  skill_1_id: mi-plugin : skill
  ```

  parsea sin protestar: el `id` queda como `"mi-plugin : skill"`, casa el regex
  (`[^:]+` = `"mi-plugin "`, `:`, `[^:]+` = `" skill"`) y `plan.ts:608` calcula
  `nombrePlugin = "mi-plugin "` — con el espacio final. El aviso emitido es
  `/plugin install mi-plugin @marketplace`, que no es un comando válido. Es el
  mismo modo de fallo que IMP-9 vino a cerrar —un `/plugin install` mal compuesto,
  escrito en `plan-final.md` sin abortar ni avisar—, solo que por la variante
  estrecha. Poner espacios alrededor de un `:` es un hábito razonable en un fichero
  que se parece a YAML, así que no es puramente teórico. El caso principal (sin `:`,
  con dos, con tramo vacío) sí queda cerrado, por eso es MENOR y no IMPORTANTE.
  **Sugerencia**: endurecer a algo como `/^[^:\s]+:[^:\s]+$/`, o hacer `trim()` de
  cada tramo antes de componer `nombrePlugin`. Si se opta por lo primero, conviene
  un test con `"mi-plugin : skill"`, que hoy pasaría la validación.

- **MEN-21 — El test *end-to-end* de IMP-9 solo asevera la clase del error, no el
  mensaje, así que seguiría verde si el catálogo fallara por otro motivo.**
  `plan.test.ts:913-916`:

  ```ts
  await assert.rejects(
    () => runPlanCommand(tareasRoot, ['TASK-700'], '2026-09-09', { repoCwd: repoRoot }),
    CatalogoSkillsError
  );
  ```

  `CatalogoSkillsError` es la clase que lanzan **todos** los fallos de parseo del
  módulo: clave ausente, clave desconocida, `total_skills` que no cuadra, `rol`
  fuera del enum, `marketplace` ausente... El *fixture* de este test
  (`plan.test.ts:882-902`) declara nueve claves a mano; si mañana una errata rompiera
  cualquiera de ellas —o si se renombrara un campo—, el catálogo abortaría por esa
  otra razón y **el test seguiría pasando sin haber ejercitado nunca la validación
  del `id`**. Es justo el defecto que la ronda 3 describió como "un test que pasaría
  igual sin el arreglo", y contrasta con el rigor del resto de este mismo commit:
  los cinco tests de `catalogo-skills.test.ts:331-369` sí usan
  `errorAccionable(/"skill_2_id" invalido para .../)`. Nótese que el test hermano de
  MEN-8 (`plan.test.ts:932`) también asevera solo la clase, pero **ahí es correcto y
  está justificado por escrito** ("cualquier fallo de parseo vale para este test --
  lo que se fija es el orden"): lo que prueba es el orden de las operaciones, no la
  causa. En el de IMP-9 la causa *es* lo que se quiere probar. **Sugerencia**: añadir
  el `assert.match` sobre el mensaje, igual que los tests unitarios.

- **MEN-22 — El mensaje de error nuevo es el único del módulo que expone una ruta
  interna de TaskCode al usuario final.** `catalogo-skills.ts:260` termina con
  *"(seccion 6.6 de docs/PROPUESTA_METODOLOGIA.md)"*. Ese texto no es un comentario:
  es la cadena que el CLI imprime cuando alguien tiene un catálogo mal formado, **en
  el proyecto donde tenga el plugin instalado**, que no es este repo y donde
  `docs/PROPUESTA_METODOLOGIA.md` no existe. `CLAUDE.md` fija la regla para el
  contenido distribuido ("ninguno de esos ficheros puede mencionar TaskCode, sus
  rutas ni sus documentos internos — hay tests que lo comprueban"), y aunque esos
  tests cubren `skills/` y `agents/` y no `src/` (verificado: `distribucion.test.ts`
  no comprueba nada de esto, así que **no hay ningún test en rojo por esto**), la
  intención es la misma. Los demás mensajes del propio módulo respetan ese límite:
  el de `marketplace` ausente (`:302-305`) cita *"paso 4 de la seccion 6.6"* **sin la
  ruta**. Es una inconsistencia introducida por esta ronda, de una línea. Nota de
  contexto para no exagerarlo: la ruta ya aparecía en comentarios de
  `catalogo-skills.ts:4` y en `catalogo-skills.yml:2` —fichero este último que sí se
  distribuye—, así que la fuga no es nueva como categoría; lo nuevo es que ahora sale
  por la salida de error del programa. **Sugerencia**: dejar solo "seccion 6.6",
  igual que el mensaje hermano.

- **MEN-23 — El cierre de MEN-17 verifica menos de lo que el propio criterio de la
  ronda exige.** `tarea.md:340-341` cierra así la comprobación de que los 99 fallos
  no son de esta tarea:

  > Verificado que ninguno de los 99 fallos toca `catalogo-skills.test.ts` (sin
  > resultados al buscar ese nombre en la salida completa de la suite).

  Pero el criterio que la propia `peticion-revision-4.md:53-56` declara es más ancho:
  *"si alguno de los fallos SI toca ficheros de esta tarea (`catalogo-skills.*`,
  `plan.ts`, `plan-desempate-skill.*`, `plugin-instalado.ts`), es un hallazgo
  nuevo"*. De los cuatro, solo se comprueba uno. Y no es un detalle ocioso: el mismo
  párrafo de `tarea.md` (`:333-335`) reconoce que **dos de los tres fallos conocidos
  de Windows están en tests de `taskctl plan`** (el `chmod` no-op sobre NTFS y el de
  fin de línea CRLF), es decir, en `plan.test.ts`. Están explicados y no son
  regresiones —eso no lo discuto—, pero entonces la frase correcta no es "ninguno
  toca los ficheros de la tarea", sino "los que los tocan son estos dos, y son los
  documentados en `CLAUDE.md`". Es la misma familia que MEN-10, MEN-12 y el propio
  MEN-17: el `Resultado` es el artefacto de auditoría, y ahí una verificación
  descrita como más amplia de lo que fue vale poco. **Aviso**: no puedo comprobar la
  salida real de la suite (sección 0); este hallazgo es sobre la **coherencia interna
  del texto de `tarea.md`**, que sí he leído entero. **Sugerencia**: enumerar por
  nombre los fallos que caen en ficheros de la tarea y por qué cada uno es
  no-regresión, o acotar la frase a lo que de verdad se buscó.

---

## 3. Áreas revisadas sin hallazgos

- **`construirEntrada`, orden de validaciones.** La comprobación nueva se ejecuta
  antes que las de `rol`, `prioridad`, `etiquetas`, `patrones_archivo`,
  `descripcion` y `marketplace`. Repasado si ese adelanto puede ocultar un error
  peor: no. Todas las rutas siguen terminando en `CatalogoSkillsError` y abortando
  `taskctl plan` entero; lo único que cambia es cuál de los errores se reporta
  primero cuando hay varios a la vez, y el nuevo es tan accionable como los otros
  (cita fichero, línea, campo, valor recibido y forma esperada). Los dos tests que
  el cambio de orden afectaba están ajustados con su motivo escrito (§1.1).

- **No hay ninguna vía que construya un `EntradaCatalogoSkill` saltándose la
  validación.** `construirEntrada` es privada y su único llamador es
  `parsearCatalogoSkills` (`catalogo-skills.ts:200`), que es a su vez el único
  camino desde el fichero. Por tanto el `entradaGanadora.id.split(':')[0]!` de
  `plan.ts:608` —con su aserción de no-nulidad— pasa a estar **respaldado por el
  parser** para todo catálogo real, que es exactamente lo que IMP-9 pretendía. Los
  `entradaSkill({...})` de los tests construyen objetos a mano y sí se saltan la
  validación, pero eso es correcto: son catálogos sintéticos en memoria para probar
  `seleccionarSkill`, y no llegan a la composición del `/plugin install`.

- **`validarIdsUnicos` no interfiere.** Se ejecuta después del bucle
  (`catalogo-skills.ts:203`), sobre ids ya validados de forma. Un catálogo con dos
  entradas externas de id idéntico sigue abortando por id repetido. Sin cambios de
  comportamiento.

- **`leerGanadorDesempate` y el scaffold no se han tocado en este commit.** El
  diff sobre `plan-desempate-skill.ts` es nulo; lo único nuevo es el test de MEN-19.
  Re-trazadas de todos modos las tres reglas de salto (`:108`) contra los catorce
  casos del fichero de tests: ninguna combinación devuelve un candidato sin igualdad
  estricta de `id` (`:110`). El *fail-closed* que declara el docblock se mantiene.

- **`plugin-instalado.ts` no ha cambiado en este commit** (la petición lo lista
  entre los ficheros de la tarea, por eso lo verifico): sin diferencias respecto de
  lo que la ronda 3 dio por bueno. La conclusión de las rondas 2 y 3 sigue en pie.

- **`catalogo-skills.yml` sigue parseando y sigue siendo coherente consigo mismo.**
  El fichero no cambia en este commit. Releído su comentario de cabecera (`:26-69`)
  contra el código nuevo: describe `skill_N_id` como `"plugin:skill"` para externo,
  que es justo lo que ahora se valida. Las cinco entradas reales
  (`:112,123,134,145,156`) son todas `origen: taskcode-plugin` y ninguna lleva `:`,
  así que la validación nueva **no puede afectar al catálogo distribuido** —
  precondición que además queda anclada por el test de
  `catalogo-skills.test.ts:371`. La única incoherencia que le queda es hacia fuera,
  hacia §6.6: IMP-10.

- **Superficie de inyección.** Sin cambios. `comprobarSkillInstalado` sigue usando
  `argv` fijo y sin `shell: true`; `pluginId` no sale del proceso. Y la validación de
  IMP-9 **estrecha** el conjunto de ids externos aceptados, así que si algo se mueve
  es hacia el lado seguro.

- **El *fixture* de `plan.test.ts:754` y el test de IMP-6 de `:817` son ahora casi
  redundantes** (ambos catálogo externo con `:`, ambos aseverando que el
  `/plugin install` usa el tramo de antes). No lo cuento como hallazgo: el de la 754
  comprueba además `reglaSeleccionSkill` y la persistencia de
  `skills_recomendados` en el fichero de la tarea, así que no es un duplicado
  exacto, y el coste de tenerlos separados es bajo. Queda anotado por si alguien los
  consolida más adelante.

- **Lo que NO he podido revisar**, y conviene que quede escrito: estado real de la
  suite tras `4bcecd0` y la veracidad de la cifra 830/731/99, cobertura de la rama
  nueva de `construirEntrada`, comportamiento *end-to-end* real de `taskctl plan`
  contra un repositorio Git de verdad, y salida real de `claude plugin list --json`
  en esta máquina. Ver la sección 0.

---

## 4. Conclusión

**Esta ronda es, con diferencia, la más limpia de las cuatro, y los seis hallazgos
que la petición pedía confirmar están cerrados de verdad — los seis.** No hay
"corregido a medias" como en la ronda 3: verifiqué cada uno leyendo el código real,
no el diff, y ninguno se cae al mirarlo de cerca.

Lo mejor del commit es **IMP-9**. La validación es la correcta (regex trazado caso
por caso, aplicada sobre el `id` ya normalizado, acotada a `origen: externo`), el
mensaje de error es accionable, y sobre todo **desaparece la contradicción que era
el fondo del hallazgo**: el *fixture* que consagraba un contraejemplo está
arreglado, así que ya no hay dos tests verdes en `plan.test.ts` afirmando lecturas
incompatibles de `skill_N_id`. Los cinco tests unitarios cubren los cuatro casos
inválidos y la precondición, el *end-to-end* comprueba además que no se deja
`planificacion/` a medio crear, y los dos tests preexistentes que el cambio de orden
afectaba se ajustaron **con el motivo escrito**, no silenciados. Es el nivel de
disciplina que el repositorio dice exigir.

Añado un positivo que ningún informe anterior comprobó y que en este repo no es
menor: **el build versionado (`dist/src/`) lleva los dos cambios de código**
(`dist/src/core/catalogo-skills.js:192` y `dist/src/commands/plan.js:425-430`).
Como `dist/` es lo que ejecuta quien instala el plugin y `distribucion.test.ts`
declara explícitamente que el desfase `src/`↔`dist/` queda fuera de su alcance, un
arreglo que no se hubiera recompilado habría sido un arreglo que no llega a nadie.
No es el caso.

**Aun así el veredicto es `cambios-solicitados`, por un solo IMPORTANTE**, y es el
residuo directo de IMP-8: **la corrección arregló el ejemplo YAML de §6.6 pero no la
prosa del paso 4 de esa misma sección**, que sigue diciendo `/plugin install X@Y`
con `X` = el *skill*. Aplicado al ejemplo recién corregido da
`/plugin install figma:figma-generate-design@claude-plugins-official`, y el comando
real es `figma@claude-plugins-official`. Duele porque §6.6 es el documento al que
`catalogo-skills.yml` delega la autoridad de la convención **dos veces**, y al que
ahora remite también el mensaje de error nuevo de IMP-9: el código manda al usuario
a leer la sección que le va a dar la fórmula equivocada. Es el tercer informe
consecutivo que tropieza con la ambigüedad del mismo campo en el mismo documento, y
se cierra con una línea.

Los cuatro MENOR son de acabado y ninguno bloquea nada: dos acotan el alcance real
de lo que IMP-9 dejó cerrado (**MEN-20**, la validación admite espacios dentro de
los tramos; **MEN-21**, el test *end-to-end* asevera la clase del error y no el
mensaje, así que pasaría igual por otra causa), uno es una ruta interna que se coló
en la salida de error de cara al usuario (**MEN-22**), y el cuarto es precisión del
registro de auditoría (**MEN-23**: el cierre de MEN-17 dice haber verificado más de
lo que verificó).

Y hay que decir dos cosas de método, sin adornos:

1. **Esta ronda tampoco ha ejecutado la suite.** Es la tercera consecutiva con la
   herramienta de shell rota, verificado esta vez también en modo *background* y
   descartando que sea el perfil del usuario. **La cifra 830/731/99 que declaran la
   petición y `tarea.md` sigue apoyada únicamente en la palabra de quien
   implementó.** No la contradigo —no tengo con qué—, pero en un repositorio cuya
   regla número tres es "evidencia, no suposición", conviene que quede claro que
   lleva cuatro rondas sin corroboración independiente. Si la tarea se cierra con
   este informe, esa laguna debería quedar anotada en el `Resultado` tal cual.
2. **El *worktree* aislado volvió a apuntar a la rama equivocada, por tercera vez
   seguida** (§0.1): `worktree-agent-ab8c48c6e595ec7f1` en `ce5947d`, el cierre de
   TASK-016, cuando la rama de la tarea está en `4bcecd0`. Lo confirmé leyendo seis
   ficheros de Git y cruzándolo por contenido del árbol. La anotación en
   `docs/contexto/HALLAZGOS.md` que pidieron las rondas 2 y 3 sigue pendiente.

En resumen: **el fondo de la tarea está prácticamente cerrado.** IMP-10 es una
línea de documentación; MEN-20 y MEN-21 son un regex y un `assert.match`; MEN-22 es
borrar una ruta de un mensaje; MEN-23 es reescribir una frase. Si se corrigen —o si
se decide no corregir alguno y se documenta la decisión en el `Resultado`, como
permite `CLAUDE.md`—, no veo nada que impida cerrar la revisión por pares en una
quinta ronda corta.
