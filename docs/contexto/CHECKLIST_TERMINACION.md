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

**Progreso global: 163 / 175 items terminados (93%)** · última actualización: 2026-11-24

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
| ✅ P — Agilidad sin perder calidad | 45 | **45** | — |
| Q — Correcciones de la auditoría 4D | 29 | **17** | ~45h |
| **Total pendiente** | **12** | — | — |


Las fases cerradas (Sprint 0 y 1, A a P), las decisiones ya resueltas (#1 a
#17, ninguna abierta) y el «Corte mínimo defendible» viven en
[`archivo/CHECKLIST-fases-cerradas.md`](archivo/CHECKLIST-fases-cerradas.md),
movidas tal cual el 2026-11-12. Aquí queda solo lo que tiene casillas
abiertas. Tope de este fichero: 20 480 B (ver `CONVENCIONES.md`).

## Decisiones que dependen de ti

Ninguna abierta. Las resueltas, con su razonamiento, en el archivo.

---

## Q — Correcciones de la auditoría 4D (15/20)

Plan en [`docs/plan-correccion-4d.md`](../plan-correccion-4d.md); casos en [`docs/auditoria-4d-completa.md`](../auditoria-4d-completa.md).

- [x] TASK-142 — Regla 4D: disfraz en los scripts de Git-Flow — cerrada el 2026-11-22
      *resume-work aplica el stash exacto (SCR-01, CRITICO), pause --push sin origin avisa, push-back aditivo FALLIDO si el destino rechaza, mirror dice lo que copia. 6 tests en rojo antes del arreglo. Una ronda aprobada con correcciones (MEN-1..2). finish --sin-verificacion autorizado (2 rojos conocidos de Windows + tope de este fichero).*
- [x] TASK-154 — plan.test.ts en verde en Windows nativo — cerrada el 2026-11-22
      *El test de EACCES se omite con motivo solo si chmod no impide escribir (NTFS); el de CRLF compara sin finales de linea. Sin rojos esperados en Windows: finish vuelve a verificar de verdad (completa en verde). Una ronda aprobada con correcciones (MEN-1).*
- [x] TASK-155 — comprobarSkillInstalado verificable en Windows (claude.cmd) — cerrada el 2026-11-24
      *claude se localiza con PATHEXT (localizarHerramienta) y se lanza con ejecutarHerramienta, que pasa por el shell con la ruta citada si es .cmd/.bat. Doble claude.cmd en un PATH temporal: instalado y no-instalado (antes, no-verificable). Una ronda aprobada sin hallazgos. Pendiente aparte: TIMEOUT_MS de 5 s frente a los ~18 s del claude.exe real.*
- [x] TASK-157 — Timeout de claude plugin list acorde al binario real — cerrada el 2026-11-24
      *TIMEOUT_MS de comprobarSkillInstalado de 5 a 30 s: el claude.exe real tarda ~18 s y ya da instalado (16,8 s). Doble claude lento (6 s) en el test; un claude colgado se corta a los 30 s. Una ronda aprobada (MEN-1 aceptado: el test con el claude real tarda 16-25 s).*
- [x] TASK-156 — verificar-impacto elige los tests que leen los md de skills, agents y docs del plugin — cerrada el 2026-11-24
      *Un fichero bajo skills/, agents/ o docs/ del plugin elige ademas los tests que leen su carpeta (CARPETAS_LEIDAS); con un .md de skill, de 3 tests a 29, task-workflow.test.ts incluido. Con tope, los que nombran el fichero van antes que los lectores de carpeta (IMP-1 de la ronda 1). 2 rondas; MEN-1 aceptado. finish verde al tercer intento: los dos primeros cayeron en origin-deteccion (tiempos, con otras suites en marcha; aislado 5/5).*
- [x] TASK-153 (a, b, c) — Regla 4D en la creacion de codigo y tests — cerrada el 2026-11-23
      *Plan con ## Reutilizacion (aviso de approve), linea 4D exigida en la autorrevision, guia disfraz-tests.md, ## Candidatos 4D en la peticion (duplicados y tests a mutar, coste acotado) y columna 4d en metricas. 153b necesito 2 rondas (IMP coste e IMP tests); 153a y 153c, una con correcciones.*
- [x] TASK-144 (a, b, c) — Regla 4D: ciclo de vida, cadena y flags en commands — cerrada el 2026-11-23
      *Cadena derivada de los comandos que escriben, Commit revisado y codigo cambiado en un solo sitio (siguiente con sincronizacion ya no pregunta), extraerUnico para los flags con valor y FLAGS_SIN_VALOR con test de paridad, patrones de ronda/rol y plan que cuenta unificados. 144b y 144c necesitaron 2 rondas.*
- [x] TASK-147 (a, b, c) — Regla 4D: lectores de secciones e IDs en core — cerrada el 2026-11-23
      *Secciones de tarea.md con un solo lector y un solo «crear al final» (anadirSeccionAlFinal), casillas sin marcar con extraerSecciones, citar y quitarDiacriticos una vez, el ID de tarea con una regex y un orden (compararIds: TASK-121a y TASK-1000 igual en board, wip, roadmap y evolucion), una lista de fases y una conversion de fila a Marca en metricas. 147a necesito 4 rondas (3 y 4 extra, decididas por Carlos) por los casos contiguos de ## Troceo; 147b y 147c, una con MENORES.*
- [x] TASK-149 (a, b, c) — Regla 4D: helpers de E/S, Git y CLI en fs, hooks y cli — cerrada el 2026-11-23
      *Un envoltorio de git sin lanzar (git-crudo: rama actual con rebase, rutaGit, parser comun de los hooks; los hooks ligeros no cargan el freno), errores comunes del CLI traducidos en main (new fuera de un repo ya no sale como «no pudo arrancar»), printAutoCommit unico, extraerPushFlag en cli, y una implementacion de lockfiles, binarios (UTF-16), cola, PATH, BOM y nombreBase. 149a necesito 2 rondas; 149b, 3 (la 3 extra, decidida por Carlos); 149c, una.*
- [x] TASK-148 (a, b, c, d) — Regla 4D: catalogos, config y utilidades de core — cerrada el 2026-11-23
      *Raiz del plugin en un modulo y un lector comun de catalogos (campos-catalogo), config con una regla por cosa (masParecida, entero en rango, lista de enumerado, paridad CLAVES_CONFIG/switch, una ruta relativa), utilidades de core una vez (git, fecha, etiquetas, ANSI, origin, credenciales, fichero de test) y comentarios ciertos sin diluvio. 148a, 148b y 148c necesitaron 2 rondas; 148d, una. timeout_verificacion sube a 3600 s (decision de Carlos).*
- [x] TASK-151 (a, b) — Regla 4D: disfraz en tests — cerrada el 2026-11-24
      *Cada test sospechoso caza su mutante (M1..M10, TCORE, TCMD, TRES): orden numerico, guarda de verificar-menores, rondas con 10 o mas, review-incremental corre en Linux (EEXIST con mock), salida temprana con NODE_DEBUG=esm, doctor sin skip por tiempo, approve/plan/start miran mensaje, git status y HEAD. 151b destapo que el error de tarea inexistente decia «(desconocida)»: ahora nombra el ID. Una ronda cada parte, con MENORES.*
- [x] TASK-139 (a, b) — Regla 4D: tests que no protegen lo que dicen — cerrada el 2026-11-24
      *B1-B5 cerrados con mutante (enlace de poda-tests, cerrojo ilegible con dormir inyectable, mensaje del bash de Git puro, test de review por lotes justificado y a 500 ficheros, criterios de TASK-133 segun su Resultado; el 3 sigue sin marcar por falta de evidencia). La selectiva de review y finish ya no recorta: TIPO_VERIFICACION=selectiva corre todos los afectados (o la suite entera); el freno usa comando_verificacion_freno con tope y memo propios. 139a necesito 2 rondas; 139b, una con MENORES y un renombrado posterior cerrado con --aceptar-sin-revisar (Carlos).*
- [x] TASK-145 (a, b) — Regla 4D: duplicacion en las puertas de finish — cerrada el 2026-11-24
      *Las puertas de finish y doctor usan gitLinea/gitCrudo (timeout y entorno comunes), configDeLaRama y CIERRE_SIN_MERGE en finish-opciones, ejecutarPuerta comun (anotarSuite solo en la completa, con test), textos de una sola fuente (cerrarIgualmente, errorArbolSucio) y sinPrefijoError para la regex de [ERROR]. En finish.ts la base de la rama se decide una vez, el tag tras el merge solo en su caso alcanzable y los comentarios quedan en su funcion. 145a necesito 2 rondas; 145b, una con MENORES (MEN-2 y MEN-3, huecos de test previos, pendientes).*
- [x] TASK-146 (a, b) — Regla 4D: duplicacion en new, import, roadmap, verificar-lote y registrar-coste — cerrada el 2026-11-24
      *import valida y compone como new (parsearCamposDeTarea, MODELO_POR_DEFECTO, componerCuerpo), roadmap --comparar decide con prepararRoadmap (escribir:false), verificar-lote usa headCommit y listTareasEnEstados y aborta ante un fallo de git o lectura, registrar-coste suma con CAMPOS_COSTE, un listarSiExiste y una claveRuta, diaUtc para el creado de doctor-deploy, cabeceras fieles a TASK-119. 146a necesito 2 rondas (protecciones sin test); 146b, una con MENORES.*
- [x] TASK-138 (a, b) — Regla 4D: duplicacion en metricas, suite y registro de puertas — cerrada el 2026-11-24
      *Un agregador de la suite por version (ultimaSuitePorTarea, resumirSuites) para metricas y doctor, una mediana (core/estadistica), pytest una vez, anotarVerificacion comun a finish, review, la suite y verificar-lote, PUERTAS_VERIFICACION fuera, textoSalidasTope (salidas numeradas) para siguiente y review, y doctor con una lectura de las terminadas. Una ronda cada parte, con MENORES.*
- [x] TASK-143 (a, b, c) — Regla 4D: duplicacion en Git-Flow (bash y TS) — cerrada el 2026-11-24
      *Create, update y merge a main con cuerpo comun (_gf_fetch_origin, _gf_sync_branch, invoke_update_work_branch, invoke_merge_to_main): fetch previo en todos y backmerge con pull --ff-only, abortando antes de tocar main si develop diverge. Argumentos y nombre de rama de parse_gitflow_args y normalize_branch_name en 14 scripts (los merge-* validan), diagnose con detect_origin_available y --develop, mirror de push-back solo de ramas y tags. detect_operation_in_progress con paridad bash/TS, ls-remote de git.ts con GIT_TERMINAL_PROMPT=0 y GF_TIMEOUT_REMOTO, finish con --main y perfil-tests con la compilacion protegida (conDistProtegido). 143a y 143c cerradas con --sin-verificacion autorizado por Carlos: rojos intermitentes de tiempos bajo carga, cada uno pasa aislado.*
- [x] Segunda auditoria 4D completa — hecha el 2026-11-25
      *docs/auditoria-4d-segunda.md: de los 150 casos de la primera, 99 corregidos, 14 a medias y 37 esperando a TASK-150/152. 130 casos nuevos (0 CRITICOS, 81 IMPORTANTES, 49 MENORES), sobre todo duplicacion de grano fino que dejaron las correcciones incompletas; 6 disfraz confirmados por mutacion de 8. Seguimiento en TASK-159..166.*
- [ ] TASK-159 — Regla 4D (2a auditoria): lectores de vallas, secciones y celdas en core
- [ ] TASK-160 — Regla 4D (2a auditoria): duplicacion residual en core
- [ ] TASK-161 — Regla 4D (2a auditoria): duplicacion residual en commands
- [ ] TASK-162 — Regla 4D (2a auditoria): envoltorios de git y helpers en fs, hooks y cli
- [ ] TASK-163 — Regla 4D (2a auditoria): Git-Flow residual y hotfix sin develop
- [ ] TASK-164 — Regla 4D (2a auditoria): skills que contradicen al CLI
- [ ] TASK-165 — Regla 4D (2a auditoria): disfraz en tests
- [ ] TASK-166 — Regla 4D (2a auditoria): helpers de test duplicados por las correcciones
- [ ] TASK-158 — Regla 4D preventiva en todos los procesos que crean o actualizan codigo — antes de publicar la 0.19.0 (decision de Carlos)
