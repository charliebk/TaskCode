# Métricas — Sprint 0 (parcial)

> Generado el 2026-09-03, al cerrar la primera sesión de programación real
> del proyecto. Cubre TASK-001, TASK-002 y TASK-003 de `PLAN_SPRINTS.md`.
> TASK-004 a TASK-007 quedan pendientes para la siguiente sesión (ya creadas
> como tareas en `tareas/00-planificadas/`).

## 1. Qué se implementó

| Tarea | Alcance real entregado |
|---|---|
| TASK-001 | Scaffold completo: `.claude-plugin/plugin.json`, `bin/taskctl`, `package.json` sin dependencias de terceros en runtime, `tsconfig.json` estricto, `npm run build`/`lint`/`test`. |
| TASK-002 | `src/core/frontmatter.ts` (parser/serializador YAML-frontmatter a mano), `src/core/task.ts` (modelo + validación), `src/core/tarea-file.ts`, `src/core/state-machine.ts` (tabla completa de transiciones de la sección 8.1 de la metodología). |
| TASK-003 | `taskctl new` de punta a punta: parseo de argumentos (`src/cli/args.ts`), generación determinista de ID (`src/core/task-id.ts`), capa de I/O (`src/fs/task-store.ts`), comando (`src/commands/new.ts`), cableado en `src/cli.ts`. |

TASK-004 (`import`), TASK-005 (`board`), TASK-006 (empaquetado/instalación) y
TASK-007 (spike de scripts `.sh` en Windows) **no** se implementaron en esta
sesión — quedan en `tareas/00-planificadas/` tal cual se crearon.

## 2. Tamaño y forma del código

- Código fuente (`src/`): **1094 líneas**, 9 ficheros.
- Tests (`test/`): **985 líneas**, 8 ficheros — casi 1 línea de test por
  línea de código fuente, deliberado dado que el corazón del sistema
  (parser + máquina de estados) es exactamente donde un bug es más caro:
  se propaga a cada tarea que gestione el equipo.
- **0 dependencias de terceros en runtime** (solo `typescript` y
  `@types/node` como `devDependencies`), tal como establece el principio
  de Sprint 0 en `PLAN_SPRINTS.md`.

## 3. Tests y cobertura

```
tests 91
pass  91
fail  0
```

| Fichero | Líneas | Ramas | Funciones |
|---|---|---|---|
| `src/core/frontmatter.ts` | 97.18% | 92.47% | 100% |
| `src/core/task.ts` | 98.77% | 97.37% | 100% |
| `src/core/tarea-file.ts` | 100% | 100% | 100% |
| `src/core/state-machine.ts` | 97.66% | 96.55% | 100% |
| `src/core/task-id.ts` | 100% | 100% | 100% |
| `src/fs/task-store.ts` | 95.70% | 92.59% | 100% |
| `src/cli/args.ts` | 100% | 90.91% | 100% |
| `src/commands/new.ts` | 96.19% | 87.50% | 100% |
| **Total** | **98.69%** | **95.77%** | **100%** |

Supera el criterio de aceptación de TASK-002 (≥85% en `src/core/`) con
margen holgado en todos los ficheros, no solo en el promedio.

## 4. Revisión por pares (agente independiente)

Se lanzó un agente revisor independiente (rol `typescript-reviewer`) sobre
todo el código de esta sesión, con acceso real al código en la máquina del
usuario (no solo al diff). Resultado: **10 hallazgos concretos**, cada uno
confirmado con reproducción real (no hipotéticos), de los cuales **9 se
corrigieron en esta misma sesión** con su test de regresión correspondiente:

| # | Severidad | Hallazgo | Estado |
|---|---|---|---|
| 1 | Crítico | Un valor string que "parece" número/boolean/null (p. ej. título `"2026"`) se corrompía al releer el `tarea.md` y quedaba irreescribible | ✅ corregido — citado siempre que haría falta para preservar el tipo |
| 2 | Crítico | `readTareaFile` no validaba el ID antes de construir la ruta → path traversal (`../../../fuera`) | ✅ corregido — `assertValidTaskId` antes de tocar el filesystem |
| 3 | Importante | `approve` era "fail-open": sin contexto explícito, no exigía que existiera `plan-final.md` | ✅ corregido — ahora fail-closed por defecto |
| 4 | Importante | `writeTareaFile` creaba el directorio (`mkdir`) antes de validar el `Task` | ✅ corregido — se serializa/valida antes de tocar disco |
| 5 | Importante | Dos `taskctl new` concurrentes con el mismo ID calculado se pisaban en silencio | ✅ corregido — escritura exclusiva (`flag: 'wx'`) para `new`, con error explícito `TaskAlreadyExistsError` |
| 6 | Importante | Un elemento de lista (`etiquetas`) con una coma dentro se partía en dos al releer | ✅ corregido — split respetando comillas |
| 7 | Menor | Un título sin caracteres ASCII alfanuméricos generaba un slug vacío y una rama con guion colgante | ✅ corregido — fallback `"tarea"` |
| 8 | Menor | El slug podía terminar en guion colgante tras cortar a 40 caracteres | ✅ corregido — re-trim tras el corte |
| 9 | Menor | Un valor citado que terminara en barra invertida literal justo antes del cierre podía confundir la detección de comentario inline | **No corregido** — probabilidad muy baja para el dominio actual (títulos de tarea, no rutas Windows), queda documentado como limitación conocida en el código |
| 10 | Menor | `--titulo "--urgente"` se malinterpretaba como dos flags | ✅ corregido — soporte para `--flag=valor` |

Los 9 hallazgos corregidos añadieron **13 tests de regresión** nuevos
(pasando de 78 a 91 tests), cada uno reproduciendo el caso exacto que el
agente revisor encontró.

## 5. Hallazgo nuevo para el plan (no estaba en `PLAN_SPRINTS.md`)

El repositorio `TaskCode` en la máquina del usuario **todavía no es un
repositorio Git** (`git status` falla con "not a git repository"). Esto no
bloquea nada de Sprint 0 (que es deliberadamente Git-agnóstico), pero es
un prerrequisito real para TASK-007, TASK-008 y TASK-009 de Sprint 1 — no
tiene sentido migrar/probar los scripts de Git-Flow ni crear ramas `develop`/
`main` sin que el repo exista como tal. Se añade como riesgo abierto en
`PLAN_SPRINTS.md`.

## 6. Qué significa esto para "poder usarlo"

Ahora mismo, desde la carpeta del proyecto, `taskctl new --titulo "..."
--tipo feature` funciona de verdad: genera un ID sin colisiones, valida
los argumentos, y escribe un `tarea.md` válido en
`tareas/00-planificadas/`. Es la primera pieza realmente utilizable del
sistema — no todavía el ciclo completo (falta Git-Flow, revisión, cierre),
pero sí el punto de entrada por el que arrancaría cualquier tarea nueva.
