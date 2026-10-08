# Plan — TASK-062: taskctl doctor: comprobar que un proyecto esta listo antes de trabajar

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos.
Los desacuerdos entre roles se senalan, no se promedian.)
Este plan no vale hasta que una persona lo apruebe con `taskctl approve`.
Complejidad: declarada media, heuristica simple (1 punto); se lanzaron 2 roles (el mayor de los dos).
Decididas por Carlos (Objetivo de tarea.md): nombre `doctor`, solo diagnostica y sugiere, va despues de TASK-061.

## Enfoque propuesto

- (arquitectura) `taskctl doctor [--json]`, solo lectura: lista fija de comprobaciones independientes con modelo `Comprobacion {id, nivel: ok|aviso|error|omitida, mensaje, arreglo|null}`; una que falla se registra y el resto sigue. Precedente: `siguiente` (flags, `--json`).
- (arquitectura) Nuevos: `src/core/doctor.ts` (puro: tipos, `codigoSalida`, `formatearTexto`, `formatearJson`) y `src/commands/doctor.ts` (`runDoctorCommand(argv, {repoCwd})`, no imprime). `cli.ts` solo cablea.
- (arquitectura) Se extienden: `gitflow-runner.ts` (sonda de bash), `merge-request.ts`/`finish-opciones.ts` (reutilizar `comprobarCli` y `detectarPlataforma`; sacar de `preflightMergeRequest` una funcion que devuelve resultado en vez de lanzar `FinishCommandError`, coordinada con 061), `config.ts` (minimo, sin segundo validador), skill `task-workflow`, README, CHANGELOG.
- (riesgos) Cada comprobacion va envuelta: una excepcion es un resultado `error`, nunca llega al catch-all de `bin/taskctl`; con `--json`, stdout lleva solo el JSON.
- Orden (arquitectura): 1 `core/doctor.ts` + sonda bash; 2 entorno, repo y tareas + `cli.ts`; 3 config (con 061 ya en develop); 4 plataforma (`omitida` si no aplica); 5 skill/README/CHANGELOG. Antes del paso 3, leer la API real de 061 para avisos de claves desconocidas.

## Desacuerdos entre roles, y como se resuelven

- Sonda de bash — arquitectura: `sondearBash()` que en win32 descarta el bash de WSL (System32) / riesgos: ejecutar un script minimo real (`mktemp`, `dirname`, `grep`) con el mismo mecanismo que `runGitflowScript`; ni `--version` ni `where`. GANA riesgos: es su riesgo n.1 (OK falso, HALLAZGOS.md l.587-594) y una sonda por ruta no prueba que los scripts corran. La ubicacion en `gitflow-runner.ts` (arquitectura) se mantiene.
- Claves desconocidas / config — arquitectura: tocar lo minimo de `config.ts` tras 061 / riesgos: tocar `parsearConfig` en paralelo con 061 es conflicto seguro; leer aparte o secuenciar. GANA la secuencia 062 despues de 061 (coincide con la decision de Carlos); ambos la admiten. Queda abierto que 061 exponga una API reutilizable (ver suposiciones).
- Efectos secundarios — arquitectura: aceptar sonda de bash y `glab api user` con timeout corto propio y sin `shell:true` / riesgos: `git status` toma `index.lock`. GANAN ambos, no se contradicen: timeout corto (~10 s, riesgos) y `GIT_OPTIONAL_LOCKS=0`; un fallo por lock es aviso (riesgos).
- Tareas y workspace — arquitectura: reutilizar `listTareasEnEstados` e `isWorkspaceClean` / riesgos: no sirven tal cual (salta IDs repetidos en task-store.ts l.94, esconde frontmatter roto en `ilegibles`). NO SE RESUELVE aqui: sube a Carlos (ver al final).
- Sesion no verificable por red y sin `origin` — arquitectura no fija severidad / riesgos: aviso. NO SE RESUELVE aqui: sube a Carlos.

## Riesgos aceptados y que los contiene

- OK falso sobre bash (riesgos, el mas grave) — script real minimo con el mecanismo de `runGitflowScript`; test en Windows con bash de Git.
- `index.lock` contradice el «solo lee» (riesgos) — `GIT_OPTIONAL_LOCKS=0`; fallo por lock = aviso.
- Sesion que se cuelga o filtra URL/token (riesgos) — timeout propio ~10 s; `ocultarCredenciales` tambien en `--json`.
- Excepciones que rompen el codigo de salida y el JSON (riesgos) — cada comprobacion envuelta; un error de ejecucion no se confunde con «hay errores».
- Falsos errores en repos legitimos: sin commits, solo local, worktrees, CRLF (riesgos) — severidad por comprobacion y mensaje propio para repo sin commits.
- Dependencia de 061 (ambos) — 062 va despues; si la API de avisos no sirve, fallback de riesgos: leer claves con `parseBloqueClaveValor` y `CLAVES_CONFIG` sin tocar `parsearConfig`.
- Vuelta atras (riesgos): no hay puntos sin retorno; basta borrar el comando y su documentacion.

## Plan de pruebas

- Repos Git temporales reales, sin mocks (CLAUDE.md): proyecto completo (todo ok), sin `tareas/`, sin `develop`, config invalida, tarea en carpeta equivocada, workspace sucio, salida `--json` (criterio 10 de la tarea).
- Codigo de salida 0 con solo avisos y 1 con algun error; `--json` equivalente y parseable (criterios 2 y 6 de la tarea; riesgos pide que stdout sea solo JSON).
- Casos de riesgos: mismo ID en dos carpetas, frontmatter roto con ruta y causa, carpeta con ID sin `tarea.md`, repo sin commits, sin `origin`, config con varios fallos a la vez.
- Plataforma con el doble `gh`/`glab` (`test/helpers/plataforma-doble.ts`): con sesion, sin sesion, `omitida` sin MR ni plataforma. Simular timeout depende de que el doble lo permita (suposicion).
- Credenciales: ninguna URL con usuario/token en texto ni en `--json` (riesgos).
- Tests de contenido del plugin: la skill `task-workflow` no puede mencionar TaskCode (CLAUDE.md).

## Sin cubrir y salidas que faltaron

- Salida del rol dominio: no se lanzo (aunque ambos roles lo citan como contraparte en sus desacuerdos); el plan pierde el punto de vista de dominio, por ejemplo sobre severidad de config. Mas arriba solo se aplico la lista de la tarea.
- Hueco: ningun rol toco el criterio de la skill (cuando quitar `status` de la lista de comandos inexistentes) ni el contenido de README/CHANGELOG; se deja a la implementacion y a la revision.
- Hueco: ningun rol fijo el formato del texto de salida (columnas, simbolos) ni la lista de IDs de comprobacion.
- Hueco: version minima de Node soportada; ningun rol dijo de donde sale (engines de package.json, sin verificar).
- Los dos roles hablan de comprobar las ramas base; la comprobacion `main` o `master` solo la nombra el enunciado.

## Suposiciones no verificadas

- 061 expone una API reutilizable para los avisos de claves desconocidas, y `comprobarCli` mantiene su firma (arquitectura; riesgos) — leer la rama de 061 antes del paso 3.
- Como distinguir el bash de WSL desde un IDE o PowerShell (arquitectura; riesgos, sin reproducir) — probar en Windows.
- `estadoCarpeta` es comparable con `task.estado` sin mapeo (arquitectura) — leer task-store y los tipos.
- Si `isWorkspaceClean` ignora `tareas/` o los ficheros sin seguimiento (arquitectura); que `git status` tome el lock (riesgos, sin reproducir).
- El ID duplicado es alcanzable a traves de `moveTareaFile` interrumpido (riesgos); el doble de gh/glab puede simular timeout y falta de sesion (riesgos).

## Lo que necesita decision de una persona

Aprobar el plan entero con `taskctl approve` (obligatorio; este plan no autoriza empezar a implementar).

## Decisiones pendientes de Carlos

1. Sesion de plataforma no verificable por red (timeout, VPN caida).
   - Opciones: A) aviso; B) error.
   - Recomendacion (riesgos): A. «No instalado» o «no autenticado confirmado» es error; «no se pudo verificar» es aviso, para que un corte de red no de codigo 1. Arquitectura no se pronuncio.
2. Sin `origin`.
   - Opciones: A) siempre aviso; B) siempre error; C) aviso, y error solo si la config exige merge request.
   - Recomendacion (riesgos): C. Un proyecto solo local es legitimo y no debe salir en rojo en el primer uso.
3. Tareas y workspace: reutilizar o recorrido propio.
   - Opciones: A) reutilizar `listTareasEnEstados` e `isWorkspaceClean` (arquitectura: menos codigo, sin duplicar); B) recorrido propio y `git status` con `GIT_OPTIONAL_LOCKS=0` (riesgos).
   - Recomendacion (riesgos): B. A deja pasar justo el estado a medias que doctor debe detectar (ID duplicado; ilegibles sin motivo) y toma `index.lock`. Coste: mas codigo y dos lectores que mantener; mitigable con un tipo comun.
4. Sonda de bash (la resolvi a favor de riesgos; confirmar).
   - Opciones: A) script real minimo (riesgos); B) sonda por ruta que descarta System32 (arquitectura).
   - Recomendacion: A. B es la que da el OK falso que riesgos considera peor que no tener doctor.
5. Si 061 no ofrece API de avisos reutilizable.
   - Opciones: A) pedir a 061 que la exponga; B) leer claves con `parseBloqueClaveValor`/`CLAVES_CONFIG` en doctor.
   - Recomendacion: ninguna fundamentada en las salidas; ambos roles solo anotan la duda. Decidir tras leer la rama de 061.
