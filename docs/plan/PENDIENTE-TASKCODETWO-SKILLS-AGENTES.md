# Pendiente de añadir a TaskCodeTwo: selección de skills, agentes y modelo

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
