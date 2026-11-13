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

**Progreso global: 136 / 136 items terminados (100%)** · última actualización: 2026-11-13

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
| ✅ P — Agilidad sin perder calidad | 35 | **35** | — |
| **Total pendiente** | **0** | — | — |


Las fases cerradas (Sprint 0 y 1, A a O), las decisiones ya resueltas (#1 a
#17, ninguna abierta) y el «Corte mínimo defendible» viven en
[`archivo/CHECKLIST-fases-cerradas.md`](archivo/CHECKLIST-fases-cerradas.md),
movidas tal cual el 2026-11-12. Aquí queda solo lo que tiene casillas
abiertas. Tope de este fichero: 20 480 B (ver `CONVENCIONES.md`).

## Decisiones que dependen de ti

Ninguna abierta. Las resueltas, con su razonamiento, en el archivo.

---

## ✅ P — Agilidad sin perder calidad (35/35)

Pedidas por Carlos el 2026-11-10 desde ToolsaWeb (TASK-295), donde la 0.13 ha
hecho perder agilidad: la verificación completa se repite por causas que no son
del código.

- TASK-092 a TASK-109 (15 items, todos cerrados): archivados el 2026-11-13 en
  [`archivo/CHECKLIST-fases-cerradas.md`](archivo/CHECKLIST-fases-cerradas.md#p--primera-parte-task-092-a-task-109) por el tope de tamano.
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
- [x] TASK-117 — P-9: new propone la complejidad a partir de tareas parecidas ya cerradas — cerrada el 2026-11-13
      *Sin --complejidad, new escribe la mediana (la inferior si son pares) de las terminadas con más etiquetas en
      común y dice de cuáles sale. Dos rondas: MEN-1..3 corregidos; IMP-1 aceptado y pendiente de decisión de
      Carlos: la propuesta cuenta como declarada y la heurística toma el máximo, así que solo puede subir roles.
      Incidente: un revisor creó por error un commit en develop (TASK-131 falsa, sin subir); se retiró.*
- [x] TASK-120 — P-12: sincronización con su duración registrada y limitada a las fases que se declaren — cerrada el 2026-11-13
      *Registro común de puertas en .git/taskcode/puertas.log (puerta, tarea, instante, modo, duración, resultado;
      docs/registro-puertas.md para TASK-111 y TASK-128); cada sincronización anota su línea, fases_sincronizacion
      la limita y metricas la suma en la columna sinc. De paso, el test del symlink de approve se omite sin
      privilegio (bloqueaba la selectiva): en Windows fallan ya solo 2. Una ronda aprobada, 2 MENORES aceptados.*
- [x] TASK-112 — P-4: el revisor reutiliza la verificación de ronda y las rondas 2+ solo relanzan al revisor con pendientes — cerrada el 2026-11-13
      *La verificación de ronda lleva commit y huella y, en verde, la petición dice que no se repita (los revisores
      de esta misma tarea ya no la repitieron). La ronda acotada solo reverifica CRÍTICO e IMPORTANTE; quien solo
      tenía MENORES vuelve si la corrección toca sus ficheros y si no consta en `## Revisores no relanzados`.
      Dos rondas: IMP-1 (skills revisoras incoherentes) y MEN-1..3 corregidos; notas N-1 y N-2 pendientes.*
- [x] TASK-119 — P-11: menos commits de proceso por tarea — cerrada el 2026-11-13
      *registrar-coste y veredicto ya no commitean: lo pendiente de la carpeta de la tarea lo absorbe el commit
      del siguiente comando de fase (approve y plan lo dejan pasar; review y finish lo apartan en un stash con
      nombre mientras corren Git-Flow y la verificación, y un intento que muere lo recupera el siguiente desde la
      misma rama). Un ciclo con una ronda pasa de 12 a 6 commits de proceso (test que los cuenta). Tres rondas:
      IMP-1 (tests de los caminos de error) y MEN-1..6 corregidos, incluido MEN-3 (en merge request lo pendiente
      se commitea antes de subir la rama). La propia tarea se cerró ya con el flujo nuevo. finish --sin-verificacion
      (modo rápido: verificar-impacto y tests afectados en verde, solo los 2 rojos de Windows).*
- [x] TASK-127 — Tope de rondas de revisión configurable, 2 por defecto, y decisión de una persona al llegar — cerrada el 2026-11-13
      *Clave tope_rondas (1 a 10, 2 por defecto) leída de la config de la rama base por siguiente y review. En el
      tope, siguiente pregunta en todos los modos con tres salidas (cerrar, ronda extra, volver a diseño = tarea
      nueva, decisión de Carlos); review --ronda-extra exige «- Ronda N:» bajo «## Rondas extra» en tarea.md, una
      por ronda. tope_rondas: 3 = comportamiento anterior. No se troceó (70 min estimados, decisión de Carlos).
      Una ronda: IMP-1 (test de que la rama no se sube el tope, mata el mutante) y MEN-1 (CHANGELOG) corregidos
      sin ronda 2, MEN-2 aceptado. Lateral: 3 tests ya rojos en develop desde TASK-119. finish --sin-verificacion.*
- [x] TASK-131 — Tres tests con expectativas anteriores a TASK-119 — cerrada el 2026-11-13
      *Sin cambios de producción: automatico-ciclo (informe sin commitear → finish continúa, lo absorbe finish),
      automatico-guarda-finish IMP-3 (commit del veredicto antes de cambiar de rama) y fases.test.ts (frases
      vigentes de la skill review) pasan a la regla de TASK-119. Una ronda aprobada sin hallazgos. develop vuelve a
      no tener más rojos que los 2 conocidos de Windows. finish --sin-verificacion (verificar-impacto 811/811).*
- [x] TASK-111 — P-3: registrar cada ejecución del freno Stop y no correrlo si el turno no cambió código — cerrada el 2026-11-13
      *Puerta freno en el registro de puertas (verde, rojo, omitido; excedido reservado para TASK-125); memo propio
      del último verde del freno, que omite el turno sin cambios también con el árbol sucio; métricas con freno_n y
      freno. Dos rondas: IMP-1 (rojo de memo contaba como ejecución), IMP-2 (test de cableado de metricas) y MEN-1
      corregidos; ronda 2 aprobada sin hallazgos. finish --sin-verificacion (verificar-impacto 868/868).*
- [x] TASK-125 — Freno Stop con presupuesto de tiempo y clave propia: si se pasa, anota y no bloquea — cerrada el 2026-11-13
      *comando_verificacion_freno (solo el freno, memo propio que no abre el guardián) y presupuesto_freno_s (180 s
      por defecto con el comando, tope 3600); un corte por presupuesto deja parar y anota excedido; doctor muestra
      puertas-verificacion. Una ronda aprobada; MEN-1 y MEN-2 corregidos con verificar-menores. Se archivaron
      TASK-092..109 del checklist por su tope de 20 KB. finish --sin-verificacion (verificar-impacto 980/980).*
- [x] TASK-128 — Métricas de verificación por puerta: tiempo y ejecuciones de freno, review y finish, y rondas solo por menores — cerrada el 2026-11-13
      *review y finish anotan cada verificación (también en rojo) en el registro de puertas; metricas añade review_n,
      review_v, finish_n, finish_v y rondas_men, y la fila de totales de las puertas; columnas anteriores intactas.
      Una ronda aprobada con correcciones: MEN-1 y MEN-2 (tests de tres anotaciones de finish y del modo de review)
      corregidos sin ronda 2, mutantes comprobados. finish --sin-verificacion (verificar-impacto 896/896).*
- [x] TASK-115 — P-7: verificación completa por lote de cierres en modo automático — cerrada el 2026-11-13
      *Clave verificacion_por_lote (de la config de la base): finish de feature/fix con código integra sin la completa
      y deja «pendiente de lote»; taskctl verificar-lote corre la completa una vez en la rama de integración, anota en
      verde todas las pendientes y en rojo lista las que entraron desde la última en verde. Forma decidida por la regla
      de aceptar recomendaciones (revisable). Dos rondas: IMP-1 (hotfix/release fuera del lote, con test) y MEN-1..4
      corregidos. finish --sin-verificacion (verificar-impacto 919/919).*

Retiradas el 2026-11-10 tras medir 147 tareas de ToolsaWeb y OpenDockTrading (decisión
de Carlos: el tiempo se va en rondas que no convergen y en verificar lo que no cambió,
y seguir añadiendo parches empeora el plugin). Principio que guía la fase: el coste de
revisar y verificar crece con el tamaño del cambio, no con el del proyecto.
- ~~TASK-093 — finish reutiliza la completa en verde del mismo árbol~~: poco valor (con
  selectiva declarada el freno no guarda el verde de la completa) y riesgo de falsos verdes.
- ~~TASK-094 — Cerrojo de verificación~~: síntoma de lanzar demasiadas verificaciones;
  ToolsaWeb ya lo resuelve en su comando. TASK-096 ataca la causa.
