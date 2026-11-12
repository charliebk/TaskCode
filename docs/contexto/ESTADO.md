# Estado del proyecto — handoff

> Última actualización: **2026-11-12** (TASK-124 cerrada).
> Se actualiza al cerrar cada tarea, o como mucho cada 14 días; tope 10 240 B
> (ver `CONVENCIONES.md`). Si lo que dice no cuadra con el repo, gana el repo
> — y hay que corregir esto.
>
> Lo anterior (la historia de las fases A a G, sesión a sesión, hasta la
> 0.5.0) está en [`archivo/ESTADO-hasta-2026-11-12.md`](archivo/ESTADO-hasta-2026-11-12.md).

## Dónde estamos

- **Versión publicada del plugin: 0.14.0** (tag `v0.14.0`, 2026-11-10).
  Nada publicado después: `package.json` y `plugin.json` siguen en 0.14.0.
- **Checklist**: 121 de 122 items; solo queda abierta TASK-099 (fase P).
  Detalle en [`CHECKLIST_TERMINACION.md`](CHECKLIST_TERMINACION.md); las
  fases cerradas, en [`archivo/CHECKLIST-fases-cerradas.md`](archivo/CHECKLIST-fases-cerradas.md).
- **Cerrada hoy**: TASK-124 — contexto con tamaño máximo: topes en bytes
  con test (CLAUDE.md, skills, agentes, CHECKLIST, ESTADO), README del
  plugin partido en `docs/` del plugin, lo cerrado archivado en
  [`archivo/`](archivo/) y `doctor` vigila este documento
  (`documento_estado`). Siguiente en la cola: TASK-099.

## En `develop` desde la 0.14.0 (sin publicar)

Por orden de merge:

- **TASK-100 a TASK-104** — verificación proporcional A1–A3b: `finish`, el
  guardián de merges, el freno `Stop` y las rondas de `review` no corren la
  suite si la tarea solo cambia documentación; el guardián bloquea con
  config inválida (TASK-103).
- **TASK-096 y TASK-105 a TASK-109** — verificación proporcional nivel 2
  (B1–B6): clave `rutas_verificacion_parcial`, decisión `selectiva`, `finish`
  verifica solo lo afectado con código parcial, Stop/review/finish deciden
  igual, el guardián exige la completa con código, y documentación.
- **Auditoría del método 2026-11-12**:
  `docs/auditoria/AUDITORIA-METODO-2026-11-12.md` y
  `docs/auditoria/PASOS-PLUGIN-2026-11-12.md` (métricas por paso). De ahí
  salen F-16 (TASK-123) y F-3/F-14 (TASK-124).
- **P-1** — duración real de `finish`: la fila `finish` registra el instante
  de fin y `taskctl metricas` muestra su columna.
- **TASK-110** — progreso visible sin tokens: `taskctl estado [--seguir]`,
  status line instalable con `taskctl doctor --instalar-status-line`,
  contador `[x/N]` en todas las fases.
- **TASK-122** — coste por tarea independiente del tamaño del proyecto:
  verificación por impacto (`scripts/verificar-impacto.mjs`), perfil de la
  suite (`scripts/perfil-tests.mjs`), `metricas --evolucion` con el coste
  fijo; informes `docs/auditoria/ESCALA-2026-11-12.md` y
  `PERFIL-TESTS-2026-11-12.md`. Regla de la pirámide en `CONVENCIONES.md`.
- **TASK-123** — F-16: `finish` no cierra sin verificar tras un merge a mano
  o un conflicto; el guardián bloquea el commit que cierra un merge en curso
  en develop/main.
- **TASK-121** — `taskctl trocear`: una tarea de más de 60 min pasa a
  TASK-NNNa y crea b, c… en la misma rama; IDs con letra en todo el CLI.

## Qué toca: cola para la 0.16.0

Decisión de Carlos: **no se publica hasta completar la cola**, y antes de
publicar se corre la suite completa una vez sobre `develop`. Orden:

1. TASK-099 — corrección de MENORES tras aprobar con correcciones sin abrir
   otra ronda completa.
2. TASK-116 — P-8: TaskCode declara su verificación y `doctor` avisa cuando
   falta.
3. TASK-113 — P-5: petición de revisión más ligera.
4. TASK-114 — P-6: hooks `PreToolUse` que salen pronto.
5. TASK-118 — P-10: línea FIN con la duración en los scripts de Git-Flow.
6. TASK-117 — P-9: `new` propone la complejidad a partir de tareas parecidas.
7. TASK-120 — P-12: sincronización con su duración registrada.
8. TASK-112 — P-4: el revisor reutiliza la verificación de ronda.
9. TASK-119 — P-11: menos commits de proceso por tarea.
10. TASK-111 — P-3: registrar cada ejecución del freno `Stop`.
11. TASK-115 — P-7: verificación completa por lote en modo automático (al
    final; **necesita decisión de Carlos** sobre la verificación por lote).

Además hay planificadas, fuera de esa cola y sin orden decidido, TASK-125 a
TASK-130 (presupuesto del freno, verificación por tipo de rama, tope de
rondas configurable, métricas por puerta, freno al crecimiento de la suite y
poda de tests), dadas de alta el 2026-11-12 a partir de las métricas de
ToolsaWeb.

## Cómo se trabaja ahora: modo rápido

Desde el 2026-11-12, en todas las tareas:

- Plan redactado por el coordinador (sin brainstorm salvo que haga falta).
- **Una ronda** de revisión, con los tests afectados; los MENORES se
  corrigen o aceptan **sin ronda 2**.
- Verificación de la tarea:
  `RAMA_BASE=develop node scripts/verificar-impacto.mjs` y
  `npm run test:rapido`. La suite completa, solo antes de publicar.

**Cómo retomar una tarea**: `taskctl siguiente TASK-NNN --json` dice la fase
y el paso que toca.

## Trampas vivas

- **`finish` corre la suite completa si el diff toca skills o README**
  (quedan fuera de `rutas_verificacion_parcial`). Si solo fallan los 3 rojos
  conocidos de Windows, se cierra con `--sin-verificacion`.
- **El freno `Stop` del plugin instalado lee la config de la rama activa**,
  no la de `develop`.
- **Los subagentes en worktree aislado no pueden usar git.**
- **`taskctl new` en `develop` con el checkout en otra rama**: se hace en un
  worktree temporal bajo `%LOCALAPPDATA%\pruebas-claude\taskcode\`, que se
  borra al terminar.
- **Desde PowerShell, el `bash` del PATH puede ser el de WSL**: los scripts
  de Git-Flow se lanzan con el `bash` de Git for Windows.
- **Subir a `origin`**: según la referencia local, `origin/develop` se quedó
  en el 2026-11-10 y `develop` va cientos de commits por delante (`taskctl`
  no sube sin `--push`). Comprobar con `git fetch` antes de fiarse.
- Los 3 rojos conocidos de Windows y los `EBUSY ... rmdir` del teardown:
  ver `CLAUDE.md`.

## Dónde mirar

- [`../ROADMAP.md`](../ROADMAP.md) — qué falta y qué está hecho, por versión
  (ojo: su última actualización escrita es del 2026-11-10; el generado por
  `taskctl` está en `tareas/ROADMAP.md`).
- [`CONVENCIONES.md`](CONVENCIONES.md) — cómo se trabaja aquí.
- [`HALLAZGOS.md`](HALLAZGOS.md) — las trampas que ya costaron tiempo.
- [`CHECKLIST_TERMINACION.md`](CHECKLIST_TERMINACION.md) — progreso por
  fases; archivo en [`archivo/`](archivo/).
