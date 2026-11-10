# Plan — TASK-097: Regla de una hora: plan estima la duracion de punta a punta y propone trocear

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos.
Los desacuerdos entre roles se senalan, no se promedian.)

Reglas de la persona: el objetivo principal es la agilidad sin perder calidad; la 0.8 se conserva; el umbral es de 1 hora de punta a punta (de la rama abierta al cierre con merge); se estima al planificar, el plan lo escribe, la persona decide en approve y finish mide.

## Enfoque propuesto

Duracion estimada:  min (ficheros de codigo previstos: , capas: , criterios: )

- (arquitectura) Módulo puro nuevo `src/core/duracion-estimada.ts`: `leerDuracionEstimada` y `UMBRAL_MINUTOS = 60`. Orden: 1) módulo y línea en `planTemplate` (`plan.ts`); 2) aviso en `approve.ts` si falta; 3) `ContextoFlujo.duracionEstimada` y rama `> 60` en `flujo.ts`/`siguiente.ts` con `exigePersona`; 4) `minutosPuntaAPunta` en `metricas.ts` sobre `duracionSinPausas`, que finish anota en `## Duracion` de tarea.md y metricas muestra; 5) skills, README y CHANGELOG.
- (riesgos, no es desacuerdo, entra entero) finish **nunca lanza** después del merge: si falta un dato, escribe «—» o «sin estimación». La plantilla **solo gana líneas**, no reescribe las que ya tiene (`planEsEsqueleto`). Los planes viejos sin la línea **solo avisan**, y `siguiente` se comporta como hoy. Si finish se reintenta, la anotación **se reemplaza**, no se duplica. Sin precisión de minuto (solo hay día), sale «—», nunca 0.

## Desacuerdos entre roles, y como se resuelven

- Preguntar también en modo manual. Arquitectura: manual sigue devolviendo `detener`, porque ya para siempre (`flujo.ts:100`). Riesgos: el criterio dice «en cualquier modo»; o se reordena `accionPara` o se acepta y se deja escrito. Recomendación: **riesgos**. El criterio de aceptación, en palabras de la persona, pide `preguntar` en cualquier modo, con un test por caso. Lo decide la persona (ver abajo).
- Que approve rechace `--decidido-por automatico` si la estimación pasa de 60. Riesgos: sí, porque si no, un agente que llame a approve directamente se salta la regla (`approve.ts:181`). Arquitectura: «nada aborta por la estimación». Recomendación: **riesgos**. «La persona decide en approve» no se cumple si la máquina aprueba sola un plan de más de 60. Es barato y solo afecta a `automatico`.
- La guarda se basa en la cifra declarada o en el máximo con lo recalculado a partir de las señales. Riesgos: recalcular y usar el máximo, porque la cifra la escribe el propio agente. Arquitectura: leer solo la cifra declarada. Recomendación: **arquitectura**. Ningún rol define cómo pasar de señales a minutos (la correlación medida, 0,40, es débil), y las señales también las escribe el agente. La línea obliga a dejarlas escritas junto a la cifra, y la persona las ve en approve. El maquillaje queda como riesgo aceptado.
- Formato no reconocido. Riesgos: tratarlo como > 60, es decir, preguntar (`~90`, `1h30`, rangos, tilde, negrita). Arquitectura: el regex devuelve `null`, que se trata igual que «sin estimación». Recomendación: **riesgos**, con su propia distinción de compatibilidad. Si la línea falta, solo se avisa; si la línea está pero no parsea, se pregunta.

## Riesgos aceptados y que los contiene

- Estimación maquillada (55 min con pocos ficheros), traída por riesgos. La contienen las señales escritas a la vista en approve y la calibración con los minutos reales de finish.
- Pausas mal contadas: los wrappers `pause`/`resume` no escriben fila, así que una noche cuenta como trabajo (riesgos). Sesga la calibración, no la guarda; se documenta en las skills.
- Tarea re-planificada: metricas usa el primer `plan` y el primer `start` (riesgos). La contiene que finish anote la estimación del plan vigente en tarea.md (arquitectura).
- La heurística dio «simple» y la tarea se declaró «media»: 5 puntos de cambio en 3 capas apuntan a que la propia tarea roza la hora.

## Plan de pruebas

Todas contra repos Git temporales reales.
- Plan sin la línea: approve avisa y no aborta. Plan viejo sin la línea: igual (riesgos, criterio 1).
- `siguiente` en approve con más de 60 devuelve `preguntar` con el motivo de trocear; con 60 o menos no cambia nada; en manual, según lo que se decida (criterio 2).
- Línea presente pero no parseable: pregunta. Plantilla vacía: sigue contando como esqueleto (riesgos, arquitectura).
- `approve --decidido-por automatico` con más de 60 se rechaza, si se aprueba el desacuerdo 2 (riesgos).
- finish anota los minutos reales sin pausas junto a la estimación; con `start` de solo día anota «—»; reintentado, deja una sola anotación; un dato ausente no rompe tras el merge. Metricas los muestra (criterio 3, riesgos).
- Suite completa en verde sin debilitar tests; se buscan los tests que comparan `planTemplate` literalmente (arquitectura, suposición sin verificar).

## Lo que necesita decision de una persona

- Desacuerdo 1: si manual también devuelve `preguntar`, que es lo que pide el criterio, o se reescribe el criterio. El reorden de `accionPara` toca a todo `exigePersona` en manual, y ningún rol lo midió.
- Desacuerdos 2 a 4: si se confirman las recomendaciones. El 3 deja abierto el maquillaje a propósito, para ganar agilidad.
- Sin cubrir: qué fórmula de señales a minutos usan las skills, si es que usan alguna. Ningún rol propone el umbral ni las señales; riesgos lo deja dicho.
- La aprobación del plan entero con `taskctl approve`: sin ella no se implementa.

## Decisiones de la persona (2026-11-10)

1. Con estimacion de mas de 60 min, siguiente pregunta en TODOS los modos, manual incluido (postura de riesgos).
2. approve con --decidido-por automatico se rechaza si la estimacion pasa de 60: decide la persona (postura de riesgos).
3. Se usa la cifra declarada en el plan, con sus senales a la vista; la medicion de finish calibra (postura de arquitectura).
4. Linea ausente: solo aviso. Linea presente pero no reconocida: se pregunta, como si pasara de 60 (postura de riesgos).
5. Plan aprobado tal cual por la persona.
