# Duplicacion de grano fino: los patrones tipicos

La duplicacion que mas cuesta no es la de dos ficheros iguales: es la de
dos trozos pequenos que hacen lo mismo con otro nombre y divergen con el
tiempo. Es la D de duplicacion de la Regla 4D (`revision.md`) y cuenta como
IMPORTANTE. Repasa el diff con esta lista antes de pedir revision, y el
revisor con ella.

- **El helper copiado con otro nombre.** Una funcion de formato, de
  normalizar rutas o de partir texto que ya existe en otro modulo, reescrita
  con un nombre nuevo. Busca por lo que hace, no solo por el nombre.
- **El lector repetido.** Cada modulo con su propio parser de la misma
  estructura (secciones de un markdown, bloques cercados, celdas de una
  tabla, un fichero de config): un caso borde se arregla en uno y en los
  demas no. Una funcion, y que los demas la llamen.
- **El envoltorio repetido de una herramienta externa.** Cada comando con su
  propia forma de lanzar git, leer ficheros o llamar a la red, con matices
  distintos al tratar errores. Un envoltorio, con su politica de errores.
- **La lista escrita dos veces.** Flags, claves de config, nombres de fases
  o extensiones escritos a mano en el codigo, en los tests y en la
  documentacion. Deriva las copias de la fuente, o un test que compare.
- **La regla copiada entre documentos.** La misma instruccion en varios
  ficheros que lee un agente o una persona: cuando una cambia, las otras
  mienten. Una fuente y remisiones.
- **Los helpers de test por fichero.** Cada fichero de test con su repo
  temporal, su fixture o su comparador: lo que se corrige en uno no llega al
  resto. Un helper compartido.
- **La correccion a medias.** Unificar los sitios que cita el hallazgo y
  dejar los demas: la siguiente auditoria los encuentra. Antes de dar una
  duplicacion por resuelta, busca todos los usos por nombre y por patron.

Al unificar, generaliza lo justo (un parametro, una funcion comun) y
conserva el comportamiento de todos los llamadores; un test que cubra los
casos de cada uno es la prueba de que la unificacion no rompio a nadie.
