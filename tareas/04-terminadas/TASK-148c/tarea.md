---
id: TASK-148c
titulo: "utilidades de core (parte c de TASK-148)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-148-regla-4d-catalogos-config-y-utilidades-e
asignado_a: claude
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 16578042
tokens_revision: 5382868
creado: 2026-11-23
actualizado: 2026-11-23
dependencias: [TASK-148b]
---
## Objetivo

Parte c del troceo de TASK-148 (Regla 4D: catalogos, config y utilidades en core), partes TASK-148a, TASK-148b, TASK-148c, TASK-148d en la rama fix/task-148-regla-4d-catalogos-config-y-utilidades-e.

Opciones globales de git, fechas, solape de etiquetas, ANSI, credenciales, URL de origin, esObjeto, recortar y fichero de test con una implementacion (CORE1-09, CORE1-11 a CORE1-13, CORE2-09, CORE2-10, CORE2-15 a CORE2-17).

## Criterios de aceptacion
- [x] Rutas relativas, fechas, solape de etiquetas, ANSI, redaccion de credenciales, URL de origin, esObjeto y recortar tienen una sola implementacion cada uno

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T22:02:47Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T22:02:56Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T22:03:00Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T22:24:20Z | review | automatico | persona | 0.16.1 |
| 2026-11-23T22:43:49Z | review | automatico | persona | 0.16.1 |
| 2026-11-23T22:59:37Z | finish | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — d9fa174: buscadas las copias de cada utilidad y reutilizadas diaDe, ocultarCredenciales, partirAutoridad y esRutaDeTest; nuevos subcomandoGit, solapeDeEtiquetas y utilidades-texto.ts (sin dependencias, lo carga la via rapida de estado); 1 fichero de test nuevo (6 tests) y 2 expectativas actualizadas (secretos: usuario oculto; estado: modulo nuevo); 5 mutaciones en rojo
- code-quality-reviewer — d9fa174
- 4D — d3bdc7a: correccion de la ronda 1 sin helper nuevo (recortar y esObjeto comunes en doctor-deploy-tareas, secretos y entrada-pretooluse); 1 test nuevo (seleccion con Rust) y el puerto 0; 1 mutacion en rojo
- code-quality-reviewer — d3bdc7a

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T22:24:20Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 48 | 34271 | 16522830 | 20893 | 11 | 16578042 | - | - |
| 2026-11-23T22:40:21Z | revision | agente:a9acb9ad8a72a1695 | 40 | 130339 | 2118267 | 12712 | 1 | 2261358 | 1 | - |
| 2026-11-23T22:56:47Z | revision | agente:ae8bc663142a8f0a6 | 56 | 127092 | 2974298 | 20064 | 6 | 3121510 | 2 | - |

## Resultado

- Implementado: subcomandoGit (opciones globales de git una vez en comando-merge); diaDe valida las fechas del catalogo de deploy (2026-02-30 se rechaza); solapeDeEtiquetas sin mayusculas para complejidad y seleccion de skill; core/utilidades-texto.ts (esObjeto, recortar, quitarAnsi, sin dependencias) sustituye copias en coste-transcripcion, doctor-deploy-auditoria, doctor-deploy-tareas, hooks-subagente, json-claude, progreso, informe-verificacion, crecimiento-suite, secretos y entrada-pretooluse; hostDeRemoto lee la autoridad con partirAutoridad (puerto 1 a 65535, como partesDeOrigin); las URLs con credenciales se redactan con ocultarCredenciales (oculta tambien el usuario); CARPETAS_TEST y MARCAS_TEST dan esRutaDeTest y PATRONES_TEST. La ruta relativa (parte del criterio) quedo en TASK-148b.
- Cambios visibles: una etiqueta de tarea con mayusculas (Rust) casa ahora con el catalogo; un puerto 0 o mayor que 65535 en origin da sin-host; los resumenes de doctor-deploy se recortan con «…».
- Revision: 2 rondas. Ronda 1: IMP-1 (seleccion sin mayusculas sin test), MEN-1 (recortar en doctor-deploy-tareas), MEN-2 (dos guardas de objeto plano), MEN-3 (puerto 0 sin test), corregidos. Ronda 2: aprobada.
- No corregido: nada.

## Verificacion parcial

- 2026-11-23T22:56:48Z: todo el codigo que cambia la tarea (39 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 60 min
- Real (de la rama abierta al cierre con merge, sin pausas): 57 min
- Cierre (finish): 169 s, de 2026-11-23T22:56:48Z a 2026-11-23T22:59:37Z
