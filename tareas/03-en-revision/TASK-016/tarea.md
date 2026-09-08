---
id: TASK-016
titulo: "Brainstorm paralelo por roles con agente unificador"
tipo: feature
sprint: 3
etiquetas: []
complejidad: alta
modelo_sugerido: opus
estado: en-revision
plan_aprobado: true
rama: feature/task-016-brainstorm-paralelo-por-roles-con-agente
asignado_a: charlie.bk@gmail.com
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-08
dependencias: [TASK-010]
---
## Objetivo

Convertir `taskctl plan` de un scaffold de un solo fichero en el orquestador
determinista de la fase de diseño que describe la sección 6 de la metodología:
resolver sin LLM cuántos agentes de brainstorm entran y con qué rol, escribir
una petición por rol con el contexto ACOTADO A ESE ROL (sección 16.2), y la
petición del agente unificador que consolida las salidas en `plan-final.md`
señalando los desacuerdos en vez de promediarlos.

El CLI sigue sin invocar ningún modelo: hace lo determinista y deja las
peticiones escritas para que las dispare quien orquesta — exactamente el mismo
reparto que TASK-013 estableció en `taskctl review`. El número de agentes sale
del lookup de `scripts/heuristica-complejidad.yml` (D7), que hasta hoy no lee
nadie desde `src/`, y los roles, de los cuatro `agents/` que ese mismo item
redactó.

## Criterios de aceptacion
- [x] Lanza N agentes en paralelo, uno por rol (arquitectura, riesgos, testing, dominio), con el contexto acotado por rol de la sección 16.2 en vez de pasarles el repo entero.
- [x] Un agente unificador consolida las salidas en un único `plan-final.md`, señalando los desacuerdos entre roles en vez de promediarlos.
- [x] Sustituye al `plan` mínimo de TASK-010 sin romper su interfaz de línea de comandos ni la máquina de estados.
- [x] El número de agentes y la obligatoriedad del checkpoint humano salen de los puntos 1 y 2 de la sección 14.
- [x] Tests que no dependen de llamadas reales a agentes para el camino determinista (validación de estado, escritura de ficheros, límite de roles).
