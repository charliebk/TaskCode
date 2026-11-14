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
