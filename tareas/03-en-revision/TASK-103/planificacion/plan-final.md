# Plan — TASK-103: Guardian de merges: config invalida bloquea y merges que hoy no detecta

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta.
Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,
el plan senala lo que ese rol no cubrio.)

## Enfoque propuesto

Duracion estimada: 55 min (de la rama abierta al cierre con merge; senales: 2 ficheros de codigo previstos (`src/core/comando-merge.ts`, `src/hooks/guardia-merge.ts`) mas 2 de test (`test/hooks/guardia-merge.test.ts`, `test/hooks/guardia-documentacion.test.ts`) y README + CHANGELOG; 2 capas (parser puro en core y hook); 8 criterios, de los que 3 son de regresion o de documentacion)

Dos cambios independientes que no cruzan ningun contrato publico fuera del plugin, ni de formato de fichero ni de esquema de config.

**A. Una config ilegible bloquea hacia develop/main/master** (criterios 1 a 3). Solo cambia `src/hooks/guardia-merge.ts`, en el paso 3 de `decidirPreToolUse`.
- Hoy `raizDelRepo` no lanza nunca (sin `.git` devuelve el propio cwd: `config.ts:342-350`). Sin `.taskcode/` o sin `config.yml`, `resolverConfigConAvisos` devuelve `CONFIG_DEFAULTS` y no lanza (`config.ts:410-427`); con esos defaults `comando_verificacion` es null y se sigue con el `continue` de la linea 118, asi que ese caso queda como en la 0.14.0. Lo unico que hoy acaba en el `catch { continue; }` (`guardia-merge.ts:115`) es un `ConfigError`.
- El cambio: ese `catch` distingue `e instanceof ConfigError` (exportado en `config.ts:115`). Cualquier otro error sigue con `continue`. Con un `ConfigError` se calculan los destinos con `integraciones(op, raiz, 'develop', principal ?? 'main')`, reutilizado tal cual (`'develop'` es el `rama_base` por defecto, `config.ts:247`). Si algun destino esta en la lista fija `{develop, main, master}`, se anade a `pendientes` una entrada de otro tipo.
- `pendientes` pasa a ser una union discriminada: `{ tipo: 'verificar'; op; integ; config } | { tipo: 'config-invalida'; destino; error: ConfigError }`. En el bucle de los pasos 5 a 7, una entrada `config-invalida` devuelve `{ codigo: 2, stderr: mensajeConfigInvalida(destino, error) }` sin pasar por `motivoDeBloqueo`: se bloquea siempre, sin mirar ancestros ni verdes. La regla de la cabecera («un fallo antes de saber el destino deja pasar») se mantiene.
- `mensajeConfigInvalida` se crea junto a `mensaje()`: dice que falla (el texto del `ConfigError` sin el prefijo `[ERROR]`), que arreglar (`.taskcode/config.yml`; `taskctl doctor` lo valida) y que despues se repita el merge o se use `taskctl finish`. No nombra el producto.
- El recorte de `[ERROR]` ya esta en `exencionDocumentacion` (linea 217): se saca a un helper interno `textoDeConfigError(e)` que usan los dos sitios.
- «Config del destino invalida lleva a la completa» ya lo cubre el paso 6b de TASK-101 (`r.tipo === 'config-invalida'` hace `pasa: false`). No se toca: solo se comprueba.
- Se actualiza el comentario de cabecera del paso 3 (lineas 12-13).

**B. Huecos del parser** (criterios 4 a 6). En `src/core/comando-merge.ts`, que sigue siendo puro y sin I/O.
- **MEN-2 (`git merge -m --abort x`).** Las lineas 150 y 340 usan `args.some(a => MERGE_SIN_MERGE.has(a))`, que no sabe de posiciones. Un unico helper `esControlDeMerge(args)` recorre las opciones saltandose el valor de las de `MERGE_CON_VALOR` (la misma regla que `posicionales`). Lo usan los dos sitios.
- **`{ git merge x; }` y `time [-p] git merge x`.** `sinPrefijos` (linea 119) quita un `{` inicial y `time` (con `-p`). En `segmentosSoloIntegran`, la comprobacion `seg.length !== bruto.length` (linea 324) hace que la exencion no se aplique con esos envoltorios. El `}` queda como segmento suelto que no se analiza.
- **`eval git merge x`.** `textoDeShell` (linea 187) anade `prog === 'eval'` → `seg.slice(1).join(' ')`; la recursion de `analizarComando` lo recoge. En `segmentosSoloIntegran`, `eval` se rechaza explicitamente antes de `textoDeShell`: sin exencion.
- **`git checkout <fichero> && git merge x`.** Se inyecta un predicado y el parser sigue puro:
  `export function analizarComando(texto: string, esRama: (nombre: string) => boolean = () => true): OperacionMerge[]`
  Solo se consulta en `git checkout` con un unico posicional y sin `--`, y se propaga en la recursion de `textoDeShell`. Si no es rama, el checkout no cambia el destino (sesgo seguro: evaluar). El guardian pasa `n => existeRef('refs/heads/'+n, cwd) || existeRef('refs/remotes/origin/'+n, cwd)`. La comprobacion de `cwd` (linea 101) se mueve por delante de `analizarComando` (linea 99): mismo resultado, y el predicado nunca recibe un cwd roto.
- **NUE-3.** Solo tests: en `test/hooks/guardia-documentacion.test.ts`, lineas 211, 242, 246 y 247, `'cd C:\repo'`, `'-\B'` y `'-\C'` pasan a `\\`. Hay que confirmar ejecutando que siguen dando `true` y `false` respectivamente.

**Orden de construccion** (B y A son independientes; primero lo barato y puro):
1. NUE-3.
2. `esControlDeMerge` y extensiones de `sinPrefijos` y `textoDeShell` (MEN-2, `{}`, `time`, `eval`).
3. Predicado `esRama` en `analizarComando`/`ramaDeCambio` y su conexion en el guardian, con el reordenado del cwd.
4. Parte A en `guardia-merge.ts`: union `pendientes`, `mensajeConfigInvalida`, `textoDeConfigError` y cabecera.
5. README (seccion «Guardian de merges», `README.md:1096`) y CHANGELOG raiz (`## Sin publicar`), avisando de que cambia el comportamiento de la 0.14.0.

**Precedentes internos:** TASK-101 ya resolvio «config invalida del destino» como un resultado tipado (`config-invalida`); TASK-072/MEN-1 resolvio `bash -c`/`pwsh -Command` en `textoDeShell`, donde entra `eval`.

**Alternativas descartadas:** que `comando-merge.ts` haga el `rev-parse` el mismo (rompe su pureza); distinguir fichero y rama por la forma del nombre (falla con `release/0.14.0`); mantener el `continue` y avisar en stderr (no cumple la decision de bloquear).

## Lo que el rol no cubrio

- Casos concretos de test para los criterios 1 a 3 y 5: el plan de pruebas es minimo y no lo ha revisado un rol de testing.
- Criterio 8: no se ha comprobado que tests existentes cambian de resultado. Uno conocido sigue igual: `'git merge -m --quit code; git merge docs'` sigue dando `false`, ahora porque se cuentan dos merges.
- Riesgos sin revisar a fondo: `! git merge x`, `nohup`, `xargs`, `sudo`, un `cd` a otro repo antes del checkout ambiguo (el predicado mira el cwd del hook), `git -C otro checkout f`. Fuera del alcance de esta tarea.
- Texto exacto del README y del CHANGELOG: solo se indica donde va.

## Riesgos aceptados y que los contiene

- Falso bloqueo con config ilegible y un merge que no aporta nada: se bloquea igual (decision de Carlos: siempre). Lo contiene un mensaje que dice como arreglarlo.
- Repos cuya integracion no se llama develop y tienen config rota: el guardian no los protege (lista fija). Lo contiene la puerta de `finish`.
- `esRama` con una rama solo remota en un remoto que no es `origin`: se toma como fichero y, si la rama actual es protegida, sale un falso bloqueo. Lado seguro.
- `{}`, `time` y `eval` nunca reciben la exencion de solo documentacion: conservador a proposito.
- Coste: como mucho un `rev-parse` mas por checkout ambiguo, y solo en comandos que ya contienen `merge`.

## Plan de pruebas

- Repo temporal, config con una clave antigua invalida (p. ej. `rama_base` imposible) y otra con una clave nueva invalida (p. ej. `rutas_documentacion` mal formada): `git merge x` hacia develop, main y master da exit 2 y el stderr nombra el error y como arreglarlo.
- Misma config invalida, merge hacia una rama `otra`: pasa.
- Regresion: sin `.taskcode/`, con `.taskcode/` vacio y con config valida, el resultado es el mismo que antes.
- Hook real en repo temporal: `git merge -m --abort x` (y `--quit`, `--continue`, `--skip`), `{ git merge x; }`, `time git merge x` y `eval git merge x` bloquean sin verde; con `README.md` versionado y la rama actual develop, `git checkout README.md && git merge x` bloquea en vez de tomar `README.md` como destino.
- Unitario puro: `analizarComando` con el predicado por defecto conserva el comportamiento actual.
- NUE-3: barras reales en las lineas 211, 242, 246 y 247.
- `npm run test:rapido` al iterar; `npm test` una vez antes de la revision (en Windows solo pueden fallar los tres rojos conocidos).

## Lo que necesita decision de una persona

Checkpoint obligatorio: el plan no vale hasta `taskctl approve`.

Decisiones tomadas por Carlos en la fase de diseno (2026-11-11):
1. Con config ilegible se bloquea **siempre** hacia develop/main/master, tambien cuando la fuente ya esta integrada.
2. `eval`, `time` y `{}` se detectan como merge pero **nunca** reciben la exencion de solo documentacion.
3. El predicado de rama mira `refs/heads/<n>` y `refs/remotes/origin/<n>` (solo `origin`).
4. La tarea se mantiene **entera** (partes A y B juntas); si se pasa de una hora, el corte natural es sacar la parte B (criterios 4 a 6).

Sin preguntar, por ser la lectura directa del codigo: con config ilegible, `merge-*-to-develop.sh` cuenta como destino develop y `merge-*-to-main.sh` como main/master.
