# Peticion de revision — TASK-022 (ronda 1)

- Tarea: TASK-022 — Documentación de equipo e incorporación de colaboradores
- Rama revisada: feature/task-022-documentacion-de-equipo-e-incorporacion
- Rama base: develop
- Commit revisado (HEAD): 0a23463871d64b8aa9fc2bfc27a56f9d2d10dc1f
- Fecha: 2026-09-16
- Agente revisor sugerido: code-quality-reviewer

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Commits a revisar (git log develop..HEAD)

````
0a23463 feat(TASK-022): guia de incorporacion de colaboradores
8e42085 chore(TASK-022): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/README.md b/README.md
index b24bf5e..914f819 100644
--- a/README.md
+++ b/README.md
@@ -66,6 +66,7 @@ rama solo si no hay nada que perder.
 | [`docs/PLAN_SPRINTS.md`](docs/PLAN_SPRINTS.md) | Plan de ejecución por sprints + métricas reales por tarea. |
 | [`docs/contexto/CHECKLIST_TERMINACION.md`](docs/contexto/CHECKLIST_TERMINACION.md) | **Documento vivo**: qué falta, por fases, con casillas marcables. |
 | [`docs/contexto/INVENTARIO_PENDIENTE.md`](docs/contexto/INVENTARIO_PENDIENTE.md) | Los huecos que ninguna tarea del plan cubría. |
+| [`docs/contexto/INCORPORACION.md`](docs/contexto/INCORPORACION.md) | Guía para incorporar a un nuevo colaborador: acceso, instalación, primera tarea. |
 | [`docs/METRICAS.md`](docs/METRICAS.md) | Cobertura, tests y hallazgos de revisión por pares, tarea a tarea. |
 | [`docs/spikes/`](docs/spikes/) | Resultados de spikes de validación. |
 | [`docs/contexto/`](docs/contexto/) | **Empieza por aquí**: estado, convenciones y hallazgos acumulados. |
diff --git a/docs/contexto/CHECKLIST_TERMINACION.md b/docs/contexto/CHECKLIST_TERMINACION.md
index 0da1a39..1f93183 100644
--- a/docs/contexto/CHECKLIST_TERMINACION.md
+++ b/docs/contexto/CHECKLIST_TERMINACION.md
@@ -464,9 +464,14 @@ sin la red que impide deshacerla — de ahí salieron **siete aserciones que no
 podían fallar**, incluida la que exigía «reproducir empíricamente» y se
 satisfacía con una etiqueta que otro test obliga a estar presente.*
 
-## Fase E — Cierre (2/6) · ~9h
+## Fase E — Cierre (4/6) · ~9h
 
 - [ ] **E1** · TASK-022 — Documentación de equipo + invitar colaboradores — ~2h
+      *En curso: `docs/contexto/INCORPORACION.md` ya escrito y enlazado
+      desde `README.md` y este índice; queda la revisión por pares y
+      `taskctl finish` antes de marcar esta casilla, según la convención de
+      este documento (casilla solo al cerrar el trabajo real, mergeado a
+      `develop`).*
 - [ ] **E2** · TASK-023 — Métricas de coste en tokens por fase (§16) — ~5h
 - [x] **E3** · Validación en Windows nativo — **resuelta por el CI, no por una sesión nativa**
       *El job `windows-latest` asevera cada hipótesis como un step propio.
diff --git a/docs/contexto/INCORPORACION.md b/docs/contexto/INCORPORACION.md
new file mode 100644
index 0000000..fa4139a
--- /dev/null
+++ b/docs/contexto/INCORPORACION.md
@@ -0,0 +1,76 @@
+# Incorporación de nuevos colaboradores
+
+> Guía de referencia para cuando se incorpore alguien al equipo. **A día de
+> hoy no hay colaboradores que invitar** — el repo `charliebk/TaskCode`
+> (privado) solo tiene un colaborador, el propio dueño (decisión de Carlos,
+> 2026-09-13). Esto no es un olvido: es una decisión tomada y documentada —
+> ver el cierre del punto 8 de la sección 14 en
+> [`CHECKLIST_TERMINACION.md`](CHECKLIST_TERMINACION.md). Esta guía queda
+> lista para cuando de verdad haga falta.
+
+Sigue estos tres pasos en orden: acceso, instalación, primera tarea. Si algo
+falla, no sigas al paso siguiente — cada uno depende del anterior.
+
+## 1. Acceso al repo
+
+El marketplace (`taskcode-marketplace`) vive en el mismo repo privado
+`charliebk/TaskCode` que el propio proyecto. El dueño te da acceso de
+lectura como colaborador en GitHub. Sin eso, ningún paso siguiente funciona:
+el repo es privado y `/plugin marketplace add` clona por HTTPS/SSH con tus
+credenciales de Git/GitHub ya configuradas (SSH o `gh`), no con un token
+aparte.
+
+## 2. Instalar el plugin
+
+Dentro de una sesión de Claude Code, dos comandos (ver
+[`README.md`](../../README.md)):
+
+```
+/plugin marketplace add charliebk/TaskCode
+/plugin install taskcode-plugin@taskcode-marketplace
+```
+
+Verifica que `taskctl` responde:
+
+```bash
+taskctl --version
+```
+
+**Camino probado**: `taskctl` funciona como comando dentro de una sesión de
+Claude Code con el plugin instalado — es lo único que este proyecto ha
+confirmado en la práctica (`CHECKLIST_TERMINACION.md`, E6). Si `--version`
+no responde a la primera, sigue el orden de diagnóstico de
+`skills/task-workflow/SKILL.md` (reiniciar sesión antes que sospechar del
+plugin). Que funcione además como comando suelto en una terminal normal
+fuera de una sesión (PATH del sistema) es un punto que este proyecto deja
+**pendiente de confirmar** (E6, AC7 "a medias") — no lo den por hecho ni lo
+prometan a quien se incorpore.
+
+## 3. Entender el ciclo de vida
+
+No se duplica aquí: el ciclo completo, sus cinco estados y sus comandos
+están en [`skills/task-workflow/SKILL.md`](../../taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md)
+(se carga solo con el plugin instalado) y en la sección 13 de
+[`PROPUESTA_METODOLOGIA.md`](../PROPUESTA_METODOLOGIA.md) ("Flujo diario
+para un integrante del equipo"). Antes de tocar nada, lee también
+[`README.md`](README.md) de esta carpeta — el orden de lectura recomendado
+para cualquiera que abra el repo por primera vez.
+
+## 4. Hacer tu primera tarea
+
+Sigue el flujo diario de la sección 13 de `PROPUESTA_METODOLOGIA.md` tal
+cual, sin pasos implícitos:
+
+1. `taskctl board` — ver qué hay planificado.
+2. `taskctl plan TASK-NNN` — mueve la tarea a diseño, dispara el brainstorm.
+3. Revisar `plan-final.md` que deja el brainstorm.
+4. `taskctl approve TASK-NNN` — **checkpoint humano**, lo ejecuta siempre una
+   persona, nunca un agente.
+5. `taskctl start TASK-NNN` — crea la rama y mueve la tarea a en curso.
+6. Implementar.
+7. `taskctl review TASK-NNN` — revisión por pares, agente independiente.
+8. `taskctl finish TASK-NNN` — mergea y cierra.
+
+Revisión por pares obligatoria: ninguna tarea se cierra sin que otro agente
+la haya revisado empíricamente (reproduciendo, no solo leyendo el diff) —
+ver [`CONVENCIONES.md`](CONVENCIONES.md).
diff --git a/docs/contexto/README.md b/docs/contexto/README.md
index 94d9db0..bf490a1 100644
--- a/docs/contexto/README.md
+++ b/docs/contexto/README.md
@@ -10,6 +10,7 @@ Empieza por aquí si acabas de abrir el repo. Orden de lectura:
 | 4 | [`HALLAZGOS.md`](HALLAZGOS.md) | Las trampas que ya costaron tiempo y los patrones que merece la pena repetir. |
 | 5 | [`INVENTARIO_PENDIENTE.md`](INVENTARIO_PENDIENTE.md) | De dónde salieron esas 40 casillas: los huecos que ninguna tarea del plan cubría. |
 | — | [`PROMPT_INICIAL.md`](PROMPT_INICIAL.md) | Prompt listo para pegar al abrir una sesión nueva. |
+| — | [`INCORPORACION.md`](INCORPORACION.md) | Guía para incorporar a un nuevo colaborador al equipo. |
 
 Fuera de esta carpeta, lo que importa:
 
diff --git a/tareas/01-en-diseno/TASK-022/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md b/tareas/02-en-curso/TASK-022/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-022/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md
rename to tareas/02-en-curso/TASK-022/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md
diff --git a/tareas/01-en-diseno/TASK-022/planificacion/brainstorm/peticion-unificador-1.md b/tareas/02-en-curso/TASK-022/planificacion/brainstorm/peticion-unificador-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-022/planificacion/brainstorm/peticion-unificador-1.md
rename to tareas/02-en-curso/TASK-022/planificacion/brainstorm/peticion-unificador-1.md
diff --git a/tareas/01-en-diseno/TASK-022/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md b/tareas/02-en-curso/TASK-022/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-022/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md
rename to tareas/02-en-curso/TASK-022/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md
diff --git a/tareas/01-en-diseno/TASK-022/planificacion/plan-final.md b/tareas/02-en-curso/TASK-022/planificacion/plan-final.md
similarity index 100%
rename from tareas/01-en-diseno/TASK-022/planificacion/plan-final.md
rename to tareas/02-en-curso/TASK-022/planificacion/plan-final.md
diff --git a/tareas/01-en-diseno/TASK-022/tarea.md b/tareas/02-en-curso/TASK-022/tarea.md
similarity index 87%
rename from tareas/01-en-diseno/TASK-022/tarea.md
rename to tareas/02-en-curso/TASK-022/tarea.md
index ad4b7aa..fbccedb 100644
--- a/tareas/01-en-diseno/TASK-022/tarea.md
+++ b/tareas/02-en-curso/TASK-022/tarea.md
@@ -6,7 +6,7 @@ sprint: 4
 etiquetas: []
 complejidad: simple
 modelo_sugerido: sonnet
-estado: en-diseno
+estado: en-curso
 plan_aprobado: true
 rama: feature/task-022-documentacion-de-equipo-e-incorporacion
 asignado_a: charlie.bk@gmail.com
@@ -32,6 +32,6 @@ lista la guía de incorporación (para cuando haga falta) y en documentar
 esa decisión, en vez de ejecutar invitaciones que no hacen falta hoy.
 
 ## Criterios de aceptacion
-- [ ] Guía de incorporación que un integrante nuevo pueda seguir sin ayuda: instalar el plugin, entender el ciclo de vida y hacer su primera tarea.
-- [ ] Sin colaboradores que invitar por ahora (decisión de Carlos, 2026-09-13); la guía queda lista para cuando se incorpore alguien, sin ejecutar ninguna invitación real.
-- [ ] Deja resuelto el punto 8 de la sección 14 en lo que respecta a a quién se invita: documentado que, a día de hoy, no hay nadie que invitar.
+- [x] Guía de incorporación que un integrante nuevo pueda seguir sin ayuda: instalar el plugin, entender el ciclo de vida y hacer su primera tarea.
+- [x] Sin colaboradores que invitar por ahora (decisión de Carlos, 2026-09-13); la guía queda lista para cuando se incorpore alguien, sin ejecutar ninguna invitación real.
+- [x] Deja resuelto el punto 8 de la sección 14 en lo que respecta a a quién se invita: documentado que, a día de hoy, no hay nadie que invitar.
````
