# Informe de revisión — TASK-017 (ronda 2)

- Tarea: TASK-017 — Catálogo de skills determinista con selección en dos pasos
- Rama revisada: `feature/task-017-catalogo-de-skills-determinista-con-sele`
- Commit revisado: c284203dac697e2d7ec4d4c79e847b93e1a547c2
- Revisor: agente revisor independiente (`code-reviewer`); no es el autor de la implementación
- Fecha: 2026-09-09
- Veredicto: cambios-solicitados

**Cero críticos. 2 importantes, 4 menores.** Los dos importantes **no son
defectos del trabajo original: son defectos de las correcciones**, igual que
pasó en TASK-031 y como ya advierte el propio `tarea.md` al hablar del patrón
que compartían IMP-2 e IMP-4. De los cinco puntos que la petición pide
confirmar, **tres se comportan exactamente como se afirma**, uno se comporta
como se afirma pero descansa sobre una convención que el fichero distribuido
documenta al revés, y otro está corregido solo a medias.

---

## 0. Limitación grave de esta ronda: NO se pudo ejecutar la suite

Esto va lo primero porque condiciona todo lo demás y porque callarlo sería
justo lo contrario de lo que exige `CLAUDE.md` ("evidencia, no suposición").

En el entorno de esta ronda **la herramienta de shell está rota**: cualquier
invocación, hasta `true` o `echo hola`, muere antes de ejecutar nada con

```
/usr/bin/bash: -c: line 71: syntax error: unexpected end of file
```

El número de línea del error **no cambia** al pasar un comando de 1 línea o de
10, lo que sitúa el fallo en el preámbulo que la herramienta antepone al
comando, no en el comando. Se probó con y sin *sandbox* y en modo *background*:
idéntico resultado. En consecuencia **no se ha podido correr `npm install` ni
`npm test`**, ni levantar repositorios Git temporales, ni sondear el binario
`claude` real.

Consecuencias que hay que asumir al leer este informe:

- **No puedo confirmar el estado de la suite** (ni los 819/822 que afirma
  `tarea.md`, ni que los únicos rojos sean los tres conocidos de Windows). Esa
  afirmación de `tarea.md` queda **sin verificar**, no refutada.
- **No puedo confirmar la cobertura** de los módulos nuevos.
- Todo lo que sigue se ha verificado **leyendo el código real en disco y
  trazando a mano funciones puras y deterministas**, no ejecutándolas. Es
  suficiente para los dos hallazgos IMPORTANTE (uno es una contradicción
  documental literal entre dos ficheros; el otro es el trazado de una función
  pura de seis líneas), pero no lo es para descartar regresiones.

Por sí sola, esta limitación ya impediría un "aprobada": el criterio del
repositorio es que el revisor **reproduce**, y aquí no se ha podido. Los dos
IMPORTANTE de abajo son razón independiente y suficiente.

### 0.1 El *worktree* aislado no estaba en la rama de la tarea

La ronda se lanzó con aislamiento activado sobre
`.claude/worktrees/agent-a2b4c6a361f2840a0`, pero ese *worktree* está en
`develop` (`aae41a4`), donde **TASK-017 sigue en `00-planificadas`** y no
existe ninguno de los ficheros a revisar (`src/core/catalogo-skills.ts`,
`plan-desempate-skill.ts`, `plugin-instalado.ts` ni la carpeta
`tareas/03-en-revision/TASK-017/`). Se comprobó leyendo los ficheros de Git
directamente:

- `.git/HEAD` del árbol principal →
  `ref: refs/heads/feature/task-017-catalogo-de-skills-determinista-con-sele`
- `.git/refs/heads/feature/task-017-catalogo-de-skills-determinista-con-sele` →
  `c284203dac697e2d7ec4d4c79e847b93e1a547c2` — **coincide con el HEAD que
  declara la petición**.
- `.git/worktrees/agent-a2b4c6a361f2840a0/HEAD` →
  `ref: refs/heads/worktree-agent-a2b4c6a361f2840a0` (derivada de `develop`).

La revisión se ha hecho, por tanto, leyendo el árbol de trabajo principal, que
sí está en la punta de la rama. Este informe se escribió primero dentro del
*worktree* aislado, en su ruta canónica relativa, porque el aislamiento impedía
escribir en el árbol compartido; se ha trasladado después a mano a
`tareas/03-en-revision/TASK-017/revision/informe-revision-2.md` de la rama de
la tarea, junto a `peticion-revision-2.md`, sustituyendo el scaffold.

---

## 1. Los cinco puntos que pedía la petición

| # | Punto a confirmar | Resultado |
|---|---|---|
| 1 | `comprobarSkillInstalado`/`interpretarResultadoPluginList` comparan el `id` COMPLETO | **Confirmado** |
| 2 | El aviso compone un `/plugin install` ejecutable de verdad | **Solo para ids sin `:`** — ver IMP-6 |
| 3 | `cargarCatalogoSkills()` va antes de toda escritura del scaffold | **Confirmado** |
| 4 | `leerGanadorDesempate` salta el encabezado Markdown | **Confirmado, pero la corrección es parcial** — ver IMP-7 |
| 5 | `total_skills > 1000` aborta con mensaje claro, no `RangeError` | **Confirmado** |

Detalle de los tres confirmados sin reservas:

**(1) Comparación por `id` completo.** `plugin-instalado.ts:92` es
`reconocibles.some((entrada) => entrada.id === pluginId)`, con `pluginId`
recibido entero desde `plan.ts`. No queda ningún `split('@')` ni ninguna
comparación por marketplace suelto en el módulo. El fallo cerrado además se
completó de verdad: un array **no vacío** en el que ningún elemento sea un
objeto con `id` de tipo `string` devuelve `'no-verificable'` (líneas 84-90), no
`'no-instalado'` — que era el agujero real de IMP-1. El array vacío sigue
siendo `'no-instalado'`, que es lo correcto: la lista se pudo leer y el plugin
no está. La afirmación de la petición sobre IMP-5 es cierta.

**(3) Orden de `cargarCatalogoSkills()`.** Está en `plan.ts:425`, junto a
`cargarHeuristica()` (410) y **antes** del `mkdir` de `planificacion/` (486) y
del `writeFile` de `plan-final.md` (514). Se recorrió el cuerpo de
`runPlanCommand` desde la línea 320 hasta la 425 buscando escrituras: no hay
ninguna, solo `parseArgs`, dos `readTareaFile`, `assertTransitionAllowed` y
`ensureBaseBranchReady`. El único efecto lateral previo es el posible cambio de
rama de `ensureBaseBranchReady`, que es idéntico para la heurística, exige el
*workspace* limpio y es anterior a TASK-017. El test de regresión de MEN-8
(`plan.test.ts:812`) comprueba las tres cosas que importan —rechazo con
`CatalogoSkillsError`, tarea sin mover, `planificacion/` inexistente—, y no es
un test tautológico: si alguien devolviera la llamada a su sitio anterior, el
`mkdir` de la 486 ya habría corrido y la tercera aserción se pondría roja.

**(5) Cota de `total_skills`.** `catalogo-skills.ts:161` corta con
`CatalogoSkillsError` **antes** de `construirClavesValidas(totalSkills)` (168),
que es donde estaba el `RangeError`. `cli.ts:427` incluye `CatalogoSkillsError`
en la lista de errores reconocidos, así que sale por `printCliError` con exit
1 y no por "taskctl no pudo arrancar". El mensaje dice qué mirar ("Revisa que
el número no tenga cifras de más"). Correcto y bien colocado.

---

## 2. Hallazgos

### CRÍTICO

Ninguno.

### IMPORTANTE

#### IMP-6 — El arreglo de MEN-11 asume un formato de `skill_N_id` que el catálogo distribuido documenta al revés, y nadie lo prueba

`plan.ts:599-607` deriva el nombre del plugin del `id` de catálogo:

```ts
// "skill_N_id" de una entrada externa es "plugin:skill" (seccion
// 6.6 del catalogo); el nombre del PLUGIN es el tramo antes de ":".
const nombrePlugin = entradaGanadora.id.split(':')[0]!;
const pluginId = `${nombrePlugin}@${entradaGanadora.marketplace}`;
```

El comentario **cita como fuente el catálogo, y el catálogo dice lo contrario**.
`scripts/catalogo-skills.yml`, líneas 27-33 — el fichero que se distribuye y
que el equipo edita a mano:

```
#   skill_N_id                 identificador del skill. [...]
#                               Para uno externo, "marketplace:skill" (ver
#                               el ejemplo "figma:figma-generate-design" de
#                               la seccion 6.6). Debe ser unico en todo el
#                               fichero.
```

Y `tarea.md:205`, al documentar MEN-11, dice justo lo opuesto: *"un `id` de
CATALOGO (forma `"plugin:skill"`, p. ej. `"figma:figma-generate-design"`)"*.
Mismo ejemplo, dos lecturas incompatibles del mismo tramo.

No es una discusión de comentarios: decide si el comando emitido es ejecutable.
Con la entrada que la propia sección 6.6 pone de ejemplo y que el catálogo
manda copiar:

```
skill_6_id: figma:figma-generate-design
skill_6_origen: externo
skill_6_marketplace: figma
```

`nombrePlugin` = `"figma"` (que bajo la convención documentada es el
**marketplace**), y el aviso sale como `/plugin install figma@figma`. Si el
prefijo es de verdad el marketplace, **el nombre del plugin no está registrado
en ninguna parte del modelo de datos**: el catálogo guarda `marketplace` y un
`id` cuyo prefijo también sería el marketplace, y `/plugin install X@Y` exige
un nombre de plugin que nadie tiene. Es decir: bajo la documentación vigente
del fichero, el comando **no se puede componer bien**, y MEN-11 no está
cerrado, solo desplazado.

Y no hay red que lo detecte. El único test que recorre esta rama
(`plan.test.ts:754`) usa `skill_1_id: skill-externo-de-prueba`, **sin dos
puntos**: `split(':')[0]` devuelve el id entero y la aserción pasa sin ejercer
la lógica que se añadió. La línea del `split(':')` está, a efectos prácticos,
sin cubrir por ningún caso que la distinga de no existir.

Por qué IMPORTANTE y no CRÍTICO: hoy es inalcanzable, porque las cinco entradas
del catálogo distribuido son `origen: taskcode-plugin`. Es exactamente el mismo
razonamiento con el que la ronda 1 clasificó IMP-1 como IMPORTANTE, y pasa a
morder en cuanto alguien añada la primera entrada `externo` siguiendo la
documentación del fichero — que es lo que el propio fichero invita a hacer
("añadir una es tan barato como sumarle un bloque más").

Sugerencia: decidir la convención **una vez** y alinear los tres sitios
(`catalogo-skills.yml`, `plan.ts` y `tarea.md`). Si el prefijo es el nombre del
plugin, corregir la cabecera del YML y añadir un test con un id **con** `:`
que fije `/plugin install <prefijo>@<marketplace>`. Si el prefijo es el
marketplace, hace falta un campo nuevo (`skill_N_plugin`), porque ese dato hoy
no existe. Cualquiera de las dos vale; lo que no vale es que el fichero que lee
el equipo diga una cosa y el código haga otra.

---

#### IMP-7 — La corrección de IMP-4 se queda a una línea: el scaffold sigue conteniendo algo que el lector no sabe leer, y el test que dice cubrirlo no lo cubre

`leerGanadorDesempate` ahora salta líneas en blanco y líneas que empiezan por
`#`. Pero el scaffold que escribe el propio comando
(`plan-desempate-skill.ts:68`) es:

```markdown
# Salida del desempate de skill — TASK-XXX

(pendiente de completar)
```

`(pendiente de completar)` **no empieza por `#`**. Trazando la función a mano
sobre el caso "dejo el scaffold como está y escribo debajo":

```
entrada:  "# Salida del desempate de skill — TASK-042\n\n(pendiente de completar)\n\njava-spring-reviewer\n"
split     ["# Salida...", "", "(pendiente de completar)", "", "java-spring-reviewer", ""]
find      -> "(pendiente de completar)"      (no vacía y no empieza por "#")
candidatos.find(c => c.id === "(pendiente de completar)") -> undefined
retorno   -> null
```

O sea: **el mismo descarte silencioso de IMP-4, con el mismo aviso repetido
byte a byte y sin ninguna pista**, solo que ahora se dispara una línea más
abajo. Y el docblock recién añadido (`plan-desempate-skill.ts:79-85`) afirma
precisamente que ese flujo funciona: *"responder debajo de él (dejándolo
intacto, igual que se hace con los `salida-brainstorm-*.md`) es la forma obvia
de completar el scaffold"*. Dejarlo intacto es justamente lo que no funciona.
La analogía con el brainstorm además no se sostiene: `salidaRolTemplate`
(`plan-brainstorm.ts:158-165`) genera **solo** encabezados y líneas en blanco,
sin ningún marcador de relleno, así que allí "dejarlo intacto y escribir
debajo" sí es coherente.

Lo que agrava el hallazgo es la red de tests. `plan-desempate-skill.test.ts:164`
se llama *"leerGanadorDesempate deja el scaffold intacto pero responde debajo"*,
pero su cuerpo hace:

```ts
salidaDesempateSkillTemplate(tarea({ id: 'TASK-042' })).replace(
  '(pendiente de completar)',
  'java-spring-reviewer\n\nPorque el nucleo es backend.'
);
```

es decir, **borra el marcador** antes de leer. El escenario que da nombre al
test es el único que no se prueba, y es el que falla. Es el mismo problema que
la ronda 1 le puso a IMP-2: un test verde que no protege de nada, con el
agravante de que aquí el nombre afirma lo contrario de lo que el código hace —
quien lo lea dentro de seis meses concluirá que el caso está cubierto.

Por qué IMPORTANTE: `tarea.md:175-182` identifica como causa raíz común de
IMP-2 e IMP-4 que *"el scaffold que un comando genera no coincidía con lo que
el propio comando esperaba leer después"*, y afirma que la corrección fue
*"alinear lo que el comando escribe con lo que el comando lee"*. Esa alineación
no se completó: el comando sigue escribiendo una línea que el comando no sabe
leer. Reconozco que está en el límite con MENOR —la petición de desempate sí
instruye "una única línea con el `id` EXACTO", el daño es un reintento y no hay
pérdida de datos—, pero la ronda 1 clasificó este mismo escenario como
IMPORTANTE y no veo motivo para bajarlo mientras siga abierto.

Sugerencias (cualquiera cierra el caso, la tercera es la que más rinde):

1. Que el scaffold no lleve marcador: encabezado y una línea en blanco.
2. Que `leerGanadorDesempate` salte también la línea de plantilla exacta.
3. La que ya sugería la ronda 1 y sigue sin aplicarse: **distinguir el aviso**.
   Hoy "la salida sigue con el texto de plantilla" y "la salida dice `<X>`, que
   no es ninguno de los candidatos" producen el mismo mensaje idéntico. Con
   decir *"leí `<X>` en la primera línea y no es ninguno de los candidatos"* el
   fallo se diagnostica solo, y deja de importar dónde esté el marcador.

Y en cualquier caso: renombrar el test, o hacer que su cuerpo coincida con su
nombre.

### MENOR

- **MEN-12 — `tarea.md` describe la corrección de IMP-1 con el código que ya no
  está.** `tarea.md:109` dice *"Corregido: se lee `id.split('@').at(-1)`"*. Eso
  fue el arreglo de `5923c9d`, y `5e6a5ba` lo sustituyó por la comparación del
  `id` completo. En `plugin-instalado.ts` no queda ningún `split('@')`. El
  `Resultado` de la tarea es el registro de auditoría, y ahí describe un código
  que no existe.

- **MEN-13 — La instrucción que se le da al agente del desempate ya no es
  exacta.** `peticionDesempateSkillTemplate` (`plan-desempate-skill.ts:54`)
  sigue diciendo *"taskctl solo lee la primera línea no vacía"*. Desde IMP-4 lee
  la primera línea no vacía **que no empiece por `#`**. La imprecisión es
  benigna (la nueva regla es más permisiva, no menos), pero es texto que se
  entrega a quien tiene que responder, y queda desalineado justo en el punto
  donde IMP-7 sigue mordiendo.

- **MEN-14 — Un plugin instalado pero deshabilitado se reporta como
  `'instalado'` y el aviso desaparece.** La salida real de `claude plugin list
  --json` incluye `enabled` (así lo documenta el propio docblock de
  `plugin-instalado.ts:23-30` y lo recogió la ronda 1), y el código solo mira
  `id`. Con `enabled: false` el skill no está disponible pero `taskctl plan`
  calla. Es discutible que `/plugin install` sea el consejo correcto en ese
  caso, así que puede ser legítimo no avisar; lo que no está es **decidido**:
  ni el docblock ni `tarea.md` mencionan `enabled`. Basta una línea diciendo
  que se ignora a propósito.

- **MEN-15 — `tarea.md` da por escrito un informe de ronda 2 que no existía, y
  ahora contradice al que sí existe.** La sección *"Ronda 2 de revisión por
  pares"* (`tarea.md:184-226`) afirma que `informe-revision-2.md` contiene un
  veredicto de cambios-solicitados con "1 importante y 4 menores" (IMP-5,
  MEN-8..MEN-11). Ese fichero era un scaffold vacío hasta este informe —cosa
  que `peticion-revision-2.md` reconoce con honestidad—, y lo que contiene
  ahora es otra cosa. La tabla *"2 rondas, 16 hallazgos"* (`tarea.md:91-96`)
  queda desfasada por el mismo motivo. Hay que reescribir esa sección: o la
  pasada informal se documenta como lo que fue (una pasada sin artefacto, entre
  rondas), o se renumera esta como ronda 3. Tal como está, el registro de la
  tarea afirma sobre un fichero algo que el fichero desmiente.

---

## 3. Áreas revisadas sin hallazgos

- **`interpretarResultadoPluginList`, matriz completa de desenlaces.** Trazados
  a mano los diez caminos: `result.error`, `status !== 0`, `status === null`
  (timeout), `stdout` no string, JSON inválido, no-array, array vacío, array no
  vacío sin elementos reconocibles, array con reconocibles sin coincidencia, y
  coincidencia exacta. Ninguna combinación devuelve `'instalado'` sin un `id`
  string estrictamente igual. El `filter` con predicado de tipo descarta `null`
  (porque `typeof null === 'object'` se corta con `entrada !== null`), los
  arrays anidados (no tienen `id` string) y `{id: 42}`. Los tests de
  `plugin-instalado.test.ts:96-107` cubren esas cinco trampas en bucle. La
  doctrina *fail-closed* que declara el docblock se cumple.

- **`plan.ts`, recálculo de rutas del desempate tras el `move` (IMP-2).**
  `plan.ts:929-940` reconstruye `peticionDesempateSkillPath` y
  `avisoSkillDesempatePendiente` sobre `path.dirname(newFilePath)`, con el
  mismo patrón que `brainstormDirFinal`. El flujo de banderas es correcto:
  `peticionDesempateSkillPath` se asigna (574) **antes** de decidir si hay
  ganador, así que `hayDesempatePendiente === true` implica siempre
  `peticionDesempateSkillPath !== null` y no queda ningún camino que construya
  el aviso con rutas de origen. En una re-planificación (tarea ya en
  `01-en-diseno`) `newFilePath === filePath` y el recálculo es idempotente. El
  test de `plan.test.ts:731-736` ya no esquiva el problema: **asierta la ruta de
  destino** contra `result.peticionDesempateSkill` y contra el texto del aviso,
  en vez de reconstruirla a mano. Corrección real y test que la fija.

- **Parser del catálogo.** Revisado íntegro. `total_skills` se resuelve antes
  que nada (necesario, porque el universo de claves válidas depende de él), las
  claves repetidas y desconocidas abortan con sugerencia por distancia de
  edición, los validadores tipados rechazan lo que dicen rechazar, y la regla
  cruzada `origen: externo` ⇒ `marketplace` obligatorio / `taskcode-plugin` ⇒
  `marketplace` prohibido está implementada en los dos sentidos.
  `validarIdsUnicos` compara sobre el catálogo ya construido, después de los
  `trim`, así que `"a"` y `" a"` colisionan como deben. No encontré ninguna vía
  para que un catálogo mal formado se cuele como válido.

- **`seleccionarSkill`.** Solape → prioridad → empate. `Math.max(...)` sobre
  arrays acotados por `total_skills ≤ 1000`, así que la cota nueva cierra de
  paso el riesgo de desbordar la pila con el *spread*. Cero candidatos devuelve
  la terna vacía sin lanzar, como exige el diseño no exhaustivo.

- **Superficie de inyección.** `spawnSync('claude', ['plugin','list','--json'])`
  con argv fijo y **sin** `shell: true`. Lo único que cambió con IMP-5/MEN-11 es
  qué cadena se compara **en memoria**; `pluginId` sigue sin llegar al
  subproceso. Un `skill_N_id` hostil (`"; rm -rf /"`) no puede salir del
  proceso. Sin hallazgos de seguridad.

- **Cableado de la salida del CLI.** `seleccionSkillNotice` (`cli.ts:154-172`)
  acumula los cuatro avisos sin excluirse entre sí, y `CatalogoSkillsError`
  está en la lista de errores reconocidos de `cli.ts:427`, así que un catálogo
  corrupto sale por el camino de error bueno.

- **MEN-9 (aceptado sin corregir en la pasada informal): confirmado tal cual.**
  El ternario de `plan.ts:615-618` existe y distingue las dos redacciones, pero
  ninguna prueba lo recorre: buscar *"no se ha podido comprobar"* en `test/` no
  devuelve nada. La justificación de `tarea.md` (no se puede forzar
  `'no-verificable'` sin mockear el subproceso) es correcta con las reglas de
  este repositorio. Lo dejo como estaba: aceptado, no reabierto.

- **Lo que NO he podido revisar**, y conviene que quede escrito: estado real de
  la suite, cobertura, comportamiento end-to-end de `taskctl plan` contra un
  repositorio Git real, y salida real de `claude plugin list --json` en esta
  máquina. Ver la sección 0.

---

## 4. Conclusión

**No está lista para `taskctl finish`**, por dos motivos independientes y
acumulativos.

El primero es de método: **esta ronda no ha podido reproducir nada**. La
herramienta de shell del entorno está rota y no se ha ejecutado ni un comando.
En un repositorio cuya regla número tres es "evidencia, no suposición", un
"aprobada" firmado sin haber corrido la suite valdría menos que no firmarla.
La ronda 3 debería empezar por levantar un entorno donde `npm test` corra de
verdad y confirmar el estado de la suite, que hoy sigue apoyado únicamente en
la palabra de quien implementó.

El segundo es de fondo, y no depende de la limitación anterior, porque los dos
hallazgos son verificables leyendo:

1. **IMP-6** — la corrección de MEN-11 lee el prefijo del `id` de catálogo como
   nombre de plugin, mientras el catálogo que se distribuye documenta ese mismo
   prefijo como el marketplace, con el mismo ejemplo. Uno de los dos está mal,
   la línea no la cubre ningún test (el único caso externo usa un id sin `:`) y
   bajo la convención documentada el `/plugin install` sigue sin ser componible.
2. **IMP-7** — la corrección de IMP-4 salta el encabezado pero no el
   `(pendiente de completar)` que el propio scaffold escribe dos líneas más
   abajo, así que el descarte silencioso sigue vivo en el escenario que el
   docblock declara resuelto y que el test declara cubrir sin cubrirlo.

Lo bueno, que es la mayor parte: **IMP-5 está bien corregido** —comparación por
`id` completo y fallo cerrado que ahora sí mira dentro del array—, **IMP-2 está
bien corregido y esta vez con un test que lo fija** en vez de esquivarlo,
**IMP-3/MEN-8 se sostiene** con el orden verificado línea a línea y una
regresión que lo ancla, y **MEN-3 está bien colocado**, antes del punto que
reventaba y por un camino de error que `cli.ts` reconoce. El parser del
catálogo sigue siendo sólido y no le encontré ninguna grieta. Ninguno de los
dos IMPORTANTE toca la arquitectura: los dos se arreglan con una línea de
código y una de documentación.

Los cuatro MENOR son todos de documentación o de decisión no escrita, y dos de
ellos (MEN-12 y MEN-15) están en el propio `Resultado` de la tarea, que es el
artefacto de auditoría: conviene arreglarlos antes de cerrar, porque después
nadie los vuelve a mirar.
