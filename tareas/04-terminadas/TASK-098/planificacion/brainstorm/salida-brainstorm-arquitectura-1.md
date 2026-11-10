# Brainstorm — TASK-098, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura

Referencias relativas a `taskcode-marketplace/plugins/taskcode-plugin/` salvo las de ToolsaWeb y OpenDockTrading.

## Enfoque propuesto, con rutas y nombres concretos

- **Generador puro** `src/core/roadmap.ts`: `generarRoadmap(tareas: readonly TareaUbicada[], manual: string | null): { texto: string; ciclos: string[][] }`. Kahn con cola de prioridad por `(rangoHito, sprint, número)`. Las tareas dentro de un ciclo salen al final, en una sección «Dependencias circulares», sin abortar la transición. Sin fecha ni hora en la salida: una regeneración sin cambios de estado no deja diff, así la regla 2 de autoCommit (`src/fs/git-commit.ts:254`) no genera un commit vacío (lo contrario de BOARD, que estampa `today`, `finish.ts:676`).
- **Zona manual**: mismas marcas que OpenDockTrading (`OpenDockTrading/scripts/grafo-tareas.py:31-32`, `tareas/ROADMAP.md:5,186`). La de inicio se casa por prefijo `<!-- manual:inicio` (el texto de ODT nombra su script) y la de fin es `<!-- manual:fin -->`; lo de dentro se copia byte a byte. La marca de taskctl es una línea propia, `<!-- generado por taskctl; no editar a mano fuera de la zona manual -->` (sin mencionar TaskCode: hay tests que lo prohíben en lo que se instala).
- **Nombres de los hitos**: de los `### Hn — título` de la zona manual, como ODT (`grafo-tareas.py:81-83`); su orden fija el rango del hito. Un hito sin título sale como «Hito N», detrás de los titulados. **Sin clave nueva en `.taskcode/config.yml`.**
- **Decisión de escritura** en `src/fs/roadmap.ts`: `prepararRoadmap(repoCwd, tareasRoot): Promise<{ ruta: string | null; avisos: string[] }>`. Escribe solo si `tareas/ROADMAP.md` no existe, o si lleva la marca de taskctl y no figura en `config.rutas_sincronizacion` (`core/config.ts:135`, aplicado en `fs/sincronizacion.ts:96`), con la misma normalización de rutas. Devuelve la ruta para las `rutas` del autoCommit del comando, o `null`.
- **Lectura**: `listTareasEnEstados(tareasRoot, TASK_STATES)` (`fs/task-store.ts:76`), que deduplica y devuelve aparte las ilegibles; campos `Task.sprint`, `Task.dependencias`, `Task.complejidad`, `Task.estado` (`core/task.ts:59,65,89`).
- **CLI**: `if (cmd === 'roadmap')` junto a `board` (`cli.ts:504`), con `--comparar` (en seco) y `--escribir`, más la ayuda; comando en `src/commands/roadmap.ts`.
- **`--comparar`**: `src/core/roadmap-comparar.ts`, puro, compara por estructura: del ROADMAP actual extrae los `TASK-\d{3}` de cada fila bajo su encabezado de hito, más la zona manual, y lo enfrenta al modelo generado (tareas que faltan o sobran, hito, dependencias, estado, zona manual idéntica o no).

## Que se extiende y que se crea

- Se crean `core/roadmap.ts` y `core/roadmap-comparar.ts` (puros; precedente `core/board-format.ts:135`) y `fs/roadmap.ts` (único sitio que decide si se escribe).
- Se extienden `commands/new|plan|approve|start|review|finish.ts` con `prepararRoadmap` antes de su `autoCommit` (p. ej. `approve.ts:204`, `finish.ts:689`), añadiendo la ruta a `rutas`, como finish ya hace con `boardPath`/`indexPath` (`finish.ts:691-697`). `finish.ts:673` ya lee el tablero con `runBoardCommand`: conviene compartir la lectura.
- `fs/git-commit.ts` y `fs/sincronizacion.ts` **no se tocan**. `cli.ts` gana el comando.

## Limites que cruza

- **Formato público nuevo** (`tareas/ROADMAP.md`, marcas, zona manual): las marcas de la zona manual pasan a ser contrato compartido con ODT.
- **Dependencias**: commands → fs/roadmap → core/roadmap y fs/task-store; git-commit sigue sin saber de tareas.
- **Coste**: cada transición lee todos los `tarea.md`, O(N); con unos cientos es despreciable (finish ya lo paga por BOARD). Orden topológico O(V+E log V).
- **Config**: solo se lee `rutas_sincronizacion`.

## La decision de diseño que mas te preocupa (UNA sola)

`--comparar` contra un ROADMAP **ajeno** (ToolsaWeb y ODT tienen tablas distintas) obliga a parsear formatos que no son nuestros. Se acota a un extractor tolerante (filas con `TASK-NNN` bajo encabezados `H\d+`) y se declara no comparable lo que no case.

## Alternativas descartadas

- Regenerar dentro de `autoCommit`, como la sincronización (`git-commit.ts:208`): cubriría todas las transiciones (también import, pausa, doctor-deploy), pero acopla git-commit a la lectura de tareas, y autoCommit es síncrono mientras task-store es async.
- Clave `hitos:` en config.yml: nombres en dos sitios en ODT; ToolsaWeb los tiene en `docs/planificacion/hitos.md` (`ToolsaWeb/scripts/grafo-tareas.py:32`).

## Desacuerdos previstos y suposiciones

- Con llamadas por comando se puede olvidar una (import, pausa, doctor-deploy-tareas); el criterio nombra seis transiciones.
- Sin verificar: que ningún test exija nombrar el script de ODT en la marca de inicio; que la migración de ToolsaWeb exija mover los títulos de `docs/planificacion/hitos.md` a la zona manual; que `new` tenga `tareasRoot` y autoCommit propio como approve.
