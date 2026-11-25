# Plan — TASK-167: Regla 4D preventiva en los proyectos que usan el plugin

(Modo rapido, decision de Carlos del 2026-11-12: el plan lo redacta el
coordinador sin lanzar los roles ni el unificador. Las decisiones abiertas
se preguntaron a Carlos el 2026-11-25 y van abajo.)

## Enfoque propuesto

Duracion estimada: 45 min (parte a del troceo; la tarea entera estimaba 240 min)

Lo que ya existe y se reutiliza: la Regla 4D en revisoras, start y review
(TASK-137, 153, 158), la guia de disfraz en tests (`disfraz-tests.md`), el
detector de candidatos por NOMBRE (`core/candidatos-4d.ts`: extractor de
definiciones por lenguaje y `git grep`), y la columna de hallazgos 4D por
tarea en `taskctl metricas` (TASK-153c). Lo que falta es lo que las dos
auditorias de TaskCode encontraron una y otra vez y nada del plugin evita en
otro proyecto: duplicacion de grano fino con otro nombre, sin forma de medir
si un proyecto mejora.

## Decisiones de Carlos (2026-11-25)

- El detector por cuerpo **avisa, no bloquea**: aviso en `taskctl review` antes de abrir la ronda y entrada en la peticion para que el revisor lo compruebe.
- Lenguajes: **los que ya extrae candidatos-4d** (TS/JS, Rust, Python, Java/Kotlin, C#, bash), comparando tokens normalizados, sin parser por lenguaje.
- La auditoria 4D invocable deja **informe y, si la persona lo pide, una tarea por ola** con `taskctl new`.
- Metricas: **por tarea (ya existe) y la serie entre auditorias**.

## Reutilizacion (Regla 4D)

- `core/candidatos-4d.ts` (`PATRONES_DEFINICION`, `EXTENSIONES_CODIGO`, `PATRON_GREP_DEFINICION`) — el detector por cuerpo usa el mismo extractor de definiciones; no se escribe otro.
- `SECCION_CANDIDATOS_4D` y su render en la peticion de `review` — los pares por cuerpo se anaden ahi.
- `informe-revision.ts` (lectura de `## Regla 4D`) y la columna 4D de `metricas.ts` — base de la serie por auditoria.
- `skills/task-workflow/disfraz-tests.md` — modelo de la guia nueva de duplicacion.
- `taskctl new` — las tareas por ola de la auditoria.
- Nuevo: el modulo de parecido por cuerpo (no hay nada que compare cuerpos) y la skill de auditoria (no hay ninguna).

## Troceo

### Parte a: guia instalable de duplicacion de grano fino
`skills/task-workflow/duplicacion.md` con los patrones que las auditorias
encontraron (helpers copiados, lectores de secciones o vallas repetidos,
envoltorios de git o fs duplicados, catalogos y listas escritos dos veces,
reglas copiadas entre documentos), sin mencionar TaskCode; start, review,
revision.md y las revisoras remiten a ella.
Duracion estimada: 45 min
- [ ] Hay una guia instalable de duplicacion de grano fino (helpers copiados, lectores de secciones repetidos, envoltorios de git o fs duplicados, catalogos escritos dos veces) sacada de las auditorias 4D, y start, review y las revisoras remiten a ella
- [ ] Un test falla si la guia deja de instalarse o alguien deja de remitir a ella

### Parte b: detector de duplicados por cuerpo en el diff
Modulo puro que, para cada definicion nueva o cambiada del diff, compara su
cuerpo (tokens normalizados: sin comentarios, identificadores y literales
genericos) con las definiciones existentes del proyecto y da los pares por
encima de un umbral. `taskctl review` lo avisa antes de abrir la ronda y lo
anade a `## Candidatos 4D` de la peticion. Avisa, no bloquea.
Duracion estimada: 70 min
- [ ] Al escribir codigo, taskctl detecta en el diff funciones casi identicas a otras ya existentes del proyecto y lo avisa antes de pedir revision, no solo como candidato para el revisor
- [ ] Un test falla si el detector deja de encontrar un duplicado real con otro nombre, o si da por duplicadas dos funciones distintas

### Parte c: auditoria 4D invocable
Skill `auditoria-4d` (y su paso en task-workflow) que lanza agentes de
solo lectura por zona del proyecto, consolida los hallazgos por D y
severidad en `docs/auditoria-4d-<fecha>.md` con plan por olas, y, si la
persona lo pide, crea una tarea por ola con `taskctl new`.
Duracion estimada: 60 min
- [ ] Hay una auditoria 4D invocable para el proyecto que produce hallazgos clasificados por D y un plan de correccion por olas
- [ ] Un test falla si la skill pierde el formato del informe o la creacion de tareas por ola

### Parte d: tendencia de hallazgos 4D en las metricas
`taskctl metricas` lee los informes de auditoria (`docs/auditoria-4d-*.md`)
y muestra la serie por D entre auditorias, ademas de lo que ya da por tarea.
Duracion estimada: 45 min
- [ ] taskctl metricas muestra la tendencia de hallazgos 4D por proyecto entre auditorias y por tarea
- [ ] Un test por pieza falla si deja de instalarse o de comprobar lo suyo

Troceo sin preguntar: autorizado por Carlos (2026-11-22 y 2026-11-25).

## Desacuerdos entre roles, y como se resuelven

Sin roles (modo rapido).

## Riesgos aceptados y que los contiene

- Falsos positivos del detector por cuerpo (getters triviales, envoltorios de una linea) — umbral y tamano minimo de cuerpo; es un aviso y el revisor decide.
- Coste en proyectos grandes — comparacion acotada: solo definiciones del diff contra las existentes con indice por longitud, como candidatos-4d.
- Textos instalables — sin TaskCode ni sus rutas (`skills/task-workflow.test`), y topes de tamano de skills sin subir.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- a: 1-2 tests de skills (la guia existe con sus patrones; start, review, revision.md y revisoras remiten).
- b: 3 tests: core del parecido (duplicado renombrado si, funciones distintas no, cuerpo minimo), y `review` contra un repo temporal (aviso y entrada en la peticion).
- c: 1-2 tests de la skill (formato del informe, tareas por ola) y, si hay comando de registro, su test contra un repo temporal.
- d: 1-2 tests de metricas contra informes de auditoria en un repo temporal.

## Lo que necesita decision de una persona

Resuelto arriba (decisiones de Carlos del 2026-11-25).

## Troceo aceptado

Troceo aceptado por una persona el 2026-11-25: TASK-167a, TASK-167b, TASK-167c, TASK-167d, todas en la misma rama. Este plan es el de TASK-167a; las demas partes se planifican al empezarlas.
