---
id: TASK-148c
titulo: "utilidades de core (parte c de TASK-148)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: fix/task-148-regla-4d-catalogos-config-y-utilidades-e
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-23
actualizado: 2026-11-23
dependencias: [TASK-148b]
---
## Objetivo

Parte c del troceo de TASK-148 (Regla 4D: catalogos, config y utilidades en core), partes TASK-148a, TASK-148b, TASK-148c, TASK-148d en la rama fix/task-148-regla-4d-catalogos-config-y-utilidades-e.

Opciones globales de git, fechas, solape de etiquetas, ANSI, credenciales, URL de origin, esObjeto, recortar y fichero de test con una implementacion (CORE1-09, CORE1-11 a CORE1-13, CORE2-09, CORE2-10, CORE2-15 a CORE2-17).

## Criterios de aceptacion
- [ ] Rutas relativas, fechas, solape de etiquetas, ANSI, redaccion de credenciales, URL de origin, esObjeto y recortar tienen una sola implementacion cada uno

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T22:02:47Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T22:02:56Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T22:03:00Z | start | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — d9fa174: buscadas las copias de cada utilidad y reutilizadas diaDe, ocultarCredenciales, partirAutoridad y esRutaDeTest; nuevos subcomandoGit, solapeDeEtiquetas y utilidades-texto.ts (sin dependencias, lo carga la via rapida de estado); 1 fichero de test nuevo (6 tests) y 2 expectativas actualizadas (secretos: usuario oculto; estado: modulo nuevo); 5 mutaciones en rojo
- code-quality-reviewer — d9fa174
