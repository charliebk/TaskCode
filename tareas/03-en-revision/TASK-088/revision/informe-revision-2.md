# Informe de revision — TASK-088 (ronda 2)

- Commit revisado: 44144f1dad236585bb13e0a6eb01b8a1e520475d
- Revisor: general-purpose / sonnet / code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-088 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | src/fs/deteccion-tests.ts:36-37 | implementacion |
| MEN-2 | MENOR | corregido | test/commands/doctor.test.ts (CASOS_TASK_088) | implementacion |
| MEN-3 | MENOR | corregido | test/fs/deteccion-tests.test.ts (nuevo) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin hallazgos nuevos. Propuesta del revisor: aprobada.

## Reproduccion

Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-088-r2` en 44144f1 (borrado al terminar); `npm install` y `npm run build` limpios. Ronda incremental: no se corrio la suite completa (la implementacion la paso con solo los tres rojos conocidos de Windows).

- `deteccion-tests` + `comando-tests`: 11 pasan, 0 fallan, 1 saltado (enlaces: `t.skip` por EPERM en Windows nativo, previsto).
- `doctor.test.js` filtrado a TASK-088: 17 pasan, 0 fallan.
- MEN-1 extremo a extremo: repo con `package.json` con BOM → `[AVISO] verificacion: ... (package.json con script "test")` con `comando_verificacion: "npm test"`; con el `dist` mutado sin el strip del BOM vuelve a `omitida` (el fallo de la ronda 1).

### Mutantes (sobre `dist`, restaurado tras cada uno)

| Mutante | Resultado |
|---|---|
| Quitar el strip del BOM | muerto (`Node con BOM`) |
| Motivos del mensaje sustituidos por `(x)` | muerto (13 casos) |
| `size > MAX` a `size >= MAX` | muerto («justo en el tope si se lee») |
| Tope x2 | muerto («mayor que el tope no se lee») |
| Sin comprobacion del tope (`if (false)`) | muerto |
| Contar directorios como ficheros | muerto |

### Observaciones, sin hallazgo

- El BOM no tiene test unitario propio en `deteccion-tests.test.ts`; lo cubren `Node con BOM` y el caso Python de `doctor.test.ts`, y el mutante muere.
- La rama de enlace valido frente a roto solo se prueba donde se pueden crear enlaces (CI de Linux); aqui no se pudo verificar por EPERM.
- El comentario sobre el BOM es cierto y el `dist` coincide con el `src`.
