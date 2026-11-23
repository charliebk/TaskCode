# Plan — TASK-144: Regla 4D: ciclo de vida, cadena y flags en commands

Redactado por el coordinador (modo rapido, sin brainstorm: cada caso tiene
fichero, linea y la incoherencia localizada en la auditoria de TASK-141).

## Enfoque propuesto

Duracion estimada: 60 min (la de la parte a; la tarea entera, unas 3 h, se trocea abajo)

Tres porciones que se prueban solas y no comparten ficheros salvo `cli.ts`:

1. **Cadena y Commit revisado (parte a).**
   - `GUARDADOS_POR_CADENA` incluye `trocear`, `verificar-menores`, `verificar-lote` y `doctor-deploy`. El test deja de compararse con una copia escrita a mano: recorre `src/commands/*.ts` y exige que cada comando que llama a `autoCommit(` o a `ensureBaseBranchReady(` este en el conjunto.
   - `informeEnCommitPropio` (siguiente) usa `codigoCambiado` de `verificar-menores`, que excluye `rutas_sincronizacion` y `excluir_de_revision`.
   - Un helper unico da «el Commit revisado de la ultima ronda»: `null` si la ronda de las peticiones no es la de los informes. Lo usan `siguiente`, `verificar-menores`, `codigoSinVerificar` y `leerRondaPrevia`.
   - Un helper unico, `tareaEnOtraRama(rama, cwd)` en `fs/git.ts`, con un unico mensaje de error, lo usan `pausa`, `registrar-coste` y `siguiente`.
2. **Flags (parte b).**
   - Los flags con valor se leen con un `extraerUnico` construido sobre `extraerRepetible` (`veredicto`, `verificar-menores`, `approve`, `cadena`, `finish-opciones`, `doctor-deploy`, `new`).
   - `FLAGS_SIN_VALOR` incluye todos los booleanos que los comandos leen por token. Un test de paridad recorre `src/commands` y exige que cada `includes('--x')` este en la lista.
   - `verificar-lote`: nombre del comando sin «taskctl» duplicado, `extraerPushFlag` (admite `-p`) y `autoCommit` con fase.
3. **Patrones y plan (parte c).**
   - `RONDA_FILE_RE` de `review` sale de `fs/rondas.ts`; `PETICION_ROL_RE` y los prefijos `salida-brainstorm-` salen de `plan-brainstorm.ts`.
   - «Que plan cuenta» se decide en una funcion (la que ya usa `approve`, con la misma regla de ambiguedad) y la usan `planRedactado`, `duracionDelPlan` y `trocear`.
   - `doctor-deploy` deja de detectar el caso buscando el texto de un aviso y usa el dato que ya calculo.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- `codigoCambiado` y `codigoSinVerificar` (verificar-menores.ts) para el codigo cambiado tras el Commit revisado; `extraerRepetible` y `FLAGS_SIN_VALOR` (cli/args.ts); `extraerPushFlag`; `PETICION_REVISION_RE`/`INFORME_REVISION_RE` de fs/rondas.ts; `nombrePeticionRol`/`nombreSalidaRol` de plan-brainstorm.ts; `resolverPlanFinal` de approve.ts; `currentBranch`, `localBranchExists`, `isAncestor` de fs/git.ts; los fixtures de test/helpers/automatico-fixtures.ts.
- Nuevo: `extraerUnico` (sobre extraerRepetible), `tareaEnOtraRama` y `commitRevisadoDeUltimaRonda`: hoy cada comando lo reescribe a mano.

## Troceo

### Parte a: cadena, Commit revisado y tarea en su rama
GUARDADOS_POR_CADENA derivado y probado contra los comandos que escriben, una sola definicion de codigo cambiado tras el Commit revisado y del Commit revisado de la ultima ronda, y un solo helper de tarea en otra rama (CMD1-01, CMD2-01, CMD2-03, CMD2-04).
Duracion estimada: 60 min
- [ ] Un test recorre src/commands y falla si un comando con autoCommit o ensureBaseBranchReady no esta en GUARDADOS_POR_CADENA; trocear, verificar-menores, verificar-lote y doctor-deploy aceptan --cadena dentro de una cadena
- [ ] siguiente, verificar-menores, codigoSinVerificar y leerRondaPrevia usan una sola funcion para el Commit revisado de la ultima ronda y una sola para el codigo cambiado; un test con comando_sincronizacion que regenera un fichero fuera de tareas/ en el commit de review da fase finish sin pregunta en modo automatico
- [ ] pausa, registrar-coste y siguiente deciden con un mismo helper si la tarea vive en otra rama, con un solo texto de error

### Parte b: flags con y sin valor
Todos los flags con valor se leen con el mismo lector y todos los booleanos estan en FLAGS_SIN_VALOR (CMD1-09, CMD2-05, CMD2-14, FS-01).
Duracion estimada: 60 min
- [ ] veredicto, verificar-menores, approve, cadena, finish-opciones, doctor-deploy y new leen sus flags con valor con un helper basado en extraerRepetible: --flag=valor y --flag valor dan lo mismo en todos, con test
- [ ] Un test de paridad falla si un comando lee un booleano por token que no esta en FLAGS_SIN_VALOR; review --completa=1 aborta en vez de ignorarse
- [ ] verificar-lote: sin «taskctl taskctl», admite -p y su autoCommit lleva fase

### Parte c: patrones de ronda, plan que cuenta y doctor-deploy
Los patrones de fichero de ronda y de peticion de rol, y la decision de que plan cuenta, en un solo sitio (CMD2-02, CMD2-09, CMD1-10, CMD1-11).
Duracion estimada: 50 min
- [ ] review usa el patron de rondas.ts y plan/approve el de plan-brainstorm.ts (sin prefijos brainstorm- escritos a mano); un rol con otro id no rompe la numeracion, con test
- [ ] planRedactado, duracionDelPlan, trocear y approve eligen el plan con una sola funcion; con dos planes, siguiente y approve dan la misma respuesta, con test
- [ ] doctor-deploy decide el caso de --resultado dentro del repo con el dato calculado, no con el texto del aviso

## Desacuerdos entre roles, y como se resuelven

No hubo roles.

## Riesgos aceptados y que los contiene

- Añadir comandos a la cadena hace que, con una cadena abierta, otra sesion ya no pueda lanzarlos sin testigo: es justo lo que se busca (bloqueo real).
- `informeEnCommitPropio` con las exclusiones puede dar por bueno un cambio en un fichero excluido de la revision: es la misma regla que ya aplica `finish` (TASK-113), ahora coherente.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio): 1 por criterio en cada parte, salvo el de flags con valor (2: forma con igual y sin igual en un comando de cada familia). Ninguno pesado. Cada test nuevo se comprueba por mutacion.

## Lo que necesita decision de una persona

Nada abierto: Carlos pidio encadenar todas las correcciones sin parar y trocear lo que pase de una hora.
