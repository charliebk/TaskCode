# Pendiente de añadir a TaskCodeTwo: selección de skills, agentes y modelo

> **APLICADO el 2026-11-14** en TaskCodeTwo (plan y requisitos en `cb42cab`,
> tareas TASK-073..093 importadas, dependencias y ROADMAP regenerado), junto
> con dos tareas más de desinstalación limpia: F2-14 (`taskctl desinstalar`
> para TaskCodeTwo) y F9-10 (desinstalar TaskCode 0.16 de máquina y proyectos).
> Este documento queda como registro.

> Decidido por Carlos el 2026-11-14: **imprescindible**. Se añade a TaskCodeTwo
> (plan, requisitos y tareas) **cuando termine la rama que está en curso allí**,
> para no provocar conflictos. Este documento tiene lo necesario para hacerlo
> de una vez.

## 1. Requisito rector nuevo (REQUISITOS-FUNCIONALES.md §0)

| ID | Requisito rector | Qué significa en la 2.0 |
|---|---|---|
| RR-17 | **Skills, agentes y modelo adecuados a cada tarea** | Para cada tarea y cada rol (diseño, implementación, revisión) se eligen las skills, los agentes y el modelo que corresponden según su dominio, complejidad y carril, **solo entre los que están instalados** en la máquina y el proyecto; la elección queda anotada en la tarea y se mide si acierta |

## 2. Cambios en el catálogo de requisitos

| ID | Cambio |
|---|---|
| RF-12 | Pasa de **E** a **I**. Texto: «Recomendar skills, agentes y modelo por tarea y por rol» |
| RF-13 (nuevo) | **I** — Elegir el modelo por tarea y por rol según complejidad y carril (`modelo_sugerido` en la 0.16) |
| RF-14 (nuevo) | **I** — Inventario de skills y agentes instalados (máquina y proyecto); nunca se recomienda uno que no existe |
| RF-15 (nuevo) | **I** — Medir si la elección acierta: hallazgos por revisora y por rol, coste y resultado por modelo, para iterar el método |

Uso en la 0.16 (por qué salió «poco usado»): `skills_recomendados` en 21 / 0 / 2
tareas de ToolsaWeb / OpenDockTrading / TaskCode, porque el catálogo apenas se
configuró. Que se use poco no quita que sea necesario: la elección hoy la hace
el agente sin criterio registrado.

## 3. Tareas nuevas del plan (PLAN-TASKCODE-2.md)

| ID | Tarea | Criterio de aceptación | Dep. |
|---|---|---|---|
| F1-15 | ADR: selección de skills, agentes y modelo por tarea y por rol (RR-17): fuentes (catálogo declarado del proyecto, skills y agentes instalados, revisoras del plugin), reglas deterministas por etiquetas, rutas, dominio, complejidad y carril, qué se anota en la tarea, cómo se mide el acierto | Reglas escritas y probadas a mano sobre 10 tareas reales de ToolsaWeb y OpenDockTrading; nada lo decide el modelo «a ojo» | F1-9, F1-10 |
| F3-9 | Inventario de skills y agentes instalados (máquina y proyecto) y `doctor` que avisa de un catálogo que nombra algo no instalado (RF-14) | Lista lo instalado; una recomendación a algo inexistente es error con el arreglo | F2-1, F1-15 |
| F4-6 | `plan` propone skills, agentes y modelo para diseño, implementación y revisión; se anotan en la tarea; el orquestador y la revisión los usan (RF-12, RF-13) | En 10 tareas reales la propuesta coincide con la que haría una persona; el modelo cambia según complejidad y carril | F4-1, F3-9, F6-3 |
| F8-6 | Medición del acierto: hallazgos por revisora y por rol, coste y resultado por modelo, en `metricas` y en el informe por versión (RF-15, RR-05) | Informe que dice qué skill, agente o modelo rinde peor para su coste | F8-1, F4-6 |

Además: añadir RR-17 a la tabla de requisitos rectores del plan (§2), al
criterio de salida (§9) y, en F6-3, la frase «y con el modelo que fije F4-6».

## 4. Fichero de import para TaskCodeTwo

Copiarlo **fuera del repo** y ejecutar un `taskctl import` por sprint
(F1-15 → sprint 1, F3-9 → 3, F4-6 → 4, F8-6 → 8); después, escribir sus
dependencias en el frontmatter con el mapa F-id → TASK del ROADMAP y regenerar
el roadmap.

```markdown
### F1-15 ADR seleccion de skills, agentes y modelo por tarea y rol
> ADR: selección de skills, agentes y modelo por tarea y por rol (RR-17): fuentes, reglas deterministas por etiquetas, rutas, dominio, complejidad y carril, qué se anota en la tarea y cómo se mide el acierto.
- Reglas escritas y probadas a mano sobre 10 tareas reales de ToolsaWeb y OpenDockTrading
- Nada lo decide el modelo a ojo
- Cumple lo que pide la tarea F1-15 del plan y los requisitos que cita

### F3-9 Inventario de skills y agentes instalados
> Inventario de skills y agentes instalados (máquina y proyecto) y doctor que avisa de un catálogo que nombra algo no instalado (RF-14).
- Lista lo instalado
- Una recomendación a algo inexistente es error con el arreglo
- Cumple lo que pide la tarea F3-9 del plan y los requisitos que cita

### F4-6 plan propone skills, agentes y modelo por rol
> plan propone skills, agentes y modelo para diseño, implementación y revisión; se anotan en la tarea; el orquestador y la revisión los usan (RF-12, RF-13).
- En 10 tareas reales la propuesta coincide con la que haría una persona
- El modelo cambia según complejidad y carril
- Cumple lo que pide la tarea F4-6 del plan y los requisitos que cita

### F8-6 Medicion del acierto de skills, agentes y modelo
> Medición del acierto: hallazgos por revisora y por rol, coste y resultado por modelo, en metricas y en el informe por versión (RF-15, RR-05).
- Informe que dice qué skill, agente o modelo rinde peor para su coste
- Cumple lo que pide la tarea F8-6 del plan y los requisitos que cita
```

Dependencias (F-id del plan): F1-15 ← F1-9, F1-10 · F3-9 ← F2-1, F1-15 ·
F4-6 ← F4-1, F3-9, F6-3 · F8-6 ← F8-1, F4-6. Además, F4-4 (orquestador) pasa a
depender de F4-6.

## 5 bis. Lotes desatendidos: «arrancar TASK-a a TASK-b seguidas» (RR-18)

> Decidido por Carlos el 2026-11-14: **imprescindible**. Hoy se hace en
> ToolsaWeb y OpenDockTrading (y en TaskCode: «noche 108-109-099», «salida
> 111-…-130», «backlog TASK-034..052 en continuo») como instrucción al agente:
> «arrancar consecutivamente TASK-xxx a TASK-yyy, sin trocear y aceptando las
> recomendaciones en todas las preguntas». Sirve cuando una lista de tareas es
> de documentación o de programación que no necesita revisión humana hasta el
> final, o para dejar una batería de trabajo en automático por la noche.

| ID | Requisito rector | Qué significa en la 2.0 |
|---|---|---|
| RR-18 | **Lotes desatendidos con revisión humana solo al final** | Un comando lanza una secuencia de tareas (rango o lista) que se ejecutan una tras otra sin preguntar: sin trocear, aceptando las recomendaciones, con revisión IA y verificación en cada tarea, y **una sola revisión humana al final del lote**. Respeta dependencias, tiene presupuesto, se puede reanudar y deja un informe |

Requisito del catálogo: **RF-16 (I)** — «Ejecutar un lote de tareas
desatendido con revisión humana al final» (uso: varias noches y salidas en
los tres repos, hecho hoy a mano por instrucción).

Diseño propuesto (a confirmar en la ADR F1-16):

- **Rama de lote**: el lote trabaja sobre `lote/<nombre>` creada desde
  `develop`. Cada tarea va en su rama, pasa sus puertas automáticas
  (verificación en CI y revisión IA sin bloqueantes) y **se integra en la rama
  del lote**, no en `develop`, así que la siguiente tarea ya ve el código de la
  anterior. Al final, **un único PR del lote contra `develop`** que la persona
  revisa y aprueba (la puerta humana de siempre, una vez).
- **Política**: solo carriles permitidos para lote (por ejemplo,
  documentación y programación sin riesgo alto); una tarea de riesgo alto o
  con un `[DECIDE CARLOS]` abierto no entra, o para el lote.
- **Ante un fallo**: un CRÍTICO o IMPORTANTE que no se resuelve en el tope de
  rondas, o una verificación en rojo, aparta esa tarea (y las que dependen de
  ella) y el lote sigue con las independientes; nunca integra algo en rojo.
- **Presupuesto** de tiempo y de tokens para todo el lote; al agotarse, para
  limpio.
- **Reanudable**: si se corta (apagado, error), `taskctl lote --reanudar`
  sigue donde iba sin repetir lo hecho.
- **Informe de la mañana**: qué se terminó, qué se apartó y por qué, hallazgos
  sin corregir, tokens y tiempo; enlazado desde el PR del lote.
- **Nada de esto lo decide el agente**: el lote, su política y sus paradas los
  ejecuta el CLI de forma determinista (RR-01).

| ID | Tarea | Criterio de aceptación | Dep. |
|---|---|---|---|
| F1-16 | ADR: lotes desatendidos (RR-18): rama de lote, política de carriles, qué para el lote y qué aparta una tarea, presupuesto, reanudación, informe, y su equivalente en GitLab | Diseño probado a mano con un lote real de ToolsaWeb | F1-5, F1-10 |
| F4-7 | `taskctl lote TASK-a..TASK-b` (o lista): secuencia sin preguntas, sin trocear, aceptando recomendaciones, integración en la rama del lote y PR final contra `develop` (RF-16) | Un lote de 5 tareas termina sin intervención y deja un único PR para la persona | F4-4, F4-6, F1-16 |
| F4-8 | Fallos, presupuesto, `--reanudar` e informe del lote | Lote cortado a mitad se reanuda sin repetir; una tarea en rojo se aparta con sus dependientes y el resto sigue; informe completo | F4-7, F8-1 |
| F9-4b | Prueba nocturna: lote de 10 tareas reales desatendido en un repo de pruebas | Por la mañana: PR del lote, informe y ninguna integración en rojo | F4-8, F9-4 |

Entradas para el import (F1-16 → sprint 1, F4-7 y F4-8 → 4, F9-4b → 9):

```markdown
### F1-16 ADR lotes desatendidos con revision humana al final
> ADR: lotes desatendidos (RR-18): rama de lote, política de carriles, qué para el lote y qué aparta una tarea, presupuesto, reanudación, informe, y su equivalente en GitLab.
- Diseno probado a mano con un lote real de ToolsaWeb
- Cumple lo que pide la tarea F1-16 del plan y los requisitos que cita

### F4-7 taskctl lote: secuencia de tareas sin preguntas
> taskctl lote TASK-a..TASK-b (o lista): secuencia sin preguntas, sin trocear, aceptando recomendaciones, integración en la rama del lote y PR final contra develop (RF-16).
- Un lote de 5 tareas termina sin intervencion
- Deja un unico PR para la persona
- Cumple lo que pide la tarea F4-7 del plan y los requisitos que cita

### F4-8 Fallos, presupuesto, reanudacion e informe del lote
> Fallos, presupuesto, --reanudar e informe del lote.
- Un lote cortado a mitad se reanuda sin repetir lo hecho
- Una tarea en rojo se aparta con sus dependientes y el resto sigue
- El informe del lote esta completo
- Cumple lo que pide la tarea F4-8 del plan y los requisitos que cita

### F9-4b Prueba nocturna de un lote de 10 tareas
> Prueba nocturna: lote de 10 tareas reales desatendido en un repo de pruebas.
- Por la manana hay PR del lote e informe
- Ninguna integracion en rojo
- Cumple lo que pide la tarea F9-4b del plan y los requisitos que cita
```

## 5 ter. Trabajo en equipo garantizado (refuerzo de RR-09 y RR-12)

> Decidido por Carlos el 2026-11-14: el trabajo con varias personas **debe estar
> garantizado**: todos saben qué tarea tiene cada uno y no se pueden pisar ni
> los nombres ni las tareas. Lo ya previsto (IDs por push atómico F2-4, toma
> atómica en `start` F3-6, roadmap con quién lleva cada tarea F3-4, `status`
> F3-5, E2E con dos personas F9-4) se mantiene; esto cierra los huecos.

Nuevo texto de RR-12 en REQUISITOS-FUNCIONALES.md §0:

| ID | Requisito rector | Qué significa en la 2.0 |
|---|---|---|
| RR-12 | **Equipo garantizado: nadie pisa nombres, tareas ni trabajo, y todos saben quién lleva qué** | IDs y nombres de rama únicos aunque se creen a la vez; títulos duplicados detectados; una tarea solo la lleva una persona identificada por su usuario de la plataforma; las tareas abandonadas se liberan o reasignan con aviso; `start` avisa si otra tarea en curso toca los mismos ficheros; el roadmap y `status` muestran siempre el estado más reciente, con quién lleva cada tarea |

| ID | Tarea | Criterio de aceptación | Dep. |
|---|---|---|---|
| F2-4b | Nombres únicos: rama derivada del ID comprobada también contra el remoto; título duplicado o casi igual a otro abierto → aviso con la tarea parecida | Dos altas con el mismo título a la vez: IDs y ramas distintos y aviso de duplicado | F2-4 |
| F2-13 | Identidad de la persona: el «quién» de una tarea es el usuario de GitHub o GitLab autenticado, no un texto libre | Dos personas no pueden figurar con el mismo nombre; el agente figura como agente | F1-6, F2-6, F2-9 |
| F3-10 | Liberar y reasignar tareas: `taskctl liberar` y `taskctl reasignar`, aviso de tareas tomadas sin actividad en N días, con aviso a quien la tenía | Una tarea abandonada vuelve a «lista para empezar» sin perder su trabajo ni su rama | F3-6 |
| F3-11 | Aviso de solape: al tomar una tarea, `start` dice qué tareas en curso (y de quién) tocan los mismos ficheros o módulos según sus planes y ramas | Dos tareas que tocan el mismo módulo → aviso con nombres y tareas | F3-6, F4-1 |
| F3-5b | `status` y `roadmap` siempre frescos: traen la rama de estado antes de mostrar; dicen la hora de la última sincronización | Nadie ve un estado de hace horas sin saberlo | F3-5 |
| F9-4 (cambia) | E2E con **tres** personas a la vez: altas simultáneas, toma de la misma tarea, tareas que tocan los mismos ficheros, una tarea abandonada y reasignada | Ningún ID, rama ni tarea pisada; todos ven lo mismo | F2-4b, F2-13, F3-10, F3-11 |

Entradas para el import (F2-4b y F2-13 → sprint 2; F3-10, F3-11 y F3-5b → 3; F9-4 ya existe: actualizar su objetivo y criterios a mano):

```markdown
### F2-4b Nombres unicos de tarea y rama
> Nombres únicos: rama derivada del ID comprobada también contra el remoto; título duplicado o casi igual a otro abierto da aviso con la tarea parecida.
- Dos altas con el mismo titulo a la vez dan IDs y ramas distintos y aviso de duplicado
- Cumple lo que pide la tarea F2-4b del plan y los requisitos que cita

### F2-13 Identidad de la persona desde la plataforma
> Identidad de la persona: el «quién» de una tarea es el usuario de GitHub o GitLab autenticado, no un texto libre.
- Dos personas no pueden figurar con el mismo nombre
- El agente figura como agente
- Cumple lo que pide la tarea F2-13 del plan y los requisitos que cita

### F3-10 Liberar y reasignar tareas abandonadas
> Liberar y reasignar tareas: taskctl liberar y taskctl reasignar, aviso de tareas tomadas sin actividad en N días, con aviso a quien la tenía.
- Una tarea abandonada vuelve a lista para empezar sin perder su trabajo ni su rama
- Cumple lo que pide la tarea F3-10 del plan y los requisitos que cita

### F3-11 Aviso de solape entre tareas en curso
> Aviso de solape: al tomar una tarea, start dice qué tareas en curso (y de quién) tocan los mismos ficheros o módulos según sus planes y ramas.
- Dos tareas que tocan el mismo modulo dan aviso con nombres y tareas
- Cumple lo que pide la tarea F3-11 del plan y los requisitos que cita

### F3-5b status y roadmap siempre frescos
> status y roadmap siempre frescos: traen la rama de estado antes de mostrar y dicen la hora de la última sincronización.
- Nadie ve un estado de hace horas sin saberlo
- Cumple lo que pide la tarea F3-5b del plan y los requisitos que cita
```

Dependencias: F2-4b ← F2-4 · F2-13 ← F1-6, F2-6, F2-9 · F3-10 ← F3-6 ·
F3-11 ← F3-6, F4-1 · F3-5b ← F3-5 · F9-4 ← además F2-4b, F2-13, F3-10, F3-11.

## 5 quater. Métricas mientras se trabaja y métricas finales (RR-19)

> Decidido por Carlos el 2026-11-14: **imprescindible**. Lo que importa mientras
> se trabaja **no es un porcentaje**, sino **qué fases faltan y el tiempo
> estimado** de cada tarea, como información para el programador, **visible en
> el terminal de trabajo**. Y las métricas finales al cerrar.

Base en la 0.16: `taskctl estado [--seguir]`, la status line de Claude Code
(fase, paso, x/N, minutos) y la «Duración estimada» del plan. En el plan de la
2.0 era RF-61 con prioridad C: pasa a **I**.

| ID | Requisito rector | Qué significa en la 2.0 |
|---|---|---|
| RR-19 | **Progreso en vivo en el terminal: fases que faltan y tiempo estimado** | En todo momento, para la tarea en curso: fase actual, fases que faltan y tiempo estimado restante (por fase y total), recalculado con lo real; en un lote, además, tareas que faltan y hora estimada de fin. Se ve en la status line de Claude Code y en `taskctl status --seguir`, lo escribe el CLI (sin gastar tokens del agente). Al cerrar, resumen final: estimado frente a real por fase, tokens y rondas |

| ID | Tarea | Criterio de aceptación | Dep. |
|---|---|---|---|
| F1-17 | ADR: progreso en vivo y estimación (RR-19): modelo de estimación por fase (carril, complejidad, tamaño y tareas parecidas ya terminadas), cuándo se recalcula, dónde se muestra (status line, `status --seguir`, salida de cada comando) y cómo se hace sin tokens | Estimación probada contra las tareas terminadas de ToolsaWeb y OpenDockTrading, con su error medio | F1-9, F1-10 |
| F3-13 | Estimación por tarea al planificar: tiempo por fase, a partir de tareas parecidas; se recalcula al terminar cada fase | Cada tarea planificada tiene su estimación por fase; el error se mide | F1-17, F3-2 |
| F3-12 | Progreso en vivo en el terminal: fase actual, **fases que faltan** y **tiempo estimado restante** de la tarea, en la status line de Claude Code y en `taskctl status --seguir`, escrito por el CLI | Durante una tarea real se ven las fases que faltan y el tiempo restante, actualizados en cada fase, sin coste de tokens | F3-13, F2-3 |
| F4-9 | Progreso del lote: tarea actual, tareas que faltan, apartadas y hora estimada de fin del lote, en el mismo sitio | En un lote de 5 tareas se ve cuántas faltan y cuándo acabará | F4-7, F3-12 |
| F8-7 | Métricas finales al cerrar cada tarea y cada lote: estimado frente a real por fase, tokens, rondas y hallazgos, mostradas en el terminal y guardadas; calibración de las estimaciones en el informe por versión | `finish` termina con su resumen; el informe por versión da el error medio de la estimación | F8-1, F3-13 |

Entradas para el import (F1-17 → sprint 1; F3-13 y F3-12 → 3; F4-9 → 4; F8-7 → 8):

```markdown
### F1-17 ADR progreso en vivo y estimacion de tiempo
> ADR: progreso en vivo y estimación (RR-19): modelo de estimación por fase (carril, complejidad, tamaño y tareas parecidas), cuándo se recalcula, dónde se muestra y cómo se hace sin tokens.
- Estimacion probada contra las tareas terminadas de ToolsaWeb y OpenDockTrading, con su error medio
- Cumple lo que pide la tarea F1-17 del plan y los requisitos que cita

### F3-13 Estimacion por fase de cada tarea al planificar
> Estimación por tarea al planificar: tiempo por fase a partir de tareas parecidas; se recalcula al terminar cada fase.
- Cada tarea planificada tiene su estimacion por fase
- El error de la estimacion se mide
- Cumple lo que pide la tarea F3-13 del plan y los requisitos que cita

### F3-12 Progreso en vivo: fases que faltan y tiempo restante
> Progreso en vivo en el terminal: fase actual, fases que faltan y tiempo estimado restante de la tarea, en la status line de Claude Code y en taskctl status --seguir, escrito por el CLI.
- Durante una tarea real se ven las fases que faltan y el tiempo restante, actualizados en cada fase
- Sin coste de tokens del agente
- Cumple lo que pide la tarea F3-12 del plan y los requisitos que cita

### F4-9 Progreso del lote en el terminal
> Progreso del lote: tarea actual, tareas que faltan, apartadas y hora estimada de fin del lote.
- En un lote de 5 tareas se ve cuantas faltan y cuando acabara
- Cumple lo que pide la tarea F4-9 del plan y los requisitos que cita

### F8-7 Metricas finales de cada tarea y de cada lote
> Métricas finales al cerrar cada tarea y cada lote: estimado frente a real por fase, tokens, rondas y hallazgos, en el terminal y guardadas; calibración de las estimaciones en el informe por versión.
- finish termina con su resumen
- El informe por version da el error medio de la estimacion
- Cumple lo que pide la tarea F8-7 del plan y los requisitos que cita
```

Dependencias: F1-17 ← F1-9, F1-10 · F3-13 ← F1-17, F3-2 · F3-12 ← F3-13, F2-3 ·
F4-9 ← F4-7, F3-12 · F8-7 ← F8-1, F3-13.

## 5. H9: el último piloto es el propio TaskCodeTwo

> Decidido por Carlos el 2026-11-14. Se añade junto con lo anterior.

Orden de pilotos en H9: OpenDockTrading (F9-7) → ToolsaWeb (F9-8) →
**TaskCodeTwo (F9-8b)** → publicar 2.0.0 (F9-9). El relevo de F4-5 pasa
TaskCodeTwo a la 2.0 a mitad de camino, con lo que haya hasta H4; este último
piloto lo valida con la 2.0 completa (todas las fases) antes de publicar.

| ID | Tarea | Criterio de aceptación | Dep. |
|---|---|---|---|
| F9-8b | Piloto final: TaskCodeTwo actualizado a la 2.0 completa con `taskctl actualizar` y 10 tareas suyas trabajadas con ella, incluida al menos una en paralelo por dos personas o agentes | Sin pérdida de tareas ni historial; métricas frente a ToolsaWeb y OpenDockTrading; lo que falle bloquea la 2.0.0 | F9-8, F4-5 |

Cambio en F9-9: sus dependencias pasan a ser F9-6..8, F9-8b y F9-9a.

Entrada para el import (sprint 9):

```markdown
### F9-8b Piloto final: TaskCodeTwo con la 2.0 completa
> Piloto final: TaskCodeTwo actualizado a la 2.0 completa con taskctl actualizar y 10 tareas suyas trabajadas con ella, incluida al menos una en paralelo por dos personas o agentes.
- Sin perdida de tareas ni historial
- Metricas frente a ToolsaWeb y OpenDockTrading
- Lo que falle bloquea la 2.0.0
- Cumple lo que pide la tarea F9-8b del plan y los requisitos que cita
```
