# Informe de revision — TASK-031 (ronda 1)

- Tarea: TASK-031 — Distribucion del CLI: un clon debe traer un taskctl que arranque
- Rama revisada: fix/task-031-distribucion-del-cli-un-clon-debe-traer
- Commit revisado: b1cd0e6
- Fecha: 2026-09-07
- Modalidad: **tres revisores independientes en paralelo**, uno por
  superficie, ninguno el agente que implemento.

- Veredicto: cambios solicitados (los tres revisores, por separado)

| Revisor | Superficie | Veredicto | Hallazgos |
|---|---|---|---|
| 1 | Empaquetado y reproducibilidad del build | APROBADO CON CAMBIOS | 1 importante, 3 menores |
| 2 | Tests nuevos y guard de CI | APROBADO CON CAMBIOS | 1 importante, 6 menores |
| 3 | Documentacion y veracidad de las afirmaciones | APROBADO CON CAMBIOS | 3 importantes, 7 menores |

**Cero criticos. 5 importantes, 16 menores.** Todos los importantes
corregidos; de los menores, 15 corregidos y 1 documentado sin corregir.

---

## Importantes

### I-1 y I-2 — El guard de CI estaba mal formulado, por dos motivos que cada revisor encontro por su lado

**(a) Falso positivo con `git status --porcelain`.** En cualquier worktree
heredado —el que ya tenia todo colaborador antes de que existiera el
`.gitattributes`— los `.ts` siguen en CRLF en disco, porque git no
rematerializa un fichero cuyo contenido normalizado no cambia. `tsc` los lee y
arrastra esos CRLF a las plantillas del build. El blob resultante es identico
tras el filtro `clean` (mismo hash, `git diff` vacio) y aun asi `git status`
marca ` M`.

Lo que lo hace importante no es el falso rojo en CI, sino el efecto local, que
el revisor 1 reprodujo entero:

```
$ node bin/taskctl new --titulo "Prueba" --tipo feature
[ERROR] Hay cambios sin guardar en "fix/task-031-...". Guardalos o comitealos.
$ git commit -m "prueba" -- dist/src/cli.js
nothing to commit, working tree clean
```

Workspace permanentemente sucio, `taskctl` bloqueado por su propio guard de la
§8.3, y sin salida: no se puede limpiar commiteando porque no hay nada que
commitear. Es el mismo modo de fallo que el `.gitignore` de la raiz ya advierte
para `.topoplanet/`, reintroducido por otra via. Afecta a maquinas de
desarrollo con worktree heredado, que es el publico de E1.

**(b) Ciego a los artefactos huerfanos.** `tsc` no purga `outDir`, asi que un
modulo borrado de `src/` deja su `.js` commiteado para siempre y el guard sigue
en verde — lo contrario de lo que promete su propio nombre.

**Corregido**, y la correccion descarta de paso la formulacion que tenia el
plan (`git diff --exit-code` a secas), porque esa no detecta ficheros nuevos:

```bash
rm -rf dist/src
npm run build
git add -A -- dist/src
git diff --cached --quiet -- dist/src || { ...; exit 1; }
```

Verificados los cuatro escenarios sobre un clon real:

| Escenario | Guard viejo | Guard nuevo |
|---|---|---|
| Estado sano | VERDE | **VERDE** |
| Modulo nuevo sin commitear | ROJO | **ROJO** |
| Modulo borrado de `src/` (huerfano) | VERDE (fallo) | **ROJO** |
| Worktree con `.ts` en CRLF | ROJO (falso positivo) | **VERDE** |

### I-3 — El guard de Windows no compilaba

Se apoyaba en el `- run: npm run build` que le precedia, en vez de compilar el
mismo. Reordenar o condicionar aquel step habria dejado a este pasando en verde
sin haber hecho el trabajo: sobre un checkout limpio la comparacion es
trivialmente vacia. Es la version espejo de la regla de `HALLAZGOS.md` sobre
pruebas que solo pueden pasar. **Corregido**: autocontenido, igual que el de
Linux.

### I-4 — `CLAUDE.md` se quedaba con la cifra de tests desactualizada

Decia 532 y con esta rama son 537. **Es literalmente el defecto que la revision
de TASK-028 caza y que aquella correccion vino a arreglar**, cometido otra vez.
**Corregido.**

### I-5 — La tabla de AC7 presentaba como prueba un experimento que no discrimina

La fila *"¿La copia cacheada trae `dist/`? Si"* es cierta pero no demuestra
nada: este marketplace se anadio como fuente `directory` apuntando al working
tree, y esa cache es **una copia del arbol, ficheros ignorados incluidos**. El
revisor lo probo contando 34 ficheros de `dist/test/` en la cache cuando
`git ls-files dist/test` devuelve 0. Es decir, **esa tabla habria contestado
"si" tambien antes de esta tarea**, con `dist/` entero ignorado. Lo mismo con
`node_modules/`, que tambien viaja en la copia.

La conclusion de fondo era correcta; la evidencia, no. **Corregido**: el README
lo dice explicitamente y remite a quien si lo demuestra —el test de AC1, que
exporta HEAD y solo ve lo commiteado—, y apunta el `npm ci` a su evidencia real
(el `mtime` del `.package-lock.json` de la cache, que es el del instante del
install).

### I-6 — La skill afirmaba sin matiz, y su diagnostico era falso para el caso ya observado

Decia *"si no responde, el plugin no esta activo"*. En esta misma maquina el
plugin **si** esta activo (`enabled` en `settings.json`, instalado con scope
`user`) y `taskctl` daba `command not found`: lo que falta es reiniciar la
sesion. Un agente en otro proyecto habria concluido que el plugin no esta
instalado y abandonado la skill. **Corregido**: tres pasos en orden —reiniciar,
invocar por `$CLAUDE_PLUGIN_ROOT`, y solo entonces concluir que no esta
activo—, sin marcas de este repo.

---

## Menores

**Corregidos (15):**

1. `.gitignore` de `dist/` pasa de lista negra a lista blanca (`dist/*` +
   `!dist/src/`): enumerar lo excluido dejaba entrar cualquier artefacto
   futuro, p. ej. un `tsconfig.tsbuildinfo` el dia que alguien active
   `incremental`.
2. `bin/* text eol=lf`: el lanzador estaba fuera del `.gitattributes` y se
   materializaba con CRLF. No se pudo convertir en fallo bajo Git Bash, pero
   el fichero esta en modo `100755` y un shebang con `\r` no lo tolera un
   kernel Unix.
3. `exportarHead()` valida el sha antes de clonar. En un repo sin commits
   `git rev-parse HEAD` imprime la cadena literal `HEAD`, y el error salia
   disfrazado de "no se pudo hacer checkout de HEAD".
4. `exportarHead()` limpia su temporal si falla a mitad: el `try/finally` del
   llamador aun no existe, asi que un fallo dejaba un clon entero huerfano.
5. La contraprueba asevera ahora `Cannot find module`, no solo "no pudo
   arrancar": el `catch` de `bin/taskctl` convierte cualquier error en codigo
   1, asi que pasaba tambien por motivos ajenos. El revisor lo demostro sin
   buscarlo, ejecutandola donde `bin/taskctl` ni existia.
6. La contraprueba comprueba que existe lo que va a borrar (`rm` con `force`
   es un no-op silencioso si la ruta cambia).
7. Comentarios corregidos donde atribuian a `newLine: "lf"` un efecto que hoy
   no tiene: **con TypeScript 5.9.3 la opcion es inerte**, quitarla produce
   salida byte a byte identica. Se mantiene como cinturon y tirantes ante un
   cambio de version, pero quien fija el eol de verdad es el `.gitattributes`.
8. El comentario del test de CR dice ahora su alcance real: mientras el filtro
   este puesto, commitear un CRLF ahi es **imposible**; lo que detecta es un CR
   suelto o que alguien rompa el `.gitattributes`.
9. El guard imprime `git ls-files --eol` cuando falla: si la deriva es de fin
   de linea, `git diff` sale vacio y el maintainer se quedaba sin diagnostico.
10. `plan-final.md`: el AC5 decia "los 472 tests actuales", cifra copiada de un
    `ESTADO.md` desfasado cuando en `develop` eran 532. Corregido con nota, en
    vez de borrarlo en silencio como habia hecho la transcripcion al
    `tarea.md`.
11. `plan-final.md`: el plan afirmaba que el `.gitattributes` se acotaba a
    `dist/**`, y la implementacion tuvo que ampliarlo a `*.ts` y `bin/*`.
    Corregido con nota.
12. README: *"nunca se hereda `dist/` de un `git clone`"* estaba en presente y
    esta tarea lo volvio falso. Acotado a su momento.
13. README: la seccion "Lo que NO se ha podido verificar" queda marcada como
    historica; el lector caia en la contradiccion antes de llegar a las dos
    secciones que la superan.
14. README: la restriccion de `bin/` se atribuia entera a `plugins-reference`;
    el mensaje de error concreto esta en `plugin-marketplaces`. Atribuido a
    cada pagina lo suyo.
15. `CONVENCIONES.md`: dos lineas desfasadas, senaladas por dos revisores desde
    superficies distintas — `dist/src` ahora **si** se hereda de un clon, y la
    atribucion prescrita iba por detras de la que el repo usa desde hace 20
    commits.

**Documentado sin corregir (1):**

16. **Coste de los tests de integracion**: dos clones completos del repo por
    corrida, 8,3 s de los 9,4 que tardan, y dos borrados recursivos que
    alimentan los `EBUSY ... rmdir` intermitentes de Windows. Se podria
    compartir un unico export entre los dos tests. **No se hace**: el segundo
    test muta su arbol (borra `dist/`), asi que compartirlo acopla la
    contraprueba al test principal y una rotura del primero arrastraria al
    segundo. El aislamiento vale los cuatro segundos. En las corridas completas
    la limpieza funciono y no quedaron temporales huerfanos.

---

## Verificaciones que salieron limpias

Se registran porque son las que sostienen los criterios de aceptacion, y
porque varias miden cosas que hasta ahora este proyecto solo suponia:

- **AC1** confirmado en clon limpio sin `npm install` ni build: `--version`,
  `--help` y `board`, los tres con codigo 0.
- **AC4 exacto**: el arbol commiteado bajo `dist/` son 26 ficheros `.js` de
  `dist/src`, mapeo 1:1 con los `.ts`, sin `.d.ts`, `.map` ni
  `.tsbuildinfo`, y los 26 modulos cargan sin `npm install`. `dist/test/` no
  entra por ningun flujo, ni con `git add -A` ni con `git add .` desde la raiz.
- **La excepcion del `.gitignore` raiz es robusta**: modulos nuevos en
  subdirectorios nuevos salen como no trackeados, nunca como ignorados, y
  `git clean -xdf` respeta `dist/src`.
- **Build reproducible**: mismo hash en dos compilaciones desde cero,
  independiente del cwd, sin rutas absolutas, e **identico en TypeScript 5.6.3
  (el suelo del rango) y 5.9.3 (el del lockfile)**. Estable con `autocrlf` en
  `true`, `false` e `input`, y con `core.eol=crlf`.
- **Matriz de mutacion**: las cuatro mutaciones previstas ponen rojo algun
  test. Una quinta que no se habia pedido —sacar del indice un modulo
  *transitivo*, no el entrypoint— tambien tumba el test de integracion, lo que
  prueba que cubre toda la cadena de imports.
- **Los tests aguantan las formas de checkout de CI**: detached HEAD, commit
  huerfano sin rama, checkout tipo PR sin `refs/heads` y clon shallow
  (`fetch-depth: 1`).
- **Ningun step `continue-on-error` puede ensuciar `dist/src`**: el smoke test
  de Git-Flow trabaja en `mktemp -d` con `trap` de limpieza.
- **Las citas de documentacion son literales**, comprobadas contra el HTML real
  de `code.claude.com`, y la afirmacion fuerte del README —que `prepare`
  tampoco corre, cuando la doc solo enumera `preinstall/install/postinstall`—
  se verifico empiricamente con un paquete de prueba. Ademas se encontro
  `--ignore-scripts` en la region de argv del binario `claude.exe`.
- **Los 34 CRLF del literal `HELP`**: numero exacto, reproducido sobre
  `develop`. Los saltos que emite `tsc` ya salian en LF (454 frente a 34).
- **La skill no lleva marcas de este repo**: 24 patrones buscados, cero
  coincidencias en el texto anadido.
- **Mensajes de commit**: espanol y ASCII puro, cero tildes en los seis, con la
  atribucion consistente con el historial.

---

## Anomalia explicada

El revisor 3 reporto, sin poder reproducirla, una corrida en rojo con un cuarto
fallo y un `src/core/modulo-efimero.ts` fantasma en el indice. **Tiene
explicacion y no es un defecto de la tarea**: ese fichero lo creo el revisor 2
en sus mutaciones, y los tres revisores compartian el mismo working tree. Es
interferencia entre revisores paralelos. Verificado despues: repo limpio, sin
worktrees ni ramas residuales, y `grep -r modulo-efimero` sin resultados.

La leccion, que va a `HALLAZGOS.md`: **revisores en paralelo sobre un mismo
working tree se contaminan entre si**. Los tres dejaron el repo como lo
encontraron, pero uno midio el estado que otro estaba mutando. Si vuelven a
lanzarse en paralelo, cada uno con su clon.
