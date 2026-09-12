---
id: TASK-018
titulo: "Enrutado de revisor por diff real, fragmentado por dominio"
tipo: feature
sprint: 3
etiquetas: []
complejidad: alta
modelo_sugerido: opus
estado: en-revision
plan_aprobado: true
rama: feature/task-018-enrutado-de-revisor-por-diff-real-fragme
asignado_a: charlie.bk@gmail.com
agente_revisor: typescript-reviewer
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-12
dependencias: [TASK-013]
---
## Objetivo

Hoy `taskctl review` siempre invoca al mismo agente revisor declarado en
`tarea.md` (`agente_revisor`), sin mirar qué toca de verdad el diff de la
rama. TASK-032 (D6/D7) ya dejó redactadas cuatro skills revisoras por dominio
(java-spring, angular-vue, csharp-autocad-ifc, code-quality) con sus
`patrones_archivo` declarados y probados en las dos direcciones
(`path.matchesGlob`), y `code-quality-reviewer` ya se marca `fallback: true`
con el umbral de dominios fijado en 3 (decisión #16). Falta la pieza que los
conecta con el ciclo real: que `taskctl review` clasifique el diff real de la
rama por esos patrones, lance un revisor por cada dominio detectado hasta el
umbral, y caiga al revisor genérico por encima de él o cuando ningún patrón
case.

## Criterios de aceptacion
- [x] Clasifica el diff real de la rama por dominio en vez de por el tipo declarado de la tarea.
- [x] Fragmenta la revisión en un agente por dominio hasta el umbral (`umbral_dominios: 3`, inclusive: con 3 dominios fragmenta en 3, con 4 o más cae al genérico), y por encima de ese umbral cae a un único revisor genérico.
- [x] Cada revisor recibe solo el subconjunto del diff de su dominio.
- [x] Ficheros que no casan ningún patrón de dominio, en un diff que sí tiene entre 1 y 3 dominios detectados, los cubre también el revisor genérico — no quedan sin revisar.
- [x] Extiende `src/commands/finish.ts` (`INFORME_REVISION_RE`/`ultimoInforme`) y `src/fs/rondas.ts` (`RONDA_FILE_RE`/`siguienteRonda`) para reconocer los N informes de dominio de una ronda fragmentada; `finish` exige que **todos** aprueben antes de cerrar. Sin esto, una tarea con revisión fragmentada queda atascada en `03-en-revision` para siempre.
- [x] `ReviewCommandResult` pasa a exponer una lista de pares petición/informe (uno por dominio) en vez de un único par singular; `review.test.ts` se actualiza a la nueva forma.
- [x] Tests con diffs sintéticos que cubren un dominio, varios por debajo del umbral, exactamente en el umbral y varios por encima.

## Resultado

`cargarCatalogoRevisores` (`src/core/revisores.ts`) promueve a producción el
lector de `patrones_archivo`/`fallback`/`umbral_dominios` que antes solo
vivía como helper de `test/skills/revisores.test.ts`, releyendo `skills/*`
en cada ejecución (sin cache: ya divergió dos veces, ver HALLAZGOS.md). La
función pura `clasificarPorDominio` decide el reparto: 0 dominios o más del
umbral (3, inclusive) cae a un único grupo genérico con el diff completo; 1
a 3 dominios fragmenta un grupo por dominio, más un grupo genérico si sobran
ficheros sin dominio claro — nunca se queda nadie sin revisor.
`taskctl review` clasifica el diff real (`diffNameOnly`) y escribe un par
petición/informe por grupo, con sufijo de dominio en el nombre solo cuando
fragmenta (precedente `informe-codex-N.md`), para no romper ninguna ronda ya
existente. `finish.ts`/`rondas.ts` se extendieron para reconocer N informes
por ronda y exigir que todos aprueben — el riesgo que el propio brainstorm
señaló como el más grave (una tarea fragmentada que ya no puede cerrarse).

Cuatro decisiones de Carlos (2026-09-12, vía remote control) resueltas antes
de aprobar el plan: alcance de `finish.ts`/`rondas.ts` dentro de esta tarea,
el genérico también cubre ficheros sin dominio bajo el umbral, umbral
inclusive (3 fragmenta, 4+ genérico), y se acepta romper el contrato
singular de `ReviewCommandResult` (pasa a `informes: RevisionGrupo[]`).

**Revisión por pares, 2 rondas, independientes entre sí y del
implementador**:

- **Ronda 1: cambios-solicitados** (2 IMPORTANTE, 2 MENOR). Los dos
  IMPORTANTE eran huecos de cobertura, no bugs en producción — el revisor
  verificó con el código real (CLI de punta a punta, catálogo real) que
  ambos comportamientos ya eran correctos, pero ningún test se ponía rojo
  si se rompían en un refactor futuro: la numeración de ronda tras una
  ronda fragmentada (`RONDA_FILE_RE`/`INFORME_REVISION_RE`), y el mensaje
  de `taskctl review` en `cli.ts` que lista las N peticiones (0% de
  cobertura). Corregidos con un test nuevo cada uno, verificados con
  mutación propia (revertir la protección → el test nuevo se pone rojo;
  restaurar → verde). MENOR-1 (mitigación de renombrado entre ecosistemas
  descrita en el plan, no implementada) se documentó como evaluada y
  descartada — clasificar por la ruta final del rename no pierde
  información y es más simple. MENOR-2 (`peticionTemplate` con 10
  parámetros posicionales) se deja sin corregir: mantenibilidad, no
  comportamiento.
- **Ronda 2: aprobada**, por un tercer agente independiente del
  implementador y de los dos revisores anteriores. Confirmó por
  reproducción propia (no por lectura) que los dos IMPORTANTE quedaron
  protegidos: revirtió las correcciones en un clon aislado y confirmó que
  los tests nuevos se ponen rojos con la contraprueba exacta que pedía la
  ronda 1. Sin hallazgos nuevos.

**Smoke test manual de punta a punta** (esta sesión, sobre `taskctl` real
en un repo temporal, además de lo ya verificado por los dos revisores):
`new → plan → approve → start` con un diff de dos dominios (Java +
Angular), `review` fragmenta en 3 peticiones reales
(`java-spring-reviewer`, `angular-vue-reviewer`, `code-quality-reviewer`
para el resto), y `finish` cierra con éxito en cuanto los tres informes
aprueban.

855 tests (852 verdes; los 3 rojos son los conocidos de Windows nativo:
symlink EPERM, chmod sobre directorio en NTFS, y CRLF — ninguno tocado por
esta tarea).
