# Brainstorm — TASK-050, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos

[V] = leido en el repo; [S] = supuesto sin comprobar. No ejecuto la suite.

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

- **Un fallo solo de Windows no rompe el CI**: el job de Windows corre
  `npm test` con `continue-on-error: true` [V, `ci.yml`]. Si `fs.cp` falla
  solo en Windows (objetos de solo lectura, `EPERM`/`EBUSY`), el CI sale verde.
  Mitigacion: validar el helper en Windows nativo y anotar los rojos antes y
  despues.
- **Al unificar el setup cambian en silencio precondiciones**: los
  `withTempRepo` no son iguales [V] (`finish` commitea `.gitignore` con
  `logs/`; `review-exclusion` anade `core.autocrlf false`; `new-contenido` usa
  otra identidad; `rama-base` tiene dos setups). Un `.gitignore` distinto
  cambia el guard de workspace sucio y el test sigue verde sin probar lo mismo.
  Mitigacion: plantilla parametrizada por fichero que reproduzca el setup
  exacto, y comprobar por mutacion que los tests adoptados siguen cayendo.
- **Estado compartido**: si el helper devuelve la plantilla en vez de una
  copia, si la plantilla lleva `remote add origin` (cada test de
  `auto-commit.test.ts:358` crea su bare), o un worktree (`cadena.test.ts:173`;
  `.git/worktrees/*/gitdir` guarda rutas absolutas [S]). Mitigacion: plantilla
  solo con init, config, commit y ramas; copia siempre a un `mkdtemp` nuevo.
- **Ruta fija compartida entre ficheros**: los ficheros corren en procesos
  paralelos [S]; una plantilla en `tmpdir()/nombre-fijo` se pisaria. Plantilla
  por proceso con `mkdtemp`.
- **`test:rapido` incluye tests que lanzan procesos**: `core/config.test.ts`,
  `cli/flags-desconocidos.test.ts`, `cli/main.test.ts` [V]. Decidir lista o
  exclusion y documentar que queda fuera.
- **`test:rapido` en verde tomado como evidencia de cierre**: deja fuera
  `agents/`, `skills/` y `empaquetado/` (los tests de «no mencionar» el
  proyecto en el contenido instalable). Documentar que no vale para cerrar.
- **`test:rapido` sin build ejecuta `dist/` viejo**: `tsc` no limpia
  `dist/test` [V]. El script debe compilar antes.

## Estados intermedios y fallos parciales

- Copia a medias: `.git` incompleto, error enganoso. El helper debe fallar de
  forma explicita.
- Si falla el montaje de la plantilla caen todos los tests del fichero: mas
  visible, no mas grave; lo grave seria tragarse el error.
- `fs.cp` no conserva fechas [S]: el indice ve stat distinto y rehashea. Todo
  el codigo usa `git status --porcelain`, que refresca el indice; no hay
  `diff-files`/`diff-index` [V]. Hoy no rompe nada.
- Plantillas huerfanas en `%TEMP%` si muere el proceso: igual que hoy.

## Compatibilidad hacia atras

- `npm test` sigue siendo la suite completa: el CI la invoca [V]. Si pierde la
  cobertura cambia la salida del CI; nadie la consume ni hay umbrales [V].
- Globs entrecomillados en los scripts nuevos (trampa de `cmd.exe`).
- El helper vive en `test/`, no en `src/` (`dist/src` se versiona y se
  distribuye) [V].
- Una sola medicion ruidosa (EBUSY, 3 rojos fijos) no basta para decidir
  `test:cov`.

## Vuelta atras

Todo reversible: scripts y ficheros de `test/`. Lo que no se recupera al
revertir es la equivalencia probada de los ficheros migrados si no se
comprobo por mutacion.

## El riesgo que mas te preocupa (UNO solo)

Que los tests migrados sigan en verde pero dejen de probar lo que probaban
(`.gitignore` con o sin `logs/` frente al guard, `core.autocrlf`), agravado
porque el unico job que veria diferencias de Windows tiene `continue-on-error`.

Sin verificar: cuales son los 5 ficheros mas lentos (hay que medir), y el
comportamiento de `fs.cp` con objetos de solo lectura en Windows.
