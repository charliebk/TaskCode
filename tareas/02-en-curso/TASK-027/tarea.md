---
id: TASK-027
titulo: "Subcarpetas planificacion y revision en cada carpeta de tarea"
tipo: feature
sprint: 2
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-027-subcarpetas-planificacion-y-revision-en
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-06
actualizado: 2026-09-06
dependencias: []
---
## Objetivo

Item C3 del checklist de terminacion. La seccion 2 de la metodologia dice
que cada carpeta de tarea es `tarea.md` + `planificacion/` + `revision/`.
Hoy `revision/` la crea `taskctl review`, pero `planificacion/` no existe:
`taskctl plan` deja `plan-final.md` suelto en la raiz de la carpeta.

Cerrar ese hueco moviendo `plan-final.md` a `planificacion/`, sin romper
las tareas que ya lo tienen suelto, y decidir explicitamente que se hace
con las tareas ya cerradas en `04-terminadas/`.

## Criterios de aceptacion
- [ ] `taskctl plan` crea `planificacion/` en la carpeta de la tarea y
      escribe ahi el scaffold de `plan-final.md`.
- [ ] `taskctl approve` acepta el plan en la ubicacion nueva y **sigue
      aceptando** el legado suelto en la raiz: una tarea planificada con la
      version anterior del CLI no se queda sin poder aprobarse.
- [ ] Una re-planificacion sobre una tarea con el `plan-final.md` legado en
      la raiz lo **migra** a `planificacion/` conservando su contenido (no
      lo pisa con el scaffold) y lo dice en la salida.
- [ ] Si existieran los dos a la vez (legado + nuevo), `plan` aborta sin
      tocar nada en vez de elegir por su cuenta cual gana.
- [ ] Las dos subcarpetas viajan con la carpeta de la tarea en cada cambio
      de estado (`moveTareaFile` renombra el directorio entero) —
      verificado con un test, no supuesto.
- [ ] Decision explicita y documentada sobre las 6 tareas ya cerradas en
      `04-terminadas/` con el fichero suelto.
- [ ] Tests reales nuevos (repos Git temporales) y suite verde.
- [ ] Smoke test manual en un clon.
- [ ] Revision por pares con agente independiente, hallazgos aplicados.
