# Checklist de terminación — TaskCode

> Documento vivo. Se marca cada casilla al cerrar el trabajo real (mergeado
> a `develop`, tests en verde), no al empezarlo. Derivado de
> `INVENTARIO_PENDIENTE.md`; las tareas `TASK-0NN` son las de
> `PLAN_SPRINTS.md`, el resto son huecos detectados en el inventario que no
> tenían tarea asignada.
>
> **Convención**: al cerrar un item se marca su casilla, se actualizan los
> contadores de la tabla de abajo, y se muestra el checklist actualizado en la
> respuesta. Ver `CONVENCIONES.md`.

**Progreso global: 126 / 126 items terminados (100%)** · última actualización: 2026-11-13

Desde el 2026-10-04 se suma la fase G (urgente, pedida por Carlos): el
plugin conduce el ciclo con fases invocables y modos manual, semiautomatico y
automatico (plan de referencia en TASK-055). Y la fase F: el plan de solución de la auditoría del
2026-10-03 (`docs/auditoria/PLAN-SOLUCION-2026-10-03.md`), más TASK-033, TASK-053
y TASK-054.

El total baja de 43 a 42: **D4 se descarta** (ver su entrada). Y sube en 3 lo
hecho: D6, D7 y el propio D4, que cuenta como resuelto porque la decisión está
tomada y documentada, no aplazada.

| Fase | Items | Hechos | Estimación |
|---|---|---|---|
| ✅ Ya terminado (Sprint 0 + 1) | 12 | 12 | — |
| ✅ A — Desbloquear | 3 | **3** | ~6h |
| ✅ B — Cerrar el ciclo de vida | 7 | **7** | ~18h |
| ✅ C — Tapar huecos | 8 | **8** | ~25h |
| ✅ D — Inteligencia del proceso | 6 | **6** | ~35h |
| ✅ E — Cierre | 6 | **6** | ~9h |
| ✅ F — Auditoría 2026-10-03 | 22 | **22** | — |
| ✅ G — Flujo guiado por fases | 5 | **5** | — |
| ✅ H — Peticiones tras el plan | 3 | **3** | — |
| ✅ I — Métricas v2 | 3 | **3** | — |
| ✅ J — Doctor-deploy | 3 | **3** | — |
| ✅ K — Frenos de verificación con hooks | 8 | **8** | — |
| ✅ L — Mantenimiento | 2 | **2** | — |
| ✅ M — Revisores y roles de dominio | 2 | **2** | — |
| ✅ N — Mejoras tras las métricas de la 0.8 | 10 | **10** | — |
| ✅ O — Verificación selectiva por impacto | 1 | **1** | — |
| ✅ P — Agilidad sin perder calidad | 25 | **25** | — |
| **Total pendiente** | **0** | — | — |


Las fases cerradas (Sprint 0 y 1, A a O), las decisiones ya resueltas (#1 a
#17, ninguna abierta) y el «Corte mínimo defendible» viven en
[`archivo/CHECKLIST-fases-cerradas.md`](archivo/CHECKLIST-fases-cerradas.md),
movidas tal cual el 2026-11-12. Aquí queda solo lo que tiene casillas
abiertas. Tope de este fichero: 20 480 B (ver `CONVENCIONES.md`).

## Decisiones que dependen de ti

Ninguna abierta. Las resueltas, con su razonamiento, en el archivo.

---

## ✅ P — Agilidad sin perder calidad (25/25)

Pedidas por Carlos el 2026-11-10 desde ToolsaWeb (TASK-295), donde la 0.13 ha
hecho perder agilidad: la verificación completa se repite por causas que no son
del código.

- [x] TASK-092 — Sincronización de ficheros sueltos de la raíz de tareas/ — cerrada el 2026-11-10
      *`rutas_sincronizacion` admite un fichero directamente en `tareas/` (p. ej.
      `tareas/ROADMAP.md`), que se regenera en el commit de cada transición; siguen
      cerradas las carpetas de estado, cualquier subcarpeta, `.taskcode/` y `.git/`,
      ahora sin distinguir mayúsculas ni puntos/espacios finales. `informe_cobertura`
      no cambia. Cambió la expectativa del caso `tareas/x.md` (aprobado por la
      persona en el plan). 1 ronda, aprobada sin hallazgos, 7 mutantes detectados.
      Pendiente de publicar en 0.14.0.*
- [x] TASK-095 — Revisión que converge: desde la ronda 2 solo se verifican las correcciones — cerrada el 2026-11-10
      *Corrige la regla de TASK-083 (un IMPORTANTE en cualquier estado, también corregido,
      relanzaba una ronda completa desde la base: hasta 14 rondas). Desde la ronda 2 la
      ronda es acotada: cada revisor verifica sus pendientes (todo salvo aceptado), los
      dominios que toca la corrección también la ven, y solo se abren hallazgos nuevos
      CRÍTICOS o causados por la corrección; completa solo con --completa, sin commit
      revisado fiable o con informes ilegibles. Tope: siguiente pregunta en cualquier modo
      y review exige --ronda-extra para la ronda 4. No se retira ningún revisor. 2 rondas:
      6 MENOR en la 1 (MEN-4 y parte de MEN-5 aceptados), aprobada en la 2. Pendiente de
      publicar en 0.14.0.*
- [x] TASK-097 — Regla de una hora: plan estima la duración de punta a punta y propone trocear — cerrada el 2026-11-10
- [x] TASK-098 — ROADMAP de tareas generado por taskctl en todos los proyectos, sin pisar los existentes — cerrada el 2026-11-10
- [x] TASK-100 — Verificación proporcional A1: finish no corre la suite si la tarea solo cambia documentación — cerrada el 2026-11-10
- [x] TASK-101 — Verificación proporcional A2: el guardián de merges — cerrada el 2026-11-10
- [x] TASK-102 — Verificación proporcional A3a: el freno Stop no corre la suite si solo cambia documentación — cerrada el 2026-11-11
- [x] TASK-104 — Verificación proporcional A3b: las rondas de review no corren la suite si solo cambia documentación — cerrada el 2026-11-11
- [x] TASK-103 — Guardián de merges: config inválida bloquea y merges que hoy no detecta — cerrada el 2026-11-11
- [x] TASK-096 — Verificación proporcional B1: clave `rutas_verificacion_parcial` y decisión `selectiva` en core — cerrada el 2026-11-11
      *Troceada en el plan por la regla de una hora (270 min; decisión de Carlos): B1 es esta, el
      resto son TASK-105 a TASK-109. Clave opt-in leída de la base (lista de rutas permitidas, exige
      la selectiva) y tercer resultado de la decisión pura; nada observable cambia todavía. Decisión
      sobre TASK-091 escrita en el plan: la completa sigue por defecto y el guardián no acepta la
      selectiva para código. 2 rondas: 3 MENOR en la 1, corregidos; aprobada en la 2. No se publica
      versión hasta cerrar TASK-109.*
- [x] TASK-105 — Verificación proporcional B2: decisión entre refs y huella para el nivel 2 — cerrada el 2026-11-11
      *La decisión entre refs calcula fueraDeParcial con un git diff extra (solo la lista excluida, SHA
      fijados antes) cuando la base declara la clave y hay código; sin ella, cero procesos de más.
      huellaDeCommit acepta contexto y comparte cabecera con huellaDelArbol. Decisiones de Carlos: el memo
      selectiva no se guarda con el árbol sucio (el Stop sucio la repite; medir en ToolsaWeb antes de B3),
      se mantiene la salida temprana sin rutas_documentacion, y el guardián y finish tratan selectiva como
      completa con motivo neutro (cierra el hueco del guardián). 1 ronda: aprobada, 2 MENOR aceptados.*
- [x] TASK-106 — Verificación proporcional B3: finish verifica solo lo afectado con código parcial — cerrada el 2026-11-11
      *Con rutas_verificacion_parcial en la base y todo el código dentro, finish corre la selectiva (RAMA_BASE,
      su timeout) en vez de la completa, lo dice y lo anota tras el verde en «Verificacion parcial». Decisiones
      de Carlos: reutiliza solo un memo selectivo verde del mismo commit (excepción acotada a TASK-072), el hotfix
      nunca usa la selectiva pero conserva su camino de documentación, una sola tarea de ~70 min. Cobertura
      omitida en el nivel 2; release a la completa. 2 rondas: IMP-1 y 3 MENOR corregidos, ronda 2 aprobada.*
- [x] TASK-107 — Verificación proporcional B4: Stop, review y finish deciden igual el mismo diff — cerrada el 2026-11-11
      *Solo tests: una tabla (documentación, parcial, transversal) × (Stop, review, finish) con el vector absoluto
      de ejecuciones por celda, 9 repos reales (decisión de Carlos). Sin divergencia: producción intacta. Stop y
      review corren la selectiva ante lo transversal y finish la completa (divergencia acordada, fijada en la tabla).
      4 mutantes propios y 4 del revisor, cada uno rojo en su celda. 1 ronda: aprobada, 2 MENOR aceptados.*
- [x] TASK-108 — Verificación proporcional B5: el guardián de merges ante el nivel 2 — cerrada el 2026-11-11
      *D1 ya estaba en el código desde TASK-105: con código el guardián exige siempre la completa y nunca lee el
      memo selectivo. La tarea lo fija con 6 tests y añade al bloqueo una línea que dice qué hace falta y cómo
      integrar (finish, nunca «corre la completa y repite»); release y hotfix sin ella. Decisiones de Carlos: el
      criterio 2 acotado a la decisión 6b, el corte por tiempo a una tarea aparte. 2 rondas: 2 MENOR corregidos,
      1 aceptado, ronda 2 aprobada.*
- [x] TASK-109 — Verificación proporcional B6: documentación y limpieza del nivel 2 — cerrada el 2026-11-12
      *Cierra TASK-096. Guía, SKILL.md, README y CHANGELOG explican el nivel 2 (prueba de contrato que se pone
      roja si se borra la sección); ejemplo propio por clave en el error de config; doctor avisa si
      rutas_verificacion_parcial no tiene efecto. Inventario: nada que borrar. 2 rondas: IMP-1 (la cobertura no
      se mide en el release) e IMP-2 (tras un conflicto, cerrarlo en develop deja un finish que no verifica,
      también en el mensaje del guardián) corregidos, ronda 2 aprobada.*
- [x] TASK-110 — Progreso visible sin tokens: estado de cada fase en el terminal — cerrada el 2026-11-12
      *Fichero de progreso bajo .git/taskcode/, `taskctl estado` (via rapida, 143 ms), status line instalable por
      doctor en el settings.json de usuario (con el taskctl de la cache si no esta en el PATH, y solo si entiende
      `estado`), progreso en plan/approve/start/review/finish y el freno Stop sin anadir salida (cero tokens),
      contador TASKCTL_PROGRESO, reporter [x/N] de npm test y `--seguir`. Sin trocear (decision de Carlos). Paso S:
      la status line se ve en la app de escritorio y por Remote Control. 1 ronda: IMP-1 y 5 MENOR corregidos, 2
      aceptados; cerrada sin ronda 2 por decision de Carlos (modo rapido).*
- [x] TASK-122 — Coste por tarea independiente del tamaño del proyecto — cerrada el 2026-11-12
      *Verificacion por impacto en TaskCode (14 s un modulo, 70 s la rama; antes ~25 min), metricas --evolucion con
      el coste fijo y su tendencia, informe de escala y perfil de la suite, regla de la piramide. Modo rapido: plan
      sin brainstorm, 1 ronda (3 IMP y 6 MENOR corregidos), cerrada sin ronda 2 y con --sin-verificacion por
      decision de Carlos.*
- [x] TASK-123 — F-16: finish no cierra sin verificar tras un merge a mano o un conflicto — cerrada el 2026-11-12
      *CRITICO de la auditoria: el reintento de finish verifica la rama de integracion (decision proporcional y
      memo) y el guardian bloquea el commit que cierra un merge en curso en develop/main; remedio seguro en
      mensajes y guia. Los dos casos reproducidos son tests de regresion. Arregla tambien que verificar-impacto
      pasaba RAMA_BASE a los tests. 1 ronda: 2 IMP corregidos, 2 MEN aceptados; cerrada sin ronda 2 y con
      --sin-verificacion por decision de Carlos.*
- [x] TASK-121 — Troceo de tareas de más de 60 min como pregunta: subtareas TASK-NNNa, b, c en la misma rama — cerrada el 2026-11-12
      *taskctl trocear pasa la tarea a TASK-NNNa y crea b, c... en 00-planificadas con la misma rama y el
      ROADMAP regenerado; siguiente pregunta con dos salidas en cualquier modo; IDs con letra en todo el CLI;
      start de una parte trae la base a la rama compartida. Carlos la aprobo entera (150 min). 1 ronda:
      aprobada, 6 MEN corregidos (MEN-5 en parte) y 4 mutantes muertos; suite completa con solo los 3 rojos
      de Windows, cerrada con --sin-verificacion.*
- [x] TASK-124 — Contexto con tamaño máximo: lo que leen los agentes no crece con el proyecto — cerrada el 2026-11-12
      *Topes en bytes con test (CLAUDE.md, skills, agentes, CHECKLIST 20 KB, ESTADO 10 KB); README del plugin
      de 106 a 17 KB con lo detallado en docs/ del plugin (test de tamaño, enlaces y encabezados); fases
      cerradas y ESTADO viejo a docs/contexto/archivo/; doctor vigila documento_estado. Carlos la aprobó
      entera (150 min). 1 ronda: aprobada con correcciones, 4 MEN corregidos y 2 mutantes muertos; cerrada
      sin ronda 2 (modo rápido).*
- [x] TASK-099 — Corrección de MENORES tras aprobar con correcciones sin abrir otra ronda completa — cerrada el 2026-11-12
      *P-2: taskctl verificar-menores (solo ficheros de los MENORES o tests; los no corregidos a
      revision/menores-pendientes.md, que no bloquea), finish no integra codigo posterior al Commit revisado
      sin esa verificacion o --aceptar-sin-revisar, siguiente sin rondas por MENORES. Motivo: 71 rondas por
      MENORES, 2 CRIT/IMP, 70,2 M tokens. 1 ronda: 2 IMP y 2 MEN corregidos, 1 MEN aceptado, 7 mutantes
      muertos; la suite completa cazo 2 rojos propios (derivados de comando_sincronizacion), corregidos;
      cerrada sin ronda 2, con --aceptar-sin-revisar y --sin-verificacion por decision de Carlos.*
- [x] TASK-116 — P-8: TaskCode declara su verificación y doctor avisa cuando falta — cerrada el 2026-11-12
      *TaskCode ya declaraba comando_verificacion desde TASK-122 (doctor da ok). El aviso de doctor sin la clave
      y con tests detectables dice ahora cuantas tareas terminadas se cerraron sin verificar (todas las de
      04-terminadas: finish no deja rastro). Modo rapido: plan sin brainstorm, 1 ronda aprobada sin hallazgos,
      4 mutantes muertos; finish con la puerta en verde.*
- [x] TASK-113 — P-5: petición de revisión más ligera con los tests como --stat y ruta — cerrada el 2026-11-12
      *La petición embebe el diff del código y lista los tests (globs PATRONES_TEST, calculados por Git) con su
      --stat y la orden para pedir su diff; la propia petición de la tarea pesó 14,9 KB. Tres rondas: MEN-1
      (ENAMETOOLONG con miles de tests: --stat por lotes y orden por patrones) y MEN-2 corregidos; ampliación
      decidida por Carlos: verificar-menores no cuenta lo excluido de la revisión (dist/ recompilado); la ronda 2
      halló que el patrón por defecto **/*-lock.* excluía código real (redis-lock.ts) y se acotó a
      *-lock.json|yaml|yml|toml. Suite completa: solo los 3 rojos de Windows; finish --sin-verificacion.*
- [x] TASK-114 — P-6: hooks PreToolUse que salen pronto cuando no tienen nada que hacer — cerrada el 2026-11-13
      *El guardián de held-out deja pasar sin lanzar git si la config no declara comando_heldout (una config
      ilegible sigue protegiendo); el de merges solo mira comandos con `git` o un script de cierre, con un
      prefiltro sin dependencias (prefiltro.ts) en el punto de entrada. Dos rondas: MEN-1 (prefiltro sin test)
      y MEN-3 (finish lee la clave de la base) corregidos, MEN-2 (ofuscación con comillas) aceptado. Suite
      completa: solo los 3 rojos de Windows; finish --sin-verificacion.*
- [x] TASK-118 — P-10: línea FIN con la duración en todos los scripts de Git-Flow — cerrada el 2026-11-13
      *initialize_gitflow_log instala un trap EXIT que cierra el registro con `FIN: <operación> | resultado | duración`
      (COMPLETADO, ABORTADO o ERROR (código N)); test por cada uno de los 22 scripts que registran. Una ronda
      aprobada; MEN-1 aceptado (con SIGTERM dice ABORTADO). Suite completa: solo los 3 rojos de Windows.*

Retiradas el 2026-11-10 tras medir 147 tareas de ToolsaWeb y OpenDockTrading (decisión
de Carlos: el tiempo se va en rondas que no convergen y en verificar lo que no cambió,
y seguir añadiendo parches empeora el plugin). Principio que guía la fase: el coste de
revisar y verificar crece con el tamaño del cambio, no con el del proyecto.
- ~~TASK-093 — finish reutiliza la completa en verde del mismo árbol~~: poco valor (con
  selectiva declarada el freno no guarda el verde de la completa) y riesgo de falsos verdes.
- ~~TASK-094 — Cerrojo de verificación~~: síntoma de lanzar demasiadas verificaciones;
  ToolsaWeb ya lo resuelve en su comando. TASK-096 ataca la causa.
