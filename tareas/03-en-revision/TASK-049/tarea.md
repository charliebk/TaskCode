---
id: TASK-049
titulo: "F6-T4 Metadatos del plugin y modelo de los agentes"
tipo: feature
sprint: 7
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-049-f6-t4-metadatos-del-plugin-y-modelo-de-l
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

Para quien instala el plugin desde fuera (como OpenGisViewer) faltan
metadatos y no hay instrucciones de actualizacion (auditoria E4, E5). Se
completa `plugin.json` (`displayName`, `repository`, `license`, `keywords`)
hasta que `claude plugin validate` salga limpio, el README explica como
instalar y actualizar, y se decide, con el ID de modelo comprobado en la
documentacion actual, si los agentes de brainstorm llevan `model:` propio.

## Criterios de aceptacion
- [x] `plugin.json` con `displayName`, `repository`, `license` y `keywords`; `claude plugin validate` limpio
- [x] README con instalacion y actualizacion: `claude plugin marketplace update`, `claude plugin update`, reiniciar
- [x] Decision documentada sobre `model:` en los agentes de brainstorm, con el ID de modelo comprobado en la documentacion actual

## Resultado

**Implementado.**
- `plugin.json`: `displayName: "TaskCode"`, `repository`, `license: "MIT"` y
  `keywords`, con los mismos valores que la entrada del marketplace.
  `package.json` tambien declara `license: "MIT"`. Licencia MIT decidida por
  Carlos el 2026-10-05; `LICENSE` en la raiz y en la carpeta del plugin (lo
  que se instala). Titular: Carlos Gallardo Rodriguez, el `owner` del
  marketplace (el plan decia «charlie.bk»; divergencia anotada).
- `claude plugin validate` del plugin y del marketplace: limpios, tambien con
  `--strict`.
- README raiz: instalacion tambien por CLI y subseccion «Actualizar»
  (`claude plugin marketplace update taskcode-marketplace`, `claude plugin
  update taskcode-plugin@taskcode-marketplace`, reiniciar o
  `/reload-plugins`). Comandos comprobados con `--help` (Claude Code 2.1.288).
- **Decision sobre `model:`**: los agentes de brainstorm no lo declaran. Doc
  comprobada en code.claude.com/docs/en/sub-agents (2026-10-05): admite
  `sonnet`, `opus`, `haiku`, `fable`, un ID completo (`claude-opus-5-5`) o
  `inherit`; sin el campo manda el `model` de la invocacion, despues
  `CLAUDE_CODE_SUBAGENT_MODEL`, despues la conversacion. Un alias fijo iria
  contra `modelo_sugerido` por tarea; `inherit` anularia la variable de
  entorno de quien instala. Documentado en el README del plugin, con los
  matices de version y de `_FORCE`.
- `test/empaquetado/metadatos.test.ts`: campos y tipos, LICENSE en el plugin
  y en la raiz (identicos), alineacion con el marketplace (`displayName`,
  `repository`, `keywords`, `version`) y ningun agente con `model:`.

**Revision (ronda 1, `aprobada con correcciones`).** Sin CRITICO ni
IMPORTANTE.
- MENOR-1 (licencia mal colocada en el README): **corregido**.
- MENOR-2 (orden de resolucion desde 2.1.251 y `_FORCE`): **corregido**,
  comprobado contra la doc.
- MENOR-3 (la LICENSE de la raiz no se exigia): **corregido** (mutacion:
  borrarla → test 2 rojo).
- MENOR-4 (titular del copyright distinto del plan): **aceptado**.
- Tras las correcciones: `metadatos` 4/4 y `distribucion` 9/9. Solo MENOR
  corregidos: sin ronda 2.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-05 | plan | manual | persona |
| 2026-10-05 | approve | manual | persona |
| 2026-10-05 | start | manual | persona |
| 2026-10-05 | review | manual | persona |
