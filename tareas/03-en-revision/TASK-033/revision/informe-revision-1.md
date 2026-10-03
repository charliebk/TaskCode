# Informe de revision — TASK-033 (ronda 1)

- Commit revisado: 60b0ee6e71515a041ba63763b6290f092d22538f
- Revisor: agente general-purpose independiente (no implemento la tarea)
- Veredicto: aprobada con correcciones

## Como se ha revisado

Todo en un clon temporal de la rama `fix/task-033-comando-de-sincronizacion-tras-cada-tran`
(el arbol de trabajo del repo no se ha tocado), con `npm install && npm run build`.

- **Suite completa (una sola vez, `npm test`)**: 888 tests, 885 pass, 3 fail, 669 s.
  Los 3 rojos son los conocidos de Windows: `approve` symlink `EPERM` (#119),
  `plan` chmod de directorio (#281) y `plan` CRLF `'\r\n'` vs `'\n'` (#287).
  Ningun `EBUSY` en esta pasada. Tras el build, `git status` del clon queda
  limpio: el `dist/src` commiteado coincide con lo que compila el fuente.
- **Cobertura de lo nuevo**: `sincronizacion.js` 97.77 % lineas / 87.23 % ramas
  (sin cubrir, lineas 174-177 y 219-220 del JS: la rama `r.error` del
  `spawnSync` exterior, `ETIMEDOUT` de la red de seguridad incluida, y el
  fallo de `git status` en `fotoDelArbol`),
  `config.js` 99.08 %.
- **Tests nuevos aislados**: `node --test dist/test/commands/sincronizacion.test.js dist/test/core/config-sincronizacion.test.js` → 20/20 en verde.
- **CLI real (`bin/taskctl approve`)**, repo temporal con tarea en `01-en-diseno`:
  - comando `node -e "process.exit(2)"` → **exit 3**, aviso en stderr, `HEAD = chore(TASK-930): plan aprobado`, arbol limpio.
  - comando que reescribe `docs/PLAN.md` → **exit 0**, stderr vacio, arbol limpio.
  - ruta declarada ignorada por `.gitignore` → **exit 1** (ver hallazgo 1).
- **Sondas directas sobre `autoCommit`** (dist), Windows 11, Node 22:
  - Timeout con nieto que sigue escribiendo (`setInterval(appendFileSync('docs/PLAN.md'))`, timeout 1500 ms): vuelve en 3.6 s, `fallida`, y 2.5 s despues `docs/PLAN.md` sigue siendo `v0\n` — el `taskkill /T /F` del ENVOLTORIO mata el arbol de verdad.
  - Fichero ajeno con espacio y no ASCII (`mi carpeta/señal ñ.md`): `rutas-ajenas`, el aviso lo nombra exacto (el `-z` evita el `quotePath`); el derivado declarado si entra en el commit.
  - Ruta declarada con espacio (`"docs/mi plan.md"`): `aplicada` cuando esta limpia; `omitida-rutas-con-cambios` cuando la persona la tenia tocada, y su contenido (`trabajo persona`) se conserva.
  - Comando inexistente en cmd.exe: `fallida`, mensaje de cmd incluido, derivado en HEAD.
  - Comando que borra la ruta declarada: `aplicada`, el borrado entra en el commit.
  - `autoCommit` con `rutas: []` (p. ej. `import` sin tareas creadas): no se lanza nada (`SIN_SINCRONIZACION`). Correcto.
- **SKILL.md**: sin menciones a TaskCode, OpenGisViewer ni rutas internas (el test de contenido de la suite lo confirma; `.taskcode/` es el directorio de config del propio plugin, ya publico). Lo que afirma cuadra con el codigo: codigo 3 con `0` del comando y `1` que gana, los ocho comandos que commitean pasan por `printAutoCommit` (9 llamadas en `cli.ts`), y `finish.ts` no lee casillas (ni una referencia a `[ ]`/`[x]`/"Criterios"). La unica afirmacion que no se sostiene es "la transicion nunca se aborta por la sincronizacion" (hallazgo 1).
- **Versiones**: 0.1.1 en `package.json`, `package-lock.json`, `plugin.json`, las dos de `marketplace.json`, `VERSION` de `cli.ts` y el README del plugin.

## Mutacion (6 mutantes sobre el `dist` compilado, tests nuevos)

| Mutante | Cambio | Resultado |
|---|---|---|
| M1 chequeo (a) | `if (conCambios.length > 0)` → `if (false)` | muerto: test (a) en rojo |
| M2 restaurarAHead (b) | llamada eliminada | muerto: los dos tests (b) de restauracion en rojo |
| M3 deteccion por contenido (c) | `huella()` devuelve constante | muerto: test "fichero que YA estaba sucio" en rojo |
| M4 kill del arbol | `taskkill /T /F` → `hijo.kill()` | muerto, **pero solo por `EBUSY ... rmdir` en el teardown** (ver hallazgo 3) |
| M5 validacion de rutas en config | `motivoRutaInvalida` → `null` | muerto: "rutas invalidas abortan al cargar" en rojo |
| M6 codigo 3 en cli.ts | `main` devuelve `codigo` tal cual | muerto: test del binario real en rojo |

## Hallazgos

### 1. IMPORTANTE — Una ruta declarada que Git no puede preparar o commitear SI aborta la transicion

La regla que manda (cabecera de `sincronizacion.ts`, plan aprobado y SKILL.md:
"La transicion de la tarea **nunca se aborta** por la sincronizacion") se rompe
cuando la sincronizacion devuelve `aplicada`/`rutas-ajenas` con una ruta que
luego falla en `git add` o `git commit`. Las rutas de la sincronizacion se
mezclan con las de la tarea en `rutasRel` y pasan por el mismo `git add` /
`git commit` que lanza `AutoCommitError`, asi que un fallo en ellas tumba el
commit de la tarea entero. Dos reproducciones reales:

**1a. Ruta ignorada por `.gitignore`** (derivado generado que alguien tiene en
el `.gitignore`, configuracion plausible):

```
.gitignore:              gen.md
.taskcode/config.yml:    comando_sincronizacion: "node -e \"require('fs').writeFileSync('gen.md','v1')\""
                         rutas_sincronizacion: [gen.md]
$ node bin/taskctl approve TASK-930      (repo temporal, CLI real)
exit=1
[ERROR] taskctl escribio los ficheros de la tarea pero no pudo preparar "gen.md" para el commit:
The following paths are ignored by one of your .gitignore files: gen.md ...
git status: " M tareas/01-en-diseno/TASK-930/tarea.md"     HEAD: setup (sin commit de approve)
```

El check (a) no lo ve (el porcelain no lista ignorados) y `git add -A -- gen.md`
sale con 1.

**1b. Mayusculas distintas en un FS que no distingue (Windows/macOS)**:
`rutas_sincronizacion: [docs/plan.md]` con el fichero real `docs/PLAN.md`:

```
THROW: [ERROR] taskctl escribio los ficheros de la tarea pero NO pudo commitearlos:
error: pathspec 'docs/plan.md' did not match any file(s) known to git ...
status: " M docs/PLAN.md\nM  tareas/x.md"     log: sin commit nuevo
```

Aqui queda ademas la tarea **preparada en el indice** y el derivado modificado
sin preparar. En `finish` cualquiera de los dos casos ocurre **despues del
merge**: exactamente el "riesgo 1" que el diseno queria evitar (tarea movida,
sin commitear, sin camino de reintento limpio). No es CRITICO porque exige una
configuracion erronea, pero el comando hace lo contrario de lo que su
documentacion promete.

Correccion sugerida (no aplicada): preparar las rutas de la sincronizacion en
un paso propio cuyo fallo degrade a `fallida` (restaurar a HEAD y commitear
solo la tarea), o validarlas antes de ejecutar el comando (`git check-ignore`,
y comparar la ruta declarada con `git ls-files` / el nombre real en disco).
Un test por cada caso.

### 2. MENOR — Un script que sale con 124 (o muere por senal en POSIX) se describe mal

El ENVOLTORIO reutiliza el 124 de `timeout(1)` como "lo he cortado", y
`describirFallo` trata cualquier 124 como timeout. Reproducido:

```
comando: node -e "require('fs').writeFileSync('docs/PLAN.md','v1');process.exit(124)"
estado: fallida
aviso: La sincronizacion "..." no termino en 60 s y se ha cortado. ...
```

El script termino al instante. El desenlace (`fallida`, derivado en HEAD,
codigo 3) es correcto; solo miente el mensaje. Del mismo modo, en POSIX un
script muerto por senal llega como `code === null` → el envoltorio sale con
128 y el aviso dice "salio con codigo 128": la rama `r.signal !== null` de
`describirFallo` solo se alcanza si muere el propio envoltorio. Sugerencia:
que el envoltorio comunique el corte por un canal que el script no pueda
imitar (p. ej. una linea marcada en stderr o un codigo fuera de rango
documentado) y reenvie el nombre de la senal. No se ha podido ejecutar en
POSIX desde esta maquina; lo de la senal es lectura de codigo.

### 3. MENOR — El test del timeout no comprueba que muera el arbol

M4 (sustituir `taskkill /T /F` por `hijo.kill()`) solo cae porque el nieto
vivo bloquea la carpeta temporal y el `rm` del teardown falla con `EBUSY`: las
aserciones del test (estado `fallida`, < 30 s, "no termino en 2 s") siguen
pasando, porque la red de seguridad del `spawnSync` exterior corta a los
16.5 s y tambien da `fallida`. Es decir, la proteccion la detecta un sintoma
que este proyecto clasifica como ruido conocido de Windows, y en Linux (sin
`EBUSY`) el mutante equivalente en POSIX (`process.kill(hijo.pid)` en vez de
`-hijo.pid`) sobreviviria. Sugerencia: que el script del test escriba el
derivado en bucle y aseverar, tras un margen, que el fichero sigue como en
HEAD (la sonda de esta revision hace justo eso y pasa con el codigo actual),
y/o aseverar una duracion muy por debajo de los 16.5 s de la red de
seguridad.

### Sin hallazgos en lo demas pedido

- Rutas con espacios o no ASCII en `fotoDelArbol`: correcto gracias a `-z`.
- `restaurarAHead`, deteccion por contenido de (c), check (a) y validacion de
  rutas en config: protegidos por tests (mutantes M1-M3, M5 muertos).
- Codigo 3 desde `main()`: correcto en el CLI real y protegido (M6).
- `autoCommit` con rutas vacias: no lanza la sincronizacion.
- Windows/cmd.exe: el comando se resuelve por shell (`noexiste-xyz` da el
  mensaje de cmd, `node ...` funciona) y el arbol se mata.
