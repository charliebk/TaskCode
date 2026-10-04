---
id: TASK-034
titulo: "F1-T1 Excluir lo generado del diff de revision"
tipo: feature
sprint: 2
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-034-f1-t1-excluir-lo-generado-del-diff-de-re
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-04
dependencias: []
---
## Objetivo

Que la peticion de `taskctl review` deje de embeber lo que el revisor no
necesita leer: el JS compilado (`dist/`), los lockfiles y la propia carpeta
`tareas/`. Hoy son el 27 % de los bytes de todas las peticiones (auditoria
del 2026-10-03, A1) y el 78 % en el peor caso (TASK-031, 325 KB). Lo excluido
sigue visible como `git diff --stat`, con la orden exacta para pedir su diff,
y la peticion nombra la carpeta de la tarea para que los criterios y el plan
se lean del fichero en lugar del diff.

Fuera de alcance: la ronda 2 incremental (TASK-040) y el contenido de las
instrucciones al revisor (TASK-035).

## Criterios de aceptacion
- [x] Clave opcional `excluir_de_revision` en `.taskcode/config.yml`, por defecto `[**/dist/**, *.lock, *-lock.*, tareas/**]`
- [x] La peticion incluye `git diff --stat` de lo excluido y la orden para pedir su diff
- [x] Regenerar la peticion de TASK-031 sobre su rama baja de 325 KB a menos de 100 KB (medido)
- [x] Test contra un repo real: un cambio en `dist/` no aparece en el diff embebido y si en el `--stat`

## Resultado

**Implementado.** Clave `excluir_de_revision` en `.taskcode/config.yml`
(patrones `git :(glob)`; por defecto `**/dist/**`, `**/*.lock`,
`**/*-lock.*`, `tareas/**`; `[]` no excluye nada; un patron sin `/` se ancla
con `**/`). `diffParaRevision` en `git.ts` calcula incluidos, excluidos, diff
y `--stat` solo con pathspecs: Git es la unica implementacion de los patrones.
La peticion anade `## Excluido del diff` (el `--stat` y la orden literal para
pedir su diff) y `- Carpeta de la tarea: tareas/03-en-revision/TASK-NNN`.
Solo los incluidos se clasifican por dominio (correccion del rol de
arquitectura: un `dist/App.vue` ya no fragmenta la revision).

**Medicion (criterio 3).** Peticion de TASK-031 regenerada con su rango
original (`1d746f4..4ba8bba`; el diff completo da 324.614 B frente a los
326.110 B de la peticion original, que anade la cabecera): con la exclusion,
diff embebido 68.346 B + `--stat` 2.006 B, unos **72 KB, un 78 % menos**.
29 de 38 ficheros pasan al `--stat`.

**Pruebas.** 5 tests nuevos contra repos reales
(`test/commands/review-exclusion.test.ts`). Contraprueba con 3 mutantes, los
3 en rojo: clasificar tambien los excluidos, no anclar los patrones sin `/` y
no aplicar la exclusion en Git.

**Efecto que no estaba en el plan, y es bueno.** Como `tarea.md` va en el
diff de toda rama y no casa ningun dominio, el clasificador abria siempre una
peticion al revisor generico solo para ella. Con `tareas/**` excluido, esa
peticion desaparece: **una tarea de un solo dominio lanza un revisor, no dos**.
Cinco tests de `review.test.ts` y uno de `cli/main.test.ts` afirmaban el
comportamiento anterior; se actualizaron con el motivo escrito en cada uno.

**Suite.** Pasada completa: 898 tests; solo fallaban los 3 conocidos de
Windows y los 5 de esas expectativas, ya actualizadas (32/32 en
`review`, `main` y `review-exclusion`).

**Decisiones del orquestador**, revisables: clasificar solo los incluidos, y
la base de la medicion descrita arriba.

**Revision ronda 1: aprobada** (0 criticos, 0 importantes, 6 menores; 6
mutantes, todos en rojo; suite completa 898 tests, solo los 3 rojos conocidos
de Windows). Por la politica A3, sin ronda 2. Corregidos en el cierre, con la
suite de los ficheros afectados en verde (40/40):
- MENOR-1: con todo excluido, el bloque de diff ya no dice «sin diferencias».
- MENOR-3: `--stat=200` (a 80 columnas Git abreviaba las rutas) y sin `trim()`
  que se comia la sangria de la primera linea.
- MENOR-4: la orden para pedir lo excluido usa comillas dobles, que agrupan
  tambien en `cmd.exe`.
- MENOR-5: `excluir_de_revision` documentada en la skill, incluido que definirla
  sustituye la lista por defecto. La version sube al cerrar la Fase 1.

Sin corregir, documentados: MENOR-2 (un renombre entre incluido y excluido
descuadra la cuenta de la cabecera frente al `--stat`; cosmetico) y MENOR-6
(`--name-only` sin `-z` entrecomilla rutas no ASCII y, al fragmentar por
dominio, ese fichero puede quedar sin diff; ya pasaba antes de esta tarea:
va a una tarea aparte).
