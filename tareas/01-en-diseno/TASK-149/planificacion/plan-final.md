# Plan — TASK-149: Regla 4D: helpers de E/S, Git y CLI en fs, hooks y cli

Redactado por el coordinador (modo rapido: cada caso tiene fichero y linea en docs/auditoria-4d-completa.md).

## Enfoque propuesto

Duracion estimada: 170 min (se trocea en tres partes de una hora o menos)

Cada helper de E/S, Git y CLI copiado en fs, hooks y cli queda en un solo sitio:

1. Git y hooks (parte a): `gitTexto` (fs/git-crudo.ts) como unico envoltorio de git sin lanzar, con un `maxBuffer` y un entorno (FS-07); una sola «rama actual» que se comporte igual durante un rebase (FS-06); un solo helper de `rev-parse --git-path`, y `pendientes` usa `operacionEnCurso` (FS-08); los hooks leen su entrada con `entrada-pretooluse.ts` (FS-05); registro-coste y guardia-merge no importan del freno (FS-17).
2. CLI (parte b): `doctor-deploy` imprime con `printAutoCommit` (FS-02); un tratamiento comun de errores en cli.ts que traduce `GitCommandError` igual en todos los comandos (FS-03); `extraerPushFlag` pasa a cli/args.ts (FS-18); el texto `aMano` de sincronizacion existe una vez (FS-15).
3. Utilidades (parte c): una lista de lockfiles (FS-10), una deteccion de binario con la excepcion UTF-16 (FS-11), una lectura de cola con relectura corta (FS-12), una busqueda en PATH con PATHEXT (FS-13), una lectura de JSON con BOM (FS-14), un `nombreBase` y mensajes que nombran `DIRS_EXCLUIDOS` (FS-16).

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- gitTexto (fs/git-crudo.ts), la rama actual de fs/git.ts, operacionEnCurso, entrada-pretooluse.ts (parser de la entrada de los hooks), printAutoCommit (cli.ts), extraerUnico y rechazarFlagsDesconocidos (cli/args.ts), json-claude.ts, la lectura de cola de ejecucion-acotada.ts, la deteccion de binario de sondas-deploy.ts (la que tiene UTF-16), la busqueda en PATH de status-line.ts (la que respeta PATHEXT), DIRS_EXCLUIDOS y nombreBase de deteccion-app.ts.
- Nuevo: solo el helper de `--git-path` y el tratamiento comun de errores del CLI, porque hoy no existen como funcion (estan copiados en linea).

## Troceo

### Parte a: git y hooks
gitTexto unico, una rama actual, un --git-path, el parser de la entrada de los hooks y hooks sin el grafo del freno (FS-05, FS-06, FS-07, FS-08, FS-17).
Duracion estimada: 60 min
- [ ] Un solo envoltorio de git sin lanzar (gitTexto), una sola rama actual, un solo --git-path y un solo parser de la entrada de los hooks; registro-coste y guardia-merge no cargan el modulo del freno

### Parte b: errores y flags del CLI
printAutoCommit en doctor-deploy, GitCommandError igual en todos los comandos, extraerPushFlag en cli/args.ts y aMano una vez (FS-02, FS-03, FS-15, FS-18).
Duracion estimada: 50 min
- [ ] doctor-deploy imprime con printAutoCommit y todos los comandos traducen GitCommandError igual, con test de un comando que antes caia en taskctl no pudo arrancar
- [ ] extraerPushFlag vive en cli/args.ts y el texto aMano de sincronizacion existe una vez

### Parte c: utilidades de fs
Lockfiles, binarios, cola, PATH, JSON con BOM y nombreBase con una implementacion (FS-10 a FS-14, FS-16).
Duracion estimada: 60 min
- [ ] Lockfiles, deteccion de binarios, lectura de cola, busqueda en PATH, JSON con BOM y nombreBase tienen una sola implementacion; los mensajes de evidencia nombran DIRS_EXCLUIDOS

## Desacuerdos entre roles, y como se resuelven

No hubo roles.

## Riesgos aceptados y que los contiene

- Unificar copias que ya divergen elige un comportamiento: se queda el mas completo (UTF-16 en binarios, PATHEXT en PATH, relectura corta en cola, la lista de lockfiles mas larga) y un test fija el caso en que divergian.
- Los hooks corren en cada llamada de herramienta: no cargar el grafo del freno es tambien una mejora de coste; un test de importacion lo fija.

## Plan de pruebas

Por parte, 1 o 2 tests nuevos del caso en que las copias divergian (rebase y rama actual, entrada del hook, GitCommandError en un comando que no lo traducia, lockfile que faltaba, UTF-16, PATHEXT, BOM, relectura corta). Mutacion de cada uno. Correr a mano los tests de los modulos tocados.

## Lo que necesita decision de una persona

Nada abierto. Troceo autorizado de antemano por Carlos para el plan de correcciones 4D («trocear las de mas de 1 h sin preguntar»).
