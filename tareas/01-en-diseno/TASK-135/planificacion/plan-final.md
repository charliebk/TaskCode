# Plan — TASK-135: diffRangeForPaths por lotes: ENAMETOOLONG en la revision fragmentada

(Modo rapido: tarea pequena, el plan lo redacta quien orquesta, sin lanzar el
rol de arquitectura ni unificador.)

## Enfoque propuesto

Duracion estimada: 40 min (de la rama abierta al cierre con merge; senales: 1 fichero de codigo, 1 capa, 5 criterios)

1. En `src/fs/git.ts`, una funcion pura y exportada `lotesDeRutas(rutas,
   maxRutas, maxCaracteres)` que parte la lista en lotes consecutivos, sin
   reordenar, cortando cuando el lote llega a `maxRutas` rutas o cuando el
   pathspec acumulado (`:(literal)` + ruta + separador, contado en
   caracteres) pasaria de `maxCaracteres`. Una ruta que por si sola pase del
   tope va sola en su lote (no se pierde; Git dara el error real si de
   verdad no cabe).
2. Constantes: `LOTE_RUTAS_STAT = 100` se mantiene (los tests la usan) y se
   anade `LOTE_CARACTERES_PATHSPEC = 8000`. El limite de Windows es 32 767
   caracteres para la linea entera; 8000 deja margen para el resto de
   argumentos, el `cwd` y las comillas que anade la conversion a linea de
   comandos.
3. `statDeFicheros` pasa a usar `lotesDeRutas` (hoy corta solo por numero:
   cierra el MENOR de la ronda 2 de TASK-113).
4. `diffRangeForPaths` usa los mismos lotes y concatena las salidas tal
   cual. Cada lote produce el diff completo de sus ficheros y Git ordena por
   ruta dentro de cada llamada; como los lotes son consecutivos sobre la
   lista ya ordenada que le llega, la concatenacion es un diff valido. La
   lista vacia sigue devolviendo '' sin llamar a Git.
5. No se toca `review.ts`: el llamante no cambia.

Fuera de alcance (comprobado en el analisis previo): `git-commit.ts`
(`add`/`diff --cached`/`commit` con `...presentes`) y `sincronizacion.ts`
(`porcelain`) solo reciben las carpetas de la tarea y las rutas declaradas;
no crecen con los ficheros de la rama.

## Lo que el rol no cubrio

No se lanzo el rol. Lo que queda sin mirar a fondo: otras llamadas de
`review` con listas por fichero que pudieran aparecer en la peticion
fragmentada; el test de integracion de `review` con mas de 1000 ficheros las
destapara si existen.

## Riesgos aceptados y que los contiene

- Orden de la salida: si quien llama pasara rutas desordenadas, la
  concatenacion por lotes podria ordenar distinto que una sola llamada. Lo
  contiene que `review` las pasa en el orden del clasificador (el de
  `git diff --name-only`, ya ordenado) y el test que compara el diff por
  lotes con el de una sola llamada.
- En Linux el limite es ~2 MB: el test de integracion pasa ahi tambien sin
  el arreglo. Lo contiene el test unitario de `lotesDeRutas`, que comprueba
  los cortes en cualquier plataforma.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- C1 (lotes en `diffRangeForPaths`, sin ENAMETOOLONG): test con repo
  temporal y 1300 rutas largas; `diffRangeForPaths` devuelve el diff de
  todas (en Windows, sin el arreglo, ENAMETOOLONG).
- C2 (mismo resultado, lista vacia): con 2*LOTE+3 rutas cortas, el diff por
  lotes es identico al de `git diff` con las mismas rutas en una sola
  llamada; lista vacia devuelve ''.
- C3 (corte por bytes): test unitario de `lotesDeRutas` sin Git: rutas de
  300 caracteres cortan por caracteres antes de 100 rutas; ningun lote pasa
  de `LOTE_CARACTERES_PATHSPEC`; concatenar los lotes devuelve la lista
  original; ruta mas larga que el tope va sola.
- C4 (review fragmentada con >1000 ficheros): `runReviewCommand` sobre un
  repo con `src/lib.rs` y 1100 ficheros de rutas largas sin dominio: la
  peticion generica embebe el diff del primero y del ultimo.
- C5 (`:(literal)`): sin test nuevo; los existentes de TASK-054 en
  `review-rutas.test.ts` siguen en verde.

## Lo que necesita decision de una persona

Nada.
