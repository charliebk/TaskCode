# Registro de puertas de verificación

Cada vez que corre una puerta que cuesta tiempo (la sincronización de ficheros
derivados, y las que se añadan con el mismo formato: el freno de fin de turno,
las verificaciones de `review` y de `finish`), `taskctl` añade una línea a un
registro común. Sirve para saber cuánto se va en cada puerta por tarea;
`taskctl metricas` lo lee.

## Dónde está

En el directorio de Git del repo, fuera del árbol de trabajo:
`git rev-parse --git-path taskcode/puertas.log` (en un repo normal,
`.git/taskcode/puertas.log`; en un worktree enlazado, el de ese worktree). No
ensucia `git status` y no hace falta ignorarlo.

## Formato

Una línea por ejecución, seis campos separados por un tabulador:

```
puerta	tarea	instante	modo	duracion_s	resultado
```

| Campo | Contenido |
|---|---|
| `puerta` | Qué se ejecutó: `sincronizacion`, … |
| `tarea` | El ID (`TASK-123`, `TASK-123a`), o `-` si no hay tarea |
| `instante` | ISO 8601 en UTC del final de la ejecución |
| `modo` | El contexto de la puerta; para `sincronizacion`, la fase de `taskctl` que commiteaba (`plan`, `finish`, …; `otra` si no se sabe) |
| `duracion_s` | Segundos, con un decimal |
| `resultado` | El desenlace; para `sincronizacion`, `aplicada`, `fallida`, `omitida-rutas-con-cambios` o `rutas-ajenas` |

Ningún campo lleva tabuladores ni saltos de línea (se cambian por espacios) y
un campo vacío se escribe `-`.

## Reglas para quien lo lee o lo escribe

- Quien lee ignora las líneas mal formadas y las de puertas que no conoce:
  añadir una puerta nueva no rompe a los lectores existentes.
- Escribir nunca tumba una transición: si el registro no se puede escribir, la
  ejecución sigue sin línea.
- `taskctl metricas` suma la puerta `sincronizacion` por tarea en la columna
  `sinc`; sin líneas de la tarea, `—`.
- `taskctl metricas` resume la puerta `freno` en dos columnas: `freno_n`
  (veces que el freno ejecutó de verdad la verificación: las `omitido` no
  cuentan) y `freno` (el tiempo de todas sus líneas); sin líneas, `—`.

## Puerta `freno`

El freno de fin de turno (hook `Stop`) anota una línea cada vez que llega a
decidir si verifica una tarea en curso. Si no hay tarea en curso en la rama, no
hay comando de verificación o solo cambia documentación sin comprobación
declarada, no hay puerta y no hay línea.

| Campo | Valor |
|---|---|
| `modo` | El tipo de verificación: `completa`, `selectiva` o `documentacion` |
| `resultado` | `verde` (ejecutó y salió bien), `rojo` (cualquier otro desenlace: bloquea el turno), `omitido` (no ejecutó: la huella del árbol es la de su último verde, o el memo de la verificación ya la tenía en verde) o `excedido` (agotó su presupuesto de tiempo) |
| `duracion_s` | Tiempo de reloj de la verificación; `0.0` cuando se omite |

El último verde del freno se guarda aparte, en
`git rev-parse --git-path taskcode/freno-ultimo-verde.json`, con la huella del
árbol (commit, comando, timeout, base de la selectiva y contenido de lo que no
está limpio). Por eso un turno que no cambia nada no vuelve a verificar aunque
haya cambios sin commitear. Solo lo lee el freno: no abre ninguna otra puerta.
