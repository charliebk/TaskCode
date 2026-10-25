---
id: TASK-064
titulo: "Metricas v2 (B): fila de metricas con coste desglosado, hallazgos y lecturas"
tipo: feature
sprint: 0
etiquetas: [metricas]
complejidad: media
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-064-metricas-v2-b-leer-y-mostrar-la-evolucio
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 925377
tokens_implementacion: 12316934
tokens_revision: 20447924
creado: 2026-10-25
actualizado: 2026-10-25
dependencias: [TASK-063]
---
## Objetivo

Segunda mitad de la particion de TASK-063 (decidida en su diseno, Carlos 2026-10-25). TASK-063 captura los datos nuevos (tabla ## Coste con desglose y lecturas, columna Origen en los hallazgos); esta tarea los lee junto con lo que ya existe (frontmatter, informes de revision, ## Transiciones) y los muestra en taskctl metricas, incluida una vista de evolucion por tramos, y deja una linea base medida sobre los tres proyectos que usan el plugin (ToolsaWeb, OpenGisViewer y TaskCode) para elegir las siguientes mejoras (tokens, tiempo, verificacion, memoria de contexto) por cifras. Decisiones ya tomadas: tramos ordenados por fecha de cierre; tokens nuevos = entrada + escritura de cache + salida, con la lectura de cache aparte.

Ampliada antes de disenarla (Carlos, 2026-10-25). Una medicion a mano sobre 189 tareas de los tres proyectos mostro que el resultado de la revision depende sobre todo del tamano de la tarea: con 0-4 criterios se aprueba a la primera el 52 %, con 7 o mas el 12 %; `simple` 72 %, `media` 18 %, `alta` 5 %; `fix` 72 %, `feature` 23 %. ToolsaWeb es la excepcion: sus tareas pequenas tambien rebotan (14 % a la primera), asi que alli pesa otra cosa (dominio o contexto). Por eso el desglose por grupos y la comparacion entre proyectos valen mas que la evolucion sola. Incluye ademas dos MENOR que TASK-063 dejo para esta tarea (MEN-1 y MEN-2 de su informe).

En su diseno se partio otra vez (Carlos, 2026-10-25): esta tarea enriquece la fila de `taskctl metricas` de cada tarea; la evolucion por tramos, los grupos, `--repo` y la linea base de los tres proyectos pasan a TASK-065, que depende de esta. Reglas decididas: cada hallazgo (revisor + ID) cuenta una vez por tarea aunque reaparezca en rondas siguientes; un informe sin tabla de hallazgos es «sin dato», no cero.

## Criterios de aceptacion
- [x] taskctl metricas muestra por tarea los tokens nuevos (entrada + escritura de cache + salida) y la lectura de cache por separado cuando hay tabla ## Coste, como sin desglose la diferencia entre tokens_<fase> y lo desglosado (negativa con aviso, nunca recortada a 0), y avisa de las filas repetidas (misma fase y misma fuente) en vez de esconderlas.
- [x] taskctl metricas lista las tareas terminadas a las que les falta coste en alguna fase (diseno, implementacion, revision).
- [x] taskctl metricas da por tarea las rondas, los hallazgos CRITICO, IMPORTANTE y MENOR de informe-revision-N.md e informe-revision-N-<revisor>.md contados una vez por tarea (revisor + ID), con su reparto por origen (sin clasificar si no hay columna Origen), y la mediana de lecturas por fase de las tareas con tabla ## Coste; un informe sin tabla de hallazgos cuenta como sin dato y la salida dice cuantos hay.
- [x] La severidad de un hallazgo se reconoce sin distinguir mayusculas ni tildes (Importante, IMPORTANTE, Critico) y una severidad fuera del vocabulario sale como aviso con la tarea y el fichero, en vez de descartarse en silencio.
- [x] Tests contra repos Git temporales reales con tareas en formato antiguo y nuevo: hallazgo repetido entre rondas cuenta una vez, informe sin tabla, severidad en minusculas, fila repetida en ## Coste, y una fila dentro de un bloque de codigo en una seccion ## Coste real que leerCostes no cuenta (MEN-1 de TASK-063); el CHANGELOG lo documenta.

## Resultado

Cerrada el 2026-10-25 en 2 rondas de revision por pares (ronda 1: cambios-solicitados con 2 IMPORTANTE y 7 MENOR; ronda 2: aprobada con 1 MENOR). Es la fila enriquecida de la particion de TASK-064; los agregados (`--evolucion`, `--grupos`, `--repo`, `--json`, README y linea base de los tres proyectos) son TASK-065.

**Lo entregado.** `taskctl metricas` da por tarea:

- **Hallazgos** `crit`, `imp`, `men` y `hall_origen` (implementacion/plan/especificacion/sin clasificar), contados una vez por tarea con clave revisor + ID. Cada campo toma el valor de la ultima ronda en que esta reconocido. La severidad se reconoce por su primera palabra, sin mayusculas, tildes ni enfasis (`IMPORTANTE (ronda 1)` cuenta). Una severidad desconocida avisa con tarea y fichero. La fila «sin hallazgos» no cuenta. Un informe sin tabla deja la tarea «sin dato» y la salida dice cuantos hay.
- **Coste** con `--tokens`: `tok_nuevos` (entrada + escritura de cache + salida), `tok_cache_lect` y `tok_sin_desglose`, con `*` si alguna fase es negativa y «—» si nada se desgloso. Avisa de agentes repetidos en `## Coste` (MEN-2 de TASK-063) y de totales vacios con filas.
- **Terminadas sin coste** en alguna fase y **mediana de lecturas** por fase.
- `FilaMetricas` lleva siempre `proyecto`, `tipo`, `criterios`, `coste`, `hallazgos` y `kbPeticionPorRonda`, con `null` documentado, para que TASK-065 agregue sin ambiguedad.

**Suite.** 1393 tests; fallan los 5 conocidos (3 de Windows y 2 de «contraprueba de descubrimiento» por `claude plugin validate`, que fallan tambien en develop).

**Datos reales (solo lectura).** ToolsaWeb, sin avisos. OpenGisViewer: avisos legitimos de TASK-017 («nota») y TASK-026 («fuera de alcance»), la tabla antigua de TASK-030 y 35 informes sin tabla en 17 tareas. `git status` de `tareas/`, `docs/` y `.taskcode/` igual antes y despues en los dos.

**Revision.**

- Ronda 1 (cambios-solicitados): IMP-1 (fila «sin hallazgos» contada como hallazgo, real en TASK-121/133/140 de OpenGisViewer) e IMP-2 (la ultima ronda borraba un dato reconocido, real en TASK-026), corregidos. MEN-1, MEN-2, MEN-5 y MEN-6, corregidos. MEN-3 documentado: un mismo ID bajo informe sin sufijo y con sufijo de revisor cuenta dos veces.
- Diferidos a TASK-065: MEN-4 (README y acotar la lista de tareas sin coste, que en OpenGisViewer son 76 de 76).
- Aceptados: MEN-7 (tablas de formato antiguo dan avisos de ruido) y MEN-8 de la ronda 2 (`Crítico.` con punto o `IMPORTANTE/MENOR` no se reconocen; el aviso lo hace visible).
- Decision tomada durante la tarea por quien orquesta (IMP-2): severidad por primera palabra y fusion campo a campo. Extiende la decision 1 sin cambiarla.

**Coste.** El de las correcciones de la ronda 1 no esta registrado: se hicieron reanudando el mismo agente de la implementacion, y su transcripcion acumula los dos trabajos, asi que registrarlo de nuevo contaria doble la primera parte. Es una limitacion de la medicion para agentes reanudados; candidata para TASK-065 o una tarea aparte.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-25T14:53:47Z | plan | automatico | persona |
| 2026-10-25T15:06:48Z | approve | automatico | automatico |
| 2026-10-25T15:06:49Z | start | automatico | persona |
| 2026-10-25T16:47:04Z | review | automatico | persona |
| 2026-10-25T18:21:23Z | review | automatico | persona |
| 2026-10-25T19:04:20Z | finish | automatico | persona |
