---
id: TASK-148b
titulo: "validacion de config (parte b de TASK-148)"
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
tokens_implementacion: 15048864
tokens_revision: 7208607
creado: 2026-11-23
actualizado: 2026-11-23
dependencias: [TASK-148a]
---
## Objetivo

Parte b del troceo de TASK-148 (Regla 4D: catalogos, config y utilidades en core), partes TASK-148a, TASK-148b, TASK-148c, TASK-148d en la rama fix/task-148-regla-4d-catalogos-config-y-utilidades-e.

masParecida, validadores de entero y de enumerado, CLAVES_CONFIG atada al switch, una ruta relativa (CORE1-06, CORE1-07, CORE1-08, CORE1-10).

## Criterios de aceptacion
- [x] config usa masParecida para sugerir, un validador de entero en rango y otro de lista de enumerado; un test falla si CLAVES_CONFIG y el switch de claves no coinciden; SKILL_KEY_RE se deriva de los campos

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T13:40:55Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T13:40:57Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T13:40:58Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T13:58:07Z | review | automatico | persona | 0.16.1 |
| 2026-11-23T14:44:16Z | review | automatico | persona | 0.16.1 |
| 2026-11-23T16:41:42Z | finish | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — d542a84: buscados masParecida, describirValor y las tres reglas de ruta; nuevos sugerenciaDeValor, validarEnteroEnRango, elementosDeEnumerado y ruta-relativa.ts (la regla comun no existia; se queda la de config, que cuatro tests fijan); 1 fichero de test nuevo (4 tests); 6 mutaciones en rojo
- code-quality-reviewer — d542a84
- 4D — 2ee1779: correccion de la ronda 1 sin helper nuevo (normalizarRutaRelativa en config); 2 tests ampliados (veredicto normalizado contra repo real, dedupe y patron con ..); 3 mutaciones en rojo
- code-quality-reviewer — 2ee1779

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T13:58:07Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 50 | 38632 | 14987425 | 22757 | 15 | 15048864 | - | - |
| 2026-11-23T14:21:46Z | revision | agente:ad43513e1f20884cc | 72 | 160574 | 4625310 | 20904 | 25 | 4806860 | 1 | - |
| 2026-11-23T15:04:34Z | revision | agente:a4057fa47e8d3e3f6 | 42 | 136799 | 2241851 | 23055 | 3 | 2401747 | 2 | - |

## Resultado

- Implementado: en config, sugerenciaDeValor (masParecida) sustituye tres Levenshtein propios; validarEnteroEnRango y elementosDeEnumerado sustituyen cinco y dos copias; un test ata CLAVES_CONFIG al switch de claves. `core/ruta-relativa.ts` es la unica regla de ruta relativa (la de config: normaliza y rechaza solo lo que sale del repo, que cuatro tests existentes fijaban) para config, doctor-deploy-veredictos y evidencia-veredicto (que cita la forma normalizada); los patrones glob de exclusion rechazan cualquier `..`. El criterio de SKILL_KEY_RE derivada se cumplio en TASK-148a.
- Cambios visibles: con `cierre_por_defecto: mr` ya no se sugiere «merge»; los veredictos de doctor-deploy aceptan `a/../b` (citando `b`); `a/../b` sigue valiendo en config (normalizado).
- Revision: 2 rondas. Ronda 1: IMP-1 (la normalizacion de comprobadorEnCommit sin test), MEN-1 (dedupe sin test), MEN-2 (cuatro copias de la normalizacion), MEN-3 (textos «sin ..»), MEN-5 (patron `a/../**` aceptado), corregidos; MEN-4 aceptado (dejan de sugerirse entradas de tres letras o menos como git o lab). Ronda 2: aprobada.
- No corregido (notas MENOR de la ronda 2): `.` y `a/..` pasan motivoRutaInvalida y los rechaza despues comprobadorEnCommit con un mensaje de «no versionado» (ya era asi); la evidencia se guarda con la ruta tal cual; el nombre de un test de doctor-deploy-resultado dice «con ..»; el mensaje del patron dice «sale del repo» para `a/../**`.

## Duracion

- Estimada: 50 min
- Real (de la rama abierta al cierre con merge, sin pausas): 181 min
- Paso de la hora: 181 min reales frente a 50 estimados
- Cierre (finish): 1559 s, de 2026-11-23T16:15:43Z a 2026-11-23T16:41:42Z

## Codigo integrado sin revisar

- 2026-11-23T16:15:43Z: taskctl finish --aceptar-sin-revisar; integrado sin revisar ni verificacion ligera el codigo de a4fca66..fix/task-148-regla-4d-catalogos-config-y-utilidades-e (ronda 2): .taskcode/config.yml
