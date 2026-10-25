# Informe de revision — TASK-064 (ronda 2)

- Commit revisado: 6a9d9d3fbb4f10802492902af7cc90be6f6dc819
- Revisor: code-quality-reviewer (agente general-purpose, modelo sonnet, independiente de la implementacion)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-064 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-8 | MENOR | abierto | src/core/informe-revision.ts:173-177 (`severidadDe`, separadores de la primera palabra) | implementacion |

Veredicto propuesto por el revisor: aprobada. Sin CRITICO ni IMPORTANTE; MEN-8 es cosmetico y no bloquea.

## Estado de los hallazgos de la ronda 1

| ID | Estado | Comprobacion |
|---|---|---|
| IMP-1 | corregido | CLI real: `informe-revision-2-java.md` con la fila `(ninguno) — sin hallazgos` ya no da hallazgo fantasma ni aviso. Mutantes (sin `(ninguno)`, sin `sin hallazgos`, sin rama de guiones, sin llamada al filtro) en rojo. |
| IMP-2 | corregido | CLI real: ronda 1 `IMP-1 IMPORTANTE plan`, ronda 2 `IMP-1 IMPORTANTE (ronda 1)` sin Origen y `MEN-1 menor quien sabe` → `imp=1, men=1, hall_origen=1/1/0/0` (ronda 1: `imp=0`, `0/1/0/1`). Regla decidida cumplida. Mutantes (solo ultima ronda para severidad u origen; gana la primera) en rojo. |
| MEN-1 | corregido | `tok_sin_desglose` lleva `*` si alguna fase es negativa (`730*`); mutante sin `*` lo detectan 2 tests. |
| MEN-2 | corregido | `tok_nuevos`/`tok_cache_lect` «—» con solo filas `manual`; expectativa `'0','0'` → `'—','—'` es el cambio de fondo esperado. Mutante sin guarda detectado. |
| MEN-3 | aceptado (documentado) | CHANGELOG y comentario de `resumirHallazgos`; repro `A-1` en `informe-revision-2.md` y `informe-revision-2-x.md` suma `imp=2`, como se documenta. |
| MEN-4 | diferido a TASK-065 | En OpenGisViewer sigue «Terminadas sin coste en alguna fase: 76 de 76» con la lista entera. |
| MEN-5 | corregido | `rondaYRevisorDeInforme` usa `INFORME_REVISION_RE` (segundo grupo = revisor); `PETICION_REVISION_RE` en `fs/rondas.ts`, importada por `metricas.ts` y `siguiente.ts`; `tsc` sin errores. |
| MEN-6 | corregido | Dos tests nuevos de `resumirCostes` (id repetido en la misma fuente; fila a medias con salida «—»). Los mutantes originales no se re-aplicaron en esta ronda (ver «No probado»); el implementador los comprobo a mano. |
| MEN-7 | aceptado | TASK-030 de OpenGisViewer sigue con avisos «(vacia)», como en la ronda 1. |

## Puerta y reproduccion

- Clon temporal en `%LOCALAPPDATA%\pruebas-claude\TaskCode\task-064-r2` (HEAD 63fd7f3). `npm install` y build correctos, `tsc` sin errores.
- Suite (`npm test` desde Git Bash): 1393 tests, 1388 pasan, 5 fallan, los conocidos de Windows (2 de «contraprueba de descubrimiento» por README_MISSING; 2 de chmod en NTFS; 1 de CRLF). Una primera ejecucion desde `cmd` dio 207 fallos porque el PATH resolvia el `bash` de WSL; se descarto y se repitio desde Git Bash.
- Mutacion sobre los arreglos (67 tests en verde sin mutar): 11 de 11 detectados (`severidadDe` sin separadores; sin rama `(ninguno)`; sin `sin hallazgos`; sin rama de guiones; sin llamada al marcador; severidad u origen solo de la ultima ronda; severidad u origen gana la primera; sin guarda null de `sumaDesglose`; sin `*` de `celdaSinDesglose`).
- Solo lectura sobre OpenGisViewer (`metricas --tokens`, exit 0): `git status --short tareas docs .taskcode` 0 lineas antes y despues. Sin aviso por la fila `(ninguno)`: TASK-121 (`crit 0, imp 1, men 2`), TASK-133 (`men 5`) y TASK-140 (`0/0/0/0`) cuentan solo hallazgos reales. Siguen los avisos legitimos de TASK-017 («nota»), TASK-026 («fuera de alcance») y TASK-030 (tabla antigua), y los 35 informes sin tabla.
- Repo original sin tocar, sin commits ni push, carpeta temporal borrada.

## Reproduccion de cada hallazgo

### MEN-8 — `severidadDe` solo corta por espacio, parentesis, coma, punto y coma y dos puntos

CLI real: `Crítico.` (punto final) e `IMPORTANTE/MENOR` salen como fuera de vocabulario y no cuentan. Funcionan `**IMPORTANTE**: algo`, `` `MENOR` ``, `_menor_ (x)` e `IMPORTANTE (no verificado)`. Coherente con la regla («primera palabra») y el aviso lo hace visible. No aparece en OpenGisViewer. Si se quiere cubrir, anadir el punto a los separadores. No bloquea.

## Notas sin hallazgo

- Alcance respetado: MEN-4 y MEN-7 no reabiertos; solo los cambios anunciados.
- `| ninguno | | | | |` tambien se descarta, y `| — | CRITICO | abierto |` cuenta como hallazgo con ID `—`: coherente con la regla documentada.
- Expectativas de tests cambiadas (`'730*'`, `'-55*'`, `'—','—'`, `rondas '3'`) son consecuencia directa de MEN-1 y MEN-2.

## No probado

- 3 mutantes mas sin ejecutar por tiempo (`sinDesglose < 0` → `false`, `every` → `some`, `ninguno` sin anclar); los otros 11 cubren las mismas ramas.
- No se re-aplicaron los dos mutantes de MEN-6.
