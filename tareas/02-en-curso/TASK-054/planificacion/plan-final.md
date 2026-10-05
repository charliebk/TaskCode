# Plan — TASK-054: Rutas no ASCII en el diff de revision fragmentado por dominio

**Desviacion documentada:** sin brainstorm. La heuristica la puntua `trivial`
(0 puntos) y el cambio es una funcion de `fs/git.ts` con su test; se aprueba
como orquestador (backlog en continuo).

## Enfoque propuesto

- `src/fs/git.ts`, `diffParaRevision`: los nombres se piden con
  `git -c core.quotePath=false diff --name-only -z` y se parten por `\0`, asi
  una ruta no ASCII (o con comillas, espacios o un salto de linea) sale tal
  cual, sin comillas ni octal. El diff y el `--stat` de excluidos se piden
  tambien con `core.quotePath=false`, para que la cabecera del diff diga la
  misma ruta que la clasificacion.
- `diffRangeForPaths`: cada ruta va como pathspec `:(literal)<ruta>`. Sin
  eso una ruta real con caracteres de glob (`pages/[id].vue`, muy comun en
  Nuxt) se interpreta como patron y el diff del grupo puede salir vacio o con
  otros ficheros: es el mismo sintoma que este fix (el fichero no llega a la
  peticion de su dominio).
- `diffNameOnly`: mismo tratamiento (`-z`, `quotePath=false`). Hoy no la
  llama nadie en `src/` (solo la cita un comentario de `core/revisores.ts`);
  se corrige igual para que el criterio 1 valga para las dos, y se anota.

## Riesgos aceptados y que los contiene

- `-z` cambia el separador: un `split('\n')` olvidado partiria mal. Lo
  contienen los tests de `diffParaRevision` existentes (incluidos/excluidos)
  mas los nuevos.
- `:(literal)` desactiva la magia de pathspec en `diffRangeForPaths`; quien
  la llama solo pasa rutas reales del `--name-only`, nunca patrones.

## Plan de pruebas

- Repo temporal con `src/acción.ts` y `src/main/java/com/acme/Ñandú.java`:
  `diffParaRevision` devuelve las rutas sin comillas ni octal, y el diff las
  cita igual.
- Revision fragmentada por dominio (`taskctl review` real) con
  `src/main/java/.../Acción.java` y un `.vue`: la peticion del dominio Java
  trae el diff del fichero con tilde.
- `diffRangeForPaths` con `pages/[id].vue` junto a `pages/i.vue`: solo sale
  el primero.
- Suite completa: solo los 3 rojos conocidos de Windows.

## Lo que necesita decision de una persona

Nada.
