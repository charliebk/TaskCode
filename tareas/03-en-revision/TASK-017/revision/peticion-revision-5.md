# Peticion de revision — TASK-017 (ronda 5)

- Tarea: TASK-017 — Catalogo de skills determinista con seleccion en dos pasos
- Rama revisada: feature/task-017-catalogo-de-skills-determinista-con-sele
- Rama base: develop
- Commit revisado (HEAD): 382028edec723a64b8b4f99653040484d6209a0b
- Fecha: 2026-09-09
- Agente revisor sugerido: code-reviewer

## Nota sobre este fichero

Generado a mano, igual que las rondas 2, 3 y 4, por el mismo motivo:
`bash` esta roto en este entorno y `taskctl review` depende de el via
`runGitflowScript()` (`spawnSync('bash', [scriptPath, ...])`). Comprobado
que `develop` sigue siendo antepasado de `HEAD`
(`git merge-base --is-ancestor develop HEAD` devuelve 0), asi que no hay
un conflicto real con `develop` pendiente de traer.

## Aviso sobre el worktree aislado (rondas 2, 3 y 4 — TRES veces seguidas)

En las tres rondas anteriores, el agente `code-reviewer` lanzado con
`isolation: "worktree"` aparecio posicionado en un commit que NO era el
de esta rama (en la ronda 4, en la rama
`worktree-agent-ab8c48c6e595ec7f1` apuntando al cierre de una tarea
anterior sin relacion, `ce5947d`). Las tres veces el propio informe lo
detecto, lo documento con precision y compenso revisando el arbol de
trabajo principal — asi que el veredicto siguio siendo valido, pero
**antes de reproducir nada**, confirma tu mismo en que commit y en que
rama estas realmente:

```
git log -1 --format='%H %D'
```

Si el resultado no es el commit `382028e` en la rama
`feature/task-017-catalogo-de-skills-determinista-con-sele`, no asumas
que tu worktree esta desactualizado por error tuyo: es un problema de
proceso ya conocido (documentado en `docs/contexto/HALLAZGOS.md`, fuera
del alcance de esta tarea) y la mitigacion es la misma de las tres
rondas anteriores: revisa el arbol de trabajo principal en su lugar, y
dilo explicitamente en el informe con la misma precision que las rondas
anteriores.

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento los cambios de
esta ronda. Reproduce EMPIRICAMENTE — ejecuta la suite completa de tests
(`npm run build && node --test "dist/test/**/*.test.js"` desde
`taskcode-marketplace/plugins/taskcode-plugin`), lee el codigo real, no
te limites a leer el diff y opinar. Clasifica cada hallazgo como
CRITICO, IMPORTANTE o MENOR. Si no encuentras hallazgos nuevos, dilo
explicitamente: esta ronda tambien es valida si confirma que la ronda 4
quedo bien cerrada.

**Sobre la cifra de la suite**: en este entorno (Windows nativo,
PowerShell) la suite completa da consistentemente 99 fallos que NO son
regresiones de esta tarea: 3 son limitaciones documentadas en
`CLAUDE.md` de la raiz del repo (symlink `EPERM`, `chmod` sobre
directorio no-op en NTFS, diferencia de fin de linea CRLF) y el resto
son tests de `taskctl start/finish/review/approve` y de los scripts
`.sh` de Git-Flow, todos dependientes de `spawnSync('bash', ...)` con el
Bash roto de este entorno. Si tu ejecucion da una cifra distinta de 99,
o si alguno de los fallos SI toca ficheros de esta tarea
(`catalogo-skills.*`, `plan.ts`, `plan-desempate-skill.*`,
`plugin-instalado.ts`), es un hallazgo nuevo: dilo.

Este commit corrige IMP-10 y los 4 hallazgos MENOR de
`informe-revision-4.md` (0 CRITICO, 0 IMPORTANTE quedaban pendientes,
solo IMP-10 que en realidad estaba clasificado IMPORTANTE — ver mas
abajo — y MEN-20 a MEN-23):

- **IMP-10**: la prosa del paso 4 de la seccion 6.6 de
  `docs/PROPUESTA_METODOLOGIA.md` nombraba el skill completo
  (`X`, sin distinguir plugin de skill) en la instruccion de
  `/plugin install X@Y`, contradiciendo el propio ejemplo YAML de esa
  misma seccion y `plan.ts`, que instala solo el tramo antes de `:`.
  Corregida la prosa para nombrar explicitamente `P:S` (skill completo,
  lo que se anota) frente a `P` (plugin, lo que se instala), con una
  frase que remite al mismo criterio del ejemplo del paso 1.
- **MEN-20**: el regex de validacion de `skill_N_id` para
  `origen: externo` en `construirEntrada` (`catalogo-skills.ts`),
  anadido en IMP-9 (ronda 3), era `/^[^:]+:[^:]+$/` — excluia `:` en
  cada tramo pero no espacios, asi que un id como
  `"mi-plugin : skill"` pasaba la validacion y `plan.ts` componia un
  `/plugin install` con espacios de mas. Endurecido a
  `/^[^:\s]+:[^:\s]+$/`.
- **MEN-21**: el test end-to-end de IMP-9 en `plan.test.ts` (el que
  monta un catalogo con `skill_1_id: skill-externo-mal-formado`, sin
  `:`) solo comprobaba `assert.rejects(fn, CatalogoSkillsError)` — la
  clase del error, no su contenido. Como `CatalogoSkillsError` es la
  misma para cualquier fallo de parseo del catalogo, el test pasaria
  igual si el fixture fallase por una causa distinta (clave ausente,
  enum invalido) sin haber ejercitado nunca la validacion de IMP-9.
  Reforzado con una funcion validadora que ademas comprueba
  `/"skill_1_id" invalido para "skill_1_origen: externo"/` contra
  `error.message`.
- **MEN-22**: el mensaje `CatalogoSkillsError` de IMP-9/MEN-20 citaba
  `docs/PROPUESTA_METODOLOGIA.md` por ruta — un fichero interno de
  TaskCode — en un mensaje que puede llegar a la terminal de un
  proyecto ajeno donde el plugin este instalado, violando la regla de
  `CLAUDE.md` de que nada expuesto a otros proyectos mencione
  documentos internos de este repo. Corregido para citar solo
  "(seccion 6.6)", sin nombrar ni el fichero ni la palabra
  "metodologia", replicando el patron del mensaje hermano de
  marketplace ausente (`catalogo-skills.ts`, en torno a la linea 300).
- **MEN-23**: la frase de cierre de MEN-17 en `tarea.md` afirmaba haber
  verificado que ninguno de los 99 fallos toca `catalogo-skills.test.ts`,
  cuando el criterio real declarado en `peticion-revision-4.md` cubria
  cuatro patrones (`catalogo-skills.*`, `plan.ts`,
  `plan-desempate-skill.*`, `plugin-instalado.ts`). Repetida la
  busqueda contra los cuatro y corregida la frase con el resultado real:
  ninguno de los 99 fallos toca los tres primeros patrones; de
  `plan.test.ts` si fallan dos, pero son exactamente dos de los tres
  no-regresion ya documentados (`chmod` no-op en NTFS y CRLF), ninguno
  relacionado con esta tarea.

No des estos cambios por buenos solo porque esta peticion lo diga:
confirma tu mismo que el codigo actual hace lo que aqui se afirma, y si
algo no cuadra — incluida la propia clasificacion de estos hallazgos
como ya resueltos — dilo como hallazgo nuevo.

## Commits a revisar (git log 4bcecd0..HEAD)

```
382028e fix(TASK-017): corrige IMP-10 y hallazgos MENOR de la ronda 4 de revision
```

El commit anterior (`4bcecd0`) es el que revisó `informe-revision-4.md`.

## Diff completo (git diff 4bcecd0..HEAD -- docs/PROPUESTA_METODOLOGIA.md src test)

Ver `diff-ronda5.txt` adjunto en el mismo directorio de esta peticion, o
reproducirlo con:

```
git diff 4bcecd0a8d4b8592279a92ef4be90630cd0b6500..HEAD -- docs/PROPUESTA_METODOLOGIA.md \
  taskcode-marketplace/plugins/taskcode-plugin/src \
  taskcode-marketplace/plugins/taskcode-plugin/test
```

El cambio en `tarea.md` (correccion de MEN-23) no se incluye en ese
diff a proposito: es narrativo, no codigo, y se puede leer directamente
en `tareas/03-en-revision/TASK-017/tarea.md`.
