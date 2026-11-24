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

**Progreso global: 156 / 163 items terminados (96%)** · última actualización: 2026-11-24

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
| Q — Correcciones de la auditoría 4D | 17 | **10** | ~32h |
| **Total pendiente** | **7** | — | — |


Las fases cerradas (Sprint 0 y 1, A a P), las decisiones ya resueltas (#1 a
#17, ninguna abierta) y el «Corte mínimo defendible» viven en
[`archivo/CHECKLIST-fases-cerradas.md`](archivo/CHECKLIST-fases-cerradas.md),
movidas tal cual el 2026-11-12. Aquí queda solo lo que tiene casillas
abiertas. Tope de este fichero: 20 480 B (ver `CONVENCIONES.md`).

## Decisiones que dependen de ti

Ninguna abierta. Las resueltas, con su razonamiento, en el archivo.

---

## Q — Correcciones de la auditoría 4D (10/17)

Plan en [`docs/plan-correccion-4d.md`](../plan-correccion-4d.md); casos en [`docs/auditoria-4d-completa.md`](../auditoria-4d-completa.md).

- [x] TASK-142 — Regla 4D: disfraz en los scripts de Git-Flow — cerrada el 2026-11-22
      *resume-work aplica el stash exacto (SCR-01, CRITICO), pause --push sin origin avisa, push-back aditivo FALLIDO si el destino rechaza, mirror dice lo que copia. 6 tests en rojo antes del arreglo. Una ronda aprobada con correcciones (MEN-1..2). finish --sin-verificacion autorizado (2 rojos conocidos de Windows + tope de este fichero).*
- [x] TASK-154 — plan.test.ts en verde en Windows nativo — cerrada el 2026-11-22
      *El test de EACCES se omite con motivo solo si chmod no impide escribir (NTFS); el de CRLF compara sin finales de linea. Sin rojos esperados en Windows: finish vuelve a verificar de verdad (completa en verde). Una ronda aprobada con correcciones (MEN-1).*
- [x] TASK-155 — comprobarSkillInstalado verificable en Windows (claude.cmd) — cerrada el 2026-11-24
      *claude se localiza con PATHEXT (localizarHerramienta) y se lanza con ejecutarHerramienta, que pasa por el shell con la ruta citada si es .cmd/.bat. Doble claude.cmd en un PATH temporal: instalado y no-instalado (antes, no-verificable). Una ronda aprobada sin hallazgos. Pendiente aparte: TIMEOUT_MS de 5 s frente a los ~18 s del claude.exe real.*
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
