# Plan — TASK-065: Metricas v2 (C): evolucion, grupos y varios proyectos

(Lo consolida el agente unificador a partir de 2 roles de brainstorm lanzados en paralelo: arquitectura, riesgos.
Dos roles = el mayor entre la complejidad declarada, media, y la heuristica, simple (2 puntos). Los desacuerdos se senalan, no se promedian.
Este plan no vale hasta que una persona lo apruebe con `taskctl approve`.)

## Enfoque propuesto
- (arquitectura) 1. `extraerRepetible(argv, '--repo')` en `src/cli/args.ts` (sube `extraerAgentes` de registrar-coste), `leerRepoMetricas(repoCwd)` en `src/commands/metricas.ts`, `etiquetaTarea` y aborto de `--repo` + `--escribir` en `parseFlagsMetricas` antes de leer. Con un solo repo, la salida no cambia en un byte.
- (arquitectura) 2. `FilaMetricas` gana `total` (plan a finish, en `calcularFila`) y `veredictoRonda1`. 3. `src/core/evolucion.ts` + `--evolucion [--tramo N]`. 4. `src/core/grupos-metricas.ts` + `--grupos` (`resumirPorNivel` no se toca). 5. `--json` `{proyectos, evolucion?, grupos?}`, README, CHANGELOG, linea base.
- (riesgos, incorporado) Validaciones antes de leer: ruta de `--repo` inexistente o sin `tareas/` aborta, `--repo` sin valor aborta, `--tramo` entero >= 1 o aborta; stderr lista los repos leidos con sus tareas antes de las tablas.

## Desacuerdos entre roles, y como se resuelven
- Identidad del repo — arquitectura: `proyecto = basename`, abortar si dos `--repo` comparten basename / riesgos: normalizar con `realpath`, quitar duplicados por ruta real y abortar si dos rutas distintas comparten basename — gana riesgos — el basename solo no detecta la misma ruta con otras mayusculas en Windows (duplicaria tareas sin aviso); el aborto por basename de arquitectura queda incluido.
- Flags repetidos — arquitectura: `extraerRepetible` por flag, compartido con registrar-coste, sin tocar `parseArgs` / riesgos: un arreglo local «no vale» sin aviso general, porque el pisado silencioso sigue en los demas comandos — gana arquitectura para `--repo` (cubre el criterio y el riesgo 1); el aviso general toca todos los comandos y no lo pide ningun criterio: va a decision humana.
- `null` en `--json` — arquitectura anticipo que riesgos pediria `{valor, motivo}` por metrica; riesgos no lo propuso (pide `n` por grupo y tramo) — sin conflicto real: `null` solo junto a `n: 0` en el mismo objeto (arquitectura).
- Desempate por ID — los dos piden numero de ID, no cadena (`TASK-99` < `TASK-100`): coinciden, no hay desacuerdo.

## Riesgos aceptados y que los contiene
- La linea base saldria con un solo repo si `--repo` se pisa — riesgos (el que mas preocupa) — `extraerRepetible` + lista de repos y tareas por repo en stderr.
- Fallo parcial de git en un repo manda sus tareas a «sin cierre» en silencio — riesgos — aviso con el repo nombrado y excluidas contadas por proyecto.
- Tramos y grupos minusculos que parecen cifras (ultimo tramo parcial, tercil vacio) — riesgos — `n` en cada grupo y tramo; KB nulo fuera de los terciles y contado aparte, nunca como 0.
- Contrato `--json` publico e irreversible una vez publicado — riesgos — forma unica `{proyectos, evolucion?, grupos?}` armada en core (arquitectura); se fija con la aprobacion.
- `tareasSinCoste`, `avisosDeFila` y `avisoInformesSinTabla` devuelven `f.id` a secas — arquitectura (lo que mas le preocupa) — cambiarlas todas en el mismo paso via `etiquetaTarea`.

## Plan de pruebas
- Dos repos con el mismo TASK-NNN no mezclan datos y las salidas usan `proyecto/ID` — repos Git temporales reales — criterio + arquitectura.
- Sin `--repo`, salida identica byte a byte a la actual — repo temporal — arquitectura (paso 1) y riesgos (compatibilidad).
- Tres `--repo` leen tres repos; misma ruta con otra grafia, basename repetido, ruta sin `tareas/` y `--repo` sin valor abortan — repos temporales — riesgos 1-3.
- `--repo` + `--escribir` aborta y `git status` no cambia; `--tramo 0`, `-1`, `2.5`, `abc` abortan — repos temporales — criterio + riesgos 5.
- `--json` con `--evolucion`/`--grupos` pasa `JSON.parse` sin tareas y con grupos vacios; texto y avisos solo por stderr — repo temporal — criterio + arquitectura.
- Orden de tramos por cierre, proyecto y numero de ID (`TASK-99` antes que `TASK-100`) y cortes de terciles sobre todos los repos — repos temporales — riesgos 6.

## Sin cubrir
- «Hallazgos contados una vez por tarea (revisor + ID)»: ningun rol dice donde se deduplica — lo fija quien implemente, con test.
- Ordenar cierres de solo dia frente a cierres con hora entre proyectos (riesgos 6 lo senala, ninguno da regla) — a decision humana.
- `--repo` relativo: riesgos lo deja «pendiente de arquitectura» y arquitectura no responde — por defecto, contra `process.cwd()` (dicho por riesgos, no decidido).
- Mediana de `total` en un tramo con `n > 0` pero sin ninguna fila con `total`: la regla `null` + `n: 0` no lo cubre — quien implemente, sin `null` silencioso.

## Salidas que faltaron
- Ninguna. No se lanzo rol de dominio (los dos roles prevén desacuerdos «con dominio»): las reglas de dominio las fijo Carlos en el Objetivo y no se reabren.

## Suposiciones no verificadas
- `veredictoDeRonda` devuelve `aprobada-con-correcciones` como valor distinto — arquitectura — `informe-revision.ts` l. 64-81.
- `rechazarFlagsDesconocidos` acepta un flag repetido; el finish esta en las marcas de `calcularFila` — arquitectura — `src/cli/args.ts`, `metricas.ts` l. 230-280.
- Leer tres repos cuesta poco (un `git log` por repo, O(n log n)) — arquitectura — no medido con los tres repos.
- ToolsaWeb y OpenGisViewer usan las mismas carpetas de estado y sin clones con el mismo basename — riesgos — `ALL_STATE_FOLDERS` frente a los dos repos.
- Formato de la fecha de cierre (dia o con hora) en ToolsaWeb y OpenGisViewer — riesgos — sus filas de metricas.

## Lo que necesita decision de una persona
- Aviso general en `parseArgs` para flags repetidos en todos los comandos (riesgos) o solo `extraerRepetible` para `--repo` (arquitectura) — cambia todos los comandos y ningun criterio lo pide.
- Alcance: arquitectura mete MEN-4 (notas recortadas a 10 IDs) y riesgos pide cerrar los flags combinables con `--json` (hoy `--json --tokens --escribir` deja texto en stdout); ninguno esta en los criterios — entra o va a otra tarea.
- Como se ordenan cierres de solo dia frente a cierres con hora — ningun rol propuso regla y cambia los tramos de la linea base.
- Aprobar el plan entero; y si el coste de agentes reanudados va a una tarea aparte, como propone arquitectura — la aprobacion es siempre de una persona.

### Decisiones de la persona (Carlos, 2026-10-25)

1. **Flags repetidos: lector comun y aviso general.** `--repo` y `--agente` usan `extraerRepetible` (sale de `extraerAgentes` de `registrar-coste`). En el resto de comandos, un flag repetido que no admite repeticion aborta con error en vez de pisarse. La identidad del repo es la de riesgos: `realpath`, sin duplicados por ruta real y aborto si dos rutas distintas comparten basename.
2. **Alcance ampliado: entran las tres cosas.** MEN-4 (recuento por fase, 10 primeras y «y N mas»; completa en `--json`; README al dia); lista cerrada de flags combinables con `--json` y aborto con los demas; y el **coste de agentes reanudados**: `registrar-coste --agente <id>` con un id ya anotado en `## Coste` de esa fase registra la diferencia entre la transcripcion acumulada y lo ya anotado para ese id, lo marca en `fuente`, y `metricas` no lo avisa como repetido (ajusta la regla de MEN-2 de TASK-064). Criterios 7 a 9 de `tarea.md`.
3. **Cierres: se compara solo el dia** para todas las tareas; dentro del mismo dia, desempate estable por proyecto y numero de ID.

Decididos por quien orquesta (huecos «sin cubrir», sin cambiar reglas de la persona):
- La deduplicacion revisor + ID ya existe (`resumirHallazgos`, TASK-064): los agregados la reutilizan, no la reimplementan.
- `--repo` relativo se resuelve contra `process.cwd()`.
- Tramo con tareas pero sin ningun `total`: mediana `null` con un recuento explicito de cuantas tienen `total` (`nTotal: 0`), nunca `null` sin explicar.

Nota de tamano: con 9 criterios la tarea queda en la franja que los datos asocian a mas rondas de revision; se acepta a sabiendas. El orden de construccion de arquitectura (pasos 1-5) se mantiene y el coste de reanudados va como paso 6, independiente de los agregados.
