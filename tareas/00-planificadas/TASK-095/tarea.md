---
id: TASK-095
titulo: "Revision que converge: desde la ronda 2 solo se verifican las correcciones"
tipo: feature
sprint: 0
etiquetas: [revision, agilidad]
complejidad: alta
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-095-revision-que-converge-desde-la-ronda-2-s
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-10
actualizado: 2026-11-10
dependencias: []
---
## Objetivo

Que la revision por pares converja en vez de reabrirse en cada ronda. Medido el 2026-11-10 sobre 147 tareas de ToolsaWeb y OpenDockTrading: desde la 0.11 los hallazgos por ronda no bajan (11, 17, 16; 13, 19, 19, 14, 17; un ADR con 14 rondas de unos 11 hallazgos cada una), las rondas medias pasan de 2,1 a 3,8 y el tramo revision-cierre de 27 a 97 min. La causa esta en review.ts: un solo IMPORTANTE en la ronda anterior hace la siguiente completa desde la rama base con un revisor nuevo, que encuentra otra tanda; la ronda acotada de TASK-083 salto en 1 de 42 rondas. Principio: el coste de revisar tiene que crecer con el tamano de la correccion, no con el del proyecto. Esta tarea SUSTITUYE la regla actual de alcance; no anade otro mecanismo encima, y lo que quede sin uso se borra.

## Criterios de aceptacion
- [ ] Desde la ronda 2, la peticion de taskctl review lleva siempre 'Alcance: verificacion acotada' (aunque la ronda anterior tenga CRITICO o IMPORTANTE) y su diff va desde el ultimo commit revisado; tests en test/commands que lo comprueban con IMPORTANTE abierto, con CRITICO abierto y con merges entre rondas
- [ ] La peticion acotada indica al revisor que verifique cada hallazgo abierto y el diff de la correccion, y que solo abra un hallazgo nuevo si es CRITICO o lo introduce la propia correccion; test que comprueba ese texto en la peticion de la ronda 2
- [ ] Tras la ronda 3 con hallazgos abiertos, taskctl siguiente devuelve accion preguntar en cualquier modo, y lo abierto se acepta documentado en Resultado o pasa a una tarea nueva; test de integracion en un repo temporal
- [ ] taskctl review --completa sigue forzando una ronda completa desde la base (test de regresion)
- [ ] El codigo de la regla antigua de alcance que deje de usarse se borra, y sus tests cambian de expectativa con el motivo escrito en Resultado; ningun test se borra sin sustituto
- [ ] skills/review, skills/task-workflow, README y CHANGELOG describen la regla nueva y el principio de coste proporcional a la correccion
- [ ] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test
