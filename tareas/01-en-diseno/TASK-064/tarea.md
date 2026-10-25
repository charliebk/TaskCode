---
id: TASK-064
titulo: "Metricas v2 (B): fila de metricas con coste desglosado, hallazgos y lecturas"
tipo: feature
sprint: 0
etiquetas: [metricas]
complejidad: media
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: feature/task-064-metricas-v2-b-leer-y-mostrar-la-evolucio
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-10-25
actualizado: 2026-10-25
dependencias: [TASK-063]
---
## Objetivo

Segunda mitad de la particion de TASK-063 (decidida en su diseno, Carlos 2026-10-25). TASK-063 captura los datos nuevos (tabla ## Coste con desglose y lecturas, columna Origen en los hallazgos); esta tarea los lee junto con lo que ya existe (frontmatter, informes de revision, ## Transiciones) y los muestra en taskctl metricas, incluida una vista de evolucion por tramos, y deja una linea base medida sobre los tres proyectos que usan el plugin (ToolsaWeb, OpenGisViewer y TaskCode) para elegir las siguientes mejoras (tokens, tiempo, verificacion, memoria de contexto) por cifras. Decisiones ya tomadas: tramos ordenados por fecha de cierre; tokens nuevos = entrada + escritura de cache + salida, con la lectura de cache aparte.

Ampliada antes de disenarla (Carlos, 2026-10-25). Una medicion a mano sobre 189 tareas de los tres proyectos mostro que el resultado de la revision depende sobre todo del tamano de la tarea: con 0-4 criterios se aprueba a la primera el 52 %, con 7 o mas el 12 %; `simple` 72 %, `media` 18 %, `alta` 5 %; `fix` 72 %, `feature` 23 %. ToolsaWeb es la excepcion: sus tareas pequenas tambien rebotan (14 % a la primera), asi que alli pesa otra cosa (dominio o contexto). Por eso el desglose por grupos y la comparacion entre proyectos valen mas que la evolucion sola. Incluye ademas dos MENOR que TASK-063 dejo para esta tarea (MEN-1 y MEN-2 de su informe).

En su diseno se partio otra vez (Carlos, 2026-10-25): esta tarea enriquece la fila de `taskctl metricas` de cada tarea; la evolucion por tramos, los grupos, `--repo` y la linea base de los tres proyectos pasan a TASK-065, que depende de esta. Reglas decididas: cada hallazgo (revisor + ID) cuenta una vez por tarea aunque reaparezca en rondas siguientes; un informe sin tabla de hallazgos es «sin dato», no cero.

## Criterios de aceptacion
- [ ] taskctl metricas muestra por tarea los tokens nuevos (entrada + escritura de cache + salida) y la lectura de cache por separado cuando hay tabla ## Coste, como sin desglose la diferencia entre tokens_<fase> y lo desglosado (negativa con aviso, nunca recortada a 0), y avisa de las filas repetidas (misma fase y misma fuente) en vez de esconderlas.
- [ ] taskctl metricas lista las tareas terminadas a las que les falta coste en alguna fase (diseno, implementacion, revision).
- [ ] taskctl metricas da por tarea las rondas, los hallazgos CRITICO, IMPORTANTE y MENOR de informe-revision-N.md e informe-revision-N-<revisor>.md contados una vez por tarea (revisor + ID), con su reparto por origen (sin clasificar si no hay columna Origen), y la mediana de lecturas por fase de las tareas con tabla ## Coste; un informe sin tabla de hallazgos cuenta como sin dato y la salida dice cuantos hay.
- [ ] La severidad de un hallazgo se reconoce sin distinguir mayusculas ni tildes (Importante, IMPORTANTE, Critico) y una severidad fuera del vocabulario sale como aviso con la tarea y el fichero, en vez de descartarse en silencio.
- [ ] Tests contra repos Git temporales reales con tareas en formato antiguo y nuevo: hallazgo repetido entre rondas cuenta una vez, informe sin tabla, severidad en minusculas, fila repetida en ## Coste, y una fila dentro de un bloque de codigo en una seccion ## Coste real que leerCostes no cuenta (MEN-1 de TASK-063); el CHANGELOG lo documenta.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-10-25T14:53:47Z | plan | automatico | persona |
