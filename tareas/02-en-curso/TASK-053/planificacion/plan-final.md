# Plan — TASK-053: moveTareaFile reintenta el rename ante un EPERM o EBUSY transitorio

**Desviacion documentada:** sin brainstorm (trivial; si `plan` pide un rol por
la heuristica, no se lanza: no hay diseno que explorar).

## Enfoque propuesto

- `src/fs/task-store.ts`: el `rename` de `moveTareaFile` pasa por un helper que,
  ante `EPERM` o `EBUSY`, espera 100, 200, 400, 800 y 1600 ms (unos 3 s en
  total) y reintenta; cualquier otro error (o agotar los reintentos) se
  propaga igual que hoy. El `ENOENT` tolerado (`tolerateMissingSource`) no cambia.
- La funcion de renombrar es inyectable via `MoveTareaFileOptions` para
  probarlo sin depender de que Windows falle.

## Riesgos aceptados y que los contiene

- Un `EPERM` permanente (permisos de verdad) tarda ~3 s mas en fallar; sigue
  fallando con el mismo error y `finish` sigue siendo reintentable.

## Plan de pruebas

- Un `rename` que falla con `EPERM` las 2 primeras veces: la tarea acaba movida.
- Uno que falla siempre: se propaga el `EPERM` tras los 5 reintentos y la
  carpeta sigue en su sitio.
- Un error que no es transitorio (`ENOTDIR`) no se reintenta.

## Lo que necesita decision de una persona

Nada.
