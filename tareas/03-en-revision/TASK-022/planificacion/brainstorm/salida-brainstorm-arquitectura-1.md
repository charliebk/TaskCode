## Enfoque

Fichero nuevo `docs/contexto/INCORPORACION.md` (patron ya usado por
ESTADO/CONVENCIONES/HALLAZGOS), enlazado desde `README.md` y
`docs/contexto/README.md`. No reescribe instalacion ni ciclo de vida: los
enlaza. El cierre del punto 8 (§14) se anota, no se reescribe, en el propio
`PROPUESTA_METODOLOGIA.md`.

## Piezas y limites

- `docs/contexto/INCORPORACION.md` — se crea — guia nueva; encaja en el
  directorio que ya agrupa documentos de proceso para quien trabaja en el
  repo, no en el plugin.
- `README.md` (raiz) — se extiende — anadir fila a la tabla "Documentacion"
  (lineas 61-71); su seccion "Instalar el plugin" ya esta verificada
  (TASK-031/E6) y no se toca.
- `docs/contexto/README.md` — se extiende — puntero al fichero nuevo en el
  indice "empieza por aqui".
- `docs/PROPUESTA_METODOLOGIA.md` §14 punto 8 — se extiende (nota aditiva,
  no reescritura) — cerrar "a quien se invita: a nadie por ahora (Carlos,
  2026-09-13)"; el fichero esta **congelado** (CONVENCIONES.md linea 99) pero
  ya hay decision explicita, que es la excepcion que la propia convencion
  contempla.
- `docs/contexto/CHECKLIST_TERMINACION.md` — se extiende — nota de cierre del
  punto 8, mismo patron que el cierre de E6.
- `skills/task-workflow/SKILL.md` (plugin) — no se toca — ya documenta el
  ciclo para quien instala el plugin en OTRO repo; la guia nueva enlaza, no
  copia, porque hay un test que impide mencionar TaskCode dentro del plugin.

## Orden de construccion

1. Confirmar si `taskctl --version` como comando suelto ya se vio funcionar
   tras `plugin install` (CHECKLIST_TERMINACION.md marca AC7 de E6 a medias)
   antes de prometerlo sin matices en la guia.
2. Escribir `INCORPORACION.md`: instalar (enlaza §7.10/README), ciclo de vida
   (enlaza SKILL.md), primera tarea real (enlaza §13 "Flujo diario").
3. Enlazar desde `README.md` y `docs/contexto/README.md`.
4. Anotar el cierre del punto 8 en `PROPUESTA_METODOLOGIA.md` y reflejarlo en
   `CHECKLIST_TERMINACION.md`.

## Alternativa descartada

- Meter la guia completa como seccion larga en `README.md` en vez de fichero
  aparte — descartada: el README ya enlaza y `docs/contexto/` ya es donde se
  desarrolla el detalle por tema; duplicarlo ahi rompe ese patron.
- Reescribir el ciclo de vida dentro de la guia en vez de enlazar la skill —
  descartada: diverge en cuanto cambie `taskctl` y choca con el test que
  prohibe mencionar TaskCode dentro del plugin.

## Desacuerdos previstos

- Con dominio — si cerrar el punto 8 va dentro del documento congelado o solo
  en ESTADO.md — mi posicion: nota minima in-place en §14.8, porque ya hay
  decision explicita de Carlos y el punto lleva "a medias" desde v15.
- Con riesgos — si la guia puede prometer "taskctl como comando suelto" sin
  re-verificar — mi posicion: documentar solo el camino ya probado
  (`plugin install`, uso en sesion) y marcar el standalone como pendiente.

## Suposiciones no verificadas

- Que el nombre del repo (`TaskCode`) solo esta fijado en la peticion de esta
  tarea y no ya en `PROPUESTA_METODOLOGIA.md` o `README.md` — no lo he visto
  escrito en ninguno de los dos; revisar antes de dar el punto 8 por cerrado
  del todo.
- Que no exista ya un test simetrico sobre `docs/` raiz (fuera del plugin)
  que restrinja su contenido — solo confirme el test sobre ficheros del
  plugin.
