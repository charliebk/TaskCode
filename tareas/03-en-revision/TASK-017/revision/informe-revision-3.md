# Informe de revisión — TASK-017 (ronda 3)

- Tarea: TASK-017 — Catálogo de skills determinista con selección en dos pasos
- Rama revisada: `feature/task-017-catalogo-de-skills-determinista-con-sele`
- Commit revisado: 2b4319742ac72484ad9bcc981ab16febbfe5c05e
- Commit anterior (ronda 2): c284203dac697e2d7ec4d4c79e847b93e1a547c2
- Revisor: agente revisor independiente (`code-reviewer`); no es el autor de la implementación
- Fecha: 2026-09-09
- Veredicto: cambios-solicitados

**Cero críticos. 2 importantes, 4 menores.** Los dos hallazgos que la petición
pide confirmar —IMP-6 e IMP-7— **están corregidos de verdad**, y los dos MENOR
documentales (MEN-12, MEN-14) también, más un tercero que la petición no
menciona (MEN-13). No es una ronda "sin hallazgos, cierre limpio", pero por
poco: **IMP-7 está cerrado del todo y bien probado**, y los dos IMPORTANTE
nuevos son el residuo de IMP-6 — la convención `"plugin:skill"` quedó fijada
por escrito en el YML, pero **el documento normativo que ese mismo comentario
cita como fuente sigue diciendo otra cosa**, y **nadie valida ni prueba esa
convención**: el test que ya existía consagra un contraejemplo.

---

## 0. Limitación de método: tampoco esta ronda ha podido ejecutar la suite

Va lo primero, igual que en la ronda 2, porque condiciona el alcance de todo lo
demás y porque callarlo sería lo contrario de lo que exige `CLAUDE.md`
("evidencia, no suposición").

**La herramienta de shell sigue rota, exactamente igual que en la ronda 2.**
Cualquier invocación muere antes de ejecutar nada:

```
/usr/bin/bash: -c: line 71: unexpected EOF while looking for matching `''
```

Comprobaciones hechas antes de darlo por perdido:

- `echo ok`, `pwd`, `ls tareas`, `mkdir -p ...` → mismo error, mismo número de
  línea (71). El número **no cambia** con la longitud del comando, lo que sitúa
  el fallo en el preámbulo que la herramienta antepone, no en el comando.
- Con y sin *sandbox* (`dangerouslyDisableSandbox`) → idéntico.
- En modo *background* (proceso desacoplado, salida a fichero) → idéntico; el
  fichero de salida contiene solo esa línea de error.
- Sintaxis PowerShell (`Get-ChildItem`) y `powershell.exe -NoProfile -Command
  ...` → idéntico: la herramienta enruta a `/usr/bin/bash` en todos los casos,
  así que "usar PowerShell en vez de Bash" no es una alternativa disponible
  desde aquí.

Consecuencias que hay que asumir al leer este informe:

- **No se ha podido correr `npm run build` ni `npm test`.** El estado de la
  suite tras `2b43197` queda **sin verificar**, no refutado.
- **No se ha podido medir cobertura** de las dos líneas nuevas.
- Todo lo que sigue se verificó **leyendo el código real en disco y trazando a
  mano funciones puras y deterministas**, más lectura directa de los ficheros
  de Git y del árbol de plugins de la máquina. Es suficiente para los dos
  IMPORTANTE de abajo (uno es una contradicción documental literal entre dos
  ficheros del repo, comprobada además contra un plugin real instalado; el otro
  es una validación ausente que se ve leyendo `construirEntrada`), pero **no lo
  es para descartar regresiones**.

### 0.1 El *worktree* aislado volvió a no estar en la rama de la tarea

Se repite el problema que la ronda 2 documentó en su sección 0.1. La ronda se
lanzó sobre `.claude/worktrees/agent-a98842a5a49e1367e`, y ahí no existe **nada**
de lo que había que revisar: ni `src/core/plan-desempate-skill.ts`, ni
`plugin-instalado.ts`, ni `scripts/catalogo-skills.yml`, ni la carpeta
`tareas/03-en-revision/TASK-017/`. TASK-017 aparece en `00-planificadas`.
Comprobado leyendo los ficheros de Git directamente:

- `.git/worktrees/agent-a98842a5a49e1367e/HEAD` →
  `ref: refs/heads/worktree-agent-a98842a5a49e1367e`
- `.git/refs/heads/worktree-agent-a98842a5a49e1367e` →
  `ce5947d022bfb828979eb587797fc480b329933c` (el cierre de TASK-016, **anterior**
  a todo el trabajo de TASK-017)
- `.git/HEAD` del árbol principal →
  `ref: refs/heads/feature/task-017-catalogo-de-skills-determinista-con-sele`
- `.git/refs/heads/feature/task-017-...` →
  `2b4319742ac72484ad9bcc981ab16febbfe5c05e` — **coincide con el HEAD que declara
  la petición**.

La revisión se ha hecho, por tanto, leyendo el árbol de trabajo principal, que
sí está en la punta de la rama. Este informe se escribe dentro del *worktree*
aislado, en su ruta canónica relativa, porque el aislamiento **impide** escribir
en el árbol compartido (se intentó y la herramienta lo rechazó explícitamente);
hay que trasladarlo a mano a
`tareas/03-en-revision/TASK-017/revision/informe-revision-3.md` de la rama de la
tarea, junto a `peticion-revision-3.md`. En ese árbol el fichero **no existía**:
no había scaffold que sustituir, al contrario de lo que suponía la petición.

**Esto ya va por la segunda ronda consecutiva.** El aislamiento por *worktree*
no está aportando nada —el revisor acaba leyendo el árbol compartido de todos
modos— y sí está costando tiempo y un traslado manual en cada ronda. Merece una
anotación en `docs/contexto/HALLAZGOS.md` independientemente de lo que pase con
TASK-017.

---

## 1. Los hallazgos que la petición pide confirmar

| # | Punto a confirmar | Resultado |
|---|---|---|
| IMP-6 | La convención `skill_N_id` = `"plugin:skill"` queda alineada entre catálogo, código y tarea | **Corregido a medias** — ver IMP-8 e IMP-9 |
| IMP-7 | `leerGanadorDesempate` salta el marcador de relleno del scaffold | **Confirmado, y bien probado** |
| MEN-12 | `tarea.md` ya no cita `id.split('@').at(-1)` | **Confirmado** |
| MEN-14 | La decisión sobre `enabled: false` queda escrita en `plugin-instalado.ts` | **Confirmado, y coherente con el código** |
| — | MEN-13 (que la petición no menciona) | **Corregido también** |

### 1.1 IMP-7 — cerrado de verdad, y el test ya no miente

Es la parte mejor resuelta de este commit, y conviene decirlo con detalle
porque la ronda 2 tuvo que señalar precisamente lo contrario.

**La corrección.** `plan-desempate-skill.ts:33` introduce la constante
compartida:

```ts
const PLACEHOLDER_SALIDA_DESEMPATE = '(pendiente de completar)';
```

y la usa en los **tres** sitios que tenían que estar de acuerdo:

- la escribe el scaffold (`salidaDesempateSkillTemplate`, línea 80);
- la salta el lector (`leerGanadorDesempate`, línea 108:
  `.find((l) => l !== '' && l !== PLACEHOLDER_SALIDA_DESEMPATE && !l.startsWith('#'))`);
- la cita el texto que se le entrega a quien responde
  (`peticionDesempateSkillTemplate`, línea 65).

Que sea una **constante** y no tres literales sueltos es lo que cierra el caso:
el modo de fallo de IMP-4 e IMP-7 era exactamente que "lo que el comando
escribe" y "lo que el comando lee" divergieran. Ahora no pueden divergir sin que
el compilador lo note.

**Trazado a mano del escenario que fallaba**, con el contenido literal que
produce el scaffold más una respuesta debajo sin borrar nada:

```
entrada:  "# Salida del desempate de skill — TASK-042\n\n(pendiente de completar)\n\njava-spring-reviewer\n"
split     ["# Salida...", "", "(pendiente de completar)", "", "java-spring-reviewer", ""]
find      descarta "# Salida..."               (startsWith '#')
          descarta ""                          (=== '')
          descarta "(pendiente de completar)"  (=== PLACEHOLDER_SALIDA_DESEMPATE)  <-- lo nuevo
          descarta ""
          -> "java-spring-reviewer"
retorno   candidato con id "java-spring-reviewer"
```

**Los tests sí prueban lo que dicen probar.** Verificado uno por uno:

- `plan-desempate-skill.test.ts:164` (el que la ronda 2 acusó de esquivar el
  caso con `.replace()`) ahora construye la salida **sin tocar el scaffold**, y
  además ancla la precondición:

  ```ts
  const scaffold = salidaDesempateSkillTemplate(tarea({ id: 'TASK-042' }));
  assert.ok(scaffold.includes('(pendiente de completar)'));
  const salida = `${scaffold}\njava-spring-reviewer\n\nPorque el nucleo es backend.\n`;
  ```

  Ese `assert.ok` intermedio no es decorativo: si alguien quitase el marcador del
  scaffold, el test se pondría rojo en vez de seguir verde por otro motivo. Es
  justo la disciplina que `catalogo-skills.test.ts` declara en su cabecera
  ("comprobar una PRECONDICIÓN explícita antes de asumir una relación").

- `plan-desempate-skill.test.ts:176`, el test nuevo, aísla el salto:

  ```ts
  leerGanadorDesempate('# Salida del desempate de skill — TASK-042\n\n(pendiente de completar)\n\nb\n', CANDIDATOS)
  ```

  **Comprobado que falla sin el arreglo**: revirtiendo la línea 108 a la versión
  de `c284203` (`.find((l) => l !== '' && !l.startsWith('#'))`), `find` devuelve
  `"(pendiente de completar)"`, ningún candidato de `CANDIDATOS` tiene ese `id`
  (son `'a'` y `'b'`, líneas 62-65) y la función retorna `null` ≠ `'b'`. Los dos
  tests son regresiones reales, no falsos positivos ni asserts vacíos.

- El fail-closed no se ha aflojado por el camino:
  `plan-desempate-skill.test.ts:104` sigue exigiendo que el scaffold **recién
  generado** se lea como `null`, y `:181` que un fichero con solo encabezados
  también. La permisividad añadida es exactamente una línea, y está acotada.

Sin reservas: IMP-7 está cerrado.

### 1.2 MEN-14 — la decisión está escrita y describe el código real

`plugin-instalado.ts:41-50` documenta que un elemento con `id` coincidente pero
`enabled: false` cuenta como `'instalado'`. Contrastado contra el código de la
misma función: `interpretarResultadoPluginList` (líneas 95-104) filtra por
`typeof entrada.id === 'string'` y decide con
`reconocibles.some((entrada) => entrada.id === pluginId)`. **`enabled` no se
lee en ningún sitio del módulo.** La documentación describe el comportamiento
real, no uno deseado, y da la razón (el estado modela "descargado y registrado",
no "activo"). Coherente.

### 1.3 MEN-12 — corregido

Buscado `split('@')` en todo `tarea.md`: la única aparición que queda es la de
la propia entrada de MEN-12 explicando que esa cita se retiró. La descripción de
IMP-1 (`tarea.md:105-113`) ahora remite a la comparación por `id` completo que
trajo IMP-5, que es lo que hay en `plugin-instalado.ts:103`. Correcto.

### 1.4 MEN-13 — corregido, aunque la petición no lo dice

La petición no lo menciona, pero el commit **también cierra MEN-13** (ronda 2):
`peticionDesempateSkillTemplate` decía "la primera línea no vacía" y ahora dice
(líneas 62-66) *"la primera linea que no este vacia, no sea un encabezado
Markdown ni el marcador `"(pendiente de completar)"` del scaffold"* — las tres
reglas que aplica el lector, ni una más ni una menos. Bien. Lo anoto como
positivo, y como aviso de que el `Resultado` sí lo recoge (`tarea.md:257`) pero
la petición de revisión no, lo que obliga al revisor a descubrirlo por su cuenta.

---

## 2. Hallazgos

### CRÍTICO

Ninguno.

### IMPORTANTE

#### IMP-8 — IMP-6 alineó tres sitios de cuatro: `docs/PROPUESTA_METODOLOGIA.md` §6.6, que el propio comentario corregido cita como autoridad, sigue diciendo lo contrario

La ronda 2 pidió literalmente *"decidir la convención **una vez** y alinear los
tres sitios (`catalogo-skills.yml`, `plan.ts` y `tarea.md`)"*. Eso se ha hecho:
el comentario del YML ahora dice `"plugin:skill"`, `plan.ts:606` ya hacía
`split(':')[0]` y `tarea.md:239-244` lo documenta. **El problema es que los
sitios eran cuatro.**

El comentario corregido (`scripts/catalogo-skills.yml:27-36`) no se limita a
fijar la convención: **delega la autoridad en la sección 6.6** de la propuesta,
y la señala con el dedo:

```
#   skill_N_id                 [...] Para uno externo, "plugin:skill" (ver el
#                               ejemplo "figma:figma-generate-design" de la
#                               seccion 6.6, donde "figma" es el PLUGIN que
#                               hay que instalar, no el marketplace que lo
#                               aloja -- ese va aparte, en
#                               skill_N_marketplace).
```

Quien siga esa referencia llega a `docs/PROPUESTA_METODOLOGIA.md:176-182`, que
**no se ha tocado**:

```yaml
- id: figma:figma-generate-design
  origen: externo
  marketplace: figma          # <-- el mismo "figma" que el comentario acaba de decir que NO es el marketplace
  rol: ejecucion
  prioridad: 5
```

El comentario dice "el marketplace va aparte, en `skill_N_marketplace`"; el
ejemplo canónico al que remite pone **`figma` también ahí**. Es decir: el lector
que hace exactamente lo que el fichero le invita a hacer —*"Anadir una es tan
barato como sumarle un bloque mas"* (`catalogo-skills.yml:92-94`)— copia ese
bloque, y `plan.ts:606-607` compone:

```
nombrePlugin = "figma"
pluginId     = "figma@figma"
aviso        -> /plugin install figma@figma
```

**Ese comando no existe.** Comprobado empíricamente en esta misma máquina
leyendo el árbol de plugins instalados:

```
~/.claude/plugins/cache/claude-plugins-official/figma/2.2.90/.claude-plugin/plugin.json
```

El plugin real es `figma@claude-plugins-official`. El `marketplace: figma` del
ejemplo de §6.6 es sencillamente falso, y arrastra a `/plugin install figma@figma`,
que es **el mismo síntoma exacto que MEN-11 (ronda 2) e IMP-6 (ronda 2) vinieron
a cerrar**. El agujero no se ha tapado: se ha movido de `catalogo-skills.yml` a
`PROPUESTA_METODOLOGIA.md`.

Agravante en el registro de auditoría: `tarea.md:239-242` justifica la
corrección diciendo que `"plugin:skill"` era *"la convencion real ya usada tanto
por el codigo [...] como por el ejemplo `"figma:figma-generate-design"` de la
seccion 6.6"*. **El ejemplo de §6.6 no respalda esa lectura**: con un `id` que
empieza por `figma` y un `marketplace: figma`, el ejemplo es ambiguo por
construcción — es precisamente el ejemplo que generó la confusión de IMP-6, y
ahora se le cita como si fuera la prueba de que no había confusión.

Por qué IMPORTANTE y no CRÍTICO: mismo razonamiento que usó la ronda 2 para
IMP-6 y la ronda 1 para IMP-1 — hoy es inalcanzable, porque las cinco entradas
del catálogo distribuido son `origen: taskcode-plugin`. Muerde en cuanto alguien
añada la primera entrada externa copiando el ejemplo normativo.

Sugerencia (una línea): corregir §6.6 a `marketplace: claude-plugins-official`,
que es el dato real, y de paso añadir el comentario `# "figma" (antes de ":") es
el PLUGIN` al lado del `id`. Con eso los cuatro sitios dicen lo mismo y el
ejemplo deja de ser un contraejemplo.

---

#### IMP-9 — La convención `"plugin:skill"` que IMP-6 acaba de hacer normativa no la valida el parser *fail-closed*, y el test que ya existía consagra un contraejemplo

`construirEntrada` (`catalogo-skills.ts:233-305`) valida, para `origen: externo`,
que `marketplace` esté presente y no vacío (líneas 281-290). **No valida en
ningún punto la forma del `id`.** `id` solo pasa por `validarTextoNoVacio`
(línea 241). No hay comprobación de que contenga `:`, ni de cuántos hay.

Eso es un *fail-open* en un módulo cuya cabecera declara explícitamente lo
contrario (`catalogo-skills.yml:100-104`):

> Lo que SI es fail-closed es el PARSEO: una entrada con un campo obligatorio
> ausente, un `rol` fuera del enum, una `prioridad` negativa, un `id` repetido o
> un `total_skills` que no cuadra [...] ABORTA taskctl plan entero.

La consecuencia es silenciosa y llega al usuario: con un `id` externo sin `:`,
`split(':')[0]` devuelve el `id` entero y `plan.ts` emite un `/plugin install`
compuesto con el nombre de un *skill* donde debería ir el nombre de un *plugin*.
No aborta, no avisa: escribe en `plan-final.md` un comando que el usuario
ejecutará y que fallará.

Y no es hipotético — **está fijado como comportamiento esperado en la suite**.
`plan.test.ts:754-810`, el test que ya existía:

```ts
'skill_1_id: skill-externo-de-prueba',      // sin ":"
'skill_1_origen: externo',
`skill_1_marketplace: ${marketplaceInventado}`,
...
assert.match(
  result.avisoSkillNoInstalada!,
  new RegExp(`/plugin install skill-externo-de-prueba@${marketplaceInventado}`)
);
```

Esa entrada de catálogo **viola la convención que el YML acaba de declarar
obligatoria**, y el test afirma que el comando resultante es el correcto. A
cincuenta líneas de distancia, el test nuevo de IMP-6 (`plan.test.ts:812-867`)
afirma la convención contraria con un `id` **con** `:`. El fichero contiene hoy
dos tests verdes que codifican lecturas incompatibles de `skill_N_id`, y nada
señala cuál es la buena.

Nota metodológica sobre el test nuevo, que conviene que quede escrita porque la
petición pide explícitamente comprobar que no sea un test que pasaría igual sin
el arreglo: **el test de IMP-6 no puede detectar una regresión de IMP-6.** El
arreglo de IMP-6 fue un comentario en un YAML; el test ejercita `plan.ts:606`,
que ya era correcto antes del commit y que la ronda 2 nunca puso en duda. Es un
buen test de regresión del *código* —si alguien cambiase a `split(':')[1]` o
`.at(-1)`, se pone rojo—, pero **el arreglo real de IMP-6 (el comentario) sigue
sin ninguna red**, y IMP-8 demuestra que esa red hacía falta.

Por qué IMPORTANTE: mismo alcance de daño que IMP-6 y misma condición de
disparo (la primera entrada `externo`), y además deja la convención sin decidir
*de facto* justo después de una ronda que pidió decidirla "una vez". Reconozco
que está en el límite con MENOR —hoy es inalcanzable y el arreglo es pequeño—,
pero mientras dos tests del mismo fichero afirmen cosas distintas, la convención
no está cerrada.

Sugerencia: en `construirEntrada`, cuando `origen === 'externo'`, exigir que
`id` contenga exactamente un `:` y que ninguno de los dos tramos esté vacío, con
un `CatalogoSkillsError` que explique la forma esperada (mismo estilo que el
mensaje de `marketplace` ausente, líneas 283-288). Y arreglar el *fixture* de
`plan.test.ts:754` para que use un `id` bien formado
(`plugin-de-prueba:skill-de-prueba`), o renombrar el test para que diga que
documenta un id degenerado.

### MENOR

- **MEN-16 — Rama muerta en el lector del desempate.** `plan.ts:575-583`:

  ```ts
  if (!(await ficheroConContenido(salidaDesempatePath))) {
    await writeFile(salidaDesempatePath, salidaDesempateSkillTemplate(task), { encoding: 'utf8' });
  }
  const ganadorDesempate = (await ficheroConContenido(salidaDesempatePath))
    ? leerGanadorDesempate(await readFile(salidaDesempatePath, 'utf8'), seleccionSkill.candidatosEmpatados)
    : null;
  ```

  El segundo `ficheroConContenido` **es siempre `true`**: si era `false`, arriba
  se acaba de escribir el scaffold, que nunca es vacío (`salidaDesempateSkillTemplate`
  devuelve encabezado + marcador); si era `true`, sigue siéndolo. La rama `: null`
  es inalcanzable, y el `stat` extra es gratuito. No es un bug —el resultado es
  correcto— pero es código que sugiere una condición que no existe, en la función
  que dos rondas seguidas han tenido que releer. Colapsarlo a la llamada directa
  quita una rama que nadie puede cubrir. (Precede a este commit; lo señalo ahora
  porque no aparece en ningún informe anterior.)

- **MEN-17 — El `Resultado` cita una cifra de suite que este commit ya invalidó.**
  `tarea.md:227-229` sigue diciendo *"la suite completa paso de 817/820 a 819/822
  (2 tests nuevos...)"*, que es la cifra de `c284203`. `2b43197` añade dos tests
  más (`plan.test.ts:812` y `plan-desempate-skill.test.ts:176`; el de
  `plan-desempate-skill.test.ts:164` se modifica, no se añade), así que la cifra
  real debería ser 821/824. La sección de la 2ª pasada (`tarea.md:231-274`) **no
  cierra con ninguna cifra**. Es el mismo defecto que la ronda 2 marcó como
  MEN-10 y MEN-12: el `Resultado` es el artefacto de auditoría, y ahí una cifra
  desfasada es una afirmación falsa. **Aviso**: esta aritmética es de lectura del
  diff, no de ejecución — ver sección 0.

- **MEN-18 — El `Resultado` describe mal la limitación del informe que cita.**
  `tarea.md:233-234` dice que el revisor de la 2ª pasada *"no pudo ejecutar la
  suite ni confirmar a que rama apuntaba su propio worktree aislado"*. Lo primero
  es cierto; **lo segundo no**: `informe-revision-2.md` §0.1 confirma la rama con
  precisión, citando los tres ficheros de Git que leyó
  (`.git/HEAD`, `.git/refs/heads/feature/task-017-...`,
  `.git/worktrees/agent-a2b4c6a361f2840a0/HEAD`) y concluyendo que revisó el árbol
  principal. Lo que no pudo fue *usar* ese worktree, que es otra cosa. Misma
  familia que MEN-15: el registro afirma sobre un fichero algo que el fichero
  desmiente.

- **MEN-19 — La corrección de MEN-13 no la prueba nadie.**
  `plan-desempate-skill.test.ts` comprueba de la petición los `id`, prioridades,
  roles, descripciones, etiquetas, la fecha, el título y el nombre del fichero de
  salida (líneas 71-98), pero **nada del texto de "Como entregas"**. Las tres
  reglas de salto que ese texto ahora promete (línea vacía, encabezado, marcador)
  son justamente el contrato entre el humano que responde y
  `leerGanadorDesempate`, y es el contrato que ha fallado en las rondas 1 y 2. Un
  `assert.ok(texto.includes('(pendiente de completar)'))` en el test de la
  petición cuesta una línea y cierra el bucle: la constante quedaría anclada por
  sus tres usos.

---

## 3. Áreas revisadas sin hallazgos

- **`leerGanadorDesempate`, matriz completa.** Trazados a mano los catorce casos
  que cubre `plan-desempate-skill.test.ts`: vacío, solo blancos, solo
  encabezados, coincidencia exacta, coincidencia parcial (`a-extra`), `trim`,
  CRLF, candidatos vacíos, id inexistente, líneas posteriores ignoradas,
  encabezado + id, scaffold íntegro + respuesta, marcador aislado, scaffold recién
  generado. **Ninguna combinación devuelve un candidato sin igualdad estricta de
  `id`.** El fail-closed que declara el docblock se cumple, y la permisividad
  nueva (una comparación `!==` contra un literal) no abre ninguna vía nueva: un
  `id` de catálogo jamás puede ser `''`, `'(pendiente de completar)'` ni empezar
  por `#` sin que el propio catálogo lo declare así a mano.

- **La constante compartida no rompe nada al cambiarla.** Si mañana alguien
  edita `PLACEHOLDER_SALIDA_DESEMPATE`, los tres consumidores (escritura del
  scaffold, salto en la lectura, texto de la petición) se mueven a la vez por
  construcción. El único test que fija el literal a mano es el nuevo de
  `plan-desempate-skill.test.ts:176`, que se pondría rojo — que es el
  comportamiento deseado ante un cambio de formato del scaffold.

- **`plugin-instalado.ts` no ha cambiado de comportamiento en este commit.** El
  diff es exclusivamente el bloque de comentario de MEN-14 (líneas 41-50).
  Re-trazada de todos modos la matriz de `interpretarResultadoPluginList`:
  `error`, `status !== 0`, `status === null`, `stdout` no string, JSON inválido,
  no-array, array vacío, array sin elementos reconocibles, array con reconocibles
  sin coincidencia, coincidencia exacta. Sigue sin haber ningún camino que
  devuelva `'instalado'` sin un `id` string estrictamente igual. Conclusión de la
  ronda 2 confirmada, sin regresión.

- **`catalogo-skills.yml` sigue parseando.** El cambio es puramente de
  comentario (dentro del bloque `#` de cabecera, antes de `total_skills: 5`), y
  `catalogo-skills.test.ts:37-40` parsea el fichero **real** del repo en tiempo de
  carga del módulo: si el comentario hubiera roto el parser (por ejemplo
  introduciendo una línea que `parseBloqueClaveValor` interprete como clave), el
  fichero de test entero fallaría al importarse. No he podido ejecutarlo (sección
  0), pero la estructura del cambio es la correcta: cinco líneas de comentario
  con `#` en primera columna, dentro de un bloque que ya era de comentarios.

- **`plan.ts:596-625` (composición del aviso).** El `find(...)!` de la línea 597
  es seguro: `skillsRecomendadosFinal[0]` procede siempre de una entrada del
  catálogo (`seleccionSkill.ganador.id` o `ganadorDesempate.id`, y este último de
  `candidatosEmpatados`, que también sale del catálogo). `entradaGanadora.marketplace`
  no puede ser `null` en la rama `origen === 'externo'` porque el parser lo exige.
  El ternario de la redacción `no-instalado` / `no-verificable` (líneas 615-618)
  sigue intacto. Sin hallazgos.

- **Robustez del test nuevo de IMP-6 frente al entorno.** El test dispara
  `comprobarSkillInstalado`, que lanza un subproceso real
  (`spawnSync('claude', ['plugin','list','--json'])`, timeout 5 s). Analizados los
  dos desenlaces posibles en una máquina cualquiera: si el binario existe y
  responde, el plugin `figma@marketplace-inventado-para-el-test-de-plan` no puede
  estar instalado → `'no-instalado'`; si no existe, falla o expira →
  `'no-verificable'`. **Ambos** producen `avisoSkillNoInstalada !== null` con el
  mismo `/plugin install`, así que el `assert.match` es determinista y no
  introduce un test frágil. La restauración de `CLAUDE_PLUGIN_ROOT` va en
  `finally` y distingue "no estaba definida" de "estaba vacía", igual que el test
  hermano. Bien planteado.

- **Superficie de inyección.** Sin cambios: `argv` fijo, sin `shell: true`,
  `pluginId` nunca sale del proceso. Un `skill_N_id` hostil sigue sin poder
  escapar.

- **Lo que NO he podido revisar**, y conviene que quede escrito: estado real de
  la suite tras `2b43197`, cobertura de las líneas nuevas, comportamiento
  end-to-end de `taskctl plan` contra un repositorio Git real, y salida real de
  `claude plugin list --json` en esta máquina. Ver la sección 0.

---

## 4. Conclusión

**Todavía no puede darse por cerrada la revisión por pares**, pero está mucho
más cerca que en la ronda 2, y por motivos de distinta naturaleza.

Lo primero, y hay que decirlo sin adornos: **esta ronda tampoco ha reproducido
la suite**. Es la segunda consecutiva con la misma herramienta rota. En un
repositorio cuya regla número tres es "evidencia, no suposición", firmar
"aprobada" sin haber corrido `npm test` valdría menos que no firmarla. **Antes de
la ronda 4 hay que arreglar el entorno**, no volver a intentarlo a ciegas: la
afirmación de `tarea.md` sobre el estado de la suite lleva dos rondas apoyada
únicamente en la palabra de quien implementó, y encima ahora está desfasada
(MEN-17).

Lo segundo, el fondo. **Los dos hallazgos que la petición pedía confirmar están
corregidos, y uno de ellos ejemplarmente:**

- **IMP-7 está cerrado del todo.** La constante compartida es la solución
  correcta —hace estructuralmente imposible que el scaffold y el lector vuelvan a
  divergir, que era la causa raíz común de IMP-2, IMP-4 e IMP-7— y esta vez los
  tests sí prueban lo que su nombre promete: he verificado que **ambos fallan si
  se revierte el arreglo**. El test que la ronda 2 acusó de esquivar el caso
  ahora lo ejercita de verdad y ancla su propia precondición. Es el patrón que
  `tarea.md:178-185` identificó, y no volverá a morder por este camino.
- **MEN-12, MEN-13 y MEN-14 están cerrados**, y MEN-14 con una decisión escrita
  que describe el código real, no uno deseado.

**IMP-6, en cambio, está corregido a medias**, y los dos IMPORTANTE de esta
ronda son su residuo:

1. **IMP-8** — la corrección alineó `catalogo-skills.yml`, `plan.ts` y
   `tarea.md`, pero el comentario corregido **cita como autoridad**
   `docs/PROPUESTA_METODOLOGIA.md` §6.6, que no se tocó y cuyo ejemplo canónico
   sigue poniendo `figma` en el campo `marketplace` — el mismo `figma` que el
   comentario acaba de decir que **no** es el marketplace. Copiar ese ejemplo,
   que es lo que el propio catálogo invita a hacer, produce
   `/plugin install figma@figma`; el plugin real de esta máquina es
   `figma@claude-plugins-official`. El síntoma que MEN-11 e IMP-6 vinieron a
   cerrar sigue reproducible, solo que desde otro fichero.
2. **IMP-9** — la convención `"plugin:skill"`, ahora normativa por escrito, no la
   valida el parser (que en todo lo demás es *fail-closed* y lo declara), y el
   test externo que ya existía **fija como correcta** una entrada que la viola.
   El fichero de tests contiene hoy dos casos verdes con lecturas incompatibles
   del mismo campo.

Ninguno de los dos toca la arquitectura. IMP-8 se cierra con una línea de YAML en
un documento; IMP-9 con una validación de ocho líneas en `construirEntrada` y el
arreglo de un *fixture*. Los cuatro MENOR son tres de documentación —dos de ellos
en el propio `Resultado`, que es el artefacto de auditoría y que después nadie
vuelve a mirar— y uno de código muerto sin consecuencias.

Y una observación de proceso que trasciende esta tarea: **dos rondas seguidas
con el *worktree* aislado apuntando a la rama equivocada** (sección 0.1). El
mecanismo no está aportando aislamiento —el revisor termina leyendo el árbol
compartido igual— y sí consume tiempo y un traslado manual en cada ronda. Merece
entrada propia en `docs/contexto/HALLAZGOS.md`.
