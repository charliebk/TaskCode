---
id: TASK-073
titulo: "Tests held-out por tarea"
tipo: feature
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: opus
estado: en-diseno
plan_aprobado: false
rama: feature/task-073-tests-held-out-por-tarea
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-03
actualizado: 2026-11-04
dependencias: [TASK-070, TASK-072]
---
## Objetivo

Freno 7 de brakes: tests de aceptacion que la persona escribe a partir de los criterios y que el agente implementador no puede leer ni editar.

## Criterios de aceptacion
- [ ] Carpeta aceptacion/ dentro de la carpeta de la tarea, y clave comando_heldout opcional en config.yml
- [ ] taskctl finish ejecuta los held-out de la tarea (HELDOUT_DIR) y aborta si fallan, mostrando solo comando, codigo y duracion
- [ ] taskctl finish aborta si aceptacion/ tiene ficheros y no hay comando_heldout, o si su contenido en la rama no coincide con el de rama_base
- [ ] aceptacion/ queda siempre fuera del diff de peticion-revision-N.md
- [ ] La skill de flujo explica cuando escribirlos (en develop, en el diseño), que el revisor no los lee y que deben quedar fuera de comando_verificacion
- [ ] Tests: finish rojo y verde, huella, exclusion del diff, config (deny efectivo en TASK-078)

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-04T21:44:53Z | plan | automatico | persona |
