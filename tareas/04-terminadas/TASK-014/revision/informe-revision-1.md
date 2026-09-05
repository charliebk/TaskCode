# Informe de revision — TASK-014 (ronda 1)

- Commit revisado: aec1130 (la rama de la tarea)
- Revisor: agente de revision autonomo del metodo, protocolo completo de
  CONVENCIONES.md (clon temporal, suite propia, 7 repos Git adversariales
  con el CLI real)
- Veredicto: aprobada (los cambios solicitados en esta ronda se aplicaron en 2d2a467, ver Resolucion)

## Suite ejecutada por el revisor

259 tests: 256 pass, 3 fail — exactamente los 3 preexistentes de entorno
local (2 EPERM de symlink, 1 CRLF), que pasan en CI. Los 12 de
finish.test.ts pasaron.

## Hallazgos

### CRITICO-1: veredictoAprobado era fail-open ante la negacion natural

La comprobacion positiva buscaba la palabra aprobada en cualquier parte de
la linea: el veredicto <no aprobada (faltan tests)> APROBABA, mergeaba y
cerraba la tarea con exit 0. La puerta de calidad final del metodo aprobaba
justo la negacion mas natural en espanol.

### IMPORTANTE-1: reintento estructuralmente imposible tras conflicto de backmerge (hotfix y release)

El primer intento consuma merge a main y tag; el backmerge queda en
conflicto. Tras resolverlo a mano, el reintento reejecutaba el script
entero, que moria en fatal tag already exists — y encima dejaba al usuario
en main. La tarea quedaba en en-revision sin salida posible por taskctl.
(Para feature la recuperacion si funcionaba: no hay tag.)

### IMPORTANTE-2: mismo ID y mismo titulo en linaje divergente duplicaba la carpeta

El caso que detectarColisionId declaraba inofensivo (mismo titulo) es un
merge add mas add cuando no hay ancestro comun: develop quedaba con el ID
en dos carpetas de estado a la vez, y el finish reventaba DESPUES de
consumar merge y tag, con un diagnostico absurdo (ejecuta taskctl review)
y el reintento bloqueado por el tag.

### MENOR-1: finish desde una rama sin la carpeta de la tarea aconsejaba crear la tarea con import

### MENOR-2: CHANGELOG preexistente sin seccion Sin publicar la recibia al final del fichero

### MENOR-3: con varias lineas Veredicto mandaba la primera (placeholder sin borrar rechazaba el veredicto real)

### MENOR-4 (preexistente desde TASK-009): GitflowScriptLaunchError sin capturar en cli.ts

## Comportamientos verificados como correctos

Ronda superior manda (informe-2 PENDIENTE anula informe-1 aprobada); doble
finish rechaza limpio; colision con titulo distinto aborta antes de mergear
con repo intacto; conflicto en merge de feature deja la tarea intacta y el
reintento tras resolver funciona; titulos con caracteres raros de Markdown
sin fallos ni inyeccion; workspace sucio, veredicto PENDIENTE, estado
invalido y script roto rechazan sin efectos.

## Resolucion (2026-09-05, commit 2d2a467)

- CRITICO-1 → corregido: el valor debe EMPEZAR por aprobada, pendiente con
  limites de palabra, y TODAS las lineas Veredicto deben aprobar. Tests con
  negaciones naturales y lineas multiples.
- IMPORTANTE-1 → corregido: camino idempotente (si la rama ya esta
  integrada en todos los destinos, no se reejecuta el script y solo se
  cierra) y aborto con instruccion exacta cuando el merge a main esta
  consumado pero falta el backmerge. Test de conflicto real y reintento.
- IMPORTANTE-2 → corregido: discriminador de linaje con git merge-base
  (sin ancestro comun = colision aunque el titulo coincida). Tests del
  caso divergente y del caso normal con historia compartida.
- MENOR-1 → corregido: mensaje propio (cambiate a esa rama).
- MENOR-2 → corregido: la seccion nueva se inserta arriba, tras el titulo.
- MENOR-3 → corregido: regla todas-las-lineas-aprueban y la plantilla del
  informe pide sustituir la unica linea Veredicto.
- MENOR-4 → corregido: GitflowScriptLaunchError capturado en start,
  review y finish.