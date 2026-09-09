# Peticion de revision — TASK-017 (ronda 4)

- Tarea: TASK-017 — Catalogo de skills determinista con seleccion en dos pasos
- Rama revisada: feature/task-017-catalogo-de-skills-determinista-con-sele
- Rama base: develop
- Commit revisado (HEAD): 4bcecd0a8d4b8592279a92ef4be90630cd0b6500
- Fecha: 2026-09-09
- Agente revisor sugerido: code-reviewer

## Nota sobre este fichero

Generado a mano, igual que las rondas 2 y 3, por el mismo motivo: `bash`
esta roto en este entorno y `taskctl review` depende de el via
`runGitflowScript()` (`spawnSync('bash', [scriptPath, ...])`). Comprobado
que `develop` sigue siendo antepasado de `HEAD`
(`git merge-base --is-ancestor develop HEAD` devuelve 0), asi que no hay
un conflicto real con `develop` pendiente de traer.

## Aviso sobre el worktree aislado (rondas 2 y 3)

En las dos rondas anteriores, el agente `code-reviewer` lanzado con
`isolation: "worktree"` aparecio posicionado en un commit que NO era el
de esta rama (en la ronda 3, en el cierre de una tarea anterior sin
relacion). Las dos veces el propio informe lo detecto, lo documento con
precision y compenso revisando el arbol de trabajo principal — asi que
el veredicto siguio siendo valido, pero confirma tu mismo, al empezar,
en que commit y en que rama estas realmente
(`git log -1 --format='%H %D'`) antes de reproducir nada. Si vuelve a
pasar, dilo explicitamente en el informe con la misma precision que las
rondas anteriores (documentado ademas como hallazgo de proceso en
`docs/contexto/HALLAZGOS.md`, fuera del alcance de esta tarea).

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento los cambios de
esta ronda. Reproduce EMPIRICAMENTE — ejecuta la suite completa de tests
(`npm run build && node --test "dist/test/**/*.test.js"` desde
`taskcode-marketplace/plugins/taskcode-plugin`), lee el codigo real, no
te limites a leer el diff y opinar. Clasifica cada hallazgo como
CRITICO, IMPORTANTE o MENOR. Si no encuentras hallazgos nuevos, dilo
explicitamente: esta ronda tambien es valida si confirma que la ronda 3
quedo bien cerrada.

**Sobre la cifra de la suite**: en este entorno (Windows nativo,
PowerShell) la suite completa da consistentemente 99 fallos que NO son
regresiones de esta tarea: 3 son limitaciones documentadas en
`CLAUDE.md` de la raiz del repo (symlink `EPERM`, `chmod` sobre
directorio no-op en NTFS, diferencia de fin de linea CRLF — busca esos
tres nombres de test si quieres confirmarlos por mensaje de error real,
no solo por nombre) y el resto son tests de `taskctl
start/finish/review/approve` y de los scripts `.sh` de Git-Flow, todos
dependientes de `spawnSync('bash', ...)` con el Bash roto de este
entorno. Si tu ejecucion da una cifra distinta de 99, o si alguno de los
fallos SI toca ficheros de esta tarea (`catalogo-skills.*`, `plan.ts`,
`plan-desempate-skill.*`, `plugin-instalado.ts`), es un hallazgo nuevo:
dilo.

Este commit corrige los 6 hallazgos de `informe-revision-3.md` (2
IMPORTANTE, 4 MENOR):

- **IMP-8**: el ejemplo de la seccion 6.6 de
  `docs/PROPUESTA_METODOLOGIA.md` (`id: figma:figma-generate-design`)
  declaraba `marketplace: figma`, contradiciendo el propio comentario de
  `catalogo-skills.yml` (corregido en IMP-6, ronda 2) que dice que el
  tramo antes de `:` en el id es el PLUGIN, no el marketplace —
  comprobado ademas contra el plugin real instalado en esta maquina
  (`figma@claude-plugins-official`). Corregido el ejemplo y anadido un
  comentario inline que señala cual tramo es cual.
- **IMP-9**: `construirEntrada` (`catalogo-skills.ts`) no validaba la
  forma del `skill_N_id` para `origen: externo` — un id sin `:` parseaba
  igual, y `plan.ts` componia un `/plugin install` con el nombre de un
  *skill* donde debia ir el de un *plugin*, sin abortar ni avisar, justo
  lo contrario de la doctrina fail-closed que la cabecera del propio
  fichero declara para el resto del parseo. Corregida con una validacion
  que exige exactamente un `:` con ambos tramos no vacios
  (`/^[^:]+:[^:]+$/`), mensaje `CatalogoSkillsError` con la forma
  esperada y la seccion de la que sale la convencion. Ajustado el
  *fixture* que ya violaba la convencion (`plan.test.ts`, el test del
  aviso de skill no instalada) para usar
  `"plugin-de-prueba:skill-de-prueba"`, y anadidos 5 tests nuevos en
  `catalogo-skills.test.ts` que cubren los casos invalidos (sin `:`, dos
  `:`, tramo del plugin vacio, tramo del skill vacio) y la precondicion
  de que la exigencia es solo para `origen: externo` (las 5 entradas
  reales del catalogo, todas `taskcode-plugin`, no llevan `:` y siguen
  siendo validas), mas un test end-to-end en `plan.test.ts` que confirma
  que `runPlanCommand` propaga el `CatalogoSkillsError` sin dejar
  `planificacion/` a medio crear.
- **MEN-16**: en `plan.ts`, tras escribir el scaffold de desempate
  cuando no existia, se volvia a comprobar `ficheroConContenido` para
  decidir si leer el ganador — comprobacion siempre verdadera (si no lo
  era, se acababa de escribir un scaffold no vacio) y por tanto una rama
  `: null` inalcanzable. Colapsado a la llamada directa a
  `leerGanadorDesempate`.
- **MEN-17**: cifras de suite desfasadas en `tarea.md` — corregido
  anadiendo la cifra real medida por ejecucion en esta ronda de
  correcciones (ver mas arriba), ninguna de las citas historicas
  anteriores se reescribio (seguian siendo correctas para su punto
  temporal).
- **MEN-18**: `tarea.md` decia que el informe de ronda 2 no pudo
  "confirmar a que rama apuntaba su propio worktree aislado", cuando en
  realidad si lo confirmo con precision (citando los tres ficheros de
  Git que leyo); lo que no pudo fue trabajar desde ese worktree.
  Corregida la redaccion.
- **MEN-19**: anadido en `plan-desempate-skill.test.ts` un test que
  ancla el texto de "Como entregas" de `peticionDesempateSkillTemplate`
  a las tres reglas de salto reales de `leerGanadorDesempate` (linea
  vacia, encabezado Markdown, marcador `"(pendiente de completar)"`),
  que hasta ahora no probaba nada del texto.

No des estos cambios por buenos solo porque esta peticion lo diga:
confirma tu mismo que el codigo actual hace lo que aqui se afirma, y si
algo no cuadra — incluida la propia clasificacion de estos seis
hallazgos como ya resueltos — dilo como hallazgo nuevo.

## Commits a revisar (git log 2b43197..HEAD)

```
4bcecd0 docs(TASK-017): anota el worktree del revisor en rama equivocada, dos rondas seguidas
b3dd590 fix(TASK-017): corrige hallazgos IMP-8, IMP-9 y MEN-16 a MEN-19 de la ronda 3 de revision
```

El commit anterior (`2b43197`) es el que revisó `informe-revision-3.md`.

## Diff completo (git diff 2b43197..HEAD -- docs/PROPUESTA_METODOLOGIA.md src test)

Ver `diff-ronda4.txt` adjunto en el mismo directorio de esta peticion, o
reproducirlo con:

```
git diff 2b43197..HEAD -- docs/PROPUESTA_METODOLOGIA.md \
  taskcode-marketplace/plugins/taskcode-plugin/src \
  taskcode-marketplace/plugins/taskcode-plugin/test
```

El cambio en `tarea.md` (cierre narrativo de MEN-17 y MEN-18, y la nueva
seccion de "Ronda 3 de revision por pares") no se incluye en ese diff a
proposito: es narrativo, no codigo, y se puede leer directamente en
`tareas/03-en-revision/TASK-017/tarea.md`.
