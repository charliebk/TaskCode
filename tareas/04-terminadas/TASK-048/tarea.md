---
id: TASK-048
titulo: "F6-T3 Skill de flujo mas ligera"
tipo: feature
sprint: 7
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-048-f6-t3-skill-de-flujo-mas-ligera
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-05
dependencias: []
---
## Objetivo

La skill `task-workflow` pesa unos 25 KB y se carga entera cada vez que se
invoca, y las descripciones de las skills se cargan en todas las sesiones
(auditoria E1, E2, E3). Se adelgaza `SKILL.md` moviendo sincronizacion,
post-cierre y prerrequisitos a ficheros de referencia que se leen bajo
demanda, se acortan las descripciones sin perder sus disparadores, y el
contenido generico que repiten las 4 skills revisoras pasa a un solo sitio.

## Criterios de aceptacion
- [x] `task-workflow/SKILL.md` por debajo de 15 KB; sincronizacion, post-cierre y prerrequisitos en ficheros de referencia bajo demanda
- [x] Descripciones de las 5 skills por debajo de 300 caracteres cada una, sin perder los disparadores reales
- [x] El contenido generico repetido en las 4 revisoras vive en un solo sitio

## Resultado

**Implementado** (por un agente implementador; revisado por otro).
- `task-workflow/SKILL.md`: 22.016 → 12.839 bytes (13.088 con CRLF). Salen a
  ficheros hermanos que se leen bajo demanda, cada uno con una linea en el
  SKILL.md que dice cuando leerlo: `prerrequisitos.md` (1,9 KB), `cierre.md`
  (post-cierre y «Al cerrar», 3 KB), `trampas.md` (2,8 KB) y `revision.md`
  (9,3 KB).
- `revision.md` es tambien el sitio unico de lo generico de las 4 revisoras
  (plantilla del informe, linea del veredicto, rondas, «sin hallazgos», lo
  que un revisor no hace). Cada revisora lo enlaza y conserva su dominio.
  Bytes: angular 21.110 → 17.539, code-quality 17.837 → 13.807, csharp
  18.666 → 15.445, java 14.309 → 10.893.
- **Tabla del veredicto corregida**: las 4 revisoras decian que
  `**aprobada**` no aprueba, falso desde TASK-036 (el enfasis se recorta).
  Queda una sola tabla, y el test 10f pasa cada fila por `veredictoAprobado`.
- Descriptions: task-workflow 427 → 294, angular 513 → 291, java 374 → 290,
  code-quality 407 → 288, csharp 343 → 269.
- Tests nuevos: 18 (tamano), 19 (<= 300), 19b (disparadores minimos por
  skill), 20 y 20b (enlaces y referencias huerfanas), 21 (marcas internas en
  todo task-workflow), 10d-10g (enlace a revision.md, lo comun solo en
  revision.md, tabla contra el codigo, contraprueba del lector de la tabla).
  Mutaciones: 13 del implementador y 7 del revisor, todas en rojo.

**Desviaciones documentadas.** El ejemplo `TASK-001` del SKILL.md pasa a
`TASK-NNN` (para mantener la marca `task-0` en el test 21). La lista de lo
que un revisor no hace es la union de las cuatro: amplia a angular y java
reglas que antes solo tenian las otras. Las variantes casi iguales se
fusionaron (p. ej. «aprobada con menores documentados» = «aprobada con
correcciones menores»).

**Revision (ronda 1, `aprobada`).** Sin CRITICO ni IMPORTANTE.
- MENOR-1 («no commitea» frente a `taskctl veredicto`): **corregido**. El
  revisor no commitea codigo; el unico commit que le corresponde es el de su
  veredicto.
- MENOR-2 (borrar secciones enteras de revision.md no ponia nada rojo):
  **corregido**: una frase de la puerta, la clasificacion y las rondas, y la
  fila `**aprobada**`, en `SOLO_EN_REVISION` (mutacion: borrar «Rondas» → 10e
  rojo).
- MENOR-3 (angular perdia «hasta Angular 19»): **corregido** (291
  caracteres).
- MENOR-4 (el 19 solo media longitud): **corregido** con el 19b (mutacion:
  quitar `pom.xml` de java → rojo).
- MENOR-5 (rojo intermitente de tiempos en `origin-deteccion`): **fuera de
  alcance**, no lo toca esta tarea; aislado pasa.
- Tras las correcciones: tests de skills 60/60, agents + empaquetado 83/83,
  `claude plugin validate` limpio. Solo MENOR corregidos: sin ronda 2.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-05 | plan | manual | persona |
| 2026-10-05 | approve | manual | persona |
| 2026-10-05 | start | manual | persona |
| 2026-10-05 | review | manual | persona |
| 2026-10-05 | finish | manual | persona |
