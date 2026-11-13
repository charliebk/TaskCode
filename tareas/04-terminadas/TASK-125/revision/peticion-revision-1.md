# Peticion de revision — TASK-125 (ronda 1)

- Tarea: TASK-125 — Freno Stop con presupuesto de tiempo y clave propia: si se pasa, anota y no bloquea
- Rama revisada: feature/task-125-freno-stop-con-presupuesto-de-tiempo-y-c
- Rama base: develop
- Commit revisado (HEAD): 8cde3133c9bd024e7207c690a7698d7c2e1bcda4
- Fecha: 2026-11-13
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-125 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo (salvo que esta
peticion ya traiga la verificacion de la ronda en verde para el commit revisado;
entonces vale ese resultado) y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-125/tarea.md
- tareas/03-en-revision/TASK-125/planificacion/
- docs/contexto/CHECKLIST_TERMINACION.md
- docs/contexto/archivo/CHECKLIST-fases-cerradas.md
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
- taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
- taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/config-freno.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-presupuesto.test.ts

## Commits a revisar (git log develop..HEAD)

````
8cde313 feat(TASK-125): comando y presupuesto propios del freno Stop, excedido sin bloquear y puertas en doctor
31a5540 chore(TASK-125): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/docs/contexto/CHECKLIST_TERMINACION.md b/docs/contexto/CHECKLIST_TERMINACION.md
index 18615ed..7269e2b 100644
--- a/docs/contexto/CHECKLIST_TERMINACION.md
+++ b/docs/contexto/CHECKLIST_TERMINACION.md
@@ -56,74 +56,14 @@ Ninguna abierta. Las resueltas, con su razonamiento, en el archivo.
 
 ---
 
-## ✅ P — Agilidad sin perder calidad (28/28)
+## ✅ P — Agilidad sin perder calidad (32/32)
 
 Pedidas por Carlos el 2026-11-10 desde ToolsaWeb (TASK-295), donde la 0.13 ha
 hecho perder agilidad: la verificación completa se repite por causas que no son
 del código.
 
-- [x] TASK-092 — Sincronización de ficheros sueltos de la raíz de tareas/ — cerrada el 2026-11-10
-      *`rutas_sincronizacion` admite un fichero directamente en `tareas/` (p. ej.
-      `tareas/ROADMAP.md`), que se regenera en el commit de cada transición; siguen
-      cerradas las carpetas de estado, cualquier subcarpeta, `.taskcode/` y `.git/`,
-      ahora sin distinguir mayúsculas ni puntos/espacios finales. `informe_cobertura`
-      no cambia. Cambió la expectativa del caso `tareas/x.md` (aprobado por la
-      persona en el plan). 1 ronda, aprobada sin hallazgos, 7 mutantes detectados.
-      Pendiente de publicar en 0.14.0.*
-- [x] TASK-095 — Revisión que converge: desde la ronda 2 solo se verifican las correcciones — cerrada el 2026-11-10
-      *Corrige la regla de TASK-083 (un IMPORTANTE en cualquier estado, también corregido,
-      relanzaba una ronda completa desde la base: hasta 14 rondas). Desde la ronda 2 la
-      ronda es acotada: cada revisor verifica sus pendientes (todo salvo aceptado), los
-      dominios que toca la corrección también la ven, y solo se abren hallazgos nuevos
-      CRÍTICOS o causados por la corrección; completa solo con --completa, sin commit
-      revisado fiable o con informes ilegibles. Tope: siguiente pregunta en cualquier modo
-      y review exige --ronda-extra para la ronda 4. No se retira ningún revisor. 2 rondas:
-      6 MENOR en la 1 (MEN-4 y parte de MEN-5 aceptados), aprobada en la 2. Pendiente de
-      publicar en 0.14.0.*
-- [x] TASK-097 — Regla de una hora: plan estima la duración de punta a punta y propone trocear — cerrada el 2026-11-10
-- [x] TASK-098 — ROADMAP de tareas generado por taskctl en todos los proyectos, sin pisar los existentes — cerrada el 2026-11-10
-- [x] TASK-100 — Verificación proporcional A1: finish no corre la suite si la tarea solo cambia documentación — cerrada el 2026-11-10
-- [x] TASK-101 — Verificación proporcional A2: el guardián de merges — cerrada el 2026-11-10
-- [x] TASK-102 — Verificación proporcional A3a: el freno Stop no corre la suite si solo cambia documentación — cerrada el 2026-11-11
-- [x] TASK-104 — Verificación proporcional A3b: las rondas de review no corren la suite si solo cambia documentación — cerrada el 2026-11-11
-- [x] TASK-103 — Guardián de merges: config inválida bloquea y merges que hoy no detecta — cerrada el 2026-11-11
-- [x] TASK-096 — Verificación proporcional B1: clave `rutas_verificacion_parcial` y decisión `selectiva` en core — cerrada el 2026-11-11
-      *Troceada en el plan por la regla de una hora (270 min; decisión de Carlos): B1 es esta, el
-      resto son TASK-105 a TASK-109. Clave opt-in leída de la base (lista de rutas permitidas, exige
-      la selectiva) y tercer resultado de la decisión pura; nada observable cambia todavía. Decisión
-      sobre TASK-091 escrita en el plan: la completa sigue por defecto y el guardián no acepta la
-      selectiva para código. 2 rondas: 3 MENOR en la 1, corregidos; aprobada en la 2. No se publica
-      versión hasta cerrar TASK-109.*
-- [x] TASK-105 — Verificación proporcional B2: decisión entre refs y huella para el nivel 2 — cerrada el 2026-11-11
-      *La decisión entre refs calcula fueraDeParcial con un git diff extra (solo la lista excluida, SHA
-      fijados antes) cuando la base declara la clave y hay código; sin ella, cero procesos de más.
-      huellaDeCommit acepta contexto y comparte cabecera con huellaDelArbol. Decisiones de Carlos: el memo
-      selectiva no se guarda con el árbol sucio (el Stop sucio la repite; medir en ToolsaWeb antes de B3),
-      se mantiene la salida temprana sin rutas_documentacion, y el guardián y finish tratan selectiva como
-      completa con motivo neutro (cierra el hueco del guardián). 1 ronda: aprobada, 2 MENOR aceptados.*
-- [x] TASK-106 — Verificación proporcional B3: finish verifica solo lo afectado con código parcial — cerrada el 2026-11-11
-      *Con rutas_verificacion_parcial en la base y todo el código dentro, finish corre la selectiva (RAMA_BASE,
-      su timeout) en vez de la completa, lo dice y lo anota tras el verde en «Verificacion parcial». Decisiones
-      de Carlos: reutiliza solo un memo selectivo verde del mismo commit (excepción acotada a TASK-072), el hotfix
-      nunca usa la selectiva pero conserva su camino de documentación, una sola tarea de ~70 min. Cobertura
-      omitida en el nivel 2; release a la completa. 2 rondas: IMP-1 y 3 MENOR corregidos, ronda 2 aprobada.*
-- [x] TASK-107 — Verificación proporcional B4: Stop, review y finish deciden igual el mismo diff — cerrada el 2026-11-11
-      *Solo tests: una tabla (documentación, parcial, transversal) × (Stop, review, finish) con el vector absoluto
-      de ejecuciones por celda, 9 repos reales (decisión de Carlos). Sin divergencia: producción intacta. Stop y
-      review corren la selectiva ante lo transversal y finish la completa (divergencia acordada, fijada en la tabla).
-      4 mutantes propios y 4 del revisor, cada uno rojo en su celda. 1 ronda: aprobada, 2 MENOR aceptados.*
-- [x] TASK-108 — Verificación proporcional B5: el guardián de merges ante el nivel 2 — cerrada el 2026-11-11
-      *D1 ya estaba en el código desde TASK-105: con código el guardián exige siempre la completa y nunca lee el
-      memo selectivo. La tarea lo fija con 6 tests y añade al bloqueo una línea que dice qué hace falta y cómo
-      integrar (finish, nunca «corre la completa y repite»); release y hotfix sin ella. Decisiones de Carlos: el
-      criterio 2 acotado a la decisión 6b, el corte por tiempo a una tarea aparte. 2 rondas: 2 MENOR corregidos,
-      1 aceptado, ronda 2 aprobada.*
-- [x] TASK-109 — Verificación proporcional B6: documentación y limpieza del nivel 2 — cerrada el 2026-11-12
-      *Cierra TASK-096. Guía, SKILL.md, README y CHANGELOG explican el nivel 2 (prueba de contrato que se pone
-      roja si se borra la sección); ejemplo propio por clave en el error de config; doctor avisa si
-      rutas_verificacion_parcial no tiene efecto. Inventario: nada que borrar. 2 rondas: IMP-1 (la cobertura no
-      se mide en el release) e IMP-2 (tras un conflicto, cerrarlo en develop deja un finish que no verifica,
-      también en el mensaje del guardián) corregidos, ronda 2 aprobada.*
+- TASK-092 a TASK-109 (15 items, todos cerrados): archivados el 2026-11-13 en
+  [`archivo/CHECKLIST-fases-cerradas.md`](archivo/CHECKLIST-fases-cerradas.md#p--primera-parte-task-092-a-task-109) por el tope de tamano.
 - [x] TASK-110 — Progreso visible sin tokens: estado de cada fase en el terminal — cerrada el 2026-11-12
       *Fichero de progreso bajo .git/taskcode/, `taskctl estado` (via rapida, 143 ms), status line instalable por
       doctor en el settings.json de usuario (con el taskctl de la cache si no esta en el PATH, y solo si entiende
diff --git a/docs/contexto/archivo/CHECKLIST-fases-cerradas.md b/docs/contexto/archivo/CHECKLIST-fases-cerradas.md
index e563d27..0984ad2 100644
--- a/docs/contexto/archivo/CHECKLIST-fases-cerradas.md
+++ b/docs/contexto/archivo/CHECKLIST-fases-cerradas.md
@@ -1084,3 +1084,71 @@ tarda unos 40 minutos y se repetía en cada ronda de revisión.
       por la misma frase del mensaje de `review` (describía un momento, no un
       estado); MEN-1 de la ronda 5 aceptado. Publicada en 0.13.0.*
 
+
+## P — primera parte (TASK-092 a TASK-109)
+
+> Movido tal cual el 2026-11-13 (TASK-125) desde el checklist vivo, que pasaba
+> de su tope de 20 KB. La fase P sigue abierta alli.
+
+- [x] TASK-092 — Sincronización de ficheros sueltos de la raíz de tareas/ — cerrada el 2026-11-10
+      *`rutas_sincronizacion` admite un fichero directamente en `tareas/` (p. ej.
+      `tareas/ROADMAP.md`), que se regenera en el commit de cada transición; siguen
+      cerradas las carpetas de estado, cualquier subcarpeta, `.taskcode/` y `.git/`,
+      ahora sin distinguir mayúsculas ni puntos/espacios finales. `informe_cobertura`
+      no cambia. Cambió la expectativa del caso `tareas/x.md` (aprobado por la
+      persona en el plan). 1 ronda, aprobada sin hallazgos, 7 mutantes detectados.
+      Pendiente de publicar en 0.14.0.*
+- [x] TASK-095 — Revisión que converge: desde la ronda 2 solo se verifican las correcciones — cerrada el 2026-11-10
+      *Corrige la regla de TASK-083 (un IMPORTANTE en cualquier estado, también corregido,
+      relanzaba una ronda completa desde la base: hasta 14 rondas). Desde la ronda 2 la
+      ronda es acotada: cada revisor verifica sus pendientes (todo salvo aceptado), los
+      dominios que toca la corrección también la ven, y solo se abren hallazgos nuevos
+      CRÍTICOS o causados por la corrección; completa solo con --completa, sin commit
+      revisado fiable o con informes ilegibles. Tope: siguiente pregunta en cualquier modo
+      y review exige --ronda-extra para la ronda 4. No se retira ningún revisor. 2 rondas:
+      6 MENOR en la 1 (MEN-4 y parte de MEN-5 aceptados), aprobada en la 2. Pendiente de
+      publicar en 0.14.0.*
+- [x] TASK-097 — Regla de una hora: plan estima la duración de punta a punta y propone trocear — cerrada el 2026-11-10
+- [x] TASK-098 — ROADMAP de tareas generado por taskctl en todos los proyectos, sin pisar los existentes — cerrada el 2026-11-10
+- [x] TASK-100 — Verificación proporcional A1: finish no corre la suite si la tarea solo cambia documentación — cerrada el 2026-11-10
+- [x] TASK-101 — Verificación proporcional A2: el guardián de merges — cerrada el 2026-11-10
+- [x] TASK-102 — Verificación proporcional A3a: el freno Stop no corre la suite si solo cambia documentación — cerrada el 2026-11-11
+- [x] TASK-104 — Verificación proporcional A3b: las rondas de review no corren la suite si solo cambia documentación — cerrada el 2026-11-11
+- [x] TASK-103 — Guardián de merges: config inválida bloquea y merges que hoy no detecta — cerrada el 2026-11-11
+- [x] TASK-096 — Verificación proporcional B1: clave `rutas_verificacion_parcial` y decisión `selectiva` en core — cerrada el 2026-11-11
+      *Troceada en el plan por la regla de una hora (270 min; decisión de Carlos): B1 es esta, el
+      resto son TASK-105 a TASK-109. Clave opt-in leída de la base (lista de rutas permitidas, exige
+      la selectiva) y tercer resultado de la decisión pura; nada observable cambia todavía. Decisión
+      sobre TASK-091 escrita en el plan: la completa sigue por defecto y el guardián no acepta la
+      selectiva para código. 2 rondas: 3 MENOR en la 1, corregidos; aprobada en la 2. No se publica
+      versión hasta cerrar TASK-109.*
+- [x] TASK-105 — Verificación proporcional B2: decisión entre refs y huella para el nivel 2 — cerrada el 2026-11-11
+      *La decisión entre refs calcula fueraDeParcial con un git diff extra (solo la lista excluida, SHA
+      fijados antes) cuando la base declara la clave y hay código; sin ella, cero procesos de más.
+      huellaDeCommit acepta contexto y comparte cabecera con huellaDelArbol. Decisiones de Carlos: el memo
+      selectiva no se guarda con el árbol sucio (el Stop sucio la repite; medir en ToolsaWeb antes de B3),
+      se mantiene la salida temprana sin rutas_documentacion, y el guardián y finish tratan selectiva como
+      completa con motivo neutro (cierra el hueco del guardián). 1 ronda: aprobada, 2 MENOR aceptados.*
+- [x] TASK-106 — Verificación proporcional B3: finish verifica solo lo afectado con código parcial — cerrada el 2026-11-11
+      *Con rutas_verificacion_parcial en la base y todo el código dentro, finish corre la selectiva (RAMA_BASE,
+      su timeout) en vez de la completa, lo dice y lo anota tras el verde en «Verificacion parcial». Decisiones
+      de Carlos: reutiliza solo un memo selectivo verde del mismo commit (excepción acotada a TASK-072), el hotfix
+      nunca usa la selectiva pero conserva su camino de documentación, una sola tarea de ~70 min. Cobertura
+      omitida en el nivel 2; release a la completa. 2 rondas: IMP-1 y 3 MENOR corregidos, ronda 2 aprobada.*
+- [x] TASK-107 — Verificación proporcional B4: Stop, review y finish deciden igual el mismo diff — cerrada el 2026-11-11
+      *Solo tests: una tabla (documentación, parcial, transversal) × (Stop, review, finish) con el vector absoluto
+      de ejecuciones por celda, 9 repos reales (decisión de Carlos). Sin divergencia: producción intacta. Stop y
+      review corren la selectiva ante lo transversal y finish la completa (divergencia acordada, fijada en la tabla).
+      4 mutantes propios y 4 del revisor, cada uno rojo en su celda. 1 ronda: aprobada, 2 MENOR aceptados.*
+- [x] TASK-108 — Verificación proporcional B5: el guardián de merges ante el nivel 2 — cerrada el 2026-11-11
+      *D1 ya estaba en el código desde TASK-105: con código el guardián exige siempre la completa y nunca lee el
+      memo selectivo. La tarea lo fija con 6 tests y añade al bloqueo una línea que dice qué hace falta y cómo
+      integrar (finish, nunca «corre la completa y repite»); release y hotfix sin ella. Decisiones de Carlos: el
+      criterio 2 acotado a la decisión 6b, el corte por tiempo a una tarea aparte. 2 rondas: 2 MENOR corregidos,
+      1 aceptado, ronda 2 aprobada.*
+- [x] TASK-109 — Verificación proporcional B6: documentación y limpieza del nivel 2 — cerrada el 2026-11-12
+      *Cierra TASK-096. Guía, SKILL.md, README y CHANGELOG explican el nivel 2 (prueba de contrato que se pone
+      roja si se borra la sección); ejemplo propio por clave en el error de config; doctor avisa si
+      rutas_verificacion_parcial no tiene efecto. Inventario: nada que borrar. 2 rondas: IMP-1 (la cobertura no
+      se mide en el release) e IMP-2 (tras un conflicto, cerrarlo en develop deja un finish que no verifica,
+      también en el mensaje del guardián) corregidos, ronda 2 aprobada.*
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 8a277ba..f7b83e3 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -235,6 +235,7 @@ La referencia detallada vive en `docs/`, un fichero por tema:
     - [Tareas de solo documentación: `rutas_documentacion`](docs/configuracion.md#tareas-de-solo-documentación-rutas_documentacion)
     - [Código parcial: `rutas_verificacion_parcial`](docs/configuracion.md#código-parcial-rutas_verificacion_parcial)
     - [Freno de fin de turno (hook `Stop`)](docs/configuracion.md#freno-de-fin-de-turno-hook-stop)
+    - [Comando y presupuesto propios del freno: `comando_verificacion_freno`](docs/configuracion.md#comando-y-presupuesto-propios-del-freno-comando_verificacion_freno)
     - [Coste de implementación automático (hooks `Stop` y `SubagentStop`)](docs/configuracion.md#coste-de-implementación-automático-hooks-stop-y-subagentstop)
     - [Puerta de verificación en `finish`](docs/configuracion.md#puerta-de-verificación-en-finish)
     - [Tests held-out (`aceptacion/`)](docs/configuracion.md#tests-held-out-aceptacion)
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
index a9fc5b7..f1bb9f5 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md
@@ -204,6 +204,45 @@ caso sale 0 sin lanzar ningún proceso (ni `git`). Cuando actúa:
   `comando_verificacion` de la config.
 - Los subagentes no disparan `Stop` (disparan `SubagentStop`), así que el freno
   no los frena; y no actúa si la persona interrumpe el turno (Esc).
+- **Registro**: cada vez que decide verificar anota una línea en el registro
+  de puertas (puerta `freno`: `verde`, `rojo`, `omitido` o `excedido`) y no
+  vuelve a verificar si la huella del árbol es la de su último verde, también
+  con cambios sin commitear. Ver [registro-puertas.md](registro-puertas.md).
+
+#### Comando y presupuesto propios del freno: `comando_verificacion_freno`
+
+Cada puerta corre su propio comando, así que el freno de fin de turno puede ser
+más rápido sin abaratar la verificación de las rondas ni la de `finish`:
+
+| Puerta | Comando |
+|---|---|
+| Freno de fin de turno (`Stop`) | `comando_verificacion_freno`; sin ella, `comando_verificacion_selectiva`; sin ella, `comando_verificacion` |
+| Rondas de `taskctl review` | `comando_verificacion_selectiva` (sin ella, no verifica) |
+| `taskctl finish` y guardián | `comando_verificacion` (o la selectiva con `rutas_verificacion_parcial`) |
+
+```yaml
+comando_verificacion: "npm test"                                    # finish y guardián
+comando_verificacion_selectiva: "node scripts/verificar-selectiva.js" # review
+comando_verificacion_freno: "node scripts/verificar-rapida.js"      # solo el freno
+presupuesto_freno_s: 180                                            # opcional
+```
+
+- `comando_verificacion_freno` exige `comando_verificacion` (la puerta sigue
+  siendo la completa). Recibe la rama base en `RAMA_BASE` y guarda su resultado
+  en su propio memo (`.git/freno-verificacion-rapida.json`): su verde nunca
+  abre un merge ni lo reutiliza `finish`.
+- `presupuesto_freno_s`: segundos que puede tardar la verificación del freno
+  (de 1 a 3600, el `timeout` del hook). Con `comando_verificacion_freno` y sin
+  la clave, 180; sin ninguna de las dos, sin tope propio, como antes. Puede ir
+  sola: entonces pone tope a la verificación de siempre.
+- Si la verificación agota el presupuesto, se corta, el freno **deja parar el
+  turno** con un aviso de una línea y anota `excedido` en el registro de
+  puertas. Un rojo dentro del presupuesto sigue bloqueando el turno; un corte
+  por un `timeout_verificacion*` menor que el presupuesto también (es un rojo).
+- `taskctl doctor` dice en `puertas-verificacion` qué comando corre cada
+  puerta y el presupuesto del freno.
+- Los documentales se deciden antes, igual que siempre: una tarea de solo
+  documentación corre `comando_verificacion_documentacion`, no el del freno.
 
 #### Coste de implementación automático (hooks `Stop` y `SubagentStop`)
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
index 4aa7ebe..32ec997 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md
@@ -197,8 +197,8 @@ ignora. La sincronizacion y sus trampas, en [sincronizacion.md](sincronizacion.m
 la rama actual, el hook `Stop` lo ejecuta al terminar cada turno y, si no sale
 en verde, devuelve el turno con un informe. Arregla la causa; no borres,
 saltes ni debilites tests para pasarlo. Si el rojo no es tuyo, dilo
-al terminar: el freno solo bloquea una vez por turno. Con
-`comando_verificacion_selectiva`, el `Stop` y `review` corren esa: [verificacion-selectiva.md](verificacion-selectiva.md).
+al terminar: solo bloquea una vez por turno.
+`comando_verificacion_selectiva` y `comando_verificacion_freno`: [verificacion-selectiva.md](verificacion-selectiva.md).
 
 **Puerta de `finish` y guardian de merges.** Con `comando_verificacion`,
 `taskctl finish` verifica antes de mergear y aborta en rojo. Un merge (o el
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
index 2835180..6b0481d 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/verificacion-selectiva.md
@@ -91,7 +91,19 @@ El clasificador falla cerrado: ante la duda, corre todo. Como minimo:
 - **`taskctl finish`**: corre la completa (o la selectiva, si se cumple
   «Codigo parcial»); en rojo no integra y dice como correrla.
 - **`taskctl doctor`**: avisa si hay completa y falta la selectiva, y si
-  `rutas_verificacion_parcial` no puede tener efecto.
+  `rutas_verificacion_parcial` no puede tener efecto; `puertas-verificacion`
+  dice que comando corre cada puerta.
+
+## Un comando propio para el freno: `comando_verificacion_freno`
+
+Cada puerta tiene su clave: el freno de fin de turno corre
+`comando_verificacion_freno` (si no, la selectiva; si no, la completa), las
+rondas de `review` la selectiva y `finish` la completa. Asi el freno puede ser
+mas rapido sin abaratar la verificacion de la ronda. Con
+`presupuesto_freno_s` (180 s por defecto si hay comando del freno; de 1 a
+3600) el freno corta su verificacion al agotarse, deja parar el turno con un
+aviso de una linea y lo anota como `excedido`: review y finish la vuelven a
+exigir. Un rojo dentro del presupuesto sigue bloqueando el turno.
 
 ## Tareas de solo documentacion: `rutas_documentacion`
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
index 4af1084..d11565c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts
@@ -44,7 +44,7 @@ import {
   omitida,
   type Comprobacion,
 } from '../core/doctor.js';
-import { resolverConfigConAvisos, CONFIG_DEFAULTS, type TaskcodeConfig } from '../core/config.js';
+import { resolverConfigConAvisos, CONFIG_DEFAULTS, presupuestoFreno, type TaskcodeConfig } from '../core/config.js';
 import { comandoPropuesto, type ComandoTests } from '../core/comando-tests.js';
 import { comandoParcial, documentacionDeclarada } from '../core/verificacion-proporcional.js';
 import { detectarComandosTests } from '../fs/deteccion-tests.js';
@@ -545,6 +545,30 @@ export function comprobarVerificacionSelectiva(cfg: TaskcodeConfig | null): Comp
   ];
 }
 
+/**
+ * TASK-125: que comando corre cada puerta de verificacion. Solo con
+ * `comando_verificacion` (sin el no hay puertas: lo dice `verificacion`).
+ * - freno (hook Stop): `comando_verificacion_freno`, si no la selectiva, si no
+ *   la completa; y su presupuesto o «sin presupuesto».
+ * - review: la selectiva, o «no verifica».
+ * - finish: la completa (y la selectiva con codigo parcial).
+ * Siempre `ok`: es informacion, no un fallo.
+ */
+export function comprobarPuertasVerificacion(cfg: TaskcodeConfig | null): Comprobacion[] {
+  if (cfg === null || cfg.comando_verificacion === null) return [];
+  const completa = `"${una(cfg.comando_verificacion)}"`;
+  const selectiva = cfg.comando_verificacion_selectiva === null ? null : `"${una(cfg.comando_verificacion_selectiva)}"`;
+  const comandoFreno =
+    cfg.comando_verificacion_freno !== null
+      ? `"${una(cfg.comando_verificacion_freno)}" (comando_verificacion_freno)`
+      : (selectiva ?? completa);
+  const presupuesto = presupuestoFreno(cfg);
+  const freno = `freno ${comandoFreno}, ${presupuesto === null ? 'sin presupuesto' : `presupuesto ${String(presupuesto)} s`}`;
+  const review = `review ${selectiva ?? 'no verifica'}`;
+  const finish = `finish ${completa}${selectiva !== null && comandoParcial(cfg) !== null ? ` (o ${selectiva} con codigo parcial)` : ''}`;
+  return [ok('puertas-verificacion', `${freno}; ${review}; ${finish}`)];
+}
+
 // ---------------------------------------------------------------------
 // Tareas
 // ---------------------------------------------------------------------
@@ -939,6 +963,7 @@ export function runDoctorCommand(argv: readonly string[], deps: DoctorCommandDep
     )
   );
   cs.push(...envolver('verificacion-selectiva', () => comprobarVerificacionSelectiva(cfg)));
+  cs.push(...envolver('puertas-verificacion', () => comprobarPuertasVerificacion(cfg)));
   cs.push(...envolver('tareas', () => comprobarTareas(tareasRoot)));
   cs.push(...envolver('documento-estado', () => comprobarDocumentoEstado(cwd, cfg, repo, deps.ahora ?? new Date())));
   cs.push(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
index 159af70..75c0a3b 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts
@@ -29,6 +29,8 @@
  * | comando_verificacion_documentacion | null        | finish-verificacion.ts (TASK-100), guardia-merge.ts (TASK-101) |
  * | documento_estado             | null (no se vigila) | commands/doctor.ts (TASK-124) |
  * | tope_rondas                  | 2                 | core/flujo.ts (siguiente), commands/review.ts (TASK-127) |
+ * | comando_verificacion_freno   | null (el freno usa la de siempre) | hooks/freno-stop.ts, commands/doctor.ts (TASK-125) |
+ * | presupuesto_freno_s          | null (180 con comando_verificacion_freno) | hooks/freno-stop.ts (TASK-125) |
  * | rutas_verificacion_parcial   | [] (sin nivel 2)  | core/verificacion-proporcional.ts (TASK-096); la decision la aplican fs/decision-documentacion.ts, finish-verificacion.ts, freno-stop.ts, review.ts y guardia-merge.ts (TASK-105..108); doctor.ts avisa (TASK-109) |
  *
  * `rutas_documentacion` y `comando_verificacion_documentacion` las anadio
@@ -263,6 +265,33 @@ export interface TaskcodeConfig {
    * ronda mas (anotada en `tarea.md`) o redisenar lo abierto en otra tarea.
    */
   tope_rondas: number;
+  /**
+   * TASK-125: comando que corre SOLO el freno Stop en vez de la completa o la
+   * selectiva (review y finish siguen con las suyas). null = el de siempre.
+   * Exige `comando_verificacion`. Recibe la rama base en RAMA_BASE.
+   */
+  comando_verificacion_freno: string | null;
+  /**
+   * TASK-125: segundos que puede tardar la verificacion del freno; al
+   * agotarse se corta, se anota `excedido` y se deja parar el turno. null =
+   * 180 con `comando_verificacion_freno`, sin tope propio sin el (ver
+   * `presupuestoFreno`). No mas que `TECHO_HOOK_STOP_S`.
+   */
+  presupuesto_freno_s: number | null;
+}
+
+/**
+ * TASK-125: `timeout` del hook Stop en hooks/hooks.json, en segundos. El
+ * presupuesto del freno no puede pasarlo (el hook se cancelaria antes).
+ */
+export const TECHO_HOOK_STOP_S = 3600;
+/** TASK-125: presupuesto del freno cuando se declara su comando sin presupuesto. */
+export const PRESUPUESTO_FRENO_POR_DEFECTO_S = 180;
+
+/** TASK-125: el presupuesto efectivo del freno, o null si no tiene tope propio. */
+export function presupuestoFreno(cfg: Pick<TaskcodeConfig, 'comando_verificacion_freno' | 'presupuesto_freno_s'>): number | null {
+  if (cfg.presupuesto_freno_s !== null) return cfg.presupuesto_freno_s;
+  return cfg.comando_verificacion_freno === null ? null : PRESUPUESTO_FRENO_POR_DEFECTO_S;
 }
 
 export const PLATAFORMAS_REMOTAS: readonly Plataforma[] = ['github', 'gitlab'];
@@ -315,6 +344,8 @@ export const CONFIG_DEFAULTS: Readonly<TaskcodeConfig> = Object.freeze({
   rutas_verificacion_parcial: Object.freeze([]) as readonly string[],
   documento_estado: null,
   tope_rondas: 2,
+  comando_verificacion_freno: null,
+  presupuesto_freno_s: null,
 });
 
 /** Las unicas claves admitidas. Cualquier otra avisa y se ignora (regla 2). */
@@ -344,6 +375,8 @@ export const CLAVES_CONFIG = [
   'rutas_verificacion_parcial',
   'documento_estado',
   'tope_rondas',
+  'comando_verificacion_freno',
+  'presupuesto_freno_s',
 ] as const;
 
 /**
@@ -645,6 +678,17 @@ export function parsearConfigConAvisos(
       case 'tope_rondas':
         config.tope_rondas = validarTopeRondas(donde, par.valor);
         break;
+      case 'comando_verificacion_freno':
+        config.comando_verificacion_freno = validarComando(
+          donde,
+          par.clave,
+          par.valor,
+          'comando_verificacion_freno: "node scripts/verificar-rapida.js"'
+        );
+        break;
+      case 'presupuesto_freno_s':
+        config.presupuesto_freno_s = validarPresupuestoFreno(donde, par.valor);
+        break;
       case 'umbral_cobertura':
         config.umbral_cobertura = validarUmbralCobertura(donde, par.valor);
         break;
@@ -787,6 +831,14 @@ function validarVerificacionCompleta(ruta: string, vistas: ReadonlySet<string>):
         'completa (por ejemplo comando_verificacion: "npm test"), o borra la selectiva.'
     );
   }
+  // TASK-125: el comando rapido del freno no sustituye a la puerta de finish.
+  if (vistas.has('comando_verificacion_freno') && !vistas.has('comando_verificacion')) {
+    throw new ConfigError(
+      `[ERROR] ${ruta}: "comando_verificacion_freno" necesita tambien "comando_verificacion".\n` +
+        '        El comando del freno solo acelera el fin de turno; review y finish siguen con sus ' +
+        'comandos. Declara la completa (por ejemplo comando_verificacion: "npm test"), o borra el del freno.'
+    );
+  }
   if (vistas.has('timeout_verificacion_selectiva') && !vistas.has('comando_verificacion_selectiva')) {
     throw new ConfigError(
       `[ERROR] ${ruta}: "timeout_verificacion_selectiva" sin "comando_verificacion_selectiva" no hace nada.
@@ -987,6 +1039,7 @@ function validarComando(
     | 'comando_sincronizacion'
     | 'comando_verificacion'
     | 'comando_verificacion_selectiva'
+    | 'comando_verificacion_freno'
     | 'comando_heldout'
     | 'comando_verificacion_documentacion',
   valor: unknown,
@@ -1233,6 +1286,20 @@ function validarTopeRondas(donde: string, valor: unknown): number {
   return valor;
 }
 
+/** TASK-125: entero de 1 al `timeout` del hook Stop. */
+function validarPresupuestoFreno(donde: string, valor: unknown): number {
+  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1 || valor > TECHO_HOOK_STOP_S) {
+    throw new ConfigError(
+      `[ERROR] ${donde}: "presupuesto_freno_s" debe ser un numero entero de 1 a ${String(TECHO_HOOK_STOP_S)}, ` +
+        `y es ${describirValor(valor)}.\n` +
+        `        Son los segundos que puede tardar la verificacion del freno de fin de turno; no puede pasar del ` +
+        `timeout del hook Stop (${String(TECHO_HOOK_STOP_S)} s). Con comando_verificacion_freno y sin esta clave, ` +
+        `${String(PRESUPUESTO_FRENO_POR_DEFECTO_S)}.`
+    );
+  }
+  return valor;
+}
+
 /** Como se nombra un valor rechazado en un mensaje de error. */
 function describirValor(valor: unknown): string {
   if (valor === null) return 'un valor vacio';
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
index d7fd461..78f6dcb 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/fs/verificacion.ts
@@ -36,12 +36,15 @@ import type { ResultadoVerificacion } from '../core/informe-verificacion.js';
 const BYTES_COLA_LEIDOS = 16 * 1024;
 /** TASK-091: la completa es la puerta de integracion; la selectiva, la de las rondas. */
 // TASK-100: la de documentacion, con su propio memo: su verde nunca abre la puerta de la completa.
-export type TipoVerificacion = 'completa' | 'selectiva' | 'documentacion';
+// TASK-125: la del comando rapido del freno Stop, con su propio memo: su verde
+// no abre ninguna puerta (guardian, finish) ni pisa los demas memos.
+export type TipoVerificacion = 'completa' | 'selectiva' | 'documentacion' | 'freno';
 
 const FICHEROS_MEMO: Readonly<Record<TipoVerificacion, string>> = Object.freeze({
   completa: 'freno-verificacion.json',
   selectiva: 'freno-verificacion-selectiva.json',
   documentacion: 'freno-verificacion-documentacion.json',
+  freno: 'freno-verificacion-rapida.json',
 });
 const VERSION_MEMO = 1;
 
@@ -274,6 +277,22 @@ function arbolLimpio(raiz: string): boolean {
   }
 }
 
+/** TASK-125: el comando del freno recibe la base si se conoce (opcional); la selectiva, siempre. */
+function conRamaBase(p: PeticionVerificacion): boolean {
+  return p.tipo === 'selectiva' || (p.tipo === 'freno' && p.base !== undefined && p.base !== '');
+}
+
+/**
+ * El contexto con el que entra la peticion en su huella (undefined en la
+ * completa y la de documentacion). Exportado para que el freno calcule la
+ * misma huella que `verificarConMemo` (TASK-111/125).
+ */
+export function contextoDePeticion(raiz: string, p: PeticionVerificacion): string | undefined {
+  if (!conRamaBase(p)) return undefined;
+  const ctx = contextoSelectiva(raiz, p.base as string);
+  return p.tipo === 'selectiva' ? ctx : `freno\0${ctx}`;
+}
+
 /**
  * Ejecuta la verificacion pedida, salvo que la ultima con la misma huella
  * este guardada: entonces devuelve esa. Guarda el resultado en el memo de su
@@ -287,7 +306,8 @@ export function verificarConMemo(
   if (p.tipo === 'selectiva' && (p.base === undefined || p.base === '')) {
     throw new Error('la verificacion selectiva necesita la rama base');
   }
-  const contexto = p.tipo === 'selectiva' ? contextoSelectiva(raiz, p.base as string) : undefined;
+  const conBase = conRamaBase(p);
+  const contexto = contextoDePeticion(raiz, p);
   const huella = huellaDelArbol(raiz, p.comando, p.timeoutS, contexto);
   const commit = git(['rev-parse', 'HEAD'], raiz)?.trim() || null;
   const guardado = huella === null ? null : leerMemo(raiz, huella, p.tipo);
@@ -295,16 +315,18 @@ export function verificarConMemo(
     return { resultado: guardado, deMemo: true, cambioElArbol: false, commit, huella };
   }
 
-  const env =
-    p.tipo === 'selectiva'
-      ? { ...(opciones.env ?? process.env), [VARIABLE_RAMA_BASE]: p.base as string }
-      : opciones.env;
+  const env = conBase
+    ? { ...(opciones.env ?? process.env), [VARIABLE_RAMA_BASE]: p.base as string }
+    : opciones.env;
   const resultado = ejecutarVerificacion(raiz, p.comando, p.timeoutS, {
     ...(opciones.timeoutMs === undefined ? {} : { timeoutMs: opciones.timeoutMs }),
     ...(env === undefined ? {} : { env }),
   });
   const despues = huellaDelArbol(raiz, p.comando, p.timeoutS, contexto);
-  if (despues !== null && (p.tipo === 'completa' || arbolLimpio(raiz))) guardarMemo(raiz, despues, resultado, p.tipo);
+  // TASK-125: el memo del freno solo lo lee el freno: se guarda tambien con el arbol sucio.
+  if (despues !== null && (p.tipo === 'completa' || p.tipo === 'freno' || arbolLimpio(raiz))) {
+    guardarMemo(raiz, despues, resultado, p.tipo);
+  }
   return {
     resultado,
     deMemo: false,
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
index f73250e..bbc65a8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts
@@ -48,13 +48,20 @@
 import { existsSync, statSync } from 'node:fs';
 import path from 'node:path';
 import { spawnSync } from 'node:child_process';
-import { ConfigError, raizDelRepo, resolverConfigConAvisos, type TaskcodeConfig } from '../core/config.js';
+import {
+  ConfigError,
+  presupuestoFreno,
+  raizDelRepo,
+  resolverConfigConAvisos,
+  TECHO_HOOK_STOP_S,
+  type TaskcodeConfig,
+} from '../core/config.js';
 import { formatearVerificacionRoja, type ResultadoVerificacion } from '../core/informe-verificacion.js';
 import type { Task } from '../core/task.js';
 import { peticionDeTrabajo } from '../fs/decision-documentacion.js';
 import { baseDeTipoSinRed, resolveBaseBranchForTipo } from '../fs/git.js';
 import { listTareasEnEstados } from '../fs/task-store.js';
-import { contextoSelectiva, huellaDelArbol, verificarConMemo, type PeticionVerificacion } from '../fs/verificacion.js';
+import { contextoDePeticion, huellaDelArbol, verificarConMemo, type PeticionVerificacion } from '../fs/verificacion.js';
 import { crearProgreso, entornoConContador, type Progreso } from '../fs/progreso.js';
 import { PUERTA_FRENO, type LineaPuerta, type ResultadoFreno } from '../core/registro-puertas.js';
 import { anotarPuerta } from '../fs/registro-puertas.js';
@@ -66,7 +73,7 @@ import { esUltimoVerde, guardarUltimoVerde } from '../fs/freno-ultimo-verde.js';
  * la verificacion se corta antes, con margen para escribir el informe. Un test
  * comprueba que coincide con hooks.json.
  */
-export const TECHO_HOOK_S = 3600;
+export const TECHO_HOOK_S = TECHO_HOOK_STOP_S;
 export const MARGEN_HOOK_S = 60;
 /** Variable de entorno que apaga el freno: `FRENO_VERIFICACION=0`. */
 export const INTERRUPTOR = 'FRENO_VERIFICACION';
@@ -211,19 +218,42 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
       avisosDecision.length === 0 ? DEJAR_PARAR : { codigo: 0, stderr: avisosDecision.join('\n') };
     // Solo documentacion sin comprobacion declarada: no hay nada que correr.
     if (plan.tipo === 'nada' || (plan.tipo === 'documentacion' && plan.comando === null)) return dejarParar;
-    const clave = plan.tipo === 'selectiva' ? 'timeout_verificacion_selectiva' : 'timeout_verificacion';
-    const { timeoutS, recortado } = timeoutEfectivoS(plan.timeoutS);
+    // TASK-125: con comando_verificacion_freno, el freno corre ese comando en
+    // vez de la completa o la selectiva (la documentacion se decide igual), y
+    // con presupuesto lo corta al agotarse sin bloquear el turno.
+    const presupuesto = presupuestoFreno(cfg);
+    const rapido = cfg.comando_verificacion_freno !== null && (plan.tipo === 'completa' || plan.tipo === 'selectiva');
+    const timeoutPlan = rapido ? (presupuesto as number) : plan.timeoutS;
+    const clave = rapido
+      ? 'presupuesto_freno_s'
+      : plan.tipo === 'selectiva'
+        ? 'timeout_verificacion_selectiva'
+        : 'timeout_verificacion';
+    const porPresupuesto = presupuesto !== null && presupuesto <= timeoutPlan;
+    const pedido = porPresupuesto ? (presupuesto as number) : timeoutPlan;
+    const { timeoutS, recortado } = timeoutEfectivoS(pedido);
     const avisos: string[] = [...avisosDecision];
     if (recortado) {
       avisos.push(
-        `${clave} pide ${String(plan.timeoutS)} s, pero este freno tiene un tope de ` +
+        `${porPresupuesto ? 'presupuesto_freno_s' : clave} pide ${String(pedido)} s, pero este freno tiene un tope de ` +
           `${String(timeoutS)} s: se ha usado el tope.`
       );
     }
-    const peticion: PeticionVerificacion =
-      plan.tipo === 'selectiva'
-        ? { tipo: 'selectiva', comando: plan.comando, timeoutS, base: plan.base }
-        : { tipo: plan.tipo, comando: plan.comando as string, timeoutS };
+    let peticion: PeticionVerificacion;
+    if (rapido) {
+      const base =
+        plan.tipo === 'selectiva'
+          ? plan.base
+          : tipoTarea !== null && baseDeTipoSinRed(tipoTarea)
+            ? resolveBaseBranchForTipo(tipoTarea, raiz)
+            : cfg.rama_base;
+      peticion = { tipo: 'freno', comando: cfg.comando_verificacion_freno as string, timeoutS, base };
+    } else {
+      peticion =
+        plan.tipo === 'selectiva'
+          ? { tipo: 'selectiva', comando: plan.comando, timeoutS, base: plan.base }
+          : { tipo: plan.tipo, comando: plan.comando as string, timeoutS };
+    }
     const idTarea = ids[0] ?? tarea;
     const anotar = (resultado: ResultadoFreno, duracionS: number): void => {
       (deps.anotarPuerta ?? anotarPuerta)(raiz, {
@@ -240,12 +270,7 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
     // ni se escribe nada (salvo los avisos de la decision): el turno no cambio
     // nada que verificar. Vale tambien con el arbol sucio, donde el memo
     // compartido de la selectiva no se guarda (TASK-105).
-    const huella = huellaDelArbol(
-      raiz,
-      peticion.comando,
-      peticion.timeoutS,
-      peticion.tipo === 'selectiva' ? contextoSelectiva(raiz, peticion.base as string) : undefined
-    );
+    const huella = huellaDelArbol(raiz, peticion.comando, peticion.timeoutS, contextoDePeticion(raiz, peticion));
     if (huella !== null && esUltimoVerde(raiz, peticion.tipo, huella)) {
       anotar('omitido', 0);
       return dejarParar;
@@ -255,7 +280,7 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
     // en verde, "en rojo" si la verificacion sale en rojo y bloquea el turno, y
     // "abortada" solo si algo lanza.
     const progreso = deps.progreso ?? crearProgreso(raiz);
-    const paso = plan.tipo === 'completa' ? 'verificacion' : `verificacion ${plan.tipo}`;
+    const paso = peticion.tipo === 'completa' ? 'verificacion' : `verificacion ${peticion.tipo}`;
     progreso.fase(ids[0] ?? tarea, 'freno', [paso]);
     progreso.paso(paso);
     // TASK-110: solo el comando de verificacion recibe el contador (TASKCTL_PROGRESO).
@@ -272,8 +297,18 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
       throw e;
     }
     const duracionS = (Date.now() - inicio) / 1000;
-    progreso.terminar(verificacion.resultado.estado === 'verde' ? 'ok' : 'en-rojo');
     const { resultado: r, deMemo, cambioElArbol } = verificacion;
+    // TASK-125: cortada por el presupuesto -> no bloquea: una linea y `excedido`.
+    // Review y finish la vuelven a exigir con sus comandos.
+    if (r.estado === 'cortada' && porPresupuesto) {
+      progreso.terminar('ok');
+      anotar(deMemo ? 'omitido' : 'excedido', duracionS);
+      const aviso =
+        `Aviso: la verificacion del freno de fin de turno supero su presupuesto (${String(timeoutS)} s, ` +
+        'presupuesto_freno_s) y se corto sin resultado; review y finish la vuelven a exigir.';
+      return { codigo: 0, stderr: [...avisos, aviso].join('\n') };
+    }
+    progreso.terminar(r.estado === 'verde' ? 'ok' : 'en-rojo');
     if (r.estado === 'verde') {
       // TASK-111: un verde del memo compartido tampoco ha ejecutado nada.
       anotar(deMemo ? 'omitido' : 'verde', duracionS);
@@ -295,6 +330,12 @@ export async function decidirStop(entrada: EntradaStop, deps: DepsFreno = {}): P
           'se exige ademas la completa.'
       );
     }
+    if (peticion.tipo === 'freno') {
+      avisos.push(
+        'Es el comando del freno (comando_verificacion_freno); review y finish corren ademas los suyos antes ' +
+          'de integrar.'
+      );
+    }
     if (deMemo) {
       avisos.push(
         'Es el resultado guardado de la ultima verificacion: el arbol no ha cambiado desde entonces y no ' +
````

## Excluido del diff (13 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.json" ":(glob)**/*-lock.yaml" ":(glob)**/*-lock.yml" ":(glob)**/*-lock.toml" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-125/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-125/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-125/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-125/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-125/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-125/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-125/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-125/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-125/tarea.md                                                       |  3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/commands/doctor.js                                     | 26 +++++++++++++++++++++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/config.js                                         | 42 ++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/fs/verificacion.js                                     | 25 ++++++++++++++++++++++---
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/freno-stop.js                                    | 61 +++++++++++++++++++++++++++++++++++++++++++++++++------------
 13 files changed, 140 insertions(+), 17 deletions(-)
````

## Tests del diff (2 fichero(s))

Su diff no se embebe, para aligerar la peticion. Leelos en su ruta o pide su
diff con:

````
git diff develop..HEAD -- ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/core/config-freno.test.ts" ":(literal)taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-presupuesto.test.ts"
````

````
taskcode-marketplace/plugins/taskcode-plugin/test/core/config-freno.test.ts       | 106 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 taskcode-marketplace/plugins/taskcode-plugin/test/hooks/freno-presupuesto.test.ts | 182 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 2 files changed, 288 insertions(+)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 104.2 s
- Commit verificado: 8cde3133c9bd024e7207c690a7698d7c2e1bcda4
- Huella: 94c9c8b6b6ba67744b16806cba03d9254f18116c
- Si el commit verificado es el Commit revisado de la cabecera, no repitas esta verificacion: su resultado vale para tu revision. Ejecuta solo los tests que necesites para reproducir lo que revisas.

Final de la salida (truncada: 103014 bytes en total):

````
✔ freno (TASK-125): un timeout de la selectiva menor que el presupuesto sigue siendo rojo (no excedido) (4375.0143ms)
✔ freno (TASK-102): un turno de solo documentacion corre la comprobacion de documentacion y no la suite (5277.4524ms)
✔ freno (TASK-102): solo documentacion sin comando de documentacion no corre nada (2341.292ms)
✔ freno (TASK-102): documentacion sin commitear todavia, sin commits en la rama, cuenta como solo documentacion (3757.9416ms)
✔ freno (TASK-102): un fichero de codigo modificado sin commitear aplica la verificacion de siempre (4047.2449ms)
✔ freno (TASK-102): un fichero de codigo preparado (git add) sin commitear aplica la verificacion de siempre (4323.6646ms)
✔ freno (TASK-102): un fichero de codigo sin seguimiento aplica la verificacion de siempre (3804.6545ms)
✔ freno (TASK-102): un commit de codigo en la rama aplica la verificacion de siempre (3009.114ms)
✔ freno (TASK-102): con la selectiva declarada, solo documentacion se decide antes; con codigo, la selectiva (4857.5884ms)
✔ freno (TASK-102): sin rutas_documentacion se comporta como en la 0.14.0 y no lanza ningun git nuevo (4077.7788ms)
✔ freno (TASK-102): con el arbol sucio corre la comprobacion de documentacion pero no guarda su memo; limpio, si (4953.4488ms)
✔ freno (TASK-102): una config de la base invalida no bloquea: la verificacion de siempre con un aviso (2625.9082ms)
✔ freno (TASK-102, MEN-1/MEN-2): un hotfix no se exime por documentacion ni va a la red a por su base (3634.6601ms)
✔ freno: verificacion en verde deja parar, en silencio (3752.0761ms)
✔ freno: verificacion en rojo bloquea con exit 2 y el comando, el codigo, la duracion y la cola (2989.4761ms)
✔ freno: sin tarea en curso, rama ajena o sin comando no hace nada ni ejecuta el comando (3542.3777ms)
✔ freno: fuera de un proyecto con tareas (o sin cwd) sale 0 sin tocar nada (8.1044ms)
✔ freno: stop_hook_active e interruptor FRENO_VERIFICACION=0 dejan parar sin ejecutar (1099.9992ms)
✔ freno: respeta el timeout y corta el comando (bloquea, no deja pasar) (4754.192ms)
✔ freno: timeout_verificacion por encima del tope del hook se recorta y se avisa (2965.508ms)
✔ freno: config invalida con tarea en curso bloquea con el error de la config (1255.8321ms)
✔ freno: memo por huella — mismo arbol no vuelve a ejecutar, un cambio si (7680.3061ms)
✔ freno: la cola va acotada, sin ANSI, sin credenciales y sin partir UTF-8 (1853.3009ms)
✔ freno: el punto de entrada real, por stdin, sale con 2 en rojo y 0 en verde (3727.2763ms)
✔ freno: hooks.json declara el Stop en forma exec, con el tope que usa el codigo y sin nombrar el producto (1.0668ms)
✔ freno (IMP-2): el timeout efectivo nunca supera el tope del hook menos el margen (0.2295ms)
✔ freno (MEN-1): un corte con salida corta no se rotula como truncado (3742.5204ms)
✔ freno (MEN-2): una tarea en curso ilegible no frena, pero se avisa (839.364ms)
✔ freno (MEN-7): si la propia verificacion ensucia el arbol, el informe lo avisa (1914.0776ms)
✔ informe (MEN-7): recortarCola no parte caracteres multibyte en una linea larga (0.5437ms)
✔ informe (MEN-5): una muerte sin codigo no se describe como «codigo null» (0.1425ms)
ℹ tests 980
ℹ suites 0
ℹ pass 980
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 94241.7325
[verificar-impacto] node --test termino con 0 en 94.3 s.
````
