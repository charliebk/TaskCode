# Brainstorm — TASK-093, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura

## Enfoque propuesto, con rutas y nombres concretos

- Hoy finish nunca reutiliza el memo, y es una decisión escrita: `commands/finish-verificacion.ts:4-6` («no reutiliza el memo, que no ve los ficheros ignorados»). En `:118` llama directamente a `ejecutarVerificacion` y en `:121-123` solo escribe el memo, con el árbol limpio.
- Memo de la completa: `.git/freno-verificacion.json` (`fs/verificacion.ts:40-44` y `rutaMemo` en `:157-161`). Guarda un único registro `{version:1, huella, resultado, fecha}` (`:150-155`).
- La huella actual es `sha1(v1, HEAD, comando, timeoutS [, ctx])` más la foto de lo sucio (`huellaDelArbol`, `:112-132`). La foto sale de `git status --porcelain -z --untracked-files=all` (`fs/ejecucion-acotada.ts:204-230`), que no lista los ignorados.
- Quién escribe el memo de la completa: el hook Stop, solo si no hay selectiva (`hooks/freno-stop.ts:180-192` → `verificacion.ts:256-257`), con el timeout recortado por `timeoutEfectivoS` a un máximo de 3540 s (`freno-stop.ts:48-49`, `:78-82`). También finish (`finish-verificacion.ts:123`).
- Quién lo lee: el Stop (`verificacion.ts:245`) y el guardián de merges, con `huellaDeCommit` y los dos timeouts (`hooks/guardia-merge.ts:153-160`).
- doctor no lee ni escribe el memo (grep de `leerMemo|guardarMemo|huella*` en `src/`). review solo usa la selectiva (`commands/review.ts:903-907`), que tiene su propio fichero, `freno-verificacion-selectiva.json` (`verificacion.ts:42`).
- Propuesta: un único componente nuevo, el «listado de ignoradas», que entra igual en **las dos** fórmulas, `huellaDelArbol` y `huellaDeCommit`. Se mezcla como un segmento `ign\0…` solo si la clave está declarada. Es el mismo patrón que `ctx\0` de TASK-091 (`verificacion.ts:128-129`). Sin la clave, el hash de entrada es byte a byte el de 0.13 y `VERSION_MEMO` no cambia.
- finish, con la clave declarada y el árbol limpio, calcula la huella **antes** de ejecutar. Si `leerMemo` devuelve `verde`, no ejecuta y lo dice con la fecha del memo. Un rojo guardado nunca se reutiliza en finish. La política se queda en finish; el mecanismo, en `fs/verificacion`.

## Que se extiende y que se crea

- `fs/verificacion.ts`, se extiende:
  - `huellaDelArbol(raiz, comando, timeoutS, contexto?, ignoradas?)` y `huellaDeCommit(raiz, ref, comando, timeoutS, ignoradas?)`, con un parámetro opcional `readonly string[]`.
  - `leerMemo` también devuelve la `fecha` (o una variante `leerMemoConFecha`), para que finish pueda decir de cuándo es el verde.
- `fs/verificacion.ts`, se crea `listadoIgnoradas(raiz, entradas): string | null`. Ahí y no en `ejecucion-acotada.ts`: `fotoDelArbol` la usa también la sincronización para otro fin (TASK-033).
  - Por cada entrada, un `lstat` sin seguir enlaces. Un fichero da `ruta\0tamaño\0mtimeMs`. Una carpeta se recorre entera, **solo con stat y sin leer contenido**, con orden por ruta POSIX en bytes.
  - Tope fijo de entradas (p. ej. 20 000). Si se supera, devuelve `null`: no hay huella, se verifica siempre y se avisa nombrando la clave.
  - Las carpetas grandes **no** se recorren por defecto: se declara un fichero centinela, como ya hace el ejemplo del objetivo con `web/node_modules/.package-lock.json`. El README tiene que empujar a eso.
- `core/config.ts`, se extiende:
  - Clave `entradas_ignoradas_verificacion` en `CLAVES_CONFIG` (`:268` y siguientes), en `TaskcodeConfig`, en los defaults (`[]`) y en la tabla de cabecera (`:21-23`).
  - Validador `validarEntradasIgnoradas`, copiado de la forma de `validarRutasSincronizacion` (`:816-846`): lista inline no vacía, normalizada y sin duplicados.
  - `motivoRutaInvalida` (`:864-894`) gana una opción `{ admiteCarpeta: true }`, como ya hace `ficheroEnRaizDeTareas`. Con ella se acepta la `/` final y se mantiene el rechazo de rutas absolutas, `..` y `.git/` (ahí vive el memo y se invalidaría a sí mismo).
- `core/config.ts`, comprobación en disco de que la entrada existe: va en `resolverConfigInterno` (`:414-429`), donde ya se hace el stat de `rutas_sincronizacion`.
  - Para cumplir «nombra la clave y la línea», `parsearConfigConAvisos` tiene que conservar el `donde` de la clave, igual que hoy `dondeUrlBase` (`:477`, `:572`). El error actual de carpeta (`:424`) **no lleva línea**: hay que corregirlo.
- `core/config.ts`, en `validarVerificacionCompleta` (`:670-695`): la clave sin `comando_verificacion` es un error que «no hace nada».
- `finish-verificacion.ts`, se extiende `puertaVerificacion`:
  - Un nuevo `ResultadoPuerta` `{tipo:'reutilizada', fecha, duracionMs}`.
  - Revisar quién consume `inicioMs` (TASK-074, el informe de cobertura viejo).
- `freno-stop.ts` y `guardia-merge.ts`, se extienden: solo pasan `config.entradas_ignoradas_verificacion` a la fórmula. El guardián ya sabe dejar pasar un verde (`:158`).

## Limites que cruza

- El formato del memo bajo `.git/`: el esquema no cambia, solo cambia la huella cuando la clave está declarada. Un memo de 0.13 sigue valiendo sin la clave.
- El contrato público de `.taskcode/config.yml`: una clave nueva que leen proyectos ajenos. Los textos de error y del README no pueden mencionar TaskCode.
- La frontera core/fs: la validación sintáctica se queda en el parser puro y la existencia en `resolverConfigInterno`, que ya toca disco. El listado vive en `fs/`, no en `core/`.
- La ADR implícita de TASK-072 (finish no reutiliza el memo): se revisa **de forma explícita** y solo con la clave. Hay que reescribir el comentario de `finish-verificacion.ts:4-6`.
- El memo de la selectiva no se toca: nunca recibe `ignoradas`, y el guardián sigue leyendo solo `'completa'`.

## La decision de diseño que mas te preocupa (UNA sola)

Que el listado entre **también** en `huellaDeCommit`. El guardián lo calcula sobre el disco de ese momento, que puede estar en develop y no en la rama de la tarea. Los ignorados sobreviven al checkout, así que la huella casa. Pero si `huellaDeCommit` no lo incluye, el guardián deja de casar con todo verde escrito con la clave y bloquea siempre. Las dos fórmulas tienen que salir de una sola función compartida, nunca de dos copias.

## Alternativas descartadas

- Usar `git status --ignored` en la foto: lista todos los ignorados (`node_modules`, `dist`, `coverage`) y además los que escribe la propia verificación, así que la huella no casaría nunca y el coste crece con el repo. Una lista declarada y acotada es determinista.
- Hacer hash del contenido de las carpetas declaradas: es O(bytes) en cada fin de turno del Stop y en el guardián, que tiene 30 s de timeout. Tamaño más mtime es O(entradas).

## Suposiciones no verificadas

- El verde de las 12:01 en ToolsaWeb TASK-295 lo escribió finish o el Stop sin selectiva (un verde manual no deja memo). Hay que mirar si ToolsaWeb declara `comando_verificacion_selectiva`.
- Ningún consumidor de `ResultadoPuerta.verde.inicioMs` se rompe con `'reutilizada'`. Hay que mirar los llamantes de `puertaVerificacion` en `commands/finish*.ts`.
- El mtime de NTFS/ext4 es estable entre la verificación y finish si nadie toca los ficheros. Lo comprueban riesgos y testing.
