# Peticion de revision — TASK-022 (ronda 2)

- Tarea: TASK-022 — Documentación de equipo e incorporación de colaboradores
- Rama revisada: feature/task-022-documentacion-de-equipo-e-incorporacion
- Rama base: develop
- Commit revisado (HEAD): c66a3d8
- Fecha: 2026-09-16
- Agente revisor sugerido: code-quality-reviewer (independiente del anterior)
- Ronda anterior: `informe-revision-1.md` — veredicto `cambios-solicitados`
  (0 críticos, 3 importantes, 3 menores)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE. No has visto el trabajo de la ronda 1 hecho
por el implementador ni por el revisor anterior — verifica tú mismo, no
confíes en que "ya lo dijeron". Reproduce empíricamente: resuelve a mano
cada ruta relativa nueva, contrasta cada afirmación contra la fuente que
cita. Clasifica cada hallazgo como CRÍTICO / IMPORTANTE / MENOR. Un "sin
hallazgos" explícito también vale.

## Qué cambió desde la ronda 1

El commit `c66a3d8` corrige los 6 hallazgos de `informe-revision-1.md`:

- **I1** (importante): `docs/contexto/INCORPORACION.md`, sección "2. Clonar
  el repo e instalar el plugin" — antes decía que "dentro de una sesión" era
  el camino probado y "por PATH en terminal normal" el pendiente; estaba al
  revés según `HALLAZGOS.md` y el item E6/AC7 (pendiente: en sesión) y el
  item E3 (probado: por PATH, vía CI). Ahora dice lo contrario.
- **I2** (importante): la cita de cabecera de `INCORPORACION.md` remitía el
  "cierre del punto 8 de la sección 14" a `CHECKLIST_TERMINACION.md`, pero
  ese fichero no mencionaba ni "punto 8" ni "sección 14" en ningún sitio.
  Ahora la nota de **E1** en `CHECKLIST_TERMINACION.md` sí lo dice
  explícitamente ("Cierra... el punto 8 de la sección 14... en lo que
  respecta a a quién se invita: a día de hoy, a nadie...").
- **I3** (importante): faltaba decirle al recién llegado que clonase el
  repo, y el acceso descrito era solo de lectura (insuficiente para
  `start`/`finish` y para publicar la rama). Ahora la sección "1. Acceso al
  repo" pide escritura y la sección "2." abre con "Clona `charliebk/TaskCode`
  ... y sitúate dentro".
- **M1**: la intro decía "tres pasos" con cuatro secciones; ahora dice
  "cuatro pasos".
- **M2**: la sección "4. Hacer tu primera tarea" decía que seguía la
  sección 13 "tal cual" pero se saltaba `git pull` y solo tenía 8 de sus 10
  pasos; ahora se presenta como "recorrido resumido" (no "tal cual"),
  repone el `git pull` como paso 1, y remite a la sección 13 como versión
  canónica completa.
- **M3**: la sección "2." tenía la ruta cruda `skills/task-workflow/SKILL.md`
  sin resolver; ahora usa la misma ruta relativa completa que la sección 3
  (`../../taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md`).

## Qué comprobar en esta ronda (no solo los 6 puntos de arriba — de verdad)

1. Que las 3 afirmaciones importantes (I1/I2/I3) queden correctas contra sus
   fuentes reales: `docs/contexto/CHECKLIST_TERMINACION.md` (items E1, E3,
   E6/AC7), `docs/contexto/HALLAZGOS.md`, `.github/workflows/ci.yml`.
2. Que los enlaces relativos de `docs/contexto/INCORPORACION.md` sigan
   resolviendo (verificar de nuevo, no asumir que como se comprobó en la
   ronda 1 sigue siendo verdad tras las ediciones).
3. Que la corrección no haya introducido un hallazgo nuevo (p. ej. un
   número de paso que ya no cuadra, una referencia a "sección 13 tal cual"
   que sobreviviera en otro sitio del fichero).
4. Que los 3 criterios de aceptación de la tarea (en
   `tareas/03-en-revision/TASK-022/tarea.md`) se sostengan ahora sin
   reservas.
5. Que `docs/PROPUESTA_METODOLOGIA.md` siga intacto (documento congelado,
   `git diff develop..HEAD -- docs/PROPUESTA_METODOLOGIA.md` vacío).

## Diff de esta ronda (git diff informe-revision-1-commit..HEAD)

Ejecuta tú mismo `git diff 388d12e..HEAD` desde la raíz del repo para verlo
completo — no se pega aquí para no invitar a confiar en un resumen en vez de
en el diff real.

## Vuelca tu informe en

`tareas/03-en-revision/TASK-022/revision/informe-revision-2.md`, sin borrar
esta petición ni los ficheros de la ronda 1.

## Formato del veredicto

Exactamente una de estas dos líneas al final del informe (se parsea por
regex, fail-closed):
`- Veredicto: aprobada` (o `aprobada con...`) o
`- Veredicto: cambios-solicitados`.
