# Brainstorm — TASK-067, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: ab8d43123e2b6f315

## Enfoque
`taskctl doctor-deploy` sigue siendo el unico punto de entrada. `--resultado <json>` vuelve a ejecutar el analisis completo sobre HEAD y mezcla los veredictos del agente con una funcion pura nueva. `--crear-tareas` crea las tareas reutilizando las piezas de `new`, no `runNewCommand`. `finish` de una release solo **lee** informes ya escritos y nunca ejecuta doctor-deploy.
La skill `skills/doctor-deploy/SKILL.md` coordina: `--json` → agente `agents/revisor-seguridad-deploy.md` solo con los puntos `juicio` que aplican → JSON fuera del repo → `--resultado`.

## Piezas y limites
- `src/core/task-id.ts` — se extiende — `nextTaskId` excluye el rango reservado y se anade `nextReservedTaskId(ids)` (minimo reservado − 1, empezando en 9999). La constante del limite vive solo aqui; `import.ts:279` hereda el cambio.
- `src/core/doctor-deploy-veredictos.ts` — se crea — `incorporarVeredictos(puntos, fichero, existe)` devuelve `{puntos, rechazados[]}`. Comprueba id conocido y de juicio, evidencia `fichero:linea`, y que el fichero existe y tiene esa linea. Puro; el comando inyecta el acceso al disco. `InformeDeploy.version` pasa a 2 y anade `origen: 'sonda'|'agente'` por punto.
- `src/commands/doctor-deploy.ts` — se extiende — `FLAGS_DOCTOR_DEPLOY` suma `--resultado` y `--crear-tareas`. `--escribir` escribe tambien `<fecha>.json` junto al `.md`: contrato legible por maquina que leera `finish`.
- Alta de tareas reservadas — se extiende `new.ts` — se extrae `crearTareaEn(tareasRoot, id, opts, cuerpo)` (`buildNewTask` + `writeTareaFile`). `--crear-tareas` pasa por `ensureBaseBranchReady` una vez y hace un unico `autoCommit` con N carpetas.
- Deduplicacion — etiqueta `doctor-deploy:<id-punto>` en `etiquetas`, sin campo nuevo en el frontmatter. Antes de crear se busca en una pasada por `tareas/` una tarea abierta con esa etiqueta.
- `src/core/aviso-release.ts` (puro) + lectura en `finish.ts` — junto a los `onAviso` existentes (`finish.ts:325-355`), solo si `tipo === 'release'`. «Avisa y no bloquea».

## Orden de construccion
1. `task-id.ts`: rango reservado y `nextReservedTaskId` (cubre el criterio de `new` con TASK-065 y TASK-9999).
2. MEN-12 en `gitignore-cubre-env` y tests de los mutantes N8/N9/N12/N14/N17.
3. `doctor-deploy-veredictos.ts` + `--resultado` + JSON v2 y `<fecha>.json` en `--escribir`.
4. `--crear-tareas` y `aviso-release` en `finish`.
5. Skill `doctor-deploy` + agente `revisor-seguridad-deploy`, README y CHANGELOG.

## La decision que mas preocupa
Como ata `finish` el informe al «commit que se cierra»: el informe se commitea despues de generarse, asi que su `commit` nunca es la punta de la rama. Propuesta: aceptar el informe si `informe.commit` es la punta, o si entre ese commit y la punta solo cambian rutas de `docs/doctor-deploy/` (`git diff --name-only`, solo los candidatos mas recientes).

## Alternativas descartadas
- `--resultado` sobre el informe JSON anterior sin repetir el analisis: un JSON editado podria falsificar OK deterministas y el informe dejaria de describir HEAD. Coste aceptado: repetir el recorrido del historial por ejecucion de la skill.
- Meter el segundo eje de tipo (web/API/movil/CLI/libreria) y las sondas deterministas extra: van a **otra tarea**. El eje cambia el contrato `TipoApp`/`detectarTipos` y el significado de `tipos`; las sondas extra son entradas nuevas en `SONDAS` independientes. Mientras, el agente las cubre como `juicio`.

## Desacuerdos previstos
- Riesgos: que `finish` ejecute doctor-deploy para tener un resultado fresco — en contra: puede tardar minutos y el criterio pide avisar, no medir.
- Riesgos/testing: JSON del agente dentro del repo — en contra: fuera (scratchpad), como `import`, para no ensuciar el workspace antes de `--crear-tareas`.
- Dominio: etiqueta frente a campo `punto_deploy` en el frontmatter — etiqueta, para no tocar `core/task.ts`.

## Suposiciones no verificadas
- Las regex `TASK-\d{3,}` de `task-store.ts:27`, `wip-scan.ts:37`, `task.ts:132` y `metricas.ts:191` aceptan TASK-9999; falta mirar el orden y recuento en `board` y `metricas`.
- Si los tests de contenido expuesto y de enumeracion de skills/agentes recogen solos los nuevos ficheros.
- Que la skill pueda lanzar el agente del plugin por nombre (prefijo).
- Que validar `fichero:linea` contra el arbol actual baste como evidencia; si el veredicto debe llevar el commit juzgado.
