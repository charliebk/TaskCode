# Plan — TASK-034: Excluir lo generado del diff de revision

(Un solo rol, arquitectura, por la decision C4: sin unificador. El rol
contrasto contra el codigo el diseno que propuso el orquestador.)

## Enfoque propuesto

- **Config** (`src/core/config.ts`): clave opcional `excluir_de_revision`, lista
  flow de patrones con semantica de `git :(glob)`. Por defecto
  `[**/dist/**, **/*.lock, **/*-lock.*, tareas/**]`. `[]` es valido (no excluye
  nada). Validador propio: rechaza elementos vacios, absolutos o con `..`;
  convierte `\` en `/`; un patron sin `/` pasa a `**/<patron>`; sin duplicados.
- **Git** (`src/fs/git.ts`): `diffParaRevision(desde, hasta, excluir, cwd)` →
  `{ incluidos, excluidos, diff, stat }`, con pathspecs `.` +
  `:(exclude,glob)<p>`. **Git es la unica implementacion de los patrones**
  (arquitectura): nada de `path.matchesGlob` para lo mismo. Argumentos cortos,
  sin listas de ficheros: no hay riesgo de longitud de linea en Windows.
- **Review** (`src/commands/review.ts`):
  - `clasificarPorDominio` recibe **solo los incluidos** (correccion de
    arquitectura al orquestador): un `dist/*.js` no debe activar un dominio ni
    fragmentar la revision por ficheros que nadie lee.
  - La peticion anade `## Excluido del diff` (el `--stat` y la orden literal
    `git diff <base>..HEAD -- ':(glob)<p>' ...`), omitida si no hay excluidos,
    y `- Carpeta de la tarea: tareas/03-en-revision/TASK-NNN (criterios y plan)`,
    calculada del estado destino, no de `filePath` (la peticion se escribe
    antes de mover la tarea).
  - Los parametros nuevos de `peticionTemplate` van en un objeto, no como 11-14.
- Coste: 2 llamadas `git` mas por `review`, que no crecen con los ficheros.

## Riesgos aceptados y que los contiene

- Semantica de `git :(glob)`, distinta de `patrones_archivo`: se documenta en
  la tabla de `config.ts` y en el mensaje de error.
- `tareas/**` es relativo a la raiz: si las tareas viven en otra ruta, se
  ajusta en config.
- El revisor deja de ver `tareas/` en el diff: lo cubre la linea `Carpeta de la
  tarea`.
- Septima clave de config, ampliando la decision #9: entra porque esta en los
  criterios y tiene quien la lea.

## Plan de pruebas

- Repo real (`test/commands/review.test.ts`): `dist/a.js` + `src/b.ts` →
  `dist/` fuera del bloque diff y dentro de `## Excluido del diff`, con la
  orden literal; `excluir_de_revision: []` lo embebe y quita la seccion; solo
  `dist/` cambiado → no fragmenta; `pkg/yarn.lock` excluido (`**/` anadido);
  la linea de carpeta apunta a `03-en-revision/`.
- `test/core/config-*.test.ts`: `[]` valido; vacio, absoluto y `../x` abortan.
- Medicion TASK-031: `diffParaRevision` desde el padre de develop anterior a
  su merge hasta la cabeza de su rama en el commit revisado; peticion
  reconstruida contra los 325 KB originales.
- Mutantes: quitar el filtro, clasificar con todos los ficheros, quitar `**/`.

## Lo que necesita decision de una persona

Resuelto por el orquestador, y lo dice en el cierre para que Carlos lo pueda
revertir: clasificar solo los incluidos (cambia que revisores intervienen en
tareas con `dist/`), y la base de la medicion de TASK-031 descrita arriba.
Carlos pidio empezar TASK-034 con urgencia (2026-10-03).
