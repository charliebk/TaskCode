---
id: TASK-093
titulo: "finish reutiliza la completa en verde del mismo árbol, con entradas ignoradas declaradas"
tipo: feature
sprint: 0
etiquetas: [verificacion, finish]
complejidad: media
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: feature/task-093-finish-reutiliza-la-completa-en-verde-de
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

Que taskctl finish no repita la verificación completa cuando ya hay un verde del mismo árbol exacto. Hoy la corre siempre porque el memo (huella de git status) no ve los ficheros ignorados, y un proyecto puede depender de ellos (datos de prueba fuera de Git, node_modules). Medido en ToolsaWeb TASK-295 el 2026-11-10: completa de 27 min en verde a las 12:01 y otra idéntica lanzada por finish a las 12:03 sobre el mismo commit. Propuesta: una clave opcional (p. ej. entradas_ignoradas_verificacion: [exampleData/, web/node_modules/.package-lock.json]) cuyo listado (ruta, tamaño, mtime) entra en la huella del memo; con ella declarada, finish y el guardián reutilizan un verde de huella idéntica y lo dicen en la salida; sin ella, todo sigue como hoy.

## Criterios de aceptacion
- [ ] Con la clave declarada y un verde guardado de huella idéntica, finish no ejecuta comando_verificacion y lo dice en su salida; un test de integración en un repo temporal lo comprueba
- [ ] Cambiar un fichero de una ruta ignorada declarada, un fichero versionado, el comando o el timeout invalida el memo y finish vuelve a verificar (un test por caso)
- [ ] Sin la clave, finish ejecuta siempre la completa como en 0.13 (test de regresión)
- [ ] Una ruta declarada inexistente, absoluta o fuera del repo aborta la config con un error que nombra la clave y la línea
- [ ] README, skills/task-workflow y CHANGELOG describen la clave, su motivo y el riesgo de no declarar una entrada ignorada
- [ ] La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningún test
