# Plan — TASK-052: F6-T5 Telemetria de fases y heuristica recalibrada

(Consolidado por quien orquesta a partir de 2 roles de brainstorm lanzados
en paralelo: arquitectura y riesgos. **Desviacion documentada:** sin agente
unificador, como en TASK-050 y TASK-051 (backlog en continuo).)

## Enfoque propuesto

1. **Marca de tiempo en `## Transiciones`, no en claves del frontmatter.**
   Se mantienen las 4 columnas y la columna `fecha` pasa a llevar el
   instante UTC con segundos (`2026-10-05T14:03:22Z`, de `toISOString`
   truncado). `leerTransiciones` acepta las dos formas (`YYYY-MM-DD` de las
   filas viejas y el instante) y expone la precision de cada fila. El
   criterio dice «en el frontmatter»: se cumple en `tarea.md`, junto a cada
   transicion, sin un segundo sitio para el mismo dato (ver desacuerdos).
   - `ahora()` junto a `today()` en `src/cli.ts`, misma fuente UTC; los seis
     llamadores de `registrarTransicion` (plan, approve, start, review,
     finish, pausa) reciben el instante.
2. **`taskctl metricas`** (solo lectura, patron de `board`):
   `src/core/metricas.ts` puro y `src/commands/metricas.ts` con E/S; flags
   validados con `rechazarFlagsDesconocidos`; cableado y `HELP` en `cli.ts`.
   - Una fila por tarea: id, complejidad, diseno (plan→start), curso
     (start→primer review), revision (primer review→finish), rondas (con
     `nombresDeUltimaRonda`, el mismo criterio que `finish`), cierre y
     origen del dato. La fila es un registro con columnas declaradas en una
     lista (TASK-023 anadira las de tokens ahi).
   - Origen por orden: tabla de Transiciones; si falta, fechas de los commits
     `chore(TASK-NNN): tarea en ...` con **un solo** `git log`; si tampoco,
     «—» (nunca 0 ni NaN). Con precision de dia, la duracion va en dias.
   - `pausa` se muestra como dato y no se descuenta (no existe `reanudar`):
     se mide calendario, y la salida lo dice.
3. **Heuristica recalibrada**: `taskctl metricas --heuristica` anade a cada
   tarea terminada la puntuacion y el nivel que da la heuristica vigente
   junto a la complejidad declarada y las rondas. Regla de coste escrita:
   rondas = numero de informes de revision; tareas sin `revision/` se
   excluyen (no son 0). Con esa tabla se ajustan pesos y umbrales de
   `scripts/heuristica-complejidad.yml` solo donde la muestra lo sostenga, y
   el YML deja en un comentario n, periodo, fuente y el comando que lo
   reproduce. Si la muestra no sostiene ningun cambio, se dice y no se
   cambia.
4. **Claves muertas fuera**: `tolerancia_niveles`,
   `tolerancia_extra_si_heuristica_menor` y `modelo_consulta_discrepancia`
   salen de `heuristica.ts` (claves, interfaz) y del YML **en el mismo
   commit**; el parrafo de `heuristica.ts` que deja de ser verdad, tambien.
   El mensaje de error de clave desconocida o ausente en el YML dice que se
   reinstale el plugin.
5. Documentacion: `metricas` en `CLAUDE.md`, README del plugin y la skill
   `task-workflow` (sin mencionar el proyecto); `scripts/catalogo-skills.yml`
   si cita el numero de claves.

## Desacuerdos entre roles, y como se resuelven

- **Donde va la hora.** Arquitectura: en la celda `fecha` (no duplicar el
  dato, el frontmatter no tiene listas y dos `review` se pisarian). Riesgos:
  no tocar `fecha`, porque `leerTransiciones` filtra por
  `^\d{4}-\d{2}-\d{2}$` y el modo congelado dejaria de leerse en silencio.
  **Se resuelve con arquitectura y con la condicion de riesgos como
  requisito**: el lector nuevo acepta las dos formas, y hay un test que
  congela el modo con filas con hora y comprueba que `modoCongelado` lo
  devuelve (y otro con filas mezcladas viejas/nuevas). El riesgo residual
  es un plugin **anterior** leyendo filas nuevas: se acepta (una version por
  repo, §7.3), se documenta en el CHANGELOG de la version que lo publica.
- **Premisa de las claves**: riesgos corrige al enunciado: no estan en
  `.taskcode/config.yml` sino en el YML de la heuristica; quitarlas no rompe
  configs de usuario. El riesgo real (YML y codigo de versiones distintas)
  se contiene con el commit unico y el mensaje de error.

## Riesgos aceptados y que los contiene

- Marca escrita sin commit si falla el `autoCommit`: patron que ya existia;
  `metricas` tolera marcas sin commit de cierre.
- Muestra pequena y de un solo proyecto: la recalibracion es conservadora y
  deja escrito n y fuente.
- Tests de la heuristica que cambien de expectativa: cada cambio dice en el
  commit que decision revierte; no se ajustan numeros para que cuadren.
- Tareas en diseno con brainstorm hecho con pesos viejos: los nuevos rigen
  desde el siguiente `plan`.

## Plan de pruebas

- `transiciones`: escribir con instante, leer filas viejas, nuevas y
  mezcladas; `modoCongelado` con filas con hora (mutacion: volver al regex
  viejo → rojo).
- `core/metricas`: duraciones con origen registro, git y ausente; precision
  de dia; plan repetido; varias rondas; pausa; nunca NaN.
- `metricas` por CLI contra un repo Git temporal real que recorre
  plan→approve→start→review→finish; flag desconocido aborta.
- Heuristica: el YML sin las claves carga; con una de ellas aborta con el
  mensaje de reinstalar.
- `npm run test:rapido` para iterar y `npm test` completo al final (los 3
  rojos conocidos de Windows).

## Lo que necesita decision de una persona

Nada bloqueante. El cambio de formato de la celda `fecha` no es legible por
versiones anteriores del plugin: se avisara en el CHANGELOG de la 0.5.0.
