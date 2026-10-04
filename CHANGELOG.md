# Changelog

## Sin publicar

- TASK-042 (feature) — F4-T4 Complejidad por defecto por heuristica y un rol sin unificador (2026-10-04)
- TASK-043 (feature) — F4-T2 Validacion antes de plan y puertas de cierre (2026-10-04)
- TASK-046 (fix) — F5-T2 Secciones con subtitulos y criterios multilinea (2026-10-04)
- TASK-041 (feature) — F4-T1 taskctl new con objetivo y criterios (2026-10-04)
- TASK-053 (fix) — moveTareaFile reintenta el rename ante un EPERM o EBUSY transitorio de Windows (2026-10-04)

## 0.2.0 — 2026-10-04

Fase 3 del plan de la auditoria: **revision incremental**. Sube la version
menor porque cambia la maquina de estados. Actualizar con `claude plugin
marketplace update taskcode-marketplace`, `claude plugin update
taskcode-plugin@taskcode-marketplace` y reiniciar Claude Code.

- `taskctl review` sobre una tarea en revision, con la ultima ronda en
  `cambios-solicitados`, genera la ronda siguiente: solo el diff desde el
  commit revisado en la ronda anterior, con los hallazgos aun abiertos de su
  tabla, y sin integrar la rama base (lo hace `finish`). Se acabaron las
  peticiones de ronda 2 escritas a mano.
- Mensajes de error que ya no dan vueltas: una ronda aprobada manda a
  `finish`, una PENDIENTE a `taskctl veredicto`, y `start` sobre una tarea en
  revision manda a `review`.
- `aprobada con correcciones` no abre otra ronda (politica: sin CRITICO ni
  IMPORTANTE, una ronda cierra).
- Nota: el tag `v0.2.0` se creo antes de este cierre por un `EPERM` transitorio
  de Windows en `finish`; el codigo del tag es el de esta version y esta
  seccion se escribio en el commit siguiente.


- TASK-040 (feature) — F3-T1 taskctl review para la ronda 2 y siguientes (2026-10-04)

## 0.1.3 — 2026-10-04

Fase 2 del plan de la auditoria: **Git-Flow mas rapido**. Actualizar con
`claude plugin marketplace update taskcode-marketplace`, `claude plugin update
taskcode-plugin@taskcode-marketplace` y reiniciar Claude Code.

- El log de los scripts de Git-Flow ya no lanza un `date` ni un subshell por
  linea (bash >= 4.2; en bash 3.2 se mantiene `date`): `update-feature.sh`
  ~26 % mas rapido.
- Una sola consulta a `origin` por invocacion, con limite de 5 s
  (`GF_TIMEOUT_REMOTO`) y sin esperar credenciales: con la VPN caida,
  `update-feature.sh` pasa de ~23 s a ~7 s. El merge a `develop` con origin
  configurado pero caido avisa de que `develop` puede estar desfasada.
- `push-back-to-remote.sh --mirror` aborta si no puede listar el destino, en
  vez de mostrar una vista previa vacia y borrar ramas.
- Los commits automaticos lanzan menos procesos `git` (ciclo completo: 115 → 96).


- TASK-039 (feature) — F2-T3 Menos llamadas git en los comandos (2026-10-04)
- TASK-038 (feature) — F2-T2 Una sola deteccion de origin por invocacion, con timeout (2026-10-04)
- TASK-037 (feature) — F2-T1 Logging de los scripts de Git-Flow sin lanzar procesos (2026-10-04)

## 0.1.2 — 2026-10-03

Fase 1 del plan de la auditoria: **review mas barata**. Actualizar con
`claude plugin marketplace update taskcode-marketplace`, `claude plugin update
taskcode-plugin@taskcode-marketplace` y reiniciar Claude Code.

- La peticion de `taskctl review` ya no embebe el diff de `dist/`, lockfiles ni
  `tareas/` (aparecen en un `--stat` con la orden para pedirlos). Configurable
  con `excluir_de_revision` en `.taskcode/config.yml`. TASK-031 habria pasado de
  326 KB a ~72 KB, y una tarea de un solo dominio lanza un revisor, no dos.
- Nuevo `taskctl veredicto TASK-NNN aprobada|aprobada-con-correcciones|cambios-solicitados`:
  escribe la linea canonica y la commitea. El gate de `finish` ignora el
  enfasis de markdown (`**aprobada**`), sin aflojar la regla.
- Politica de rondas en las skills: sin CRITICO ni IMPORTANTE, una ronda cierra;
  el revisor corre la suite completa una vez por ronda.
- **Compatibilidad:** un plugin anterior aborta al leer `excluir_de_revision`.
  No hace falta declararla para tener el comportamiento nuevo.


- TASK-036 (feature) — F1-T3 Veredicto con un comando e informe estructurado (2026-10-04)
- TASK-035 (feature) — F1-T2 Politica de rondas y una sola suite por ronda en las skills (2026-10-04)
- TASK-034 (feature) — F1-T1 Excluir lo generado del diff de revision (2026-10-04)

Registro de tareas terminadas. Lo actualiza taskctl finish; una linea
por tarea, renderizada desde su frontmatter.

## 0.1.1 — 2026-10-03

Version de correccion. **Para actualizar:** `claude plugin marketplace update
taskcode-marketplace`, despues `claude plugin update
taskcode-plugin@taskcode-marketplace` y reiniciar Claude Code; `taskctl
--version` debe responder `0.1.1`.

- Nuevo: `comando_sincronizacion`, `rutas_sincronizacion` y
  `timeout_sincronizacion` en `.taskcode/config.yml`. Cada comando que commitea
  ejecuta el comando del proyecto y mete sus ficheros derivados (un plan, un
  tablero) en el mismo commit de la transicion. No usar un hook de pre-commit
  para esto: deja el indice sucio.
- Nuevo: codigo de salida **3** = la transicion se hizo pero la sincronizacion
  no se aplico (el aviso dice que lanzar a mano).
- Skill: guia de criterios que solo se verifican tras `finish`
  (`### Tras el cierre`) y correcciones (`codex-review` si existe).
- **Compatibilidad:** un plugin 0.1.0 aborta todos sus comandos al leer las
  claves nuevas. Todo el equipo actualiza ANTES de anadirlas.
- Incluye ademas todo lo cerrado desde 0.1.0:

- TASK-033 (fix) — Comando de sincronización tras cada transición y guía de criterios post-cierre (v0.1.1) (2026-10-03)
- TASK-022 (feature) — Documentación de equipo e incorporación de colaboradores (2026-09-16)
- TASK-020 (feature) — Comando taskctl codex-review (segunda opinión independiente) (2026-09-13)
- TASK-018 (feature) — Enrutado de revisor por diff real, fragmentado por dominio (2026-09-12)
- TASK-017 (feature) — Catálogo de skills determinista con selección en dos pasos (2026-09-09)
- TASK-016 (feature) — Brainstorm paralelo por roles con agente unificador (2026-09-08)
- TASK-032 (feature) — Roles de brainstorm, heuristica de complejidad y skills revisoras (items D7 y D6) (2026-09-08)
- TASK-031 (fix) — Distribucion del CLI: un clon debe traer un taskctl que arranque (2026-09-07)
- TASK-030 (feature) — Auto-commit de taskctl y .taskcode/config.yml (items C2 y C4) (2026-09-07)
- TASK-029 (fix) — Bug de origin sin guard y deuda de los scripts de Git-Flow (2026-09-07)
- TASK-028 (feature) — Primera skill del plugin: task-workflow/SKILL.md (2026-09-07)
- TASK-027 (feature) — Subcarpetas planificacion y revision en cada carpeta de tarea (2026-09-07)
- TASK-026 (feature) — Wrappers de Git-Flow en taskctl: diagnose, pause, resume, recover y abort-merge (2026-09-06)
- TASK-025 (fix) — El limite de WIP mira las ramas de trabajo, no el arbol activo (2026-09-06)
- TASK-024 (feature) — asignado_a por defecto desde la identidad Git (2026-09-06)
- TASK-015 (feature) — Límite de trabajo en curso por persona (2026-09-05)

- TASK-013 (feature) — Comando taskctl review (revisión por pares de un solo agente) (2026-09-05)
- TASK-014 (feature) — Comando taskctl finish (merge, cierre y actualización del tablero) (2026-09-05)

## Historico (Sprint 0 y 1)

Las 12 tareas de Sprint 0 y Sprint 1 se completaron ANTES de que existiera
taskctl finish, asi que estas lineas se anadieron a mano (item B4 del plan
de terminacion) con el mismo formato que genera el comando. Su trabajo real
vive en las ramas y commits de Git; siguen con estado planificada por la
paradoja de bootstrapping (ver CONVENCIONES.md y el item E4).

- TASK-001 (feature) — Scaffold del proyecto taskctl (plugin.json, bin/, tsconfig, test runner) (2026-09-03)
- TASK-002 (feature) — Modelo de tarea, parser de tarea.md y máquina de estados (2026-09-03)
- TASK-003 (feature) — Comando taskctl new (alta individual de tarea) (2026-09-03)
- TASK-004 (feature) — Comando taskctl import (alta masiva desde Markdown) (2026-09-03)
- TASK-005 (feature) — Comando taskctl board (listado por estado) (2026-09-03)
- TASK-006 (feature) — Empaquetado del plugin y validación de carga local (2026-09-03)
- TASK-007 (fix) — Spike: validar scripts Git-Flow (.sh) vía Bash tool en Windows/IntelliJ (2026-09-03)
- TASK-008 (feature) — Migrar scripts Git-Flow a scripts/gitflow/ del plugin (2026-09-03)
- TASK-009 (feature) — taskctl start: crea rama via create-tipo.sh y mueve tarea a en-curso (2026-09-03)
- TASK-010 (feature) — taskctl plan: version minima, un solo agente redacta plan-final.md (2026-09-03)
- TASK-011 (feature) — taskctl approve: checkpoint humano, marca plan_aprobado (2026-09-03)
- TASK-012 (feature) — Precondicion de rama base + workspace limpio (seccion 8.3), con auto-switch si esta limpio (2026-09-03)
