---
id: TASK-144c
titulo: "patrones de ronda, plan que cuenta y doctor-deploy (parte c de TASK-144)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 23592732
tokens_revision: 6108708
creado: 2026-11-23
actualizado: 2026-11-23
dependencias: [TASK-144b]
---
## Objetivo

Parte c del troceo de TASK-144 (Regla 4D: ciclo de vida, cadena y flags en commands), partes TASK-144a, TASK-144b, TASK-144c en la rama fix/task-144-regla-4d-ciclo-de-vida-cadena-y-flags-en.

Los patrones de fichero de ronda y de peticion de rol, y la decision de que plan cuenta, en un solo sitio (CMD2-02, CMD2-09, CMD1-10, CMD1-11).

## Criterios de aceptacion
- [x] review usa el patron de rondas.ts y plan/approve el de plan-brainstorm.ts (sin prefijos brainstorm- escritos a mano); un rol con otro id no rompe la numeracion, con test
- [x] planRedactado, duracionDelPlan, trocear y approve eligen el plan con una sola funcion; con dos planes, siguiente y approve dan la misma respuesta, con test
- [x] doctor-deploy decide el caso de --resultado dentro del repo con el dato calculado, no con el texto del aviso

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-23T05:12:05Z | plan | automatico | persona | 0.16.1 |
| 2026-11-23T05:12:07Z | approve | automatico | persona | 0.16.1 |
| 2026-11-23T05:12:08Z | start | automatico | persona | 0.16.1 |
| 2026-11-23T05:26:05Z | review | automatico | persona | 0.16.1 |
| 2026-11-23T05:45:35Z | review | automatico | persona | 0.16.1 |

## Autorrevision

- 4D — ffbd38a: helper buscado (rondas.ts, nombrePeticionRol/nombreSalidaRol, resolverPlanFinal reutilizados; patrones derivados en vez de copiados); criterios citados; 3 tests nuevos, 3 mutaciones en rojo (sin ambiguo, lista de roles sin condicionales, roles base).
- code-quality-reviewer — ffbd38a

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-23T05:26:05Z | implementacion | sesion:f01cea62-faf0-422a-95c5-8ee5895e07a8 | 54 | 33150 | 23539245 | 20283 | 12 | 23592732 | - | - |
| 2026-11-23T05:39:02Z | revision | agente:a92df58299901acfd | 62 | 138307 | 3616986 | 16378 | 1 | 3771733 | 1 | - |
| 2026-11-23T06:00:19Z | revision | agente:a26736ab6d10653a1 | 44 | 119306 | 2206158 | 11467 | 8 | 2336975 | 2 | - |
- 4D — 51e4155 (ronda 2): helper buscado (planQueCuenta reutilizado en trocear); criterios citados; 2 tests nuevos, 2 mutaciones en rojo (planRedactado con ambiguo como plan, patron de salidas solo con roles conocidos).
- code-quality-reviewer — 51e4155

## Resultado

- fs/rondas.ts: sufijo comun de los ficheros de ronda, RONDA_REVISION_RE y nombresDeRonda; review deja su copia (CMD2-02).
- core/plan-brainstorm.ts: PETICION_ROL_RE y SALIDA_ROL_RE junto a quien genera los nombres; casan con cualquier rol, tambien uno retirado, y excluyen las peticiones del unificador y de redaccion; plan y approve dejan de fijar el prefijo brainstorm- (CMD2-09).
- planQueCuenta: una sola regla de que plan cuenta en approve, planRedactado, duracionDelPlan y trocear; con dos planes no cuenta ninguno, siguiente no manda a aprobar y trocear lo dice (CMD1-10).
- doctor-deploy decide la pista del guard con resultadoDentroDelRepo, el mismo dato que el aviso (CMD1-11).
- Revision: ronda 1 cambios solicitados (IMP-1 la salida de un rol retirado dejaba de consolidarse; IMP-2 sin test de planRedactado con dos planes; 2 MENOR), corregido; ronda 2 aprobada. Aceptado: siguiente con dos planes sigue diciendo «falta redactar» (no manda a un approve que aborta; plan si aborta con el mensaje de la ambiguedad).

## Verificacion parcial

- 2026-11-23T06:00:20Z: todo el codigo que cambia la tarea (15 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`
