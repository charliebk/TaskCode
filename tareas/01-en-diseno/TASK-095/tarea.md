---
id: TASK-095
titulo: "Revision que converge: desde la ronda 2 solo se verifican las correcciones"
tipo: feature
sprint: 0
etiquetas: [revision, agilidad]
complejidad: alta
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-095-revision-que-converge-desde-la-ronda-2-s
asignado_a: charlie.bk@gmail.com
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

Objetivo principal: aumentar la agilidad sin perder calidad. Que la revision por pares converja en vez de reabrirse en cada ronda, conservando todos los revisores que tiene hoy. Medido el 2026-11-10 (docs/auditoria/INVENTARIO-AGILIDAD-2026-11-10.md): en ToolsaWeb las rondas medias pasan de 2,3 (0.8) a 3,8 (0.12), el tramo revision-cierre de 56 a 97 min y los tokens de revision por ronda de 2,6 a 6,4 M; los hallazgos por ronda no bajan (11, 17, 16; 13, 19, 19, 14, 17; un ADR con 14 rondas de unos 11 cada una). La causa esta en la regla de TASK-083 (0.12): un solo IMPORTANTE de cualquier revisor hace la ronda siguiente completa desde la base con todos los revisores, que encuentran otra tanda; la acotada salto en 1 de 42 rondas en OpenDockTrading. Las rondas tardias apenas aportan calidad nueva (2 CRITICOS nuevos en unas 77 rondas 3.a o posteriores), mientras que los revisores de dominio si aportan calidad propia (63 de 88 CRITICO/IMPORTANTE en ficheros que el generico no marco): se mantienen. Esta tarea corrige la regla de alcance de TASK-083; no anade otro mecanismo encima ni retira revisores.

## Criterios de aceptacion
- [ ] Desde la ronda 2, la peticion de taskctl review lleva siempre 'Alcance: verificacion acotada' (aunque la ronda anterior tenga CRITICO o IMPORTANTE) y su diff va desde el ultimo commit revisado; tests en test/commands que lo comprueban con IMPORTANTE abierto, con CRITICO abierto y con merges entre rondas
- [ ] La peticion acotada indica al revisor que verifique cada hallazgo abierto y el diff de la correccion, y que solo abra un hallazgo nuevo si es CRITICO o lo introduce la propia correccion; test que comprueba ese texto en la peticion de la ronda 2
- [ ] En la ronda acotada, cada revisor de dominio que dejo hallazgos abiertos recibe su propia peticion para verificarlos (no los verifica el generico en su lugar); test con un diff de Rust y un IMPORTANTE de rust-wasm-reviewer abierto
- [ ] Entre una ronda y la siguiente se corrigen TODOS los hallazgos de la ronda (CRITICO, IMPORTANTE y MENOR), y el que no compense corregir (solo MENOR) se marca aceptado con su motivo o se pasa a una tarea nueva, nunca se deja para la ronda siguiente; skills/review lo manda en todos los modos y taskctl review avisa si se abre la ronda siguiente con hallazgos de la anterior aun abiertos (test). Medido: en 0.8 la ronda 2 dejaba 0 hallazgos abiertos de mediana; desde 0.11, de 3 a 5
- [ ] Tras la ronda 3 con hallazgos abiertos, taskctl siguiente devuelve accion preguntar en cualquier modo, y lo abierto se acepta documentado en Resultado o pasa a una tarea nueva; test de integracion en un repo temporal
- [ ] taskctl review --completa sigue forzando una ronda completa desde la base (test de regresion)
- [ ] El codigo de la regla antigua de alcance que deje de usarse se borra, y sus tests cambian de expectativa con el motivo escrito en Resultado; ningun test se borra sin sustituto
- [ ] skills/review, skills/task-workflow, README y CHANGELOG describen la regla nueva y el principio de coste proporcional a la correccion
- [ ] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-10T14:21:25Z | plan | automatico | persona | 0.13.0 |
