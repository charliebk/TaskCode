---
id: TASK-018
titulo: "Enrutado de revisor por diff real, fragmentado por dominio"
tipo: feature
sprint: 3
etiquetas: []
complejidad: alta
modelo_sugerido: opus
estado: en-curso
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
- [ ] Clasifica el diff real de la rama por dominio en vez de por el tipo declarado de la tarea.
- [ ] Fragmenta la revisión en un agente por dominio hasta el umbral (`umbral_dominios: 3`, inclusive: con 3 dominios fragmenta en 3, con 4 o más cae al genérico), y por encima de ese umbral cae a un único revisor genérico.
- [ ] Cada revisor recibe solo el subconjunto del diff de su dominio.
- [ ] Ficheros que no casan ningún patrón de dominio, en un diff que sí tiene entre 1 y 3 dominios detectados, los cubre también el revisor genérico — no quedan sin revisar.
- [ ] Extiende `src/commands/finish.ts` (`INFORME_REVISION_RE`/`ultimoInforme`) y `src/fs/rondas.ts` (`RONDA_FILE_RE`/`siguienteRonda`) para reconocer los N informes de dominio de una ronda fragmentada; `finish` exige que **todos** aprueben antes de cerrar. Sin esto, una tarea con revisión fragmentada queda atascada en `03-en-revision` para siempre.
- [ ] `ReviewCommandResult` pasa a exponer una lista de pares petición/informe (uno por dominio) en vez de un único par singular; `review.test.ts` se actualiza a la nueva forma.
- [ ] Tests con diffs sintéticos que cubren un dominio, varios por debajo del umbral, exactamente en el umbral y varios por encima.
